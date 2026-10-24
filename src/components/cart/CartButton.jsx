import { ShoppingCart } from "lucide-react";

const CartButton = ({ count = 0, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Open shopping cart"
    aria-expanded={count > 0}
    aria-haspopup="true"
    className="relative p-1 text-slate-700 transition-colors hover:text-slate-950 cursor-pointer"
  >
    <ShoppingCart className="h-6 w-6" />
    {count > 0 && (
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
        {count}
      </span>
    )}
  </button>
);

export default CartButton;
