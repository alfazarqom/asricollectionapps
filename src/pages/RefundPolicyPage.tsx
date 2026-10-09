import React from 'react';
import { ArrowLeft, RotateCcw, AlertCircle, CheckCircle2, ShieldCheck, Clock, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoreFooter } from '../components/StoreFooter';

export const RefundPolicyPage: React.FC = () => {
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
          <h1 className="text-sm font-bold text-gray-900">Kebijakan Pengembalian Dana</h1>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Duitku Policy</span>
      </header>

      <div className="p-4 space-y-4">
        {/* Banner Jaminan Kepuasan */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">Komitmen Layanan Purna Jual</h2>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Asri Collection menjamin kualitas setiap barang yang dikirim. Kami menyediakan prosedur pengembalian barang (*return*) dan pengembalian dana (*refund*) yang adil dan transparan.
              </p>
            </div>
          </div>
        </div>

        {/* Syarat Klaim Retur */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Syarat Pengajuan Retur &amp; Komplain
          </h3>
          <div className="space-y-2 text-[11px] text-gray-600 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong className="text-gray-800">Batas Waktu:</strong> Pengajuan wajib dilaporkan maksimal <strong className="text-gray-900">2 × 24 jam</strong> sejak paket dinyatakan sampai oleh kurir ekspedisi.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong className="text-gray-800">Wajib Video Unboxing:</strong> Menyertakan rekaman video pembukaan paket utuh tanpa potongan/edit saat pertama kali dibuka.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong className="text-gray-800">Kondisi Produk:</strong> Barang belum pernah dipakai, belum dicuci, tidak terkena parfum/noda, dan tag/label harga masih terpasang rapi.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong className="text-gray-800">Alasan yang Diterima:</strong> Cacat produksi jahitan/kain, salah kirim ukuran/warna dari pihak penjual, atau barang rusak dalam perjalanan.</span>
            </div>
          </div>
        </div>

        {/* Aturan Regulasi Duitku untuk Pengembalian Dana */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            Mekanisme Pengembalian Dana (Regulasi Duitku PG)
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Sesuai regulasi kepatuhan <strong className="text-gray-800">Bank Indonesia</strong> dan ketentuan merchant <strong className="text-[#2563EB]">Duitku Payment Gateway</strong>:
          </p>
          <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-[11px] text-gray-700">
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#2563EB] shrink-0">•</span>
              <span><strong>Metode Pembayaran Asal:</strong> Pengembalian dana transaksi diproses kembali ke instrumen asal (rekening bank pembayar atau saldo e-wallet yang digunakan saat checkout).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#2563EB] shrink-0">•</span>
              <span><strong>Transaksi Kartu:</strong> Toko dilarang melakukan pengembalian dana transaksi kartu kredit/debit secara tunai. Pengembalian dana dilakukan melalui sistem reversal/chargeback Duitku ke limit kartu bersangkutan.</span>
            </div>
          </div>
        </div>

        {/* Estimasi Waktu Proses */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            Estimasi Waktu Pencairan Dana (*SLA*)
          </h3>
          <div className="divide-y divide-gray-100 text-xs">
            <div className="py-2 flex justify-between items-center">
              <span className="text-gray-600 text-[11px]">QRIS &amp; E-Wallet:</span>
              <span className="font-bold text-gray-900 text-[11px]">1 – 2 Hari Kerja</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-gray-600 text-[11px]">Virtual Account Bank (BCA, Mandiri, BNI, BRI):</span>
              <span className="font-bold text-gray-900 text-[11px]">1 – 3 Hari Kerja</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-gray-600 text-[11px]">Kartu Kredit / Debit Visa / Mastercard:</span>
              <span className="font-bold text-gray-900 text-[11px]">7 – 14 Hari Kerja (Sesuai Bank)</span>
            </div>
          </div>
        </div>

        {/* Hubungi Layanan Komplain */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Cara Mengajukan Refund</h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Siapkan nomor pesanan Anda (contoh: <code className="text-gray-900 bg-slate-100 px-1 py-0.5 rounded font-mono">ORD-20261009-XXXXX</code>) beserta video unboxing, lalu hubungi tim layanan pelanggan kami.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="w-full h-10 mt-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs"
          >
            <span>Ajukan Komplain via Layanan Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Official Store Footer */}
      <StoreFooter />
    </div>
  );
};
