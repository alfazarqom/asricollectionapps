import React from 'react';
import { ArrowLeft, Shield, Lock, EyeOff, FileText, Database, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoreFooter } from '../components/StoreFooter';

export const PrivacyPolicyPage: React.FC = () => {
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
          <h1 className="text-sm font-bold text-gray-900">Kebijakan Privasi</h1>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">UU PDP 27/2022</span>
      </header>

      <div className="p-4 space-y-4">
        {/* Banner UU PDP */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/60 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">Perlindungan Data Pribadi</h2>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Asri Collection berkomitmen menjaga kerahasiaan dan keamanan data pribadi pelanggan sesuai dengan <strong className="text-gray-900">Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong> Republik Indonesia.
              </p>
            </div>
          </div>
        </div>

        {/* 1. Data yang Dikumpulkan */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-indigo-600" />
            Data Pribadi yang Kami Kumpulkan
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Saat Anda melakukan transaksi guest checkout, kami hanya mengumpulkan informasi yang esensial untuk memproses pesanan:
          </p>
          <ul className="space-y-1.5 text-[11px] text-gray-700 list-disc list-inside bg-slate-50 p-3 rounded-xl">
            <li><strong>Identitas:</strong> Nama lengkap penerima barang.</li>
            <li><strong>Kontak:</strong> Alamat email dan nomor telepon / WhatsApp aktif (untuk konfirmasi invoice &amp; koordinasi kurir pengiriman).</li>
            <li><strong>Pengiriman:</strong> Alamat lengkap pengantaran, kota, dan kode pos.</li>
            <li><strong>Detail Transaksi:</strong> Rincian item pesanan, total biaya, dan nomor invoice Duitku.</li>
          </ul>
        </div>

        {/* 2. Penggunaan Data & Pihak Ketiga */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-600" />
            Tujuan Penggunaan &amp; Pembagian Terbatas
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Data pribadi Anda hanya digunakan untuk tujuan transaksi yang sah dan tidak pernah diperjualbelikan kepada pihak ketiga manapun. Kami hanya membagikan data kepada pihak rekanan terpercaya:
          </p>
          <div className="space-y-2 text-[11px] text-gray-700 pt-1">
            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <strong className="text-gray-900">Duitku Payment Gateway (PT Duitku Cyber Global):</strong> Untuk memproses pembuatan tagihan resmi, verifikasi pembayaran aman berstandar PCI-DSS, dan konfirmasi webhook.
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <strong className="text-gray-900">Jasa Ekspedisi / Kurir (SiCepat, JNE, J&amp;T, GoSend):</strong> Hanya menerima nama penerima, nomor telepon, dan alamat tujuan fisik untuk keperluan pengantaran paket.
            </div>
          </div>
        </div>

        {/* 3. Keamanan Informasi Kartu */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <EyeOff className="w-4 h-4 text-[#2563EB]" />
            Perlindungan Data Kartu Kredit / Keuangan
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Server Asri Collection <strong className="text-gray-900">TIDAK PERNAH menyimpan</strong> nomor kartu kredit, nomor CVV/CVC, maupun kata sandi perbankan Anda. Seluruh pemrosesan pembayaran kartu diproses langsung di iframe terenkripsi bersertifikasi PCI-DSS milik Duitku Payment Gateway dan 3D Secure bank penerbit.
          </p>
        </div>

        {/* 4. Hak Pelanggan & Penghapusan Data */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Hak Pemilik Data Pribadi</h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Sesuai UU PDP, Anda memiliki hak untuk mengakses, memperbarui, atau meminta penghapusan riwayat data pribadi transaksi Anda dari database kami setelah kewajiban pengiriman selesai.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="text-[11px] font-bold text-[#2563EB] hover:underline pt-1 inline-block"
          >
            Hubungi Petugas Perlindungan Data Pribadi (DPO) &rarr;
          </button>
        </div>
      </div>

      {/* Official Store Footer */}
      <StoreFooter />
    </div>
  );
};
