import { motion } from 'framer-motion';
import { FiCheck, FiX, FiAward, FiZap, FiShield } from 'react-icons/fi';

const plans = [
  {
    name: 'Starter',
    icon: <FiShield className="text-3xl text-slate-400" />,
    price: '0',
    description: 'Perfect for casual gamers just starting their journey.',
    features: [
      { text: 'Access to 50+ Indie Games', included: true },
      { text: 'Basic Social Profile', included: true },
      { text: 'Standard Download Speeds', included: true },
      { text: 'Community Support', included: true },
      { text: 'Advanced Analytics', included: false },
      { text: 'Priority Beta Access', included: false },
    ],
    highlight: false,
    color: 'slate'
  },
  {
    name: 'Pro Player',
    icon: <FiZap className="text-3xl text-indigo-400" />,
    price: '14.99',
    description: 'The ultimate choice for serious competitors.',
    features: [
      { text: 'Access to 300+ Premium Games', included: true },
      { text: 'Custom Profile Themes', included: true },
      { text: 'High-Speed Downloads', included: true },
      { text: 'Priority Support', included: true },
      { text: '10% Discount on In-Game Items', included: true },
      { text: 'Exclusive Badge', included: true },
    ],
    highlight: true,
    color: 'indigo'
  },
  {
    name: 'Legendary',
    icon: <FiAward className="text-3xl text-fuchsia-400" />,
    price: '29.99',
    description: 'Unleash your full potential with zero limits.',
    features: [
      { text: 'Complete Library Access (500+)', included: true },
      { text: 'VIP Discord Channel', included: true },
      { text: 'Ultra-Fast P2P Downloads', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'Early Access to AAA Titles', included: true },
      { text: 'Monthly Rewards Bundle', included: true },
    ],
    highlight: false,
    color: 'fuchsia'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const Pricing = () => {
  return (
    <div className="pb-20">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black mb-4 neon-text"
        >
          Level Up Your Experience
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 max-w-2xl mx-auto text-lg"
        >
          Choose the plan that fits your playstyle. All plans include 24/7 server uptime and secure game vaults.
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
      >
        {plans.map((plan) => (
          <motion.div 
            key={plan.name}
            variants={cardVariants}
            className={`glass-panel p-8 flex flex-col relative overflow-hidden ${
              plan.highlight ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : ''
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl shadow-lg">
                Most Popular
              </div>
            )}
            
            <div className="mb-6">
              <div className="mb-4">{plan.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{plan.description}</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-black">${plan.price}</span>
              <span className="text-slate-500 ml-2">/ month</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-slate-200' : 'text-slate-600'}`}>
                  {feature.included ? (
                    <FiCheck className="text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <FiX className="text-slate-700 mt-0.5 shrink-0" />
                  )}
                  {feature.text}
                </li>
              ))}
            </ul>

            <button className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
              plan.highlight 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}>
              Select Plan
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Pricing;
