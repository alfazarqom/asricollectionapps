import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Package, RefreshCw, ShieldCheck, Truck, ChevronRight, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { Order } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { StoreFooter } from '../components/StoreFooter';
import appLogo from '../assets/app-logo.jpg';

interface OrdersPageProps {
  initialOrderNumber?: string;
  initialToken?: string;
  onBackToHome?: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  initialOrderNumber,
  initialToken,
  onBackToHome,
}) => {
  const { orderNumber: routeOrderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const effectiveOrderNumber = initialOrderNumber || routeOrderNumber || searchParams.get('orderNumber') || '';
  const effectiveToken = initialToken || searchParams.get('token') || '';

  const [orderNumberInput, setOrderNumberInput] = useState(effectiveOrderNumber);
  const [verificationInput, setVerificationInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active searched or selected order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Recent local saved guest orders
  const [recentOrders, setRecentOrders] = useState<Array<{
    orderNumber: string;
    accessToken: string;
    customerName: string;
    totalAmount: number;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tokokatalog_recent_orders');
      if (stored) {
        setRecentOrders(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed loading recent orders', e);
    }
  }, []);

  // Auto fetch if effective params provided
  useEffect(() => {
    if (effectiveOrderNumber && effectiveToken) {
      fetchOrderByToken(effectiveOrderNumber, effectiveToken);
    } else if (effectiveOrderNumber) {
      setOrderNumberInput(effectiveOrderNumber);
    }
  }, [effectiveOrderNumber, effectiveToken]);

  const handleBackHome = () => {
    if (onBackToHome) onBackToHome();
    else navigate('/');
  };

  // Helper aman untuk memuat data pesanan tanpa error HTML <!doctype
  const fetchOrderData = async (orderNo: string, token?: string): Promise<Order> => {
    const cleanNo = orderNo.trim().toUpperCase();
    const cleanToken = token?.trim() || '';

    let responseData: any = null;

    // 1. Coba request ke backend lokal / proxy /api/orders
    try {
      const url = cleanToken
        ? `/api/orders/${encodeURIComponent(cleanNo)}?token=${encodeURIComponent(cleanToken)}`
        : `/api/orders/${encodeURIComponent(cleanNo)}`;

      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      // Pastikan respons adalah JSON murni, bukan HTML <!doctype html> dari SPA catch-all Vercel
      if (res.ok && contentType.includes('application/json')) {
        responseData = await res.json();
      }
    } catch (_err) {
      // Abaikan dan beralih ke direct Supabase
    }

    // 2. Jika /api/orders tidak mengembalikan JSON (misal HTML di Vercel), panggil langsung Supabase Edge Function
    if (!responseData || !responseData.order) {
      const queryParams = new URLSearchParams({ orderNumber: cleanNo });
      if (cleanToken) queryParams.set('token', cleanToken);

      const directUrl = `https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-duitku-payment-status?${queryParams.toString()}`;

      const directRes = await fetch(directUrl);
      const directContentType = directRes.headers.get('content-type') || '';

      if (directContentType.includes('application/json')) {
        const directData = await directRes.json();
        if (directRes.ok && (directData.order || directData.success)) {
          responseData = directData;
        } else if (directData.error) {
          throw new Error(directData.error);
        }
      } else {
        throw new Error('Gagal memuat status pesanan dari database.');
      }
    }

    // 3. Normalisasi hasil
    if (responseData?.order) {
      return responseData.order;
    }
    if (responseData?.orderNumber) {
      return responseData as Order;
    }

    throw new Error('Pesanan dengan nomor tersebut tidak ditemukan.');
  };

  const fetchOrderByToken = async (orderNo: string, token: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const order = await fetchOrderData(orderNo, token);
      setActiveOrder(order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Pesanan tidak ditemukan atau akses ditolak.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) {
      setErrorMessage('Harap masukkan Nomor Pesanan Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    if (!verificationInput.trim()) {
      setErrorMessage('Masukkan email atau nomor telepon yang digunakan saat checkout.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumberInput.trim(),
          phoneOrEmail: verificationInput.trim(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.order) {
        throw new Error(result.error || 'Pesanan atau data verifikasi tidak cocok.');
      }
      setActiveOrder(result.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Pesanan tidak ditemukan.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrentOrder = () => {
    if (!activeOrder) return;
    fetchOrderByToken(activeOrder.order_number, (activeOrder as any).access_token || initialToken || '');
  };

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          {activeOrder ? (
            <button
              onClick={() => setActiveOrder(null)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleBackHome}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-sm font-bold text-gray-900">
            {activeOrder ? `Pesanan #${activeOrder.order_number}` : 'Lacak Pesanan Pelanggan'}
          </h1>
        </div>

        {activeOrder && (
          <button
            onClick={refreshCurrentOrder}
            disabled={isLoading}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
            title="Refresh Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#2563EB]' : ''}`} />
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="p-4 space-y-4">
        {/* If Active Order is selected, show Full Order Detail & Timeline */}
        {activeOrder ? (
          <div className="space-y-3.5">
            {/* Status overview card */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono">NOMOR PESANAN</span>
                  <p className="text-xs font-bold font-mono text-gray-900 mt-0.5">
                    {activeOrder.order_number}
                  </p>
                </div>
                <StatusBadge type="payment" status={activeOrder.payment_status} size="md" />
              </div>

              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400">Status Pengiriman:</span>
                  <div className="mt-0.5">
                    <StatusBadge type="fulfillment" status={activeOrder.fulfillment_status} />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400">Waktu Pemesanan:</span>
                  <p className="font-medium text-gray-800 text-[11px] mt-0.5">
                    {formatDate(activeOrder.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Courier & Tracking Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#2563EB]" /> Informasi Ekspedisi
              </h3>

              <div className="text-xs space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kurir:</span>
                  <span className="font-semibold text-gray-800">{activeOrder.courier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nomor Resi:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {activeOrder.tracking_number || '(Belum diinput oleh admin)'}
                  </span>
                </div>
                {activeOrder.shipping_notes && (
                  <div className="pt-1 text-[11px] text-gray-500 bg-slate-50 p-2 rounded-lg">
                    Catatan: {activeOrder.shipping_notes}
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Address Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-1.5 text-xs">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Alamat Pengiriman
              </h3>
              <p className="font-bold text-gray-900">{activeOrder.customer_name}</p>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                {activeOrder.shipping_address}, {activeOrder.shipping_city} {activeOrder.shipping_postal_code}
              </p>
              <p className="text-gray-500 text-[11px]">{activeOrder.customer_phone}</p>
            </div>

            {/* Item list */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Daftar Produk ({activeOrder.items?.length || 0})
              </h3>

              <div className="divide-y divide-gray-100">
                {activeOrder.items?.map((it) => (
                  <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-gray-900 truncate">{it.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {it.quantity} x {formatRupiah(it.unit_price)}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">
                      {formatRupiah(it.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total calculations */}
              <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(activeOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Ongkir</span>
                  <span>{formatRupiah(activeOrder.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-50">
                  <span>Total Tagihan</span>
                  <span className="text-[#2563EB]">{formatRupiah(activeOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Audit log trail */}
            {activeOrder.audit_logs && activeOrder.audit_logs.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" /> Riwayat Transaksi &amp; Webhook
                </h3>
                <div className="space-y-2 text-[11px] pt-1">
                  {activeOrder.audit_logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 border-l-2 border-blue-500 pl-2">
                      <div>
                        <span className="font-semibold text-gray-800">{log.action}</span>
                        <p className="text-gray-400 text-[10px]">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Search Form & Recent Orders */
          <div className="space-y-4">
            {/* Search Box */}
            <form onSubmit={handleTrackOrder} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                <img src={appLogo} alt="Asri Collection" className="w-8 h-8 rounded-lg object-cover shadow-2xs border border-gray-100 shrink-0" />
                <div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Lacak Pesanan Pelanggan
                  </h2>
                  <p className="text-[10px] text-gray-500 font-medium">Asri Collection Official Store</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Masukkan nomor pesanan yang Anda terima saat checkout untuk melihat status pembayaran, verifikasi invoice, dan status pengiriman kurir.
              </p>

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Nomor Pesanan *
                </label>
                <input
                  type="text"
                  value={orderNumberInput}
                  onChange={(e) => setOrderNumberInput(e.target.value)}
                  placeholder="Contoh: ORD-20261009-88123"
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Email atau Nomor Telepon Checkout *
                </label>
                <input
                  type="text"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  autoComplete="email"
                  placeholder="Email atau nomor telepon"
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#2563EB] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all hover:bg-blue-700 disabled:opacity-70"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Lacak Sekarang
              </button>
            </form>

            {/* Saved Recent Orders from This Phone */}
            {recentOrders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">
                  Pesanan Terakhir di Perangkat Ini
                </h3>

                <div className="space-y-2">
                  {recentOrders.map((rec) => (
                    <div
                      key={rec.orderNumber}
                      onClick={() => fetchOrderByToken(rec.orderNumber, rec.accessToken)}
                      className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-200 active:scale-[0.99] transition-all"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold text-gray-900 truncate">
                          {rec.orderNumber}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatRupiah(rec.totalAmount)} • {rec.customerName}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official E-Commerce Store Footer */}
      <StoreFooter />
    </div>
  );
};
