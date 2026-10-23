import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiVolume2, FiVolumeX, FiRotateCcw, FiZap, FiExternalLink } from 'react-icons/fi';
import { FaGamepad } from 'react-icons/fa6';

const heroGames = [
  {
    id: 'geometry-dash',
    title: 'Geometry Dash',
    genre: 'Rhythm Platformer',
    badge: 'Popular',
    videoId: 'LxA4NJMiZ8o',
    playableId: '943733386',
    tagline: '100% playable in your browser right now',
    gradient: 'from-amber-400 to-rose-500',
    borderHighlight: 'border-amber-500/40',
  },
  {
    id: 'subway-surfers',
    title: 'Subway Surfers',
    genre: '3D Runner',
    badge: 'Trending',
    videoId: '1IzOLkLCueA',
    playableId: '946418677',
    tagline: 'Jump, dodge trains, and surf infinite tracks',
    gradient: 'from-emerald-400 to-teal-500',
    borderHighlight: 'border-emerald-500/40',
  },
  {
    id: 'paper-minecraft',
    title: 'Paper Minecraft',
    genre: '2D Sandbox',
    badge: 'Classic',
    videoId: 'MmB9b5njVbA',
    playableId: '10128407',
    tagline: 'Mine, craft, survive, and build worlds',
    gradient: 'from-cyan-400 to-indigo-500',
    borderHighlight: 'border-indigo-500/40',
  },
];

const HeroVideoPlayer = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [mode, setMode] = useState('video'); // 'video' | 'play'

  const activeGame = heroGames[activeIdx];

  const handleSelectGame = (idx) => {
    setActiveIdx(idx);
    setMode('video');
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col gap-3">
      {/* Dynamic Ambient Glow Behind Card */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 via-fuchsia-500/20 to-emerald-500/30 rounded-3xl blur-3xl transform rotate-3 pointer-events-none -z-10" />

      {/* Quick Game Switcher Chips */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {heroGames.map((game, idx) => {
            const isSelected = idx === activeIdx;
            return (
              <button
                key={game.id}
                onClick={() => handleSelectGame(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border whitespace-nowrap ${
                  isSelected
                    ? 'bg-white/15 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>{game.title}</span>
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Proof
        </span>
      </div>

      {/* Main Glassmorphism Video Card */}
      <div className="relative glass-panel rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.7)] bg-slate-950/90 flex flex-col">
        {/* Top Header Overlay */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-white/10 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">
              In-Game Video Preview
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-emerald-400 text-xs font-bold">{activeGame.genre}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {mode === 'video' ? (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                  {isMuted ? <FiVolumeX className="text-xs" /> : <FiVolume2 className="text-xs text-emerald-400" />}
                </button>
                <button
                  onClick={() => setMode('play')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                >
                  <FiZap className="text-xs" />
                  <span>Play In Card</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('video')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
              >
                <FiRotateCcw className="text-[10px]" />
                <span>Back to Video</span>
              </button>
            )}
          </div>
        </div>

        {/* Video / Play Frame */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === 'video' ? (
              <motion.div
                key={`hero-vid-${activeGame.id}-${isMuted}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full relative"
              >
                <iframe
                  className="w-full h-full border-0"
                  src={`https://www.youtube-nocookie.com/embed/${activeGame.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${activeGame.videoId}&controls=1&modestbranding=1&rel=0`}
                  title={`${activeGame.title} Gameplay Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

                {/* Bottom Quick Play CTA Tag on Video */}
                <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex items-center justify-between">
                  <div className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-slate-200 shadow-md">
                    ⚡ You can play this game right now!
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`hero-play-${activeGame.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full relative bg-slate-950"
              >
                <iframe
                  src={`https://turbowarp.org/${activeGame.playableId}/embed`}
                  title={`${activeGame.title} Live Game`}
                  className="w-full h-full border-0"
                  allow="fullscreen; autoplay; encrypted-media"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Bar: Title, Tagline & Direct Play Link */}
        <div className="p-4 bg-slate-900/70 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-white truncate">{activeGame.title}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                Browser Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{activeGame.tagline}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/scratch-game/${activeGame.playableId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold text-xs transition-all duration-200 shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-105"
            >
              <FaGamepad className="text-sm" />
              <span>Play Game</span>
              <FiExternalLink className="text-[10px]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroVideoPlayer;
