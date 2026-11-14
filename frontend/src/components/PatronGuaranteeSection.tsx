import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Gem,
  Truck,
  RefreshCw,
  Award,
  Infinity as InfinityIcon,
  Calendar,
  ArrowRight,
} from 'lucide-react';

export interface PatronGuaranteeSectionProps {
  onOpenStoreLocator?: () => void;
  onOpenPriceExplainer?: () => void;
  onOpenCareGuide?: () => void;
  className?: string;
}

// Elegant Traditional Lotus Emblem
const LotusEmblem: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 6C17 13 16 20 20 28C24 20 23 13 20 6Z"
      stroke="#BD8238"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 28C13 25 8 18 12 12C15 18 18 24 20 28Z"
      stroke="#BD8238"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 28C27 25 32 18 28 12C25 18 22 24 20 28Z"
      stroke="#BD8238"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 28C10 27 4 21 6 15C12 20 17 25 20 28Z"
      stroke="#BD8238"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 28C30 27 36 21 34 15C28 20 23 25 20 28Z"
      stroke="#BD8238"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LotusDivider: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#BD8238" strokeWidth="1.5">
    <path d="M12 4c-1.5 3-2 6-2 9 0 4 2 7 2 7s2-3 2-7c0-3-.5-6-2-9z" />
    <path d="M12 20c-3-1-6-3-7-6-1-3 1-6 3-7 1 3 3 5 4 13z" />
    <path d="M12 20c3-1 6-3 7-6 1-3-1-6-3-7-1 3-3 5-4 13z" />
  </svg>
);

interface ServiceCardData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  icon: React.ReactNode;
  actionKey: 'shipping' | 'exchange' | 'certified' | 'lifetime' | 'returns' | 'legacy';
}

export const PatronGuaranteeSection: React.FC<PatronGuaranteeSectionProps> = ({
  onOpenStoreLocator,
  onOpenPriceExplainer,
  onOpenCareGuide,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const handleAction = (key: string) => {
    switch (key) {
      case 'shipping':
      case 'exchange':
      case 'legacy':
        onOpenStoreLocator ? onOpenStoreLocator() : navigate('/jewellery');
        break;
      case 'certified':
      case 'returns':
        onOpenPriceExplainer ? onOpenPriceExplainer() : navigate('/jewellery');
        break;
      case 'lifetime':
        onOpenCareGuide ? onOpenCareGuide() : navigate('/jewellery');
        break;
      default:
        navigate('/jewellery');
    }
  };

  const serviceCards: ServiceCardData[] = [
    {
      id: 1,
      title: 'Free & Secure\nShipping',
      description: 'Safe. Swift. Across India.',
      imageUrl: '/images/patron_shipping_necklace.jpg',
      icon: <Truck className="w-4 h-4 text-[#D9AE70] stroke-[1.8]" />,
      actionKey: 'shipping',
    },
    {
      id: 2,
      title: 'Easy Exchange',
      description: 'Hassle-free exchange for your peace of mind.',
      imageUrl: '/images/patron_exchange_bangles.jpg',
      icon: <RefreshCw className="w-4 h-4 text-[#D9AE70] stroke-[1.8]" />,
      actionKey: 'exchange',
    },
    {
      id: 3,
      title: 'Certified\nJewellery',
      description: '100% authentic & certified for your assurance.',
      imageUrl: '/images/patron_certified_diamond.jpg',
      icon: <Award className="w-4 h-4 text-[#D9AE70] stroke-[1.8]" />,
      actionKey: 'certified',
    },
    {
      id: 4,
      title: 'Lifetime Service',
      description: 'Care that lasts a lifetime.',
      imageUrl: '/images/patron_lifetime_necklace.jpg',
      icon: <InfinityIcon className="w-4 h-4 text-[#D9AE70] stroke-[1.8]" />,
      actionKey: 'lifetime',
    },
    {
      id: 5,
      title: '14 Days Return',
      description: 'Shop with confidence.',
      imageUrl: '/images/patron_return_bangles.jpg',
      icon: <Calendar className="w-4 h-4 text-[#D9AE70] stroke-[1.8]" />,
      actionKey: 'returns',
    },
    {
      id: 6,
      title: 'More Than Just\nJewellery',
      description: 'A legacy of tradition and trust.',
      imageUrl: '/images/patron_legacy_idol.jpg',
      icon: <LotusDivider className="w-4 h-4 text-[#D9AE70]" />,
      actionKey: 'legacy',
    },
  ];

  return (
    <section
      id="patron-guarantee"
      className={`relative py-16 sm:py-20 lg:py-24 bg-[#FAF5EF] dark:bg-[#160D12] text-[#35131A] dark:text-[#FAF5F0] border-y border-[#E8DEC4]/70 dark:border-[#38262E] overflow-hidden transition-colors duration-500 ${className}`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* BACKGROUND DECORATIONS: Lotus Line Art & Botanical Curves             */}
      {/* --------------------------------------------------------------------- */}
      <div className="absolute top-6 left-6 sm:left-12 pointer-events-none select-none opacity-[0.22] dark:opacity-[0.10] z-0">
        <svg width="180" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 15 C 40 35, 40 55, 50 75 C 60 55, 60 35, 50 15 Z" stroke="#BD8238" strokeWidth="0.8" />
          <path d="M 50 75 C 30 65, 15 45, 25 30 C 35 45, 45 60, 50 75 Z" stroke="#BD8238" strokeWidth="0.8" />
          <path d="M 50 75 C 70 65, 85 45, 75 30 C 65 45, 55 60, 50 75 Z" stroke="#BD8238" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Main Responsive Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-center">
          
          {/* ----------------------------------------------------------------- */}
          {/* LEFT SIDE: Brand / Service Introduction (~32–35% / 4 cols)        */}
          {/* ----------------------------------------------------------------- */}
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: -30 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 xl:col-span-4 flex flex-col justify-center"
          >
            {/* Top Brand Emblem & Title */}
            <div className="flex items-center gap-3.5 mb-5 sm:mb-6">
              <LotusEmblem className="w-9 h-9 sm:w-11 sm:h-11 shrink-0" />
              <div className="flex flex-col">
                <span className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.08em] text-[#35131A] dark:text-[#FAF5F0] leading-tight">
                  YAZHINI
                </span>
                <span className="font-sans text-[9px] sm:text-[9.5px] font-semibold tracking-[0.22em] text-[#BD8238] uppercase">
                  FINE JEWELS &amp; PAWN SHOP
                </span>
              </div>
            </div>

            {/* Outlined Pill: THE PATRON GUARANTEE */}
            <div className="inline-flex items-center self-start mb-4">
              <div className="px-4 py-1.5 rounded-full border border-[#BD8238]/60 bg-[#BD8238]/5">
                <span className="text-[10px] sm:text-[10.5px] font-sans font-bold tracking-[0.22em] uppercase text-[#BD8238]">
                  THE PATRON GUARANTEE
                </span>
              </div>
            </div>

            {/* Large Editorial Serif Heading */}
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[50px] leading-[1.06] text-[#4A0E1C] dark:text-[#FAF0E6] font-normal tracking-tight mb-4">
              Quality-First <br />
              <span className="italic font-normal text-[#BD8238] dark:text-[#D9AE70]">
                Service
              </span>
            </h2>

            {/* Description */}
            <p className="font-sans text-xs sm:text-[13.5px] text-[#553640] dark:text-[#E8D9C6]/85 font-light leading-relaxed max-w-sm mb-6">
              Your trust drives us. We ensure a seamless, secure and premium experience with every transaction at YAZHINI Fine Jewels &amp; Pawn Shop.
            </p>

            {/* Lotus Divider */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8 max-w-xs text-[#BD8238]/60">
              <LotusDivider className="w-5 h-5 text-[#BD8238]" />
              <div className="flex-1 h-[1px] bg-gradient-to-r from-[#BD8238]/50 to-transparent" />
            </div>

            {/* Two Trust Indicators Separated by a Thin Vertical Line */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#BD8238]/25 max-w-sm">
              {/* Trust Feature 1: 100% Insured */}
              <div className="flex items-start gap-2.5 pr-2">
                <div className="w-8 h-8 rounded-full border border-[#BD8238]/60 flex items-center justify-center shrink-0 text-[#BD8238] mt-0.5">
                  <ShieldCheck className="w-4 h-4 stroke-[1.6]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-[12.5px] font-semibold text-[#35131A] dark:text-[#FAF0E6] leading-snug">
                    100% Insured
                  </span>
                  <span className="font-sans text-[10px] sm:text-[10.5px] text-[#78646C] dark:text-[#C5B4B9] font-light leading-snug">
                    Transit &amp; Safe Delivery
                  </span>
                </div>
              </div>

              {/* Trust Feature 2: Lifetime Care */}
              <div className="flex items-start gap-2.5 border-l border-[#BD8238]/30 pl-3">
                <div className="w-8 h-8 rounded-full border border-[#BD8238]/60 flex items-center justify-center shrink-0 text-[#BD8238] mt-0.5">
                  <Gem className="w-4 h-4 stroke-[1.6]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-[12.5px] font-semibold text-[#35131A] dark:text-[#FAF0E6] leading-snug">
                    Lifetime
                  </span>
                  <span className="font-sans text-[10px] sm:text-[10.5px] text-[#78646C] dark:text-[#C5B4B9] font-light leading-snug">
                    Care &amp; Support
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT SIDE: Service Card Grid (3 × 2 Grid, ~65–68% / 8 cols)       */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-8 xl:col-span-8 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-5.5 lg:gap-6">
              {serviceCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 22 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative rounded-[22px] overflow-hidden border border-[#D9AE70]/40 hover:border-[#BD8238] shadow-[0_8px_25px_rgba(0,0,0,0.18)] hover:shadow-[0_16px_36px_rgba(74,14,28,0.30)] bg-[#150A0F] min-h-[340px] sm:min-h-[360px] aspect-[3/4] flex flex-col justify-between p-5 transition-all duration-300"
                >
                  {/* Full-bleed background jewellery photography with micro-zoom */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={card.imageUrl}
                      alt={card.title.replace('\n', ' ')}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-106"
                    />

                    {/* Dark gradient overlay toward the bottom for crisp text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14080D] via-[#14080D]/65 via-50% to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                  </div>

                  {/* Top-Left: Minimal Circular Gold Icon */}
                  <div className="relative z-10 self-start">
                    <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-[#D9AE70]/70 flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-108 group-hover:border-[#D9AE70]">
                      {card.icon}
                    </div>
                  </div>

                  {/* Bottom Content: Title, Description, and Outlined CTA */}
                  <div className="relative z-10 flex flex-col justify-end mt-auto pt-16">
                    {/* Large Elegant Serif Title */}
                    <h3 className="font-serif text-lg sm:text-[19px] text-[#FAF0E6] font-medium leading-snug whitespace-pre-line tracking-tight drop-shadow-sm">
                      {card.title}
                    </h3>

                    {/* Short Description */}
                    <p className="font-sans text-[11px] sm:text-xs text-[#E8D9C6]/85 font-light leading-relaxed mt-1 mb-3.5">
                      {card.description}
                    </p>

                    {/* Small Outlined CTA Button */}
                    <button
                      type="button"
                      onClick={() => handleAction(card.actionKey)}
                      className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D9AE70]/60 hover:border-[#BD8238] bg-black/30 hover:bg-[#D9AE70] text-[#D9AE70] hover:text-[#17050B] text-[10px] sm:text-[10.5px] font-sans font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BD8238]"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PatronGuaranteeSection;
