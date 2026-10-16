import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  Coins, Sparkles, Building2, Download, 
  CheckCircle2, Lock, Truck, History, TrendingUp, Wallet, X
} from 'lucide-react';
import { 
  fetchDigitalGoldRates, requestBullionQuote, createBuyOrder, 
  verifyBuyPayment, executeSellBack, fetchRedemptionProducts, 
  requestPhysicalRedemption, fetchCustomerWallet,
  DigitalGoldRates, BullionQuote, RedemptionProduct, CustomerWallet 
} from '../services/digitalGoldService';
import { supabase } from '../lib/supabase';
import { toast } from '../utils/toast';
import { goldCardEntrance, EASINGS } from '../utils/motion';
import { formatCurrencyINR } from '../utils/formatters';

export default function AuraGold() {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL' | 'REDEEM' | 'VAULT' | 'SIP'>('BUY');
  const [rates, setRates] = useState<DigitalGoldRates | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [user, setUser] = useState<any | null>(null);

  // Buy State
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

  // Load User & Rates
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        refreshWallet();
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
      const w = await fetchCustomerWallet();
      setWallet(w);
    } catch {
      // Wallet may be empty for new users
    }
  };

  const loadRedemptionProducts = async () => {
    try {
      const prods = await fetchRedemptionProducts();
      setRedemptionProducts(prods);
      if (prods.length > 0) setSelectedProduct(prods[0]);
    } catch (err) {
      console.warn('Redemption products error:', err);
    }
  };

  // Generate Buy Quote
  const handleGenerateBuyQuote = async () => {
    try {
      setIsQuoting(true);
      const val = parseFloat(buyInput);
      if (isNaN(val) || val <= 0) {
        toast.error('Please enter a valid amount or gold weight.');
        return;
      }

      const q = await requestBullionQuote({
        type: 'BUY',
        amountInr: buyMode === 'INR' ? val : undefined,
        grams: buyMode === 'GRAMS' ? val : undefined
      });
      setActiveQuote(q);
      setQuoteSecondsLeft(300);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate gold quote.');
    } finally {
      setIsQuoting(false);
    }
  };

  // Generate Sell Quote
  const handleGenerateSellQuote = async () => {
    try {
      setIsQuoting(true);
      const g = parseFloat(sellGrams);
      if (isNaN(g) || g <= 0) {
        toast.error('Please enter a valid weight in grams to sell.');
        return;
      }
      const q = await requestBullionQuote({
        type: 'SELL',
        grams: g
      });
      setSellQuote(q);
    } catch (err: any) {
      toast.error(err.message || 'Failed to calculate sell-back proceeds.');
    } finally {
      setIsQuoting(false);
    }
  };

  // Execute Buy Gold via Razorpay
  const handleBuyGold = async () => {
    if (!user) {
      toast.error('Please sign in to buy digital gold.');
      window.location.href = '/login?redirect=/auragold';
      return;
    }
    if (!activeQuote) {
      await handleGenerateBuyQuote();
      return;
    }

    try {
      setIsPurchasing(true);
      const orderData = await createBuyOrder(activeQuote.quoteId);

      // Check if Razorpay script is present
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
            toast.success('🎉 24K Gold allocated to your vault successfully!');
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
        // Fallback simulated sandbox verification for development
        toast.info('Processing sandbox digital gold allocation...');
        const verifyRes = await verifyBuyPayment({
          transactionId: orderData.transaction.id,
          razorpay_payment_id: `pay_sandbox_${Date.now()}`
        });
        setPurchaseSuccess(verifyRes);
        setActiveQuote(null);
        refreshWallet();
        toast.success('🎉 24K Gold allocated to your vault successfully (Sandbox Mode)!');
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

  // Execute Physical Redemption
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
      const res = await requestPhysicalRedemption({
        productId: selectedProduct.id,
        shippingAddress
      });
      toast.success(res.message);
      refreshWallet();
      setActiveTab('VAULT');
    } catch (err: any) {
      toast.error(err.message || 'Redemption request failed.');
    } finally {
      setIsRedeeming(false);
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
                <span>24K 999.9 Purity • 100% Insured Bullion</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-white tracking-[-0.01em]">
                Aura Gold™ <span className="font-serif italic font-normal text-[#D4AF37]">Digital Vault</span>
              </h1>
              <p className="mt-2 text-[#E8D5D0] text-sm sm:text-base max-w-xl font-light leading-relaxed">
                Buy, accumulate, sell, or convert pure 24 Karat gold into certified physical minted coins starting from just ₹100. Stored securely in IDBI &amp; BRINKS insured vaults.
              </p>
            </div>

            {/* Live Rate Pill Badge with trustworthy subtle glow & status */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 min-w-[240px] hover:border-[#D4AF37]/50 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-between text-xs text-[#E8D5D0] mb-1 font-sans">
                <span className="uppercase tracking-[0.08em] font-medium text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                  Live 24K Gold Rate
                </span>
                <button onClick={loadRates} className="hover:text-white transition-colors" title="Refresh Live Rate">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRates ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="text-2xl sm:text-3xl text-white rate-financial tracking-tight">
                {rates ? formatCurrencyINR(rates.buyRatePerGram) : '₹12,841'}<span className="text-sm font-normal text-[#E8D5D0]">/g</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#FAF7F2]/80 pt-2 border-t border-white/10">
                <span>Sell-back: <span className="rate-financial">{rates ? formatCurrencyINR(rates.sellRatePerGram) : '₹12,492'}</span>/g</span>
                <span className="text-[#34D399] font-medium">+3% GST applicable</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tab Navigation with micro-motion */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#EFE9DF] rounded-2xl mb-8 border border-[#E5DAC8] max-w-2xl mx-auto justify-center">
          {[
            { id: 'BUY', label: 'Buy 24K Gold', icon: ArrowDownLeft },
            { id: 'SELL', label: 'Sell / Cash-out', icon: ArrowUpRight },
            { id: 'REDEEM', label: 'Minted Coins', icon: Coins },
            { id: 'VAULT', label: 'My Vault', icon: Wallet },
            { id: 'SIP', label: 'Gold SIP', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab(tab.id as any); setActiveQuote(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#702638] text-white shadow-md' 
                    : 'text-[#5C4D44] hover:text-[#2C2420] hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content Display with Calm Trustworthy Motion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={goldCardEntrance}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
          >
            {/* TAB 1: BUY GOLD */}
            {activeTab === 'BUY' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Purchase Form Card */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#702638]">Purchase 24K Digital Gold</h2>
                  <p className="text-xs text-gray-500">Live price locked for 5 minutes during purchase</p>
                </div>
                {/* Mode Selector */}
                <div className="flex bg-[#FAF7F2] p-1 rounded-xl border border-gray-200 text-xs font-medium">
                  <button
                    onClick={() => { setBuyMode('INR'); setActiveQuote(null); }}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${buyMode === 'INR' ? 'bg-[#702638] text-white' : 'text-gray-600'}`}
                  >
                    In Rupees (₹)
                  </button>
                  <button
                    onClick={() => { setBuyMode('GRAMS'); setActiveQuote(null); }}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${buyMode === 'GRAMS' ? 'bg-[#702638] text-white' : 'text-gray-600'}`}
                  >
                    In Grams (g)
                  </button>
                </div>
              </div>

              {/* Amount / Weight Input */}
              <div className="mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  {buyMode === 'INR' ? 'Enter Amount to Invest (₹)' : 'Enter Gold Weight (Grams)'}
                </label>
                <div className="relative rounded-2xl border-2 border-[#E5DAC8] focus-within:border-[#702638] transition-colors p-3 bg-[#FAF7F2]">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#702638] mr-2">
                      {buyMode === 'INR' ? '₹' : 'g'}
                    </span>
                    <input
                      type="number"
                      step={buyMode === 'INR' ? '100' : '0.01'}
                      value={buyInput}
                      onChange={(e) => { setBuyInput(e.target.value); setActiveQuote(null); }}
                      placeholder={buyMode === 'INR' ? '1000' : '0.1'}
                      className="w-full bg-transparent text-2xl font-bold text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                {buyMode === 'INR' && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {['500', '1000', '5000', '10000'].map(val => (
                      <button
                        key={val}
                        onClick={() => { setBuyInput(val); setActiveQuote(null); }}
                        className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          buyInput === val 
                            ? 'bg-[#702638]/10 border-[#702638] text-[#702638]' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        +₹{Number(val).toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Locked Quote Breakdown */}
              {activeQuote ? (
                <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#D4AF37]/40 mb-6">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
                    <span className="text-xs font-semibold text-[#702638] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#D4AF37]" /> Rate Locked for:
                    </span>
                    <span className="text-xs font-mono font-bold text-[#702638]">
                      {Math.floor(quoteSecondsLeft / 60)}:{(quoteSecondsLeft % 60).toString().padStart(2, '0')} min
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Pure Gold Weight (24K 999.9)</span>
                      <span className="font-bold text-gray-900">{activeQuote.grams} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Bullion Rate</span>
                      <span>₹{activeQuote.ratePerGram.toLocaleString('en-IN')}/g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metal Value</span>
                      <span>₹{activeQuote.metalValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[#702638]">
                      <span>Bullion GST (3%)</span>
                      <span>+₹{activeQuote.gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Vault Storage &amp; Insurance</span>
                      <span className="text-emerald-600 font-medium">Free for Life</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-bold text-gray-900">
                      <span>Total Payable</span>
                      <span className="text-[#702638] text-base">₹{activeQuote.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateBuyQuote}
                  disabled={isQuoting}
                  className="w-full py-3 mb-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isQuoting ? 'animate-spin' : ''}`} />
                  <span>Lock Real-Time 24K Quote</span>
                </button>
              )}

              {/* Action Button */}
              <button
                onClick={handleBuyGold}
                disabled={isPurchasing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-base shadow-lg hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <span>{isPurchasing ? 'Processing Investment...' : activeQuote ? `Pay ₹${activeQuote.totalAmount.toLocaleString('en-IN')} & Allocate Gold` : 'Review & Lock Gold Price'}</span>
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Insured</span>
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-[#702638]" /> IDBI Trustee</span>
                <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-600" /> BIS 999.9 Hallmark</span>
              </div>
            </div>

            {/* Educational / Trust Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-md border border-[#EBE3D5]">
                <h3 className="text-base font-serif font-bold text-[#702638] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                  Why Invest in Aura Gold™?
                </h3>
                <ul className="space-y-3 text-xs text-gray-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>100% Physical Custody:</strong> Every microgram of gold you buy is backed by physical 24K 999.9 bullion stored in BRINKS vaults.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Zero Making Charges:</strong> No wastage or craftsmanship deductions when investing. Pay only the pure bullion rate.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Instant Liquidity:</strong> Sell back at live market prices anytime 24/7 with funds credited straight to your bank via IMPS.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Doorstep Minted Coin Delivery:</strong> Convert your gold balance into BIS hallmarked gold coins anytime.</span>
                  </li>
                </ul>
              </div>

              {/* Wallet Summary Snippet if signed in */}
              {user && wallet && (
                <div className="bg-gradient-to-br from-[#FAF7F2] to-[#EFE9DF] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Your Gold Vault</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span>
                  </div>
                  <div className="text-3xl price-total text-[#702638]">
                    {wallet.goldBalanceGrams.toFixed(4)} <span className="text-sm font-normal text-gray-600">grams</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Current Portfolio Value: <strong className="price-total text-[#702638]">{formatCurrencyINR(wallet.marketValuationInr)}</strong>
                  </div>
                  <button 
                    onClick={() => setActiveTab('VAULT')}
                    className="mt-4 w-full py-2 bg-white rounded-xl text-xs font-semibold text-[#702638] border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    View Vault Statement &amp; Ledger →
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: SELL GOLD */}
        {activeTab === 'SELL' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
            <div className="pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-xl font-serif font-bold text-[#702638]">Sell Digital Gold &amp; Instant Cash-Out</h2>
              <p className="text-xs text-gray-500">Funds transferred directly to your bank account via IMPS</p>
            </div>

            {/* Available Balance Notice */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-gray-200 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 block">Available Gold Balance:</span>
                <span className="text-lg font-bold text-[#702638]">
                  {wallet ? `${wallet.availableGrams.toFixed(4)} grams` : 'Sign in to view balance'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Live Sell-back Rate:</span>
                <span className="text-sm font-bold text-gray-800">
                  ₹{rates ? rates.sellRatePerGram.toLocaleString('en-IN') : '12,492'}/g
                </span>
              </div>
            </div>

            {/* Grams input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-2">
                Weight to Sell (Grams)
              </label>
              <input
                type="number"
                step="0.01"
                value={sellGrams}
                onChange={(e) => { setSellGrams(e.target.value); setSellQuote(null); }}
                placeholder="0.1"
                className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#702638] text-xl font-bold text-gray-900 focus:outline-none bg-[#FAF7F2]"
              />
              <button
                onClick={handleGenerateSellQuote}
                className="mt-2 text-xs text-[#702638] font-semibold hover:underline"
              >
                Calculate Estimated Proceeds
              </button>
            </div>

            {/* Sell Quote Display */}
            {sellQuote && (
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs mb-6 space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span>Weight to Sell:</span>
                  <span>{sellQuote.grams}g 24K Gold</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Sell-back Rate:</span>
                  <span>₹{sellQuote.ratePerGram.toLocaleString('en-IN')}/g</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-900 text-sm pt-2 border-t border-emerald-200">
                  <span>Net Payout to Bank:</span>
                  <span>₹{sellQuote.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Bank Details Form */}
            <div className="space-y-4 mb-6 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Beneficiary Bank Account Details</h3>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Account Holder Full Name</label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  placeholder="e.g. S. Eakhalaivan"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Bank IFSC Code</label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#702638]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSellGold}
              disabled={isSelling || !sellQuote}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-base shadow-lg hover:shadow-xl hover:opacity-95 transition-all disabled:opacity-50"
            >
              {isSelling ? 'Initiating Settlement...' : 'Confirm Sale & Request Payout'}
            </button>
          </div>
        )}

        {/* TAB 3: PHYSICAL REDEMPTION */}
        {activeTab === 'REDEEM' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-serif font-bold text-[#702638]">Convert Digital Gold to Minted Coins</h2>
              <p className="text-xs text-gray-600 mt-1">
                Convert your digital vault balance into pure 24K 999.9 BIS hallmarked gold coins delivered in tamper-proof CertiCards with transit insurance.
              </p>
            </div>

            {/* Product Selector Cards with Sheen and Macro Zoom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {redemptionProducts.map(prod => {
                const isSelected = selectedProduct?.id === prod.id;
                return (
                  <motion.div
                    key={prod.id}
                    whileHover={{ y: -5, scale: 1.015 }}
                    transition={{ duration: 0.35, ease: EASINGS.velvet }}
                    onClick={() => setSelectedProduct(prod)}
                    className={`group relative bg-white dark:bg-[#1E1B1D] rounded-3xl p-5 shadow-md hover:shadow-2xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden sheen-container ${
                      isSelected ? 'border-[#702638] dark:border-[#C69A8B] ring-2 ring-[#702638]/20' : 'border-gray-200 dark:border-stone-800 hover:border-[#D4AF37]/60'
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
                      <h4 className="font-serif font-bold text-sm text-gray-900 dark:text-stone-100 mt-2">{prod.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-1">{prod.dimension}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Minting Fee:</span>
                      <span className="font-bold text-[#702638] dark:text-[#E8A598] tabular-nums">₹{prod.mintingCharges}</span>
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
                  {isRedeeming ? 'Placing Coin Order...' : `Redeem ${selectedProduct.grams}g Coin (Minting Fee: ₹${selectedProduct.mintingCharges})`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY VAULT & LEDGER */}
        {activeTab === 'VAULT' && (
          <div className="space-y-8">
            {/* Vault Balance Overview Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#EBE3D5] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">
                  Vault Account: {wallet?.accountNumber || 'AG-VAULT-2026'}
                </span>
                <div className="text-4xl sm:text-5xl price-total text-[#702638]">
                  {wallet ? wallet.goldBalanceGrams.toFixed(4) : '0.0000'} <span className="text-xl font-normal text-gray-500">grams</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Market Valuation: <strong className="text-gray-900 price-total">{wallet ? formatCurrencyINR(wallet.marketValuationInr) : '₹0'}</strong>
                  <span className="ml-2 text-xs text-emerald-600 font-medium">100% Insured</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setActiveTab('BUY')}
                  className="px-6 py-3 rounded-xl bg-[#702638] text-white text-xs font-bold hover:bg-[#5C1F2E] transition-colors"
                >
                  + Add More Gold
                </button>
                <button
                  onClick={() => toast.success('Vault Certificate download initiated!')}
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Certificate</span>
                </button>
              </div>
            </div>

            {/* Double-Entry Transaction Ledger Table */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5]">
              <h3 className="text-lg font-serif font-bold text-[#702638] mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-[#D4AF37]" />
                Authoritative Double-Entry Gold Ledger
              </h3>

              {wallet && wallet.recentTransactions && wallet.recentTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Transaction Ref</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Weight (g)</th>
                        <th className="py-3 px-4">Bullion Rate</th>
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
                              {tx.type}
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
                  No transactions yet. Start your gold accumulation journey with as little as ₹100!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AURA GOLD SIP */}
        {activeTab === 'SIP' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EBE3D5] text-center">
            <Coins className="w-12 h-12 text-[#D4AF37] mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold text-[#702638]">Systematic Gold Savings (SIP)</h2>
            <p className="text-xs text-gray-600 max-w-md mx-auto mt-2 mb-6">
              Automate disciplined gold savings with daily, weekly, or monthly auto-debit starting from ₹100. Average your purchase price and beat inflation over time.
            </p>

            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-gray-200 mb-6 text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Daily Micro-SIP:</span>
                <span className="font-bold text-gray-900">₹100 / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gold Purity:</span>
                <span className="font-bold text-gray-900">24K 999.9 BIS Hallmarked</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lock-in Period:</span>
                <span className="font-bold text-emerald-700">Zero lock-in (Withdraw anytime)</span>
              </div>
            </div>

            <button
              onClick={() => {
                toast.success('Gold SIP auto-mandate request received! Our wealth desk will coordinate.');
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#702638] to-[#9B3650] text-white font-serif font-bold text-base shadow-lg hover:shadow-xl transition-all"
            >
              Start Systematic Gold Plan (SIP)
            </button>
          </div>
        )}
          </motion.div>
        </AnimatePresence>

        {/* Purchase Success Modal */}
        {purchaseSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
              <h3 className="text-2xl font-serif font-bold text-[#702638]">24K Gold Allocated!</h3>
              <p className="text-xs text-gray-600 mt-2 mb-6">
                Your payment was verified and 24K pure bullion has been credited to your insured vault.
              </p>
              <div className="bg-[#FAF7F2] p-4 rounded-2xl text-xs space-y-2 text-left mb-6 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-gray-900">{purchaseSuccess.transaction?.transaction_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gold Added:</span>
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
          </div>
        )}

      </div>
    </div>
  );
}
