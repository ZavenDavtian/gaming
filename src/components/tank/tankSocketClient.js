// Tank Battle - Client-Side Real-Time WebSocket Manager
// Supports WebSocket server with automatic zero-config BroadcastChannel cross-tab fallback.

class TankSocketClient {
  constructor() {
    this.ws = null;
    this.broadcastChannel = null;
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'cross_tab' | 'disconnected'
    this.serverUrl = 'ws://localhost:8081';
    this.roomId = 'TANK-ROOM';
    this.clientId = `tank_${Math.random().toString(36).substring(2, 8)}`;
    this.ping = 0;
    this.pingTimer = null;
    this.listeners = new Map();
    this.lastSentUpdate = 0;
    this.isUsingBroadcast = false;

    // Cross-tab fallback channel
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        this.broadcastChannel = new BroadcastChannel('nexus_tank_battle_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (this.isUsingBroadcast) {
            this.handleIncomingMessage(event.data);
          }
        };
      }
    } catch (_) {}
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[TankSocketClient] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.emit('status', { status: newStatus, ping: this.ping, isUsingBroadcast: this.isUsingBroadcast });
  }

  connect(url = 'ws://localhost:8081', roomId = 'TANK-LOBBY', playerInfo = {}) {
    this.serverUrl = url || this.serverUrl;
    this.roomId = (roomId || 'TANK-LOBBY').trim().toUpperCase();
    this.setStatus('connecting');

    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }

    clearInterval(this.pingTimer);

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.isUsingBroadcast = false;
        this.setStatus('connected');
        console.log(`[TankSocketClient] Connected to Tank WebSocket Server at ${this.serverUrl}`);

        // Join room packet
        this.send({
          type: 'join_room',
          roomId: this.roomId,
          clientId: this.clientId,
          ...playerInfo,
        });

        // Ping heartbeat
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping', timestamp: Date.now() });
          }
        }, 2500);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.error('[TankSocketClient] Failed to parse message:', err);
        }
      };

      this.ws.onerror = () => {
        console.warn(`[TankSocketClient] Server offline at ${this.serverUrl}. Falling back to Cross-Tab channel.`);
        this.fallbackToBroadcast(playerInfo);
      };

      this.ws.onclose = () => {
        if (!this.isUsingBroadcast) {
          console.warn('[TankSocketClient] WebSocket closed.');
          this.fallbackToBroadcast(playerInfo);
        }
      };
    } catch (e) {
      console.warn('[TankSocketClient] WebSocket creation failed:', e.message);
      this.fallbackToBroadcast(playerInfo);
    }
  }

  fallbackToBroadcast(playerInfo) {
    this.isUsingBroadcast = true;
    this.ping = 1; // 1ms cross-tab latency
    this.setStatus('cross_tab');
    console.log('[TankSocketClient] Active in Cross-Tab / Multi-Window Local mode.');

    setTimeout(() => {
      this.emit('room_joined', {
        roomId: this.roomId,
        clientId: this.clientId,
        mapId: playerInfo.mapId || 'cyber-depot',
        isHost: true,
        players: [],
      });

      this.broadcastChannel?.postMessage({
        type: 'player_joined',
        player: {
          id: this.clientId,
          name: playerInfo.name || 'Commander',
          tankId: playerInfo.tankId || 'cyber-titan',
          x: playerInfo.x || 200,
          y: playerInfo.y || 200,
          hullAngle: playerInfo.hullAngle || 0,
          turretAngle: playerInfo.turretAngle || 0,
          health: playerInfo.health || 120,
          maxHealth: playerInfo.maxHealth || 120,
          alive: true,
        },
      });
    }, 100);
  }

  handleIncomingMessage(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'pong': {
        if (data.timestamp) {
          this.ping = Math.max(1, Date.now() - data.timestamp);
          this.emit('status', { status: this.status, ping: this.ping, isUsingBroadcast: this.isUsingBroadcast });
        }
        break;
      }

      case 'room_joined':
        this.emit('room_joined', data);
        break;

      case 'player_joined':
        if (data.player && data.player.id !== this.clientId) {
          this.emit('player_joined', data.player);
        }
        break;

      case 'player_moved':
        if (data.player && data.player.id !== this.clientId) {
          this.emit('player_moved', data.player);
        }
        break;

      case 'bullet_fired':
        if (data.shooterId !== this.clientId) {
          this.emit('bullet_fired', data);
        }
        break;

      case 'obstacle_damaged':
        this.emit('obstacle_damaged', data);
        break;

      case 'barrel_exploded':
        this.emit('barrel_exploded', data);
        break;

      case 'mine_placed':
        if (data.mine?.ownerId !== this.clientId) {
          this.emit('mine_placed', data.mine);
        }
        break;

      case 'mine_detonated':
        this.emit('mine_detonated', data);
        break;

      case 'powerup_spawned':
        this.emit('powerup_spawned', data.powerup);
        break;

      case 'powerup_collected':
        this.emit('powerup_collected', data);
        break;

      case 'player_damaged':
        this.emit('player_damaged', data);
        break;

      case 'player_eliminated':
        this.emit('player_eliminated', data);
        break;

      case 'match_restarted':
        this.emit('match_restarted', data);
        break;

      case 'player_left':
        this.emit('player_left', data.clientId);
        break;

      case 'chat':
        this.emit('chat', data);
        break;

      default:
        this.emit(data.type, data);
        break;
    }
  }

  send(payload) {
    const data = { ...payload, senderId: this.clientId, roomId: this.roomId };

    if (!this.isUsingBroadcast && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (e) {
        console.error('[TankSocketClient] Send error:', e);
      }
    } else if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch (_) {}
    }
  }

  sendTankState(tankState) {
    const now = performance.now();
    // Throttle to ~33Hz (every 30ms)
    if (now - this.lastSentUpdate < 30) return;
    this.lastSentUpdate = now;

    this.send({
      type: 'tank_state',
      x: Math.round(tankState.x),
      y: Math.round(tankState.y),
      hullAngle: Number(tankState.hullAngle.toFixed(3)),
      turretAngle: Number(tankState.turretAngle.toFixed(3)),
      speed: Number(tankState.speed.toFixed(2)),
      health: Math.round(tankState.health),
      shield: Math.round(tankState.shield || 0),
      isMoving: Boolean(tankState.isMoving),
      alive: tankState.alive !== false,
    });
  }

  sendTankFire(bullet) {
    this.send({
      type: 'tank_fire',
      bullet,
    });
  }

  sendObstacleHit(obstacleIndex, damage, remainingHealth, isDestroyed) {
    this.send({
      type: 'obstacle_hit',
      obstacleIndex,
      damage,
      remainingHealth,
      isDestroyed,
    });
  }

  sendBarrelExplode(barrelId, x, y) {
    this.send({
      type: 'barrel_explode',
      barrelId,
      x,
      y,
    });
  }

  sendMinePlaced(mine) {
    this.send({
      type: 'mine_placed',
      mine,
    });
  }

  sendMineDetonated(mineId, x, y) {
    this.send({
      type: 'mine_detonated',
      mineId,
      x,
      y,
    });
  }

  sendPowerupSpawn(powerup) {
    this.send({
      type: 'powerup_spawn',
      powerup,
    });
  }

  sendPowerupCollected(powerupId, powerupType) {
    this.send({
      type: 'powerup_collected',
      powerupId,
      powerupType,
    });
  }

  sendTankHit(targetId, damage) {
    this.send({
      type: 'tank_hit',
      targetId,
      damage,
    });
  }

  sendTankDestroyed(victimId, victimName, killerName) {
    this.send({
      type: 'tank_destroyed',
      victimId,
      victimName,
      killerName,
    });
  }

  sendMatchRestart(mapId) {
    this.send({
      type: 'match_restart',
      mapId,
    });
  }

  sendChatMessage(text, sender) {
    this.send({
      type: 'chat_message',
      text,
      sender,
    });
  }

  disconnect() {
    clearInterval(this.pingTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.setStatus('disconnected');
  }
}

export const tankSocketClient = new TankSocketClient();
