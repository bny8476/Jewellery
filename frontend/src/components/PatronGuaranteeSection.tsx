import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones, Calendar, ArrowRight } from 'lucide-react';

export interface PatronGuaranteeSectionProps {
  onOpenStoreLocator?: () => void;
  onOpenPriceExplainer?: () => void;
  onOpenCareGuide?: () => void;
  className?: string;
}

interface ServiceCardData {
  seq: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionKey?: 'store' | 'price' | 'care';
}

const SERVICE_CARDS: ServiceCardData[] = [
  {
    seq: '01',
    icon: <Truck className="w-5 h-5 stroke-[1.6]" />,
    title: 'Free Insured Shipping',
    description: '100% transit insurance with tamper-proof security courier delivery.',
    actionKey: 'store',
  },
  {
    seq: '02',
    icon: <RotateCcw className="w-5 h-5 stroke-[1.6]" />,
    title: 'Easy Exchange',
    description: 'Hassle-free exchange across all brand showrooms nationwide.',
    actionKey: 'store',
  },
  {
    seq: '03',
    icon: <ShieldCheck className="w-5 h-5 stroke-[1.6]" />,
    title: 'Certified Jewellery',
    description: 'BIS 916 Hallmark with 6-digit HUID and IGI/GIA diamond cards.',
    actionKey: 'price',
  },
  {
    seq: '04',
    icon: <Headphones className="w-5 h-5 stroke-[1.6]" />,
    title: 'Lifetime Service',
    description: 'Complimentary cleaning, prong inspection, and polish at any store.',
    actionKey: 'care',
  },
  {
    seq: '05',
    icon: (
      <div className="relative flex items-center justify-center">
        <Calendar className="w-5 h-5 text-[#702638] dark:text-[#E8A598]" strokeWidth={1.6} />
        <span className="absolute top-[6.5px] text-[7.5px] font-sans font-bold text-[#702638] dark:text-[#E8A598] leading-none">
          14
        </span>
      </div>
    ),
    title: '14 Days Return',
    description: 'No-questions-asked return policy for online purchases.',
    actionKey: 'price',
  },
];

export const PatronGuaranteeSection: React.FC<PatronGuaranteeSectionProps> = ({
  onOpenStoreLocator,
  onOpenPriceExplainer,
  onOpenCareGuide,
  className = '',
}) => {
  const handleAction = (key?: 'store' | 'price' | 'care') => {
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">

          {/* Left Column */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center">
            <div>
              {/* Brand Identity */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full border border-[#702638]/40 dark:border-[#C69A8B]/50 flex items-center justify-center text-[#702638] dark:text-[#E8A598] bg-[#F5EBE6]/60 dark:bg-black/20 shadow-xs shrink-0">
                  <svg className="w-4 h-4 stroke-[1.6]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 3h12l4 6-10 12L2 9z" strokeLinejoin="round" />
                    <path d="M10 3L6 9l6 12 6-12-4-6" strokeLinejoin="round" />
                    <path d="M2 9h20" strokeLinejoin="round" />
                  </svg>
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

              {/* Main Heading */}
              <h2 className="font-inter text-4xl sm:text-5xl lg:text-[48px] xl:text-[52px] text-[#35131A] dark:text-[#FAF5F0] font-normal leading-[1.05] tracking-tight">
                Quality-First<br />Service
              </h2>

              {/* Supporting Copy */}
              <p className="text-xs sm:text-[13px] text-[#777174] dark:text-stone-300 font-light leading-relaxed max-w-sm mt-3.5">
                Your trust drives us. We ensure a seamless, secure and premium experience with every transaction at YAZHINI Fine Jewels &amp; Pawn Shop.
              </p>
            </div>
          </div>

          {/* Right Column (approx 63–65% of content width / 7.5 cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 sm:gap-5 lg:gap-5.5 xl:gap-6">
              {SERVICE_CARDS.map((card) => (
                <div
                  key={card.seq}
                  onClick={() => handleAction(card.actionKey)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAction(card.actionKey);
                    }
                  }}
                  className="cursor-pointer bg-[#FFFCF9] dark:bg-[#1E1418] rounded-[18px] p-6 lg:p-6.5 shadow-[0_4px_20px_rgba(112,38,56,0.03)] border border-[#E9DAD2] dark:border-[#38232B] flex flex-col justify-between hover:shadow-[0_12px_32px_rgba(112,38,56,0.08)] hover:border-[#C69A8B]/70 hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Card Top Row: Circular Icon + Faint Sequence Number */}
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-full bg-[#F5EBE6] dark:bg-[#2C1820] flex items-center justify-center text-[#702638] dark:text-[#E8A598] group-hover:scale-105 transition-transform shrink-0">
                      {card.icon}
                    </div>
                    <span className="font-inter italic text-2xl sm:text-3xl text-[#EDE2DC] dark:text-[#3D252E] font-light select-none leading-none">
                      {card.seq}
                    </span>
                  </div>

                  {/* Card Body: Title, Divider, Description */}
                  <div className="mt-5 space-y-1.5 flex-1">
                    <h3 className="font-inter text-lg lg:text-[18.5px] font-medium text-[#35131A] dark:text-[#FAF5F0] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors leading-snug">
                      {card.title}
                    </h3>
                    <div className="w-7 h-[1.5px] bg-[#C69A8B]/70" />
                    <p className="text-xs text-[#777174] dark:text-stone-300 font-light leading-relaxed pt-1">
                      {card.description}
                    </p>
                  </div>

                  {/* Card Bottom: Subtle Arrow Icon */}
                  <div className="mt-4 flex justify-end">
                    <ArrowRight className="w-4 h-4 text-[#C69A8B] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}

              {/* Slot 06: Decorative Brand Statement (Row 2, Column 3) */}
              <div className="flex flex-col justify-center items-center text-center p-6 lg:p-7 h-full select-none">
                <div className="relative inline-block">
                  <span className="font-script text-3xl sm:text-4xl text-[#702638] dark:text-[#E8A598] leading-[1.18] block">
                    More Than<br />Just Jewellery
                  </span>
                  <div className="w-16 h-[1.5px] bg-[#C69A8B]/70 mx-auto mt-2.5" />
                </div>
                <p className="text-[9px] sm:text-[9.5px] font-sans font-medium tracking-[0.24em] text-[#702638]/80 dark:text-[#E8A598]/80 uppercase mt-4">
                  TRUST &nbsp;/&nbsp; TRANSPARENCY &nbsp;/&nbsp; TIMELESS VALUE
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PatronGuaranteeSection;
