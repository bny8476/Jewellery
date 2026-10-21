import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Coins, Sparkles, Building2, Download, 
  CheckCircle2, Lock, Truck, History, TrendingUp, Wallet, X,
  Pause, Play, Calendar, PlusCircle
} from 'lucide-react';
import { 
  fetchDigitalGoldRates, requestBullionQuote, createBuyOrder, 
  verifyBuyPayment, executeSellBack, fetchRedemptionProducts, 
  createRedemptionOrder, requestPhysicalRedemption, fetchCustomerWallet,
  createDigitalGoldSip, fetchCustomerSipPlans, pauseDigitalGoldSip,
  resumeDigitalGoldSip, cancelDigitalGoldSip, executeSipCycleNow,
  DigitalGoldRates, BullionQuote, RedemptionProduct, CustomerWallet, DigitalGoldSipPlan
} from '../services/digitalGoldService';
import { supabase } from '../lib/supabase';
import { toast } from '../utils/toast';
import { goldCardEntrance, EASINGS } from '../utils/motion';
import { formatCurrencyINR } from '../utils/formatters';
import { SwarnaNidhiModal } from '../components/SwarnaNidhiModal';
import { StoreLocatorModal } from '../components/StoreLocatorModal';

export default function AuraGold() {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL' | 'REDEEM' | 'VAULT' | 'SIP'>('BUY');
  const [rates, setRates] = useState<DigitalGoldRates | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isSwarnaNidhiOpen, setIsSwarnaNidhiOpen] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);

  // Buy State
  const [selectedMetal, setSelectedMetal] = useState<'GOLD_24K_9999' | 'SILVER_999'>('GOLD_24K_9999');
  const [buyMode, setBuyMode] = useState<'INR' | 'GRAMS'>('INR');
  const [buyInput, setBuyInput] = useState<string>('1000');
  const [activeQuote, setActiveQuote] = useState<BullionQuote | null>(null);
  const [quoteSecondsLeft, setQuoteSecondsLeft] = useState<number>(300);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any | null>(null);

  // Sell State
  const [sellGrams, setSellGrams] = useState<string>('0.1');
  const [sellQuote, setSellQuote] = useState<BullionQuote | null>(null);
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });

  // Redeem State
  const [redemptionProducts, setRedemptionProducts] = useState<RedemptionProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<RedemptionProduct | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    deliveryName: '',
    deliveryPhone: '',
    deliveryAddress: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [isRedeeming, setIsRedeeming] = useState(false);

  // SIP State
  const [sipPlans, setSipPlans] = useState<DigitalGoldSipPlan[]>([]);
  const [loadingSip, setLoadingSip] = useState(false);
  const [sipFrequency, setSipFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [sipAmount, setSipAmount] = useState<number>(1000);
  const [sipMetal, setSipMetal] = useState<'GOLD_24K_9999' | 'SILVER_999'>('GOLD_24K_9999');
  const [sipExecuteFirst, setSipExecuteFirst] = useState<boolean>(true);
  const [isCreatingSip, setIsCreatingSip] = useState(false);
  const [activeSipActionId, setActiveSipActionId] = useState<string | null>(null);

  // Load User, Rates, Wallet, and SIP
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        refreshWallet();
        loadSipPlans();
      }
    });

    loadRates();
    loadRedemptionProducts();

    const rateInterval = setInterval(loadRates, 60000); // 1-min rate refresh
    return () => clearInterval(rateInterval);
  }, []);

  // Countdown timer for locked quote
  useEffect(() => {
    if (!activeQuote) return;
    const expiryTime = new Date(activeQuote.expiresAt).getTime();
    
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setQuoteSecondsLeft(remaining);
      if (remaining <= 0) {
        setActiveQuote(null);
        toast.info('Bullion quote expired. Rates refreshed.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuote]);

  const loadRates = async () => {
    try {
      setLoadingRates(true);
      const data = await fetchDigitalGoldRates();
      setRates(data);
    } catch (err: any) {
      console.error('Rates error:', err);
    } finally {
      setLoadingRates(false);
    }
  };

  const refreshWallet = async () => {
    try {
      const data = await fetchCustomerWallet();
      setWallet(data);
    } catch (err: any) {
      console.warn('Wallet fetch error:', err.message);
    }
  };

  const loadRedemptionProducts = async () => {
    try {
      const prods = await fetchRedemptionProducts();
      setRedemptionProducts(prods);
      if (prods.length > 0) setSelectedProduct(prods[0]);
    } catch (err) {
      console.error('Failed to load redemption products:', err);
    }
  };

  const loadSipPlans = async () => {
    try {
      setLoadingSip(true);
      const plans = await fetchCustomerSipPlans();
      setSipPlans(plans);
    } catch (err) {
      console.warn('Failed to load SIP plans:', err);
    } finally {
      setLoadingSip(false);
    }
  };

  // Generate 5-minute Locked Buy Quote
  const handleGetBuyQuote = async () => {
    const val = parseFloat(buyInput);
    if (!val || val <= 0) {
      toast.error('Please enter a valid amount or gram weight.');
      return;
    }

    try {
      setIsQuoting(true);
      const quote = await requestBullionQuote({
        type: 'BUY',
        metalType: selectedMetal,
        amountInr: buyMode === 'INR' ? val : undefined,
        grams: buyMode === 'GRAMS' ? val : undefined
      });
      setActiveQuote(quote);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate quote.');
    } finally {
      setIsQuoting(false);
    }
  };

  // Generate 5-minute Locked Sell Quote
  const handleGetSellQuote = async () => {
    const g = parseFloat(sellGrams);
    if (!g || g <= 0) {
      toast.error('Please enter grams to sell.');
      return;
    }
    const currentGoldBalance = wallet?.availableGrams || 0;
    if (g > currentGoldBalance) {
      toast.error(`Insufficient balance. You have ${currentGoldBalance.toFixed(4)}g available.`);
      return;
    }

    try {
      setIsQuoting(true);
      const quote = await requestBullionQuote({
        type: 'SELL',
        metalType: 'GOLD_24K_9999',
        grams: g
      });
      setSellQuote(quote);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate sell quote.');
    } finally {
      setIsQuoting(false);
    }
  };

  // Execute Buy Gold via Razorpay with Sandbox fallback
  const handleConfirmBuy = async () => {
    if (!user) {
      toast.error('Please sign in to buy digital bullion.');
      return;
    }
    if (!activeQuote) {
      toast.error('Active quote missing or expired.');
      return;
    }

    try {
      setIsPurchasing(true);
      const orderData = await createBuyOrder(activeQuote.quoteId);

      const rzpOptions = {
        key: orderData.razorpay.key,
        amount: orderData.razorpay.amount,
        currency: 'INR',
        name: orderData.razorpay.name,
        description: orderData.razorpay.description,
        order_id: orderData.razorpay.orderId.startsWith('rzp_order') ? orderData.razorpay.orderId : undefined,
        handler: async (response: any) => {
          try {
            const verifyRes = await verifyBuyPayment({
              transactionId: orderData.transaction.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setPurchaseSuccess(verifyRes);
            setActiveQuote(null);
            refreshWallet();
            toast.success('🎉 Bullion allocated to your vault successfully!');
          } catch (vErr: any) {
            toast.error(vErr.message || 'Payment verification failed.');
          }
        },
        prefill: {
          email: user.email,
          name: user.user_metadata?.full_name || 'Valued Patron'
        },
        theme: {
          color: '#702638'
        }
      };

      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.open();
      } else {
        toast.info('Processing sandbox digital bullion allocation...');
        const verifyRes = await verifyBuyPayment({
          transactionId: orderData.transaction.id,
          razorpay_payment_id: `pay_sandbox_${Date.now()}`
        });
        setPurchaseSuccess(verifyRes);
        setActiveQuote(null);
        refreshWallet();
        toast.success('🎉 Bullion allocated to your vault successfully (Sandbox Mode)!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Purchase failed.');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Execute Sell Gold
  const handleSellGold = async () => {
    if (!user) {
      toast.error('Please sign in to sell digital gold.');
      return;
    }
    if (!sellQuote) {
      toast.error('Please request a sell quote first.');
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      toast.error('Please provide complete bank account details for IMPS/NEFT payout.');
      return;
    }

    try {
      setIsSelling(true);
      const res = await executeSellBack({
        quoteId: sellQuote.quoteId,
        bankDetails
      });
      toast.success(res.message);
      setSellQuote(null);
      refreshWallet();
    } catch (err: any) {
      toast.error(err.message || 'Sell transaction failed.');
    } finally {
      setIsSelling(false);
    }
  };

  // Execute Physical Redemption with Minting Fee Checkout
  const handleRedeem = async () => {
    if (!user) {
      toast.error('Please sign in to redeem physical gold.');
      return;
    }
    if (!selectedProduct) {
      toast.error('Please select a minted coin or bar denomination.');
      return;
    }
    if (!shippingAddress.deliveryName || !shippingAddress.deliveryAddress || !shippingAddress.pincode) {
      toast.error('Please enter complete insured delivery address.');
      return;
    }

    try {
      setIsRedeeming(true);
      const orderData = await createRedemptionOrder({
        productId: selectedProduct.id,
        shippingAddress
      });

      const rzpOptions = {
        key: orderData.razorpay.key,
        amount: orderData.razorpay.amount,
        currency: 'INR',
        name: orderData.razorpay.name,
        description: orderData.razorpay.description,
        order_id: orderData.razorpay.orderId.startsWith('rzp') ? orderData.razorpay.orderId : undefined,
        handler: async (response: any) => {
          try {
            const res = await requestPhysicalRedemption({
              productId: selectedProduct.id,
              shippingAddress,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success(res.message);
            refreshWallet();
            setActiveTab('VAULT');
          } catch (vErr: any) {
            toast.error(vErr.message || 'Minting payment verification failed.');
          }
        },
        prefill: {
          email: user.email,
          name: shippingAddress.deliveryName,
          contact: shippingAddress.deliveryPhone
        },
        theme: {
          color: '#702638'
        }
      };

      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.open();
      } else {
        toast.info('Processing sandbox minting fee authorization...');
        const res = await requestPhysicalRedemption({
          productId: selectedProduct.id,
          shippingAddress,
          razorpay_payment_id: `pay_minting_${Date.now()}`
        });
        toast.success(res.message);
        refreshWallet();
        setActiveTab('VAULT');
      }
    } catch (err: any) {
      toast.error(err.message || 'Redemption request failed.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Create SIP Plan
  const handleCreateSip = async () => {
    if (!user) {
      toast.error('Please sign in to start a Systematic Investment Plan.');
      return;
    }
    if (sipAmount < 100) {
      toast.error('Minimum SIP installment is ₹100.');
      return;
    }

    try {
      setIsCreatingSip(true);
      const res = await createDigitalGoldSip({
        frequency: sipFrequency,
        amountInr: sipAmount,
        metalType: sipMetal,
        executeFirstNow: sipExecuteFirst
      });
      toast.success(res.message);
      await loadSipPlans();
      refreshWallet();
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate SIP plan.');
    } finally {
      setIsCreatingSip(false);
    }
  };

  const handlePauseSip = async (planId: string) => {
    try {
      setActiveSipActionId(planId);
      await pauseDigitalGoldSip(planId);
      toast.success('SIP Plan paused.');
      await loadSipPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to pause SIP');
    } finally {
      setActiveSipActionId(null);
    }
  };

  const handleResumeSip = async (planId: string) => {
    try {
      setActiveSipActionId(planId);
      await resumeDigitalGoldSip(planId);
      toast.success('SIP Plan resumed.');
      await loadSipPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resume SIP');
    } finally {
      setActiveSipActionId(null);
    }
  };

  const handleCancelSip = async (planId: string) => {
    if (!confirm('Are you sure you want to cancel this SIP? You will keep all accumulated gold.')) return;
    try {
      setActiveSipActionId(planId);
      await cancelDigitalGoldSip(planId);
      toast.success('SIP Plan cancelled.');
      await loadSipPlans();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel SIP');
    } finally {
      setActiveSipActionId(null);
    }
  };

  const handleExecuteCycleNow = async (planId: string) => {
    try {
      setActiveSipActionId(planId);
      const res = await executeSipCycleNow(planId);
      toast.success(res.message);
      await loadSipPlans();
      refreshWallet();
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute installment');
    } finally {
      setActiveSipActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2420] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4A1521] via-[#702638] to-[#2B0B13] p-8 sm:p-12 text-white shadow-2xl mb-8 border border-[#D4AF37]/30">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FAF7F2] text-xs font-medium tracking-wide mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>24K 999.9 Gold &amp; 999 Silver • 100% Insured Bullion</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-white tracking-[-0.01em]">
                Aura Gold™ <span className="font-serif italic font-normal text-[#D4AF37]">Digital Vault</span>
              </h1>
              <p className="mt-2 text-[#E8D5D0] text-sm sm:text-base max-w-xl font-light leading-relaxed">
                Buy, accumulate via SIP, sell back, or convert pure precious metals into certified physical minted coins starting from ₹100. Stored securely in IDBI &amp; BRINKS insured vaults.
              </p>
            </div>

            {/* Live Spot Rates Dual Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[280px] hover:border-[#D4AF37]/50 transition-colors shadow-lg space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#E8D5D0] mb-1 font-sans">
                  <span className="uppercase tracking-[0.08em] font-medium text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                    Live 24K 999.9 Gold
                  </span>
                  <button onClick={loadRates} className="hover:text-white transition-colors" title="Refresh Live Rates">
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRates ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="text-2xl sm:text-3xl text-white rate-financial tracking-tight">
                  {rates ? formatCurrencyINR(rates.buyRatePerGram) : '₹14,928'}<span className="text-sm font-normal text-[#E8D5D0]">/g</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#FAF7F2]/80 pt-1">
                  <span>Sell-back: <span className="rate-financial">{rates ? formatCurrencyINR(rates.sellRatePerGram) : '₹14,523'}</span>/g</span>
                  <span className="text-[#34D399] font-medium">+3% GST</span>
                </div>
              </div>

              {rates?.silver && (
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-[#E8D5D0] mb-0.5 font-sans">
                    <span className="uppercase tracking-[0.08em] font-medium text-[10px]">Pure 999 Silver</span>
                    <span className="rate-financial text-white font-semibold">₹{rates.silver.buyRatePerGram}/g</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#FAF7F2]/70">
                    <span>Sell-back: ₹{rates.silver.sellRatePerGram}/g</span>
                    <span>₹{Math.round(rates.silver.buyRatePerGram * 1000).toLocaleString('en-IN')}/kg</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#EFE9DF] rounded-2xl mb-8 border border-[#E5DAC8] max-w-2xl mx-auto justify-center">
          {[
            { id: 'BUY', label: 'Buy Bullion', icon: ArrowDownLeft },
            { id: 'SELL', label: 'Sell / Cash-out', icon: ArrowUpRight },
            { id: 'REDEEM', label: 'Minted Coins', icon: Coins },
            { id: 'VAULT', label: 'My Vault', icon: Wallet },
            { id: 'SIP', label: 'Gold SIP', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setActiveQuote(null); }}
                className={`relative px-4 sm:px-5 py-2.5 rounded-xl font-serif text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive 
                    ? 'text-white shadow-md' 
                    : 'text-[#702638] hover:text-[#4A1521] hover:bg-[#E5DAC8]/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="auraTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#702638] to-[#9B3650] rounded-xl z-0"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={goldCardEntrance}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: EASINGS.velvet }}
          >
            {/* TAB 1: BUY BULLION */}
            {activeTab === 'BUY' && (
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#702638]">Buy Pure Precious Metals</h2>
                    <p className="text-xs text-gray-500">24 Karat 999.9 Gold or Pure 999 Silver backed by physical vaults</p>
                  </div>
                  
                  {/* Metal Selector */}
                  <div className="flex gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-gray-200">
                    <button
                      onClick={() => { setSelectedMetal('GOLD_24K_9999'); setActiveQuote(null); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedMetal === 'GOLD_24K_9999' ? 'bg-[#702638] text-white' : 'text-gray-600'
                      }`}
                    >
                      24K Gold
                    </button>
                    <button
                      onClick={() => { setSelectedMetal('SILVER_999'); setActiveQuote(null); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedMetal === 'SILVER_999' ? 'bg-[#702638] text-white' : 'text-gray-600'
                      }`}
                    >
                      999 Silver
                    </button>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-1 rounded-2xl mb-6 border border-gray-200">
                  <button
                    onClick={() => { setBuyMode('INR'); setActiveQuote(null); }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      buyMode === 'INR' ? 'bg-white shadow text-[#702638]' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Buy in Rupees (₹)
                  </button>
                  <button
                    onClick={() => { setBuyMode('GRAMS'); setActiveQuote(null); }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      buyMode === 'GRAMS' ? 'bg-white shadow text-[#702638]' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Buy in Grams (g)
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    {buyMode === 'INR' ? 'Enter Purchase Amount (₹)' : 'Enter Weight to Buy (grams)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                      {buyMode === 'INR' ? '₹' : 'g'}
                    </span>
                    <input
                      type="number"
                      value={buyInput}
                      onChange={(e) => { setBuyInput(e.target.value); setActiveQuote(null); }}
                      placeholder={buyMode === 'INR' ? '1000' : '0.1'}
                      className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-[#EBE3D5] text-xl font-bold focus:outline-none focus:border-[#702638] text-gray-900"
                    />
                  </div>

                  {/* Quick Select Presets */}
                  {buyMode === 'INR' && (
                    <div className="flex gap-2 mt-3">
                      {['500', '1000', '2500', '5000', '10000'].map(amt => (
                        <button
                          key={amt}
                          onClick={() => { setBuyInput(amt); setActiveQuote(null); }}
                          className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#702638] hover:text-[#702638]"
                        >
                          +₹{amt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generate Quote or Show Locked Quote Breakdown */}
                {!activeQuote ? (
                  <button
                    onClick={handleGetBuyQuote}
                    disabled={isQuoting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isQuoting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Locking Real-Time Rate...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 text-[#D4AF37]" />
                        <span>Get Locked 5-Min Price Quote</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Locked Quote Summary Box */}
                    <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#D4AF37]/40 relative">
                      <div className="flex justify-between items-center text-xs mb-3 pb-2 border-b border-gray-200">
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Rate Locked ({activeQuote.quoteReference.slice(0, 14)})
                        </span>
                        <span className="font-mono text-red-600 font-bold">
                          ⏱ {Math.floor(quoteSecondsLeft / 60)}:{(quoteSecondsLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Metal &amp; Purity:</span>
                          <span className="font-semibold text-gray-900">{selectedMetal === 'SILVER_999' ? 'Pure 999 Silver' : '24K 999.9 Gold'}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Rate per gram:</span>
                          <span className="font-semibold text-gray-900">{formatCurrencyINR(activeQuote.ratePerGram)}/g</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Pure Weight Allocated:</span>
                          <span className="font-bold text-emerald-700">{activeQuote.grams} grams</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Metal Value:</span>
                          <span className="text-gray-900">{formatCurrencyINR(activeQuote.metalValue)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>GST (3% Bullion):</span>
                          <span className="text-gray-900">{formatCurrencyINR(activeQuote.gstAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-[#702638] pt-2 border-t border-gray-200">
                          <span>Total Payable:</span>
                          <span className="price-total text-base">{formatCurrencyINR(activeQuote.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveQuote(null)}
                        className="py-3 px-4 rounded-xl border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmBuy}
                        disabled={isPurchasing}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isPurchasing ? 'Processing Order...' : `Pay ${formatCurrencyINR(activeQuote.totalAmount)} via Razorpay`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Vault & Storage Guarantee Footnote */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    IDBI Trustee Custody
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    100% Physical BRINKS Vault
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    BIS Hallmarked
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: SELL / CASH-OUT */}
            {activeTab === 'SELL' && (
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
                <h2 className="text-xl font-serif font-bold text-[#702638] mb-1">Sell Digital Gold for Instant Cash</h2>
                <p className="text-xs text-gray-500 mb-6">Funds transferred straight to your bank account via IMPS/NEFT with zero hidden deductions</p>

                {/* Current Holdings Pill */}
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-gray-200 mb-6 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-500 block">Available Vault Gold:</span>
                    <span className="text-lg font-bold text-[#702638] price-total">
                      {wallet ? wallet.availableGrams.toFixed(4) : '0.0000'} grams
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block">Live Buyback Rate:</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {rates ? formatCurrencyINR(rates.sellRatePerGram) : '₹14,523'}/g
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Weight to Sell (grams)</label>
                  <input
                    type="number"
                    value={sellGrams}
                    onChange={(e) => { setSellGrams(e.target.value); setSellQuote(null); }}
                    step="0.0001"
                    placeholder="0.1"
                    className="w-full p-4 rounded-2xl border-2 border-[#EBE3D5] text-xl font-bold focus:outline-none focus:border-[#702638] text-gray-900"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (wallet) setSellGrams((wallet.availableGrams * 0.25).toFixed(4));
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 hover:border-[#702638] text-gray-600"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => {
                        if (wallet) setSellGrams((wallet.availableGrams * 0.5).toFixed(4));
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 hover:border-[#702638] text-gray-600"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => {
                        if (wallet) setSellGrams(wallet.availableGrams.toFixed(4));
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 hover:border-[#702638] text-gray-600"
                    >
                      100% (Sell All)
                    </button>
                  </div>
                </div>

                {!sellQuote ? (
                  <button
                    onClick={handleGetSellQuote}
                    disabled={isQuoting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    {isQuoting ? 'Calculating Payout...' : 'Get Sell Quote'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#D4AF37]/40 text-xs space-y-2">
                      <div className="flex justify-between font-bold text-sm text-gray-900">
                        <span>Total Cash Proceed:</span>
                        <span className="text-emerald-700 price-total">{formatCurrencyINR(sellQuote.totalAmount)}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Net proceed at {formatCurrencyINR(sellQuote.ratePerGram)}/g for {sellQuote.grams}g (Zero GST on sellback)
                      </div>
                    </div>

                    {/* Bank Details Form */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Bank Account Details (IMPS Payout)</h4>
                      <div>
                        <input
                          type="text"
                          value={bankDetails.accountHolderName}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                          placeholder="Account Holder Full Name"
                          className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                          placeholder="Account Number"
                          className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                        />
                        <input
                          type="text"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                          placeholder="IFSC Code"
                          className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSellGold}
                      disabled={isSelling}
                      className="w-full py-4 rounded-2xl bg-emerald-700 text-white font-serif font-bold text-base shadow-lg hover:bg-emerald-800 transition-all"
                    >
                      {isSelling ? 'Processing IMPS Payout...' : `Confirm & Withdraw ${formatCurrencyINR(sellQuote.totalAmount)}`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MINTED COINS REDEMPTION */}
            {activeTab === 'REDEEM' && (
              <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-2xl font-serif font-bold text-[#702638]">Convert Digital Gold to Minted Coins</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Convert your digital vault balance into pure 24K 999.9 BIS hallmarked gold coins delivered in tamper-proof CertiCards with Sequel Global transit insurance.
                  </p>
                </div>

                {/* Product Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {redemptionProducts.map(prod => {
                    const isSelected = selectedProduct?.id === prod.id;
                    return (
                      <motion.div
                        key={prod.id}
                        whileHover={{ y: -5, scale: 1.015 }}
                        transition={{ duration: 0.35, ease: EASINGS.velvet }}
                        onClick={() => setSelectedProduct(prod)}
                        className={`group relative bg-white rounded-3xl p-5 shadow-md hover:shadow-2xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden sheen-container ${
                          isSelected ? 'border-[#702638] ring-2 ring-[#702638]/20' : 'border-gray-200 hover:border-[#D4AF37]/60'
                        }`}
                      >
                        <div>
                          <div className="relative overflow-hidden rounded-2xl mb-4">
                            <img 
                              src={prod.imageUrl} 
                              alt={prod.name} 
                              className="w-full h-40 object-cover group-hover:scale-106 transition-transform duration-600 ease-out"
                            />
                            <div className="sheen-sweep" />
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            {prod.purity}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-gray-900 mt-2">{prod.name}</h4>
                          <p className="text-[11px] text-gray-500 mt-1">{prod.dimension}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-500">Minting &amp; Assay Fee:</span>
                          <span className="font-bold text-[#702638] tabular-nums">₹{prod.mintingCharges}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Delivery Address Form Card */}
                {selectedProduct && (
                  <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
                    <h3 className="font-serif font-bold text-base text-[#702638] mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#D4AF37]" />
                      Insured Doorstep Delivery Address
                    </h3>
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Recipient Name</label>
                          <input
                            type="text"
                            value={shippingAddress.deliveryName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryName: e.target.value })}
                            placeholder="Full name"
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            value={shippingAddress.deliveryPhone}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryPhone: e.target.value })}
                            placeholder="10-digit mobile"
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Street Address</label>
                        <textarea
                          rows={2}
                          value={shippingAddress.deliveryAddress}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryAddress: e.target.value })}
                          placeholder="Flat / House No, Street, Landmark"
                          className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">City</label>
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                            placeholder="City"
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">State</label>
                          <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                            placeholder="State"
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">Pincode</label>
                          <input
                            type="text"
                            value={shippingAddress.pincode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                            placeholder="6-digit PIN"
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-base shadow-lg hover:shadow-xl transition-all"
                    >
                      {isRedeeming ? 'Authorizing Minting Order...' : `Redeem ${selectedProduct.grams}g Coin (Pay Minting Fee: ₹${selectedProduct.mintingCharges})`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MY VAULT & LEDGER */}
            {activeTab === 'VAULT' && (
              <div className="space-y-8">
                {/* Multi-Asset Vault Holdings Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Portfolio */}
                  <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#EBE3D5] flex flex-col justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">
                        Total Bullion Valuation
                      </span>
                      <div className="text-3xl sm:text-4xl price-total text-[#702638]">
                        {wallet ? formatCurrencyINR(wallet.marketValuationInr) : '₹0'}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        100% Physical IDBI / BRINKS Vault Custody
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-4 font-mono">
                      Account: {wallet?.accountNumber || 'AG-VAULT-2026'}
                    </div>
                  </div>

                  {/* 24K Gold Balance */}
                  <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#EBE3D5] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-semibold uppercase tracking-wider">24K 999.9 Gold</span>
                        <Coins className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 rate-financial">
                        {wallet ? wallet.goldBalanceGrams.toFixed(4) : '0.0000'} <span className="text-sm font-normal text-gray-500">grams</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Valuation: <strong className="text-gray-900">{wallet ? formatCurrencyINR(wallet.goldMarketValuationInr || 0) : '₹0'}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('BUY')}
                      className="mt-4 w-full py-2 bg-[#702638] text-white rounded-xl text-xs font-bold hover:bg-[#5C1F2E] transition-colors"
                    >
                      + Accumulate Gold
                    </button>
                  </div>

                  {/* Pure 999 Silver Balance */}
                  <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#EBE3D5] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-semibold uppercase tracking-wider">Pure 999 Silver</span>
                        <Coins className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 rate-financial">
                        {wallet ? (wallet.silverBalanceGrams || 0).toFixed(4) : '0.0000'} <span className="text-sm font-normal text-gray-500">grams</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Valuation: <strong className="text-gray-900">{wallet ? formatCurrencyINR(wallet.silverMarketValuationInr || 0) : '₹0'}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedMetal('SILVER_999'); setActiveTab('BUY'); }}
                      className="mt-4 w-full py-2 bg-stone-700 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
                    >
                      + Accumulate Silver
                    </button>
                  </div>
                </div>

                {/* Double-Entry Transaction Ledger Table */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-serif font-bold text-[#702638] flex items-center gap-2">
                      <History className="w-5 h-5 text-[#D4AF37]" />
                      Authoritative Double-Entry Bullion Ledger
                    </h3>
                    <button
                      onClick={() => toast.success('Vault Certificate download initiated!')}
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audit Certificate</span>
                    </button>
                  </div>

                  {wallet && wallet.recentTransactions && wallet.recentTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Transaction Ref</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Weight (g)</th>
                            <th className="py-3 px-4">Rate</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {wallet.recentTransactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-gray-50/50">
                              <td className="py-3.5 px-4 text-gray-600">{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="py-3.5 px-4 font-mono font-medium number-supporting text-gray-900">{tx.transaction_reference}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' :
                                  tx.type === 'SELL' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {tx.metal_type === 'SILVER_999' ? 'SILVER ' : ''}{tx.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 rate-financial text-gray-900">{Number(tx.grams).toFixed(4)}g</td>
                              <td className="py-3.5 px-4 rate-financial text-gray-600">{formatCurrencyINR(Number(tx.rate_per_gram))}/g</td>
                              <td className="py-3.5 px-4 price-total text-gray-900">{formatCurrencyINR(Number(tx.total_amount))}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500 text-xs">
                      No transactions yet. Start your bullion accumulation journey with as little as ₹100!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: AURA GOLD SIP (SYSTEMATIC INVESTMENT PLAN) */}
            {activeTab === 'SIP' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* YAZHINI Swarna Nidhi Special 11-Month Jewellery Scheme Banner */}
                <div className="bg-gradient-to-r from-[#28030B] via-[#450817] to-[#28030B] rounded-3xl p-6 sm:p-7 text-white border border-[#C6A15B]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#C6A15B]/20 border border-[#C6A15B]/40 flex items-center justify-center text-[#C6A15B] shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C6A15B] bg-[#C6A15B]/15 px-2.5 py-0.5 rounded-full border border-[#C6A15B]/30">
                          11-Month Jewellery Purchase Plan
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">12th Month Paid by YAZHINI</span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FAF5F0]">
                        YAZHINI Swarna Nidhi™ Easy Gold Scheme
                      </h3>
                      <p className="text-xs text-[#FAF5F0]/75 mt-0.5 max-w-lg">
                        Looking to buy heirloom bridal or temple jewellery? Deposit for 11 months and receive 1 month complimentary installment + up to 18% off making charges!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSwarnaNidhiOpen(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#C6A15B] hover:bg-[#D8B878] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 shadow-md cursor-pointer"
                  >
                    <span>Scheme Calculator</span>
                    <Coins className="w-4 h-4" />
                  </button>
                </div>

                {/* SIP Setup Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
                  <div className="text-center max-w-lg mx-auto mb-6">
                    <Coins className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
                    <h2 className="text-2xl font-serif font-bold text-[#702638]">Systematic Investment Plan (SIP)</h2>
                    <p className="text-xs text-gray-600 mt-1">
                      Automate disciplined bullion savings with daily, weekly, or monthly auto-debit starting from ₹100. Rupee-cost average your purchases and beat inflation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: SIP Config Form */}
                    <div className="space-y-5">
                      {/* Frequency Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Debit Frequency</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'DAILY', label: 'Daily (Micro)' },
                            { id: 'WEEKLY', label: 'Weekly' },
                            { id: 'MONTHLY', label: 'Monthly' }
                          ].map(f => (
                            <button
                              key={f.id}
                              onClick={() => setSipFrequency(f.id as any)}
                              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                sipFrequency === f.id
                                  ? 'bg-[#702638] text-white border-[#702638]'
                                  : 'bg-[#FAF7F2] text-gray-600 border-gray-200 hover:border-[#702638]'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Metal Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Asset Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSipMetal('GOLD_24K_9999')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              sipMetal === 'GOLD_24K_9999'
                                ? 'bg-[#702638] text-white border-[#702638]'
                                : 'bg-[#FAF7F2] text-gray-600 border-gray-200 hover:border-[#702638]'
                            }`}
                          >
                            24K 999.9 Gold
                          </button>
                          <button
                            onClick={() => setSipMetal('SILVER_999')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              sipMetal === 'SILVER_999'
                                ? 'bg-[#702638] text-white border-[#702638]'
                                : 'bg-[#FAF7F2] text-gray-600 border-gray-200 hover:border-[#702638]'
                            }`}
                          >
                            Pure 999 Silver
                          </button>
                        </div>
                      </div>

                      {/* Amount Input & Presets */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Installment Amount (₹)</label>
                        <div className="relative mb-2">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                          <input
                            type="number"
                            value={sipAmount}
                            onChange={(e) => setSipAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            min="100"
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-lg font-bold text-gray-900 focus:outline-none focus:border-[#702638]"
                          />
                        </div>
                        <div className="flex gap-1.5">
                          {[100, 500, 1000, 2500, 5000].map(amt => (
                            <button
                              key={amt}
                              onClick={() => setSipAmount(amt)}
                              className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border ${
                                sipAmount === amt
                                  ? 'bg-[#702638]/10 border-[#702638] text-[#702638]'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Immediate 1st Debit Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 pt-1">
                        <input
                          type="checkbox"
                          checked={sipExecuteFirst}
                          onChange={(e) => setSipExecuteFirst(e.target.checked)}
                          className="rounded text-[#702638] focus:ring-[#702638]"
                        />
                        <span>Execute 1st installment immediately and credit vault today</span>
                      </label>

                      <button
                        onClick={handleCreateSip}
                        disabled={isCreatingSip}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>{isCreatingSip ? 'Activating Mandate...' : 'Activate Gold SIP'}</span>
                      </button>
                    </div>

                    {/* Right: SIP Projection & Benefits Card */}
                    <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#EBE3D5] flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#702638] mb-3">Projected Accumulation</h4>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Per Cycle Installment:</span>
                            <span className="font-bold text-gray-900">₹{sipAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Approx. Grams / Cycle:</span>
                            <span className="font-bold text-emerald-700">
                              {rates ? ((sipAmount / 1.03) / rates.buyRatePerGram).toFixed(4) : '0.0650'}g
                            </span>
                          </div>
                          <div className="flex justify-between pb-2 border-b border-gray-200">
                            <span className="text-gray-600">Lock-in Period:</span>
                            <span className="font-bold text-emerald-700">Zero (Liquidate anytime)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Custody &amp; Insurance:</span>
                            <span className="font-bold text-gray-900">100% IDBI Trustee</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                        💡 <strong>Disciplined Averaging:</strong> SIP automatically purchases precious metals at the prevailing 5-minute spot benchmark on each cycle date. Cancel or pause anytime at zero penalty.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active SIP Plans List */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif font-bold text-lg text-[#702638] flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                      My Active Systematic Plans ({sipPlans.length})
                    </h3>
                    <button
                      onClick={loadSipPlans}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Refresh SIP Plans"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingSip ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {sipPlans.length > 0 ? (
                    <div className="space-y-4">
                      {sipPlans.map(plan => {
                        const isActionBusy = activeSipActionId === plan.id;
                        return (
                          <div 
                            key={plan.id}
                            className="bg-[#FAF7F2] rounded-2xl p-5 border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#D4AF37]/50 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  plan.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                  plan.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {plan.status}
                                </span>
                                <span className="font-mono text-xs text-gray-500 font-semibold">{plan.plan_reference}</span>
                              </div>
                              <h4 className="font-serif font-bold text-base text-gray-900">
                                ₹{Number(plan.amount_inr).toLocaleString('en-IN')} / {plan.frequency.toLowerCase()}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                                <span>Total Invested: <strong className="text-gray-900">₹{Number(plan.total_invested_inr).toLocaleString('en-IN')}</strong></span>
                                <span>Accumulated: <strong className="text-emerald-700">{Number(plan.total_grams_accumulated).toFixed(4)}g</strong></span>
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Calendar className="w-3.5 h-3.5" /> Next Debit: {new Date(plan.next_execution_date).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            </div>

                            {/* Plan Action Controls */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                              {plan.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handlePauseSip(plan.id)}
                                  disabled={isActionBusy}
                                  className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>Pause</span>
                                </button>
                              ) : plan.status === 'PAUSED' ? (
                                <button
                                  onClick={() => handleResumeSip(plan.id)}
                                  disabled={isActionBusy}
                                  className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Resume</span>
                                </button>
                              ) : null}

                              {plan.status !== 'CANCELLED' && (
                                <>
                                  <button
                                    onClick={() => handleExecuteCycleNow(plan.id)}
                                    disabled={isActionBusy}
                                    className="px-3 py-1.5 rounded-xl bg-[#702638] text-white text-xs font-semibold hover:bg-[#5C1F2E] transition-colors"
                                  >
                                    {isActionBusy ? 'Processing...' : 'Debit Installment Now'}
                                  </button>

                                  <button
                                    onClick={() => handleCancelSip(plan.id)}
                                    disabled={isActionBusy}
                                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-500">
                      You do not have any active SIP plans yet. Start one above from ₹100!
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Purchase Success Modal */}
        {purchaseSuccess && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#D4AF37]/40 relative text-center">
              <button
                onClick={() => setPurchaseSuccess(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#702638]">Bullion Allocated!</h3>
              <p className="text-xs text-gray-600 mt-2 mb-6">
                Your payment was verified and certified pure bullion has been credited to your insured vault.
              </p>
              <div className="bg-[#FAF7F2] p-4 rounded-2xl text-xs space-y-2 text-left mb-6 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-gray-900">{purchaseSuccess.transaction?.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Metal Weight Added:</span>
                  <span className="font-bold text-emerald-700">+{purchaseSuccess.transaction?.grams}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Vault Balance:</span>
                  <span className="font-bold text-gray-900">{purchaseSuccess.vaultBalance}g</span>
                </div>
              </div>
              <button
                onClick={() => { setPurchaseSuccess(null); setActiveTab('VAULT'); }}
                className="w-full py-3 bg-[#702638] text-white rounded-xl text-xs font-bold hover:bg-[#5C1F2E] transition-colors"
              >
                View Vault Statement &amp; Certificate
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Swarna Nidhi Modal */}
      <SwarnaNidhiModal
        isOpen={isSwarnaNidhiOpen}
        onClose={() => setIsSwarnaNidhiOpen(false)}
        onBookAppointment={() => {
          setIsSwarnaNidhiOpen(false);
          setIsStoreLocatorOpen(true);
        }}
      />

      {/* Store Locator Modal */}
      <StoreLocatorModal
        isOpen={isStoreLocatorOpen}
        onClose={() => setIsStoreLocatorOpen(false)}
      />

      </div>
    </div>
  );
}
