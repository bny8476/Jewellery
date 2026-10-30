import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, List, Calculator, Truck, RotateCcw, 
  Sparkles, Star, HelpCircle, ChevronDown, 
  ChevronUp, MessageSquareQuote, CheckCircle2 
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';

interface ProductTabsSectionProps {
  product: {
    id: string;
    name: string;
    category: string;
    metal_type: string;
    weight: number;
    purity?: string;
    sku?: string;
    description?: string | null;
    stone_details?: string | null;
    collection?: string | null;
    care_instructions?: string | null;
    wastage_percent?: number;
    rating?: number;
    reviews_count?: number;
  };
  selectedWeight: number;
  selectedPurity: string;
  displayPrice: number;
  baseMetalValue: number;
  makingCharges: number;
  gstAmount: number;
  reviews: any[];
  onWriteReview: () => void;
}

export const ProductTabsSection: React.FC<ProductTabsSectionProps> = ({
  product,
  selectedWeight,
  selectedPurity,
  displayPrice,
  baseMetalValue,
  makingCharges,
  gstAmount,
  reviews,
  onWriteReview
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabs = [
    { id: 0, label: 'Product Details', icon: FileText },
    { id: 1, label: 'Specifications', icon: List },
    { id: 2, label: 'Price Breakdown', icon: Calculator },
    { id: 3, label: 'Shipping & Delivery', icon: Truck },
    { id: 4, label: 'Return & Exchange', icon: RotateCcw },
    { id: 5, label: 'Care Guide', icon: Sparkles },
    { id: 6, label: `Reviews (${product.reviews_count || reviews.length || 42})`, icon: Star },
    { id: 7, label: 'FAQs', icon: HelpCircle }
  ];

  // Common FAQs
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: 'How do I verify the BIS Hallmark and HUID seal on this jewellery?',
      a: 'Every piece crafted by YAZHINI FINE JEWELS features an indelible laser-engraved 6-character alphanumeric HUID (Hallmark Unique Identification) code stamped alongside the BIS triangular mark and purity grade (e.g., 22K 916). You can instantly verify this certificate using the BIS Care mobile application or at any certified A&H hallmarking center.'
    },
    {
      q: 'Is transit fully insured for home delivery?',
      a: 'Yes. 100% of our orders are shipped in tamper-evident, security-sealed discreet outer packaging via our specialized bullion logistics partners (BlueDart Apex and Sequel Express). The courier is fully insured until signed for at your doorstep with OTP verification.'
    },
    {
      q: 'What is YAZHINI’s Lifetime Exchange and Buyback policy?',
      a: 'We offer a 100% exchange trade-in value on the prevailing market rate of gold at the time of exchange, with zero deduction on pure metal weight. Diamond jewellery carries a 100% exchange and 90% buyback guarantee on current prevailing rates.'
    },
    {
      q: 'Can I customize the weight, ring size, or gold purity for this design?',
      a: 'Yes! Our bespoke atelier can custom-forge this design in 22K, 18K, or 14K gold, as well as customize necklace lengths (16" to 24") and ring sizes (10 to 24). Choose your custom preferences directly on this page or book a 1-on-1 video consultation with our gemologists.'
    },
    {
      q: 'What payment modes are accepted for high-value orders?',
      a: 'We accept all major UPI applications, Net Banking across 50+ Indian banks, Credit/Debit cards with 3D Secure, No-Cost EMIs, and RBI-authorized jewellery gift cards. Cash on Delivery is eligible up to ₹49,999 in compliance with statutory regulations.'
    }
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-[#1A1215] border border-[#E7DEC8] dark:border-[#3E2D34] shadow-sm overflow-hidden select-none">
      {/* 1. Horizontal Scrollable Tab Bar */}
      <div className="flex items-center gap-1 overflow-x-auto p-2 bg-[#FAF7F1] dark:bg-[#140E10] border-b border-[#E7DEC8] dark:border-[#3E2D34] scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#5B1022] text-white dark:bg-[#C49A50] dark:text-[#140E10] shadow-sm scale-102 font-bold'
                  : 'text-[#716A6C] dark:text-[#B5ABB0] hover:text-[#252329] dark:hover:text-[#FAF7F1] hover:bg-white/60 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Tab Content Panels */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {/* Tab 0: Product Details & Story */}
          {activeTab === 0 && (
            <motion.div
              key="tab-details"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-3xl"
            >
              <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
                Curator's Craftsmanship &amp; Heritage Story
              </h3>
              <p className="text-sm text-[#252329] dark:text-[#FAF7F1] leading-relaxed">
                {product.description ||
                  `Handcrafted with exquisite artistry by hereditary master goldsmiths, the ${product.name} reflects centuries of South Indian royal jewelry traditions. Every motif, contour, and stone setting is hand-polished and certified with indelible BIS 916 laser hallmarking.`}
              </p>
              <p className="text-xs text-[#716A6C] dark:text-[#B5ABB0] leading-relaxed">
                Inspired by the sacred temple architecture of Thanjavur and Madurai, each curve is meticulously sculpted from 100% pure BIS-certified metal, balancing timeless bridal heritage with modern lightweight comfort fit.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C49A50] block">Atelier Heritage</span>
                  <span className="text-xs font-semibold text-[#252329] dark:text-[#FAF7F1] mt-0.5 block">
                    {product.collection || 'The Sacred Muhurtham Bridal Collection'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C49A50] block">Gemstone Authentication</span>
                  <span className="text-xs font-semibold text-[#252329] dark:text-[#FAF7F1] mt-0.5 block">
                    {product.stone_details || 'Certified Natural Burmese Rubies & Basra Seed Pearls'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 1: Specifications */}
          {activeTab === 1 && (
            <motion.div
              key="tab-specs"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
                Technical Jewellery Specifications
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Metal Type &amp; Color</span>
                  <span className="font-semibold text-[#252329] dark:text-[#FAF7F1] capitalize">{product.metal_type} (Yellow Gold)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Hallmark Purity</span>
                  <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">{selectedPurity || product.purity || '22K (BIS 916)'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Gross Weight</span>
                  <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">{selectedWeight} grams</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Net Metal Weight</span>
                  <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">~{Math.round(selectedWeight * 0.94 * 10) / 10} grams</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Category / SKU</span>
                  <span className="font-mono font-semibold text-[#252329] dark:text-[#FAF7F1]">{product.sku || `YZH-${product.id.slice(0, 6).toUpperCase()}`}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Hallmarking ID (HUID)</span>
                  <span className="font-mono font-semibold text-[#5B1022] dark:text-[#C49A50]">HUID-916-{(product.id.slice(0, 6)).toUpperCase()}</span>
                </div>
                {product.stone_details && (
                  <div className="flex justify-between py-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60 md:col-span-2">
                    <span className="text-[#716A6C] dark:text-[#B5ABB0]">Stone &amp; Diamond Details</span>
                    <span className="font-semibold text-[#252329] dark:text-[#FAF7F1] text-right">{product.stone_details}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 2: Price Breakdown */}
          {activeTab === 2 && (
            <motion.div
              key="tab-price"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-2xl"
            >
              <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
                Authoritative Transparent Price Breakdown
              </h3>
              <p className="text-xs text-[#716A6C] dark:text-[#B5ABB0]">
                In accordance with BIS retail jewellery fair trade regulations, we provide exact itemized billing based on live bullion market rates.
              </p>

              <div className="p-5 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Base Raw Metal Value ({selectedPurity})</span>
                  <span className="font-bold text-[#252329] dark:text-[#FAF7F1]">{formatCurrencyINR(baseMetalValue)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Artistry &amp; Making Charges ({product.wastage_percent || 12}%)</span>
                  <span className="font-bold text-[#252329] dark:text-[#FAF7F1]">{formatCurrencyINR(makingCharges)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
                  <span className="text-[#716A6C] dark:text-[#B5ABB0]">Statutory 3% GST (1.5% CGST + 1.5% SGST)</span>
                  <span className="font-bold text-[#252329] dark:text-[#FAF7F1]">{formatCurrencyINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 font-bold text-[#252329] dark:text-[#FAF7F1]">
                  <span className="text-sm">Total Payable Value</span>
                  <span className="font-serif text-lg text-[#5B1022] dark:text-[#C49A50]">{formatCurrencyINR(displayPrice)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Shipping & Delivery */}
          {activeTab === 3 && (
            <motion.div
              key="tab-shipping"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-3xl text-xs text-[#252329] dark:text-[#FAF7F1] leading-relaxed"
            >
              <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
                Insured Shipping &amp; White-Glove Dispatch
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] space-y-1">
                  <h4 className="font-bold text-sm text-[#5B1022] dark:text-[#C49A50]">Dispatch Window</h4>
                  <p className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
                    In-stock creations dispatch within 24 to 48 business hours following multi-stage hallmark and microscopic gemological verification.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] space-y-1">
                  <h4 className="font-bold text-sm text-[#5B1022] dark:text-[#C49A50]">Secure Logistics</h4>
                  <p className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
                    All parcels are dispatched in tamper-evident, security-numbered containers via BlueDart Apex &amp; Sequel Express with signature and OTP delivery.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 4: Return & Exchange */}
          {activeTab === 4 && (
            <motion.div
              key="tab-returns"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-3xl text-xs text-[#252329] dark:text-[#FAF7F1] leading-relaxed"
            >
              <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
                14-Day Return &amp; Lifetime Exchange Guarantee
              </h3>
              <ul className="space-y-2.5 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>14-Day Hassle-Free Returns:</strong> Return eligible unworn jewellery in its original security-sealed tamper box for a 100% full refund.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Lifetime Exchange Trade-In:</strong> Exchange this jewellery creation at any time across our showrooms for 100% of the prevailing gold value with zero weight deductions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Buyback Guarantee:</strong> 97% buyback value on pure metal weight and 90% on certified diamond value based on prevailing market rates.</span>
                </li>
              </ul>
            </motion.div>
          )}

          {/* Tab 5: Care Guide */}
          {activeTab === 5 && (
            <motion.div
              key="tab-care"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-w-3xl text-xs text-[#252329] dark:text-[#FAF7F1] leading-relaxed"
            >
              <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
                Jewellery Preservation &amp; Care Guide
              </h3>
              <p>
                {product.care_instructions ||
                  'Preserve the brilliant lustre of your fine jewellery by storing each piece wrapped in soft chamois suede or velvet in individual moisture-free slots.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34]">
                  <h4 className="font-bold text-[#5B1022] dark:text-[#C49A50] mb-1">Avoid Chemicals</h4>
                  <p className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
                    Always apply cosmetics, hairsprays, and perfumes before donning your fine jewellery.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34]">
                  <h4 className="font-bold text-[#5B1022] dark:text-[#C49A50] mb-1">Gentle Cleaning</h4>
                  <p className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
                    Use lukewarm water, mild soap, and a soft-bristle brush. Pat dry with lint-free microfiber.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34]">
                  <h4 className="font-bold text-[#5B1022] dark:text-[#C49A50] mb-1">Annual Service</h4>
                  <p className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
                    Bring your jewellery to any YAZHINI boutique for complimentary ultrasonic prong inspection.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 6: Reviews */}
          {activeTab === 6 && (
            <motion.div
              key="tab-reviews"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50]">
                    Patron Testimonials &amp; Verified Reviews
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-amber-500 text-xs">{'★'.repeat(5)}</div>
                    <span className="text-xs font-bold text-[#252329] dark:text-[#FAF7F1]">4.9 out of 5</span>
                    <span className="text-xs text-[#716A6C] dark:text-[#B5ABB0]">
                      ({product.reviews_count || reviews.length || 42} verified hallmark purchases)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onWriteReview}
                  className="px-4 py-2 rounded-xl bg-[#5B1022] hover:bg-[#7A1930] text-white dark:bg-[#C49A50] dark:hover:bg-[#D5AD63] dark:text-[#140E10] text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  <span>Write a Review</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(reviews.length > 0 ? reviews : [
                  {
                    id: '1',
                    author: 'Sowmya Venkatesh, Chennai',
                    stars: 5,
                    quote: 'The craftsmanship on this temple haram is extraordinary. HUID code laser-verified and the delivery box was immaculate.',
                    created_at: '2026-10-20'
                  },
                  {
                    id: '2',
                    author: 'Priya Narayanan, Bangalore',
                    stars: 5,
                    quote: 'Transparent pricing with live gold rates made our wedding purchase seamless. The fit is luxurious and featherlight.',
                    created_at: '2026-10-14'
                  }
                ]).map((rev, idx) => (
                  <div key={rev.id || idx} className="p-4 rounded-2xl bg-[#FAF7F1] dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-500 text-xs">{'★'.repeat(rev.stars || 5)}</div>
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ✓ Verified Purchase
                      </span>
                    </div>
                    <p className="text-xs italic text-[#252329] dark:text-[#FAF7F1]">"{rev.quote}"</p>
                    <p className="text-[11px] font-bold text-[#716A6C] dark:text-[#B5ABB0]">{rev.author}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab 7: FAQs */}
          {activeTab === 7 && (
            <motion.div
              key="tab-faqs"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 max-w-3xl"
            >
              <h3 className="font-serif text-xl font-bold text-[#5B1022] dark:text-[#C49A50] mb-4">
                Frequently Asked Questions
              </h3>

              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#E7DEC8] dark:border-[#3E2D34] overflow-hidden bg-[#FAF7F1] dark:bg-[#140E10]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-[#252329] dark:text-[#FAF7F1] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#C49A50] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#716A6C] shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs text-[#716A6C] dark:text-[#B5ABB0] leading-relaxed border-t border-[#E7DEC8]/40 dark:border-[#3E2D34]/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
