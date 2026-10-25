import { useState } from "react";
import { Truck, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

const AnnouncementBar = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Pengumuman Toko" className="bg-stone-900 text-stone-200 text-xs py-2 px-4 border-b border-stone-800 transition-all">
      <div className="container flex items-center justify-between gap-4">
        <div className="hidden sm:flex items-center gap-2 text-stone-400 font-medium">
          <Truck className="h-3.5 w-3.5 text-stone-300" />
          <span>Pengiriman Cepat Seluruh Indonesia</span>
        </div>

        <div className="flex-1 sm:flex-initial text-center sm:text-left flex items-center justify-center gap-2 font-medium">
          <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
            Eksklusif
          </span>
          <span className="truncate">
            Koleksi Terbaru Asri Collection — Dapatkan Diskon Hingga 40%
          </span>
          <Link
            to="/products"
            className="hidden md:inline-flex items-center gap-0.5 font-bold text-white hover:text-amber-400 underline underline-offset-4 ml-1 transition-colors"
          >
            Belanja Sekarang &rarr;
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-stone-400 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-stone-300" />
            <span>Duitku POP Verified</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-stone-400 hover:text-white transition-colors p-1"
            aria-label="Tutup pengumuman"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AnnouncementBar;
