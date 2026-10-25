import { Link } from "react-router-dom";
import { MessageCircle, ShieldCheck, Truck, RotateCcw, Clock, MapPin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-[#F4EFEA] text-stone-700">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-stone-200/80 bg-stone-900 text-stone-200 py-6">
        <div className="container grid grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-stone-200">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Kirim Seluruh RI</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Jangkauan kurir tepercaya</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-stone-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Duitku POP Resmi</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Enkripsi transaksi Bank Indonesia</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-stone-200">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Jaminan Mutu</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Kualitas bahan terkurasi</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-stone-200">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">CS Responsif</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Senin–Sabtu 09.00–17.00 WITA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                ASRI COLLECTION
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold mt-1">
                Contemporary Fashion &amp; Modest Elegance
              </p>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed max-w-sm">
              Asri Collection menghadirkan busana wanita kontemporer dan modest dengan sentuhan estetika elegan, material berkualitas tinggi, dan kenyamanan tanpa kompromi untuk gaya harian Anda.
            </p>

            <div className="pt-2">
              <a
                href="https://wa.me/6282156764434"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Konsultasi WhatsApp: +62 821-5676-4434</span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Koleksi Busana
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products?category=womens-dresses" className="hover:text-stone-950 transition-colors">
                  Dresses &amp; Gamis
                </Link>
              </li>
              <li>
                <Link to="/products?category=tops" className="hover:text-stone-950 transition-colors">
                  Tops &amp; Blouse
                </Link>
              </li>
              <li>
                <Link to="/products?category=womens-bags" className="hover:text-stone-950 transition-colors">
                  Tas &amp; Handbag
                </Link>
              </li>
              <li>
                <Link to="/products?category=womens-shoes" className="hover:text-stone-950 transition-colors">
                  Sepatu &amp; Heels
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-stone-950 transition-colors font-semibold text-stone-900">
                  Lihat Semua Katalog &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Bantuan &amp; Layanan
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-stone-950 transition-colors">
                  Tentang Asri Collection
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-stone-950 transition-colors">
                  Keranjang Belanja
                </Link>
              </li>
              <li>
                <a href="https://wa.me/6282156764434" target="_blank" rel="noopener noreferrer" className="hover:text-stone-950 transition-colors">
                  Hubungi Tim Layanan
                </a>
              </li>
              <li>
                <span className="text-stone-500">Konfirmasi Pembayaran Duitku</span>
              </li>
            </ul>
          </div>

          {/* Store Location & Policies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Gerai &amp; Kebijakan
            </h3>
            <div className="space-y-2 text-xs text-stone-600">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-stone-500 mt-0.5" />
                <span>Sidenreng Rappang, Sulawesi Selatan, Indonesia</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-stone-500" />
                <span>asricollections82@gmail.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-stone-500" />
                <span>Senin–Sabtu, 09.00–17.00 WITA</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright & payment methods */}
        <div className="mt-12 pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Asri Collection. All rights reserved. Made with elegance for Indonesia.</p>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span>Pembayaran Resmi Terenkripsi:</span>
            <span className="bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-800 font-semibold font-mono text-[10px]">
              Duitku POP
            </span>
            <span className="bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-800 font-semibold font-mono text-[10px]">
              QRIS
            </span>
            <span className="bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-800 font-semibold font-mono text-[10px]">
              Virtual Account
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
