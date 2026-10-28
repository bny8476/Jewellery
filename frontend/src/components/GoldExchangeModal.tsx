import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Sparkles, ShieldCheck, ArrowRight, Copy, CheckCircle2 } from 'lucide-react';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { toast } from '../utils/toast';
import { useScrollLock } from '../utils/useScrollLock';

interface GoldExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment?: () => void;
}

export const GoldExchangeModal: React.FC<GoldExchangeModalProps> = ({
  isOpen,
  onClose,
  onBookAppointment
}) => {
  useScrollLock(isOpen, { onEscape: onClose });
  const { rates } = useRates();

  const [purity, setPurity] = useState<'22k' | '24k' | '18k' | '14k'>('22k');
  const [grossWeight, setGrossWeight] = useState<string>('15');
  const [stoneWeight, setStoneWeight] = useState<string>('0');
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  if (!isOpen) return null;

  // Rate per gram mapping
  const rate24k = rates?.gold ? Math.round(rates.gold) : 14928;
  const rate22k = rates?.gold22k ? Math.round(rates.gold22k) : 13684;
  const rate18k = rates?.gold18k ? Math.round(rates.gold18k) : 11207;
  const rate14k = Math.round((rate24k * 14) / 24);

  const activeRate = 
    purity === '24k' ? rate24k :
    purity === '22k' ? rate22k :
    purity === '18k' ? rate18k : rate14k;

  const gross = Math.max(0, parseFloat(grossWeight) || 0);
  const stone = Math.max(0, parseFloat(stoneWeight) || 0);
  const netWeight = Math.max(0, gross - stone);

  const baseGoldValue = Math.round(netWeight * activeRate);
  // YAZHINI 2% Showroom Trade-in Bonus on 916 / 750 / 999
  const upgradeBonus = Math.round(baseGoldValue * 0.02);
  const totalExchangeCredit = baseGoldValue + upgradeBonus;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('EXCHANGE5');
    setCopiedVoucher(true);
    toast.success('Voucher EXCHANGE5 copied (Extra 5% off making charges)');
    setTimeout(() => setCopiedVoucher(false), 3000);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto text-[var(--text-main)]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-500 hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-start sm:items-center gap-3.5 mb-6 border-b border-[var(--border-color)] pb-4 pr-10">
            <div className="w-11 h-11 rounded-2xl bg-[#8C6D37]/15 dark:bg-[var(--gold-primary)]/15 border border-[#8C6D37]/30 dark:border-[var(--gold-primary)]/30 flex items-center justify-center text-[#8C6D37] dark:text-[#EED2A2] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">Old Gold Exchange Calculator</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  Zero Deduction
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-[var(--text-secondary)] mt-1 leading-relaxed">
                Joyalukkas-standard 100% full market value on BIS 916 gold + 2% YAZHINI upgrade bonus
              </p>
            </div>
          </div>

          {/* Calculator Inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Select Gold Carat / Purity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '22k', label: '22K (916)', sub: 'Hallmark', rate: rate22k },
                  { id: '24k', label: '24K (999)', sub: 'Fine Gold', rate: rate24k },
                  { id: '18k', label: '18K (750)', sub: 'Diamond', rate: rate18k },
                  { id: '14k', label: '14K (585)', sub: 'Modern', rate: rate14k },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPurity(item.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      purity === item.id
                        ? 'border-[#35172F] bg-[#35172F] text-white dark:border-[#D8B878] dark:bg-[#D8B878] dark:text-[#120D0F] font-bold shadow-xs'
                        : 'border-[var(--border-color)] bg-[var(--bg-elevated)] text-stone-700 dark:text-stone-300 hover:border-stone-400'
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">{item.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${purity === item.id ? 'text-white/80 dark:text-black/80 font-medium' : 'text-stone-600 dark:text-stone-400'}`}>
                      ₹{item.rate}/g
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="h-5 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                  <span>Gross Weight</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal lowercase">(total jewellery)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    placeholder="e.g. 15.5"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[#8C6D37]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 pointer-events-none">g</span>
                </div>
              </div>

              <div>
                <label className="h-5 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                  <span>Stone / Enamel Weight</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal lowercase">(deduction)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stoneWeight}
                    onChange={(e) => setStoneWeight(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[#8C6D37]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 pointer-events-none">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Valuation Results Card */}
          <div className="bg-[var(--bg-elevated)] border border-[#C6A15B]/30 dark:border-[var(--gold-primary)]/30 rounded-2xl p-5 mb-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
              <span className="font-medium">Net Pure Gold Weight:</span>
              <span className="font-mono font-bold text-sm text-[var(--text-main)]">{netWeight.toFixed(2)} grams</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
              <span className="font-medium">Live Market Bullion Rate ({purity.toUpperCase()}):</span>
              <span className="font-mono font-bold text-sm text-[var(--text-main)]">₹{activeRate.toLocaleString('en-IN')}/g</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
              <span className="font-medium">Base Gold Valuation:</span>
              <span className="font-mono font-bold text-sm text-[var(--text-main)]">{formatCurrencyINR(baseGoldValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>YAZHINI 2% Showroom Trade-In Bonus:</span>
              </span>
              <span className="font-mono font-bold text-sm">+{formatCurrencyINR(upgradeBonus)}</span>
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-600 dark:text-stone-400 block mb-0.5">
                  Total Exchange Credit Value
                </span>
                <span className="text-2xl font-serif font-bold text-[#8C6D37] dark:text-[#EED2A2]">
                  {formatCurrencyINR(totalExchangeCredit)}
                </span>
              </div>
              <div className="sm:text-right space-y-0.5">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 sm:justify-end">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>100% Value Guarantee</span>
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">
                  Zero melting loss on 916 Hallmarked gold
                </span>
              </div>
            </div>
          </div>

          {/* Privilege Code Callout */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-[var(--gold-primary)]/10 border border-amber-200 dark:border-[var(--gold-primary)]/30 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-stone-900 dark:text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8C6D37] dark:text-[#EED2A2] shrink-0" />
                <span>Special Exchange Privilege Code</span>
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 mt-1">
                Use code <span className="font-mono font-bold text-[#8C6D37] dark:text-[#EED2A2] bg-[#8C6D37]/10 dark:bg-amber-400/15 px-2 py-0.5 rounded border border-[#8C6D37]/20">EXCHANGE5</span> at checkout for an extra 5% off making charges.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl bg-[#35172F] hover:bg-[#4A2242] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedVoucher ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedVoucher ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onBookAppointment) onBookAppointment();
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#35172F] hover:bg-[#4A2242] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>Book In-Store Valuation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-[var(--border-color)] hover:border-stone-400 bg-[var(--bg-card)] text-stone-700 dark:text-stone-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
