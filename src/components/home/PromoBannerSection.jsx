import { Link } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";

const PromoBannerSection = () => {
  return (
    <section className="py-12 sm:py-16 bg-[#FAF8F5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Banner 1: Raya & Festive Capsule */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#EDE5DC] via-[#F4EFEA] to-[#E5DDD4] p-8 sm:p-10 flex flex-col justify-between min-h-[320px] sm:min-h-[360px] border border-stone-200/60 shadow-xs group">
            <div className="relative z-10 max-w-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 text-white text-[11px] font-semibold tracking-wider uppercase mb-4">
                <Tag className="w-3 h-3 text-[#D4AF37]" />
                Special Edition
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 font-normal leading-tight">
                Raya Capsule Collection
              </h3>
              <p className="mt-3 text-sm text-stone-700 leading-relaxed">
                Sentuhan motif floral lembut dan kain silk bertekstur anggun untuk momen istimewa bersama keluarga.
              </p>
              <div className="mt-6">
                <Link
                  to="/products?category=womens-dresses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#9A3412] transition-colors shadow-xs"
                >
                  <span>Jelajahi Koleksi</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 top-0 w-1/2 overflow-hidden pointer-events-none opacity-85 sm:opacity-95">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80"
                alt="Raya Capsule Fashion"
                loading="lazy"
                className="w-full h-full object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#EDE5DC] via-transparent to-transparent" />
            </div>
          </div>

          {/* Banner 2: Modest Daily Essentials */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E2DDD5] via-[#ECE7E1] to-[#DDD7CE] p-8 sm:p-10 flex flex-col justify-between min-h-[320px] sm:min-h-[360px] border border-stone-200/60 shadow-xs group">
            <div className="relative z-10 max-w-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9A3412] text-white text-[11px] font-semibold tracking-wider uppercase mb-4">
                Hemat s/d 30%
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 font-normal leading-tight">
                Everyday Modest Staples
              </h3>
              <p className="mt-3 text-sm text-stone-700 leading-relaxed">
                Tunik, kemeja katun premium, dan celana kulot flowy yang nyaman dikenakan seharian beraktivitas.
              </p>
              <div className="mt-6">
                <Link
                  to="/products?category=tops"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#9A3412] transition-colors shadow-xs"
                >
                  <span>Lihat Pilihan</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 top-0 w-1/2 overflow-hidden pointer-events-none opacity-85 sm:opacity-95">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
                alt="Modest Everyday Staples"
                loading="lazy"
                className="w-full h-full object-cover object-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#E2DDD5] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBannerSection;
