import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, SlidersHorizontal, ArrowUpDown, Tag, Sparkles, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { StoreFooter } from '../components/StoreFooter';

interface SearchPageProps {
  products: Product[];
  isLoading?: boolean;
  onSelectProduct?: (product: Product) => void;
}

type SortOption = 'relevance' | 'latest' | 'price_asc' | 'price_desc';

const POPULAR_SUGGESTIONS = ['Hoodie', 'Kemeja', 'Kaos', 'Tas', 'Sepatu', 'Celana'];

export const SearchPage: React.FC<SearchPageProps> = ({
  products,
  isLoading = false,
  onSelectProduct,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const sortParam = (searchParams.get('sort') as SortOption) || 'relevance';
  const categoryParam = searchParams.get('kategori') || 'all';

  const [inputVal, setInputVal] = useState(queryParam);
  const [selectedSort, setSelectedSort] = useState<SortOption>(sortParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [onlySale, setOnlySale] = useState<boolean>(false);

  // Sync state when URL params change
  useEffect(() => {
    setInputVal(queryParam);
    setSelectedSort(sortParam);
    setSelectedCategory(categoryParam);
  }, [queryParam, sortParam, categoryParam]);

  // Dynamic categories from authoritative products
  const dynamicCategories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((p) => p.product_type?.trim())
          .filter((t): t is string => Boolean(t))
      )
    );
  }, [products]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (inputVal.trim()) {
      newParams.set('q', inputVal.trim());
    } else {
      newParams.delete('q');
    }
    newParams.set('sort', selectedSort);
    if (selectedCategory !== 'all') {
      newParams.set('kategori', selectedCategory);
    } else {
      newParams.delete('kategori');
    }
    setSearchParams(newParams);
  };

  const updateSort = (sort: SortOption) => {
    setSelectedSort(sort);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sort);
    setSearchParams(newParams);
  };

  const updateCategory = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      newParams.delete('kategori');
    } else {
      newParams.set('kategori', cat);
    }
    setSearchParams(newParams);
  };

  const handleSuggestionClick = (keyword: string) => {
    setInputVal(keyword);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', keyword);
    setSearchParams(newParams);
  };

  // Filter and sort products
  const searchResults = useMemo(() => {
    const q = queryParam.trim().toLowerCase();

    let list = products.filter((p) => {
      // Keyword matching
      if (q) {
        const inTitle = p.title.toLowerCase().includes(q);
        const inBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
        const inDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        const inCategory = p.product_type ? p.product_type.toLowerCase().includes(q) : false;
        if (!inTitle && !inBrand && !inDesc && !inCategory) return false;
      }

      // Category matching
      if (selectedCategory !== 'all') {
        if (p.product_type?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Sale filter
      if (onlySale) {
        if (!p.sale_price || p.sale_price >= p.price) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const priceA = a.sale_price && a.sale_price > 0 ? a.sale_price : a.price;
      const priceB = b.sale_price && b.sale_price > 0 ? b.sale_price : b.price;

      if (selectedSort === 'price_asc') return priceA - priceB;
      if (selectedSort === 'price_desc') return priceB - priceA;
      if (selectedSort === 'latest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      return 0; // relevance (default catalog order)
    });

    return list;
  }, [products, queryParam, selectedCategory, onlySale, selectedSort]);

  const handleSelect = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      navigate(`/produk/${product.id}`);
    }
  };

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50 min-h-full">
      {/* Sticky Header with Search Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 py-2.5 border-b border-slate-100 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 shrink-0 transition-transform cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Cari busana, tas, sepatu, aksesoris..."
              className="w-full h-10 pl-9 pr-8 bg-slate-100 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/40 focus:bg-white transition-all border border-transparent focus:border-[#EA580C]"
              autoFocus={!queryParam}
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }}
                className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] hover:bg-slate-300"
                aria-label="Hapus teks"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>

          <button
            onClick={() => handleSearchSubmit()}
            className="px-3 h-10 bg-[#EA580C] hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shrink-0 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Cari
          </button>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => updateCategory('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Semua
          </button>

          <button
            onClick={() => setOnlySale(!onlySale)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
              onlySale
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Tag className="w-3 h-3" /> Diskon
          </button>

          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Sorting bar & result stats */}
      <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium">
          Ditemukan <strong className="text-slate-900 font-bold">{searchResults.length}</strong> produk
          {queryParam ? ` untuk "${queryParam}"` : ''}
        </span>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          <select
            value={selectedSort}
            onChange={(e) => updateSort(e.target.value as SortOption)}
            className="text-[11px] font-semibold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
          >
            <option value="relevance">Paling Sesuai</option>
            <option value="latest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-3 animate-pulse border border-slate-100 flex flex-col space-y-2">
              <div className="aspect-square bg-slate-200 rounded-xl w-full" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && searchResults.length === 0 && (
        <div className="p-6 text-center my-auto flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center mx-auto mb-3 text-2xl shadow-xs">
            🔍
          </div>
          <h3 className="text-sm font-bold text-slate-900">Produk Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Tidak ada produk yang cocok dengan pencarian{' '}
            {queryParam && <strong className="text-slate-800">"{queryParam}"</strong>}. Coba kata kunci lain atau pilih rekomendasi di bawah:
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-xs">
            {POPULAR_SUGGESTIONS.map((item) => (
              <button
                key={item}
                onClick={() => handleSuggestionClick(item)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#EA580C] hover:text-[#EA580C] text-slate-700 rounded-xl text-xs font-medium transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setInputVal('');
              setSelectedCategory('all');
              setOnlySale(false);
              setSearchParams(new URLSearchParams());
            }}
            className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold active:scale-95 transition-all"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Search Result Grid */}
      {!isLoading && searchResults.length > 0 && (
        <div className="p-3 grid grid-cols-2 gap-2.5">
          {searchResults.map((product) => (
            <ProductCard key={product.id} product={product} onSelect={handleSelect} />
          ))}
        </div>
      )}

      <StoreFooter />
    </div>
  );
};
