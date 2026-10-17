import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingCart, Trash2, Gem } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';
import { drawerRightVariants, modalBackdropVariants } from '../utils/motion';
import { useScrollLock } from '../utils/useScrollLock';

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: JewelryItem[];
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose, items }) => {
    const { wishlist, toggleWishlist } = useWishlist();
    const { addToCartWithAnimation } = useCart();
    const { calculateProductPrice } = useRates();

    // Lock background scroll and handle Escape key
    useScrollLock(isOpen, { onEscape: onClose });

    const wishlistItems = items.filter(item => wishlist.includes(item.id));

    const formatPrice = (price: number) => formatCurrencyINR(price);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div 
                    role="dialog"
                    aria-modal="true"
                    aria-label="Wishlist"
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
                            <h2 className="text-lg font-serif font-semibold flex items-center gap-2.5 text-rose-500">
                                <Heart className="h-5 w-5 fill-current" />
                                Your Wishlist
                            </h2>
                            <button 
                                onClick={onClose} 
                                aria-label="Close Wishlist"
                                className="p-2 bg-[#FAF9F8] dark:bg-[#24191D] hover:bg-[#EAE5E6] dark:hover:bg-[#302126] border border-[#EAE5E6] dark:border-[#46343A] rounded-full text-[#777174] dark:text-[#C1B4B8] hover:text-[#241B1D] dark:hover:text-[#F8F3F4] transition-colors focus:outline-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Independently Scrollable Item Content with Over-scroll containment */}
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
                            {wishlistItems.length === 0 ? (
                                <div className="text-center py-20 sm:py-24">
                                    <Heart className="h-16 w-16 text-rose-500/30 mx-auto mb-4" />
                                    <p className="text-[#777174] dark:text-[#C1B4B8] font-medium text-sm">Your wishlist is empty</p>
                                    <button
                                        onClick={onClose}
                                        className="mt-4 text-xs uppercase tracking-widest text-[#C6A15B] font-semibold hover:underline focus:outline-none"
                                    >
                                        Browse Royal Jewellery
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {wishlistItems.map((item) => {
                                        const price = calculateProductPrice(item.weight, item.metal_type, item.wastage_percent, item.price, item.name).totalPrice;
                                        return (
                                            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] bg-white dark:bg-[#24191D] hover:border-[#C6A15B] transition-colors group">
                                                <div className="h-20 w-20 bg-[#FAF9F8] dark:bg-[#1B1316] rounded-lg overflow-hidden border border-[#EAE5E6] dark:border-[#46343A] flex-shrink-0 flex items-center justify-center">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <Gem className="h-8 w-8 text-[#C6A15B]/40" />
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-serif font-medium text-[#241B1D] dark:text-[#F8F3F4] text-sm leading-snug mb-1 truncate">{item.name}</h3>
                                                            <button
                                                                onClick={() => toggleWishlist(item.id)}
                                                                className="text-[#777174] hover:text-rose-500 transition-colors p-1"
                                                                aria-label={`Remove ${item.name} from wishlist`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-[#777174] dark:text-[#C1B4B8] uppercase tracking-wider">{item.category}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="price-product text-[#450817] dark:text-[#D8B878] text-sm font-semibold">{formatPrice(price)}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                addToCartWithAnimation(
                                                                    item.id,
                                                                    item.weight,
                                                                    e.currentTarget,
                                                                    item.image_url || undefined,
                                                                    item.name
                                                                );
                                                                toggleWishlist(item.id);
                                                            }}
                                                            className="flex items-center gap-1.5 bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] px-3.5 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors shadow-sm cursor-pointer"
                                                        >
                                                            <ShoppingCart className="h-3.5 w-3.5" />
                                                            Move to Bag
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
