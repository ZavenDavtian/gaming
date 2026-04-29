import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('nexus-wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const [lastWishlistAddedId, setLastWishlistAddedId] = useState(null);

  useEffect(() => {
    localStorage.setItem('nexus-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (game) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.find((item) => item.id === game.id);
      if (exists) {
        return prevWishlist.filter((item) => item.id !== game.id);
      }
      setLastWishlistAddedId(Date.now());
      return [...prevWishlist, game];
    });
  };

  const removeFromWishlist = (gameId) => {
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== gameId));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, removeFromWishlist, clearWishlist, lastWishlistAddedId }}>
      {children}
    </WishlistContext.Provider>
  );
};
