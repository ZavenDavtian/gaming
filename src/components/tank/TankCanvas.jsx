import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getTankById, POWER_UP_TYPES } from './tanks';
import { getMapById } from './maps';
import { tankAudio } from './tankAudio';
import { tankSocketClient } from './tankSocketClient';

export default function TankCanvas({
  mode = 'sp', // 'sp' | 'local2p' | 'online'
  mapId = 'cyber-depot',
  player1Config = { name: 'Commander 1', tankId: 'cyber-titan' },
  player2Config = { name: 'Commander 2', tankId: 'neon-phantom' },
  roomCode = 'TANK-ROOM',
  socketUrl = 'ws://localhost:8081',
  isSoundEnabled = true,
  soundVolume = 0.5,
  isPaused = false,
  onGameStatsUpdate = null,
  onSocketStatusChange = null,
  onGameOver = null,
  botCount = 3,
  botDifficulty = 'medium', // 'easy' | 'medium' | 'hard'
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastStatsUpdateRef = useRef(0);

  // Status state
  const [socketStatus, setSocketStatus] = useState({ status: 'disconnected', ping: 0, isUsingBroadcast: false });
  const [killFeed, setKillFeed] = useState([]);

  // Extract primitive configs so object identity doesn't cause re-renders
  const p1Name = player1Config?.name || 'Commander 1';
  const p1TankId = player1Config?.tankId || 'cyber-titan';
  const p2Name = player2Config?.name || 'Commander 2';
  const p2TankId = player2Config?.tankId || 'neon-phantom';

  // Mutable Game Engine State
  const gameStateRef = useRef({
    map: getMapById(mapId),
    obstacles: [],
    barrels: [],
    mines: [],
    powerups: [],
    bullets: [],
    particles: [],
    floatingTexts: [],
    trackMarks: [],
    tanks: [],
    remoteTanks: new Map(),
    camera: { x: 0, y: 0, targetX: 0, targetY: 0, shake: 0 },
    mouse: { worldX: 0, worldY: 0, canvasX: 0, canvasY: 0, isDown: false },
    keys: {},
    p1LastFired: 0,
    p2LastFired: 0,
    powerupSpawnTimer: 0,
    gameTime: 0,
    gameOver: false,
    stats: {
      p1Score: 0,
      p1Kills: 0,
      p1Damage: 0,
      p2Kills: 0,
      p2Score: 0,
    },
  });

  // Audio settings synchronized
  useEffect(() => {
    tankAudio.setMuted(!isSoundEnabled);
    tankAudio.setVolume(soundVolume);
  }, [isSoundEnabled, soundVolume]);

  // Helper to add to kill feed
  const addKillFeedItem = useCallback((killerName, victimName, weapon = 'Cannon') => {
    const item = {
      id: Math.random().toString(36).substring(2, 9),
      killer: killerName,
      victim: victimName,
      weapon,
      time: Date.now(),
    };
    setKillFeed((prev) => [item, ...prev.slice(0, 4)]);
  }, []);

  // Visual FX Helpers
  const spawnWallDebris = useCallback((x, y, wallType) => {
    const color = wallType === 'steel' ? '#94a3b8' : '#ea580c';
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 25 + Math.random() * 15,
        maxLife: 40,
      });
    }
  }, []);

  const spawnMuzzleFlash = (x, y, angle, color) => {
    for (let i = 0; i < 10; i++) {
      const spread = (Math.random() - 0.5) * 0.6;
      const speed = 2 + Math.random() * 4.5;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        radius: 2 + Math.random() * 3.5,
        color: color || '#f59e0b',
        alpha: 1,
        life: 12 + Math.random() * 8,
        maxLife: 20,
      });
    }
  };

  const addFloatingText = (text, x, y, color = '#f8fafc') => {
    gameStateRef.current.floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -1.2,
      life: 40,
      maxLife: 40,
    });
  };

  // Ref breaks the circular dependency between applyDamageToTank and triggerExplosion
  const triggerExplosionRef = useRef(null);

  const applyDamageToTank = useCallback((tank, amount, attackerId = 'Unknown') => {
    if (!tank.alive) return;

    tankAudio.playHit();

    let actualDamage = amount;
    if (tank.shield > 0) {
      if (tank.shield >= actualDamage) {
        tank.shield -= actualDamage;
        actualDamage = 0;
        addFloatingText(`SHIELDED!`, tank.x, tank.y - 25, '#38bdf8');
      } else {
        actualDamage -= tank.shield;
        tank.shield = 0;
        addFloatingText(`SHIELD BROKEN!`, tank.x, tank.y - 25, '#38bdf8');
      }
    }

    if (actualDamage > 0) {
      tank.health = Math.max(0, tank.health - actualDamage);
      addFloatingText(`-${actualDamage}`, tank.x, tank.y - 30, '#ef4444');

      if (tank.isPlayer && tank.playerNum === 1) {
        gameStateRef.current.camera.shake = Math.min(18, gameStateRef.current.camera.shake + 8);
      }

      if (tank.health <= 0) {
        tank.alive = false;
        triggerExplosionRef.current?.(tank.x, tank.y, 80, 50, 'tank');

        // Scoring
        const p1 = gameStateRef.current.tanks[0];
        if (attackerId === 'player-1' || attackerId === p1?.id) {
          p1.kills += 1;
          p1.score += 150;
          addKillFeedItem(p1.name, tank.name, 'Annihilated');
          tankAudio.playVictory();
        } else {
          addKillFeedItem(attackerId, tank.name, 'Destroyed');
        }

        if (mode === 'online' && tank.isPlayer) {
          tankSocketClient.sendTankDestroyed(tank.id, tank.name, attackerId);
        }

        // Check if game over in local 2p or SP
        if (mode === 'local2p' || mode === 'sp') {
          const alivePlayers = gameStateRef.current.tanks.filter((t) => t.isPlayer && t.alive);
          if (alivePlayers.length === 0) {
            gameStateRef.current.gameOver = true;
            if (onGameOver) onGameOver({ winner: null, tanks: gameStateRef.current.tanks });
          } else if (mode === 'local2p' && alivePlayers.length === 1) {
            gameStateRef.current.gameOver = true;
            if (onGameOver) onGameOver({ winner: alivePlayers[0], tanks: gameStateRef.current.tanks });
          }
        }
      }
    }
  }, [mode, onGameOver, addKillFeedItem]);

  const triggerExplosion = useCallback((x, y, blastRadius = 60, damage = 70, type = 'cannon') => {
    gameStateRef.current.camera.shake = Math.min(25, gameStateRef.current.camera.shake + 12);
    tankAudio.playExplosion(type === 'barrel' ? 1.4 : 1.0);

    // Shockwave ring
    gameStateRef.current.particles.push({
      type: 'shockwave',
      x,
      y,
      radius: 10,
      maxRadius: blastRadius * 1.2,
      color: type === 'barrel' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(249, 115, 22, 0.8)',
      alpha: 1,
      life: 20,
      maxLife: 20,
    });

    // Fireball debris
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 7;
      const colors = ['#f59e0b', '#ef4444', '#fbbf24', '#f97316', '#ffffff'];
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 25 + Math.random() * 25,
        maxLife: 50,
      });
    }

    // Damage adjacent brick obstacles
    gameStateRef.current.obstacles.forEach((obs, idx) => {
      if (obs.destroyed || obs.type !== 'brick') return;
      const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
      const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
      const dist = Math.hypot(x - closestX, y - closestY);
      if (dist < blastRadius) {
        obs.health -= damage;
        if (obs.health <= 0) {
          obs.destroyed = true;
          spawnWallDebris(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.type);
        }
        if (mode === 'online') {
          tankSocketClient.sendObstacleHit(idx, damage, obs.health, obs.destroyed);
        }
      }
    });

    // Damage tanks in radius
    const allTanks = [...gameStateRef.current.tanks, ...Array.from(gameStateRef.current.remoteTanks.values())];
    allTanks.forEach((tank) => {
      if (!tank.alive) return;
      const dist = Math.hypot(tank.x - x, tank.y - y);
      if (dist < blastRadius) {
        const falloff = 1 - dist / blastRadius;
        const dealt = Math.round(damage * falloff);
        applyDamageToTank(tank, dealt, 'Explosion');
      }
    });
  }, [mode, applyDamageToTank, spawnWallDebris]);
  triggerExplosionRef.current = triggerExplosion;

  // Cannon firing handler
  const fireBullet = useCallback((tank) => {
    if (!tank.alive) return;

    const def = tank.tankDef;
    const now = performance.now();
    const fireInterval = tank.rapidFireDuration > 0 ? def.stats.fireRate * 0.5 : def.stats.fireRate;

    if (tank.playerNum === 1 && now - gameStateRef.current.p1LastFired < fireInterval) return;
    if (tank.playerNum === 2 && now - gameStateRef.current.p2LastFired < fireInterval) return;

    if (tank.playerNum === 1) gameStateRef.current.p1LastFired = now;
    if (tank.playerNum === 2) gameStateRef.current.p2LastFired = now;

    tank.recoil = 8;
    tankAudio.playShoot(tank.rapidFireDuration > 0 ? 'rapid' : def.stats.hasDualBarrels ? 'heavy' : 'cannon');

    const barrelTipDist = def.turretLength + 6;
    const muzzleX = tank.x + Math.cos(tank.turretAngle) * barrelTipDist;
    const muzzleY = tank.y + Math.sin(tank.turretAngle) * barrelTipDist;

    spawnMuzzleFlash(muzzleX, muzzleY, tank.turretAngle, def.accentColor);

    const isTriple = tank.tripleShotDuration > 0;
    const angles = isTriple ? [tank.turretAngle - 0.22, tank.turretAngle, tank.turretAngle + 0.22] : [tank.turretAngle];

    angles.forEach((angle) => {
      const bulletSpeed = tank.rapidFireDuration > 0 ? def.stats.bulletSpeed * 1.3 : def.stats.bulletSpeed;
      const bullet = {
        id: `bullet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ownerId: tank.id,
        ownerPlayerNum: tank.playerNum,
        ownerName: tank.name,
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(angle) * bulletSpeed,
        vy: Math.sin(angle) * bulletSpeed,
        radius: def.stats.hasDualBarrels ? 5 : 4,
        color: def.accentColor,
        glowColor: def.glowColor,
        damage: def.stats.bulletDamage,
        bouncesRemaining: def.stats.bulletBounces || 1,
        maxLife: 240,
        life: 0,
        splashRadius: def.stats.splashRadius || 0,
      };

      gameStateRef.current.bullets.push(bullet);

      if (mode === 'online' && tank.isPlayer) {
        tankSocketClient.sendTankFire(bullet);
      }
    });
  }, [mode]);

  // Place Proximity Mine
  const placeMine = useCallback((tank) => {
    if (!tank.alive || tank.minesRemaining <= 0) return;
    tank.minesRemaining -= 1;
    tankAudio.playMineDrop();

    const mine = {
      id: `mine-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ownerId: tank.id,
      ownerName: tank.name,
      x: tank.x - Math.cos(tank.hullAngle) * 20,
      y: tank.y - Math.sin(tank.hullAngle) * 20,
      radius: 12,
      triggerRadius: 36,
      armed: false,
      armTimer: 60,
      damage: 75,
      life: 0,
    };

    gameStateRef.current.mines.push(mine);
    addFloatingText('MINE PLACED', mine.x, mine.y - 15, '#ea580c');

    if (mode === 'online' && tank.isPlayer) {
      tankSocketClient.sendMinePlaced(mine);
    }
  }, [mode]);

  // Power-up crate collection handler
  const collectPowerup = useCallback((tank, powerup) => {
    tankAudio.playPowerup();
    addFloatingText(`+${powerup.name}!`, tank.x, tank.y - 30, powerup.color);

    switch (powerup.typeId) {
      case 'health':
        tank.health = Math.min(tank.maxHealth, tank.health + 45);
        break;
      case 'shield':
        tank.shield = 60;
        tank.shieldDuration = 600;
        tankAudio.playShield();
        break;
      case 'speed':
        tank.speedBoostDuration = 480;
        break;
      case 'rapid_fire':
        tank.rapidFireDuration = 480;
        break;
      case 'triple_shot':
        tank.tripleShotDuration = 480;
        break;
      case 'landmine':
        tank.minesRemaining += 3;
        break;
      default:
        break;
    }

    if (mode === 'online') {
      tankSocketClient.sendPowerupCollected(powerup.id, powerup.typeId);
    }
  }, [mode]);

  // Initialize Map and Entities (Only re-runs when mapId, mode, tank classes or botCount change)
  const initGame = useCallback(() => {
    const map = getMapById(mapId);
    const { obstacles, barrels } = map.generateObstacles();

    const freshObstacles = obstacles.map((obs, idx) => ({
      ...obs,
      idx,
      health: obs.health || 100,
      maxHealth: obs.maxHealth || 100,
      destroyed: false,
    }));

    const freshBarrels = barrels.map((b) => ({
      ...b,
      health: b.health || 25,
      maxHealth: b.health || 25,
      destroyed: false,
    }));

    const p1TankDef = getTankById(p1TankId);
    const p1Spawn = map.spawns[0] || { x: 250, y: 250, angle: 0 };

    const p1 = {
      id: 'player-1',
      name: p1Name,
      isPlayer: true,
      playerNum: 1,
      tankDef: p1TankDef,
      x: p1Spawn.x,
      y: p1Spawn.y,
      vx: 0,
      vy: 0,
      speed: 0,
      hullAngle: p1Spawn.angle,
      turretAngle: p1Spawn.angle,
      targetTurretAngle: p1Spawn.angle,
      health: p1TankDef.stats.health,
      maxHealth: p1TankDef.stats.health,
      shield: 0,
      shieldDuration: 0,
      speedBoostDuration: 0,
      rapidFireDuration: 0,
      tripleShotDuration: 0,
      minesRemaining: 3,
      recoil: 0,
      alive: true,
      kills: 0,
      score: 0,
      damageDealt: 0,
      lastSpecialUsed: 0,
    };

    const tanks = [p1];

    if (mode === 'local2p') {
      const p2TankDef = getTankById(p2TankId);
      const p2Spawn = map.spawns[1] || { x: map.width - 250, y: map.height - 250, angle: Math.PI };
      const p2 = {
        id: 'player-2',
        name: p2Name,
        isPlayer: true,
        playerNum: 2,
        tankDef: p2TankDef,
        x: p2Spawn.x,
        y: p2Spawn.y,
        vx: 0,
        vy: 0,
        speed: 0,
        hullAngle: p2Spawn.angle,
        turretAngle: p2Spawn.angle,
        targetTurretAngle: p2Spawn.angle,
        health: p2TankDef.stats.health,
        maxHealth: p2TankDef.stats.health,
        shield: 0,
        shieldDuration: 0,
        speedBoostDuration: 0,
        rapidFireDuration: 0,
        tripleShotDuration: 0,
        minesRemaining: 3,
        recoil: 0,
        alive: true,
        kills: 0,
        score: 0,
        damageDealt: 0,
        lastSpecialUsed: 0,
      };
      tanks.push(p2);
    } else if (mode === 'sp') {
      const botNames = ['Titan-AI', 'Phantom-Bot', 'Viper-Omega', 'Havoc-Droid', 'Aegis-Unit'];
      const botSkins = ['neon-phantom', 'toxic-viper', 'magma-havoc', 'glacial-fortress', 'golden-warlord'];
      const spawns = map.spawns.slice(1);

      for (let i = 0; i < botCount; i++) {
        const spawn = spawns[i % spawns.length] || {
          x: Math.random() * (map.width - 400) + 200,
          y: Math.random() * (map.height - 400) + 200,
          angle: Math.random() * Math.PI * 2,
        };
        const botTankDef = getTankById(botSkins[i % botSkins.length]);
        tanks.push({
          id: `bot-${i}`,
          name: botNames[i % botNames.length],
          isPlayer: false,
          isBot: true,
          playerNum: 0,
          tankDef: botTankDef,
          x: spawn.x + (Math.random() - 0.5) * 60,
          y: spawn.y + (Math.random() - 0.5) * 60,
          vx: 0,
          vy: 0,
          speed: 0,
          hullAngle: spawn.angle,
          turretAngle: spawn.angle,
          targetTurretAngle: spawn.angle,
          health: botTankDef.stats.health,
          maxHealth: botTankDef.stats.health,
          shield: 0,
          shieldDuration: 0,
          speedBoostDuration: 0,
          rapidFireDuration: 0,
          tripleShotDuration: 0,
          minesRemaining: 1,
          recoil: 0,
          alive: true,
          kills: 0,
          score: 0,
          damageDealt: 0,
          lastFired: 0,
          botState: {
            changeDirTimer: 0,
            desiredAngle: spawn.angle,
            targetEnemyId: 'player-1',
            dodgeTimer: 0,
          },
        });
      }
    }

    gameStateRef.current = {
      map,
      obstacles: freshObstacles,
      barrels: freshBarrels,
      mines: [],
      powerups: [],
      bullets: [],
      particles: [],
      floatingTexts: [],
      trackMarks: [],
      tanks,
      remoteTanks: new Map(),
      camera: { x: p1.x, y: p1.y, targetX: p1.x, targetY: p1.y, shake: 0 },
      mouse: { worldX: p1.x, worldY: p1.y, canvasX: 0, canvasY: 0, isDown: false },
      keys: {},
      p1LastFired: 0,
      p2LastFired: 0,
      powerupSpawnTimer: 0,
      gameTime: 0,
      gameOver: false,
      stats: {
        p1Score: 0,
        p1Kills: 0,
        p1Damage: 0,
        p2Kills: 0,
        p2Score: 0,
      },
    };
  }, [mapId, mode, p1Name, p1TankId, p2Name, p2TankId, botCount]);

  // Trigger initGame once when core props change
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Online WebSocket Connection
  useEffect(() => {
    if (mode !== 'online') return;

    const p1TankDef = getTankById(p1TankId);
    tankSocketClient.connect(socketUrl, roomCode, {
      name: p1Name,
      tankId: p1TankId,
      health: p1TankDef.stats.health,
      maxHealth: p1TankDef.stats.health,
      mapId,
    });

    const unsubs = [
      tankSocketClient.on('status', (st) => {
        setSocketStatus(st);
        if (onSocketStatusChange) onSocketStatusChange(st);
      }),

      tankSocketClient.on('room_joined', (data) => {
        console.log('[TankCanvas] Joined online room:', data.roomId);
        if (Array.isArray(data.players)) {
          data.players.forEach((p) => {
            const def = getTankById(p.tankId);
            gameStateRef.current.remoteTanks.set(p.id, {
              ...p,
              tankDef: def,
              isRemote: true,
              alive: p.alive !== false,
              health: p.health || def.stats.health,
              maxHealth: p.maxHealth || def.stats.health,
              shield: p.shield || 0,
              recoil: 0,
              targetX: p.x,
              targetY: p.y,
              targetHullAngle: p.hullAngle,
              targetTurretAngle: p.turretAngle,
            });
          });
        }
      }),

      tankSocketClient.on('player_joined', (p) => {
        const def = getTankById(p.tankId);
        gameStateRef.current.remoteTanks.set(p.id, {
          ...p,
          tankDef: def,
          isRemote: true,
          alive: true,
          health: p.health || def.stats.health,
          maxHealth: p.maxHealth || def.stats.health,
          shield: 0,
          recoil: 0,
          targetX: p.x,
          targetY: p.y,
          targetHullAngle: p.hullAngle,
          targetTurretAngle: p.turretAngle,
        });
        addKillFeedItem(p.name, 'Entered Sector', 'Deployment');
      }),

      tankSocketClient.on('player_moved', (p) => {
        const remote = gameStateRef.current.remoteTanks.get(p.id);
        if (remote) {
          remote.targetX = p.x;
          remote.targetY = p.y;
          remote.targetHullAngle = p.hullAngle;
          remote.targetTurretAngle = p.turretAngle;
          remote.speed = p.speed;
          remote.health = p.health;
          remote.shield = p.shield || 0;
          remote.alive = p.alive;
        }
      }),

      tankSocketClient.on('bullet_fired', (data) => {
        const b = data.bullet;
        if (b) {
          gameStateRef.current.bullets.push({
            ...b,
            isRemote: true,
          });
          tankAudio.playShoot(b.soundType || 'cannon');
        }
      }),

      tankSocketClient.on('obstacle_damaged', (data) => {
        const obs = gameStateRef.current.obstacles[data.obstacleIndex];
        if (obs) {
          obs.health = data.remainingHealth;
          obs.destroyed = data.isDestroyed;
          spawnWallDebris(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.type);
        }
      }),

      tankSocketClient.on('barrel_exploded', (data) => {
        const barrel = gameStateRef.current.barrels.find((b) => b.id === data.barrelId);
        if (barrel && !barrel.destroyed) {
          barrel.destroyed = true;
          triggerExplosion(data.x, data.y, 70, 80, 'barrel');
        }
      }),

      tankSocketClient.on('mine_placed', (mine) => {
        gameStateRef.current.mines.push(mine);
      }),

      tankSocketClient.on('mine_detonated', (data) => {
        const idx = gameStateRef.current.mines.findIndex((m) => m.id === data.mineId);
        if (idx !== -1) {
          gameStateRef.current.mines.splice(idx, 1);
          triggerExplosion(data.x, data.y, 65, 80, 'mine');
        }
      }),

      tankSocketClient.on('powerup_spawned', (pu) => {
        gameStateRef.current.powerups.push(pu);
      }),

      tankSocketClient.on('powerup_collected', (data) => {
        const idx = gameStateRef.current.powerups.findIndex((p) => p.id === data.powerupId);
        if (idx !== -1) {
          gameStateRef.current.powerups.splice(idx, 1);
        }
      }),

      tankSocketClient.on('player_damaged', (data) => {
        if (data.targetId === 'player-1') {
          const p1 = gameStateRef.current.tanks[0];
          if (p1 && p1.alive) {
            applyDamageToTank(p1, data.damage, data.shooterId);
          }
        }
      }),

      tankSocketClient.on('player_eliminated', (data) => {
        addKillFeedItem(data.killerName || 'Opponent', data.victimName || 'Tank', 'Direct Hit');
      }),

      tankSocketClient.on('player_left', (cid) => {
        const remote = gameStateRef.current.remoteTanks.get(cid);
        if (remote) {
          addKillFeedItem(remote.name, 'Disconnected', 'Signal Lost');
          gameStateRef.current.remoteTanks.delete(cid);
        }
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
      tankSocketClient.disconnect();
    };
  }, [mode, socketUrl, roomCode, p1Name, p1TankId, mapId, onSocketStatusChange, addKillFeedItem, spawnWallDebris, triggerExplosion, applyDamageToTank]);

  // Robust Movement & Wall Sliding Subroutine
  const updatePlayerInput = useCallback((tank, input) => {
    const stats = tank.tankDef.stats;
    const maxSpeed = tank.speedBoostDuration > 0 ? stats.speed * 1.5 : stats.speed;
    const turnSpeed = stats.turnSpeed;

    // Chassis steering
    if (input.left) {
      tank.hullAngle -= turnSpeed;
    }
    if (input.right) {
      tank.hullAngle += turnSpeed;
    }

    // Acceleration / Reverse
    if (input.up) {
      tank.speed = Math.min(maxSpeed, tank.speed + 0.22);
    } else if (input.down) {
      tank.speed = Math.max(-maxSpeed * 0.65, tank.speed - 0.18);
    } else {
      tank.speed *= 0.88;
      if (Math.abs(tank.speed) < 0.05) tank.speed = 0;
    }

    if (Math.abs(tank.speed) > 0.01) {
      const state = gameStateRef.current;
      const map = state.map;
      const moveDist = tank.speed;
      const targetNextX = tank.x + Math.cos(tank.hullAngle) * moveDist;
      const targetNextY = tank.y + Math.sin(tank.hullAngle) * moveDist;

      // Helper collision tester
      const checkCollisionAt = (tx, ty) => {
        const radius = 22;
        // Arena bounds check
        if (tx < radius + 15 || tx > map.width - radius - 15 || ty < radius + 15 || ty > map.height - radius - 15) {
          return true;
        }
        // Obstacles check
        for (const obs of state.obstacles) {
          if (obs.destroyed) continue;
          const closestX = Math.max(obs.x, Math.min(tx, obs.x + obs.w));
          const closestY = Math.max(obs.y, Math.min(ty, obs.y + obs.h));
          const dist = Math.hypot(tx - closestX, ty - closestY);
          if (dist < radius) return true;
        }
        // Barrels check
        for (const barrel of state.barrels) {
          if (barrel.destroyed) continue;
          const dist = Math.hypot(tx - barrel.x, ty - barrel.y);
          if (dist < radius + barrel.radius) return true;
        }
        return false;
      };

      // Slide along walls smoothly
      if (!checkCollisionAt(targetNextX, targetNextY)) {
        tank.x = targetNextX;
        tank.y = targetNextY;
      } else if (!checkCollisionAt(targetNextX, tank.y)) {
        tank.x = targetNextX;
      } else if (!checkCollisionAt(tank.x, targetNextY)) {
        tank.y = targetNextY;
      } else {
        tank.speed = 0;
      }

      // Track marks
      if (Math.abs(tank.speed) > 0.8 && Math.random() < 0.35) {
        const perpAngle = tank.hullAngle + Math.PI / 2;
        const trackOffset = 16;
        state.trackMarks.push({
          x1: tank.x + Math.cos(perpAngle) * trackOffset,
          y1: tank.y + Math.sin(perpAngle) * trackOffset,
          x2: tank.x - Math.cos(perpAngle) * trackOffset,
          y2: tank.y - Math.sin(perpAngle) * trackOffset,
          angle: tank.hullAngle,
          alpha: 0.35,
        });

        if (state.trackMarks.length > 200) {
          state.trackMarks.shift();
        }
      }
    }
  }, []);

  // Smart AI Bot logic
  const updateAIBot = useCallback((bot, player, dt) => {
    if (!player || !player.alive) return;

    const bState = bot.botState;
    bState.changeDirTimer -= dt;

    const distToPlayer = Math.hypot(player.x - bot.x, player.y - bot.y);
    const angleToPlayer = Math.atan2(player.y - bot.y, player.x - bot.x);

    bot.turretAngle = angleToPlayer;

    if (distToPlayer > 300) {
      bState.desiredAngle = angleToPlayer;
    } else if (distToPlayer < 160) {
      bState.desiredAngle = angleToPlayer + Math.PI;
    } else {
      if (bState.changeDirTimer <= 0) {
        bState.changeDirTimer = 2 + Math.random() * 2;
        bState.desiredAngle = angleToPlayer + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
      }
    }

    let dAngle = bState.desiredAngle - bot.hullAngle;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;

    const input = {
      left: dAngle < -0.1,
      right: dAngle > 0.1,
      up: true,
      down: false,
    };
    updatePlayerInput(bot, input);

    const now = performance.now();
    const botStats = bot.tankDef.stats;
    const cooldown = botDifficulty === 'hard' ? botStats.fireRate * 1.1 : botDifficulty === 'medium' ? botStats.fireRate * 1.5 : botStats.fireRate * 2.2;

    if (distToPlayer < 650 && now - (bot.lastFired || 0) > cooldown) {
      bot.lastFired = now;
      fireBullet(bot);
    }
  }, [botDifficulty, fireBullet, updatePlayerInput]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture keys if typing in text inputs or chat
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      const keyLower = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(keyLower)) {
        e.preventDefault();
      }

      gameStateRef.current.keys[keyLower] = true;
      gameStateRef.current.keys[e.code] = true;
      gameStateRef.current.keys[e.code.toLowerCase()] = true;

      // P1 Landmine deployment (Space)
      if (e.code === 'Space') {
        const p1 = gameStateRef.current.tanks[0];
        if (p1) placeMine(p1);
      }

      // P2 Landmine deployment (Numpad0 or M)
      if (mode === 'local2p' && (e.code === 'Numpad0' || keyLower === 'm')) {
        const p2 = gameStateRef.current.tanks[1];
        if (p2) placeMine(p2);
      }
    };

    const handleKeyUp = (e) => {
      const keyLower = e.key.toLowerCase();
      gameStateRef.current.keys[keyLower] = false;
      gameStateRef.current.keys[e.code] = false;
      gameStateRef.current.keys[e.code.toLowerCase()] = false;
    };

    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const cam = gameStateRef.current.camera;
      const worldX = canvasX - canvas.width / 2 + cam.x;
      const worldY = canvasY - canvas.height / 2 + cam.y;

      gameStateRef.current.mouse = {
        worldX,
        worldY,
        canvasX,
        canvasY,
        isDown: gameStateRef.current.mouse.isDown,
      };
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        gameStateRef.current.mouse.isDown = true;
        const p1 = gameStateRef.current.tanks[0];
        if (p1 && p1.alive) {
          fireBullet(p1);
        }
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        gameStateRef.current.mouse.isDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode, fireBullet, placeMine]);

  // Main Simulation Step
  const updateGame = useCallback((dt) => {
    const state = gameStateRef.current;
    state.gameTime += dt;
    const keys = state.keys;
    const map = state.map;

    // Powerup Spawner
    state.powerupSpawnTimer += dt;
    if (state.powerupSpawnTimer > 10 && state.powerups.length < 4) {
      state.powerupSpawnTimer = 0;
      const pad = map.powerupPads[Math.floor(Math.random() * map.powerupPads.length)];
      const types = Object.values(POWER_UP_TYPES);
      const chosenType = types[Math.floor(Math.random() * types.length)];

      const occupied = state.powerups.some((p) => Math.hypot(p.x - pad.x, p.y - pad.y) < 30);
      if (!occupied) {
        const pu = {
          id: `pu-${Date.now()}`,
          typeId: chosenType.id,
          name: chosenType.name,
          icon: chosenType.icon,
          color: chosenType.color,
          glow: chosenType.glow,
          x: pad.x,
          y: pad.y,
          radius: 16,
          bob: 0,
        };
        state.powerups.push(pu);
        if (mode === 'online') {
          tankSocketClient.sendPowerupSpawn(pu);
        }
      }
    }

    // 1. UPDATE LOCAL PLAYER 1
    const p1 = state.tanks[0];
    if (p1 && p1.alive) {
      // Support BOTH WASD and Arrow Keys for P1 in Single Player and Online
      const up = keys['w'] || keys['keyw'] || (mode !== 'local2p' && (keys['arrowup'] || keys['up']));
      const down = keys['s'] || keys['keys'] || (mode !== 'local2p' && (keys['arrowdown'] || keys['down']));
      const left = keys['a'] || keys['keya'] || (mode !== 'local2p' && (keys['arrowleft'] || keys['left']));
      const right = keys['d'] || keys['keyd'] || (mode !== 'local2p' && (keys['arrowright'] || keys['right']));

      updatePlayerInput(p1, { up, down, left, right, fire: state.mouse.isDown });

      // Turret follows mouse in world coordinates
      p1.targetTurretAngle = Math.atan2(state.mouse.worldY - p1.y, state.mouse.worldX - p1.x);
      p1.turretAngle = p1.targetTurretAngle;

      if (state.mouse.isDown) {
        fireBullet(p1);
      }

      // Audio engine rev
      tankAudio.startEngine();
      tankAudio.updateEngine(Math.abs(p1.speed) / p1.tankDef.stats.speed);

      // Network sync for P1
      if (mode === 'online') {
        tankSocketClient.sendTankState(p1);
      }
    }

    // 2. PLAYER 2 (Local 2P)
    if (mode === 'local2p') {
      const p2 = state.tanks[1];
      if (p2 && p2.alive) {
        updatePlayerInput(p2, {
          up: keys['arrowup'] || keys['up'],
          down: keys['arrowdown'] || keys['down'],
          left: keys['arrowleft'] || keys['left'],
          right: keys['arrowright'] || keys['right'],
          fire: keys['enter'] || keys['numpadenter'] || keys['slash'],
        });

        if (keys['j']) p2.turretAngle -= 0.05;
        if (keys['l']) p2.turretAngle += 0.05;
        if (!keys['j'] && !keys['l'] && p1 && p1.alive) {
          p2.turretAngle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
        }

        if (keys['enter'] || keys['numpadenter'] || keys['slash']) {
          fireBullet(p2);
        }
      }
    }

    // 3. AI BOTS (SP)
    if (mode === 'sp') {
      state.tanks.forEach((tank) => {
        if (!tank.isBot || !tank.alive) return;
        updateAIBot(tank, p1, dt);
      });
    }

    // 4. REMOTE TANKS INTERPOLATION (Online)
    if (mode === 'online') {
      state.remoteTanks.forEach((remote) => {
        if (!remote.alive) return;
        remote.x += (remote.targetX - remote.x) * 0.25;
        remote.y += (remote.targetY - remote.y) * 0.25;

        let dHull = remote.targetHullAngle - remote.hullAngle;
        while (dHull < -Math.PI) dHull += Math.PI * 2;
        while (dHull > Math.PI) dHull -= Math.PI * 2;
        remote.hullAngle += dHull * 0.25;

        let dTurret = remote.targetTurretAngle - remote.turretAngle;
        while (dTurret < -Math.PI) dTurret += Math.PI * 2;
        while (dTurret > Math.PI) dTurret -= Math.PI * 2;
        remote.turretAngle += dTurret * 0.25;

        if (remote.recoil > 0) remote.recoil -= 0.5;
      });
    }

    // 5. BUFF TIMERS & POWERUPS
    state.tanks.forEach((tank) => {
      if (tank.shieldDuration > 0) {
        tank.shieldDuration -= 1;
        if (tank.shieldDuration <= 0) tank.shield = 0;
      }
      if (tank.speedBoostDuration > 0) tank.speedBoostDuration -= 1;
      if (tank.rapidFireDuration > 0) tank.rapidFireDuration -= 1;
      if (tank.tripleShotDuration > 0) tank.tripleShotDuration -= 1;
      if (tank.recoil > 0) tank.recoil -= 0.5;

      state.powerups.forEach((pu, idx) => {
        const dist = Math.hypot(tank.x - pu.x, tank.y - pu.y);
        if (dist < pu.radius + 22) {
          collectPowerup(tank, pu);
          state.powerups.splice(idx, 1);
        }
      });
    });

    // 6. PROXIMITY MINES
    state.mines.forEach((mine, idx) => {
      mine.life += 1;
      if (!mine.armed) {
        mine.armTimer -= 1;
        if (mine.armTimer <= 0) mine.armed = true;
      } else {
        const allTanks = [...state.tanks, ...Array.from(state.remoteTanks.values())];
        allTanks.forEach((tank) => {
          if (!tank.alive) return;
          const dist = Math.hypot(tank.x - mine.x, tank.y - mine.y);
          if (dist < mine.triggerRadius) {
            state.mines.splice(idx, 1);
            triggerExplosion(mine.x, mine.y, 65, mine.damage, 'mine');
            if (mode === 'online') {
              tankSocketClient.sendMineDetonated(mine.id, mine.x, mine.y);
            }
          }
        });
      }
    });

    // 7. BULLETS & RICOCHET
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life += 1;

      if (b.life % 2 === 0) {
        state.particles.push({
          x: b.x,
          y: b.y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 1.5 + Math.random() * 2,
          color: 'rgba(203, 213, 225, 0.4)',
          alpha: 0.6,
          life: 15,
          maxLife: 15,
        });
      }

      if (b.life >= b.maxLife) {
        state.bullets.splice(i, 1);
        continue;
      }

      // Ricochet arena boundaries
      let bounced = false;
      if (b.x <= 20 || b.x >= map.width - 20) {
        b.vx *= -1;
        b.x = Math.max(21, Math.min(map.width - 21, b.x));
        bounced = true;
      }
      if (b.y <= 20 || b.y >= map.height - 20) {
        b.vy *= -1;
        b.y = Math.max(21, Math.min(map.height - 21, b.y));
        bounced = true;
      }

      if (bounced) {
        b.bouncesRemaining -= 1;
        tankAudio.playRicochet();
        spawnWallDebris(b.x, b.y, 'steel');
        if (b.bouncesRemaining < 0) {
          state.bullets.splice(i, 1);
          continue;
        }
      }

      // Check obstacles
      let bulletRemoved = false;
      for (let j = 0; j < state.obstacles.length; j++) {
        const obs = state.obstacles[j];
        if (obs.destroyed || obs.type === 'water') continue;

        if (b.x >= obs.x && b.x <= obs.x + obs.w && b.y >= obs.y && b.y <= obs.y + obs.h) {
          if (obs.type === 'steel') {
            const overlapLeft = Math.abs(b.x - obs.x);
            const overlapRight = Math.abs(b.x - (obs.x + obs.w));
            const overlapTop = Math.abs(b.y - obs.y);
            const overlapBottom = Math.abs(b.y - (obs.y + obs.h));
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapLeft || minOverlap === overlapRight) {
              b.vx *= -1;
            } else {
              b.vy *= -1;
            }

            b.bouncesRemaining -= 1;
            tankAudio.playRicochet();
            spawnWallDebris(b.x, b.y, 'steel');

            if (b.bouncesRemaining < 0) {
              state.bullets.splice(i, 1);
              bulletRemoved = true;
              break;
            }
          } else if (obs.type === 'brick') {
            obs.health -= b.damage;
            spawnWallDebris(b.x, b.y, 'brick');
            tankAudio.playHit();

            if (obs.health <= 0) {
              obs.destroyed = true;
              spawnWallDebris(obs.x + obs.w / 2, obs.y + obs.h / 2, 'brick');
            }

            if (mode === 'online') {
              tankSocketClient.sendObstacleHit(j, b.damage, obs.health, obs.destroyed);
            }

            state.bullets.splice(i, 1);
            bulletRemoved = true;
            break;
          }
        }
      }

      if (bulletRemoved) continue;

      // Check barrels
      for (let j = 0; j < state.barrels.length; j++) {
        const barrel = state.barrels[j];
        if (barrel.destroyed) continue;
        const dist = Math.hypot(b.x - barrel.x, b.y - barrel.y);
        if (dist < barrel.radius + b.radius) {
          barrel.destroyed = true;
          triggerExplosion(barrel.x, barrel.y, 75, 80, 'barrel');
          if (mode === 'online') {
            tankSocketClient.sendBarrelExplode(barrel.id, barrel.x, barrel.y);
          }
          state.bullets.splice(i, 1);
          bulletRemoved = true;
          break;
        }
      }

      if (bulletRemoved) continue;

      // Check tanks
      const allTargetTanks = [...state.tanks, ...Array.from(state.remoteTanks.values())];
      for (let k = 0; k < allTargetTanks.length; k++) {
        const targetTank = allTargetTanks[k];
        if (!targetTank.alive) continue;
        if (targetTank.id === b.ownerId && b.life < 10) continue;

        const dist = Math.hypot(b.x - targetTank.x, b.y - targetTank.y);
        if (dist < 24) {
          applyDamageToTank(targetTank, b.damage, b.ownerId);

          if (mode === 'online' && !targetTank.isRemote) {
            tankSocketClient.sendTankHit(targetTank.id, b.damage);
          }

          state.bullets.splice(i, 1);
          break;
        }
      }
    }

    // 8. PARTICLES
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= 1;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'shockwave') {
        p.radius += (p.maxRadius - p.radius) * 0.15;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }

      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    // 9. FLOATING TEXTS
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.life -= 1;
      ft.y += ft.vy;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) {
        state.floatingTexts.splice(i, 1);
      }
    }

    // 10. TRACK MARKS
    for (let i = state.trackMarks.length - 1; i >= 0; i--) {
      const tm = state.trackMarks[i];
      tm.alpha -= 0.002;
      if (tm.alpha <= 0) {
        state.trackMarks.splice(i, 1);
      }
    }

    // 11. CAMERA
    if (p1 && p1.alive) {
      state.camera.targetX = p1.x;
      state.camera.targetY = p1.y;
    }
    state.camera.x += (state.camera.targetX - state.camera.x) * 0.1;
    state.camera.y += (state.camera.targetY - state.camera.y) * 0.1;

    state.camera.x = Math.max(300, Math.min(map.width - 300, state.camera.x));
    state.camera.y = Math.max(220, Math.min(map.height - 220, state.camera.y));

    if (state.camera.shake > 0) {
      state.camera.shake *= 0.88;
      if (state.camera.shake < 0.2) state.camera.shake = 0;
    }

    // THROTTLED STATS UPDATE (every ~150ms to prevent infinite react render loop)
    const nowMs = performance.now();
    if (onGameStatsUpdate && p1 && nowMs - lastStatsUpdateRef.current > 150) {
      lastStatsUpdateRef.current = nowMs;
      onGameStatsUpdate({
        health: p1.health,
        maxHealth: p1.maxHealth,
        shield: p1.shield,
        speedBoost: p1.speedBoostDuration > 0,
        rapidFire: p1.rapidFireDuration > 0,
        tripleShot: p1.tripleShotDuration > 0,
        minesRemaining: p1.minesRemaining,
        kills: p1.kills,
        score: p1.score,
        gameOver: state.gameOver,
      });
    }
  }, [mode, updatePlayerInput, fireBullet, collectPowerup, triggerExplosion, spawnWallDebris, applyDamageToTank, updateAIBot, onGameStatsUpdate]);

  // Render Function
  const renderGame = useCallback((ctx, canvas) => {
    const state = gameStateRef.current;
    const map = state.map;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = map.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    const shakeX = (Math.random() - 0.5) * state.camera.shake * 2;
    const shakeY = (Math.random() - 0.5) * state.camera.shake * 2;
    ctx.translate(w / 2 - state.camera.x + shakeX, h / 2 - state.camera.y + shakeY);

    // 1. Grid
    ctx.strokeStyle = map.gridColor;
    ctx.lineWidth = 1;
    const gridSize = 80;
    const startX = Math.floor((state.camera.x - w / 2) / gridSize) * gridSize;
    const endX = startX + w + gridSize * 2;
    const startY = Math.floor((state.camera.y - h / 2) / gridSize) * gridSize;
    const endY = startY + h + gridSize * 2;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      if (x >= 0 && x <= map.width) {
        ctx.moveTo(x, Math.max(0, startY));
        ctx.lineTo(x, Math.min(map.height, endY));
      }
    }
    for (let y = startY; y <= endY; y += gridSize) {
      if (y >= 0 && y <= map.height) {
        ctx.moveTo(Math.max(0, startX), y);
        ctx.lineTo(Math.min(map.width, endX), y);
      }
    }
    ctx.stroke();

    // 2. Outer Border
    ctx.strokeStyle = map.boundaryColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = map.boundaryColor;
    ctx.shadowBlur = 15;
    ctx.strokeRect(10, 10, map.width - 20, map.height - 20);
    ctx.shadowBlur = 0;

    // 3. Track marks
    state.trackMarks.forEach((tm) => {
      ctx.fillStyle = `rgba(15, 23, 42, ${tm.alpha})`;
      ctx.save();
      ctx.translate(tm.x1, tm.y1);
      ctx.rotate(tm.angle);
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();

      ctx.save();
      ctx.translate(tm.x2, tm.y2);
      ctx.rotate(tm.angle);
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();
    });

    // 4. Powerup pads
    map.powerupPads.forEach((pad) => {
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    state.powerups.forEach((pu) => {
      const bobY = Math.sin(state.gameTime * 4) * 4;
      ctx.save();
      ctx.translate(pu.x, pu.y + bobY);

      ctx.shadowColor = pu.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, pu.radius, 0, Math.PI * 2);
      ctx.fillStyle = pu.color;
      ctx.fill();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.icon, 0, 0);
      ctx.restore();
    });

    // 5. Obstacles
    state.obstacles.forEach((obs) => {
      if (obs.destroyed) return;

      if (obs.type === 'steel') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(obs.x + 6, obs.y + 6, 2, 0, Math.PI * 2);
        ctx.arc(obs.x + obs.w - 6, obs.y + 6, 2, 0, Math.PI * 2);
        ctx.arc(obs.x + 6, obs.y + obs.h - 6, 2, 0, Math.PI * 2);
        ctx.arc(obs.x + obs.w - 6, obs.y + obs.h - 6, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'brick') {
        const healthPercent = obs.health / obs.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#b45309' : '#78350f';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

        if (healthPercent < 0.8) {
          ctx.strokeStyle = '#451a03';
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.w * 0.3, obs.y);
          ctx.lineTo(obs.x + obs.w * 0.5, obs.y + obs.h * 0.6);
          ctx.lineTo(obs.x + obs.w * 0.7, obs.y + obs.h);
          ctx.stroke();
        }
      } else if (obs.type === 'water') {
        ctx.fillStyle = map.theme === 'volcanic' ? 'rgba(234, 88, 12, 0.45)' : 'rgba(14, 165, 233, 0.35)';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = map.theme === 'volcanic' ? 'rgba(249, 115, 22, 0.7)' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      }
    });

    // 6. Barrels
    state.barrels.forEach((barrel) => {
      if (barrel.destroyed) return;
      ctx.save();
      ctx.translate(barrel.x, barrel.y);

      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, barrel.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.fillRect(-barrel.radius * 0.7, -4, barrel.radius * 1.4, 8);

      ctx.fillStyle = '#000000';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☣', 0, 0);

      ctx.restore();
    });

    // 7. Mines
    state.mines.forEach((mine) => {
      ctx.save();
      ctx.translate(mine.x, mine.y);

      ctx.beginPath();
      ctx.arc(0, 0, mine.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.stroke();

      const blink = Math.sin(state.gameTime * 8) > 0;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = blink ? 10 : 0;
      ctx.fill();

      ctx.restore();
    });

    // 8. Tanks
    const allRenderTanks = [...state.tanks, ...Array.from(state.remoteTanks.values())];
    allRenderTanks.forEach((tank) => {
      if (!tank.alive) return;
      drawTank(ctx, tank);
    });

    // 9. Bullets
    state.bullets.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);

      ctx.shadowColor = b.glowColor || b.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });

    // 10. Particles
    state.particles.forEach((p) => {
      ctx.save();
      if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.restore();
    });

    // 11. Floating text
    state.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();

    // 12. Radar HUD
    drawMiniMapRadar(ctx, canvas, state);
  }, []);

  // Detailed Tank Drawer
  const drawTank = (ctx, tank) => {
    const def = tank.tankDef;
    const hw = def.hullWidth || 42;
    const hh = def.hullHeight || 48;

    ctx.save();
    ctx.translate(tank.x, tank.y);

    ctx.shadowColor = def.glowColor;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, hw * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Chassis & Tracks
    ctx.save();
    ctx.rotate(tank.hullAngle);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-hh / 2, -hw / 2 - 4, hh, 8);
    ctx.fillRect(-hh / 2, hw / 2 - 4, hh, 8);

    ctx.fillStyle = '#475569';
    for (let x = -hh / 2 + 3; x < hh / 2 - 3; x += 6) {
      ctx.fillRect(x, -hw / 2 - 4, 3, 8);
      ctx.fillRect(x, hw / 2 - 4, 3, 8);
    }

    ctx.fillStyle = def.secondaryColor;
    ctx.fillRect(-hh / 2 + 4, -hw / 2 + 3, hh - 8, hw - 6);

    ctx.fillStyle = def.primaryColor;
    ctx.fillRect(-hh / 2 + 8, -hw / 2 + 6, hh - 16, hw - 12);

    ctx.fillStyle = def.accentColor;
    ctx.fillRect(-hh / 2 + 10, -3, 8, 6);
    ctx.fillRect(hh / 2 - 14, -hw / 2 + 8, 4, hw - 16);

    ctx.restore();

    // Turret
    ctx.save();
    ctx.rotate(tank.turretAngle);

    const recoil = tank.recoil || 0;
    const barrelLen = def.turretLength || 32;
    const barrelW = def.turretWidth || 6;

    if (def.hasDualBarrels) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-recoil, -barrelW - 2, barrelLen, barrelW);
      ctx.fillRect(-recoil, 2, barrelLen, barrelW);

      ctx.fillStyle = def.accentColor;
      ctx.fillRect(barrelLen - 4 - recoil, -barrelW - 3, 4, barrelW + 2);
      ctx.fillRect(barrelLen - 4 - recoil, 1, 4, barrelW + 2);
    } else {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-recoil, -barrelW / 2, barrelLen, barrelW);

      ctx.fillStyle = def.accentColor;
      ctx.fillRect(barrelLen - 5 - recoil, -barrelW / 2 - 2, 5, barrelW + 4);
    }

    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = def.primaryColor;
    ctx.fill();
    ctx.strokeStyle = def.accentColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-2, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.restore();

    // Shield
    if (tank.shield > 0) {
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fill();
      ctx.restore();
    }

    // Health Bar & Name
    ctx.save();
    const barW = 46;
    const barH = 5;
    const hpRatio = Math.max(0, tank.health / tank.maxHealth);

    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = tank.isPlayer ? '#ffffff' : '#cbd5e1';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(tank.name, 0, -hw / 2 - 18);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-barW / 2, -hw / 2 - 12, barW, barH);

    ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(-barW / 2, -hw / 2 - 12, barW * hpRatio, barH);

    if (tank.shield > 0) {
      const shieldRatio = Math.min(1, tank.shield / 60);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-barW / 2, -hw / 2 - 14, barW * shieldRatio, 2);
    }

    ctx.restore();

    ctx.restore();
  };

  // Radar
  const drawMiniMapRadar = (ctx, canvas, state) => {
    const map = state.map;
    const radarW = 160;
    const radarH = (map.height / map.width) * radarW;
    const rx = canvas.width - radarW - 20;
    const ry = canvas.height - radarH - 20;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(rx, ry, radarW, radarH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx, ry, radarW, radarH);

    const scaleX = radarW / map.width;
    const scaleY = radarH / map.height;

    state.obstacles.forEach((obs) => {
      if (obs.destroyed) return;
      ctx.fillStyle = obs.type === 'steel' ? '#64748b' : '#d97706';
      ctx.fillRect(rx + obs.x * scaleX, ry + obs.y * scaleY, Math.max(2, obs.w * scaleX), Math.max(2, obs.h * scaleY));
    });

    state.powerups.forEach((pu) => {
      ctx.fillStyle = pu.color;
      ctx.beginPath();
      ctx.arc(rx + pu.x * scaleX, ry + pu.y * scaleY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const allTanks = [...state.tanks, ...Array.from(state.remoteTanks.values())];
    allTanks.forEach((tank) => {
      if (!tank.alive) return;
      ctx.fillStyle = tank.isPlayer && tank.playerNum === 1 ? '#06b6d4' : tank.playerNum === 2 ? '#d946ef' : '#ef4444';
      ctx.beginPath();
      ctx.arc(rx + tank.x * scaleX, ry + tank.y * scaleY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  };

  // Continuous 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth || 960;
      canvas.height = canvas.parentElement.clientHeight || 640;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let lastTick = performance.now();

    const loop = (timestamp) => {
      const dt = Math.min((timestamp - lastTick) / 1000, 0.1);
      lastTick = timestamp;

      if (!isPaused && !gameStateRef.current.gameOver) {
        updateGame(dt);
      }

      renderGame(ctx, canvas);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      tankAudio.stopEngine();
    };
  }, [isPaused, updateGame, renderGame]);

  return (
    <div className="relative w-full h-[620px] md:h-[700px] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Kill Feed Notification Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 pointer-events-none max-w-xs">
        {killFeed.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/10 text-xs shadow-lg animate-fadeIn"
          >
            <span className="font-bold text-cyan-400">{item.killer}</span>
            <span className="text-slate-400">⚔️</span>
            <span className="font-semibold text-rose-400">{item.victim}</span>
            <span className="text-[10px] text-slate-500 ml-auto uppercase">{item.weapon}</span>
          </div>
        ))}
      </div>

      {/* Online Status & Ping Badge */}
      {mode === 'online' && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              socketStatus.status === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : socketStatus.status === 'cross_tab'
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                : 'bg-rose-400'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {socketStatus.status === 'connected'
              ? `LIVE SERVER (${socketStatus.ping}ms)`
              : socketStatus.status === 'cross_tab'
              ? 'CROSS-TAB PEER (1ms)'
              : 'CONNECTING...'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-mono font-bold">{roomCode}</span>
        </div>
      )}

      {/* Quick Controls Cheat-Sheet */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/75 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 pointer-events-none">
        <span className="text-cyan-400 font-bold">P1:</span> WASD / Arrows (Move) • Mouse (Aim & Fire) • Space (Mine)
        {mode === 'local2p' && (
          <>
            <span className="text-slate-500">|</span>
            <span className="text-fuchsia-400 font-bold">P2:</span> Arrows (Move) • Enter (Fire) • J/L (Turret) • M (Mine)
          </>
        )}
      </div>
    </div>
  );
}
