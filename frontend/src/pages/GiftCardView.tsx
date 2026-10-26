import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Copy, 
  Printer, 
  ShoppingBag, 
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { giftCardService, GiftCardDesign } from '../services/giftCardService';

export default function GiftCardView() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchCard() {
      if (!code) {
        setError('Missing gift card reference code.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await giftCardService.getPublicCard(code);
        if (res.success && res.card) {
          setCardData(res.card);
        } else {
          setError(res.error || 'Gift card not found or invalid reference.');
        }
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve gift card.');
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [code]);

  const copyCode = () => {
    if (cardData?.code) {
      navigator.clipboard.writeText(cardData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const printCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#C9A45C] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">
            Decrypting Gift Card Certificate...
          </p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1E1418] p-8 rounded-3xl border border-[var(--border-subtle)] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[var(--text-main)]">Gift Card Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)]">{error || 'Please verify the link provided in your email.'}</p>
          <Link
            to="/gift-cards"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#351018] dark:bg-[#C9A45C] text-[#E6C687] dark:text-[#351018] font-bold text-xs"
          >
            Go to Gift Cards Page
          </Link>
        </div>
      </div>
    );
  }

  const design: GiftCardDesign = cardData.design || {
    id: 'classic-yazhini',
    name: 'Classic YAZHINI 24K Heritage',
    tagline: 'Timeless luxury wrapped in pure 24K gold foil & velvet',
    theme: 'gold',
    bgGradient: 'linear-gradient(135deg, #1C120C 0%, #351018 50%, #150A0E 100%)',
    accentColor: '#C9A45C',
    pattern: 'heritage-filigree',
    image: '/images/gift_card_luxury_box.jpg',
    occasions: ['General']
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#C9A45C] text-[10px] font-semibold tracking-widest uppercase">
            <Sparkles className="w-3 h-3" />
            OFFICIAL DIGITAL GIFT CERTIFICATE
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#351018] dark:text-[#E6C687]">
            A Present of Pure Radiance
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Presented to <span className="font-semibold text-[var(--text-main)]">{cardData.recipientName}</span> with compliments from{' '}
            <span className="font-semibold text-[var(--text-main)]">{cardData.senderName}</span>
          </p>
        </div>

        {/* 3D LUXURY GIFT CARD VISUAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl p-7 sm:p-10 shadow-2xl overflow-hidden aspect-[1.58/1] flex flex-col justify-between text-white border-2 border-[#C9A45C]/50"
          style={{ background: design.bgGradient }}
        >
          {/* Subtle gold shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

          {/* Top Row: Brand & Value */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[10px] sm:text-xs tracking-[0.3em] text-[#E6C687] font-serif uppercase block">
                YAZHINI FINE JEWELS
              </span>
              <span className="text-xs text-white/70 italic">{design.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#E6C687] uppercase tracking-widest block font-mono">
                {cardData.currentBalance < cardData.originalValue ? 'Current Balance' : 'Card Value'}
              </span>
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#E6C687]">
                ₹{cardData.currentBalance.toLocaleString('en-IN')}
              </span>
              {cardData.currentBalance < cardData.originalValue && (
                <span className="text-[10px] text-white/60 block line-through">
                  Orig: ₹{cardData.originalValue.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Center Message */}
          <div className="relative z-10 space-y-2 max-w-lg">
            {cardData.occasion && (
              <span className="text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-[#E6C687] inline-block font-mono">
                {cardData.occasion}
              </span>
            )}
            <p className="text-lg sm:text-2xl font-serif font-bold text-white tracking-wide">
              Dear {cardData.recipientName},
            </p>
            <p className="text-xs sm:text-sm text-[#D1C7BD] font-light leading-relaxed italic line-clamp-3">
              "{cardData.giftMessage || 'Warmest wishes and congratulations from YAZHINI Fine Jewels.'}"
            </p>
          </div>

          {/* Bottom Row: Code & Security Details */}
          <div className="relative z-10 flex flex-wrap items-end justify-between pt-4 border-t border-white/20 gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-white/60 block font-mono">Card Code</span>
              <span className="text-base sm:text-lg font-mono font-bold tracking-widest text-[#E6C687]">
                {cardData.code}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-white/60 block font-mono">Expires On</span>
              <span className="text-xs sm:text-sm font-semibold text-white">
                {new Date(cardData.expiresAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Controls & Redemption Code Box */}
        <div className="bg-white dark:bg-[#1E1418] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#C9A45C]/10 border border-[#C9A45C]/30">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-mono text-[var(--text-secondary)]">
                Redemption Code for Checkout
              </span>
              <p className="text-xl font-mono font-bold tracking-wider text-[#351018] dark:text-[#E6C687]">
                {cardData.code}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                (Enter this code along with your 4-digit PIN at online checkout)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyCode}
                className="px-4 py-2.5 rounded-xl bg-[#351018] dark:bg-[#C9A45C] text-[#E6C687] dark:text-[#351018] font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied to Clipboard!' : 'Copy Code'}
              </button>
              <button
                onClick={printCard}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-[var(--border-subtle)] font-semibold text-xs flex items-center gap-2 text-[var(--text-main)] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Voucher
              </button>
            </div>
          </div>

          {/* Barcode representation for In-Boutique Scanning */}
          <div className="text-center p-4 rounded-2xl bg-black/5 dark:bg-black/30 border border-[var(--border-subtle)] space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-mono">
              In-Boutique Concierge Scan Barcode
            </span>
            <div className="h-12 max-w-sm mx-auto flex items-center justify-center gap-1 opacity-80">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full bg-current ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
                />
              ))}
            </div>
            <p className="text-xs font-mono tracking-widest text-[var(--text-secondary)]">{cardData.code}</p>
          </div>

          {/* How to Redeem Step-by-Step */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            <h3 className="text-sm font-serif font-bold text-[#351018] dark:text-[#E6C687] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C9A45C]" />
              How to Redeem Your Gift Card
            </h3>
            <ol className="text-xs text-[var(--text-secondary)] space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Visit our online catalogue at <span className="font-semibold text-[var(--text-main)]">YAZHINI FINE JEWELS</span> and add your desired 22K gold, diamond, or silver jewellery to cart.
              </li>
              <li>
                Proceed to Checkout and expand the <span className="font-semibold text-[var(--text-main)]">"Apply Gift Card"</span> section.
              </li>
              <li>
                Enter your 16-character code <span className="font-mono font-bold text-[var(--text-main)]">{cardData.code}</span> and your 4-digit security PIN provided in your notification.
              </li>
              <li>
                The eligible balance will be instantly applied against your order total. Any remaining balance stays available for future purchases.
              </li>
            </ol>
          </div>

          {/* Direct Shop Link */}
          <div className="pt-2">
            <Link
              to="/jewellery"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Fine Jewellery & Redeem Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
