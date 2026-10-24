import { useState, useCallback } from "react";
import Home from "./pages/Home";
import { Routes, Route } from "react-router-dom";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import { CartProvider } from "./context/CartContext";
import { useCart } from "./hooks/useCart";

const AppContent = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const {
    cartItems,
    getTotalItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const cartCount = getTotalItems();

  // Memoize click handler
  const handleCartClick = useCallback(() => setIsCartOpen(true), []);

  return (
    <div className="min-h-screen bg-white">
      <Header cartCount={cartCount} onCartClick={handleCartClick} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
      />

      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
};

export default App;
