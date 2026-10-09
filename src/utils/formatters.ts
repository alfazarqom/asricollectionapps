export function formatRupiah(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const numeric = Math.round(Number(amount));
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'Lunas';
    case 'pending':
      return 'Menunggu Pembayaran';
    case 'failed':
      return 'Gagal';
    case 'expired':
      return 'Kedaluwarsa';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
}

export function getFulfillmentStatusLabel(status: string): string {
  switch (status) {
    case 'unfulfilled':
      return 'Belum Diproses';
    case 'processing':
      return 'Sedang Dikemas';
    case 'shipped':
      return 'Sedang Dikirim';
    case 'delivered':
      return 'Terkirim';
    case 'cancelled':
      return 'Dibatalkan';
    default:
      return status;
  }
}
