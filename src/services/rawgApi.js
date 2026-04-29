/**
 * OpenCritic API Service (via RapidAPI)
 *
 * Endpoint base: https://opencritic-api.p.rapidapi.com
 * Key env var:   REACT_APP_OPENCRITIC_KEY
 *
 * Endpoints used:
 *   GET /game/popular              — popular / trending games
 *   GET /game/recently-released    — new releases
 *   GET /game/search?criteria=q    — title search
 *   GET /game/{id}                 — single game detail
 */

const API_KEY = process.env.REACT_APP_OPENCRITIC_KEY;
const BASE_URL = 'https://opencritic-api.p.rapidapi.com';

export const API_AVAILABLE = !!API_KEY;

const HEADERS = {
  'x-rapidapi-key': API_KEY || '',
  'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
  'Content-Type': 'application/json',
};

// Image CDN prefix
const IMG = 'https://img.opencritic.com/';

// ─── Tier → price mapping (OpenCritic doesn't expose prices) ────────────────
const tierPrice = (tier) => {
  if (!tier) return 29.99;
  switch (tier.toLowerCase()) {
    case 'mighty': return 59.99;
    case 'strong': return 49.99;
    case 'fair':   return 29.99;
    default:       return 19.99;
  }
};

// ─── Normalise an OpenCritic game object into our app's shape ───────────────
export const normalizeGame = (raw) => {
  const boxImg   = raw.images?.box?.og    ? IMG + raw.images.box.og    : null;
  const bannerImg = raw.images?.banner?.og ? IMG + raw.images.banner.og : null;

  // Use banner for wide cards, box for portrait cards
  const primaryImage = bannerImg || boxImg;

  const platforms = (raw.Platforms || []).map((p) => p.shortName || p.name);
  const genres    = (raw.Genres   || []).map((g) => g.name);

  // Derive rating on 0–5 scale from topCriticScore (0–100)
  const rating = raw.topCriticScore != null
    ? parseFloat((raw.topCriticScore / 20).toFixed(1))
    : null;

  return {
    id:          String(raw.id),
    slug:        String(raw.id),   // OpenCritic uses numeric IDs
    title:       raw.name || 'Unknown',
    genre:       genres[0] || platforms[0] || 'Game',
    image:       primaryImage,
    boxImage:    boxImg,
    bannerImage: bannerImg,
    rating,
    price:       tierPrice(raw.tier),
    discount:    0,
    tags:        genres.slice(0, 4),
    developer:   raw.Companies?.find((c) => c.type === 'DEVELOPER')?.name
                 || raw.Companies?.[0]?.name
                 || 'Unknown',
    platform:    platforms,
    releaseDate: raw.firstReleaseDate?.split('T')[0] || null,
    description: raw.description_raw || raw.description || null,
    metacritic:  raw.topCriticScore != null ? Math.round(raw.topCriticScore) : null,
    playtime:    null,
    screenshots: [],
    website:     raw.url || null,
    tier:        raw.tier || null,
    _raw:        raw,
  };
};

// ─── Raw fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path) {
  if (!API_AVAILABLE) throw new Error('NO_API_KEY');
  const res = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`OpenCritic ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

/** Popular / trending games */
export const fetchTrendingGames = async (count = 8) => {
  const data = await apiFetch('/game/popular');
  const results = (Array.isArray(data) ? data : [])
    .filter((g) => g.images?.box?.og || g.images?.banner?.og)
    .slice(0, count)
    .map(normalizeGame);
  return { count: results.length, next: null, results };
};

/** Recently-released games */
export const fetchRecentGames = async (count = 20) => {
  const data = await apiFetch('/game/recently-released');
  const results = (Array.isArray(data) ? data : [])
    .filter((g) => g.images?.box?.og || g.images?.banner?.og)
    .slice(0, count)
    .map(normalizeGame);
  return { count: results.length, next: null, results };
};

/** Paginated list — hits the general /game endpoint to get all games instead of just recent/popular */
export const fetchGames = async ({
  page = 1,
  pageSize = 20,
  ordering = '-metacritic',
  search,
} = {}) => {
  if (search) return searchGames(search, page);

  const skip = (page - 1) * pageSize;
  const sort = ordering.includes('released') ? 'date' : 'score';
  
  try {
    // Attempt standard OpenCritic pagination: ?skip=0&sort=score etc. 
    // Fallback to array slicing if the API ignores skip
    const data = await apiFetch(`/game?skip=${skip}&sort=${sort}`);
    const resultsArray = Array.isArray(data) ? data : data.results || [];
    
    const all = resultsArray
      .filter((g) => g.images?.box?.og || g.images?.banner?.og)
      .map(normalizeGame);

    // If skip worked, data is already paginated. If it returned everything, slice it.
    const isPaginated = all.length <= pageSize * 2; 
    
    if (isPaginated) {
      return { count: 1000, next: all.length > 0, results: all.slice(0, pageSize) };
    } else {
      const results = all.slice(skip, skip + pageSize);
      return { count: all.length, next: results.length === pageSize, results };
    }
  } catch (error) {
    // If /game fails, fallback to popular or hall-of-fame
    const data = await apiFetch('/game/hall-of-fame');
    const all = (Array.isArray(data) ? data : [])
      .filter((g) => g.images?.box?.og || g.images?.banner?.og)
      .map(normalizeGame);
    const start = (page - 1) * pageSize;
    return { count: all.length, next: start + pageSize < all.length, results: all.slice(start, start + pageSize) };
  }
};

/** Search games by title */
export const searchGames = async (query, page = 1, pageSize = 20) => {
  const encoded = encodeURIComponent(query);
  const data = await apiFetch(`/game/search?criteria=${encoded}`);
  const all = (Array.isArray(data) ? data : [])
    .filter((g) => g.images?.box?.og || g.images?.banner?.og)
    .map(normalizeGame);

  const start = (page - 1) * pageSize;
  const results = all.slice(start, start + pageSize);
  return { count: all.length, next: all.length > start + pageSize, results };
};

/** Fetch games by genre natively using OpenCritic genre IDs */
export const fetchGamesByGenre = async (genreSlug, page = 1, count = 20) => {
  // Map our UI category slugs to real OpenCritic genre IDs
  const openCriticGenreIds = {
    action: 27, rpg: 77, shooter: 79, // 79 = FPS
    adventure: 76, strategy: 87, simulation: 75,
    puzzle: 97, sports: 86, racing: 84,
    fighting: 6, indie: 94, horror: 95
  };
  
  const genreId = openCriticGenreIds[genreSlug] || 27; // fallback to Action
  const skip = (page - 1) * count;
  
  try {
     // Fetch natively using genres and skip params
     const data = await apiFetch(`/game?genres=${genreId}&skip=${skip}&sort=score`);
     const resultsArray = Array.isArray(data) ? data : data.results || [];
     
     const allMatching = resultsArray
      .filter((g) => g.images?.box?.og || g.images?.banner?.og)
      .map(normalizeGame);

     // If skip works in OpenCritic:
     const isPaginated = allMatching.length <= count * 2;
     
     if (isPaginated) {
        return { count: 1000, next: allMatching.length > 0, results: allMatching.slice(0, count) };
     } else {
        const results = allMatching.slice(skip, skip + count);
        return { count: allMatching.length, next: results.length === count, results };
     }
  } catch (err) {
     return { count: 0, next: false, results: [] };
  }
};

/** Fetch a single game by its OpenCritic numeric ID */
export const fetchGameById = async (id) => {
  const data = await apiFetch(`/game/${id}`);
  return normalizeGame(data);
};

/** Fetch game screenshots (OpenCritic has a media endpoint) */
export const fetchGameScreenshots = async (id) => {
  try {
    const data = await apiFetch(`/game/${id}/screenshots`);
    if (Array.isArray(data)) {
      return data
        .map((s) => (s.fullRes ? IMG + s.fullRes : s.thumbnail ? IMG + s.thumbnail : null))
        .filter(Boolean);
    }
  } catch (_) {
    // screenshots endpoint may not exist for all games — silent fail
  }
  return [];
};

/** Upcoming games */
export const fetchUpcomingGames = async (count = 20) => {
  const data = await apiFetch('/game/upcoming');
  const results = (Array.isArray(data) ? data : [])
    .filter((g) => g.images?.box?.og || g.images?.banner?.og)
    .slice(0, count)
    .map(normalizeGame);
  return { count: results.length, next: null, results };
};

/** Alias kept for hook compatibility */
export const fetchTopRatedGames = (count = 20) => fetchGames({ pageSize: count, ordering: '-metacritic' });
