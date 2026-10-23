import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize2,
  FiMinimize2,
  FiRotateCcw,
  FiUsers,
  FiUser,
  FiAward,
  FiZap,
  FiHelpCircle,
  FiX,
  FiTarget,
  FiArrowRight,
  FiRefreshCw,
  FiGlobe,
  FiCopy,
  FiCheck,
  FiWifi,
  FiServer
} from 'react-icons/fi';
import SnakeCanvas from '../components/snake/SnakeCanvas';
import { SNAKE_SKINS } from '../components/snake/skins';
import { soundEngine } from '../components/snake/audio';

const STORAGE_KEY_HIGH_SCORE = 'nexus_snake_arena_high_score';
const STORAGE_KEY_P1_NAME = 'nexus_snake_arena_p1_name';
const STORAGE_KEY_P1_SKIN = 'nexus_snake_arena_p1_skin';

// Mini canvas preview component for snake skins
const SnakeSkinPreview = ({ skin, isSelected, onClick }) => {
  const previewCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let t = 0;

    const render = () => {
      t += 0.04;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const segments = 12;
      const radius = 6.5;

      for (let i = segments; i >= 0; i--) {
        const x = w * 0.2 + i * 7.5;
        const y = h * 0.5 + Math.sin(t + i * 0.45) * 9;
        ctx.beginPath();
        ctx.arc(x, y, radius * (1 - i * 0.03), 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? skin.primary : skin.secondary;
        ctx.fill();

        if (i === 0) {
          // Head
          ctx.beginPath();
          ctx.arc(x + 4, y, radius * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = skin.primary;
          ctx.fill();

          // Eye
          ctx.beginPath();
          ctx.arc(x + 5, y - 2.5, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [skin]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between group overflow-hidden ${
        isSelected
          ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.02]'
          : 'bg-slate-900/60 border-white/10 hover:border-white/30 hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
          {skin.name}
        </span>
        <span
          className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
          style={{ backgroundColor: `${skin.primary}25`, color: skin.accent }}
        >
          {skin.tag}
        </span>
      </div>

      <div className="w-full h-14 my-1 flex items-center justify-center bg-slate-950/60 rounded-xl border border-white/5 overflow-hidden">
        <canvas ref={previewCanvasRef} width={130} height={50} className="w-full h-full" />
      </div>

      <p className="text-[11px] text-slate-400 leading-snug line-clamp-1">{skin.description}</p>
    </button>
  );
};

export default function SnakeArena() {
  const [searchParams] = useSearchParams();

  // Game Modes: 'solo' | 'versus' | 'online'
  const [mode, setMode] = useState(() => (searchParams.get('room') ? 'online' : 'solo'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Online Multiplayer State
  const [roomCode, setRoomCode] = useState(() => searchParams.get('room')?.toUpperCase() || 'GLOBAL');
  const [socketUrl, setSocketUrl] = useState('ws://localhost:8080');
  const [socketStatus, setSocketStatus] = useState({ status: 'checking', ping: 0 });
  const [copiedLink, setCopiedLink] = useState(false);

  // Player 1 Config
  const [p1Name, setP1Name] = useState(() => localStorage.getItem(STORAGE_KEY_P1_NAME) || 'CyberViper');
  const [p1SkinId, setP1SkinId] = useState(() => localStorage.getItem(STORAGE_KEY_P1_SKIN) || 'cyber-matrix');

  // Player 2 Config (for Local 2-Player Versus)
  const [p2Name, setP2Name] = useState('DragonRider');
  const [p2SkinId, setP2SkinId] = useState('solar-dragon');

  // Game Over Modal State
  const [gameOverData, setGameOverData] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEY_HIGH_SCORE) || '0', 10);
  });
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const gameContainerRef = useRef(null);

  // Test socket status on mount / lobby visit
  useEffect(() => {
    let testWs = null;
    try {
      testWs = new WebSocket(socketUrl);
      testWs.onopen = () => {
        setSocketStatus({ status: 'connected', ping: 5 });
        testWs.close();
      };
      testWs.onerror = () => {
        setSocketStatus({ status: 'cross_tab', ping: 1 });
      };
    } catch (_) {
      setSocketStatus({ status: 'cross_tab', ping: 1 });
    }
    return () => {
      try { testWs?.close(); } catch (_) {}
    };
  }, [socketUrl]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_P1_NAME, p1Name);
    localStorage.setItem(STORAGE_KEY_P1_SKIN, p1SkinId);
  }, [p1Name, p1SkinId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const elem = gameContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle Game Over
  const handleGameOver = (stats) => {
    setGameOverData(stats);
    if (stats.finalMass > highScore) {
      setHighScore(stats.finalMass);
      localStorage.setItem(STORAGE_KEY_HIGH_SCORE, stats.finalMass.toString());
      setIsNewHighScore(true);
    } else {
      setIsNewHighScore(false);
    }
  };

  const handleStartGame = () => {
    soundEngine.ensureContext();
    setIsPlaying(true);
    setIsPaused(false);
    setGameOverData(null);
  };

  const handleRestartGame = () => {
    setGameOverData(null);
    setIsPlaying(false);
    setTimeout(() => {
      handleStartGame();
    }, 50);
  };

  const randomizeP1Name = () => {
    const prefixes = ['Neon', 'Hyper', 'Shadow', 'Apex', 'Cyber', 'Quantum', 'Glitch', 'Turbo', 'Draco', 'Ultra'];
    const suffixes = ['Viper', 'Cobra', 'Python', 'Specter', 'Striker', 'Titan', 'Fang', 'Pulse', 'Zero', 'Glow'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    setP1Name(`${p}${s}`);
  };

  const generateRandomRoom = () => {
    const code = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(code);
  };

  const copyRoomInvite = () => {
    const url = `${window.location.origin}/snake-arena?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center relative"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <FiZap className="animate-pulse" />
          REAL-TIME WEBSOCKET SNAKE ARENA
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500 neon-text">
            SNAKE ARENA
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-2">
          Slither in a high-octane 360° battle arena. Gobble radiant energy crystals, boost to cut off rival serpents, and battle in real-time online rooms or local 2-player!
        </p>

        {highScore > 0 && (
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
            <FiAward className="text-amber-400" />
            Personal High Score: <span className="font-extrabold text-white">{highScore.toLocaleString()} Mass</span>
          </div>
        )}
      </motion.div>

      {/* ── Main Game Section ── */}
      <div
        ref={gameContainerRef}
        className={`relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-[100] rounded-none border-none'
            : 'w-full h-[600px] sm:h-[660px] md:h-[720px] lg:h-[780px]'
        }`}
      >
        {!isPlaying ? (
          /* ── LOBBY / CUSTOMIZER SCREEN ── */
          <div className="relative w-full h-full bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-6 md:p-10 overflow-y-auto">
            {/* Background glowing gradients */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/15 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
              {/* Game Mode Selector */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode('solo')}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                    mode === 'solo'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-400/40 scale-105'
                      : 'bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FiUser size={18} />
                  <span>Battle Arena (Solo vs 18 Bots)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('online')}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                    mode === 'online'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/40 scale-105'
                      : 'bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FiGlobe size={18} />
                  <span>Online Multiplayer (WebSockets)</span>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded font-black border border-emerald-400/30">
                    LIVE
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('versus')}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
                    mode === 'versus'
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] border border-pink-400/40 scale-105'
                      : 'bg-slate-900/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FiUsers size={18} />
                  <span>Local 2-Player (Same Keyboard)</span>
                </button>
              </div>

              {/* Online Room Configuration Card */}
              {mode === 'online' && (
                <div className="glass-panel p-5 border-emerald-500/30 bg-slate-900/70 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
                      <h3 className="font-bold text-base text-white">Online WebSocket Room Setup</h3>
                    </div>

                    {/* Socket status pill */}
                    <div className="flex items-center gap-2 text-xs">
                      {socketStatus.status === 'connected' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full font-bold">
                          <FiWifi />
                          <span>WebSocket Connected (ws://localhost:8080)</span>
                        </div>
                      ) : socketStatus.status === 'cross_tab' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-full font-bold">
                          <FiWifi />
                          <span>Cross-Tab P2P Active (Multi-Window)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full font-bold">
                          <FiServer />
                          <span>Connecting to Server...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Room Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Room Code (Enter same code to play together)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={roomCode}
                          maxLength={16}
                          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                          placeholder="e.g. GLOBAL or ARENA-1"
                        />
                        <button
                          type="button"
                          onClick={generateRandomRoom}
                          title="Generate Random Room Code"
                          className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-emerald-400 transition-colors text-xs font-bold"
                        >
                          Random Code
                        </button>
                        <button
                          type="button"
                          onClick={copyRoomInvite}
                          title="Copy Direct Room Link"
                          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
                        >
                          {copiedLink ? <FiCheck size={14} /> : <FiCopy size={14} />}
                          <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Server URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        WebSocket Server URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={socketUrl}
                          onChange={(e) => setSocketUrl(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-slate-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
                          placeholder="ws://localhost:8080"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const s = new WebSocket(socketUrl);
                              s.onopen = () => { setSocketStatus({ status: 'connected', ping: 3 }); s.close(); };
                              s.onerror = () => { setSocketStatus({ status: 'cross_tab', ping: 1 }); };
                            } catch (_) {}
                          }}
                          className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors text-xs font-bold"
                        >
                          Ping
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Player Configuration Panels */}
              <div className={`grid gap-8 ${mode === 'versus' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Player 1 Customizer */}
                <div className="glass-panel p-6 border-cyan-500/20 bg-slate-900/50 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                      <h3 className="font-bold text-base text-white">
                        {mode === 'online' ? 'Your Snake Profile' : 'Player 1 Setup'}
                      </h3>
                    </div>
                    <span className="text-xs text-cyan-300 font-mono">
                      {mode === 'versus' ? 'WASD + Space Boost' : 'Mouse / WASD + Space Boost'}
                    </span>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Snake Alias
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={p1Name}
                        maxLength={18}
                        onChange={(e) => setP1Name(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
                        placeholder="Enter name..."
                      />
                      <button
                        type="button"
                        onClick={randomizeP1Name}
                        title="Randomize Name"
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-cyan-400 transition-colors"
                      >
                        <FiRefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Skin Grid */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Choose Skin Theme
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {SNAKE_SKINS.map((skin) => (
                        <SnakeSkinPreview
                          key={skin.id}
                          skin={skin}
                          isSelected={p1SkinId === skin.id}
                          onClick={() => setP1SkinId(skin.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Player 2 Customizer (If Versus Mode) */}
                {mode === 'versus' && (
                  <div className="glass-panel p-6 border-pink-500/20 bg-slate-900/50 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899]" />
                        <h3 className="font-bold text-base text-white">Player 2 Setup</h3>
                      </div>
                      <span className="text-xs text-pink-300 font-mono">
                        Arrow Keys + Enter Boost
                      </span>
                    </div>

                    {/* Name Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Snake Alias
                      </label>
                      <input
                        type="text"
                        value={p2Name}
                        maxLength={18}
                        onChange={(e) => setP2Name(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500"
                        placeholder="Enter name..."
                      />
                    </div>

                    {/* Skin Grid */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">
                        Choose Skin Theme
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                        {SNAKE_SKINS.map((skin) => (
                          <SnakeSkinPreview
                            key={skin.id}
                            skin={skin}
                            isSelected={p2SkinId === skin.id}
                            onClick={() => setP2SkinId(skin.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-black text-base rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] hover:scale-105 flex items-center justify-center gap-3"
                >
                  <FiPlay size={22} className="fill-current" />
                  <span>{mode === 'online' ? `JOIN ${roomCode} ARENA` : 'ENTER THE ARENA'}</span>
                  <FiArrowRight size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowHowToPlay(true)}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  <FiHelpCircle size={18} />
                  <span>How to Play & Controls</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── ACTIVE CANVAS SCREEN ── */
          <div className="absolute inset-0 w-full h-full flex flex-col">
            {/* Top Canvas Action Bar */}
            <div className="absolute top-4 inset-x-0 z-40 flex justify-center pointer-events-none">
              <div className="glass-panel px-4 py-2 border-white/10 bg-slate-900/80 shadow-2xl flex items-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title={isPaused ? 'Resume Game' : 'Pause Game'}
                >
                  {isPaused ? <FiPlay size={18} /> : <FiPause size={18} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                  {isMuted ? <FiVolumeX size={18} className="text-rose-400" /> : <FiVolume2 size={18} />}
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
                </button>

                <button
                  type="button"
                  onClick={handleRestartGame}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title="Restart Match"
                >
                  <FiRotateCcw size={18} />
                </button>

                <div className="h-4 w-px bg-white/20" />

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setGameOverData(null);
                  }}
                  className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors"
                >
                  Exit Arena
                </button>
              </div>
            </div>

            {/* Pause Screen Overlay */}
            {isPaused && (
              <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
                <div className="glass-panel p-8 max-w-sm w-full text-center border-white/10 shadow-2xl space-y-6">
                  <h3 className="text-2xl font-black text-white">GAME PAUSED</h3>
                  <p className="text-sm text-slate-400">Take a breath, warrior. Your snake is frozen in place.</p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPaused(false)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg"
                    >
                      Resume Battle
                    </button>
                    <button
                      type="button"
                      onClick={handleRestartGame}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl border border-white/10"
                    >
                      Restart Match
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlaying(false)}
                      className="w-full py-2.5 text-rose-400 hover:bg-rose-500/10 font-semibold rounded-xl"
                    >
                      Exit to Lobby
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 60 FPS Snake Canvas */}
            <SnakeCanvas
              mode={mode}
              roomCode={roomCode}
              socketUrl={socketUrl}
              player1Config={{ name: p1Name, skinId: p1SkinId }}
              player2Config={{ name: p2Name, skinId: p2SkinId }}
              isPaused={isPaused}
              isMuted={isMuted}
              onGameOver={handleGameOver}
            />
          </div>
        )}

        {/* ── GAME OVER MODAL ── */}
        <AnimatePresence>
          {gameOverData && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-8 shadow-2xl text-center space-y-6"
              >
                {/* Header Badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                  <FiTarget size={32} />
                </div>

                <div>
                  <h2 className="text-3xl font-black text-white mb-1">
                    ELIMINATED!
                  </h2>
                  <p className="text-sm text-slate-400">
                    <span className="font-bold text-white">{gameOverData.name}</span> crashed into the fray.
                  </p>
                </div>

                {/* New High Score Alert */}
                {isNewHighScore && (
                  <div className="py-2 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide animate-pulse">
                    🏆 NEW PERSONAL HIGH SCORE ACHIEVED!
                  </div>
                )}

                {/* Match Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Final Mass</div>
                    <div className="text-xl font-black text-cyan-400 mt-1">{gameOverData.finalMass}</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Kills</div>
                    <div className="text-xl font-black text-amber-400 mt-1">{gameOverData.kills}</div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Rank</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">#{gameOverData.rank}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleRestartGame}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm rounded-xl shadow-lg transition-all"
                  >
                    PLAY AGAIN (SPACE)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameOverData(null);
                      setIsPlaying(false);
                    }}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm rounded-xl border border-white/10 transition-colors"
                  >
                    Change Skin / Lobby
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── HOW TO PLAY & ARENA GUIDE ── */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white">ARENA COMBAT MANUAL</h2>
          <p className="text-slate-400 text-sm mt-1">Master these pro tactics to conquer the leaderboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-cyan-500/20 bg-slate-900/40 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="font-bold text-base text-white">Scavenge Energy Orbs</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Navigate near radiant food crystals. Your magnetic aura pulls them in automatically, increasing your mass, length, and radius.
            </p>
          </div>

          <div className="glass-panel p-6 border-amber-500/20 bg-slate-900/40 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="font-bold text-base text-white">The Turbo Cut-Off Trap</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Activate Turbo Boost to sprint ahead of rivals and angle your body directly into their path. When their head hits your segments, they explode into huge bonus crystals!
            </p>
          </div>

          <div className="glass-panel p-6 border-emerald-500/20 bg-slate-900/40 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="font-bold text-base text-white">Real-Time Online Rooms</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create a custom room code or join GLOBAL. Share the invite link with friends on other tabs or devices to battle each other live over WebSockets!
            </p>
          </div>
        </div>
      </section>

      {/* ── CONTROLS MODAL ── */}
      <AnimatePresence>
        {showHowToPlay && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHowToPlay(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-slate-900 border border-white/15 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <FiX size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  <FiHelpCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Controls & Guidelines</h3>
                  <p className="text-xs text-slate-400">Everything you need to control your serpent</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
                  <div className="font-bold text-cyan-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Solo & Online Mode Controls
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li><strong className="text-white">Mouse:</strong> Point cursor in any 360° direction to steer</li>
                    <li><strong className="text-white">WASD or Arrow Keys:</strong> Alternative direction steering</li>
                    <li><strong className="text-white">Left Mouse / Space / Shift:</strong> Hold to activate Turbo Boost</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
                  <div className="font-bold text-pink-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    2-Player Local Dual Controls
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div>
                      <span className="font-bold text-white block mb-1">Player 1 (Cyan)</span>
                      <div>Steer: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">W A S D</kbd></div>
                      <div className="mt-1">Boost: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Space</kbd></div>
                    </div>
                    <div>
                      <span className="font-bold text-white block mb-1">Player 2 (Pink)</span>
                      <div>Steer: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Arrow Keys</kbd></div>
                      <div className="mt-1">Boost: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Enter / Numpad 0</kbd></div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Got It, Let's Play!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
