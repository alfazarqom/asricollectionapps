import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Copy,
  MessageCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatPrice } from "../utils/formatters";

export default function Orders() {
  const { id: routeOrderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Query Parameters from Duitku Return URL or direct link
  const queryOrderId =
    searchParams.get("merchantOrderId") ||
    searchParams.get("orderNumber") ||
    searchParams.get("order");
  const activeOrderId = routeOrderId || queryOrderId || "";
  const resultCode = searchParams.get("resultCode");
  const duitkuRef = searchParams.get("reference");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lazy initialization of recent orders from localStorage
  const [recentOrders, setRecentOrders] = useState(() => {
    try {
      const stored =
        localStorage.getItem("asri_recent_orders") ||
        localStorage.getItem("tokokatalog_recent_orders");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Failed to load local order history:", e);
      return [];
    }
  });

  const saveOrderToLocal = useCallback((orderInfo) => {
    try {
      const stored = localStorage.getItem("asri_recent_orders");
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter((item) => item.orderNumber !== orderInfo.orderNumber);
      list.unshift(orderInfo);
      const trimmed = list.slice(0, 15);
      localStorage.setItem("asri_recent_orders", JSON.stringify(trimmed));
      setRecentOrders(trimmed);
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }, []);

  const fetchOrderDetails = useCallback(
    async (orderId) => {
      setIsLoadingOrder(true);
      setOrderNotFound(false);

      try {
        // Query Supabase orders table
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .or(`merchant_order_id.eq.${orderId},reference.eq.${orderId}`)
          .maybeSingle();

        if (orderError) {
          console.warn("Error fetching order from Supabase:", orderError);
        }

        if (orderData) {
          setCurrentOrder(orderData);

          // Fetch associated order items if table exists
          try {
            const { data: itemsData } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", orderData.id);

            if (itemsData && itemsData.length > 0) {
              setOrderItems(itemsData);
            }
          } catch {
            // Non-blocking
          }

          // Save into local history
          saveOrderToLocal({
            orderNumber: orderData.merchant_order_id,
            reference: orderData.reference,
            totalAmount: orderData.total_amount || orderData.amount,
            customerName: orderData.customer_name,
            status: orderData.status,
            createdAt: orderData.created_at,
          });
        } else {
          // If not found in database, check if we have minimal info from query parameters
          if (resultCode && orderId) {
            setCurrentOrder({
              merchant_order_id: orderId,
              reference: duitkuRef || null,
              status: resultCode === "00" ? "SUCCESS" : "PENDING",
              result_code: resultCode,
              total_amount: null,
              customer_name: "Pelanggan Terhormat",
              created_at: new Date().toISOString(),
            });
          } else {
            setCurrentOrder(null);
            setOrderNotFound(true);
          }
        }
      } catch (err) {
        console.error("Failed to query order:", err);
        setOrderNotFound(true);
      } finally {
        setIsLoadingOrder(false);
      }
    },
    [resultCode, duitkuRef, saveOrderToLocal]
  );

  // Fetch active order details when activeOrderId changes
  useEffect(() => {
    let ignore = false;
    if (!activeOrderId) return;

    // Asynchronous dispatch to avoid synchronous setState warning
    Promise.resolve().then(() => {
      if (!ignore) {
        fetchOrderDetails(activeOrderId);
      }
    });

    return () => {
      ignore = true;
    };
  }, [activeOrderId, fetchOrderDetails]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/orders/${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRefresh = async () => {
    if (!activeOrderId) return;
    setIsRefreshing(true);
    await fetchOrderDetails(activeOrderId);
    setIsRefreshing(false);
  };

  const isPaid = currentOrder?.status === "SUCCESS" || resultCode === "00";
  const isPending = currentOrder?.status === "PENDING" && resultCode !== "00";
  const isFailed =
    currentOrder?.status === "FAILED" ||
    currentOrder?.status === "EXPIRED" ||
    resultCode === "01";

  return (
    <main className="min-h-screen bg-[#FAF8F5] pt-24 sm:pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs text-stone-500"
        >
          <Link to="/" className="hover:text-stone-900 transition">
            Beranda
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/orders" className="hover:text-stone-900 transition">
            Daftar Pesanan
          </Link>
          {activeOrderId && (
            <>
              <ChevronRight className="w-3 h-3 text-stone-400" />
              <span className="text-stone-900 font-mono font-medium">
                {activeOrderId}
              </span>
            </>
          )}
        </nav>

        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              {activeOrderId ? "Detail & Status Pesanan" : "Riwayat & Lacak Pesanan"}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Pantau status verifikasi pembayaran gateway Duitku POP dan pengiriman pesanan Asri Collection.
            </p>
          </div>

          {activeOrderId && (
            <button
              onClick={() => navigate("/orders")}
              className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-950 transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lihat Semua Pesanan</span>
            </button>
          )}
        </div>

        {/* If viewing a specific order */}
        {activeOrderId ? (
          <div className="mt-8 space-y-6">
            {isLoadingOrder ? (
              <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-4">
                <div className="w-10 h-10 border-3 border-[#9A3412] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-stone-600">
                  Memeriksa status pesanan di database...
                </p>
              </div>
            ) : orderNotFound ? (
              <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7 text-[#9A3412]" />
                </div>
                <h2 className="text-lg font-serif font-medium text-stone-900">
                  Pesanan Tidak Ditemukan
                </h2>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Nomor pesanan{" "}
                  <span className="font-mono font-bold text-stone-800">
                    {activeOrderId}
                  </span>{" "}
                  belum tercatat di sistem kami atau sedang menunggu konfirmasi payment gateway.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handleManualRefresh}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-[#9A3412] transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang
                  </button>
                  <Link
                    to="/products"
                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200 transition"
                  >
                    Kembali ke Katalog
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Status Hero Card */}
                <div
                  className={`rounded-2xl p-6 sm:p-8 border shadow-xs text-center space-y-4 ${
                    isPaid
                      ? "bg-emerald-50/70 border-emerald-200"
                      : isFailed
                      ? "bg-rose-50/70 border-rose-200"
                      : "bg-white border-stone-200"
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-xs ${
                      isPaid
                        ? "bg-emerald-600 text-white"
                        : isFailed
                        ? "bg-rose-600 text-white"
                        : "bg-amber-100 text-[#9A3412]"
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="w-9 h-9" />
                    ) : isFailed ? (
                      <AlertCircle className="w-9 h-9" />
                    ) : (
                      <CreditCard className="w-8 h-8 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 ${
                        isPaid
                          ? "bg-emerald-200 text-emerald-900"
                          : isFailed
                          ? "bg-rose-200 text-rose-900"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isPaid
                        ? "PEMBAYARAN LUNAS (PAID)"
                        : isFailed
                        ? "GAGAL / KEDALUWARSA"
                        : "MENUNGGU PEMBAYARAN"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
                      {isPaid
                        ? "Terima Kasih! Pembayaran Telah Terverifikasi"
                        : isFailed
                        ? "Pembayaran Tidak Berhasil Diselesaikan"
                        : "Menunggu Konfirmasi Pembayaran"}
                    </h2>
                    <p className="mt-1 text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
                      {isPaid
                        ? "Sistem Duitku POP telah memverifikasi pembayaran Anda. Tim operasional Asri Collection segera menyiapkan dan mengemas pesanan Anda dengan cermat."
                        : isFailed
                        ? "Tagihan untuk nomor pesanan ini telah kedaluwarsa atau dibatalkan. Silakan lakukan pemesanan ulang melalui keranjang belanja."
                        : "Silakan selesaikan pembayaran sesuai instruksi Virtual Account / QRIS yang telah dibuat. Klik tombol perbarui jika Anda telah membayar."}
                    </p>
                  </div>

                  {currentOrder?.total_amount && (
                    <div className="inline-block bg-white/90 border border-stone-200 rounded-xl px-6 py-3 font-mono text-center">
                      <p className="text-[10px] text-stone-500 font-medium tracking-wider uppercase">
                        Total Pembayaran
                      </p>
                      <p className="text-2xl font-bold text-[#9A3412] mt-0.5">
                        {formatPrice(currentOrder.total_amount)}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="px-4 py-2.5 bg-stone-900 hover:bg-[#9A3412] text-white rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                      <span>{isRefreshing ? "Memeriksa..." : "Perbarui Status Realtime"}</span>
                    </button>

                    {isPending && currentOrder?.payment_url && (
                      <a
                        href={currentOrder.payment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-[#9A3412] hover:bg-orange-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Halaman Pembayaran Duitku</span>
                      </a>
                    )}

                    <a
                      href={`https://wa.me/6282156764434?text=${encodeURIComponent(
                        `Halo Admin Asri Collection, saya ingin konfirmasi pesanan dengan nomor ${activeOrderId}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Konfirmasi via WhatsApp CS</span>
                    </a>
                  </div>
                </div>

                {/* Order Information Details */}
                <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs space-y-4">
                  <h3 className="font-serif text-base font-semibold text-stone-900 pb-3 border-b border-stone-100">
                    Rincian Informasi Pesanan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-stone-500">Nomor Pesanan:</span>
                        <div className="flex items-center gap-1 font-mono font-bold text-stone-900">
                          <span>{currentOrder?.merchant_order_id || activeOrderId}</span>
                          <button
                            onClick={() => handleCopy(currentOrder?.merchant_order_id || activeOrderId)}
                            className="p-1 text-stone-400 hover:text-stone-700 rounded transition"
                            title="Salin nomor pesanan"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {currentOrder?.reference && (
                        <div className="flex justify-between items-center py-1 border-b border-stone-100">
                          <span className="text-stone-500">Referensi Duitku POP:</span>
                          <span className="font-mono text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                            {currentOrder.reference}
                          </span>
                        </div>
                      )}

                      {currentOrder?.va_number && (
                        <div className="flex justify-between items-center py-1 border-b border-stone-100">
                          <span className="text-stone-500">Nomor Virtual Account:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-[#9A3412]">
                            <span>{currentOrder.va_number}</span>
                            <button
                              onClick={() => handleCopy(currentOrder.va_number)}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-stone-500">Waktu Transaksi:</span>
                        <span className="text-stone-800 font-mono">
                          {currentOrder?.created_at
                            ? new Date(currentOrder.created_at).toLocaleString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-stone-500">Penerima:</span>
                        <span className="font-medium text-stone-900">
                          {currentOrder?.customer_name || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-stone-500">Email:</span>
                        <span className="text-stone-800">
                          {currentOrder?.customer_email || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-stone-500">Nomor Telepon:</span>
                        <span className="font-mono text-stone-800">
                          {currentOrder?.customer_phone || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-stone-100">
                        <span className="text-stone-500">Metode Pembayaran:</span>
                        <span className="text-stone-800 font-medium">
                          {currentOrder?.payment_method || "Duitku Payment Gateway"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {copied && (
                    <p className="text-[11px] text-emerald-600 text-right font-medium">
                      Teks berhasil disalin!
                    </p>
                  )}
                </div>

                {/* Items List (if available) */}
                {orderItems.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs space-y-4">
                    <h3 className="font-serif text-base font-semibold text-stone-900 pb-3 border-b border-stone-100">
                      Produk yang Dipesan ({orderItems.length})
                    </h3>
                    <div className="divide-y divide-stone-100">
                      {orderItems.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {item.thumbnail && (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-12 h-14 object-cover rounded-lg border border-stone-200"
                              />
                            )}
                            <div>
                              <p className="text-xs font-semibold text-stone-900">{item.title}</p>
                              {item.variant && (
                                <p className="text-[11px] text-stone-500">Varian: {item.variant}</p>
                              )}
                              <p className="text-[11px] font-mono text-stone-600">
                                {formatPrice(item.price)} &times; {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right font-mono text-xs font-bold text-stone-900">
                            {formatPrice(item.subtotal || item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Orders Search & History View */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Search Box Form */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#9A3412]" />
                  <h2 className="font-serif text-base font-medium text-stone-900">Lacak Pesanan Anda</h2>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Masukkan nomor pesanan atau referensi Duitku untuk memeriksa status tagihan dan pengiriman secara instan:
                </p>

                <form onSubmit={handleSearch} className="space-y-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: ASRI-1792951558763"
                    className="w-full text-xs font-mono border border-stone-200 rounded-lg p-3 outline-none focus:border-stone-900 transition"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-stone-900 hover:bg-[#9A3412] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Pesanan</span>
                  </button>
                </form>
              </div>

              {/* Customer Care Banner */}
              <div className="bg-[#F4EFEA] p-5 rounded-2xl border border-stone-200 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-800">Butuh Bantuan Pesanan?</p>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Hubungi tim layanan pelanggan resmi Asri Collection via WhatsApp bila memerlukan panduan pembayaran atau verifikasi manual:
                </p>
                <a
                  href="https://wa.me/6282156764434"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 mt-1 text-xs font-semibold text-[#9A3412] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp CS: 0821-5676-4434</span>
                </a>
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h2 className="font-serif text-base font-medium text-stone-900">
                  Pesanan di Perangkat Ini ({recentOrders.length})
                </h2>
                <span className="text-[11px] text-stone-400">Tersimpan Otomatis</span>
              </div>

              {recentOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-serif font-medium text-stone-800">Belum Ada Riwayat Pesanan</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                    Pesanan baru yang Anda buat melalui proses checkout keranjang belanja akan otomatis tercatat di halaman ini.
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-[#9A3412] transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Mulai Berbelanja</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((ord) => (
                    <div
                      key={ord.orderNumber}
                      onClick={() => navigate(`/orders/${ord.orderNumber}`)}
                      className="bg-white rounded-2xl p-4 border border-stone-200 hover:border-stone-400 transition-all cursor-pointer shadow-2xs space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-stone-900 group-hover:text-[#9A3412] transition">
                          <Package className="w-4 h-4 text-[#9A3412]" />
                          <span>{ord.orderNumber}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "FAILED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.status || "PENDING"}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs pt-1 border-t border-stone-100">
                        <span className="text-[11px] text-stone-500">
                          {ord.createdAt
                            ? new Date(ord.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                        {ord.totalAmount && (
                          <span className="font-mono font-bold text-[#9A3412]">
                            {formatPrice(ord.totalAmount)}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-500 flex items-center justify-between pt-0.5">
                        <span>Penerima: {ord.customerName || "Pelanggan"}</span>
                        <span className="text-stone-900 font-semibold group-hover:underline flex items-center gap-0.5">
                          Detail Pesanan <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
