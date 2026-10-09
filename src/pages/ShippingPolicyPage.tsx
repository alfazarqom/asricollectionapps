import React from 'react';
import { ArrowLeft, Truck, Clock, MapPin, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoreFooter } from '../components/StoreFooter';

export const ShippingPolicyPage: React.FC = () => {
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
          <h1 className="text-sm font-bold text-gray-900">Kebijakan Pengiriman</h1>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Ekspedisi Resmi</span>
      </header>

      <div className="p-4 space-y-4">
        {/* Banner Pengiriman */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/60 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">Pengiriman Cepat &amp; Aman</h2>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                Asri Collection bekerja sama dengan penyedia logistik terkemuka untuk memastikan setiap pesanan pakaian dan aksesoris tiba tepat waktu dengan perlindungan kemasan prima.
              </p>
            </div>
          </div>
        </div>

        {/* Kurir & Estimasi Waktu */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#2563EB]" />
            Daftar Layanan Ekspedisi &amp; Estimasi Waktu
          </h3>
          <div className="divide-y divide-gray-100 text-xs">
            <div className="py-2.5 flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 text-xs">SiCepat REG</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Jangkauan luas seluruh Indonesia</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  1 – 2 Hari Kerja
                </span>
                <p className="text-[11px] font-mono text-gray-700 mt-0.5">Rp 16.000</p>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 text-xs">J&amp;T Express</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Pengiriman reguler tanpa hari libur</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  2 – 3 Hari Kerja
                </span>
                <p className="text-[11px] font-mono text-gray-700 mt-0.5">Rp 17.000</p>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 text-xs">JNE Reguler</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Jaringan terpercaya hingga pelosok daerah</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  2 – 3 Hari Kerja
                </span>
                <p className="text-[11px] font-mono text-gray-700 mt-0.5">Rp 18.000</p>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 text-xs">GoSend Same Day</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Khusus area Jabodetabek sampai hari yang sama</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  6 – 8 Jam
                </span>
                <p className="text-[11px] font-mono text-gray-700 mt-0.5">Rp 25.000</p>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 text-xs">Ambil di Toko (Self Pickup)</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Ambil langsung di gerai resmi kami</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  Hari Ini
                </span>
                <p className="text-[11px] font-bold text-emerald-600 mt-0.5">GRATIS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jadwal Operasional & Cut-off Time */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            Jadwal Pemrosesan &amp; Batas Waktu (*Cut-Off*)
          </h3>
          <ul className="space-y-1.5 text-[11px] text-gray-600 leading-relaxed list-disc list-inside">
            <li>Pesanan yang terbayar lunas sebelum pukul <strong className="text-gray-900">15.00 WIB</strong> (Senin – Sabtu) akan dikemas dan dikirimkan pada hari yang sama.</li>
            <li>Pembayaran yang terkonfirmasi setelah pukul 15.00 WIB atau pada hari Minggu/Hari Libur Nasional akan dikirimkan pada hari kerja berikutnya.</li>
          </ul>
        </div>

        {/* Nomor Resi & Pelacakan */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Pelacakan Resi (*Live Tracking*)
          </h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Setelah paket diserahkan ke kurir, nomor resi pengiriman akan otomatis tercatat di sistem toko. Anda dapat memantau status pesanan kapan saja melalui menu <strong className="text-[#2563EB]">Pesanan</strong> menggunakan nomor order Anda.
          </p>
          <button
            onClick={() => navigate('/orders')}
            className="w-full h-10 mt-1 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs"
          >
            <span>Buka Pelacakan Pesanan &rarr;</span>
          </button>
        </div>
      </div>

      {/* Official Store Footer */}
      <StoreFooter />
    </div>
  );
};
