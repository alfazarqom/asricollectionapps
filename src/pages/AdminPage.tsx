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
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Order, AdminMetrics } from '../types';
import { formatRupiah, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';
import appLogo from '../assets/app-logo.jpg';

interface AdminPageProps {
  onBackToStore?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToStore }) => {
  const navigate = useNavigate();
  // Credentials are entered by the operator and validated by the server.
  const [pinInput, setPinInput] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleBackToStore = () => {
    if (onBackToStore) onBackToStore();
    else navigate('/');
  };

  // Tabs: dashboard, orders, and implementation notes.
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'code'>('dashboard');

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


  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-pin': adminPin,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Autentikasi admin gagal. Periksa konfigurasi server.');
      }
      setAdminPin(pinInput);
      setPinInput('');
      setIsAdminAuthenticated(true);
    } catch (error: any) {
      setAuthError(error?.message || 'Server autentikasi admin tidak dapat dijangkau.');
    }
  };

  const handleLogout = () => {
    setAdminPin('');
    setPinInput('');
    setIsAdminAuthenticated(false);
    setMetrics(null);
    setOrders([]);
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
  }, [isAdminAuthenticated, adminPin, statusFilter, searchQuery]);

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

  // ---------------- LOGIN SCREEN ----------------
  if (!isAdminAuthenticated) {
    return (
      <div className="flex-1 pb-24 flex flex-col bg-slate-50 justify-center p-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl mx-auto overflow-hidden shadow-xs border border-gray-100 flex items-center justify-center">
            <img src={appLogo} alt="Asri Collection" className="w-full h-full object-cover" />
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
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN admin dari server"
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
            <div className="flex items-center gap-2">
              <img src={appLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover shadow-xs border border-gray-100 shrink-0" />
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">Admin Dashboard</h1>
                <p className="text-[10px] text-gray-500 font-mono">PIN Terverifikasi</p>
              </div>
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

        {/* ---------------- IMPLEMENTATION NOTES ---------------- */}
        {activeTab === 'code' && (
          <div className="space-y-3.5 text-xs">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-2">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#2563EB]" /> File Integrasi di Repository
              </h2>
              <p className="text-[11px] text-gray-500">
                File berikut tersedia di repository. Keberadaan file tidak membuktikan bahwa versi yang sama telah diterapkan ke Supabase aktif:
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
              <h3 className="text-xs font-bold text-gray-900 uppercase">Checklist sebelum perubahan aktif</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-gray-600">
                <li>Rekonsiliasi seluruh migration repository dengan riwayat dan schema Supabase aktif.</li>
                <li>Bandingkan source serta versi Edge Functions aktif dengan branch yang akan dirilis.</li>
                <li>Konfirmasi secara resmi kontrak signature callback POP dan nilai secret <code>DUITKU_MERCHANT_KEY</code>.</li>
                <li>Uji callback valid, signature salah, nominal berbeda, callback duplikat, dan kegagalan RPC di Sandbox/staging.</li>
                <li>Siapkan diff dan minta persetujuan terpisah sebelum menjalankan migration, mengubah secrets, atau deploy.</li>
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
