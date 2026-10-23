import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiPlay, 
  FiExternalLink, 
  FiCheckCircle, 
  FiZap, 
  FiMonitor, 
  FiMaximize, 
  FiRotateCcw
} from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa6';

const showcaseGames = [
  {
    id: 'geometry-dash',
    title: 'Geometry Dash',
    genre: 'Rhythm Platformer',
    difficulty: 'Challenging',
    fps: '60 FPS',
    videoId: 'LxA4NJMiZ8o',
    playableId: '943733386',
    tagline: 'Test your reflexes in this rhythm-fueled obstacle course',
    description: 'Jump, fly, and flip your way through dangerous spike pits and neon geometric obstacles synced to an energetic soundtrack. Experience the genuine game directly in your browser!',
    badge: 'Trending #1',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    borderGlow: 'hover:border-amber-500/50',
    thumbnail: 'https://i.ytimg.com/vi/LxA4NJMiZ8o/hqdefault.jpg',
  },
  {
    id: 'subway-surfers',
    title: 'Subway Surfers',
    genre: '3D Endless Runner',
    difficulty: 'Casual / Reflex',
    fps: '60 FPS',
    videoId: '1IzOLkLCueA',
    playableId: '946418677',
    tagline: 'Dodge trains, surf the tracks, and collect power-ups',
    description: 'Dash as fast as you can through urban train yards, grind on oncoming subway cars, and unleash your hoverboard. Watch the live run or take over the controls right now!',
    badge: 'Fan Favorite',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    borderGlow: 'hover:border-emerald-500/50',
    thumbnail: 'https://i.ytimg.com/vi/1IzOLkLCueA/hqdefault.jpg',
  },
  {
    id: 'paper-minecraft',
    title: 'Paper Minecraft',
    genre: '2D Survival & Sandbox',
    difficulty: 'Adventure',
    fps: '60 FPS',
    videoId: 'MmB9b5njVbA',
    playableId: '10128407',
    tagline: 'Mine, craft, construct, and survive the wild',
    description: 'Explore randomly generated worlds, harvest blocks, craft weapons, battle nocturnal mobs, and build whatever you imagine in this acclaimed web-native 2D recreation of Minecraft.',
    badge: 'Classic Hit',
    gradient: 'from-sky-400 via-indigo-500 to-purple-500',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    borderGlow: 'hover:border-indigo-500/50',
    thumbnail: 'https://i.ytimg.com/vi/MmB9b5njVbA/hqdefault.jpg',
  },
];

const GameplayShowcase = () => {
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [mode, setMode] = useState('video'); // 'video' | 'playable'
  const containerRef = useRef(null);

  const activeGame = showcaseGames[selectedGameIndex];

  const handleSelectGame = (index) => {
    setSelectedGameIndex(index);
    // When switching games, reset back to video preview
    setMode('video');
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  return (
    <section id="gameplay-showcase" className="relative py-12">
      {/* Background radial glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] blur-[140px] pointer-events-none -z-10 rounded-full transition-colors duration-700 opacity-40"
        style={{ backgroundColor: activeGame.glowColor }}
      />

      {/* Header section */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Proof of Play • Instant Browser Gaming</span>
        </div>
        
        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
          See the Gameplay.{' '}
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activeGame.gradient}`}>
            Play Right Now.
          </span>
        </h2>
        
        <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
          Wondering if you can actually play games on our platform? Watch real in-game footage below, or hit <strong className="text-white">Play Live Now</strong> to jump directly into the game inside your browser—no downloads or installs required.
        </p>
      </div>

      {/* Interactive Tabs / Game Selectors */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        {showcaseGames.map((game, idx) => {
          const isSelected = idx === selectedGameIndex;
          return (
            <button
              key={game.id}
              onClick={() => handleSelectGame(idx)}
              className={`group relative flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all duration-300 border backdrop-blur-md ${
                isSelected
                  ? 'bg-slate-800/90 text-white border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.15)] scale-105'
                  : 'bg-slate-900/40 text-slate-400 border-white/10 hover:border-white/20 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/5 text-slate-400'
              }`}>
                {game.badge}
              </span>
              <span className="text-sm md:text-base">{game.title}</span>
              {isSelected && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className={`absolute -bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r ${game.gradient} rounded-full`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Video & Playable Showcase Container */}
      <div 
        ref={containerRef}
        className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden glass-panel border border-white/15 bg-slate-950/80 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      >
        {/* Top Control & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
          {/* Active game info & live tag */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${activeGame.gradient} text-white shadow-md`}>
              <FaGamepad className="text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-white">{activeGame.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeGame.fps} Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{activeGame.genre} • {activeGame.difficulty}</p>
            </div>
          </div>

          {/* Mode Switcher Toggle: Video vs Playable */}
          <div className="flex items-center gap-2 bg-slate-950/70 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setMode('video')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                mode === 'video'
                  ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FiPlay className="text-xs" />
              <span>Watch Gameplay</span>
            </button>
            <button
              onClick={() => setMode('playable')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                mode === 'playable'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FiZap className="text-xs animate-pulse text-yellow-300" />
              <span>Play Live Now</span>
            </button>
          </div>

          {/* Actions: Fullscreen & Link */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            >
              <FiMaximize className="text-sm" />
            </button>
            <Link
              to={`/scratch-game/${activeGame.playableId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition-colors"
            >
              <span>Full Page</span>
              <FiExternalLink className="text-xs" />
            </Link>
          </div>
        </div>

        {/* Video / Playable Player Screen (Aspect Ratio 16:9) */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === 'video' ? (
              <motion.div
                key={`video-${activeGame.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full relative"
              >
                {/* Embedded Video */}
                <iframe
                  className="w-full h-full border-0"
                  src={`https://www.youtube-nocookie.com/embed/${activeGame.videoId}?autoplay=1&mute=1&loop=1&playlist=${activeGame.videoId}&controls=1&modestbranding=1&rel=0`}
                  title={`${activeGame.title} Gameplay Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

                {/* Floating "Play Live Now" Quick Action Overlay on Video */}
                <div className="absolute bottom-5 right-5 z-20 pointer-events-auto">
                  <button
                    onClick={() => setMode('playable')}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all duration-300 hover:scale-105"
                  >
                    <FiZap className="text-base text-slate-950" />
                    <span>Take Controls • Play Now</span>
                  </button>
                </div>

                {/* Floating Gameplay Watermark Badge */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white shadow-lg pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>GAMEPLAY PREVIEW</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-emerald-400">PLAYABLE IN BROWSER</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`playable-${activeGame.id}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full relative bg-slate-950 flex flex-col"
              >
                {/* Direct Playable Game Embed */}
                <iframe
                  src={`https://turbowarp.org/${activeGame.playableId}/embed`}
                  title={`${activeGame.title} Interactive Game`}
                  className="w-full h-full border-0"
                  allow="fullscreen; autoplay; encrypted-media"
                />

                {/* Banner floating on bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-4 py-2 bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl text-xs pointer-events-auto shadow-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <FiCheckCircle className="text-sm" />
                    <span>Game is live! Use keyboard / mouse to play.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMode('video')}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <FiRotateCcw className="text-[10px]" />
                      <span>Back to Video</span>
                    </button>
                    <Link
                      to={`/scratch-game/${activeGame.playableId}`}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>Fullscreen Page</span>
                      <FiExternalLink className="text-[10px]" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Feature Details & Proof Badges */}
        <div className="p-6 md:p-8 bg-slate-900/50 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r ${activeGame.gradient} text-white`}>
                {activeGame.title}
              </span>
              <span className="text-xs text-slate-400">{activeGame.tagline}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeGame.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              to={`/scratch-game/${activeGame.playableId}`}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white px-6 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] hover:-translate-y-0.5 text-sm"
            >
              <FaGamepad />
              <span>Play Dedicated Page</span>
            </Link>

            <Link
              to="/scratch-games"
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3.5 rounded-xl font-bold transition-all duration-300 text-sm hover:border-white/20"
            >
              <span>More Scratch Games</span>
              <FiExternalLink />
            </Link>
          </div>
        </div>
      </div>

      {/* Trust & Instant-Play Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto mt-8">
        <div className="glass-panel p-4 flex items-center gap-3.5 rounded-2xl border border-white/10">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FiZap className="text-xl" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Instant Launch</div>
            <div className="text-xs text-slate-400">No downloads or wait times — runs right in browser</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3.5 rounded-2xl border border-white/10">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FiMonitor className="text-xl" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">100% Free Forever</div>
            <div className="text-xs text-slate-400">Full access to Scratch & 2,000+ web mini-games</div>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3.5 rounded-2xl border border-white/10">
          <div className="p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
            <FaGamepad className="text-xl" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Keyboard & Touch Support</div>
            <div className="text-xs text-slate-400">Play seamlessly on PC, Mac, tablets, and phones</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameplayShowcase;
