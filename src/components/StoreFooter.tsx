import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  RotateCcw,
  Shield,
  Truck,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Lock,
  MessageCircle,
} from 'lucide-react';
import appLogo from '../assets/app-logo.jpg';

export const StoreFooter: React.FC = () => {
  const navigate = useNavigate();

  const legalLinks = [
    {
      title: 'Syarat & Ketentuan',
      path: '/terms',
      icon: FileText,
      desc: 'Ketentuan transaksi & faktur pembayaran',
    },
    {
      title: 'Kebijakan Pengembalian Dana',
      path: '/refund',
      icon: RotateCcw,
      desc: 'Prosedur retur, klaim garansi & SLA refund',
    },
    {
      title: 'Kebijakan Privasi',
      path: '/privacy',
      icon: Shield,
      desc: 'Standar pelindungan data pribadi (PDP)',
    },
    {
      title: 'Ketentuan Pengiriman',
      path: '/shipping',
      icon: Truck,
      desc: 'Jadwal kurir, tarif ongkir & pelacakan resi',
    },
    {
      title: 'Hubungi Kami',
      path: '/contact',
      icon: Phone,
      desc: 'Kontak resmi, alamat kantor & layanan CS',
    },
  ];

  const paymentMethods = [
    { name: 'QRIS', tag: 'Semua Bank & E-Wallet' },
    { name: 'BCA VA', tag: 'Virtual Account' },
    { name: 'Mandiri VA', tag: 'Virtual Account' },
    { name: 'BNI / BRI', tag: 'Virtual Account' },
    { name: 'ShopeePay', tag: 'E-Wallet' },
    { name: 'OVO / DANA', tag: 'E-Wallet' },
    { name: 'Visa / MC', tag: 'Credit Card' },
  ];

  const shippingPartners = ['JNE Express', 'SiCepat', 'J&T Express', 'Anteraja'];

  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  return (
    <footer className="w-full mt-6 bg-white border-t border-slate-200/80 text-slate-700">
      {/* 1. Brand Identity Header */}
      <div className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={appLogo}
            alt="Asri Collection"
            className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs border border-slate-100"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Asri Collection
              </h3>
              <span className="text-[10px] font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Official Store
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              Busana &amp; Gaya Hidup Modern Berkualitas
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mt-3">
          Belanja online mudah, transparan, dan terpercaya tanpa wajib registrasi akun. Seluruh pembayaran diproses melalui payment gateway berizin resmi <span className="font-semibold text-slate-900">Duitku POP</span>.
        </p>
      </div>

      {/* 2. Layanan Pelanggan & WhatsApp CS */}
      <div className="px-4 py-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-[#2563EB]" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Layanan Pelanggan
          </h4>
        </div>

        {/* Prominent WhatsApp Button */}
        <a
          href="https://wa.me/6281298765432"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white flex items-center justify-between transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Chat WhatsApp CS Resmi</p>
              <p className="text-[10px] text-emerald-100 font-mono mt-0.5">
                0812-9876-5432 (Respons Cepat)
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-emerald-100 shrink-0" />
        </a>

        {/* Contact Details List */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/70 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Email:{' '}
              <a
                href="mailto:cs@asricollection.id"
                className="font-medium text-slate-800 hover:text-[#2563EB]"
              >
                cs@asricollection.id
              </a>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Jam Kerja:{' '}
              <strong className="font-semibold text-slate-800">
                Senin - Sabtu (08.00 - 21.00 WIB)
              </strong>
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              Jl. Gatot Subroto No. 45, Jakarta Selatan 12930, Indonesia
            </span>
          </div>
        </div>
      </div>

      {/* 3. Metode Pembayaran Resmi */}
      <div className="px-4 py-4 border-b border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Metode Pembayaran
            </h4>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Duitku POP
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {paymentMethods.map((badge, idx) => (
            <div
              key={idx}
              className="p-1.5 bg-slate-50/90 border border-slate-200/80 rounded-lg text-center"
            >
              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                {badge.name}
              </p>
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5 truncate">
                {badge.tag}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Jasa Pengiriman Terpercaya */}
      <div className="px-4 py-4 border-b border-slate-100 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-[#2563EB]" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Jasa Pengiriman
          </h4>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {shippingPartners.map((kurir, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200/80"
            >
              {kurir}
            </span>
          ))}
        </div>
      </div>

      {/* 5. Navy Closing Section (#0f172b): Quick Links Kebijakan Toko & Legal Compliance */}
      <div className="px-4 py-5 bg-[#0f172b] text-slate-400 space-y-4">
        {/* Kebijakan Toko & Legalitas (Quick Links Grid 2 Kolom) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Kebijakan Toko &amp; Legalitas
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/60">
              Standar Duitku
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/60 p-3">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {legalLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className="flex items-center gap-1.5 text-left text-slate-300 hover:text-white active:text-blue-300 transition-colors group cursor-pointer py-1 min-h-[30px]"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 shrink-0 transition-colors" />
                    <span className="text-[11px] font-medium leading-tight truncate group-hover:underline">
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lisensi Keamanan, Bank Indonesia & Hak Cipta */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>SSL 256-bit Encrypted &bull; Resmi Bank Indonesia</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            Penyelenggara Sistem Pembayaran berizin resmi PT Duitku Cyber Global (Duitku Payment Gateway).
          </p>
          <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
            &copy; {new Date().getFullYear()} Asri Collection. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </div>
    </footer>
  );
};
