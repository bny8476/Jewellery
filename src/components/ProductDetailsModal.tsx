import React, { useState, useEffect } from 'react';
import { X, Scale, Info, ShoppingCart, Heart } from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { useRates } from '../context/RateContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrencyINR } from '../utils/formatters';

interface ProductDetailsModalProps {
    item: JewelryItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ item, isOpen, onClose }) => {
    const { calculateProductPrice } = useRates();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [selectedWeight, setSelectedWeight] = useState<number>(0);
    const [customWeight, setCustomWeight] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        if (item) {
            setSelectedWeight(item.weight);
            setCustomWeight(item.weight.toString());
            setIsCustom(false);
        }
    }, [item]);

    if (!item || !isOpen) return null;

    const currentWeight = isCustom ? (parseFloat(customWeight) || 0) : selectedWeight;
    const breakDown = calculateProductPrice(currentWeight, item.metal_type, item.wastage_percent, item.price, item.name);

    const formatCurrency = (amount: number) => formatCurrencyINR(amount, { maximumFractionDigits: 2 });

    const handleWeightChange = (w: number) => {
        setSelectedWeight(w);
        setIsCustom(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-luxury)] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row text-[var(--text-main)] transition-colors duration-200">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden h-64 md:h-auto relative border-b md:border-b-0 md:border-r border-[var(--border-color)]">
                    {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
                    ) : (
                        <div className="text-[var(--text-secondary)] font-serif text-sm">Royal Collection Piece</div>
                    )}
                    <div className="absolute top-4 left-4 bg-[var(--bg-main)]/80 backdrop-blur-md px-3 py-1 rounded-md border border-[var(--border-color)]">
                        <span className="text-[11px] font-bold text-[var(--gold-primary)] uppercase tracking-wider">
                            Certified 100% Authentic
                        </span>
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold-primary)] px-2.5 py-1 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded mb-2 inline-block">
                                {item.category} • {item.metal_type}
                            </span>
                            <h2 className="text-xl md:text-2xl font-sans font-medium text-[var(--text-main)] leading-tight">{item.name}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => item && toggleWishlist(item.id)}
                                className={`p-2 rounded-full border transition-colors ${item && isInWishlist(item.id)
                                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                                    : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-500'
                                    }`}
                                title={item && isInWishlist(item.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <Heart className={`h-5 w-5 ${item && isInWishlist(item.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button onClick={onClose} className="p-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed font-light">{item.description}</p>

                    {/* Weight Selection (only for metal items) */}
                    {item.metal_type !== 'none' && (
                        <div className="mb-6">
                            <label className="text-xs font-bold text-[var(--gold-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Scale className="h-3.5 w-3.5" />
                                {item.metal_type === 'diamond' ? 'Select Carats' : 'Select Weight (Grams)'}
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(item.metal_type === 'diamond'
                                    ? [0.1, 0.2, 0.3, 0.5, 1.0, 2.0, 3.0]
                                    : item.metal_type === 'silver'
                                        ? [1, 2, 3, 5, 10, 20, 50, 100]
                                        : [1, 2, 3, 5, 8, 10, 20]
                                ).map(w => (
                                    <button
                                        key={w}
                                        onClick={() => handleWeightChange(w)}
                                        className={`px-3.5 py-1.5 rounded-lg border text-xs transition-all font-semibold ${!isCustom && selectedWeight === w
                                            ? 'border-[var(--gold-primary)] bg-amber-500/10 text-[var(--gold-primary)] shadow-sm'
                                            : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--gold-primary)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                            }`}
                                    >
                                        {w}{item.metal_type === 'diamond' ? 'ct' : 'g'}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsCustom(true)}
                                    className={`px-3.5 py-1.5 rounded-lg border text-xs transition-all font-semibold ${isCustom
                                        ? 'border-[var(--gold-primary)] bg-amber-500/10 text-[var(--gold-primary)]'
                                        : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-[var(--gold-primary)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
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
                                    placeholder={item.metal_type === 'diamond' ? 'Enter carats' : 'Enter weight in grams'}
                                    className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg focus:outline-none focus:border-[var(--gold-primary)] text-xs transition-all"
                                />
                            )}
                        </div>
                    )}

                    {/* Tax & Breakdown Card */}
                    <div className="bg-[var(--bg-elevated)] rounded-xl p-4 mb-6 border border-[var(--border-color)]">
                        <h3 className="text-xs font-bold text-[var(--gold-primary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5" /> Price Breakdown
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-[var(--text-secondary)]">
                                <span>{item.metal_type === 'diamond' ? 'Diamond Value' : 'Metal Value'} ({currentWeight}{item.metal_type === 'diamond' ? 'ct' : 'g'})</span>
                                <span className="text-[var(--text-main)] font-medium">{formatCurrency(breakDown.basePrice)}</span>
                            </div>
                            <div className="flex justify-between text-[var(--text-secondary)]">
                                <span>Wastage & Making ({item.wastage_percent}%)</span>
                                <span className="text-[var(--text-main)] font-medium">{formatCurrency(breakDown.wastageAmount)}</span>
                            </div>
                            <div className="pt-2 border-t border-[var(--border-color)] flex justify-between text-[var(--text-secondary)]">
                                <span>CGST (1.5%)</span>
                                <span>{formatCurrency(breakDown.cgst)}</span>
                            </div>
                            <div className="flex justify-between text-[var(--text-secondary)]">
                                <span>SGST (1.5%)</span>
                                <span>{formatCurrency(breakDown.sgst)}</span>
                            </div>
                            <div className="pt-3 border-t border-dashed border-[var(--border-color)] flex justify-between items-baseline">
                                <span className="font-semibold text-sm text-[var(--text-main)]">Total Final Price</span>
                                <span className="text-2xl font-sans font-semibold text-[var(--gold-primary)] tabular-nums">{formatCurrency(breakDown.totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Add to Cart */}
                    <button
                        onClick={() => {
                            addToCart(item.id, currentWeight);
                            onClose();
                        }}
                        className="w-full bg-[var(--gold-primary)] text-black py-3.5 rounded-lg font-sans font-semibold tracking-wider hover:brightness-105 active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2 text-xs uppercase"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart - {formatCurrency(breakDown.totalPrice)}
                    </button>
                </div>
            </div>
        </div>
    );
};
