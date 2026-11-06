// Tank Battle - Map Layouts and Tactical Arenas

export const MAPS = [
  {
    id: 'cyber-depot',
    name: 'Cyber Depot',
    theme: 'cyber',
    tagline: 'High-tech tactical freight complex with urban choke points',
    width: 1800,
    height: 1400,
    backgroundColor: '#0a0f1d',
    gridColor: 'rgba(56, 189, 248, 0.08)',
    boundaryColor: '#0284c7',
    spawns: [
      { x: 180, y: 700, angle: 0 },
      { x: 1620, y: 700, angle: Math.PI },
      { x: 900, y: 160, angle: Math.PI / 2 },
      { x: 900, y: 1240, angle: -Math.PI / 2 },
    ],
    powerupPads: [
      { x: 900, y: 700 }, // Center
      { x: 450, y: 400 },
      { x: 1350, y: 1000 },
      { x: 450, y: 1000 },
      { x: 1350, y: 400 },
    ],
    // Generates walls: 'brick' (destructible), 'steel' (bounces bullets), 'water' (hazard)
    generateObstacles: () => {
      const obstacles = [];
      const barrels = [];

      // Center fortified pavilion
      // Steel corner posts
      obstacles.push({ type: 'steel', x: 740, y: 560, w: 40, h: 40 });
      obstacles.push({ type: 'steel', x: 1020, y: 560, w: 40, h: 40 });
      obstacles.push({ type: 'steel', x: 740, y: 800, w: 40, h: 40 });
      obstacles.push({ type: 'steel', x: 1020, y: 800, w: 40, h: 40 });

      // Brick barriers around center
      obstacles.push({ type: 'brick', x: 800, y: 560, w: 80, h: 40, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 920, y: 560, w: 80, h: 40, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 800, y: 800, w: 80, h: 40, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 920, y: 800, w: 80, h: 40, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 740, y: 620, w: 40, h: 70, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 740, y: 710, w: 40, h: 70, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1020, y: 620, w: 40, h: 70, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1020, y: 710, w: 40, h: 70, health: 40, maxHealth: 40 });

      // Left flank warehouses
      obstacles.push({ type: 'steel', x: 300, y: 250, w: 50, h: 220 });
      obstacles.push({ type: 'brick', x: 350, y: 250, w: 120, h: 50, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 350, y: 420, w: 120, h: 50, health: 40, maxHealth: 40 });

      obstacles.push({ type: 'steel', x: 300, y: 930, w: 50, h: 220 });
      obstacles.push({ type: 'brick', x: 350, y: 930, w: 120, h: 50, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 350, y: 1100, w: 120, h: 50, health: 40, maxHealth: 40 });

      // Right flank warehouses
      obstacles.push({ type: 'steel', x: 1450, y: 250, w: 50, h: 220 });
      obstacles.push({ type: 'brick', x: 1330, y: 250, w: 120, h: 50, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1330, y: 420, w: 120, h: 50, health: 40, maxHealth: 40 });

      obstacles.push({ type: 'steel', x: 1450, y: 930, w: 50, h: 220 });
      obstacles.push({ type: 'brick', x: 1330, y: 930, w: 120, h: 50, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1330, y: 1100, w: 120, h: 50, health: 40, maxHealth: 40 });

      // Mid-lane tactical corridors
      obstacles.push({ type: 'steel', x: 600, y: 320, w: 200, h: 40 });
      obstacles.push({ type: 'steel', x: 1000, y: 320, w: 200, h: 40 });
      obstacles.push({ type: 'steel', x: 600, y: 1040, w: 200, h: 40 });
      obstacles.push({ type: 'steel', x: 1000, y: 1040, w: 200, h: 40 });

      // Water moat strips (bullets pass over, tanks cannot cross)
      obstacles.push({ type: 'water', x: 550, y: 640, w: 60, h: 120 });
      obstacles.push({ type: 'water', x: 1190, y: 640, w: 60, h: 120 });

      // Explosive red barrels
      barrels.push({ id: 'b1', x: 500, y: 300, radius: 18, health: 25 });
      barrels.push({ id: 'b2', x: 1300, y: 300, radius: 18, health: 25 });
      barrels.push({ id: 'b3', x: 500, y: 1100, radius: 18, health: 25 });
      barrels.push({ id: 'b4', x: 1300, y: 1100, radius: 18, health: 25 });
      barrels.push({ id: 'b5', x: 680, y: 700, radius: 18, health: 25 });
      barrels.push({ id: 'b6', x: 1120, y: 700, radius: 18, health: 25 });

      return { obstacles, barrels };
    },
  },
  {
    id: 'neon-matrix',
    name: 'Neon Matrix',
    theme: 'matrix',
    tagline: 'Futuristic digital grid with ricochet pillars and lethal corridors',
    width: 1800,
    height: 1400,
    backgroundColor: '#070b14',
    gridColor: 'rgba(217, 70, 239, 0.08)',
    boundaryColor: '#d946ef',
    spawns: [
      { x: 180, y: 700, angle: 0 },
      { x: 1620, y: 700, angle: Math.PI },
      { x: 900, y: 150, angle: Math.PI / 2 },
      { x: 900, y: 1250, angle: -Math.PI / 2 },
    ],
    powerupPads: [
      { x: 900, y: 700 },
      { x: 350, y: 700 },
      { x: 1450, y: 700 },
      { x: 900, y: 250 },
      { x: 900, y: 1150 },
    ],
    generateObstacles: () => {
      const obstacles = [];
      const barrels = [];

      // Grid of reflective steel pillars (ideal for trick ricochets!)
      const pillarCoords = [
        [400, 350], [650, 350], [1150, 350], [1400, 350],
        [400, 1050], [650, 1050], [1150, 1050], [1400, 1050],
        [300, 700], [550, 700], [1250, 700], [1500, 700],
      ];
      pillarCoords.forEach(([px, py]) => {
        obstacles.push({ type: 'steel', x: px - 25, y: py - 25, w: 50, h: 50 });
      });

      // Central cross matrix
      obstacles.push({ type: 'steel', x: 875, y: 520, w: 50, h: 100 });
      obstacles.push({ type: 'steel', x: 875, y: 780, w: 50, h: 100 });
      obstacles.push({ type: 'steel', x: 720, y: 675, w: 100, h: 50 });
      obstacles.push({ type: 'steel', x: 980, y: 675, w: 100, h: 50 });

      // Brick maze walls
      obstacles.push({ type: 'brick', x: 500, y: 480, w: 180, h: 45, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1120, y: 480, w: 180, h: 45, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 500, y: 880, w: 180, h: 45, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1120, y: 880, w: 180, h: 45, health: 40, maxHealth: 40 });

      obstacles.push({ type: 'brick', x: 750, y: 220, w: 45, h: 160, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1005, y: 220, w: 45, h: 160, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 750, y: 1020, w: 45, h: 160, health: 40, maxHealth: 40 });
      obstacles.push({ type: 'brick', x: 1005, y: 1020, w: 45, h: 160, health: 40, maxHealth: 40 });

      // Explosive Barrels
      barrels.push({ id: 'b1', x: 900, y: 480, radius: 18, health: 25 });
      barrels.push({ id: 'b2', x: 900, y: 920, radius: 18, health: 25 });
      barrels.push({ id: 'b3', x: 680, y: 700, radius: 18, health: 25 });
      barrels.push({ id: 'b4', x: 1120, y: 700, radius: 18, health: 25 });

      return { obstacles, barrels };
    },
  },
  {
    id: 'volcanic-fortress',
    name: 'Volcanic Fortress',
    theme: 'volcanic',
    tagline: 'Molten magma facility with destructible battlements and choke points',
    width: 1800,
    height: 1400,
    backgroundColor: '#120907',
    gridColor: 'rgba(249, 115, 22, 0.08)',
    boundaryColor: '#ea580c',
    spawns: [
      { x: 180, y: 700, angle: 0 },
      { x: 1620, y: 700, angle: Math.PI },
      { x: 900, y: 160, angle: Math.PI / 2 },
      { x: 900, y: 1240, angle: -Math.PI / 2 },
    ],
    powerupPads: [
      { x: 900, y: 700 },
      { x: 500, y: 450 },
      { x: 1300, y: 950 },
      { x: 500, y: 950 },
      { x: 1300, y: 450 },
    ],
    generateObstacles: () => {
      const obstacles = [];
      const barrels = [];

      // Magma trenches (water type: hazard blocks tanks, allows shells)
      obstacles.push({ type: 'water', x: 650, y: 280, w: 500, h: 50 });
      obstacles.push({ type: 'water', x: 650, y: 1070, w: 500, h: 50 });
      obstacles.push({ type: 'water', x: 250, y: 550, w: 50, h: 300 });
      obstacles.push({ type: 'water', x: 1500, y: 550, w: 50, h: 300 });

      // Heavy brick fortifications
      obstacles.push({ type: 'brick', x: 450, y: 250, w: 140, h: 60, health: 50, maxHealth: 50 });
      obstacles.push({ type: 'brick', x: 1210, y: 250, w: 140, h: 60, health: 50, maxHealth: 50 });
      obstacles.push({ type: 'brick', x: 450, y: 1090, w: 140, h: 60, health: 50, maxHealth: 50 });
      obstacles.push({ type: 'brick', x: 1210, y: 1090, w: 140, h: 60, health: 50, maxHealth: 50 });

      // Central bunker
      obstacles.push({ type: 'steel', x: 720, y: 540, w: 60, h: 60 });
      obstacles.push({ type: 'steel', x: 1020, y: 540, w: 60, h: 60 });
      obstacles.push({ type: 'steel', x: 720, y: 800, w: 60, h: 60 });
      obstacles.push({ type: 'steel', x: 1020, y: 800, w: 60, h: 60 });

      obstacles.push({ type: 'brick', x: 800, y: 540, w: 200, h: 40, health: 50, maxHealth: 50 });
      obstacles.push({ type: 'brick', x: 800, y: 820, w: 200, h: 40, health: 50, maxHealth: 50 });

      // Mid-field explosive cache
      barrels.push({ id: 'vb1', x: 900, y: 500, radius: 20, health: 20 });
      barrels.push({ id: 'vb2', x: 900, y: 900, radius: 20, health: 20 });
      barrels.push({ id: 'vb3', x: 600, y: 700, radius: 20, health: 20 });
      barrels.push({ id: 'vb4', x: 1200, y: 700, radius: 20, health: 20 });
      barrels.push({ id: 'vb5', x: 400, y: 400, radius: 20, health: 20 });
      barrels.push({ id: 'vb6', x: 1400, y: 1000, radius: 20, health: 20 });

      return { obstacles, barrels };
    },
  },
];

export const getMapById = (id) => {
  return MAPS.find((m) => m.id === id) || MAPS[0];
};
