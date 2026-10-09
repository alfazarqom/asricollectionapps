import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus, Minus, Check, ShieldCheck, Truck, RefreshCw, Zap } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { StoreFooter } from '../components/StoreFooter';

interface ProductDetailPageProps {
  product?: Product;
  products?: Product[];
  onBack?: () => void;
  onGoToCart?: () => void;
  onInstantBuy?: (product: Product, quantity: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product: initialProduct,
  products = [],
  onBack,
  onGoToCart,
  onInstantBuy,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();

  const [activeProduct, setActiveProduct] = useState<Product | null>(initialProduct || null);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setActiveProduct(initialProduct);
      setIsLoading(false);
      return;
    }

    if (id) {
      const found = products.find((p) => p.id === id);
      if (found) {
        setActiveProduct(found);
        setIsLoading(false);
      } else {
        // Fetch from API
        fetch('/api/products')
          .then((res) => res.json())
          .then((data) => {
            if (data.success && Array.isArray(data.data)) {
              const item = data.data.find((p: Product) => p.id === id);
              if (item) setActiveProduct(item);
            }
          })
          .catch((err) => console.warn('Error fetching product detail:', err))
          .finally(() => setIsLoading(false));
      }
    }
  }, [id, initialProduct, products]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleGoToCart = () => {
    if (onGoToCart) onGoToCart();
    else navigate('/cart');
  };

  const handleBuyNow = () => {
    if (!activeProduct || isOutOfStock) return;
    if (onInstantBuy) {
      onInstantBuy(activeProduct, quantity);
    } else {
      addToCart(activeProduct, quantity);
      navigate('/checkout');
    }
  };

  if (isLoading || !activeProduct) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-gray-500 font-medium">Memuat rincian produk...</p>
      </div>
    );
  }

  const product = activeProduct;
  const isOutOfStock = product.availability === 'out of stock';
  const hasSale = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < product.price;
  const currentPrice = hasSale ? product.sale_price! : product.price;

  const handleIncrement = () => {
    if (quantity < 99) setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const displayImg = imgError
    ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    : product.display_image || product.image_link;

  return (
    <div className="flex-1 pb-32 flex flex-col bg-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-2xs">
        <button
          onClick={handleBack}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">
          {product.brand || 'Detail Produk'}
        </span>

        <button
          onClick={handleGoToCart}
          className="relative w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
          aria-label="Keranjang"
        >
          <ShoppingBag className="w-4 h-4" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* Main Image Gallery */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img
          src={displayImg}
          alt={product.title}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
        />

        {/* Badges on image */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasSale && (
            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              HEMAT {Math.round(((product.price - product.sale_price!) / product.price) * 100)}%
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded backdrop-blur-xs shadow-sm ${
              isOutOfStock
                ? 'bg-gray-900 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isOutOfStock ? 'Stok Habis' : 'Stok Tersedia'}
          </span>
        </div>
      </div>

      {/* Content & Specs */}
      <div className="p-4 space-y-4">
        {/* Title & Brand */}
        <div>
          {product.brand && (
            <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
              {product.brand}
            </span>
          )}
          <h1 className="text-base font-bold text-gray-900 mt-0.5 leading-snug">
            {product.title}
          </h1>
        </div>

        {/* Price Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] text-gray-500 block">Harga Spesial</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#2563EB]">
                {formatRupiah(currentPrice)}
              </span>
              {hasSale && (
                <span className="text-xs text-gray-400 line-through">
                  {formatRupiah(product.price)}
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">ID: {product.id}</span>
        </div>

        {/* Specifications Pills */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {product.color && (
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-[10px] text-gray-400 block uppercase">Warna</span>
              <span className="font-semibold text-gray-800">{product.color}</span>
            </div>
          )}
          {product.size && (
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-[10px] text-gray-400 block uppercase">Ukuran</span>
              <span className="font-semibold text-gray-800">{product.size}</span>
            </div>
          )}
          {product.condition && (
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-[10px] text-gray-400 block uppercase">Kondisi</span>
              <span className="font-semibold text-gray-800 capitalize">{product.condition}</span>
            </div>
          )}
          {product.product_type && (
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-[10px] text-gray-400 block uppercase">Kategori</span>
              <span className="font-semibold text-gray-800 truncate block">{product.product_type}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="pt-2">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
            Deskripsi Produk
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description || 'Tidak ada deskripsi rinci untuk produk ini.'}
          </p>
        </div>

        {/* Security & Shipping notes */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>Pembayaran Resmi Duitku POP (BCA, Mandiri, BRI, QRIS, e-Wallet)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengiriman cepat dengan nomor resi tercatat otomatis</span>
          </div>
        </div>

        {/* Quantity Selector */}
        {!isOutOfStock && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800">Jumlah Pembelian</span>
            <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-2xs">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center text-gray-600 disabled:opacity-30 active:bg-gray-100 rounded-l-xl"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-bold text-gray-900">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="w-9 h-9 flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-r-xl"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thumb-friendly Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 pb-safe shadow-lg">
        {isOutOfStock ? (
          <button
            disabled
            className="w-full h-12 bg-gray-200 text-gray-500 rounded-xl font-semibold text-xs cursor-not-allowed flex items-center justify-center"
          >
            Produk Sedang Habis Stok
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              className={`flex-1 h-12 rounded-xl font-semibold text-xs border border-[#2563EB] text-[#2563EB] bg-blue-50/60 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 ${
                added ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" /> Ditambahkan
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> + Keranjang
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 h-12 px-2 rounded-xl font-semibold text-xs bg-[#2563EB] text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5 text-center"
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="truncate">Beli Sekarang ({formatRupiah(currentPrice * quantity)})</span>
            </button>
          </div>
        )}
      </div>

      {/* Official E-Commerce Store Footer */}
      <StoreFooter />
    </div>
  );
};
