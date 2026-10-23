// Real-Time WebSocket Game Server for Snake Arena
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.SNAKE_PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'ok', server: 'Nexus Snake Arena WebSocket Server', port: PORT }));
});

const wss = new WebSocket.Server({ server });

// Rooms map: roomId -> { players: Map<clientId, playerState>, orbs: Array }
const rooms = new Map();

const ARENA_RADIUS = 2000;
const INITIAL_ORBS = 350;

function createOrbs() {
  const orbs = [];
  const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#a855f7'];
  for (let i = 0; i < INITIAL_ORBS; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * (ARENA_RADIUS - 60);
    const value = Math.random() < 0.15 ? Math.floor(Math.random() * 8) + 4 : Math.floor(Math.random() * 3) + 1;
    orbs.push({
      id: `orb-${i}-${Date.now()}`,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      value,
      radius: Math.min(3 + Math.sqrt(value) * 1.6, 14),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return orbs;
}

function getOrCreateRoom(roomId) {
  const id = (roomId || 'GLOBAL').trim().toUpperCase();
  if (!rooms.has(id)) {
    rooms.set(id, {
      id,
      players: new Map(),
      orbs: createOrbs(),
      lastActive: Date.now(),
    });
  }
  return rooms.get(id);
}

wss.on('connection', (ws) => {
  let clientRoom = null;
  let clientId = `player_${Math.random().toString(36).substring(2, 9)}`;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }));
          break;
        }

        case 'join_room': {
          const roomId = (data.roomId || 'GLOBAL').trim().toUpperCase();
          clientRoom = getOrCreateRoom(roomId);
          clientId = data.clientId || clientId;

          const player = {
            id: clientId,
            name: data.name || 'Gamer',
            skinId: data.skinId || 'cyber-matrix',
            x: data.x || (Math.random() - 0.5) * 400,
            y: data.y || (Math.random() - 0.5) * 400,
            angle: data.angle || 0,
            speed: data.speed || 3.6,
            isBoosting: Boolean(data.isBoosting),
            mass: data.mass || 35,
            radius: data.radius || 13,
            segments: data.segments || [],
            kills: 0,
            alive: true,
            lastSeen: Date.now(),
          };

          clientRoom.players.set(clientId, { ws, player });

          // Send welcome packet with current room orbs and existing players
          const existingPlayers = [];
          clientRoom.players.forEach((p, pid) => {
            if (pid !== clientId) {
              existingPlayers.push(p.player);
            }
          });

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId,
            clientId,
            orbs: clientRoom.orbs,
            players: existingPlayers,
          }));

          // Notify others in room
          broadcastToRoom(roomId, {
            type: 'player_joined',
            player,
          }, clientId);

          console.log(`[SnakeServer] Player ${clientId} (${player.name}) joined room ${roomId}. Total: ${clientRoom.players.size}`);
          break;
        }

        case 'player_update': {
          if (!clientRoom) return;
          const entry = clientRoom.players.get(clientId);
          if (!entry) return;

          // Update server copy of player state
          Object.assign(entry.player, {
            x: data.x,
            y: data.y,
            angle: data.angle,
            speed: data.speed,
            isBoosting: data.isBoosting,
            mass: data.mass,
            radius: data.radius,
            segments: data.segments,
            kills: data.kills || entry.player.kills,
            alive: data.alive !== false,
            lastSeen: Date.now(),
          });

          // Broadcast state to other players in the room
          broadcastToRoom(clientRoom.id, {
            type: 'player_moved',
            player: entry.player,
          }, clientId);
          break;
        }

        case 'orb_eaten': {
          if (!clientRoom) return;
          // Notify others so orb disappears on their screen
          broadcastToRoom(clientRoom.id, {
            type: 'orb_removed',
            orbId: data.orbId,
            eaterId: clientId,
          }, clientId);
          break;
        }

        case 'spawn_orbs': {
          if (!clientRoom || !Array.isArray(data.orbs)) return;
          // Spawn new orbs (e.g. from eliminated snake)
          clientRoom.orbs.push(...data.orbs);
          broadcastToRoom(clientRoom.id, {
            type: 'orbs_spawned',
            orbs: data.orbs,
          });
          break;
        }

        case 'snake_killed': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'snake_eliminated',
            victimId: data.victimId,
            victimName: data.victimName,
            killerId: data.killerId,
            killerName: data.killerName,
          });
          break;
        }

        case 'chat_message': {
          if (!clientRoom) return;
          broadcastToRoom(clientRoom.id, {
            type: 'chat',
            sender: data.sender || clientId,
            text: data.text,
            time: Date.now(),
          });
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error('[SnakeServer] Error processing message:', e.message);
    }
  });

  ws.on('close', () => {
    if (clientRoom && clientRoom.players.has(clientId)) {
      clientRoom.players.delete(clientId);
      broadcastToRoom(clientRoom.id, {
        type: 'player_left',
        clientId,
      });
      console.log(`[SnakeServer] Player ${clientId} disconnected from room ${clientRoom.id}. Remaining: ${clientRoom.players.size}`);
      if (clientRoom.players.size === 0 && clientRoom.id !== 'GLOBAL') {
        rooms.delete(clientRoom.id);
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`[SnakeServer] Client socket error (${clientId}):`, err.message);
  });
});

function broadcastToRoom(roomId, messageObj, excludeClientId = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(messageObj);
  room.players.forEach((entry, pid) => {
    if (pid !== excludeClientId && entry.ws.readyState === 1) { // 1 = WebSocket.OPEN
      try {
        entry.ws.send(payload);
      } catch (_) {}
    }
  });
}

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🐍 Nexus Snake Arena WebSocket Server is LIVE!`);
  console.log(`⚡ Listening on ws://localhost:${PORT}`);
  console.log(`===============================================`);
});
