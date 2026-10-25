import {
  Award,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Sparkles,
  MapPin,
  Clock,
  MessageCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

const About = () => {
  const stats = [
    {
      value: "15.000+",
      label: "Pelanggan Setia",
    },
    {
      value: "500+",
      label: "Koleksi Busana & Aksesoris",
    },
    {
      value: "100%",
      label: "Kualitas Jahitan Butik",
    },
    {
      value: "4.9/5",
      label: "Kepuasan Pelanggan",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Sentuhan Santun & Anggun",
      description:
        "Kami merancang busana yang menghormati nilai kesantunan dengan siluet kontemporer yang senantiasa menawan.",
    },
    {
      icon: ShieldCheck,
      title: "Kualitas Bahan Pilihan",
      description:
        "Hanya menggunakan kain berserat alami, katun adem, dan silk premium yang lembut serta awet dicuci berkali-kali.",
    },
    {
      icon: Truck,
      title: "Jangkauan Pengiriman Nusantara",
      description:
        "Bekerja sama dengan ekspedisi tepercaya (J&T, SiCepat, JNE) untuk mengantar pesanan Anda dengan aman dan tepat waktu.",
    },
    {
      icon: Award,
      title: "Layanan Bergaransi",
      description:
        "Jaminan tukar ukuran atau pengembalian bila terdapat cacat produksi pada jahitan demi kenyamanan belanja Anda.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F5] pt-24 sm:pt-28 pb-16">
      {/* Breadcrumb */}
      <section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-2 text-xs text-stone-500">
            <Link to="/" className="hover:text-stone-900 transition">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">Tentang Kami</span>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-6 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#9A3412] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Tentang Asri Collection
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-stone-900 leading-tight">
                Menenun keindahan dalam setiap helai kesantunan.
              </h1>

              <p className="mt-6 text-base text-stone-600 leading-relaxed font-light">
                Asri Collection lahir di Sidenreng Rappang (Sidrap), Sulawesi Selatan, dari dedikasi untuk menghadirkan busana modest yang tidak hanya anggun dipandang, namun juga nyaman menemani keseharian wanita muslimah dan pecinta fashion santun di seluruh Indonesia.
              </p>

              <p className="mt-4 text-sm text-stone-600 leading-relaxed">
                Dari gaun pesta hingga tunik kasual harian, kami percaya setiap perempuan berhak mengenakan pakaian yang memancarkan rasa percaya diri dan keasrian sejati.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 text-xs text-stone-700">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
                  <MapPin className="w-4 h-4 text-[#9A3412]" />
                  <span>Sidenreng Rappang, Sulawesi Selatan</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
                  <Clock className="w-4 h-4 text-[#9A3412]" />
                  <span>Buka Setiap Hari: 08.00 - 21.00 WITA</span>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="overflow-hidden rounded-3xl bg-stone-100 aspect-[4/5] shadow-lg border border-stone-200">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
                  alt="Asri Collection Fashion Atelier"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-6 left-6 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur-md p-5 shadow-xl max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4EFEA] text-[#9A3412]">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl font-serif font-bold text-stone-900">15.000+</p>
                    <p className="text-xs text-stone-500">Busana terkirim ke seluruh Indonesia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-16 border-y border-stone-200 bg-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-4xl font-serif font-semibold text-stone-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-stone-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A3412] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Nilai Utama
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              Komitmen Kualitas Asri Collection
            </h2>
            <p className="mt-3 text-sm text-stone-600">
              Prinsip yang kami junjung tinggi dalam menghadirkan pengalaman berbelanja busana terbaik.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-stone-200 bg-white p-6 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4EFEA] text-[#9A3412]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Contact / CS Box */}
          <div className="mt-16 bg-[#F5EFE6] rounded-2xl p-8 sm:p-12 border border-stone-300/80 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900">
                Punya pertanyaan seputar ukuran atau pemesanan khusus?
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                Tim Customer Service kami siap melayani Anda melalui WhatsApp resmi Asri Collection.
              </p>
            </div>
            <a
              href="https://wa.me/6282156764434?text=Halo%20Asri%20Collection,%20saya%20ingin%20berkonsultasi%20seputar%20produk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition shrink-0 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat CS WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
