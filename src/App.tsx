/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MobileContainer } from './components/MobileContainer';
import { BottomNav, TabType } from './components/BottomNav';
import { CartProvider, useCart } from './context/CartContext';
import { Product } from './types';

// Core Pages
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminPage } from './pages/AdminPage';
import { AccountPage } from './pages/AccountPage';

// Compliance & Legal Pages (Duitku & Bank Indonesia Standards)
import { TermsPage } from './pages/TermsPage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ShippingPolicyPage } from './pages/ShippingPolicyPage';
import { ContactPage } from './pages/ContactPage';

export function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Products state from Supabase authoritative catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productError, setProductError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    setProductError(null);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat katalog produk.');
      }
      setProducts(data.data || []);
    } catch (err: any) {
      console.error('Error fetching catalog:', err);
      setProductError(err.message || 'Koneksi ke endpoint produk terputus.');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  const handleInstantBuy = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleOrderCreatedTracking = (orderNumber: string, token: string) => {
    navigate(`/orders/${orderNumber}?token=${encodeURIComponent(token)}`);
  };

  // Tentukan rute di mana BottomNav ditampilkan
  const showBottomNav = [
    '/',
    '/categories',
    '/orders',
    '/account',
    '/terms',
    '/refund',
    '/privacy',
    '/shipping',
    '/contact',
  ].includes(location.pathname);

  return (
    <MobileContainer>
      <Routes>
        {/* Main Tab Routes */}
        <Route
          path="/"
          element={
            <HomePage
              products={products}
              isLoading={isLoadingProducts}
              error={productError}
              onSelectProduct={handleSelectProduct}
              onNavigateToCart={() => navigate('/cart')}
              onNavigateToCategory={() => navigate('/categories')}
            />
          }
        />
        <Route
          path="/categories"
          element={
            <CategoryPage
              products={products}
              onSelectProduct={handleSelectProduct}
              onBackToHome={() => navigate('/')}
            />
          }
        />
        <Route
          path="/orders"
          element={<OrdersPage onBackToHome={() => navigate('/')} />}
        />
        <Route
          path="/orders/:orderNumber"
          element={<OrdersPage onBackToHome={() => navigate('/')} />}
        />
        <Route
          path="/account"
          element={
            <AccountPage
              onSwitchToAdmin={() => navigate('/admin')}
              onGoToOrders={() => navigate('/orders')}
            />
          }
        />

        {/* E-Commerce Process Routes */}
        <Route path="/product" element={<Navigate to="/" replace />} />
        <Route path="/products" element={<Navigate to="/" replace />} />
        <Route
          path="/product/:id"
          element={
            <ProductDetailPage
              products={products}
              onBack={() => navigate(-1)}
              onGoToCart={() => navigate('/cart')}
              onInstantBuy={handleInstantBuy}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <CartPage
              onBack={() => navigate('/')}
              onProceedToCheckout={() => navigate('/checkout')}
              onExploreProducts={() => navigate('/')}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              onBack={() => navigate('/cart')}
              onGoToOrderTracking={handleOrderCreatedTracking}
            />
          }
        />
        <Route
          path="/admin"
          element={<AdminPage onBackToStore={() => navigate('/')} />}
        />

        {/* Duitku & Bank Indonesia Compliance Pages */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund" element={<RefundPolicyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/shipping" element={<ShippingPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Fallback 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showBottomNav && <BottomNav />}
    </MobileContainer>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CartProvider>
  );
}
