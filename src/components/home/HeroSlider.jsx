import ReactSlick from "react-slick";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

// Vite may expose this CommonJS package as either the component or a module wrapper.
const Slider = ReactSlick.default ?? ReactSlick;

const slides = [
  {
    id: 1,
    tagline: "Koleksi Eksklusif 2026",
    title: "Elegansi Busana Modest & Kontemporer",
    subtitle: "Kombinasi potongan anggun, bahan premium yang sejuk, dan detail jahitan presisi untuk menyempurnakan hari istimewa Anda.",
    cta: "Jelajahi Koleksi",
    link: "/products?category=womens-dresses",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&auto=format&fit=crop&q=85",
  },
  {
    id: 2,
    tagline: "Tren Terkini",
    title: "Koleksi Gaun & Blouse Pilihan",
    subtitle: "Rancangan feminin modern yang dirancang khusus untuk kenyamanan aktivitas harian hingga acara formal.",
    cta: "Lihat Semua Gaun",
    link: "/products?category=womens-dresses",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&auto=format&fit=crop&q=85",
  },
  {
    id: 3,
    tagline: "Aksesoris & Tas Kurasi",
    title: "Lengkapi Penampilan Anggun Anda",
    subtitle: "Tas tangan desainer, hijab premium, dan aksesoris elegan untuk sentuhan akhir yang memikat.",
    cta: "Belanja Tas & Aksesoris",
    link: "/products?category=womens-bags",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&auto=format&fit=crop&q=85",
  },
];

const HeroSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5500,
    arrows: false,
    pauseOnHover: true,
  };

  return (
    <section className="relative w-full overflow-hidden" aria-label="Hero Banner Asri Collection">
      <Slider {...settings}>
        {slides.map((slide) => (
          <div key={slide.id} className="relative outline-none">
            <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] w-full flex items-center overflow-hidden bg-stone-900">
              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.82] transition-transform duration-1000 ease-out"
              />

              {/* Editorial Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/50 to-transparent" />

              {/* Slide Content */}
              <div className="container relative z-10 py-12 lg:py-20 text-white">
                <div className="max-w-xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur-xs text-amber-200">
                    <Sparkles className="h-3 w-3" />
                    <span>{slide.tagline}</span>
                  </div>

                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight text-white">
                    {slide.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-lg">
                    {slide.subtitle}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={slide.link}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-bold text-stone-900 shadow-md hover:bg-stone-100 active:scale-[0.98] transition-all"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-xs font-semibold text-white backdrop-blur-xs hover:bg-white/20 transition-all"
                    >
                      <span>Semua Produk</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default HeroSlider;
