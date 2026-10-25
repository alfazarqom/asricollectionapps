import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, ArrowUpDown, Filter, Sparkles, Tag, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { StoreFooter } from '../components/StoreFooter';

interface CatalogPageProps {
  products: Product[];
  isLoading?: boolean;
  onSelectProduct?: (product: Product) => void;
}

type SortOption = 'default' | 'latest' | 'price_asc' | 'price_desc';

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  isLoading = false,
  onSelectProduct,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('kategori') || 'Semua';
  const activeSort = (searchParams.get('sort') as SortOption) || 'default';
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Dynamic categories
  const categories = useMemo(() => {
    const types = Array.from(
      new Set(
        products
          .map((p) => p.product_type?.trim())
          .filter((t): t is string => Boolean(t))
      )
    );
    return ['Semua', ...types];
  }, [products]);

  const setCategory = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'Semua') {
      newParams.delete('kategori');
    } else {
      newParams.set('kategori', cat);
    }
    setSearchParams(newParams);
  };

  const setSort = (sort: SortOption) => {
    const newParams = new URLSearchParams(searchParams);
    if (sort === 'default') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', sort);
    }
    setSearchParams(newParams);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (activeCategory !== 'Semua') {
        if (p.product_type?.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
      }
      if (onlyInStock) {
        if (p.availability === 'out of stock') return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      const priceA = a.sale_price && a.sale_price > 0 ? a.sale_price : a.price;
      const priceB = b.sale_price && b.sale_price > 0 ? b.sale_price : b.price;

      if (activeSort === 'price_asc') return priceA - priceB;
      if (activeSort === 'price_desc') return priceB - priceA;
      if (activeSort === 'latest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return list;
  }, [products, activeCategory, onlyInStock, activeSort]);

  const handleSelect = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      navigate(`/produk/${product.id}`);
    }
  };

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50 min-h-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 py-2.5 border-b border-slate-100 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
              aria-label="Kembali ke beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Katalog Produk</h1>
              <p className="text-[10px] text-slate-500 font-medium">Asri Collection Official</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/cari')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95"
            aria-label="Pencarian"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      {/* Filter & Sorting Controls */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setOnlyInStock(!onlyInStock)}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all ${
            onlyInStock
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Hanya Stok Tersedia</span>
        </button>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          <select
            value={activeSort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-[11px] font-semibold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
          >
            <option value="default">Urutan Standar</option>
            <option value="latest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>
          Menampilkan <strong className="text-slate-900">{filteredAndSortedProducts.length}</strong> produk
        </span>
        <span className="text-[10px] text-slate-400">Garansi Kualitas Prima</span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-3 grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-3 animate-pulse border border-slate-100 flex flex-col space-y-2">
              <div className="aspect-square bg-slate-200 rounded-xl w-full" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedProducts.length === 0 && (
        <div className="p-8 text-center my-auto flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
            📦
          </div>
          <h3 className="text-sm font-bold text-slate-900">Belum Ada Produk di Kategori Ini</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Silakan pilih kategori busana lain atau reset filter ketersediaan.
          </p>
          <button
            onClick={() => {
              setCategory('Semua');
              setOnlyInStock(false);
              setSort('default');
            }}
            className="mt-4 px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            Tampilkan Semua Produk
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!isLoading && filteredAndSortedProducts.length > 0 && (
        <div className="p-3 grid grid-cols-2 gap-2.5">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={handleSelect} />
          ))}
        </div>
      )}

      <StoreFooter />
    </div>
  );
};
