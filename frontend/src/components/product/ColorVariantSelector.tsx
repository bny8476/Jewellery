import React from 'react';
import { Check } from 'lucide-react';
import { ProductVariant } from '../../types/productGallery';
import { formatCurrencyINR } from '../../utils/formatters';

interface ColorVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
}

export const ColorVariantSelector: React.FC<ColorVariantSelectorProps> = ({
  variants,
  selectedVariant,
  onSelectVariant
}) => {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-2.5 py-2 select-none" id="colour-variant-selector">
      {/* Header: Dynamic Colour name (Matching Reference Screenshot: "Colour: Rose Gold") */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-[#252329] dark:text-[#FAF7F1]">
          <span>Colour:</span>
          <span className="font-bold text-[#5B1022] dark:text-[#C49A50]">
            {selectedVariant?.color || variants[0]?.color}
          </span>
        </div>
        {selectedVariant && (
          <span className="font-mono text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
            SKU: {selectedVariant.sku}
          </span>
        )}
      </div>

      {/* Variant Cards Strip (Matching Reference Layout: Side-by-side tiles with thumbnail + price + MRP) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
        {variants.map((v) => {
          const isSelected = selectedVariant?.id === v.id;
          const isAvailable = v.available && v.stock > 0;
          const previewImg = v.thumbnailUrl || (v.images && v.images[0]?.url) || '/images/cat_gold.jpg';

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVariant(v)}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between group relative ${
                isSelected
                  ? 'border-[#007185] dark:border-[#C49A50] ring-2 ring-[#007185]/30 dark:ring-[#C49A50]/40 bg-white dark:bg-[#1D1418] shadow-sm'
                  : 'border-[#E7DEC8] dark:border-[#3E2D34] bg-white dark:bg-[#170E12] hover:border-[#007185]/60 dark:hover:border-[#C49A50]/60'
              } ${!isAvailable ? 'opacity-60' : ''}`}
              title={`${v.color} - ${formatCurrencyINR(v.price)}`}
              aria-label={`Select ${v.color} variant`}
              aria-pressed={isSelected ? 'true' : 'false'}
            >
              {/* Variant Thumbnail */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-1 mb-1.5 relative">
                <img
                  src={previewImg}
                  alt={`${v.color} finish`}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/cat_gold.jpg';
                  }}
                />

                {/* Color Pip Indicator */}
                <span
                  className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white/80 dark:border-black/60 shadow-xs"
                  style={{ backgroundColor: v.colorCode }}
                  title={v.color}
                />
              </div>

              {/* Variant Details */}
              <div className="w-full text-center space-y-0.5">
                <span className={`block text-[11px] font-semibold truncate ${
                  isSelected ? 'text-[#007185] dark:text-[#C49A50]' : 'text-[#252329] dark:text-[#FAF7F1]'
                }`}>
                  {v.color}
                </span>

                <div className="text-[11px] font-bold text-[#252329] dark:text-[#FAF7F1] leading-tight">
                  {formatCurrencyINR(v.price)}
                </div>

                {v.mrp > v.price && (
                  <div className="text-[9.5px] text-[#716A6C] dark:text-[#B5ABB0] line-through">
                    {formatCurrencyINR(v.mrp)}
                  </div>
                )}

                {!isAvailable && (
                  <span className="inline-block text-[9px] text-rose-600 font-bold uppercase">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Active Selection Checkmark Indicator */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#007185] dark:bg-[#C49A50] text-white dark:text-black flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorVariantSelector;
