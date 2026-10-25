import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FASHION_CATEGORIES } from "../../services/productApi";

const CategorySection = () => {
  return (
    <section className="py-12 bg-white border-y border-stone-200/60" aria-label="Belanja Berdasarkan Kategori">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
              Koleksi Unggulan
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Kategori Pilihan
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900 hover:text-stone-600 transition-colors"
          >
            <span>Lihat Semua Koleksi</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {FASHION_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 shadow-2xs hover:shadow-md transition-all duration-300"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 text-white">
                  <h3 className="font-serif text-sm font-bold leading-tight group-hover:underline underline-offset-2">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-stone-300 mt-0.5">{cat.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
