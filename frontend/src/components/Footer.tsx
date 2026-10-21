import React, { useState } from 'react';
import { ArrowRight, Instagram, Facebook, Mail, CheckCircle2, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItemVariants } from '../utils/motion';
import { PolicyModal, PolicyType } from './PolicyModal';
import { StoreLocatorModal } from './StoreLocatorModal';
import { PawnValuationModal } from './PawnValuationModal';
import { GoldExchangeModal } from './GoldExchangeModal';
import { SwarnaNidhiModal } from './SwarnaNidhiModal';
import { PurityEducationModal } from './PurityEducationModal';
import { CustomJewelleryModal } from './CustomJewelleryModal';
import { GiftCardModal } from './GiftCardModal';
import { OfferZoneModal } from './OfferZoneModal';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyType>('authenticity');
  const [storeLocatorOpen, setStoreLocatorOpen] = useState(false);
  const [pawnModalOpen, setPawnModalOpen] = useState(false);
  const [goldExchangeModalOpen, setGoldExchangeModalOpen] = useState(false);
  const [swarnaNidhiOpen, setSwarnaNidhiOpen] = useState(false);
  const [purityEducationOpen, setPurityEducationOpen] = useState(false);
  const [purityEducationTab, setPurityEducationTab] = useState<'huid' | '4cs' | 'metals' | 'care'>('huid');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false);
  const [offerZoneModalOpen, setOfferZoneModalOpen] = useState(false);

  const handleOpenPolicy = (tab: PolicyType) => {
    setActivePolicyTab(tab);
    setPolicyModalOpen(true);
  };

  const handleOpenPurityEducation = (tab: 'huid' | '4cs' | 'metals' | 'care' = 'huid') => {
    setPurityEducationTab(tab);
    setPurityEducationOpen(true);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      // Save subscription locally
      try {
        const subs = JSON.parse(localStorage.getItem('rcb_newsletter_subs') || '[]');
        subs.push({ email: email.trim(), date: new Date().toISOString() });
      } catch (err) {
        void err;
      }
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <>
      <footer id="footer" className="relative bg-[#28030B] dark:bg-[#120D0F] text-[#FAF5F0] overflow-hidden border-t border-[#C6A15B]/30 dark:border-[#46343A]">
        {/* Decorative floral watermark / line-art */}
        <div 
          className="absolute right-0 bottom-0 w-96 h-96 pointer-events-none opacity-[0.05] transform translate-x-20 translate-y-20"
          aria-hidden="true"
        >
          <svg viewBox="0 0 200 200" fill="none" stroke="#C6A15B" strokeWidth="1">
            <circle cx="100" cy="100" r="80" />
            <circle cx="100" cy="100" r="50" />
            <path d="M100 20 C120 70 120 130 100 180" />
            <path d="M100 20 C80 70 80 130 100 180" />
            <circle cx="100" cy="100" r="20" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
          <motion.div
            variants={staggerContainer(0.08, 0.05)}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16"
          >
            {/* Column 1: Brand Info */}
            <motion.div variants={staggerItemVariants} className="space-y-4">
              <div>
                <span className="font-serif tracking-[0.2em] text-2xl font-normal text-[#FAF5F0] uppercase block leading-none">
                  YAZHINI
                </span>
                <span className="text-[8.5px] font-sans tracking-[0.28em] text-[#C6A15B] uppercase font-semibold mt-1.5 block">
                  FINE JEWELS • EST. 1994
                </span>
              </div>
              <p className="text-sm font-serif italic text-[#FAF5F0]/90 pt-1">
                “Tradition, Crafted to Shine.”
              </p>
              <p className="text-xs font-sans text-[#FAF5F0]/70 leading-relaxed max-w-xs">
                Premium Tamil-inspired heritage jewellery with contemporary luxury styling. Handcrafted heirloom bridal jewellery, 916 BIS laser hallmarked gold, and certified IGI natural diamonds.
              </p>
              <div className="pt-2 text-xs space-y-1.5 text-[#C6A15B]">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Concierge: 1800-425-7222</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>concierge@yazhinijewels.com</span>
                </p>
              </div>
            </motion.div>

            {/* Column 2: Quick Links */}
            <motion.div variants={staggerItemVariants}>
              <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#C6A15B] font-semibold mb-4">
                Shop &amp; Services
              </h4>
              <ul className="space-y-2.5 text-xs font-sans text-[#FAF5F0]/80 tracking-wide">
                <li>
                  <Link to="/" className="hover:text-[#C6A15B] transition-colors">Home Storefront</Link>
                </li>
                <li>
                  <a href="#catalog" className="hover:text-[#C6A15B] transition-colors">Jewellery Catalogue</a>
                </li>
                <li>
                  <a href="#bridal" className="hover:text-[#C6A15B] transition-colors">Bridal &amp; Wedding Trousseau</a>
                </li>
                <li>
                  <button onClick={() => setPawnModalOpen(true)} className="hover:text-[#C6A15B] text-[#C6A15B] text-left">
                    Gold Pawn &amp; Collateral Loans
                  </button>
                </li>
                <li>
                  <button onClick={() => setStoreLocatorOpen(true)} className="hover:text-[#C6A15B] text-left">
                    Store Locator &amp; Appointments
                  </button>
                </li>
                <li>
                  <button onClick={() => setSwarnaNidhiOpen(true)} className="hover:text-[#C6A15B] text-[#D8B878] font-semibold text-left cursor-pointer">
                    Swarna Nidhi™ 11-Mo Gold Scheme
                  </button>
                </li>
                <li>
                  <button onClick={() => setCustomModalOpen(true)} className="hover:text-[#C6A15B] text-left cursor-pointer flex items-center gap-1.5">
                    <span>Customise Jewellery (Bespoke Studio)</span>
                    <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono uppercase">CAD</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => setGiftCardModalOpen(true)} className="hover:text-[#C6A15B] text-left cursor-pointer">
                    Digital Gift Cards &amp; Vouchers
                  </button>
                </li>
                <li>
                  <button onClick={() => setOfferZoneModalOpen(true)} className="hover:text-[#C6A15B] text-emerald-400 font-semibold text-left cursor-pointer flex items-center gap-1">
                    <span>Royal Offer Zone &amp; Auspicious Days</span>
                    <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono uppercase">Offers</span>
                  </button>
                </li>
                <li>
                  <a href="#rates-strip" className="hover:text-[#C6A15B] transition-colors">Daily Precious Metal Rates</a>
                </li>
              </ul>
            </motion.div>

            {/* Column 3: Customer Care & Trust */}
            <motion.div variants={staggerItemVariants}>
              <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#C6A15B] font-semibold mb-4">
                Customer Care &amp; Trust
              </h4>
              <ul className="space-y-2.5 text-xs font-sans text-[#FAF5F0]/80 tracking-wide">
                <li>
                  <button onClick={() => handleOpenPurityEducation('huid')} className="hover:text-[#C6A15B] text-left cursor-pointer flex items-center gap-1.5">
                    <span>BIS 916 Hallmarking Verification</span>
                    <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">HUID</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenPolicy('shipping')} className="hover:text-[#C6A15B] text-left">
                    100% Insured Delivery Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setGoldExchangeModalOpen(true)} className="hover:text-[#C6A15B] text-left cursor-pointer">
                    Old Gold Exchange &amp; Trade-In Calculator
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenPurityEducation('care')} className="hover:text-[#C6A15B] text-left cursor-pointer">
                    Jewellery Care &amp; Cleaning Guide
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenPolicy('privacy')} className="hover:text-[#C6A15B] text-left">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenPolicy('terms')} className="hover:text-[#C6A15B] text-left">
                    Terms &amp; Conditions
                  </button>
                </li>
              </ul>
            </motion.div>

            {/* Column 4: Newsletter & Social */}
            <motion.div variants={staggerItemVariants}>
              <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#C6A15B] font-semibold mb-3">
                YAZHINI Privilege Circle
              </h4>
              <p className="text-xs font-sans text-[#FAF5F0]/70 leading-relaxed mb-4">
                Subscribe for exclusive festive launch previews, auspicious buying dates, and private jewellery exhibitions.
              </p>

              {subscribed ? (
                <div className="flex items-center gap-2 text-xs text-[#E4D1A3] bg-[#450817]/60 border border-[#C6A15B]/40 rounded py-2.5 px-4">
                  <CheckCircle2 className="w-4 h-4 text-[#C6A15B] shrink-0" />
                  <span>Welcome to YAZHINI Privilege Circle. Your concierge will keep you informed.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="relative flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full bg-[#450817]/70 border border-[#C6A15B]/40 rounded py-2.5 pl-4 pr-11 text-xs text-[#FAF5F0] placeholder-[#FAF5F0]/40 focus:outline-none focus:border-[#C6A15B]"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="absolute right-1 w-8 h-8 rounded bg-[#C6A15B] hover:bg-[#E4D1A3] text-[#28030B] flex items-center justify-center transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Social Icons */}
              <div className="flex items-center space-x-4 mt-6 text-[#C69A8B]">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-[#FAF5F0] transition-colors p-1.5 rounded-full bg-white/5">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-[#FAF5F0] transition-colors p-1.5 rounded-full bg-white/5">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="mailto:concierge@yazhinijewels.com" aria-label="Email" className="hover:text-[#FAF5F0] transition-colors p-1.5 rounded-full bg-white/5">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#C69A8B]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-sans text-[#FAF5F0]/60 gap-4">
            <p>© {new Date().getFullYear()} YAZHINI FINE JEWELS. All rights reserved. Registered Hallmark Jeweller.</p>
            <div className="flex items-center space-x-5">
              <button onClick={() => handleOpenPolicy('privacy')} className="hover:text-[#C69A8B] transition-colors">Privacy Policy</button>
              <span className="text-[#C69A8B]/30">•</span>
              <button onClick={() => handleOpenPolicy('terms')} className="hover:text-[#C69A8B] transition-colors">Terms of Service</button>
              <span className="text-[#C69A8B]/30">•</span>
              <button onClick={() => handleOpenPolicy('authenticity')} className="hover:text-[#C69A8B] transition-colors">BIS Hallmark</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        initialTab={activePolicyTab}
        onOpenPurityEducation={handleOpenPurityEducation}
        onOpenGoldExchange={() => setGoldExchangeModalOpen(true)}
      />

      {/* BIS 6-Digit HUID & 4Cs Purity Education Modal */}
      <PurityEducationModal
        isOpen={purityEducationOpen}
        onClose={() => setPurityEducationOpen(false)}
        initialTab={purityEducationTab}
      />

      {/* Store Locator Modal */}
      <StoreLocatorModal
        isOpen={storeLocatorOpen}
        onClose={() => setStoreLocatorOpen(false)}
      />

      {/* Pawn Valuation Modal */}
      <PawnValuationModal
        isOpen={pawnModalOpen}
        onClose={() => setPawnModalOpen(false)}
      />

      {/* Gold Exchange & Trade-In Calculator Modal */}
      <GoldExchangeModal
        isOpen={goldExchangeModalOpen}
        onClose={() => setGoldExchangeModalOpen(false)}
        onBookAppointment={() => {
          setGoldExchangeModalOpen(false);
          setStoreLocatorOpen(true);
        }}
      />

      {/* Swarna Nidhi 11-Month Scheme Modal */}
      <SwarnaNidhiModal
        isOpen={swarnaNidhiOpen}
        onClose={() => setSwarnaNidhiOpen(false)}
        onBookAppointment={() => {
          setSwarnaNidhiOpen(false);
          setStoreLocatorOpen(true);
        }}
      />
      {/* Custom Bespoke Jewellery Studio Modal */}
      <CustomJewelleryModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onBookShowroomVisit={() => {
          setCustomModalOpen(false);
          setStoreLocatorOpen(true);
        }}
      />

      {/* Digital Gift Cards Modal */}
      <GiftCardModal
        isOpen={giftCardModalOpen}
        onClose={() => setGiftCardModalOpen(false)}
      />

      {/* Royal Offer Zone Modal */}
      <OfferZoneModal
        isOpen={offerZoneModalOpen}
        onClose={() => setOfferZoneModalOpen(false)}
        onOpenGoldExchange={() => {
          setOfferZoneModalOpen(false);
          setGoldExchangeModalOpen(true);
        }}
      />
    </>
  );
};

export default Footer;
