import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { toast } from '../utils/toast';

interface FestiveOfferPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onShopNow?: () => void;
}

export const FestiveOfferPopup: React.FC<FestiveOfferPopupProps> = ({
  isOpen,
  onClose,
  onShopNow
}) => {
  const [copied, setCopied] = useState(false);
  const couponCode = 'ROYAL20';

  // Handle escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyCode = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(couponCode);
      } else {
        // Fallback for non-secure contexts or unsupported browsers
        const textArea = document.createElement('textarea');
        textArea.value = couponCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('Coupon code ROYAL20 copied! Enjoy flat 20% off making charges.');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy coupon code to clipboard:', err);
      toast.info('Use promo code ROYAL20 at checkout');
    }
  };

  const handleShopNowClick = () => {
    onClose();
    if (onShopNow) {
      onShopNow();
    } else {
      const catalog = document.getElementById('catalog');
      if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="festive-offer-title"
        >
          {/* Subtle backdrop — clicking dismisses, but does not lock page scrolling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[3px] pointer-events-auto"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-[#FAF5F0] dark:bg-[#1A0E13] text-[#34252A] dark:text-[#FAF5F0] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-[#C69A8B]/50 overflow-hidden pointer-events-auto transition-colors duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gold filigree bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#702638] via-[#C69A8B] to-[#702638]" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-[#702638] hover:text-white dark:hover:bg-[#C69A8B] dark:hover:text-[#34252A] flex items-center justify-center transition-colors text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#C69A8B]"
              aria-label="Close festive offer popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Inner Content Grid */}
            <div className="relative p-6 sm:p-8">
              {/* Header Badge */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#702638]/10 dark:bg-[#C69A8B]/15 border border-[#702638]/25 dark:border-[#C69A8B]/30 text-[#702638] dark:text-[#E8A598] text-[10.5px] uppercase tracking-[0.2em] font-sans font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#C69A8B]" />
                  <span>Limited Festive Offer</span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mb-5">
                <h3 
                  id="festive-offer-title" 
                  className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#702638] dark:text-[#FAF5F0] leading-snug"
                >
                  FESTIVE EXTRAVAGANZA
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans max-w-sm mx-auto">
                  Celebrate timeless heritage with <strong className="font-semibold text-[#702638] dark:text-[#E8A598]">Flat 20% OFF on Making Charges</strong> on all eligible BIS 916 Gold &amp; Diamond Jewellery.
                </p>
              </div>

              {/* Promo Code Box */}
              <div className="bg-gradient-to-br from-[#702638]/5 to-[#C69A8B]/15 dark:from-[#2D0D15] dark:to-[#3D141F] border border-[#C69A8B]/40 rounded-2xl p-4 mb-5 text-center shadow-inner">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-muted)] block mb-1 font-semibold">
                  Exclusive Promotional Coupon
                </span>
                
                <div className="flex items-center justify-center gap-3 mt-1.5">
                  <div className="inline-flex items-center gap-2 bg-[#FAF5F0] dark:bg-[#140509] px-4 py-2 rounded-xl border border-dashed border-[#C69A8B] shadow-sm">
                    <Tag className="w-4 h-4 text-[#C69A8B]" />
                    <span className="font-mono text-base sm:text-lg font-bold tracking-widest text-[#702638] dark:text-[#E8A598]">
                      {couponCode}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 border cursor-pointer ${
                      copied
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-[#C69A8B] hover:bg-[#B08475] text-[#34252A] border-[#C69A8B] hover:scale-105'
                    }`}
                    title="Click to copy coupon code"
                    aria-live="polite"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-[var(--text-muted)] mt-2 font-sans">
                  Apply coupon code <code className="font-mono font-semibold text-[#702638] dark:text-[#E8A598]">ROYAL20</code> at checkout to redeem.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleShopNowClick}
                  className="w-full sm:flex-1 py-3 px-6 rounded-full bg-[#702638] hover:bg-[#541C2A] text-white text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Shop Eligible Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-5 rounded-full bg-transparent hover:bg-stone-200 dark:hover:bg-white/10 text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  Later
                </button>
              </div>

              {/* Trust Footer Note */}
              <div className="mt-4 pt-3 border-t border-[#C69A8B]/20 flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)] font-sans text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>100% BIS Hallmarked Purity • RBI Approved Registered Pawn Services</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FestiveOfferPopup;
