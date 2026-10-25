import { CheckCircle2, X } from "lucide-react";
import { useCart } from "../../hooks/useCart";

const Toast = () => {
  const { notification, dismissNotification } = useCart();

  if (!notification) return null;

  return (
    <aside
      aria-label="Notifikasi Keranjang"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-stone-200 bg-white p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Berhasil
          </p>
          <p className="mt-0.5 text-xs font-medium text-stone-800 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
        </div>
        <button
          onClick={dismissNotification}
          className="text-stone-400 transition-colors hover:text-stone-600 p-1"
          aria-label="Tutup notifikasi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};

export default Toast;
