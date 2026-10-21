import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calculator, Info, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { modalBackdropVariants, modalContentVariants } from '../utils/motion';
import { useScrollLock } from '../utils/useScrollLock';

import { LiveRateCard } from './LiveRateCard';

interface PriceBreakdownExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number;
  initialPurity?: string;
}

export const PriceBreakdownExplainerModal: React.FC<PriceBreakdownExplainerModalProps> = ({
  isOpen,
  onClose,
  initialWeight = 10,
  initialPurity = '22K'
}) => {
  const { rates, isLive, lastUpdated } = useRates();
  const [weight, setWeight] = useState<number>(initialWeight);
  const [purity, setPurity] = useState<string>(initialPurity);
  const [makingChargePercent, setMakingChargePercent] = useState<number>(12); // standard 12% making charge
  const [stoneValue, setStoneValue] = useState<number>(0);

  useScrollLock(isOpen, { onEscape: onClose });

  // Calculate rate based on purity
  let baseRatePerGram = rates.gold22k;
  if (purity === '24K') baseRatePerGram = rates.gold;
  else if (purity === '22K') baseRatePerGram = rates.gold22k;
  else if (purity === '18K') baseRatePerGram = Math.round(rates.gold * 0.75);
  else if (purity === 'Silver') baseRatePerGram = rates.silver;
  else if (purity === 'Platinum') baseRatePerGram = rates.platinum;

  const rawMetalValue = Math.round(weight * baseRatePerGram);
  const makingCharges = Math.round(rawMetalValue * (makingChargePercent / 100));
  const subtotal = rawMetalValue + makingCharges + Number(stoneValue || 0);
  const gstAmount = Math.round(subtotal * 0.03); // 3% GST on jewellery in India
  const finalPrice = subtotal + gstAmount;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[1300] overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div 
            variants={modalContentVariants}
            className="relative bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#C69A8B]/30 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-breakdown-title"
          >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Close pricing breakdown modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 flex items-center justify-center text-[#702638] dark:text-[#E8A598]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 id="pricing-breakdown-title" className="font-serif text-xl sm:text-2xl font-semibold text-[#702638] dark:text-[#FAF5F0]">
              Transparent Jewellery Pricing Formula
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Benchmark Bullion Rate vs. Final Retail Jewellery Price
            </p>
          </div>
        </div>

        {/* Live 24K Benchmark Card */}
        <div className="mb-5">
          <LiveRateCard showExtended={false} />
        </div>

        {/* Education Note */}
        <div className="bg-[#702638]/5 dark:bg-[#702638]/20 border border-[#C69A8B]/30 rounded-xl p-4 mb-6 text-xs leading-relaxed space-y-2">
          <div className="flex items-start gap-2 font-medium text-[#702638] dark:text-[#E8A598]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>How is authentic Indian jewellery priced?</span>
          </div>
          <p className="text-stone-600 dark:text-stone-300">
            Raw bullion trading rates reflect pure 24K unworked bars. Wearable handcrafted jewellery requires 
            refining into durable purities (such as 22K 916 BIS Hallmark), master artisan handcrafting (making charges / wastage), 
            certified stones, and statutory 3% GST. At YAZHINI Fine Jewels, we provide 100% uninflated, transparent price tags.
          </p>
        </div>

        {/* Interactive Pricing Calculator */}
        <div className="bg-white dark:bg-[#242424] rounded-xl p-5 border border-stone-200 dark:border-stone-800 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#702638] dark:text-[#C69A8B] mb-4 flex items-center justify-between">
            <span>Live Price Estimator</span>
            <span className="text-[11px] font-normal text-stone-500 lowercase">
              {isLive ? '● live market rate' : '● benchmark standard'} ({lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-IN') : 'Today'})
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                Precious Metal Purity
              </label>
              <select
                value={purity}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#702638]"
              >
                <option value="22K">22K Gold (916 BIS Hallmark) - ₹{rates.gold22k.toLocaleString('en-IN')}/g</option>
                <option value="24K">24K Pure Gold (999 Purity) - ₹{rates.gold.toLocaleString('en-IN')}/g</option>
                <option value="18K">18K Diamond Jewellery Gold - ₹{Math.round(rates.gold * 0.75).toLocaleString('en-IN')}/g</option>
                <option value="Silver">999 Silver - ₹{rates.silver.toLocaleString('en-IN')}/g</option>
                <option value="Platinum">950 Platinum - ₹{rates.platinum.toLocaleString('en-IN')}/g</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                Net Metal Weight (Grams)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#702638]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                Making Charges / Artistry (%)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={makingChargePercent}
                onChange={(e) => setMakingChargePercent(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#702638]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                Stone / Gemstone Value (₹ Optional)
              </label>
              <input
                type="number"
                min="0"
                value={stoneValue}
                onChange={(e) => setStoneValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#702638]"
              />
            </div>
          </div>

          {/* Breakdown receipt */}
          <div className="border-t border-dashed border-stone-200 dark:border-stone-700 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Net Metal Value ({weight}g × ₹{baseRatePerGram.toLocaleString('en-IN')})</span>
              <span className="font-medium number-supporting text-stone-900 dark:text-stone-100">{formatCurrencyINR(rawMetalValue)}</span>
            </div>

            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Making &amp; Wastage Charges ({makingChargePercent}%)</span>
              <span className="font-medium number-supporting text-stone-900 dark:text-stone-100">+{formatCurrencyINR(makingCharges)}</span>
            </div>

            {stoneValue > 0 && (
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Certified Gemstones / Diamonds</span>
                <span className="font-medium number-supporting text-stone-900 dark:text-stone-100">+{formatCurrencyINR(stoneValue)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Statutory Goods &amp; Services Tax (3% GST)</span>
              <span className="font-medium number-supporting text-stone-900 dark:text-stone-100">+{formatCurrencyINR(gstAmount)}</span>
            </div>

            <div className="flex justify-between text-sm sm:text-base font-bold text-[#702638] dark:text-[#E8A598] pt-2 border-t border-stone-200 dark:border-stone-700">
              <span>Estimated Retail Price</span>
              <span className="price-total">{formatCurrencyINR(finalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-[11px]">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>BIS 916 Laser Hallmarked</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero Hidden Deductions</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-100 dark:bg-stone-900/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Buyback Value on Gold</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#702638] hover:bg-[#541C2A] text-white transition-colors flex items-center gap-1.5 shadow-md"
          >
            <span>Explore Certified Jewellery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
