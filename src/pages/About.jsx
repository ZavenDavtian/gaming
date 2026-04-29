import { motion } from 'framer-motion';
import { FiUsers, FiCpu, FiGlobe, FiTarget } from 'react-icons/fi';

const stats = [
  { label: 'Active Players', value: '2.5M+' },
  { label: 'Global Servers', value: '120+' },
  { label: 'Tournaments Yearly', value: '1,500+' },
  { label: 'Indie Partners', value: '450+' },
];

const values = [
  {
    icon: <FiTarget className="text-3xl text-indigo-400" />,
    title: 'Precision Driven',
    description: 'We optimize every millisecond of latency to ensure your skills are the only factor in victory.'
  },
  {
    icon: <FiCpu className="text-3xl text-fuchsia-400" />,
    title: 'Future Tech',
    description: 'Powered by the latest cloud-native architecture and real-time ray-tracing acceleration.'
  },
  {
    icon: <FiUsers className="text-3xl text-blue-400" />,
    title: 'Community First',
    description: 'A platform built by gamers, for gamers. Every feature is tuned based on player feedback.'
  },
  {
    icon: <FiGlobe className="text-3xl text-emerald-400" />,
    title: 'Global Reach',
    description: 'Connecting players across continents with high-fidelity voice and text communication.'
  }
];

const About = () => {
  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden mb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30" />
        
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-20 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
          >
            Redefining the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-500 neon-text">
              Gaming Experience
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg max-w-2xl"
          >
            Nexus was founded in 2024 with a single mission: to provide the most immersive and high-performance gaming platform on the planet.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="text-center p-8 glass-panel"
          >
            <div className="text-4xl font-black mb-2 text-white">{stat.value}</div>
            <div className="text-slate-400 font-medium text-sm tracking-widest uppercase">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Content Grid */}
      <section className="grid md:grid-cols-2 gap-20 items-center mb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop" 
            alt="Gaming Lab" 
            className="rounded-3xl relative z-10 border border-white/10 grayscale hover:grayscale-0 transition-all duration-700"
          />
        </motion.div>
        
        <div className="space-y-8">
          <h2 className="text-3xl font-black tracking-tight underline transition-colors decoration-indigo-500/50 decoration-4 underline-offset-8 mb-8">Our Vision</h2>
          <p className="text-slate-400 leading-relaxed text-lg">
            We believe that gaming is more than just entertainment—it's a competitive sport, a social hub, and a canvas for digital art. Every line of code in Nexus is written to honor that belief.
          </p>
          <p className="text-slate-400 leading-relaxed text-lg">
            From our proprietary data compression algorithms to our global CDN lattice, we've engineered every component to disappear, leaving only you and the game.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Our Core Pillars</h2>
          <p className="text-slate-500">The standards we live by every single day.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((v, idx) => (
            <motion.div 
              key={v.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="p-8 glass-panel border-t-4 border-t-indigo-500/30"
            >
              <div className="mb-6">{v.icon}</div>
              <h3 className="text-xl font-bold mb-4">{v.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
