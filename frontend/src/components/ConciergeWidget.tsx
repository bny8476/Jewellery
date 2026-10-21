import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, Calendar, Scale, X, Sparkles, Clock, ChevronRight, Coins, Gift, Tag } from 'lucide-react';

interface ConciergeWidgetProps {
  onOpenStoreLocator?: () => void;
  onOpenGoldExchange?: () => void;
  onOpenSwarnaNidhi?: () => void;
  onOpenCustomJewellery?: () => void;
  onOpenGiftCards?: () => void;
  onOpenOfferZone?: () => void;
}

export const ConciergeWidget: React.FC<ConciergeWidgetProps> = ({
  onOpenStoreLocator,
  onOpenGoldExchange,
  onOpenSwarnaNidhi,
  onOpenCustomJewellery,
  onOpenGiftCards,
  onOpenOfferZone,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = `https://wa.me/919444012345?text=${encodeURIComponent(
    'Hello YAZHINI Concierge, I would like personal styling assistance and jewellery recommendations.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* Expanded Concierge Menu Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 sm:w-88 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl overflow-hidden text-[var(--text-main)]"
          >
            {/* Header banner */}
            <div className="p-4 bg-gradient-to-r from-[#28030B] to-[#450817] text-white relative">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-3.5 right-3.5 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#C6A15B]/20 border border-[#C6A15B]/40 flex items-center justify-center text-[#C6A15B]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm tracking-wide text-[#FAF5F0]">
                    YAZHINI VIP Concierge
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white/80 font-medium tracking-wider uppercase">
                      Showroom Stylists Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="p-3 space-y-1.5 text-xs bg-[var(--bg-card)]">
              {/* WhatsApp option */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text-main)] block">WhatsApp Personal Stylist</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Instant photos, videos & custom sizes</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400/60 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Direct Toll-Free Call */}
              <a
                href="tel:18004257222"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)]/15 flex items-center justify-center text-[var(--gold-primary)] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text-main)] block">Call Concierge Desk</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Toll-Free: 1800-425-7222</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Book Showroom Trial / Video Consultation */}
              {onOpenStoreLocator && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenStoreLocator();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)]/15 flex items-center justify-center text-[var(--gold-primary)] shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-main)] block">Book In-Store Trial & Video</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">Reserve a private styling lounge</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Old Gold Valuation Calculator */}
              {onOpenGoldExchange && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenGoldExchange();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)]/15 flex items-center justify-center text-[var(--gold-primary)] shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-main)] block">Old Gold Exchange Calculator</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">Zero deduction on 916 Hallmark</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Swarna Nidhi 11-Month Easy Gold Scheme */}
              {onOpenSwarnaNidhi && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSwarnaNidhi();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#C6A15B]/20 flex items-center justify-center text-[#C6A15B] shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-main)] block">Swarna Nidhi™ Gold Scheme</span>
                      <span className="text-[10px] text-[#C6A15B] font-semibold">11-Month Plan • 12th Month Free!</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Bespoke Custom Jewellery Atelier */}
              {onOpenCustomJewellery && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCustomJewellery();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-main)] block">Customise Dream Jewellery</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">3D CAD design with Master Karigars</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Digital Gift Cards */}
              {onOpenGiftCards && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenGiftCards();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400 shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-main)] block">Digital Gift Cards</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">Instant WhatsApp &amp; Email Vouchers</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Offer Zone & Privileges */}
              {onOpenOfferZone && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenOfferZone();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-color)] transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-main)] block">Royal Offer Zone</span>
                      <span className="text-[10px] text-emerald-500 font-semibold">Vouchers &amp; Auspicious Muhurthams</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              {/* Live 24K Benchmark Rate Strip (All Pages) */}
              <div className="pt-1">
                <a
                  href="/live-rates"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl bg-gradient-to-r from-[#4A0A19] to-[#25030C] border border-[#C6A15B]/40 p-2.5 text-white hover:border-[#D8B878] transition-colors"
                  title="View full live bullion rates breakdown"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider font-semibold text-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                        <span>LIVE 24K 999.9 GOLD</span>
                      </div>
                      <div className="text-base font-bold text-white font-serif tracking-tight">₹14,928<span className="text-xs font-normal text-stone-300">/g</span></div>
                    </div>
                    <div className="text-right text-[10px]">
                      <div className="text-white/90">Sell-back: <strong className="text-white">₹14,523</strong>/g</div>
                      <div className="text-[#34D399] font-medium">+3% GST</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Timings footer */}
            <div className="px-4 py-2.5 bg-[var(--bg-elevated)]/60 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[var(--gold-primary)]" /> Mon - Sun: 10:00 AM - 8:30 PM
              </span>
              <span className="text-[#C6A15B] font-semibold">YAZHINI Care</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-[var(--bg-card)] border border-[var(--gold-primary)] text-[var(--gold-primary)]'
            : 'bg-gradient-to-r from-[#28030B] via-[#450817] to-[#28030B] border border-[#C6A15B]/50 text-[#FAF5F0] hover:scale-105 active:scale-95 hover:border-[#C6A15B]'
        }`}
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <span className="font-serif font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" />
          <span>Concierge</span>
        </span>
      </button>
    </div>
  );
};
