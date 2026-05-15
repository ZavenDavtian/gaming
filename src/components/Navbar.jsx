import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiShoppingCart, FiUser, FiSearch, FiTrash2, FiLoader, FiHeart } from 'react-icons/fi';
import { FaGoogle, FaEnvelope } from 'react-icons/fa';
import logo from '../images/logo.png';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'About', path: '/about' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'Contact', path: '/contact' },
];

const Navbar = () => {
  const { cart, removeFromCart, lastAddedId } = useCart();
  const { wishlist, removeFromWishlist, lastWishlistAddedId } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isWishlistShaking, setIsWishlistShaking] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(null);
  const searchInputRef = useRef(null);

  const handleLogin = () => {
    setIsLoggingIn(true);
    // Simulate authentication process
    setTimeout(() => {
      setIsLoggingIn(false);
      setUser({ name: 'Pro Gamer', email: 'gamer@nexusgaming.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer' });
      setIsLoginOpen(false);
    }, 2000);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchValue.trim())}`);
      setIsOpen(false);
      setIsSearchOpen(false);
      setSearchValue('');
    }
  };

  useEffect(() => {
    if (lastAddedId) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedId]);

  useEffect(() => {
    if (lastWishlistAddedId) {
      setIsWishlistShaking(true);
      const timer = setTimeout(() => setIsWishlistShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [lastWishlistAddedId]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b-0 rounded-none sm:rounded-2xl sm:mt-4 sm:mx-6">
        <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex flex-shrink-0 items-center gap-3 group">
            {logo ? (
              <img src={logo} alt="Nexus Gaming" className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <div className="h-10 w-10 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.6)] flex items-center justify-center text-xl font-black">N</div>
            )}
            <span className="text-xl font-bold tracking-wider neon-text hidden sm:block">NEXUS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-2 py-1 text-sm font-medium transition-colors duration-300 ${
                  location.pathname === link.path ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative flex items-center">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.input
                    ref={searchInputRef}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    type="text"
                    placeholder="Search games..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleSearch}
                    onBlur={() => !searchValue && setIsSearchOpen(false)}
                    className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-4 pr-10 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm"
                  />
                )}
              </AnimatePresence>
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`text-slate-400 hover:text-white transition-colors duration-300 ${isSearchOpen ? 'absolute right-3' : ''}`}
              >
                <FiSearch className="h-5 w-5" />
              </button>
            </div>
            <div className="relative" onMouseEnter={() => setIsCartOpen(true)} onMouseLeave={() => setIsCartOpen(false)}>
              <motion.button 
                animate={isShaking ? { 
                  x: [0, -4, 4, -4, 4, 0],
                  rotate: [0, -5, 5, -5, 5, 0] 
                } : {}}
                transition={{ duration: 0.4 }}
                className="text-slate-400 hover:text-white transition-colors duration-300 relative p-2"
              >
                <FiShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-fuchsia-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(192,38,211,0.8)]">
                    {cart.length}
                  </span>
                )}
              </motion.button>
              
              <AnimatePresence>
                {isCartOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-hidden glass-panel p-4 z-50 border-white/10 shadow-2xl flex flex-col"
                  >
                    <h3 className="font-bold mb-4 flex justify-between items-center shrink-0">
                      <span>Shopping Cart</span>
                      <span className="text-xs text-slate-500">{cart.length} items</span>
                    </h3>
                    
                    {cart.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-sm">
                        Your cart is empty
                      </div>
                    ) : (
                      <div className="flex flex-col min-h-0">
                        <div className="overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2 min-h-[50px] max-h-[50vh]">
                          {cart.map(item => (
                            <div key={item.id} className="flex gap-3 items-center group">
                              <img src={item.image} className="w-12 h-12 rounded object-cover shrink-0" alt="" />
                              <div className="flex-1 min-w-0">
                                <Link to={`/game/${item.slug || item.id}`} className="text-sm font-bold truncate block hover:text-indigo-400 transition-colors">{item.title}</Link>
                                <div className="text-xs text-indigo-400">${item.price}</div>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 text-slate-600 hover:text-red-500 transition-colors shrink-0"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shrink-0">
                          Checkout Now
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative" onMouseEnter={() => setIsWishlistOpen(true)} onMouseLeave={() => setIsWishlistOpen(false)}>
              <motion.button 
                animate={isWishlistShaking ? { 
                  x: [0, -4, 4, -4, 4, 0],
                  rotate: [0, -5, 5, -5, 5, 0] 
                } : {}}
                transition={{ duration: 0.4 }}
                className="text-slate-400 hover:text-rose-400 transition-colors duration-300 relative p-2 group"
              >
                <FiHeart className={`h-5 w-5 ${wishlist.length > 0 ? 'fill-current text-rose-500' : ''}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                    {wishlist.length}
                  </span>
                )}
              </motion.button>
              
              <AnimatePresence>
                {isWishlistOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-hidden glass-panel p-4 z-50 border-white/10 shadow-2xl flex flex-col"
                  >
                    <h3 className="font-bold mb-4 flex justify-between items-center shrink-0">
                      <span>Wishlist</span>
                      <span className="text-xs text-slate-500">{wishlist.length} items</span>
                    </h3>
                    
                    {wishlist.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-sm">
                        Your wishlist is empty
                      </div>
                    ) : (
                      <div className="flex flex-col min-h-0">
                        <div className="overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2 min-h-[50px] max-h-[50vh]">
                          {wishlist.map(item => (
                            <div key={item.id} className="flex gap-3 items-center group">
                              <img src={item.image} className="w-12 h-12 rounded object-cover shrink-0" alt="" />
                              <div className="flex-1 min-w-0">
                                <Link to={`/game/${item.slug || item.id}`} className="text-sm font-bold truncate block hover:text-indigo-400 transition-colors">{item.title}</Link>
                                <div className="text-xs text-rose-400">${item.price}</div>
                              </div>
                              <button 
                                onClick={() => removeFromWishlist(item.id)}
                                className="p-2 text-slate-600 hover:text-red-500 transition-colors shrink-0"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ))}
                        </div>
                        <Link to="/gallery" className="w-full shrink-0 flex items-center justify-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-sm transition-all">
                          View All Games
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            {user ? (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full bg-slate-800" />
                <span className="text-sm font-medium text-slate-200">{user.name}</span>
                <button onClick={() => setUser(null)} className="ml-2 text-slate-400 hover:text-red-500 transition-colors">
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all duration-300 hover:neon-glow hover:border-indigo-500/50"
              >
                <FiUser className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4 relative">
            <button 
              onClick={() => {
                setIsWishlistOpen(!isWishlistOpen);
                setIsCartOpen(false);
                setIsOpen(false);
              }}
              className="text-slate-400 relative p-2 hover:text-rose-400 transition-colors"
            >
              <FiHeart className={`h-6 w-6 ${wishlist.length > 0 ? 'fill-current text-rose-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {isWishlistOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-4 w-[320px] max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-hidden glass-panel p-4 z-50 border-white/10 shadow-2xl flex flex-col"
                >
                  <h3 className="font-bold mb-4 flex justify-between items-center shrink-0">
                    <span>Wishlist</span>
                    <span className="text-xs text-slate-500">{wishlist.length} items</span>
                  </h3>
                  
                  {wishlist.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      Your wishlist is empty
                    </div>
                  ) : (
                    <div className="flex flex-col min-h-0">
                      <div className="overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2 min-h-[50px] max-h-[50vh]">
                        {wishlist.map(item => (
                          <div key={item.id} className="flex gap-3 items-center group">
                            <img src={item.image} className="w-12 h-12 rounded object-cover shrink-0" alt="" />
                            <div className="flex-1 min-w-0 text-left">
                              <Link onClick={() => setIsWishlistOpen(false)} to={`/game/${item.slug || item.id}`} className="text-sm font-bold truncate block hover:text-indigo-400 transition-colors">{item.title}</Link>
                              <div className="text-xs text-rose-400">${item.price}</div>
                            </div>
                            <button 
                              onClick={() => removeFromWishlist(item.id)}
                              className="p-2 text-slate-600 hover:text-red-500 transition-colors shrink-0"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Link onClick={() => setIsWishlistOpen(false)} to="/gallery" className="w-full shrink-0 flex items-center justify-center py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-sm transition-all">
                        View All Games
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <button 
              onClick={() => {
                setIsCartOpen(!isCartOpen);
                setIsWishlistOpen(false);
                setIsOpen(false);
              }}
              className="text-slate-400 relative p-2"
            >
              <FiShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-fuchsia-600 text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {isCartOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-4 w-[320px] max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-hidden glass-panel p-4 z-50 border-white/10 shadow-2xl flex flex-col"
                >
                  <h3 className="font-bold mb-4 flex justify-between items-center shrink-0">
                    <span>Shopping Cart</span>
                    <span className="text-xs text-slate-500">{cart.length} items</span>
                  </h3>
                  
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-sm">
                      Your cart is empty
                    </div>
                  ) : (
                    <div className="flex flex-col min-h-0">
                      <div className="overflow-y-auto space-y-3 mb-4 custom-scrollbar pr-2 min-h-[50px] max-h-[50vh]">
                        {cart.map(item => (
                          <div key={item.id} className="flex gap-3 items-center group">
                            <img src={item.image} className="w-12 h-12 rounded object-cover shrink-0" alt="" />
                            <div className="flex-1 min-w-0 text-left">
                              <Link onClick={() => setIsCartOpen(false)} to={`/game/${item.slug || item.id}`} className="text-sm font-bold truncate block hover:text-indigo-400 transition-colors">{item.title}</Link>
                              <div className="text-xs text-indigo-400">${item.price}</div>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-slate-600 hover:text-red-500 transition-colors shrink-0"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shrink-0"
                      >
                        Checkout Now
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => {
                setIsOpen(!isOpen);
                setIsCartOpen(false);
                setIsWishlistOpen(false);
              }}
              className="text-slate-200 hover:text-white focus:outline-none"
            >
              {isOpen ? <FiX className="h-7 w-7" /> : <FiMenu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search games..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    handleSearch(e);
                    if (e.key === 'Enter') setIsOpen(false);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm"
                />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium ${
                    location.pathname === link.path
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-800" />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setUser(null); setIsOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl transition-colors duration-300"
                    >
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      setIsLoginOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl transition-colors duration-300 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  >
                    <FiUser className="h-5 w-5" />
                    <span>Login / Register</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>

      {/* ── Login Modal ── */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
               onClick={() => !isLoggingIn && setIsLoginOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0F111A] rounded-3xl overflow-hidden shadow-2xl border border-white/10 p-8"
            >
              <button 
                onClick={() => !isLoggingIn && setIsLoginOpen(false)}
                disabled={isLoggingIn}
                className="absolute top-6 right-6 z-10 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              >
                <FiX size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <FiUser size={32} />
                </div>
                <h2 className="text-3xl font-black mb-2 tracking-tight">Welcome Back</h2>
                <p className="text-slate-400">Sign in to sync your cart and library</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full relative flex items-center justify-center gap-3 bg-white text-slate-900 border border-transparent px-6 py-3.5 rounded-xl font-bold transition-all duration-300 hover:bg-slate-100 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoggingIn ? (
                    <FiLoader className="animate-spin" size={20} />
                  ) : (
                    <>
                      <FaGoogle size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">or</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button 
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white px-6 py-3.5 rounded-xl font-bold transition-all duration-300 hover:bg-white/10 disabled:opacity-50 hover:border-white/20"
                >
                  <FaEnvelope size={20} />
                  <span>Continue with Email</span>
                </button>
              </div>

              <p className="mt-8 text-center text-xs text-slate-500">
                By continuing, you agree to our <span className="text-indigo-400 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-indigo-400 cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
