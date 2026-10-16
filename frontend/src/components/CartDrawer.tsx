import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Gem, Scale } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { CartItem } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { drawerRightVariants, modalBackdropVariants } from '../utils/motion';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: { [key: string]: CartItem };
    items: JewelryItem[];
    updateCart: (cartId: string, quantity: number) => void;
    onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    onClose,
    cart,
    items,
    updateCart,
    onCheckout,
}) => {
    const { calculateProductPrice } = useRates();

    const cartItems = Object.values(cart).map(cartItem => {
        const product = items.find(p => p.id === cartItem.productId);
        if (!product) return null;

        const priceDetails = calculateProductPrice(cartItem.weight, product.metal_type, product.wastage_percent, product.price, product.name);

        return {
            ...product,
            cartId: cartItem.id,
            selectedWeight: cartItem.weight,
            quantity: cartItem.quantity,
            calculatedPrice: priceDetails.totalPrice
        };
    }).filter(Boolean) as (JewelryItem & { cartId: string, selectedWeight: number, quantity: number, calculatedPrice: number })[];

    const total = cartItems.reduce((sum, item) => sum + (item.calculatedPrice * item.quantity), 0);

    const formatPrice = (price: number) => formatCurrencyINR(price);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <motion.div
                        variants={modalBackdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <motion.div
                            variants={drawerRightVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="w-screen max-w-md bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-[var(--shadow-luxury)] flex flex-col text-[var(--text-main)]"
                        >
                    <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                        <h2 className="text-lg font-serif font-semibold flex items-center gap-2.5 text-[var(--text-main)]">
                            <ShoppingBag className="h-5 w-5 text-[var(--gold-primary)]" />
                            Your Shopping Bag
                        </h2>
                        <button onClick={onClose} className="p-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-24">
                                <ShoppingBag className="h-16 w-16 text-[var(--gold-primary)]/30 mx-auto mb-4" />
                                <p className="text-[var(--text-secondary)] font-medium text-sm">Your shopping bag is empty</p>
                                <button
                                    onClick={onClose}
                                    className="mt-4 text-xs uppercase tracking-widest text-[var(--gold-primary)] font-semibold hover:underline"
                                >
                                    Explore Royal Jewellery
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.cartId} className="flex gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--gold-primary)] transition-colors">
                                        <div className="h-20 w-20 bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Gem className="h-8 w-8 text-[var(--gold-primary)]/40" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-serif font-medium text-[var(--text-main)] text-sm leading-snug mb-1 line-clamp-1">{item.name}</h3>
                                                <div className="flex items-center gap-2 text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.14em]">
                                                    <span>{item.category}</span>
                                                    {item.metal_type !== 'none' && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1 text-[var(--gold-primary)] font-bold">
                                                                <Scale className="h-3 w-3" /> {item.selectedWeight}{item.metal_type === 'diamond' ? 'ct' : 'g'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="price-product text-[var(--gold-primary)] text-sm">{formatPrice(item.calculatedPrice)}</span>
                                                <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-2 py-1 rounded-lg border border-[var(--border-color)]">
                                                    <button
                                                        onClick={() => updateCart(item.cartId, item.quantity - 1)}
                                                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors"
                                                    >
                                                        <MinusIcon />
                                                    </button>
                                                    <span className="w-5 text-center text-xs font-semibold text-[var(--text-main)] number-supporting">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateCart(item.cartId, item.quantity + 1)}
                                                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors"
                                                    >
                                                        <PlusIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {cartItems.length > 0 && (
                        <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 space-y-4">
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Subtotal</span>
                                    <span className="text-[var(--text-main)] price-product font-semibold">{formatPrice(total)}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2 border-t border-[var(--border-color)]">
                                    <span className="font-semibold text-sm text-[var(--text-main)]">Estimated Total</span>
                                    <span className="text-xl price-total text-[var(--gold-primary)]">{formatPrice(total)}</span>
                                </div>
                            </div>
                            <button
                                onClick={onCheckout}
                                className="w-full bg-[var(--gold-primary)] text-black py-3.5 rounded-lg font-sans font-semibold text-xs tracking-[0.14em] uppercase hover:brightness-105 transition-all shadow-sm active:scale-[0.99]"
                            >
                                Proceed to Checkout
                            </button>
                            <p className="text-[10px] text-center text-[var(--text-secondary)] font-light">Prices are tied to real-time bullion benchmarks.</p>
                        </div>
                    )}
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
    </svg>
);
