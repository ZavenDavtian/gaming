import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchGames,
  fetchGameById,
  fetchGameScreenshots,
  fetchTrendingGames,
  fetchGamesByGenre,
  API_AVAILABLE,
} from '../services/rawgApi';
import {
  games as staticGames,
  trendingGames as staticTrending,
  featuredGame as staticFeatured,
} from '../data/games';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
const normaliseStatic = (g) => ({
  ...g,
  id: String(g.id),
  slug: g.id,
  screenshots: g.image ? [g.image] : [],
  metacritic: null,
  playtime: null,
  website: null,
  description: g.description || null,
});

// --------------------------------------------------------------------------
// useGamesList — paginated / filtered list (used by Gallery)
// --------------------------------------------------------------------------
export const useGamesList = ({ search = '', genre = 'all', page = 1 } = {}) => {
  // baseGames: the full set loaded from the API (no search filter applied)
  const [baseGames, setBaseGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef(null);

  // ── API fetch: only re-runs when genre or page changes, NOT search ──────
  const load = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    // Static fallback (no API key)
    if (!API_AVAILABLE) {
      let result = [staticFeatured, ...staticGames].map(normaliseStatic);
      if (genre !== 'all') {
        const g = genre.toLowerCase();
        result = result.filter(
          (item) =>
            item.genre?.toLowerCase().includes(g) ||
            item.tags?.some((t) => t.toLowerCase() === g)
        );
      }
      setBaseGames(result);
      setTotalCount(result.length);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      let data;
      if (genre !== 'all') {
        data = await fetchGamesByGenre(genre, page, 20);
      } else {
        data = await fetchGames({ page, pageSize: 20, ordering: '-released' });
      }

      // Prepend local static games (with images) so they're always available
      const allLocal = [staticFeatured, ...staticGames].map(normaliseStatic);
      const apiIds = new Set(data.results.map((g) => String(g.id)));
      const localOnly = allLocal.filter((g) => !apiIds.has(String(g.id)));

      const merged = page === 1 ? [...localOnly, ...data.results] : data.results;
      setBaseGames(merged);
      setTotalCount(data.count);
      setHasMore(!!data.next);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setBaseGames([staticFeatured, ...staticGames].map(normaliseStatic));
    } finally {
      setLoading(false);
    }
  }, [genre, page]); // ← search intentionally excluded

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // ── Client-side search filter (no API call, images preserved) ───────────
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
      if (!API_AVAILABLE) {
        setGames(staticTrending.map(normaliseStatic));
        setLoading(false);
        return;
      }
      try {
        const data = await fetchTrendingGames(count);
        if (!cancelled) setGames(data.results);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setGames(staticTrending.map(normaliseStatic));
        }
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
// useFeaturedGame — top game from popular list as hero
// --------------------------------------------------------------------------
export const useFeaturedGame = () => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      if (!API_AVAILABLE) {
        setGame(normaliseStatic(staticFeatured));
        setLoading(false);
        return;
      }
      try {
        // Pick the highest-scored game from the popular list as the featured hero
        const data = await fetchTrendingGames(10);
        const sorted = [...data.results].sort(
          (a, b) => (b.metacritic || 0) - (a.metacritic || 0)
        );
        if (!cancelled) setGame(sorted[0] || null);
      } catch {
        if (!cancelled) setGame(normaliseStatic(staticFeatured));
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

      if (!API_AVAILABLE) {
        const found = staticGames.find(
          (g) => String(g.id) === String(idOrSlug) || g.id === idOrSlug
        ) || staticFeatured;
        setGame(normaliseStatic(found));
        setScreenshots(found?.image ? [found.image] : []);
        setLoading(false);
        return;
      }

      try {
        // OpenCritic IDs are numeric — fetch detail then screenshots separately
        const detail = await fetchGameById(idOrSlug);
        if (!cancelled) {
          setGame(detail);
          // Fetch screenshots in background; don't block render
          fetchGameScreenshots(idOrSlug)
            .then((shots) => { if (!cancelled) setScreenshots(shots); })
            .catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          const found = staticGames.find(
            (g) => String(g.id) === String(idOrSlug)
          );
          if (found) setGame(normaliseStatic(found));
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
      if (!API_AVAILABLE) {
        setGames(staticGames.map(normaliseStatic));
        setLoading(false);
        return;
      }
      try {
        const data = await fetchGames({ pageSize: count, ordering: '-metacritic' });
        if (!cancelled) setGames(data.results);
      } catch {
        if (!cancelled) setGames(staticGames.map(normaliseStatic));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [count]);

  return { games, loading };
};
