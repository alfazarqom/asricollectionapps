import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  FileText,
  RotateCcw,
  Shield,
  Truck,
  Phone,
  Mail,
  MapPin,
  Clock,
  CreditCard,
  MessageCircle,
  Store,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import appLogo from '../assets/app-logo.jpg';

const STORE = {
  email: 'asricollections82@gmail.com',
  whatsapp: '6282156764434',
  whatsappDisplay: '+62 821-5676-4434',
  address: 'Sidenreng Rappang, Sulawesi Selatan, Indonesia',
  // Suggested default schedule in Central Indonesia Time (WITA).
  hours: 'Senin–Sabtu, 09.00–17.00 WITA',
  closed: 'Minggu dan hari libur nasional',
};

export const StoreFooter: React.FC = () => {
  const navigate = useNavigate();

  const policyLinks = [
    { title: 'Syarat & Ketentuan', path: '/terms', icon: FileText },
    { title: 'Pengembalian & Refund', path: '/refund', icon: RotateCcw },
    { title: 'Kebijakan Privasi', path: '/privacy', icon: Shield },
    { title: 'Informasi Pengiriman', path: '/shipping', icon: Truck },
    { title: 'Hubungi Kami', path: '/contact', icon: Phone },
  ];

  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  return (
    <footer className="w-full mt-6 border-t border-slate-200 bg-white text-slate-700">
      {/* Brand */}
      <section className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={appLogo}
            alt="Logo Asri Collection"
            className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">Asri Collection</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Toko online • Mobile store</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          Temukan produk pilihan dan belanja dengan nyaman. Informasi pesanan dan pembayaran akan ditampilkan pada alur checkout.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-700">Informasi transparan</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
            <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-700">Info pesanan</span>
          </div>
        </div>
      </section>

      {/* Customer support */}
      <section className="px-4 py-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Layanan Pelanggan</h3>
        </div>
        <a
          href={`https://wa.me/${STORE.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl bg-emerald-600 px-3.5 py-3 text-white transition-colors hover:bg-emerald-700 active:scale-[0.99]"
          aria-label={`Hubungi Asri Collection melalui WhatsApp ${STORE.whatsappDisplay}`}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold">Chat WhatsApp</span>
              <span className="block text-[11px] text-emerald-50 mt-0.5">{STORE.whatsappDisplay}</span>
            </span>
          </span>
          <ArrowUpRight className="w-4 h-4 shrink-0" />
        </a>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex items-start gap-2.5 text-xs">
            <Mail className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500">Email</p>
              <a href={`mailto:${STORE.email}`} className="font-medium text-slate-800 break-all hover:text-blue-700">
                {STORE.email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs">
            <MapPin className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500">Lokasi</p>
              <p className="font-medium leading-relaxed text-slate-800">{STORE.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs">
            <Clock className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500">Jam layanan (WITA)</p>
              <p className="font-medium text-slate-800">{STORE.hours}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{STORE.closed}</p>
              <p className="text-[10px] text-amber-700 mt-1">Jadwal usulan — sesuaikan jika jam operasional toko berbeda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment information */}
      <section className="px-4 py-4 border-b border-slate-100 space-y-2.5">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900">Informasi Pembayaran</h3>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 flex items-start gap-2.5">
          <Store className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed text-slate-600">
            Pilihan metode pembayaran yang tersedia akan ditampilkan pada halaman checkout sesuai kanal pembayaran yang aktif.
          </p>
        </div>
      </section>

      {/* Policy links */}
      <section className="px-4 py-5 bg-slate-900 text-slate-300 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-300" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-white">Bantuan & Kebijakan</h3>
        </div>
        <nav aria-label="Bantuan dan kebijakan toko" className="grid grid-cols-2 gap-x-3 gap-y-1">
          {policyLinks.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className="min-h-10 flex items-center gap-2 py-2 text-left text-[11px] leading-snug text-slate-300 hover:text-white"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-700 pt-3 text-center space-y-1.5">
          <p className="text-[10px] leading-relaxed text-slate-400">
            Untuk pembayaran, ikuti instruksi dan status yang ditampilkan pada halaman transaksi.
          </p>
          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} Asri Collection. Hak cipta dilindungi.
          </p>
          <p className="text-[10px] text-slate-500">asricollection.online</p>
        </div>
      </section>
    </footer>
  );
};
