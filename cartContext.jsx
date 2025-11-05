import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Helper to generate a unique key for each product variant
const getCartKey = ({ slug, selectedColor, selectedSize }) =>
  `${slug}-${selectedColor}-${selectedSize}`;

const CART_EXPIRY_DAYS = 7;

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Load cart and timestamp from localStorage
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("cart");
    const storedTime = localStorage.getItem("cartTimestamp");
    if (stored && storedTime) {
      const now = Date.now();
      const expiry = Number(storedTime) + CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (now < expiry) {
        return JSON.parse(stored);
      }
    }
    // If expired or not found, clear storage and return empty cart
    localStorage.removeItem("cart");
    localStorage.removeItem("cartTimestamp");
    return [];
  });

  // Save cart and timestamp to localStorage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("cartTimestamp", Date.now().toString());
  }, [cart]);

  const addToCart = useCallback((product) => {
    const cartKey = getCartKey(product);
    const maxStock = product.countInStock || 1;

    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => getCartKey(item) === cartKey
      );

      if (existingItem) {
        return prevCart.map((item) =>
          getCartKey(item) === cartKey
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, maxStock),
              }
            : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((product) => {
    const cartKey = getCartKey(product);
    setCart((prevCart) =>
      prevCart.filter((item) => getCartKey(item) !== cartKey)
    );
  }, []);

  const updateQuantity = useCallback((product, type, stockLimit = 1) => {
    const cartKey = getCartKey(product);
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (getCartKey(item) !== cartKey) return item;

        const newQuantity =
          type === "increase"
            ? Math.min(item.quantity + 1, stockLimit)
            : Math.max(item.quantity - 1, 1);

        return { ...item, quantity: newQuantity };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartSummary = useCallback(() => {
    return cart.reduce(
      (acc, item) => {
        acc.totalItems += item.quantity;
        acc.totalPrice += item.quantity * item.price;
        return acc;
      },
      { totalItems: 0, totalPrice: 0 }
    );
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartSummary,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => useContext(CartContext);
