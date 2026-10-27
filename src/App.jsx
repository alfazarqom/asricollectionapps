import { useState, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Orders from "./pages/Orders";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import Toast from "./components/ui/Toast";
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

  const cartCount = getTotalItems ? getTotalItems() : cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

  // Memoize click handler
  const handleCartClick = useCallback(() => setIsCartOpen(true), []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-[#F4EFEA] selection:text-[#9A3412]">
      {/* Toast Notification Container */}
      <Toast />

      {/* Main Luxury Header */}
      <Header cartCount={cartCount} onCartClick={handleCartClick} />

      {/* Main Routes Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<Orders />} />
          <Route path="/pesanan/:id" element={<Orders />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* Interactive Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
      />

      {/* Footer */}
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
