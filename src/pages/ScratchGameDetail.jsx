import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiCopy, 
  FiCheck, 
  FiMaximize, 
  FiRotateCcw, 
  FiZap, 
  FiExternalLink, 
  FiInfo 
} from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa6';

const KNOWN_GAMES = {
  '943733386': { 
    title: 'Geometry Dash', 
    author: 'NormanTheGamer', 
    instructions: 'Use Up Arrow, Space, W, or Click to jump and fly. Yellow/blue portals flip gravity. 4 complete levels with original music!' 
  },
  '105500895': { redirect: '943733386' },
  '946418677': { 
    title: 'Subway Surfers', 
    author: 'NormanTheGamer', 
    instructions: 'Use Left/Right arrow keys to switch lanes. Up arrow to jump. Avoid trains, collect coins, and unlock characters & upgrades!' 
  },
  '400045091': { redirect: '946418677' },
  '10128407': { 
    title: 'Paper Minecraft v11.7', 
    author: 'griffpatch', 
    instructions: '[WASD] Move/Jump • [Click] Mine/Place • [1-9] Select Item • [E] Inventory • [F] Eat food • [Space] Drop stack' 
  },
  '108566337': { 
    title: 'Slither.io', 
    author: 'griffpatch', 
    instructions: 'Use your mouse cursor to steer your snake. Click or hold Space to boost speed and encircle other snakes!' 
  },
  '110543264': { redirect: '108566337' },
  '389464290': { 
    title: 'Getting Over It v1.4', 
    author: 'griffpatch', 
    instructions: 'Move your mouse to swing your sledgehammer. Grip rocks and ledges to hoist yourself up the mountain.' 
  },
  '351982746': { redirect: '389464290' },
  '612229554': { 
    title: 'Massive Multiplayer Platformer', 
    author: 'griffpatch', 
    instructions: 'Arrow keys or [WASD] to run, jump, and wall slide with other players in real time!' 
  },
  '137943574': { redirect: '612229554' },
  '1157118622': { title: 'Maze Game' },
  '1161913547': { title: 'Crystals Falling Out The Sky' },
  '1163241738': { title: 'Fruit Ninja' },
  '1164894421': { title: 'T-Rex Runner' },
  '1167560829': { title: 'Flappy Bird' },
  '1169095508': { title: 'Arkanoid Breakout' },
  '1172414406': { title: 'Tennis' },
  '1174160548': { title: 'Pacman Classic' },
  '1177797667': { title: 'Tic Tac Toe' },
  '1179570810': { title: 'Tic Tac Toe PvC' },
  '493120398': { title: 'The Great Snake Escape' },
  '1285171146': { title: 'Frozen Frenzy' },
  '847915138': { title: 'Paper Plane Fly' },
  '1132475012': { title: 'Pick A Lock' },
  '405198495': { title: 'Pipe Puzzles' },
  '134204916': { title: 'Piano' },
  '1124350480': { title: 'Slime Platformer v2.0' },
  '1274358391': { title: 'Fruit Frenzy!' },
  '208527646': { title: 'Balloon Football' },
  '1041557087': { title: 'Key Master' },
};

const ScratchGameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engine, setEngine] = useState('turbowarp'); // 'turbowarp' (fast 60fps) | 'scratch' (mit official)
  const [isCopied, setIsCopied] = useState(false);
  const [gameMeta, setGameMeta] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeContainerRef = useRef(null);

  // Auto-redirect if an outdated or dead ID was accessed
  useEffect(() => {
    if (KNOWN_GAMES[id]?.redirect) {
      navigate(`/scratch-game/${KNOWN_GAMES[id].redirect}`, { replace: true });
    }
  }, [id, navigate]);

  // Fetch real Scratch project metadata for title and instructions
  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`https://api.scratch.mit.edu/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setGameMeta(data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch project info from Scratch API:', err);
      }
    };
    fetchMetadata();
    return () => { isMounted = false; };
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen error:', err);
      });
    }
  };

  const handleReload = () => {
    setReloadKey((prev) => prev + 1);
  };

  const known = KNOWN_GAMES[id] || {};
  const displayTitle = gameMeta?.title || known.title || 'Browser Scratch Game';
  const authorName = gameMeta?.author?.username || known.author || 'Scratch Community';
  const instructions = gameMeta?.instructions || known.instructions;

  const playerSrc = engine === 'turbowarp'
    ? `https://turbowarp.org/${id}/embed?fps=60&autoplay=0`
    : `https://scratch.mit.edu/projects/${id}/embed`;

  return (
    <div className="py-8 md:py-12 max-w-5xl mx-auto space-y-6">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group text-sm font-semibold"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Games</span>
        </motion.button>

        <Link
          to="/scratch-games"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"
        >
          <span>Browse All Scratch Games</span>
          <FiExternalLink className="text-[10px]" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Game Title Bar & Action Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FaGamepad className="text-base" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Instant Play
              </span>
              <span className="text-xs text-slate-400">ID: {id}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Created by <span className="text-slate-200 font-semibold">@{authorName}</span> • Verified 100% playable in browser
            </p>
          </div>

          {/* Engine Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Player engine switcher */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setEngine('turbowarp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                  engine === 'turbowarp'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="TurboWarp runs at 60 FPS with instant loading"
              >
                <FiZap className="text-xs" />
                <span>60 FPS Fast</span>
              </button>
              <button
                onClick={() => setEngine('scratch')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all duration-200 ${
                  engine === 'scratch'
                    ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="MIT Scratch standard player"
              >
                <span>Classic</span>
              </button>
            </div>

            <button
              onClick={handleReload}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Reload Game"
            >
              <FiRotateCcw className="text-sm" />
            </button>

            <button
              onClick={handleFullscreen}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Fullscreen Mode"
            >
              <FiMaximize className="text-sm" />
            </button>

            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors ${
                isCopied
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
              }`}
              title="Copy Page Link"
            >
              {isCopied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
              <span>{isCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Main Game Screen & Embed Container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />
          
          <div 
            ref={iframeContainerRef}
            className="relative glass-panel rounded-3xl overflow-hidden bg-slate-950 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
          >
            {/* Top Game Bar inside embed window */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide">
                  {engine === 'turbowarp' ? 'TurboWarp Engine • 60 FPS' : 'Scratch MIT Engine'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Click Green Flag inside the game to begin</span>
            </div>

            {/* Game Canvas Frame */}
            <div className="relative w-full aspect-[485/402] max-w-4xl mx-auto flex items-center justify-center bg-black">
              <iframe
                key={`${id}-${engine}-${reloadKey}`}
                src={playerSrc}
                allowTransparency="true"
                frameBorder="0"
                scrolling="no"
                allow="fullscreen; autoplay; encrypted-media"
                title={`${displayTitle} Player`}
                className="w-full h-full border-0 bg-black"
              />
            </div>
          </div>
        </div>

        {/* How to Play & Game Controls Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <FiInfo className="text-emerald-400" />
              <h3>How to Play</h3>
            </div>

            {instructions ? (
              <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-white/5">
                {instructions}
              </p>
            ) : (
              <ul className="list-disc list-inside text-slate-300 text-sm space-y-2">
                <li>Click the <strong className="text-emerald-400">Green Flag</strong> in the top-left or center to start.</li>
                <li>Use your keyboard (<strong className="text-white">Arrow keys, WASD, or Spacebar</strong>) and mouse to control the action.</li>
                <li>Click the <strong className="text-rose-400">Red Stop Sign</strong> anytime to pause or stop the game.</li>
              </ul>
            )}

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <FiZap className="text-base shrink-0" />
              <span><strong>Performance Tip:</strong> The default 60 FPS Fast player uses an optimized WebGL runtime for zero lag and instant loading.</span>
            </div>
          </div>

          {/* Quick Info & Scratch Credits */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Project Details</h4>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <dt className="text-slate-400">Project ID</dt>
                  <dd className="font-mono text-slate-200">{id}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <dt className="text-slate-400">Creator</dt>
                  <dd className="text-indigo-400 font-semibold">@{authorName}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <dt className="text-slate-400">Target Framerate</dt>
                  <dd className="text-emerald-400 font-bold">60 FPS</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-slate-400">Platform</dt>
                  <dd className="text-slate-200">Browser / HTML5</dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
              <a
                href={`https://scratch.mit.edu/projects/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
              >
                <span>View on Scratch MIT</span>
                <FiExternalLink className="text-[10px]" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScratchGameDetail;
