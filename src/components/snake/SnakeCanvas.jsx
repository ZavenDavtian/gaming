import React, { useRef, useEffect, useState, useCallback } from 'react';
import { soundEngine } from './audio';
import { getSkinById, BOT_NAMES } from './skins';
import { socketClient } from './socketClient';

const ARENA_RADIUS = 2000;
const INITIAL_MASS = 35;
const BASE_SPEED = 3.6;
const BOOST_SPEED = 7.0;
const SEGMENT_SPACING = 7;
const TOTAL_BOTS = 18;
const INITIAL_ORBS = 550;
const SPAWN_IMMUNITY_FRAMES = 240; // ~4 seconds at 60fps

export default function SnakeCanvas({
  mode = 'solo', // 'solo' | 'versus' | 'online'
  roomCode = 'GLOBAL',
  socketUrl = 'ws://localhost:8080',
  player1Config = { name: 'Player 1', skinId: 'cyber-matrix' },
  player2Config = { name: 'Player 2', skinId: 'solar-dragon' },
  isPaused = false,
  isMuted = false,
  onGameOver,
  onStatsUpdate,
  onSocketStatusChange,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Prop refs so game loop always accesses fresh props without tearing down
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const onStatsUpdateRef = useRef(onStatsUpdate);
  onStatsUpdateRef.current = onStatsUpdate;

  // Mutable game state
  const gameStateRef = useRef({
    snakes: [],
    remoteSnakes: new Map(), // clientId -> snake
    orbs: [],
    particles: [],
    camera: { x: 0, y: 0, zoom: 1 },
    keysDown: {},
    mouse: { x: 0, y: 0, isDown: false, angle: 0 },
    frameCount: 0,
    crownSnakeId: null,
    isMounted: true,
  });

  const [leaderboard, setLeaderboard] = useState([]);
  const [hudStats, setHudStats] = useState({
    p1Mass: INITIAL_MASS,
    p1Kills: 0,
    p1Rank: 1,
    p2Mass: INITIAL_MASS,
    p2Kills: 0,
    p2Rank: 2,
    totalAlive: TOTAL_BOTS + 1,
  });
  const [killBanner, setKillBanner] = useState(null);
  const [socketStatus, setSocketStatus] = useState({ status: 'disconnected', ping: 0, isUsingBroadcast: false });

  // Sync mute setting
  useEffect(() => {
    soundEngine.setMuted(isMuted);
  }, [isMuted]);

  // Create an orb
  const createOrb = useCallback((x, y, massValue = null, color = null, customId = null) => {
    const value = massValue || (Math.random() < 0.15 ? Math.floor(Math.random() * 8) + 4 : Math.floor(Math.random() * 3) + 1);
    const radius = Math.min(3 + Math.sqrt(value) * 1.6, 14);
    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#a855f7'];
    const chosenColor = color || colors[Math.floor(Math.random() * colors.length)];
    return {
      id: customId || `orb_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      x,
      y,
      value,
      radius,
      color: chosenColor,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.04 + Math.random() * 0.04,
    };
  }, []);

  // Spawn initial orbs
  const spawnInitialOrbs = useCallback(() => {
    const orbs = [];
    for (let i = 0; i < INITIAL_ORBS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * (ARENA_RADIUS - 60);
      orbs.push(createOrb(Math.cos(angle) * dist, Math.sin(angle) * dist));
    }
    return orbs;
  }, [createOrb]);

  // Create snake entity
  const createSnake = useCallback((id, name, skinId, isPlayer = false, playerIndex = 1, spawnX = 0, spawnY = 0) => {
    const skin = getSkinById(skinId);
    const startAngle = Math.random() * Math.PI * 2;
    const initialSegments = [];
    const initialLength = 16;
    const initialRadius = 13;

    for (let i = 0; i < initialLength; i++) {
      initialSegments.push({
        x: spawnX - Math.cos(startAngle) * i * SEGMENT_SPACING,
        y: spawnY - Math.sin(startAngle) * i * SEGMENT_SPACING,
        r: initialRadius,
      });
    }

    return {
      id,
      name,
      skin,
      isPlayer,
      isRemote: false,
      playerIndex,
      x: spawnX,
      y: spawnY,
      angle: startAngle,
      targetAngle: startAngle,
      speed: BASE_SPEED,
      isBoosting: false,
      mass: INITIAL_MASS,
      radius: initialRadius,
      segments: initialSegments,
      turnSpeed: 0.085,
      kills: 0,
      alive: true,
      boostCounter: 0,
      immunity: isPlayer ? SPAWN_IMMUNITY_FRAMES : 60,
      ai: isPlayer ? null : {
        targetX: spawnX + Math.cos(startAngle) * 500,
        targetY: spawnY + Math.sin(startAngle) * 500,
        decisionTimer: Math.floor(Math.random() * 40) + 20,
        boostCooldown: 0,
        personality: Math.random() < 0.35 ? 'aggressive' : Math.random() < 0.6 ? 'scavenger' : 'balanced',
      },
    };
  }, []);

  // Initialize Game entities
  const initGameEntities = useCallback(() => {
    const snakes = [];

    // Player 1
    const p1 = createSnake(
      'player-1',
      player1Config.name || 'Player 1',
      player1Config.skinId || 'cyber-matrix',
      true,
      1,
      modeRef.current === 'versus' ? -250 : 0,
      0
    );
    snakes.push(p1);

    // Player 2 if Versus
    if (modeRef.current === 'versus') {
      const p2 = createSnake(
        'player-2',
        player2Config.name || 'Player 2',
        player2Config.skinId || 'solar-dragon',
        true,
        2,
        250,
        0
      );
      snakes.push(p2);
    }

    // AI Bots (fewer in online mode to leave room for real players)
    const botCount = modeRef.current === 'online' ? 12 : TOTAL_BOTS;
    const shuffledNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    const skinKeys = ['cyber-matrix', 'solar-dragon', 'vaporwave-neon', 'toxic-acid', 'cosmic-void', 'rainbow-prism', 'glacial-frost', 'golden-emperor'];

    for (let i = 0; i < botCount; i++) {
      const angle = (i / botCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 500 + Math.random() * (ARENA_RADIUS - 700);
      const botName = shuffledNames[i % shuffledNames.length];
      const botSkin = skinKeys[Math.floor(Math.random() * skinKeys.length)];
      const bot = createSnake(
        `bot-${i}-${Date.now()}`,
        botName,
        botSkin,
        false,
        0,
        Math.cos(angle) * dist,
        Math.sin(angle) * dist
      );
      bot.mass = Math.floor(INITIAL_MASS + Math.random() * 120);
      snakes.push(bot);
    }

    const orbs = spawnInitialOrbs();

    gameStateRef.current.snakes = snakes;
    gameStateRef.current.remoteSnakes = new Map();
    gameStateRef.current.orbs = orbs;
    gameStateRef.current.particles = [];
    gameStateRef.current.camera = { x: p1.x, y: p1.y, zoom: 1 };
  }, [createSnake, player1Config, player2Config, spawnInitialOrbs]);

  // Online WebSocket Integration
  useEffect(() => {
    if (mode !== 'online') return;

    socketClient.connect(socketUrl, roomCode, {
      name: player1Config.name || 'Gamer',
      skinId: player1Config.skinId || 'cyber-matrix',
    });

    const unsubs = [
      socketClient.on('status', (statusData) => {
        setSocketStatus(statusData);
        if (onSocketStatusChange) onSocketStatusChange(statusData);
      }),

      socketClient.on('room_joined', (data) => {
        console.log('[SnakeCanvas] Joined room:', data.roomId);
        if (Array.isArray(data.orbs) && data.orbs.length > 0) {
          gameStateRef.current.orbs = data.orbs;
        }
        if (Array.isArray(data.players)) {
          data.players.forEach((p) => {
            const skin = getSkinById(p.skinId);
            gameStateRef.current.remoteSnakes.set(p.id, {
              ...p,
              skin,
              isPlayer: false,
              isRemote: true,
              targetX: p.x,
              targetY: p.y,
              targetAngle: p.angle,
            });
          });
        }
      }),

      socketClient.on('player_joined', (p) => {
        const skin = getSkinById(p.skinId);
        gameStateRef.current.remoteSnakes.set(p.id, {
          ...p,
          skin,
          isPlayer: false,
          isRemote: true,
          targetX: p.x,
          targetY: p.y,
          targetAngle: p.angle,
        });
      }),

      socketClient.on('player_moved', (p) => {
        const remote = gameStateRef.current.remoteSnakes.get(p.id);
        if (remote) {
          remote.targetX = p.x;
          remote.targetY = p.y;
          remote.targetAngle = p.angle;
          remote.speed = p.speed;
          remote.isBoosting = p.isBoosting;
          remote.mass = p.mass;
          remote.radius = p.radius;
          remote.segments = p.segments || [];
          remote.kills = p.kills;
          remote.alive = p.alive;
        } else {
          const skin = getSkinById(p.skinId);
          gameStateRef.current.remoteSnakes.set(p.id, {
            ...p,
            skin,
            isPlayer: false,
            isRemote: true,
            targetX: p.x,
            targetY: p.y,
            targetAngle: p.angle,
          });
        }
      }),

      socketClient.on('player_left', (clientId) => {
        gameStateRef.current.remoteSnakes.delete(clientId);
      }),

      socketClient.on('orb_removed', (orbId) => {
        const orbs = gameStateRef.current.orbs;
        const idx = orbs.findIndex((o) => o.id === orbId);
        if (idx >= 0) orbs.splice(idx, 1);
      }),

      socketClient.on('orbs_spawned', (newOrbs) => {
        if (Array.isArray(newOrbs)) {
          gameStateRef.current.orbs.push(...newOrbs);
        }
      }),

      socketClient.on('snake_eliminated', (data) => {
        setKillBanner({
          id: Date.now(),
          killer: data.killerName,
          victim: data.victimName,
          isPlayerInvolved: true,
        });
        setTimeout(() => {
          setKillBanner((cur) => (cur && Date.now() - cur.id > 2800 ? null : cur));
        }, 3000);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub?.());
      socketClient.disconnect();
    };
  }, [mode, roomCode, socketUrl, player1Config, onSocketStatusChange]);

  // Handle Resize and Dimensions
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(300, Math.floor(rect.width || container.clientWidth || 800));
    const height = Math.max(200, Math.floor(rect.height || container.clientHeight || 600));

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
  }, []);

  // ResizeObserver & window resize listeners
  useEffect(() => {
    updateCanvasDimensions();

    const container = containerRef.current;
    let ro = null;
    if (window.ResizeObserver && container) {
      ro = new ResizeObserver(() => {
        updateCanvasDimensions();
      });
      ro.observe(container);
    }

    window.addEventListener('resize', updateCanvasDimensions);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateCanvasDimensions);
    };
  }, [updateCanvasDimensions]);

  // Keyboard & Mouse Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      soundEngine.ensureContext();
      gameStateRef.current.keysDown[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      gameStateRef.current.keysDown[e.code] = false;
    };

    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      gameStateRef.current.mouse.x = mouseX;
      gameStateRef.current.mouse.y = mouseY;
      gameStateRef.current.mouse.angle = Math.atan2(mouseY, mouseX);
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        soundEngine.ensureContext();
        gameStateRef.current.mouse.isDown = true;
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        gameStateRef.current.mouse.isDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    const currentState = gameStateRef.current;
    currentState.isMounted = true;
    initGameEntities();
    soundEngine.startAmbientDrone();
    updateCanvasDimensions();

    let animationFrameId;

    const loop = () => {
      if (!currentState.isMounted) return;

      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (canvas && container) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        if (canvas.width === 0 || canvas.height === 0) {
          updateCanvasDimensions();
        }

        const viewWidth = Math.max(300, canvas.width / dpr);
        const viewHeight = Math.max(200, canvas.height / dpr);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          if (!isPausedRef.current) {
            updateLogic(viewWidth, viewHeight);
          }
          renderGraphics(ctx, viewWidth, viewHeight, dpr);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      currentState.isMounted = false;
      cancelAnimationFrame(animationFrameId);
      soundEngine.stopAmbientDrone();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initGameEntities, updateCanvasDimensions]);

  // Update Game Logic
  const updateLogic = (viewWidth, viewHeight) => {
    const state = gameStateRef.current;
    const keys = state.keysDown;
    const mouse = state.mouse;
    const currentMode = modeRef.current;

    // A. Player 1 Control
    const p1 = state.snakes.find((s) => s.id === 'player-1' && s.alive);
    if (p1) {
      if (currentMode === 'solo' || currentMode === 'online') {
        let hasKeyInput = false;
        let dx = 0;
        let dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) { dy -= 1; hasKeyInput = true; }
        if (keys['KeyS'] || keys['ArrowDown']) { dy += 1; hasKeyInput = true; }
        if (keys['KeyA'] || keys['ArrowLeft']) { dx -= 1; hasKeyInput = true; }
        if (keys['KeyD'] || keys['ArrowRight']) { dx += 1; hasKeyInput = true; }

        if (hasKeyInput) {
          p1.targetAngle = Math.atan2(dy, dx);
        } else if (mouse.x !== 0 || mouse.y !== 0) {
          p1.targetAngle = mouse.angle;
        }

        p1.isBoosting = Boolean(mouse.isDown || keys['Space'] || keys['ShiftLeft'] || keys['ShiftRight']);
      } else {
        // Versus Mode: Player 1 on WASD
        let dx = 0;
        let dy = 0;
        let moving = false;
        if (keys['KeyW']) { dy -= 1; moving = true; }
        if (keys['KeyS']) { dy += 1; moving = true; }
        if (keys['KeyA']) { dx -= 1; moving = true; }
        if (keys['KeyD']) { dx += 1; moving = true; }

        if (moving) {
          p1.targetAngle = Math.atan2(dy, dx);
        }
        p1.isBoosting = Boolean(keys['Space'] || keys['ShiftLeft']);
      }

      // If in online mode, broadcast local player state via WebSocket
      if (currentMode === 'online') {
        socketClient.sendPlayerUpdate(p1);
      }
    }

    // B. Player 2 Control (Versus Mode: Arrow Keys)
    if (currentMode === 'versus') {
      const p2 = state.snakes.find((s) => s.id === 'player-2' && s.alive);
      if (p2) {
        let dx = 0;
        let dy = 0;
        let moving = false;
        if (keys['ArrowUp']) { dy -= 1; moving = true; }
        if (keys['ArrowDown']) { dy += 1; moving = true; }
        if (keys['ArrowLeft']) { dx -= 1; moving = true; }
        if (keys['ArrowRight']) { dx += 1; moving = true; }

        if (moving) {
          p2.targetAngle = Math.atan2(dy, dx);
        }
        p2.isBoosting = Boolean(keys['Enter'] || keys['Numpad0'] || keys['ShiftRight']);
      }
    }

    // C. Interpolate Remote Online Snakes
    if (currentMode === 'online') {
      state.remoteSnakes.forEach((remote) => {
        if (!remote.alive) return;
        remote.x += (remote.targetX - remote.x) * 0.35;
        remote.y += (remote.targetY - remote.y) * 0.35;
        let diff = remote.targetAngle - remote.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        remote.angle += diff * 0.35;
      });
    }

    // D. AI Bot update
    state.snakes.forEach((snake) => {
      if (snake.isPlayer || !snake.alive) return;
      updateBotAI(snake, state);
    });

    // E. Move and advance snakes
    state.snakes.forEach((snake) => {
      if (!snake.alive) return;

      if (snake.immunity > 0) {
        snake.immunity -= 1;
      }

      if (snake.isBoosting && snake.mass > 20) {
        snake.speed = BOOST_SPEED;
        snake.boostCounter += 1;

        if (snake.boostCounter % 4 === 0) {
          snake.mass = Math.max(15, snake.mass - 0.4);
          if (snake.segments.length > 2) {
            const tail = snake.segments[snake.segments.length - 1];
            const droppedOrb = createOrb(tail.x + (Math.random() - 0.5) * 8, tail.y + (Math.random() - 0.5) * 8, 1, snake.skin.boostTrail);
            state.orbs.push(droppedOrb);
            if (currentMode === 'online' && snake.isPlayer) {
              socketClient.send({ type: 'spawn_orbs', orbs: [droppedOrb] });
            }
          }
          if (snake.isPlayer && snake.boostCounter % 16 === 0) {
            soundEngine.playBoostBurst();
          }
        }

        if (Math.random() < 0.6) {
          state.particles.push({
            x: snake.x - Math.cos(snake.angle) * snake.radius,
            y: snake.y - Math.sin(snake.angle) * snake.radius,
            vx: -Math.cos(snake.angle) * 2 + (Math.random() - 0.5) * 2,
            vy: -Math.sin(snake.angle) * 2 + (Math.random() - 0.5) * 2,
            color: snake.skin.boostTrail || snake.skin.accent,
            radius: Math.random() * 3 + 1.5,
            alpha: 1,
            life: 18,
          });
        }
      } else {
        snake.speed = BASE_SPEED;
        snake.isBoosting = false;
      }

      let diff = snake.targetAngle - snake.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const turnStep = Math.min(Math.abs(diff), snake.turnSpeed);
      snake.angle += Math.sign(diff) * turnStep;

      snake.x += Math.cos(snake.angle) * snake.speed;
      snake.y += Math.sin(snake.angle) * snake.speed;

      snake.radius = 12 + Math.sqrt(snake.mass) * 0.45;
      const targetLength = Math.floor(16 + Math.sqrt(snake.mass) * 3.5);

      const head = { x: snake.x, y: snake.y, r: snake.radius };
      if (!snake.segments.length) {
        snake.segments.push(head);
      } else {
        let prev = head;
        for (let i = 0; i < snake.segments.length; i++) {
          const seg = snake.segments[i];
          const segDx = prev.x - seg.x;
          const segDy = prev.y - seg.y;
          const dist = Math.hypot(segDx, segDy);
          const requiredDist = SEGMENT_SPACING;

          if (dist > requiredDist) {
            const angle = Math.atan2(segDy, segDx);
            seg.x = prev.x - Math.cos(angle) * requiredDist;
            seg.y = prev.y - Math.sin(angle) * requiredDist;
          }

          const taper = 1 - (i / snake.segments.length) * 0.45;
          seg.r = Math.max(snake.radius * taper, 5);
          prev = seg;
        }

        if (snake.segments.length < targetLength) {
          const last = snake.segments[snake.segments.length - 1];
          snake.segments.push({ x: last.x, y: last.y, r: last.r });
        } else if (snake.segments.length > targetLength) {
          snake.segments.pop();
        }
      }

      const distFromCenter = Math.hypot(snake.x, snake.y);
      if (distFromCenter > ARENA_RADIUS - snake.radius) {
        if (distFromCenter > ARENA_RADIUS + 40 && snake.immunity <= 0) {
          killSnake(snake, null, 'Arena Barrier');
        } else {
          const pushAngle = Math.atan2(snake.y, snake.x);
          snake.x = Math.cos(pushAngle) * (ARENA_RADIUS - snake.radius);
          snake.y = Math.sin(pushAngle) * (ARENA_RADIUS - snake.radius);
          snake.targetAngle = pushAngle + Math.PI;

          for (let p = 0; p < 4; p++) {
            state.particles.push({
              x: snake.x,
              y: snake.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: '#38bdf8',
              radius: Math.random() * 3 + 2,
              alpha: 1,
              life: 15,
            });
          }
        }
      }
    });

    // F. Eat Orbs
    state.snakes.forEach((snake) => {
      if (!snake.alive) return;
      const eatDistance = snake.radius + 8;
      const magnetDistance = snake.radius + 50;

      for (let i = state.orbs.length - 1; i >= 0; i--) {
        const orb = state.orbs[i];
        const dx = snake.x - orb.x;
        const dy = snake.y - orb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < magnetDistance && dist > eatDistance) {
          orb.x += (dx / dist) * 7.5;
          orb.y += (dy / dist) * 7.5;
        }

        if (dist < eatDistance + orb.radius) {
          snake.mass += orb.value * 0.95;
          if (snake.isPlayer) {
            soundEngine.playEat(orb.value);
            if (currentMode === 'online') {
              socketClient.sendOrbEaten(orb.id);
            }
          }
          state.orbs.splice(i, 1);
        }
      }
    });

    if (state.orbs.length < INITIAL_ORBS) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * (ARENA_RADIUS - 60);
      state.orbs.push(createOrb(Math.cos(angle) * dist, Math.sin(angle) * dist));
    }

    // G. Snake Collision Detection
    // Combine local snakes and remote online snakes for full collision check
    const allActiveSnakes = [...state.snakes];
    if (currentMode === 'online') {
      state.remoteSnakes.forEach((r) => {
        if (r.alive) allActiveSnakes.push(r);
      });
    }

    for (let i = 0; i < state.snakes.length; i++) {
      const snakeA = state.snakes[i];
      if (!snakeA.alive || snakeA.immunity > 0) continue;

      for (let j = 0; j < allActiveSnakes.length; j++) {
        const snakeB = allActiveSnakes[j];
        if (snakeA.id === snakeB.id || !snakeB.alive) continue;

        let collisionOccurred = false;
        for (let s = 2; s < snakeB.segments.length; s++) {
          const seg = snakeB.segments[s];
          const dist = Math.hypot(snakeA.x - seg.x, snakeA.y - seg.y);
          if (dist < (snakeA.radius + seg.r) * 0.88) {
            killSnake(snakeA, snakeB);
            if (currentMode === 'online') {
              socketClient.sendSnakeKilled(snakeA.id, snakeA.name, snakeB.id, snakeB.name);
            }
            collisionOccurred = true;
            break;
          }
        }
        if (collisionOccurred) break;

        const headDist = Math.hypot(snakeA.x - snakeB.x, snakeA.y - snakeB.y);
        if (headDist < snakeA.radius + snakeB.radius) {
          if (snakeB.immunity > 0) continue;
          if (snakeA.mass > snakeB.mass * 1.15) {
            killSnake(snakeB, snakeA);
          } else if (snakeB.mass > snakeA.mass * 1.15) {
            killSnake(snakeA, snakeB);
          } else {
            killSnake(snakeA, snakeB);
            killSnake(snakeB, snakeA);
          }
          break;
        }
      }
    }

    // H. Respawn bots
    state.snakes.forEach((snake, idx) => {
      if (!snake.isPlayer && !snake.alive) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 600 + Math.random() * (ARENA_RADIUS - 800);
        const skinKeys = ['cyber-matrix', 'solar-dragon', 'vaporwave-neon', 'toxic-acid', 'cosmic-void', 'rainbow-prism', 'glacial-frost', 'golden-emperor'];
        const newBot = createSnake(
          `bot-${idx}-${Date.now()}`,
          snake.name,
          skinKeys[Math.floor(Math.random() * skinKeys.length)],
          false,
          0,
          Math.cos(angle) * dist,
          Math.sin(angle) * dist
        );
        newBot.mass = Math.floor(INITIAL_MASS + Math.random() * 80);
        state.snakes[idx] = newBot;
      }
    });

    // I. Particles
    for (let p = state.particles.length - 1; p >= 0; p--) {
      const pt = state.particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.95;
      pt.vy *= 0.95;
      pt.life -= 1;
      pt.alpha = Math.max(0, pt.life / 20);
      if (pt.life <= 0) {
        state.particles.splice(p, 1);
      }
    }

    // J. Camera Tracking
    updateCamera(viewWidth, viewHeight);

    // K. Periodic stats sync
    state.frameCount++;
    if (state.frameCount % 10 === 0) {
      syncStatsAndLeaderboard();
    }
  };

  // Bot AI
  const updateBotAI = (bot, state) => {
    bot.ai.decisionTimer--;

    const distCenter = Math.hypot(bot.x, bot.y);
    if (distCenter > ARENA_RADIUS - 350) {
      bot.targetAngle = Math.atan2(-bot.y, -bot.x);
      bot.isBoosting = false;
      return;
    }

    const lookaheadDist = bot.radius * 3.5 + (bot.isBoosting ? 60 : 30);
    const feelerX = bot.x + Math.cos(bot.angle) * lookaheadDist;
    const feelerY = bot.y + Math.sin(bot.angle) * lookaheadDist;

    for (const other of state.snakes) {
      if (other.id === bot.id || !other.alive) continue;
      for (let s = 1; s < other.segments.length; s += 2) {
        const seg = other.segments[s];
        const dist = Math.hypot(feelerX - seg.x, feelerY - seg.y);
        if (dist < bot.radius + seg.r + 35) {
          const threatAngle = Math.atan2(seg.y - bot.y, seg.x - bot.x);
          bot.targetAngle = threatAngle + Math.PI * 0.75;
          bot.isBoosting = bot.mass > 60;
          bot.ai.decisionTimer = 18;
          return;
        }
      }
    }

    if (bot.ai.decisionTimer <= 0) {
      bot.ai.decisionTimer = Math.floor(Math.random() * 30) + 20;

      let bestOrb = null;
      let minOrbDist = 420;

      for (let i = 0; i < Math.min(state.orbs.length, 120); i++) {
        const orb = state.orbs[i];
        const d = Math.hypot(orb.x - bot.x, orb.y - bot.y);
        if (d < minOrbDist) {
          minOrbDist = d;
          bestOrb = orb;
        }
      }

      if (bestOrb) {
        bot.targetAngle = Math.atan2(bestOrb.y - bot.y, bestOrb.x - bot.x);
        bot.isBoosting = bestOrb.value > 5 && Math.random() < 0.35 && bot.mass > 50;
      } else {
        bot.targetAngle += (Math.random() - 0.5) * 1.2;
        bot.isBoosting = false;
      }
    }
  };

  // Elimination handler
  const killSnake = (victim, killer, reason = '') => {
    if (!victim.alive) return;
    victim.alive = false;

    const state = gameStateRef.current;

    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      state.particles.push({
        x: victim.x,
        y: victim.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: victim.skin?.primary || '#f43f5e',
        radius: Math.random() * 5 + 2.5,
        alpha: 1,
        life: 25,
      });
    }

    const newOrbs = [];
    const orbStep = Math.max(1, Math.floor(victim.segments.length / 28));
    for (let s = 0; s < victim.segments.length; s += orbStep) {
      const seg = victim.segments[s];
      const massVal = Math.max(3, Math.floor(victim.mass / 25));
      const orb = createOrb(
        seg.x + (Math.random() - 0.5) * 12,
        seg.y + (Math.random() - 0.5) * 12,
        massVal,
        victim.skin?.accent || '#facc15'
      );
      state.orbs.push(orb);
      newOrbs.push(orb);
    }

    if (modeRef.current === 'online' && newOrbs.length > 0) {
      socketClient.send({ type: 'spawn_orbs', orbs: newOrbs });
    }

    soundEngine.playExplosion(victim.isPlayer);

    if (killer && killer.alive) {
      killer.kills += 1;
      killer.mass += Math.floor(victim.mass * 0.25);
      if (killer.isPlayer) {
        soundEngine.playKillFanfare();
      }
    }

    const killerName = killer ? killer.name : reason || 'The Abyss';

    setKillBanner({
      id: Date.now(),
      killer: killerName,
      victim: victim.name,
      isPlayerInvolved: victim.isPlayer || (killer && killer.isPlayer),
    });

    setTimeout(() => {
      setKillBanner((cur) => (cur && Date.now() - cur.id > 2800 ? null : cur));
    }, 3000);

    if (victim.isPlayer) {
      const currentMode = modeRef.current;
      if (currentMode === 'solo' || currentMode === 'online' || !state.snakes.some((s) => s.isPlayer && s.alive)) {
        setTimeout(() => {
          if (onGameOverRef.current) {
            onGameOverRef.current({
              name: victim.name,
              finalMass: Math.floor(victim.mass),
              kills: victim.kills,
              rank: getLeaderboardRank(victim.id),
              playerIndex: victim.playerIndex,
            });
          }
        }, 1200);
      }
    }
  };

  const getLeaderboardRank = (snakeId) => {
    const all = [...gameStateRef.current.snakes];
    if (modeRef.current === 'online') {
      gameStateRef.current.remoteSnakes.forEach((r) => all.push(r));
    }
    const sorted = all.sort((a, b) => b.mass - a.mass);
    const idx = sorted.findIndex((s) => s.id === snakeId);
    return idx >= 0 ? idx + 1 : 1;
  };

  // Camera tracking
  const updateCamera = (viewWidth, viewHeight) => {
    const state = gameStateRef.current;
    const cam = state.camera;
    const currentMode = modeRef.current;

    if (currentMode === 'solo' || currentMode === 'online') {
      const p1 = state.snakes.find((s) => s.id === 'player-1');
      if (p1 && p1.alive) {
        cam.x += (p1.x - cam.x) * 0.08;
        cam.y += (p1.y - cam.y) * 0.08;
        const targetZoom = Math.max(0.5, 1.05 - Math.sqrt(p1.mass) * 0.015);
        cam.zoom += (targetZoom - cam.zoom) * 0.05;
      }
    } else {
      const p1 = state.snakes.find((s) => s.id === 'player-1');
      const p2 = state.snakes.find((s) => s.id === 'player-2');

      if (p1?.alive && p2?.alive) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        cam.x += (midX - cam.x) * 0.08;
        cam.y += (midY - cam.y) * 0.08;

        const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const desiredZoom = Math.min(1.0, Math.max(0.4, (viewWidth * 0.45) / Math.max(distance, 400)));
        cam.zoom += (desiredZoom - cam.zoom) * 0.05;
      } else if (p1?.alive) {
        cam.x += (p1.x - cam.x) * 0.08;
        cam.y += (p1.y - cam.y) * 0.08;
      } else if (p2?.alive) {
        cam.x += (p2.x - cam.x) * 0.08;
        cam.y += (p2.y - cam.y) * 0.08;
      }
    }

    if (isNaN(cam.x)) cam.x = 0;
    if (isNaN(cam.y)) cam.y = 0;
    if (isNaN(cam.zoom) || cam.zoom <= 0) cam.zoom = 1;
  };

  // Stats Sync
  const syncStatsAndLeaderboard = () => {
    const state = gameStateRef.current;
    const all = [...state.snakes];
    if (modeRef.current === 'online') {
      state.remoteSnakes.forEach((r) => {
        if (r.alive) all.push(r);
      });
    }

    const sorted = all
      .filter((s) => s.alive)
      .sort((a, b) => b.mass - a.mass);

    if (sorted.length > 0) {
      state.crownSnakeId = sorted[0].id;
    }

    setLeaderboard(sorted.slice(0, 10));

    const p1 = state.snakes.find((s) => s.id === 'player-1');
    const p2 = state.snakes.find((s) => s.id === 'player-2');

    const p1Rank = p1 ? sorted.findIndex((s) => s.id === p1.id) + 1 : 0;
    const p2Rank = p2 ? sorted.findIndex((s) => s.id === p2.id) + 1 : 0;

    const stats = {
      p1Mass: p1 ? Math.floor(p1.mass) : 0,
      p1Kills: p1 ? p1.kills : 0,
      p1Rank: p1Rank || 99,
      p2Mass: p2 ? Math.floor(p2.mass) : 0,
      p2Kills: p2 ? p2.kills : 0,
      p2Rank: p2Rank || 99,
      totalAlive: sorted.length,
      remoteCount: state.remoteSnakes.size,
    };

    setHudStats(stats);
    if (onStatsUpdateRef.current) {
      onStatsUpdateRef.current(stats);
    }
  };

  // --- RENDER GRAPHICS ---
  const renderGraphics = (ctx, width, height, dpr) => {
    const state = gameStateRef.current;
    const cam = state.camera;

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#070b19';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    drawGrid(ctx, cam.x, cam.y, width / cam.zoom, height / cam.zoom);
    drawBoundary(ctx);
    drawOrbs(ctx, cam.x, cam.y, width / cam.zoom, height / cam.zoom);
    drawParticles(ctx);
    drawSnakes(ctx);

    ctx.restore();

    if (modeRef.current === 'versus') {
      drawVersusCompass(ctx, width, height);
    }

    drawMinimap(ctx, width, height);

    ctx.restore();
  };

  // High-contrast Cyber Grid Floor
  const drawGrid = (ctx, cx, cy, viewW, viewH) => {
    const gridSize = 140;
    const startX = Math.floor((cx - viewW / 2) / gridSize) * gridSize;
    const endX = Math.ceil((cx + viewW / 2) / gridSize) * gridSize;
    const startY = Math.floor((cy - viewH / 2) / gridSize) * gridSize;
    const endY = Math.ceil((cy + viewH / 2) / gridSize) * gridSize;

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)';

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
  };

  // Arena Boundary Forcefield
  const drawBoundary = (ctx) => {
    const now = performance.now() * 0.002;
    ctx.save();

    ctx.beginPath();
    ctx.arc(0, 0, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.lineWidth = 4 + Math.sin(now * 3) * 1.5;
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 24;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, ARENA_RADIUS - 60, 0, Math.PI * 2);
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -now * 30;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.stroke();

    ctx.restore();
  };

  // Render Orbs
  const drawOrbs = (ctx, cx, cy, viewW, viewH) => {
    const halfW = viewW / 2 + 100;
    const halfH = viewH / 2 + 100;
    const state = gameStateRef.current;

    for (const orb of state.orbs) {
      if (Math.abs(orb.x - cx) > halfW || Math.abs(orb.y - cy) > halfH) continue;

      orb.pulse += orb.pulseSpeed;
      const pulseScale = 1 + Math.sin(orb.pulse) * 0.18;
      const r = orb.radius * pulseScale;

      ctx.save();
      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 2.2);
      grad.addColorStop(0, orb.color);
      grad.addColorStop(0.5, orb.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(orb.x - r * 0.25, orb.y - r * 0.25, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };

  // Render Particles
  const drawParticles = (ctx) => {
    const state = gameStateRef.current;
    for (const pt of state.particles) {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // Render Snakes
  const drawSnakes = (ctx) => {
    const state = gameStateRef.current;
    const allToRender = [...state.snakes];
    if (modeRef.current === 'online') {
      state.remoteSnakes.forEach((r) => {
        if (r.alive) allToRender.push(r);
      });
    }

    allToRender.forEach((snake) => {
      if (!snake.alive) return;
      const skin = snake.skin || getSkinById('cyber-matrix');
      const isCrown = state.crownSnakeId === snake.id;

      // 1. Draw Body Segments
      for (let i = snake.segments.length - 1; i >= 0; i--) {
        const seg = snake.segments[i];
        const isAlternate = i % 2 === 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, seg.r, 0, Math.PI * 2);
        ctx.fillStyle = isAlternate ? skin.primary : skin.secondary;

        if (snake.isBoosting) {
          ctx.shadowColor = skin.boostTrail || skin.accent;
          ctx.shadowBlur = 14;
        }

        ctx.fill();

        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, seg.r * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = skin.accent;
          ctx.fill();
        }

        ctx.restore();
      }

      // 2. Draw Head
      ctx.save();
      ctx.translate(snake.x, snake.y);
      ctx.rotate(snake.angle);

      ctx.beginPath();
      ctx.ellipse(0, 0, snake.radius * 1.15, snake.radius * 0.95, 0, 0, Math.PI * 2);
      ctx.fillStyle = skin.primary;
      ctx.shadowColor = skin.glow;
      ctx.shadowBlur = snake.isBoosting ? 26 : 14;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(-snake.radius * 0.2, 0, snake.radius * 0.6, snake.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = skin.accent;
      ctx.fill();

      // Eyes
      const eyeOffsetX = snake.radius * 0.45;
      const eyeOffsetY = snake.radius * 0.48;
      const eyeR = snake.radius * 0.32;
      const pupilR = eyeR * 0.55;

      ctx.beginPath();
      ctx.arc(eyeOffsetX, -eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = skin.eyeColor || '#ffffff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeOffsetX + eyeR * 0.3, -eyeOffsetY, pupilR, 0, Math.PI * 2);
      ctx.fillStyle = skin.pupilColor || '#020617';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeOffsetX, eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = skin.eyeColor || '#ffffff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeOffsetX + eyeR * 0.3, eyeOffsetY, pupilR, 0, Math.PI * 2);
      ctx.fillStyle = skin.pupilColor || '#020617';
      ctx.fill();

      // Tongue
      const tongueCycle = (state.frameCount + snake.id.length * 10) % 75;
      if (tongueCycle < 15) {
        ctx.strokeStyle = skin.tongueColor || '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const tongueLen = snake.radius * 1.5;
        ctx.moveTo(snake.radius * 1.05, 0);
        ctx.lineTo(tongueLen, 0);
        ctx.lineTo(tongueLen + 5, -3);
        ctx.moveTo(tongueLen, 0);
        ctx.lineTo(tongueLen + 5, 3);
        ctx.stroke();
      }

      // Golden Crown if #1
      if (isCrown) {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        const crownBase = -snake.radius * 0.7;
        const cw = snake.radius * 0.9;
        ctx.moveTo(crownBase - cw, -snake.radius * 0.6);
        ctx.lineTo(crownBase - cw * 0.5, -snake.radius * 1.3);
        ctx.lineTo(crownBase, -snake.radius * 0.85);
        ctx.lineTo(crownBase + cw * 0.5, -snake.radius * 1.3);
        ctx.lineTo(crownBase + cw, -snake.radius * 0.6);
        ctx.closePath();
        ctx.fill();
      }

      // Pulsing Spawn Shield Ring
      if (snake.immunity > 0) {
        const shieldPulse = (Math.sin(performance.now() * 0.01) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, snake.radius * 1.8 + shieldPulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();

      // Name Tag
      ctx.save();
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      const nameTagColor = snake.isPlayer
        ? snake.playerIndex === 1
          ? '#38bdf8'
          : '#f43f5e'
        : snake.isRemote
        ? '#34d399' // Emerald green for online remote players
        : '#e2e8f0';

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      const textWidth = ctx.measureText(snake.name).width;
      ctx.fillRect(snake.x - textWidth / 2 - 6, snake.y - snake.radius - 22, textWidth + 12, 16);

      ctx.fillStyle = nameTagColor;
      ctx.fillText(snake.name, snake.x, snake.y - snake.radius - 10);

      if (snake.isPlayer && snake.immunity > 0) {
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('SHIELD ACTIVE', snake.x, snake.y - snake.radius - 26);
      } else if (snake.isRemote) {
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillStyle = '#10b981';
        ctx.fillText('ONLINE', snake.x, snake.y - snake.radius - 26);
      }

      ctx.restore();
    });
  };

  // Versus Mode Direction Compass
  const drawVersusCompass = (ctx, viewW, viewH) => {
    const state = gameStateRef.current;
    const p1 = state.snakes.find((s) => s.id === 'player-1');
    const p2 = state.snakes.find((s) => s.id === 'player-2');

    if (!p1?.alive || !p2?.alive) return;

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const dist = Math.floor(Math.hypot(p2.x - p1.x, p2.y - p1.y));

    ctx.save();
    ctx.translate(viewW / 2, 80);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(-80, -18, 160, 36);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(-50, 0);
    ctx.rotate(angle);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'left';
    ctx.fillText(`P2: ${dist}m`, -30, 4);

    ctx.restore();
  };

  // Radar Minimap
  const drawMinimap = (ctx, viewW, viewH) => {
    const state = gameStateRef.current;
    const mapSize = 140;
    const mapPadding = 20;
    const mapX = viewW - mapSize - mapPadding;
    const mapY = viewH - mapSize - mapPadding;
    const mapRadius = mapSize / 2;
    const mapCenterX = mapX + mapRadius;
    const mapCenterY = mapY + mapRadius;
    const scale = mapRadius / ARENA_RADIUS;

    ctx.save();

    ctx.beginPath();
    ctx.arc(mapCenterX, mapCenterY, mapRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.stroke();
    ctx.clip();

    const sweepAngle = (performance.now() * 0.002) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(mapCenterX, mapCenterY);
    ctx.lineTo(mapCenterX + Math.cos(sweepAngle) * mapRadius, mapCenterY + Math.sin(sweepAngle) * mapRadius);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const allDots = [...state.snakes];
    if (modeRef.current === 'online') {
      state.remoteSnakes.forEach((r) => {
        if (r.alive) allDots.push(r);
      });
    }

    allDots.forEach((snake) => {
      if (!snake.alive) return;
      const dotX = mapCenterX + snake.x * scale;
      const dotY = mapCenterY + snake.y * scale;

      ctx.beginPath();
      if (snake.isPlayer) {
        const isP1 = snake.playerIndex === 1;
        ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isP1 ? '#38bdf8' : '#f43f5e';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fill();
      } else if (snake.isRemote) {
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 6;
        ctx.fill();
      } else if (state.crownSnakeId === snake.id) {
        ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      } else {
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.fill();
      }
    });

    ctx.restore();
  };

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full select-none overflow-hidden bg-[#070b19]">
      {/* HTML5 Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* --- HUD OVERLAYS --- */}

      {/* Top Left: Player Stats Card */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="glass-panel px-4 py-2.5 flex items-center gap-4 border-cyan-500/30 bg-slate-900/80 shadow-lg">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <div>
            <div className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-2">
              <span>{player1Config.name || 'PLAYER 1'}</span>
              {mode === 'online' && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  socketStatus.status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : socketStatus.status === 'cross_tab'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {socketStatus.status === 'connected' ? `ONLINE (${socketStatus.ping}ms)` : socketStatus.status === 'cross_tab' ? 'CROSS-TAB P2P' : 'CONNECTING...'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-extrabold text-white">
                Mass: <span className="text-cyan-400">{hudStats.p1Mass}</span>
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold text-slate-300">
                Kills: <span className="text-amber-400">{hudStats.p1Kills}</span>
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold text-slate-300">
                Rank: <span className="text-emerald-400">#{hudStats.p1Rank}</span>
              </span>
            </div>
          </div>
        </div>

        {mode === 'versus' && (
          <div className="glass-panel px-4 py-2.5 flex items-center gap-4 border-pink-500/30 bg-slate-900/80 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899]" />
            <div>
              <div className="text-xs font-bold text-pink-300 tracking-wider">
                {player2Config.name || 'PLAYER 2'}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-extrabold text-white">
                  Mass: <span className="text-pink-400">{hudStats.p2Mass}</span>
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-slate-300">
                  Kills: <span className="text-amber-400">{hudStats.p2Kills}</span>
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-slate-300">
                  Rank: <span className="text-emerald-400">#{hudStats.p2Rank}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Center: Kill Banner Toast */}
      {killBanner && (
        <div className="absolute top-5 inset-x-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="glass-panel px-5 py-2 border-amber-500/40 bg-slate-950/85 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2.5">
            <span className="text-amber-400 font-black text-sm">⚡</span>
            <span className="text-white text-sm font-bold">
              <span className="text-cyan-400 font-extrabold">{killBanner.killer}</span> eliminated{' '}
              <span className="text-rose-400 font-extrabold">{killBanner.victim}</span>!
            </span>
          </div>
        </div>
      )}

      {/* Top Right: Live Leaderboard */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none w-56 sm:w-64 glass-panel p-3 border-indigo-500/30 bg-slate-900/80 shadow-xl">
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10 text-xs font-black uppercase tracking-wider text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">👑</span> ARENA LEADERS
          </span>
          <span className="text-[10px] text-slate-400">{hudStats.totalAlive} Snakes</span>
        </div>

        <div className="space-y-1 text-xs">
          {leaderboard.map((snake, idx) => {
            const isP1 = snake.id === 'player-1';
            const isP2 = snake.id === 'player-2';
            const isRemote = snake.isRemote;
            return (
              <div
                key={snake.id}
                className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                  isP1
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : isP2
                    ? 'bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40'
                    : isRemote
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 text-slate-500 font-mono text-[10px]">{idx + 1}.</span>
                  <span className="truncate">{snake.name}</span>
                  {isRemote && <span className="text-[8px] bg-emerald-500/30 text-emerald-400 px-1 rounded">LIVE</span>}
                </div>
                <span className="font-mono text-slate-400 ml-2">{Math.floor(snake.mass)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Left: Controls Quick Reminder */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 glass-panel px-3 py-1.5 text-xs text-slate-400 bg-slate-900/70 border-white/10">
        <span className="text-indigo-400 font-bold">Turbo Boost:</span>
        {mode === 'solo' || mode === 'online' ? (
          <span>Left Mouse / Space / Shift</span>
        ) : (
          <span>P1: Space | P2: Enter</span>
        )}
      </div>
    </div>
  );
}
