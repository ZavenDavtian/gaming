// Snake Arena Skins & Color Themes

export const SNAKE_SKINS = [
  {
    id: 'cyber-matrix',
    name: 'Cyber Matrix',
    tag: 'CYBERPUNK',
    description: 'Electric teal with high-voltage cyan digital energy glow.',
    primary: '#06b6d4',      // cyan-500
    secondary: '#0891b2',    // cyan-600
    accent: '#22d3ee',       // cyan-400
    glow: 'rgba(6, 182, 212, 0.7)',
    eyeColor: '#ffffff',
    pupilColor: '#083344',
    tongueColor: '#22d3ee',
    boostTrail: '#00f5ff',
    pattern: 'matrix',
  },
  {
    id: 'solar-dragon',
    name: 'Solar Dragon',
    tag: 'LEGENDARY',
    description: 'Blazing crimson and molten gold with fiery trail particles.',
    primary: '#f97316',      // orange-500
    secondary: '#dc2626',    // red-600
    accent: '#facc15',       // yellow-400
    glow: 'rgba(249, 115, 22, 0.75)',
    eyeColor: '#fef08a',
    pupilColor: '#450a0a',
    tongueColor: '#ef4444',
    boostTrail: '#ff4d00',
    pattern: 'fire',
  },
  {
    id: 'vaporwave-neon',
    name: 'Vapor Neon',
    tag: 'RETRO',
    description: 'Synthwave hot magenta and radiant violet with retro glow.',
    primary: '#ec4899',      // pink-500
    secondary: '#8b5cf6',    // purple-500
    accent: '#f472b6',       // pink-400
    glow: 'rgba(236, 72, 153, 0.75)',
    eyeColor: '#ffffff',
    pupilColor: '#3b0764',
    tongueColor: '#f43f5e',
    boostTrail: '#ff007f',
    pattern: 'stripes',
  },
  {
    id: 'toxic-acid',
    name: 'Toxic Venom',
    tag: 'BIOHAZARD',
    description: 'Radioactive lime and venomous yellow with chemical sheen.',
    primary: '#10b981',      // emerald-500
    secondary: '#84cc16',    // lime-500
    accent: '#a3e635',       // lime-400
    glow: 'rgba(132, 204, 22, 0.75)',
    eyeColor: '#fef08a',
    pupilColor: '#052e16',
    tongueColor: '#84cc16',
    boostTrail: '#39ff14',
    pattern: 'spots',
  },
  {
    id: 'cosmic-void',
    name: 'Cosmic Void',
    tag: 'MYTHIC',
    description: 'Deep starlight obsidian and ultraviolet nebula energy.',
    primary: '#6366f1',      // indigo-500
    secondary: '#4338ca',    // indigo-700
    accent: '#c084fc',       // purple-400
    glow: 'rgba(99, 102, 241, 0.8)',
    eyeColor: '#e0e7ff',
    pupilColor: '#1e1b4b',
    tongueColor: '#818cf8',
    boostTrail: '#7928ca',
    pattern: 'galaxy',
  },
  {
    id: 'rainbow-prism',
    name: 'Rainbow Prism',
    tag: 'SPECIAL',
    description: 'Dynamic chromatic spectrum shifting across the body.',
    primary: '#f43f5e',
    secondary: '#3b82f6',
    accent: '#10b981',
    glow: 'rgba(255, 255, 255, 0.8)',
    eyeColor: '#ffffff',
    pupilColor: '#0f172a',
    tongueColor: '#e11d48',
    boostTrail: '#ff00aa',
    pattern: 'rainbow',
  },
  {
    id: 'glacial-frost',
    name: 'Glacial Frost',
    tag: 'ELEMENTAL',
    description: 'Crystalline arctic blue and diamond white frost aura.',
    primary: '#38bdf8',      // sky-400
    secondary: '#0284c7',    // sky-600
    accent: '#e0f2fe',       // sky-100
    glow: 'rgba(56, 189, 248, 0.75)',
    eyeColor: '#ffffff',
    pupilColor: '#082f49',
    tongueColor: '#38bdf8',
    boostTrail: '#00d4ff',
    pattern: 'crystal',
  },
  {
    id: 'golden-emperor',
    name: 'Golden Emperor',
    tag: 'ROYAL',
    description: 'Pure 24K metallic luster crowned with sovereign amber aura.',
    primary: '#eab308',      // yellow-500
    secondary: '#ca8a04',    // yellow-600
    accent: '#fef08a',       // yellow-200
    glow: 'rgba(234, 179, 8, 0.85)',
    eyeColor: '#ffffff',
    pupilColor: '#422006',
    tongueColor: '#f59e0b',
    boostTrail: '#ffd700',
    pattern: 'gold',
  },
];

export const getSkinById = (id) => {
  return SNAKE_SKINS.find((s) => s.id === id) || SNAKE_SKINS[0];
};

export const BOT_NAMES = [
  'NeonStriker', 'ShadowViper', 'CyberPulse', 'ApexPredator', 'QuantumGlow',
  'TitanCrusher', 'VoidWalker', 'HyperFang', 'PlasmaRider', 'Specter9',
  'ZenithDragon', 'PixelBite', 'InfernoKing', 'AeroVenom', 'FrostBite',
  'VoltSurge', 'NovaDrifter', 'KobraKai', 'OmegaZero', 'EchoSnake',
  'SolarFlare', 'GlitchBeast', 'VortexHunter', 'ChaosCoil', 'AlphaWolf'
];
