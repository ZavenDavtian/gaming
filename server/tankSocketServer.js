// Real-Time WebSocket Game Server for Tank Battle
// Supports multi-room match making, invite codes, and low-latency state replication.
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.TANK_PORT || 8081;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ status: 'ok', server: 'Nexus Tank Battle WebSocket Server', port: PORT }));
});

const wss = new WebSocket.Server({ server });

// Rooms map: roomId -> { id, mapId: 'cyber-depot', players: Map<clientId, { ws, player }>, created: Date.now() }
const rooms = new Map();

function getOrCreateRoom(roomId, mapId = 'cyber-depot') {
  const id = (roomId || 'TANK-LOBBY').trim().toUpperCase();
  if (!rooms.has(id)) {
    rooms.set(id, {
      id,
      mapId: mapId || 'cyber-depot',
      players: new Map(),
      created: Date.now(),
      lastActive: Date.now(),
    });
  }
  return rooms.get(id);
}

function broadcastToRoom(roomId, payloadObj, excludeClientId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const json = JSON.stringify(payloadObj);
  room.players.forEach((entry, pid) => {
    if (pid !== excludeClientId && entry.ws && entry.ws.readyState === WebSocket.OPEN) {
      try {
        entry.ws.send(json);
      } catch (_) {}
    }
  });
}

wss.on('connection', (ws) => {
  let clientRoom = null;
  let clientId = `tank_${Math.random().toString(36).substring(2, 9)}`;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }));
          break;
        }

        case 'join_room': {
          const roomId = (data.roomId || 'TANK-LOBBY').trim().toUpperCase();
          clientRoom = getOrCreateRoom(roomId, data.mapId);
          clientId = data.clientId || clientId;

          const player = {
            id: clientId,
            name: data.name || 'Commander',
            tankId: data.tankId || 'cyber-titan',
            x: typeof data.x === 'number' ? data.x : 200,
            y: typeof data.y === 'number' ? data.y : 200,
            hullAngle: data.hullAngle || 0,
            turretAngle: data.turretAngle || 0,
            health: data.health || 120,
            maxHealth: data.maxHealth || 120,
            score: 0,
            kills: 0,
            deaths: 0,
            alive: true,
            isHost: clientRoom.players.size === 0,
            lastSeen: Date.now(),
          };

          clientRoom.players.set(clientId, { ws, player });
          clientRoom.lastActive = Date.now();

          // Send back room info with all other connected players
          const existingPlayers = [];
          clientRoom.players.forEach((entry, pid) => {
            if (pid !== clientId) {
              existingPlayers.push(entry.player);
            }
          });

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId,
            clientId,
            mapId: clientRoom.mapId,
            isHost: player.isHost,
            players: existingPlayers,
          }));

          // Broadcast to everyone else in this room
          broadcastToRoom(roomId, {
            type: 'player_joined',
            player,
          }, clientId);

          console.log(`[TankServer] Player ${clientId} (${player.name}) joined room ${roomId}. Total: ${clientRoom.players.size}`);
          break;
        }

        case 'tank_state': {
          if (!clientRoom) return;
          const entry = clientRoom.players.get(clientId);
          if (!entry) return;

          Object.assign(entry.player, {
            x: data.x,
            y: data.y,
            hullAngle: data.hullAngle,
            turretAngle: data.turretAngle,
            speed: data.speed,
            health: data.health,
            isMoving: Boolean(data.isMoving),
            shield: data.shield || 0,
            alive: data.alive !== false,
            lastSeen: Date.now(),
          });

          broadcastToRoom(clientRoom.id, {
            type: 'player_moved',
            player: entry.player,
          }, clientId);
          break;
        }

        case 'tank_fire': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'bullet_fired',
            shooterId: clientId,
            bullet: data.bullet,
          }, clientId);
          break;
        }

        case 'obstacle_hit': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'obstacle_damaged',
            obstacleIndex: data.obstacleIndex,
            damage: data.damage,
            remainingHealth: data.remainingHealth,
            isDestroyed: data.isDestroyed,
          }, clientId);
          break;
        }

        case 'barrel_explode': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'barrel_exploded',
            barrelId: data.barrelId,
            x: data.x,
            y: data.y,
          }, clientId);
          break;
        }

        case 'mine_placed': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'mine_placed',
            mine: data.mine,
          }, clientId);
          break;
        }

        case 'mine_detonated': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'mine_detonated',
            mineId: data.mineId,
            x: data.x,
            y: data.y,
          }, clientId);
          break;
        }

        case 'powerup_spawn': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'powerup_spawned',
            powerup: data.powerup,
          });
          break;
        }

        case 'powerup_collected': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'powerup_collected',
            powerupId: data.powerupId,
            collectorId: clientId,
            powerupType: data.powerupType,
          }, clientId);
          break;
        }

        case 'tank_hit': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'player_damaged',
            targetId: data.targetId,
            damage: data.damage,
            shooterId: clientId,
          });
          break;
        }

        case 'tank_destroyed': {
          if (!clientRoom) return;
          const killerEntry = clientRoom.players.get(clientId);
          if (killerEntry) {
            killerEntry.player.kills = (killerEntry.player.kills || 0) + 1;
            killerEntry.player.score = (killerEntry.player.score || 0) + 100;
          }

          const victimEntry = clientRoom.players.get(data.victimId);
          if (victimEntry) {
            victimEntry.player.deaths = (victimEntry.player.deaths || 0) + 1;
            victimEntry.player.alive = false;
          }

          broadcastToRoom(clientRoom.id, {
            type: 'player_eliminated',
            victimId: data.victimId,
            victimName: data.victimName,
            killerId: clientId,
            killerName: data.killerName,
          });
          break;
        }

        case 'match_restart': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'match_restarted',
            mapId: data.mapId || clientRoom.mapId,
          });
          break;
        }

        case 'chat_message': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'chat',
            senderId: clientId,
            sender: data.sender || 'Commander',
            text: data.text,
            time: Date.now(),
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[TankServer] Message error:', err.message);
    }
  });

  ws.on('close', () => {
    if (clientRoom && clientRoom.players.has(clientId)) {
      clientRoom.players.delete(clientId);
      broadcastToRoom(clientRoom.id, {
        type: 'player_left',
        clientId,
      });
      console.log(`[TankServer] Player ${clientId} disconnected from room ${clientRoom.id}. Remaining: ${clientRoom.players.size}`);
      if (clientRoom.players.size === 0) {
        rooms.delete(clientRoom.id);
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`[TankServer] Client error (${clientId}):`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🛡️  Nexus Tank Battle WebSocket Server is LIVE!`);
  console.log(`⚡ Listening on ws://localhost:${PORT}`);
  console.log(`=================================================`);
});
