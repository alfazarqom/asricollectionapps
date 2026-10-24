import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";

import { getProductById } from "../services/productApi";
import RelatedProducts from "../components/product/RelatedProducts";
import { useCart } from "../hooks/useCart";

const ProductDetails = () => {
  const { id } = useParams();
  const { cartItems, addToCart } = useCart();
  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProductById(id);

        setProduct(data);
      } catch (error) {
        setError(error.message || "Unable to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900">Product not found</h2>

        <Link
          to="/products"
          className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <main className="md:py-6 py-6 mt-20 bg-gray-50">
      {/* Breadcrumb */}
      <div className="container">
        <div className="md:mb-8 mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-amber-500">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-500">
            Shop
          </Link>
          <span>/</span>
          <span className="text-slate-900">{product.title}</span>
        </div>
        {/* Back */}
        <Link
          to="/products"
          className="md:mb-8 mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>

      {/* Product Details */}
      <section>
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Product Image */}
            <div className="flex md:min-h-125 min-h-80 items-center justify-center rounded-2xl bg-white p-8">
              <img
                src={product.images?.[0] || product.thumbnail}
                alt={product.title}
                loading="lazy"
                className="md:max-h-110 max-h-80 w-full object-contain"
              />
            </div>

            {/* Product Information */}
            <div className="flex flex-col justify-center">
              {/* Category */}
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-500">
                {product.category}
              </p>

              {/* Title */}
              <h1 className="text-2xl font-bold text-slate-900 sm:text-4xl">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="md:h-5 md:w-5 h-4 w-4 fill-current"
                    />
                  ))}
                </div>

                <span className="text-sm text-slate-500">
                  {product.rating} rating
                </span>
              </div>

              {/* Price */}
              <div className="mt-6">
                <span className="text-3xl font-bold text-slate-900">
                  ${product.price}
                </span>
              </div>

              {/* Description */}
              <p className="mt-6 leading-7 text-slate-600">
                {product.description}
              </p>

              {/* Stock */}
              <div className="mt-6">
                <span className="text-sm font-medium text-slate-600">
                  Availability:
                </span>

                <span className="ml-2 text-sm font-semibold text-green-600">
                  {product.stock > 0
                    ? `${product.stock} items available`
                    : "Out of stock"}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => addToCart(product)}
                  disabled={isInCart(product.id)}
                  className={`flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 font-semibold text-white transition hover:bg-amber-500  
                      ${
                        isInCart(product.id)
                          ? "cursor-not-allowed! opacity-50  hover:bg-black"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                >
                  Add to cart
                  <ShoppingCart className="h-5 w-5" title="Add to Cart" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      <RelatedProducts productId={id} category={product.category} />
    </main>
  );
};

export default ProductDetails;
