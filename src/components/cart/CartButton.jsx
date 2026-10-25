import { ShoppingBag } from "lucide-react";

const CartButton = ({ count = 0, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`Buka keranjang belanja (${count} barang)`}
    className="relative flex h-10 items-center gap-2 rounded-xl px-3 py-2 text-stone-800 transition-all hover:bg-stone-100 hover:text-stone-950 active:scale-95 cursor-pointer"
  >
    <div className="relative">
      <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -right-2 -top-1.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-bold text-white tabular-nums font-mono shadow-xs animate-in zoom-in-75">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
    <span className="hidden sm:inline-block text-xs font-semibold tracking-wide uppercase">
      Keranjang
    </span>
  </button>
);

export default CartButton;
