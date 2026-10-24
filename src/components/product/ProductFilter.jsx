import { ChevronDown } from "lucide-react";

const ProductFilter = ({
  category,
  priceRange,
  onCategoryChange,
  onPriceChange,
  categories = [],
}) => {
  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-25", label: "$0 - $25" },
    { value: "25-50", label: "$25 - $50" },
    { value: "50-100", label: "$50 - $100" },
    { value: "100-500", label: "$100 - $500" },
    { value: "500+", label: "$500+" },
  ];

  const defaultCategories = [
    { value: "all", label: "All Categories" },
    { value: "beauty", label: "Beauty" },
    { value: "fragrances", label: "Fragrances" },
    { value: "furniture", label: "Furniture" },
    { value: "groceries", label: "Groceries" },
    { value: "laptops", label: "Laptops" },
    { value: "mens-shirts", label: "Men's Shirts" },
    { value: "mens-shoes", label: "Men's Shoes" },
    { value: "smartphones", label: "Smartphones" },
    { value: "womens-dresses", label: "Women's Dresses" },
    { value: "womens-shoes", label: "Women's Shoes" },
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
