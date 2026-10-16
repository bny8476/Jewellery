/**
 * Consolidated formatters for currency, dates, numbers, and weights.
 * Standardized for Indian Rupee (INR) and luxury jewelry / financial data.
 */

export interface CurrencyFormatOptions {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  showPaise?: boolean;
}

/**
 * Formats a numeric amount into Indian Rupee (INR) currency format with ₹ symbol and Indian grouping.
 * @example formatCurrencyINR(115000) => "₹1,15,000"
 * @example formatCurrencyINR(1250.5, { showPaise: true }) => "₹1,250.50"
 */
export const formatCurrencyINR = (
  amount: number | null | undefined,
  options?: CurrencyFormatOptions
): string => {
  const valid = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const isFractional = valid % 1 !== 0;
  const minDigits = options?.minimumFractionDigits ?? (options?.showPaise ? 2 : (isFractional ? 2 : 0));
  const maxDigits = options?.maximumFractionDigits ?? (options?.showPaise ? 2 : (isFractional ? 2 : 0));

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: minDigits
  }).format(valid);
};

/**
 * Formats a metal rate per gram or per specified unit.
 * @example formatRatePerGram(7250) => "₹7,250/g"
 * @example formatRatePerGram(72500, '10g') => "₹72,500/10g"
 */
export const formatRatePerGram = (
  rate: number | null | undefined,
  unit: string = 'g'
): string => {
  const formatted = formatCurrencyINR(rate, { maximumFractionDigits: 2 });
  return `${formatted}/${unit}`;
};

/**
 * Formats numbers into the Indian numbering system without currency symbol.
 * @example formatNumberIndian(115000) => "1,15,000"
 * @example formatNumberIndian(12.45, 2) => "12.45"
 */
export const formatNumberIndian = (
  value: number | null | undefined,
  fractionDigits: number = 0
): string => {
  const valid = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  }).format(valid);
};

/**
 * Safely formats date strings or Date instances into Indian locale representation.
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
 * Formats bullion and jewelry weight in grams or carats with clean numerical precision.
 * @example formatWeight(10.5) => "10.50 g"
 * @example formatWeight(1.25, 'ct') => "1.25 ct"
 */
export const formatWeight = (
  weight: number | null | undefined,
  unit: 'g' | 'ct' | 'kg' = 'g'
): string => {
  const valid = typeof weight === 'number' && Number.isFinite(weight) ? weight : 0;
  return `${valid.toFixed(2)} ${unit}`;
};

/**
 * Formats percentage change with sign and decimal precision.
 * @example formatPercentChange(2.45) => "+2.45%"
 * @example formatPercentChange(-1.2) => "-1.20%"
 */
export const formatPercentChange = (
  percent: number | null | undefined,
  precision: number = 2
): string => {
  const valid = typeof percent === 'number' && Number.isFinite(percent) ? percent : 0;
  const sign = valid > 0 ? '+' : '';
  return `${sign}${valid.toFixed(precision)}%`;
};
