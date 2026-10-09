import React, { useEffect, useState } from 'react';
import { ShieldCheck, ExternalLink, RefreshCw, X, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

declare global {
  interface Window {
    checkout?: {
      process: (
        reference: string,
        options: {
          successEvent?: (result: any) => void;
          pendingEvent?: (result: any) => void;
          errorEvent?: (result: any) => void;
          closeEvent?: () => void;
        }
      ) => void;
    };
  }
}

interface DuitkuPopModalProps {
  reference: string;
  orderNumber: string;
  totalAmount: number;
  paymentUrl?: string;
  onPaymentFinished: (statusHint: 'success' | 'pending' | 'closed' | 'error') => void;
  onClose: () => void;
}

export const DuitkuPopModal: React.FC<DuitkuPopModalProps> = ({
  reference,
  orderNumber,
  totalAmount,
  paymentUrl,
  onPaymentFinished,
  onClose,
}) => {
  const [popLoaded, setPopLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if Duitku.js is loaded
  useEffect(() => {
    const checkDuitkuJs = () => {
      if (typeof window.checkout !== 'undefined' && typeof window.checkout.process === 'function') {
        setPopLoaded(true);
      } else {
        // Retry check in 500ms
        const timer = setTimeout(() => {
          if (typeof window.checkout !== 'undefined') {
            setPopLoaded(true);
          } else {
            setPopLoaded(false);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    };

    checkDuitkuJs();
  }, []);

  const handleOpenDuitkuPop = () => {
    setErrorMessage(null);
    setIsProcessing(true);

    if (typeof window.checkout !== 'undefined' && typeof window.checkout.process === 'function') {
      try {
        window.checkout.process(reference, {
          successEvent: function (result) {
            console.log('Duitku POP successEvent:', result);
            setIsProcessing(false);
            onPaymentFinished('success');
          },
          pendingEvent: function (result) {
            console.log('Duitku POP pendingEvent:', result);
            setIsProcessing(false);
            onPaymentFinished('pending');
          },
          errorEvent: function (result) {
            console.warn('Duitku POP errorEvent:', result);
            setIsProcessing(false);
            setErrorMessage('Pembayaran belum berhasil diselesaikan atau dibatalkan.');
            onPaymentFinished('error');
          },
          closeEvent: function () {
            console.log('Duitku POP window closed by user.');
            setIsProcessing(false);
            onPaymentFinished('closed');
          },
        });
      } catch (err: any) {
        console.error('Error invoking window.checkout.process:', err);
        setIsProcessing(false);
        setErrorMessage(
          'Tidak dapat memanggil Duitku POP otomatis pada peramban ini. Silakan gunakan tombol pembayaran di bawah.'
        );
      }
    } else {
      setIsProcessing(false);
      setErrorMessage(
        'Library Duitku POP belum selesai dimuat atau terblokir ad-blocker. Anda dapat menggunakan tautan pembayaran langsung di bawah.'
      );
    }
  };

  // Auto trigger popup on initial mount if script is ready
  useEffect(() => {
    if (popLoaded && reference) {
      handleOpenDuitkuPop();
    }
  }, [popLoaded, reference]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[480px] bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pembayaran Duitku POP</h3>
              <p className="text-[11px] text-gray-500">Order: {orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
          <p className="text-[11px] text-gray-500 font-medium">Total yang Harus Dibayar</p>
          <p className="text-xl font-extrabold text-[#2563EB] mt-0.5">{formatRupiah(totalAmount)}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">Ref: {reference}</p>
        </div>

        {errorMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 text-[11px] leading-relaxed">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={handleOpenDuitkuPop}
            disabled={isProcessing}
            className="w-full h-12 bg-[#2563EB] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md hover:bg-blue-700 disabled:opacity-70"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Membuka Popup Pembayaran...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Buka Popup Duitku POP
              </>
            )}
          </button>

          {paymentUrl && (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 active:bg-gray-50 transition-colors"
            >
              <span>Halaman Pembayaran Web (Fallback Mobile)</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>
          )}

          <button
            onClick={() => onPaymentFinished('closed')}
            className="w-full py-2 text-center text-xs text-gray-500 hover:text-gray-800"
          >
            Saya Sudah Membayar / Cek Status Pesanan
          </button>
        </div>

        <div className="text-[10px] text-center text-gray-400">
          Transaksi aman dilindungi SSL & Duitku Payment Gateway (Sandbox/Production).
        </div>
      </div>
    </div>
  );
};
