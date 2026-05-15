import { motion } from 'framer-motion';
import { FiUsers, FiMessageCircle, FiVideo, FiTrendingUp } from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const Community = () => {
  return (
    <div className="pb-20">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black mb-4 neon-text"
        >
          Join The Nexus
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 max-w-2xl mx-auto text-lg"
        >
          Connect with millions of players worldwide. Share your achievements, join clans, and participate in daily events.
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16"
      >
        <motion.div variants={itemVariants} className="glass-panel p-8 group hover:border-indigo-500/50 transition-colors">
          <FiMessageCircle className="text-4xl text-indigo-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-3">General Forums</h3>
          <p className="text-slate-400">Discuss tactics, find teammates, and stay updated with the latest patch notes.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-8 group hover:border-fuchsia-500/50 transition-colors">
          <FiVideo className="text-4xl text-fuchsia-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-3">Live Streams</h3>
          <p className="text-slate-400">Watch top players stream their gameplay live. Learn from the pros or just enjoy the show.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-8 group hover:border-emerald-500/50 transition-colors">
          <FiUsers className="text-4xl text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-3">Clans & Guilds</h3>
          <p className="text-slate-400">Find your family. Join a clan or start your own and rise through the global leaderboards.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel p-8 group hover:border-yellow-500/50 transition-colors">
          <FiTrendingUp className="text-4xl text-yellow-400 mb-6 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-3">Tournaments</h3>
          <p className="text-slate-400">Compete in weekly tournaments to earn exclusive rewards, ranks, and bragging rights.</p>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-3xl mx-auto glass-panel p-8 text-center bg-indigo-600/10 border-indigo-500/20"
      >
        <h2 className="text-3xl font-black mb-4">Ready to drop in?</h2>
        <p className="text-slate-400 mb-6">Create your profile and start connecting instantly.</p>
        <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]">
          Join the Discord
        </button>
      </motion.div>
    </div>
  );
};

export default Community;
