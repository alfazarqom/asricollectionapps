import { Link } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X, ShieldCheck } from "lucide-react";
import { formatPrice } from "../../utils/formatters";

const CartDrawer = ({
  isOpen,
  onClose,
  cartItems = [],
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#FAF8F5] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping bag drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-stone-900" />
            <h2 className="font-serif text-lg font-medium text-stone-900">
              Tas Belanja
            </h2>
            <span className="rounded-full bg-[#F4EFEA] px-2 py-0.5 text-xs font-semibold text-[#9A3412] font-mono">
              {cartItems.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
            aria-label="Tutup tas belanja"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4EFEA] text-[#9A3412]">
                <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />
              </div>

              <h3 className="mt-4 font-serif text-lg font-medium text-stone-900">
                Tas belanja Anda kosong
              </h3>

              <p className="mt-1 text-xs text-stone-500 max-w-xs leading-relaxed">
                Pilih busana favorit Anda dari katalog Asri Collection dan masukkan ke keranjang.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-lg bg-stone-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#9A3412] cursor-pointer"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const itemKey = item.itemKey || item.id;
                const itemTotal = item.price * item.quantity;

                return (
                  <div
                    key={itemKey}
                    className="flex gap-3 bg-white p-3.5 rounded-xl border border-stone-200/90 shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <div className="flex h-20 w-18 shrink-0 items-center justify-center rounded-lg bg-stone-50 overflow-hidden border border-stone-100">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="line-clamp-1 text-xs sm:text-sm font-medium text-stone-900">
                            {item.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemove(itemKey)}
                            className="shrink-0 text-stone-400 hover:text-red-500 p-0.5 transition cursor-pointer"
                            aria-label={`Hapus ${item.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {item.variant && (
                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            {item.variant}
                          </span>
                        )}

                        <p className="mt-1 text-xs font-mono font-medium text-stone-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Stepper & Line Total */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded border border-stone-200 bg-stone-50">
                          <button
                            type="button"
                            onClick={() => onDecrease(itemKey)}
                            disabled={item.quantity <= 1}
                            className="flex h-6 w-6 items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            aria-label="Kurangi kuantitas"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>

                          <span className="flex h-6 min-w-6 items-center justify-center font-mono text-xs font-semibold text-stone-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => onIncrease(itemKey)}
                            className="flex h-6 w-6 items-center justify-center text-stone-600 hover:text-stone-900 transition"
                            aria-label="Tambah kuantitas"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        <p className="text-xs font-mono font-semibold text-stone-900 tabular-nums">
                          {formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-stone-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Subtotal</span>
              <span className="font-serif text-lg font-bold text-stone-900 font-mono tabular-nums">
                {formatPrice(totalPrice)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Pembayaran aman terenkripsi oleh Duitku POP</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/cart"
                onClick={onClose}
                className="w-full py-2.5 px-3 rounded-lg border border-stone-300 bg-white text-stone-800 text-center text-xs font-semibold uppercase tracking-wider hover:bg-stone-50 transition"
              >
                Lihat Tas
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="w-full py-2.5 px-3 rounded-lg bg-stone-900 hover:bg-[#9A3412] text-white text-center text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <span>Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
