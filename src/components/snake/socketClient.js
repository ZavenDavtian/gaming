// Client-Side Real-Time Socket Manager for Snake Arena
// Supports dedicated WebSocket server (ws://localhost:8080) with automatic BroadcastChannel fallback.

class SnakeSocketClient {
  constructor() {
    this.ws = null;
    this.broadcastChannel = null;
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'cross_tab' | 'disconnected'
    this.serverUrl = 'ws://localhost:8080';
    this.roomId = 'GLOBAL';
    this.clientId = `p_${Math.random().toString(36).substring(2, 8)}`;
    this.ping = 0;
    this.pingTimer = null;
    this.listeners = new Map();
    this.lastSentUpdate = 0;
    this.isUsingBroadcast = false;

    // Initialize cross-tab channel fallback
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        this.broadcastChannel = new BroadcastChannel('nexus_snake_arena_channel');
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
          console.error(`[SocketClient] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.emit('status', { status: newStatus, ping: this.ping, isUsingBroadcast: this.isUsingBroadcast });
  }

  connect(url = 'ws://localhost:8080', roomId = 'GLOBAL', playerInfo = {}) {
    this.serverUrl = url || this.serverUrl;
    this.roomId = (roomId || 'GLOBAL').trim().toUpperCase();
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
        console.log(`[SocketClient] Connected to WebSocket server at ${this.serverUrl}`);

        // Join the requested room
        this.send({
          type: 'join_room',
          roomId: this.roomId,
          clientId: this.clientId,
          ...playerInfo,
        });

        // Start ping heartbeat
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping', timestamp: Date.now() });
          }
        }, 3000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.error('[SocketClient] Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onerror = () => {
        console.warn(`[SocketClient] WebSocket error connecting to ${this.serverUrl}. Falling back to Cross-Tab channel.`);
        this.fallbackToBroadcast(playerInfo);
      };

      this.ws.onclose = () => {
        if (!this.isUsingBroadcast) {
          console.warn('[SocketClient] WebSocket connection closed.');
          this.fallbackToBroadcast(playerInfo);
        }
      };
    } catch (e) {
      console.warn('[SocketClient] WebSocket creation failed:', e.message);
      this.fallbackToBroadcast(playerInfo);
    }
  }

  fallbackToBroadcast(playerInfo) {
    this.isUsingBroadcast = true;
    this.ping = 1; // 1ms local cross-tab latency
    this.setStatus('cross_tab');
    console.log('[SocketClient] Active in Cross-Tab / Multi-Window Online mode.');

    // Announce to other tabs that we joined
    setTimeout(() => {
      this.emit('room_joined', {
        roomId: this.roomId,
        clientId: this.clientId,
        orbs: [],
        players: [],
      });

      this.broadcastChannel?.postMessage({
        type: 'player_joined',
        player: {
          id: this.clientId,
          name: playerInfo.name || 'Gamer',
          skinId: playerInfo.skinId || 'cyber-matrix',
          x: playerInfo.x || 0,
          y: playerInfo.y || 0,
          angle: 0,
          mass: playerInfo.mass || 35,
          radius: 13,
          segments: [],
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

      case 'player_left':
        this.emit('player_left', data.clientId);
        break;

      case 'orb_removed':
        this.emit('orb_removed', data.orbId);
        break;

      case 'orbs_spawned':
        this.emit('orbs_spawned', data.orbs);
        break;

      case 'snake_eliminated':
        this.emit('snake_eliminated', data);
        break;

      default:
        this.emit(data.type, data);
        break;
    }
  }

  send(payload) {
    const data = { ...payload, senderId: this.clientId };

    if (!this.isUsingBroadcast && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (e) {
        console.error('[SocketClient] Send error:', e);
      }
    } else if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch (_) {}
    }
  }

  sendPlayerUpdate(snakeData) {
    const now = performance.now();
    // Throttle network updates to ~30Hz (every 33ms)
    if (now - this.lastSentUpdate < 33) return;
    this.lastSentUpdate = now;

    this.send({
      type: 'player_update',
      x: Math.round(snakeData.x),
      y: Math.round(snakeData.y),
      angle: Number(snakeData.angle.toFixed(3)),
      speed: Number(snakeData.speed.toFixed(2)),
      isBoosting: Boolean(snakeData.isBoosting),
      mass: Math.round(snakeData.mass),
      radius: Math.round(snakeData.radius),
      segments: snakeData.segments.map((s) => ({ x: Math.round(s.x), y: Math.round(s.y), r: Math.round(s.r) })),
      kills: snakeData.kills || 0,
      alive: snakeData.alive,
    });
  }

  sendOrbEaten(orbId) {
    this.send({
      type: 'orb_eaten',
      orbId,
    });
  }

  sendSnakeKilled(victimId, victimName, killerId, killerName) {
    this.send({
      type: 'snake_killed',
      victimId,
      victimName,
      killerId,
      killerName,
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

export const socketClient = new SnakeSocketClient();
