import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

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
    0,
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-slate-900" />

            <h2 className="text-xl font-bold text-slate-900">Your Cart</h2>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {cartItems.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 cursor-pointer"
            aria-label="Close cart"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="h-14 w-14 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Your cart is empty
              </h3>

              <p className="mt-2 max-w-xs text-sm text-slate-500">
                Add some products to your cart and they will appear here.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-slate-100 pb-5"
                >
                  {/* Product Image */}
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-3">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>

                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="shrink-0 text-slate-400 transition hover:text-red-500 cursor-pointer"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-900">
                      ${item.price.toFixed(2)}
                    </p>

                    {/* Quantity */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => onDecrease(item.id)}
                          disabled={item.quantity === 1}
                          className="flex h-8 w-8 items-center justify-center transition hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="flex h-8 min-w-8 items-center justify-center border-x border-slate-200 px-2 text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onIncrease(item.id)}
                          className="flex h-8 w-8 items-center justify-center transition hover:bg-slate-50 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 bg-white px-5 py-5">
            {/* Subtotal */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Subtotal</span>

              <span className="text-xl font-bold text-slate-900">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <p className="mb-4 text-xs text-slate-500">
              Shipping and taxes calculated at checkout.
            </p>

            {/* Checkout */}
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
