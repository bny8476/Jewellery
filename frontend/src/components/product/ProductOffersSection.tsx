import React, { useState } from 'react';
import { 
  Percent, ShieldCheck, Award, RotateCcw, 
  Truck, X 
} from 'lucide-react';

interface OfferItem {
  id: string;
  type: 'Cashback' | 'Bank Offer' | 'Partner Offer';
  title: string;
  description: string;
  countLabel: string;
  code?: string;
}

export const ProductOffersSection: React.FC<{
  metalType?: string;
  purity?: string;
}> = ({ metalType = 'gold', purity }) => {
  const [activeOfferModal, setActiveOfferModal] = useState<OfferItem | null>(null);

  const offers: OfferItem[] = [
    {
      id: 'offer-cashback',
      type: 'Cashback',
      title: 'UPI Instant Cashback',
      description: 'Upto ₹150.00 instant cashback credited to UPI / Amazon Pay wallet on orders above ₹1,999.',
      countLabel: '1 offer >',
      code: 'YAZHINIUPI'
    },
    {
      id: 'offer-bank',
      type: 'Bank Offer',
      title: 'HDFC & ICICI Bank Privileges',
      description: 'Upto ₹2,500 instant discount on HDFC & ICICI Bank Credit Cards & Netbanking. EMI options available.',
      countLabel: '15 offers >',
      code: 'HDFCYAZHINI'
    },
    {
      id: 'offer-partner',
      type: 'Partner Offer',
      title: 'Curated Ensemble Privilege',
      description: 'Buy 2 handcrafted jewellery pieces and receive an extra 5% savings plus complimentary velvet travel pouch.',
      countLabel: '2 offers >',
      code: 'ENSEMBLE5'
    }
  ];

  const hallmarkLabel = metalType === 'silver' ? 'Certified 925 Silver' : (purity || 'BIS 916 Hallmarked');

  return (
    <div className="space-y-4 py-2 select-none">
      {/* 1. Offers Carousel / Cards (Amazon & GIVA reference) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#252329] dark:text-[#FAF7F1]">
          <div className="w-5 h-5 rounded-md bg-[#5B1022]/10 dark:bg-[#C49A50]/15 text-[#5B1022] dark:text-[#C49A50] flex items-center justify-center">
            <Percent className="w-3.5 h-3.5" />
          </div>
          <span>Offers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {offers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => setActiveOfferModal(offer)}
              className="p-3 rounded-xl border border-[#E7DEC8] dark:border-[#3E2D34] bg-white dark:bg-[#1A1215] hover:border-[#007185] dark:hover:border-[#C49A50] transition-all cursor-pointer shadow-2xs flex flex-col justify-between group"
            >
              <div>
                <span className="text-[11px] font-bold text-[#252329] dark:text-[#FAF7F1] block group-hover:text-[#007185] dark:group-hover:text-[#C49A50] transition-colors">
                  {offer.type}
                </span>
                <p className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] line-clamp-2 mt-1 leading-snug">
                  {offer.description}
                </p>
              </div>

              <div className="pt-2 flex items-center text-[10.5px] font-semibold text-[#007185] dark:text-[#C49A50] group-hover:underline">
                <span>{offer.countLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Four Trust Pillars Row (Matching Reference Icons) */}
      <div className="grid grid-cols-4 gap-2 py-3 px-2 rounded-2xl bg-[#FAF7F1]/80 dark:bg-[#160E11]/80 border border-[#E7DEC8] dark:border-[#3E2D34]">
        {/* Pillar 1: Certified Silver/Gold */}
        <div className="flex flex-col items-center text-center p-1 space-y-1">
          <div className="w-8 h-8 rounded-full bg-[#5B1022]/10 dark:bg-[#C49A50]/15 text-[#5B1022] dark:text-[#C49A50] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-semibold text-[#252329] dark:text-[#FAF7F1] leading-tight">
            {hallmarkLabel}
          </span>
        </div>

        {/* Pillar 2: 6 Month Warranty */}
        <div className="flex flex-col items-center text-center p-1 space-y-1">
          <div className="w-8 h-8 rounded-full bg-[#5B1022]/10 dark:bg-[#C49A50]/15 text-[#5B1022] dark:text-[#C49A50] flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-semibold text-[#252329] dark:text-[#FAF7F1] leading-tight">
            6 Month Warranty
          </span>
        </div>

        {/* Pillar 3: 10 Days Returnable */}
        <div className="flex flex-col items-center text-center p-1 space-y-1">
          <div className="w-8 h-8 rounded-full bg-[#5B1022]/10 dark:bg-[#C49A50]/15 text-[#5B1022] dark:text-[#C49A50] flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-semibold text-[#252329] dark:text-[#FAF7F1] leading-tight">
            10 Days Returnable
          </span>
        </div>

        {/* Pillar 4: Insured Transit */}
        <div className="flex flex-col items-center text-center p-1 space-y-1">
          <div className="w-8 h-8 rounded-full bg-[#5B1022]/10 dark:bg-[#C49A50]/15 text-[#5B1022] dark:text-[#C49A50] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-semibold text-[#252329] dark:text-[#FAF7F1] leading-tight">
            Insured Transit
          </span>
        </div>
      </div>

      {/* Offer Detail Modal */}
      {activeOfferModal && (
        <div className="fixed inset-0 z-[1500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1215] rounded-2xl max-w-md w-full p-5 border border-[#E7DEC8] dark:border-[#3E2D34] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DEC8] dark:border-[#3E2D34] pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#5B1022] dark:text-[#C49A50]" />
                <h3 className="text-sm font-bold text-[#252329] dark:text-[#FAF7F1]">
                  {activeOfferModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveOfferModal(null)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#716A6C] dark:text-[#B5ABB0] leading-relaxed">
              {activeOfferModal.description}
            </p>

            {activeOfferModal.code && (
              <div className="p-3 rounded-xl bg-[#FAF7F1] dark:bg-[#120B0E] border border-[#E7DEC8] dark:border-[#3E2D34] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#716A6C] dark:text-[#B5ABB0] block">
                    Promo Code:
                  </span>
                  <span className="font-mono text-xs font-bold text-[#5B1022] dark:text-[#C49A50]">
                    {activeOfferModal.code}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeOfferModal.code || '');
                    alert('Promo code copied!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#5B1022] dark:bg-[#C49A50] text-white dark:text-black text-[11px] font-semibold cursor-pointer"
                >
                  Copy Code
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveOfferModal(null)}
              className="w-full py-2.5 rounded-xl border border-[#E7DEC8] dark:border-[#3E2D34] text-xs font-semibold text-[#252329] dark:text-[#FAF7F1] hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOffersSection;
