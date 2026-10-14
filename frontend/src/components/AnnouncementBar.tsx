import React, { useState } from 'react';
import { Sparkles, MapPin, Phone, X, Tag } from 'lucide-react';
import { toast } from '../utils/toast';

interface AnnouncementBarProps {
  onOpenStoreLocator?: () => void;
  onOpenOffer?: () => void;
}

const STORAGE_KEY = 'rcb_announcement_bar_dismissed';

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  onOpenStoreLocator,
  onOpenOffer,
}) => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(STORAGE_KEY) !== 'true';
      }
    } catch {
      // ignore
    }
    return true;
  });

  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText('ROYAL20');
      } else {
        const ta = document.createElement('textarea');
        ta.value = 'ROYAL20';
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Coupon code ROYAL20 copied to clipboard! (Flat 20% off making charges)');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy error:', err);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch {
      // ignore
    }
  };

  if (!isVisible) return null;

  return (
    <aside 
      aria-label="Promotional announcements and store services" 
      className="bg-[#3D141F] text-[#FAF5F0] border-b border-[#C69A8B]/25 py-2 px-3 sm:px-6 text-[11px] font-sans transition-all duration-200 relative z-30"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        
        {/* Left: Toll-free & Stores (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center gap-5 text-[#FAF5F0]/80 shrink-0">
          <a
            href="tel:18004257888"
            className="inline-flex items-center gap-1.5 hover:text-[#C69A8B] transition-colors"
            title="Call Toll Free Customer Concierge"
          >
            <Phone className="w-3 h-3 text-[#C69A8B]" />
            <span>Toll-Free: 1800-425-7888</span>
          </a>
          {onOpenStoreLocator && (
            <button
              onClick={onOpenStoreLocator}
              className="inline-flex items-center gap-1.5 hover:text-[#C69A8B] transition-colors cursor-pointer"
              title="Locate Nearest RCB Store & Book In-Store Appointment"
            >
              <MapPin className="w-3 h-3 text-[#C69A8B]" />
              <span>Find a Store &amp; Book Appointment</span>
            </button>
          )}
        </div>

        {/* Center: Main Promotional Message with Coupon Code Pill */}
        <div 
          onClick={onOpenOffer}
          className={`flex-1 flex items-center justify-center gap-2 text-center min-w-0 ${onOpenOffer ? 'cursor-pointer hover:opacity-95' : ''}`}
          title={onOpenOffer ? 'Click to view full festive offer details' : undefined}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C69A8B] shrink-0 animate-pulse hidden sm:block" />
          <span className="font-light tracking-wide text-[10px] sm:text-xs text-[#FAF5F0] truncate sm:whitespace-normal">
            <strong className="font-semibold text-[#C69A8B]">FESTIVE EXTRAVAGANZA:</strong> Flat 20% OFF on Making Charges on BIS 916 Gold &amp; Diamond Jewellery
          </span>

          <button
            onClick={handleCopyCode}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider transition-colors border cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-[#C69A8B]/20 hover:bg-[#C69A8B] text-[#FAF5F0] hover:text-[#3D141F] border-[#C69A8B]/40'
            }`}
            title="Click to copy promo code"
            aria-label="Copy promo code ROYAL20"
          >
            <Tag className="w-2.5 h-2.5" />
            <span>{copied ? 'COPIED!' : 'ROYAL20'}</span>
          </button>
        </div>

        {/* Right: Certified Hallmarking Tag & Close */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto sm:ml-0">
          <span className="hidden md:inline-block text-[10px] uppercase tracking-widest text-[#C69A8B] font-semibold border-l border-[#C69A8B]/30 pl-3">
            100% BIS Hallmarked · RBI Approved Pawn
          </span>
          <button
            onClick={handleDismiss}
            className="text-[#FAF5F0]/60 hover:text-[#FAF5F0] p-1 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C69A8B]"
            aria-label="Dismiss announcement"
            title="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AnnouncementBar;
