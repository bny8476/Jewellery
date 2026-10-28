import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BackButton } from '../components/ui/BackButton';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  ChevronRight, 
  ShoppingBag, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  Gift, 
  Printer, 
  ArrowLeft,
  Truck,
  Plus,
  Lock,
  ChevronDown
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { supabase } from '../lib/supabase';
import { toast } from '../utils/toast';
import { formatCurrencyINR } from '../utils/formatters';
import { validatePhone, validatePincode, validateMinLength, validateRequired } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';
import { validateAndApplyCoupon, AppliedCoupon } from '../utils/couponUtils';
import { giftCardService } from '../services/giftCardService';
import { addressService, type SavedAddress } from '../services/addressService';
import { PaymentGateway } from '../components/PaymentGateway';
import { ReceiptPrinterModal } from '../components/ui/ReceiptPrinterModal';
import { type ThermalReceiptData, convertOrderToReceipt } from '../utils/thermalReceiptUtils';
import { localJewelryItems } from '../utils/localData';
import Footer from '../components/Footer';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const appNav = useAppNavigation();
  const { cart, clearCart } = useCart();
  const { calculateProductPrice } = useRates();

  // Wizard Step: 1. Address, 2. Gifting & Review, 3. Payment, 4. Confirmation
  const [step, setStep] = useState<'address' | 'gifting' | 'payment' | 'confirmation'>('address');

  // Patron saved addresses state
  const [userId, setUserId] = useState<string | null>(null);

  // Intelligent step-aware back navigation
  const handleHeaderBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (step === 'payment') {
      setStep('gifting');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 'gifting') {
      setStep('address');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 'confirmation') {
      navigate('/jewellery');
    } else {
      // step === 'address'
      if (address.fullName || address.street || address.phone) {
        const discard = window.confirm('You have entered shipping information. Are you sure you want to return to the store?');
        if (!discard) return;
      }
      appNav.goBack('/jewellery');
    }
  };
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Form input address
  const [address, setAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    zipCode: '',
    phone: '',
    label: 'Home' as 'Home' | 'Work' | 'Bespoke Studio' | 'Other'
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Luxury Gifting Suite states
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftOccasion, setGiftOccasion] = useState('Wedding / Trousseau');
  const [giftMessage, setGiftMessage] = useState('');
  const [hideInvoicePrice, setHideInvoicePrice] = useState(false);

  // Gift Card Redemption states
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    cardId: string;
    code: string;
    pin: string;
    availableBalance: number;
    appliedAmount: number;
    remainingCardBalance: number;
  } | null>(null);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [isGiftCardOpen, setIsGiftCardOpen] = useState(false);

  // Completed order state for confirmation & printing
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ThermalReceiptData | null>(null);
  const [isReceiptPrinterOpen, setIsReceiptPrinterOpen] = useState(false);

  // Derive cart items with authoritative calculated prices
  const cartItems = useMemo(() => {
    return Object.values(cart).map((cartItem) => {
      const product = localJewelryItems.find((p) => p.id === cartItem.productId);
      if (!product) return null;
      const priceDetails = calculateProductPrice(
        cartItem.weight,
        product.metal_type,
        product.wastage_percent,
        product.price,
        product.name
      );
      return {
        id: product.id,
        name: product.name,
        price: priceDetails.totalPrice,
        basePrice: priceDetails.basePrice,
        makingCharges: priceDetails.wastageAmount,
        gstAmount: priceDetails.cgst + priceDetails.sgst,
        weight: cartItem.weight,
        unit: 'g',
        quantity: cartItem.quantity,
        metal_type: product.metal_type,
        purity: product.purity || '22K',
        image_url: product.image_url || '/images/cat_gold.jpg'
      };
    }).filter(Boolean) as {
      id: string;
      name: string;
      price: number;
      basePrice: number;
      makingCharges: number;
      gstAmount: number;
      weight: number;
      unit: string;
      quantity: number;
      metal_type: string;
      purity: string;
      image_url: string;
    }[];
  }, [cart, calculateProductPrice]);

  const rawSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const totalMakingCharges = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + ((item.makingCharges || 0) * item.quantity), 0);
  }, [cartItems]);

  const totalGst = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + ((item.gstAmount || Math.round(item.price * 0.03 / 1.03)) * item.quantity), 0);
  }, [cartItems]);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const subtotalAfterCoupon = Math.max(0, rawSubtotal - discountAmount);
  const giftCardDeduction = appliedGiftCard ? appliedGiftCard.appliedAmount : 0;
  const finalPayableAmount = Math.max(0, subtotalAfterCoupon - giftCardDeduction);

  // Load Patron User and Saved Delivery Addresses
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const addresses = await addressService.getAddresses(user.id);
          setSavedAddresses(addresses);
          const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setAddress({
              fullName: defaultAddress.fullName,
              street: defaultAddress.street,
              city: defaultAddress.city,
              zipCode: defaultAddress.pincode,
              phone: defaultAddress.phone,
              label: defaultAddress.label
            });
            setIsAddingNewAddress(false);
          } else {
            // Check profiles fallback
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, phone, address, city, pincode')
              .eq('id', user.id)
              .maybeSingle();
            if (profile) {
              setAddress({
                fullName: profile.full_name || '',
                street: profile.address || '',
                city: profile.city || '',
                zipCode: profile.pincode || '',
                phone: profile.phone || '',
                label: 'Home'
              });
            }
          }
        }
      } catch (err) {
        console.debug('Failed to fetch patron addresses:', err);
      }
    };
    fetchUserData();
  }, []);

  // Handle address selection from saved addresses
  const handleSelectSavedAddress = (saved: SavedAddress) => {
    setSelectedAddressId(saved.id);
    setIsAddingNewAddress(false);
    setAddress({
      fullName: saved.fullName,
      street: saved.street,
      city: saved.city,
      zipCode: saved.pincode,
      phone: saved.phone,
      label: saved.label
    });
    setFieldErrors({});
  };

  // Validate address form
  const validateAddressStep = (): boolean => {
    const errors: Record<string, string> = {};
    if (!validateRequired(address.fullName)) errors.fullName = 'Full Name is required for insured shipping';
    if (!validateMinLength(address.street, 5)) errors.street = 'Street address must be at least 5 characters';
    if (!validateRequired(address.city)) errors.city = 'City is required';
    if (!validateRequired(address.zipCode) || !validatePincode(address.zipCode)) errors.zipCode = 'Please enter a valid 6-digit Indian PIN code';
    if (!validatePhone(address.phone)) errors.phone = 'Please enter a valid 10-digit mobile number';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Proceed to next step
  const handleProceedToGifting = () => {
    if (!validateAddressStep()) {
      toast.error('Please complete all required delivery details.');
      return;
    }
    // Optionally persist newly created address
    if (userId && (isAddingNewAddress || selectedAddressId === 'new')) {
      const newAddressToSave: SavedAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: address.fullName,
        street: address.street,
        city: address.city,
        state: 'Tamil Nadu',
        pincode: address.zipCode,
        phone: address.phone,
        label: address.label,
        isDefault: savedAddresses.length === 0
      };
      addressService.saveAddress(userId, newAddressToSave, savedAddresses)
        .then((updatedList) => {
          setSavedAddresses(updatedList);
          setSelectedAddressId(newAddressToSave.id);
          setIsAddingNewAddress(false);
        }).catch(() => {});
    }
    setStep('gifting');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Coupon Application
  const handleApplyCoupon = (codeToApply?: string) => {
    setCouponError(null);
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a valid promotion or privilege code');
      return;
    }
    const result = validateAndApplyCoupon(code, rawSubtotal);
    if (!result.success || !result.coupon) {
      setCouponError(result.error || 'Invalid or expired promotional code');
      return;
    }
    setAppliedCoupon(result.coupon);
    setCouponCode('');
    toast.success(`Privilege coupon "${result.coupon.code}" applied! You saved ${formatCurrencyINR(result.coupon.discountAmount)}`);
  };

  // Handle Gift Card Redemption
  const handleApplyGiftCard = async () => {
    setGiftCardError(null);
    if (!giftCardCode.trim()) {
      setGiftCardError('Please enter your 16-character gift card code');
      return;
    }
    if (!giftCardPin.trim()) {
      setGiftCardError('Please enter your 4-digit security PIN');
      return;
    }
    try {
      setGiftCardLoading(true);
      const res = await giftCardService.validateRedemption(
        giftCardCode.trim(),
        giftCardPin.trim(),
        subtotalAfterCoupon
      );
      const cardId = res.cardId || res.giftCard?.id;
      const code = res.code || res.giftCard?.code || giftCardCode.trim().toUpperCase();
      const availableBalance = res.availableBalance ?? res.giftCard?.currentBalance ?? 0;
      const appliedAmount = res.appliedAmount ?? 0;
      const remainingCardBalance = res.remainingCardBalance ?? 0;

      if (!res.valid || !cardId) {
        setGiftCardError(res.error || 'Invalid gift card or PIN. Please check details.');
        return;
      }
      setAppliedGiftCard({
        cardId,
        code,
        pin: giftCardPin.trim(),
        availableBalance,
        appliedAmount,
        remainingCardBalance
      });
      toast.success(`Gift card applied! Deducted ${formatCurrencyINR(appliedAmount)}.`);
    } catch (err: any) {
      setGiftCardError(err.message || 'Failed to validate gift card. Please try again.');
    } finally {
      setGiftCardLoading(false);
    }
  };

  // Handle Final Payment Success
  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      const newOrderData = {
        order_id: orderId,
        user_id: user?.id || null,
        customer_name: address.fullName,
        customer_phone: address.phone,
        shipping_address: {
          fullName: address.fullName,
          street: address.street,
          city: address.city,
          zipCode: address.zipCode,
          phone: address.phone
        },
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          weight: item.weight,
          quantity: item.quantity,
          purity: item.purity,
          image_url: item.image_url
        })),
        subtotal: rawSubtotal,
        making_charges: totalMakingCharges,
        discount: discountAmount,
        gift_card_deduction: giftCardDeduction,
        tax_amount: totalGst,
        total_amount: finalPayableAmount,
        final_amount: finalPayableAmount,
        payment_method: paymentResult.payment_method || 'razorpay',
        payment_reference: paymentResult.razorpay_payment_id || `REF-${Date.now()}`,
        payment_status: 'paid',
        status: 'completed',
        gifting_details: isGift ? {
          recipientName: giftRecipientName,
          occasion: giftOccasion,
          message: giftMessage,
          hidePriceOnInvoice: hideInvoicePrice
        } : null,
        created_at: now
      };

      // 1. Commit Gift Card Redemption atomic balance deduction
      if (appliedGiftCard) {
        try {
          await giftCardService.redeemCard({
            code: appliedGiftCard.code,
            pin: appliedGiftCard.pin,
            amount: appliedGiftCard.appliedAmount,
            orderNumber: orderId
          });
        } catch (gcErr) {
          console.warn('Gift card atomic commit error:', gcErr);
        }
      }

      // 2. Persist order in Supabase
      const { data: dbOrder, error: orderErr } = await supabase
        .from('orders')
        .insert([newOrderData])
        .select()
        .single();

      if (orderErr) {
        console.warn('Supabase order insert warning:', orderErr);
      }

      const finalOrder = dbOrder || newOrderData;
      setCompletedOrder(finalOrder);

      // 3. Prepare thermal receipt
      try {
        const receipt = convertOrderToReceipt(finalOrder as any);
        setCompletedReceipt(receipt);
      } catch {}

      // 4. Clear cart and move to confirmation step
      clearCart();
      setStep('confirmation');
      toast.success('Your order has been confirmed with 100% Transit Insurance!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Order completion error:', err);
      toast.error('Payment processed, but order creation had a sync issue. Support is notified.');
    }
  };

  // If cart is empty and not on confirmation step
  if (cartItems.length === 0 && step !== 'confirmation') {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col justify-between">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 flex items-center justify-center text-[var(--gold-primary)] mb-6 shadow-inner">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] mb-3">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
            Discover our royal South Indian heritage collections in 22K BIS Hallmarked gold, natural certified diamonds, and fine silver.
          </p>
          <Link
            to="/jewellery"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#450817] dark:bg-[#D8B878] hover:bg-[#6A1B2B] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] font-semibold text-xs tracking-widest uppercase shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#C6A15B] dark:text-[#120D0F]" />
            Explore Jewellery Catalogue
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col">
      {/* Luxury Checkout Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-bold text-lg sm:text-xl tracking-[0.2em] uppercase text-[var(--text-main)] group-hover:text-[var(--gold-primary)] transition-colors">
              YAZHINI
            </span>
            <span className="text-[10px] tracking-[0.28em] text-[var(--gold-primary)] font-semibold uppercase">
              Fine Jewels
            </span>
          </Link>

          {/* Stepper Progress */}
          {step !== 'confirmation' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
              <span className={`flex items-center gap-1.5 ${step === 'address' ? 'text-[var(--gold-primary)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                Delivery
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className={`flex items-center gap-1.5 ${step === 'gifting' ? 'text-[var(--gold-primary)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                Gifting &amp; Review
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-[var(--gold-primary)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                Secure Payment
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> 100% Insured Delivery
            </span>
            <BackButton
              label={
                step === 'payment'
                  ? 'Previous: Gifting'
                  : step === 'gifting'
                  ? 'Previous: Shipping'
                  : step === 'confirmation'
                  ? 'Return to Boutique'
                  : 'Back to Store'
              }
              onClick={handleHeaderBack}
              variant="outline"
            />
          </div>
        </div>
      </header>

      {/* Main Checkout Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {step === 'confirmation' ? (
          /* Confirmation & Invoice Screen */
          <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 mx-auto shadow-xl"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold-primary)]">
                Payment Authorized
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] mt-1">
                Your Order has been Placed!
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Order Reference: <strong className="font-mono text-[var(--text-main)]">{completedOrder?.order_id}</strong>
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-left space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Shipping Address</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Blue Dart Insured Courier
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <p className="font-semibold text-[var(--text-main)] text-sm">{completedOrder?.customer_name}</p>
                <p>{completedOrder?.shipping_address?.street}</p>
                <p>{completedOrder?.shipping_address?.city} - {completedOrder?.shipping_address?.zipCode}</p>
                <p className="mt-1">Phone: {completedOrder?.customer_phone}</p>
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center text-xs">
                <span className="text-[var(--text-muted)] font-medium">Total Paid:</span>
                <span className="text-base font-bold text-[var(--gold-primary)] font-mono">
                  {formatCurrencyINR(completedOrder?.final_amount || completedOrder?.total_amount || 0)}
                </span>
              </div>
            </div>

            {/* Post-order Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {completedReceipt && (
                <button
                  type="button"
                  onClick={() => setIsReceiptPrinterOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[var(--gold-primary)]" />
                  Print Tax Receipt
                </button>
              )}
              <Link
                to="/dashboard?tab=orders"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#450817] dark:bg-[#D8B878] hover:bg-[#6A1B2B] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
              >
                Track Order Live <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-Step Wizard & Summary Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Wizard Container */}
            <div className="lg:col-span-7 space-y-6">
              {/* STEP 1: Address Selection & Form */}
              {step === 'address' && (
                <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[var(--gold-primary)]" />
                        1. Delivery Address
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Tamper-evident, fully insured delivery directly to your door.
                      </p>
                    </div>
                  </div>

                  {/* Patron Saved Addresses Selection */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                        Saved Patron Addresses
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((saved) => (
                          <div
                            key={saved.id}
                            onClick={() => handleSelectSavedAddress(saved)}
                            className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                              selectedAddressId === saved.id && !isAddingNewAddress
                                ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/5 ring-1 ring-[var(--gold-primary)]'
                                : 'border-[var(--border-color)] hover:border-stone-400 bg-[var(--bg-elevated)]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-[var(--text-main)] text-sm">{saved.fullName}</span>
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[var(--border-color)] text-[var(--text-secondary)]">
                                {saved.label}
                              </span>
                            </div>
                            <p className="text-[var(--text-secondary)] line-clamp-2">{saved.street}</p>
                            <p className="text-[var(--text-secondary)]">{saved.city} - {saved.pincode}</p>
                            <p className="text-[var(--text-muted)] mt-1 font-mono">{saved.phone}</p>
                          </div>
                        ))}

                        {/* Add New Address Card */}
                        <div
                          onClick={() => {
                            setIsAddingNewAddress(true);
                            setSelectedAddressId('new');
                            setAddress({ fullName: '', street: '', city: '', zipCode: '', phone: '', label: 'Home' });
                          }}
                          className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center text-xs cursor-pointer transition-all ${
                            isAddingNewAddress || selectedAddressId === 'new'
                              ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/5 text-[var(--gold-primary)]'
                              : 'border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <Plus className="w-5 h-5 mb-1" />
                          <span className="font-semibold">Add New Delivery Address</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual / Editing Address Form */}
                  {(savedAddresses.length === 0 || isAddingNewAddress || selectedAddressId === 'new') && (
                    <div className="space-y-4 pt-2 border-t border-[var(--border-color)]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                        Address Information
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--text-secondary)]">Full Recipient Name *</label>
                          <input
                            type="text"
                            placeholder="e.g., Rajesh Sharma"
                            value={address.fullName}
                            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--gold-primary)] ${
                              fieldErrors.fullName ? 'border-rose-500' : 'border-[var(--border-color)]'
                            }`}
                          />
                          <FormFieldError error={fieldErrors.fullName} />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--text-secondary)]">10-Digit Mobile Number *</label>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="e.g., 9876543210"
                            value={address.phone}
                            onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--gold-primary)] ${
                              fieldErrors.phone ? 'border-rose-500' : 'border-[var(--border-color)]'
                            }`}
                          />
                          <FormFieldError error={fieldErrors.phone} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-[var(--text-secondary)]">Street Address &amp; Landmark *</label>
                        <input
                          type="text"
                          placeholder="e.g., Flat 4B, Emerald Residency, T. Nagar"
                          value={address.street}
                          onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--gold-primary)] ${
                            fieldErrors.street ? 'border-rose-500' : 'border-[var(--border-color)]'
                          }`}
                        />
                        <FormFieldError error={fieldErrors.street} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--text-secondary)]">City *</label>
                          <input
                            type="text"
                            placeholder="e.g., Chennai"
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--gold-primary)] ${
                              fieldErrors.city ? 'border-rose-500' : 'border-[var(--border-color)]'
                            }`}
                          />
                          <FormFieldError error={fieldErrors.city} />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--text-secondary)]">6-Digit PIN Code *</label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="e.g., 600017"
                            value={address.zipCode}
                            onChange={(e) => setAddress({ ...address, zipCode: e.target.value.replace(/\D/g, '') })}
                            className={`w-full px-3.5 py-2.5 rounded-xl border bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--gold-primary)] ${
                              fieldErrors.zipCode ? 'border-rose-500' : 'border-[var(--border-color)]'
                            }`}
                          />
                          <FormFieldError error={fieldErrors.zipCode} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
                    <button
                      type="button"
                      onClick={handleProceedToGifting}
                      className="px-8 py-3 rounded-xl bg-[#450817] dark:bg-[#D8B878] hover:bg-[#6A1B2B] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] font-semibold text-xs tracking-widest uppercase shadow-md flex items-center gap-2 transition-all cursor-pointer"
                    >
                      Continue to Gifting &amp; Review <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Gifting & Order Review */}
              {step === 'gifting' && (
                <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[var(--gold-primary)]" />
                        2. Luxury Gifting &amp; Custom Packaging
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Add personalized gift wrap, custom greetings, and insured packaging.
                      </p>
                    </div>
                  </div>

                  {/* Gifting Suite Toggle */}
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGift}
                        onChange={(e) => setIsGift(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--gold-primary)] focus:ring-[var(--gold-primary)]"
                      />
                      <div>
                        <span className="font-semibold text-xs text-[var(--text-main)] block">
                          This order is a Special Luxury Gift
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)] block">
                          Includes signature velvet presentation box, custom seal, and ribbon.
                        </span>
                      </div>
                    </label>

                    {isGift && (
                      <div className="space-y-4 pt-3 border-t border-[var(--border-color)]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--text-secondary)]">Recipient Name</label>
                            <input
                              type="text"
                              placeholder="e.g., Ananya Verma"
                              value={giftRecipientName}
                              onChange={(e) => setGiftRecipientName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-main)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-[var(--text-secondary)]">Occasion</label>
                            <select
                              value={giftOccasion}
                              onChange={(e) => setGiftOccasion(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-main)]"
                            >
                              <option>Wedding / Trousseau</option>
                              <option>Birthday Milestone</option>
                              <option>Anniversary Celebration</option>
                              <option>Festival / Diwali / Akshaya Tritiya</option>
                              <option>Bespoke Appreciation</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--text-secondary)]">Personalized Handwritten Gift Note</label>
                          <textarea
                            rows={3}
                            maxLength={250}
                            placeholder="Write a message to be hand-inscribed on our gold-embossed card..."
                            value={giftMessage}
                            onChange={(e) => setGiftMessage(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-main)]"
                          />
                          <span className="text-[10px] text-[var(--text-muted)] text-right block">{250 - giftMessage.length} characters left</span>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={hideInvoicePrice}
                            onChange={(e) => setHideInvoicePrice(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-[var(--gold-primary)]"
                          />
                          <span className="text-xs text-[var(--text-secondary)]">
                            Conceal jewellery item pricing on delivery packaging slip
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep('address')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-color)] hover:border-[#D8B878]/60 bg-white dark:bg-[#181B22] text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider transition-all cursor-pointer shadow-2xs group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#D8B878] transition-transform group-hover:-translate-x-0.5" />
                      <span>Previous: Shipping</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('payment');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-8 py-3 rounded-xl bg-[#450817] dark:bg-[#D8B878] hover:bg-[#6A1B2B] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] font-semibold text-xs tracking-widest uppercase shadow-md flex items-center gap-2 transition-all cursor-pointer"
                    >
                      Proceed to Payment <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment Gateway & Redemption */}
              {step === 'payment' && (
                <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[var(--gold-primary)]" />
                        3. Secure Payment Gateway
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Authoritative Razorpay gateway with 256-bit SSL encryption.
                      </p>
                    </div>
                  </div>

                  {/* Gift Card Redemption Accordion */}
                  <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-3">
                    <button
                      type="button"
                      onClick={() => setIsGiftCardOpen(!isGiftCardOpen)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-[var(--text-main)]"
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-[var(--gold-primary)]" /> Have a Digital Gift Card?
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isGiftCardOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isGiftCardOpen && (
                      <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
                        {appliedGiftCard ? (
                          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{appliedGiftCard.code}</span>
                              <p className="text-[11px] text-[var(--text-secondary)]">Applied: {formatCurrencyINR(appliedGiftCard.appliedAmount)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAppliedGiftCard(null)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="YAZ-GIFT-XXXX-XXXX"
                                value={giftCardCode}
                                onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                                className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-main)] font-mono"
                              />
                              <input
                                type="password"
                                maxLength={4}
                                placeholder="4-Digit PIN"
                                value={giftCardPin}
                                onChange={(e) => setGiftCardPin(e.target.value.replace(/\D/g, ''))}
                                className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-main)] font-mono"
                              />
                            </div>
                            {giftCardError && <p className="text-[11px] text-rose-500">{giftCardError}</p>}
                            <button
                              type="button"
                              onClick={handleApplyGiftCard}
                              disabled={giftCardLoading}
                              className="px-4 py-2 rounded-lg bg-[var(--gold-primary)] text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
                            >
                              {giftCardLoading ? 'Verifying...' : 'Redeem Gift Card'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Gateway Execution Form */}
                  <div className="pt-2">
                    <PaymentGateway
                      amount={finalPayableAmount}
                      items={cartItems}
                      customerInfo={{
                        name: address.fullName,
                        phone: address.phone
                      }}
                      onSuccess={handlePaymentSuccess}
                      onError={(err) => toast.error(err)}
                    />
                  </div>

                  <div className="pt-4 border-t border-[var(--border-color)] flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep('gifting')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-color)] hover:border-[#D8B878]/60 bg-white dark:bg-[#181B22] text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider transition-all cursor-pointer shadow-2xs group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#D8B878] transition-transform group-hover:-translate-x-0.5" />
                      <span>Previous: Gifting</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Order Summary Column */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[var(--gold-primary)]" />
                    Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Free Transit Insurance
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 text-xs">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover border border-[var(--border-color)] bg-white shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--text-main)] truncate">{item.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {item.weight}g • {item.purity} • Qty: {item.quantity}
                        </p>
                        <p className="font-mono font-semibold text-[var(--gold-primary)] mt-0.5">
                          {formatCurrencyINR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Privilege Coupon Input */}
                <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                  {appliedCoupon ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{appliedCoupon.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-semibold">-{formatCurrencyINR(appliedCoupon.discountAmount)}</span>
                        <button
                          type="button"
                          onClick={() => setAppliedCoupon(null)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Privilege Code (e.g. LUXURY5)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-xs text-[var(--text-main)] font-mono outline-none focus:border-[var(--gold-primary)]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-xs font-semibold text-[var(--text-main)] uppercase transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-[10px] text-rose-500">{couponError}</p>}
                    </div>
                  )}
                </div>

                {/* Price Breakdown Calculation */}
                <div className="pt-3 border-t border-[var(--border-color)] space-y-2 text-xs">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Base Gold / Metal Value</span>
                    <span className="font-mono">{formatCurrencyINR(rawSubtotal - totalGst)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Making Charges &amp; Craftsmanship</span>
                    <span className="font-mono">{formatCurrencyINR(totalMakingCharges)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Statutory GST (3.0% Total)</span>
                    <span className="font-mono">{formatCurrencyINR(totalGst)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Transit Security &amp; Insurance</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[10px]">Complimentary</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Privilege Discount</span>
                      <span className="font-mono">-{formatCurrencyINR(discountAmount)}</span>
                    </div>
                  )}

                  {giftCardDeduction > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Gift Card Credit</span>
                      <span className="font-mono">-{formatCurrencyINR(giftCardDeduction)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-baseline font-bold text-sm text-[var(--text-main)]">
                    <span>Total Amount Payable</span>
                    <span className="text-xl text-[var(--gold-primary)] font-mono">
                      {formatCurrencyINR(finalPayableAmount)}
                    </span>
                  </div>
                </div>

                {/* Trust & Compliance Badges */}
                <div className="pt-3 border-t border-[var(--border-color)] grid grid-cols-2 gap-2 text-[10px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                    <span>916 BIS Hallmarked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-bit SSL Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Thermal / PDF Invoice Modal */}
      {completedReceipt && (
        <ReceiptPrinterModal
          isOpen={isReceiptPrinterOpen}
          onClose={() => setIsReceiptPrinterOpen(false)}
          receiptData={completedReceipt}
        />
      )}

      <Footer />
    </div>
  );
};

export default Checkout;
