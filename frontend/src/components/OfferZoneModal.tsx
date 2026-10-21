import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, Tag, Copy, CheckCircle2, Calendar, 
  ArrowRight, Percent, RefreshCw
} from 'lucide-react';
import { useScrollLock } from '../utils/useScrollLock';
import { toast } from '../utils/toast';
import { AVAILABLE_COUPONS } from '../utils/couponUtils';

interface OfferZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon?: (code: string) => void;
  onOpenGoldExchange?: () => void;
}

const AUSPICIOUS_DAYS_2026 = [
  { name: 'Chaitra Shukla Tritiya', date: 'April 20, 2026', tithi: 'Akshaya Tritiya Pre-Dawn', benefit: '100% Making Charge Discount on Gold Bullion' },
  { name: 'Akshaya Tritiya', date: 'May 09, 2026', tithi: 'Rohini Nakshatra Muhurtham', benefit: 'Zero Deduction Old Gold Exchange + Free Gold Coin' },
  { name: 'Guru Pushya Yoga', date: 'August 27, 2026', tithi: 'Brihaspati Pushyam', benefit: 'Complimentary Solitaire Diamond Pendant with Bridal Sets' },
  { name: 'Dhanteras & Diwali', date: 'November 07, 2026', tithi: 'Dhanatrayodashi Mahurat', benefit: 'Royal Festive Cash Back + 2% Vault Credit' },
];

export const OfferZoneModal: React.FC<OfferZoneModalProps> = ({
  isOpen,
  onClose,
  onApplyCoupon,
  onOpenGoldExchange,
}) => {
  useScrollLock(isOpen, { onEscape: onClose });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Privilege voucher "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[1300] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-zone-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative bg-[#FAF5F0] dark:bg-[#1A1215] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#C6A15B]/30 max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Close offer zone"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#C6A15B]/20 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#702638] to-[#450817] flex items-center justify-center text-[#D8B878] shadow-md">
            <Tag className="w-5 h-5 text-[#C6A15B]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans tracking-[0.25em] text-[#C6A15B] font-semibold block">
              Exclusive Patron Privileges
            </span>
            <h2 id="offer-zone-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-[#702638] dark:text-[#E8A598]">
              Royal Offer Zone &amp; Auspicious Calendar
            </h2>
          </div>
        </div>

        {/* Active Promotional Vouchers Grid */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#702638] dark:text-[#D8B878] flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#C6A15B]" />
            <span>Active Checkout Privilege Vouchers</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {Object.values(AVAILABLE_COUPONS).map((coupon) => (
              <div
                key={coupon.code}
                className="p-4 rounded-xl bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 shadow-sm hover:border-[#C6A15B]/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-[#702638] dark:text-[#D8B878] bg-[#702638]/10 dark:bg-[#D8B878]/10 px-2.5 py-1 rounded-lg border border-[#702638]/20 dark:border-[#D8B878]/20">
                      {coupon.code}
                    </span>
                    <span className="text-[10px] font-sans text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-semibold uppercase">
                      Active
                    </span>
                  </div>
                  <h4 className="font-serif font-semibold text-sm text-stone-900 dark:text-stone-100">
                    {coupon.description}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    Valid on order values from ₹{coupon.minOrderValue.toLocaleString('en-IN')}.
                    {coupon.maxDiscount ? ` Capped at ₹${coupon.maxDiscount.toLocaleString('en-IN')}.` : ''}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 hover:text-[#702638] dark:hover:text-[#D8B878] font-medium cursor-pointer"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  {onApplyCoupon && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyCoupon(coupon.code);
                        onClose();
                        toast.success(`Voucher "${coupon.code}" applied to checkout!`);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#702638] hover:bg-[#8B3045] text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auspicious Gold Buying Days Calendar */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#702638] dark:text-[#D8B878] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C6A15B]" />
            <span>2026 Auspicious Gold Buying Muhurthams</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AUSPICIOUS_DAYS_2026.map((muhurtham, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-[#201518] border border-amber-200/60 dark:border-amber-900/30 text-xs space-y-1"
              >
                <div className="flex justify-between items-baseline font-semibold text-stone-900 dark:text-stone-100">
                  <span className="text-xs text-[#702638] dark:text-[#E8A598]">{muhurtham.name}</span>
                  <span className="text-[11px] font-mono text-[#C6A15B]">{muhurtham.date}</span>
                </div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 font-serif italic">
                  {muhurtham.tithi}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                  ✨ {muhurtham.benefit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Old Gold Exchange Callout */}
        {onOpenGoldExchange && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF0E6] to-[#F5E6D3] dark:from-[#2A1E22] dark:to-[#22161A] border border-[#C6A15B]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C6A15B]/20 flex items-center justify-center text-[#702638] dark:text-[#D8B878]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                  Zero Deduction Old Gold Exchange
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  Get 100% full market value for 22K gold + 2% upgrade credit with coupon <span className="font-mono font-bold text-[#702638] dark:text-[#D8B878]">EXCHANGE5</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGoldExchange();
              }}
              className="whitespace-nowrap px-4 py-2 rounded-xl bg-[#702638] text-white hover:bg-[#8B3045] font-semibold text-xs transition-colors cursor-pointer"
            >
              Calculate Exchange
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default OfferZoneModal;
