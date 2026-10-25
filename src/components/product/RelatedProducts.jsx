import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getProductsByCategory } from "../../services/productApi";
import ProductCard from "./ProductCard";

const RelatedProducts = ({ productId, category }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        if (category) {
          const products = await getProductsByCategory(category);
          const filtered = products
            .filter((p) => p.id !== parseInt(productId, 10))
            .slice(0, 4);
          if (isMounted) {
            setRelatedProducts(filtered);
          }
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRelatedProducts();
    return () => {
      isMounted = false;
    };
  }, [productId, category]);

  if (loading || relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 sm:mt-24 border-t border-stone-200 pt-12 sm:pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A3412] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Rekomendasi Serupa
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-stone-900 tracking-tight">
            Padu Padan Pilihan
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Koleksi lain dalam kategori ini yang sering dipilih bersama.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
