import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { toast } from '../utils/toast';
import type { CampaignData } from '../services/campaignService';
import { campaignService } from '../services/campaignService';

interface FestiveOfferPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onShopNow?: () => void;
  campaign?: CampaignData | null;
}

export const FestiveOfferPopup: React.FC<FestiveOfferPopupProps> = ({
  isOpen,
  onClose,
  onShopNow,
  campaign
}) => {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Active campaign details with reliable fallback
  const couponCode = (campaign?.coupon_code || 'ROYAL20').trim().toUpperCase();
  const badgeLabel = campaign?.badge_label || 'Festive Offer';
  const heading = campaign?.heading || 'Festive Extravaganza';
  const description = campaign?.description || 'Celebrate timeless heritage with Flat 20% OFF on Making Charges on all eligible BIS 916 Gold & Diamond Jewellery.';
  const couponTitle = campaign?.coupon_section_title || 'Promotional Coupon';
  const ctaText = campaign?.cta_text || 'SHOP ELIGIBLE COLLECTION';
  const secondaryText = campaign?.secondary_text || 'LATER';
  const trustMessage = campaign?.trust_message || '100% BIS Hallmarked Purity • RBI Approved Registered Pawn Services';

  // Body scroll locking and Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDismiss = () => {
    if (campaign?.id) {
      campaignService.recordAnalytics(campaign.id, 'dismiss');
    }
    onClose();
  };

  const handleCopyCode = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(couponCode);
      } else {
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
      toast.success(`Coupon code ${couponCode} copied successfully! Enjoy flat 20% off making charges.`);

      // Log analytics
      if (campaign?.id) {
        campaignService.recordAnalytics(campaign.id, 'copy_code');
      }

      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy coupon code:', err);
      toast.info(`Promo code: ${couponCode}`);
    }
  };

  const handleShopNowClick = () => {
    // Save coupon to sessionStorage for automatic pre-fill during checkout
    try {
      sessionStorage.setItem('yazhini_applied_coupon', couponCode);
    } catch (err) {
      console.debug('SessionStorage access failed:', err);
    }

    if (campaign?.id) {
      campaignService.recordAnalytics(campaign.id, 'cta_click');
    }

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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="festive-offer-title"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px]"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.93, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-[#FAF5F0] dark:bg-[#1A0E13] text-[#34252A] dark:text-[#FAF5F0] rounded-[28px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-[#C69A8B]/60 overflow-hidden z-10 transition-colors duration-300 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gold and burgundy accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#702638] via-[#C69A8B] to-[#702638]" />

            {/* Circular Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 hover:bg-[#702638] hover:text-white dark:hover:bg-[#C69A8B] dark:hover:text-[#34252A] flex items-center justify-center transition-colors text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[#C69A8B] cursor-pointer"
              aria-label="Close festive offer popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Inner Content Grid */}
            <div className="relative p-6 sm:p-8">
              {/* Header Floating Badge */}
              <div className="flex items-center justify-center gap-2 mb-3.5">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#C69A8B]/15 border border-[#702638]/25 dark:border-[#C69A8B]/30 text-[#702638] dark:text-[#E8A598] text-[10.5px] uppercase tracking-[0.22em] font-sans font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#C69A8B] animate-pulse" />
                  <span>{badgeLabel}</span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mb-5">
                <h3 
                  id="festive-offer-title" 
                  className="font-inter text-2xl sm:text-3xl font-semibold tracking-tight text-[#702638] dark:text-[#FAF5F0] leading-snug"
                >
                  {heading}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans max-w-sm mx-auto">
                  {description}
                </p>
              </div>

              {/* Promo Code Box */}
              <div className="bg-gradient-to-br from-[#702638]/5 to-[#C69A8B]/15 dark:from-[#2D0D15] dark:to-[#3D141F] border border-[#C69A8B]/40 rounded-2xl p-4 mb-5 text-center shadow-inner">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--text-muted)] block mb-1.5 font-semibold">
                  {couponTitle}
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
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                        : 'bg-[#C69A8B] hover:bg-[#B08475] text-[#34252A] border-[#C69A8B] hover:scale-105 active:scale-95'
                    }`}
                    title="Click to copy promotional coupon code"
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
                  Apply coupon code <code className="font-mono font-semibold text-[#702638] dark:text-[#E8A598]">{couponCode}</code> at checkout to redeem.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleShopNowClick}
                  className="w-full sm:flex-1 py-3 px-6 rounded-full bg-[#702638] hover:bg-[#541C2A] text-white text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full sm:w-auto py-3 px-5 rounded-full bg-transparent hover:bg-stone-200 dark:hover:bg-white/10 text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
                >
                  {secondaryText}
                </button>
              </div>

              {/* Trust Footer Note */}
              <div className="mt-4 pt-3 border-t border-[#C69A8B]/20 flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)] font-sans text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{trustMessage}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FestiveOfferPopup;
