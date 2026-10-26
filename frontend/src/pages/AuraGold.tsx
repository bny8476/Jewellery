import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Coins, Sparkles, Building2, Download, 
  CheckCircle2, Lock, Truck, History, TrendingUp, Wallet, X,
  Pause, Play, Calendar, PlusCircle, Award, Shield, 
  ArrowRight, Zap, Check, ChevronRight, ShoppingCart, Bell,
  User, Info, Tag
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
import { useRates } from '../context/RateContext';

// Custom SVG Gold Bars Ingot icon matching the reference design
function GoldBarsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 18h16l-2-4H6l-2 4z" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 18h16l-2-4H6l-2 4z" />
      <path d="M8 14h8l-1.5-3.5h-5L8 14z" fill="currentColor" fillOpacity="0.25" />
      <path d="M8 14h8l-1.5-3.5h-5L8 14z" />
      <path d="M10 10.5h4l-1-2.5h-2l-1 2.5z" fill="currentColor" fillOpacity="0.35" />
      <path d="M10 10.5h4l-1-2.5h-2l-1 2.5z" />
    </svg>
  );
}

export default function AuraGold() {
  const { rates: contextRates } = useRates();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['BUY', 'SELL', 'REDEEM', 'VAULT', 'SIP'].includes(tabParam.toUpperCase())) {
      setActiveTab(tabParam.toUpperCase() as any);
    }
    const amtParam = searchParams.get('amount');
    if (amtParam) {
      setBuyInput(amtParam);
      setSipAmount(parseInt(amtParam) || 1000);
    }
  }, [searchParams]);

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
      if (contextRates?.gold) {
        data.buyRatePerGram = Math.round(contextRates.gold);
        data.sellRatePerGram = contextRates.sellBack24k ? Math.round(contextRates.sellBack24k) : Math.round(contextRates.gold * 0.9728);
      }
      setRates(data);
    } catch (err: any) {
      console.error('Rates error:', err);
    } finally {
      setLoadingRates(false);
    }
  };

  // Keep AuraGold in lock-step with RateContext whenever live rates are refreshed
  useEffect(() => {
    if (contextRates?.gold) {
      setRates(prev => {
        if (!prev) return null;
        return {
          ...prev,
          buyRatePerGram: Math.round(contextRates.gold),
          sellRatePerGram: contextRates.sellBack24k ? Math.round(contextRates.sellBack24k) : Math.round(contextRates.gold * 0.9728),
          silver: prev.silver ? {
            ...prev.silver,
            sellRatePerGram: contextRates.silver ? Math.round(contextRates.silver) : prev.silver.sellRatePerGram
          } : {
            buyRatePerGram: 228.8,
            sellRatePerGram: contextRates.silver ? Math.round(contextRates.silver) : 220,
            marketSpotRatePerGram: 220,
            spreadPercent: 3.92
          }
        };
      });
    }
  }, [contextRates]);

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
          color: '#861638'
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
            handleTabSwitch('VAULT');
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
          color: '#861638'
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
        handleTabSwitch('VAULT');
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

  const handleTabSwitch = (tab: 'BUY' | 'SELL' | 'REDEEM' | 'VAULT' | 'SIP') => {
    setActiveTab(tab);
    setActiveQuote(null);
    setSellQuote(null);
    setSearchParams({ tab });
  };

  // Real-time calculation helpers for instant form feedback
  const currentActiveRate = selectedMetal === 'SILVER_999' 
    ? (rates?.silver?.buyRatePerGram || 180) 
    : (rates?.buyRatePerGram || 14928);

  const parsedBuyVal = parseFloat(buyInput) || 0;
  
  // Dynamic weight and tax calculations
  const approxNetMetalValue = buyMode === 'INR'
    ? (parsedBuyVal > 0 ? (parsedBuyVal / 1.03) : 0)
    : (parsedBuyVal > 0 ? (parsedBuyVal * currentActiveRate) : 0);

  const approxGstCalculated = buyMode === 'INR'
    ? (parsedBuyVal > 0 ? (parsedBuyVal - approxNetMetalValue) : 0)
    : (parsedBuyVal > 0 ? (approxNetMetalValue * 0.03) : 0);

  const approxGramsCalculated = buyMode === 'INR' 
    ? (parsedBuyVal > 0 ? (approxNetMetalValue / currentActiveRate).toFixed(4) : '0.0000')
    : (parsedBuyVal > 0 ? parsedBuyVal.toFixed(4) : '0.0000');

  const approxTotalPayableCalculated = buyMode === 'INR'
    ? Math.round(parsedBuyVal)
    : Math.round(approxNetMetalValue * 1.03);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#120D0F] text-[#243047] dark:text-[#F8F3F4] font-sans antialiased selection:bg-[#D6A23D]/25 transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL FINTECH DASHBOARD HEADER NAVIGATION (Inspired by Mockup) */}
      {/* ========================================================================= */}
      <header className="bg-white dark:bg-[#171013] border-b border-[#E4E7ED] dark:border-[#46343A] relative z-10 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/30 dark:border-amber-400/20 flex items-center justify-center text-[#D6A23D] dark:text-[#D8B878] shadow-xs">
              <GoldBarsIcon className="w-6 h-6 text-[#D6A23D] dark:text-[#D8B878]" />
            </div>
            <div>
              <div className="font-bold text-xl text-[#243047] dark:text-[#F8F3F4] tracking-tight flex items-center gap-1.5 leading-none">
                <span>GoldVault</span>
              </div>
              <div className="text-[11px] text-[#68758A] dark:text-[#C1B4B8] mt-1 font-medium tracking-wide">
                Invest in a Brighter Future
              </div>
            </div>
          </div>

          {/* Central Navigation Items */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            
            {/* 1. Buy Bullion (Active) */}
            <button
              onClick={() => handleTabSwitch('BUY')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'BUY'
                  ? 'bg-[#861638] text-white shadow-sm'
                  : 'text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-gray-100/70 dark:hover:bg-white/5'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buy Bullion</span>
            </button>

            {/* 2. Sell / Cash out */}
            <button
              onClick={() => handleTabSwitch('SELL')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'SELL'
                  ? 'bg-[#861638] text-white shadow-sm font-bold'
                  : 'text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-gray-100/70 dark:hover:bg-white/5'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Sell / Cash out</span>
            </button>

            {/* 3. Minted Coins */}
            <button
              onClick={() => handleTabSwitch('REDEEM')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'REDEEM'
                  ? 'bg-[#861638] text-white shadow-sm font-bold'
                  : 'text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-gray-100/70 dark:hover:bg-white/5'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Minted Coins</span>
            </button>

            {/* 4. My Vault */}
            <button
              onClick={() => handleTabSwitch('VAULT')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'VAULT'
                  ? 'bg-[#861638] text-white shadow-sm font-bold'
                  : 'text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-gray-100/70 dark:hover:bg-white/5'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>My Vault</span>
            </button>

            {/* 5. Gold SIP */}
            <button
              onClick={() => handleTabSwitch('SIP')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'SIP'
                  ? 'bg-[#861638] text-white shadow-sm font-bold'
                  : 'text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-gray-100/70 dark:hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Gold SIP</span>
            </button>

          </nav>

          {/* Right Header Controls: Notification & User Profile */}
          <div className="flex items-center gap-3">
            <button 
              onClick={loadRates}
              className="p-2.5 rounded-xl text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Refresh Bullion Rates"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${loadingRates ? 'animate-spin' : ''}`} />
            </button>

            <button 
              className="p-2.5 rounded-xl text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="w-2 h-2 rounded-full bg-[#861638] absolute top-2 right-2 ring-2 ring-white dark:ring-[#171013]" />
            </button>

            <div 
              onClick={() => handleTabSwitch('VAULT')}
              className="w-9 h-9 rounded-full bg-[#861638] text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer hover:bg-[#641027] transition-colors"
              title="User Vault Profile"
            >
              <User className="w-4 h-4" />
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA: 2-Column Responsive Desktop Dashboard                 */}
      {/* ========================================================================= */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={goldCardEntrance}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: EASINGS.velvet }}
          >
            {/* =================================================================== */}
            {/* TAB 1: BUY BULLION (Exact Replication of Reference UI)              */}
            {/* =================================================================== */}
            {activeTab === 'BUY' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ------------------------------------------------------------- */}
                {/* LEFT COLUMN: Main Purchase Form (7 Cols)                      */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-8 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-6 transition-colors">
                  
                  {/* A. Form Header & Segmented Metal Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E7ED] dark:border-[#46343A]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-400/30 dark:border-amber-400/25 flex items-center justify-center text-[#D6A23D] dark:text-[#D8B878] shrink-0">
                        <GoldBarsIcon className="w-7 h-7 text-[#D6A23D] dark:text-[#D8B878]" />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#641027] dark:text-[#D8B878] tracking-tight">
                          Buy Pure Precious Metals
                        </h1>
                        <p className="text-xs text-[#68758A] dark:text-[#C1B4B8] mt-0.5 font-normal">
                          Allocated bullion backed by physical bars in secure vaults
                        </p>
                      </div>
                    </div>

                    {/* Segmented Asset Selector: 24K Gold vs 999 Silver */}
                    <div className="flex gap-1.5 bg-[#FAF8F5] dark:bg-[#140D10] p-1 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] shrink-0">
                      <button
                        type="button"
                        onClick={() => { setSelectedMetal('GOLD_24K_9999'); setActiveQuote(null); }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectedMetal === 'GOLD_24K_9999'
                            ? 'bg-[#861638] text-white shadow-xs'
                            : 'bg-transparent text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-white/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <GoldBarsIcon className="w-4 h-4 text-amber-300" />
                        <span>24K Gold</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedMetal('SILVER_999'); setActiveQuote(null); }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectedMetal === 'SILVER_999'
                            ? 'bg-[#861638] text-white shadow-xs'
                            : 'bg-transparent text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] hover:bg-white/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <Coins className="w-4 h-4 text-stone-400" />
                        <span>999 Silver</span>
                      </button>
                    </div>
                  </div>

                  {/* B. Purchase Mode Selector */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#243047] dark:text-[#F8F3F4] mb-2">
                      <span>Purchase Mode</span>
                      <Info className="w-3.5 h-3.5 text-[#68758A] dark:text-[#C1B4B8]" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#F4F5F7] dark:bg-[#140D10] p-1.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A]">
                      <button
                        type="button"
                        onClick={() => { setBuyMode('INR'); setActiveQuote(null); }}
                        className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          buyMode === 'INR'
                            ? 'bg-[#861638] text-white shadow-xs'
                            : 'text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          buyMode === 'INR' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                        }`}>
                          ₹
                        </div>
                        <span>Buy in Rupees (₹)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setBuyMode('GRAMS'); setActiveQuote(null); }}
                        className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          buyMode === 'GRAMS'
                            ? 'bg-[#861638] text-white shadow-xs'
                            : 'text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          buyMode === 'GRAMS' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                        }`}>
                          g
                        </div>
                        <span>Buy in Grams (g)</span>
                      </button>
                    </div>
                  </div>

                  {/* C. Purchase Amount Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#243047] dark:text-[#F8F3F4]">
                        {buyMode === 'INR' ? 'Enter Purchase Amount (₹)' : 'Enter Weight (g)'}
                      </label>
                      <span className="text-xs text-[#68758A] dark:text-[#C1B4B8]">
                        Min: {buyMode === 'INR' ? '₹100' : '0.01g'}
                      </span>
                    </div>

                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-7 h-7 rounded-lg bg-[#F4F5F7] dark:bg-[#281C20] text-[#243047] dark:text-[#D8B878] font-bold text-sm select-none">
                        {buyMode === 'INR' ? '₹' : 'g'}
                      </div>
                      <input
                        type="number"
                        value={buyInput}
                        onChange={(e) => { setBuyInput(e.target.value); setActiveQuote(null); }}
                        placeholder={buyMode === 'INR' ? 'Enter amount in rupees' : 'Enter gold weight in grams'}
                        min={buyMode === 'INR' ? '100' : '0.01'}
                        step={buyMode === 'INR' ? '100' : '0.01'}
                        className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] text-base font-semibold text-[#243047] dark:text-[#F8F3F4] placeholder:text-[#A0AEC0] dark:placeholder:text-[#6E6468] focus:outline-none focus:ring-2 focus:ring-[#861638]/20 dark:focus:ring-[#D8B878]/25 focus:border-[#861638] dark:focus:border-[#D8B878] transition-all bg-white dark:bg-[#140D10]"
                      />
                    </div>
                  </div>

                  {/* D. Estimated Allocation Panel */}
                  <div className="bg-[#FFFDF5] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs transition-colors">
                    <div className="flex items-center gap-2 text-[#243047] dark:text-[#F8F3F4] font-semibold">
                      <Coins className="w-4 h-4 text-[#D6A23D] dark:text-[#D8B878]" />
                      <span>Estimated Allocation</span>
                      <Info className="w-3.5 h-3.5 text-[#68758A] dark:text-[#C1B4B8]" />
                    </div>
                    <div className="font-bold text-[#92400E] dark:text-amber-300 text-sm">
                      ≈ {approxGramsCalculated} grams {selectedMetal === 'SILVER_999' ? 'Silver' : 'Gold'}
                    </div>
                  </div>

                  {/* E. Quick Presets */}
                  <div>
                    <label className="text-xs font-bold text-[#243047] dark:text-[#F8F3F4] block mb-2">
                      Quick Presets
                    </label>
                    <div className="grid grid-cols-5 gap-2.5">
                      {buyMode === 'INR' ? (
                        ['500', '1000', '2500', '5000', '10000'].map(amt => {
                          const isSelected = buyInput === amt;
                          return (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => { setBuyInput(amt); setActiveQuote(null); }}
                              className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#861638] text-white border-[#861638] shadow-xs'
                                  : 'bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] border-[#E4E7ED] dark:border-[#46343A] hover:border-[#861638] dark:hover:border-[#D8B878] hover:text-[#861638] dark:hover:text-[#D8B878]'
                              }`}
                            >
                              ₹{parseInt(amt).toLocaleString('en-IN')}
                            </button>
                          );
                        })
                      ) : (
                        ['0.1', '0.5', '1', '2', '5'].map(gm => {
                          const isSelected = buyInput === gm;
                          return (
                            <button
                              key={gm}
                              type="button"
                              onClick={() => { setBuyInput(gm); setActiveQuote(null); }}
                              className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#861638] text-white border-[#861638] shadow-xs'
                                  : 'bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] border-[#E4E7ED] dark:border-[#46343A] hover:border-[#861638] dark:hover:border-[#D8B878] hover:text-[#861638] dark:hover:text-[#D8B878]'
                              }`}
                            >
                              {gm}g
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* F. Primary Call-to-Action */}
                  {!activeQuote ? (
                    <button
                      type="button"
                      onClick={handleGetBuyQuote}
                      disabled={isQuoting}
                      className="w-full py-4 rounded-xl bg-[#861638] hover:bg-[#641027] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {isQuoting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
                          <span>Locking Real-Time Spot Rate...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 text-[#D6A23D] dark:text-[#D8B878]" />
                          <span>Lock 5-Minute Guaranteed Price Quote</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveQuote(null)}
                          className="py-3.5 px-5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] text-xs font-bold text-[#68758A] dark:text-[#C1B4B8] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmBuy}
                          disabled={isPurchasing}
                          className="flex-1 py-3.5 rounded-xl bg-[#861638] hover:bg-[#641027] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                        >
                          {isPurchasing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                              <span>Securing Bullion Allocation...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Pay {formatCurrencyINR(activeQuote.totalAmount)} via Razorpay</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* G. Trust and Security Indicators */}
                  <div className="pt-4 border-t border-[#E4E7ED] dark:border-[#46343A] grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7ED] dark:divide-[#46343A]">
                    {/* Trust Pillar 1 */}
                    <div className="flex items-center gap-3 pr-2">
                      <ShieldCheck className="w-6 h-6 text-[#16805D] dark:text-[#6BC99A] shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-[#243047] dark:text-[#F8F3F4]">100% Insured Vaults</div>
                        <div className="text-[11px] text-[#68758A] dark:text-[#C1B4B8]">IDBI Insured</div>
                      </div>
                    </div>

                    {/* Trust Pillar 2 */}
                    <div className="flex items-center gap-3 sm:px-3 pt-2 sm:pt-0">
                      <GoldBarsIcon className="w-6 h-6 text-[#D6A23D] dark:text-[#D8B878] shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-[#243047] dark:text-[#F8F3F4]">Brinks Insured Vaults</div>
                        <div className="text-[11px] text-[#68758A] dark:text-[#C1B4B8]">Global Security</div>
                      </div>
                    </div>

                    {/* Trust Pillar 3 */}
                    <div className="flex items-center gap-3 sm:pl-3 pt-2 sm:pt-0">
                      <Award className="w-6 h-6 text-[#243047] dark:text-[#D8B878] shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-[#243047] dark:text-[#F8F3F4]">BIS Hallmarked 100%</div>
                        <div className="text-[11px] text-[#68758A] dark:text-[#C1B4B8]">Purity Guaranteed</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT COLUMN: Order Breakdown + Why Buy Aura Gold (5 Cols)   */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Card 1: Order Breakdown & Audit */}
                  <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-7 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4 transition-colors">
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#E4E7ED] dark:border-[#46343A]">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-[#D6A23D] dark:text-[#D8B878]" />
                        <h2 className="font-bold text-base text-[#641027] dark:text-[#D8B878]">
                          Order Breakdown &amp; Audit
                        </h2>
                      </div>
                      {activeQuote && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-mono font-bold animate-pulse">
                          <span>⏱</span>
                          <span>{Math.floor(quoteSecondsLeft / 60)}:{(quoteSecondsLeft % 60).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Details List */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Selected Asset:</span>
                        <span className="font-bold text-[#243047] dark:text-[#F8F3F4]">
                          {selectedMetal === 'SILVER_999' ? 'Pure 999 Silver' : '24K 999.9 Gold'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Live Buy Rate:</span>
                        <span className="font-bold text-[#243047] dark:text-[#F8F3F4]">
                          {formatCurrencyINR(currentActiveRate)}/g
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Estimated Weight:</span>
                        <span className="font-bold text-[#16805D] dark:text-[#6BC99A]">
                          {approxGramsCalculated} grams
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Mandatory GST:</span>
                        <span className="font-medium text-[#243047] dark:text-[#F8F3F4]">
                          3% (₹{approxGstCalculated.toFixed(1)} Tax)
                        </span>
                      </div>

                      {/* Estimated Total */}
                      <div className="pt-3.5 border-t border-[#E4E7ED] dark:border-[#46343A] flex justify-between items-baseline">
                        <span className="font-bold text-sm text-[#641027] dark:text-[#D8B878]">
                          Estimated Total:
                        </span>
                        <span className="font-bold text-2xl text-[#641027] dark:text-[#D8B878] tracking-tight">
                          ₹{approxTotalPayableCalculated.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Price Volatility Notice Banner */}
                    <div className="bg-[#FFFDF5] dark:bg-amber-950/20 border border-[#FDE68A] dark:border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#92400E] dark:text-amber-200 leading-relaxed transition-colors">
                      <Tag className="w-4 h-4 text-[#D6A23D] dark:text-[#D8B878] shrink-0 mt-0.5" />
                      <span>
                        Click <strong className="font-semibold text-[#92400E] dark:text-amber-300">"Lock 5-Minute Guaranteed Price Quote"</strong> to freeze your purchase price against market price volatility.
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Why Buy Aura Gold™? (Benefits Card) */}
                  <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-7 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4 transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#16805D] dark:text-[#6BC99A]" />
                      <h3 className="font-bold text-base text-[#243047] dark:text-[#F8F3F4]">
                        Why Buy Aura Gold™?
                      </h3>
                    </div>

                    <div className="space-y-3 text-xs text-[#243047] dark:text-[#D8CECE]">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#16805D] dark:text-[#6BC99A] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong className="text-[#16805D] dark:text-[#6BC99A] font-bold">Zero Locker Rent:</strong> Stored securely for lifetime without custodial charges.
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#16805D] dark:text-[#6BC99A] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong className="text-[#16805D] dark:text-[#6BC99A] font-bold">Physical Delivery:</strong> Convert digital weight into 24K certified coins starting from 0.5g.
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#16805D] dark:text-[#6BC99A] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong className="text-[#16805D] dark:text-[#6BC99A] font-bold">24/7 Instant Sell-Back:</strong> Cash out anytime with funds wired directly to your bank account via IMPS.
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 2: SELL / CASH-OUT                                              */}
            {/* =================================================================== */}
            {activeTab === 'SELL' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left 7 Cols: Sell Form */}
                <div className="lg:col-span-7 bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-8 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-6 transition-colors">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#641027] dark:text-[#D8B878]">
                      Sell Digital Gold for Instant Cash
                    </h2>
                    <p className="text-xs text-[#68758A] dark:text-[#C1B4B8] mt-1">
                      Funds transferred directly to your bank account via IMPS with zero hidden deductions
                    </p>
                  </div>

                  {/* Available Vault Balance */}
                  <div className="bg-[#FAF8F5] dark:bg-[#140D10] p-5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-xs text-[#68758A] dark:text-[#C1B4B8] font-semibold block">Available Vault Gold:</span>
                      <span className="text-2xl font-bold text-[#641027] dark:text-[#D8B878]">
                        {wallet ? wallet.availableGrams.toFixed(4) : '0.0000'} grams
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs text-[#68758A] dark:text-[#C1B4B8] font-semibold block">Live Buyback Benchmark:</span>
                      <span className="text-base font-bold text-[#16805D] dark:text-[#6BC99A]">
                        {rates ? formatCurrencyINR(rates.sellRatePerGram) : '₹14,523'}/g
                      </span>
                    </div>
                  </div>

                  {/* Weight to Liquidate Input */}
                  <div>
                    <label className="block text-xs font-bold text-[#243047] dark:text-[#F8F3F4] mb-2">
                      Weight to Liquidate (grams)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#68758A] dark:text-[#C1B4B8] text-sm pointer-events-none">
                        g
                      </span>
                      <input
                        type="number"
                        value={sellGrams}
                        onChange={(e) => { setSellGrams(e.target.value); setSellQuote(null); }}
                        step="0.0001"
                        placeholder="0.1"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] text-base font-semibold text-[#243047] dark:text-[#F8F3F4] bg-white dark:bg-[#140D10] focus:outline-none focus:ring-2 focus:ring-[#861638]/20 dark:focus:ring-[#D8B878]/25 focus:border-[#861638] dark:focus:border-[#D8B878]"
                      />
                    </div>

                    {/* Quick Percentage Presets */}
                    <div className="grid grid-cols-4 gap-2 mt-2.5">
                      {[
                        { label: '25%', frac: 0.25 },
                        { label: '50%', frac: 0.50 },
                        { label: '75%', frac: 0.75 },
                        { label: '100% (Sell All)', frac: 1.00 }
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            if (wallet) {
                              setSellGrams((wallet.availableGrams * p.frac).toFixed(4));
                              setSellQuote(null);
                            }
                          }}
                          className="py-2 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] text-xs font-bold text-[#243047] dark:text-[#F8F3F4] hover:border-[#861638] dark:hover:border-[#D8B878] hover:text-[#861638] dark:hover:text-[#D8B878] bg-white dark:bg-[#140D10] transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IMPS Bank Account Details */}
                  <div className="space-y-4 pt-4 border-t border-[#E4E7ED] dark:border-[#46343A]">
                    <h4 className="text-xs font-bold text-[#243047] dark:text-[#F8F3F4] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#861638] dark:text-[#D8B878]" />
                      Direct Bank Account (IMPS Payout)
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#68758A] dark:text-[#C1B4B8] mb-1">
                          Account Holder Full Name
                        </label>
                        <input
                          type="text"
                          value={bankDetails.accountHolderName}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                          placeholder="As per bank passbook / KYC"
                          className="w-full p-3 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] text-xs bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#68758A] dark:text-[#C1B4B8] mb-1">
                            Bank Account Number
                          </label>
                          <input
                            type="text"
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                            placeholder="Enter bank account number"
                            className="w-full p-3 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] text-xs bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#68758A] dark:text-[#C1B4B8] mb-1">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            value={bankDetails.ifscCode}
                            onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                            placeholder="e.g. HDFC0001234"
                            maxLength={11}
                            className="w-full p-3 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] text-xs uppercase bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {!sellQuote ? (
                    <button
                      type="button"
                      onClick={handleGetSellQuote}
                      disabled={isQuoting}
                      className="w-full py-4 rounded-xl bg-[#861638] hover:bg-[#641027] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75"
                    >
                      {isQuoting ? 'Calculating Instant Payout...' : 'Get Instant Cash Quote'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSellGold}
                      disabled={isSelling}
                      className="w-full py-4 rounded-xl bg-[#16805D] hover:bg-[#126b4d] text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSelling ? 'Processing IMPS Transfer...' : `Confirm & Withdraw ${formatCurrencyINR(sellQuote.totalAmount)}`}
                    </button>
                  )}
                </div>

                {/* Right 5 Cols: Liquidation Summary */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-7 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4 transition-colors">
                    <h3 className="font-bold text-base text-[#641027] dark:text-[#D8B878] flex items-center gap-2 pb-3 border-b border-[#E4E7ED] dark:border-[#46343A]">
                      <Zap className="w-4 h-4 text-[#16805D] dark:text-[#6BC99A]" />
                      Instant Liquidation Summary
                    </h3>

                    {sellQuote ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <span className="text-xs text-emerald-800 dark:text-emerald-300 block font-semibold mb-1">
                            Net Cash Payout:
                          </span>
                          <span className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">
                            {formatCurrencyINR(sellQuote.totalAmount)}
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">
                            Transferred via IMPS within 15–30 minutes
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-[#68758A] dark:text-[#C1B4B8]">
                            <span>Selling Weight:</span>
                            <span className="font-bold text-[#243047] dark:text-[#F8F3F4]">{sellQuote.grams}g</span>
                          </div>
                          <div className="flex justify-between text-[#68758A] dark:text-[#C1B4B8]">
                            <span>Buyback Benchmark Rate:</span>
                            <span className="font-bold text-[#243047] dark:text-[#F8F3F4]">{formatCurrencyINR(sellQuote.ratePerGram)}/g</span>
                          </div>
                          <div className="flex justify-between text-[#68758A] dark:text-[#C1B4B8]">
                            <span>GST on Sell-Back:</span>
                            <span className="font-bold text-[#16805D] dark:text-[#6BC99A]">₹0 (Zero Deduction)</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs text-[#68758A] dark:text-[#C1B4B8]">
                        <p className="leading-relaxed">
                          Enter your desired bullion weight on the left to receive a real-time IMPS payout quotation based on international spot benchmarks.
                        </p>
                        <div className="p-4 bg-[#FAF8F5] dark:bg-[#140D10] rounded-xl border border-[#E4E7ED] dark:border-[#46343A] space-y-2">
                          <div className="flex items-center gap-2 text-[#16805D] dark:text-[#6BC99A] font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>100% Guaranteed Liquidity</span>
                          </div>
                          <p className="text-[11px] text-[#68758A] dark:text-[#C1B4B8]">
                            Unlike physical pawn shops, digital bullion has zero melting losses and no hidden deduction fees during liquidation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 3: MINTED COINS REDEMPTION                                      */}
            {/* =================================================================== */}
            {activeTab === 'REDEEM' && (
              <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#641027] dark:text-[#D8B878]">
                    Convert Digital Gold to Minted Physical Coins
                  </h2>
                  <p className="text-xs sm:text-sm text-[#68758A] dark:text-[#C1B4B8] mt-1.5 leading-relaxed">
                    Convert your digital vault balance into pure 24K 999.9 BIS hallmarked gold coins delivered in tamper-proof CertiCards with Sequel Global transit insurance.
                  </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {redemptionProducts.map(prod => {
                    const isSelected = selectedProduct?.id === prod.id;
                    return (
                      <motion.div
                        key={prod.id}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedProduct(prod)}
                        className={`bg-white dark:bg-[#1E1518] rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected ? 'border-[#861638] dark:border-[#D8B878] ring-2 ring-[#861638]/20 shadow-sm' : 'border-[#E4E7ED] dark:border-[#46343A] hover:border-gray-300 dark:hover:border-stone-600'
                        }`}
                      >
                        <div>
                          <div className="relative overflow-hidden rounded-xl mb-4 bg-gray-50 dark:bg-black/20 aspect-square">
                            <img 
                              src={prod.imageUrl} 
                              alt={prod.name} 
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#861638] text-white text-[10px] font-bold">
                                Selected
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                              {prod.purity}
                            </span>
                            <span className="text-[10px] text-[#68758A] dark:text-[#C1B4B8]">
                              {prod.grams}g
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-[#243047] dark:text-[#F8F3F4] mt-1">{prod.name}</h4>
                          <p className="text-[11px] text-[#68758A] dark:text-[#C1B4B8] mt-0.5">{prod.dimension}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E4E7ED] dark:border-[#46343A] flex items-center justify-between text-xs">
                          <span className="text-[#68758A] dark:text-[#C1B4B8]">Minting Fee:</span>
                          <span className="font-bold text-[#861638] dark:text-[#D8B878]">₹{prod.mintingCharges}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Delivery Form */}
                {selectedProduct && (
                  <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-8 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto transition-colors">
                    <div className="lg:col-span-5 space-y-3">
                      <h3 className="font-bold text-base text-[#641027] dark:text-[#D8B878] flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#D6A23D] dark:text-[#D8B878]" />
                        Selected Coin
                      </h3>
                      <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#140D10] border border-[#E4E7ED] dark:border-[#46343A] space-y-2 text-xs">
                        <div className="font-bold text-sm text-[#243047] dark:text-[#F8F3F4]">{selectedProduct.name}</div>
                        <div className="text-[#68758A] dark:text-[#C1B4B8]">Weight: <strong className="text-[#243047] dark:text-[#F8F3F4]">{selectedProduct.grams}g</strong></div>
                        <div className="text-[#68758A] dark:text-[#C1B4B8]">Minting &amp; CertiCard Fee: <strong className="text-[#861638] dark:text-[#D8B878]">₹{selectedProduct.mintingCharges}</strong></div>
                        <div className="text-[#16805D] dark:text-[#6BC99A] font-semibold">Transit Insurance: Free</div>
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                      <h3 className="font-bold text-base text-[#641027] dark:text-[#D8B878] flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#D6A23D] dark:text-[#D8B878]" />
                        Insured Doorstep Address
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={shippingAddress.deliveryName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryName: e.target.value })}
                            placeholder="Recipient full name"
                            className="w-full p-2.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] text-xs focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                          />
                          <input
                            type="tel"
                            value={shippingAddress.deliveryPhone}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryPhone: e.target.value })}
                            placeholder="Mobile number"
                            className="w-full p-2.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] text-xs focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={shippingAddress.deliveryAddress}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryAddress: e.target.value })}
                          placeholder="Complete street address"
                          className="w-full p-2.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] text-xs focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                            placeholder="City"
                            className="w-full p-2.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] text-xs focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                          />
                          <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                            placeholder="State"
                            className="w-full p-2.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] text-xs focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                          />
                          <input
                            type="text"
                            value={shippingAddress.pincode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                            placeholder="Pincode"
                            maxLength={6}
                            className="w-full p-2.5 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] text-xs focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRedeem}
                          disabled={isRedeeming}
                          className="w-full py-3.5 rounded-xl bg-[#861638] hover:bg-[#641027] text-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-75"
                        >
                          {isRedeeming ? 'Authorizing Minting Order...' : `Redeem Coin (Pay Minting Fee: ₹${selectedProduct.mintingCharges})`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 4: MY VAULT & LEDGER                                            */}
            {/* =================================================================== */}
            {activeTab === 'VAULT' && (
              <div className="space-y-8">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3 transition-colors">
                    <span className="text-xs uppercase tracking-wider text-[#68758A] dark:text-[#C1B4B8] font-bold block">
                      Total Bullion Valuation
                    </span>
                    <div className="text-3xl font-bold text-[#641027] dark:text-[#D8B878]">
                      {wallet ? formatCurrencyINR(wallet.marketValuationInr) : '₹0'}
                    </div>
                    <div className="text-xs text-[#16805D] dark:text-[#6BC99A] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100% IDBI Trustee Custody
                    </div>
                    <div className="text-xs text-[#68758A] dark:text-[#C1B4B8] pt-2 border-t border-[#E4E7ED] dark:border-[#46343A]">
                      Account: <strong className="text-[#243047] dark:text-[#F8F3F4]">{wallet?.accountNumber || 'AG-VAULT-2026'}</strong>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3 transition-colors">
                    <div className="flex items-center justify-between text-xs text-[#68758A] dark:text-[#C1B4B8]">
                      <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">24K 999.9 Gold</span>
                      <GoldBarsIcon className="w-4 h-4 text-[#D6A23D] dark:text-[#D8B878]" />
                    </div>
                    <div className="text-2xl font-bold text-[#243047] dark:text-[#F8F3F4]">
                      {wallet ? wallet.goldBalanceGrams.toFixed(4) : '0.0000'} <span className="text-sm font-normal text-[#68758A] dark:text-[#C1B4B8]">grams</span>
                    </div>
                    <div className="text-xs text-[#68758A] dark:text-[#C1B4B8]">
                      Value: <strong className="text-[#243047] dark:text-[#F8F3F4]">{wallet ? formatCurrencyINR(wallet.goldMarketValuationInr || 0) : '₹0'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedMetal('GOLD_24K_9999'); handleTabSwitch('BUY'); }}
                      className="w-full py-2 bg-[#861638] text-white rounded-xl text-xs font-bold hover:bg-[#641027] transition-colors cursor-pointer"
                    >
                      + Accumulate 24K Gold
                    </button>
                  </div>

                  <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3 transition-colors">
                    <div className="flex items-center justify-between text-xs text-[#68758A] dark:text-[#C1B4B8]">
                      <span className="font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Pure 999 Silver</span>
                      <Coins className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="text-2xl font-bold text-[#243047] dark:text-[#F8F3F4]">
                      {wallet ? (wallet.silverBalanceGrams || 0).toFixed(4) : '0.0000'} <span className="text-sm font-normal text-[#68758A] dark:text-[#C1B4B8]">grams</span>
                    </div>
                    <div className="text-xs text-[#68758A] dark:text-[#C1B4B8]">
                      Value: <strong className="text-[#243047] dark:text-[#F8F3F4]">{wallet ? formatCurrencyINR(wallet.silverMarketValuationInr || 0) : '₹0'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedMetal('SILVER_999'); handleTabSwitch('BUY'); }}
                      className="w-full py-2 bg-stone-700 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      + Accumulate 999 Silver
                    </button>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-8 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#641027] dark:text-[#D8B878] flex items-center gap-2">
                        <History className="w-5 h-5 text-[#D6A23D] dark:text-[#D8B878]" />
                        Authoritative Double-Entry Bullion Ledger
                      </h3>
                      <p className="text-xs text-[#68758A] dark:text-[#C1B4B8] mt-0.5">
                        Cryptographically reconciled bullion deposits, redemptions, and liquidations
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toast.success('Vault Certificate download initiated!')}
                      className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#140D10] text-[#243047] dark:text-[#F8F3F4] border border-[#E4E7ED] dark:border-[#46343A] text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audit Certificate</span>
                    </button>
                  </div>

                  {wallet && wallet.recentTransactions && wallet.recentTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#E4E7ED] dark:border-[#46343A] text-[#68758A] dark:text-[#C1B4B8] font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Transaction Ref</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Weight (g)</th>
                            <th className="py-3 px-4">Rate</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4E7ED] dark:divide-[#46343A]">
                          {wallet.recentTransactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-4 text-[#68758A] dark:text-[#C1B4B8]">
                                {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-[#243047] dark:text-[#F8F3F4]">{tx.transaction_reference}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.type === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
                                  tx.type === 'SELL' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300'
                                }`}>
                                  {tx.metal_type === 'SILVER_999' ? 'SILVER ' : ''}{tx.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#243047] dark:text-[#F8F3F4]">{Number(tx.grams).toFixed(4)}g</td>
                              <td className="py-3.5 px-4 text-[#68758A] dark:text-[#C1B4B8]">{formatCurrencyINR(Number(tx.rate_per_gram))}/g</td>
                              <td className="py-3.5 px-4 font-bold text-[#243047] dark:text-[#F8F3F4]">{formatCurrencyINR(Number(tx.total_amount))}</td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-[#68758A] dark:text-[#C1B4B8] text-xs">
                      No transactions recorded yet. Start your bullion accumulation journey from ₹100!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 5: AURA GOLD SIP                                                */}
            {/* =================================================================== */}
            {activeTab === 'SIP' && (
              <div className="space-y-8">
                {/* Swarna Nidhi Special Banner */}
                <div className="bg-gradient-to-r from-[#3D0A18] via-[#5C1024] to-[#3D0A18] dark:from-[#2A050F] dark:via-[#420A1A] dark:to-[#2A050F] rounded-2xl p-6 sm:p-7 text-white border border-amber-500/30 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30">
                          11-Month Jewellery Purchase Plan
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">12th Month Free</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold">YAZHINI Swarna Nidhi™ Easy Gold Scheme</h3>
                      <p className="text-xs text-stone-300 mt-0.5 max-w-xl">
                        Deposit for 11 months and receive 1 month complimentary installment + up to 18% off making charges!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSwarnaNidhiOpen(true)}
                    className="w-full lg:w-auto px-5 py-3 rounded-xl bg-[#D6A23D] hover:bg-amber-400 text-stone-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>Scheme Calculator</span>
                    <Coins className="w-4 h-4" />
                  </button>
                </div>

                {/* SIP Config 2-Cols */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-8 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5 transition-colors">
                    <div>
                      <h2 className="text-xl font-bold text-[#641027] dark:text-[#D8B878]">Systematic Investment Plan (SIP)</h2>
                      <p className="text-xs text-[#68758A] dark:text-[#C1B4B8] mt-0.5">Automate disciplined bullion savings with recurring auto-debit</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#243047] dark:text-[#F8F3F4] mb-2">Debit Frequency</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'DAILY', label: 'Daily (Micro)' },
                          { id: 'WEEKLY', label: 'Weekly' },
                          { id: 'MONTHLY', label: 'Monthly' }
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSipFrequency(f.id as any)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              sipFrequency === f.id
                                ? 'bg-[#861638] text-white border-[#861638]'
                                : 'bg-[#FAF8F5] dark:bg-[#140D10] text-[#68758A] dark:text-[#C1B4B8] border-[#E4E7ED] dark:border-[#46343A] hover:border-[#861638] dark:hover:border-[#D8B878]'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#243047] dark:text-[#F8F3F4] mb-2">Asset Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSipMetal('GOLD_24K_9999')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            sipMetal === 'GOLD_24K_9999'
                              ? 'bg-[#861638] text-white border-[#861638]'
                              : 'bg-[#FAF8F5] dark:bg-[#140D10] text-[#68758A] dark:text-[#C1B4B8] border-[#E4E7ED] dark:border-[#46343A] hover:border-[#861638] dark:hover:border-[#D8B878]'
                          }`}
                        >
                          24K 999.9 Fine Gold
                        </button>
                        <button
                          type="button"
                          onClick={() => setSipMetal('SILVER_999')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            sipMetal === 'SILVER_999'
                              ? 'bg-[#861638] text-white border-[#861638]'
                              : 'bg-[#FAF8F5] dark:bg-[#140D10] text-[#68758A] dark:text-[#C1B4B8] border-[#E4E7ED] dark:border-[#46343A] hover:border-[#861638] dark:hover:border-[#D8B878]'
                          }`}
                        >
                          Pure 999 Silver
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#243047] dark:text-[#F8F3F4] mb-2">Installment Amount (₹)</label>
                      <input
                        type="number"
                        value={sipAmount}
                        onChange={(e) => setSipAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        min="100"
                        className="w-full p-3 rounded-xl border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-base font-semibold text-[#243047] dark:text-[#F8F3F4] focus:outline-none focus:border-[#861638] dark:focus:border-[#D8B878] mb-2"
                      />
                      <div className="grid grid-cols-5 gap-1.5">
                        {[100, 500, 1000, 2500, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setSipAmount(amt)}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              sipAmount === amt
                                ? 'bg-[#861638] text-white border-[#861638]'
                                : 'border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#140D10] text-[#68758A] dark:text-[#C1B4B8] hover:border-gray-400'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#243047] dark:text-[#F8F3F4] pt-1">
                      <input
                        type="checkbox"
                        checked={sipExecuteFirst}
                        onChange={(e) => setSipExecuteFirst(e.target.checked)}
                        className="rounded text-[#861638] focus:ring-[#861638]"
                      />
                      <span>Execute 1st installment immediately and credit vault today</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleCreateSip}
                      disabled={isCreatingSip}
                      className="w-full py-3.5 rounded-xl bg-[#861638] hover:bg-[#641027] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      <PlusCircle className="w-4 h-4 text-amber-300" />
                      <span>{isCreatingSip ? 'Activating Mandate...' : 'Activate Gold SIP'}</span>
                    </button>
                  </div>

                  {/* Right 5 Cols: Projected Accumulation */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-7 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 transition-colors">
                    <h4 className="font-bold text-base text-[#641027] dark:text-[#D8B878] pb-3 border-b border-[#E4E7ED] dark:border-[#46343A] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#16805D] dark:text-[#6BC99A]" />
                      Projected Accumulation
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between pb-2 border-b border-[#E4E7ED] dark:border-[#46343A] text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Per Cycle Installment:</span>
                        <span className="font-bold text-[#243047] dark:text-[#F8F3F4]">₹{sipAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#E4E7ED] dark:border-[#46343A] text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Approx. Grams / Cycle:</span>
                        <span className="font-bold text-[#16805D] dark:text-[#6BC99A]">
                          {rates ? ((sipAmount / 1.03) / rates.buyRatePerGram).toFixed(4) : '0.0650'}g
                        </span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[#E4E7ED] dark:border-[#46343A] text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Lock-in Period:</span>
                        <span className="font-bold text-[#16805D] dark:text-[#6BC99A]">Zero (Liquidate anytime)</span>
                      </div>
                      <div className="flex justify-between text-[#68758A] dark:text-[#C1B4B8]">
                        <span>Custody &amp; Insurance:</span>
                        <span className="font-bold text-[#243047] dark:text-[#F8F3F4]">100% IDBI Trustee</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FFFDF5] dark:bg-amber-950/20 rounded-xl border border-[#FDE68A] dark:border-amber-500/30 text-[11px] text-[#92400E] dark:text-amber-200 leading-relaxed transition-colors">
                      💡 <strong>Rupee-Cost Averaging:</strong> SIP automatically purchases precious metals at the prevailing spot benchmark on each cycle date. Cancel or pause anytime at zero penalty.
                    </div>
                  </div>
                </div>

                {/* Active SIP Plans */}
                <div className="bg-white dark:bg-[#1E1518] rounded-2xl p-6 sm:p-8 border border-[#E4E7ED] dark:border-[#46343A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[#641027] dark:text-[#D8B878] flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#D6A23D] dark:text-[#D8B878]" />
                      My Active Systematic Plans ({sipPlans.length})
                    </h3>
                    <button
                      type="button"
                      onClick={loadSipPlans}
                      className="p-2 text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingSip ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {sipPlans.length > 0 ? (
                    <div className="space-y-3">
                      {sipPlans.map(plan => {
                        const isActionBusy = activeSipActionId === plan.id;
                        return (
                          <div 
                            key={plan.id}
                            className="bg-[#FAF8F5] dark:bg-[#140D10] rounded-xl p-5 border border-[#E4E7ED] dark:border-[#46343A] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  plan.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
                                  plan.status === 'PAUSED' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                                }`}>
                                  {plan.status}
                                </span>
                                <span className="font-mono text-xs text-[#68758A] dark:text-[#C1B4B8]">{plan.plan_reference}</span>
                              </div>
                              <h4 className="font-bold text-base text-[#243047] dark:text-[#F8F3F4]">
                                ₹{Number(plan.amount_inr).toLocaleString('en-IN')} / {plan.frequency.toLowerCase()}
                              </h4>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-[#68758A] dark:text-[#C1B4B8] mt-1.5">
                                <span>Invested: <strong className="text-[#243047] dark:text-[#F8F3F4]">₹{Number(plan.total_invested_inr).toLocaleString('en-IN')}</strong></span>
                                <span>Accumulated: <strong className="text-[#16805D] dark:text-[#6BC99A]">{Number(plan.total_grams_accumulated).toFixed(4)}g</strong></span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" /> Next: {new Date(plan.next_execution_date).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                              {plan.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  onClick={() => handlePauseSip(plan.id)}
                                  disabled={isActionBusy}
                                  className="px-3 py-1.5 rounded-lg border border-[#E4E7ED] dark:border-[#46343A] bg-white dark:bg-[#1E1518] text-xs font-semibold text-[#243047] dark:text-[#F8F3F4] flex items-center gap-1 cursor-pointer"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>Pause</span>
                                </button>
                              ) : plan.status === 'PAUSED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleResumeSip(plan.id)}
                                  disabled={isActionBusy}
                                  className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Resume</span>
                                </button>
                              ) : null}

                              {plan.status !== 'CANCELLED' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteCycleNow(plan.id)}
                                    disabled={isActionBusy}
                                    className="px-3 py-1.5 rounded-lg bg-[#861638] text-white text-xs font-semibold hover:bg-[#641027] cursor-pointer"
                                  >
                                    Debit Now
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelSip(plan.id)}
                                    disabled={isActionBusy}
                                    className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold cursor-pointer"
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
                    <div className="py-8 text-center text-xs text-[#68758A] dark:text-[#C1B4B8]">
                      No active SIP plans found. Start one above from ₹100!
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
            <div className="bg-white dark:bg-[#1E1518] rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[#E4E7ED] dark:border-[#46343A] relative text-center">
              <button
                type="button"
                onClick={() => setPurchaseSuccess(null)}
                className="absolute top-4 right-4 p-2 text-[#68758A] dark:text-[#C1B4B8] hover:text-[#243047] dark:hover:text-[#F8F3F4] rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[#16805D] dark:text-[#6BC99A] mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-[#641027] dark:text-[#D8B878]">Bullion Allocated!</h3>
              <p className="text-xs text-[#68758A] dark:text-[#C1B4B8] mt-2 mb-6">
                Your payment was verified and certified pure bullion has been credited to your insured vault.
              </p>
              <div className="bg-[#FAF8F5] dark:bg-[#140D10] p-4 rounded-xl text-xs space-y-2 text-left mb-6 border border-[#E4E7ED] dark:border-[#46343A]">
                <div className="flex justify-between">
                  <span className="text-[#68758A] dark:text-[#C1B4B8]">Transaction Ref:</span>
                  <span className="font-mono font-bold text-[#243047] dark:text-[#F8F3F4]">{purchaseSuccess.transaction?.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68758A] dark:text-[#C1B4B8]">Weight Added:</span>
                  <span className="font-bold text-[#16805D] dark:text-[#6BC99A]">+{purchaseSuccess.transaction?.grams}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68758A] dark:text-[#C1B4B8]">Total Vault Balance:</span>
                  <span className="font-bold text-[#243047] dark:text-[#F8F3F4]">{purchaseSuccess.vaultBalance}g</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setPurchaseSuccess(null); handleTabSwitch('VAULT'); }}
                className="w-full py-3.5 bg-[#861638] text-white rounded-xl text-xs font-bold hover:bg-[#641027] transition-colors cursor-pointer"
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

      </main>
    </div>
  );
}
