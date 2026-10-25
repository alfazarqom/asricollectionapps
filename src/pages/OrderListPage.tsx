import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, Search, Clock, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/formatters';
import { StoreFooter } from '../components/StoreFooter';

interface RecentOrder {
  orderNumber: string;
  accessToken: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
}

export const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [searchNumber, setSearchNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tokokatalog_recent_orders');
      if (stored) {
        setRecentOrders(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed loading recent orders from localStorage', e);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNumber.trim()) {
      setErrorMessage('Silakan masukkan nomor pesanan Anda.');
      return;
    }
    setErrorMessage(null);
    navigate(`/pesanan/${encodeURIComponent(searchNumber.trim())}`);
  };

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50 min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/akun')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
            aria-label="Kembali ke akun"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Daftar Pesanan Saya</h1>
            <p className="text-[10px] text-slate-500 font-medium">Riwayat Transaksi Pelanggan</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Quick Search Form */}
        <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#EA580C]" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Lacak Pesanan Baru</h2>
          </div>
          <p className="text-[11px] text-slate-500">
            Punya nomor pesanan dari email atau struk checkout? Masukkan di bawah untuk cek status:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              placeholder="Contoh: ORD-20261024-12345"
              className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#EA580C]"
            />
            <button
              type="submit"
              className="px-4 h-10 bg-[#EA580C] text-white rounded-xl text-xs font-semibold hover:bg-orange-700 active:scale-95 transition-all shadow-xs"
            >
              Lacak
            </button>
          </div>

          {errorMessage && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errorMessage}
            </p>
          )}
        </form>

        {/* Recent Orders List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pesanan di Perangkat Ini ({recentOrders.length})
            </h3>
            <span className="text-[10px] text-slate-400">Tersimpan Otomatis</span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto text-xl">
                <Package className="w-7 h-7" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Belum Ada Riwayat Pesanan</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Pesanan yang Anda buat sebagai tamu akan otomatis tercatat di perangkat ini setelah checkout selesai.
              </p>
              <button
                onClick={() => navigate('/produk')}
                className="mt-2 px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Mulai Belanja Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((ord) => (
                <div
                  key={ord.orderNumber}
                  onClick={() =>
                    navigate(`/pesanan/${ord.orderNumber}?token=${encodeURIComponent(ord.accessToken || '')}`)
                  }
                  className="bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-orange-200 shadow-xs cursor-pointer active:scale-[0.99] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                      <Package className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>{ord.orderNumber}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">{formatDate(ord.createdAt)}</span>
                    <span className="font-bold text-[#EA580C]">{formatRupiah(ord.totalAmount)}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                    <span>Penerima: {ord.customerName}</span>
                    <span className="text-[#EA580C] font-semibold underline">Detail Pesanan &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <StoreFooter />
    </div>
  );
};
