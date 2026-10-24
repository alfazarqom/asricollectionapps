// Fetch all products with optional limit
export const getProducts = async (limit = 20) => {
  const response = await fetch(`https://dummyjson.com/products?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Something went wrong");
  }
  const data = await response.json();
  return data.products;
};

//Product Details
export const getProductById = async (id) => {
  const response = await fetch(`https://dummyjson.com/products/${id}`);

  if (!response.ok) {
    throw new Error("Product not found");
  }

  const data = await response.json();

  return data;
};

// Fetch products by category
export const getProductsByCategory = async (category) => {
  if (category === "all") {
    return getProducts();
  }
  const response = await fetch(
    `https://dummyjson.com/products/category/${category}`,
  );

  if (!response.ok) {
    throw new Error("Something went wrong fetching category");
  }
  const data = await response.json();
  return data.products || [];
};

// Get all available categories
export const getCategories = async () => {
  try {
    const response = await fetch("https://dummyjson.com/products/categories");
    if (!response.ok) {
      throw new Error("Something went wrong");
    }
    const categories = await response.json();
    // Format categories for dropdown
    return [
      { value: "all", label: "All Categories" },
      ...categories.map((cat) => ({
        value: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " "),
      })),
    ];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Preload product images
export const preloadProductImages = (products) =>
  Promise.all(
    products.map(
      ({ thumbnail }) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = resolve;
          image.onerror = resolve;
          image.src = thumbnail;
        }),
    ),
  );
