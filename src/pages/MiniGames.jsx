import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAllLocalGames } from '../services/localApi';

const GAMES_PER_PAGE = 24;

const MiniGames = () => {
  const [allGames, setAllGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingGame, setPlayingGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [visibleCount, setVisibleCount] = useState(GAMES_PER_PAGE);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadGames = async () => {
      try {
        const games = await fetchAllLocalGames();
        if (!cancelled) {
          setAllGames(games);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    loadGames();
    return () => { cancelled = true; };
  }, []);

  // Extract unique genres from all games
  const genres = useMemo(() => {
    const genreSet = new Set();
    allGames.forEach(game => {
      if (game._raw?.genres) {
        game._raw.genres.forEach(g => genreSet.add(g));
      }
    });
    const sorted = Array.from(genreSet).sort();
    return ['All', ...sorted];
  }, [allGames]);

  // Filter games by search + genre
  const filteredGames = useMemo(() => {
    let result = allGames;

    if (selectedGenre !== 'All') {
      result = result.filter(g =>
        g._raw?.genres?.some(genre => genre === selectedGenre)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g._raw?.genres?.some(genre => genre.toLowerCase().includes(q)) ||
        g.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allGames, selectedGenre, searchQuery]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(GAMES_PER_PAGE);
  }, [selectedGenre, searchQuery]);

  const displayedGames = filteredGames.slice(0, visibleCount);
  const hasMore = visibleCount < filteredGames.length;

  // Infinite scroll observer
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + GAMES_PER_PAGE, filteredGames.length));
  }, [filteredGames.length]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadMore]);

  // Format genre label for display
  const formatGenre = (genre) => {
    return genre
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 relative"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text">
          Online Mini Games
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-2">
          Discover and play {allGames.length.toLocaleString()}+ free online games instantly in your browser.
        </p>
        <p className="text-sm text-slate-500">
          No downloads required — click and play!
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-10"
      >
        {/* Search Input */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search games by name, genre, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {genres.slice(0, 30).map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedGenre === genre
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-slate-800/50 text-slate-400 border border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
              }`}
            >
              {formatGenre(genre)}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-center text-sm text-slate-500 mt-4">
          Showing {displayedGames.length} of {filteredGames.length.toLocaleString()} games
          {selectedGenre !== 'All' && ` in "${formatGenre(selectedGenre)}"`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-slate-400 animate-pulse">Loading games...</p>
        </div>
      ) : error ? (
        <div className="text-center text-rose-500 bg-rose-500/10 p-6 rounded-2xl max-w-lg mx-auto border border-rose-500/20">
          <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-semibold mb-1">Failed to load games</p>
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl font-bold text-slate-400 mb-2">No games found</p>
          <p className="text-slate-500">Try adjusting your search or filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
            className="mt-4 px-6 py-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Game Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (index % GAMES_PER_PAGE) * 0.02 }}
                className="h-full"
              >
                <button
                  onClick={() => setPlayingGame(game)}
                  className="w-full text-left group block relative rounded-2xl overflow-hidden bg-slate-900/50 border border-white/5 hover:border-emerald-500/40 transition-all duration-300 h-full flex flex-col hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-slate-800 relative shrink-0">
                    {game.image ? (
                      <img
                        src={game.image}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}

                    {/* Genre Badge */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {formatGenre(game.genre)}
                    </div>

                    {/* Free / IAP Badge */}
                    <div className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg ${
                      game._raw?.inGamePurchases === 'Yes'
                        ? 'bg-amber-500/90'
                        : 'bg-emerald-500/90'
                    }`}>
                      {game._raw?.inGamePurchases === 'Yes' ? 'FREE + IAP' : 'FREE'}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center text-white shadow-[0_0_25px_rgba(16,185,129,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-7 h-7 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {game.title}
                      </h3>
                      {game._raw?.genres && game._raw.genres.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game._raw.genres.slice(1, 4).map(g => (
                            <span key={g} className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
                              {formatGenre(g)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {game._raw?.mobileReady?.length || 0} platforms
                      </div>
                      <span className="text-emerald-500 text-xs font-semibold group-hover:text-emerald-400 transition-colors">
                        Play Now →
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          {/* Load More Sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500/60"></div>
            </div>
          )}
        </>
      )}

      {/* Game Player Modal */}
      <AnimatePresence>
        {playingGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setPlayingGame(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col"
            >
              {/* Modal Header */}
              <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/90 to-transparent z-10 flex justify-between items-center px-5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-400 text-sm truncate max-w-md">{playingGame.title}</span>
                  {playingGame.genre && (
                    <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md hidden sm:inline">
                      {formatGenre(playingGame.genre)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {playingGame._raw?.playgamaGameUrl && (
                    <a
                      href={playingGame._raw.playgamaGameUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="hidden sm:inline">Full Page</span>
                    </a>
                  )}
                  <button
                    onClick={() => setPlayingGame(null)}
                    className="p-2 bg-rose-500/20 hover:bg-rose-500/80 text-white rounded-lg backdrop-blur-md transition-all duration-200 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Game Iframe */}
              {playingGame.website ? (
                <iframe
                  src={playingGame.website}
                  title={playingGame.title}
                  className="w-full h-full border-0"
                  allow="fullscreen; accelerometer; camera; clipboard-read; clipboard-write; screen-wake-lock; speaker-selection; web-share; geolocation; gyroscope; microphone; xr-spatial-tracking; autoplay; encrypted-media; picture-in-picture; payment; publickey-credentials-get; publickey-credentials-create; storage-access; attribution-reporting; browsing-topics"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <p className="font-semibold">Game URL unavailable</p>
                    <p className="text-sm text-slate-500 mt-1">This game cannot be loaded right now.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MiniGames;
