import { ChevronDown } from "lucide-react";

const ProductFilter = ({
  category,
  priceRange,
  onCategoryChange,
  onPriceChange,
  categories = [],
}) => {
  const priceRanges = [
    { value: "all", label: "Semua Harga" },
    { value: "0-100000", label: "Rp0 - Rp100.000" },
    { value: "100000-250000", label: "Rp100.000 - Rp250.000" },
    { value: "250000-500000", label: "Rp250.000 - Rp500.000" },
    { value: "500000-1000000", label: "Rp500.000 - Rp1.000.000" },
    { value: "1000000+", label: "Di atas Rp1.000.000" },
  ];

  const defaultCategories = [
    { value: "all", label: "Semua Kategori" },
  ];

  const categoryList = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-slate-900 hidden sm:block">
        Filters:
      </span>

      {/* Category Filter */}
      <div className="relative">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-500 appearance-none pr-8 cursor-pointer hover:border-slate-400 transition"
        >
          {categoryList.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
      </div>

      {/* Price Filter */}
      <div className="relative">
        <select
          value={priceRange}
          onChange={(e) => onPriceChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 appearance-none pr-8 cursor-pointer hover:border-slate-300 transition"
        >
          {priceRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
      </div>
    </div>
  );
};

export default ProductFilter;
