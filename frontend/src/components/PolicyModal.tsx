import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Truck, RefreshCw, Sparkles, Lock, FileText, Phone } from 'lucide-react';
import { useScrollLock } from '../utils/useScrollLock';

export type PolicyType = 'authenticity' | 'shipping' | 'returns' | 'care' | 'privacy' | 'terms' | 'contact';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyType;
  onOpenPurityEducation?: (tab?: 'huid' | '4cs' | 'metals' | 'care') => void;
  onOpenGoldExchange?: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'authenticity',
  onOpenPurityEducation,
  onOpenGoldExchange
}) => {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialTab);

  useScrollLock(isOpen, { onEscape: onClose });

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[1300] overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#C69A8B]/30 max-h-[90vh] overflow-y-auto flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-modal-title"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 pb-3 gap-2 overflow-x-auto no-scrollbar text-xs font-medium">
          <button
            onClick={() => setActiveTab('authenticity')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'authenticity'
                ? 'bg-[#702638] text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>BIS Hallmarking</span>
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'shipping'
                ? 'bg-[#702638] text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Insured Shipping</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'returns'
                ? 'bg-[#702638] text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Exchange &amp; Buyback</span>
          </button>

          <button
            onClick={() => setActiveTab('care')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'care'
                ? 'bg-[#702638] text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Jewellery Care</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'privacy'
                ? 'bg-[#702638] text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'terms'
                ? 'bg-[#702638] text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-6 flex-1 text-xs leading-relaxed space-y-4">
          {activeTab === 'authenticity' && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#702638] dark:text-[#E8A598] flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#702638] dark:text-[#E8A598]" />
                <span>BIS 916 Hallmarking &amp; Certified Authenticity</span>
              </h3>
              <p className="text-stone-600 dark:text-stone-300">
                At YAZHINI Fine Jewels &amp; Pawn Shop, integrity is our hallmark. Every single piece of gold jewellery 
                crafted and sold carries the official Bureau of Indian Standards (BIS) hallmark, featuring the 
                6-digit alphanumeric HUID (Hallmark Unique Identification) laser engraved on the piece.
              </p>
              <div className="bg-white dark:bg-[#242424] border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100">Our Triple-Check Certification:</h4>
                <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400">
                  <li><strong>Gold Purity:</strong> BIS 916 (22K) / 750 (18K) verifiable on the official BIS Care app using HUID.</li>
                  <li><strong>Diamonds:</strong> Certified by international gemological authorities (IGI / GIA) verifying Color, Clarity, Cut, and Carat.</li>
                  <li><strong>Silver Articles:</strong> Stamped 92.5 Sterling Silver or 99.9 Fine Silver bullion.</li>
                </ul>
              </div>

              {onOpenPurityEducation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPurityEducation('huid');
                  }}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#702638] to-[#9E3D52] text-white font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer text-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Launch Interactive BIS HUID &amp; 4Cs Diamond Verification Guide</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#702638] dark:text-[#E8A598] flex items-center gap-2">
                <Truck className="w-6 h-6 text-[#702638] dark:text-[#E8A598]" />
                <span>100% Insured Delivery &amp; Tamper-Proof Packaging</span>
              </h3>
              <p className="text-stone-600 dark:text-stone-300">
                We understand the immense emotional and monetary value of jewellery. We partner exclusively with 
                secure logistics specialists (Sequel Logistics &amp; BVC Logistics) to deliver orders directly to your doorstep.
              </p>
              <div className="bg-white dark:bg-[#242424] border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100">Shipping Policies &amp; Timelines:</h4>
                <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400">
                  <li><strong>Transit Insurance:</strong> All shipments are fully insured by YAZHINI Fine Jewels until customer OTP handover.</li>
                  <li><strong>Delivery Timelines:</strong> In-stock pieces ship within 24-48 hours. Custom bridal orders take 7-10 business days.</li>
                  <li><strong>Tamper-Proof Box:</strong> Delivered in dual-sealed, discrete security packaging without external jewellery branding.</li>
                  <li><strong>Identity Verification:</strong> OTP and Government ID check required upon delivery.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#702638] dark:text-[#E8A598] flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-[#702638] dark:text-[#E8A598]" />
                <span>Lifetime Exchange &amp; Transparent Buyback Policy</span>
              </h3>
              <p className="text-stone-600 dark:text-stone-300">
                We build lifelong relationships with our patrons. Our exchange and buyback terms are transparent, 
                benchmarked against current market rates without hidden surcharges.
              </p>
              <div className="bg-white dark:bg-[#242424] border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100">Transparent Terms:</h4>
                <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400">
                  <li><strong>14-Day Return / Exchange:</strong> 100% money back or exchange for undamaged items in original condition.</li>
                  <li><strong>Lifetime Gold Exchange:</strong> 100% value of prevailing 22K benchmark rate against net gold weight.</li>
                  <li><strong>Diamond Exchange:</strong> 90% of prevailing diamond value on exchange for another diamond jewel.</li>
                  <li><strong>Cash Buyback:</strong> 97% of prevailing gold market value transferred directly via RTGS/NEFT.</li>
                </ul>
              </div>

              {onOpenGoldExchange && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGoldExchange();
                  }}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#996515] text-[#28030B] font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Calculate Old Gold Exchange &amp; Upgrade Value Now</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-semibold text-[#702638] dark:text-[#E8A598] flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#702638] dark:text-[#E8A598]" />
                <span>Precious Jewellery Care &amp; Maintenance Guide</span>
              </h3>
              <p className="text-stone-600 dark:text-stone-300">
                Gold and natural gemstones are enduring treasures that preserve their radiance with mindful care.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#242424] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5">
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Dos:</h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400 text-[11px]">
                    <li>Store in separate velvet-lined compartments to prevent scratches.</li>
                    <li>Clean gently with mild warm soapy water and a soft-bristled brush.</li>
                    <li>Visit any YAZHINI Fine Jewels showroom for complimentary annual ultrasonic cleaning.</li>
                  </ul>
                </div>
                <div className="bg-white dark:bg-[#242424] border border-stone-200 dark:border-stone-800 rounded-xl p-3.5">
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1">Don'ts:</h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400 text-[11px]">
                    <li>Avoid spraying perfumes, hairsprays, or lotions directly onto jewellery.</li>
                    <li>Do not wear delicate filigree or pearl jewellery while swimming in chlorinated pools.</li>
                    <li>Keep emeralds and rubies away from extreme heat sources.</li>
                  </ul>
                </div>
              </div>

              {onOpenPurityEducation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPurityEducation('care');
                  }}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-white dark:bg-[#2A2A2A] border border-[#C6A15B]/50 text-[#702638] dark:text-[#E8A598] font-medium flex items-center justify-center gap-2 shadow-sm hover:bg-stone-50 transition-all cursor-pointer text-xs"
                >
                  <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                  <span>Open Interactive Heirloom Care &amp; Metal Standards Guide</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-semibold text-[#702638] dark:text-[#E8A598]">
                Customer Privacy &amp; Data Security Notice
              </h3>
              <p className="text-stone-600 dark:text-stone-300">
                YAZHINI Fine Jewels &amp; Pawn Shop respects your personal and financial confidentiality. Customer details, 
                KYC records for pawn collateral, and purchase histories are encrypted and stored in compliance with 
                Indian Information Technology and Data Protection laws. We never sell or share customer contact data.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-semibold text-[#702638] dark:text-[#E8A598]">
                Terms &amp; Conditions of Sale &amp; Appraisal
              </h3>
              <p className="text-stone-600 dark:text-stone-300">
                All retail jewellery transactions are issued with a statutory tax invoice with GST breakdown. 
                Pawn loans are governed under the State Pawnbrokers Act and RBI NBFC Gold Loan regulations. 
                Benchmark rate display on the storefront represents market reference rates and is updated daily during trading hours.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 text-stone-500">
            <Phone className="w-3.5 h-3.5" />
            <span>Customer Concierge: 1800-425-7222 (9 AM - 8 PM IST)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full font-medium bg-[#702638] text-white hover:bg-[#541C2A] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
