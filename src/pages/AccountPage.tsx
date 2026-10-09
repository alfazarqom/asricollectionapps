import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  CreditCard,
  Phone,
  ChevronRight,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { StoreFooter } from '../components/StoreFooter';

interface AccountPageProps {
  onGoToOrders?: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  onGoToOrders,
}) => {
  const navigate = useNavigate();
  const [configStatus, setConfigStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/config-status')
      .then((res) => res.json())
      .then((data) => setConfigStatus(data))
      .catch((e) => console.warn('Config status check error', e));
  }, []);

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-2xs">
        <h1 className="text-sm font-bold text-gray-900">Akun &amp; Pengaturan</h1>
        <span className="text-[10px] text-gray-500 font-mono">Asri Collection v2.0</span>
      </header>

      <div className="p-4 space-y-4">
        {/* Guest Profile Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-base shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-gray-900 truncate">Pelanggan Tamu (Guest)</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Belanja instan tanpa registrasi akun yang rumit
            </p>
          </div>
        </div>

        {/* Quick Menu List (Khusus Pelanggan / Publik) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          <button
            onClick={() => {
              if (onGoToOrders) onGoToOrders();
              else navigate('/orders');
            }}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Riwayat &amp; Status Pesanan</p>
                <p className="text-[10px] text-gray-500">Lacak invoice &amp; pengiriman kurir</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/contact')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Pusat Bantuan &amp; Kontak</p>
                <p className="text-[10px] text-gray-500">Layanan CS resmi dan WhatsApp</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/terms')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Syarat &amp; Ketentuan</p>
                <p className="text-[10px] text-gray-500">Faktur transaksi dan standar pembayaran</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Duitku POP System Status Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" /> Status Gateway Duitku POP
          </h3>

          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Lingkungan:</span>
              <span className="font-semibold text-gray-800 uppercase font-mono">
                {configStatus?.env || 'sandbox'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kredensial Merchant:</span>
              <span className="font-mono text-gray-800">
                {configStatus?.merchantCode || 'Mode Uji Mandiri'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-gray-500">Webhook Callback URL:</span>
              <span className="font-mono text-[10px] text-[#2563EB] truncate max-w-[170px]">
                {configStatus?.callbackUrl || '/api/duitku-callback'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Support & Store Info */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600" /> Bantuan Cepat Pelanggan
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Butuh bantuan terkait pembayaran atau pesanan? Hubungi layanan pelanggan kami via WhatsApp di <strong className="text-emerald-700">0812-9876-5432</strong> setiap hari (08.00 - 21.00 WIB).
          </p>
        </div>
      </div>

      {/* Official E-Commerce Store Footer */}
      <StoreFooter />
    </div>
  );
};
