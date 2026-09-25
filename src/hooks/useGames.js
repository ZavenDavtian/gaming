import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllLocalGames,
  fetchLocalGamesByGenre,
  fetchLocalGameById,
} from '../services/localApi';

// --------------------------------------------------------------------------
// useGamesList — paginated / filtered list (used by Gallery)
// --------------------------------------------------------------------------
export const useGamesList = ({ search = '', genre = 'all', page = 1 } = {}) => {
  const [baseGames, setBaseGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      let data;
      if (genre !== 'all') {
        data = await fetchLocalGamesByGenre(genre, page, 20);
      } else {
        const all = await fetchAllLocalGames();
        const start = (page - 1) * 20;
        data = {
          count: all.length,
          next: all.length > start + 20,
          results: all.slice(start, start + 20)
        };
      }

      const merged = page === 1 ? data.results : data.results;
      setBaseGames(prev => page === 1 ? merged : [...prev, ...merged]);
      setTotalCount(data.count);
      setHasMore(data.next);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setBaseGames([]);
    } finally {
      setLoading(false);
    }
  }, [genre, page]); 

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Client-side search filter
  const games = search
    ? baseGames.filter((g) =>
        g.title?.toLowerCase().includes(search.toLowerCase()) ||
        g.genre?.toLowerCase().includes(search.toLowerCase()) ||
        g.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : baseGames;

  return {
    games,
    loading,
    error,
    totalCount: search ? games.length : totalCount,
    hasMore: search ? false : hasMore,
    refetch: load,
  };
};

// --------------------------------------------------------------------------
// useTrendingGames — for Home hero section
// --------------------------------------------------------------------------
export const useTrendingGames = (count = 8) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const all = await fetchAllLocalGames();
        if (!cancelled) setGames(all.slice(0, count));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [count]);

  return { games, loading, error };
};

// --------------------------------------------------------------------------
// useFeaturedGame — top game as hero
// --------------------------------------------------------------------------
export const useFeaturedGame = () => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const all = await fetchAllLocalGames();
        // Pick the first item as the featured game
        if (!cancelled) setGame(all[0] || null);
      } catch {
        // Ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { game, loading };
};

// --------------------------------------------------------------------------
// useGameDetail — full detail + screenshots (used by GameDetails page)
// --------------------------------------------------------------------------
export const useGameDetail = (idOrSlug) => {
  const [game, setGame] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const detail = await fetchLocalGameById(idOrSlug);
        if (!cancelled) {
          if (!detail) {
            setError("Game not found.");
          } else {
            setGame(detail);
            setScreenshots(detail.screenshots || []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [idOrSlug]);

  return { game, screenshots, loading, error };
};

// --------------------------------------------------------------------------
// useTopRatedGames — top rated all time (for a potential "Charts" section)
// --------------------------------------------------------------------------
export const useTopRatedGames = (count = 20) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const all = await fetchAllLocalGames();
        if (!cancelled) setGames(all.slice(0, count));
      } catch {
        // Ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [count]);

  return { games, loading };
};
