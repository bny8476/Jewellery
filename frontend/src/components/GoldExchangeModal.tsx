import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Sparkles, ShieldCheck, ArrowRight, Copy, CheckCircle2 } from 'lucide-react';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { toast } from '../utils/toast';

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
  const { rates } = useRates();

  const [purity, setPurity] = useState<'22k' | '24k' | '18k' | '14k'>('22k');
  const [grossWeight, setGrossWeight] = useState<string>('15');
  const [stoneWeight, setStoneWeight] = useState<string>('0');
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  if (!isOpen) return null;

  // Rate per gram mapping
  const rate24k = rates?.gold || 7850;
  const rate22k = rates?.gold22k || 7200;
  const rate18k = rates?.gold18k || 5900;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/30 flex items-center justify-center text-[var(--gold-primary)]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">Old Gold Exchange Calculator</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Zero Deduction
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Joyalukkas-standard 100% full market value on BIS 916 gold + 2% YAZHINI upgrade bonus
              </p>
            </div>
          </div>

          {/* Calculator Inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Select Gold Carat / Purity
              </label>
              <div className="grid grid-cols-4 gap-2">
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
                        ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] font-bold shadow-xs'
                        : 'border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">{item.label}</span>
                    <span className="block text-[10px] opacity-75 mt-0.5">₹{item.rate}/g</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Gross Weight (Grams)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    placeholder="e.g. 15.5"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[var(--text-secondary)]">g</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Stone / Enamel Weight (Grams)</span>
                  <span className="text-[10px] text-[var(--text-muted)] lowercase">deduction</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={stoneWeight}
                    onChange={(e) => setStoneWeight(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[var(--text-secondary)]">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Valuation Results Card */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/30 rounded-2xl p-5 mb-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Net Pure Gold Weight:</span>
              <span className="font-mono font-bold text-sm text-[var(--text-main)]">{netWeight.toFixed(2)} grams</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Live Market Bullion Rate ({purity.toUpperCase()}):</span>
              <span className="font-mono font-semibold text-[var(--text-main)]">₹{activeRate.toLocaleString('en-IN')}/g</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Base Gold Valuation:</span>
              <span className="font-mono font-semibold text-[var(--text-main)]">{formatCurrencyINR(baseGoldValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> YAZHINI 2% Showroom Trade-In Bonus:
              </span>
              <span className="font-mono font-bold">+{formatCurrencyINR(upgradeBonus)}</span>
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] block">
                  Total Exchange Credit Value
                </span>
                <span className="text-xl font-serif font-bold text-gold-gradient">
                  {formatCurrencyINR(totalExchangeCredit)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-semibold block flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Value Guarantee
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">No melting loss on 916 Hallmarked gold</span>
              </div>
            </div>
          </div>

          {/* Privilege Code Callout */}
          <div className="p-3.5 rounded-xl bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 mb-5 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" /> Special Exchange Privilege Code
              </span>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                Use code <span className="font-mono font-bold text-[var(--gold-primary)]">EXCHANGE5</span> at checkout for an extra 5% off making charges.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--gold-primary)]/40 text-[var(--gold-primary)] text-xs font-bold hover:bg-[var(--gold-primary)] hover:text-black transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedVoucher ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedVoucher ? 'Copied' : 'Copy'}
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
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/90 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>Book In-Store Valuation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
