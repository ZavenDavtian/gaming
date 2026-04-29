import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiArrowRight, FiStar, FiShoppingCart, FiCheck, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTrendingGames, useFeaturedGame } from '../hooks/useGames';
import { categories } from '../data/games';
import { API_AVAILABLE } from '../services/rawgApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

// ----------- Skeleton card -----------
const SkeletonCard = () => (
  <div className="rounded-2xl bg-slate-900/50 border border-white/10 overflow-hidden animate-pulse">
    <div className="aspect-[3/4] bg-slate-800" />
    <div className="p-5 space-y-2">
      <div className="h-3 bg-slate-700 rounded w-1/2" />
      <div className="h-4 bg-slate-700 rounded w-3/4" />
    </div>
  </div>
);

// ----------- API key banner -----------
const ApiKeyBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6 flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm"
  >
    <span className="text-lg leading-none mt-0.5">🔑</span>
    <div>
      <strong className="font-bold">Showing demo data.</strong>{' '}
      Connect live OpenCritic data free:{' '}
      <a
        href="https://rapidapi.com/opencritic-opencritic-default/api/opencritic-api"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-amber-200 transition-colors"
      >
        subscribe on RapidAPI
      </a>
      , then add your key to <code className="bg-black/30 px-1 rounded">.env</code> as{' '}
      <code className="bg-black/30 px-1 rounded">REACT_APP_OPENCRITIC_KEY</code>.
    </div>
  </motion.div>
);

const Home = () => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const { cart, addToCart } = useCart();
  const { game: featuredGame, loading: featuredLoading } = useFeaturedGame();
  const { games: trendingGames, loading: trendingLoading } = useTrendingGames(8);

  const displayedTrending = trendingGames.slice(0, 4);

  return (
    <div className="space-y-20 pb-20">
      {!API_AVAILABLE && <ApiKeyBanner />}

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

      {/* ── Trending Section ── */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">
              {API_AVAILABLE ? 'Trending Now' : 'Featured Games'}
            </h2>
            <p className="text-slate-400">
              {API_AVAILABLE
                ? 'Highest-rated releases of the last 2 years'
                : 'Explore our curated game selection'}
            </p>
          </div>
          <Link
            to="/gallery"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1 group"
          >
            View All <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {trendingLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {displayedTrending.map((game) => (
              <motion.div
                key={game.id}
                variants={itemVariants}
                className="group relative rounded-2xl bg-slate-900/50 border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-colors duration-300"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <Link to={`/game/${game.slug || game.id}`} className="block w-full h-full">
                    {game.image ? (
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800" />
                    )}
                  </Link>
                  {game.rating && (
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded gap-1 flex items-center border border-white/10 text-xs font-bold text-yellow-500">
                      <FiStar className="fill-current" /> {game.rating}
                    </div>
                  )}
                  {game.tier && (
                    <div className={`absolute top-3 left-3 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                      game.tier === 'Mighty' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      game.tier === 'Strong' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                      game.tier === 'Fair'   ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                                              'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {game.tier}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-100 pointer-events-none transition-opacity z-0" />
                </div>

                <div className="absolute bottom-0 inset-x-0 p-5 transform translate-y-4 group-hover:translate-y-0 transition-transform z-10">
                  <div className="text-xs font-semibold text-indigo-400 mb-1">{game.genre}</div>
                  <Link to={`/game/${game.slug || game.id}`}>
                    <h3 className="font-bold text-lg mb-2 line-clamp-1 hover:text-indigo-400 transition-colors">
                      {game.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                    <span className="font-black text-white">
                      {game.price === 0 ? 'FREE' : `$${game.price}`}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(game);
                      }}
                      className={`relative z-20 p-2 rounded-lg transition-all ${
                        cart.find((item) => item.id === game.id)
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/10 hover:bg-white/20 text-slate-200'
                      }`}
                    >
                      {cart.find((item) => item.id === game.id) ? <FiCheck /> : <FiShoppingCart />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
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
