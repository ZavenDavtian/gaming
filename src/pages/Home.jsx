import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiArrowRight, FiX, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { categories } from '../data/games';
import { fetchAllLocalGames } from '../services/localApi';
import GameplayShowcase from '../components/GameplayShowcase';
import HeroVideoPlayer from '../components/HeroVideoPlayer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const formatGenre = (genre) => {
  if (!genre) return 'Game';
  return genre
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const Home = () => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [miniGames, setMiniGames] = useState([]);
  const [playingMiniGame, setPlayingMiniGame] = useState(null);

  useEffect(() => {
    const loadMiniGames = async () => {
      try {
        const games = await fetchAllLocalGames();
        setMiniGames(games.slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    };
    loadMiniGames();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* ── Hero Section ── */}
      <section className="relative pt-12 md:pt-24 pb-12 flex flex-col md:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex-1 space-y-6"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-2">
            FUTURE OF GAMING
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Unlock Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-500 neon-text">
              True Potential
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
            Experience the next generation of gaming. Master advanced gameplay mechanics, sharpen your reflexes, and connect with millions of players worldwide on the ultimate premium platform.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              to="/snake-arena"
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white px-8 py-4 rounded-xl font-black transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] hover:-translate-y-1"
            >
              <FiZap className="animate-pulse" />
              <span>Play Snake Arena</span>
              <FiArrowRight />
            </Link>
            <Link
              to="/scratch-games"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:-translate-y-1"
            >
              <span>Explore All Games</span>
            </Link>
            <a
              href="#gameplay-showcase"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 hover:-translate-y-1 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            >
              <FiPlay className="text-emerald-400" />
              <span>Watch Video</span>
            </a>
          </div>

          <div className="flex items-center gap-8 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-black">2,000+</div>
              <div className="text-sm text-slate-400 font-medium tracking-wide">PLAYABLE ONLINE GAMES</div>
            </div>
            <div>
              <div className="text-3xl font-black">100% FREE</div>
              <div className="text-sm text-slate-400 font-medium tracking-wide">INSTANT BROWSER PLAY</div>
            </div>
          </div>
        </motion.div>

        {/* Live Gameplay Video in Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="flex-1 w-full max-w-xl mx-auto"
        >
          <HeroVideoPlayer />
        </motion.div>
      </section>

      {/* ── Live Gameplay Video Showcase ── */}
      <GameplayShowcase />

      {/* ── Snake Arena Spotlight ── */}
      <section className="relative overflow-hidden rounded-3xl p-8 md:p-12 glass-panel border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              HOT NEW MULTIPLAYER ARENA
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Neon Snake Arena <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500">
                Battle Royale & 2-Player Versus
              </span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Slither into the 360° cyber battleground. Eat glowing energy orbs, boost to cut off rivals, customize neon dragon skins, and play solo against 18 bots or local head-to-head with a friend on the same keyboard!
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/snake-arena"
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all flex items-center gap-2 hover:-translate-y-0.5"
              >
                <span>Enter Snake Arena</span>
                <FiArrowRight />
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 shrink-0 text-xs font-semibold text-slate-300 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-3 rounded-xl border border-white/10 shadow-md">
              <span className="text-cyan-400 font-bold">⚡ 60 FPS Fluid 360° Movement</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-3 rounded-xl border border-white/10 shadow-md">
              <span className="text-pink-400 font-bold">👥 Local 2-Player Shared Keyboard</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-3 rounded-xl border border-white/10 shadow-md">
              <span className="text-amber-400 font-bold">👑 Live Arena Leaderboard & Minimap</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-3 rounded-xl border border-white/10 shadow-md">
              <span className="text-emerald-400 font-bold">🎨 8 Cyber Snake Skins</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mini Games Section ── */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
              Online Mini Games
            </h2>
            <p className="text-slate-400">
              Quick and fun browser games
            </p>
          </div>
          <Link
            to="/mini-games"
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1 group"
          >
            Play All <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        >
          {miniGames.map((game) => (
            <motion.div key={game.id} variants={itemVariants} className="h-full">
              <button
                onClick={() => setPlayingMiniGame(game)}
                className="w-full text-left group block relative rounded-2xl overflow-hidden bg-slate-900/50 border border-white/5 hover:border-emerald-500/40 transition-all duration-300 h-full flex flex-col hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:-translate-y-1"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-800 relative shrink-0">
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center" />
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    {formatGenre(game.genre)}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center text-white shadow-[0_0_25px_rgba(16,185,129,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <svg className="w-7 h-7 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <span className="text-emerald-500 text-xs font-semibold group-hover:text-emerald-400 transition-colors">
                      Play Now →
                    </span>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Categories ── */}
      <section>
        <h2 className="text-3xl font-black tracking-tight mb-8">Browse Categories</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={itemVariants}>
              <Link
                to={`/gallery?genre=${cat.id}`}
                className="glass-panel p-6 flex flex-col items-center justify-center gap-3 hover:-translate-y-2 transition-transform duration-300 cursor-pointer group block"
              >
                <div className="text-4xl group-hover:scale-125 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  {cat.icon}
                </div>
                <h3 className="font-bold">{cat.name}</h3>
                <span className="text-xs text-slate-400">{cat.count.toLocaleString()} Games</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Mini Game Player Modal ── */}
      <AnimatePresence>
        {playingMiniGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
               onClick={(e) => { if (e.target === e.currentTarget) setPlayingMiniGame(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col"
            >
              <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/90 to-transparent z-10 flex justify-between items-center px-5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-400 text-sm truncate max-w-md">{playingMiniGame.title}</span>
                </div>
                <button
                  onClick={() => setPlayingMiniGame(null)}
                  className="p-2 bg-rose-500/20 hover:bg-rose-500/80 text-white rounded-lg backdrop-blur-md transition-all duration-200 shadow-lg"
                >
                  <FiX size={20} />
                </button>
              </div>
              {playingMiniGame.website ? (
                <iframe
                  src={playingMiniGame.website}
                  title={playingMiniGame.title}
                  className="w-full h-full border-0"
                  allow="fullscreen; autoplay; encrypted-media"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  Game URL unavailable
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Trailer Modal ── */}
      <AnimatePresence>
        {isTrailerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
               onClick={() => setIsTrailerOpen(false)}>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ duration: 0.2 }}
                 onClick={(e) => e.stopPropagation()}
                 className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
               >
                 <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/90 to-transparent z-10 flex justify-between items-center px-5">
                   <div className="flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                     <span className="font-bold text-white text-sm">Geometry Dash 2.2 — Real Gameplay Video</span>
                     <span className="hidden sm:inline text-xs text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/30">Playable on Site</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <Link
                       to="/scratch-game/943733386"
                       onClick={() => setIsTrailerOpen(false)}
                       className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                     >
                       Play Game Now →
                     </Link>
                     <button 
                       onClick={() => setIsTrailerOpen(false)}
                       className="p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors"
                     >
                       <FiX size={20} />
                     </button>
                   </div>
                 </div>
                 <iframe 
                   width="100%" 
                   height="100%" 
                   src="https://www.youtube-nocookie.com/embed/LxA4NJMiZ8o?autoplay=1&mute=0" 
                   title="Geometry Dash Gameplay Trailer" 
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 ></iframe>
               </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
