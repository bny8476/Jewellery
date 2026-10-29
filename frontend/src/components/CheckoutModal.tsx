import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Gem, MapPin, CreditCard, ChevronRight, ShoppingBag, Tag, Sparkles, CheckCircle2, Gift, Printer, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentGateway } from './PaymentGateway';
import { generateInvoice } from '../utils/invoiceUtils';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { toast } from '../utils/toast';
import { validatePhone, validatePincode, validateMinLength, validateRequired } from '../utils/validation';
import { FormFieldError } from './FormFieldError';
import { formatCurrencyINR } from '../utils/formatters';
import { modalBackdropVariants, modalContentVariants } from '../utils/motion';
import { useScrollLock } from '../utils/useScrollLock';
import { validateAndApplyCoupon, AppliedCoupon, AVAILABLE_COUPONS } from '../utils/couponUtils';
import { giftCardService } from '../services/giftCardService';
import { ReceiptPrinterModal } from './ui/ReceiptPrinterModal';
import { type ThermalReceiptData, convertOrderToReceipt } from '../utils/thermalReceiptUtils';
import { addressService } from '../services/addressService';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: {
        id?: string;
        name: string;
        price: number;
        weight: number;
        unit: string;
        quantity?: number;
        image_url?: string;
    }[];

    totalAmount: number;
    isCartCheckout?: boolean;
    onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    items,
    totalAmount,
    isCartCheckout = false,
    onSuccess,
}) => {
    const [step, setStep] = useState<'address' | 'payment' | 'confirmation'>('address');
    const [completedReceipt, setCompletedReceipt] = useState<ThermalReceiptData | null>(null);
    const [isReceiptPrinterOpen, setIsReceiptPrinterOpen] = useState(false);
    const { clearCart } = useCart();
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        zipCode: '',
        phone: ''
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [isAutofilled, setIsAutofilled] = useState(false);

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

    React.useEffect(() => {
        if (!isOpen) {
            setStep('address');
            setFieldErrors({});
            setCouponCode('');
            setAppliedCoupon(null);
            setCouponError(null);
            setIsAutofilled(false);
            setGiftCardCode('');
            setGiftCardPin('');
            setAppliedGiftCard(null);
            setGiftCardError(null);
            setIsGiftCardOpen(false);
            return;
        }

        // Autofill address from patron address book or profile if authenticated
        const autofillFromProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. First check patron's default saved delivery address
                const defaultSaved = await addressService.getDefaultAddress(user.id);
                if (defaultSaved) {
                    setAddress({
                        fullName: defaultSaved.fullName,
                        street: defaultSaved.street,
                        city: defaultSaved.city,
                        zipCode: defaultSaved.pincode,
                        phone: defaultSaved.phone
                    });
                    setIsAutofilled(true);
                    return;
                }

                // 2. Fallback to basic profiles table
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, phone, address, city, pincode')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile) {
                    setAddress(prev => ({
                        fullName: prev.fullName || profile.full_name || '',
                        street: prev.street || profile.address || '',
                        city: prev.city || profile.city || '',
                        zipCode: prev.zipCode || profile.pincode || '',
                        phone: prev.phone || profile.phone || ''
                    }));
                    if (profile.full_name || profile.address) {
                        setIsAutofilled(true);
                    }
                }
            } catch (err) {
                console.debug('Autofill check skipped:', err);
            }
        };

        autofillFromProfile();
    }, [isOpen]);

    useScrollLock(isOpen, { onEscape: onClose });

    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const subtotalAfterCoupon = Math.max(0, totalAmount - discountAmount);
    const giftCardDeduction = appliedGiftCard ? appliedGiftCard.appliedAmount : 0;
    const finalPayableAmount = Math.max(0, subtotalAfterCoupon - giftCardDeduction);

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
            if (res.success && res.appliedAmount && res.appliedAmount > 0) {
                setAppliedGiftCard({
                    cardId: res.cardId || '',
                    code: res.code || giftCardCode.trim().toUpperCase(),
                    pin: giftCardPin.trim(),
                    availableBalance: res.availableBalance || 0,
                    appliedAmount: res.appliedAmount,
                    remainingCardBalance: res.remainingCardBalance || 0
                });
                toast.success(`Gift card applied! ₹${res.appliedAmount.toLocaleString('en-IN')} deducted from order.`);
            } else {
                setGiftCardError(res.error || 'Unable to apply gift card.');
            }
        } catch (err: any) {
            setGiftCardError(err.message || 'Error validating gift card.');
        } finally {
            setGiftCardLoading(false);
        }
    };

    const handleSuccess = async (paymentIntent: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Create Order
            const orderNumber = `ORD-${Date.now()}`;
            const trackingNumber = `BLUEDART-EXP-${Date.now().toString().slice(-6)}`;
            const courierPartner = 'Sequel Logistics / BlueDart Insured Express';

            // Commit atomic gift card redemption before database persistence
            if (appliedGiftCard) {
                try {
                    await giftCardService.redeemCard({
                        code: appliedGiftCard.code,
                        pin: appliedGiftCard.pin,
                        amount: appliedGiftCard.appliedAmount,
                        orderNumber
                    });
                } catch (gcErr: any) {
                    console.warn('Gift card atomic commit error:', gcErr);
                }
            }

            const paymentMethodStr = finalPayableAmount === 0 
                ? 'gift_card' 
                : (appliedGiftCard ? 'razorpay_and_gift_card' : 'razorpay');

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    user_id: user?.id || null,
                    customer_name: address.fullName,
                    customer_phone: address.phone,
                    shipping_address: isGift
                        ? `${address.street}, ${address.city} - ${address.zipCode} [LUXURY GIFT: To ${giftRecipientName || address.fullName} (${giftOccasion}) - "${giftMessage}" | Discreet: ${hideInvoicePrice ? 'Yes' : 'No'}]`
                        : `${address.street}, ${address.city} - ${address.zipCode}`,
                    total_amount: finalPayableAmount,
                    discount_amount: discountAmount + giftCardDeduction,
                    coupon_code: appliedCoupon ? appliedCoupon.code : null,
                    tracking_number: trackingNumber,
                    courier_partner: courierPartner,
                    status: 'processing',
                    payment_status: 'paid',
                    fulfillment_status: 'processing',
                    payment_method: paymentMethodStr,
                    razorpay_payment_id: paymentIntent?.id || (finalPayableAmount === 0 ? `GC_PAID_${Date.now()}` : null),
                    payment_intent_id: paymentIntent?.id || `pi_${Date.now()}`,
                    items: items
                })
                .select()
                .single();

            if (orderError) {
                console.warn('Orders table insert error, falling back:', orderError);
            }

            const dbOrderId = orderData?.id;

            // 2. Create Order Items if order record was created
            if (dbOrderId && items.length > 0) {
                const orderItems = items.map(item => ({
                    order_id: dbOrderId,
                    product_name: item.name,
                    jewelry_item_id: item.id || null,
                    quantity: item.quantity || 1,
                    unit_price: item.price,
                    total_price: item.price * (item.quantity || 1),
                    price: item.price,
                    weight: item.weight || null,
                    unit: item.unit || 'g',
                    image_url: item.image_url || null
                }));

                await supabase.from('order_items').insert(orderItems);
            }


            // 3. Clear cart
            if (isCartCheckout) {
                clearCart();
            }

            // 4. Construct Thermal Receipt Data for newly placed order
            const orderId = dbOrderId || `ORD-${Date.now()}`;
            const receipt = convertOrderToReceipt({
                id: orderId,
                user_id: user?.id || 'patron',
                total_amount: finalPayableAmount,
                status: 'processing',
                shipping_address: address,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                items: items.map(i => ({
                    id: i.id || '',
                    order_id: orderId,
                    product_name: i.name,
                    price: i.price,
                    weight: i.weight || 10,
                    unit: i.unit || 'g',
                    quantity: i.quantity || 1,
                    created_at: new Date().toISOString()
                }))
            });

            setCompletedReceipt(receipt);
            setStep('confirmation');
            setIsReceiptPrinterOpen(true);
            toast.success('Payment verified! Order placed in YAZHINI Vault.');
            onSuccess?.();
        } catch (error: any) {
            console.error('Order creation failed:', error);
            toast.error(`Order creation issue: ${error.message || 'Please contact support.'}`);
        }
    };

    const handleError = (error: string) => {
        toast.error(error);
    };

    const validateAddress = (): boolean => {
        const errors: Record<string, string> = {};

        if (!validateRequired(address.fullName)) {
            errors.fullName = 'Full name is required';
        } else if (!validateMinLength(address.fullName, 2)) {
            errors.fullName = 'Full name must be at least 2 characters';
        }

        if (!validateRequired(address.street)) {
            errors.street = 'Street address is required';
        } else if (!validateMinLength(address.street, 5)) {
            errors.street = 'Street address must be at least 5 characters';
        }

        if (!validateRequired(address.city)) {
            errors.city = 'City is required';
        } else if (!validateMinLength(address.city, 2)) {
            errors.city = 'City must be at least 2 characters';
        }

        if (!validateRequired(address.zipCode)) {
            errors.zipCode = 'Postal / PIN code is required';
        } else if (!validatePincode(address.zipCode)) {
            errors.zipCode = 'Please enter a valid 6-digit Indian PIN code';
        }

        if (!validateRequired(address.phone)) {
            errors.phone = 'Phone number is required';
        } else if (!validatePhone(address.phone)) {
            errors.phone = 'Please enter a valid 10-digit Indian phone number (with optional +91)';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAddress()) {
            toast.error('Please fix the shipping information errors.');
            return;
        }
        if (totalAmount <= 0 || items.length === 0) {
            toast.error('Your shopping bag is empty. Please select jewellery before proceeding.');
            return;
        }
        setStep('payment');
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    variants={modalBackdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                    className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
                >
                    <motion.div 
                        variants={modalContentVariants}
                        className="bg-white dark:bg-[#120D0F] border border-[#EAE5E6] dark:border-[#46343A] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px] text-[#241B1D] dark:text-[#F8F3F4] transition-colors duration-200"
                    >
                {/* Left Side: Steps & Form */}
                <div className="w-full md:w-3/5 p-6 md:p-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[#777174] hover:text-[#241B1D] dark:text-[#C1B4B8] dark:hover:text-[#F8F3F4] transition-colors md:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="flex items-center space-x-3 mb-8 overflow-x-auto pb-1">
                        <div className={`flex items-center ${step === 'address' ? 'text-[#450817] dark:text-[#D8B878]' : 'text-[#777174] dark:text-[#C1B4B8]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === 'address' ? 'border-[#C6A15B] bg-[#C6A15B]/15 text-[#C6A15B]' : 'border-[#EAE5E6] dark:border-[#46343A] text-[#777174] dark:text-[#C1B4B8]'}`}>
                                <MapPin className="h-4 w-4" />
                            </div>
                            <span className="ml-2 font-bold text-xs uppercase tracking-wider">Shipping</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#EAE5E6] dark:text-[#46343A]" />
                        <div className={`flex items-center ${step === 'payment' ? 'text-[#450817] dark:text-[#D8B878]' : 'text-[#777174] dark:text-[#C1B4B8]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === 'payment' ? 'border-[#C6A15B] bg-[#C6A15B]/15 text-[#C6A15B]' : 'border-[#EAE5E6] dark:border-[#46343A] text-[#777174] dark:text-[#C1B4B8]'}`}>
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <span className="ml-2 font-bold text-xs uppercase tracking-wider">Payment</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#EAE5E6] dark:text-[#46343A]" />
                        <div className={`flex items-center ${step === 'confirmation' ? 'text-[#450817] dark:text-[#D8B878]' : 'text-[#777174] dark:text-[#C1B4B8]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === 'confirmation' ? 'border-[#C6A15B] bg-[#C6A15B]/15 text-[#C6A15B]' : 'border-[#EAE5E6] dark:border-[#46343A] text-[#777174] dark:text-[#C1B4B8]'}`}>
                                <Printer className="h-4 w-4" />
                            </div>
                            <span className="ml-2 font-bold text-xs uppercase tracking-wider">Receipt</span>
                        </div>
                    </div>

                    {step === 'address' ? (
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold tracking-widest text-[#C6A15B] uppercase block mb-1">SECURE DELIVERY</span>
                                    <h3 className="text-2xl font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4]">Delivery Information</h3>
                                </div>
                                {isAutofilled && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 tracking-wider">
                                        <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Patron Profile Applied
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Alexander Hamilton"
                                    aria-invalid={Boolean(fieldErrors.fullName)}
                                    aria-describedby={fieldErrors.fullName ? "checkout-fullname-error" : undefined}
                                    className={`w-full px-4 py-2.5 bg-white dark:bg-[#20171A] border ${fieldErrors.fullName ? 'border-rose-500' : 'border-[#EAE5E6] dark:border-[#46343A]'} text-[#241B1D] dark:text-[#F8F3F4] placeholder-[#777174] dark:placeholder-[#C1B4B8] rounded-xl focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] text-xs outline-none`}
                                    value={address.fullName}
                                    onChange={e => {
                                        setAddress({ ...address, fullName: e.target.value });
                                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }));
                                    }}
                                />
                                <FormFieldError id="checkout-fullname-error" error={fieldErrors.fullName} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">Street Address</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Suite / House number, Street"
                                    aria-invalid={Boolean(fieldErrors.street)}
                                    aria-describedby={fieldErrors.street ? "checkout-street-error" : undefined}
                                    className={`w-full px-4 py-2.5 bg-white dark:bg-[#20171A] border ${fieldErrors.street ? 'border-rose-500' : 'border-[#EAE5E6] dark:border-[#46343A]'} text-[#241B1D] dark:text-[#F8F3F4] placeholder-[#777174] dark:placeholder-[#C1B4B8] rounded-xl focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] text-xs outline-none`}
                                    value={address.street}
                                    onChange={e => {
                                        setAddress({ ...address, street: e.target.value });
                                        if (fieldErrors.street) setFieldErrors(prev => ({ ...prev, street: '' }));
                                    }}
                                />
                                <FormFieldError id="checkout-street-error" error={fieldErrors.street} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">City</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="City"
                                        aria-invalid={Boolean(fieldErrors.city)}
                                        aria-describedby={fieldErrors.city ? "checkout-city-error" : undefined}
                                        className={`w-full px-4 py-2.5 bg-white dark:bg-[#20171A] border ${fieldErrors.city ? 'border-rose-500' : 'border-[#EAE5E6] dark:border-[#46343A]'} text-[#241B1D] dark:text-[#F8F3F4] placeholder-[#777174] dark:placeholder-[#C1B4B8] rounded-xl focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] text-xs outline-none`}
                                        value={address.city}
                                        onChange={e => {
                                            setAddress({ ...address, city: e.target.value });
                                            if (fieldErrors.city) setFieldErrors(prev => ({ ...prev, city: '' }));
                                        }}
                                    />
                                    <FormFieldError id="checkout-city-error" error={fieldErrors.city} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">Postal / ZIP Code</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="600001"
                                        aria-invalid={Boolean(fieldErrors.zipCode)}
                                        aria-describedby={fieldErrors.zipCode ? "checkout-zipcode-error" : undefined}
                                        className={`w-full px-4 py-2.5 bg-white dark:bg-[#20171A] border ${fieldErrors.zipCode ? 'border-rose-500' : 'border-[#EAE5E6] dark:border-[#46343A]'} text-[#241B1D] dark:text-[#F8F3F4] placeholder-[#777174] dark:placeholder-[#C1B4B8] rounded-xl focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] text-xs outline-none`}
                                        value={address.zipCode}
                                        onChange={e => {
                                            setAddress({ ...address, zipCode: e.target.value });
                                            if (fieldErrors.zipCode) setFieldErrors(prev => ({ ...prev, zipCode: '' }));
                                        }}
                                    />
                                    <FormFieldError id="checkout-zipcode-error" error={fieldErrors.zipCode} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    aria-invalid={Boolean(fieldErrors.phone)}
                                    aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
                                    className={`w-full px-4 py-2.5 bg-white dark:bg-[#20171A] border ${fieldErrors.phone ? 'border-rose-500' : 'border-[#EAE5E6] dark:border-[#46343A]'} text-[#241B1D] dark:text-[#F8F3F4] placeholder-[#777174] dark:placeholder-[#C1B4B8] rounded-xl focus:border-[#C6A15B] focus:ring-1 focus:ring-[#C6A15B] text-xs outline-none`}
                                    value={address.phone}
                                    onChange={e => {
                                        setAddress({ ...address, phone: e.target.value });
                                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                                    }}
                                />
                                <FormFieldError id="checkout-phone-error" error={fieldErrors.phone} />
                            </div>

                            {/* Joyalukkas Luxury Gifting Suite */}
                            <div className="rounded-xl border border-[#C6A15B]/30 bg-[#C6A15B]/5 dark:bg-[#C6A15B]/10 p-3.5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-[#C6A15B]/20 flex items-center justify-center text-[#C6A15B]">
                                            <Gift className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-[#241B1D] dark:text-[#F8F3F4] block">
                                                Make this a Luxury Gift
                                            </span>
                                            <span className="text-[10px] text-[#777174] dark:text-[#C1B4B8]">
                                                Complimentary velvet box, gold ribbon & wax-sealed card
                                            </span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isGift}
                                            onChange={(e) => setIsGift(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-[#EAE5E6] dark:bg-[#46343A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C6A15B]" />
                                    </label>
                                </div>

                                {isGift && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3 pt-2 border-t border-[#C6A15B]/20 text-xs"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">
                                                    Recipient's Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={giftRecipientName}
                                                    onChange={(e) => setGiftRecipientName(e.target.value)}
                                                    placeholder="e.g. Sanyukta Iyer"
                                                    className="w-full px-3 py-2 bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-[#241B1D] dark:text-[#F8F3F4] placeholder-[#777174] dark:placeholder-[#C1B4B8] rounded-lg text-xs outline-none focus:border-[#C6A15B]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">
                                                    Occasion
                                                </label>
                                                <select
                                                    value={giftOccasion}
                                                    onChange={(e) => setGiftOccasion(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-[#241B1D] dark:text-[#F8F3F4] rounded-lg text-xs outline-none focus:border-[#C6A15B]"
                                                >
                                                    <option value="Wedding / Trousseau">Wedding / Trousseau</option>
                                                    <option value="Anniversary">Anniversary</option>
                                                    <option value="Birthday">Birthday</option>
                                                    <option value="Akshaya Tritiya / Festive">Akshaya Tritiya / Festive</option>
                                                    <option value="Special Celebration">Special Celebration</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#777174] dark:text-[#C1B4B8] mb-1">
                                                Personal Calligraphy Greeting Message
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={giftMessage}
                                                onChange={(e) => setGiftMessage(e.target.value)}
                                                placeholder="Write your wishes here... (e.g. Wishing you timeless happiness and radiance on your special day!)"
                                                className="w-full px-3 py-2 bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-[#241B1D] dark:text-[#F8F3F4] placeholder-[#777174] dark:placeholder-[#C1B4B8] rounded-lg text-xs outline-none focus:border-[#C6A15B] resize-none"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-[#777174] dark:text-[#C1B4B8]">
                                            <input
                                                type="checkbox"
                                                checked={hideInvoicePrice}
                                                onChange={(e) => setHideInvoicePrice(e.target.checked)}
                                                className="rounded border-[#C6A15B] text-[#C6A15B] focus:ring-[#C6A15B]"
                                            />
                                            <span>Discreet Delivery: Hide price breakdown on physical delivery parcel</span>
                                        </label>
                                    </motion.div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={totalAmount <= 0 || items.length === 0}
                                className="w-full mt-2 bg-[#450817] hover:bg-[#6A1B2B] text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] border border-[#C6A15B]/40 py-3.5 rounded-xl font-semibold tracking-wider text-xs uppercase transition-all shadow-md cursor-pointer"
                            >
                                {totalAmount <= 0 || items.length === 0 ? 'Bag is Empty — Add Items to Checkout' : 'Continue to Payment'}
                            </button>
                        </form>
                    ) : step === 'payment' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-2xl font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4] mb-4">Complete Payment</h3>
                            <button
                                onClick={() => setStep('address')}
                                className="text-xs uppercase tracking-wider text-[#450817] dark:text-[#D8B878] font-semibold hover:underline mb-6 flex items-center cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back to Shipping
                            </button>

                            {finalPayableAmount === 0 ? (
                                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-inter font-bold text-lg text-emerald-900 dark:text-emerald-200">
                                            100% Covered by YAZHINI Gift Card
                                        </h4>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                                            ₹{giftCardDeduction.toLocaleString('en-IN')} has been applied. No further payment is required.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleSuccess({ id: `gc_full_${Date.now()}` })}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg cursor-pointer"
                                    >
                                        Complete Order & Generate Invoice
                                    </button>
                                </div>
                            ) : (
                                <PaymentGateway
                                    amount={finalPayableAmount}
                                    items={items}
                                    customerInfo={{
                                        name: address.fullName,
                                        phone: address.phone
                                    }}
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                />
                            )}
                        </div>
                    ) : (
                        /* STEP 3: ORDER CONFIRMATION & RECEIPT PRINTER STEP */
                        <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6 text-center py-2">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C6A15B] block">
                                    ROYAL VAULT CONFIRMATION
                                </span>
                                <h3 className="text-2xl font-inter font-bold text-[#241B1D] dark:text-[#F8F3F4]">
                                    Order Confirmed &amp; Sealed
                                </h3>
                                <p className="text-xs text-[#777174] dark:text-[#C1B4B8] max-w-md mx-auto">
                                    Your jewellery creation has been registered in the YAZHINI Vault ledger under Tax Order <span className="font-mono font-bold text-[#450817] dark:text-[#D8B878]">#{completedReceipt?.receiptNumber}</span>.
                                </p>
                            </div>

                            {/* Destination Card */}
                            <div className="p-4 rounded-2xl bg-[#FAF9F8] dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] text-left text-xs space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold text-[#C6A15B] uppercase tracking-wider">
                                    <span>Insured Delivery Destination</span>
                                    <span>Tamper-Proof Box</span>
                                </div>
                                <p className="font-semibold text-[#241B1D] dark:text-[#F8F3F4]">{address.fullName} ({address.phone})</p>
                                <p className="text-[#777174] dark:text-[#C1B4B8]">{address.street}, {address.city} - {address.zipCode}</p>
                            </div>

                            {/* Tactile Receipt Printer Launch CTA */}
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#351018]/10 via-[#C9A45C]/15 to-[#351018]/10 border border-[#C9A45C]/40 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#351018] text-[#C9A45C] border border-[#C9A45C]/30 flex items-center justify-center shrink-0 shadow-sm">
                                        <Printer className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[#351018] dark:text-[#F7F4EF]">
                                            Thermal Receipt Micro-Printer
                                        </h4>
                                        <p className="text-[11px] text-[#777174] dark:text-[#C1B4B8]">
                                            Print physical slip or view authentic thermal paper animation.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsReceiptPrinterOpen(true)}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#351018] hover:bg-[#250910] text-[#C9A45C] border border-[#C9A45C]/50 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Print Receipt</span>
                                </button>
                            </div>

                            {/* Additional Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        generateInvoice(address.fullName, items.map(i => ({
                                            name: i.name,
                                            price: i.price,
                                            weight: i.weight,
                                            unit: i.unit
                                        })), finalPayableAmount);
                                        toast.success('Tax invoice PDF downloaded');
                                    }}
                                    className="flex-1 py-3 rounded-xl border border-[#C6A15B] text-[#450817] dark:text-[#D8B878] text-xs font-bold uppercase tracking-wider hover:bg-[#C6A15B]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <FileText className="w-4 h-4 text-[#C6A15B]" />
                                    <span>Download Tax Invoice</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        setStep('address');
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#C9A45C] to-[#E6C687] text-[#351018] text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md cursor-pointer"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Order Summary */}
                <div className="w-full md:w-2/5 p-6 md:p-8 bg-[#FAF9F8] dark:bg-[#1B1316] border-t md:border-t-0 md:border-l border-[#EAE5E6] dark:border-[#46343A] relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-[#777174] hover:text-[#241B1D] dark:text-[#C1B4B8] dark:hover:text-[#F8F3F4] transition-colors hidden md:block"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <h4 className="text-xs font-bold text-[#450817] dark:text-[#D8B878] uppercase tracking-widest mb-6">Order Summary</h4>
                    {items.length === 0 ? (
                        <div className="text-center py-8 px-3 bg-white/70 dark:bg-[#20171A]/70 rounded-2xl border border-dashed border-[#C6A15B]/40 mb-6">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FAF9F8] dark:bg-[#120D0F] border border-[#EAE5E6] dark:border-[#46343A] flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-[#C6A15B]" />
                            </div>
                            <p className="font-inter text-sm font-semibold text-[#241B1D] dark:text-[#F8F3F4]">Your Shopping Bag is Empty</p>
                            <p className="text-xs text-[#777174] dark:text-[#C1B4B8] mt-1.5 mb-4 max-w-xs mx-auto leading-relaxed">
                                Explore our royal jewellery showroom and add your favorite creations before checking out.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    const catalogEl = document.getElementById('catalog');
                                    if (catalogEl) {
                                        catalogEl.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="inline-flex items-center justify-center px-4 py-2 bg-[#450817] text-white dark:bg-[#D8B878] dark:text-[#120D0F] border border-[#C6A15B]/50 rounded-xl text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-sm"
                            >
                                Explore Showroom
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
                            {items.map((item, index) => {
                                const itemQty = item.quantity || 1;
                                const itemLineTotal = item.price * itemQty;
                                return (
                                    <div key={index} className="flex items-center gap-3 bg-white dark:bg-[#24191D] p-2.5 rounded-xl border border-[#EAE5E6] dark:border-[#46343A]">
                                        <div className="h-12 w-12 bg-[#FAF9F8] dark:bg-[#120D0F] rounded-lg flex-shrink-0 overflow-hidden border border-[#EAE5E6] dark:border-[#46343A] flex items-center justify-center">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-0.5" />
                                            ) : (
                                                <Gem className="h-5 w-5 text-[#C6A15B]/40" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-inter font-medium text-[#241B1D] dark:text-[#F8F3F4] truncate">{item.name}</p>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-[11px] text-[#777174] dark:text-[#C1B4B8]">
                                                    {itemQty > 1 ? `Qty: ${itemQty} × ${formatCurrencyINR(item.price)}` : `${item.weight}g`}
                                                </span>
                                                <p className="text-xs text-[#450817] dark:text-[#D8B878] price-product font-semibold">
                                                    {formatCurrencyINR(itemLineTotal)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Promotional Coupon Privilege Card */}
                    <div className="border-t border-[#EAE5E6] dark:border-[#46343A] pt-4 mb-4">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777174] dark:text-[#C1B4B8] mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-[#C6A15B]" /> Promotional Privilege
                            </span>
                            {appliedCoupon && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Applied</span>
                            )}
                        </label>
                        {appliedCoupon ? (
                            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded-xl text-xs">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">{appliedCoupon.code}</p>
                                        <p className="text-[10px] text-emerald-700 dark:text-emerald-300">{appliedCoupon.description}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAppliedCoupon(null)}
                                    className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold uppercase tracking-wider px-2 py-1"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter code (e.g. ROYAL20)"
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            if (couponError) setCouponError(null);
                                        }}
                                        className="flex-1 px-3 py-1.5 text-xs uppercase bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] rounded-xl text-[#241B1D] dark:text-[#F8F3F4] outline-none focus:border-[#C6A15B]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const res = validateAndApplyCoupon(couponCode, totalAmount);
                                            if (res.success && res.coupon) {
                                                setAppliedCoupon(res.coupon);
                                                setCouponError(null);
                                                toast.success(`Privilege voucher "${res.coupon.code}" applied!`);
                                            } else {
                                                setCouponError(res.error || 'Invalid coupon code');
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponError && (
                                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{couponError}</p>
                                )}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {Object.keys(AVAILABLE_COUPONS).map((code) => (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => {
                                                setCouponCode(code);
                                                const res = validateAndApplyCoupon(code, totalAmount);
                                                if (res.success && res.coupon) {
                                                    setAppliedCoupon(res.coupon);
                                                    setCouponError(null);
                                                    toast.success(`Voucher "${code}" activated!`);
                                                } else {
                                                    setCouponError(res.error || 'Minimum order value required');
                                                }
                                            }}
                                            className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border border-dashed border-[#C6A15B]/60 text-[#777174] dark:text-[#C1B4B8] hover:border-[#C6A15B] hover:text-[#450817] dark:hover:text-[#D8B878] transition-colors"
                                        >
                                            🏷️ {code}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Gift Card Redemption Accordion */}
                    <div className="border-t border-[#EAE5E6] dark:border-[#46343A] pt-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={() => setIsGiftCardOpen(!isGiftCardOpen)}
                                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#777174] dark:text-[#C1B4B8] hover:text-[#C6A15B] transition-colors"
                            >
                                <Gift className="w-3.5 h-3.5 text-[#C6A15B]" />
                                <span>Apply YAZHINI Gift Card</span>
                            </button>
                            {appliedGiftCard && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                                    - ₹{appliedGiftCard.appliedAmount.toLocaleString('en-IN')} Applied
                                </span>
                            )}
                        </div>

                        {appliedGiftCard ? (
                            <div className="flex items-center justify-between bg-[#C6A15B]/10 border border-[#C6A15B]/40 p-2.5 rounded-xl text-xs">
                                <div>
                                    <p className="font-mono font-bold text-[#450817] dark:text-[#D8B878] tracking-wider">
                                        {appliedGiftCard.code}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-secondary)]">
                                        Remaining on Card: ₹{appliedGiftCard.remainingCardBalance.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAppliedGiftCard(null)}
                                    className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold uppercase tracking-wider px-2 py-1 cursor-pointer"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            isGiftCardOpen && (
                                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-12 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Code (e.g. YAZ-GIFT-GOLD-5000)"
                                            value={giftCardCode}
                                            onChange={(e) => {
                                                setGiftCardCode(e.target.value.toUpperCase());
                                                if (giftCardError) setGiftCardError(null);
                                            }}
                                            className="col-span-7 px-3 py-1.5 text-xs uppercase font-mono bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] rounded-xl text-[#241B1D] dark:text-[#F8F3F4] outline-none focus:border-[#C6A15B]"
                                        />
                                        <input
                                            type="password"
                                            maxLength={4}
                                            placeholder="PIN"
                                            value={giftCardPin}
                                            onChange={(e) => {
                                                setGiftCardPin(e.target.value);
                                                if (giftCardError) setGiftCardError(null);
                                            }}
                                            className="col-span-2 px-2 py-1.5 text-xs text-center font-mono bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] rounded-xl text-[#241B1D] dark:text-[#F8F3F4] outline-none focus:border-[#C6A15B]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleApplyGiftCard}
                                            disabled={giftCardLoading}
                                            className="col-span-3 px-2 py-1.5 bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer text-center"
                                        >
                                            {giftCardLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {giftCardError && (
                                        <p className="text-[11px] text-rose-600 dark:text-rose-400">{giftCardError}</p>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    <div className="border-t border-[#EAE5E6] dark:border-[#46343A] pt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                            <span>Subtotal</span>
                            <span className="text-[#241B1D] dark:text-[#F8F3F4] price-product font-semibold">{formatCurrencyINR(totalAmount)}</span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                <span>Privilege Discount ({appliedCoupon.code})</span>
                                <span>- {formatCurrencyINR(discountAmount)}</span>
                            </div>
                        )}
                        {appliedGiftCard && (
                            <div className="flex justify-between text-[#C6A15B] font-semibold">
                                <span>Gift Card Applied ({appliedGiftCard.code})</span>
                                <span>- {formatCurrencyINR(giftCardDeduction)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                            <span>Insured Delivery</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase text-[10px]">Complimentary</span>
                        </div>
                        <div className="flex justify-between items-baseline text-base pt-3 border-t border-[#EAE5E6] dark:border-[#46343A]">
                            <span className="font-semibold text-sm text-[#241B1D] dark:text-[#F8F3F4]">Payable Total</span>
                            <span className="text-xl price-total text-[#450817] dark:text-[#D8B878] font-bold tracking-tight">
                                {formatCurrencyINR(finalPayableAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* TACTILE THERMAL RECEIPT PRINTER MODAL */}
            <ReceiptPrinterModal
                isOpen={isReceiptPrinterOpen}
                onClose={() => setIsReceiptPrinterOpen(false)}
                receiptData={completedReceipt}
            />
        </motion.div>
    )}
</AnimatePresence>,
document.body
);
};
