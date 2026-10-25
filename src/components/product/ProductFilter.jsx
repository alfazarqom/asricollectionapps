import { ChevronDown, SlidersHorizontal, RotateCcw } from "lucide-react";

const ProductFilter = ({
  category,
  priceRange,
  sortBy = "featured",
  onCategoryChange,
  onPriceChange,
  onSortChange,
  onReset,
  categories = [],
}) => {
  const priceRanges = [
    { value: "all", label: "Semua Harga" },
    { value: "under-250", label: "< Rp 250.000" },
    { value: "250-500", label: "Rp 250.000 – Rp 500.000" },
    { value: "500-1000", label: "Rp 500.000 – Rp 1.000.000" },
    { value: "above-1000", label: "> Rp 1.000.000" },
  ];

  const sortOptions = [
    { value: "featured", label: "Rekomendasi Utama" },
    { value: "price-asc", label: "Harga: Termurah" },
    { value: "price-desc", label: "Harga: Termahal" },
    { value: "rating", label: "Ulasan Tertinggi" },
  ];

  const defaultCategories = [
    { value: "all", label: "Semua Kategori" },
    { value: "womens-dresses", label: "Dress & Gamis" },
    { value: "tops", label: "Tunik & Atasan" },
    { value: "womens-bags", label: "Tas & Pouch" },
    { value: "womens-shoes", label: "Sepatu & Sandal" },
    { value: "fragrances", label: "Parfum & Wewangian" },
    { value: "beauty", label: "Perawatan & Beauty" },
  ];

  const categoryList = categories.length > 0 ? categories : defaultCategories;
  const isFiltered = category !== "all" || priceRange !== "all" || sortBy !== "featured";

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 w-full">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter:
        </span>

        {/* Category Filter */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-stone-800 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 appearance-none pr-9 cursor-pointer hover:border-stone-400 transition"
          >
            {categoryList.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
        </div>

        {/* Price Filter */}
        <div className="relative flex-1 sm:flex-initial">
          <select
            value={priceRange}
            onChange={(e) => onPriceChange(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-stone-800 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 appearance-none pr-9 cursor-pointer hover:border-stone-400 transition"
          >
            {priceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-[#9A3412] hover:bg-stone-100 rounded-lg transition"
            title="Reset Semua Filter"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sort By */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <span className="text-xs text-stone-500 hidden sm:inline">Urutkan:</span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-stone-800 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 appearance-none pr-9 cursor-pointer hover:border-stone-400 transition"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;
