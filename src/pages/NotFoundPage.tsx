import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingBag } from 'lucide-react';
import { StoreFooter } from '../components/StoreFooter';
import appLogo from '../assets/app-logo.jpg';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50 min-h-full">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <img
            src={appLogo}
            alt="Asri Collection"
            className="w-7 h-7 rounded-lg object-cover border border-slate-100 shadow-2xs"
          />
          <h1 className="text-sm font-bold text-slate-900">Asri Collection</h1>
        </div>
      </header>

      {/* Main 404 Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center text-3xl font-black mb-4 shadow-xs">
          404
        </div>
        <h2 className="text-lg font-bold text-slate-900">Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-[280px] leading-relaxed">
          Maaf, tautan atau halaman busana yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
        </p>

        <div className="flex flex-col w-full max-w-xs gap-2.5 mt-6">
          <button
            onClick={() => navigate('/')}
            className="w-full h-11 bg-[#EA580C] hover:bg-orange-700 active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" /> Kembali ke Beranda
          </button>

          <button
            onClick={() => navigate('/produk')}
            className="w-full h-11 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#EA580C]" /> Jelajahi Semua Produk
          </button>
        </div>
      </div>

      <StoreFooter />
    </div>
  );
};
