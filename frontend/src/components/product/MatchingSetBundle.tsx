import React, { useState } from 'react';
import { Plus, Check, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { JewelryItem } from '../../lib/supabase';
import { formatCurrencyINR } from '../../utils/formatters';

interface MatchingSetBundleProps {
  primaryProduct: JewelryItem;
  primaryPrice: number;
  companionProduct: JewelryItem;
  companionPrice: number;
  onAddBundleToCart: (primary: JewelryItem, companion: JewelryItem) => void;
}

export const MatchingSetBundle: React.FC<MatchingSetBundleProps> = ({
  primaryProduct,
  primaryPrice,
  companionProduct,
  companionPrice,
  onAddBundleToCart
}) => {
  const [includeCompanion, setIncludeCompanion] = useState(true);

  // 5% Ensemble Bundle discount on combined value
  const combinedRawTotal = primaryPrice + (includeCompanion ? companionPrice : 0);
  const bundleDiscount = includeCompanion ? Math.round(combinedRawTotal * 0.05) : 0;
  const finalBundlePrice = combinedRawTotal - bundleDiscount;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#FAF7F1] via-white to-[#F5EFE6] dark:from-[#1D1418] dark:via-[#170E12] dark:to-[#120B0E] border border-[#E7DEC8] dark:border-[#3E2D34] p-6 shadow-sm select-none space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C49A50]" />
          <h3 className="font-serif text-base font-bold text-[#5B1022] dark:text-[#C49A50] tracking-wide">
            Complete the Royal Ensemble
          </h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          Bundle &amp; Save 5%
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Products Pairing Visual */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Primary Item */}
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] flex-1 sm:flex-initial">
            <img
              src={primaryProduct.image_url || '/images/cat_gold.jpg'}
              alt={primaryProduct.name}
              className="w-14 h-14 object-contain rounded-xl bg-[#FAF7F1] dark:bg-[#201519]"
            />
            <div className="text-left pr-2">
              <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] block font-medium">This Design</span>
              <p className="text-xs font-bold text-[#252329] dark:text-[#FAF7F1] truncate max-w-[120px]">
                {primaryProduct.name}
              </p>
              <span className="font-serif text-xs font-bold text-[#5B1022] dark:text-[#C49A50]">
                {formatCurrencyINR(primaryPrice)}
              </span>
            </div>
          </div>

          <div className="w-7 h-7 rounded-full bg-[#FAF7F1] dark:bg-[#201519] border border-[#C49A50]/40 flex items-center justify-center text-[#C49A50] shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </div>

          {/* Companion Item */}
          <label className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] cursor-pointer hover:border-[#C49A50] transition-colors flex-1 sm:flex-initial">
            <input
              type="checkbox"
              checked={includeCompanion}
              onChange={(e) => setIncludeCompanion(e.target.checked)}
              className="w-4 h-4 accent-[#5B1022] dark:accent-[#C49A50] rounded cursor-pointer"
            />
            <img
              src={companionProduct.image_url || '/images/cat_traditional.jpg'}
              alt={companionProduct.name}
              className="w-14 h-14 object-contain rounded-xl bg-[#FAF7F1] dark:bg-[#201519]"
            />
            <div className="text-left pr-2">
              <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] block font-medium">Matching Piece</span>
              <p className="text-xs font-bold text-[#252329] dark:text-[#FAF7F1] truncate max-w-[120px]">
                {companionProduct.name}
              </p>
              <span className="font-serif text-xs font-bold text-[#5B1022] dark:text-[#C49A50]">
                {formatCurrencyINR(companionPrice)}
              </span>
            </div>
          </label>
        </div>

        {/* Pricing Summary & Action */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E7DEC8] dark:border-[#3E2D34]">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] block">
              Combined Total ({includeCompanion ? '2 items' : '1 item'})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-lg font-bold text-[#5B1022] dark:text-[#C49A50]">
                {formatCurrencyINR(finalBundlePrice)}
              </span>
              {bundleDiscount > 0 && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold line-through">
                  {formatCurrencyINR(combinedRawTotal)}
                </span>
              )}
            </div>
            {bundleDiscount > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">
                Save {formatCurrencyINR(bundleDiscount)} on Ensemble
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAddBundleToCart(primaryProduct, companionProduct)}
            className="px-4 py-2.5 rounded-xl bg-[#5B1022] hover:bg-[#7A1930] text-white dark:bg-[#C49A50] dark:hover:bg-[#D5AD63] dark:text-[#140E10] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add Ensemble to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
