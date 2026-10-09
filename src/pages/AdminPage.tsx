import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  DollarSign,
  Package,
  Clock,
  Truck,
  CheckCircle,
  Search,
  RefreshCw,
  Edit,
  Save,
  X,
  FileCode,
  ShieldAlert,
  Play,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Order, AdminMetrics } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';

interface AdminPageProps {
  onBackToStore?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToStore }) => {
  const navigate = useNavigate();
  // Admin PIN Protection (Default PIN: 123456)
  const [pinInput, setPinInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('tokokatalog_admin_pin') === '123456';
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const handleBackToStore = () => {
    if (onBackToStore) onBackToStore();
    else navigate('/');
  };

  // Tab: 'dashboard' | 'orders' | 'simulator' | 'code'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'simulator' | 'code'>('dashboard');

  // Metrics
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected order for edit/modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editShippingForm, setEditShippingForm] = useState<{
    courierName: string;
    trackingNumber: string;
    fulfillmentStatus: string;
    shippingCost: number;
    shippingNotes: string;
  } | null>(null);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [shippingSaveSuccess, setShippingSaveSuccess] = useState(false);

  // Sandbox Simulator State
  const [simOrderNumber, setSimOrderNumber] = useState('');
  const [simScenario, setSimScenario] = useState<'success' | 'failed' | 'duplicate' | 'tampered_sig' | 'tampered_amount'>('success');
  const [simResult, setSimResult] = useState<any>(null);
  const [simRunning, setSimRunning] = useState(false);

  const getAdminHeaders = () => {
    const pin = sessionStorage.getItem('tokokatalog_admin_pin') || '123456';
    return {
      'Content-Type': 'application/json',
      'x-admin-pin': pin,
    };
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '123456') {
      sessionStorage.setItem('tokokatalog_admin_pin', '123456');
      setIsAdminAuthenticated(true);
      setAuthError(null);
      fetchData();
    } else {
      setAuthError('PIN Admin salah. Gunakan default: 123456');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tokokatalog_admin_pin');
    setIsAdminAuthenticated(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mRes, oRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: getAdminHeaders() }),
        fetch(`/api/admin/orders?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`, {
          headers: getAdminHeaders(),
        }),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.success) setMetrics(mData.data);
      }

      if (oRes.ok) {
        const oData = await oRes.json();
        if (oData.success) {
          setOrders(oData.data);
          if (oData.data.length > 0 && !simOrderNumber) {
            setSimOrderNumber(oData.data[0].order_number);
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchData();
    }
  }, [isAdminAuthenticated, statusFilter, searchQuery]);

  const openOrderShippingModal = (order: Order) => {
    setSelectedOrder(order);
    setEditShippingForm({
      courierName: order.courier_name || '',
      trackingNumber: order.tracking_number || '',
      fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
      shippingCost: order.shipping_cost || 0,
      shippingNotes: order.shipping_notes || '',
    });
    setShippingSaveSuccess(false);
  };

  const handleSaveShipping = async () => {
    if (!selectedOrder || !editShippingForm) return;
    setIsSavingShipping(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.order_number}/shipping`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify(editShippingForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan data pengiriman.');
      }

      setSelectedOrder(data.order);
      setShippingSaveSuccess(true);
      fetchData();
      setTimeout(() => setShippingSaveSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingShipping(false);
    }
  };

  // Run Simulator Callback
  const handleRunSimulation = async () => {
    if (!simOrderNumber) {
      alert('Pilih nomor pesanan terlebih dahulu.');
      return;
    }

    setSimRunning(true);
    setSimResult(null);

    try {
      const bodyPayload: any = {
        orderNumber: simOrderNumber,
        scenario: simScenario === 'tampered_sig' ? 'success' : simScenario,
        tamperedSignature: simScenario === 'tampered_sig',
        customAmount: simScenario === 'tampered_amount' ? 9999999 : undefined,
      };

      const res = await fetch('/api/test/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      setSimResult(data);
      fetchData();
    } catch (err: any) {
      setSimResult({ success: false, error: err.message });
    } finally {
      setSimRunning(false);
    }
  };

  // ---------------- LOGIN SCREEN ----------------
  if (!isAdminAuthenticated) {
    return (
      <div className="flex-1 pb-24 flex flex-col bg-slate-50 justify-center p-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-base font-bold text-gray-900">Admin Asri Collection</h1>
            <p className="text-xs text-gray-500 mt-1">
              Antarmuka Mobile-Only Manajemen Pesanan &amp; Pengiriman
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <div>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan 6-Digit PIN (Default: 123456)"
                className="w-full h-11 px-3 text-center tracking-widest text-base font-mono bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-600 font-medium">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-md active:scale-95"
            >
              Buka Panel Admin
            </button>
          </form>

          <button
            onClick={handleBackToStore}
            className="text-xs text-gray-500 hover:text-gray-800 pt-2"
          >
            ← Kembali ke Toko Pelanggan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50">
      {/* Sticky Top Admin Header & Sub-nav Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        {/* Admin Mobile Header */}
        <header className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToStore}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
              title="Ke Toko"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Admin Dashboard</h1>
              <p className="text-[10px] text-gray-500 font-mono">PIN Terverifikasi</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg active:scale-95"
          >
            Keluar
          </button>
        </header>

        {/* Admin Mobile Sub-nav (4 Tabs) */}
        <div className="px-4 py-2 bg-white">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Ringkasan' },
              { id: 'orders', label: `Pesanan (${orders.length})` },
              { id: 'simulator', label: 'Duitku Simulator' },
              { id: 'code', label: 'SQL & Functions' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ---------------- TAB 1: DASHBOARD METRICS ---------------- */}
        {activeTab === 'dashboard' && metrics && (
          <div className="space-y-3.5">
            {/* Total verified revenue */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-md">
              <span className="text-[11px] text-blue-100 font-medium">
                Total Omset Terverifikasi (Lunas Saja)
              </span>
              <p className="text-2xl font-black mt-1 tracking-tight">
                {formatRupiah(metrics.totalRevenue)}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-blue-200 mt-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Hanya menghitung transaksi dengan status pembayaran PAID</span>
              </div>
            </div>

            {/* Metrics 2x2 grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] uppercase font-bold">Total Pesanan</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-gray-900 mt-1">{metrics.totalOrders}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] uppercase font-bold">Menunggu Bayar</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-lg font-bold text-amber-600 mt-1">{metrics.pendingCount}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] uppercase font-bold">Perlu Dikemas</span>
                  <Package className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-lg font-bold text-blue-600 mt-1">{metrics.processingCount}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] uppercase font-bold">Telah Dikirim</span>
                  <Truck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-lg font-bold text-emerald-600 mt-1">{metrics.shippedCount}</p>
              </div>
            </div>

            {/* Quick action card */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Kelola Pengiriman Manual</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Input nomor resi dan perbarui status kirim per pesanan.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Lihat Pesanan
              </button>
            </div>
          </div>
        )}

        {/* ---------------- TAB 2: ORDER MANAGEMENT ---------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor pesanan / nama pelanggan..."
                  className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'paid', label: 'Lunas' },
                  { id: 'pending', label: 'Menunggu' },
                  { id: 'processing', label: 'Dikemas' },
                  { id: 'shipped', label: 'Dikirim' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                      statusFilter === f.id
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Mobile Card List */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-100">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs">Tidak ada pesanan yang sesuai filter.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.map((ord) => (
                  <div
                    key={ord.order_number}
                    className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {ord.order_number}
                      </span>
                      <StatusBadge type="payment" status={ord.payment_status} />
                    </div>

                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-gray-800">{ord.customer_name}</p>
                      <p className="text-gray-500 text-[11px]">{ord.customer_phone}</p>
                      <p className="text-gray-600 text-[11px] line-clamp-1">
                        {ord.shipping_address}, {ord.shipping_city}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Status Kirim:</span>
                        <StatusBadge type="fulfillment" status={ord.fulfillment_status} />
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Total:</span>
                        <span className="font-bold text-gray-900">{formatRupiah(ord.total_amount)}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => openOrderShippingModal(ord)}
                        className="flex-1 h-8 rounded-lg bg-blue-50 text-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1 active:bg-blue-100"
                      >
                        <Edit className="w-3.5 h-3.5" /> Kelola Pengiriman
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 3: DUITKU CALLBACK SIMULATOR ---------------- */}
        {activeTab === 'simulator' && (
          <div className="space-y-3.5">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-[#2563EB]" /> Sandbox Callback Testing Suite
              </h2>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Uji coba alur callback Duitku POP sesuai checklist pengujian nomor 11-16 (Verifikasi signature MD5, nominal mismatch, idempotensi duplikat, dan status hasil).
              </p>

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Pilih Nomor Pesanan untuk Diuji:
                </label>
                <select
                  value={simOrderNumber}
                  onChange={(e) => setSimOrderNumber(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900"
                >
                  {orders.map((o) => (
                    <option key={o.order_number} value={o.order_number}>
                      {o.order_number} - {o.customer_name} ({formatRupiah(o.total_amount)}) [{o.payment_status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Skenario Pengujian:
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'success', label: '1. Callback Sukses (ResultCode 00, Valid MD5 Signature)' },
                    { id: 'failed', label: '2. Pembayaran Gagal (ResultCode 01)' },
                    { id: 'duplicate', label: '3. Callback Duplikat (Uji Idempotensi / Tanpa double-commit)' },
                    { id: 'tampered_sig', label: '4. Signature Palsu / Salah (Harus Ditolak HTTP 401)' },
                    { id: 'tampered_amount', label: '5. Nominal Dimanipulasi (Harus Ditolak HTTP 400)' },
                  ].map((sc) => (
                    <label
                      key={sc.id}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                        simScenario === sc.id
                          ? 'border-[#2563EB] bg-blue-50 text-blue-900 font-medium'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="simScenario"
                        value={sc.id}
                        checked={simScenario === sc.id}
                        onChange={() => setSimScenario(sc.id as any)}
                        className="mt-0.5"
                      />
                      <span className="text-[11px] leading-snug">{sc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={simRunning}
                className="w-full h-11 bg-[#2563EB] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-70"
              >
                {simRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Kirim Simulasi Callback Duitku
              </button>
            </div>

            {/* Simulation Result Output */}
            {simResult && (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 font-mono text-[11px] space-y-2 overflow-x-auto">
                <div className="flex items-center justify-between text-xs font-bold pb-1 border-b border-slate-700">
                  <span>Hasil Eksekusi Simulasi</span>
                  <span className={simResult.success ? 'text-emerald-400' : 'text-rose-400'}>
                    {simResult.success ? 'SUCCESS (PASS)' : 'REJECTED (SECURITY PASS)'}
                  </span>
                </div>

                {simResult.message && <p className="text-emerald-300">{simResult.message}</p>}
                {simResult.error && <p className="text-amber-300">{simResult.error}</p>}

                <div className="pt-2 text-[10px] text-slate-400">
                  <p className="text-slate-300 font-bold mb-0.5">Payload yang Dikirimkan:</p>
                  <pre>{JSON.stringify(simResult.payloadSent, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- TAB 4: SQL & EDGE FUNCTIONS ---------------- */}
        {activeTab === 'code' && (
          <div className="space-y-3.5 text-xs">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-2">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#2563EB]" /> Supabase Artifacts Terpasang
              </h2>
              <p className="text-[11px] text-gray-500">
                File migration SQL dan Edge Function telah siap di folder proyek:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-700 pt-1 font-mono">
                <li>supabase/migrations/20261009000000_init_ecommerce_duitku.sql</li>
                <li>supabase/functions/get-products/index.ts</li>
                <li>supabase/functions/duitku-create-invoice/index.ts</li>
                <li>supabase/functions/duitku-callback/index.ts</li>
                <li>supabase/functions/get-duitku-payment-status/index.ts</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase">Checklist Deployment Vercel &amp; Supabase</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-gray-600">
                <li>Deploy SQL migration ke Supabase melalui CLI: <code>supabase db push</code></li>
                <li>Set Edge Function secrets di Supabase: <code>supabase secrets set DUITKU_MERCHANT_CODE=... DUITKU_API_KEY=...</code></li>
                <li>Deploy Edge Functions: <code>supabase functions deploy get-products --no-verify-jwt</code>, <code>supabase functions deploy duitku-create-invoice</code>, dan <code>supabase functions deploy duitku-callback --no-verify-jwt</code></li>
                <li>Daftarkan URL callback resmi di Merchant Dashboard Duitku: <code>https://&lt;project&gt;.supabase.co/functions/v1/duitku-callback</code></li>
                <li>Deploy frontend ke Vercel dengan command <code>npm run build</code></li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- MODAL / DRAWER: EDIT PENGIRIMAN ---------------- */}
      {selectedOrder && editShippingForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[480px] bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl flex flex-col space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Kelola Pengiriman Manual</h3>
                <p className="text-[11px] font-mono text-gray-500">{selectedOrder.order_number}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shippingSaveSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Data pengiriman berhasil diperbarui dan tercatat di audit log!</span>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Nama Ekspedisi / Kurir:
                </label>
                <input
                  type="text"
                  value={editShippingForm.courierName}
                  onChange={(e) => setEditShippingForm({ ...editShippingForm, courierName: e.target.value })}
                  placeholder="SiCepat / JNE / J&T"
                  className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Nomor Resi Pengiriman:
                </label>
                <input
                  type="text"
                  value={editShippingForm.trackingNumber}
                  onChange={(e) => setEditShippingForm({ ...editShippingForm, trackingNumber: e.target.value })}
                  placeholder="Contoh: 003418293812"
                  className="w-full h-9 px-3 font-mono bg-slate-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Status Pengiriman:
                </label>
                <select
                  value={editShippingForm.fulfillmentStatus}
                  onChange={(e) => setEditShippingForm({ ...editShippingForm, fulfillmentStatus: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                >
                  <option value="unfulfilled">Belum Diproses</option>
                  <option value="processing">Sedang Dikemas (Processing)</option>
                  <option value="shipped">Sedang Dikirim (Shipped)</option>
                  <option value="delivered">Terkirim / Selesai (Delivered)</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Ongkos Kirim Manual (Rp):
                </label>
                <input
                  type="number"
                  value={editShippingForm.shippingCost}
                  onChange={(e) => setEditShippingForm({ ...editShippingForm, shippingCost: Number(e.target.value) })}
                  className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Catatan Admin / Ekspedisi:
                </label>
                <textarea
                  rows={2}
                  value={editShippingForm.shippingNotes}
                  onChange={(e) => setEditShippingForm({ ...editShippingForm, shippingNotes: e.target.value })}
                  placeholder="Catatan pengiriman..."
                  className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                onClick={handleSaveShipping}
                disabled={isSavingShipping}
                className="flex-1 h-10 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-70"
              >
                {isSavingShipping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
