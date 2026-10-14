import React from 'react';
import { ArrowLeft, Phone, Mail, MapPin, Clock, ShieldCheck, MessageCircle, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoreFooter } from '../components/StoreFooter';
import appLogo from '../assets/app-logo.jpg';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">Hubungi Kami</h1>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Asri Collection</span>
      </header>

      <div className="p-4 space-y-4">
        {/* Banner Legalitas Usaha */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/60 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <img
              src={appLogo}
              alt="Asri Collection"
              className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs border border-white"
            />
            <div>
              <h2 className="text-xs font-bold text-gray-900">Asri Collection Indonesia</h2>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Toko busana dan perlengkapan gaya hidup resmi dengan integrasi pembayaran aman dan layanan pelanggan responsif.
              </p>
            </div>
          </div>
        </div>

        {/* Informasi Kontak Resmi */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Informasi Kontak Resmi
          </h3>

          <div className="space-y-3 text-xs">
            {/* WhatsApp */}
            <div className="flex items-start gap-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-900">WhatsApp Layanan Pelanggan</p>
                <p className="text-xs font-mono font-bold text-emerald-800 mt-0.5">0812-9876-5432</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Respons cepat untuk konsultasi produk &amp; bantuan pembayaran</p>
              </div>
            </div>

            {/* Email Support */}
            <div className="flex items-start gap-3 p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-900">Email Customer Support</p>
                <p className="text-xs font-mono font-bold text-[#2563EB] mt-0.5">support@asricollection.id</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Untuk pertanyaan transaksi, retur barang, dan invoice Duitku</p>
              </div>
            </div>

            {/* Alamat Fisik Toko */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-900">Alamat Gerai &amp; Pusat Pengiriman</p>
                <p className="text-xs text-gray-800 mt-0.5 leading-relaxed">
                  Jl. Jenderal Sudirman No. 45, RT 02 / RW 04, Karet Semanggi, Setiabudi, Jakarta Selatan, DKI Jakarta 12190
                </p>
              </div>
            </div>

            {/* Jam Operasional */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-900">Jam Operasional Layanan</p>
                <p className="text-xs text-gray-800 mt-0.5">
                  Senin – Sabtu: 08.00 – 18.00 WIB
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Minggu &amp; Libur Nasional: Pelayanan via WhatsApp terbatas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mitra Resmi Pembayaran */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            Kemitraan Resmi Payment Gateway
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Sistem pembayaran elektronik Asri Collection disediakan oleh <strong className="text-gray-900">PT Duitku Cyber Global (Duitku Payment Gateway)</strong>, Penyelenggara Jasa Pembayaran (PJP) Kategori 3 yang telah berizin resmi dari <strong className="text-[#2563EB]">Bank Indonesia</strong>.
          </p>
        </div>
      </div>

      {/* Official Store Footer */}
      <StoreFooter />
    </div>
  );
};
