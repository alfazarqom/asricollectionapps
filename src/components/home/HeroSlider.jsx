import ReactSlick from "react-slick";
import { Link } from "react-router-dom";

// Vite may expose this CommonJS package as either the component or a module wrapper.
const Slider = ReactSlick.default ?? ReactSlick;

const slides = [
  {
    id: 1,
    title: "Summer Collection 2026",
    subtitle: "Up to 50% Off",
    image:
      "https://images.unsplash.com/photo-1483181994834-aba9fd1e251a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 2,
    title: "New Fashion Arrivals",
    subtitle: "Trending Now",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
  },
  {
    id: 3,
    title: "Premium Lifestyle Products",
    subtitle: "Shop the Best Deals",
    image:
      "https://plus.unsplash.com/premium_photo-1683121817275-85d1dcf9e4c4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const HeroSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    pauseOnHover: true,
  };

  return (
    <section className="py-0 overflow-hidden md:mx-8 mx-2 md:mt-20 mt-18">
      <Slider {...settings}>
        {slides.map((slide) => (
          <div key={slide.id}>
            <div className="relative md:h-175 h-100 overflow-hidden rounded-2xl">
              <img
                src={slide.image}
                alt={slide.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-black/40" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
                <p className="mb-2 text-xl font-medium text-white">
                  {slide.subtitle}
                </p>

                <h1 className="my-8 md:text-5xl text-3xl font-bold leading-tight">
                  {slide.title}
                </h1>

                <button className="rounded-xl bg-amber-500 px-8 py-3 font-semibold text-white transition hover:bg-slate-100 hover:text-slate-950 cursor-pointer">
                  <Link to="/products">Shop Now</Link>
                </button>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default HeroSlider;
