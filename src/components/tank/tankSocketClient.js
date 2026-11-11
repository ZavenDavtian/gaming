// Tank Battle - Multi-Transport Real-Time Multiplayer Client
// Supports WebRTC P2P DataChannels (PeerJS), WebSocket servers, and zero-config BroadcastChannel cross-tab fallback.

let peerJsPromise = null;
function loadPeerJS() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Peer) return Promise.resolve(window.Peer);
  if (peerJsPromise) return peerJsPromise;

  peerJsPromise = new Promise((resolve) => {
    if (document.getElementById('peerjs-script')) {
      const check = setInterval(() => {
        if (window.Peer) {
          clearInterval(check);
          resolve(window.Peer);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        resolve(window.Peer || null);
      }, 4000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'peerjs-script';
    script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    script.async = true;
    script.onload = () => resolve(window.Peer);
    script.onerror = () => {
      console.warn('[TankSocketClient] PeerJS CDN unavailable. Cross-tab/WebSocket will be used.');
      resolve(null);
    };
    document.head.appendChild(script);
    setTimeout(() => resolve(window.Peer || null), 4000);
  });

  return peerJsPromise;
}

class TankSocketClient {
  constructor() {
    this.ws = null;
    this.peer = null;
    this.peerConnections = new Map();
    this.broadcastChannel = null;
    this.status = 'disconnected'; // 'connected' | 'connecting' | 'cross_tab' | 'disconnected'
    this.transport = 'none'; // 'webrtc' | 'websocket' | 'broadcast' | 'none'
    this.serverUrl = 'ws://localhost:8081';
    this.roomId = 'TANK-LOBBY';
    this.clientId = `tank_${Math.random().toString(36).substring(2, 8)}`;
    this.ping = 0;
    this.pingTimer = null;
    this.heartbeatTimer = null;
    this.listeners = new Map();
    this.lastSentUpdate = 0;
    this.isUsingBroadcast = false;
    this.isHost = false;

    this.playerName = 'Commander';
    this.playerTankId = 'cyber-titan';
    this.playerMapId = 'cyber-depot';
    this.myPlayerInfo = null;
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

  setStatus(newStatus, transport = this.transport) {
    this.status = newStatus;
    this.transport = transport;
    this.isUsingBroadcast = transport === 'broadcast';
    this.emit('status', {
      status: newStatus,
      transport: this.transport,
      ping: this.ping,
      isUsingBroadcast: this.isUsingBroadcast,
    });
  }

  connect(url = 'ws://localhost:8081', roomId = 'TANK-LOBBY', playerInfo = {}) {
    this.serverUrl = url || this.serverUrl;
    this.roomId = (roomId || 'TANK-LOBBY').trim().toUpperCase();
    this.playerName = playerInfo.name || 'Commander';
    this.playerTankId = playerInfo.tankId || 'cyber-titan';
    this.playerMapId = playerInfo.mapId || 'cyber-depot';

    this.myPlayerInfo = {
      id: this.clientId,
      name: this.playerName,
      tankId: this.playerTankId,
      x: typeof playerInfo.x === 'number' ? playerInfo.x : 250,
      y: typeof playerInfo.y === 'number' ? playerInfo.y : 250,
      hullAngle: playerInfo.hullAngle || 0,
      turretAngle: playerInfo.turretAngle || 0,
      health: playerInfo.health || 140,
      maxHealth: playerInfo.maxHealth || 140,
      alive: true,
    };

    this.setStatus('connecting', 'none');
    this.disconnectTransports();

    const cleanRoom = this.roomId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'default';

    // 1. Initialize Room-Specific BroadcastChannel (Zero-config instant cross-tab)
    this.initBroadcastChannel(cleanRoom);

    // 2. Attempt WebSocket Server Connection (if local/remote server is up)
    this.initWebSocket(playerInfo);

    // 3. Attempt WebRTC P2P DataChannel via PeerJS (Connects across internet/LAN with zero server)
    this.initWebRTC(cleanRoom);

    // 4. Presence Heartbeat Timer (Announces presence periodically to sync late joiners)
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendPresence();
    }, 2500);

    // Initial announcement after small delay
    setTimeout(() => {
      this.sendPresence();
      this.emit('room_joined', {
        roomId: this.roomId,
        clientId: this.clientId,
        mapId: this.playerMapId,
        isHost: true,
        players: [],
      });
    }, 150);
  }

  initBroadcastChannel(cleanRoom) {
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        this.broadcastChannel = new BroadcastChannel(`nexus_tank_v2_${cleanRoom}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
        // If no server connects within 800ms, mark as cross_tab ready
        setTimeout(() => {
          if (this.status === 'connecting') {
            this.ping = 1;
            this.setStatus('cross_tab', 'broadcast');
          }
        }, 800);
      }
    } catch (e) {
      console.warn('[TankSocketClient] BroadcastChannel unavailable:', e);
    }
  }

  initWebSocket(playerInfo) {
    if (!this.serverUrl || typeof WebSocket === 'undefined') return;

    try {
      const ws = new WebSocket(this.serverUrl);
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws) return;
        this.setStatus('connected', 'websocket');
        console.log(`[TankSocketClient] Connected to Tank WebSocket Server at ${this.serverUrl}`);

        this.send({
          type: 'join_room',
          roomId: this.roomId,
          clientId: this.clientId,
          ...playerInfo,
        });

        // Ping heartbeat
        clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping', timestamp: Date.now() });
          }
        }, 2500);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (err) {
          console.error('[TankSocketClient] WebSocket message parse error:', err);
        }
      };

      ws.onerror = () => {
        // Expected if server is not running; WebRTC or BroadcastChannel will handle it
      };

      ws.onclose = () => {
        if (this.transport === 'websocket') {
          this.setStatus(this.peerConnections.size > 0 ? 'connected' : 'cross_tab', this.peerConnections.size > 0 ? 'webrtc' : 'broadcast');
        }
      };
    } catch (_) {}
  }

  async initWebRTC(cleanRoom) {
    try {
      const PeerClass = await loadPeerJS();
      if (!PeerClass) return;

      const hostPeerId = `nxtank_${cleanRoom}_host`;
      const peerConfig = {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      };

      // First attempt: try registering as the room Host
      let peerInstance = null;
      try {
        peerInstance = new PeerClass(hostPeerId, peerConfig);
      } catch (err) {
        console.warn('[TankSocketClient] Peer creation error:', err);
        return;
      }

      this.peer = peerInstance;

      peerInstance.on('open', (id) => {
        this.isHost = true;
        console.log(`[TankSocketClient] WebRTC Host opened in room ${this.roomId} (ID: ${id})`);
        if (this.transport !== 'websocket') {
          this.setStatus('connected', 'webrtc');
        }

        // Listen for incoming peer connections (friends joining our room)
        peerInstance.on('connection', (conn) => {
          this.setupPeerConnection(conn);
        });
      });

      peerInstance.on('error', (err) => {
        // If host ID is already taken, someone is already hosting this room! We are the guest player!
        if (err.type === 'unavailable-id') {
          try {
            peerInstance.destroy();
          } catch (_) {}

          const guestPeerId = `nxtank_${cleanRoom}_${Math.random().toString(36).substring(2, 7)}`;
          const guestPeer = new PeerClass(guestPeerId, peerConfig);
          this.peer = guestPeer;

          guestPeer.on('open', (id) => {
            this.isHost = false;
            console.log(`[TankSocketClient] WebRTC Guest joined room ${this.roomId} (ID: ${id})`);

            // Connect to the room host
            const conn = guestPeer.connect(hostPeerId, { reliable: true });
            this.setupPeerConnection(conn);
          });

          guestPeer.on('error', (gErr) => {
            console.warn('[TankSocketClient] Guest WebRTC warning:', gErr.type);
          });
        }
      });
    } catch (e) {
      console.warn('[TankSocketClient] WebRTC init error:', e);
    }
  }

  setupPeerConnection(conn) {
    if (!conn) return;

    conn.on('open', () => {
      this.peerConnections.set(conn.peer || conn.connectionId, conn);
      if (this.transport !== 'websocket') {
        this.setStatus('connected', 'webrtc');
      }

      // Send greeting handshake with our player info
      try {
        conn.send({
          type: 'peer_join',
          roomId: this.roomId,
          senderId: this.clientId,
          senderName: this.playerName,
          senderTankId: this.playerTankId,
          player: this.myPlayerInfo,
          mapId: this.playerMapId,
        });
      } catch (_) {}
    });

    conn.on('data', (data) => {
      this.handleIncomingMessage(data);

      // If we are host and have multiple connections, relay to others
      if (this.isHost && this.peerConnections.size > 1) {
        this.peerConnections.forEach((otherConn, pid) => {
          if (pid !== (conn.peer || conn.connectionId) && otherConn && otherConn.open) {
            try {
              otherConn.send(data);
            } catch (_) {}
          }
        });
      }
    });

    conn.on('close', () => {
      this.peerConnections.delete(conn.peer || conn.connectionId);
      this.emit('player_left', conn.peer || conn.connectionId);
    });

    conn.on('error', () => {
      this.peerConnections.delete(conn.peer || conn.connectionId);
    });
  }

  sendPresence() {
    this.send({
      type: 'peer_join',
      roomId: this.roomId,
      senderId: this.clientId,
      senderName: this.playerName,
      senderTankId: this.playerTankId,
      player: this.myPlayerInfo,
      mapId: this.playerMapId,
    });
  }

  handleIncomingMessage(data) {
    if (!data || !data.type) return;

    // Ignore self packets
    if (data.senderId === this.clientId || (data.player && data.player.id === this.clientId)) {
      return;
    }

    // Ignore packets from other rooms
    if (data.roomId && this.roomId && data.roomId.toUpperCase() !== this.roomId.toUpperCase()) {
      return;
    }

    switch (data.type) {
      case 'ping':
        this.send({ type: 'pong', timestamp: data.timestamp });
        break;

      case 'pong':
        if (data.timestamp) {
          this.ping = Math.max(1, Date.now() - data.timestamp);
          this.emit('status', {
            status: this.status,
            transport: this.transport,
            ping: this.ping,
            isUsingBroadcast: this.isUsingBroadcast,
          });
        }
        break;

      case 'peer_join':
      case 'join_room': {
        const p = data.player || {
          id: data.senderId || data.clientId,
          name: data.name || data.senderName || 'Challenger',
          tankId: data.tankId || data.senderTankId || 'neon-phantom',
          x: typeof data.x === 'number' ? data.x : 300,
          y: typeof data.y === 'number' ? data.y : 300,
          hullAngle: data.hullAngle || 0,
          turretAngle: data.turretAngle || 0,
          health: data.health || 120,
          maxHealth: data.maxHealth || 120,
          alive: true,
        };

        if (p.id && p.id !== this.clientId) {
          this.emit('player_joined', p);

          // Reciprocal welcome: send our local player profile back so the new peer learns of us!
          if (data.type === 'peer_join' || this.isUsingBroadcast || this.peerConnections.size > 0) {
            this.send({
              type: 'peer_welcome',
              targetId: p.id,
              roomId: this.roomId,
              player: this.myPlayerInfo,
              mapId: this.playerMapId,
            });
          }
        }
        break;
      }

      case 'peer_welcome': {
        if (!data.targetId || data.targetId === this.clientId) {
          if (data.player && data.player.id !== this.clientId) {
            this.emit('player_joined', data.player);
          }
          if (data.mapId) {
            this.emit('map_sync', data.mapId);
          }
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

      case 'tank_state': {
        // Normalize peer-to-peer state into player_moved
        const playerObj = {
          id: data.senderId,
          name: data.name || data.senderName || 'Opponent',
          tankId: data.tankId || data.senderTankId || 'neon-phantom',
          x: data.x,
          y: data.y,
          hullAngle: data.hullAngle,
          turretAngle: data.turretAngle,
          speed: data.speed || 0,
          health: data.health,
          shield: data.shield || 0,
          isMoving: Boolean(data.isMoving),
          alive: data.alive !== false,
        };
        this.emit('player_moved', playerObj);
        break;
      }

      case 'player_moved':
        if (data.player && data.player.id !== this.clientId) {
          this.emit('player_moved', data.player);
        }
        break;

      case 'tank_fire': {
        if (data.bullet && data.senderId !== this.clientId) {
          this.emit('bullet_fired', {
            bullet: data.bullet,
            shooterId: data.senderId,
          });
        }
        break;
      }

      case 'bullet_fired':
        if (data.shooterId !== this.clientId) {
          this.emit('bullet_fired', data);
        }
        break;

      case 'obstacle_hit':
      case 'obstacle_damaged':
        this.emit('obstacle_damaged', {
          obstacleIndex: data.obstacleIndex,
          damage: data.damage,
          remainingHealth: data.remainingHealth,
          isDestroyed: data.isDestroyed,
        });
        break;

      case 'barrel_explode':
      case 'barrel_exploded':
        this.emit('barrel_exploded', {
          barrelId: data.barrelId,
          x: data.x,
          y: data.y,
        });
        break;

      case 'mine_placed':
        if (data.mine?.ownerId !== this.clientId) {
          this.emit('mine_placed', data.mine);
        }
        break;

      case 'mine_detonated':
        this.emit('mine_detonated', {
          mineId: data.mineId,
          x: data.x,
          y: data.y,
        });
        break;

      case 'powerup_spawn':
      case 'powerup_spawned':
        this.emit('powerup_spawned', data.powerup);
        break;

      case 'powerup_collected':
        this.emit('powerup_collected', data);
        break;

      case 'tank_hit':
      case 'player_damaged':
        this.emit('player_damaged', {
          targetId: data.targetId,
          damage: data.damage,
          shooterId: data.shooterId || data.senderId,
        });
        break;

      case 'tank_destroyed':
      case 'player_eliminated':
        this.emit('player_eliminated', {
          victimId: data.victimId,
          victimName: data.victimName,
          killerId: data.killerId || data.senderId,
          killerName: data.killerName || data.senderName,
        });
        break;

      case 'match_restart':
      case 'match_restarted':
        this.emit('match_restarted', data);
        break;

      case 'player_left':
        this.emit('player_left', data.clientId || data.senderId);
        break;

      case 'chat_message':
      case 'chat':
        this.emit('chat', {
          senderId: data.senderId,
          sender: data.sender || data.senderName || 'Commander',
          text: data.text,
          time: data.time || Date.now(),
        });
        break;

      default:
        this.emit(data.type, data);
        break;
    }
  }

  send(payload) {
    const data = {
      ...payload,
      senderId: this.clientId,
      senderName: this.playerName,
      senderTankId: this.playerTankId,
      roomId: this.roomId,
    };

    // 1. Send via WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (e) {
        console.error('[TankSocketClient] WebSocket send error:', e);
      }
    }

    // 2. Send via WebRTC DataChannel peers if connected
    if (this.peerConnections.size > 0) {
      this.peerConnections.forEach((conn) => {
        if (conn && conn.open) {
          try {
            conn.send(data);
          } catch (_) {}
        }
      });
    }

    // 3. Send via BroadcastChannel (always active for instant multi-tab in same browser)
    if (this.broadcastChannel) {
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

    if (this.myPlayerInfo) {
      this.myPlayerInfo.x = Math.round(tankState.x);
      this.myPlayerInfo.y = Math.round(tankState.y);
      this.myPlayerInfo.hullAngle = Number(tankState.hullAngle.toFixed(3));
      this.myPlayerInfo.turretAngle = Number(tankState.turretAngle.toFixed(3));
      this.myPlayerInfo.health = Math.round(tankState.health);
      this.myPlayerInfo.shield = Math.round(tankState.shield || 0);
      this.myPlayerInfo.alive = tankState.alive !== false;
    }

    this.send({
      type: 'tank_state',
      name: this.playerName,
      tankId: this.playerTankId,
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

  disconnectTransports() {
    clearInterval(this.pingTimer);
    clearInterval(this.heartbeatTimer);

    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }

    if (this.peerConnections.size > 0) {
      this.peerConnections.forEach((conn) => {
        try {
          conn.close();
        } catch (_) {}
      });
      this.peerConnections.clear();
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (_) {}
      this.peer = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (_) {}
      this.broadcastChannel = null;
    }
  }

  disconnect() {
    this.disconnectTransports();
    this.setStatus('disconnected', 'none');
  }
}

export const tankSocketClient = new TankSocketClient();
