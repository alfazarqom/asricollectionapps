const PRODUCTS_ENDPOINT =
  import.meta.env.VITE_PRODUCTS_ENDPOINT ||
  "https://mvwflakurihhakdrlteg.supabase.co/functions/v1/get-products";

const PAGE_SIZE = 100;
let productsCache = null;

const normalizeProduct = (product) => {
  const primaryImage = product.image_link || product.thumbnail || "";
  const extraImages = Array.isArray(product.additional_image_link)
    ? product.additional_image_link
    : [];
  const legacyImages = Array.isArray(product.images) ? product.images : [];
  const images = [...new Set([primaryImage, ...extraImages, ...legacyImages].filter(Boolean))];

  return {
    ...product,
    id: String(product.id),
    category: product.category || product.product_type || "Lainnya",
    thumbnail: primaryImage || images[0] || "",
    images,
    rating: Number(product.rating) || 0,
    stock: Number(product.stock) || 0,
    price: Number(product.sale_price ?? product.price) || 0,
    originalPrice: product.sale_price != null ? Number(product.price) : null,
    currency: product.currency || "IDR",
  };
};

const fetchProductPage = async (limit, offset) => {
  const url = new URL(PRODUCTS_ENDPOINT);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil produk (HTTP ${response.status}).`);
  }

  const payload = await response.json();
  if (!payload?.success || !Array.isArray(payload.data)) {
    throw new Error("Respons get-products tidak sesuai format yang diharapkan.");
  }

  return {
    products: payload.data.map(normalizeProduct),
    total: Number(payload.pagination?.total) || payload.data.length,
  };
};

// Fetch products from the public Supabase Edge Function, including paginated rows.
export const getProducts = async (limit = null) => {
  if (productsCache) {
    return limit == null ? productsCache : productsCache.slice(0, limit);
  }

  const firstPage = await fetchProductPage(PAGE_SIZE, 0);
  const products = [...firstPage.products];
  let offset = firstPage.products.length;
  const total = firstPage.total;

  while (offset < total && firstPage.products.length === PAGE_SIZE) {
    const page = await fetchProductPage(PAGE_SIZE, offset);
    if (page.products.length === 0) break;
    products.push(...page.products);
    offset += page.products.length;
  }

  productsCache = products;
  return limit == null ? products : products.slice(0, limit);
};

export const getProductById = async (id) => {
  const products = await getProducts();
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) throw new Error("Produk tidak ditemukan.");
  return product;
};

export const getProductsByCategory = async (category) => {
  const products = await getProducts();
  if (category === "all") return products;
  return products.filter((product) => product.category === category);
};

export const getCategories = async () => {
  const products = await getProducts();
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "id"));

  return [
    { value: "all", label: "Semua Kategori" },
    ...categories.map((value) => ({ value, label: value })),
  ];
};

export const formatPrice = (price, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency || "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

export const preloadProductImages = (products) =>
  Promise.all(
    products.map(
      ({ thumbnail }) =>
        new Promise((resolve) => {
          if (!thumbnail) return resolve();
          const image = new Image();
          image.onload = resolve;
          image.onerror = resolve;
          image.src = thumbnail;
        }),
    ),
  );
