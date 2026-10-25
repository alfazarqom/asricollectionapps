import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, X, Search, PackageOpen } from "lucide-react";
import FullPageLoader from "../components/ui/Loader";
import ProductFilter from "../components/product/ProductFilter";
import ProductCard from "../components/product/ProductCard";
import { getProducts, getCategories, preloadProductImages } from "../services/productApi";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getProducts(),
        ]);
        if (isMounted) {
          setCategories(categoriesData);
          setProducts(productsData);
          preloadProductImages(productsData.slice(0, 16));
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryChange = (newCat) => {
    const newParams = new URLSearchParams(searchParams);
    if (newCat === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", newCat);
    }
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setPriceRange("all");
    setSortBy("featured");
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }

    // Price filter (in IDR)
    if (priceRange !== "all") {
      result = result.filter((product) => {
        const price = product.price;
        switch (priceRange) {
          case "under-250":
            return price <= 250000;
          case "250-500":
            return price > 250000 && price <= 500000;
          case "500-1000":
            return price > 500000 && price <= 1000000;
          case "above-1000":
            return price > 1000000;
          default:
            return true;
        }
      });
    }

    // Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, category, priceRange, sortBy, searchQuery]);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] pt-24 sm:pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900 transition">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-stone-400">Katalog</span>
          <span>/</span>
          <span className="text-stone-900 font-medium">Semua Busana</span>
        </nav>

        {/* Page Title & Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#9A3412] mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Katalog Eksklusif
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 tracking-tight">
              Koleksi Asri Collection
            </h1>
            <p className="mt-1.5 text-sm text-stone-600 max-w-2xl">
              Temukan pilihan busana modest, gamis, tunik, hijab, tas, dan aksesoris elegan untuk menemani setiap momen istimewa.
            </p>
          </div>

          <div className="text-xs text-stone-500 font-mono self-start md:self-end bg-white border border-stone-200 rounded-lg px-3 py-1.5 shadow-2xs">
            Menampilkan <span className="font-semibold text-stone-900">{filteredProducts.length}</span> dari {products.length} produk
          </div>
        </div>

        {/* Active Search Badge */}
        {searchQuery && (
          <div className="mt-4 inline-flex items-center gap-2 bg-[#F4EFEA] border border-stone-300 rounded-full px-3.5 py-1 text-xs text-stone-800">
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Pencarian: <strong>"{searchQuery}"</strong></span>
            <button
              onClick={handleClearSearch}
              className="ml-1 p-0.5 rounded-full hover:bg-stone-300 text-stone-600 transition"
              aria-label="Hapus filter pencarian"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-stone-200/90 shadow-2xs">
          <ProductFilter
            category={category}
            priceRange={priceRange}
            sortBy={sortBy}
            onCategoryChange={handleCategoryChange}
            onPriceChange={setPriceRange}
            onSortChange={setSortBy}
            onReset={handleResetFilters}
            categories={categories}
          />
        </div>

        {/* Product Grid or Empty State */}
        <div className="mt-8">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 px-4 bg-white rounded-2xl border border-dashed border-stone-300 max-w-xl mx-auto my-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F4EFEA] text-[#9A3412] mb-4">
                <PackageOpen className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-serif font-medium text-stone-900">
                Tidak ada produk ditemukan
              </h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed max-w-md mx-auto">
                Maaf, tidak ada produk yang cocok dengan kombinasi filter atau pencarian Anda. Silakan coba atur ulang filter.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#9A3412] transition shadow-xs"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Products;
