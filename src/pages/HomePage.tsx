import React, { useState } from 'react';
import { Search, ShoppingBag, Sparkles, Tag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { StoreFooter } from '../components/StoreFooter';
import { useCart } from '../context/CartContext';

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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'sale' | 'clothing' | 'shoes' | 'bags'>('all');

  // Filter products based on search query and chip filter
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'sale') {
      return p.sale_price !== null && p.sale_price !== undefined;
    }
    if (selectedFilter === 'clothing') {
      return p.product_type?.toLowerCase().includes('pakaian') || p.id.startsWith('APP');
    }
    if (selectedFilter === 'shoes') {
      return p.product_type?.toLowerCase().includes('sepatu') || p.id.startsWith('SHO');
    }
    if (selectedFilter === 'bags') {
      return p.product_type?.toLowerCase().includes('tas') || p.id.startsWith('BAG');
    }
    return true;
  });

  return (
    <div className="flex-1 pb-16 flex flex-col bg-slate-50">
      {/* Sticky Top Header & Search Bar Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        {/* Store Header */}
        <header className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black text-sm shadow-sm">
              AC
            </div>
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

      {/* Promo Banner Slider / Card */}
      <div className="px-4 py-2.5">
        <div className="bg-gradient-to-r from-[#2563EB] to-blue-700 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-[70%]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold text-white mb-2 backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-amber-300" /> PROMO SPESIAL
            </span>
            <h2 className="text-sm font-bold leading-tight">
              Koleksi Pilihan &amp; Diskon Menarik
            </h2>
            <p className="text-[11px] text-blue-100 mt-1">
              Checkout instan tanpa ribet bikin akun dengan Duitku POP.
            </p>
          </div>

          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute right-3 bottom-3 text-4xl select-none opacity-80">
            🛍️
          </div>
        </div>
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
          <button
            onClick={() => setSelectedFilter('clothing')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === 'clothing'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Pakaian
          </button>
          <button
            onClick={() => setSelectedFilter('shoes')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === 'shoes'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Sepatu
          </button>
          <button
            onClick={() => setSelectedFilter('bags')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === 'bags'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            Tas
          </button>
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
