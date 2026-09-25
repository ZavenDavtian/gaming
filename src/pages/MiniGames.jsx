import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchAllLocalGames } from '../services/localApi';

const MiniGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingGame, setPlayingGame] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchGames = async () => {
      try {
        const allGames = await fetchAllLocalGames();
        // Try to find games with 'online' in tags or title, or just fallback to some random subset
        const onlineGames = allGames.filter(g => 
          g.tags?.some(t => t.toLowerCase().includes('online')) || 
          g.title.toLowerCase().includes('online') ||
          g.platform.some(p => p.toLowerCase() === 'web' || p.toLowerCase() === 'desktop')
        );
        if (!cancelled) {
          // If no specific online games, just use a slice of all
          setGames(onlineGames.length > 0 ? onlineGames.slice(0, 50) : allGames.slice(0, 50));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchGames();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16 relative"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-transparent bg-clip-text">
          Online Mini Games
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Discover a huge collection of quick and fun online mini-games!
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-rose-500 bg-rose-500/10 p-4 rounded-2xl max-w-lg mx-auto border border-rose-500/20">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
              className="h-full"
            >
              <button 
                onClick={() => setPlayingGame(game)} 
                className="w-full text-left group block relative rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-emerald-500/50 transition-all duration-300 h-full flex flex-col"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-900 relative shrink-0">
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800" />
                  )}
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                    {game.price === 0 ? 'FREE' : `$${game.price}`}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-600/80 backdrop-blur-sm flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">{game.title}</h3>
                    <p className="text-xs text-emerald-500 font-medium mt-2 mb-1">{game.genre}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 truncate">Platform: {game.platform?.join(', ') || 'Web'}</p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Game Player Modal */}
      {playingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col">
            <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center px-4">
              <span className="font-bold text-emerald-400">{playingGame.title}</span>
              <button 
                onClick={() => setPlayingGame(null)}
                className="p-2 bg-rose-500/20 hover:bg-rose-500/80 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {playingGame.website ? (
              <iframe
                src={playingGame.website}
                title={playingGame.title}
                className="w-full h-full border-0"
                allow="fullscreen; accelerometer; camera; clipboard-read; clipboard-write; screen-wake-lock; speaker-selection; web-share; geolocation; gyroscope; microphone; xr-spatial-tracking; autoplay; encrypted-media; picture-in-picture"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Game URL is missing for this title.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniGames;
