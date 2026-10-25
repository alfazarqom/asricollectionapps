import { useState, useMemo, useCallback, useEffect } from "react";
import { CartContext } from "./cart";

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("asri-collection-cart") || localStorage.getItem("shopco-cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.warn("Failed to load cart:", error);
      return [];
    }
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("asri-collection-cart", JSON.stringify(cartItems));
    } catch (err) {
      console.warn("Failed saving cart to localStorage", err);
    }
  }, [cartItems]);

  const showNotification = useCallback((message, product = null) => {
    setNotification({ message, product, timestamp: Date.now() });
    setTimeout(() => {
      setNotification((prev) => (prev && Date.now() - prev.timestamp >= 2800 ? null : prev));
    }, 3000);
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Add item to cart with quantity & optional size/color variant
  const addToCart = useCallback((product, qty = 1, variant = null) => {
    const quantityToAdd = Math.max(1, Number(qty) || 1);
    const itemKey = variant ? `${product.id}-${variant.size || ''}-${variant.color || ''}` : `${product.id}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => {
        const itKey = it.itemKey || `${it.id}`;
        return itKey === itemKey;
      });

      if (existingIndex > -1) {
        const next = [...prevItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantityToAdd,
          selectedVariant: variant || next[existingIndex].selectedVariant,
        };
        return next;
      }

      return [
        ...prevItems,
        {
          ...product,
          itemKey,
          quantity: quantityToAdd,
          selectedVariant: variant || null,
        },
      ];
    });

    showNotification(`Ditambahkan ke keranjang: ${product.title}`, product);
  }, [showNotification]);

  // Remove item from cart
  const removeFromCart = useCallback((productId, itemKey = null) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => {
        if (itemKey) return (item.itemKey || `${item.id}`) !== itemKey;
        return item.id !== productId;
      })
    );
  }, []);

  // Update quantity directly
  const updateQuantity = useCallback((productId, quantity, itemKey = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, itemKey);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const match = itemKey ? (item.itemKey || `${item.id}`) === itemKey : item.id === productId;
        return match ? { ...item, quantity: Math.min(99, quantity) } : item;
      })
    );
  }, [removeFromCart]);

  // Increase item quantity
  const increaseQuantity = useCallback((productId, itemKey = null) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const match = itemKey ? (item.itemKey || `${item.id}`) === itemKey : item.id === productId;
        return match ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item;
      })
    );
  }, []);

  // Decrease item quantity
  const decreaseQuantity = useCallback((productId, itemKey = null) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          const match = itemKey ? (item.itemKey || `${item.id}`) === itemKey : item.id === productId;
          return match ? { ...item, quantity: item.quantity - 1 } : item;
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Total item count
  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cartItems]);

  // Total price in base currency
  const getTotalPrice = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + (Number(item.price) || 0) * (item.quantity || 1),
      0
    );
  }, [cartItems]);

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      notification,
      dismissNotification,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      notification,
      dismissNotification,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
