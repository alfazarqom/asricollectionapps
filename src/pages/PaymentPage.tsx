import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Package,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/formatters';
import { DuitkuPopModal } from '../components/DuitkuPopModal';
import { StoreFooter } from '../components/StoreFooter';
import appLogo from '../assets/app-logo.jpg';
import { supabase } from '../lib/supabase';

export const PaymentPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDuitkuModal, setShowDuitkuModal] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      loadOrder(orderNumber, tokenParam);
    }
  }, [orderNumber, tokenParam]);

  const loadOrder = async (ordNum: string, token: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let data: any = null;

      // 1. Try local/Vercel proxy
      try {
        const query = token ? `?token=${encodeURIComponent(token)}` : '';
        const res = await fetch(`/api/orders/${ordNum}${query}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await res.json();
          }
        }
      } catch (e) {
        console.warn('Proxy order fetch failed, attempting Supabase direct:', e);
      }

      // 2. Fallback to Supabase Edge Function
      if (!data || !data.success) {
        try {
          const query = token
            ? `?orderNumber=${encodeURIComponent(ordNum)}&token=${encodeURIComponent(token)}`
            : `?orderNumber=${encodeURIComponent(ordNum)}`;
          const directRes = await fetch(
            `https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-duitku-payment-status${query}`
          );
          if (directRes.ok) {
            data = await directRes.json();
          }
        } catch (e) {
          console.warn('Edge function fetch failed:', e);
        }
      }

      // 3. Fallback to Supabase orders table directly
      if (!data || (!data.order && !data.data)) {
        try {
          const { data: dbOrder, error: dbErr } = await supabase
            .from('orders')
            .select('*')
            .eq('merchant_order_id', ordNum)
            .maybeSingle();

          if (!dbErr && dbOrder) {
            data = {
              success: true,
              order: {
                order_number: dbOrder.merchant_order_id,
                amount: Number(dbOrder.total_amount || dbOrder.amount || 0),
                payment_status: (dbOrder.status || 'pending').toLowerCase(),
                created_at: dbOrder.created_at,
                duitku_reference: dbOrder.reference,
                va_number: dbOrder.va_number,
                payment_method_name: dbOrder.payment_method || 'Duitku POP',
                payment_url: dbOrder.payment_url,
                raw_duitku_response: {
                  qrString: dbOrder.qr_string,
                  vaNumber: dbOrder.va_number,
                  paymentUrl: dbOrder.payment_url,
                },
              },
            };
          }
        } catch (dbEx) {
          console.warn('Direct database order query failed:', dbEx);
        }
      }

      if (data && (data.order || data.data)) {
        setOrder(data.order || data.data);
      } else {
        throw new Error(data?.error || 'Pesanan tidak ditemukan atau akses terbatas.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat rincian pembayaran.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!orderNumber) return;
    setIsChecking(true);
    try {
      await loadOrder(orderNumber, tokenParam || order?.access_token || '');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPaid = order?.payment_status === 'paid';
  const isPending = !order || order?.payment_status === 'pending';
  const isFailed = order?.payment_status === 'failed' || order?.payment_status === 'expired';

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50 min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-transform"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Instruksi Pembayaran</h1>
            <p className="text-[10px] text-slate-500 font-mono">Invoice Duitku POP</p>
          </div>
        </div>

        <button
          onClick={handleManualCheckStatus}
          disabled={isChecking}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 disabled:opacity-50 transition-all"
          title="Perbarui Status"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-[#EA580C]' : ''}`} />
        </button>
      </header>

      {/* Main Container */}
      <div className="p-4 space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Memuat invoice pembayaran...</p>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isLoading && (
          <div className="bg-white rounded-2xl p-6 border border-rose-100 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-sm font-bold text-slate-900">Gagal Memuat Invoice</h2>
            <p className="text-xs text-slate-500">{errorMessage}</p>
            <button
              onClick={() => orderNumber && loadOrder(orderNumber, tokenParam)}
              className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Order Details & Payment Actions */}
        {!isLoading && order && (
          <>
            {/* Status Card */}
            <div
              className={`rounded-2xl p-5 border text-center space-y-3 shadow-xs ${
                isPaid
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : isFailed
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs ${
                  isPaid
                    ? 'bg-emerald-600 text-white'
                    : isFailed
                    ? 'bg-rose-600 text-white'
                    : 'bg-orange-100 text-[#EA580C]'
                }`}
              >
                {isPaid ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : isFailed ? (
                  <AlertCircle className="w-8 h-8" />
                ) : (
                  <CreditCard className="w-7 h-7 animate-pulse" />
                )}
              </div>

              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                    isPaid
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : isFailed
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPaid
                    ? 'PEMBAYARAN LUNAS (PAID)'
                    : isFailed
                    ? 'KEDALUWARSA / GAGAL'
                    : 'MENUNGGU PEMBAYARAN'}
                </span>
                <h2 className="text-base font-black">
                  {isPaid
                    ? 'Transaksi Anda Telah Terverifikasi!'
                    : isFailed
                    ? 'Tagihan Telah Kedaluwarsa'
                    : 'Selesaikan Pembayaran Sekarang'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {isPaid
                    ? 'Terima kasih, pembayaran telah diterima secara otomatis oleh sistem kami. Pesanan Anda segera disiapkan.'
                    : isFailed
                    ? 'Batas waktu pembayaran telah habis. Silakan lakukan pemesanan ulang jika masih membutuhkan barang.'
                    : 'Tekan tombol di bawah untuk membuka popup pembayaran Duitku POP atau ikuti instruksi pembayaran.'}
                </p>
              </div>

              {/* Price Highlight */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 font-mono text-center">
                <p className="text-[10px] text-slate-400 font-medium">TOTAL TAGIHAN</p>
                <p className="text-xl font-black text-[#EA580C] mt-0.5">
                  {formatRupiah(order.total_amount)}
                </p>
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => setShowDuitkuModal(true)}
                    className="w-full h-12 bg-[#EA580C] hover:bg-orange-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Buka Popup Duitku POP
                  </button>

                  <button
                    onClick={handleManualCheckStatus}
                    disabled={isChecking}
                    className="w-full h-10 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[#EA580C]' : ''}`} />
                    {isChecking ? 'Memeriksa ke Gateway...' : 'Sudah Bayar? Cek Status Realtime'}
                  </button>
                </div>
              )}

              {isPaid && (
                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/pesanan/${order.order_number}?token=${order.access_token || tokenParam}`)}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Package className="w-4 h-4" /> Lihat Rincian & Lacak Pesanan
                  </button>
                </div>
              )}
            </div>

            {/* Order Identity Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2.5 text-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#EA580C]" /> Informasi Tagihan
              </h3>

              <div className="space-y-2 pt-1 border-t border-slate-100 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Nomor Pesanan:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                    <span>{order.order_number}</span>
                    <button
                      onClick={handleCopyOrderNumber}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500"
                      title="Salin Nomor Pesanan"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {copied && (
                  <p className="text-[10px] text-emerald-600 text-right font-medium">Nomor pesanan disalin!</p>
                )}

                <div className="flex justify-between">
                  <span>Penerima:</span>
                  <span className="font-semibold text-slate-900">{order.customer_name}</span>
                </div>

                <div className="flex justify-between">
                  <span>Telepon / WhatsApp:</span>
                  <span className="font-mono text-slate-900">{order.customer_phone}</span>
                </div>

                <div className="flex justify-between">
                  <span>Waktu Dibuat:</span>
                  <span className="text-slate-700">{formatDate(order.created_at)}</span>
                </div>

                {order.duitku_reference && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span>Referensi Duitku:</span>
                    <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {order.duitku_reference}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Duitku POP Modal */}
            {showDuitkuModal && order.duitku_reference && (
              <DuitkuPopModal
                reference={order.duitku_reference}
                orderNumber={order.order_number}
                totalAmount={order.total_amount}
                paymentUrl={order.duitku_payment_url}
                onPaymentFinished={(_statusHint: 'success' | 'pending' | 'closed' | 'error') => {
                  setShowDuitkuModal(false);
                  handleManualCheckStatus();
                }}
                onClose={() => {
                  setShowDuitkuModal(false);
                  handleManualCheckStatus();
                }}
              />
            )}
          </>
        )}
      </div>

      <StoreFooter />
    </div>
  );
};
