import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Star, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle2, 
  Eye, 
  Calculator, 
  X, 
  Gift, 
  RotateCcw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured, JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { PriceBreakdownExplainerModal } from '../components/PriceBreakdownExplainerModal';
import { PawnValuationModal } from '../components/PawnValuationModal';
import { StoreLocatorModal } from '../components/StoreLocatorModal';
import { CustomerReviewModal } from '../components/CustomerReviewModal';
import { FestiveOfferPopup } from '../components/FestiveOfferPopup';
import { localJewelryItems } from '../utils/localData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { rates, isLive, lastUpdated } = useRates();

  // State
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<JewelryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<{ name: string; price: number; weight: number; unit: string; image_url?: string }[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isPriceExplainerOpen, setIsPriceExplainerOpen] = useState(false);
  const [isPawnModalOpen, setIsPawnModalOpen] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFestiveOfferOpen, setIsFestiveOfferOpen] = useState(false);

  // Hero carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Catalog Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedPurity, setSelectedPurity] = useState<string>('All');
  const [selectedCollection, setSelectedCollection] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [budgetFilter, setBudgetFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Customer reviews list (seeded + local storage)
  const [reviews, setReviews] = useState([
    {
      author: 'Priya Sundaram, Chennai',
      quote: 'RCB Jewellery crafted my entire wedding trousseau. The temple nagas haram is breathtaking, and having BIS 916 laser hallmarking along with exact making charge receipts made me feel completely secure.',
      stars: 5,
      itemPurchased: '22K Temple Nagas Bridal Haram',
      date: 'Oct 2026'
    },
    {
      author: 'Karthik Subramanian, Coimbatore',
      quote: 'I used RCB pawn services when I needed working capital for my agro business. Within 15 minutes they verified the ornaments using XRF, gave 75% market value, and safely stored them in their vault. Excellent professionalism.',
      stars: 5,
      itemPurchased: 'Gold Loan Appraisal Service',
      date: 'Sep 2026'
    },
    {
      author: 'Meenakshi Raman, Madurai',
      quote: 'The solitaire diamond engagement ring came with full IGI laser certification. The team in the showroom explained the 4 Cs with clarity and their exchange policy is the most transparent in Tamil Nadu.',
      stars: 5,
      itemPurchased: 'Certified Solitaire Diamond Ring',
      date: 'Aug 2026'
    }
  ]);

  // Read URL search params on mount & changes
  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    const metal = searchParams.get('metal');
    const occasion = searchParams.get('occasion');
    const gender = searchParams.get('gender');
    const collection = searchParams.get('collection');
    const itemParam = searchParams.get('item');
    const checkoutParam = searchParams.get('checkout');

    if (q) setSearchQuery(q);
    if (cat) setSelectedCategory(cat);
    if (metal) setSelectedMetal(metal);
    if (occasion) setSelectedOccasion(occasion);
    if (gender) setSelectedGender(gender);
    if (collection) setSelectedCollection(collection);

    if (checkoutParam === 'true') {
      setIsCheckoutOpen(true);
    }

    if (itemParam && jewelryItems.length > 0) {
      const found = jewelryItems.find(i => i.id === itemParam);
      if (found) {
        setSelectedProduct(found);
        setIsDetailsOpen(true);
      }
    }
  }, [searchParams, jewelryItems]);

  // Load reviews from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rcb_user_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReviews(prev => [...parsed, ...prev]);
        }
      }
    } catch {}
  }, []);

  // Fetch Items
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
        // Merge with local items if some are missing
        const combined = [...data];
        for (const loc of localJewelryItems) {
          if (!combined.some(d => d.name === loc.name)) {
            combined.push(loc);
          }
        }
        setJewelryItems(combined);
      } else {
        setJewelryItems(localJewelryItems);
      }
    } catch {
      setJewelryItems(localJewelryItems);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBuyNow = (product: JewelryItem) => {
    setCheckoutItems([{
      name: product.name,
      price: product.price,
      weight: product.weight || 0,
      unit: 'g',
      image_url: product.image_url || undefined
    }]);
    setCheckoutTotal(product.price);
    setIsCheckoutOpen(true);
  };

  // Hero Campaign Slides
  const heroSlides = [
    {
      title: "Royal Heritage Bridal Collection",
      subtitle: "Handcrafted 22K 916 BIS Hallmarked Heirloom Jewellery for the South Indian Bride",
      image: "/images/hero_bride_aurelle.jpg",
      primaryCTA: "Explore Jewellery",
      primaryAction: () => {
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
      },
      secondaryCTA: "Discover Bridal Trousseau",
      secondaryAction: () => {
        document.getElementById('bridal')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      title: "Solitaire Brilliance & Fine Diamonds",
      subtitle: "Certified IGI & GIA Natural Diamonds Designed to Celebrate Every Milestone",
      image: "/images/luxury_necklace_hero.jpg",
      primaryCTA: "Shop Diamond Collection",
      primaryAction: () => {
        setSelectedMetal('Diamond');
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
      },
      secondaryCTA: "Transparent Gold Rates",
      secondaryAction: () => {
        setIsPriceExplainerOpen(true);
      }
    },
    {
      title: "Trusted Gold Pawn & Collateral Loans",
      subtitle: "RBI Regulated Up to 75% LTV • Lowest 0.75% Interest • High-Security Vault Custody",
      image: "/images/story_bangle_aurelle.jpg",
      primaryCTA: "Calculate Instant Loan",
      primaryAction: () => {
        setIsPawnModalOpen(true);
      },
      secondaryCTA: "Book Showroom Valuation",
      secondaryAction: () => {
        setIsStoreLocatorOpen(true);
      }
    }
  ];

  // Auto advance hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Festive Promotional Offer Popup Observer
  // Trigger after user scrolls past the Shop by Category section (once per browsing session)
  useEffect(() => {
    const handleManualOpen = () => {
      setIsFestiveOfferOpen(true);
    };
    window.addEventListener('rcb-open-offer-popup', handleManualOpen);

    // Check if dismissed or already shown in this session
    const isDismissed = sessionStorage.getItem('rcb_festive_offer_dismissed');
    const isShown = sessionStorage.getItem('rcb_festive_offer_shown');

    if (isDismissed === 'true' || isShown === 'true') {
      return () => {
        window.removeEventListener('rcb-open-offer-popup', handleManualOpen);
      };
    }

    const categorySection = document.getElementById('categories');
    if (!categorySection) {
      return () => {
        window.removeEventListener('rcb-open-offer-popup', handleManualOpen);
      };
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    // Observe when the user scrolls past the categories section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Trigger when categories section top has scrolled past the top of the viewport
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            sessionStorage.setItem('rcb_festive_offer_shown', 'true');
            timeoutId = setTimeout(() => {
              setIsFestiveOfferOpen(true);
            }, 350);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 0px 0px',
      }
    );

    observer.observe(categorySection);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('rcb-open-offer-popup', handleManualOpen);
    };
  }, []);

  const handleCloseFestiveOffer = () => {
    setIsFestiveOfferOpen(false);
    sessionStorage.setItem('rcb_festive_offer_dismissed', 'true');
    sessionStorage.setItem('rcb_festive_offer_shown', 'true');
  };

  const handleShopNowFestiveOffer = () => {
    setIsFestiveOfferOpen(false);
    sessionStorage.setItem('rcb_festive_offer_dismissed', 'true');
    sessionStorage.setItem('rcb_festive_offer_shown', 'true');
    setSelectedCategory('All');
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Categories definition
  const categoriesList = [
    { name: 'Rings', image: '/images/cat_gold.jpg', count: 'Solitaires & Bands' },
    { name: 'Earrings', image: '/images/trend_diamond_earrings.jpg', count: 'Jhumkas & Studs' },
    { name: 'Necklaces', image: '/images/luxury_necklace_hero.jpg', count: 'Chokers & Harams' },
    { name: 'Bangles', image: '/images/trend_rose_gold_kada.jpg', count: 'Kadas & Bracelets' },
    { name: 'Chains', image: '/images/cat_traditional.jpg', count: 'Daily & Temple Chains' },
    { name: 'Pendants', image: '/images/cat_diamond.jpg', count: 'Diamond & Gemstone' },
    { name: 'Jewellery Sets', image: '/images/cat_bridal.jpg', count: 'Bridal Sets' },
    { name: 'Gold Coins', image: '/images/cat_gold.jpg', count: '24K 999 Bullion' },
  ];

  // Filtered & Sorted Catalog logic
  const filteredProducts = useMemo(() => {
    return jewelryItems.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchMetal = item.metal_type?.toLowerCase().includes(q) || false;
        if (!matchName && !matchCat && !matchMetal) return false;
      }

      // Category
      if (selectedCategory !== 'All') {
        const catLow = selectedCategory.toLowerCase();
        const itemCatLow = item.category.toLowerCase();
        if (catLow === 'rings' && !itemCatLow.includes('ring')) return false;
        if (catLow === 'earrings' && !itemCatLow.includes('earring') && !itemCatLow.includes('jhumka')) return false;
        if (catLow === 'necklaces' && !itemCatLow.includes('necklace') && !itemCatLow.includes('haram') && !itemCatLow.includes('choker')) return false;
        if (catLow === 'bangles' && !itemCatLow.includes('bangle') && !itemCatLow.includes('kada') && !itemCatLow.includes('bracelet')) return false;
        if (catLow === 'chains' && !itemCatLow.includes('chain')) return false;
        if (catLow === 'pendants' && !itemCatLow.includes('pendant')) return false;
        if (catLow === 'jewellery sets' && !itemCatLow.includes('set') && !itemCatLow.includes('bridal') && !itemCatLow.includes('mangalsutra')) return false;
        if (catLow === 'gold coins' && !itemCatLow.includes('coin') && !itemCatLow.includes('bar')) return false;
      }

      // Metal
      if (selectedMetal !== 'All') {
        if (!item.metal_type || !item.metal_type.toLowerCase().includes(selectedMetal.toLowerCase())) {
          return false;
        }
      }

      // Purity
      if (selectedPurity !== 'All') {
        if (item.purity && !item.purity.includes(selectedPurity)) return false;
      }

      // Collection
      if (selectedCollection !== 'All') {
        if (selectedCollection === 'latest' && !item.is_new) return false;
        if (selectedCollection === 'bestseller' && !item.is_bestseller) return false;
        if (selectedCollection === 'bridal' && !item.category.toLowerCase().includes('bridal')) return false;
        if (selectedCollection === 'traditional' && !item.category.toLowerCase().includes('temple') && !item.category.toLowerCase().includes('traditional')) return false;
        if (selectedCollection === 'diamond' && String(item.metal_type || '').toLowerCase() !== 'diamond') return false;
      }

      // Gender
      if (selectedGender !== 'All') {
        if (item.gender && item.gender.toLowerCase() !== selectedGender.toLowerCase() && item.gender.toLowerCase() !== 'unisex') {
          return false;
        }
      }

      // Occasion
      if (selectedOccasion !== 'All') {
        if (item.occasion && !item.occasion.toLowerCase().includes(selectedOccasion.toLowerCase())) {
          return false;
        }
      }

      // Budget filter
      if (budgetFilter !== 'All') {
        if (budgetFilter === '<10k' && item.price >= 10000) return false;
        if (budgetFilter === '10k-25k' && (item.price < 10000 || item.price > 25000)) return false;
        if (budgetFilter === '25k-50k' && (item.price < 25000 || item.price > 50000)) return false;
        if (budgetFilter === '50k-1L' && (item.price < 50000 || item.price > 100000)) return false;
        if (budgetFilter === '>1L' && item.price <= 100000) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'newest') return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      return 0; // default featured
    });
  }, [
    jewelryItems,
    searchQuery,
    selectedCategory,
    selectedMetal,
    selectedPurity,
    selectedCollection,
    selectedGender,
    selectedOccasion,
    budgetFilter,
    sortBy
  ]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedMetal('All');
    setSelectedPurity('All');
    setSelectedCollection('All');
    setSelectedGender('All');
    setSelectedOccasion('All');
    setBudgetFilter('All');
    setSearchQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = 
    selectedCategory !== 'All' || 
    selectedMetal !== 'All' || 
    selectedPurity !== 'All' || 
    selectedCollection !== 'All' || 
    selectedGender !== 'All' || 
    selectedOccasion !== 'All' || 
    budgetFilter !== 'All' || 
    searchQuery.trim().length > 0;

  return (
    <div className="bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen selection:bg-[#702638] selection:text-white transition-colors duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#702638] text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* D. HERO BANNER CAROUSEL                                                   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#2D0D15] text-[#FAF5F0] min-h-[520px] sm:min-h-[600px] lg:min-h-[640px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={heroSlides[currentSlide].image}
              alt={heroSlides[currentSlide].title}
              className="w-full h-full object-cover object-center filter brightness-[1.08] contrast-[1.02]"
            />
            {/* Subtle soft vignette gradient to keep image fully visible while text remains readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1E050D]/60 via-[#1E050D]/20 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E050D]/40 via-transparent to-black/20 pointer-events-none"></div>
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/40 text-white text-xs font-sans tracking-[0.2em] uppercase font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>RCB Jewelry &amp; Pawn Shop</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.12] text-[#FAF5F0] tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              {heroSlides[currentSlide].title}
            </h1>

            <p className="text-sm sm:text-base font-sans text-[#FAF5F0] leading-relaxed font-light max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {heroSlides[currentSlide].subtitle}
            </p>

            {/* CTAs */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                onClick={heroSlides[currentSlide].primaryAction}
                className="px-8 py-3.5 rounded-full bg-white hover:bg-white/90 text-[#702638] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:scale-105 flex items-center gap-2 border border-white"
              >
                <span>{heroSlides[currentSlide].primaryCTA}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={heroSlides[currentSlide].secondaryAction}
                className="px-7 py-3.5 rounded-full bg-white hover:bg-white/90 text-[#702638] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:scale-105 border border-white"
              >
                {heroSlides[currentSlide].secondaryCTA}
              </button>
            </div>
          </div>
        </div>

        {/* Carousel controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* E. LIVE PRECIOUS-METAL RATE STRIP                                         */}
      {/* ========================================================================= */}
      <section 
        id="rates-strip"
        aria-label="Daily precious metal benchmark rates"
        className="bg-[#541C2A] dark:bg-[#1C060D] text-[#FAF5F0] border-y border-[#C69A8B]/30 py-3.5 px-4 shadow-md scroll-mt-28 sm:scroll-mt-32"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          {/* Rate Header & Status */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#C69A8B]/20 flex items-center justify-center text-[#C69A8B]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-[#FAF5F0] uppercase tracking-wider block text-[11px]">
                Today's Precious Metal Benchmark Rates
              </span>
              <span className="text-[10px] text-stone-300 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isLive ? 'Live Market' : 'Official Benchmark'}</span>
                <span>•</span>
                <span>Updated: {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-IN') : 'Today'}</span>
              </span>
            </div>
          </div>

          {/* Rate Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-mono">
            <div className="bg-[#3D141F] px-3 py-1.5 rounded-lg border border-[#C69A8B]/20">
              <span className="text-[10px] text-[#C69A8B] block font-sans uppercase">24K Gold (999)</span>
              <span className="font-bold text-sm text-[#FAF5F0]">₹{rates.gold.toLocaleString('en-IN')}/g</span>
            </div>

            <div className="bg-[#3D141F] px-3 py-1.5 rounded-lg border border-[#C69A8B]/30 ring-1 ring-[#C69A8B]/40">
              <span className="text-[10px] text-[#C69A8B] block font-sans uppercase font-bold">22K Gold (916 BIS)</span>
              <span className="font-bold text-sm text-amber-300">₹{rates.gold22k.toLocaleString('en-IN')}/g</span>
            </div>

            <div className="bg-[#3D141F] px-3 py-1.5 rounded-lg border border-[#C69A8B]/20">
              <span className="text-[10px] text-[#C69A8B] block font-sans uppercase">18K Gold</span>
              <span className="font-bold text-sm text-[#FAF5F0]">₹{Math.round(rates.gold * 0.75).toLocaleString('en-IN')}/g</span>
            </div>

            <div className="bg-[#3D141F] px-3 py-1.5 rounded-lg border border-[#C69A8B]/20">
              <span className="text-[10px] text-stone-300 block font-sans uppercase">999 Silver</span>
              <span className="font-bold text-sm text-stone-200">₹{rates.silver.toLocaleString('en-IN')}/g</span>
            </div>

            <div className="bg-[#3D141F] px-3 py-1.5 rounded-lg border border-[#C69A8B]/20 hidden xl:block">
              <span className="text-[10px] text-stone-300 block font-sans uppercase">950 Platinum</span>
              <span className="font-bold text-sm text-cyan-200">₹{rates.platinum.toLocaleString('en-IN')}/g</span>
            </div>
          </div>

          {/* Calculator Trigger Button */}
          <button
            onClick={() => setIsPriceExplainerOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#C69A8B]/20 hover:bg-[#C69A8B] text-[#FAF5F0] hover:text-[#34252A] px-3.5 py-1.5 rounded-full border border-[#C69A8B]/40 font-semibold text-[11px] uppercase tracking-wider transition-colors shrink-0"
            title="Open transparent jewellery pricing breakdown calculator"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Pricing Formula</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* F. SHOP BY CATEGORY                                                       */}
      {/* ========================================================================= */}
      <section id="categories" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28 sm:scroll-mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-2">
            EXPLORE THE CRAFT
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-light">
            Every hallmark creation embodies timeless Indian artistry and generational purity.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4"
        >
          {categoriesList.map((cat, idx) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                whileHover={{ y: -4 }}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  const catalogEl = document.getElementById('catalog');
                  if (catalogEl) {
                    catalogEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCategory(cat.name);
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`group cursor-pointer text-center bg-[var(--bg-card)] rounded-2xl p-3 border transition-all duration-300 shadow-sm hover:shadow-lg ${
                  isSelected
                    ? 'border-[#702638] dark:border-[#C69A8B] ring-2 ring-[#702638]/20 dark:ring-[#C69A8B]/30'
                    : 'border-[var(--border-color)] hover:border-[#C69A8B] dark:hover:border-[#C69A8B]'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden mb-3 border-2 border-[#C69A8B]/30 group-hover:scale-105 group-hover:border-[#702638] dark:group-hover:border-[#E8A598] transition-transform duration-300">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                </div>
                <h3 className={`font-serif text-xs font-semibold transition-colors truncate ${
                  isSelected ? 'text-[#702638] dark:text-[#E8A598]' : 'text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598]'
                }`}>
                  {cat.name}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
                  {cat.count}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Sentinel for IntersectionObserver to know when categories is scrolled past */}
      <div id="categories-exit-sentinel" className="w-full h-px pointer-events-none opacity-0" aria-hidden="true" />

      {/* ========================================================================= */}
      {/* G & H. FEATURED COLLECTIONS & DYNAMIC CATALOG                             */}
      {/* ========================================================================= */}
      <section id="catalog" className="py-16 bg-[var(--bg-elevated)] border-y border-[var(--border-color)] scroll-mt-28 sm:scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
                CURATED INVENTORY
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
                Featured Collections &amp; Catalogue
              </h2>
            </div>

            {/* Collection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-medium">
              {[
                { id: 'All', label: 'All Pieces' },
                { id: 'latest', label: 'Latest Arrivals' },
                { id: 'bestseller', label: 'Best Sellers' },
                { id: 'bridal', label: 'Bridal Heritage' },
                { id: 'diamond', label: 'Diamond Brilliance' },
                { id: 'traditional', label: 'Temple Gold' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCollection(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                    selectedCollection === tab.id
                      ? 'bg-[#702638] text-white shadow-sm'
                      : 'bg-white dark:bg-[#222] text-[var(--text-secondary)] hover:bg-[#702638]/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Multi-Filter Dock */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 border border-[var(--border-color)] shadow-sm mb-8 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)] border-[var(--border-color)]"
                >
                  <option value="All">All Categories</option>
                  <option value="Necklaces">Necklaces &amp; Harams</option>
                  <option value="Jewellery sets">Jewellery Sets</option>
                  <option value="Earrings">Earrings &amp; Jhumkas</option>
                  <option value="Rings">Rings &amp; Bands</option>
                  <option value="Bangles">Bangles &amp; Bracelets</option>
                  <option value="Chains">Chains</option>
                  <option value="Pendants">Pendants</option>
                  <option value="Gold coins">Gold Coins &amp; Bars</option>
                </select>
              </div>

              {/* Metal Filter */}
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Metal</label>
                <select
                  value={selectedMetal}
                  onChange={(e) => setSelectedMetal(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)] border-[var(--border-color)]"
                >
                  <option value="All">All Metals</option>
                  <option value="Gold">Gold</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>

              {/* Purity Filter */}
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Purity</label>
                <select
                  value={selectedPurity}
                  onChange={(e) => setSelectedPurity(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)] border-[var(--border-color)]"
                >
                  <option value="All">All Purities</option>
                  <option value="24K">24K (999)</option>
                  <option value="22K">22K (916 BIS)</option>
                  <option value="18K">18K (750)</option>
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Customer</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)] border-[var(--border-color)]"
                >
                  <option value="All">All Patrons</option>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>

              {/* Budget Filter */}
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Budget</label>
                <select
                  value={budgetFilter}
                  onChange={(e) => setBudgetFilter(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)] border-[var(--border-color)]"
                >
                  <option value="All">Any Budget</option>
                  <option value="<10k">Under ₹10,000</option>
                  <option value="10k-25k">₹10,000 – ₹25,000</option>
                  <option value="25k-50k">₹25,000 – ₹50,000</option>
                  <option value="50k-1L">₹50,000 – ₹1,00,000</option>
                  <option value=">1L">Above ₹1,00,000</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)] border-[var(--border-color)]"
                >
                  <option value="featured">Featured Picks</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">New Arrivals First</option>
                </select>
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-stone-500 text-[11px]">Active Filters:</span>
                  {selectedCategory !== 'All' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
                      Category: {selectedCategory}
                      <button onClick={() => setSelectedCategory('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedMetal !== 'All' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
                      Metal: {selectedMetal}
                      <button onClick={() => setSelectedMetal('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {budgetFilter !== 'All' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
                      Budget: {budgetFilter}
                      <button onClick={() => setBudgetFilter('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
                      Search: "{searchQuery}"
                      <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>

                <button
                  onClick={clearAllFilters}
                  className="text-stone-500 hover:text-[#702638] dark:hover:text-[#E8A598] text-[11px] underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-[var(--bg-card)] rounded-2xl h-96 animate-pulse border border-[var(--border-color)]"></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const inWishlist = isInWishlist(product.id);
                return (
                  <div
                    key={product.id}
                    className="group bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border-color)] hover:border-[#C69A8B] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Image & Badges */}
                    <div className="relative aspect-[4/3] bg-[var(--bg-elevated)] overflow-hidden">
                      <img
                        src={product.image_url || '/images/cat_gold.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {product.purity && (
                          <span className="bg-[#702638] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                            {product.purity} BIS 916
                          </span>
                        )}
                        {product.is_new && (
                          <span className="bg-[#C69A8B] text-[#34252A] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            New Arrival
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => {
                          toggleWishlist(product.id);
                          showNotification(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
                        }}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center text-[var(--text-secondary)] hover:scale-110 transition-transform shadow-sm"
                        aria-label="Toggle wishlist"
                      >
                        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {/* Quick View Overlay Button */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDetailsOpen(true);
                          }}
                          className="px-4 py-1.5 rounded-full bg-white/95 text-stone-900 text-[11px] font-semibold uppercase tracking-wider hover:bg-white shadow-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Quick View</span>
                        </button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1">
                          <span>{product.category}</span>
                          {product.weight && <span>{product.weight}g net</span>}
                        </div>

                        <h3 className="font-serif text-sm font-semibold text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors line-clamp-1">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 font-light leading-relaxed">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Pricing & Actions */}
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <span className="text-base font-bold text-[#702638] dark:text-[#E8A598]">
                              {formatCurrencyINR(product.price)}
                            </span>
                            <span className="text-[10px] text-stone-400 block">incl. 3% GST</span>
                          </div>
                          
                          <button
                            onClick={() => setIsPriceExplainerOpen(true)}
                            className="text-[10px] text-[#C69A8B] hover:underline flex items-center gap-0.5"
                            title="View benchmark pricing breakdown"
                          >
                            <Info className="w-3 h-3" />
                            <span>Breakdown</span>
                          </button>
                        </div>

                        {/* Dual Add to Bag & Buy Now buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              addToCart(product.id);
                              showNotification(`Added ${product.name} to bag`);
                            }}
                            className="py-2 px-2 rounded-lg border border-[#702638] dark:border-[#E8A598] text-[#702638] dark:text-[#E8A598] hover:bg-[#702638] hover:text-white dark:hover:bg-[#E8A598] dark:hover:text-black text-[11px] font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-1"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add Bag</span>
                          </button>

                          <button
                            onClick={() => handleBuyNow(product)}
                            className="py-2 px-2 rounded-lg bg-[#702638] hover:bg-[#541C2A] text-white text-[11px] font-semibold tracking-wider uppercase transition-colors shadow-sm flex items-center justify-center gap-1"
                          >
                            <span>Buy Now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] rounded-2xl p-12 text-center border border-[var(--border-color)] max-w-lg mx-auto">
              <Sparkles className="w-8 h-8 text-[#C69A8B] mx-auto mb-3" />
              <h3 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
                No matching jewellery found
              </h3>
              <p className="text-xs text-stone-500 mt-2 mb-6">
                We couldn't find items matching your current filters. Try relaxing your filters or searching for gold, diamond, or necklaces.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 rounded-full bg-[#702638] text-white text-xs font-semibold uppercase tracking-wider shadow-md"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* I. BRIDAL AND WEDDING COLLECTIONS                                         */}
      {/* ========================================================================= */}
      <section id="bridal" className="relative bg-[#34111B] text-[#FAF5F0] overflow-hidden py-24 sm:py-28 my-6 scroll-mt-28 sm:scroll-mt-32">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/special_offer_velvet.jpg"
            alt="South Indian Bridal Jewellery - Ruby, Pearl and 22K Hallmarked Gold"
            className="w-full h-full object-cover object-right sm:object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#21070F] via-[#21070F]/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl space-y-4">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#C69A8B] uppercase block">
              THE AUSPICIOUS MUHURTHAM
            </span>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#FAF5F0] font-normal leading-tight">
              South Indian Bridal Trousseau
            </h2>

            <p className="text-sm font-sans text-[#FAF5F0]/85 tracking-wide leading-relaxed font-light">
              From majestic Temple Nagas Kasu Harams to exquisite antique mango malas and handcrafted wedding bangles, 
              RCB Jewellery curates complete bridal trousseaus tailored to your heritage.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => {
                  setSelectedCategory('Jewellery sets');
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-7 py-3 rounded-full bg-[#C69A8B] hover:bg-[#D4ACA0] text-[#34252A] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 shadow-md flex items-center gap-1.5"
              >
                <span>Browse Bridal Sets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsStoreLocatorOpen(true)}
                className="px-6 py-3 rounded-full border border-[#C69A8B] text-[#FAF5F0] hover:bg-white/10 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300"
              >
                Book Bridal Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* J. SHOP BY GENDER / PATRON                                                */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-2">
            CURATED FOR EVERYONE
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
            Shop by Customer
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Women */}
          <div 
            onClick={() => {
              setSelectedGender('Women');
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer shadow-md hover:shadow-xl transition-all"
          >
            <img
              src="/images/cat_bridal.jpg"
              alt="Women's Jewellery"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[10px] font-semibold tracking-widest text-[#C69A8B] uppercase">Women's Collection</span>
              <h3 className="font-serif text-2xl font-normal mt-1">Divine Adornments</h3>
              <p className="text-xs text-white/80 mt-1 mb-3">Intricate necklaces, solitaire rings, jhumkas, and temple sets.</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C69A8B] group-hover:translate-x-1 transition-transform">
                <span>Explore Women's Range</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Men */}
          <div 
            onClick={() => {
              setSelectedGender('Men');
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer shadow-md hover:shadow-xl transition-all"
          >
            <img
              src="/images/trend_rose_gold_kada.jpg"
              alt="Men's Jewellery"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[10px] font-semibold tracking-widest text-[#C69A8B] uppercase">Men's Collection</span>
              <h3 className="font-serif text-2xl font-normal mt-1">Subtle Power</h3>
              <p className="text-xs text-white/80 mt-1 mb-3">Solid gold kadas, rudraksha chains, signet rings, and bracelets.</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C69A8B] group-hover:translate-x-1 transition-transform">
                <span>Explore Men's Range</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Kids */}
          <div 
            onClick={() => {
              setSelectedGender('Kids');
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer shadow-md hover:shadow-xl transition-all"
          >
            <img
              src="/images/cat_gold.jpg"
              alt="Kids' Jewellery"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[10px] font-semibold tracking-widest text-[#C69A8B] uppercase">Kids' Collection</span>
              <h3 className="font-serif text-2xl font-normal mt-1">Auspicious Blessings</h3>
              <p className="text-xs text-white/80 mt-1 mb-3">Black bead nazariya bangles, lightweight gold studs, and baby anklets.</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C69A8B] group-hover:translate-x-1 transition-transform">
                <span>Explore Kids' Range</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* K. PERSONALISED RECOMMENDATIONS AND GIFTING BY BUDGET                     */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[var(--bg-elevated)] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-2">
              THOUGHTFUL MEMORIES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
              Gifts by Budget &amp; Occasion
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Select your gifting price range to view verified in-stock jewellery pieces.
            </p>
          </div>

          {/* Budget Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {[
              { id: '<10k', label: 'Under ₹10,000' },
              { id: '10k-25k', label: '₹10,000 – ₹25,000' },
              { id: '25k-50k', label: '₹25,000 – ₹50,000' },
              { id: '50k-1L', label: '₹50,000 – ₹1,00,000' },
              { id: '>1L', label: 'Above ₹1,00,000' },
            ].map(b => (
              <button
                key={b.id}
                onClick={() => {
                  setBudgetFilter(b.id);
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-sm ${
                  budgetFilter === b.id
                    ? 'bg-[#702638] text-white shadow-md scale-105'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[#C69A8B] border border-[var(--border-color)]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Occasion Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Anniversary Gifts', desc: 'Solitaire rings & diamond pendants', occ: 'Anniversary gifts' },
              { name: 'Birthday Keepsakes', desc: 'Lightweight gold earrings & bracelets', occ: 'Birthday gifts' },
              { name: 'Festive & Pooja', desc: '24K gold coins & temple chains', occ: 'Festive wear' },
              { name: 'Wedding Favours', desc: 'Silver articles & hallmarked bullion', occ: 'Wedding and bridal' },
            ].map((card, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedOccasion(card.occ);
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] hover:border-[#C69A8B] cursor-pointer transition-colors shadow-sm"
              >
                <Gift className="w-5 h-5 text-[#702638] dark:text-[#E8A598] mb-2" />
                <h4 className="font-serif text-sm font-semibold text-[var(--text-main)]">{card.name}</h4>
                <p className="text-[11px] text-stone-500 mt-1">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* L. JEWELLERY SERVICES AND TRUST                                           */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-2">
            RCB PROMISE
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
            Authenticity, Security &amp; Care
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 flex items-center justify-center text-[#702638] dark:text-[#E8A598] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[var(--text-main)]">BIS 916 Laser Hallmarking</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Every gold jewel is laser engraved with its unique 6-digit HUID code, verifiable on the BIS Care portal.
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 flex items-center justify-center text-[#702638] dark:text-[#E8A598] shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[var(--text-main)]">Certified Natural Diamonds</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                All diamonds undergo stringent laboratory testing with individual IGI / GIA authentication cards.
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 flex items-center justify-center text-[#702638] dark:text-[#E8A598] shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-[var(--text-main)]">Lifetime Gold Buyback</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                100% gold value on exchange and transparent buyback calculated against prevailing daily benchmark rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* M. PAWN SERVICES & COLLATERAL VALUATION                                   */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#541C2A] text-[#FAF5F0] border-y border-[#C69A8B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#C69A8B] uppercase block">
                LICENSED FINANCIAL SERVICES
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#FAF5F0] font-normal">
                Gold Pawn &amp; Collateral Loans
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                Unlock instant financial liquidity against your gold jewellery without selling your precious family heirlooms. 
                Our government-licensed pawn facility provides maximum regulatory loan-to-value (up to 75%), lowest interest rates 
                from 0.75% per month, and tamper-proof high-security vault custody.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-[#3D141F] p-3 rounded-xl border border-[#C69A8B]/30">
                  <span className="block font-bold text-amber-300 text-sm">Up to 75% LTV</span>
                  <span className="text-[11px] text-stone-300">RBI Regulatory Max</span>
                </div>
                <div className="bg-[#3D141F] p-3 rounded-xl border border-[#C69A8B]/30">
                  <span className="block font-bold text-emerald-300 text-sm">From 0.75%/mo</span>
                  <span className="text-[11px] text-stone-300">Transparent Interest</span>
                </div>
                <div className="bg-[#3D141F] p-3 rounded-xl border border-[#C69A8B]/30">
                  <span className="block font-bold text-[#FAF5F0] text-sm">15 Minutes</span>
                  <span className="text-[11px] text-stone-300">Instant Disbursement</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsPawnModalOpen(true)}
                  className="px-6 py-3 rounded-full bg-[#C69A8B] hover:bg-[#D4ACA0] text-[#34252A] text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calculate Loan &amp; Book Appraisal</span>
                </button>
              </div>
            </div>

            {/* Quick Preview Card */}
            <div className="lg:col-span-5 bg-[#3D141F] rounded-2xl p-6 border border-[#C69A8B]/40 shadow-xl space-y-4 text-xs">
              <h3 className="font-serif text-lg text-amber-300 font-semibold border-b border-[#C69A8B]/20 pb-2">
                What to Bring for In-Store Assessment
              </h3>

              <ul className="space-y-2 text-stone-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Valid Photo KYC:</strong> Aadhaar Card, PAN Card, or Voter ID.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Physical Gold Ornaments:</strong> For precision non-destructive XRF touchstone analysis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Bank Account Details:</strong> For instant direct NEFT / IMPS disbursement.</span>
                </li>
              </ul>

              <div className="p-3 rounded-xl bg-black/20 text-[11px] text-stone-300 leading-normal border border-white/5">
                * Note: Final valuation and sanctioned loan amount are determined in-store after purity verification. No credit score or CIBIL check required.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* N. STORE LOCATOR & APPOINTMENTS                                           */}
      {/* ========================================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-2">
            EXPERIENCE IN PERSON
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
            Visit Our Showrooms
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2 font-light">
            Private VIP lounges, certified diamond viewing benches, and licensed pawn appraisal counters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Chennai */}
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598]">Flagship Showroom</span>
            <h3 className="font-serif text-lg font-semibold text-[var(--text-main)]">Chennai — T. Nagar</h3>
            <p className="text-xs text-[var(--text-secondary)]">42 Usman Road, T. Nagar, Chennai - 600017</p>
            <div className="text-[11px] text-stone-500 space-y-1">
              <p>Hours: Mon–Sun: 10:00 AM – 8:30 PM</p>
              <p>Phone: +91 44 2434 7888</p>
            </div>
            <button
              onClick={() => setIsStoreLocatorOpen(true)}
              className="w-full py-2 rounded-lg bg-[#702638]/10 hover:bg-[#702638] text-[#702638] hover:text-white dark:text-[#E8A598] dark:hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Book In-Store Visit
            </button>
          </div>

          {/* Coimbatore */}
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598]">Heritage Branch</span>
            <h3 className="font-serif text-lg font-semibold text-[var(--text-main)]">Coimbatore — Cross Cut Rd</h3>
            <p className="text-xs text-[var(--text-secondary)]">118 Cross Cut Road, Gandhipuram, Coimbatore - 641012</p>
            <div className="text-[11px] text-stone-500 space-y-1">
              <p>Hours: Mon–Sun: 10:00 AM – 8:30 PM</p>
              <p>Phone: +91 422 223 4567</p>
            </div>
            <button
              onClick={() => setIsStoreLocatorOpen(true)}
              className="w-full py-2 rounded-lg bg-[#702638]/10 hover:bg-[#702638] text-[#702638] hover:text-white dark:text-[#E8A598] dark:hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Book In-Store Visit
            </button>
          </div>

          {/* Madurai */}
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598]">Temple City Branch</span>
            <h3 className="font-serif text-lg font-semibold text-[var(--text-main)]">Madurai — West Masi St</h3>
            <p className="text-xs text-[var(--text-secondary)]">75 West Masi Street, Near Temple, Madurai - 625001</p>
            <div className="text-[11px] text-stone-500 space-y-1">
              <p>Hours: Mon–Sun: 10:00 AM – 8:30 PM</p>
              <p>Phone: +91 452 234 8999</p>
            </div>
            <button
              onClick={() => setIsStoreLocatorOpen(true)}
              className="w-full py-2 rounded-lg bg-[#702638]/10 hover:bg-[#702638] text-[#702638] hover:text-white dark:text-[#E8A598] dark:hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Book In-Store Visit
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* O. CUSTOMER REVIEWS & SOCIAL PROOF                                        */}
      {/* ========================================================================= */}
      <section id="reviews" className="py-20 bg-[var(--bg-main)] border-t border-[var(--border-color)] scroll-mt-28 sm:scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
                PATRON TESTIMONIALS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
                Trusted by Thousands
              </h2>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-5 py-2.5 rounded-full border border-[#702638] dark:border-[#E8A598] text-[#702638] dark:text-[#E8A598] hover:bg-[#702638] hover:text-white dark:hover:bg-[#E8A598] dark:hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
            >
              Write a Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((item, index) => (
              <div 
                key={index} 
                className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(item.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] italic leading-relaxed">
                    "{item.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                  <p className="font-semibold text-[var(--text-main)]">{item.author}</p>
                  {item.itemPurchased && (
                    <p className="text-[10px] text-[#C69A8B] mt-0.5">Verified: {item.itemPurchased}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* P. NEWSLETTER AND FOOTER                                                  */}
      {/* ========================================================================= */}
      <Footer />

      {/* ========================================================================= */}
      {/* MODALS & WORKFLOW COMPONENTS                                              */}
      {/* ========================================================================= */}
      
      {/* Product Details Modal (Workflow 3) */}
      {selectedProduct && (
        <ProductDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          product={selectedProduct}
          onAddToCart={() => {
            addToCart(selectedProduct.id);
            showNotification(`Added ${selectedProduct.name} to bag`);
          }}
          onBuyNow={() => {
            setIsDetailsOpen(false);
            handleBuyNow(selectedProduct);
          }}
        />
      )}

      {/* Direct Buy Now Checkout Modal (Workflow 6) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        totalAmount={checkoutTotal}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          showNotification('Order placed successfully! Concierge will contact you shortly.');
        }}
      />

      {/* Pricing Breakdown Explainer Modal (Workflow 8) */}
      <PriceBreakdownExplainerModal
        isOpen={isPriceExplainerOpen}
        onClose={() => setIsPriceExplainerOpen(false)}
      />

      {/* Pawn Valuation & Appointment Modal (Workflow 9) */}
      <PawnValuationModal
        isOpen={isPawnModalOpen}
        onClose={() => setIsPawnModalOpen(false)}
      />

      {/* Store Locator & In-Store Appointment Modal (Workflow 10) */}
      <StoreLocatorModal
        isOpen={isStoreLocatorOpen}
        onClose={() => setIsStoreLocatorOpen(false)}
      />

      {/* Customer Review Submission Modal (Workflow O) */}
      <CustomerReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={(newReview) => {
          setReviews(prev => [{
            author: newReview.author,
            quote: newReview.quote,
            stars: newReview.stars,
            itemPurchased: newReview.itemPurchased || 'Certified Jewellery',
            date: newReview.date
          }, ...prev]);
          showNotification('Review submitted successfully! Thank you.');
        }}
      />

      {/* Festive Promotional Offer Popup (Workflow Festive Extravaganza) */}
      <FestiveOfferPopup
        isOpen={isFestiveOfferOpen}
        onClose={handleCloseFestiveOffer}
        onShopNow={handleShopNowFestiveOffer}
      />

    </div>
  );
}
