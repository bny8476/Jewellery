import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Gem, Scale } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { CartItem } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { drawerRightVariants, modalBackdropVariants } from '../utils/motion';
import { useScrollLock } from '../utils/useScrollLock';

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

    // Lock background scroll and handle Escape key
    useScrollLock(isOpen, { onEscape: onClose });

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

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    role="dialog"
                    aria-modal="true"
                    aria-label="Shopping Bag"
                    className="fixed inset-0 z-[1200] overflow-hidden"
                >
                    {/* Viewport Darkened Backdrop */}
                    <motion.div
                        variants={modalBackdropVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[1100]"
                        onClick={onClose}
                    />

                    {/* Right-Anchored Drawer Panel */}
                    <motion.div
                        variants={drawerRightVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="fixed top-0 right-0 bottom-0 z-[1200] w-full max-w-md sm:max-w-lg h-full h-[100dvh] flex flex-col bg-white dark:bg-[#120D0F] border-l border-[#EAE5E6] dark:border-[#46343A] shadow-2xl text-[#241B1D] dark:text-[#F8F3F4] overflow-hidden"
                    >
                        {/* Stable Fixed Header */}
                        <div className="flex-shrink-0 flex items-center justify-between p-5 sm:p-6 border-b border-[#EAE5E6] dark:border-[#46343A] bg-white dark:bg-[#120D0F]">
                            <h2 className="text-lg font-serif font-semibold flex items-center gap-2.5 text-[#241B1D] dark:text-[#F8F3F4]">
                                <ShoppingBag className="h-5 w-5 text-[#C6A15B]" />
                                Your Shopping Bag
                            </h2>
                            <button 
                                onClick={onClose} 
                                aria-label="Close Shopping Bag"
                                className="p-2 bg-[#FAF9F8] dark:bg-[#24191D] hover:bg-[#EAE5E6] dark:hover:bg-[#302126] border border-[#EAE5E6] dark:border-[#46343A] rounded-full text-[#777174] dark:text-[#C1B4B8] hover:text-[#241B1D] dark:hover:text-[#F8F3F4] transition-colors focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Independently Scrollable Item Content with Over-scroll containment */}
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-20 sm:py-24">
                                    <ShoppingBag className="h-16 w-16 text-[#C6A15B]/30 mx-auto mb-4" />
                                    <p className="text-[#777174] dark:text-[#C1B4B8] font-medium text-sm">Your shopping bag is empty</p>
                                    <button
                                        onClick={onClose}
                                        className="mt-4 text-xs uppercase tracking-widest text-[#C6A15B] font-semibold hover:underline focus:outline-none"
                                    >
                                        Explore Royal Jewellery
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div key={item.cartId} className="flex gap-4 p-4 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-white dark:bg-[#24191D] hover:border-[#C6A15B] transition-colors shadow-xs">
                                            <div className="h-20 w-16 bg-[#FAF9F8] dark:bg-[#1B1316] rounded-lg overflow-hidden border border-[#EAE5E6] dark:border-[#46343A] flex-shrink-0 flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <Gem className="h-8 w-8 text-[#C6A15B]/50" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                                <div>
                                                    <h3 className="font-serif font-medium text-[#241B1D] dark:text-[#F8F3F4] text-sm leading-snug mb-1 truncate">{item.name}</h3>
                                                    <div className="flex items-center gap-2 text-[10px] font-sans font-semibold text-[#777174] dark:text-[#C1B4B8] uppercase tracking-[0.14em]">
                                                        <span>{item.category}</span>
                                                        {item.metal_type !== 'none' && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1 text-[#C6A15B] font-bold">
                                                                    <Scale className="h-3 w-3" /> {item.selectedWeight}{item.metal_type === 'diamond' ? 'ct' : 'g'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="price-product text-[#450817] dark:text-[#D8B878] font-semibold text-sm">{formatPrice(item.calculatedPrice)}</span>
                                                    <div className="flex items-center gap-2 bg-[#FAF9F8] dark:bg-[#302126] px-2 py-1 rounded-lg border border-[#EAE5E6] dark:border-[#46343A]">
                                                        <button
                                                            onClick={() => updateCart(item.cartId, item.quantity - 1)}
                                                            className="p-1 text-[#777174] hover:text-[#450817] dark:text-[#C1B4B8] dark:hover:text-[#D8B878] transition-colors focus:outline-none"
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <MinusIcon />
                                                        </button>
                                                        <span className="w-5 text-center text-xs font-semibold text-[#241B1D] dark:text-[#F8F3F4] number-supporting">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateCart(item.cartId, item.quantity + 1)}
                                                            className="p-1 text-[#777174] hover:text-[#450817] dark:text-[#C1B4B8] dark:hover:text-[#D8B878] transition-colors focus:outline-none"
                                                            aria-label="Increase quantity"
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

                        {/* Pinned Stable Checkout Footer */}
                        {cartItems.length > 0 && (
                            <div className="flex-shrink-0 border-t border-[#EAE5E6] dark:border-[#46343A] bg-[#FAF9F8] dark:bg-[#1B1316] p-5 sm:p-6 space-y-4">
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                                        <span>Subtotal</span>
                                        <span className="text-[#241B1D] dark:text-[#F8F3F4] price-product font-semibold">{formatPrice(total)}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline pt-2 border-t border-[#EAE5E6] dark:border-[#46343A]">
                                        <span className="font-semibold text-sm text-[#241B1D] dark:text-[#F8F3F4]">Estimated Total</span>
                                        <span className="text-xl price-total text-[#450817] dark:text-[#D8B878] font-bold tracking-tight">{formatPrice(total)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onCheckout}
                                    className="w-full bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] py-3.5 rounded-xl font-sans font-semibold text-xs tracking-[0.14em] uppercase transition-all shadow-md border border-[#C6A15B]/40 active:scale-[0.99] cursor-pointer"
                                >
                                    Proceed to Checkout
                                </button>
                                <p className="text-[10px] text-center text-[#777174] dark:text-[#C1B4B8] font-light">Prices are tied to real-time bullion benchmarks.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
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
