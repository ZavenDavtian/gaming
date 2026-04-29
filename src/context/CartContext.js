import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('nexus-cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [lastAddedId, setLastAddedId] = useState(null);

  useEffect(() => {
    localStorage.setItem('nexus-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (game) => {
    setCart((prevCart) => {
      const exists = prevCart.find((item) => item.id === game.id);
      if (exists) return prevCart;
      setLastAddedId(Date.now()); // Use timestamp as unique trigger
      return [...prevCart, game];
    });
  };

  const removeFromCart = (gameId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== gameId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, lastAddedId }}>
      {children}
    </CartContext.Provider>
  );
};
