import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { StoreFooter } from '../components/StoreFooter';

interface CategoryPageProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  onBackToHome?: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  products,
  onSelectProduct,
  onBackToHome,
}) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const handleSelect = (product: Product) => {
    if (onSelectProduct) onSelectProduct(product);
    else navigate(`/product/${product.id}`);
  };

  const handleBack = () => {
    if (onBackToHome) onBackToHome();
    else navigate('/');
  };

  // Derive categories from product data
  const categories = ['Semua', 'Pakaian', 'Sepatu', 'Tas'];

  const getFilteredProducts = () => {
    if (activeCategory === 'Semua') return products;
    if (activeCategory === 'Pakaian') {
      return products.filter((p) => p.product_type?.toLowerCase().includes('pakaian') || p.id.startsWith('APP'));
    }
    if (activeCategory === 'Sepatu') {
      return products.filter((p) => p.product_type?.toLowerCase().includes('sepatu') || p.id.startsWith('SHO'));
    }
    if (activeCategory === 'Tas') {
      return products.filter((p) => p.product_type?.toLowerCase().includes('tas') || p.id.startsWith('BAG'));
    }
    return products;
  };

  const filtered = getFilteredProducts();

  return (
    <div className="flex-1 pb-28 flex flex-col bg-slate-50">
      {/* Sticky Top Header & Category Pills Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        {/* Header */}
        <header className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-gray-900">Kategori Katalog</h1>
          </div>
          <span className="text-xs text-gray-500 font-medium">{filtered.length} Produk</span>
        </header>

        {/* Category Pills */}
        <div className="px-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Banner */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              Kategori: {activeCategory}
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Produk terverifikasi dengan stok dan harga resmi.
            </p>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Official Store Footer */}
      <StoreFooter />
    </div>
  );
};
