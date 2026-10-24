import { useEffect, useState } from "react";
import FacilitiesSection from "../components/home/FacilitiesSection";
import FeaturedProducts from "../components/home/FeaturedProducts";
import HeroSlider from "../components/home/HeroSlider";
import NewArrivals from "../components/home/NewArrivals";
import PromoBannerSection from "../components/home/PromoBannerSection";
import FullPageLoader from "../components/ui/Loader";
import { getProducts, preloadProductImages } from "../services/productApi";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        // Load images in background without blocking
        preloadProductImages(data.slice(0, 9));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <>
      <HeroSlider />
      <FacilitiesSection />
      <FeaturedProducts products={products.slice(0, 4)} />
      <NewArrivals products={products.slice(4, 9)} />
      <PromoBannerSection />
    </>
  );
};

export default Home;
