let cachedGames = null;

// Call this to force a fresh load on next fetchAllLocalGames call
export const clearGamesCache = () => { cachedGames = null; };

export const normalizeLocalGame = (raw) => {
  const images = raw.images || [];
  const primaryImage = images[0] || null;

  return {
    id: String(raw.id),
    slug: raw.slug || String(raw.id),
    title: raw.title || 'Unknown',
    genre: (raw.genres && raw.genres[0]) || 'Game',
    image: primaryImage,
    boxImage: primaryImage,
    bannerImage: primaryImage,
    rating: 4.5, // Mock rating
    price: raw.inGamePurchases === 'Yes' ? 0 : 9.99, // Basic price inference
    discount: 0,
    tags: raw.tags?.slice(0, 4) || [],
    developer: 'Unknown',
    platform: raw.mobileReady || ['Web'],
    releaseDate: 'N/A',
    description: raw.description || null,
    metacritic: null,
    playtime: null,
    screenshots: images,
    website: raw.gameURL || null,
    tier: 'Fair',
    _raw: raw,
  };
};

export const fetchAllLocalGames = async () => {
  if (cachedGames) return cachedGames;

  try {
    const publicUrl = process.env.PUBLIC_URL || '';
    const res = await fetch(`${publicUrl}/games.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('Failed to load games.json');
    const data = await res.json();

    let allRawGames = [];
    if (data.segments && Array.isArray(data.segments)) {
      data.segments.forEach(segment => {
        if (segment.hits && Array.isArray(segment.hits)) {
          allRawGames = allRawGames.concat(segment.hits);
        }
      });
    }

    cachedGames = allRawGames.map(normalizeLocalGame);
    return cachedGames;
  } catch (error) {
    console.error('Error fetching local games:', error);
    return [];
  }
};

export const fetchLocalGames = async ({ page = 1, pageSize = 20 } = {}) => {
  const all = await fetchAllLocalGames();
  const start = (page - 1) * pageSize;
  const results = all.slice(start, start + pageSize);

  return {
    count: all.length,
    next: all.length > start + pageSize,
    results
  };
};

export const fetchLocalGamesByGenre = async (genre, page = 1, pageSize = 20) => {
  const all = await fetchAllLocalGames();
  const lowerGenre = genre.toLowerCase();
  
  const filtered = all.filter(g => 
    g.genre?.toLowerCase().includes(lowerGenre) ||
    g.tags?.some(t => t.toLowerCase().includes(lowerGenre))
  );

  const start = (page - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize);

  return {
    count: filtered.length,
    next: filtered.length > start + pageSize,
    results
  };
};

export const fetchLocalGameById = async (idOrSlug) => {
  const all = await fetchAllLocalGames();
  return all.find(g => g.id === String(idOrSlug) || g.slug === idOrSlug) || null;
};
