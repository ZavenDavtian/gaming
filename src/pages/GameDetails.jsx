import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar, FiClock, FiGlobe, FiCpu, FiTag, FiHeart,
  FiShoppingCart, FiArrowLeft, FiCheck, FiExternalLink,
  FiMonitor, FiCalendar, FiLoader, FiTrash2
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useGameDetail } from '../hooks/useGames';
import { API_AVAILABLE } from '../services/rawgApi';

// ── Screenshot viewer ──────────────────────────────────────────────────────
const ScreenshotViewer = ({ screenshots, title }) => {
  const [active, setActive] = useState(0);
  if (!screenshots?.length) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <FiMonitor className="text-indigo-400" /> Screenshots
      </h2>
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-800">
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={screenshots[active]}
            alt={`${title} screenshot ${active + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
      </div>
      {screenshots.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-28 aspect-video rounded-xl overflow-hidden border-2 transition-all ${i === active
                  ? 'border-indigo-500 scale-105'
                  : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

// ── Loading skeleton ───────────────────────────────────────────────────────
const DetailSkeleton = () => (
  <div className="pb-20 animate-pulse space-y-8">
    <div className="relative h-[500px] rounded-3xl overflow-hidden bg-slate-800" />
    <div className="grid lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-40 bg-slate-800 rounded-2xl" />
        <div className="h-40 bg-slate-800 rounded-2xl" />
      </div>
      <div className="space-y-6">
        <div className="h-64 bg-slate-800 rounded-2xl" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
const GameDetails = () => {
  const { cart, addToCart, removeFromCart } = useCart();
  const { id } = useParams();

  const { game, screenshots, loading, error } = useGameDetail(id);
  const { wishlist, toggleWishlist } = useWishlist();
  const isWishlisted = game && wishlist.some(item => item.id === game.id);
  const isInCart = cart.find((item) => item.id === game?.id);

  if (loading) return <DetailSkeleton />;

  if (!game || error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl font-black mb-4">Transmission Lost</h2>
        <p className="text-slate-500 mb-8">
          {error || 'The requested game data could not be retrieved.'}
        </p>
        <Link
          to="/gallery"
          className="px-8 py-3 bg-indigo-600 rounded-xl font-bold flex items-center gap-2"
        >
          <FiArrowLeft /> Back to Vault
        </Link>
      </div>
    );
  }

  const allScreenshots = [
    ...(game.image ? [game.image] : []),
    ...screenshots.filter((s) => s !== game.image),
  ];

  return (
    <div className="pb-20">
      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-12 group"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
        {game.image ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-slate-800" />
        )}

        <div className="absolute bottom-0 inset-x-0 z-20 p-8 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {game.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30 backdrop-blur-md"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-black">{game.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-300">
              {game.rating && (
                <div className="flex items-center gap-2">
                  <FiStar className="text-yellow-500" />
                  <span className="font-bold">{game.rating} Rating</span>
                </div>
              )}
              {game.metacritic && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${game.tier === 'Mighty' ? 'bg-yellow-600 text-white' :
                      game.tier === 'Strong' ? 'bg-emerald-600 text-white' :
                        game.tier === 'Fair' ? 'bg-slate-600 text-white' :
                          'bg-red-600 text-white'
                    }`}>
                    {game.tier || 'Score'} {game.metacritic}
                  </span>
                </div>
              )}
              {game.releaseDate && (
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-indigo-400" />
                  <span>{game.releaseDate}</span>
                </div>
              )}
              {game.playtime > 0 && (
                <div className="flex items-center gap-2">
                  <FiClock className="text-fuchsia-400" />
                  <span>~{game.playtime}h avg playtime</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 min-w-[220px]">
            <div className="text-3xl font-black">
              {game.price === 0 ? 'FREE' : `$${game.price}`}
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => isInCart ? removeFromCart(game.id) : addToCart(game)}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isInCart
                  ? 'bg-emerald-600/20 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 text-emerald-400 border border-emerald-500/30 group'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
            >
              {isInCart ? (
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <span className="group-hover:hidden flex items-center gap-2"><FiCheck className="text-xl" /> In Vault</span>
                  <span className="hidden group-hover:flex items-center gap-2"><FiTrash2 className="text-xl" /> Remove from Vault</span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <FiShoppingCart /> Add to Cart
                </div>
              )}
            </motion.button>
            <button
              onClick={() => toggleWishlist(game)}
              className={`w-full py-4 border rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isWishlisted
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/30 text-rose-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
            >
              <FiHeart className={isWishlisted ? 'fill-current' : ''} />
              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
            {game.website && (
              <a
                href={game.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <FiExternalLink /> Official Website
              </a>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Overview */}
          <section className="glass-panel p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FiGlobe className="text-indigo-400" /> Overview
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg text-justify whitespace-pre-line">
              {game.description
                || `Experience the ultimate ${game.genre} adventure in ${game.title}. Developed by ${game.developer}, this critically acclaimed title pushes the boundaries of modern gaming with breathtaking visuals and innovative mechanics.`}
            </p>
          </section>

          {/* Screenshots */}
          {allScreenshots.length > 0 && (
            <section className="glass-panel p-8 md:p-12">
              <ScreenshotViewer screenshots={allScreenshots} title={game.title} />
            </section>
          )}

          {/* Dev / Platform cards */}
          <section className="grid sm:grid-cols-2 gap-6">
            <div className="glass-panel p-8 border-l-4 border-indigo-500">
              <h3 className="font-bold mb-2">Developer</h3>
              <p className="text-slate-400">{game.developer || 'Unknown'}</p>
            </div>
            <div className="glass-panel p-8 border-l-4 border-fuchsia-500">
              <h3 className="font-bold mb-2">Platforms</h3>
              <p className="text-slate-400">
                {game.platform?.length ? game.platform.join(', ') : 'PC'}
              </p>
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-8">
          {/* Stats */}
          <section className="glass-panel p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <FiCpu className="text-fuchsia-400" />{' '}
              {API_AVAILABLE ? 'Game Stats' : 'System Specs'}
            </h3>
            {API_AVAILABLE ? (
              <div className="space-y-4 text-sm">
                {[
                  ['Genre', game.genre],
                  ['Rating', game.rating ? `${game.rating} / 5` : '—'],
                  ['Metacritic', game.metacritic ? `${game.metacritic} / 100` : '—'],
                  ['Avg Playtime', game.playtime ? `~${game.playtime} hours` : '—'],
                  ['Released', game.releaseDate || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {[
                  ['OS', 'Win 10/11 64-bit'],
                  ['Processor', 'Intel i7-12700K'],
                  ['Memory', '16 GB RAM'],
                  ['Graphics', 'NVIDIA RTX 3070'],
                  ['Storage', '80 GB SSD'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pro tip */}
          <section className="glass-panel p-8 bg-indigo-600/5 border-dashed border-indigo-500/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <FiTag className="text-indigo-400" /> Pro Tip
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pair this game with a Pro Player subscription to unlock exclusive legendary skins and 2x XP boosts for the first week.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
