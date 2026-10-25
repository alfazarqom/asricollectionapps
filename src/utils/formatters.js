/**
 * Utility formatters for Asri Collection
 */

export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) return 'Rp 0';
  // If price is large (already IDR), format directly; otherwise convert USD rate (~15,000)
  const numPrice = Number(price);
  const idrAmount = numPrice > 1000 ? numPrice : Math.round(numPrice * 15000);
  return `Rp ${idrAmount.toLocaleString('id-ID')}`;
};

export const formatPriceUSD = (price) => {
  if (price === null || price === undefined || isNaN(price)) return '$0.00';
  return `$${Number(price).toFixed(2)}`;
};

export const calculateOriginalPrice = (salePrice, discountPercentage = 15) => {
  if (!salePrice) return 0;
  const discount = Number(discountPercentage) || 15;
  return Math.round(salePrice / (1 - discount / 100));
};

export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
