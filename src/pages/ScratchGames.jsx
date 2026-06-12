import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const myGames = [
  { id: '1157118622', title: 'Scratch Game 1' },
  { id: '1161913547', title: 'Scratch Game 2' },
  { id: '1163241738', title: 'Scratch Game 3' },
  { id: '1164894421', title: 'Scratch Game 4' },
  { id: '1167560829', title: 'Scratch Game 5' },
  { id: '1169095508', title: 'Scratch Game 6' },
  { id: '1172414406', title: 'Scratch Game 7' },
  { id: '1174160548', title: 'Scratch Game 8' },
  { id: '1177797667', title: 'Scratch Game 9' },
  { id: '1179570810', title: 'Scratch Game 10' },
];

const popularGames = [
  { id: '10128407', title: 'Paper Minecraft' },
  { id: '105500895', title: 'Geometry Dash' },
  { id: '110543264', title: 'Slither.io' },
  { id: '351982746', title: 'Getting Over It' },
  { id: '400045091', title: 'Subway Surfers' },
  { id: '137943574', title: 'Five Nights at Freddys' },
  { id: '493120398', title: 'THE GREAT SNAKE ESCAPE' },
  { id: '1285171146', title: 'Frozen Frenzy' },
  { id: '847915138', title: 'Paper Plane Fly' },
  { id: '1132475012', title: 'Pick A Lock' },
  { id: '405198495', title: 'pipe puzzles' },
  { id: '134204916', title: 'Piano' },
  { id: '1124350480', title: 'Slime Platformer v2.0' },
  { id: '1274358391', title: 'Fruit Frenzy! ' },
  { id: '208527646', title: 'バルーンサッカー / Balloon Football' },
  { id: '1041557087', title: 'Key Master' },
];

const ScratchGames = () => {
  const [activeTab, setActiveTab] = useState('myGames');

  const displayedGames = activeTab === 'myGames' ? myGames : popularGames;

  return (
    <div className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16 relative"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 text-transparent bg-clip-text">
          Scratch Games
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Explore interactive games created with Scratch. Click on a game below to start playing!
        </p>

        {/* Tab Switcher */}
        <div className="flex justify-center items-center space-x-2 bg-slate-800/50 p-1.5 rounded-2xl w-max mx-auto border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('myGames')}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'myGames'
                ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            My Games
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'popular'
                ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            Popular Games
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {displayedGames.map((game, index) => (
          <motion.div
            key={`${activeTab}-${game.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Link to={`/scratch-game/${game.id}`} className="group block relative rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col">
              <div className="aspect-[4/3] overflow-hidden bg-slate-900 relative shrink-0">
                <img
                  src={`https://cdn2.scratch.mit.edu/get_image/project/${game.id}_480x360.png`}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full bg-indigo-600/80 backdrop-blur-sm flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
              <div className="p-5 flex-grow flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{game.title}</h3>
                <p className="text-sm text-slate-400 mt-2">Click to play this game!</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScratchGames;
