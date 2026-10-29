import React from 'react';
import Card, { CardData } from '@/components/ui/course-design-cards';
import { ShieldCheck, Sparkles, Gem } from 'lucide-react';

export interface PatronGuaranteeSectionProps {
  onOpenStoreLocator?: () => void;
  onOpenPriceExplainer?: () => void;
  onOpenCareGuide?: () => void;
  className?: string;
}

const GUARANTEE_CARDS: CardData[] = [
  {
    id: 1,
    colorClass: 'green',
    themeColor: '172 99% 39%',
    imageUrl: '/images/quality_service_bangles_velvet.jpg',
    title: 'Free Insured Shipping',
    description: '100% tamper-proof insured courier delivery nationwide.',
    countdownText: 'Insured Courier',
    actionKey: 'store',
  },
  {
    id: 2,
    colorClass: 'orange',
    themeColor: '38 100% 55%',
    imageUrl: '/images/store_chennai.jpg',
    title: 'Easy Exchange',
    description: 'Instant exchange across all brand showrooms with real-time valuation.',
    countdownText: 'Store Walk-in',
    actionKey: 'store',
  },
  {
    id: 3,
    colorClass: 'red',
    themeColor: '350 90% 65%',
    imageUrl: '/images/cat_diamond.jpg',
    title: 'Certified Jewellery',
    description: 'BIS 916 Hallmark with 6-digit laser engraved HUID & IGI cards.',
    countdownText: 'Verify Hallmark',
    actionKey: 'price',
  },
  {
    id: 4,
    colorClass: 'blue',
    themeColor: '199 95% 55%',
    imageUrl: '/images/ring_solitaire_diamond.jpg',
    title: 'Lifetime Service',
    description: 'Complimentary ultrasonic cleaning, inspection, and polish at any store.',
    countdownText: 'Complimentary',
    actionKey: 'care',
  },
  {
    id: 5,
    colorClass: 'green',
    themeColor: '160 84% 39%',
    imageUrl: '/images/gift_card_luxury_box.jpg',
    title: '14 Days Return',
    description: 'Zero-questions-asked refund policy with doorstep pickup.',
    countdownText: 'Zero Questions',
    actionKey: 'price',
  },
  {
    id: 6,
    colorClass: 'orange',
    themeColor: '32 95% 58%',
    imageUrl: '/images/bridal_vivaah_ruby_kundan.jpg',
    title: 'More Than Just Jewellery',
    description: 'Handcrafted heirloom luxury certified by three generations of trust.',
    countdownText: 'Timeless Value',
    actionKey: 'price',
  },
];

export const PatronGuaranteeSection: React.FC<PatronGuaranteeSectionProps> = ({
  onOpenStoreLocator,
  onOpenPriceExplainer,
  onOpenCareGuide,
  className = '',
}) => {
  const handleAction = (key?: 'store' | 'price' | 'care' | string) => {
    if (key === 'store') onOpenStoreLocator?.();
    else if (key === 'price') onOpenPriceExplainer?.();
    else if (key === 'care') onOpenCareGuide?.();
  };

  return (
    <section 
      id="patron-guarantee"
      className={`relative py-16 sm:py-20 lg:py-24 bg-[#FAF5F0] dark:bg-[#150D11] border-y border-[#E9DAD2] dark:border-[#2D1B22] overflow-hidden ${className}`}
    >
      {/* Subtle decorative background flourishes on top-right */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] pointer-events-none opacity-30 dark:opacity-10 overflow-hidden">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full text-[#C69A8B]">
          <path d="M400,0 C280,80 200,200 400,340 M360,0 C250,110 180,180 320,380" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="340" cy="70" r="140" stroke="currentColor" strokeWidth="0.75" />
        </svg>
      </div>

      {/* Main Content Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">

          {/* Left Column */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col justify-start lg:sticky lg:top-28">
            <div>
              {/* Brand Identity */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full border border-[#702638]/40 dark:border-[#C69A8B]/50 flex items-center justify-center text-[#702638] dark:text-[#E8A598] bg-[#F5EBE6]/60 dark:bg-black/20 shadow-xs shrink-0">
                  <Gem className="w-4 h-4 stroke-[1.6]" />
                </div>
                <span className="text-[10.5px] sm:text-[11px] font-inter uppercase tracking-[0.24em] text-[#702638] dark:text-[#E8A598] font-semibold">
                  YAZHINI FINE JEWELS &amp; PAWN SHOP
                </span>
              </div>

              {/* Eyebrow Heading */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase">
                  THE PATRON GUARANTEE
                </span>
                <div className="w-8 h-[1px] bg-[#C69A8B]/70" />
              </div>

              {/* Main Heading with Color Animated Text Style */}
              <h2 className="font-inter text-4xl sm:text-5xl lg:text-[46px] xl:text-[50px] font-normal leading-[1.08] tracking-tight text-[#35131A] dark:text-[#FAF5F0]">
                <span>Quality-First</span><br />
                <span className="bg-gradient-to-r from-[#702638] via-[#C6A15B] via-50% to-[#702638] dark:from-[#E8A598] dark:via-[#F3E7C4] dark:via-50% dark:to-[#E8A598] bg-[length:250%_100%] bg-clip-text text-transparent animate-[shimmer_5s_ease_infinite] font-medium inline-block">
                  Service
                </span>
              </h2>

              {/* Supporting Copy */}
              <p className="text-xs sm:text-[13px] text-[#777174] dark:text-stone-300 font-light leading-relaxed max-w-sm mt-3.5">
                Your trust drives us. We ensure a seamless, secure and premium experience with every transaction at YAZHINI Fine Jewels &amp; Pawn Shop.
              </p>

              {/* Trust Badge Indicators */}
              <div className="mt-8 pt-6 border-t border-[#E9DAD2] dark:border-[#2D1B22] flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-xs text-[#702638] dark:text-[#E8A598] font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#01c3a8] shrink-0" />
                  <span>100% Insured Transit &amp; BIS 916 Hallmark</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#702638] dark:text-[#E8A598] font-medium">
                  <Sparkles className="w-4 h-4 text-[#ffb741] shrink-0" />
                  <span>Lifetime Free Cleaning &amp; Prong Inspection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Course Design Cards Grid */}
          <div className="lg:col-span-8 xl:col-span-8 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-5.5 lg:gap-6">
              {GUARANTEE_CARDS.map((card) => (
                <Card 
                  key={card.id} 
                  data={card} 
                  onActionClick={(c) => handleAction(c.actionKey)}
                  className="h-full"
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PatronGuaranteeSection;
