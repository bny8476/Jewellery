/**
 * Consolidated formatters for currency, dates, numbers, and weights.
 * Used across storefront, cart, checkout, invoices, and admin ERP.
 */

/**
 * Formats a numeric amount into Indian Rupee (INR) currency format with ₹ symbol and grouping.
 * @example formatCurrencyINR(50000) => "₹50,000"
 */
export const formatCurrencyINR = (
  amount: number | null | undefined,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string => {
  const valid = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0
  }).format(valid);
};

/**
 * Safely formats date strings or Date instances into Indian locale representation.
 * Returns empty string on null, undefined, or invalid date values.
 * @example formatDate('2024-03-15') => "15/3/2024"
 */
export const formatDate = (
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', options);
};

/**
 * Formats bullion and jewelry weight in grams with standard 2-decimal precision.
 * @example formatWeight(10.5) => "10.50 g"
 */
export const formatWeight = (grams: number | null | undefined): string => {
  const valid = typeof grams === 'number' && Number.isFinite(grams) ? grams : 0;
  return `${valid.toFixed(2)} g`;
};
