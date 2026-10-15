import React, { useState } from 'react';
import { Search, ShoppingBag, Sparkles, Tag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { StoreFooter } from '../components/StoreFooter';
import { useCart } from '../context/CartContext';
import appLogo from '../assets/app-logo.jpg';

interface HomePageProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  onSelectProduct: (product: Product) => void;
  onNavigateToCart: () => void;
  onNavigateToCategory: (category: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  isLoading,
  error,
  onSelectProduct,
  onNavigateToCart,
  onNavigateToCategory,
}) => {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const dynamicCategories = React.useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((p) => p.product_type?.trim())
          .filter((t): t is string => Boolean(t))
      )
    );
  }, [products]);

  const featuredSaleProducts = React.useMemo(() => {
    const now = Date.now();

    return products
      .filter((product) => {
        const salePrice = Number(product.sale_price);
        if (
          !Number.isFinite(salePrice) ||
          salePrice <= 0 ||
          salePrice >= product.price ||
          product.price <= 0 ||
          product.availability === 'out of stock'
        ) {
          return false;
        }

        if (product.sale_price_starts_at) {
          const startsAt = Date.parse(product.sale_price_starts_at);
          if (Number.isFinite(startsAt) && now < startsAt) return false;
        }

        if (product.sale_price_ends_at) {
          const endsAt = Date.parse(product.sale_price_ends_at);
          if (Number.isFinite(endsAt) && now > endsAt) return false;
        }

        return Boolean(product.display_image || product.image_link);
      })
      .slice(0, 2);
  }, [products]);

  const hasSaleProducts = React.useMemo(() => {
    const now = Date.now();
    return products.some((product) => {
      const salePrice = Number(product.sale_price);
      if (
        !Number.isFinite(salePrice) ||
        salePrice <= 0 ||
        salePrice >= product.price ||
        product.price <= 0 ||
        product.availability === 'out of stock'
      ) return false;
      if (product.sale_price_starts_at) {
        const startsAt = Date.parse(product.sale_price_starts_at);
        if (Number.isFinite(startsAt) && now < startsAt) return false;
      }
      if (product.sale_price_ends_at) {
        const endsAt = Date.parse(product.sale_price_ends_at);
        if (Number.isFinite(endsAt) && now > endsAt) return false;
      }
      return true;
    });
  }, [products]);

  // Filter products based on search query and chip filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'sale') {
      const salePrice = Number(p.sale_price);
      const now = Date.now();
      const startsAt = p.sale_price_starts_at ? Date.parse(p.sale_price_starts_at) : NaN;
      const endsAt = p.sale_price_ends_at ? Date.parse(p.sale_price_ends_at) : NaN;
      return (
        Number.isFinite(salePrice) &&
        salePrice > 0 &&
        salePrice < p.price &&
        p.price > 0 &&
        p.availability !== 'out of stock' &&
        (!Number.isFinite(startsAt) || now >= startsAt) &&
        (!Number.isFinite(endsAt) || now <= endsAt)
      );
    }
    if (selectedFilter !== 'all') {
      return p.product_type?.toLowerCase() === selectedFilter.toLowerCase();
    }
    return true;
  });

  return (
    <div className="flex-1 pb-16 flex flex-col bg-slate-50">
      {/* Sticky Top Header & Search Bar Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        {/* Store Header */}
        <header className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img
              src={appLogo}
              alt="Asri Collection"
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-gray-100 shrink-0"
            />
            <div>
              <h1 className="text-sm font-bold text-gray-900 tracking-tight leading-tight">
                Asri Collection
              </h1>
              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Official Store • Duitku POP
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToCart}
            className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 hover:text-gray-900 active:scale-95 transition-transform"
            aria-label="Keranjang"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </button>
        </header>

        {/* Search Bar */}
        <div className="px-4 pb-2.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari hoodie, sepatu, tas, kaos..."
              className="w-full h-10 pl-10 pr-4 bg-slate-100 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:bg-white transition-all border border-transparent focus:border-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Promo Banner with live catalog products */}
      <div className="px-4 py-2.5">
        <section className="relative isolate min-h-[168px] aspect-[2/1] w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563EB] via-blue-600 to-blue-800 p-3 text-white shadow-md sm:p-4">
          <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/4 h-28 w-28 rounded-full bg-cyan-300/15 blur-2xl" />

          <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
            <div className="flex min-w-0 flex-col items-start justify-center">
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur-sm sm:text-[10px]">
                <Sparkles className="h-3 w-3 text-amber-300" />
                {featuredSaleProducts.length > 0 ? 'PROMO SPESIAL' : 'KOLEKSI PILIHAN'}
              </span>
              <h2 className="text-[13px] font-bold leading-tight sm:text-base">
                {featuredSaleProducts.length > 0
                  ? 'Diskon Menarik untuk Kamu'
                  : 'Koleksi Pilihan Asri'}
              </h2>
              <p className="mt-1.5 line-clamp-3 text-[10px] leading-snug text-blue-100 sm:text-xs">
                {featuredSaleProducts.length > 0
                  ? 'Lihat produk pilihan dengan harga promo.'
                  : 'Temukan produk favoritmu dengan mudah.'}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-white/90 sm:text-[10px]">
                Belanja mudah <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            <div className="flex min-w-0 flex-col justify-center gap-2">
              {featuredSaleProducts.length > 0 ? (
                featuredSaleProducts.map((product) => {
                  const salePrice = Number(product.sale_price);
                  const discount = Math.round(((product.price - salePrice) / product.price) * 100);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      aria-label={`Lihat produk ${product.title}`}
                      className="flex min-w-0 items-center gap-2 rounded-xl border border-white/20 bg-white/15 p-1.5 text-left backdrop-blur-sm transition-colors hover:bg-white/25 active:scale-[0.98]"
                    >
                      <img
                        src={product.display_image || product.image_link}
                        alt={product.title}
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-lg bg-white object-cover sm:h-12 sm:w-12"
                        onError={(event) => {
                          event.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[9px] font-semibold leading-tight sm:text-[10px]">
                          {product.title}
                        </span>
                        <span className="mt-1 block text-[10px] font-bold leading-tight sm:text-xs">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0,
                          }).format(salePrice)}
                        </span>
                        <span className="mt-0.5 flex min-w-0 items-center gap-1">
                          <span className="truncate text-[8px] text-blue-100 line-through sm:text-[9px]">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              maximumFractionDigits: 0,
                            }).format(product.price)}
                          </span>
                          <span className="shrink-0 rounded bg-rose-500 px-1 py-0.5 text-[8px] font-bold leading-none text-white">
                            -{discount}%
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="flex h-full min-h-20 items-center justify-center rounded-xl border border-white/15 bg-white/10 p-3 text-center">
                  <div>
                    <ShoppingBag className="mx-auto h-7 w-7 text-white/80" />
                    <p className="mt-1 text-[9px] font-medium text-blue-100">Produk promo segera hadir</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Value Proposition Pills */}
      <div className="px-4 py-1 flex items-center justify-between text-[11px] text-gray-600">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Duitku POP Verified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pengiriman Manual Cepat</span>
        </div>
      </div>

      {/* Filter Chips / Categories Bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === 'all'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Semua Produk
          </button>
          {hasSaleProducts && (
            <button
              onClick={() => setSelectedFilter('sale')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all ${
                selectedFilter === 'sale'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Tag className="w-3 h-3" /> Diskon Spesial
            </button>
          )}
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedFilter === cat
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Title */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Katalog Produk ({filteredProducts.length})
        </h2>
        <span className="text-[10px] text-gray-500">
          Sumber Data: Supabase Edge
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="px-4 py-3 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-xl p-3 animate-pulse border border-gray-100 flex flex-col space-y-2">
              <div className="aspect-square bg-gray-200 rounded-lg w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="px-4 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            ⚠️
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Gagal Memuat Produk</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-medium shadow-sm"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="text-4xl mb-2">🔍</div>
          <h3 className="text-sm font-semibold text-gray-900">Tidak ada produk ditemukan</h3>
          <p className="text-xs text-gray-500 mt-1">
            Coba kata kunci pencarian lain atau pilih kategori yang berbeda.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFilter('all');
            }}
            className="mt-3 text-xs text-[#2563EB] font-semibold"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* Two-Column Mobile Product Grid */}
      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="px-4 py-2 grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}

      {/* Official Store Footer with Duitku Compliance Links */}
      <StoreFooter />
    </div>
  );
};
