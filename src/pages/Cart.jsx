import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
  Tag,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { useCart } from "../hooks/useCart";
import { formatPrice } from "../utils/formatters";
import { supabaseUrl, supabaseAnonKey, createOrderInSupabase } from "../services/productApi";

const createMerchantOrderId = () => {
  return `ASRI-${Date.now()}`;
};

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    getTotalPrice,
    clearCart,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState(null);

  const subtotal = getTotalPrice ? getTotalPrice() : cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const shippingCost = subtotal > 500000 || subtotal === 0 ? 0 : 25000;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError("");
    setPromoMessage("");
    const code = promoCode.trim().toUpperCase();

    if (code === "ASRI10" || code === "ASRIRAYA") {
      setDiscountPercent(10);
      setPromoMessage("Kupon berhasil dipasang! Potongan diskon 10%.");
    } else if (code === "ASRI20") {
      setDiscountPercent(20);
      setPromoMessage("Kupon VIP berhasil dipasang! Potongan diskon 20%.");
    } else {
      setPromoError("Kode kupon tidak valid atau telah kedaluwarsa.");
    }
  };

  const handleCheckoutDuitku = async () => {
    setIsCheckingOut(true);
    setCheckoutNotice(null);

    const endpoint = `${supabaseUrl}/functions/v1/duitku-create-invoice`;
    const merchantOrderId = createMerchantOrderId();

    // 1. Record order in Supabase orders table
    try {
      await createOrderInSupabase({
        orderData: {
          merchant_order_id: merchantOrderId,
          amount: subtotal,
          discount_amount: discountAmount,
          total_amount: grandTotal,
          product_details: `Pesanan Asri Collection (${cartItems.length} item)`,
          customer_name: "Pelanggan Asri Collection",
          customer_email: "customer@asricollection.com",
          customer_phone: "082156764434",
          notes: orderNotes || null,
          status: "PENDING",
        },
        items: cartItems.map((item) => ({
          productId: typeof item.id === "string" && item.id.length > 20 ? item.id : null,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant || null,
          thumbnail: item.thumbnail || (item.images && item.images[0]) || null,
        })),
      });
    } catch (orderErr) {
      console.warn("Could not pre-record order in Supabase:", orderErr);
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          paymentAmount: grandTotal,
          merchantOrderId,
          productDetails: `Pesanan Asri Collection (${cartItems.length} item)`,
          email: "customer@asricollection.com",
          customerVaName: "Pelanggan Asri Collection",
          phoneNumber: "082156764434",
          returnUrl: window.location.hash
            ? `${window.location.origin}${window.location.pathname}#/orders?merchantOrderId=${merchantOrderId}`
            : `${window.location.origin}/orders?merchantOrderId=${merchantOrderId}`,
          itemDetails: cartItems.map((item) => ({
            name: `${item.title} (${item.variant || 'Standard'})`.slice(0, 50),
            price: item.price,
            quantity: item.quantity,
          })),
          customerDetail: {
            firstName: "Pelanggan",
            lastName: "Asri",
            email: "customer@asricollection.com",
            phoneNumber: "082156764434",
          },
        }),
      });

      const data = await response.json();

      if (data.statusCode === "00" && data.paymentUrl) {
        // Save to local recent orders
        try {
          const stored = localStorage.getItem("asri_recent_orders");
          const list = stored ? JSON.parse(stored) : [];
          list.unshift({
            orderNumber: merchantOrderId,
            reference: data.reference,
            totalAmount: grandTotal,
            customerName: "Pelanggan Asri Collection",
            status: "PENDING",
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem("asri_recent_orders", JSON.stringify(list.slice(0, 15)));
        } catch {
          // Ignore storage error
        }

        setCheckoutNotice({
          type: "success",
          title: "Tagihan Berhasil Dibuat!",
          message: `Referensi Duitku: ${data.reference || '-'}. Mengalihkan Anda ke halaman pembayaran aman Duitku POP...`,
        });
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 1500);
      } else {
        setCheckoutNotice({
          type: "info",
          title: "Status Integrasi Duitku POP",
          message: data.statusMessage || `Gagal membuat invoice tagihan. Pastikan secrets Duitku telah diunggah ke Supabase Edge Functions.`,
          instruction: data.instruction || data.details || null,
        });
      }
    } catch (err) {
      setCheckoutNotice({
        type: "info",
        title: "Informasi Integrasi Duitku POP",
        message: err.message || `Tagihan: ${formatPrice(grandTotal)} (Order ID: ${merchantOrderId}). Anda juga dapat memesan langsung via WhatsApp resmi.`,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const itemsSummary = cartItems
      .map((item, idx) => `${idx + 1}. ${item.title} (${item.variant || 'Standard'}) x${item.quantity} = ${formatPrice(item.price * item.quantity)}`)
      .join("\n");
    
    const message = `Halo Admin Asri Collection, saya ingin melakukan pemesanan busana:\n\n${itemsSummary}\n\nSubtotal: ${formatPrice(subtotal)}\nDiskon: ${formatPrice(discountAmount)}\nTotal Tagihan: ${formatPrice(grandTotal)}\n\nCatatan: ${orderNotes || '-'}\n\nMohon informasi ongkir dan nomor rekening/QRIS untuk pembayaran. Terima kasih!`;
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/6282156764434?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] pt-24 sm:pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900 transition">
            Beranda
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-900 font-medium">Keranjang Belanja</span>
        </nav>

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              Tas Belanja Anda
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Periksa kembali busana pilihan Anda sebelum melanjutkan ke proses pembayaran.
            </p>
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-stone-500 hover:text-red-600 transition underline underline-offset-4 self-start sm:self-auto"
            >
              Kosongkan Keranjang
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="mt-12 py-16 sm:py-24 px-4 bg-white rounded-2xl border border-dashed border-stone-300 text-center max-w-xl mx-auto shadow-2xs">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F4EFEA] text-[#9A3412] mb-5">
              <ShoppingBag className="w-10 h-10" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900">
              Tas belanja Anda masih kosong
            </h2>
            <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              Jelajahi berbagai pilihan gaun anggun, tunik modern, dan aksesoris eksklusif dari Asri Collection.
            </p>
            <div className="mt-8">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#9A3412] transition shadow-xs"
              >
                <span>Mulai Belanja</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Grid */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Products List (Left) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs divide-y divide-stone-100 overflow-hidden">
                {cartItems.map((item) => {
                  const itemKey = item.itemKey || item.id;
                  const itemTotal = item.price * item.quantity;

                  return (
                    <div key={itemKey} className="p-4 sm:p-5 flex gap-4 sm:gap-5 items-start">
                      {/* Product Thumbnail */}
                      <Link
                        to={`/products/${item.id}`}
                        className="w-20 h-24 sm:w-24 sm:h-30 rounded-xl overflow-hidden bg-stone-50 border border-stone-200 shrink-0"
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/products/${item.id}`}
                            className="font-serif text-base sm:text-lg font-normal text-stone-900 hover:text-[#9A3412] transition line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(itemKey)}
                            className="text-stone-400 hover:text-red-500 p-1 transition"
                            aria-label={`Hapus ${item.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Variant Badge */}
                        {item.variant && (
                          <div className="mt-1 inline-block text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                            {item.variant}
                          </div>
                        )}

                        <div className="mt-2 text-xs sm:text-sm font-mono text-stone-600">
                          {formatPrice(item.price)}
                        </div>

                        {/* Quantity Stepper & Line Total */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 h-8">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(itemKey)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                              aria-label="Kurangi kuantitas"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-mono text-xs font-semibold text-stone-900 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => increaseQuantity(itemKey)}
                              className="w-8 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 transition"
                              aria-label="Tambah kuantitas"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="font-mono text-sm sm:text-base font-medium text-stone-900 tabular-nums">
                            {formatPrice(itemTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Notes Field */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Catatan untuk Pesanan (Opsional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Contoh: Titip ucapan kartu kado / ukuran request khusus..."
                  rows={2}
                  className="w-full text-xs sm:text-sm border border-stone-200 rounded-lg p-3 outline-none focus:border-stone-900 transition"
                />
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-3 p-4 bg-[#F4EFEA] rounded-xl border border-stone-200 text-xs text-stone-700">
                <ShieldCheck className="w-5 h-5 text-[#9A3412] shrink-0" />
                <span>
                  Transaksi Anda dilindungi dengan enkripsi SSL 256-bit dan proses verifikasi pembayaran otomatis oleh Duitku POP.
                </span>
              </div>
            </div>

            {/* Order Summary (Right) */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs sticky top-28 space-y-6">
                <h2 className="font-serif text-xl font-medium text-stone-900 pb-4 border-b border-stone-100">
                  Ringkasan Pesanan
                </h2>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#9A3412]" />
                    Kode Promo / Voucher
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Contoh: ASRI10"
                      className="flex-1 uppercase font-mono text-xs border border-stone-300 rounded-lg px-3 py-2 outline-none focus:border-stone-900 transition"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#9A3412] transition"
                    >
                      Terapkan
                    </button>
                  </div>
                  {promoMessage && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {promoMessage}
                    </p>
                  )}
                  {promoError && (
                    <p className="text-xs text-red-600">
                      {promoError}
                    </p>
                  )}
                </form>

                {/* Calculation Breakdown */}
                <div className="space-y-3 pt-4 border-t border-stone-100 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Produk</span>
                    <span className="font-mono tabular-nums text-stone-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Potongan Diskon ({discountPercent}%)</span>
                      <span className="font-mono tabular-nums">
                        -{formatPrice(discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-stone-400" />
                      <span>Estimasi Ongkir</span>
                    </div>
                    <span className="font-mono tabular-nums text-stone-900">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-600 font-semibold">Gratis Ongkir</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>

                  {shippingCost > 0 && (
                    <p className="text-[11px] text-stone-500">
                      Gratis ongkos kirim untuk pesanan di atas Rp 500.000.
                    </p>
                  )}

                  <div className="pt-4 border-t border-stone-200 flex justify-between items-baseline">
                    <span className="font-serif text-base font-semibold text-stone-900">
                      Total Tagihan
                    </span>
                    <span className="font-serif text-2xl font-bold text-stone-900 font-mono tabular-nums">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Checkout Notice */}
                {checkoutNotice && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <p className="font-semibold">{checkoutNotice.title}</p>
                    <p className="leading-relaxed">{checkoutNotice.message}</p>
                    {checkoutNotice.instruction && (
                      <div className="p-2.5 bg-amber-100/70 rounded-lg font-mono text-[11px] text-amber-950 break-all select-all">
                        {checkoutNotice.instruction}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCheckoutDuitku}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 px-4 bg-stone-900 hover:bg-[#9A3412] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isCheckingOut ? "Menyiapkan Duitku..." : "Bayar Sekarang (Duitku POP)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Pesan via WhatsApp CS</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    to="/products"
                    className="text-xs text-stone-500 hover:text-stone-900 transition underline underline-offset-4"
                  >
                    Lanjut memilih busana lainnya
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Cart;
