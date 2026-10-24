import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { getProductsByCategory } from "../../services/productApi";
import { useCart } from "../../hooks/useCart";

const RelatedProducts = ({ productId, category }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cartItems, addToCart } = useCart();
  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        if (category) {
          const products = await getProductsByCategory(category);
          // Filter out current product and limit to 4 products
          const filtered = products
            .filter((p) => p.id !== parseInt(productId))
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId, category]);

  if (loading || relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-slate-200 pt-12">
      <div className="container">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Related Products
          </h2>
          <p className="mt-2 text-slate-500">
            You might also like these products from the same category
          </p>
        </div>

        {/* Related Products Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Product Image */}
              <Link to={`/products/${product.id}`}>
                <div className="relative h-60 bg-slate-50 flex items-center justify-center rounded-t-3xl">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    loading="lazy"
                    className="max-h-50 max-w-full object-contain transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </Link>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="mb-2 text-base font-semibold text-slate-900 line-clamp-2 transition">
                  {product.title}
                </h3>
                {/* Rating */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-500">
                    ({product.rating})
                  </span>
                </div>

                {/* Price & Add to Cart */}
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-slate-900">
                    ${product.price}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={isInCart(product.id)}
                    className={`flex gap-2 items-center justify-center rounded-xl bg-black px-3 py-2 text-white text-sm font-medium hover:bg-amber-500 transition cursor-pointer
                      ${
                        isInCart(product.id)
                          ? "cursor-not-allowed! opacity-50  hover:bg-black"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                  >
                    Add to cart
                    <ShoppingCart
                      className="h-4 w-4 text-white"
                      title="Add to Cart"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
