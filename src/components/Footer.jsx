import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiArrowRight, FiCheck } from 'react-icons/fi';
import logo from '../images/logo.png';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      
      // Reset status after a few seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }, 1000);
  };
  return (
    <footer className="relative mt-20 border-t border-white/5 pt-20 pb-10 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6 lg:col-span-4">
            <Link to="/" className="flex items-center gap-3 group">
              {logo ? (
                <img src={logo} alt="Nexus Gaming" className="h-8 w-8 object-contain transition-transform group-hover:rotate-12" />
              ) : (
                <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center text-sm font-black">N</div>
              )}
              <span className="text-xl font-bold tracking-wider neon-text">NEXUS</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The next generation gaming platform. Discover, play, and connect with millions of players worldwide.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com/ZavenDavtian" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20">
                <FiGithub className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4">
              {[
                { name: 'Gaming', path: '/gallery' },
                { name: 'Pricing', path: '/pricing' },
                { name: 'Community', path: '/community' }
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                    <FiArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4">
              {[{name: 'Privacy Policy', path: '/privacy-policy'}].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                    <FiArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6 lg:col-span-4 md:col-span-2">
            <h4 className="text-white font-bold mb-6">Stay Updated</h4>
            <p className="text-slate-400 text-sm">Join our newsletter to get the latest updates and rewards.</p>
            <form onSubmit={handleSubscribe} className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === 'loading' || status === 'success'}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[60px]"
              >
                {status === 'loading' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : status === 'success' ? (
                  <FiCheck className="w-4 h-4" />
                ) : (
                  'Join'
                )}
              </button>
            </form>
            {status === 'success' && (
              <p className="text-emerald-400 text-xs mt-2">Successfully subscribed to newsletter!</p>
            )}
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-xs">
            © 2026 Nexus Gaming. All rights reserved. Built for the future of entertainment.
          </p>
          <div className="flex gap-8">
            <span className="text-slate-500 text-xs hover:text-slate-300 cursor-pointer transition-colors">System Status: Online</span>
            <span className="text-slate-500 text-xs hover:text-slate-300 cursor-pointer transition-colors">EN | USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
