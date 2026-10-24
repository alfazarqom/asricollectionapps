import {
  Award,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

const About = () => {
  const stats = [
    {
      value: "10K+",
      label: "Happy Customers",
    },
    {
      value: "500+",
      label: "Products",
    },
    {
      value: "25+",
      label: "Categories",
    },
    {
      value: "4.8/5",
      label: "Customer Rating",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Everything we do starts with our customers. We focus on making shopping simple, enjoyable, and reliable.",
    },
    {
      icon: ShieldCheck,
      title: "Quality Products",
      description:
        "We carefully select products that offer great quality, value, and a shopping experience you can trust.",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description:
        "We work to get your orders delivered quickly and safely, right to your doorstep.",
    },
    {
      icon: Award,
      title: "Trusted Service",
      description:
        "From browsing to delivery, our goal is to provide a smooth and dependable experience every time.",
    },
  ];

  return (
    <main className="mt-20 bg-gray-50">
      {/* Breadcrumb */}
      <section>
        <div className="container md:pt-6 pt-4">
          <div className="md:mb-8 mb-6 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-amber-500">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900">About</span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="py-0  sm:py-12  lg:py-20">
        <div className="container">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Content */}
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-amber-500">
                About SHOP.CO
              </p>

              <h1 className="max-w-md font-bold leading-tight text-slate-900 text-3xl lg:text-5xl">
                Shopping made
                <span className="text-amber-500"> simple.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600">
                SHOP.CO is a modern online shopping destination created to make
                discovering quality products simple, convenient, and enjoyable.
              </p>

              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                From everyday essentials to the latest lifestyle products, we
                bring together a carefully selected collection designed to fit
                your everyday needs.
              </p>
            </div>
            {/* Visual */}
            <div className="relative">
              <div className="overflow-hidden rounded-3xl bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80"
                  alt="SHOP.CO shopping experience"
                  loading="lazy"
                  className=" h-90 w-full object-cover sm:h-112.5"
                />
              </div>

              {/* Floating card */}
              <div className="absolute  bottom-0 left-4 rounded-2xl border border-slate-200 bg-white p-4 py-2 shadow-lg sm:-left-5 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                    <ShoppingBag className="h-5 w-5 text-amber-600" />
                  </div>

                  <div>
                    <p className="text-lg font-bold text-slate-900">10K+</p>

                    <p className="text-xs text-slate-500">Happy shoppers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-white  py-10">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-slate-900 sm:text-4xl">
                  {stat.value}
                </p>

                <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-10 sm:py-20">
        <div className="container">
          <div className="grid items-center gap-4 lg:grid-cols-2 lg:gap-16">
            {/* Image */}
            <div className="overflow-hidden rounded-3xl bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80"
                alt="Our shopping story"
                loading="lazy"
                className="h-80 w-full object-cover  sm:h-105"
              />
            </div>

            {/* Content */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                Our Story
              </p>

              <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-4xl">
                Built around better shopping
              </h2>

              <p className="mt-6 leading-7 text-slate-600">
                SHOP.CO started with a simple idea: online shopping should feel
                easy, clear, and enjoyable. Instead of overwhelming customers
                with endless choices, we focus on creating a clean experience
                where finding the right product feels effortless.
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                Our platform brings products, useful information, and a
                straightforward shopping experience together in one place. We
                are continuously improving the experience based on what matters
                most to our customers.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>

                <div>
                  <p className="font-bold text-slate-900">Customer focused</p>

                  <p className="text-sm text-slate-500">
                    Designed with shoppers in mind
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-white py-8 sm:py-15">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
              What We Believe
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-4xl">
              Our values
            </h2>

            <p className="mt-4 text-slate-600">
              The principles that shape the SHOP.CO experience.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
