import React, { useState } from 'react';
import { Sparkles, MapPin, Phone, X, Tag } from 'lucide-react';
import { toast } from '../utils/toast';

interface AnnouncementBarProps {
  onOpenStoreLocator?: () => void;
  onOpenOffer?: () => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  onOpenStoreLocator,
  onOpenOffer,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('ROYAL20');
    toast.success('Coupon code ROYAL20 copied to clipboard! (Flat 20% off making charges)');
  };

  return (
    <aside 
      aria-label="Promotional announcements and store services" 
      className="bg-[#3D141F] text-[#FAF5F0] border-b border-[#C69A8B]/25 py-2 px-3 sm:px-6 text-[11px] font-sans transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Toll-free & Stores */}
        <div className="hidden lg:flex items-center gap-5 text-[#FAF5F0]/80">
          <a
            href="tel:18004257888"
            className="inline-flex items-center gap-1.5 hover:text-[#C69A8B] transition-colors"
            title="Call Toll Free Customer Concierge"
          >
            <Phone className="w-3 h-3 text-[#C69A8B]" />
            <span>Toll-Free: 1800-425-7888</span>
          </a>
          <button
            onClick={onOpenStoreLocator}
            className="inline-flex items-center gap-1.5 hover:text-[#C69A8B] transition-colors cursor-pointer"
            title="Locate Nearest RCB Store & Book In-Store Appointment"
          >
            <MapPin className="w-3 h-3 text-[#C69A8B]" />
            <span>Find a Store &amp; Book Appointment</span>
          </button>
        </div>

        {/* Center: Main Promotional Message with Coupon Code Pill */}
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 text-center">
          <Sparkles className="w-3.5 h-3.5 text-[#C69A8B] shrink-0 animate-pulse hidden sm:block" />
          <span className="font-light tracking-wide text-[10.5px] sm:text-xs text-[#FAF5F0]">
            <strong className="font-semibold text-[#C69A8B]">FESTIVE EXTRAVAGANZA:</strong> Flat 20% OFF on Making Charges on BIS 916 Gold &amp; Diamond Jewellery
          </span>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 bg-[#C69A8B]/20 hover:bg-[#C69A8B] text-[#FAF5F0] hover:text-[#3D141F] px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider transition-colors border border-[#C69A8B]/40 cursor-pointer"
            title="Click to copy promo code"
          >
            <Tag className="w-2.5 h-2.5" />
            <span>ROYAL20</span>
          </button>
        </div>

        {/* Right: Certified Hallmarking Tag & Close */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline-block text-[10px] uppercase tracking-widest text-[#C69A8B] font-semibold border-l border-[#C69A8B]/30 pl-3">
            100% BIS Hallmarked · RBI Approved Pawn
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="text-[#FAF5F0]/60 hover:text-[#FAF5F0] p-1 rounded-full transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AnnouncementBar;
