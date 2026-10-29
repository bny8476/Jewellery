import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, Gift, Sparkles, CheckCircle2, Copy, 
  Share2, CreditCard, ExternalLink, ShieldCheck, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrollLock } from '../utils/useScrollLock';
import { toast } from '../utils/toast';
import { formatCurrencyINR } from '../utils/formatters';
import { giftCardService } from '../services/giftCardService';

interface GiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGiftCardToCart?: (code: string, amount: number) => void;
}

const PRESET_AMOUNTS = [2500, 5000, 10000, 25000, 50000];

const CARD_THEMES = [
  { id: 'classic-yazhini', name: 'Classic YAZHINI 24K', gradient: 'from-[#450817] via-[#702638] to-[#28030B]', border: 'border-[#C6A15B]/50', text: 'text-[#D8B878]' },
  { id: 'bridal-elegance', name: 'Shubha Muhurtham Bridal', gradient: 'from-[#6E0D25] via-[#9E2A2B] to-[#3F0008]', border: 'border-amber-400/50', text: 'text-amber-200' },
  { id: 'golden-anniversary', name: 'Timeless Anniversary', gradient: 'from-[#1A1A24] via-[#2D1B36] to-[#140D1E]', border: 'border-purple-300/40', text: 'text-purple-200' },
  { id: 'festive-celebration', name: 'Akshaya Tritiya Fortune', gradient: 'from-[#7A4B00] via-[#A36D00] to-[#523200]', border: 'border-yellow-300/50', text: 'text-yellow-100' },
];

export const GiftCardModal: React.FC<GiftCardModalProps> = ({
  isOpen,
  onClose,
  onApplyGiftCardToCart,
}) => {
  useScrollLock(isOpen, { onEscape: onClose });

  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0]);
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('May this timeless treasure bring enduring radiance, prosperity, and joy into your life.');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchasedCard, setPurchasedCard] = useState<{
    code: string;
    pin: string;
    amount: number;
    expiryDate: string;
    viewUrl?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const activeAmount = customAmount ? Math.max(1000, Number(customAmount) || 1000) : amount;

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !senderName.trim()) {
      toast.error('Please specify both recipient and sender names');
      return;
    }
    if (!recipientEmail.trim()) {
      toast.error('Please specify a valid recipient email address for digital delivery');
      return;
    }

    try {
      setIsSubmitting(true);
      const initRes = await giftCardService.initiatePurchase({
        amount: activeAmount,
        designId: selectedTheme.id,
        cardType: 'DIGITAL',
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
        senderName: senderName.trim(),
        giftMessage: personalMessage.trim(),
        deliveryMethod: 'EMAIL'
      });

      if (!initRes.success || !initRes.purchaseId) {
        throw new Error(initRes.error || 'Failed to initiate purchase session.');
      }

      // Complete payment with Razorpay or sandbox fallback
      const rzpOptions: any = {
        key: initRes.keyId || 'rzp_test_placeholder',
        amount: Math.round(activeAmount * 100),
        currency: 'INR',
        name: 'YAZHINI FINE JEWELS',
        description: `Digital Gift Card — ₹${activeAmount.toLocaleString('en-IN')}`,
        order_id: initRes.razorpayOrderId,
        prefill: {
          name: senderName,
          email: recipientEmail,
          contact: recipientPhone || ''
        },
        theme: { color: '#351018' },
        handler: async (response: any) => {
          try {
            const verifyRes = await giftCardService.verifyAndIssue({
              purchaseId: initRes.purchaseId!,
              razorpay_order_id: response.razorpay_order_id || initRes.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || ''
            });

            if (verifyRes.success && verifyRes.card) {
              setPurchasedCard({
                code: verifyRes.card.code,
                pin: verifyRes.card.pin,
                amount: verifyRes.card.amount,
                expiryDate: verifyRes.card.expiresAt || (verifyRes.card as any).expiryDate || '1 Year from Issuance',
                viewUrl: verifyRes.card.viewUrl
              });
              toast.success(`Digital Gift Card of ${formatCurrencyINR(activeAmount)} issued successfully!`);
            } else {
              toast.error(verifyRes.error || 'Payment recorded, but issuance encountered an error.');
            }
          } catch (vErr: any) {
            toast.error(vErr.message || 'Verification failed');
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          }
        }
      };

      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.open();
      } else {
        // Development / Test sandbox instant confirmation
        const verifyRes = await giftCardService.verifyAndIssue({
          purchaseId: initRes.purchaseId,
          razorpay_order_id: initRes.razorpayOrderId,
          razorpay_payment_id: `pay_modal_sandbox_${Date.now()}`,
          razorpay_signature: 'sandbox_verified_signature'
        });

        if (verifyRes.success && verifyRes.card) {
          setPurchasedCard({
            code: verifyRes.card.code,
            pin: verifyRes.card.pin,
            amount: verifyRes.card.amount,
            expiryDate: verifyRes.card.expiresAt || (verifyRes.card as any).expiryDate || '1 Year from Issuance',
            viewUrl: verifyRes.card.viewUrl
          });
          toast.success(`Digital Gift Card of ${formatCurrencyINR(activeAmount)} issued successfully!`);
        } else {
          toast.error(verifyRes.error || 'Verification error');
        }
        setIsSubmitting(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed');
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (purchasedCard) {
      navigator.clipboard.writeText(purchasedCard.code);
      setCopied(true);
      toast.success('Gift card voucher code copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[1300] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-card-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative bg-[#FAF5F0] dark:bg-[#1A1215] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#C6A15B]/30 max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          aria-label="Close gift cards"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#C6A15B]/20 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#702638] to-[#450817] flex items-center justify-center text-[#D8B878] shadow-md">
            <Gift className="w-5 h-5 text-[#C6A15B]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans tracking-[0.25em] text-[#C6A15B] font-semibold block">
              Precious Celebrations
            </span>
            <h2 id="gift-card-modal-title" className="font-inter text-xl sm:text-2xl font-bold text-[#702638] dark:text-[#E8A598]">
              YAZHINI Royal Digital Gift Cards
            </h2>
          </div>
        </div>

        {!purchasedCard ? (
          <form onSubmit={handleCreateGiftCard} className="space-y-5">
            {/* Live Interactive Voucher Card Preview */}
            <div className={`p-5 rounded-2xl bg-gradient-to-br ${selectedTheme.gradient} border ${selectedTheme.border} shadow-xl relative overflow-hidden text-white transition-all`}>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none blur-2xl" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[#D8B878] font-bold block">
                    YAZHINI FINE JEWELS
                  </span>
                  <span className="text-xs font-inter italic text-white/80">Privilege Gifting Voucher</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                </div>
              </div>

              <div className="my-4">
                <span className="text-[11px] text-white/70 block uppercase tracking-wider">Voucher Value</span>
                <span className="font-inter text-3xl font-bold text-white tracking-tight">
                  {formatCurrencyINR(activeAmount)}
                </span>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-between items-end text-xs">
                <div>
                  <span className="text-[10px] text-white/60 block">For: {recipientName || 'Valued Recipient'}</span>
                  <span className="text-[10px] text-white/60 block">From: {senderName || 'Valued Member'}</span>
                </div>
                <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/80">
                  Valid 12 Months
                </span>
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-2 uppercase tracking-wider">
                Select Card Occasion &amp; Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CARD_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTheme.id === theme.id
                        ? 'border-[#C6A15B] bg-[#C6A15B]/10 shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block truncate">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Denomination Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-2 uppercase tracking-wider">
                Choose Gift Card Denomination
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      amount === amt && !customAmount
                        ? 'bg-[#702638] text-white border-[#702638] shadow-sm'
                        : 'bg-white dark:bg-[#251A1E] border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-[#C6A15B]'
                    }`}
                  >
                    {formatCurrencyINR(amt)}
                  </button>
                ))}
              </div>

              {/* Custom Denomination */}
              <div className="relative mt-2">
                <input
                  type="number"
                  min="1000"
                  max="500000"
                  step="500"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Or enter custom amount (e.g. ₹15,000)"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>
            </div>

            {/* Recipient & Sender Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Sender (Your Name) *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Karthik &amp; Family"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Recipient WhatsApp / Mobile (Optional)
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+91 98400 00000"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                  Recipient Email (Optional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
                />
              </div>
            </div>

            {/* Personal Message */}
            <div>
              <label className="block text-xs font-semibold text-[#702638] dark:text-[#D8B878] mb-1 uppercase tracking-wider">
                Personalized Calligraphy Note
              </label>
              <textarea
                rows={2}
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                className="w-full bg-white dark:bg-[#251A1E] border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#C6A15B]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#702638] via-[#450817] to-[#702638] text-[#FAF5F0] font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 text-[#D8B878] animate-spin" />
                  <span>Processing Payment & Issuance...</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 text-[#D8B878]" />
                  <span>Pay & Issue Royal Gift Card ({formatCurrencyINR(activeAmount)})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
                Razorpay 256-bit SSL encrypted
              </span>
              <Link
                to="/gift-cards"
                onClick={onClose}
                className="text-[#702638] dark:text-[#E8A598] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Full Gift Cards Showcase & Velvet Boxes</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </form>
        ) : (
          /* Success Screen with Real Backend Issued Card Credentials */
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C6A15B] font-bold block mb-1">
                Authentic Value Issued & Active
              </span>
              <h3 className="font-inter text-2xl font-bold text-[#702638] dark:text-[#E8A598]">
                {formatCurrencyINR(purchasedCard.amount)} Gift Voucher Ready!
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto mt-2 leading-relaxed">
                Gifted to <strong>{recipientName}</strong> by <strong>{senderName}</strong>. Valid across online checkout and all YAZHINI showrooms until <strong>{purchasedCard.expiryDate}</strong>.
              </p>
            </div>

            {/* Voucher Card with Code & PIN */}
            <div className="bg-white dark:bg-[#24191D] border-2 border-[#C6A15B]/50 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3 shadow-md">
              <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-sans">
                  Unique Privilege Voucher Code
                </span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-mono text-lg sm:text-xl font-bold text-[#702638] dark:text-[#D8B878] tracking-widest bg-stone-100 dark:bg-[#1C1215] px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800">
                    {purchasedCard.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-[#702638] text-white hover:bg-[#8B3045] transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Copy Code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-sans">
                    4-Digit Security PIN
                  </span>
                  <span className="font-mono text-base font-bold text-[#702638] dark:text-[#E8A598] tracking-widest">
                    {purchasedCard.pin}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-sans">
                    Face Value
                  </span>
                  <span className="text-base font-bold text-[#C6A15B]">
                    {formatCurrencyINR(purchasedCard.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={purchasedCard.viewUrl || `/gift-card/${purchasedCard.code}`}
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C6A15B] to-[#E6C687] text-[#351018] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Digital Card</span>
              </Link>

              {onApplyGiftCardToCart && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyGiftCardToCart(purchasedCard.code, purchasedCard.amount);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#702638] to-[#9E3D52] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Apply Instantly to Cart</span>
                </button>
              )}

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`✨ Dearest ${recipientName}, you have received a YAZHINI Fine Jewels Gift Voucher of ${formatCurrencyINR(purchasedCard.amount)} from ${senderName}!\n\nVoucher Code: ${purchasedCard.code}\nSecurity PIN: ${purchasedCard.pin}\n"${personalMessage}"\n\nRedeem online at yazhini.com or at any YAZHINI showroom.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setPurchasedCard(null);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default GiftCardModal;
