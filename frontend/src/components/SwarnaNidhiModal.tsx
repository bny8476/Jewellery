import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ShieldCheck, ArrowRight, Gift, Coins, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { toast } from '../utils/toast';

interface SwarnaNidhiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment?: () => void;
}

export const SwarnaNidhiModal: React.FC<SwarnaNidhiModalProps> = ({
  isOpen,
  onClose,
  onBookAppointment
}) => {
  const navigate = useNavigate();
  const { rates } = useRates();

  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [schemeMode, setSchemeMode] = useState<'value' | 'weight'>('value');

  if (!isOpen) return null;

  const rate22k = rates?.gold22k ? Math.round(rates.gold22k) : 13684;

  const totalPatronContribution = monthlyAmount * 11;
  const yazhiniBonusContribution = monthlyAmount; // 12th installment complimentary
  const totalMaturityValue = totalPatronContribution + yazhiniBonusContribution;

  // Weight mode calculations
  const totalGoldGramsAccumulated = Number(((totalPatronContribution + yazhiniBonusContribution) / rate22k).toFixed(3));

  const handleSelectPreset = (amt: number) => {
    setMonthlyAmount(amt);
    setCustomAmount(amt.toString());
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val);
    const num = parseInt(val) || 0;
    if (num >= 500) {
      setMonthlyAmount(num);
    }
  };

  const getSuggestedJewellery = (maturity: number) => {
    if (maturity < 35000) {
      return { title: '22K Gold Coin / Solitaire Nose Pin / Gold Ring', tag: 'Lightweight Heirloom' };
    } else if (maturity < 80000) {
      return { title: 'Designer Gold Kada / Antique Temple Pendant Set', tag: 'Daily Luxury' };
    } else if (maturity < 200000) {
      return { title: 'Traditional Kasu Bangle Pair / Polki Choker', tag: 'Auspicious Heritage' };
    } else {
      return { title: 'Grand Bridal Mango Malai / Heritage Wedding Trousseau', tag: 'Royal Wedding Suite' };
    }
  };

  const targetJewellery = getSuggestedJewellery(totalMaturityValue);

  const handleStartDigitalScheme = () => {
    onClose();
    navigate(`/auragold?tab=SIP&amount=${monthlyAmount}`);
    toast.success(`Redirected to Aura Gold SIP with monthly mandate of ₹${monthlyAmount.toLocaleString('en-IN')}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto text-[var(--text-main)]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Crest & Header */}
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C6A15B]/30 to-[#450817]/40 border border-[#C6A15B]/50 flex items-center justify-center text-[#C6A15B] shrink-0 shadow-inner">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-inter font-bold text-[var(--text-main)]">
                  YAZHINI Swarna Nidhi™
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30">
                  11-Month Easy Gold
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Pay for 11 months — YAZHINI contributes the 12th installment or waives up to 18% making charges!
              </p>
            </div>
          </div>

          {/* Mode Switcher: Value Plan vs Gold Weight Plan */}
          <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-color)] mb-6">
            <button
              type="button"
              onClick={() => setSchemeMode('value')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                schemeMode === 'value'
                  ? 'bg-[var(--gold-primary)] text-black font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              Mode A: Value Growth (+1 Month Free Installment)
            </button>
            <button
              type="button"
              onClick={() => setSchemeMode('weight')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                schemeMode === 'weight'
                  ? 'bg-[var(--gold-primary)] text-black font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              Mode B: Gold Weight Lock (Rate Inflation Hedge)
            </button>
          </div>

          {/* Installment Presets */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <label className="font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Select Monthly Installment
                </label>
                <span className="font-mono font-bold text-[var(--gold-primary)] text-sm">
                  ₹{monthlyAmount.toLocaleString('en-IN')}/month
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {[2000, 5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      monthlyAmount === amt
                        ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] font-bold shadow-xs'
                        : 'border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">₹{(amt / 1000)}k</span>
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[var(--text-secondary)]">₹</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="Enter custom monthly amount (min ₹1,000)"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Scheme Projection Ledger Card */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/30 rounded-2xl p-5 mb-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Your Contribution (11 Months × ₹{monthlyAmount.toLocaleString('en-IN')}):</span>
              <span className="font-mono font-bold text-sm text-[var(--text-main)]">{formatCurrencyINR(totalPatronContribution)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-1 font-semibold">
                <Gift className="w-3.5 h-3.5" /> YAZHINI 12th Month Bonus Contribution:
              </span>
              <span className="font-mono font-bold">+{formatCurrencyINR(yazhiniBonusContribution)}</span>
            </div>

            {schemeMode === 'weight' && (
              <div className="flex items-center justify-between text-xs text-[#C6A15B]">
                <span className="flex items-center gap-1 font-semibold">
                  <Coins className="w-3.5 h-3.5" /> Total 22K Gold Accumulated (Hedged @ ₹{rate22k}/g):
                </span>
                <span className="font-mono font-bold">{totalGoldGramsAccumulated} grams</span>
              </div>
            )}

            <div className="pt-3.5 border-t border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] block">
                  Total Maturity Jewellery Purchasing Power
                </span>
                <span className="text-2xl font-inter font-bold text-gold-gradient">
                  {formatCurrencyINR(totalMaturityValue)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-semibold block flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Guaranteed Purity
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Zero deduction on 916 BIS Hallmark</span>
              </div>
            </div>

            {/* Target Jewellery Preview */}
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--gold-primary)] font-bold block">
                  Projected Jewellery Match ({targetJewellery.tag})
                </span>
                <span className="font-semibold text-[var(--text-main)] text-xs">
                  {targetJewellery.title}
                </span>
              </div>
              <Sparkles className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
            </div>
          </div>

          {/* Scheme Trust Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--text-secondary)] mb-6">
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60 border border-[var(--border-color)]">
              <span className="font-bold text-[var(--text-main)] block mb-0.5">Flexible Redemption</span>
              <span>Online or any Showroom</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60 border border-[var(--border-color)]">
              <span className="font-bold text-[var(--text-main)] block mb-0.5">0% Making Charges</span>
              <span>Waiver up to 18%</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]/60 border border-[var(--border-color)]">
              <span className="font-bold text-[var(--text-main)] block mb-0.5">Full Vault Safety</span>
              <span>IDBI Bank Vault Insured</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleStartDigitalScheme}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[var(--gold-primary)] hover:bg-[var(--gold-primary)]/90 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>Enroll Online via Aura Gold</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onBookAppointment) onBookAppointment();
              }}
              className="w-full sm:w-auto py-3 px-5 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              <span>Book Showroom Enrollment</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
