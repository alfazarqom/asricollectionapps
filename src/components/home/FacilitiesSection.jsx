import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const facilities = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $99",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure payment",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30 days return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "We're here to help",
  },
];

const FacilitiesSection = () => {
  return (
    <section className="md:py-8 py-6">
      <div className="container">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {facilities.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                  <Icon className="h-7 w-7 text-amber-500" strokeWidth={2} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FacilitiesSection;
