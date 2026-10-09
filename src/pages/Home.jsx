import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiArrowRight, FiStar, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useFeaturedGame } from '../hooks/useGames';
import { categories } from '../data/games';
import { fetchAllLocalGames } from '../services/localApi';

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
  const { game: featuredGame, loading: featuredLoading } = useFeaturedGame();

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
              to="/gallery"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] hover:-translate-y-1"
            >
              <span>Browse Library</span>
              <FiArrowRight />
            </Link>
            <button 
              onClick={() => setIsTrailerOpen(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:border-white/20"
            >
              <FiPlay />
              <span>Watch Trailer</span>
            </button>
          </div>

          <div className="flex items-center gap-8 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-black">500K+</div>
              <div className="text-sm text-slate-400 font-medium tracking-wide">GAMES IN DB</div>
            </div>
            <div>
              <div className="text-3xl font-black">20,000</div>
              <div className="text-sm text-slate-400 font-medium tracking-wide">FREE API CALLS/MO</div>
            </div>
          </div>
        </motion.div>

        {/* Featured game card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="flex-1 relative w-full aspect-square md:aspect-[4/5] max-w-lg mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl transform rotate-6" />

          {featuredLoading ? (
            <div className="absolute inset-0 glass-panel border border-white/20 overflow-hidden transform -rotate-2 rounded-2xl animate-pulse bg-slate-800" />
          ) : (
            <Link
              to={`/game/${featuredGame?.slug || featuredGame?.id}`}
              className="absolute inset-0 block glass-panel border border-white/20 overflow-hidden transform -rotate-2 hover:rotate-0 transition-transform duration-500"
            >
              {featuredGame?.image ? (
                <img
                  src={featuredGame.image}
                  alt={featuredGame.title}
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                  Image Placeholder
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent p-8">
                <div className="flex justify-between items-end gap-4">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold mb-1 truncate">{featuredGame?.title || 'Game Title'}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      {featuredGame?.rating && (
                        <span className="flex items-center gap-1">
                          <FiStar className="text-yellow-500 fill-current" />
                          {featuredGame.rating}
                        </span>
                      )}
                      {featuredGame?.genre && (
                        <span className="text-slate-400">{featuredGame.genre}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 bg-fuchsia-600 px-3 py-1 text-sm font-bold rounded-lg shadow-[0_0_10px_rgba(192,38,211,0.5)]">
                    {featuredGame?.price === 0 ? 'FREE' : featuredGame?.price ? `$${featuredGame.price}` : 'VIEW'}
                  </div>
                </div>
              </div>
            </Link>
          )}
        </motion.div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
               onClick={() => setIsTrailerOpen(false)}>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ duration: 0.2 }}
                 onClick={(e) => e.stopPropagation()}
                 className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
               >
                 <button 
                   onClick={() => setIsTrailerOpen(false)}
                   className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                 >
                   <FiX size={24} />
                 </button>
                 <iframe 
                   width="100%" 
                   height="100%" 
                   src="https://www.youtube.com/embed/QkkoHAzjnUs?autoplay=1" 
                   title="Game Trailer" 
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
