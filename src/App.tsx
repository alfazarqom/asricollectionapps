/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MobileContainer } from './components/MobileContainer';
import { StoreFooter } from './components/StoreFooter';
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
import { StoreInformationPage } from './pages/StoreInformationPage';

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
      let data: any = null;

      // 1. Coba panggil /api/products (didukung di local dev dan Vercel rewrite)
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn('Koneksi /api/products tidak tersedia, beralih ke Supabase langsung:', err);
      }

      // 2. Jika /api/products gagal, ambil langsung dari Supabase endpoint
      if (!data) {
        const directRes = await fetch('https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-products');
        if (!directRes.ok) {
          throw new Error(`Gagal memuat katalog produk dari database (HTTP ${directRes.status}).`);
        }
        data = await directRes.json();
      }

      // 3. Parser fleksibel: mendukung array langsung [...] maupun objek { success: true, data: [...] }
      let productList: Product[] = [];
      if (Array.isArray(data)) {
        productList = data;
      } else if (data && Array.isArray(data.data)) {
        productList = data.data;
      } else if (data && data.success && Array.isArray(data.products)) {
        productList = data.products;
      } else {
        throw new Error(data?.error || 'Format data katalog tidak sesuai.');
      }

      setProducts(productList);
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
  const showFooterAtAppLevel = ['/cart', '/checkout', '/admin'].includes(location.pathname);

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
        <Route path="/cara-pemesanan" element={<StoreInformationPage />} />
        <Route path="/pembayaran" element={<StoreInformationPage />} />
        <Route path="/tentang-kami" element={<StoreInformationPage />} />
        {/* Footer V1.1 URL aliases mapped to existing policy/contact pages */}
        <Route path="/hubungi-kami" element={<ContactPage />} />
        <Route path="/syarat-ketentuan" element={<TermsPage />} />
        <Route path="/kebijakan-privasi" element={<PrivacyPolicyPage />} />
        <Route path="/kebijakan-pengiriman" element={<ShippingPolicyPage />} />
        <Route path="/pengiriman-pelacakan" element={<OrdersPage onBackToHome={() => navigate("/")} />} />
        <Route path="/kebijakan-pengembalian" element={<RefundPolicyPage />} />

        {/* Fallback 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showFooterAtAppLevel && <StoreFooter />}
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
