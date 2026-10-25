import { Truck, ShieldCheck, Sparkles, MessageCircle } from "lucide-react";

const facilities = [
  {
    icon: Truck,
    title: "Kirim Seluruh Indonesia",
    description: "J&T, SiCepat & JNE dengan resi otomatis.",
  },
  {
    icon: ShieldCheck,
    title: "Pembayaran Aman Duitku",
    description: "QRIS, VA Bank, E-Wallet & Kartu.",
  },
  {
    icon: Sparkles,
    title: "Kualitas Butik 100%",
    description: "Bahan adem, jahitan rapi, bergaransi.",
  },
  {
    icon: MessageCircle,
    title: "CS WhatsApp Ramah",
    description: "Konsultasi ukuran & bantuan pesanan cepat.",
  },
];

const FacilitiesSection = () => {
  return (
    <section className="py-8 sm:py-10 bg-white border-y border-stone-200/70">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {facilities.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-[#FAF8F5]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4EFEA] text-[#9A3412]">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">
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
