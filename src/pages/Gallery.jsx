import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories } from '../data/games';
import { FiSearch, FiFilter, FiEye, FiShoppingCart, FiCheck, FiLoader, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useGamesList } from '../hooks/useGames';
import { API_AVAILABLE } from '../services/rawgApi';

// Debounce helper
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Gallery = () => {
  const { cart, addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || 'all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(inputValue, 400);

  // Sync URL param → input on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setInputValue(q);
    const g = searchParams.get('genre');
    if (g) setGenre(g);
  }, []); // eslint-disable-line

  // Reset page when filter/search changes
  useEffect(() => { setPage(1); }, [debouncedSearch, genre]);

  const { games, loading, error, totalCount, hasMore } = useGamesList({
    search: debouncedSearch,
    genre,
    page,
  });

  const handleSearch = useCallback((e) => {
    setInputValue(e.target.value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (e.target.value) next.set('q', e.target.value);
      else next.delete('q');
      return next;
    });
  }, [setSearchParams]);

  const handleGenre = useCallback((val) => {
    setGenre(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val !== 'all') next.set('genre', val);
      else next.delete('genre');
      return next;
    });
  }, [setSearchParams]);

  const clearFilters = () => {
    setInputValue('');
    setGenre('all');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="pb-20">
      {/* ── Header & Controls ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            {API_AVAILABLE ? 'Game' : 'Project'}{' '}
            <span className="text-indigo-500">
              {API_AVAILABLE ? 'Database' : 'Vault'}
            </span>
          </h1>
          <p className="text-slate-400">
            {API_AVAILABLE
              ? `Explore ${totalCount.toLocaleString()} titles from RAWG's live database`
              : 'Discover your next obsession among our handcrafted titles.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search library..."
              value={inputValue}
              onChange={handleSearch}
              className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all w-full sm:w-72"
            />
            {loading && inputValue && (
              <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
            )}
          </div>

          {/* Genre filter */}
          <div className="relative">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={genre}
              onChange={(e) => handleGenre(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-10 outline-none focus:border-indigo-500/50 appearance-none cursor-pointer w-full"
            >
              <option value="all" className="bg-slate-900">All Categories</option>
              {/* RAWG genre slugs */}
              {API_AVAILABLE ? (
                <>
                  <option value="action" className="bg-slate-900">Action</option>
                  <option value="rpg" className="bg-slate-900">RPG</option>
                  <option value="shooter" className="bg-slate-900">Shooter</option>
                  <option value="adventure" className="bg-slate-900">Adventure</option>
                  <option value="strategy" className="bg-slate-900">Strategy</option>
                  <option value="simulation" className="bg-slate-900">Simulation</option>
                  <option value="puzzle" className="bg-slate-900">Puzzle</option>
                  <option value="sports" className="bg-slate-900">Sports</option>
                  <option value="racing" className="bg-slate-900">Racing</option>
                  <option value="fighting" className="bg-slate-900">Fighting</option>
                  <option value="indie" className="bg-slate-900">Indie</option>
                  <option value="horror" className="bg-slate-900">Horror</option>
                </>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-8 flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <FiAlertCircle className="shrink-0" />
          <span>Failed to load from RAWG: {error} — showing cached data.</span>
        </div>
      )}

      {/* ── Grid ── */}
      <AnimatePresence mode="wait">
        {loading && games.length === 0 ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-slate-800" />
                <div className="p-6 space-y-3 bg-slate-900/50">
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {games.map((game, idx) => (
                <motion.div
                  layout
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl glass-panel border-white/5 group-hover:border-indigo-500/50 transition-all duration-500">
                    {/* Image */}
                    <Link
                      to={`/game/${game.slug || game.id}`}
                      className="aspect-[16/10] block overflow-hidden relative"
                    >
                      {game.image ? (
                        <img
                          src={game.image}
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 text-sm">
                          No Image
                        </div>
                      )}
                      {/* Hover overlay — scoped to image only */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                          <FiEye className="text-xl" />
                        </div>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black tracking-widest uppercase py-0.5 px-2 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                            {game.genre}
                          </span>
                          {game.tier && (
                            <span className={`text-[10px] font-black uppercase py-0.5 px-2 rounded-md border ${
                              game.tier === 'Mighty' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                              game.tier === 'Strong' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              game.tier === 'Fair'   ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                                      'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {game.tier}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                          ⭐ {game.rating || 'N/A'}
                        </div>
                      </div>

                      <Link to={`/game/${game.slug || game.id}`}>
                        <h3 className="text-lg font-bold mb-3 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                          {game.title}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap gap-2 mb-5">
                        {game.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="font-black text-white">
                            {game.price === 0 ? 'FREE' : `$${game.price}`}
                          </span>
                          {game.metacritic && (
                            <span className="text-[10px] text-slate-500">
                              Metacritic: {game.metacritic}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(game);
                          }}
                          className={`p-2 rounded-lg transition-all ${
                            cart.find((item) => item.id === game.id)
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cart.find((item) => item.id === game.id)
                            ? <FiCheck className="w-4 h-4" />
                            : <FiShoppingCart className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {!loading && games.length === 0 && (
        <div className="text-center py-40 glass-panel">
          <FiSearch className="text-6xl text-slate-700 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">No games found</h2>
          <p className="text-slate-500 mb-8">Try adjusting your filters or search query.</p>
          <button
            onClick={clearFilters}
            className="text-indigo-400 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Pagination (API mode only) ── */}
      {API_AVAILABLE && games.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FiChevronLeft /> Prev
          </button>
          <span className="text-slate-400 text-sm">
            Page <strong className="text-white">{page}</strong>
            {totalCount > 0 && (
              <> of <strong className="text-white">{Math.ceil(totalCount / 20)}</strong></>
            )}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || loading || (totalCount > 0 && page >= Math.ceil(totalCount / 20))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;
