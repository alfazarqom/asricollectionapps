import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoreFooter } from '../components/StoreFooter';

export const TermsPage: React.FC = () => {
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
          <h1 className="text-sm font-bold text-gray-900">Syarat &amp; Ketentuan</h1>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">v2.1 • 2026</span>
      </header>

      <div className="p-4 space-y-4">
        {/* Banner Kepatuhan */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">Ketentuan Layanan Transaksi</h2>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Syarat dan ketentuan ini mengatur penggunaan platform toko online <strong className="text-gray-900">Asri Collection</strong> serta integrasi transaksi pembayaran melalui payment gateway resmi <strong className="text-[#2563EB]">Duitku POP</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Pasal 1: Definisi & Ketentuan Umum */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">1</span>
            Ketentuan Umum &amp; Akun Pelanggan
          </h3>
          <ul className="space-y-1.5 text-[11px] text-gray-600 leading-relaxed list-disc list-inside">
            <li>Platform menyediakan fasilitas <strong className="text-gray-800">Guest Checkout</strong> untuk kemudahan transaksi cepat tanpa registrasi akun yang rumit.</li>
            <li>Pelanggan bertanggung jawab penuh atas kebenaran data penerima (nama lengkap, nomor telepon aktif WhatsApp, email, dan alamat pengiriman detail).</li>
            <li>Setiap pesanan guest dilindungi dengan token kriptografi unik (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">access_token</code>) untuk akses pelacakan status pesanan secara privat.</li>
          </ul>
        </div>

        {/* Pasal 2: Harga & Pembayaran Duitku */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</span>
            Harga Produk &amp; Mekanisme Pembayaran Duitku
          </h3>
          <ul className="space-y-1.5 text-[11px] text-gray-600 leading-relaxed list-disc list-inside">
            <li>Seluruh harga dicantumkan dalam mata uang resmi <strong className="text-gray-800">Rupiah (IDR)</strong> dan sudah termasuk nilai produk tanpa biaya tersembunyi.</li>
            <li>Biaya pengiriman dihitung secara transparan dan otoritatif berdasarkan kurir yang dipilih sebelum pembuatan invoice.</li>
            <li>Pembayaran diproses melalui sistem <strong className="text-[#2563EB]">Duitku Payment Gateway</strong> yang berizin dan diawasi oleh <strong className="text-gray-800">Bank Indonesia (BI)</strong>.</li>
            <li>Metode pembayaran resmi yang didukung meliputi: Virtual Account Bank (BCA, Mandiri, BNI, BRI, Permata), QRIS (GoPay, OVO, Dana, ShopeePay, LinkAja), dan Kartu Kredit/Debit.</li>
          </ul>
        </div>

        {/* Pasal 3: Batas Waktu Invoice (Expiry) */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</span>
            Batas Waktu Pembayaran (Invoice Expiry)
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Setiap tagihan pembayaran memiliki masa berlaku maksimal <strong className="text-gray-900">60 menit</strong> sejak invoice dibuat. Selama masa tunggu, stok produk direservasi secara atomik di database toko.
          </p>
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 flex items-start gap-2 text-[11px] text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Jika pembayaran tidak diselesaikan sebelum batas waktu berakhir, invoice akan otomatis kedaluwarsa (<span className="font-mono font-bold">EXPIRED</span>) dan reservasi stok produk akan dilepaskan kembali ke publik.</span>
          </div>
        </div>

        {/* Pasal 4: Keamanan Transaksi & Anti-Fraud */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">4</span>
            Keamanan Transaksi &amp; Verifikasi Webhook
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Status lunas (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-bold text-emerald-600">PAID</code>) hanya dapat disahkan setelah server backend Asri Collection berhasil memverifikasi webhook callback resmi dengan signature kriptografis valid dari server Duitku.
          </p>
        </div>

        {/* Pasal 5: Kontak & Bantuan Hukum */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Perubahan Ketentuan</h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Asri Collection berhak memperbarui ketentuan ini sewaktu-waktu sesuai dengan peraturan perundang-undangan Republik Indonesia dan kebijakan kepatuhan Duitku Payment Gateway.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">Terakhir diperbarui: Oktober 2026</span>
            <button
              onClick={() => navigate('/contact')}
              className="font-bold text-[#2563EB] hover:underline"
            >
              Hubungi Layanan Hukum &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Official Store Footer */}
      <StoreFooter />
    </div>
  );
};
