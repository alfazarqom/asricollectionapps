import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  HelpCircle,
} from "lucide-react";

import { getProductById } from "../services/productApi";
import RelatedProducts from "../components/product/RelatedProducts";
import { useCart } from "../hooks/useCart";
import { formatPrice, calculateOriginalPrice } from "../utils/formatters";

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "All Size"];
const AVAILABLE_COLORS = [
  { name: "Cream Ivory", hex: "#F3EDE2" },
  { name: "Warm Taupe", hex: "#B8A390" },
  { name: "Earthy Olive", hex: "#7E8569" },
  { name: "Midnight Charcoal", hex: "#292724" },
];

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("All Size");
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProductById(id);
        if (isMounted) {
          setProduct(data);
          const initialImg = data.images?.[0] || data.thumbnail || "";
          setSelectedImage(initialImg);
          setQuantity(1);
          setIsAdded(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Gagal memuat produk");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const originalPrice = useMemo(() => {
    if (!product) return 0;
    return calculateOriginalPrice(product.price, product.discountPercentage);
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    const variantItem = {
      ...product,
      size: selectedSize,
      color: selectedColor.name,
      variant: `${selectedSize} / ${selectedColor.name}`,
    };
    addToCart(variantItem, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      const maxStock = product?.stock || 50;
      if (next < 1) return 1;
      if (next > maxStock) return maxStock;
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FAF8F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-stone-300 border-t-[#9A3412]" />
          <p className="text-xs uppercase tracking-widest text-stone-500 font-mono">
            Memuat Busana...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FAF8F5] px-4 text-center">
        <h2 className="text-2xl font-serif font-medium text-stone-900">
          Produk Tidak Ditemukan
        </h2>
        <p className="mt-2 text-sm text-stone-500 max-w-sm">
          Busana yang Anda cari mungkin telah habis atau tautan tidak valid.
        </p>
        <Link
          to="/products"
          className="mt-6 rounded-lg bg-stone-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#9A3412] transition"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : [product.thumbnail];

  return (
    <main className="min-h-screen bg-[#FAF8F5] pt-24 sm:pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <Link to="/" className="hover:text-stone-900 transition">
            Beranda
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/products" className="hover:text-stone-900 transition">
            Katalog
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link
            to={`/products?category=${product.category}`}
            className="capitalize hover:text-stone-900 transition"
          >
            {product.category?.replace(/-/g, " ")}
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <span className="text-stone-900 font-medium truncate max-w-[200px] sm:max-w-xs">
            {product.title}
          </span>
        </nav>

        {/* Back Link */}
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 mb-6 transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke semua produk</span>
        </Link>

        {/* Product Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Visual Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[560px] pb-2 sm:pb-0 shrink-0">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white ${
                      selectedImage === img
                        ? "border-stone-900 shadow-xs"
                        : "border-stone-200/80 hover:border-stone-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Display */}
            <div className="relative flex-1 aspect-[3/4] max-h-[640px] rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-xs">
              <img
                src={selectedImage || product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />

              {/* Discount Tag */}
              {product.discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-[#9A3412] text-white text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded shadow-xs">
                  Hemat {Math.round(product.discountPercentage)}%
                </div>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label={isWishlisted ? "Hapus dari favorit" : "Tambah ke favorit"}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-800 hover:text-red-500 shadow-sm transition"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Purchasing Details */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            {/* Category & Collection */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A3412]">
                {product.category?.replace(/-/g, " ")}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-stone-800 font-mono font-semibold">
                  {product.rating || "4.8"}
                </span>
                <span className="text-stone-400">/5.0</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-stone-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Pricing Section */}
            <div className="mt-4 flex items-baseline gap-3 pb-4 border-b border-stone-200">
              <span className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 font-mono tabular-nums">
                {formatPrice(product.price)}
              </span>
              {originalPrice > product.price && (
                <span className="text-sm sm:text-base text-stone-400 line-through font-mono tabular-nums">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {/* Brief Description */}
            <p className="mt-4 text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>

            {/* Color Selection */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Warna: <span className="font-normal text-stone-600">{selectedColor.name}</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor.name === color.name
                        ? "border-stone-900 ring-2 ring-stone-900/20 scale-110"
                        : "border-stone-300 hover:border-stone-500"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={color.name}
                  >
                    {selectedColor.name === color.name && (
                      <Check className={`w-3.5 h-3.5 absolute inset-0 m-auto ${
                        color.hex === "#292724" ? "text-white" : "text-stone-900"
                      }`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Ukuran: <span className="font-normal text-stone-600">{selectedSize}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab("sizeGuide")}
                  className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-2 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Panduan Ukuran
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      selectedSize === size
                        ? "border-stone-900 bg-stone-900 text-white shadow-xs"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="mt-6 pt-6 border-t border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                  Jumlah:
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Stok Tersedia ({product.stock || 25} pcs)
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center border border-stone-300 rounded-lg bg-white h-11">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Kurangi kuantitas"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono text-sm font-semibold text-stone-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stock || 50)}
                    className="w-10 h-full flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Tambah kuantitas"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-white transition shadow-xs cursor-pointer ${
                    isAdded
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-stone-900 hover:bg-[#9A3412]"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Berhasil Ditambahkan!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Tambah ke Tas Belanja</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Guarantees Strip */}
            <div className="mt-8 grid grid-cols-2 gap-3 p-4 bg-white rounded-xl border border-stone-200/80 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#9A3412] shrink-0" />
                <span>Pengiriman ke Seluruh Nusantara</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9A3412] shrink-0" />
                <span>Pembayaran Aman Duitku POP</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#9A3412] shrink-0" />
                <span>Garansi Retur Bila Cacat Jahitan</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9A3412] shrink-0" />
                <span>100% Produk Original Butik</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Specifications & Policies */}
        <div className="mt-16 sm:mt-20">
          <div className="flex items-center gap-4 sm:gap-8 border-b border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab("description")}
              className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition relative ${
                activeTab === "description"
                  ? "text-stone-900 border-b-2 border-stone-900"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Detail & Material
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sizeGuide")}
              className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition relative ${
                activeTab === "sizeGuide"
                  ? "text-stone-900 border-b-2 border-stone-900"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Panduan Ukuran
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition relative ${
                activeTab === "shipping"
                  ? "text-stone-900 border-b-2 border-stone-900"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Pengiriman & Pembayaran
            </button>
          </div>

          <div className="py-6 text-sm text-stone-600 leading-relaxed max-w-3xl">
            {activeTab === "description" && (
              <div className="space-y-4">
                <p>
                  Busana ini dirancang dengan standar butik Asri Collection menggunakan material bertekstur halus, adem, dan jatuh anggun di badan. Cocok untuk acara formal, pesta keluarga, silaturahmi, maupun aktivitas kasual harian.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
                  <li>Material: Katun Premium Blend / Silk Crepe lembut</li>
                  <li>Jahitan rapi berpola butik berpresisi tinggi</li>
                  <li>Kancing / ritsleting tersembunyi yang wudhu-friendly</li>
                  <li>Potongan longgar (modest cut) yang tidak menerawang</li>
                </ul>
              </div>
            )}

            {activeTab === "sizeGuide" && (
              <div className="space-y-4">
                <p>Tabel estimasi ukuran (dalam centimeter):</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-stone-200 rounded-lg overflow-hidden">
                    <thead className="bg-stone-100 text-stone-800 font-semibold">
                      <tr>
                        <th className="p-2.5 border-b border-stone-200">Ukuran</th>
                        <th className="p-2.5 border-b border-stone-200">Lingkar Dada (LD)</th>
                        <th className="p-2.5 border-b border-stone-200">Panjang Baju (PB)</th>
                        <th className="p-2.5 border-b border-stone-200">Panjang Lengan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-mono">
                      <tr>
                        <td className="p-2.5 font-semibold text-stone-900">S</td>
                        <td className="p-2.5">92 - 96 cm</td>
                        <td className="p-2.5">135 cm</td>
                        <td className="p-2.5">56 cm</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-stone-900">M</td>
                        <td className="p-2.5">98 - 102 cm</td>
                        <td className="p-2.5">138 cm</td>
                        <td className="p-2.5">57 cm</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-stone-900">L</td>
                        <td className="p-2.5">104 - 108 cm</td>
                        <td className="p-2.5">140 cm</td>
                        <td className="p-2.5">58 cm</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-stone-900">XL</td>
                        <td className="p-2.5">110 - 116 cm</td>
                        <td className="p-2.5">142 cm</td>
                        <td className="p-2.5">59 cm</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-3">
                <p>
                  Pesanan diproses dan dikemas rapi dalam kurun waktu 1x24 jam kerja dari butik kami di Sidenreng Rappang, Sulawesi Selatan.
                </p>
                <p>
                  <strong>Ekspedisi Rekanan:</strong> J&T Express, SiCepat, JNE. Resi pengiriman akan diberikan segera setelah paket diserahkan ke kurir.
                </p>
                <p>
                  <strong>Metode Pembayaran Resmi:</strong> Duitku POP Payment Gateway terenkripsi aman — mendukung QRIS (BCA, Mandiri, GoPay, OVO, ShopeePay), Virtual Account Bank (BCA, BRI, BNI, Mandiri, Permata), dan Transfer Rekening.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts productId={id} category={product.category} />
      </div>
    </main>
  );
};

export default ProductDetails;
