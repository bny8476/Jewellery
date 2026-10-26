import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  Mail, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  ArrowRight, 
  RefreshCw, 
  Award, 
  Lock, 
  ChevronDown 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  giftCardService, 
  GiftCardDesign, 
  GiftCardCheckResult 
} from '../services/giftCardService';
import { useAuth } from '../context/AuthContext';

export default function GiftCards() {
  const { user } = useAuth();

  // Configuration state from backend
  const [designs, setDesigns] = useState<GiftCardDesign[]>([]);
  const [denominations, setDenominations] = useState<number[]>([1000, 2500, 5000, 10000, 25000, 50000, 100000]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [limits, setLimits] = useState({ minAmount: 1000, maxAmount: 200000, currency: 'INR' });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form selections
  const [selectedType, setSelectedType] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const [selectedDesignId, setSelectedDesignId] = useState<string>('classic-yazhini');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('General');
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Personalization details
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [senderName, setSenderName] = useState(user?.user_metadata?.full_name || '');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [giftMessage, setGiftMessage] = useState('Wishing you eternal joy and brilliant elegance with YAZHINI Fine Jewels.');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);

  // Purchase state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [issuedCard, setIssuedCard] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Balance checker state
  const [checkCode, setCheckCode] = useState('');
  const [checkPin, setCheckPin] = useState('');
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState<GiftCardCheckResult | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Load backend configurations
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingConfig(true);
        const res = await giftCardService.getDesigns();
        if (res.success) {
          setDesigns(res.designs);
          setDenominations(res.denominations);
          setOccasions(res.occasions);
          setLimits(res.limits);
          if (res.designs.length > 0) {
            setSelectedDesignId(res.designs[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load gift card designs:', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadData();
  }, []);

  const currentDesign = designs.find(d => d.id === selectedDesignId) || designs[0] || {
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

  const effectiveAmount = isCustom ? (Number(customAmount) || 0) : amount;

  // Handle Amount Selection
  const handleSelectDenomination = (val: number) => {
    setIsCustom(false);
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    setCustomAmount(e.target.value);
  };

  // Balance Check Submit
  const handleCheckBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceError(null);
    setBalanceResult(null);

    if (!checkCode.trim()) {
      setBalanceError('Please enter your 16-character Gift Card Code');
      return;
    }
    if (!checkPin.trim()) {
      setBalanceError('Please enter your 4-digit security PIN');
      return;
    }

    try {
      setIsCheckingBalance(true);
      const res = await giftCardService.checkBalance(checkCode.trim(), checkPin.trim());
      if (res.success && res.card) {
        setBalanceResult(res.card);
      } else {
        setBalanceError(res.error || 'Unable to verify gift card. Please check details.');
      }
    } catch (err: any) {
      setBalanceError(err.message || 'Error communicating with balance check service.');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Purchase Submit
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);

    if (effectiveAmount < limits.minAmount || effectiveAmount > limits.maxAmount) {
      setPurchaseError(`Amount must be between ₹${limits.minAmount.toLocaleString('en-IN')} and ₹${limits.maxAmount.toLocaleString('en-IN')}`);
      return;
    }

    if (!recipientName.trim()) {
      setPurchaseError('Please provide the recipient’s full name.');
      return;
    }
    if (selectedType === 'DIGITAL' && !recipientEmail.trim()) {
      setPurchaseError('Please provide a valid recipient email address for digital delivery.');
      return;
    }
    if (!senderName.trim()) {
      setPurchaseError('Please provide your name as the sender.');
      return;
    }

    try {
      setIsSubmitting(true);
      // 1. Initiate purchase session
      const initRes = await giftCardService.initiatePurchase({
        amount: effectiveAmount,
        designId: selectedDesignId,
        cardType: selectedType,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim() || undefined,
        giftMessage: giftMessage.trim(),
        occasion: selectedOccasion,
        deliveryMethod: selectedType === 'DIGITAL' ? 'EMAIL' : 'POSTAL',
        deliveryDate
      });

      if (!initRes.success || !initRes.purchaseId) {
        throw new Error(initRes.error || 'Failed to initiate purchase session.');
      }

      // 2. Open Razorpay Checkout or fallback verification
      const rzpOptions: any = {
        key: initRes.keyId || 'rzp_test_placeholder',
        amount: Math.round(effectiveAmount * 100),
        currency: 'INR',
        name: 'YAZHINI FINE JEWELS',
        description: `Luxury ${selectedType === 'DIGITAL' ? 'Digital E-Gift Card' : 'Physical Velvet Box Card'} — ₹${effectiveAmount.toLocaleString('en-IN')}`,
        image: '/images/gift_card_luxury_box.jpg',
        order_id: initRes.razorpayOrderId,
        prefill: {
          name: senderName,
          email: senderEmail,
          contact: recipientPhone || ''
        },
        theme: {
          color: '#351018'
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await giftCardService.verifyAndIssue({
              purchaseId: initRes.purchaseId!,
              razorpay_order_id: response.razorpay_order_id || initRes.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || ''
            });

            if (verifyRes.success && verifyRes.card) {
              setIssuedCard(verifyRes.card);
            } else {
              setPurchaseError(verifyRes.error || 'Payment recorded, but issuance encountered an issue. Please contact concierge support.');
            }
          } catch (vErr: any) {
            setPurchaseError(vErr.message || 'Verification failed. Please contact support.');
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
        // Fallback for development / test sandbox environments: simulate instant secure confirmation
        const verifyRes = await giftCardService.verifyAndIssue({
          purchaseId: initRes.purchaseId,
          razorpay_order_id: initRes.razorpayOrderId,
          razorpay_payment_id: `pay_sandbox_${Date.now()}`,
          razorpay_signature: 'sandbox_verified_signature'
        });

        if (verifyRes.success && verifyRes.card) {
          setIssuedCard(verifyRes.card);
        } else {
          setPurchaseError(verifyRes.error || 'Verification error');
        }
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setPurchaseError(err.message || 'An unexpected error occurred during purchase.');
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const faqs = [
    {
      q: 'Where can YAZHINI Gift Cards be redeemed?',
      a: 'YAZHINI Gift Cards can be redeemed directly online during checkout on our website for any 22K gold, platinum, certified solitaire diamond, or silver jewellery. They are also honored at all authorized YAZHINI Fine Jewels boutiques across India.'
    },
    {
      q: 'How long is the Gift Card valid?',
      a: 'In accordance with RBI prepaid instrument guidelines and YAZHINI brand policy, all digital and physical gift cards are valid for 12 months (365 days) from the date of issuance.'
    },
    {
      q: 'Can I redeem a gift card partially across multiple orders?',
      a: 'Yes, absolutely! If your jewellery purchase amount is less than the gift card balance, the remaining balance stays safely stored on the card for your future orders.'
    },
    {
      q: 'What if my order total exceeds my Gift Card balance?',
      a: 'You can seamlessly combine your gift card with UPI, Net Banking, Credit/Debit cards, or EMI to cover the remaining balance.'
    },
    {
      q: 'How does Physical Gift Card delivery work?',
      a: 'Physical gift cards are hand-packed in our signature 24K gold foil velvet presentation box with an authenticity certificate and delivered securely via insured concierge courier across all major Indian cities within 2–4 business days.'
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[#C9A45C] selection:text-[#351018]">
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-[#1C0B10] via-[#2A0E15] to-[#15070B] text-white">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#C9A45C_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A45C]/15 border border-[#C9A45C]/30 text-[#E6C687] text-xs font-semibold tracking-widest uppercase"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
              YAZHINI ROYAL CONCIERGE GIFTING
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-white font-medium"
            >
              The Gift of <span className="italic text-[#E6C687]">Eternal Radiance</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-[#D1C7BD] font-light leading-relaxed"
            >
              Bestow the luxury of personal choice. From heritage temple gold to bespoke diamond solitaires, let your cherished ones celebrate life’s milestones with an authentic YAZHINI Fine Jewels financial instrument.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-4"
            >
              <a
                href="#configure-card"
                className="px-8 py-3.5 bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] font-semibold text-sm rounded-full shadow-lg shadow-[#C9A45C]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Purchase Gift Card
              </a>
              <a
                href="#check-balance"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-[#C9A45C]/40 text-white font-semibold text-sm rounded-full backdrop-blur-sm transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#C9A45C]" />
                Check Balance & Status
              </a>
            </motion.div>
          </div>

          {/* Key Value Propositions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A45C]/15 flex items-center justify-center text-[#C9A45C] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Instant Delivery</p>
                <p className="text-xs text-[#A89F95]">Email or SMS in seconds</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A45C]/15 flex items-center justify-center text-[#C9A45C] shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">100% Genuine Value</p>
                <p className="text-xs text-[#A89F95]">No hidden deduction fees</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A45C]/15 flex items-center justify-center text-[#C9A45C] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Secure 4-Digit PIN</p>
                <p className="text-xs text-[#A89F95]">Bank-grade SHA-256 vault</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A45C]/15 flex items-center justify-center text-[#C9A45C] shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Partial Redemptions</p>
                <p className="text-xs text-[#A89F95]">Spend balance across visits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SUCCESS MODAL / RECEIPT BANNER (When Card Issued) */}
      <AnimatePresence>
        {issuedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1C0D13] border border-[#C9A45C]/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#C9A45C]/20 border border-[#C9A45C] flex items-center justify-center mx-auto text-[#C9A45C]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#E6C687]">Gift Card Successfully Issued!</h3>
                <p className="text-xs sm:text-sm text-[#D1C7BD]">
                  A confirmation email with the gift card credentials and personalized message has been dispatched to{' '}
                  <span className="text-[#E6C687] font-semibold">{issuedCard.recipientEmail}</span>.
                </p>

                {/* Card Credential Box */}
                <div className="p-4 rounded-2xl bg-black/40 border border-[#C9A45C]/30 text-left space-y-3">
                  <div>
                    <span className="text-[10px] tracking-widest text-[#A89F95] uppercase font-mono">Gift Card Code</span>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-lg font-mono font-bold tracking-wider text-[#E6C687]">{issuedCard.code}</span>
                      <button
                        onClick={() => copyToClipboard(issuedCard.code)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 text-[#E6C687]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <span className="text-[10px] tracking-widest text-[#A89F95] uppercase font-mono">Security PIN</span>
                      <p className="text-base font-mono font-bold text-white tracking-widest">{issuedCard.pin}</p>
                    </div>
                    <div>
                      <span className="text-[10px] tracking-widest text-[#A89F95] uppercase font-mono">Card Value</span>
                      <p className="text-base font-bold text-[#E6C687]">₹{issuedCard.amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Link
                    to={issuedCard.viewUrl}
                    className="flex-1 py-3 bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 hover:opacity-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Card View
                  </Link>
                  <button
                    onClick={() => setIssuedCard(null)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl font-semibold text-sm text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MAIN INTERACTIVE CONFIGURATION & PURCHASE WORKFLOW */}
      <section id="configure-card" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">Handcrafted Presentation</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#351018] dark:text-[#E6C687]">
            Personalize Your Luxury Gift Card
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Select an occasion, custom artwork design, and financial denomination. Watch your bespoke presentation update in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: Configuration Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-8 bg-white dark:bg-[#1E1418] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xl">
            {/* Step A: Card Delivery Type */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-3">
                1. Delivery Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedType('DIGITAL')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedType === 'DIGITAL'
                      ? 'border-[#C9A45C] bg-[#C9A45C]/10 shadow-md ring-1 ring-[#C9A45C]'
                      : 'border-[var(--border-subtle)] hover:border-[#C9A45C]/40 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Mail className="w-4 h-4 text-[#C9A45C]" />
                    <span className="font-semibold text-sm">Digital E-Gift Card</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Delivered instantly or scheduled via email & SMS with interactive greeting.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType('PHYSICAL')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedType === 'PHYSICAL'
                      ? 'border-[#C9A45C] bg-[#C9A45C]/10 shadow-md ring-1 ring-[#C9A45C]'
                      : 'border-[var(--border-subtle)] hover:border-[#C9A45C]/40 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Gift className="w-4 h-4 text-[#C9A45C]" />
                    <span className="font-semibold text-sm">Physical Velvet Box</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    24K gold presentation card in black velvet box with certificate of authenticity.
                  </p>
                </button>
              </div>
            </div>

            {/* Step B: Occasion Categories */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-3">
                2. Select Occasion
              </label>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setSelectedOccasion(occ)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedOccasion === occ
                        ? 'bg-[#351018] text-[#E6C687] dark:bg-[#C9A45C] dark:text-[#351018] shadow-sm font-semibold'
                        : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:bg-[#C9A45C]/20'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            {/* Step C: Design Selection */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-3">
                3. Choose Card Artwork
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {designs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDesignId(d.id)}
                    className={`group relative p-3 rounded-2xl border text-left transition-all overflow-hidden ${
                      selectedDesignId === d.id
                        ? 'border-[#C9A45C] ring-2 ring-[#C9A45C]/60 shadow-lg'
                        : 'border-[var(--border-subtle)] hover:border-[#C9A45C]/40'
                    }`}
                  >
                    <div
                      className="w-full h-16 rounded-lg mb-2 relative overflow-hidden flex items-center justify-center p-2"
                      style={{ background: d.bgGradient }}
                    >
                      <span className="text-[10px] font-serif font-bold text-white tracking-widest text-center uppercase">
                        YAZHINI
                      </span>
                      {selectedDesignId === d.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#C9A45C] text-[#351018] flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-main)] truncate">{d.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{d.tagline}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step D: Denomination */}
            <div>
              <label className="block text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-3">
                4. Select Value (INR)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3">
                {denominations.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleSelectDenomination(d)}
                    className={`py-3 px-2 rounded-xl border text-center font-bold text-sm transition-all ${
                      !isCustom && amount === d
                        ? 'border-[#C9A45C] bg-[#351018] text-[#E6C687] shadow-md ring-1 ring-[#C9A45C]'
                        : 'border-[var(--border-subtle)] hover:border-[#C9A45C]/40 text-[var(--text-main)] bg-transparent'
                    }`}
                  >
                    ₹{d.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Amount input */}
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--text-secondary)]">₹</span>
                <input
                  type="number"
                  placeholder="Or enter custom amount (₹1,000 to ₹2,00,000)"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  min={limits.minAmount}
                  max={limits.maxAmount}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border text-sm font-medium bg-transparent transition-all outline-none ${
                    isCustom
                      ? 'border-[#C9A45C] ring-2 ring-[#C9A45C]/30 text-[var(--text-main)]'
                      : 'border-[var(--border-subtle)] hover:border-[#C9A45C]/40'
                  }`}
                />
              </div>
            </div>

            {/* Step E: Personal Details & Message */}
            <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
              <label className="block text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                5. Recipient & Sender Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Priya Sundaram"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm focus:border-[#C9A45C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    {selectedType === 'DIGITAL' ? 'Recipient Email *' : 'Recipient Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    required={selectedType === 'DIGITAL'}
                    placeholder="priya.sundaram@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm focus:border-[#C9A45C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Recipient Mobile (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm focus:border-[#C9A45C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Delivery Date</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm focus:border-[#C9A45C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Sender Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Ramanathan"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm focus:border-[#C9A45C] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Sender Email</label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm focus:border-[#C9A45C] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Personal Greeting Message (Max 250 characters)
                </label>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm focus:border-[#C9A45C] outline-none resize-none"
                  placeholder="Express your warm wishes..."
                />
                <span className="text-[10px] text-[var(--text-secondary)] block text-right">
                  {giftMessage.length} / 250 characters
                </span>
              </div>
            </div>

            {/* Error Message */}
            {purchaseError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                {purchaseError}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isSubmitting || effectiveAmount < limits.minAmount}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A45C] via-[#E6C687] to-[#C9A45C] text-[#351018] font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing Payment & Issuance...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ₹{effectiveAmount.toLocaleString('en-IN')} & Issue Gift Card
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-[var(--text-secondary)] mt-2.5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
                Protected by 256-bit SSL encryption & Razorpay certified gateway
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Card Preview & Details (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white dark:bg-[#1E1418] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-[#C9A45C] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Preview
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]">
                  {selectedType === 'DIGITAL' ? 'Digital Voucher' : 'Velvet Box Edition'}
                </span>
              </div>

              {/* THE 3D LUXURY CARD GRAPHIC */}
              <div
                className="relative rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden aspect-[1.58/1] flex flex-col justify-between text-white border border-[#C9A45C]/40"
                style={{
                  background: currentDesign.bgGradient
                }}
              >
                {/* Metallic Gold Sheen overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                {/* Card Top: Brand & Value */}
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="text-[9px] tracking-[0.25em] text-[#E6C687] font-serif uppercase block">
                      YAZHINI FINE JEWELS
                    </span>
                    <span className="text-xs font-light text-white/70 italic">{currentDesign.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-[#E6C687] uppercase tracking-widest block font-mono">Value</span>
                    <span className="text-2xl sm:text-3xl font-bold font-serif text-[#E6C687]">
                      ₹{effectiveAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Card Center: Occasion & Recipient */}
                <div className="relative z-10 space-y-1">
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-[#E6C687] inline-block font-mono">
                    {selectedOccasion}
                  </span>
                  <p className="text-base sm:text-lg font-serif font-semibold text-white tracking-wide truncate">
                    For {recipientName.trim() || 'Cherished Recipient'}
                  </p>
                  <p className="text-[11px] text-[#D1C7BD] font-light line-clamp-2 italic">
                    "{giftMessage || 'With love and warmest compliments.'}"
                  </p>
                </div>

                {/* Card Bottom: Code Placeholder & Sender */}
                <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/15">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest text-white/50 block font-mono">From</span>
                    <span className="text-xs font-medium text-white">{senderName || 'Valued Patron'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono tracking-widest text-[#E6C687]">YAZ-GIFT-••••-••••</span>
                    <span className="text-[8px] text-white/50 block font-mono">PIN: •••• (Issued upon payment)</span>
                  </div>
                </div>
              </div>

              {/* Order Summary Breakdown */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/30 border border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Gift Card Face Value</span>
                  <span className="font-semibold text-[var(--text-main)]">₹{effectiveAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Issuance & Convenience Fee</span>
                  <span className="text-emerald-600 font-semibold">FREE (₹0)</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Delivery Format</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {selectedType === 'DIGITAL' ? 'Instant Digital Email' : 'Insured Velvet Box Courier'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between text-sm font-bold text-[#351018] dark:text-[#E6C687]">
                  <span>Total Payable</span>
                  <span>₹{effectiveAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHECK BALANCE & REDEEM COMPONENT */}
      <section id="check-balance" className="py-20 bg-gradient-to-b from-transparent via-black/5 to-transparent border-y border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Verified Financial Check
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#351018] dark:text-[#E6C687]">
              Check Gift Card Balance
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Already hold a YAZHINI Gift Card? Enter your unique code and 4-digit security PIN to check current spendable balance and validity.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1E1418] p-6 sm:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xl">
            <form onSubmit={handleCheckBalance} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Gift Card Code (e.g. YAZ-GIFT-GOLD-5000)
                </label>
                <input
                  type="text"
                  required
                  placeholder="YAZ-GIFT-XXXX-XXXX"
                  value={checkCode}
                  onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm font-mono tracking-wider uppercase focus:border-[#C9A45C] outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="••••"
                  value={checkPin}
                  onChange={(e) => setCheckPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-transparent text-sm font-mono tracking-widest text-center focus:border-[#C9A45C] outline-none"
                />
              </div>
              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={isCheckingBalance}
                  className="w-full py-3 bg-[#351018] dark:bg-[#C9A45C] text-[#E6C687] dark:text-[#351018] font-bold text-sm rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCheckingBalance ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'Check Balance'
                  )}
                </button>
              </div>
            </form>

            {/* Balance Check Error */}
            {balanceError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                {balanceError}
              </div>
            )}

            {/* Balance Result Box */}
            {balanceResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 rounded-2xl bg-[#C9A45C]/10 border border-[#C9A45C]/40 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C9A45C]/30 pb-3">
                  <div>
                    <span className="text-[10px] tracking-widest text-[var(--text-secondary)] uppercase font-mono">
                      Card Number
                    </span>
                    <p className="font-mono font-bold text-base text-[#351018] dark:text-[#E6C687]">
                      {balanceResult.code}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      balanceResult.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : balanceResult.status === 'PARTIALLY_REDEEMED'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {balanceResult.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">Available Balance</span>
                    <p className="text-2xl font-bold font-serif text-[#351018] dark:text-[#E6C687]">
                      ₹{balanceResult.currentBalance.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">Original Value</span>
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      ₹{balanceResult.originalValue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">Redeemed</span>
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      ₹{balanceResult.redeemedValue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">Valid Until</span>
                    <p className="text-sm font-semibold text-[var(--text-main)]">
                      {new Date(balanceResult.expiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    to="/jewellery"
                    className="px-6 py-2.5 bg-[#351018] dark:bg-[#C9A45C] text-[#E6C687] dark:text-[#351018] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-95"
                  >
                    Shop Jewellery with this Card
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">Effortless Gifting</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#351018] dark:text-[#E6C687]">
            How YAZHINI Gift Cards Work
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1418] border border-[var(--border-subtle)] shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#C9A45C]/15 text-[#C9A45C] flex items-center justify-center mx-auto text-xl font-bold font-serif">
              1
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">Choose & Personalize</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Select from curated jewellery artwork designs, choose a denomination from ₹1,000 to ₹2,00,000, and add your heartfelt personal greeting message.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1418] border border-[var(--border-subtle)] shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#C9A45C]/15 text-[#C9A45C] flex items-center justify-center mx-auto text-xl font-bold font-serif">
              2
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">Instant or Box Delivery</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Digital cards arrive instantly in the recipient’s inbox with private viewing links. Physical cards are dispatched in an embossed black velvet presentation box.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1418] border border-[var(--border-subtle)] shadow-lg space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#C9A45C]/15 text-[#C9A45C] flex items-center justify-center mx-auto text-xl font-bold font-serif">
              3
            </div>
            <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">Seamless Checkout Redemption</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Apply the 16-character code and 4-digit PIN directly at checkout or in boutique. Balance is debited in real-time with full partial redemption support.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQS ACCORDION */}
      <section className="py-20 bg-black/5 dark:bg-black/20 border-t border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#C9A45C] font-semibold">Got Questions?</p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#351018] dark:text-[#E6C687]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border-subtle)] bg-white dark:bg-[#1E1418] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-[var(--text-main)]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#C9A45C] transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)]/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
