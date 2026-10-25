import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../product/ProductCard";

const NewArrivals = ({ products = [] }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-14 sm:py-20 bg-[#FDFCFA]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A3412] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Koleksi Terbaru
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              New Arrivals
            </h2>
            <p className="mt-1 text-sm text-stone-600 max-w-xl">
              Rilisan busana dan aksesoris terkini dengan sentuhan modern, material sejuk, dan siluet anggun.
            </p>
          </div>

          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wider uppercase text-stone-900 hover:text-[#9A3412] transition-colors shrink-0"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
