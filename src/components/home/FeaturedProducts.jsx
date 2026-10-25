import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import ProductCard from "../product/ProductCard";

const FeaturedProducts = ({ products = [] }) => {
  return (
    <section className="py-12 lg:py-16 bg-[#FAF8F5]" aria-label="Produk Pilihan">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-stone-500">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Kurasi Terbaik</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Produk Pilihan Asri
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900 hover:text-stone-600 transition-colors"
          >
            <span>Lihat Semua Katalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
