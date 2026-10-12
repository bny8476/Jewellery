import React, { useState } from 'react';
import { X, Gem, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { PaymentGateway } from './PaymentGateway';
import { generateInvoice } from '../utils/invoiceUtils';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: {
        name: string;
        price: number;
        weight: number;
        unit: string;
        image_url?: string;
    }[];
    totalAmount: number;
    isCartCheckout?: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    items,
    totalAmount,
    isCartCheckout = false,
}) => {
    const [step, setStep] = useState<'address' | 'payment'>('address');
    const { clearCart } = useCart();
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        zipCode: '',
        phone: ''
    });

    if (!isOpen) return null;

    const handleSuccess = async (paymentIntent: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // 1. Create Order
                const orderId = `ORD-${Date.now()}`;
                const { error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        id: orderId,
                        user_id: user.id,
                        total_amount: totalAmount,
                        status: 'processing',
                        shipping_address: address,
                        payment_intent_id: paymentIntent?.id || 'mock_payment_id'
                    });

                if (orderError) throw orderError;

                // 2. Create Order Items
                const orderItems = items.map(item => ({
                    order_id: orderId,
                    product_name: item.name,
                    price: item.price,
                    weight: item.weight,
                    unit: item.unit,
                    image_url: item.image_url,
                    quantity: 1 // Assuming 1 for flattened items list, or we need quantity in items prop
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                if (itemsError) throw itemsError;
            }

            // Generate and download invoice
            generateInvoice(address.fullName, items.map(i => ({
                name: i.name,
                price: i.price,
                weight: i.weight,
                unit: i.unit
            })), totalAmount);

            if (isCartCheckout) {
                clearCart();
            }

            alert('Payment Successful! Your order has been placed and digital invoice downloaded.');
            onClose();
            setStep('address');
        } catch (error: any) {
            console.error('Order creation failed:', error);
            alert(`Payment successful but failed to create order: ${error.message}`);
        }
    };

    const handleError = (error: string) => {
        alert(`Payment Error: ${error}`);
    };

    const handleAddressSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('payment');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-luxury)] w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px] text-[var(--text-main)] transition-colors duration-200">
                {/* Left Side: Steps & Form */}
                <div className="w-full md:w-3/5 p-6 md:p-8 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors md:hidden"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="flex items-center space-x-4 mb-8">
                        <div className={`flex items-center ${step === 'address' ? 'text-[var(--gold-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === 'address' ? 'border-[var(--gold-primary)] bg-amber-500/10 text-[var(--gold-primary)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                                <MapPin className="h-4 w-4" />
                            </div>
                            <span className="ml-2 font-bold text-xs uppercase tracking-wider">Shipping</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--border-color)]" />
                        <div className={`flex items-center ${step === 'payment' ? 'text-[var(--gold-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step === 'payment' ? 'border-[var(--gold-primary)] bg-amber-500/10 text-[var(--gold-primary)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <span className="ml-2 font-bold text-xs uppercase tracking-wider">Payment</span>
                        </div>
                    </div>

                    {step === 'address' ? (
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                            <div>
                                <span className="text-[10px] font-bold tracking-widest text-[var(--gold-primary)] uppercase block mb-1">SECURE DELIVERY</span>
                                <h3 className="text-2xl font-serif font-bold text-[var(--text-main)]">Delivery Information</h3>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Alexander Hamilton"
                                    className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs outline-none"
                                    value={address.fullName}
                                    onChange={e => setAddress({ ...address, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Street Address</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Suite / House number, Street"
                                    className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs outline-none"
                                    value={address.street}
                                    onChange={e => setAddress({ ...address, street: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">City</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="City"
                                        className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs outline-none"
                                        value={address.city}
                                        onChange={e => setAddress({ ...address, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Postal / ZIP Code</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="600001"
                                        className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs outline-none"
                                        value={address.zipCode}
                                        onChange={e => setAddress({ ...address, zipCode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs outline-none"
                                    value={address.phone}
                                    onChange={e => setAddress({ ...address, phone: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full mt-2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-black py-3.5 rounded-xl font-semibold tracking-wider text-xs uppercase hover:brightness-105 transition-all shadow-md"
                            >
                                Continue to Payment
                            </button>
                        </form>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-2xl font-serif font-bold text-[var(--text-main)] mb-4">Complete Payment</h3>
                            <button
                                onClick={() => setStep('address')}
                                className="text-xs uppercase tracking-wider text-[var(--gold-primary)] font-semibold hover:underline mb-6 flex items-center"
                            >
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back to Shipping
                            </button>
                            <PaymentGateway
                                amount={totalAmount}
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                        </div>
                    )}
                </div>

                {/* Right Side: Order Summary */}
                <div className="w-full md:w-2/5 p-6 md:p-8 bg-[var(--bg-secondary)] border-t md:border-t-0 md:border-l border-[var(--border-color)] relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors hidden md:block"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <h4 className="text-xs font-bold text-[var(--gold-primary)] uppercase tracking-widest mb-6">Order Summary</h4>
                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-[var(--bg-elevated)] p-2.5 rounded-xl border border-[var(--border-color)]">
                                <div className="h-12 w-12 bg-[var(--bg-secondary)] rounded-lg flex-shrink-0 overflow-hidden border border-[var(--border-color)] flex items-center justify-center">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Gem className="h-5 w-5 text-[var(--gold-primary)]/40" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-serif font-medium text-[var(--text-main)] truncate">{item.name}</p>
                                    <p className="text-xs text-[var(--gold-primary)] font-semibold">
                                        {new Intl.NumberFormat('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                            maximumFractionDigits: 0
                                        }).format(item.price)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-[var(--border-color)] pt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Subtotal</span>
                            <span className="text-[var(--text-main)] font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Insured Delivery</span>
                            <span className="text-emerald-500 font-semibold tracking-wider uppercase text-[10px]">Complimentary</span>
                        </div>
                        <div className="flex justify-between items-baseline text-base pt-3 border-t border-[var(--border-color)]">
                            <span className="font-semibold text-sm text-[var(--text-main)]">Total Amount</span>
                            <span className="text-xl font-serif font-bold text-gold-gradient">
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    maximumFractionDigits: 0
                                }).format(totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
