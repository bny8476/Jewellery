import React from 'react';
import { formatCurrencyINR } from '../../utils/formatters';

export type NumberVariant = 
  | 'price-product'    // Style A: jewellery cards, product details
  | 'price-featured'   // Style A+: hero or featured luxury card price
  | 'number-editorial' // Style B: statistics, hero banner numbers
  | 'rate-financial'   // Style C: live rates, gold ticker, wallet balances
  | 'price-total'      // Style D: checkout total, cart subtotal, loan total
  | 'number-supporting'// Style E: weight, making charges, order IDs, timestamps
  | 'number-promotion';// Style F: savings, discount percentages, offers

export interface PriceTagProps {
  amount: number | null | undefined;
  variant?: NumberVariant;
  className?: string;
  showPaise?: boolean;
  unit?: string;
  prefix?: string;
  isStrikethrough?: boolean;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  variant = 'price-product',
  className = '',
  showPaise = false,
  unit,
  prefix,
  isStrikethrough = false,
}) => {
  const formatted = formatCurrencyINR(amount, { showPaise });

  return (
    <span 
      className={`inline-flex items-baseline ${variant} ${isStrikethrough ? 'line-through opacity-70' : ''} ${className}`}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span>{formatted}</span>
      {unit && <span className="text-[0.78em] font-normal opacity-85 ml-0.5">{unit}</span>}
    </span>
  );
};

export default PriceTag;
