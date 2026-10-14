import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  User,
  Truck,
  FileText,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Recipient, CourierOption } from '../types';
import { formatRupiah } from '../utils/formatters';
import { DuitkuPopModal } from '../components/DuitkuPopModal';
import appLogo from '../assets/app-logo.jpg';

interface CheckoutPageProps {
  onBack?: () => void;
  onGoToOrderTracking?: (orderNumber: string, token: string) => void;
}

const AVAILABLE_COURIERS: CourierOption[] = [
  {
    code: 'sicepat_reg',
    name: 'SiCepat REG',
    cost: 16000,
    etd: '1-2 Hari Kerja',
    description: 'Layanan reguler terpercaya seluruh Indonesia',
  },
  {
    code: 'jne_reg',
    name: 'JNE Reguler',
    cost: 18000,
    etd: '2-3 Hari Kerja',
    description: 'Jaringan kurir luas hingga pelosok',
  },
  {
    code: 'jnt_reg',
    name: 'J&T Express',
    cost: 17000,
    etd: '2-3 Hari Kerja',
    description: 'Pengiriman cepat setiap hari tanpa libur',
  },
  {
    code: 'gosend_sameday',
    name: 'GoSend Same Day',
    cost: 25000,
    etd: '6-8 Jam',
    description: 'Khusus area Jabodetabek sampai hari ini',
  },
  {
    code: 'pickup_store',
    name: 'Ambil di Toko',
    cost: 0,
    etd: 'Hari Ini',
    description: 'Gratis ongkir langsung ambil di gerai toko',
  },
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onBack,
  onGoToOrderTracking,
}) => {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();

  // Current Step: 1 (Recipient), 2 (Shipping), 3 (Summary), 4 (Payment/Duitku), 5 (Result)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Recipient form state
  const [recipient, setRecipient] = useState<Recipient>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Jakarta Selatan',
    postalCode: '12190',
    notes: '',
  });

  // Selected courier
  const [selectedCourier, setSelectedCourier] = useState<CourierOption>(AVAILABLE_COURIERS[0]);

  // Loading & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Duitku POP result state
  const [createdOrder, setCreatedOrder] = useState<{
    orderId: string;
    orderNumber: string;
    accessToken: string;
    reference: string;
    paymentUrl: string;
    totalAmount: number;
  } | null>(null);

  const [showDuitkuPop, setShowDuitkuPop] = useState(false);
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<string>('pending');
  const [copied, setCopied] = useState(false);

  // Validation for Step 1
  const validateRecipient = () => {
    if (!recipient.name.trim()) return 'Nama lengkap wajib diisi.';
    if (!recipient.phone.trim()) return 'Nomor WhatsApp / telepon wajib diisi.';
    if (recipient.phone.trim().length < 9) return 'Nomor telepon minimal 9 digit.';
    if (!recipient.email.trim()) return 'Email wajib diisi untuk bukti pesanan.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.email.trim())) return 'Format email tidak valid.';
    if (!recipient.address.trim()) return 'Alamat pengiriman lengkap wajib diisi.';
    return null;
  };

  const handleNextToShipping = () => {
    const error = validateRecipient();
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
  };

  const handleNextToSummary = () => {
    setErrorMessage(null);
    setCurrentStep(3);
  };

  // Step 4: Call backend to create invoice and open Duitku POP
  const handleInitiatePayment = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          items: cart.map((it) => ({ id: it.id, quantity: it.quantity })),
          courier: {
            code: selectedCourier.code,
            name: selectedCourier.name,
            cost: selectedCourier.cost,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat tagihan pembayaran.');
      }

      setCreatedOrder({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        accessToken: data.accessToken,
        reference: data.reference,
        paymentUrl: data.paymentUrl,
        totalAmount: data.totalAmount,
      });

      // Simpan ke local storage recent orders
      try {
        const stored = JSON.parse(localStorage.getItem('tokokatalog_recent_orders') || '[]');
        stored.unshift({
          orderNumber: data.orderNumber,
          accessToken: data.accessToken,
          customerName: recipient.name,
          totalAmount: data.totalAmount,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('tokokatalog_recent_orders', JSON.stringify(stored.slice(0, 10)));
      } catch (e) {
        console.warn('Failed saving recent orders', e);
      }

      // Bersihkan keranjang belanja
      clearCart();

      // Buka Duitku POP modal
      setShowDuitkuPop(true);
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check live order status from backend
  const checkLiveOrderStatus = async (orderNumber: string, token: string) => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}?token=${token}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrderPaymentStatus(data.order.payment_status);
      }
    } catch (e) {
      console.warn('Error fetching order status', e);
    }
  };

  const handleDuitkuPopFinished = (statusHint: 'success' | 'pending' | 'closed' | 'error') => {
    setShowDuitkuPop(false);
    setCurrentStep(5);

    if (createdOrder) {
      // Periksa status nyata dari backend (karena webhook Duitku adalah sumber otoritatif)
      checkLiveOrderStatus(createdOrder.orderNumber, createdOrder.accessToken);
    }
  };

  const handleCopyOrderNumber = () => {
    if (!createdOrder) return;
    navigator.clipboard.writeText(createdOrder.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalTotal = subtotal + selectedCourier.cost;

  if (cart.length === 0 && !createdOrder) {
    return (
      <div className="flex-1 pb-20 flex flex-col items-center justify-center p-6 text-center bg-white min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-gray-500 max-w-xs mb-6">
          Anda belum memiliki produk untuk diproses. Silakan pilih produk dari katalog terlebih dahulu.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Belanja Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-28 flex flex-col bg-slate-50">
      {/* Sticky Top Header & Stepper Progress Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep < 5 && (
              <button
                onClick={() => {
                  if (currentStep > 1) {
                    setCurrentStep(currentStep - 1);
                  } else if (onBack) {
                    onBack();
                  } else {
                    navigate('/cart');
                  }
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-700 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-sm font-bold text-gray-900">
              {currentStep === 5 ? 'Invoice Pesanan' : 'Checkout Pesanan'}
            </h1>
          </div>

          <span className="text-[11px] font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full">
            Tahap {currentStep}/5
          </span>
        </header>

        {/* Stepper Progress Indicator */}
        <div className="px-4 py-2 bg-white">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 -z-0" />
            {[
              { step: 1, label: 'Data', icon: User },
              { step: 2, label: 'Kurir', icon: Truck },
              { step: 3, label: 'Review', icon: FileText },
              { step: 4, label: 'Bayar', icon: CreditCard },
              { step: 5, label: 'Selesai', icon: Check },
            ].map((item) => {
              const isDone = currentStep > item.step;
              const isCurrent = currentStep === item.step;
              const Icon = item.icon;

              return (
                <div key={item.step} className="flex flex-col items-center z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#2563EB] text-white ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <span className={`text-[9px] mt-1 font-medium ${isCurrent ? 'text-[#2563EB] font-bold' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ---------------- TAHAP 1: DATA PENERIMA ---------------- */}
      {currentStep === 1 && (
        <div className="p-4 space-y-3.5">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#2563EB]" /> Informasi Penerima
            </h2>
            <p className="text-[11px] text-gray-500">
              Guest checkout: Kami hanya membutuhkan data ini untuk pengiriman barang dan konfirmasi transaksi.
            </p>

            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">
                Nama Lengkap Penerima *
              </label>
              <input
                type="text"
                value={recipient.name}
                onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                placeholder="Contoh: Rian Pratama"
                className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Nomor Telepon / WA *
                </label>
                <input
                  type="tel"
                  value={recipient.phone}
                  onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                  placeholder="08123456789"
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Email Aktif *
                </label>
                <input
                  type="email"
                  value={recipient.email}
                  onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                  placeholder="nama@email.com"
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">
                Alamat Lengkap Pengiriman *
              </label>
              <textarea
                rows={2}
                value={recipient.address}
                onChange={(e) => setRecipient({ ...recipient, address: e.target.value })}
                placeholder="Nama jalan, nomor rumah, RT/RW, patokan lokasi..."
                className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={recipient.city}
                  onChange={(e) => setRecipient({ ...recipient, city: e.target.value })}
                  placeholder="Jakarta Selatan"
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-700 block mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={recipient.postalCode}
                  onChange={(e) => setRecipient({ ...recipient, postalCode: e.target.value })}
                  placeholder="12190"
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">
                Catatan Pengiriman (Opsional)
              </label>
              <input
                type="text"
                value={recipient.notes || ''}
                onChange={(e) => setRecipient({ ...recipient, notes: e.target.value })}
                placeholder="Contoh: Titipkan di security atau bel rumah warna hitam"
                className="w-full h-10 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAHAP 2: PENGIRIMAN ---------------- */}
      {currentStep === 2 && (
        <div className="p-4 space-y-3.5">
          {/* Address summary card */}
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs flex items-start justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Alamat Tujuan
              </span>
              <p className="text-xs font-bold text-gray-900 mt-0.5">{recipient.name}</p>
              <p className="text-[11px] text-gray-600 line-clamp-1">{recipient.address}, {recipient.city}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{recipient.phone}</p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-[11px] text-[#2563EB] font-semibold underline"
            >
              Ubah
            </button>
          </div>

          {/* Courier selection list */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#2563EB]" /> Pilih Jasa Ekspedisi / Kurir
            </h2>
            <p className="text-[11px] text-gray-500">
              Pengiriman dikelola manual oleh admin dan resi akan dicatatkan langsung ke sistem.
            </p>

            <div className="space-y-2 pt-1">
              {AVAILABLE_COURIERS.map((c) => {
                const isSelected = selectedCourier.code === c.code;

                return (
                  <div
                    key={c.code}
                    onClick={() => setSelectedCourier(c)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/50 ring-1 ring-[#2563EB]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#2563EB] bg-[#2563EB]' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-500">Estimasi: {c.etd}</p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-[#2563EB]">
                      {c.cost === 0 ? 'GRATIS' : formatRupiah(c.cost)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAHAP 3: RINGKASAN PESANAN ---------------- */}
      {currentStep === 3 && (
        <div className="p-4 space-y-3.5">
          {/* Items snapshot */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" /> Produk yang Dipesan ({cart.length})
            </h2>

            <div className="divide-y divide-gray-100">
              {cart.map((it) => (
                <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={it.image}
                      alt={it.title}
                      className="w-10 h-10 object-cover rounded-md bg-gray-100 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-gray-900 truncate">{it.title}</p>
                      <p className="text-[10px] text-gray-500">{it.quantity} x {formatRupiah(it.price)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0 ml-2">
                    {formatRupiah(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal Produk</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Ongkos Kirim ({selectedCourier.name})</span>
              <span>{selectedCourier.cost === 0 ? 'GRATIS' : formatRupiah(selectedCourier.cost)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Diskon Promosi</span>
              <span className="text-emerald-600">- Rp 0</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline font-bold">
              <span className="text-gray-900">Total Pembayaran</span>
              <span className="text-base text-[#2563EB]">{formatRupiah(finalTotal)}</span>
            </div>
          </div>

          {/* Security Banner & Compliance Terms Agreement */}
          <div className="space-y-2">
            <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl flex items-center gap-2 text-[11px] text-blue-900">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>
                Invoice resmi diproses melalui sistem Duitku Payment Gateway terenkripsi HMAC-SHA256 berizin Bank Indonesia.
              </span>
            </div>

            <p className="text-[10px] text-gray-500 text-center px-2 leading-relaxed">
              Dengan melanjutkan ke pembayaran, Anda menyetujui{' '}
              <a href="/terms" target="_blank" rel="noreferrer" className="text-[#2563EB] font-semibold underline">
                Syarat &amp; Ketentuan
              </a>{' '}
              dan{' '}
              <a href="/refund" target="_blank" rel="noreferrer" className="text-[#2563EB] font-semibold underline">
                Kebijakan Pengembalian Dana
              </a>{' '}
              Asri Collection.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- TAHAP 4: MENUNGGU POPUP PEMBAYARAN ---------------- */}
      {currentStep === 4 && createdOrder && (
        <div className="p-4 space-y-4 text-center">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-sm font-bold text-gray-900">Invoice Berhasil Dibuat</h2>
            <p className="text-xs text-gray-500">
              Silakan selesaikan pembayaran melalui popup Duitku POP yang terbuka.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-xs">
              <p className="text-gray-400 text-[10px]">NOMOR PESANAN</p>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{createdOrder.orderNumber}</p>
              <p className="text-[#2563EB] font-bold text-base mt-1">
                {formatRupiah(createdOrder.totalAmount)}
              </p>
            </div>

            <button
              onClick={() => setShowDuitkuPop(true)}
              className="w-full h-11 bg-[#2563EB] text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Buka Ulang Popup Duitku POP
            </button>

            <button
              onClick={() => handleDuitkuPopFinished('closed')}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-800"
            >
              Lanjut ke Status Pesanan
            </button>
          </div>
        </div>
      )}

      {/* ---------------- TAHAP 5: HASIL & STATUS PESANAN ---------------- */}
      {currentStep === 5 && createdOrder && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3.5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto overflow-hidden shadow-xs border border-gray-100 flex items-center justify-center mb-2.5">
                <img src={appLogo} alt="Asri Collection" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Pesanan Telah Tercatat</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Terima kasih telah berbelanja di Asri Collection.
              </p>
            </div>

            {/* Order details box */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Nomor Pesanan</span>
                <div className="flex items-center gap-1 font-mono font-bold text-gray-900">
                  <span>{createdOrder.orderNumber}</span>
                  <button
                    onClick={handleCopyOrderNumber}
                    className="p-1 text-gray-400 hover:text-gray-700"
                    title="Salin Nomor Pesanan"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Pembayaran</span>
                <span className="font-extrabold text-[#2563EB]">
                  {formatRupiah(createdOrder.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status Pembayaran</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    orderPaymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {orderPaymentStatus === 'paid' ? 'Lunas (Verified)' : 'Menunggu Verifikasi Duitku'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Pengiriman</span>
                <span className="font-medium text-gray-800">{selectedCourier.name}</span>
              </div>
            </div>

            {/* Verification note */}
            <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-gray-600 space-y-1">
              <p className="font-semibold text-gray-800">Catatan Verifikasi Pembayaran:</p>
              <p>
                Status pesanan akan berubah menjadi lunas secara otomatis saat webhook callback resmi Duitku diterima server. Anda dapat memeriksa status kapan saja di menu Pesanan.
              </p>
            </div>

            {/* Action buttons */}
            <div className="pt-1">
              <button
                onClick={() => checkLiveOrderStatus(createdOrder.orderNumber, createdOrder.accessToken)}
                className="w-full h-10 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:bg-gray-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Segarkan Status Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-[480px] mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200 p-3.5 pb-safe shadow-lg">
        {currentStep === 1 && (
          <button
            onClick={handleNextToShipping}
            className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all hover:bg-blue-700"
          >
            Lanjut ke Pilihan Pengiriman
          </button>
        )}

        {currentStep === 2 && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-gray-500 block truncate">{selectedCourier.name}</span>
              <span className="text-sm font-bold text-[#2563EB]">
                {selectedCourier.cost === 0 ? 'Gratis' : formatRupiah(selectedCourier.cost)}
              </span>
            </div>
            <button
              onClick={handleNextToSummary}
              className="flex-1 h-12 bg-[#2563EB] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all hover:bg-blue-700"
            >
              Lanjut ke Ringkasan Pesanan
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-gray-500 block">Total Akhir:</span>
              <span className="text-sm font-black text-[#2563EB]">{formatRupiah(finalTotal)}</span>
            </div>
            <button
              onClick={handleInitiatePayment}
              disabled={isSubmitting}
              className="flex-1 h-12 bg-[#2563EB] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all hover:bg-blue-700 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Memproses Invoice...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Bayar Sekarang
                </>
              )}
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <button
            onClick={() => setShowDuitkuPop(true)}
            className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all hover:bg-blue-700"
          >
            Buka Ulang Popup Duitku POP
          </button>
        )}

        {currentStep === 5 && createdOrder && (
          <button
            onClick={() => {
              if (onGoToOrderTracking) {
                onGoToOrderTracking(createdOrder.orderNumber, createdOrder.accessToken);
              } else {
                navigate(`/orders/${createdOrder.orderNumber}?token=${createdOrder.accessToken}`);
              }
            }}
            className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all hover:bg-blue-700"
          >
            Lacak Status Pesanan Ini
          </button>
        )}
      </div>

      {/* Duitku POP Modal */}
      {showDuitkuPop && createdOrder && (
        <DuitkuPopModal
          reference={createdOrder.reference}
          orderNumber={createdOrder.orderNumber}
          totalAmount={createdOrder.totalAmount}
          paymentUrl={createdOrder.paymentUrl}
          onPaymentFinished={handleDuitkuPopFinished}
          onClose={() => setShowDuitkuPop(false)}
        />
      )}
    </div>
  );
};
