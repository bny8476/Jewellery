import React from 'react';
import { X, Heart, ShoppingCart, Trash2, Gem } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: JewelryItem[];
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose, items }) => {
    const { wishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { calculateProductPrice } = useRates();

    const wishlistItems = items.filter(item => wishlist.includes(item.id));

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-[var(--shadow-luxury)] flex flex-col transform transition-transform duration-300 text-[var(--text-main)]">
                    <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                        <h2 className="text-lg font-serif font-semibold flex items-center gap-2.5 text-rose-500">
                            <Heart className="h-5 w-5 fill-current" />
                            Your Wishlist
                        </h2>
                        <button onClick={onClose} className="p-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {wishlistItems.length === 0 ? (
                            <div className="text-center py-24">
                                <Heart className="h-16 w-16 text-rose-500/30 mx-auto mb-4" />
                                <p className="text-[var(--text-secondary)] font-medium text-sm">Your wishlist is empty</p>
                                <button
                                    onClick={onClose}
                                    className="mt-4 text-xs uppercase tracking-widest text-[var(--gold-primary)] font-semibold hover:underline"
                                >
                                    Browse Royal Jewellery
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wishlistItems.map((item) => {
                                    const price = calculateProductPrice(item.weight, item.metal_type, item.wastage_percent, item.price, item.name).totalPrice;
                                    return (
                                        <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--gold-primary)] transition-colors group">
                                            <div className="h-20 w-20 bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-color)] flex-shrink-0 flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Gem className="h-8 w-8 text-[var(--gold-primary)]/40" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-serif font-medium text-[var(--text-main)] text-sm leading-snug mb-1 line-clamp-1">{item.name}</h3>
                                                        <button
                                                            onClick={() => toggleWishlist(item.id)}
                                                            className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors p-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{item.category}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="font-serif font-bold text-[var(--gold-primary)] text-base">{formatPrice(price)}</span>
                                                    <button
                                                        onClick={() => {
                                                            addToCart(item.id, item.weight);
                                                            toggleWishlist(item.id);
                                                        }}
                                                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:brightness-105 transition-colors shadow-sm"
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
                </div>
            </div>
        </div>
    );
};
