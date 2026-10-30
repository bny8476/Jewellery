import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Clock, Info, ShieldCheck, ChevronDown, 
  ChevronUp, Tag, Sparkles, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';

interface PriceBreakdownCardProps {
  sellingPrice: number;
  originalMrp: number;
  savingsAmount: number;
  savingsPercent: number;
  baseMetalValue: number;
  stoneValue?: number;
  makingCharges: number;
  makingChargePercent: number;
  gstAmount: number;
  promotionalDiscount?: number;
  appliedMetalRate: number;
  metalPurityLabel: string;
  isLiveRate: boolean;
  isStaleRate?: boolean;
  rateTimestamp?: string;
  inStock: boolean;
  stockQuantity?: number;
  onOpenExplainerModal?: () => void;
}

export const PriceBreakdownCard: React.FC<PriceBreakdownCardProps> = ({
  sellingPrice,
  originalMrp,
  savingsAmount,
  savingsPercent,
  baseMetalValue,
  stoneValue = 0,
  makingCharges,
  makingChargePercent,
  gstAmount,
  promotionalDiscount = 0,
  appliedMetalRate,
  metalPurityLabel,
  isLiveRate,
  isStaleRate = false,
  rateTimestamp,
  inStock,
  stockQuantity,
  onOpenExplainerModal
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#FAF7F1] via-white to-[#F5EFE6] dark:from-[#1D1418] dark:via-[#170E12] dark:to-[#120B0E] border border-[#E7DEC8] dark:border-[#3E2D34] p-5 sm:p-6 shadow-sm space-y-4 select-none">
      {/* 1. Header: Status & Availability Pill */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#5B1022] dark:text-[#C49A50]">
          Authoritative All-Inclusive Price
        </span>

        {inStock ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{stockQuantity && stockQuantity <= 3 ? `Only ${stockQuantity} Left in Vault` : 'In Stock • Ready to Dispatch'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <span>Sold Out / Made to Order</span>
          </span>
        )}
      </div>

      {/* 2. Main Price Headline with Festive Privilege Discount */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <motion.div
          key={sellingPrice}
          initial={{ opacity: 0.6, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-[#5B1022] dark:text-[#C49A50] font-bold tracking-tight"
        >
          {formatCurrencyINR(sellingPrice)}
        </motion.div>

        {originalMrp > sellingPrice && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="line-through text-sm sm:text-base text-[#716A6C] dark:text-[#B5ABB0] font-normal">
              MRP {formatCurrencyINR(originalMrp)}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#5B1022]/10 dark:bg-[#C49A50]/15 text-[#5B1022] dark:text-[#C49A50] border border-[#5B1022]/20 dark:border-[#C49A50]/30 shadow-2xs">
              <Tag className="w-3 h-3 text-[#C49A50]" />
              <span>Save {formatCurrencyINR(savingsAmount)}</span>
              <span className="font-extrabold text-[#5B1022] dark:text-[#C49A50]">
                ({savingsPercent}% Off)
              </span>
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
        Transparent billing includes 100% pure raw metal, making charges, 3% statutory GST, and complimentary fully-insured transit.
      </p>

      {/* 3. Live Benchmark Metal Rate Strip */}
      <div className="pt-3 border-t border-[#E7DEC8] dark:border-[#3E2D34] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#252329] dark:text-[#FAF7F1]">
          <TrendingUp className="w-4 h-4 text-[#C49A50]" />
          <span className="text-[#716A6C] dark:text-[#B5ABB0]">Applied Benchmark Rate:</span>
          <strong className="font-bold text-[#5B1022] dark:text-[#C49A50]">
            ₹{Math.round(appliedMetalRate).toLocaleString('en-IN')}/g
          </strong>
          <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
            {metalPurityLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10.5px]">
          {isStaleRate ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Stale rate warning (IBJA daily lock)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isLiveRate ? 'Live Verified Stream' : 'IBJA Benchmark'}</span>
            </span>
          )}

          {rateTimestamp && (
            <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] font-mono">
              ({rateTimestamp})
            </span>
          )}
        </div>
      </div>

      {/* 4. Interactive Transparent Price Breakdown Accordion */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#5B1022] dark:text-[#C49A50] hover:text-[#7A1930] transition-colors cursor-pointer group"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C49A50]" />
            <span>{isAccordionOpen ? 'Hide Transparent Price Breakdown' : 'View Itemized Price Breakdown'}</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] group-hover:underline">
            <span>{isAccordionOpen ? 'Collapse' : 'Details'}</span>
            {isAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        <AnimatePresence>
          {isAccordionOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-4 rounded-2xl bg-white dark:bg-[#1A1115] border border-[#E7DEC8] dark:border-[#3E2D34] space-y-2.5 text-xs text-[#716A6C] dark:text-[#B5ABB0]">
                <div className="flex justify-between items-center pb-1 border-b border-[#E7DEC8]/50 dark:border-[#3E2D34]/50">
                  <span>Base Metal Value ({metalPurityLabel})</span>
                  <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">
                    {formatCurrencyINR(baseMetalValue)}
                  </span>
                </div>

                {stoneValue > 0 && (
                  <div className="flex justify-between items-center pb-1 border-b border-[#E7DEC8]/50 dark:border-[#3E2D34]/50">
                    <span>Certified Gemstones &amp; Solitaires</span>
                    <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">
                      {formatCurrencyINR(stoneValue)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pb-1 border-b border-[#E7DEC8]/50 dark:border-[#3E2D34]/50">
                  <span>Artistry &amp; Making Charges ({makingChargePercent}%)</span>
                  <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">
                    {formatCurrencyINR(makingCharges)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-1 border-b border-[#E7DEC8]/50 dark:border-[#3E2D34]/50">
                  <span>Statutory GST (1.5% CGST + 1.5% SGST)</span>
                  <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">
                    {formatCurrencyINR(gstAmount)}
                  </span>
                </div>

                {promotionalDiscount > 0 && (
                  <div className="flex justify-between items-center pb-1 border-b border-[#E7DEC8]/50 dark:border-[#3E2D34]/50 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Promotional Festive Discount (ROYAL20)</span>
                    <span>- {formatCurrencyINR(promotionalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-1 font-bold text-[#252329] dark:text-[#FAF7F1]">
                  <span className="text-sm">Final Payable Price</span>
                  <span className="font-serif text-base text-[#5B1022] dark:text-[#C49A50]">
                    {formatCurrencyINR(sellingPrice)}
                  </span>
                </div>

                {onOpenExplainerModal && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={onOpenExplainerModal}
                      className="text-[11px] text-[#C49A50] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Learn How YAZHINI Calibrates Live Jewellery Prices</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
