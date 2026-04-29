export const currentUser = {
  id: 'user-001',
  username: 'NeonSlayer',
  avatar: null,
  level: 42,
  xp: 8750,
  xpToNext: 10000,
  gamesOwned: 127,
  achievements: 342,
  friends: 89,
  wishlist: ['stellar-frontiers', 'chrono-shift'],
  cart: [],
  notifications: 3,
};

export const topPlayers = [
  { rank: 1, username: 'PhantomX', level: 99, score: 982400, avatar: null },
  { rank: 2, username: 'CyberWolf', level: 95, score: 945200, avatar: null },
  { rank: 3, username: 'NightOracle', level: 92, score: 921000, avatar: null },
  { rank: 4, username: 'BlazeFury', level: 89, score: 898300, avatar: null },
  { rank: 5, username: 'ShadowPulse', level: 87, score: 876100, avatar: null },
];

export const recentActivity = [
  { type: 'achievement', text: 'NeonSlayer unlocked "Dragon Slayer"', time: '2m ago' },
  { type: 'purchase', text: 'PhantomX purchased Ashen Crown', time: '5m ago' },
  { type: 'review', text: 'CyberWolf reviewed Neon District 2049', time: '12m ago' },
  { type: 'achievement', text: 'NightOracle unlocked "Speed Demon"', time: '18m ago' },
  { type: 'friend', text: 'BlazeFury is now online', time: '25m ago' },
];
