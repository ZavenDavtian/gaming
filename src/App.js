import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import GameDetails from './pages/GameDetails';
import Community from './pages/Community';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

function App() {
  return (
    <WishlistProvider>
      <CartProvider>
        <Router basename="/gaming">
          <ScrollToTop />
          <div className="relative min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col">
            {/* Background Gradients */}
            <div className="fixed top-0 -left-1/4 w-[150%] h-[500px] bg-indigo-600/10 blur-[150px] -z-10 rounded-full pointer-events-none" />
            <div className="fixed bottom-0 -right-1/4 w-[120%] h-[400px] bg-fuchsia-600/10 blur-[150px] -z-10 rounded-full pointer-events-none" />

            <Navbar />

            <main className="container mx-auto px-6 py-8 md:py-12 z-10 relative flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/game/:id" element={<GameDetails />} />
                <Route path="/community" element={<Community />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </CartProvider>
    </WishlistProvider>
  );
}

export default App;
