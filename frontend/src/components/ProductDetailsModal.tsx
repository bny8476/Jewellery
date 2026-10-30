import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Scale, Info, ShoppingCart, Heart, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { JewelryItem } from '../lib/supabase';
import { useRates } from '../context/RateContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrencyINR } from '../utils/formatters';
import { modalBackdropVariants, modalContentVariants } from '../utils/motion';
import { useScrollLock } from '../utils/useScrollLock';

interface ProductDetailsModalProps {
    item?: JewelryItem | null;
    product?: JewelryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart?: () => void;
    onBuyNow?: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ item, product, isOpen, onClose, onAddToCart, onBuyNow }) => {
    const navigate = useNavigate();
    const activeItem = item || product || null;
    const { calculateProductPrice } = useRates();
    const { addToCart, addToCartWithAnimation } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [selectedWeight, setSelectedWeight] = useState<number>(0);
    const [customWeight, setCustomWeight] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);

    useScrollLock(isOpen && Boolean(activeItem), { onEscape: onClose });

    useEffect(() => {
        if (activeItem) {
            setSelectedWeight(activeItem.weight);
            setCustomWeight(activeItem.weight.toString());
            setIsCustom(false);
        }
    }, [activeItem]);

    const currentWeight = isCustom ? (parseFloat(customWeight) || 0) : selectedWeight;
    const breakDown = activeItem ? calculateProductPrice(currentWeight, activeItem.metal_type, activeItem.wastage_percent, activeItem.price, activeItem.name) : null;

    const formatCurrency = (amount: number) => formatCurrencyINR(amount, { maximumFractionDigits: 2 });

    const handleWeightChange = (w: number) => {
        setSelectedWeight(w);
        setIsCustom(false);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && activeItem && breakDown && (
                <motion.div
                    variants={modalBackdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onClose();
                    }}
                    className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                    <motion.div
                        variants={modalContentVariants}
                        className="bg-white dark:bg-[#120D0F] border border-[#EAE5E6] dark:border-[#46343A] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row text-[#241B1D] dark:text-[#F8F3F4] transition-colors duration-200"
                    >
                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-white dark:bg-[#1B1316] flex items-center justify-center overflow-hidden h-72 md:h-auto md:min-h-[460px] aspect-[4/5] relative border-b md:border-b-0 md:border-r border-[#EAE5E6] dark:border-[#46343A]">
                    {activeItem.image_url ? (
                        <img 
                            id="modal-product-image" 
                            src={activeItem.image_url} 
                            alt={activeItem.name} 
                            style={{ imageRendering: '-webkit-optimize-contrast' }}
                            className="w-full h-full object-cover object-center transition-transform hover:scale-105 duration-700" 
                        />
                    ) : (
                        <div className="text-stone-400 font-inter text-sm">YAZHINI Fine Jewels</div>
                    )}
                    <div className="absolute top-4 left-4 bg-[#28030B]/90 dark:bg-[#120D0F]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#C6A15B]/50">
                        <span className="text-[10px] font-bold text-[#D8B878] uppercase tracking-wider">
                            BIS 916 Hallmarked
                        </span>
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#450817] dark:text-[#D8B878] px-2.5 py-1 bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] rounded inline-block">
                                    {activeItem.category} • {activeItem.metal_type}
                                </span>
                                {activeItem.sku && (
                                    <span className="text-[10px] font-mono text-[#777174] dark:text-[#C1B4B8]">
                                        SKU: {activeItem.sku}
                                    </span>
                                )}
                            </div>
                            <h2 className="font-inter text-2xl md:text-3xl font-medium text-[#241B1D] dark:text-[#F8F3F4] leading-snug tracking-[-0.01em]">{activeItem.name}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleWishlist(activeItem.id)}
                                className={`p-2 rounded-full border transition-colors ${isInWishlist(activeItem.id)
                                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                                    : 'bg-[#FAF9F8] dark:bg-[#20171A] border-[#EAE5E6] dark:border-[#46343A] text-[#777174] dark:text-[#C1B4B8] hover:text-rose-500'
                                    }`}
                                title={isInWishlist(activeItem.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <Heart className={`h-5 w-5 ${isInWishlist(activeItem.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button onClick={onClose} className="p-2 bg-[#FAF9F8] dark:bg-[#20171A] hover:bg-[#EAE5E6] dark:hover:bg-[#302126] border border-[#EAE5E6] dark:border-[#46343A] rounded-full transition-colors text-[#777174] dark:text-[#C1B4B8] hover:text-[#241B1D] dark:hover:text-[#F8F3F4]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <p className="text-[#777174] dark:text-[#C1B4B8] text-sm mb-4 leading-relaxed font-light">{activeItem.description}</p>

                    {activeItem.stone_details && (
                        <div className="mb-5 text-[11px] bg-[#FAF9F8] dark:bg-[#1A1215] p-2.5 rounded-lg border border-[#EAE5E6] dark:border-[#46343A] flex items-start gap-2">
                            <span className="font-semibold text-[#450817] dark:text-[#D8B878] shrink-0">Gems &amp; Accents:</span>
                            <span className="text-[#777174] dark:text-[#C1B4B8]">{activeItem.stone_details}</span>
                        </div>
                    )}

                    {/* Weight Selection (only for metal items) */}
                    {activeItem.metal_type !== 'none' && (
                        <div className="mb-6">
                            <label className="text-xs font-bold text-[#450817] dark:text-[#D8B878] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Scale className="h-3.5 w-3.5" />
                                {activeItem.metal_type === 'diamond' ? 'Select Carats' : 'Select Weight (Grams)'}
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(activeItem.metal_type === 'diamond'
                                    ? [0.1, 0.2, 0.3, 0.5, 1.0, 2.0, 3.0]
                                    : activeItem.metal_type === 'silver'
                                        ? [1, 2, 3, 5, 10, 20, 50, 100]
                                        : [1, 2, 3, 5, 8, 10, 20]
                                ).map(w => (
                                    <button
                                        key={w}
                                        onClick={() => handleWeightChange(w)}
                                        className={`px-3.5 py-1.5 rounded-lg border text-xs transition-all font-semibold ${!isCustom && selectedWeight === w
                                            ? 'border-[#450817] dark:border-[#D8B878] bg-[#450817]/10 dark:bg-[#D8B878]/15 text-[#450817] dark:text-[#D8B878] shadow-sm'
                                            : 'border-[#EAE5E6] dark:border-[#46343A] bg-[#FAF9F8] dark:bg-[#20171A] hover:border-[#C6A15B] text-[#777174] dark:text-[#C1B4B8] hover:text-[#241B1D] dark:hover:text-[#F8F3F4]'
                                            }`}
                                    >
                                        {w}{activeItem.metal_type === 'diamond' ? 'ct' : 'g'}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsCustom(true)}
                                    className={`px-3.5 py-1.5 rounded-lg border text-xs transition-all font-semibold ${isCustom
                                        ? 'border-[#450817] dark:border-[#D8B878] bg-[#450817]/10 dark:bg-[#D8B878]/15 text-[#450817] dark:text-[#D8B878]'
                                        : 'border-[#EAE5E6] dark:border-[#46343A] bg-[#FAF9F8] dark:bg-[#20171A] hover:border-[#C6A15B] text-[#777174] dark:text-[#C1B4B8] hover:text-[#241B1D] dark:hover:text-[#F8F3F4]'
                                        }`}
                                >
                                    Custom
                                </button>
                            </div>

                            {isCustom && (
                                <input
                                    type="number"
                                    value={customWeight}
                                    onChange={(e) => setCustomWeight(e.target.value)}
                                    placeholder={activeItem.metal_type === 'diamond' ? 'Enter carats' : 'Enter weight in grams'}
                                    className="w-full px-4 py-2 bg-white dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-[#241B1D] dark:text-[#F8F3F4] rounded-lg focus:outline-none focus:border-[#450817] dark:focus:border-[#D8B878] text-xs transition-all"
                                />
                            )}
                        </div>
                    )}

                    {/* Tax & Breakdown Card */}
                    <div className="bg-[#FAF9F8] dark:bg-[#24191D] rounded-xl p-4 mb-6 border border-[#EAE5E6] dark:border-[#46343A]">
                        <h3 className="text-xs font-bold text-[#450817] dark:text-[#D8B878] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5" /> Price Breakdown
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                                <span>{activeItem.metal_type === 'diamond' ? 'Diamond Value' : 'Metal Value'} ({currentWeight}{activeItem.metal_type === 'diamond' ? 'ct' : 'g'})</span>
                                <span className="text-[#241B1D] dark:text-[#F8F3F4] font-medium number-supporting">{formatCurrency(breakDown.basePrice)}</span>
                            </div>
                            <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                                <span>Wastage & Making ({activeItem.wastage_percent}%)</span>
                                <span className="text-[#241B1D] dark:text-[#F8F3F4] font-medium number-supporting">{formatCurrency(breakDown.wastageAmount)}</span>
                            </div>
                            <div className="pt-2 border-t border-[#EAE5E6] dark:border-[#46343A] flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                                <span>CGST (1.5%)</span>
                                <span className="number-supporting">{formatCurrency(breakDown.cgst)}</span>
                            </div>
                            <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                                <span>SGST (1.5%)</span>
                                <span className="number-supporting">{formatCurrency(breakDown.sgst)}</span>
                            </div>
                            <div className="pt-3 border-t border-dashed border-[#EAE5E6] dark:border-[#46343A] flex justify-between items-baseline">
                                <span className="font-semibold text-sm text-[#241B1D] dark:text-[#F8F3F4]">Total Final Price</span>
                                <span className="text-2xl price-total font-bold text-[#450817] dark:text-[#D8B878] tracking-tight">{formatCurrency(breakDown.totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* View Full Product Details Link */}
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                navigate(`/product/${activeItem.id}`);
                            }}
                            className="w-full py-2.5 px-3 rounded-lg border border-[#C6A15B]/40 hover:border-[#C6A15B] bg-[#FAF9F8] dark:bg-[#20171A] hover:bg-[#C6A15B]/10 text-xs font-medium text-[#450817] dark:text-[#D8B878] flex items-center justify-center gap-2 transition-all group cursor-pointer"
                        >
                            <span>View Full Product Details &amp; Hallmark Certificates</span>
                            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
                        <button
                            onClick={(e) => {
                                if (onAddToCart) {
                                    onAddToCart();
                                } else {
                                    const modalImg = document.getElementById('modal-product-image') || e.currentTarget;
                                    addToCartWithAnimation(
                                        activeItem.id,
                                        currentWeight,
                                        modalImg,
                                        activeItem.image_url || undefined,
                                        activeItem.name
                                    );
                                }
                                onClose();
                            }}
                            className="bg-[#450817] hover:bg-[#6A1B2B] dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] border border-[#C6A15B]/50 py-3 rounded-xl font-sans font-semibold tracking-wider hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-xs uppercase shadow-md cursor-pointer"
                        >
                            <ShoppingCart className="h-4 w-4 text-[#C6A15B] dark:text-[#120D0F]" />
                            Add to Bag
                        </button>
                        <button
                            onClick={() => {
                                if (onBuyNow) {
                                    onBuyNow();
                                } else {
                                    addToCart(activeItem.id, currentWeight);
                                    onClose();
                                    navigate('/?checkout=true');
                                }
                            }}
                            className="bg-white dark:bg-[#20171A] hover:bg-[#FAF9F8] dark:hover:bg-[#302126] border border-[#C6A15B] text-[#450817] dark:text-[#D8B878] py-3 rounded-xl font-sans font-semibold tracking-wider hover:brightness-105 active:scale-[0.99] transition-all shadow-xs flex items-center justify-center gap-2 text-xs uppercase cursor-pointer"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
