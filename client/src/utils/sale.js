/**
 * Check if a course currently has an active sale.
 */
export function isSaleActive(course) {
  return (
    Number(course.discount_percent) > 0 &&
    course.sale_ends_at &&
    new Date(course.sale_ends_at) > new Date()
  );
}

/**
 * Compute the discounted sale price.
 */
export function getSalePrice(course) {
  const original = Number(course.price);
  const discount = Number(course.discount_percent);
  return Math.round(original * (1 - discount / 100) * 100) / 100;
}

/**
 * Get the time remaining until a sale ends.
 * Returns null if the sale has already expired.
 */
export function getTimeRemaining(saleEndsAt) {
  const diff = new Date(saleEndsAt) - new Date();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}
