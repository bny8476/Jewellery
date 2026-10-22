import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Heart,
  ShoppingCart,
  ChevronRight,
  TrendingUp,
  Clock,
  Share2,
  Check,
  AlertCircle,
  ZoomIn,
  Ruler,
  MapPin,
  Video,
  Star,
  MessageSquareQuote
} from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { ApiService } from '../services/apiService';
import { localJewelryItems } from '../utils/localData';
import { useRates } from '../context/RateContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrencyINR } from '../utils/formatters';
import { getJewelryFallbackImage } from '../utils/imageUtils';
import { SignatureLuxuryCard } from '../components/cards/SignatureLuxuryCard';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { validatePincode } from '../utils/validation';
import { StoreLocatorModal } from '../components/StoreLocatorModal';
import { SizeGuideModal } from '../components/SizeGuideModal';
import { CustomerReviewModal } from '../components/CustomerReviewModal';
import { PurityEducationModal } from '../components/PurityEducationModal';
import { GoldExchangeModal } from '../components/GoldExchangeModal';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rates, isLive, calculateProductPrice } = useRates();
  const { addToCart, addToCartWithAnimation } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<JewelryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Joyalukkas PDP Luxury Suite states
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [selectedSize, setSelectedSize] = useState<string>('14');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState(() => localStorage.getItem('yazhini_pincode') || '600017');
  const [pincodeStatus, setPincodeStatus] = useState<{ checked: boolean; valid: boolean; deliveryText?: string } | null>({
    checked: true,
    valid: true,
    deliveryText: 'Free Insured Delivery in 2-3 Business Days via BlueDart / Sequel Express. Cash on Delivery eligible.'
  });
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);
  const [appointmentService, setAppointmentService] = useState('In-Store Jewellery Trial & Styling');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPurityEducationOpen, setIsPurityEducationOpen] = useState(false);
  const [purityInitialTab, setPurityInitialTab] = useState<'huid' | '4cs' | 'metals' | 'care'>('huid');
  const [isGoldExchangeOpen, setIsGoldExchangeOpen] = useState(false);
  const [customerReviews, setCustomerReviews] = useState<any[]>([]);

  // Load product by ID on route param change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let isMounted = true;

    const loadProduct = async () => {
      if (!id) {
        setError('No product specified');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const item = await ApiService.getJewelryItemById(id);
        if (isMounted) {
          if (item) {
            setProduct(item);
            setSelectedWeight(item.weight || 10);
            const fallback = getJewelryFallbackImage(item.category, item.metal_type);
            setActiveImage(item.image_url || fallback);
          } else {
            setError(`Jewellery piece "${id}" was not found in our collections.`);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          // Fallback to local items if API fails
          const localItem = localJewelryItems.find(
            (i) => i.id === id || i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
          );
          if (localItem) {
            setProduct(localItem);
            setSelectedWeight(localItem.weight || 10);
            setActiveImage(localItem.image_url || getJewelryFallbackImage(localItem.category, localItem.metal_type));
          } else {
            setError(err.message || 'Unable to load product specifications.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Price calculations based on current weight and rate
  const pricingBreakdown = product
    ? calculateProductPrice(
        selectedWeight,
        product.metal_type,
        product.wastage_percent || 12,
        product.price,
        product.name
      )
    : null;

  // Use the established catalog price or dynamic revaluation based on custom weight
  const isCustomWeight = product && selectedWeight !== product.weight;
  const displayPrice = isCustomWeight && pricingBreakdown
    ? Math.round(pricingBreakdown.totalPrice)
    : (product?.price || (pricingBreakdown ? Math.round(pricingBreakdown.totalPrice) : 0));

  const originalMrp = Math.round(displayPrice * 1.06);
  const savingsAmount = originalMrp - displayPrice;
  const savingsPercent = Math.round((savingsAmount / originalMrp) * 100);

  const metalRateApplied = product?.metal_type === 'gold'
    ? (product.name.toLowerCase().includes('24k') ? rates.gold : rates.gold22k)
    : product?.metal_type === 'silver'
    ? rates.silver
    : product?.metal_type === 'platinum'
    ? rates.platinum
    : rates.gold22k;

  const netGoldWeight = product?.weight
    ? Math.round(product.weight * (product.metal_type === 'gold' ? 0.94 : 0.98) * 10) / 10
    : 0;

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (!product) return;
    const targetEl = document.getElementById('product-hero-image') || (e?.currentTarget as HTMLElement);
    for (let i = 0; i < quantity; i++) {
      addToCartWithAnimation(
        product.id,
        selectedWeight,
        targetEl,
        activeImage || product.image_url || '/images/cat_gold.jpg',
        product.name
      );
    }
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/?checkout=true');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'YAZHINI FINE JEWELS',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Fetch approved customer reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await supabase
          .from('customer_reviews')
          .select('*')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(4);
        if (data && data.length > 0) {
          setCustomerReviews(data);
        }
      } catch (err) {
        console.debug('Reviews load skipped:', err);
      }
    };
    fetchReviews();
  }, [id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePincode(pincodeInput)) {
      setPincodeStatus({
        checked: true,
        valid: false,
        deliveryText: 'Please enter a valid 6-digit Indian PIN code.'
      });
      return;
    }
    localStorage.setItem('yazhini_pincode', pincodeInput);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const dayName = days[deliveryDate.getDay()];
    const dateStr = deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    setPincodeStatus({
      checked: true,
      valid: true,
      deliveryText: `Express delivery to ${pincodeInput} by ${dayName}, ${dateStr} via BlueDart Insured Transit. Cash on Delivery available.`
    });
  };

  const isRing = Boolean(product?.category?.toLowerCase().includes('ring'));
  const isBangle = Boolean(product?.category?.toLowerCase().includes('bangle') || product?.category?.toLowerCase().includes('kada') || product?.category?.toLowerCase().includes('bracelet'));
  const ringSizes = ['10', '12', '14', '16', '18', '20', '22'];
  const bangleSizes = ['2.2', '2.4', '2.6', '2.8', '2.10'];

  // Related recommended products (excluding current one)
  const relatedProducts = product
    ? localJewelryItems
        .filter((item) => item.id !== product.id && (item.category === product.category || item.metal_type === product.metal_type))
        .slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-white dark:bg-[#120D0F] text-[#241B1D] dark:text-[#F8F3F4] flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 w-full">
        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[#777174] dark:text-[#C1B4B8] flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-[#450817] dark:hover:text-[#D8B878] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-[#777174] dark:text-[#C1B4B8]" />
          <Link to="/#catalog" className="hover:text-[#450817] dark:hover:text-[#D8B878] transition-colors">
            Catalogue
          </Link>
          {product && (
            <>
              <ChevronRight className="w-3 h-3 text-[#777174] dark:text-[#C1B4B8]" />
              <span className="capitalize">{product.category}</span>
              <ChevronRight className="w-3 h-3 text-[#777174] dark:text-[#C1B4B8]" />
              <span className="text-[#241B1D] dark:text-[#F8F3F4] font-medium truncate max-w-xs sm:max-w-md">
                {product.name}
              </span>
            </>
          )}
        </nav>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse pt-6">
            <div className="aspect-square bg-stone-200 dark:bg-[#20171A] rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-4 bg-stone-200 dark:bg-[#20171A] w-32 rounded"></div>
              <div className="h-10 bg-stone-200 dark:bg-[#20171A] w-3/4 rounded"></div>
              <div className="h-8 bg-stone-200 dark:bg-[#20171A] w-48 rounded"></div>
              <div className="h-28 bg-stone-200 dark:bg-[#20171A] rounded-xl"></div>
              <div className="h-12 bg-stone-200 dark:bg-[#20171A] rounded-xl"></div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!loading && (error || !product) && (
          <div className="p-12 sm:p-16 text-center bg-white dark:bg-[#24191D] border border-[#EAE5E6] dark:border-[#46343A] rounded-2xl shadow-sm max-w-xl mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-[#C6A15B] mx-auto mb-4" />
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#241B1D] dark:text-[#F8F3F4] mb-2">
              Jewellery Piece Unavailable
            </h2>
            <p className="text-sm text-[#777174] dark:text-[#C1B4B8] mb-6">
              {error || 'The requested jewellery piece could not be located in our inventory catalogue.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/#catalog')}
                className="px-6 py-3 bg-[#450817] hover:bg-[#6A1B2B] dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] border border-[#C6A15B]/40 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                Browse All Collections
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-[#EAE5E6] dark:border-[#46343A] text-[#241B1D] dark:text-[#F8F3F4] text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#FAF9F8] dark:hover:bg-[#302126] transition-all cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        )}

        {/* Active Product Details */}
        {!loading && product && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left Column: Image Showcase & Gallery (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div
                id="product-hero-image"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                className="relative aspect-[4/5] bg-white dark:bg-[#1B1316] rounded-2xl overflow-hidden border border-[#EAE5E6] dark:border-[#46343A] shadow-xs group flex items-center justify-center p-6 cursor-crosshair select-none"
              >
                <img
                  src={activeImage || product.image_url || getJewelryFallbackImage(product.category, product.metal_type)}
                  alt={product.name}
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                    transition: isZoomed ? 'none' : 'transform 0.4s ease-out'
                  }}
                  className="w-full h-full object-contain object-center will-change-transform pointer-events-none"
                />

                {/* Floating Hallmarking Badge */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#28030B]/90 dark:bg-[#120D0F]/90 backdrop-blur-md border border-[#C6A15B]/50 text-[#D8B878] text-[10px] font-sans font-semibold tracking-wider uppercase shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>{product.purity || 'BIS 916 Laser Hallmarked'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPurityInitialTab('huid');
                        setIsPurityEducationOpen(true);
                      }}
                      className="ml-1 text-[10px] text-[#C6A15B] hover:underline font-bold cursor-pointer"
                    >
                      (Verify HUID)
                    </button>
                  </div>
                </div>

                {/* Floating Wishlist Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md border transition-all ${
                      isInWishlist(product.id)
                        ? 'bg-[#450817] text-[#C6A15B] border-[#C6A15B]/60 scale-105'
                        : 'bg-white/95 dark:bg-[#24191D]/90 text-[#241B1D] dark:text-[#F8F3F4] border-[#EAE5E6] dark:border-[#46343A] hover:bg-white hover:text-[#450817] dark:hover:text-[#D8B878]'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Interactive Zoom Lens Pill */}
                <div className="absolute bottom-4 left-4 z-10 pointer-events-none transition-opacity">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 dark:bg-black/80 backdrop-blur-md text-white text-[10px] font-sans tracking-wider border border-white/10 shadow-xs">
                    <ZoomIn className="w-3.5 h-3.5 text-[#C6A15B]" />
                    <span>{isZoomed ? '2.2× Inspection Loupe Active' : 'Hover to Inspect Craftsmanship'}</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setActiveImage(product.image_url || '')}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 bg-white dark:bg-[#1B1316] p-1 transition-all shrink-0 cursor-pointer ${
                    activeImage === product.image_url
                      ? 'border-[#450817] dark:border-[#D8B878] ring-2 ring-[#C6A15B]/40 scale-102'
                      : 'border-[#EAE5E6] dark:border-[#46343A] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={product.image_url || getJewelryFallbackImage(product.category, product.metal_type)}
                    alt="Main view"
                    className="w-full h-full object-contain"
                  />
                </button>

                {product.secondary_image_url && (
                  <button
                    type="button"
                    onClick={() => setActiveImage(product.secondary_image_url || '')}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 bg-white dark:bg-[#1B1316] p-1 transition-all shrink-0 cursor-pointer ${
                      activeImage === product.secondary_image_url
                        ? 'border-[#450817] dark:border-[#D8B878] ring-2 ring-[#C6A15B]/40 scale-102'
                        : 'border-[#EAE5E6] dark:border-[#46343A] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={product.secondary_image_url}
                      alt="Alternate angle"
                      className="w-full h-full object-contain"
                    />
                  </button>
                )}
              </div>

              {/* Guarantees & Service Assurance */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#EAE5E6] dark:border-[#46343A] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPurityInitialTab('huid');
                    setIsPurityEducationOpen(true);
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C6A15B] flex flex-col items-center text-center transition-all cursor-pointer group"
                >
                  <ShieldCheck className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] text-[11px] group-hover:text-[#C6A15B]">BIS Hallmarked</span>
                  <span className="text-[10px] text-[#777174] dark:text-[#C1B4B8] underline">Verify HUID Seal</span>
                </button>
                <div className="p-3 rounded-xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] flex flex-col items-center text-center">
                  <Truck className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878] mb-1.5" />
                  <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] text-[11px]">Insured Shipping</span>
                  <span className="text-[10px] text-[#777174] dark:text-[#C1B4B8]">Free Transit Cover</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGoldExchangeOpen(true)}
                  className="p-3 rounded-xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C6A15B] flex flex-col items-center text-center transition-all cursor-pointer group"
                >
                  <RotateCcw className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] text-[11px] group-hover:text-[#C6A15B]">Lifetime Exchange</span>
                  <span className="text-[10px] text-[#777174] dark:text-[#C1B4B8] underline">100% Value Trade-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurityInitialTab('care');
                    setIsPurityEducationOpen(true);
                  }}
                  className="p-3 rounded-xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] hover:border-[#C6A15B] flex flex-col items-center text-center transition-all cursor-pointer group"
                >
                  <Sparkles className="w-5 h-5 text-[#C6A15B] dark:text-[#D8B878] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] text-[11px] group-hover:text-[#C6A15B]">Free Maintenance</span>
                  <span className="text-[10px] text-[#777174] dark:text-[#C1B4B8] underline">Ultrasonic Care Guide</span>
                </button>
              </div>
            </div>

            {/* Right Column: Pricing, Specifications, and Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Product Identity */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.22em] text-[#450817] dark:text-[#D8B878]">
                    {product.category} • {product.metal_type?.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-[#777174] dark:text-[#C1B4B8]">
                    SKU: {product.sku || `YZH-${(product.category || 'JWL').slice(0, 3).toUpperCase()}-${String(product.id || '').slice(0, 4).toUpperCase()}`}
                  </span>
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-normal text-[#241B1D] dark:text-[#F8F3F4] leading-snug tracking-[-0.01em]">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-amber-500 text-xs">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-xs text-[#777174] dark:text-[#C1B4B8]">
                    4.9 ({product.reviews_count || 42} verified customer reviews)
                  </span>
                </div>
              </div>

              {/* Price & Rate Anchor with Dual Pricing & Festive Patron Privilege */}
              <div className="p-5 rounded-2xl bg-[#FAF9F8] dark:bg-[#24191D] border border-[#EAE5E6] dark:border-[#46343A] shadow-xs">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-[#777174] dark:text-[#C1B4B8] block">
                    All-Inclusive Selling Price
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    In Stock
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <div className="price-featured text-3xl sm:text-4xl text-[#450817] dark:text-[#D8B878] font-bold tracking-tight">
                    {formatCurrencyINR(displayPrice)}
                  </div>
                  {originalMrp > displayPrice && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="line-through text-sm sm:text-base text-[#8C8286] dark:text-[#A89FA3] font-normal">
                        MRP {formatCurrencyINR(originalMrp)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#450817]/10 dark:bg-[#D8B878]/15 text-[#450817] dark:text-[#D8B878] border border-[#450817]/20 dark:border-[#D8B878]/30">
                        Save {formatCurrencyINR(savingsAmount)} ({savingsPercent}% Festive Privilege)
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[#777174] dark:text-[#C1B4B8] pt-1.5">
                  Inclusive of all statutory taxes (3% GST), hallmark registration, and insured courier.
                </p>

                {/* Live Metal Rate Benchmark Strip */}
                <div className="mt-4 pt-3.5 border-t border-[#EAE5E6] dark:border-[#46343A] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[#241B1D] dark:text-[#F8F3F4]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#C6A15B] dark:text-[#D8B878]" />
                    <span className="text-[#777174] dark:text-[#C1B4B8]">Applied Rate:</span>
                    <strong className="text-[#241B1D] dark:text-[#F8F3F4] font-semibold">
                      ₹{Math.round(metalRateApplied).toLocaleString('en-IN')}/g
                    </strong>
                    <span className="text-[#777174] dark:text-[#C1B4B8] text-[10px]">
                      ({product.metal_type === 'gold' ? (product.name.includes('24k') ? '24K' : '22K') : product.metal_type})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#777174] dark:text-[#C1B4B8]">
                    <Clock className="w-3 h-3" />
                    <span>{isLive ? 'Live verified' : 'Daily IBJA benchmark'}</span>
                  </div>
                </div>
              </div>

              {/* Weight Customizer (Preset & Revaluation) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4]">
                    Selected Product Weight
                  </span>
                  <span className="text-[#777174] dark:text-[#C1B4B8]">
                    Net Gold: {netGoldWeight}g
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[product.weight, 10, 15, 20, 30, 48].filter((w, idx, arr) => w > 0 && arr.indexOf(w) === idx).slice(0, 4).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeight(w)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        selectedWeight === w
                          ? 'bg-[#450817] text-white dark:bg-[#D8B878] dark:text-[#120D0F] border-[#450817] dark:border-[#D8B878] shadow-xs'
                          : 'bg-white dark:bg-[#20171A] text-[#241B1D] dark:text-[#F8F3F4] border-[#EAE5E6] dark:border-[#46343A] hover:border-[#450817] dark:hover:border-[#D8B878]'
                      }`}
                    >
                      {w} grams
                    </button>
                  ))}
                </div>
              </div>

              {/* Ring / Bangle Sizing Selector */}
              {(isRing || isBangle) && (
                <div className="space-y-2.5 pt-2 border-t border-[#EAE5E6] dark:border-[#46343A]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4]">
                      Select {isRing ? 'Ring Size (Indian standard)' : 'Bangle Size (Anna standard)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[11px] text-[#450817] dark:text-[#D8B878] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" /> Sizing Guide &amp; Fit Advisor
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(isRing ? ringSizes : bangleSizes).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedSize === s
                            ? 'bg-[#450817] text-white dark:bg-[#D8B878] dark:text-[#120D0F] border-[#450817] dark:border-[#D8B878] shadow-xs scale-102'
                            : 'bg-white dark:bg-[#20171A] text-[#241B1D] dark:text-[#F8F3F4] border-[#EAE5E6] dark:border-[#46343A] hover:border-[#450817] dark:hover:border-[#D8B878]'
                        }`}
                      >
                        Size {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transparent Price Breakdown Accordion */}
              {pricingBreakdown && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#1B1316] border border-[#EAE5E6] dark:border-[#46343A] space-y-2 text-xs">
                  <div className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] text-[11.5px] pb-1 border-b border-[#EAE5E6] dark:border-[#46343A]">
                    Transparent Price Breakdown
                  </div>
                  <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                    <span>Base Metal Value ({selectedWeight}g × {formatCurrencyINR(Math.round(metalRateApplied))}/g)</span>
                    <span className="number-supporting text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                      {formatCurrencyINR(pricingBreakdown.basePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                    <span>Making Charges &amp; Artistry ({product.wastage_percent || 12}%)</span>
                    <span className="number-supporting text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                      {formatCurrencyINR(pricingBreakdown.wastageAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#777174] dark:text-[#C1B4B8]">
                    <span>Statutory GST (1.5% CGST + 1.5% SGST)</span>
                    <span className="number-supporting text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                      {formatCurrencyINR(pricingBreakdown.cgst + pricingBreakdown.sgst)}
                    </span>
                  </div>
                  {originalMrp > displayPrice && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                      <span>Festive Patron Privilege (Online Direct)</span>
                      <span>- {formatCurrencyINR(savingsAmount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#EAE5E6] dark:border-[#46343A] flex justify-between font-semibold text-[#241B1D] dark:text-[#F8F3F4] items-baseline">
                    <span>Total Calculated Value</span>
                    <span className="price-total text-base text-[#450817] dark:text-[#D8B878]">{formatCurrencyINR(displayPrice)}</span>
                  </div>
                </div>
              )}

              {/* Quantity and Primary Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* Quantity Counter */}
                  <div className="inline-flex items-center border border-[#EAE5E6] dark:border-[#46343A] rounded-xl bg-white dark:bg-[#20171A] p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#777174] dark:text-[#C1B4B8] hover:bg-[#FAF9F8] dark:hover:bg-[#302126] disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-semibold text-xs text-[#241B1D] dark:text-[#F8F3F4]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#777174] dark:text-[#C1B4B8] hover:bg-[#FAF9F8] dark:hover:bg-[#302126] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#450817] hover:bg-[#6A1B2B] dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] text-white dark:text-[#120D0F] border border-[#C6A15B]/40 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#C6A15B] dark:text-[#120D0F]" />
                    <span>Add to Bag</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-11 h-11 rounded-xl border border-[#EAE5E6] dark:border-[#46343A] hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-[#20171A] flex items-center justify-center text-[#241B1D] dark:text-[#F8F3F4] transition-colors cursor-pointer"
                    title="Share this jewellery piece"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Instant Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3 px-5 rounded-xl border border-[#C6A15B] hover:bg-[#FAF9F8] dark:hover:bg-[#302126] text-[#450817] dark:text-[#D8B878] text-xs font-semibold uppercase tracking-widest transition-all bg-white dark:bg-[#20171A] shadow-xs cursor-pointer"
                >
                  Buy Now with 100% Insured Delivery
                </button>
              </div>

              {/* Pincode Delivery Estimator */}
              <div className="p-4 rounded-xl bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#241B1D] dark:text-[#F8F3F4] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#C6A15B]" /> Delivery &amp; Pincode Verification
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                    Complimentary Insured
                  </span>
                </div>
                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-3.5 h-3.5 text-[#777174] dark:text-[#C1B4B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit PIN code"
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#120D0F] border border-[#EAE5E6] dark:border-[#46343A] rounded-xl text-xs text-[#241B1D] dark:text-[#F8F3F4] outline-none focus:border-[#C6A15B]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Check
                  </button>
                </form>
                {pincodeStatus && (
                  <div className={`text-[11px] flex items-start gap-1.5 pt-1 ${pincodeStatus.valid ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'}`}>
                    {pincodeStatus.valid ? <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />}
                    <span>{pincodeStatus.deliveryText}</span>
                  </div>
                )}
              </div>

              {/* Joyalukkas VIP In-Store & Video Concierge */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAF9F8] to-[#F5EFE6] dark:from-[#20171A] dark:to-[#170E12] border border-[#C6A15B]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-[#C6A15B] uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> ROYAL BOUTIQUE PRIVILEGE
                  </span>
                  <span className="text-[10px] text-[#777174] dark:text-[#C1B4B8]">Chennai • Coimbatore • Madurai</span>
                </div>
                <p className="text-xs text-[#241B1D] dark:text-[#F8F3F4] font-serif leading-relaxed">
                  Experience this jewellery creation in person at our emporium or schedule a private 1-on-1 live video shopping call with our certified gemologists.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentService('In-Store Jewellery Trial & Styling');
                      setIsStoreLocatorOpen(true);
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-[#450817] dark:border-[#D8B878] text-[#450817] dark:text-[#D8B878] bg-white dark:bg-[#120D0F] hover:bg-[#450817] hover:text-white dark:hover:bg-[#D8B878] dark:hover:text-[#120D0F] text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Book In-Store Trial
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentService('Live Video Shopping Consultation');
                      setIsStoreLocatorOpen(true);
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-[#C6A15B] text-[#450817] dark:text-[#D8B878] bg-white dark:bg-[#120D0F] hover:bg-[#C6A15B]/15 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5 text-[#C6A15B]" /> Video Call Shopping
                  </button>
                </div>
              </div>

              {/* Toast Feedback */}
              {addedToCartToast && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Added {quantity} × {product.name} to your shopping bag!</span>
                </div>
              )}

              {/* Product Specifications Table */}
              <div className="pt-4 border-t border-[#EAE5E6] dark:border-[#46343A]">
                <h3 className="font-serif text-base font-medium text-[#241B1D] dark:text-[#F8F3F4] mb-3">
                  Jewellery Specifications
                </h3>
                <dl className="grid grid-cols-2 gap-y-2 text-xs">
                  <dt className="text-[#777174] dark:text-[#C1B4B8]">Metal &amp; Purity</dt>
                  <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                    {product.purity || '22K (BIS 916)'}
                  </dd>

                  <dt className="text-[#777174] dark:text-[#C1B4B8]">Gross Weight</dt>
                  <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                    {product.weight} grams
                  </dd>

                  <dt className="text-[#777174] dark:text-[#C1B4B8]">Net Metal Weight</dt>
                  <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                    {netGoldWeight} grams
                  </dd>

                  <dt className="text-[#777174] dark:text-[#C1B4B8]">Category</dt>
                  <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium capitalize">
                    {product.category}
                  </dd>

                  {product.stone_details && (
                    <>
                      <dt className="text-[#777174] dark:text-[#C1B4B8]">Gemstone &amp; Accents</dt>
                      <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                        {product.stone_details}
                      </dd>
                    </>
                  )}

                  {product.collection && (
                    <>
                      <dt className="text-[#777174] dark:text-[#C1B4B8]">Royal Collection</dt>
                      <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                        {product.collection}
                      </dd>
                    </>
                  )}

                  <dt className="text-[#777174] dark:text-[#C1B4B8]">Hallmarking ID</dt>
                  <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-mono text-[11px]">
                    HUID-916-YAZH-{(product.id.slice(0, 6)).toUpperCase()}
                  </dd>

                  <dt className="text-[#777174] dark:text-[#C1B4B8]">Dispatch Window</dt>
                  <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                    24 - 48 Hours Insured
                  </dd>

                  {product.care_instructions && (
                    <>
                      <dt className="text-[#777174] dark:text-[#C1B4B8]">Care &amp; Storage</dt>
                      <dd className="text-[#241B1D] dark:text-[#F8F3F4] font-medium">
                        {product.care_instructions}
                      </dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-4 border-t border-[#EAE5E6] dark:border-[#46343A] text-xs text-[#777174] dark:text-[#C1B4B8] leading-relaxed">
                  <h3 className="font-serif text-base font-medium text-[#241B1D] dark:text-[#F8F3F4] mb-2">
                    Curator’s Craftsmanship Note
                  </h3>
                  <p>{product.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related / Recommended Pieces */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 pt-12 border-t border-[#EAE5E6] dark:border-[#46343A]">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[10.5px] uppercase font-sans font-bold tracking-[0.25em] text-[#450817] dark:text-[#D8B878] block mb-1">
                Curated Companions
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#241B1D] dark:text-[#F8F3F4]">
                You May Also Admire
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {relatedProducts.map((item) => (
                <SignatureLuxuryCard
                  key={item.id}
                  product={item}
                  onQuickView={(p) => navigate(`/product/${p.id}`)}
                  onAddToCart={(p) => addToCart(p.id, p.weight)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Verified Customer Reviews Section */}
        <section className="mt-20 pt-12 border-t border-[#EAE5E6] dark:border-[#46343A]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.22em] text-[#C6A15B] block mb-1">
                PATRON TESTIMONIALS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#241B1D] dark:text-[#F8F3F4]">
                Customer Reviews &amp; Experiences
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-amber-500 text-sm">
                  {'★'.repeat(5)}
                </div>
                <span className="text-xs font-semibold text-[#241B1D] dark:text-[#F8F3F4]">
                  4.9 out of 5
                </span>
                <span className="text-xs text-[#777174] dark:text-[#C1B4B8]">
                  • Verified Hallmark Purchases
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <MessageSquareQuote className="w-4 h-4 text-[#C6A15B] dark:text-[#120D0F]" />
              <span>Write a Review</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(customerReviews.length > 0 ? customerReviews : [
              {
                id: '1',
                author: 'Dr. Meenakshi Sundaram, Chennai',
                quote: 'The craftsmanship of the temple haram exceeded all our wedding expectations. Laser hallmark verified and delivered with high security insured courier.',
                stars: 5,
                item_purchased: product?.name || 'Heritage Gold Creation',
                created_at: '2026-10-15'
              },
              {
                id: '2',
                author: 'Kavitha R., Bangalore',
                quote: 'Loved the transparent pricing breakdown with real-time gold rates. The fit on the bangle was flawless thanks to the online sizing guide.',
                stars: 5,
                item_purchased: 'Royal Collection',
                created_at: '2026-10-10'
              },
              {
                id: '3',
                author: 'Arun & Divya, Coimbatore',
                quote: 'Had a private video shopping call with their gemologist before buying our wedding bands. Very courteous service and pristine hallmarked quality.',
                stars: 5,
                item_purchased: 'Diamond & Gold Rings',
                created_at: '2026-10-02'
              }
            ]).map((rev, idx) => (
              <div
                key={rev.id || idx}
                className="p-5 rounded-2xl bg-[#FAF9F8] dark:bg-[#1E1518] border border-[#EAE5E6] dark:border-[#46343A] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex text-amber-500 text-xs">
                      {Array.from({ length: rev.stars || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ✓ Verified Buyer
                    </span>
                  </div>
                  <p className="text-xs text-[#241B1D] dark:text-[#F8F3F4] leading-relaxed italic">
                    "{rev.quote}"
                  </p>
                </div>
                <div className="pt-3 border-t border-[#EAE5E6] dark:border-[#46343A] text-[11px]">
                  <p className="font-semibold text-[#241B1D] dark:text-[#F8F3F4]">{rev.author}</p>
                  <p className="text-[10px] text-[#777174] dark:text-[#C1B4B8] truncate">{rev.item_purchased || product?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modals Suite */}
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          defaultTab={isBangle ? 'bangle' : 'ring'}
          onSelectSize={(size) => setSelectedSize(size)}
        />

        <StoreLocatorModal
          isOpen={isStoreLocatorOpen}
          onClose={() => setIsStoreLocatorOpen(false)}
          defaultTab="book"
          initialService={appointmentService}
        />

        <CustomerReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onReviewSubmitted={(newRev) => {
            setCustomerReviews((prev) => [
              {
                id: `local-${Date.now()}`,
                author: newRev.author,
                quote: newRev.quote,
                stars: newRev.stars,
                item_purchased: newRev.itemPurchased || product?.name,
                created_at: new Date().toISOString()
              },
              ...prev
            ]);
          }}
        />

        <PurityEducationModal
          isOpen={isPurityEducationOpen}
          onClose={() => setIsPurityEducationOpen(false)}
          initialTab={purityInitialTab}
        />

        <GoldExchangeModal
          isOpen={isGoldExchangeOpen}
          onClose={() => setIsGoldExchangeOpen(false)}
          onBookAppointment={() => {
            setIsGoldExchangeOpen(false);
            setAppointmentService('In-Store Jewellery Trial & Styling');
            setIsStoreLocatorOpen(true);
          }}
        />
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
