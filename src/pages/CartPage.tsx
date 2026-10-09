import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../utils/formatters';

interface CartPageProps {
  onBack?: () => void;
  onProceedToCheckout?: () => void;
  onExploreProducts?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onBack,
  onProceedToCheckout,
  onExploreProducts,
}) => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleCheckout = () => {
    if (onProceedToCheckout) onProceedToCheckout();
    else navigate('/checkout');
  };

  const handleExplore = () => {
    if (onExploreProducts) onExploreProducts();
    else navigate('/');
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 pb-24 flex flex-col bg-slate-50">
        <header className="sticky top-0 z-30 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-bold text-gray-900">Keranjang Belanja</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Keranjang Masih Kosong</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-[260px]">
            Yuk cari pakaian, sepatu, atau tas favoritmu di Asri Collection!
          </p>
          <button
            onClick={handleExplore}
            className="mt-5 px-6 py-2.5 bg-[#2563EB] text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-transform"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-32 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">Keranjang ({totalItems})</h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium active:scale-95"
        >
          Kosongkan
        </button>
      </header>

      {/* Cart Items List */}
      <div className="p-4 space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs flex gap-3 items-center"
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-16 h-16 object-cover rounded-lg bg-gray-50 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80';
              }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <h3 className="text-xs font-semibold text-gray-900 truncate">
                  {item.title}
                </h3>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-rose-500 p-1"
                  aria-label="Hapus produk"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {(item.size || item.color) && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {item.color && `Warna: ${item.color}`} {item.size && `• Ukuran: ${item.size}`}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#2563EB]">
                  {formatRupiah(item.price)}
                </span>

                {/* Quantity adjust stepper */}
                <div className="flex items-center border border-gray-200 rounded-lg bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 active:bg-gray-200 rounded-l-lg"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold text-gray-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 active:bg-gray-200 rounded-r-lg"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Security badge note */}
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2 text-[11px] text-blue-800">
          <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>Harga dan stok akan diverifikasi secara real-time oleh server sebelum checkout.</span>
        </div>
      </div>

      {/* Summary Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 pb-safe shadow-lg">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-gray-500">Subtotal ({totalItems} produk)</span>
          <span className="text-base font-black text-gray-900">{formatRupiah(subtotal)}</span>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md hover:bg-blue-700"
        >
          <span>Lanjut ke Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
