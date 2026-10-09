import React, { useState } from 'react';
import { Plus, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../utils/formatters';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = product.availability === 'out of stock';
  const hasSale = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price;
  const currentPrice = hasSale ? product.sale_price! : product.price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const displayImg = imageError
    ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    : product.display_image || product.image_link;

  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer group"
    >
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
        <img
          src={displayImg}
          alt={product.title}
          loading="lazy"
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasSale && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              HEMAT {Math.round(((product.price - product.sale_price!) / product.price) * 100)}%
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-gray-800/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-0.5">
              <AlertCircle className="w-2.5 h-2.5" /> Habis
            </span>
          ) : (
            <span className="bg-emerald-600/90 text-white text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs">
              Stok Tersedia
            </span>
          )}
        </div>

        {product.brand && (
          <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded backdrop-blur-xs">
            {product.brand}
          </span>
        )}
      </div>

      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">
            {product.title}
          </h3>
          {product.size && (
            <p className="text-[10px] text-gray-500 mt-0.5">
              Ukuran: <span className="font-medium text-gray-700">{product.size}</span>
            </p>
          )}
        </div>

        <div className="mt-2.5 flex items-end justify-between pt-1 border-t border-gray-50">
          <div>
            {hasSale && (
              <p className="text-[10px] text-gray-400 line-through">
                {formatRupiah(product.price)}
              </p>
            )}
            <p className="text-xs font-bold text-[#2563EB]">
              {formatRupiah(currentPrice)}
            </p>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : addedAnimation
                ? 'bg-emerald-600 text-white scale-110'
                : 'bg-[#2563EB] text-white hover:bg-blue-700 active:scale-95 shadow-sm'
            }`}
            aria-label="Tambah ke Keranjang"
          >
            {addedAnimation ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
          </button>
        </div>
      </div>
    </div>
  );
};
