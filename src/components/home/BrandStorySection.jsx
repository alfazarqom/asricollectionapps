import { ArrowRight, Compass, Feather, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const BrandStorySection = () => {
  return (
    <section className="py-16 sm:py-24 bg-[#F5EFE6] border-y border-stone-200/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Editorial Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg border border-stone-300/40">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80"
                  alt="Asri Collection Craftsmanship"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Accent Card */}
              <div className="absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-6 bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-xl border border-stone-200/80 max-w-[240px]">
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#9A3412] font-semibold">
                  EST. SIDRAP — 2018
                </p>
                <p className="mt-1 text-sm font-serif font-medium text-stone-900 leading-snug">
                  Dedikasi pada jahitan presisi & kenyamanan setiap helai benang.
                </p>
              </div>
            </div>
          </div>

          {/* Story Narrative */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#9A3412] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Filosofi Kami
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 leading-[1.15] tracking-tight">
              Keanggunan yang bersahaja, dirajut dari hati untuk wanita Indonesia.
            </h2>

            <p className="mt-6 text-base sm:text-lg text-stone-700 leading-relaxed font-light">
              Asri Collection bermula dari kecintaan mendalam terhadap busana santun yang memadukan keindahan siluet feminin dengan kepraktisan sehari-hari. Kami percaya bahwa tampil memikat tidak harus merepotkan.
            </p>

            <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed">
              Setiap koleksi dirancang dengan seleksi kain katun, linen, dan silk berkualitas tinggi yang berkarakter adem di iklim tropis. Dari butik kami di Sidenreng Rappang, Sulawesi Selatan hingga ke lemari pakaian Anda di seluruh pelosok Nusantara.
            </p>

            {/* Core Values */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-stone-300/60">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-stone-900 text-white shrink-0 mt-0.5">
                  <Feather className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">Bahan Bernapas & Ringan</h4>
                  <p className="text-xs text-stone-600 mt-1">Dipilih teliti agar nyaman seharian tanpa rasa gerah.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-stone-900 text-white shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-stone-900">Siluet Modest Timeless</h4>
                  <p className="text-xs text-stone-600 mt-1">Desain klasik yang senantiasa relevan melewati musim ke musim.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#9A3412] transition-colors shadow-xs group"
              >
                <span>Baca Kisah Lengkap</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 text-stone-800 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
              >
                Lihat Katalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStorySection;
