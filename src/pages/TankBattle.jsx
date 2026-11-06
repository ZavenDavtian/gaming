import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FiAward,
  FiHelpCircle,
  FiX,
  FiTarget,
  FiArrowRight,
  FiRefreshCw,
  FiGlobe,
  FiCopy,
  FiCheck,
  FiServer,
  FiShield,
  FiMessageSquare,
  FiSend,
} from 'react-icons/fi';
import TankCanvas from '../components/tank/TankCanvas';
import { TANK_CLASSES } from '../components/tank/tanks';
import { MAPS } from '../components/tank/maps';
import { tankAudio } from '../components/tank/tankAudio';
import { tankSocketClient } from '../components/tank/tankSocketClient';

const STORAGE_KEY_TANK_P1_NAME = 'nexus_tank_p1_name';
const STORAGE_KEY_TANK_P1_ID = 'nexus_tank_p1_id';

// Mini Canvas preview for each tank chassis and rotating turret
const TankClassCard = ({ tank, isSelected, onClick }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;
    let t = 0;

    const render = () => {
      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const hw = tank.hullWidth * 0.75;
      const hh = tank.hullHeight * 0.75;

      ctx.save();
      ctx.translate(cx, cy);

      // Chassis
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-hh / 2, -hw / 2 - 3, hh, 6);
      ctx.fillRect(-hh / 2, hw / 2 - 3, hh, 6);

      ctx.fillStyle = tank.secondaryColor;
      ctx.fillRect(-hh / 2 + 3, -hw / 2 + 2, hh - 6, hw - 4);

      ctx.fillStyle = tank.primaryColor;
      ctx.fillRect(-hh / 2 + 6, -hw / 2 + 4, hh - 12, hw - 8);

      // Turret rotating gently
      ctx.rotate(Math.sin(t) * 0.45);
      const bLen = tank.turretLength * 0.75;
      const bW = tank.turretWidth * 0.75;

      ctx.fillStyle = '#334155';
      if (tank.hasDualBarrels) {
        ctx.fillRect(0, -bW - 1, bLen, bW);
        ctx.fillRect(0, 1, bLen, bW);
      } else {
        ctx.fillRect(0, -bW / 2, bLen, bW);
      }

      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = tank.primaryColor;
      ctx.fill();
      ctx.strokeStyle = tank.accentColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [tank]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between group overflow-hidden ${
        isSelected
          ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.02]'
          : 'bg-slate-900/60 border-white/10 hover:border-white/30 hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
          {tank.name}
        </span>
        <span
          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider text-white bg-gradient-to-r ${tank.badgeColor}`}
        >
          {tank.badge}
        </span>
      </div>

      <div className="flex items-center gap-3 my-2">
        <div className="w-20 h-16 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
          <canvas ref={canvasRef} width={80} height={64} className="w-full h-full block" />
        </div>
        <div className="text-xs text-slate-300 space-y-1 flex-1">
          <div className="text-[11px] text-cyan-300 font-semibold">{tank.tagline}</div>
          <div className="text-[11px] text-slate-400 leading-tight line-clamp-2">{tank.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/10 text-[10px] text-slate-400 w-full">
        <div>
          HP: <span className="font-bold text-white">{tank.stats.health}</span>
        </div>
        <div>
          SPD: <span className="font-bold text-white">{tank.stats.speed}</span>
        </div>
        <div>
          DMG: <span className="font-bold text-white">{tank.stats.bulletDamage}</span>
        </div>
      </div>
    </button>
  );
};

export default function TankBattle() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation / Mode State
  const [mode, setMode] = useState('online'); // 'sp' | 'local2p' | 'online'
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundVolume] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Configuration
  const [selectedTankId, setSelectedTankId] = useState(
    () => localStorage.getItem(STORAGE_KEY_TANK_P1_ID) || 'cyber-titan'
  );
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem(STORAGE_KEY_TANK_P1_NAME) || 'Commander'
  );
  const [selectedMapId, setSelectedMapId] = useState('cyber-depot');

  // Single player bot config
  const [botCount, setBotCount] = useState(3);
  const [botDifficulty, setBotDifficulty] = useState('medium');

  // Online Multiplayer State
  const initialRoom = (searchParams.get('room') || '').trim().toUpperCase() || 'TANK-8421';
  const [roomCode, setRoomCode] = useState(initialRoom);
  const [socketUrl] = useState('ws://localhost:8081');
  const [copiedLink, setCopiedLink] = useState(false);
  const [socketStatus, setSocketStatus] = useState({ status: 'disconnected', ping: 0, isUsingBroadcast: false });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Memoized player configs to avoid unnecessary re-initializations
  const player1Config = useMemo(
    () => ({ name: playerName, tankId: selectedTankId }),
    [playerName, selectedTankId]
  );
  const player2Config = useMemo(
    () => ({ name: 'Player 2', tankId: 'neon-phantom' }),
    []
  );

  // Live in-game stats HUD
  const [gameStats, setGameStats] = useState({
    health: 140,
    maxHealth: 140,
    shield: 0,
    speedBoost: false,
    rapidFire: false,
    tripleShot: false,
    minesRemaining: 3,
    kills: 0,
    score: 0,
    gameOver: false,
  });

  const [gameOverResult, setGameOverResult] = useState(null);
  const containerRef = useRef(null);

  // Save preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TANK_P1_NAME, playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TANK_P1_ID, selectedTankId);
  }, [selectedTankId]);

  // Read URL invite room code if present
  useEffect(() => {
    const urlRoom = searchParams.get('room');
    if (urlRoom) {
      setRoomCode(urlRoom.toUpperCase());
      setMode('online');
    }
  }, [searchParams]);

  // Subscribe to chat incoming events when online
  useEffect(() => {
    const unsub = tankSocketClient.on('chat', (data) => {
      setChatMessages((prev) => [...prev.slice(-30), data]);
    });
    return () => unsub();
  }, []);

  const handleCopyInviteLink = () => {
    const url = `${window.location.origin}/tank-battle?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    tankSocketClient.sendChatMessage(msg, playerName);
    setChatMessages((prev) => [...prev.slice(-30), { sender: playerName, text: msg, time: Date.now() }]);
    setChatInput('');
  };

  const generateNewRoomCode = () => {
    const code = `TANK-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(code);
    setSearchParams({ room: code });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const handleStartGame = () => {
    setGameOverResult(null);
    setIsPaused(false);
    setIsPlaying(true);
    setTimeout(() => {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }, 50);
  };

  const handleResetGame = () => {
    setGameOverResult(null);
    setIsPaused(false);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 50);
  };

  return (
    <div ref={containerRef} className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-white/10 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              NEW MULTIPLAYER BATTLEFIELD
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white flex items-center gap-3">
              TANK <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-500">BATTLE</span>
            </h1>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
              Command customizable cybernetic battle tanks. Engage in intense tactical duels, bounce shells off steel walls, obliterate cover, deploy proximity mines, and invite friends live via real-time WebSockets!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white text-sm font-semibold transition-all shadow-md"
            >
              <FiHelpCircle />
              <span>Tactical Guide</span>
            </button>
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                tankAudio.setMuted(!isMuted);
              }}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all shadow-md"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <FiVolumeX className="text-rose-400" /> : <FiVolume2 className="text-cyan-400" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all shadow-md"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setMode('online');
              setIsPlaying(false);
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
              mode === 'online'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25 border-cyan-400'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-300'
            }`}
          >
            <FiGlobe />
            <span>Online Multiplayer (Invite Code)</span>
          </button>
          <button
            onClick={() => {
              setMode('sp');
              setIsPlaying(false);
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
              mode === 'sp'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-fuchsia-500/25 border-fuchsia-400'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-300'
            }`}
          >
            <FiTarget />
            <span>Single Player Skirmish (vs Bots)</span>
          </button>
          <button
            onClick={() => {
              setMode('local2p');
              setIsPlaying(false);
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
              mode === 'local2p'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/25 border-amber-400'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 text-slate-300'
            }`}
          >
            <FiUsers />
            <span>Local 2-Player (1 Keyboard)</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena / Staging Area */}
      {!isPlaying ? (
        <div className="space-y-8">
          {/* Online Match Setup Box (if Online mode selected) */}
          {mode === 'online' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                    <FiServer className="text-cyan-400" />
                    <span>Real-Time Invite Code & Matchmaking</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Share your custom invite code with a friend or open two browser tabs to duel instantly!
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                    {socketStatus.status === 'connected' ? 'WebSocket Live Server' : 'Cross-Tab Instant Ready'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Room Code Box */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Room Invite Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setRoomCode(val);
                        setSearchParams({ room: val });
                      }}
                      className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-3 py-2 text-white font-mono font-bold tracking-wider focus:outline-none focus:border-cyan-400 text-sm"
                      placeholder="e.g. TANK-8421"
                    />
                    <button
                      onClick={generateNewRoomCode}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="Generate New Room Code"
                    >
                      <FiRefreshCw />
                    </button>
                  </div>
                </div>

                {/* Shareable Link Box */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Invite Link (One-Click)
                  </label>
                  <button
                    onClick={handleCopyInviteLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-md"
                  >
                    {copiedLink ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                    <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Invite Link'}</span>
                  </button>
                </div>

                {/* Commander Call-Sign */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Call-Sign
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    maxLength={16}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-400 text-sm"
                    placeholder="Commander Name"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Single Player Options (if SP selected) */}
          {mode === 'sp' && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-fuchsia-500/30 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  AI Opponent Squad Size ({botCount} Tanks)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setBotCount(cnt)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        botCount === cnt
                          ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Bot Combat Intelligence
                </label>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setBotDifficulty(diff)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
                        botDifficulty === diff
                          ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tank Arsenal Class Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <FiAward className="text-cyan-400" />
                  <span>Choose Your Battle Tank Class</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Each chassis features unique hull armor, turret velocity, firing rates, and kinetic stats.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                {TANK_CLASSES.length} Classes Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TANK_CLASSES.map((tank) => (
                <TankClassCard
                  key={tank.id}
                  tank={tank}
                  isSelected={selectedTankId === tank.id}
                  onClick={() => setSelectedTankId(tank.id)}
                />
              ))}
            </div>
          </div>

          {/* Tactical Arena Map Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <FiShield className="text-cyan-400" />
              <span>Select Combat Arena</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MAPS.map((map) => (
                <button
                  key={map.id}
                  onClick={() => setSelectedMapId(map.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedMapId === map.id
                      ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-base text-white mb-1">{map.name}</div>
                  <div className="text-xs text-slate-400 leading-relaxed mb-3">{map.tagline}</div>
                  <div className="flex items-center gap-2 text-[10px] text-cyan-400 uppercase font-mono">
                    <span>{map.width}x{map.height} ARENA</span>
                    <span>•</span>
                    <span>{map.theme}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Big Action Launch Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleStartGame}
              className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-lg tracking-wide shadow-[0_0_35px_rgba(6,182,212,0.45)] hover:shadow-[0_0_45px_rgba(6,182,212,0.65)] hover:scale-105 transition-all"
            >
              <FiPlay className="text-xl fill-current" />
              <span>DEPLOY INTO BATTLE</span>
              <FiArrowRight />
            </button>
          </div>
        </div>
      ) : (
        /* Active Battle Screen */
        <div className="space-y-4">
          {/* Tactical Match HUD Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg backdrop-blur-md">
            {/* Player Health & Shield Bar */}
            <div className="flex items-center gap-4 flex-1 min-w-[260px]">
              <div className="space-y-1 w-full max-w-xs">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    {playerName}
                  </span>
                  <span className="text-cyan-400 font-mono">
                    {gameStats.health} / {gameStats.maxHealth} HP
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-150"
                    style={{ width: `${Math.max(0, (gameStats.health / gameStats.maxHealth) * 100)}%` }}
                  />
                </div>
                {gameStats.shield > 0 && (
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 animate-pulse"
                      style={{ width: `${Math.min(100, (gameStats.shield / 60) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Active Buff Badges */}
              <div className="flex items-center gap-1.5">
                {gameStats.speedBoost && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    ⚡ BOOST
                  </span>
                )}
                {gameStats.rapidFire && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                    💥 HYPER
                  </span>
                )}
                {gameStats.tripleShot && (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                    🔱 SCATTER
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-bold">
                  💣 {gameStats.minesRemaining} Mines
                </span>
              </div>
            </div>

            {/* Score & Kills Display */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</div>
                <div className="text-lg font-black text-cyan-400 font-mono">{gameStats.score}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kills</div>
                <div className="text-lg font-black text-emerald-400 font-mono">{gameStats.kills}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {mode === 'online' && (
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10"
                    title="Toggle Chat"
                  >
                    <FiMessageSquare />
                  </button>
                )}
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <FiPlay /> : <FiPause />}
                </button>
                <button
                  onClick={handleResetGame}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10"
                  title="Restart Match"
                >
                  <FiRotateCcw />
                </button>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold"
                >
                  Exit To Hangar
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Game Canvas Engine */}
          <div className="relative">
            <TankCanvas
              mode={mode}
              mapId={selectedMapId}
              player1Config={player1Config}
              player2Config={player2Config}
              roomCode={roomCode}
              socketUrl={socketUrl}
              isSoundEnabled={!isMuted}
              soundVolume={soundVolume}
              isPaused={isPaused}
              botCount={botCount}
              botDifficulty={botDifficulty}
              onGameStatsUpdate={setGameStats}
              onSocketStatusChange={setSocketStatus}
              onGameOver={(res) => setGameOverResult(res)}
            />

            {/* In-Game Live Chat Box (Overlay) */}
            <AnimatePresence>
              {showChat && mode === 'online' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-16 right-4 z-30 w-80 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col"
                >
                  <div className="p-3 bg-slate-950/80 border-b border-white/10 flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <FiMessageSquare /> Battle Comms
                    </span>
                    <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                      <FiX />
                    </button>
                  </div>
                  <div className="h-44 p-3 overflow-y-auto space-y-2 text-xs">
                    {chatMessages.length === 0 ? (
                      <div className="text-slate-500 text-center py-4">No comms yet. Type below!</div>
                    ) : (
                      chatMessages.map((m, idx) => (
                        <div key={idx} className="space-x-1.5">
                          <span className="font-bold text-cyan-400">{m.sender}:</span>
                          <span className="text-slate-200">{m.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendChat} className="p-2 bg-slate-950/80 border-t border-white/10 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send message..."
                      className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                    >
                      <FiSend />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Over Screen Modal */}
            <AnimatePresence>
              {gameOverResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6"
                >
                  <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-cyan-500/40 text-center space-y-6 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-3xl">
                      🏆
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white">MATCH COMPLETED</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        {gameOverResult.winner
                          ? `${gameOverResult.winner.name} achieved victory!`
                          : 'Your tank was neutralized in battle!'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2 text-left">
                      <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Final Score</div>
                        <div className="text-xl font-mono font-bold text-cyan-400">{gameStats.score}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Kills</div>
                        <div className="text-xl font-mono font-bold text-emerald-400">{gameStats.kills}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleResetGame}
                        className="flex-1 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all"
                      >
                        REMATCH
                      </button>
                      <button
                        onClick={() => setIsPlaying(false)}
                        className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
                      >
                        HANGAR
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Tactical Field Guide Modal */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="max-w-2xl w-full p-6 md:p-8 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <FiHelpCircle className="text-cyan-400 text-xl" />
                  <h3 className="text-xl font-black text-white">Tank Battle Tactical Field Manual</h3>
                </div>
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                    <span>🎯</span> Master Kinetic Ricochets
                  </h4>
                  <p>
                    Steel walls and arena boundaries reflect tank shells! Calculate your firing angles off corner walls to strike enemies hiding behind cover without exposing your chassis.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                    <span>🧱</span> Destructible Brick Cover & Explosive Barrels
                  </h4>
                  <p>
                    Brick barricades absorb damage and crumble into dust when shot. Red hazard barrels detonate violently when struck, destroying nearby obstacles and inflicting massive splash damage to enemy armor!
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                    <span>💣</span> Proximity Landmines
                  </h4>
                  <p>
                    Press <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/20 text-xs">Space</kbd> to drop a proximity mine behind you. After arming, it detonates when any enemy tank rolls within radius!
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                    <span>⚡</span> Power-Up Crates
                  </h4>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="font-bold text-emerald-400">💊 Nanotech Repair:</span> +45 Health
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="font-bold text-cyan-400">🛡️ Energy Shield:</span> Absorbs 60 Damage
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="font-bold text-yellow-400">⚡ Overdrive:</span> +50% Movement Speed
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-white/5">
                      <span className="font-bold text-rose-400">💥 Hyper Cannon:</span> 2x Rapid Firing
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg"
                >
                  Understood, Return to Hangar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
