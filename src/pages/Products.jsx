import { Star, ShoppingCart } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import FullPageLoader from "../components/ui/Loader";
import ProductFilter from "../components/product/ProductFilter";
import {
  getProducts,
  getCategories,
  preloadProductImages,
} from "../services/productApi";
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const { cartItems, addToCart } = useCart();
  const isInCart = (productId) => {
    return cartItems.some((item) => item.id === productId);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);
        setCategories(categoriesData);
        await preloadProductImages(productsData);
        setProducts(productsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    // Category filter
    if (category !== "all") {
      result = result.filter((product) => product.category === category);
    }
    // Price filter
    if (priceRange !== "all") {
      result = result.filter((product) => {
        const price = product.price;
        switch (priceRange) {
          case "0-25":
            return price <= 25;
          case "25-50":
            return price > 25 && price <= 50;
          case "50-100":
            return price > 50 && price <= 100;
          case "100-500":
            return price > 100 && price <= 500;
          case "500+":
            return price > 500;

          default:
            return true;
        }
      });
    }
    return result;
  }, [products, category, priceRange]);

  if (loading) {
    return <FullPageLoader />;
  }
  return (
    <>
      <section className="mt-20 bg-gray-50">
        <div className="container md:pt-6 pt-4">
          {/* Breadcrumb */}
          <div className="md:mb-8 mb-6 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-amber-500">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900">Shop</span>
            <span>/</span>
            <span className="text-slate-900">All Products</span>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-4  pb-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-4xl">
                All Products
              </h1>
              <p className="mt-2 max-w-2xl md:text-base text-sm text-slate-500">
                Discover our latest collection of fashion, accessories,
                electronics, and lifestyle products.
              </p>
            </div>

            <div className="self-start rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>

          {/* Filters & Sort */}
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-t border-slate-200 md:py-4 py-2">
            <ProductFilter
              category={category}
              priceRange={priceRange}
              onCategoryChange={setCategory}
              onPriceChange={setPriceRange}
              categories={categories}
            />
          </div>
        </div>
        <div className="container">
          <div className=" py-4 md:pb-10 pt-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className=" text-slate-500 font-medium text-base">
                  No products found matching your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
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
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;
