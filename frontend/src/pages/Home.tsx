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
  Info,
  Video,
  MapPin,
  Truck,
  RefreshCw,
  Instagram,
  Compass,
  Phone,
  Calendar,
  Gem,
  Clock,
  ArrowUpRight,
  MoveUpRight
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  SignatureLuxuryCard, 
  EditorialFloatingCard, 
  BentoFeatureCard, 
  BridalStatementCard, 
  CompactDiscoveryCard 
} from '../components/cards';
import { supabase, isSupabaseConfigured, JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { PriceBreakdownExplainerModal } from '../components/PriceBreakdownExplainerModal';
import { PawnValuationModal } from '../components/PawnValuationModal';
import { StoreLocatorModal } from '../components/StoreLocatorModal';
import { CustomerReviewModal } from '../components/CustomerReviewModal';
import { FestiveOfferPopup } from '../components/FestiveOfferPopup';
import ReviewCard from '../components/ReviewCard';
import { localJewelryItems } from '../utils/localData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRates } from '../context/RateContext';
import { formatCurrencyINR } from '../utils/formatters';

export default function Home() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { rates, isLive, lastUpdated } = useRates();

  // Animation variants for Section N: Assistance & Concierge Service Cards
  const servicesContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.18,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const serviceCard1Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.75,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const serviceCard2Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 32, x: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.75,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const serviceCard3Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.75,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

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
      date: 'Oct 2026',
      title: 'Beautiful craftsmanship',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
    },
    {
      author: 'Karthik Subramanian, Coimbatore',
      quote: 'I used RCB pawn services when I needed working capital for my agro business. Within 15 minutes they verified the ornaments using XRF, gave 75% market value, and safely stored them in their vault. Excellent professionalism.',
      stars: 5,
      itemPurchased: 'Gold Loan Appraisal Service',
      date: 'Sep 2026',
      title: 'Swift & transparent valuation',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces'
    },
    {
      author: 'Meenakshi Raman, Madurai',
      quote: 'The solitaire diamond engagement ring came with full IGI laser certification. The team in the showroom explained the 4 Cs with clarity and their exchange policy is the most transparent in Tamil Nadu.',
      stars: 5,
      itemPurchased: 'Certified Solitaire Diamond Ring',
      date: 'Aug 2026',
      title: 'Flawless solitaire brilliance',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces'
    },
    {
      author: 'Ananya Deshmukh, Bengaluru',
      quote: 'Custom-designed antique 22K Lakshmi filigree kadas for my daughter’s engagement. The craftsmanship is magnificent, exact net gold weight certified, and delivered right on schedule.',
      stars: 5,
      itemPurchased: '22K Antique Filigree Kadas',
      date: 'Jul 2026',
      title: 'Heirloom filigree artistry',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces'
    },
    {
      author: 'Dr. Venkatesh Iyer, Tiruchi',
      quote: 'Needed immediate liquidity for hospital machinery and pledged sovereign gold coins. Valued at live market rate in 10 minutes with lowest monthly interest. Truly authentic and ethical.',
      stars: 5,
      itemPurchased: 'Gold Sovereign Collateral Loan',
      date: 'Jun 2026',
      title: 'Instant sovereign collateral',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces'
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
    } catch (err) {
      void err;
    }
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

  const handleQuickView = (product: JewelryItem) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleAddToCart = (product: JewelryItem) => {
    addToCart(product.id);
    showNotification(`Added ${product.name} to shopping bag`);
  };

  const [selectedCollectionTab, setSelectedCollectionTab] = useState<'yuva' | 'veda' | 'ratna' | 'apurva'>('yuva');
  const [selectedMaterialTab, setSelectedMaterialTab] = useState<'Diamond' | 'Gold' | 'Gemstone' | 'Platinum'>('Diamond');
  const [isCareGuideOpen, setIsCareGuideOpen] = useState(false);

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

  // ConditionGrid category projects (Heritage & Artistry Showcase)
  const categoryProjects = [
    {
      id: '01',
      title: 'Jewellery Sets',
      des: 'Handcrafted bridal & royal heritage chokers in 22K 916 BIS gold',
      img: '/images/cat_bridal.jpg',
      categoryKey: 'Jewellery sets',
    },
    {
      id: '02',
      title: 'Diamond Pendants',
      des: 'Brilliant solitaires & certified natural diamonds for everyday luxury',
      img: '/images/cat_diamond.jpg',
      categoryKey: 'Pendants',
    },
    {
      id: '03',
      title: 'Rings & Solitaires',
      des: 'Timeless love bands, eternity rings, and hallmarked cocktail solitaires',
      img: '/images/cat_gold.jpg',
      categoryKey: 'Rings',
    },
    {
      id: '04',
      title: 'Earrings & Jhumkas',
      des: 'Intricate temple drops, antique jhumkas, and chandelier diamond studs',
      img: '/images/trend_diamond_earrings.jpg',
      categoryKey: 'Earrings',
    },
  ];

  // Categories definition (Phase 5 Section 4 - Shop by Category)
  const categoriesList = [
    { name: 'Jewellery Sets', image: '/images/cat_bridal.jpg', count: 'Bridal & Royal Chokers' },
    { name: 'Pendants', image: '/images/cat_diamond.jpg', count: 'Solitaire & Gemstone' },
    { name: 'Rings', image: '/images/cat_gold.jpg', count: 'Solitaires & Bands' },
    { name: 'Earrings', image: '/images/trend_diamond_earrings.jpg', count: 'Jhumkas, Drops & Studs' },
    { name: 'Bangles', image: '/images/trend_rose_gold_kada.jpg', count: 'Kadas & Designer Bangles' },
    { name: 'Mangalsutra', image: '/images/luxury_necklace_hero.jpg', count: '22K Sacred Black Beads' },
    { name: 'Chains', image: '/images/cat_traditional.jpg', count: 'Daily & Temple Chains' },
    { name: 'Gold Coins', image: '/images/cat_gold.jpg', count: '24K 999 Bullion & Bars' },
  ];

  // Diamond showcase products (Phase 5 Section 5)
  const diamondShowcaseItems = useMemo(() => {
    const matched = jewelryItems.filter(item => 
      item.metal_type?.toLowerCase() === 'diamond' || 
      item.name.toLowerCase().includes('diamond') || 
      item.name.toLowerCase().includes('solitaire')
    );
    return matched.length >= 4 ? matched.slice(0, 4) : jewelryItems.slice(0, 4);
  }, [jewelryItems]);

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
        if (catLow === 'jewellery sets' && !itemCatLow.includes('set') && !itemCatLow.includes('bridal') && !itemCatLow.includes('choker')) return false;
        if (catLow === 'mangalsutra' && !itemCatLow.includes('mangalsutra') && !item.name.toLowerCase().includes('mangalsutra') && !itemCatLow.includes('necklace')) return false;
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
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-3.5">
              <button
                onClick={heroSlides[currentSlide].primaryAction}
                className="px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full bg-white hover:bg-white/90 text-[#702638] text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-300 shadow-md hover:scale-105 flex items-center gap-1.5 border border-white"
              >
                <span>{heroSlides[currentSlide].primaryCTA}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={heroSlides[currentSlide].secondaryAction}
                className="px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full bg-white hover:bg-white/90 text-[#702638] text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-300 shadow-md hover:scale-105 border border-white"
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
      {/* 4. SHOP BY CATEGORY (CONDITION GRID ASYMMETRIC SHOWCASE)                  */}
      {/* ========================================================================= */}
      <section id="categories" className="py-10 sm:py-14 max-w-5xl mx-auto px-4 sm:px-6 scroll-mt-28 sm:scroll-mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto mb-8"
        >
          <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1.5">
            HERITAGE &amp; ARTISTRY
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
            SHOP BY CATEGORY
          </h2>
          <div className="w-10 h-0.5 bg-[#C69A8B] mx-auto mt-2.5 mb-2" />
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            Explore our diverse selections. Find your style.
          </p>
        </motion.div>

        {/* ConditionGrid Asymmetric Category Showcase - Compact & Refined */}
        <div className="grid grid-cols-12 gap-3 sm:gap-3.5 overflow-hidden">
          {categoryProjects.map((project, index) => {
            let colSpanClass = 'sm:col-span-6 col-span-12 ';
            if (index === 0) {
              colSpanClass = ' sm:col-span-5 col-span-12 ';
            } else if (index === 1) {
              colSpanClass = 'sm:col-span-7 col-span-12 ';
            } else if (index === categoryProjects.length - 2) {
              colSpanClass = 'sm:col-span-7 col-span-12 ';
            } else if (index === categoryProjects.length - 1) {
              colSpanClass = 'sm:col-span-5 col-span-12 ';
            }
            return (
              <motion.article
                key={project.id ?? project.title}
                initial={{ y: 35, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ ease: 'easeOut', duration: 0.45 }}
                viewport={{ once: false }}
                onClick={() => {
                  setSelectedCategory(project.categoryKey);
                  const catalogEl = document.getElementById('catalog');
                  if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`relative group cursor-pointer overflow-hidden rounded-xl ${colSpanClass}`}
              >
                <div className="w-auto h-[180px] sm:h-[220px] lg:h-[260px]">
                  <img
                    src={project.img}
                    alt={project.title}
                    className="h-full w-full object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent rounded-xl pointer-events-none" />
                </div>
                <div className="absolute bottom-0 text-foreground w-full p-3 sm:p-3.5 flex justify-between items-center pointer-events-none">
                  <h3 className="text-xs sm:text-sm bg-black/85 backdrop-blur-md text-white rounded-lg py-1.5 px-3 shadow-md border border-white/10 font-sans font-medium">
                    {project.title}
                  </h3>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 text-white grid place-content-center rounded-full bg-black/85 backdrop-blur-md border border-white/10 shadow-md group-hover:bg-[#702638] group-hover:scale-110 transition-all duration-300">
                    <MoveUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Sentinel for IntersectionObserver to trigger festive popup */}
      <div id="categories-exit-sentinel" className="w-full h-px pointer-events-none opacity-0" aria-hidden="true" />

      {/* ========================================================================= */}
      {/* 5. SIGNATURE DIAMOND JEWELLERY (EDITORIAL BENTO SHOWCASE)                 */}
      {/* ========================================================================= */}
      <section id="diamonds" className="py-20 sm:py-24 bg-[#FAF7F2] dark:bg-[#1A1215] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
          >
            <div>
              <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
                SOLITAIRES &amp; BRILLIANCE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
                DIAMOND JEWELLERY
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-light">
                Shine with pride. Discover brilliance in every detail.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedMetal('Diamond');
                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-[#702638] dark:text-[#E8A598] hover:text-[#34252A] dark:hover:text-white uppercase transition-colors self-start md:self-auto group"
            >
              <span>Explore All Diamonds</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          {/* Bento Grid: 1 large feature tile + 4 editorial product cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Large Feature Bento Card (5 cols on lg) */}
            <div className="lg:col-span-5 flex">
              <BentoFeatureCard
                eyebrow="IGI &amp; GIA Certified Natural Diamonds"
                title="The Solitaire Symphony"
                subtitle="Solitaires &amp; Fine High Jewellery"
                description="Handcrafted solitaire necklaces, rings, and drops with exceptional cut, clarity, and brilliance."
                videoUrl="/images/Diamond_jewellery_advertisement_…_20261015172217.mp4"
                videoPosition="object-center"
                imageUrl="/images/luxury_necklace_hero.jpg"
                ctaText="Shop Diamond Collection"
                onCtaClick={() => {
                  setSelectedMetal('Diamond');
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full h-full min-h-[440px]"
              />
            </div>

            {/* 4 Smaller Editorial Floating Product Cards (7 cols on lg in 2x2 grid) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {diamondShowcaseItems.map((item, idx) => (
                <EditorialFloatingCard
                  key={item.id}
                  product={item}
                  onQuickView={handleQuickView}
                  delay={idx * 0.08}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FEATURED COLLECTIONS (HORIZONTALLY NAVIGABLE WITH CAMPAIGN SPOTLIGHT)  */}
      {/* ========================================================================= */}
      <section id="collections" className="py-20 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-28 sm:scroll-mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
            SIGNATURE CURATIONS
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
            COLLECTIONS
          </h2>
          <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            Find your style. Explore our diverse collections.
          </p>
        </motion.div>

        {/* Collection Selector Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'yuva', label: 'Yuva — Modern Everyday', subtitle: 'Lightweight chic 18K jewellery' },
            { id: 'veda', label: 'Veda — Antique Heritage', subtitle: 'Temple Nagas & Kasu Harams' },
            { id: 'ratna', label: 'Ratna — Royal Gemstones', subtitle: 'Rubies, Emeralds & Navaratna' },
            { id: 'apurva', label: 'Apurva — Polki & Kundan', subtitle: 'Royal Mughal uncut diamond craft' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCollectionTab(tab.id as any)}
              className={`px-4 sm:px-6 py-2.5 rounded-none text-xs font-semibold tracking-wider uppercase transition-all duration-300 border ${
                selectedCollectionTab === tab.id
                  ? 'bg-[#702638] text-white border-[#702638] shadow-sm'
                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[#702638] dark:hover:border-[#E8A598]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Collection Showcase Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[var(--bg-elevated)] p-6 sm:p-10 border border-[var(--border-color)]">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#702638] dark:text-[#E8A598] uppercase block">
              {selectedCollectionTab === 'yuva' && 'Contemporary Elegance'}
              {selectedCollectionTab === 'veda' && 'Heirloom Temple Goldsmithing'}
              {selectedCollectionTab === 'ratna' && 'Vibrant Precious Stones'}
              {selectedCollectionTab === 'apurva' && 'Traditional Indian Splendour'}
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal">
              {selectedCollectionTab === 'yuva' && 'Yuva Contemporary Collection'}
              {selectedCollectionTab === 'veda' && 'Veda Heritage Temple Jewels'}
              {selectedCollectionTab === 'ratna' && 'Ratna Precious Gemstone Line'}
              {selectedCollectionTab === 'apurva' && 'Apurva Uncut Polki & Kundan'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              {selectedCollectionTab === 'yuva' && 'Designed for modern lifestyles. Minimalist chains, stacking rings, and geometric diamond studs crafted with 18K gold.'}
              {selectedCollectionTab === 'veda' && 'Cast in auspicious 22K 916 BIS hallmarked gold, each piece pays homage to ancient Dravidian temple architecture and divine motifs.'}
              {selectedCollectionTab === 'ratna' && 'Hand-selected Burmese rubies, Colombian emeralds, and South Sea pearls seamlessly set in royal heritage ornaments.'}
              {selectedCollectionTab === 'apurva' && 'Centuries-old jadau artistry where uncut raw polki diamonds meet pure 24K gold foil setting and vibrant meenakari enamel.'}
            </p>
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedCategory(selectedCollectionTab === 'yuva' ? 'Rings' : 'Jewellery sets');
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-[#34252A] dark:bg-[#FAF5F0] hover:bg-[#702638] text-white dark:text-[#34252A] text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-900 group">
              <img
                src={
                  selectedCollectionTab === 'yuva' ? '/images/cat_diamond.jpg' :
                  selectedCollectionTab === 'veda' ? '/images/cat_traditional.jpg' :
                  selectedCollectionTab === 'ratna' ? '/images/trend_diamond_earrings.jpg' :
                  '/images/special_offer_velvet.jpg'
                }
                alt="Campaign Highlight"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase tracking-wider text-amber-200">Editorial Feature</span>
                <p className="font-serif text-sm font-medium mt-0.5">Signature Artisan Piece</p>
              </div>
            </div>

            <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-900 group">
              <img
                src={
                  selectedCollectionTab === 'yuva' ? '/images/trend_rose_gold_kada.jpg' :
                  selectedCollectionTab === 'veda' ? '/images/cat_bridal.jpg' :
                  selectedCollectionTab === 'ratna' ? '/images/cat_gold.jpg' :
                  '/images/luxury_necklace_hero.jpg'
                }
                alt="Craft Spotlight"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase tracking-wider text-amber-200">Limited Edition</span>
                <p className="font-serif text-sm font-medium mt-0.5">Showroom Trousseau Pick</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. EXPLORE JEWELLERY BY MATERIAL                                          */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#FAF7F2] dark:bg-[#150E12] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
              PRECIOUS METALS &amp; GEMS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
              EXPLORE JEWELLERY
            </h2>
            <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Discover exquisite pieces for every style.
            </p>
          </motion.div>

          {/* 4 Refined Material Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Diamond Jewellery',
                purity: 'IGI / GIA Natural Diamonds',
                desc: 'Brilliant solitaires, sparkling halo pendants, and tennis bracelets.',
                image: '/images/cat_diamond.jpg',
                metal: 'Diamond'
              },
              {
                title: 'Gold Jewellery',
                purity: '22K 916 & 24K 999 BIS Hallmark',
                desc: 'Auspicious temple jewels, lightweight chains, and wedding sets.',
                image: '/images/cat_gold.jpg',
                metal: 'Gold'
              },
              {
                title: 'Gemstone Jewellery',
                purity: 'Natural Rubies, Emeralds & Sapphires',
                desc: 'Vibrant colourful centerstones accented with certified diamonds.',
                image: '/images/trend_diamond_earrings.jpg',
                metal: 'Gemstone'
              },
              {
                title: 'Platinum Jewellery',
                purity: 'Pt 950 Certified Rare Metal',
                desc: 'Modern love bands, signets, and timeless hypoallergenic creations.',
                image: '/images/trend_rose_gold_kada.jpg',
                metal: 'Platinum'
              },
            ].map((mat, i) => (
              <motion.div
                key={mat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                onClick={() => {
                  setSelectedMetal(mat.metal);
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group cursor-pointer bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden transition-all duration-300 hover:border-[#702638] dark:hover:border-[#E8A598] hover:shadow-lg flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-900">
                  <img
                    src={mat.image}
                    alt={mat.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-[#34252A]/85 text-white text-[10px] font-semibold px-2.5 py-1 tracking-wider uppercase">
                    {mat.purity}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-light leading-relaxed">
                      {mat.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-semibold text-[#702638] dark:text-[#E8A598] uppercase tracking-wider">
                    <span>Shop {mat.title.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CUSTOMIZE JEWELLERY AT OUR STORE                                       */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#341822] text-[#FAF5F0] p-8 sm:p-14 border border-[#C69A8B]/30 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-[#702638]/40 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#C69A8B] uppercase block">
                BESPOKE ATELIER
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#FAF5F0] font-normal leading-tight">
                CUSTOMIZE JEWELLERY AT OUR STORE
              </h2>
              <p className="text-xs sm:text-sm text-[#FAF5F0]/85 font-light leading-relaxed max-w-xl">
                Get in touch with us for a personalised jewellery shopping experience. 
                Whether collaborating with our master CAD artisans to forge an heirloom bridal piece 
                or selecting bespoke solitaire cuts, we bring your vision to life.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                <div className="p-4 bg-white/5 border border-white/10 space-y-1">
                  <div className="font-semibold text-amber-200">1. Find Our Stores</div>
                  <div className="text-[11px] text-stone-300">Over 30 luxury showrooms nationwide with private viewing suites.</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 space-y-1">
                  <div className="font-semibold text-amber-200">2. Book a Store Visit</div>
                  <div className="text-[11px] text-stone-300">Dedicated jewellery stylist reserved exclusively for you.</div>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 space-y-1">
                  <div className="font-semibold text-amber-200">3. Piercing Services</div>
                  <div className="text-[11px] text-stone-300">Hygienic 22K gold cartridge piercing by certified specialists.</div>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap gap-4">
                <button
                  onClick={() => setIsStoreLocatorOpen(true)}
                  className="px-6 py-3 bg-[#C69A8B] hover:bg-[#D4ACA0] text-[#34252A] text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Find Showroom Near You</span>
                </button>
                <button
                  onClick={() => {
                    const yourServicesEl = document.querySelector('section[class*="bg-[#FAF6F0]"]');
                    if (yourServicesEl) yourServicesEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 border border-white/30 hover:border-white text-white text-xs font-semibold uppercase tracking-widest transition-colors"
                >
                  Book Stylist Appointment
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-square overflow-hidden border border-white/10">
              <img
                src="/images/story_bangle_aurelle.jpg"
                alt="Master Jewellery Goldsmith CAD Bespoke Studio"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. GIFTING AND MORE (OCCASION-BASED ASYMMETRIC GRID)                      */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[var(--bg-elevated)] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
              CELEBRATE MILESTONES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
              GIFTING &amp; MORE
            </h2>
            <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Find the perfect gift for every meaningful moment.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {[
              { name: 'Birthday Gifts', desc: 'Solitaire studs & delicate pendants', image: '/images/trend_diamond_earrings.jpg', occ: 'Birthday gifts' },
              { name: 'Festival Gifts', desc: 'Auspicious gold coins & temple chains', image: '/images/cat_traditional.jpg', occ: 'Festive wear' },
              { name: 'Anniversary Gifts', desc: 'Eternity bands & royal necklaces', image: '/images/cat_diamond.jpg', occ: 'Anniversary gifts' },
              { name: 'Kids Gifts', desc: 'Nazariya evil-eye & baby bangles', image: '/images/cat_gold.jpg', occ: 'Kids gifts' },
              { name: 'Gift Cards', desc: 'Instant digital vouchers from ₹5,000', image: '/images/special_offer_velvet.jpg', occ: 'Gift cards' },
              { name: 'Corporate Gifts', desc: 'Custom 24K gold bullion & keepsakes', image: '/images/cat_bridal.jpg', occ: 'Corporate gift cards' },
            ].map((gift, idx) => (
              <motion.div
                key={gift.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => {
                  setSelectedOccasion(gift.occ);
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group cursor-pointer bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden transition-all duration-300 hover:border-[#702638] dark:hover:border-[#E8A598] hover:shadow-md flex flex-col justify-between"
              >
                <div className="relative aspect-square overflow-hidden bg-stone-100 dark:bg-stone-900">
                  <img
                    src={gift.image}
                    alt={gift.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 dark:bg-black/70 flex items-center justify-center text-[#702638] dark:text-[#E8A598]">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="p-3.5">
                  <h3 className="font-serif text-sm font-semibold text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors truncate">
                    {gift.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-light line-clamp-2">
                    {gift.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. BRIDAL COLLECTIONS (CINEMATIC REGIONAL INDIAN STORYTELLING)           */}
      {/* ========================================================================= */}
      <section id="bridal" className="py-24 sm:py-28 bg-[#2A0E17] text-[#FAF5F0] scroll-mt-28 sm:scroll-mt-32 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#702638]/30 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#C69A8B] uppercase block mb-2">
              THE SACRED MUHURTHAM
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-[#FAF5F0] font-normal tracking-wide">
              BRIDAL COLLECTIONS
            </h2>
            <div className="w-16 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#FAF5F0]/80 font-light leading-relaxed">
              Diverse wedding jewels, trusted for generations. Explore now.
            </p>
          </motion.div>

          {/* 5 Regional Bridal Statement Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              {
                region: 'North Indian Bridal Jewellery',
                tradition: 'Polki, Kundan & Meenakari',
                description: 'Aad chokers, uncut diamonds, and royal nath sets tailored for imperial celebrations.',
                image: '/images/hero_bride_aurelle.jpg',
                tag: 'Delhi & Jaipur Royalty'
              },
              {
                region: 'Tamil Bridal Jewellery',
                tradition: 'Kasu Haram & Vanki',
                description: 'Auspicious temple gold, Goddess Lakshmi motifs, and antique mango malas for the traditional Kalyanam.',
                image: '/images/cat_bridal.jpg',
                tag: 'Chettinad & Madurai Heritage'
              },
              {
                region: 'Sita Kalyanam',
                tradition: 'Sacred Bridal Sets',
                description: 'Divine heirloom necklace suites celebrating auspicious marriage vows with 22K BIS gold.',
                image: '/images/special_offer_velvet.jpg',
                tag: 'Vedic Wedding Trousseau'
              },
              {
                region: 'Karnataka Bridal Jewellery',
                tradition: 'Manga Malai & Enamel Kadas',
                description: 'Regal Mysore royal heritage creations adorned with natural red rubies and uncut diamonds.',
                image: '/images/story_bangle_aurelle.jpg',
                tag: 'Mysore & Coastal Tradition'
              },
              {
                region: 'Kerala Bridal Jewellery',
                tradition: 'Palakka Mala & Nagapadathali',
                description: 'Iconic emerald green leaf necklaces, mullamottu malas, and kasu sets for the radiant bride.',
                image: '/images/cat_traditional.jpg',
                tag: 'Kerala God’s Own Gold'
              },
            ].map((b, idx) => (
              <BridalStatementCard
                key={b.region}
                region={b.region}
                tradition={b.tradition}
                description={b.description}
                imageUrl={b.image}
                tag={b.tag}
                onExplore={() => {
                  setSelectedCategory('Jewellery sets');
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                delay={idx * 0.08}
              />
            ))}
          </div>

          {/* Consultation CTA Banner */}
          <div className="mt-14 p-8 border border-[#C69A8B]/30 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#FAF5F0]">
                Planning Your Wedding Trousseau?
              </h3>
              <p className="text-xs text-[#FAF5F0]/75 mt-1 font-light">
                Meet our senior bridal jewellery stylists in person or over a private VIP video call.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsStoreLocatorOpen(true)}
                className="px-6 py-3 bg-[#C69A8B] hover:bg-[#D4ACA0] text-[#34252A] text-xs font-semibold uppercase tracking-widest transition-colors"
              >
                Book Bridal Consultation
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. SHOP BY GENDER                                                        */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
            CURATED FOR EVERY PATRON
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
            SHOP BY GENDER
          </h2>
          <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Women */}
          <div 
            onClick={() => {
              setSelectedGender('Women');
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden aspect-[4/5] cursor-pointer border border-[var(--border-color)] hover:border-[#702638] transition-all duration-300"
          >
            <img
              src="/images/cat_bridal.jpg"
              alt="Women's Jewellery"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[10px] font-bold tracking-widest text-[#C69A8B] uppercase">Women</span>
              <h3 className="font-serif text-2xl font-normal mt-1">Divine Adornments</h3>
              <p className="text-xs text-white/80 mt-1 mb-4 font-light">
                Necklace sets, jhumkas, solitaire rings, and bridal waistbands.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C69A8B] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                <span>Explore Women's Range</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Men */}
          <div 
            onClick={() => {
              setSelectedGender('Men');
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden aspect-[4/5] cursor-pointer border border-[var(--border-color)] hover:border-[#702638] transition-all duration-300"
          >
            <img
              src="/images/trend_rose_gold_kada.jpg"
              alt="Men's Jewellery"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[10px] font-bold tracking-widest text-[#C69A8B] uppercase">Men</span>
              <h3 className="font-serif text-2xl font-normal mt-1">Subtle Power</h3>
              <p className="text-xs text-white/80 mt-1 mb-4 font-light">
                22K gold kadas, rudraksha chains, platinum bands, and signet rings.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C69A8B] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                <span>Explore Men's Range</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Kids */}
          <div 
            onClick={() => {
              setSelectedGender('Kids');
              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden aspect-[4/5] cursor-pointer border border-[var(--border-color)] hover:border-[#702638] transition-all duration-300"
          >
            <img
              src="/images/cat_gold.jpg"
              alt="Kids' Jewellery"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[10px] font-bold tracking-widest text-[#C69A8B] uppercase">Kids</span>
              <h3 className="font-serif text-2xl font-normal mt-1">Auspicious Blessings</h3>
              <p className="text-xs text-white/80 mt-1 mb-4 font-light">
                Black bead nazariya bangles, lightweight studs, and baby anklets.
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C69A8B] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                <span>Explore Kids' Range</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. QUALITY-FIRST SERVICE (5 MINIMALIST TRUST INDICATORS)                  */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#FAF7F2] dark:bg-[#1A1215] border-y border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
              THE PATRON GUARANTEE
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
              QUALITY-FIRST SERVICE
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                icon: <Truck className="w-6 h-6 stroke-[1.5]" />,
                title: 'Free Insured Shipping',
                desc: '100% transit insurance with tamper-proof security courier delivery.'
              },
              {
                icon: <RefreshCw className="w-6 h-6 stroke-[1.5]" />,
                title: 'Easy Exchange',
                desc: 'Hassle-free exchange across all brand showrooms nationwide.'
              },
              {
                icon: <ShieldCheck className="w-6 h-6 stroke-[1.5]" />,
                title: 'Certified Jewellery',
                desc: 'BIS 916 Hallmark with 6-digit HUID and IGI/GIA diamond cards.'
              },
              {
                icon: <Award className="w-6 h-6 stroke-[1.5]" />,
                title: 'Lifetime Service',
                desc: 'Complimentary cleaning, prong inspection, and polish at any store.'
              },
              {
                icon: <RotateCcw className="w-6 h-6 stroke-[1.5]" />,
                title: '14 Days Return',
                desc: 'No-questions-asked return policy for online purchases.'
              },
            ].map((srv, idx) => (
              <div 
                key={srv.title} 
                className="text-center p-4 bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-start space-y-2"
              >
                <div className="w-12 h-12 flex items-center justify-center text-[#702638] dark:text-[#E8A598] mb-1">
                  {srv.icon}
                </div>
                <h3 className="font-serif text-sm font-semibold text-[var(--text-main)]">
                  {srv.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-light leading-relaxed">
                  {srv.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. INSTAGRAM-INSPIRED JEWELLERY GALLERY                                  */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
            COMMUNITY &amp; STORIES
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
            FOLLOW US ON INSTAGRAM
          </h2>
          <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            Stay updated with our stories and latest designs. @rcb_jewellery
          </p>
        </motion.div>

        {/* 6 Curated Instagram Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { tag: 'Diamond Jewellery Set', image: '/images/cat_bridal.jpg', label: 'Royal Polki Choker Suite' },
            { tag: 'Diamond Earrings', image: '/images/trend_diamond_earrings.jpg', label: 'Bespoke Chandelier Drops' },
            { tag: 'Diamond Necklace Set', image: '/images/luxury_necklace_hero.jpg', label: 'Solitaire Cascade Necklace' },
            { tag: 'Royal Choker', image: '/images/special_offer_velvet.jpg', label: '22K Temple Kasu Mala' },
            { tag: 'Solitaire Ring', image: '/images/cat_diamond.jpg', label: 'Oval Cut Halo Ring' },
            { tag: 'Temple Kada', image: '/images/trend_rose_gold_kada.jpg', label: 'Handcrafted Antique Bangle' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden bg-stone-100 dark:bg-stone-900 border border-[var(--border-color)]"
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center text-white">
                <Instagram className="w-5 h-5 text-amber-200 mb-1" />
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-200">{item.tag}</span>
                <p className="text-[11px] font-light mt-0.5 line-clamp-2">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. PERSONAL SHOPPING ASSISTANCE (CONSULTATION STRIP)                     */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#341822] text-[#FAF5F0] border-y border-[#C69A8B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-2">
              <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#C69A8B] uppercase block">
                CONCIERGE ASSISTANCE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#FAF5F0] font-normal">
                Need Help Choosing the Perfect Jewellery?
              </h2>
              <p className="text-xs sm:text-sm text-[#FAF5F0]/80 font-light leading-relaxed max-w-xl">
                Our certified gemologists and jewellery stylists provide unbiased advice on gold purity, 
                diamond 4Cs, ring sizing, and custom bridal curations.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-wrap sm:flex-nowrap gap-3 justify-start lg:justify-end">
              <button
                onClick={() => {
                  const yourServicesEl = document.querySelector('section[class*="bg-[#FAF6F0]"]');
                  if (yourServicesEl) yourServicesEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-5 py-3 bg-[#C69A8B] hover:bg-[#D4ACA0] text-[#34252A] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Our Expert</span>
              </button>

              <button
                onClick={() => setIsStoreLocatorOpen(true)}
                className="w-full sm:w-auto px-5 py-3 border border-white/40 hover:border-white text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Find Nearby Store</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 15. TAKE A TOUR (CRAFTSMANSHIP, CARE, AND EVENTS)                          */}
      {/* ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
            BEHIND THE CRAFT
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
            TAKE A TOUR
          </h2>
          <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            Discover excellent craftsmanship, innovation, and fine jewellery designed for everyday elegance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Jewellery Care */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden flex flex-col justify-between group">
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-stone-900">
              <img
                src="/images/cat_gold.jpg"
                alt="Jewellery Care Guide"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-[#34252A]/90 text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider">
                Artisan Advice
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl font-normal text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
                  Jewellery Care &amp; Maintenance
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 font-light leading-relaxed">
                  Learn how to clean 22K gold, preserve delicate gemstone luster, and safely store diamond solitaires for generations.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setIsCareGuideOpen(true)}
                  className="text-xs font-semibold text-[#702638] dark:text-[#E8A598] uppercase tracking-wider flex items-center gap-1.5 hover:underline"
                >
                  <span>Read Care Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: News & Events */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden flex flex-col justify-between group">
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-stone-900">
              <img
                src="/images/special_offer_velvet.jpg"
                alt="Festive News & Showroom Events"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-[#702638] text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider">
                What's New
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl font-normal text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
                  News &amp; Showroom Events
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 font-light leading-relaxed">
                  Celebrate the auspicious Akshaya Tritiya &amp; Diwali exhibitions with exclusive zero-making-charge preview days.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setIsFestiveOfferOpen(true)}
                  className="text-xs font-semibold text-[#702638] dark:text-[#E8A598] uppercase tracking-wider flex items-center gap-1.5 hover:underline"
                >
                  <span>View Festive Highlights</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Store Locator */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden flex flex-col justify-between group">
            <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-stone-900">
              <img
                src="/images/story_bangle_aurelle.jpg"
                alt="Store Locator & VIP Lounges"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-[#34252A]/90 text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider">
                Nationwide
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl font-normal text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
                  Store Locator &amp; VIP Suites
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 font-light leading-relaxed">
                  Locate our state-of-the-art showrooms equipped with precision XRF gold touchstones and diamond appraisal lounges.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setIsStoreLocatorOpen(true)}
                  className="text-xs font-semibold text-[#702638] dark:text-[#E8A598] uppercase tracking-wider flex items-center gap-1.5 hover:underline"
                >
                  <span>Find Showroom</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 16. DYNAMIC INTERACTIVE CATALOG (POWERED BY SIGNATURE LUXURY CARDS)       */}
      {/* ========================================================================= */}
      <section id="catalog" className="py-20 bg-[var(--bg-elevated)] border-y border-[var(--border-color)] scroll-mt-28 sm:scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1">
                ONLINE SHOWROOM
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
                Signature Jewellery Catalogue
              </h2>
            </div>

            {/* Collection Filter Quick Pills */}
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
                  className={`px-4 py-1.5 whitespace-nowrap transition-colors border ${
                    selectedCollection === tab.id
                      ? 'bg-[#702638] text-white border-[#702638]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[#702638]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Multi-Filter Dock */}
          <div className="bg-[var(--bg-card)] p-4 sm:p-5 border border-[var(--border-color)] shadow-sm mb-8 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)]"
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
                  className="w-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)]"
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
                  className="w-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)]"
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
                  className="w-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)]"
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
                  className="w-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)]"
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
                  className="w-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[var(--text-main)]"
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
              <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-stone-500 text-[11px]">Active Filters:</span>
                  {selectedCategory !== 'All' && (
                    <span className="px-2 py-0.5 bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
                      Category: {selectedCategory}
                      <button onClick={() => setSelectedCategory('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {selectedMetal !== 'All' && (
                    <span className="px-2 py-0.5 bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
                      Metal: {selectedMetal}
                      <button onClick={() => setSelectedMetal('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {budgetFilter !== 'All' && (
                    <span className="px-2 py-0.5 bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
                      Budget: {budgetFilter}
                      <button onClick={() => setBudgetFilter('All')}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E8A598] text-[11px] flex items-center gap-1">
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

          {/* Product Grid Powered by Style A: SignatureLuxuryCard */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-[var(--bg-card)] rounded-2xl h-[460px] animate-pulse border border-[var(--border-color)]"></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filteredProducts.map((product) => (
                <SignatureLuxuryCard
                  key={product.id}
                  product={product}
                  onQuickView={handleQuickView}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onPriceExplainerClick={() => setIsPriceExplainerOpen(true)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] p-12 text-center border border-[var(--border-color)] max-w-lg mx-auto">
              <Sparkles className="w-8 h-8 text-[#C69A8B] mx-auto mb-3" />
              <h3 className="font-serif text-xl font-semibold text-stone-800 dark:text-stone-200">
                No matching jewellery found
              </h3>
              <p className="text-xs text-stone-500 mt-2 mb-6 font-light">
                We couldn't find items matching your current filters. Try relaxing your filters or searching for gold, diamond, or necklaces.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-[#702638] text-white text-xs font-semibold uppercase tracking-wider shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 17. LICENSED GOLD PAWN & COLLATERAL LOANS (PRESERVED REGULATORY SERVICE)   */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#541C2A] text-[#FAF5F0] border-y border-[#C69A8B]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#C69A8B] uppercase block">
                LICENSED FINANCIAL SERVICES
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#FAF5F0] font-normal tracking-wide">
                Gold Pawn &amp; Collateral Loans
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                Unlock instant financial liquidity against your gold jewellery without selling your precious family heirlooms. 
                Our government-licensed pawn facility provides maximum regulatory loan-to-value (up to 75%), lowest interest rates 
                from 0.75% per month, and tamper-proof high-security vault custody.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-[#3D141F] p-3 border border-[#C69A8B]/30">
                  <span className="block font-bold text-amber-300 text-sm">Up to 75% LTV</span>
                  <span className="text-[11px] text-stone-300">RBI Regulatory Max</span>
                </div>
                <div className="bg-[#3D141F] p-3 border border-[#C69A8B]/30">
                  <span className="block font-bold text-emerald-300 text-sm">From 0.75%/mo</span>
                  <span className="text-[11px] text-stone-300">Transparent Interest</span>
                </div>
                <div className="bg-[#3D141F] p-3 border border-[#C69A8B]/30">
                  <span className="block font-bold text-[#FAF5F0] text-sm">15 Minutes</span>
                  <span className="text-[11px] text-stone-300">Instant Disbursement</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsPawnModalOpen(true)}
                  className="px-6 py-3 bg-[#C69A8B] hover:bg-[#D4ACA0] text-[#34252A] text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calculate Loan &amp; Book Appraisal</span>
                </button>
              </div>
            </div>

            {/* Quick Preview Card */}
            <div className="lg:col-span-5 bg-[#3D141F] p-6 border border-[#C69A8B]/40 shadow-xl space-y-4 text-xs">
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

              <div className="p-3 bg-black/20 text-[11px] text-stone-300 leading-normal border border-white/5">
                * Note: Final valuation and sanctioned loan amount are determined in-store after purity verification. No credit score or CIBIL check required.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* N. ASSISTANCE & CONCIERGE CARDS (REDESIGNED WITH DETAILS & IMAGES)        */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#FAF6F0] dark:bg-[#150E12] border-t border-[var(--border-color)] relative overflow-hidden">
        {/* Subtle decorative curved ambient background rings with gentle breathing animation */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.04, 1], opacity: [0.75, 0.9, 0.75] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full border border-[#EDE2D8]/80 dark:border-[#331C24]/40"
        />
        <motion.div
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.03, 1], opacity: [0.75, 0.95, 0.75] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="pointer-events-none absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full border border-[#EDE2D8]/80 dark:border-[#331C24]/40"
        />

        {/* Subtle dot matrix grid in top-right with gentle ambient breathing */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute top-4 right-6 sm:top-7 sm:right-12 grid grid-cols-8 gap-2 opacity-35 dark:opacity-15"
        >
          {Array.from({ length: 32 }).map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-[#852C3E]" />
          ))}
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header with viewport animation */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-8 sm:mb-12"
          >
            <span className="text-xs sm:text-sm font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase">
              YOUR SERVICES
            </span>
          </motion.div>

          <motion.div
            variants={servicesContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7"
          >
            {/* Card 1: Connect on WhatsApp */}
            <motion.div
              variants={serviceCard1Variants}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="group relative overflow-hidden rounded-none bg-[#FFFEFC] dark:bg-[#1E1217] border border-[#EADBDB] dark:border-[#38232B] hover:border-[#852C3E]/50 dark:hover:border-[#E8A598]/40 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(112,38,56,0.12)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col sm:flex-row min-h-[220px]"
            >
              {/* Left Content */}
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between relative z-10">
                <div>
                  {/* Icon & Kicker */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-[#F5ECE8] dark:bg-[#341822] flex items-center justify-center text-[#702638] dark:text-[#E8A598] shrink-0 ring-1 ring-[#D8B4A8]/50 ring-offset-2 ring-offset-[#FFFEFC] dark:ring-offset-[#1E1217] transition-all duration-300 group-hover:bg-[#EBDAD4] dark:group-hover:bg-[#431B27] group-hover:ring-[#852C3E]/60 group-hover:scale-105">
                      <svg className="w-5 h-5 fill-current transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold tracking-[0.18em] text-[#8B3247] dark:text-[#E8A598] uppercase block">
                        QUICK SUPPORT
                      </span>
                      <div className="w-5 h-0.5 bg-[#702638] dark:bg-[#E8A598] rounded-full mt-0.5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-sans text-base sm:text-lg font-bold text-[#24171C] dark:text-[#FAF5F0] tracking-tight leading-snug">
                    Connect on WhatsApp
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs text-[#71666A] dark:text-[#C6B6BA] mt-1.5 leading-relaxed">
                    Chat with us for quick support and assistance.
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <a
                    href="https://wa.me/914424347888?text=Hello%20RCB%20Jewelry,%20I%20would%20like%20to%20inquire%20about%20your%20jewellery%20collection"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn inline-flex items-center gap-1.5 px-5 py-2.5 rounded-none bg-[#5A1C2B] hover:bg-[#702638] active:bg-[#431420] text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  >
                    <span>Chat with us</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/btn:translate-x-1" />
                  </a>
                </div>
              </div>

              {/* Right Image */}
              <div className="w-full sm:w-[42%] relative overflow-hidden shrink-0 min-h-[160px] sm:min-h-full rounded-l-[36px] sm:rounded-l-[44px]">
                <img
                  src="/images/service_whatsapp.jpg"
                  alt="WhatsApp Concierge Support"
                  className="w-full h-full object-cover group-hover:scale-[1.05] group-hover:brightness-[1.03] transition-all duration-700 ease-out"
                />
              </div>
            </motion.div>

            {/* Card 2: Schedule a Video Call */}
            <motion.div
              variants={serviceCard2Variants}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="group relative overflow-hidden rounded-none bg-[#FFFEFC] dark:bg-[#1E1217] border border-[#EADBDB] dark:border-[#38232B] hover:border-[#852C3E]/50 dark:hover:border-[#E8A598]/40 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(112,38,56,0.12)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col sm:flex-row min-h-[220px]"
            >
              {/* Left Content */}
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between relative z-10">
                <div>
                  {/* Icon & Kicker */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-[#F5ECE8] dark:bg-[#341822] flex items-center justify-center text-[#702638] dark:text-[#E8A598] shrink-0 ring-1 ring-[#D8B4A8]/50 ring-offset-2 ring-offset-[#FFFEFC] dark:ring-offset-[#1E1217] transition-all duration-300 group-hover:bg-[#EBDAD4] dark:group-hover:bg-[#431B27] group-hover:ring-[#852C3E]/60 group-hover:scale-105">
                      <Video className="w-5 h-5 stroke-[1.8] transition-transform duration-300 ease-out group-hover:scale-110 group-hover:translate-x-0.5" />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold tracking-[0.18em] text-[#8B3247] dark:text-[#E8A598] uppercase block">
                        STAY CONNECTED
                      </span>
                      <div className="w-5 h-0.5 bg-[#702638] dark:bg-[#E8A598] rounded-full mt-0.5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-sans text-base sm:text-lg font-bold text-[#24171C] dark:text-[#FAF5F0] tracking-tight leading-snug">
                    Schedule a Video Call
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs text-[#71666A] dark:text-[#C6B6BA] mt-1.5 leading-relaxed">
                    Talk to our team face-to-face at your convenience.
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <button
                    onClick={() => setIsStoreLocatorOpen(true)}
                    className="group/btn inline-flex items-center gap-1.5 px-5 py-2.5 rounded-none bg-[#5A1C2B] hover:bg-[#702638] active:bg-[#431420] text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  >
                    <span>Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Right Image */}
              <div className="w-full sm:w-[42%] relative overflow-hidden shrink-0 min-h-[160px] sm:min-h-full rounded-l-[36px] sm:rounded-l-[44px]">
                <img
                  src="/images/service_video_call.jpg"
                  alt="Live Video Call Consultation"
                  className="w-full h-full object-cover group-hover:scale-[1.05] group-hover:brightness-[1.03] transition-all duration-700 ease-out"
                />
              </div>
            </motion.div>

            {/* Card 3: Book An Appointment */}
            <motion.div
              variants={serviceCard3Variants}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="group relative overflow-hidden rounded-none bg-[#FFFEFC] dark:bg-[#1E1217] border border-[#EADBDB] dark:border-[#38232B] hover:border-[#852C3E]/50 dark:hover:border-[#E8A598]/40 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(112,38,56,0.12)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col sm:flex-row min-h-[220px]"
            >
              {/* Left Content */}
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between relative z-10">
                <div>
                  {/* Icon & Kicker */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-[#F5ECE8] dark:bg-[#341822] flex items-center justify-center text-[#702638] dark:text-[#E8A598] shrink-0 ring-1 ring-[#D8B4A8]/50 ring-offset-2 ring-offset-[#FFFEFC] dark:ring-offset-[#1E1217] transition-all duration-300 group-hover:bg-[#EBDAD4] dark:group-hover:bg-[#431B27] group-hover:ring-[#852C3E]/60 group-hover:scale-105">
                      <MapPin className="w-5 h-5 stroke-[1.8] transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-0.5" />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold tracking-[0.18em] text-[#8B3247] dark:text-[#E8A598] uppercase block">
                        PLAN YOUR VISIT
                      </span>
                      <div className="w-5 h-0.5 bg-[#702638] dark:bg-[#E8A598] rounded-full mt-0.5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-sans text-base sm:text-lg font-bold text-[#24171C] dark:text-[#FAF5F0] tracking-tight leading-snug">
                    Book An Appointment
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs text-[#71666A] dark:text-[#C6B6BA] mt-1.5 leading-relaxed">
                    Choose a time that works best for you.
                  </p>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <button
                    onClick={() => setIsStoreLocatorOpen(true)}
                    className="group/btn inline-flex items-center gap-1.5 px-5 py-2.5 rounded-none bg-[#5A1C2B] hover:bg-[#702638] active:bg-[#431420] text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Right Image */}
              <div className="w-full sm:w-[42%] relative overflow-hidden shrink-0 min-h-[160px] sm:min-h-full rounded-l-[36px] sm:rounded-l-[44px]">
                <img
                  src="/images/service_appointment.jpg"
                  alt="Showroom Appointment Calendar"
                  className="w-full h-full object-cover group-hover:scale-[1.05] group-hover:brightness-[1.03] transition-all duration-700 ease-out"
                />
              </div>
            </motion.div>
          </motion.div>
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

          {/* Infinite Moving Review Cards Slider */}
          <div className="relative w-full overflow-hidden py-4 -mx-4 sm:mx-0">
            {/* Left & Right gradient edge fades */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 z-10 bg-gradient-to-r from-[var(--bg-main)] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 z-10 bg-gradient-to-l from-[var(--bg-main)] to-transparent" />

            {/* Seamless Looping Marquee Track: pauses when hovering on any card */}
            <div className="animate-marquee-infinite flex gap-6 items-stretch">
              {[...reviews, ...reviews].map((item, index) => {
                const authorParts = item.author.split(',');
                const authorName = authorParts[0].trim();
                const locationOrRole = authorParts[1] ? authorParts[1].trim() : 'Jewellery customer';

                return (
                  <div key={index} className="w-[310px] sm:w-[360px] shrink-0 flex">
                    <ReviewCard
                      rating={item.stars || 5}
                      title={(item as { title?: string }).title || 'Beautiful craftsmanship'}
                      review={item.quote}
                      author={authorName}
                      role={item.itemPurchased ? `Verified: ${item.itemPurchased}` : locationOrRole}
                      date={item.date || 'Recently'}
                      avatarUrl={(item as { avatar?: string }).avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'}
                      verifiedText="Verified purchase"
                      className="w-full h-full"
                    />
                  </div>
                );
              })}
            </div>
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

      {/* Jewellery Care Guide Modal */}
      {isCareGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#702638] dark:text-[#E8A598] uppercase">Artisan Stewardship</span>
                <h3 className="font-serif text-2xl text-[var(--text-main)] font-normal mt-1">Jewellery Care Guide</h3>
              </div>
              <button
                onClick={() => setIsCareGuideOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed font-light">
              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
                <div className="font-semibold text-[var(--text-main)]">1. 22K &amp; 18K Gold Maintenance</div>
                <p>Clean gently using lukewarm water and mild organic soap with a soft-bristle brush. Avoid direct contact with chlorine or perfume.</p>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
                <div className="font-semibold text-[var(--text-main)]">2. Natural Diamond Care</div>
                <p>Diamonds attract natural body oils. Soak for 15 minutes once a month and dry with a lint-free microfiber polishing cloth.</p>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-color)] space-y-1">
                <div className="font-semibold text-[var(--text-main)]">3. Heritage Kundan, Polki &amp; Pearls</div>
                <p>Store individually in velvet-lined boxes away from moisture. Never submerge uncut polki or genuine pearls in water.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsCareGuideOpen(false)}
                className="px-6 py-2.5 bg-[#702638] text-white text-xs font-semibold uppercase tracking-wider"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
