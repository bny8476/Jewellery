import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowUpRight, RefreshCw, 
  Coins, Sparkles, Building2, Download, 
  CheckCircle2, Lock, Truck, History, TrendingUp, Wallet, X,
  Pause, Play, Calendar, PlusCircle, Award, 
  ArrowRight, Zap, ShoppingCart,
  Info, Tag
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
import { BackButton } from '../components/ui/BackButton';
import { platformSyncService } from '../services/platformSyncService';
import { CustomerAccountHeader, NotificationItem } from '../components/dashboard/CustomerAccountHeader';
import { useNotifications } from '../context/NotificationContext';
import { AuraGoldVisitorLanding } from '../components/auragold/AuraGoldVisitorLanding';
import { PreciousMetalsPriceChart } from '../components/auragold/PreciousMetalsPriceChart';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL' | 'REDEEM' | 'VAULT' | 'SIP'>('BUY');
  const [rates, setRates] = useState<DigitalGoldRates | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerGender, setCustomerGender] = useState<string>('female');
  const [customerPhotoUrl, setCustomerPhotoUrl] = useState<string>('');
  const [customerTier, setCustomerTier] = useState<string>('Valued Member');
  const [isSwarnaNidhiOpen, setIsSwarnaNidhiOpen] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);

  const {
    notifications: liveNotifications,
    unreadCount: liveUnreadCount,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead
  } = useNotifications();

  const displayNotifications: NotificationItem[] | undefined = useMemo(() => {
    if (liveNotifications && liveNotifications.length > 0) {
      return liveNotifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        category: (n.category === 'order' || n.category === 'rate' || n.category === 'vault' ? n.category : 'vault') as 'order' | 'rate' | 'vault' | 'concierge',
        timestamp: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: n.is_read
      }));
    }
    return undefined;
  }, [liveNotifications]);

  const handleCustomerTabSelect = (tab: string) => {
    if (tab === 'vault') {
      handleTabSwitch('VAULT');
    } else {
      navigate(`/dashboard?tab=${tab}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/login');
  };

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        refreshWallet();
        loadSipPlans();
        try {
          const { data: cust } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          if (cust) {
            setCustomerName(cust.name || cust.full_name || currentUser.user_metadata?.full_name || '');
            setCustomerGender(cust.gender || currentUser.user_metadata?.gender || 'female');
            setCustomerPhotoUrl(cust.photo_url || cust.avatar_url || currentUser.user_metadata?.photo_url || '');
            setCustomerTier(cust.loyalty_tier || currentUser.user_metadata?.loyalty_tier || 'Valued Member');
          } else {
            setCustomerName(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '');
            setCustomerGender(currentUser.user_metadata?.gender || 'female');
            setCustomerPhotoUrl(currentUser.user_metadata?.photo_url || currentUser.user_metadata?.avatar_url || '');
            setCustomerTier(currentUser.user_metadata?.loyalty_tier || 'Valued Member');
          }
        } catch {
          setCustomerName(currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || '');
          setCustomerGender(currentUser.user_metadata?.gender || 'female');
          setCustomerPhotoUrl(currentUser.user_metadata?.photo_url || currentUser.user_metadata?.avatar_url || '');
          setCustomerTier(currentUser.user_metadata?.loyalty_tier || 'Valued Member');
        }
      }
    }).finally(() => {
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        refreshWallet();
        loadSipPlans();
      }
    });

    loadRates();
    loadRedemptionProducts();

    const rateInterval = setInterval(loadRates, 60000); // 1-min rate refresh
    return () => {
      clearInterval(rateInterval);
      subscription.unsubscribe();
    };
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

  // Dynamic live synchronization with Admin Portal
  useEffect(() => {
    const unsubscribe = platformSyncService.subscribe('auragold', (payload) => {
      if (payload.entityType === 'metal_rate' || payload.entityType === 'digital_gold') {
        loadRates();
        loadRedemptionProducts();
        if (user) refreshWallet();
      }
    });

    return () => unsubscribe();
  }, [user]);

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

  // Non-logged-in guest/visitor lands on the promotional landing page matching reference design
  const isVisitorMode = !user || searchParams.get('preview') === 'guest';
  if (!authLoading && isVisitorMode) {
    return (
      <AuraGoldVisitorLanding 
        rates={rates}
        onBuyGold={() => navigate('/login?redirect=/auragold')}
        onViewGold={() => navigate('/login?redirect=/auragold%3Ftab%3DVAULT')}
        onOpenStoreLocator={() => setIsStoreLocatorOpen(true)}
      />
    );
  }

  return (
    <div className="customer-portal-root min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans antialiased selection:bg-[#D8B878]/30 transition-colors duration-200">
      
      {/* ========================================================================= */}
      {/* 1. CUSTOMER PORTAL DEDICATED HEADER NAVIGATION                            */}
      {/* ========================================================================= */}
      <CustomerAccountHeader
        user={user}
        customerName={customerName || user?.user_metadata?.full_name}
        customerGender={customerGender || user?.user_metadata?.gender}
        customerPhotoUrl={customerPhotoUrl || user?.user_metadata?.photo_url}
        customerTier={customerTier || user?.user_metadata?.loyalty_tier}
        activeTabTitle="Aura Gold™ 24K"
        onSelectTab={handleCustomerTabSelect}
        onToggleMobileSidebar={() => navigate('/dashboard')}
        onSignOut={handleSignOut}
        unreadCount={liveUnreadCount}
        notifications={displayNotifications}
        onMarkAllAsRead={contextMarkAllAsRead}
        onMarkAsRead={contextMarkAsRead}
      />

      {/* ========================================================================= */}
      {/* 2. AURA GOLD SECONDARY TAB NAVIGATION & BENCHMARK BAR                     */}
      {/* ========================================================================= */}
      <div className="bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 sticky top-16 z-30 transition-colors shadow-2xs">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Logo & Slogan + Back to Vault */}
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/dashboard?tab=vault" label="Back" variant="pill" />
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white border border-neutral-800 dark:border-neutral-200 flex items-center justify-center text-[#D8B878] dark:text-black shadow-xs">
              <GoldBarsIcon className="w-5 h-5 text-[#D8B878]" />
            </div>
            <div>
              <div className="font-inter font-bold text-base text-black dark:text-white tracking-tight flex items-center gap-1.5 leading-none">
                <span>GoldVault</span>
                <span className="text-[9px] uppercase font-sans font-bold tracking-widest px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 ml-0.5">
                  24K 999.9
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium tracking-wide">
                Physical Bullion in Insured Brinks Vaults
              </p>
            </div>
          </div>

          {/* Central Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none">
            
            {/* 1. Buy Bullion */}
            <button
              onClick={() => handleTabSwitch('BUY')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'BUY'
                  ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <ShoppingCart className={`w-3.5 h-3.5 ${activeTab === 'BUY' ? 'text-[#D8B878]' : ''}`} />
              <span>Buy Bullion</span>
            </button>

            {/* 2. Sell / Cash out */}
            <button
              onClick={() => handleTabSwitch('SELL')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'SELL'
                  ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <ArrowUpRight className={`w-3.5 h-3.5 ${activeTab === 'SELL' ? 'text-[#D8B878]' : ''}`} />
              <span>Sell / Cash out</span>
            </button>

            {/* 3. Minted Coins */}
            <button
              onClick={() => handleTabSwitch('REDEEM')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'REDEEM'
                  ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Coins className={`w-3.5 h-3.5 ${activeTab === 'REDEEM' ? 'text-[#D8B878]' : ''}`} />
              <span>Minted Coins</span>
            </button>

            {/* 4. My Vault */}
            <button
              onClick={() => handleTabSwitch('VAULT')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'VAULT'
                  ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Wallet className={`w-3.5 h-3.5 ${activeTab === 'VAULT' ? 'text-[#D8B878]' : ''}`} />
              <span>My Vault</span>
            </button>

            {/* 5. Gold SIP */}
            <button
              onClick={() => handleTabSwitch('SIP')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'SIP'
                  ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${activeTab === 'SIP' ? 'text-[#D8B878]' : ''}`} />
              <span>Gold SIP</span>
            </button>

          </nav>

          {/* Right Controls: Bullion Refresh & Live Rate Tag */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={loadRates}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 transition-all cursor-pointer"
              title="Refresh Bullion Rates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRates ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Rates</span>
            </button>
            <div className="text-xs font-mono font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
              ₹{(rates?.buyRatePerGram || 14928).toLocaleString('en-IN')}/g
            </div>
          </div>

        </div>
      </div>

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
            {/* TAB 1: BUY BULLION (Luxury Customer Design Pattern)                  */}
            {/* =================================================================== */}
            {activeTab === 'BUY' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ------------------------------------------------------------- */}
                {/* LEFT COLUMN: Main Purchase Form (7 Cols)                      */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-6 transition-colors">
                  
                  {/* A. Form Header & Segmented Metal Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white border border-neutral-800 dark:border-neutral-200 flex items-center justify-center text-[#D8B878] dark:text-black shrink-0 shadow-xs">
                        <GoldBarsIcon className="w-7 h-7 text-[#D8B878]" />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-inter font-bold text-black dark:text-white tracking-tight">
                          Buy Pure Precious Metals
                        </h1>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-normal">
                          Allocated bullion backed by physical bars in secure vaults
                        </p>
                      </div>
                    </div>

                    {/* Segmented Asset Selector: 24K Gold vs 999 Silver */}
                    <div className="flex gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setSelectedMetal('GOLD_24K_9999'); setActiveQuote(null); }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectedMetal === 'GOLD_24K_9999'
                            ? 'bg-black dark:bg-white text-[#D8B878] dark:text-black border border-black dark:border-white shadow-xs'
                            : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white dark:hover:text-[#D8B878] hover:bg-white/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <GoldBarsIcon className="w-4 h-4 text-[#D8B878]" />
                        <span>24K Gold</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedMetal('SILVER_999'); setActiveQuote(null); }}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectedMetal === 'SILVER_999'
                            ? 'bg-gradient-to-r from-stone-800 to-stone-900 text-stone-100 border border-stone-400/50 shadow-xs'
                            : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white dark:hover:text-[#D8B878] hover:bg-white/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <Coins className="w-4 h-4 text-stone-400" />
                        <span>999 Silver</span>
                      </button>
                    </div>
                  </div>

                  {/* B. Purchase Mode Selector */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-black dark:text-white mb-2">
                      <span>Purchase Mode</span>
                      <Info className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => { setBuyMode('INR'); setActiveQuote(null); }}
                        className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          buyMode === 'INR'
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs border border-black dark:border-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white dark:hover:text-[#D8B878]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          buyMode === 'INR' ? 'bg-[#C6A15B]/30 text-[#D8B878] border border-[#C6A15B]/50' : 'bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-300'
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
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs border border-black dark:border-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white dark:hover:text-[#D8B878]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          buyMode === 'GRAMS' ? 'bg-[#C6A15B]/30 text-[#D8B878] border border-[#C6A15B]/50' : 'bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-300'
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
                      <label className="text-xs font-bold text-black dark:text-white">
                        {buyMode === 'INR' ? 'Enter Purchase Amount (₹)' : 'Enter Weight (g)'}
                      </label>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        Min: {buyMode === 'INR' ? '₹100' : '0.01g'}
                      </span>
                    </div>

                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-7 h-7 rounded-lg bg-[#FAF7F2] dark:bg-[#141414] text-[#8C6D2D] dark:text-[#D8B878] border border-neutral-200 dark:border-neutral-800 font-bold text-sm select-none">
                        {buyMode === 'INR' ? '₹' : 'g'}
                      </div>
                      <input
                        type="number"
                        value={buyInput}
                        onChange={(e) => { setBuyInput(e.target.value); setActiveQuote(null); }}
                        placeholder={buyMode === 'INR' ? 'Enter amount in rupees' : 'Enter gold weight in grams'}
                        min={buyMode === 'INR' ? '100' : '0.01'}
                        step={buyMode === 'INR' ? '100' : '0.01'}
                        className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-base font-semibold text-[#1C171E] dark:text-[#FAF5ED] placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/20 dark:focus:ring-[#D8B878]/25 focus:border-[#C6A15B] dark:focus:border-[#D8B878] transition-all bg-white dark:bg-[#0A0A0A]"
                      />
                    </div>
                  </div>

                  {/* D. Estimated Allocation Panel */}
                  <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 flex items-center justify-between text-xs transition-colors">
                    <div className="flex items-center gap-2 text-black dark:text-white font-semibold">
                      <Coins className="w-4 h-4 text-[#C6A15B] dark:text-[#D8B878]" />
                      <span>Estimated Allocation</span>
                      <Info className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div className="font-bold text-[#8C6D2D] dark:text-[#D8B878] text-sm">
                      ≈ {approxGramsCalculated} grams {selectedMetal === 'SILVER_999' ? 'Silver' : 'Gold'}
                    </div>
                  </div>

                  {/* E. Quick Presets */}
                  <div>
                    <label className="text-xs font-bold text-black dark:text-white block mb-2">
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
                                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xs font-bold'
                                  : 'bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-neutral-200 dark:border-neutral-800 hover:border-[#C6A15B] dark:hover:border-[#D8B878] hover:text-black dark:text-white dark:hover:text-[#D8B878]'
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
                                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xs font-bold'
                                  : 'bg-white dark:bg-[#0A0A0A] text-black dark:text-white border-neutral-200 dark:border-neutral-800 hover:border-[#C6A15B] dark:hover:border-[#D8B878] hover:text-black dark:text-white dark:hover:text-[#D8B878]'
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
                      className="w-full py-4 rounded-xl bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black border border-black dark:border-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 tracking-wide active:scale-[0.99]"
                    >
                      {isQuoting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin text-[#D8B878]" />
                          <span>Locking Real-Time Spot Rate...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 text-[#D8B878]" />
                          <span>Lock 5-Minute Guaranteed Price Quote</span>
                          <ArrowRight className="w-4 h-4 ml-1 text-[#D8B878]" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveQuote(null)}
                          className="py-3.5 px-5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-[#746B75] dark:text-[#C1B4B8] hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmBuy}
                          disabled={isPurchasing}
                          className="flex-1 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black border border-black dark:border-white font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                        >
                          {isPurchasing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-[#D8B878]" />
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
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E2D9] dark:divide-[#38242C]">
                    {/* Trust Pillar 1 */}
                    <div className="flex items-center gap-3 pr-2">
                      <ShieldCheck className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-black dark:text-white">100% Insured Vaults</div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400">IDBI Insured</div>
                      </div>
                    </div>

                    {/* Trust Pillar 2 */}
                    <div className="flex items-center gap-3 sm:px-3 pt-2 sm:pt-0">
                      <GoldBarsIcon className="w-6 h-6 text-[#C6A15B] dark:text-[#D8B878] shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-black dark:text-white">Brinks Insured Vaults</div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400">Global Security</div>
                      </div>
                    </div>

                    {/* Trust Pillar 3 */}
                    <div className="flex items-center gap-3 sm:pl-3 pt-2 sm:pt-0">
                      <Award className="w-6 h-6 text-[#8C6D2D] dark:text-[#D8B878] shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-black dark:text-white">BIS Hallmarked 100%</div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400">Purity Guaranteed</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT COLUMN: Order Breakdown + Why Buy Aura Gold (5 Cols)   */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Card 1: Order Breakdown & Audit */}
                  <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4 transition-colors">
                    <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878]" />
                        <h2 className="font-inter font-bold text-base text-black dark:text-white">
                          Order Breakdown &amp; Audit
                        </h2>
                      </div>
                      {activeQuote && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#450817]/10 dark:bg-[#450817]/40 text-[#861638] dark:text-[#E5889E] border border-[#C6A15B]/40 text-xs font-mono font-bold animate-pulse">
                          <span>⏱</span>
                          <span>{Math.floor(quoteSecondsLeft / 60)}:{(quoteSecondsLeft % 60).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>

                    {/* Order Details List */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                        <span>Selected Asset:</span>
                        <span className="font-bold text-black dark:text-white">
                          {selectedMetal === 'SILVER_999' ? 'Pure 999 Silver' : '24K 999.9 Gold'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                        <span>Live Buy Rate:</span>
                        <span className="font-bold text-black dark:text-white">
                          {formatCurrencyINR(currentActiveRate)}/g
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                        <span>Estimated Weight:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {approxGramsCalculated} grams
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                        <span>Mandatory GST:</span>
                        <span className="font-medium text-black dark:text-white">
                          3% (₹{approxGstCalculated.toFixed(1)} Tax)
                        </span>
                      </div>

                      {/* Estimated Total */}
                      <div className="pt-3.5 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-baseline">
                        <span className="font-inter font-bold text-sm text-black dark:text-white">
                          Estimated Total:
                        </span>
                        <span className="font-inter font-bold text-2xl sm:text-3xl text-black dark:text-white tracking-tight">
                          ₹{approxTotalPayableCalculated.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Price Volatility Notice Banner */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#8C6D2D] dark:text-amber-200 leading-relaxed transition-colors">
                      <Tag className="w-4 h-4 text-[#C6A15B] dark:text-[#D8B878] shrink-0 mt-0.5" />
                      <span>
                        Click <strong className="font-semibold text-black dark:text-white dark:text-[#D8B878]">"Lock 5-Minute Guaranteed Price Quote"</strong> to freeze your purchase price against market price volatility.
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Why Buy Aura Gold™? (Benefits Card) */}
                  <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4 transition-colors">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                      <h3 className="font-inter font-bold text-base text-black dark:text-white">
                        Why Buy Aura Gold™?
                      </h3>
                    </div>

                    <div className="space-y-3 text-xs text-black dark:text-[#D8CECE]">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong className="text-emerald-800 dark:text-emerald-300 font-bold">Zero Locker Rent:</strong> Stored securely for lifetime without custodial charges.
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong className="text-emerald-800 dark:text-emerald-300 font-bold">Physical Delivery:</strong> Convert digital weight into 24K certified coins starting from 0.5g.
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong className="text-emerald-800 dark:text-emerald-300 font-bold">24/7 Instant Sell-Back:</strong> Cash out anytime with funds wired directly to your bank account via IMPS.
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
                <div className="lg:col-span-7 bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-6 transition-colors">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-inter font-bold text-black dark:text-white">
                      Sell Digital Gold for Instant Cash
                    </h2>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Funds transferred directly to your bank account via IMPS with zero hidden deductions
                    </p>
                  </div>

                  {/* Available Vault Balance */}
                  <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-xl border border-[#C6A15B]/35 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold block">Available Vault Gold:</span>
                      <span className="text-2xl font-inter font-bold text-black dark:text-white dark:text-[#D8B878]">
                        {wallet ? wallet.availableGrams.toFixed(4) : '0.0000'} grams
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 font-semibold block">Live Buyback Benchmark:</span>
                      <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {rates ? formatCurrencyINR(rates.sellRatePerGram) : '₹14,523'}/g
                      </span>
                    </div>
                  </div>

                  {/* Weight to Liquidate Input */}
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-white mb-2">
                      Weight to Liquidate (grams)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#8C6D2D] dark:text-[#D8B878] text-sm pointer-events-none">
                        g
                      </span>
                      <input
                        type="number"
                        value={sellGrams}
                        onChange={(e) => { setSellGrams(e.target.value); setSellQuote(null); }}
                        step="0.0001"
                        placeholder="0.1"
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-base font-semibold text-[#1C171E] dark:text-[#FAF5ED] bg-white dark:bg-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/20 dark:focus:ring-[#D8B878]/25 focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
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
                          className="py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-black dark:text-white hover:border-[#C6A15B] dark:hover:border-[#D8B878] hover:text-black dark:text-white dark:hover:text-[#D8B878] bg-white dark:bg-[#0A0A0A] transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IMPS Bank Account Details */}
                  <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <h4 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#C6A15B] dark:text-[#D8B878]" />
                      Direct Bank Account (IMPS Payout)
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                          Account Holder Full Name
                        </label>
                        <input
                          type="text"
                          value={bankDetails.accountHolderName}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                          placeholder="As per bank passbook / KYC"
                          className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            Bank Account Number
                          </label>
                          <input
                            type="text"
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                            placeholder="Enter bank account number"
                            className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            value={bankDetails.ifscCode}
                            onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                            placeholder="e.g. HDFC0001234"
                            maxLength={11}
                            className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs uppercase bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
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
                      className="w-full py-4 rounded-xl bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black border border-black dark:border-white font-bold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75"
                    >
                      {isQuoting ? 'Calculating Instant Payout...' : 'Get Instant Cash Quote'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSellGold}
                      disabled={isSelling}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSelling ? 'Processing IMPS Transfer...' : `Confirm & Withdraw ${formatCurrencyINR(sellQuote.totalAmount)}`}
                    </button>
                  )}
                </div>

                {/* Right 5 Cols: Liquidation Summary */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4 transition-colors">
                    <h3 className="font-inter font-bold text-base text-black dark:text-white flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                      <Zap className="w-4 h-4 text-[#C6A15B] dark:text-[#D8B878]" />
                      Instant Liquidation Summary
                    </h3>

                    {sellQuote ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <span className="text-xs text-emerald-800 dark:text-emerald-300 block font-semibold mb-1">
                            Net Cash Payout:
                          </span>
                          <span className="text-3xl font-inter font-bold text-emerald-800 dark:text-emerald-300">
                            {formatCurrencyINR(sellQuote.totalAmount)}
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-1">
                            Transferred via IMPS within 15–30 minutes
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>Selling Weight:</span>
                            <span className="font-bold text-black dark:text-white">{sellQuote.grams}g</span>
                          </div>
                          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>Buyback Benchmark Rate:</span>
                            <span className="font-bold text-black dark:text-white">{formatCurrencyINR(sellQuote.ratePerGram)}/g</span>
                          </div>
                          <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>GST on Sell-Back:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">₹0 (Zero Deduction)</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-400">
                        <p className="leading-relaxed">
                          Enter your desired bullion weight on the left to receive a real-time IMPS payout quotation based on international spot benchmarks.
                        </p>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>100% Guaranteed Liquidity</span>
                          </div>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
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
                  <h2 className="text-2xl sm:text-3xl font-inter font-bold text-black dark:text-white">
                    Convert Digital Gold to Minted Physical Coins
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
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
                        className={`bg-white dark:bg-[#0A0A0A] rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected ? 'border-[#C6A15B] dark:border-[#D8B878] ring-2 ring-[#C6A15B]/30 shadow-md' : 'border-neutral-200 dark:border-neutral-800 hover:border-[#C6A15B]/60'
                        }`}
                      >
                        <div>
                          <div className="relative overflow-hidden rounded-xl mb-4 bg-stone-50 dark:bg-black/30 aspect-square">
                            <img 
                              src={prod.imageUrl} 
                              alt={prod.name} 
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-bold text-[10px] font-bold">
                                Selected
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C6A15B]/15 text-[#8C6D2D] dark:text-[#D8B878] border border-[#C6A15B]/35">
                              {prod.purity}
                            </span>
                            <span className="text-[10px] text-neutral-600 dark:text-neutral-400">
                              {prod.grams}g
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-black dark:text-white mt-1">{prod.name}</h4>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">{prod.dimension}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                          <span className="text-neutral-600 dark:text-neutral-400">Minting Fee:</span>
                          <span className="font-bold text-black dark:text-white dark:text-[#D8B878]">₹{prod.mintingCharges}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Delivery Form */}
                {selectedProduct && (
                  <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto transition-colors">
                    <div className="lg:col-span-5 space-y-3">
                      <h3 className="font-inter font-bold text-base text-black dark:text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878]" />
                        Selected Coin
                      </h3>
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-[#C6A15B]/35 space-y-2 text-xs">
                        <div className="font-bold text-sm text-black dark:text-white">{selectedProduct.name}</div>
                        <div className="text-neutral-600 dark:text-neutral-400">Weight: <strong className="text-black dark:text-white">{selectedProduct.grams}g</strong></div>
                        <div className="text-neutral-600 dark:text-neutral-400">Minting &amp; CertiCard Fee: <strong className="text-black dark:text-white dark:text-[#D8B878]">₹{selectedProduct.mintingCharges}</strong></div>
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold">Transit Insurance: Free</div>
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                      <h3 className="font-inter font-bold text-base text-black dark:text-white flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878]" />
                        Insured Doorstep Address
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={shippingAddress.deliveryName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryName: e.target.value })}
                            placeholder="Recipient full name"
                            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                          />
                          <input
                            type="tel"
                            value={shippingAddress.deliveryPhone}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryPhone: e.target.value })}
                            placeholder="Mobile number"
                            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={shippingAddress.deliveryAddress}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, deliveryAddress: e.target.value })}
                          placeholder="Complete street address"
                          className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                            placeholder="City"
                            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                          />
                          <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                            placeholder="State"
                            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                          />
                          <input
                            type="text"
                            value={shippingAddress.pincode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                            placeholder="Pincode"
                            maxLength={6}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-[#1C171E] dark:text-[#FAF5ED] text-xs focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRedeem}
                          disabled={isRedeeming}
                          className="w-full py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black border border-black dark:border-white font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-75"
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
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-6 border border-[#C6A15B]/40 shadow-[0_4px_24px_rgba(69,8,23,0.04)] space-y-3 transition-colors">
                    <span className="text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-bold block">
                      Total Bullion Valuation
                    </span>
                    <div className="text-3xl font-inter font-bold text-black dark:text-white dark:text-[#D8B878]">
                      {wallet ? formatCurrencyINR(wallet.marketValuationInr) : '₹0'}
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      100% IDBI Trustee Custody
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      Account: <strong className="text-black dark:text-white">{wallet?.accountNumber || 'AG-VAULT-2026'}</strong>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(69,8,23,0.04)] space-y-3 transition-colors">
                    <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="font-bold uppercase tracking-wider text-[#8C6D2D] dark:text-[#D8B878]">24K 999.9 Gold</span>
                      <GoldBarsIcon className="w-4 h-4 text-[#C6A15B] dark:text-[#D8B878]" />
                    </div>
                    <div className="text-2xl font-inter font-bold text-black dark:text-white">
                      {wallet ? wallet.goldBalanceGrams.toFixed(4) : '0.0000'} <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">grams</span>
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      Value: <strong className="text-black dark:text-white">{wallet ? formatCurrencyINR(wallet.goldMarketValuationInr || 0) : '₹0'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedMetal('GOLD_24K_9999'); handleTabSwitch('BUY'); }}
                      className="w-full py-2 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-bold rounded-xl text-xs font-bold hover:from-[#5C0B1F] hover:to-[#700D26] transition-colors cursor-pointer"
                    >
                      + Accumulate 24K Gold
                    </button>
                  </div>

                  <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(69,8,23,0.04)] space-y-3 transition-colors">
                    <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">Pure 999 Silver</span>
                      <Coins className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="text-2xl font-inter font-bold text-black dark:text-white">
                      {wallet ? (wallet.silverBalanceGrams || 0).toFixed(4) : '0.0000'} <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">grams</span>
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                      Value: <strong className="text-black dark:text-white">{wallet ? formatCurrencyINR(wallet.silverMarketValuationInr || 0) : '₹0'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedMetal('SILVER_999'); handleTabSwitch('BUY'); }}
                      className="w-full py-2 bg-stone-800 text-white border border-stone-600/50 rounded-xl text-xs font-bold hover:bg-stone-900 transition-colors cursor-pointer"
                    >
                      + Accumulate 999 Silver
                    </button>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-inter font-bold text-black dark:text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878]" />
                        Authoritative Double-Entry Bullion Ledger
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        Cryptographically reconciled bullion deposits, redemptions, and liquidations
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toast.success('Vault Certificate download initiated!')}
                      className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800 text-xs font-bold hover:border-[#C6A15B] dark:hover:border-[#D8B878] transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5 text-[#C6A15B] dark:text-[#D8B878]" />
                      <span>Download Audit Certificate</span>
                    </button>
                  </div>

                  {wallet && wallet.recentTransactions && wallet.recentTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Transaction Ref</th>
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Weight (g)</th>
                            <th className="py-3 px-4">Rate</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E2D9] dark:divide-[#38242C]">
                          {wallet.recentTransactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-stone-50/70 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                                {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-semibold text-black dark:text-white">{tx.transaction_reference}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.type === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
                                  tx.type === 'SELL' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-[#450817]/10 dark:bg-[#450817]/40 text-black dark:text-white dark:text-[#D8B878]'
                                }`}>
                                  {tx.metal_type === 'SILVER_999' ? 'SILVER ' : ''}{tx.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-black dark:text-white">{Number(tx.grams).toFixed(4)}g</td>
                              <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">{formatCurrencyINR(Number(tx.rate_per_gram))}/g</td>
                              <td className="py-3.5 px-4 font-bold text-black dark:text-white">{formatCurrencyINR(Number(tx.total_amount))}</td>
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
                    <div className="py-12 text-center text-neutral-600 dark:text-neutral-400 text-xs">
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
                <div className="bg-gradient-to-r from-black via-neutral-900 to-black rounded-2xl p-6 sm:p-7 text-white border border-[#C6A15B]/40 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#C6A15B]/20 border border-[#C6A15B]/40 flex items-center justify-center text-[#D8B878] shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FAF5ED] bg-[#C6A15B]/25 px-2 py-0.5 rounded-full border border-[#C6A15B]/40">
                          11-Month Jewellery Purchase Plan
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">12th Month Free</span>
                      </div>
                      <h3 className="font-inter text-lg sm:text-xl font-bold text-white">YAZHINI Swarna Nidhi™ Easy Gold Scheme</h3>
                      <p className="text-xs text-stone-300 mt-0.5 max-w-xl">
                        Deposit for 11 months and receive 1 month complimentary installment + up to 18% off making charges!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSwarnaNidhiOpen(true)}
                    className="w-full lg:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#C6A15B] via-[#D8B878] to-[#C6A15B] hover:from-[#D8B878] hover:to-[#E5CA8F] text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md"
                  >
                    <span>Scheme Calculator</span>
                    <Coins className="w-4 h-4" />
                  </button>
                </div>

                {/* SIP Config 2-Cols */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7 bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] space-y-5 transition-colors">
                    <div>
                      <h2 className="text-xl font-inter font-bold text-black dark:text-white">Systematic Investment Plan (SIP)</h2>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Automate disciplined bullion savings with recurring auto-debit</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black dark:text-white mb-2">Debit Frequency</label>
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
                                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xs font-bold'
                                : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-[#C6A15B] dark:hover:border-[#D8B878]'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black dark:text-white mb-2">Asset Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSipMetal('GOLD_24K_9999')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            sipMetal === 'GOLD_24K_9999'
                              ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-xs font-bold'
                              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-[#C6A15B] dark:hover:border-[#D8B878]'
                          }`}
                        >
                          24K 999.9 Fine Gold
                        </button>
                        <button
                          type="button"
                          onClick={() => setSipMetal('SILVER_999')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            sipMetal === 'SILVER_999'
                              ? 'bg-gradient-to-r from-stone-800 to-stone-900 text-stone-100 border-stone-500 shadow-xs'
                              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-[#C6A15B] dark:hover:border-[#D8B878]'
                          }`}
                        >
                          Pure 999 Silver
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-black dark:text-white mb-2">Installment Amount (₹)</label>
                      <input
                        type="number"
                        value={sipAmount}
                        onChange={(e) => setSipAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        min="100"
                        className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-base font-semibold text-[#1C171E] dark:text-[#FAF5ED] focus:outline-none focus:border-[#C6A15B] dark:focus:border-[#D8B878] mb-2"
                      />
                      <div className="grid grid-cols-5 gap-1.5">
                        {[100, 500, 1000, 2500, 5000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setSipAmount(amt)}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              sipAmount === amt
                                ? 'bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-bold'
                                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-neutral-600 dark:text-neutral-400 hover:border-[#C6A15B]'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-black dark:text-white pt-1">
                      <input
                        type="checkbox"
                        checked={sipExecuteFirst}
                        onChange={(e) => setSipExecuteFirst(e.target.checked)}
                        className="rounded text-black dark:text-white focus:ring-[#C6A15B]"
                      />
                      <span>Execute 1st installment immediately and credit vault today</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleCreateSip}
                      disabled={isCreatingSip}
                      className="w-full py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black border border-black dark:border-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      <PlusCircle className="w-4 h-4 text-[#D8B878]" />
                      <span>{isCreatingSip ? 'Activating Mandate...' : 'Activate Gold SIP'}</span>
                    </button>
                  </div>

                  {/* Right 5 Cols: Projected Accumulation */}
                  <div className="lg:col-span-5 bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] space-y-4 transition-colors">
                    <h4 className="font-inter font-bold text-base text-black dark:text-white pb-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      Projected Accumulation
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                        <span>Per Cycle Installment:</span>
                        <span className="font-bold text-black dark:text-white">₹{sipAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                        <span>Approx. Grams / Cycle:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {rates ? ((sipAmount / 1.03) / rates.buyRatePerGram).toFixed(4) : '0.0650'}g
                        </span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                        <span>Lock-in Period:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Zero (Liquidate anytime)</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                        <span>Custody &amp; Insurance:</span>
                        <span className="font-bold text-black dark:text-white">100% IDBI Trustee</span>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] text-[#8C6D2D] dark:text-amber-200 leading-relaxed transition-colors">
                      💡 <strong>Rupee-Cost Averaging:</strong> SIP automatically purchases precious metals at the prevailing spot benchmark on each cycle date. Cancel or pause anytime at zero penalty.
                    </div>
                  </div>
                </div>

                {/* Active SIP Plans */}
                <div className="bg-white dark:bg-[#111111] rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-colors">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-inter font-bold text-lg text-black dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878]" />
                      My Active Systematic Plans ({sipPlans.length})
                    </h3>
                    <button
                      type="button"
                      onClick={loadSipPlans}
                      className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white dark:hover:text-[#D8B878] rounded-lg hover:bg-stone-100 dark:hover:bg-white/5"
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
                            className="bg-neutral-100 dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  plan.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
                                  plan.status === 'PAUSED' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                                }`}>
                                  {plan.status}
                                </span>
                                <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{plan.plan_reference}</span>
                              </div>
                              <h4 className="font-bold text-base text-black dark:text-white">
                                ₹{Number(plan.amount_inr).toLocaleString('en-IN')} / {plan.frequency.toLowerCase()}
                              </h4>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 mt-1.5">
                                <span>Invested: <strong className="text-black dark:text-white">₹{Number(plan.total_invested_inr).toLocaleString('en-IN')}</strong></span>
                                <span>Accumulated: <strong className="text-emerald-700 dark:text-emerald-400">{Number(plan.total_grams_accumulated).toFixed(4)}g</strong></span>
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
                                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0A0A0A] text-xs font-semibold text-black dark:text-white flex items-center gap-1 cursor-pointer hover:border-[#C6A15B]"
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
                                    className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white font-bold text-xs font-semibold hover:from-[#5C0B1F] hover:to-[#700D26] cursor-pointer"
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
                    <div className="py-8 text-center text-xs text-neutral-600 dark:text-neutral-400">
                      No active SIP plans found. Start one above from ₹100!
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Precious Metals & Gems Area Chart (Gold, Silver, Platinum, Diamond) */}
        <section className="mt-12 sm:mt-16">
          <PreciousMetalsPriceChart />
        </section>

        {/* Purchase Success Modal */}
        {purchaseSuccess && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl max-w-md w-full p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-center">
              <button
                type="button"
                onClick={() => setPurchaseSuccess(null)}
                className="absolute top-4 right-4 p-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:text-white dark:hover:text-[#FAF5ED] rounded-full hover:bg-stone-100 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-inter font-bold text-black dark:text-white">Bullion Allocated!</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 mb-6">
                Your payment was verified and certified pure bullion has been credited to your insured vault.
              </p>
              <div className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-xl text-xs space-y-2 text-left mb-6 border border-neutral-200 dark:border-neutral-800">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Transaction Ref:</span>
                  <span className="font-mono font-bold text-black dark:text-white">{purchaseSuccess.transaction?.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Weight Added:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">+{purchaseSuccess.transaction?.grams}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Total Vault Balance:</span>
                  <span className="font-bold text-black dark:text-white">{purchaseSuccess.vaultBalance}g</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setPurchaseSuccess(null); handleTabSwitch('VAULT'); }}
                className="w-full py-3.5 bg-gradient-to-r from-[#450817] via-[#5C0B1F] to-[#450817] hover:from-[#5C0B1F] hover:to-[#700D26] text-[#FAF5ED] border border-[#C6A15B]/50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
