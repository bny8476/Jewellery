import React, { useState } from 'react';
import { Sparkles, ArrowRight, Instagram, Facebook, Mail, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer id="footer" className="relative bg-[#34252A] text-[#FAF5F0] overflow-hidden">
      {/* Decorative floral watermark / line-art in corner */}
      <div 
        className="absolute right-0 bottom-0 w-96 h-96 pointer-events-none opacity-[0.06] transform translate-x-20 translate-y-20"
        aria-hidden="true"
      >
        <svg viewBox="0 0 200 200" fill="none" stroke="#C69A8B" strokeWidth="1">
          <circle cx="100" cy="100" r="80" />
          <circle cx="100" cy="100" r="50" />
          <path d="M100 20 C120 70 120 130 100 180" />
          <path d="M100 20 C80 70 80 130 100 180" />
          <path d="M20 100 C70 120 130 120 180 100" />
          <path d="M20 100 C70 80 130 80 180 100" />
          <circle cx="100" cy="100" r="20" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div>
              <span className="font-serif tracking-[0.18em] text-2xl font-normal text-[#FAF5F0] uppercase block leading-none">
                RCB JEWELLERY
              </span>
              <span className="text-[8px] font-sans tracking-[0.28em] text-[#C69A8B] uppercase font-medium mt-1.5 block">
                &amp; PAWN SHOP
              </span>
            </div>
            <p className="text-sm font-serif italic text-[#FAF5F0]/80 pt-2">
              “Timeless Beauty. Precious Moments.”
            </p>
            <p className="text-xs font-sans text-[#FAF5F0]/60 leading-relaxed max-w-xs">
              Handcrafted heirloom bridal jewellery, fine hallmarked gold, certified solitaire diamonds, and trusted pawn valuations.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#C69A8B] font-semibold mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3 text-xs font-sans text-[#FAF5F0]/80 tracking-wide">
              <li>
                <Link to="/" className="hover:text-[#C69A8B] transition-colors">Home</Link>
              </li>
              <li>
                <a href="#categories" className="hover:text-[#C69A8B] transition-colors">Collections</a>
              </li>
              <li>
                <a href="#bridal" className="hover:text-[#C69A8B] transition-colors">Bridal</a>
              </li>
              <li>
                <a href="#story" className="hover:text-[#C69A8B] transition-colors">About</a>
              </li>
              <li>
                <a href="#footer" className="hover:text-[#C69A8B] transition-colors">Contact</a>
              </li>
              <li>
                <Link to="/pawn" className="hover:text-[#C69A8B] text-[#C69A8B]/90 transition-colors">Pawn &amp; Collateral</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div>
            <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#C69A8B] font-semibold mb-5">
              Customer Care
            </h4>
            <ul className="space-y-3 text-xs font-sans text-[#FAF5F0]/80 tracking-wide">
              <li>
                <a href="#shipping" className="hover:text-[#C69A8B] transition-colors">Shipping</a>
              </li>
              <li>
                <a href="#returns" className="hover:text-[#C69A8B] transition-colors">Returns &amp; Exchange</a>
              </li>
              <li>
                <a href="#faqs" className="hover:text-[#C69A8B] transition-colors">FAQs</a>
              </li>
              <li>
                <a href="#sizing" className="hover:text-[#C69A8B] transition-colors">Ring &amp; Bangle Size Guide</a>
              </li>
              <li>
                <a href="#track" className="hover:text-[#C69A8B] transition-colors">Track Order</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Join Our Journey */}
          <div>
            <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-[#C69A8B] font-semibold mb-3">
              Join Our Journey
            </h4>
            <p className="text-xs font-sans text-[#FAF5F0]/70 leading-relaxed mb-4">
              Be the first to know about new collections, exclusive private viewings, and curated seasonal offers.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-xs text-[#C69A8B] bg-[#702638]/40 border border-[#C69A8B]/40 rounded-full py-2.5 px-4">
                <CheckCircle2 className="w-4 h-4 text-[#C69A8B]" />
                <span>Thank you for subscribing to RCB Jewellery &amp; Pawn Shop.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full bg-[#541C2A]/60 border border-[#C69A8B]/40 rounded-full py-2.5 pl-4 pr-11 text-xs text-[#FAF5F0] placeholder-[#FAF5F0]/40 focus:outline-none focus:border-[#C69A8B]"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="absolute right-1 w-8 h-8 rounded-full bg-[#C69A8B] hover:bg-[#DFC0B5] text-[#34252A] flex items-center justify-center transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Social Icons */}
            <div className="flex items-center space-x-4 mt-6 text-[#C69A8B]">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-[#FAF5F0] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-[#FAF5F0] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="mailto:concierge@aurelle.com" aria-label="Email" className="hover:text-[#FAF5F0] transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Thin Rose Gold Divider */}
        <div className="pt-8 border-t border-[#C69A8B]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-sans text-[#FAF5F0]/60 gap-4">
          <p>© {new Date().getFullYear()} RCB Jewellery &amp; Pawn Shop. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-[#C69A8B] transition-colors">Privacy Policy</a>
            <span className="text-[#C69A8B]/30">•</span>
            <a href="#terms" className="hover:text-[#C69A8B] transition-colors">Terms of Service</a>
            <span className="text-[#C69A8B]/30">•</span>
            <a href="#hallmarking" className="hover:text-[#C69A8B] transition-colors">BIS Hallmarking</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
