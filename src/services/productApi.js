import { supabase, supabaseUrl, supabaseAnonKey } from "../lib/supabase";

export { supabase, supabaseUrl, supabaseAnonKey };

// Curated Fashion & Lifestyle Categories for Asri Collection
export const FASHION_CATEGORIES = [
  {
    slug: "womens-dresses",
    name: "Dresses & Gamis",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    count: "18+ Model",
  },
  {
    slug: "tops",
    name: "Tops & Blouse",
    image: "https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&auto=format&fit=crop&q=80",
    count: "24+ Model",
  },
  {
    slug: "womens-bags",
    name: "Tas & Handbag",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
    count: "16+ Model",
  },
  {
    slug: "womens-shoes",
    name: "Sepatu & Heels",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
    count: "12+ Model",
  },
  {
    slug: "womens-jewellery",
    name: "Aksesoris Hijab",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
    count: "20+ Model",
  },
  {
    slug: "fragrances",
    name: "Parfum & Wewangian",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80",
    count: "10+ Varian",
  },
];

// Fallback Asri Collection Products in Indonesian Rupiah
export const FALLBACK_PRODUCTS = [
  {
    id: "nadira-silk-kaftan-dress",
    slug: "nadira-silk-kaftan-dress",
    title: "Nadira Silk Kaftan Dress Mocca",
    price: 389000,
    originalPrice: 489000,
    discountPercentage: 20,
    rating: 4.95,
    category: "womens-dresses",
    category_slug: "womens-dresses",
    thumbnail: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
    ],
    description: "Gamis kaftan berbahan silk mulberry premium dengan potongan flowy yang anggun. Dilengkapi aksen lipit depan dan kancing mutiara eksklusif.",
    stock: 35,
    is_featured: true,
    is_new: true,
  },
  {
    id: "ayesha-pleated-maxi-dress",
    slug: "ayesha-pleated-maxi-dress",
    title: "Ayesha Pleated Maxi Dress Olive",
    price: 425000,
    originalPrice: 520000,
    discountPercentage: 18,
    rating: 4.9,
    category: "womens-dresses",
    category_slug: "womens-dresses",
    thumbnail: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    ],
    description: "Maxi dress bertekstur pleats halus dengan lengan bishop yang manis. Sangat nyaman untuk momen istimewa atau silaturahmi formal.",
    stock: 28,
    is_featured: true,
    is_new: false,
  },
  {
    id: "zahra-linen-embroidered-tunic",
    slug: "zahra-linen-embroidered-tunic",
    title: "Zahra Embroidered Linen Tunic",
    price: 259000,
    originalPrice: 299000,
    discountPercentage: 13,
    rating: 4.88,
    category: "tops",
    category_slug: "tops",
    thumbnail: "https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80",
    ],
    description: "Tunik berkerah shanghai dengan sulaman bordir floral minimalis pada bagian dada dan manset. Menyerap keringat dan ramah iklim tropis.",
    stock: 42,
    is_featured: true,
    is_new: true,
  },
  {
    id: "marissa-croissant-shoulder-bag",
    slug: "marissa-croissant-shoulder-bag",
    title: "Marissa Minimalist Shoulder Bag Ivory",
    price: 315000,
    originalPrice: 395000,
    discountPercentage: 20,
    rating: 4.92,
    category: "womens-bags",
    category_slug: "womens-bags",
    thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
    ],
    description: "Tas bahu dengan bentuk siluet bulan sabit yang modern. Kulit vegan lembut anti gores dengan kompartemen luas untuk kebutuhan harian.",
    stock: 20,
    is_featured: true,
    is_new: false,
  },
  {
    id: "celine-kitten-heels-pointed",
    slug: "celine-kitten-heels-pointed",
    title: "Celine 5cm Pointed-Toe Kitten Heels",
    price: 299000,
    originalPrice: 350000,
    discountPercentage: 15,
    rating: 4.85,
    category: "womens-shoes",
    category_slug: "womens-shoes",
    thumbnail: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80",
    ],
    description: "Heels 5 cm dengan bantalan memory foam ekstra empuk yang tidak membuat kaki lelah saat dipakai beraktivitas.",
    stock: 25,
    is_featured: false,
    is_new: true,
  },
  {
    id: "luna-silk-shimmer-pashmina",
    slug: "luna-silk-shimmer-pashmina",
    title: "Luna Silk Shimmer Pashmina Rose Quartz",
    price: 89000,
    originalPrice: 115000,
    discountPercentage: 22,
    rating: 4.96,
    category: "womens-jewellery",
    category_slug: "womens-jewellery",
    thumbnail: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80",
    ],
    description: "Pashmina silk shimmer dengan kilau subtle elegan tanpa kesan berlebihan. Sangat mudah dibentuk dan tegak di dahi.",
    stock: 90,
    is_featured: true,
    is_new: true,
  },
  {
    id: "bloom-of-savannah-edp",
    slug: "bloom-of-savannah-edp",
    title: "Bloom of Savannah Eau De Parfum 50ml",
    price: 225000,
    originalPrice: 275000,
    discountPercentage: 18,
    rating: 4.94,
    category: "fragrances",
    category_slug: "fragrances",
    thumbnail: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80",
    ],
    description: "Wewangian signature Asri Collection dengan perpaduan French Rose, White Tea, dan Sandalwood hangat yang menenangkan.",
    stock: 45,
    is_featured: false,
    is_new: false,
  },
];

// Helper to normalize Supabase product entity
const normalizeProduct = (item) => {
  if (!item) return null;
  return {
    ...item,
    id: item.id || item.slug,
    category: item.category_slug || item.category || "womens-dresses",
    discountPercentage: item.discount_percentage ?? item.discountPercentage ?? 0,
    originalPrice: item.original_price ?? item.originalPrice ?? null,
    images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.thumbnail],
  };
};

/**
 * Fetch all products from Supabase with graceful fallback
 */
export const getProducts = async (limit = 30) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(normalizeProduct);
    }
  } catch (err) {
    console.warn("Supabase products fetch failed, using fallback:", err);
  }

  // Graceful fallback to dummyjson and local fallback
  try {
    const response = await fetch(`https://dummyjson.com/products?limit=${limit}`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        return data.products;
      }
    }
  } catch (e) {
    console.warn("dummyjson fetch failed:", e);
  }

  return FALLBACK_PRODUCTS;
};

/**
 * Get product by ID or Slug
 */
export const getProductById = async (id) => {
  if (!id) throw new Error("Product ID is required");

  // 1. Try querying Supabase
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from("products").select("*");

    if (isUuid) {
      query = query.eq("id", id);
    } else {
      query = query.or(`slug.eq.${id},id.eq.${id}`);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return normalizeProduct(data);
    }
  } catch (err) {
    console.warn("Supabase getProductById failed:", err);
  }

  // 2. Check local fallback products
  const localMatch = FALLBACK_PRODUCTS.find((p) => String(p.id) === String(id) || p.slug === id);
  if (localMatch) return localMatch;

  // 3. Fallback to dummyjson
  const response = await fetch(`https://dummyjson.com/products/${id}`);
  if (!response.ok) {
    throw new Error("Product not found");
  }
  return await response.json();
};

/**
 * Search products with query
 */
export const searchProducts = async (query = "", limit = 30) => {
  if (!query.trim()) return getProducts(limit);

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .ilike("title", `%${query.trim()}%`)
      .limit(limit);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(normalizeProduct);
    }
  } catch (err) {
    console.warn("Supabase search failed:", err);
  }

  // Local fallback search
  const localFiltered = FALLBACK_PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );
  if (localFiltered.length > 0) return localFiltered;

  try {
    const response = await fetch(
      `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.products || [];
    }
  } catch (e) {
    console.warn("dummyjson search failed:", e);
  }

  return [];
};

/**
 * Fetch products by category slug
 */
export const getProductsByCategory = async (category) => {
  if (!category || category === "all") {
    return getProducts(30);
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("category_slug", category);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(normalizeProduct);
    }
  } catch (err) {
    console.warn("Supabase category fetch failed:", err);
  }

  // Local fallback
  const localItems = FALLBACK_PRODUCTS.filter((p) => p.category_slug === category || p.category === category);
  if (localItems.length > 0) return localItems;

  try {
    const response = await fetch(
      `https://dummyjson.com/products/category/${encodeURIComponent(category)}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.products || [];
    }
  } catch (e) {
    console.warn("dummyjson category fetch failed:", e);
  }

  return [];
};

/**
 * Get all available categories
 */
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return [
        { value: "all", label: "Semua Kategori" },
        ...data.map((cat) => ({
          value: cat.slug,
          label: cat.name,
          image: cat.image_url,
        })),
      ];
    }
  } catch (err) {
    console.warn("Supabase categories fetch failed:", err);
  }

  // Default fallback categories
  return [
    { value: "all", label: "Semua Kategori" },
    ...FASHION_CATEGORIES.map((c) => ({
      value: c.slug,
      label: c.name,
      image: c.image,
    })),
  ];
};

/**
 * Get active promotional banners
 */
export const getBanners = async () => {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("Supabase banners fetch failed:", err);
  }

  return [
    {
      id: "b1",
      title: "Koleksi Anggun Raya 2026",
      subtitle: "Sentuhan keanggunan siluet modern berpadu dengan kemewahan material silk mulberry pilihan.",
      badge: "Koleksi Eksklusif",
      image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=85",
      link: "/products?category=womens-dresses",
      cta_text: "Eksplorasi Gaun",
    },
    {
      id: "b2",
      title: "Kemewahan Kasual Setiap Hari",
      subtitle: "Koleksi atasan katun bordir dan pashmina ceruty premium untuk penampilan bersahaja dan percaya diri.",
      badge: "Paling Diminati",
      image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&auto=format&fit=crop&q=85",
      link: "/products?category=tops",
      cta_text: "Lihat Koleksi Atasan",
    },
  ];
};

/**
 * Create order and order items in Supabase public.orders
 */
export const createOrderInSupabase = async ({ orderData, items = [] }) => {
  try {
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderErr) throw orderErr;

    if (items.length > 0 && order?.id) {
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId || null,
        title: item.title || item.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant || null,
        thumbnail: item.thumbnail || null,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsErr) {
        console.warn("Failed to insert order items:", itemsErr);
      }
    }

    return { success: true, order };
  } catch (err) {
    console.error("createOrderInSupabase error:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch order by merchant_order_id
 */
export const getOrderByMerchantId = async (merchantOrderId) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("merchant_order_id", merchantOrderId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("getOrderByMerchantId error:", err);
    return null;
  }
};

/**
 * Preload product images
 */
export const preloadProductImages = (products = []) =>
  Promise.all(
    products.map(
      (p) =>
        new Promise((resolve) => {
          const imgUrl = p.thumbnail || (p.images && p.images[0]);
          if (!imgUrl) return resolve();
          const image = new Image();
          image.onload = resolve;
          image.onerror = resolve;
          image.src = imgUrl;
        })
    )
  );
