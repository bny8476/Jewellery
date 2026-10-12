import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Scale, ShoppingCart, Eye, Heart, Sparkles, TrendingUp, RefreshCw, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import SeedButton from '../components/SeedButton';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import LiveMetalRates from '../components/LiveMetalRates';

import { localJewelryItems } from '../utils/localData';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { useWishlist } from '../context/WishlistContext';

export default function Home() {
    const [searchParams] = useSearchParams();
    const { cart, totalItems } = useCart();
    const { calculateProductPrice } = useRates();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const shouldReduceMotion = useReducedMotion();

    const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isCartCheckout, setIsCartCheckout] = useState(false);
    const [checkoutItems, setCheckoutItems] = useState<{ name: string; price: number; weight: number; unit: string; image_url?: string }[]>([]);
    const [checkoutTotal, setCheckoutTotal] = useState(0);
    const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
    const [selectedPurity, setSelectedPurity] = useState<string>('all');
    const [selectedProduct, setSelectedProduct] = useState<JewelryItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const heroRef = useRef<HTMLDivElement>(null);
    const catalogRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.1]);

    useEffect(() => {
        if (searchParams.get('checkout') === 'true' && totalItems > 0) {
            handleCheckoutCart();
        }
    }, [searchParams, totalItems]);

    useEffect(() => {
        fetchJewelryItems();
    }, []);

    const fetchJewelryItems = async () => {
        if (!isSupabaseConfigured) {
            setJewelryItems(localJewelryItems);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('jewelry_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                setJewelryItems(data);
            } else {
                setJewelryItems(localJewelryItems);
            }
        } catch (error) {
            console.warn('Could not fetch jewelry items from Supabase, using local data:', error);
            setJewelryItems(localJewelryItems);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', ...Array.from(new Set(jewelryItems.map(item => item.category)))];

    const getDynamicPrice = (item: JewelryItem) => {
        return calculateProductPrice(item.weight, item.metal_type, item.wastage_percent, item.price, item.name).totalPrice;
    };

    const filteredItems = jewelryItems
        .filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            const price = getDynamicPrice(item);
            const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
            const matchesPurity = selectedPurity === 'all' ||
                (selectedPurity === '24k' && (item.name || '').toLowerCase().includes('24k')) ||
                (selectedPurity === '22k' && !(item.name || '').toLowerCase().includes('24k') && item.metal_type === 'gold');
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesPrice && matchesPurity && matchesSearch;
        })
        .sort((a, b) => {
            const priceA = getDynamicPrice(a);
            const priceB = getDynamicPrice(b);
            if (sortBy === 'price-low') return priceA - priceB;
            if (sortBy === 'price-high') return priceB - priceA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const getTotalPrice = () => {
        return Object.values(cart).reduce((sum, cartItem) => {
            const product = jewelryItems.find(p => p.id === cartItem.productId);
            if (!product) return sum;
            const price = calculateProductPrice(cartItem.weight, product.metal_type, product.wastage_percent, product.price, product.name).totalPrice;
            return sum + (price * cartItem.quantity);
        }, 0);
    };

    const handleBuyNow = (item: JewelryItem) => {
        const price = getDynamicPrice(item);
        setCheckoutItems([{
            name: item.name,
            price: price,
            weight: item.weight,
            unit: item.metal_type === 'diamond' ? 'ct' : 'g',
            image_url: item.image_url || undefined
        }]);
        setCheckoutTotal(price);
        setIsCartCheckout(false);
        setIsCheckoutOpen(true);
    };

    const handleCheckoutCart = () => {
        const items = Object.values(cart).map(cartItem => {
            const product = jewelryItems.find(p => p.id === cartItem.productId);
            if (!product) return null;
            const price = calculateProductPrice(cartItem.weight, product.metal_type, product.wastage_percent, product.price, product.name).totalPrice;
            return {
                name: product.name,
                price: price * cartItem.quantity,
                weight: cartItem.weight,
                unit: product.metal_type === 'diamond' ? 'ct' : 'g',
                image_url: product.image_url
            };
        }).filter(Boolean) as { name: string; price: number; weight: number; unit: string; image_url?: string }[];

        setCheckoutItems(items);
        setCheckoutTotal(getTotalPrice());
        setIsCartCheckout(true);
        setIsCheckoutOpen(true);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const openProductDetails = (item: JewelryItem) => {
        setSelectedProduct(item);
        setIsDetailsOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        animate={{
                            rotate: shouldReduceMotion ? 0 : 360,
                            scale: shouldReduceMotion ? 1 : [1, 1.1, 1]
                        }}
                        transition={{
                            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="inline-block"
                    >
                        <Gem className="h-16 w-16 text-amber-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(214,179,106,0.4)]" />
                    </motion.div>
                    <p className="text-[var(--gold-primary)] text-sm font-display tracking-[0.25em] uppercase font-semibold">
                        RCB Jewelry’s &amp; Pawn Shop
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen selection:bg-amber-400 selection:text-black transition-colors duration-200">
            
            {/* 1. HERO SECTION (85–95% Desktop Viewport) */}
            <motion.section
                ref={heroRef}
                style={{ opacity: heroOpacity }}
                className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center overflow-hidden bg-[var(--bg-main)]"
                aria-label="Hero - Timeless Luxury"
            >
                {/* Cinematic Background with Slow Zoom */}
                <motion.div
                    className="absolute inset-0 z-0 overflow-hidden"
                    initial={{ scale: 1 }}
                    animate={{ scale: shouldReduceMotion ? 1 : 1.04 }}
                    transition={{ duration: 16, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                >
                    <img
                        src="/images/luxury_necklace_hero.jpg"
                        alt="Diamond necklace displayed inside velvet jewelry box"
                        className="w-full h-full object-cover object-center lg:object-right filter brightness-[0.95] contrast-[1.05]"
                        loading="eager"
                    />

                    {/* Gradient Overlay for Maximum Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-main)] via-[var(--bg-main)]/90 md:via-[var(--bg-main)]/80 to-transparent lg:w-3/5" />
                    
                    {/* Top & Bottom Cinematic Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-[var(--bg-main)]/70" />
                    
                    {/* Center Accent Glow */}
                    <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
                </motion.div>

                {/* Hero Foreground Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-20 lg:py-24">
                    <div className="max-w-2xl lg:max-w-2xl">
                        
                        {/* Small Eyebrow Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 mb-6 backdrop-blur-sm"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-[11px] sm:text-xs font-sans tracking-[0.28em] font-semibold uppercase text-[var(--gold-primary)]">
                                EXCEPTIONAL CRAFTSMANSHIP
                            </span>
                        </motion.div>

                        {/* Large Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.25 }}
                            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[var(--text-main)] mb-6 leading-[1.05]"
                        >
                            Timeless <span className="text-gold-gradient italic font-normal">Luxury</span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="font-sans text-base sm:text-lg lg:text-xl text-[var(--text-secondary)] font-light leading-relaxed mb-10 max-w-xl"
                        >
                            Discover exquisite fine jewellery and trusted pawn services, crafted around what matters most.
                        </motion.p>

                        {/* Call-to-Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.55 }}
                            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-5"
                        >
                            {/* Primary CTA: EXPLORE COLLECTION */}
                            <Link
                                to="/jewelry"
                                className="group relative inline-flex items-center justify-center px-8 sm:px-10 py-4 rounded-full text-xs sm:text-sm font-sans font-bold tracking-[0.16em] uppercase text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_25px_rgba(214,179,106,0.3)] hover:shadow-[0_0_35px_rgba(214,179,106,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden text-center"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    EXPLORE COLLECTION
                                </span>
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                            </Link>

                            {/* Secondary CTA: PAWN SERVICES */}
                            <Link
                                to="/pawn"
                                className="inline-flex items-center justify-center px-8 sm:px-10 py-4 rounded-full text-xs sm:text-sm font-sans font-semibold tracking-[0.16em] uppercase text-[var(--text-main)] hover:text-[var(--gold-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] backdrop-blur-md transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm text-center"
                            >
                                PAWN SERVICES
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Subtle Bottom-Center Scroll Indicator */}
                <motion.div
                    className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none opacity-70 hover:opacity-100 transition-opacity"
                    animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden="true"
                >
                    <span className="text-[10px] tracking-[0.3em] font-sans text-amber-400/80 uppercase font-medium">
                        SCROLL
                    </span>
                    <ChevronDown className="h-4 w-4 text-amber-400" />
                </motion.div>
            </motion.section>

            {/* 2. LIVE METAL RATES TICKER */}
            <LiveMetalRates />

            {/* 3. THE ESSENCE OF RCB / FEATURES SECTION */}
            <section className="bg-[var(--bg-secondary)] py-20 px-4 sm:px-6 lg:px-8 border-t border-b border-[var(--border-color)] relative transition-colors duration-200">
                <div className="max-w-7xl mx-auto">
                    
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <span className="text-xs font-sans tracking-[0.25em] font-semibold text-[var(--gold-primary)] uppercase block mb-3">
                            The Standard of Distinction
                        </span>
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-main)] mb-4">
                            Why Choose <span className="text-gold-gradient italic">RCB</span>
                        </h2>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-6" />
                        <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light font-sans leading-relaxed">
                            A heritage of integrity, hallmarked authenticity, and premier secured pawn solutions designed for discerning clientele.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Gem,
                                title: "Exquisite Fine Jewelry",
                                description: "Handcrafted 24K & 22K gold, solitaire diamonds, and precious gemstones curated for elegance and generational value.",
                                link: "/jewelry",
                                action: "Browse Jewels"
                            },
                            {
                                icon: Scale,
                                title: "Trusted Pawn Services",
                                description: "Immediate, confidential pawn financing backed by certified valuations and transparent, competitive interest rates.",
                                link: "/pawn",
                                action: "Calculate Loan"
                            },
                            {
                                icon: ShieldCheck,
                                title: "Certified Purity & Security",
                                description: "BIS hallmarked gold and GIA certified diamonds safeguarded under insured, bank-grade vaults.",
                                link: "/jewelry",
                                action: "Learn Standards"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.15 }}
                                className="group relative bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] rounded-2xl p-8 sm:p-10 transition-all duration-300 hover:shadow-[var(--shadow-card)] flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                        <feature.icon className="h-7 w-7 text-amber-500" />
                                    </div>
                                    <h3 className="font-display font-semibold text-lg sm:text-xl text-[var(--text-main)] mb-3 group-hover:text-[var(--gold-primary)] transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-[var(--text-secondary)] text-sm font-light leading-relaxed font-sans mb-6">
                                        {feature.description}
                                    </p>
                                </div>
                                <Link
                                    to={feature.link}
                                    className="inline-flex items-center text-xs font-semibold tracking-wider text-[var(--gold-primary)] uppercase hover:opacity-80 transition-opacity group-hover:translate-x-1 duration-200"
                                >
                                    <span>{feature.action}</span>
                                    <span className="ml-1">&rarr;</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. MASTERPIECES / JEWELRY COLLECTION SECTION */}
            <section id="jewelry-collection" ref={catalogRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-main)] min-h-screen transition-colors duration-200">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-[var(--border-color)] pb-8">
                        <div>
                            <span className="text-xs font-sans tracking-[0.25em] font-semibold text-[var(--gold-primary)] uppercase block mb-2">
                                Curated Masterpieces
                            </span>
                            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-main)]">
                                Signature Collection
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] font-sans mt-2 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-[var(--gold-primary)]" />
                                Dynamic pricing updated with live metal spot rates
                            </p>
                        </div>
                        <Link
                            to="/jewelry"
                            className="inline-flex items-center text-xs font-semibold tracking-widest text-[var(--gold-primary)] uppercase hover:opacity-80 transition-opacity"
                        >
                            View Entire Catalog &rarr;
                        </Link>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="mb-10 space-y-6">
                        
                        {/* Category Pills */}
                        <div className="flex flex-wrap gap-2.5">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-2.5 rounded-full text-xs font-sans tracking-widest uppercase transition-all duration-300 ${
                                        selectedCategory === category
                                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-[0_0_15px_rgba(214,179,106,0.3)]'
                                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--gold-primary)]'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Search & Filter Row */}
                        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] shadow-sm">
                            
                            {/* Search Input */}
                            <div className="flex-1 px-3">
                                <input
                                    type="text"
                                    placeholder="Search by piece or category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-sm text-[var(--text-main)] placeholder-[var(--text-secondary)] focus:outline-none"
                                />
                            </div>

                            <div className="h-6 w-px bg-[var(--border-color)] hidden md:block" />

                            {/* Purity Filter */}
                            <div className="px-2">
                                <select
                                    value={selectedPurity}
                                    onChange={(e) => setSelectedPurity(e.target.value)}
                                    className="bg-transparent text-xs uppercase tracking-wider text-[var(--text-main)] focus:outline-none cursor-pointer py-1"
                                    aria-label="Filter by metal purity"
                                >
                                    <option value="all" className="bg-[var(--bg-card)] text-[var(--text-main)]">All Purities</option>
                                    <option value="24k" className="bg-[var(--bg-card)] text-[var(--text-main)]">24K Pure Gold</option>
                                    <option value="22k" className="bg-[var(--bg-card)] text-[var(--text-main)]">22K Fine Gold</option>
                                </select>
                            </div>

                            <div className="h-6 w-px bg-[var(--border-color)] hidden md:block" />

                            {/* Price Range Filter */}
                            <div className="px-2">
                                <select
                                    value={`${priceRange[0]}-${priceRange[1]}`}
                                    onChange={(e) => {
                                        const [min, max] = e.target.value.split('-').map(Number);
                                        setPriceRange([min, max]);
                                    }}
                                    className="bg-transparent text-xs uppercase tracking-wider text-[var(--text-main)] focus:outline-none cursor-pointer py-1"
                                    aria-label="Filter by price range"
                                >
                                    <option value="0-1000000" className="bg-[var(--bg-card)] text-[var(--text-main)]">All Price Ranges</option>
                                    <option value="0-10000" className="bg-[var(--bg-card)] text-[var(--text-main)]">Under ₹10,000</option>
                                    <option value="10000-50000" className="bg-[var(--bg-card)] text-[var(--text-main)]">₹10k - ₹50k</option>
                                    <option value="50000-200000" className="bg-[var(--bg-card)] text-[var(--text-main)]">₹50k - ₹2,00,000</option>
                                    <option value="200000-1000000" className="bg-[var(--bg-card)] text-[var(--text-main)]">Above ₹2,00,000</option>
                                </select>
                            </div>

                            <div className="h-6 w-px bg-[var(--border-color)] hidden md:block" />

                            {/* Sort Filter */}
                            <div className="px-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-transparent text-xs uppercase tracking-wider text-[var(--gold-primary)] font-semibold focus:outline-none cursor-pointer py-1"
                                    aria-label="Sort products"
                                >
                                    <option value="newest" className="bg-[var(--bg-card)] text-[var(--text-main)]">Newest Additions</option>
                                    <option value="price-low" className="bg-[var(--bg-card)] text-[var(--text-main)]">Price: Low to High</option>
                                    <option value="price-high" className="bg-[var(--bg-card)] text-[var(--text-main)]">Price: High to Low</option>
                                </select>
                            </div>

                            {/* Reset Button */}
                            {(searchQuery || selectedCategory !== 'all' || selectedPurity !== 'all' || priceRange[1] !== 1000000) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('all');
                                        setSelectedPurity('all');
                                        setPriceRange([0, 1000000]);
                                        setSortBy('newest');
                                    }}
                                    className="p-2 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors ml-auto md:ml-0"
                                    title="Reset filters"
                                    aria-label="Reset all filters"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Products Grid */}
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-24 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                            <Gem className="h-16 w-16 text-[var(--text-secondary)] mx-auto mb-4 opacity-40" />
                            <h3 className="font-serif text-xl text-[var(--text-main)] mb-2">No Pieces Match Your Criteria</h3>
                            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
                                Please try adjusting your filters or search keywords to view available jewelry items.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                            <AnimatePresence>
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                                        className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card)] flex flex-col justify-between"
                                    >
                                        {/* Image Container */}
                                        <div
                                            className="h-72 bg-[var(--bg-elevated)] relative overflow-hidden cursor-pointer"
                                            onClick={() => openProductDetails(item)}
                                        >
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-[var(--bg-elevated)]">
                                                    <Gem className="h-16 w-16 text-[var(--text-secondary)] opacity-30" />
                                                </div>
                                            )}

                                            {/* Hover Quick View Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                                <span className="px-6 py-2.5 rounded-full text-xs font-sans font-bold tracking-widest uppercase text-black bg-white shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                    <Eye className="h-3.5 w-3.5" /> Quick View
                                                </span>
                                            </div>

                                            {/* Metal & Weight Badge */}
                                            {item.metal_type !== 'none' && (
                                                <div className="absolute top-3.5 left-3.5 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/25">
                                                    <span className="text-[10px] font-sans font-bold tracking-widest text-amber-300 uppercase">
                                                        {item.weight}g {item.metal_type}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Wishlist Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(item.id);
                                                }}
                                                className={`absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                                                    isInWishlist(item.id)
                                                        ? 'bg-red-500 text-white shadow-lg'
                                                        : 'bg-black/60 text-white hover:bg-black/80 border border-white/20'
                                                }`}
                                                aria-label={isInWishlist(item.id) ? "Remove from wishlist" : "Add to wishlist"}
                                            >
                                                <Heart className={`h-4 w-4 ${isInWishlist(item.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Product Details */}
                                        <div className="p-6 flex flex-col flex-grow justify-between">
                                            <div>
                                                <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-[var(--gold-primary)] mb-1.5 font-semibold">
                                                    {item.category}
                                                </p>
                                                <h3 className="font-serif text-lg font-bold text-[var(--text-main)] mb-3 group-hover:text-[var(--gold-primary)] transition-colors line-clamp-1">
                                                    {item.name}
                                                </h3>
                                            </div>

                                            <div className="pt-4 border-t border-[var(--border-color)] mt-2">
                                                <div className="flex items-baseline justify-between mb-4">
                                                    <div>
                                                        <span className="text-xl sm:text-2xl font-bold font-sans text-[var(--gold-primary)]">
                                                            {formatPrice(getDynamicPrice(item))}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--text-secondary)] block uppercase tracking-wider">
                                                            incl. live rate + taxes
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <button
                                                        onClick={() => openProductDetails(item)}
                                                        className="w-full py-2.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-secondary)] hover:text-[var(--text-main)] bg-[var(--bg-elevated)] text-xs font-semibold uppercase tracking-wider transition-colors"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleBuyNow(item)}
                                                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
                                                    >
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                        Buy Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <ProductDetailsModal
                    item={selectedProduct}
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                />

                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    items={checkoutItems}
                    totalAmount={checkoutTotal}
                    isCartCheckout={isCartCheckout}
                />
            </section>

            <Footer />
            <SeedButton />
        </div>
    );
}
