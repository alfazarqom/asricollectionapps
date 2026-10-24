import { Link } from "react-router-dom";

const PromoBannerSection = () => {
  return (
    <section className=" py-6 md:py-10">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#d8dacd] via-[#e6e6de] to-[#f1f1eb] p-5 sm:p-6 lg:p-8  flex items-center">
            <div className="relative z-10 w-[52%]">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Up to 40% Off
              </h2>
              <p className="mt-2 text-gray-700 text-sm md:text-lg">
                On selected items
              </p>

              <button className="mt-6 rounded-xl bg-black px-5 py-2 cursor-pointer text-white text-sm font-semibold hover:bg-amber-500 transition">
                <Link to="/products">Shop Sale</Link>
              </button>
            </div>
            <div className="relative z-10 w-[48%] flex justify-end">
              <img
                src="https://pngimg.com/d/headphones_PNG7645.png"
                alt="Headphones"
                loading="lazy"
                className="h-25 sm:h-35 lg:h-40 w-auto object-contain"
              />
            </div>
          </div>

          {/* Right Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#ece5de] via-[#f2ede8] to-[#f7f5f2] p-5 sm:p-6 lg:p-8  flex items-center">
            <div className="relative z-10 w-[52%]">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                New Collection
              </h2>
              <p className="mt-2 text-gray-700 text-sm md:text-lg">
                Explore the latest arrivals
              </p>

              <button className="mt-6 rounded-xl bg-black px-5 py-2 text-white text-sm font-semibold hover:bg-amber-500 transition cursor-pointer">
                <Link to="/products">Explore Now</Link>
              </button>
            </div>

            <div className="relative z-10 w-[48%] flex justify-end">
              <img
                src="https://pngimg.com/d/women_bag_PNG6403.png"
                alt="Handbag"
                loading="lazy"
                className="h-25 sm:h-35 lg:h-40 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBannerSection;
