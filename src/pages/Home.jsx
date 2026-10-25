import { useEffect, useState } from "react";
import FacilitiesSection from "../components/home/FacilitiesSection";
import CategorySection from "../components/home/CategorySection";
import FeaturedProducts from "../components/home/FeaturedProducts";
import HeroSlider from "../components/home/HeroSlider";
import NewArrivals from "../components/home/NewArrivals";
import PromoBannerSection from "../components/home/PromoBannerSection";
import BrandStorySection from "../components/home/BrandStorySection";
import FullPageLoader from "../components/ui/Loader";
import { getProducts, preloadProductImages } from "../services/productApi";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        if (isMounted) {
          setProducts(data);
          preloadProductImages(data.slice(0, 12));
        }
      } catch (error) {
        console.error("Error loading products on Home:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="bg-[#FAF8F5]">
      {/* Editorial Hero Slider */}
      <HeroSlider />

      {/* Trust & Guarantee Strip */}
      <FacilitiesSection />

      {/* Curated Categories */}
      <CategorySection />

      {/* Featured / Best Sellers */}
      <FeaturedProducts products={products.slice(0, 4)} />

      {/* Editorial Promo Banners */}
      <PromoBannerSection />

      {/* New Arrivals */}
      <NewArrivals products={products.slice(4, 12)} />

      {/* Heritage & Brand Story */}
      <BrandStorySection />
    </div>
  );
};

export default Home;
