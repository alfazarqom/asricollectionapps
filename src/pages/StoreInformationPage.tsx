import React from 'react';
import { ArrowLeft, BookOpen, CreditCard, Store } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StoreFooter } from '../components/StoreFooter';

type InformationPage = {
  title: string;
  intro: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: Array<{ title: string; body: string }>;
};

const pages: Record<string, InformationPage> = {
  '/cara-pemesanan': {
    title: 'Cara Pemesanan',
    intro: 'Ikuti langkah berikut untuk melakukan pemesanan di Asri Collection.',
    icon: BookOpen,
    sections: [
      {
        title: '1. Pilih produk',
        body: 'Buka katalog, pilih produk yang diinginkan, lalu tentukan varian dan jumlah jika tersedia.',
      },
      {
        title: '2. Periksa keranjang',
        body: 'Pastikan produk, varian, dan jumlah sudah benar sebelum melanjutkan ke checkout.',
      },
      {
        title: '3. Lengkapi informasi penerima',
        body: 'Masukkan nama, nomor kontak, dan alamat pengiriman dengan lengkap agar pesanan dapat diproses.',
      },
      {
        title: '4. Tinjau total pembayaran',
        body: 'Periksa subtotal dan biaya pengiriman yang ditampilkan sebelum menyetujui pembayaran.',
      },
      {
        title: '5. Selesaikan pembayaran',
        body: 'Lanjutkan melalui halaman pembayaran yang tersedia. Simpan nomor pesanan untuk membantu pemeriksaan status pesanan.',
      },
    ],
  },
  '/pembayaran': {
    title: 'Informasi Pembayaran',
    intro: 'Pembayaran online diarahkan melalui Duitku. Pilihan metode yang dapat digunakan mengikuti kanal yang aktif dan ditampilkan pada checkout.',
    icon: CreditCard,
    sections: [
      {
        title: 'Metode yang tersedia',
        body: 'Lihat metode pembayaran yang muncul pada halaman checkout. Ketersediaan dapat berbeda sesuai kanal merchant yang aktif; footer ini tidak menjanjikan metode tertentu.',
      },
      {
        title: 'Sebelum membayar',
        body: 'Pastikan nomor pesanan, rincian produk, biaya pengiriman, dan total tagihan sudah sesuai sebelum melanjutkan.',
      },
      {
        title: 'Konfirmasi pembayaran',
        body: 'Gunakan status pesanan sebagai rujukan. Halaman kembali atau redirect dari penyedia pembayaran saja bukan bukti bahwa pembayaran telah berhasil.',
      },
      {
        title: 'Butuh bantuan?',
        body: 'Hubungi layanan pelanggan dan sertakan nomor pesanan. Jangan pernah membagikan kata sandi, PIN, atau kode OTP.',
      },
    ],
  },
  '/tentang-kami': {
    title: 'Tentang Asri Collection',
    intro: 'Asri Collection adalah toko online untuk busana dan gaya hidup.',
    icon: Store,
    sections: [
      {
        title: 'Informasi usaha',
        body: 'Nama usaha: Asri Collection.',
      },
      {
        title: 'Lokasi',
        body: 'Sidenreng Rappang, Sulawesi Selatan 91662.',
      },
      {
        title: 'Hubungi kami',
        body: 'Untuk pertanyaan mengenai produk atau pesanan, gunakan informasi email dan WhatsApp pada bagian kontak di bawah halaman ini.',
      },
    ],
  },
};

export const StoreInformationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const page = pages[location.pathname] ?? pages['/cara-pemesanan'];
  const Icon = page.icon;

  return (
    <div className="flex-1 pb-24 flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-gray-100 bg-white/95 px-4 py-3 shadow-2xs backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-gray-700 transition-transform active:scale-95"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-bold text-gray-900">{page.title}</h1>
      </header>

      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-sm font-semibold text-neutral-900">{page.title}</h2>
          <p className="mt-2 text-xs leading-6 text-neutral-600">{page.intro}</p>
        </section>

        {page.sections.map((section) => (
          <section key={section.title} className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-4">
            <h3 className="text-xs font-semibold text-neutral-900">{section.title}</h3>
            <p className="text-xs leading-6 text-neutral-600">{section.body}</p>
          </section>
        ))}

        <button
          type="button"
          onClick={() => navigate('/hubungi-kami')}
          className="min-h-11 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Hubungi Asri Collection
        </button>
      </div>

      <StoreFooter />
    </div>
  );
};
