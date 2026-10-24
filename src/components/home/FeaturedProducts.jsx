import { ArrowRight, Star, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

const FeaturedProducts = ({ products }) => {
  const { cartItems, addToCart } = useCart();
  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };
  return (
    <section className="py-4">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="md:text-2xl text-xl font-bold text-slate-900">
            Featured Products
          </h2>
          <div>
            <button className="flex items-center gap-2 md:text-base text-sm font-semibold text-slate-700 transition hover:text-amber-500 cursor-pointer">
              <Link to="/products" className="flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Product Image */}
              <Link to={`/products/${product.id}`}>
                <div className="relative  h-60 bg-slate-50 flex items-center justify-center rounded-t-3xl">
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
                <h3 className="mb-2 text-base font-semibold text-slate-900">
                  {product.title}
                </h3>
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
                <div className="flex items-center justify-between ">
                  <p className="text-base font-bold text-slate-900 ">
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

export default FeaturedProducts;
