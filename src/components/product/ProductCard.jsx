import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Star, Check } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { formatPrice, calculateOriginalPrice } from "../../utils/formatters";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const discount = Math.round(Number(product.discountPercentage) || 0);
  const originalPrice = discount > 0 ? calculateOriginalPrice(product.price, discount) : null;
  const imageUrl = product.thumbnail || (product.images && product.images[0]) || "";

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs hover:shadow-md transition-all duration-300">
      {/* Product Image Area */}
      <Link
        to={`/products/${product.id}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-stone-100"
        aria-label={`Lihat rincian ${product.title}`}
      >
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-stone-400 bg-stone-100">
            <ShoppingBag className="h-10 w-10 stroke-1 text-stone-300 mb-2" />
            <span className="text-[11px] font-medium text-stone-500 line-clamp-1">{product.title}</span>
          </div>
        )}

        {/* Clean Discount Tag */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            -{discount}%
          </span>
        )}

        {/* Quick Add Overlay on hover for desktop */}
        <div className="absolute inset-x-3 bottom-3 hidden sm:flex translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
              justAdded
                ? "bg-emerald-600 text-white"
                : "bg-white/95 backdrop-blur-xs text-stone-900 hover:bg-stone-900 hover:text-white"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Ditambahkan
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" /> + Keranjang Cepat
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Meta & Price */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category or Brand */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 truncate">
            {product.brand || product.category || "Asri Collection"}
          </p>

          <Link to={`/products/${product.id}`} className="block mt-1">
            <h3 className="text-xs sm:text-sm font-semibold text-stone-900 line-clamp-2 leading-snug hover:text-stone-700 transition-colors">
              {product.title}
            </h3>
          </Link>

          {/* Rating */}
          {product.rating && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-stone-500">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="font-semibold text-stone-800 tabular-nums">{Number(product.rating).toFixed(1)}</span>
              <span className="text-stone-400">· Stok Siap</span>
            </div>
          )}
        </div>

        {/* Price & Mobile Add Button */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {originalPrice && (
              <p className="text-[10px] text-stone-400 line-through tabular-nums font-mono leading-none mb-0.5">
                {formatPrice(originalPrice)}
              </p>
            )}
            <p className="text-xs sm:text-sm font-black text-stone-900 tabular-nums font-mono leading-tight">
              {formatPrice(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            className={`sm:hidden h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              justAdded
                ? "bg-emerald-600 text-white"
                : "bg-stone-900 text-white active:scale-95"
            }`}
            aria-label={`Tambah ${product.title} ke keranjang`}
          >
            {justAdded ? <Check className="h-4 w-4 stroke-[2.5]" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
