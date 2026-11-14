import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Calculator, 
  X, 
  Video,
  MapPin,
  MoveUpRight,
  Crown,
  Gem,
  Pause,
  Play
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  EditorialFloatingCard, 
  BentoFeatureCard 
} from '../components/cards';
import { 
  FeaturedCollections, 
  BridalCollectionSection, 
  DivineCollectionSection, 
  OccasionMosaic,
  ServicesExperienceSection
} from '../components/landing';
import { 
  staggerContainer, 
  staggerItemVariants 
} from '../utils/motion';
import { supabase, isSupabaseConfigured, JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { PriceBreakdownExplainerModal } from '../components/PriceBreakdownExplainerModal';
import { PawnValuationModal } from '../components/PawnValuationModal';
import { StoreLocatorModal } from '../components/StoreLocatorModal';
import { CustomerReviewModal } from '../components/CustomerReviewModal';
import { FestiveOfferPopup } from '../components/FestiveOfferPopup';
import { campaignService, CampaignData } from '../services/campaignService';
import { LuxuryPageLoader } from '../components/LuxuryPageLoader';
import { PatronGuaranteeSection } from '../components/PatronGuaranteeSection';
import { LuxuryCampaignCarousel } from '../components/home/LuxuryCampaignCarousel';
import { localJewelryItems } from '../utils/localData';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { 
  RevealHeading, 
  GoldShimmerText, 
  TextScramble, 
  AnimatedCounter, 
  AnimatedUnderline, 
  SplitTextReveal 
} from '../components/ui/text-animations';

function LotusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-1.2 3.5-2.5 6-5.5 8 2.5 1 4 3 5.5 6 1.5-3 3-5 5.5-6-3-2-4.3-4.5-5.5-8z" />
      <path d="M6.5 11C4 11.5 2.5 13 2 15c2.5 1 5 .5 7-1" />
      <path d="M17.5 11c2.5.5 4 2 4.5 4-2.5 1-5 .5-7-1" />
      <path d="M8 18c2.5 2 5.5 2 8 0" />
    </svg>
  );
}

function LotusWatermark({ className = "w-72 h-72" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M60 10C54 30 45 45 25 55c15 5 25 18 35 40 10-22 20-35 35-40-20-10-29-25-35-45z" opacity="0.35" />
      <path d="M25 55c-15 3-22 12-25 22 15 6 30 2 40-7" opacity="0.25" />
      <path d="M95 55c15 3 22 12 25 22-15 6-30 2-40-7" opacity="0.25" />
      <path d="M40 92c12 10 28 10 40 0" opacity="0.3" />
    </svg>
  );
}



export default function Home() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart } = useCart();
  const { calculateProductPrice } = useRates();

  // State
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>(localJewelryItems);
  const [, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<JewelryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<{ id?: string; name: string; price: number; weight: number; unit: string; quantity?: number; image_url?: string }[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Derive checkout items from active cart when opened via cart checkout or direct navigation
  const cartCheckoutItems = useMemo(() => {
    return Object.values(cart).map(cartItem => {
      const product = jewelryItems.find(p => p.id === cartItem.productId);
      if (!product) return null;
      const priceDetails = calculateProductPrice(
        cartItem.weight,
        product.metal_type,
        product.wastage_percent,
        product.price,
        product.name
      );
      const unitPrice = priceDetails.totalPrice || product.price;
      return {
        id: product.id,
        name: product.name,
        price: unitPrice,
        weight: cartItem.weight || product.weight || 0,
        unit: 'g',
        quantity: cartItem.quantity || 1,
        image_url: product.image_url || undefined,
      };
    }).filter(Boolean) as {
      id: string;
      name: string;
      price: number;
      weight: number;
      unit: string;
      quantity: number;
      image_url?: string;
    }[];
  }, [cart, jewelryItems, calculateProductPrice]);

  const cartCheckoutTotal = useMemo(() => {
    return cartCheckoutItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  }, [cartCheckoutItems]);

  // If direct buy now was triggered with specific items, prioritize them; otherwise, pull from active cart
  const effectiveCheckoutItems = useMemo(() => {
    if (checkoutItems.length > 0 && checkoutTotal > 0) {
      return checkoutItems;
    }
    return cartCheckoutItems;
  }, [checkoutItems, checkoutTotal, cartCheckoutItems]);

  const effectiveCheckoutTotal = useMemo(() => {
    if (checkoutItems.length > 0 && checkoutTotal > 0) {
      return checkoutTotal;
    }
    return cartCheckoutTotal;
  }, [checkoutItems, checkoutTotal, cartCheckoutTotal]);

  const handleCloseCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
    setCheckoutItems([]);
    setCheckoutTotal(0);
    if (searchParams.get('checkout') === 'true') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('checkout');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Modals
  const [isPriceExplainerOpen, setIsPriceExplainerOpen] = useState(false);
  const [isPawnModalOpen, setIsPawnModalOpen] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);
  const [storeLocatorDefaultTab] = useState<'locate' | 'book'>('locate');
  const [storeLocatorInitialService] = useState<string>('Bespoke Jewellery Consultation');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFestiveOfferOpen, setIsFestiveOfferOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<CampaignData | null>(null);

  // Hero carousel & loading states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Gifting section states
  const [activeGiftIndex, setActiveGiftIndex] = useState<number>(1);
  const [isGiftAutoplayPaused, setIsGiftAutoplayPaused] = useState<boolean>(false);
  const [isGiftHovered, setIsGiftHovered] = useState<boolean>(false);
  const giftingTrackRef = useRef<HTMLDivElement>(null);

  // Helper: only scroll horizontally if the track overflows (mobile / tablet), avoiding cutting off edge cards on desktop
  const scrollGiftCardIfNeeded = useCallback((idx: number) => {
    if (giftingTrackRef.current) {
      const container = giftingTrackRef.current;
      if (container.scrollWidth > container.clientWidth + 8) {
        const card = container.children[idx] as HTMLElement;
        if (card) {
          card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }
  }, []);

  // Option 3: Auto-play spotlight cycle for Curated Gifting Collection
  useEffect(() => {
    if (isGiftAutoplayPaused || isGiftHovered) return;

    const timer = setInterval(() => {
      setActiveGiftIndex((prev) => {
        const nextIdx = (prev + 1) % 6;
        scrollGiftCardIfNeeded(nextIdx);
        return nextIdx;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, [isGiftAutoplayPaused, isGiftHovered, scrollGiftCardIfNeeded]);

  const handleGiftNav = useCallback((direction: 'next' | 'prev') => {
    setActiveGiftIndex((prev) => {
      const nextIdx = direction === 'next' ? (prev < 5 ? prev + 1 : 0) : (prev > 0 ? prev - 1 : 5);
      scrollGiftCardIfNeeded(nextIdx);
      return nextIdx;
    });
  }, [scrollGiftCardIfNeeded]);

  const handleSelectGiftCard = useCallback((idx: number) => {
    setActiveGiftIndex(idx);
    scrollGiftCardIfNeeded(idx);
  }, [scrollGiftCardIfNeeded]);

  const handleGiftExplore = useCallback((gift: { name: string; occ: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (gift.name === 'Gift Cards') {
      setSearchParams({ modal: 'giftcard' });
    } else {
      navigate(`/jewellery?occasion=${encodeURIComponent(gift.occ)}`);
    }
  }, [setSearchParams, navigate]);

  // Customer reviews list (seeded + local storage)
  const [_reviews, setReviews] = useState([
    {
      author: 'Priya Sundaram, Chennai',
      quote: 'YAZHINI Fine Jewels crafted my entire wedding trousseau. The temple nagas haram is breathtaking, and having BIS 916 laser hallmarking along with exact making charge receipts made me feel completely secure.',
      stars: 5,
      itemPurchased: '22K Temple Nagas Bridal Haram',
      date: 'Oct 2026',
      title: 'Beautiful craftsmanship',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
    },
    {
      author: 'Karthik Subramanian, Coimbatore',
      quote: 'I used YAZHINI appraisal services when I needed working capital for my agro business. Within 15 minutes they verified the ornaments using XRF, gave 75% market value, and safely stored them in their vault. Excellent professionalism.',
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

    if (q || cat || metal || occasion || gender || collection) {
      const params = new URLSearchParams(searchParams);
      navigate(`/jewellery?${params.toString()}`, { replace: true });
      return;
    }

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
  }, [searchParams, jewelryItems, navigate]);

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
  }, [searchParams]);

  const fetchJewelryItems = async () => {
    const isPreview = searchParams.get('preview') === 'true';
    const filterValid = (items: JewelryItem[]) =>
      isPreview ? items : items.filter(i => (i.status || 'published') !== 'archived' && (i.status || 'published') !== 'draft');

    if (!isSupabaseConfigured) {
      setJewelryItems(filterValid(localJewelryItems));
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('jewelry_items')
        .select('*');
      
      if (!isPreview) {
        query = query.neq('status', 'archived').neq('status', 'draft');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      const validLocal = filterValid(localJewelryItems);
      if (data && data.length > 0) {
        // Merge with local items if some are missing
        const combined = [...data];
        for (const loc of validLocal) {
          if (!combined.some(d => d.name === loc.name)) {
            combined.push(loc);
          }
        }
        setJewelryItems(combined);
      } else {
        setJewelryItems(validLocal);
      }
    } catch {
      setJewelryItems(filterValid(localJewelryItems));
    } finally {
      setLoading(false);
      setIsPageLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBuyNow = (product: JewelryItem) => {
    if (product.in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0)) {
      showNotification('This exquisite creation is currently out of stock.');
      return;
    }
    const priceDetails = calculateProductPrice(
      product.weight,
      product.metal_type,
      product.wastage_percent,
      product.price,
      product.name
    );
    const resolvedPrice = priceDetails.totalPrice || product.price;
    setCheckoutItems([{
      id: product.id,
      name: product.name,
      price: resolvedPrice,
      weight: product.weight || 0,
      unit: 'g',
      quantity: 1,
      image_url: product.image_url || undefined
    }]);
    setCheckoutTotal(resolvedPrice);
    setIsCheckoutOpen(true);
  };

  const [isCareGuideOpen, setIsCareGuideOpen] = useState(false);

  // Hero Campaign Slides - 100% focused on exquisite jewellery & fine craft
  const heroSlides = [
    {
      title: "Jewellery That Tells Your Story.",
      line1: "Jewellery That",
      line2: "Tells Your Story.",
      subtitle: "Discover timeless craftsmanship, exceptional diamonds, and treasured designs inspired by heritage.",
      image: "/images/luxury_necklace_hero.jpg",
      video: "/images/Diamond_jewellery_commercial_film_20261016165859.mp4",
      primaryCTA: "Explore Collection",
      primaryAction: () => {
        navigate('/jewellery');
      },
      secondaryCTA: "Diamond Masterpieces",
      secondaryAction: () => {
        document.getElementById('diamonds')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      title: "Tradition, Crafted to Shine.",
      line1: "Tradition,",
      line2: "Crafted to Shine.",
      subtitle: "Heirloom 22K temple chokers, certified bridal trousseau, and hallmarked South Indian splendour.",
      image: "/images/hero_bride_aurelle.jpg",
      video: "/images/Model_showcasing_gold_jewellery_model_20261016165903.mp4",
      primaryCTA: "Bridal Trousseau",
      primaryAction: () => {
        document.getElementById('bridal')?.scrollIntoView({ behavior: 'smooth' });
      },
      secondaryCTA: "View Signature Pieces",
      secondaryAction: () => {
        navigate('/jewellery');
      }
    },
    {
      title: "Royal Heritage & 22K Hallmarked Gold",
      line1: "Royal Heritage,",
      line2: "In Pure 22K Gold.",
      subtitle: "Handcrafted filigree necklaces, antique polki bangles, and sovereign heirlooms made to endure for generations.",
      image: "/images/story_bangle_aurelle.jpg",
      video: "/images/Woman_wearing_gold_necklace_20261016115314.mp4",
      primaryCTA: "Shop Pure Gold",
      primaryAction: () => {
        navigate('/jewellery?metal=gold');
      },
      secondaryCTA: "Explore Collections",
      secondaryAction: () => {
        document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  // Auto advance hero carousel with dynamic video duration support
  useEffect(() => {
    if (isHeroPaused) return;
    const isVideoSlide = Boolean(heroSlides[currentSlide]?.video);
    // Allow the full 10-second video to play completely before advancing (10500ms)
    const slideDuration = isVideoSlide ? 10500 : 6500;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, slideDuration);
    return () => clearInterval(timer);
  }, [heroSlides, currentSlide, isHeroPaused]);

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Persistent storage keys for First-Time Visitor Offer Popup
  const POPUP_DISMISSED_KEY = 'yazhini_festive_offer_dismissed_v1';
  const POPUP_SEEN_KEY = 'yazhini_first_time_visitor_offer_seen';
  const RETURNING_VISITOR_KEY = 'yazhini_patron_returning_visitor';

  // First-Time Visitor Homepage Offer Popup
  // Automatically displayed only on the homepage (/) for first-time visitors after page finishes loading
  useEffect(() => {
    // 1. Strict route check: Display only when visiting the website's homepage ('/')
    const pathname = window.location.pathname;
    const isHomepage = pathname === '/' || pathname === '';
    if (!isHomepage) {
      return;
    }

    // 2. Persistent storage check: Never display repeatedly after refreshes or if already dismissed/seen
    const isDismissed = localStorage.getItem(POPUP_DISMISSED_KEY) === 'true';
    const hasSeen = localStorage.getItem(POPUP_SEEN_KEY) === 'true';
    if (isDismissed || hasSeen) {
      return;
    }

    // 3. Do not interrupt existing customers who have already visited the website before or are logged in
    const isReturning = localStorage.getItem(RETURNING_VISITOR_KEY) === 'true';
    const hasAuthToken = localStorage.getItem('supabase.auth.token') || 
                         localStorage.getItem('sb-lxideysrehfiiixivobe-auth-token') ||
                         localStorage.getItem('rcb_user_session');
    if (isReturning || hasAuthToken) {
      // Mark as seen so popup is never triggered on future sessions
      localStorage.setItem(POPUP_SEEN_KEY, 'true');
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    // Fetch active promotional campaign and schedule smooth entrance animation after page finishes loading
    campaignService.getActiveCampaign().then((campaign) => {
      if (!campaign || campaign.status !== 'active') {
        return;
      }
      setActiveCampaign(campaign);

      // Show automatically after homepage load with smooth entrance delay (1200ms)
      timeoutId = setTimeout(() => {
        setIsFestiveOfferOpen(true);
        // Save state persistently so it's only shown once per first-time visitor
        localStorage.setItem(POPUP_SEEN_KEY, 'true');
        localStorage.setItem(RETURNING_VISITOR_KEY, 'true');
        campaignService.recordAnalytics(campaign.id, 'impression');
      }, 1200);
    }).catch((err) => {
      console.warn('Failed to load active campaign for first-time visitor:', err);
    });

    // Support manual trigger for preview/testing
    const handleManualOpen = () => {
      campaignService.getActiveCampaign().then((campaign) => {
        if (campaign) setActiveCampaign(campaign);
        setIsFestiveOfferOpen(true);
      });
    };
    window.addEventListener('rcb-open-offer-popup', handleManualOpen);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('rcb-open-offer-popup', handleManualOpen);
    };
  }, []);

  const handleCloseFestiveOffer = () => {
    setIsFestiveOfferOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, 'true');
    localStorage.setItem(POPUP_SEEN_KEY, 'true');
    localStorage.setItem(RETURNING_VISITOR_KEY, 'true');
  };

  const handleShopNowFestiveOffer = () => {
    setIsFestiveOfferOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, 'true');
    localStorage.setItem(POPUP_SEEN_KEY, 'true');
    localStorage.setItem(RETURNING_VISITOR_KEY, 'true');

    if (activeCampaign?.coupon_code) {
      sessionStorage.setItem('yazhini_applied_coupon', activeCampaign.coupon_code);
    }
    navigate('/jewellery');
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
      img: '/images/pendant_colombian_emerald.jpg',
      categoryKey: 'Pendants',
    },
    {
      id: '03',
      title: 'Rings & Solitaires',
      des: 'Timeless love bands, eternity rings, and hallmarked cocktail solitaires',
      img: '/images/ring_solitaire_diamond.jpg',
      categoryKey: 'Rings',
    },
    {
      id: '04',
      title: 'Earrings & Jhumkas',
      des: 'Intricate temple drops, antique jhumkas, and chandelier diamond studs',
      img: '/images/earring_peacock_jhumkas.jpg',
      categoryKey: 'Earrings',
    },
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



  return (
    <div className="bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen selection:bg-[#702638] selection:text-white transition-colors duration-300">
      
      {/* Luxury Cinematic Monogram Page Entrance Loader */}
      <LuxuryPageLoader isLoading={isPageLoading} onFinish={() => setIsPageLoading(false)} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#702638] text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* D. HERO BANNER CAROUSEL WITH CINEMATIC KEN BURNS & LUXURY MOTION           */}
      {/* ======================================================================      {/* ========================================================================= */}
      {/* D. HERO BANNER — FULL BACKGROUND VIDEO CINEMATIC LUXURY SHOWCASE          */}
      {/* ========================================================================= */}
      <section 
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] xl:min-h-[760px] overflow-hidden flex items-center bg-[#120D0F] border-b border-[#C6A15B]/30"
        aria-label="YAZHINI Fine Jewels cinematic showcase"
      >
        {/* Full-bleed Background Video & Image Layer with Framer Motion Transition */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1.01 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {heroSlides[currentSlide].video ? (
                <video
                  key={heroSlides[currentSlide].video}
                  src={heroSlides[currentSlide].video}
                  poster={heroSlides[currentSlide].image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onError={(e) => { console.warn('Hero video stream fallback to poster:', e); }}
                  onLoadedData={(e) => {
                    const p = e.currentTarget.play();
                    if (p !== undefined) p.catch(() => {});
                  }}
                  onEnded={() => {
                    if (!isHeroPaused) {
                      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
                    }
                  }}
                  className="w-full h-full object-cover brightness-[1.05] contrast-[1.02]"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={heroSlides[currentSlide].image}
                  alt={heroSlides[currentSlide].title}
                  className="w-full h-full object-cover brightness-[1.05] contrast-[1.02]"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimal soft left gradient for text legibility, leaving the model and jewellery 100% visible and radiant */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 via-40% to-transparent pointer-events-none z-10" />

        {/* Foreground Content: Clean, Uncluttered, Pure Luxury Typography & Single Primary Action */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 w-full z-20">
          <div className="max-w-xl space-y-5">
            {/* Cinematic Headline with Staggered Entrance */}
            <div className="font-heading font-normal text-white text-3xl sm:text-5xl lg:text-[58px] xl:text-[64px] leading-[1.08] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
              <RevealHeading 
                key={`hero-title-l1-${currentSlide}`}
                as="h1"
                variant="mask"
                className="text-white block font-heading"
              >
                {heroSlides[currentSlide].line1}
              </RevealHeading>
              <div className="block font-serif italic font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] mt-1">
                <GoldShimmerText variant="champagne" className="font-serif italic font-normal">
                  {heroSlides[currentSlide].line2}
                </GoldShimmerText>
              </div>
            </div>

            {heroSlides[currentSlide].subtitle && (
              <motion.div
                key={`hero-sub-${currentSlide}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="text-white/85 text-sm sm:text-base font-light max-w-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              >
                <SplitTextReveal text={heroSlides[currentSlide].subtitle} type="words" delay={0.15} />
              </motion.div>
            )}

            {/* Staggered Luxury CTA */}
            <motion.div 
              key={`hero-cta-${currentSlide}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pt-2"
            >
              <button
                type="button"
                onClick={heroSlides[currentSlide].primaryAction}
                className="px-8 py-3.5 rounded-full bg-[#C6A15B] hover:bg-[#D8B878] text-[#120D0F] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.03] inline-flex items-center gap-2.5 cursor-pointer border border-[#C6A15B]/60"
              >
                <span>{heroSlides[currentSlide].primaryCTA}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Video Navigation Controls Overlay (Bottom-right of Hero) */}
        <div className="absolute bottom-5 right-4 sm:bottom-6 sm:right-8 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevSlide}
            className="w-8 h-8 rounded-[2px] bg-black/60 hover:bg-[#C6A15B] text-white hover:text-[#120D0F] border border-[#C6A15B]/40 flex items-center justify-center transition-all shadow-lg backdrop-blur-md focus:outline-none"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextSlide}
            className="w-8 h-8 rounded-[2px] bg-black/60 hover:bg-[#C6A15B] text-white hover:text-[#120D0F] border border-[#C6A15B]/40 flex items-center justify-center transition-all shadow-lg backdrop-blur-md focus:outline-none"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Progress Indicators (Bottom-left of Hero) */}
        <div className="absolute bottom-5 left-4 sm:bottom-6 sm:left-8 z-20 flex items-center gap-1.5">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-10 bg-[#C6A15B]' : 'w-2.5 bg-white/50 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
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
          <RevealHeading as="h2" variant="word" className="font-serif text-2xl sm:text-3xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
            SHOP BY CATEGORY
          </RevealHeading>
          <AnimatedUnderline className="w-12 mx-auto mt-2.5 mb-2" />
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
            Explore our diverse selections. Find your personal aesthetic.
          </p>
        </motion.div>

        {/* ConditionGrid Asymmetric Category Showcase - Compact & Refined */}
        <motion.div 
          variants={staggerContainer(0.06, 0.03)}
          initial={shouldReduceMotion ? false : "initial"}
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-12 gap-3 sm:gap-3.5 overflow-hidden"
        >
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
                variants={staggerItemVariants}
                onClick={() => {
                  navigate(`/jewellery?category=${encodeURIComponent(project.categoryKey)}`);
                }}
                className={`relative group cursor-pointer overflow-hidden rounded-xl velvet-elevation sheen-container ${colSpanClass}`}
              >
                <div className="w-auto h-[180px] sm:h-[220px] lg:h-[260px] overflow-hidden relative">
                  <div className="sheen-sweep" />
                  <img
                    src={project.img}
                    alt={project.title}
                    className="h-full w-full object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-106"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent rounded-xl pointer-events-none" />
                </div>
                <div className="absolute bottom-0 text-foreground w-full p-3 sm:p-3.5 flex justify-between items-center pointer-events-none">
                  <h3 className="text-xs sm:text-sm bg-black/85 backdrop-blur-md text-white rounded-lg py-1.5 px-3 shadow-md border border-white/10 font-sans font-medium transition-colors group-hover:border-[#C69A8B]/60">
                    {project.title}
                  </h3>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 text-white grid place-content-center rounded-full bg-black/85 backdrop-blur-md border border-white/10 shadow-md group-hover:bg-[#702638] group-hover:scale-110 transition-all duration-300">
                    <MoveUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {/* Sentinel for IntersectionObserver to trigger festive popup */}
      <div id="categories-exit-sentinel" className="w-full h-px pointer-events-none opacity-0" aria-hidden="true" />

      {/* ========================================================================= */}
      {/* 11B. SIGNATURE JEWELLERY CAMPAIGNS (OVERLAPPING EDITORIAL CAROUSEL)       */}
      {/* ========================================================================= */}
      <LuxuryCampaignCarousel />




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
              <h2 className="font-inter text-3xl sm:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
                DIAMOND JEWELLERY
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-light">
                Shine with pride. Discover brilliance in every detail.
              </p>
            </div>

            <button
              onClick={() => {
                navigate('/jewellery?metal=diamond');
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
                videoUrl="/images/Diamond_jewellery_advertisement_ad_20261015172217.mp4"
                videoPosition="object-center"
                imageUrl="/images/luxury_necklace_hero.jpg"
                ctaText="Shop Diamond Collection"
                onCtaClick={() => {
                  navigate('/jewellery?metal=diamond');
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
                  isShowcaseOnly={true}
                  onClick={() => navigate(`/product/${item.id}`)}
                  delay={idx * 0.08}
                />
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 1. FEATURED JEWELLERY COLLECTIONS (ASYMMETRIC EDITORIAL COLLAGE)          */}
      {/* ========================================================================= */}
      <FeaturedCollections />


      {/* ========================================================================= */}
      {/* 2. BRIDAL COLLECTION (FULL-VIEWPORT EDITORIAL SPLIT HERO)                 */}
      {/* ========================================================================= */}
      <BridalCollectionSection />

      {/* ========================================================================= */}
      {/* 3. SACRED COLLECTION / DIVINE IDOLS (REVERSED SPLIT COMPOSITION)          */}
      {/* ========================================================================= */}
      <DivineCollectionSection />

      {/* ========================================================================= */}
      {/* 4. JEWELS FOR EVERY OCCASION (MONOCHROME MOSAIC WITH COLOUR HIGHLIGHTS)   */}
      {/* ========================================================================= */}
      <OccasionMosaic />


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
            <h2 className="font-inter text-3xl sm:text-4xl lg:text-[42px] text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-[-0.01em]">
              Explore By <span className="font-editorial-italic text-[#702638] dark:text-[#E8A598]">Precious Material</span>
            </h2>
            <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Discover certified conflict-free solitaires, hallmarked 22K/24K gold, and pure 950 platinum.
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
                image: '/images/earring_sapphire_royal.jpg',
                metal: 'Gemstone'
              },
              {
                title: 'Platinum Jewellery',
                purity: 'Pt 950 Certified Rare Metal',
                desc: 'Modern love bands, signets, and timeless hypoallergenic creations.',
                image: '/images/ring_platinum_couple_bands.jpg',
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
                  navigate(`/jewellery?metal=${encodeURIComponent(mat.metal)}`);
                }}
                className="group cursor-pointer bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden transition-all duration-500 hover:border-[#C69A8B]/60 dark:hover:border-[#E8A598]/60 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between velvet-elevation sheen-container"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-900">
                  <div className="sheen-sweep" />
                  <img
                    src={mat.image}
                    alt={mat.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                  />
                  <div className="absolute top-3 left-3 bg-[#34252A]/85 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 tracking-wider uppercase border border-white/10">
                    {mat.purity}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-inter text-lg font-normal text-[var(--text-main)] group-hover:text-[#702638] dark:group-hover:text-[#E8A598] transition-colors">
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
      {/* 4B. SHOP BY GENDER — CURATED FINE JEWELLERY COLLECTIONS                   */}
      {/* ========================================================================= */}
      <section id="shop-by-gender" className="py-16 sm:py-20 bg-gradient-to-b from-transparent via-[#FAF7F2] to-transparent dark:via-[#160E12] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-12"
          >
            <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#702638] dark:text-[#E8A598] uppercase block mb-1.5">
              CURATED BY PREFERENCE
            </span>
            <h2 className="font-inter text-2xl sm:text-3xl md:text-4xl text-[#34252A] dark:text-[#FAF5F0] font-normal tracking-wide">
              SHOP BY GENDER
            </h2>
            <div className="w-12 h-0.5 bg-[#C69A8B] mx-auto mt-2.5 mb-2.5" />
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
              Explore bespoke fine jewellery thoughtfully categorized for women, men, and universal heirloom investment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* 1. Women's Collection Card */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#1E1418] border border-[#EAE5E6] dark:border-[#3D2830] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#240A12]">
                <img
                  src="/images/bridal_vivaah_ruby_kundan.jpg"
                  alt="Women's Fine Jewellery Collection"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-inter text-xl sm:text-2xl text-[#241B1D] dark:text-white font-medium mb-1.5 group-hover:text-[#702638] dark:group-hover:text-[#D8B878] transition-colors">
                    Women's Jewellery
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    Opulent temple harams, certified diamond solitaires, bridal trousseaus, modern daily chokers, and sacred mangalsutras.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['Necklaces', 'Earrings', 'Rings', 'Bangles', 'Bridal'].map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#2A1D22] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to="/jewellery/women"
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#450817] hover:bg-[#5C0A1E] text-[#D8B878] text-xs font-semibold tracking-wider transition-colors shadow-xs"
                >
                  <span>Explore Women's Jewels</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* 2. Men's Collection Card */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#1E1418] border border-[#EAE5E6] dark:border-[#3D2830] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#1A1215]">
                <img
                  src="/images/mens_gold_cuban_chain.jpg"
                  alt="Men's Luxury Fine Jewellery Collection"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-inter text-xl sm:text-2xl text-[#241B1D] dark:text-white font-medium mb-1.5 group-hover:text-[#702638] dark:group-hover:text-[#D8B878] transition-colors">
                    Men's Jewellery
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    Solid 22K Cuban and Figaro chains, lion repoussé signet rings, heavy gold kadas, Mahadev Trishul pendants, and platinum bands.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['Cuban Chains', 'Gold Kadas', 'Signet Rings', 'Pendants', 'Cufflinks'].map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#2A1D22] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to="/jewellery/mens"
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#450817] hover:bg-[#5C0A1E] text-[#D8B878] text-xs font-semibold tracking-wider transition-colors shadow-xs"
                >
                  <span>Explore Men's Collection</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* 3. Unisex & Bullion Collection Card */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#1E1418] border border-[#EAE5E6] dark:border-[#3D2830] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#241A12]">
                <img
                  src="/images/gold_coin_8g.jpg"
                  alt="Unisex & Heritage Bullion Collection"
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-inter text-xl sm:text-2xl text-[#241B1D] dark:text-white font-medium mb-1.5 group-hover:text-[#702638] dark:group-hover:text-[#D8B878] transition-colors">
                    Unisex &amp; Bullion
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    Certified 24K pure gold investment coins, 999 ceremonial silver pooja articles, platinum couple commitment bands, and protective talismans.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['Gold Coins', 'Silver Bullion', 'Couple Bands', 'Talismans'].map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#2A1D22] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to="/jewellery/unisex"
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-[#450817] hover:bg-[#5C0A1E] text-[#D8B878] text-xs font-semibold tracking-wider transition-colors shadow-xs"
                >
                  <span>Explore Unisex &amp; Bullion</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 9. GIFTING AND MORE (OCCASION-BASED ASYMMETRIC SPOTLIGHT CAROUSEL)        */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-24 bg-[#F9F6F0] dark:bg-[#181316] border-y border-[#EBE3D7] dark:border-[#38262E] relative overflow-hidden">
        
        {/* Lotus Outline Watermark in Top Right Corner */}
        <div className="absolute right-4 top-2 pointer-events-none select-none text-[#C69A8B]/20 dark:text-[#E5C388]/10 z-0">
          <LotusWatermark className="w-56 h-56" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-14"
          >
            {/* Top Lotus Emblem */}
            <div className="flex justify-center mb-1 text-[#C69A8B] dark:text-[#E5C388] select-none">
              <LotusIcon className="w-4 h-4" />
            </div>

            {/* Eyebrow with Flanking Hairlines */}
            <div className="inline-flex items-center gap-3 mb-2.5">
              <div className="h-[1px] w-8 sm:w-12 bg-[#C69A8B]/60 dark:bg-[#E5C388]/40" />
              <span className="text-[10px] sm:text-[10.5px] font-sans font-bold tracking-[0.28em] text-[#702638] dark:text-[#E5C388] uppercase">
                CELEBRATE MILESTONES
              </span>
              <div className="h-[1px] w-8 sm:w-12 bg-[#C69A8B]/60 dark:bg-[#E5C388]/40" />
            </div>

            {/* Title */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[46px] text-[#29231C] dark:text-[#FAF5F0] font-normal tracking-[-0.015em] leading-[1.12]">
              Curated <GoldShimmerText variant="champagne" className="font-serif italic font-normal">Gifting</GoldShimmerText> Collection
            </h2>
            <AnimatedUnderline className="w-16 mx-auto mt-2.5 mb-2.5" />

            {/* Subtitle */}
            <p className="text-xs sm:text-[13.5px] text-[#635B52] dark:text-[#C8BFB2] font-light leading-relaxed max-w-xl mx-auto mt-2.5">
              Find the perfect keepsake for birthdays, anniversaries, and sacred festivals.
            </p>
          </motion.div>

          {/* Carousel / Cards Track with Navigation Arrows */}
          <div className="relative">
            
            {/* Left Navigation Arrow */}
            <button
              type="button"
              onClick={() => handleGiftNav('prev')}
              className="absolute -left-2 sm:-left-4 lg:-left-6 xl:-left-8 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-white/95 dark:bg-[#252023]/95 border border-[#EBE3D7] dark:border-[#38262E] shadow-md flex items-center justify-center text-[#29231C] dark:text-white hover:text-[#702638] dark:hover:text-[#E5C388] hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Previous gift collection"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Right Navigation Arrow */}
            <button
              type="button"
              onClick={() => handleGiftNav('next')}
              className="absolute -right-2 sm:-right-4 lg:-right-6 xl:-right-8 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-white/95 dark:bg-[#252023]/95 border border-[#EBE3D7] dark:border-[#38262E] shadow-md flex items-center justify-center text-[#29231C] dark:text-white hover:text-[#702638] dark:hover:text-[#E5C388] hover:scale-110 active:scale-95 transition-all cursor-pointer"
              aria-label="Next gift collection"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Cards Container — Smooth Scrollable Track on Mobile, Perfectly Fitted Grid on Desktop */}
            <div 
              ref={giftingTrackRef}
              onMouseEnter={() => setIsGiftHovered(true)}
              onMouseLeave={() => setIsGiftHovered(false)}
              onTouchStart={() => setIsGiftHovered(true)}
              onTouchEnd={() => setIsGiftHovered(false)}
              className="flex items-stretch justify-start lg:justify-between gap-3 sm:gap-3.5 lg:gap-2.5 xl:gap-3.5 overflow-x-auto lg:overflow-visible no-scrollbar py-8 px-4 sm:px-6 lg:px-0 scroll-smooth snap-x snap-mandatory w-full"
            >
              {[
                { name: 'Birthday Gifts', image: '/images/trend_diamond_earrings.jpg', occ: 'Birthday gifts' },
                { name: 'Festive Gifts', image: '/images/bridal_sita_kalyanam.jpg', occ: 'Festive wear' },
                { name: 'Anniversary Gifts', image: '/images/ring_solitaire_diamond.jpg', occ: 'Anniversary gifts' },
                { name: 'Kids Gifts', image: '/images/kids_baby_bangles.jpg', occ: 'Kids gifts' },
                { name: 'Gift Cards', image: '/images/gift_card_luxury_box.jpg', occ: 'Gift cards' },
                { name: 'Corporate Gifts', image: '/images/gold_coin_8g.jpg', occ: 'Corporate gift cards' },
              ].map((gift, idx) => {
                const isActive = activeGiftIndex === idx;
                return (
                  <motion.div
                    key={gift.name}
                    initial={false}
                    animate={
                      isActive
                        ? { 
                            y: [-6, -14, -6], 
                            scale: 1.04 
                          }
                        : { 
                            y: 0, 
                            scale: 1 
                          }
                    }
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={
                      isActive
                        ? {
                            y: {
                              repeat: Infinity,
                              duration: 3.5,
                              ease: "easeInOut"
                            },
                            scale: {
                              type: 'spring',
                              damping: 20,
                              stiffness: 260
                            }
                          }
                        : {
                            type: 'spring',
                            damping: 22,
                            stiffness: 280
                          }
                    }
                    onClick={() => {
                      if (isActive) {
                        handleGiftExplore(gift);
                      } else {
                        handleSelectGiftCard(idx);
                      }
                    }}
                    className={`w-[160px] sm:w-[175px] lg:w-auto lg:flex-1 shrink-0 lg:shrink rounded-2xl overflow-hidden bg-white dark:bg-[#1E191C] border transition-all duration-500 flex flex-col justify-between cursor-pointer group relative snap-center select-none ${
                      isActive
                        ? 'border-[#D4AF37] dark:border-[#D4AF37] ring-2 ring-[#D4AF37]/90 shadow-[0_20px_45px_rgba(212,175,55,0.38)] dark:shadow-[0_20px_45px_rgba(212,175,55,0.28)] z-10'
                        : 'border-[#EBE3D7] dark:border-[#38262E] hover:border-[#D4AF37]/60 opacity-80 hover:opacity-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-xl'
                    }`}
                  >
                    {/* Card Top Image Container — Exactly Equal Dimensions on All Cards */}
                    <div className="relative w-full h-42 sm:h-46 lg:h-44 xl:h-48 overflow-hidden bg-stone-100 dark:bg-stone-900 after:absolute after:inset-0 after:-translate-x-full group-hover:after:translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:transition-transform after:duration-1000 after:pointer-events-none">
                      <img
                        src={gift.image}
                        alt={gift.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    </div>

                    {/* Card Bottom Content Container — Minimal, Uniform & Elegant */}
                    <div className={`py-3.5 px-2.5 sm:px-3 text-center flex flex-col items-center justify-between flex-1 ${
                      isActive ? 'bg-[#FCFBF8] dark:bg-[#221B1E]' : 'bg-[#FAF8F5]/80 dark:bg-[#1E191C]'
                    }`}>
                      <h3 className={`font-inter text-xs sm:text-[13px] xl:text-[13.5px] font-medium transition-colors truncate w-full ${
                        isActive 
                          ? 'text-[#29231C] dark:text-[#FAF5F0] font-semibold' 
                          : 'text-[#29231C] dark:text-[#FAF5F0] group-hover:text-[#702638] dark:group-hover:text-[#E8A598]'
                      }`}>
                        {gift.name}
                      </h3>

                      {/* Explore Button */}
                      <button
                        type="button"
                        onClick={(e) => handleGiftExplore(gift, e)}
                        className={`mt-2 inline-flex items-center gap-1.5 font-sans font-semibold uppercase tracking-[0.18em] text-[9.5px] sm:text-[10px] transition-all cursor-pointer ${
                          isActive
                            ? 'text-[#702638] dark:text-[#E5C388] font-bold group-hover:translate-x-1'
                            : 'text-[#8E867C] group-hover:text-[#702638] dark:group-hover:text-[#E5C388]'
                        }`}
                      >
                        <span>{gift.name === 'Gift Cards' ? 'BUY VOUCHER' : 'EXPLORE'}</span>
                        <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Interactive Luxury Progress Bar & Controls (Option 3) */}
            <div className="flex items-center justify-center gap-2 mt-2 select-none">
              <button
                type="button"
                onClick={() => setIsGiftAutoplayPaused((p) => !p)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#8E867C] hover:text-[#702638] dark:hover:text-[#E5C388] transition-colors cursor-pointer mr-1"
                title={isGiftAutoplayPaused ? 'Resume auto-play' : 'Pause auto-play'}
                aria-label={isGiftAutoplayPaused ? 'Resume auto-play' : 'Pause auto-play'}
              >
                {isGiftAutoplayPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
              </button>

              {[
                'Birthday Gifts',
                'Festive Gifts',
                'Anniversary Gifts',
                'Kids Gifts',
                'Gift Cards',
                'Corporate Gifts'
              ].map((name, idx) => {
                const isActive = activeGiftIndex === idx;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectGiftCard(idx)}
                    className="relative py-2 px-1 focus:outline-none cursor-pointer group"
                    aria-label={`Jump to ${name}`}
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                        isActive
                          ? 'w-7 bg-gradient-to-r from-[#D4AF37] to-[#F3E7D3] shadow-[0_0_10px_rgba(212,175,55,0.7)]'
                          : 'w-2 bg-[#EBE3D7] dark:bg-[#38262E] group-hover:bg-[#D4AF37]/60 group-hover:w-3.5'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>




      {/* ========================================================================= */}
      {/* 12. QUALITY-FIRST SERVICE: THE PATRON GUARANTEE (EDITORIAL REDESIGN)       */}
      {/* ========================================================================= */}
      <PatronGuaranteeSection
        onOpenStoreLocator={() => setIsStoreLocatorOpen(true)}
        onOpenPriceExplainer={() => setIsPriceExplainerOpen(true)}
        onOpenCareGuide={() => setIsCareGuideOpen(true)}
      />










      {/* ========================================================================= */}
      {/* 13. LICENSED FINANCIAL SERVICES: Gold Pawn & Collateral Loans             */}
      {/* ========================================================================= */}
      <section className="relative py-20 sm:py-24 bg-[#2A0B14] text-[#FAF5F0] border-y border-[#C69A8B]/40 overflow-hidden">
        {/* Radiant Visible Jewellery Background Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-[center_right_10%] md:bg-[center_right_20%] bg-no-repeat pointer-events-none transform scale-105 transition-transform duration-1000 ease-out"
          style={{ 
            backgroundImage: `url('/images/special_offer_velvet.jpg')`,
            filter: 'brightness(1.22) contrast(1.12) saturate(1.25)'
          }}
        />

        {/* Directional Luxury Vignette Overlay — preserves high jewellery clarity on the right while ensuring text legibility on the left */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            background: 'linear-gradient(90deg, rgba(38,10,18,0.95) 0%, rgba(38,10,18,0.85) 35%, rgba(38,10,18,0.45) 70%, rgba(38,10,18,0.20) 100%)'
          }}
        />

        {/* Subtle Ambient Golden Glow */}
        <div className="absolute right-10 top-10 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#E5C178] uppercase">
                  LICENSED FINANCIAL SERVICES
                </span>
                <span className="text-stone-500">•</span>
                <TextScramble 
                  text="TN-GOVT-LICENSED-REG-1994" 
                  speed={30} 
                  className="text-[10px] text-[#F3D59B] tracking-widest uppercase font-mono font-medium" 
                />
              </div>

              <div>
                <RevealHeading as="h2" variant="line" className="font-serif text-3xl sm:text-4xl text-[#FAF5F0] font-normal tracking-wide">
                  Gold Pawn &amp; Collateral Loans
                </RevealHeading>
                <AnimatedUnderline direction="left-to-right" className="w-16 mt-2.5 mb-2" />
              </div>

              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light max-w-xl">
                Unlock instant financial liquidity against your gold jewellery without selling your precious family heirlooms. 
                Our government-licensed pawn facility provides maximum regulatory loan-to-value (up to 75%), lowest interest rates 
                from 0.75% per month, and tamper-proof high-security vault custody.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-[#1F070E]/80 backdrop-blur-md p-3.5 border border-[#D4AF37]/30 shadow-md">
                  <span className="block font-bold text-amber-300 text-sm">
                    <AnimatedCounter value={75} prefix="Up to " suffix="% LTV" />
                  </span>
                  <span className="text-[11px] text-stone-300">RBI Regulatory Max</span>
                </div>
                <div className="bg-[#1F070E]/80 backdrop-blur-md p-3.5 border border-[#D4AF37]/30 shadow-md">
                  <span className="block font-bold text-emerald-300 text-sm">
                    <AnimatedCounter value={0.75} decimals={2} prefix="From " suffix="%/mo" />
                  </span>
                  <span className="text-[11px] text-stone-300">Transparent Interest</span>
                </div>
                <div className="bg-[#1F070E]/80 backdrop-blur-md p-3.5 border border-[#D4AF37]/30 shadow-md">
                  <span className="block font-bold text-[#FAF5F0] text-sm">
                    <AnimatedCounter value={15} suffix=" Minutes" />
                  </span>
                  <span className="text-[11px] text-stone-300">Instant Disbursement</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsPawnModalOpen(true)}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C178] to-[#C49A50] hover:from-[#E5C178] hover:to-[#D4AF37] text-[#241017] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calculate Loan &amp; Book Appraisal</span>
                </button>
              </div>
            </div>

            {/* Quick Preview Card (Frosted Glassmorphism for High-End Depth) */}
            <div className="lg:col-span-5 bg-[#1F070E]/85 backdrop-blur-md p-6 sm:p-7 border border-[#D4AF37]/35 shadow-2xl space-y-4 text-xs">
              <h3 className="font-serif text-lg text-[#F3D59B] font-medium border-b border-white/10 pb-2.5 flex items-center justify-between">
                <span>What to Bring for In-Store Assessment</span>
                <Crown className="w-4 h-4 text-[#D4AF37]" />
              </h3>

              <ul className="space-y-2.5 text-stone-200">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Valid Photo KYC:</strong> Aadhaar Card, PAN Card, or Voter ID.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Physical Gold Ornaments:</strong> For precision non-destructive XRF touchstone analysis.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Bank Account Details:</strong> For instant direct NEFT / IMPS disbursement.</span>
                </li>
              </ul>

              <div className="p-3 bg-black/30 text-[11px] text-stone-300 leading-normal border border-white/10 rounded-none">
                * Note: Final valuation and sanctioned loan amount are determined in-store after purity verification. No credit score or CIBIL check required.
              </div>
            </div>

          </div>
        </div>
      </section>




      {/* ========================================================================= */}
      {/* N. MORE THAN JEWELLERY — A COMPLETE LUXURY EXPERIENCE (SERVICES)         */}
      {/* ========================================================================= */}
      <ServicesExperienceSection onOpenStoreLocator={() => setIsStoreLocatorOpen(true)} />





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
          onBuyNow={() => {
            setIsDetailsOpen(false);
            handleBuyNow(selectedProduct);
          }}
        />
      )}

      {/* Direct Buy Now or Cart Checkout Modal (Workflow 6) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
        items={effectiveCheckoutItems}
        totalAmount={effectiveCheckoutTotal}
        isCartCheckout={checkoutItems.length === 0}
        onSuccess={() => {
          handleCloseCheckout();
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
        defaultTab={storeLocatorDefaultTab}
        initialService={storeLocatorInitialService}
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
            date: newReview.date,
            title: (newReview as any).title || 'Verified Patron Review',
            avatar: (newReview as any).avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
          }, ...prev]);
          showNotification('Review submitted successfully! Thank you.');
        }}
      />

      {/* Festive Promotional Offer Popup (Workflow Festive Extravaganza) */}
      <FestiveOfferPopup
        isOpen={isFestiveOfferOpen}
        onClose={handleCloseFestiveOffer}
        onShopNow={handleShopNowFestiveOffer}
        campaign={activeCampaign}
      />

      {/* Jewellery Care Guide Modal */}
      {isCareGuideOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCareGuideOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#702638] dark:text-[#E8A598] uppercase">Artisan Stewardship</span>
                <h3 className="font-inter text-2xl text-[var(--text-main)] font-normal mt-1">Jewellery Care Guide</h3>
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
        </div>,
        document.body
      )}

    </div>
  );
}
