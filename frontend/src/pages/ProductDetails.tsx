import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Truck,
  Sparkles,
  ShoppingCart,
  ChevronRight,
  Share2,
  Check,
  AlertCircle,
  MapPin,
  Video,
  ArrowRight
} from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { ApiService } from '../services/apiService';
import { localJewelryItems } from '../utils/localData';
import { useRates } from '../context/RateContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrencyINR } from '../utils/formatters';
import { SignatureLuxuryCard } from '../components/cards/SignatureLuxuryCard';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { validatePincode } from '../utils/validation';
import { StoreLocatorModal } from '../components/StoreLocatorModal';
import { SizeGuideModal } from '../components/SizeGuideModal';
import { CustomerReviewModal } from '../components/CustomerReviewModal';
import { PurityEducationModal } from '../components/PurityEducationModal';
import { GoldExchangeModal } from '../components/GoldExchangeModal';
import { PriceBreakdownExplainerModal } from '../components/PriceBreakdownExplainerModal';
import { BackButton } from '../components/ui/BackButton';
import { RevealHeading } from '../components/ui/text-animations';
import { toast } from '../utils/toast';
import { platformSyncService } from '../services/platformSyncService';

// Subcomponents for luxury product detail experience
import { ProductImageGallery } from '../components/product/ProductImageGallery';
import { 
  ProductCustomizer, 
  GoldPurityOption, 
  MetalColorOption, 
  StoneGradeOption 
} from '../components/product/ProductCustomizer';
import { PriceBreakdownCard } from '../components/product/PriceBreakdownCard';
import { ProductTrustBadges } from '../components/product/ProductTrustBadges';
import { ProductTabsSection } from '../components/product/ProductTabsSection';
import { MatchingSetBundle } from '../components/product/MatchingSetBundle';
import { MiniCartDrawer } from '../components/product/MiniCartDrawer';
import { ProductImage } from '../components/common/ProductImage';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { rates, isLive, isStale } = useRates();
  const { addToCartWithAnimation, totalItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Core Product State
  const [product, setProduct] = useState<JewelryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customization States
  const [selectedPurity, setSelectedPurity] = useState<GoldPurityOption>('22K');
  const [selectedMetalColor, setSelectedMetalColor] = useState<MetalColorOption>('yellow_gold');
  const [selectedWeight, setSelectedWeight] = useState<number>(10);
  const [selectedSize, setSelectedSize] = useState<string>('14');
  const [selectedStoneGrade, setSelectedStoneGrade] = useState<StoneGradeOption>('natural_vvs');
  const [quantity, setQuantity] = useState<number>(1);

  // Modals & Drawers States
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);
  const [appointmentService, setAppointmentService] = useState('In-Store Jewellery Trial & Styling');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPurityEducationOpen, setIsPurityEducationOpen] = useState(false);
  const [purityInitialTab, setPurityInitialTab] = useState<'huid' | '4cs' | 'metals' | 'care'>('huid');
  const [isGoldExchangeOpen, setIsGoldExchangeOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  // Feedback & Pincode States
  const [copiedLink, setCopiedLink] = useState(false);
  const [pincodeInput, setPincodeInput] = useState(() => localStorage.getItem('yazhini_pincode') || '600017');
  const [pincodeStatus, setPincodeStatus] = useState<{ checked: boolean; valid: boolean; deliveryText?: string } | null>({
    checked: true,
    valid: true,
    deliveryText: 'Express Insured Delivery in 2-3 Business Days via BlueDart / Sequel Express. Cash on Delivery eligible.'
  });
  const [customerReviews, setCustomerReviews] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<JewelryItem[]>([]);

  // 1. Load Product Data (from ApiService or local fallbacks)
  const loadProductData = useCallback(async () => {
    if (!id) {
      setError('No product specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const item = await ApiService.getJewelryItemById(id);
      if (item) {
        const isPreview = searchParams.get('preview') === 'true';
        if (!isPreview && (item.status === 'archived' || item.status === 'draft')) {
          setError(`This luxury design is currently unavailable (${item.status}).`);
          setLoading(false);
          return;
        }

        setProduct(item);
        setSelectedWeight(item.weight || 10);
        // Set initial purity if available in item definition
        if (item.name?.toLowerCase().includes('24k')) setSelectedPurity('24K');
        else if (item.purity?.includes('18K')) setSelectedPurity('18K');
        else if (item.purity?.includes('14K')) setSelectedPurity('14K');
        else setSelectedPurity('22K');
      } else {
        // Fallback to local items
        const localItem = localJewelryItems.find(
          (i) => i.id === id || i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
        );
        if (localItem) {
          setProduct(localItem);
          setSelectedWeight(localItem.weight || 10);
          if (localItem.name?.toLowerCase().includes('24k')) setSelectedPurity('24K');
          else if (localItem.purity?.includes('18K')) setSelectedPurity('18K');
          else setSelectedPurity('22K');
        } else {
          setError(`Jewellery piece "${id}" was not found in our collections.`);
        }
      }
    } catch (err: any) {
      console.warn('Error loading product, using fallback:', err);
      const localItem = localJewelryItems.find(
        (i) => i.id === id || i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase()
      );
      if (localItem) {
        setProduct(localItem);
        setSelectedWeight(localItem.weight || 10);
      } else {
        setError(err.message || 'Unable to load product specifications.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProductData();
  }, [loadProductData]);

  // 2. Real-time Live Synchronization with Admin Portal
  useEffect(() => {
    const unsub = platformSyncService.subscribe('ecommerce', (payload) => {
      if (payload.entityType === 'product') {
        // If the edited or updated product is this current product, refresh seamlessly
        if (!payload.entityId || payload.entityId === id) {
          loadProductData();
          toast.info('Product details updated in real time by Admin Portal.');
        }
      }
    });

    return () => unsub();
  }, [id, loadProductData]);

  // 3. Track Recently Viewed in localStorage
  useEffect(() => {
    if (!product) return;
    try {
      const storageKey = 'yazhini_recently_viewed_products';
      const existingRaw = localStorage.getItem(storageKey);
      const existingIds: string[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedIds = [product.id, ...existingIds.filter((item) => item !== product.id)].slice(0, 6);
      localStorage.setItem(storageKey, JSON.stringify(updatedIds));

      // Resolve items
      const resolved = updatedIds
        .map((viewedId) => localJewelryItems.find((p) => p.id === viewedId))
        .filter((p): p is JewelryItem => Boolean(p && p.id !== product.id))
        .slice(0, 4);

      setRecentlyViewed(resolved);
    } catch (e) {
      console.debug('Recently viewed storage error:', e);
    }
  }, [product]);

  // 4. Fetch Approved Customer Reviews
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

  // 5. Authoritative Live Price Calculation
  const appliedMetalRate = useMemo(() => {
    if (!product) return rates.gold22k;

    if (product.metal_type === 'silver') return rates.silver;
    if (product.metal_type === 'platinum') return rates.platinum;

    // Gold purity calculation
    switch (selectedPurity) {
      case '24K':
        return rates.gold;
      case '18K':
        return rates.gold18k || Math.round(rates.gold * (18 / 24));
      case '14K':
        return Math.round(rates.gold * (14 / 24));
      case '22K':
      default:
        return rates.gold22k;
    }
  }, [product, rates, selectedPurity]);

  // Derive precise itemized pricing
  const pricingDetails = useMemo(() => {
    if (!product) return null;

    const netWeight = Math.round(selectedWeight * (product.metal_type === 'gold' ? 0.94 : 0.98) * 10) / 10;
    const baseMetalValue = Math.round(netWeight * appliedMetalRate);

    // Stone and diamond value
    let stoneVal = 0;
    if (product.stone_details?.toLowerCase().includes('diamond') || product.category.toLowerCase().includes('diamond')) {
      stoneVal = selectedStoneGrade === 'natural_vvs' ? 38000 : 18000;
    } else if (product.stone_details) {
      stoneVal = 12000;
    }

    const wastagePercent = product.wastage_percent || 12;
    const rawMakingCharges = Math.round(baseMetalValue * (wastagePercent / 100));

    // 20% Festive Privilege discount on Making Charges (ROYAL20 campaign)
    const promoDiscount = Math.round(rawMakingCharges * 0.2);
    const effectiveMakingCharges = rawMakingCharges - promoDiscount;

    const subtotal = baseMetalValue + stoneVal + effectiveMakingCharges;
    const statutoryGst = Math.round(subtotal * 0.03); // 3% GST on jewellery in India
    const totalPayable = subtotal + statutoryGst;

    // Original MRP for fair transparency comparison
    const originalMrp = Math.round((baseMetalValue + stoneVal + rawMakingCharges) * 1.03 * 1.06);
    const savingsAmount = originalMrp - totalPayable;
    const savingsPercent = Math.max(5, Math.round((savingsAmount / originalMrp) * 100));

    return {
      netWeight,
      baseMetalValue,
      stoneValue: stoneVal,
      makingCharges: rawMakingCharges,
      makingChargePercent: wastagePercent,
      promotionalDiscount: promoDiscount,
      gstAmount: statutoryGst,
      totalPayable,
      originalMrp,
      savingsAmount,
      savingsPercent
    };
  }, [product, selectedWeight, appliedMetalRate, selectedStoneGrade]);

  const displayPrice = pricingDetails?.totalPayable || product?.price || 0;
  const originalMrp = pricingDetails?.originalMrp || Math.round(displayPrice * 1.08);
  const savingsAmount = pricingDetails?.savingsAmount || originalMrp - displayPrice;
  const savingsPercent = pricingDetails?.savingsPercent || 8;

  const isOutOfStock = Boolean(
    product && (product.in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0))
  );

  // 6. Companion / Frequently Bought Together Pairing
  const companionProduct = useMemo(() => {
    if (!product) return null;
    const isNecklaceOrBridal = product.category.toLowerCase().includes('necklace') || product.category.toLowerCase().includes('bridal');
    const isEarring = product.category.toLowerCase().includes('earring');
    const isBangle = product.category.toLowerCase().includes('bangle') || product.category.toLowerCase().includes('kada');

    // Find complementary category
    return localJewelryItems.find((item) => {
      if (item.id === product.id) return false;
      if (isNecklaceOrBridal) return item.category.toLowerCase().includes('earring') || item.category.toLowerCase().includes('jhumka');
      if (isEarring) return item.category.toLowerCase().includes('necklace') || item.category.toLowerCase().includes('choker');
      if (isBangle) return item.category.toLowerCase().includes('earring') || item.category.toLowerCase().includes('ring');
      return item.metal_type === product.metal_type;
    }) || localJewelryItems.find((item) => item.id !== product.id) || null;
  }, [product]);

  // 7. Curated Recommendations ("You May Also Like")
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return localJewelryItems
      .filter((item) => item.id !== product.id && (item.category === product.category || item.metal_type === product.metal_type))
      .slice(0, 3);
  }, [product]);

  // 8. Purchase Handlers
  const handleAddToCart = (e?: React.MouseEvent) => {
    if (!product || isOutOfStock) return;
    const targetEl = document.getElementById('product-hero-image') || (e?.currentTarget as HTMLElement);

    for (let i = 0; i < quantity; i++) {
      addToCartWithAnimation(
        product.id,
        selectedWeight,
        targetEl,
        product.image_url || '/images/cat_gold.jpg',
        product.name
      );
    }

    setIsMiniCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    handleAddToCart();
    navigate('/checkout');
  };

  const handleAddBundleToCart = (primary: JewelryItem, companion: JewelryItem) => {
    const targetEl = document.getElementById('product-hero-image');
    addToCartWithAnimation(primary.id, selectedWeight, targetEl, primary.image_url ?? undefined, primary.name);
    addToCartWithAnimation(companion.id, companion.weight, targetEl, companion.image_url ?? undefined, companion.name);
    toast.success('Royal Ensemble bundle added to your shopping bag with 5% savings!');
    setIsMiniCartOpen(true);
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
      toast.success('Product link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
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
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const dateFormatted = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    setPincodeStatus({
      checked: true,
      valid: true,
      deliveryText: `Express Insured Delivery to PIN ${pincodeInput} by ${dateFormatted} via BlueDart / Sequel Apex. Cash on Delivery eligible.`
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#140E10] text-[#252329] dark:text-[#FAF7F1] flex flex-col font-sans transition-colors duration-200">
      <main className="flex-1 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 w-full">
        {/* Top Breadcrumb & Return Action */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <BackButton fallbackPath="/jewellery" label="Back to Collections" variant="pill" />
          <nav aria-label="Breadcrumb" className="text-xs text-[#716A6C] dark:text-[#B5ABB0] flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-[#5B1022] dark:hover:text-[#C49A50] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-[#716A6C] dark:text-[#B5ABB0]" />
            <Link to="/#catalog" className="hover:text-[#5B1022] dark:hover:text-[#C49A50] transition-colors">
              Catalogue
            </Link>
            {product && (
              <>
                <ChevronRight className="w-3 h-3 text-[#716A6C] dark:text-[#B5ABB0]" />
                <span className="capitalize">{product.category}</span>
                <ChevronRight className="w-3 h-3 text-[#716A6C] dark:text-[#B5ABB0]" />
                <span className="font-semibold text-[#5B1022] dark:text-[#C49A50] truncate max-w-xs sm:max-w-md">
                  {product.name}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse pt-4">
            <div className="lg:col-span-7 aspect-[4/5] bg-stone-100 dark:bg-[#1D1418] rounded-3xl" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-4 bg-stone-100 dark:bg-[#1D1418] w-32 rounded-lg" />
              <div className="h-10 bg-stone-100 dark:bg-[#1D1418] w-3/4 rounded-xl" />
              <div className="h-28 bg-stone-100 dark:bg-[#1D1418] rounded-2xl" />
              <div className="h-40 bg-stone-100 dark:bg-[#1D1418] rounded-2xl" />
              <div className="h-12 bg-stone-100 dark:bg-[#1D1418] rounded-2xl" />
            </div>
          </div>
        )}

        {/* Product Not Found / Error */}
        {!loading && (error || !product) && (
          <div className="p-12 sm:p-16 text-center bg-[#FAF7F1] dark:bg-[#1C1216] border border-[#E7DEC8] dark:border-[#3E2D34] rounded-3xl shadow-sm max-w-xl mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-[#C49A50] mx-auto mb-4" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5B1022] dark:text-[#C49A50] mb-2">
              Jewellery Piece Unavailable
            </h2>
            <p className="text-sm text-[#716A6C] dark:text-[#B5ABB0] mb-6">
              {error || 'The requested jewellery piece could not be located in our inventory catalogue.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <BackButton fallbackPath="/jewellery" label="Browse All Collections" variant="pill" />
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-[#E7DEC8] dark:border-[#3E2D34] text-[#252329] dark:text-[#FAF7F1] text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-white dark:hover:bg-[#251A20] transition-all cursor-pointer"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        )}

        {/* Active Product Luxury Showcase Grid */}
        {!loading && product && (
          <div className="space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column: Multi-Angle Image & Video Gallery (7 cols) */}
              <div className="lg:col-span-7">
                <ProductImageGallery
                  product={product}
                  isInWishlist={isInWishlist(product.id)}
                  onToggleWishlist={() => toggleWishlist(product.id)}
                  onOpenHuidModal={() => {
                    setPurityInitialTab('huid');
                    setIsPurityEducationOpen(true);
                  }}
                  onOpenVideoConsultModal={() => {
                    setAppointmentService('1-on-1 Virtual Video Consultation');
                    setIsStoreLocatorOpen(true);
                  }}
                />
              </div>

              {/* Right Column: Information, Customizer, Pricing, Actions (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Product Identity Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-[0.2em] bg-[#5B1022]/10 dark:bg-[#C49A50]/15 text-[#5B1022] dark:text-[#C49A50] border border-[#5B1022]/20 dark:border-[#C49A50]/30">
                      <Sparkles className="w-3 h-3 text-[#C49A50]" />
                      <span>{product.collection || 'Royal Heritage Collection'} • {product.category}</span>
                    </span>

                    <span className="font-mono text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
                      SKU: {product.sku || `YZH-${(product.id.slice(0, 6)).toUpperCase()}`}
                    </span>
                  </div>

                  <RevealHeading
                    as="h1"
                    variant="line"
                    className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#252329] dark:text-[#FAF7F1] leading-tight tracking-tight"
                  >
                    {product.name}
                  </RevealHeading>

                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex text-amber-500 text-xs">
                      {'★'.repeat(5)}
                    </div>
                    <span className="text-xs font-bold text-[#252329] dark:text-[#FAF7F1]">
                      4.9
                    </span>
                    <span className="text-xs text-[#716A6C] dark:text-[#B5ABB0]">
                      ({product.reviews_count || 42} verified hallmark purchases)
                    </span>
                  </div>
                </div>

                {/* Live Transparent Price Breakdown Card */}
                <PriceBreakdownCard
                  sellingPrice={displayPrice}
                  originalMrp={originalMrp}
                  savingsAmount={savingsAmount}
                  savingsPercent={savingsPercent}
                  baseMetalValue={pricingDetails?.baseMetalValue || 0}
                  stoneValue={pricingDetails?.stoneValue || 0}
                  makingCharges={pricingDetails?.makingCharges || 0}
                  makingChargePercent={pricingDetails?.makingChargePercent || 12}
                  gstAmount={pricingDetails?.gstAmount || 0}
                  promotionalDiscount={pricingDetails?.promotionalDiscount || 0}
                  appliedMetalRate={appliedMetalRate}
                  metalPurityLabel={`${selectedPurity} (${product.metal_type?.toUpperCase()})`}
                  isLiveRate={isLive}
                  isStaleRate={isStale}
                  rateTimestamp={rates ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined}
                  inStock={!isOutOfStock}
                  stockQuantity={product.stock_quantity}
                  onOpenExplainerModal={() => setIsExplainerOpen(true)}
                />

                {/* Interactive Product Customizer */}
                <ProductCustomizer
                  product={product}
                  selectedPurity={selectedPurity}
                  onChangePurity={setSelectedPurity}
                  selectedMetalColor={selectedMetalColor}
                  onChangeMetalColor={setSelectedMetalColor}
                  selectedWeight={selectedWeight}
                  onChangeWeight={setSelectedWeight}
                  selectedSize={selectedSize}
                  onChangeSize={setSelectedSize}
                  selectedStoneGrade={selectedStoneGrade}
                  onChangeStoneGrade={setSelectedStoneGrade}
                  quantity={quantity}
                  onChangeQuantity={setQuantity}
                  maxQuantity={product.stock_quantity || 10}
                  onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
                />

                {/* Primary Purchase Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`flex-1 py-3.5 px-6 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-md transition-all ${
                        isOutOfStock
                          ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 dark:text-stone-400 cursor-not-allowed border-none'
                          : 'bg-[#5B1022] hover:bg-[#7A1930] text-white dark:bg-[#C49A50] dark:hover:bg-[#D5AD63] dark:text-[#140E10] border border-[#C49A50]/40 hover:scale-[1.01] cursor-pointer'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4 text-[#C49A50] dark:text-[#140E10]" />
                      <span>{isOutOfStock ? 'Sold Out / Out of Stock' : 'Add to Bag'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-12 h-12 rounded-2xl border border-[#E7DEC8] dark:border-[#3E2D34] hover:border-[#C49A50] bg-[#FAF7F1] dark:bg-[#1A1215] flex items-center justify-center text-[#252329] dark:text-[#FAF7F1] transition-all cursor-pointer hover:scale-105 shrink-0"
                      title="Share this creation"
                      aria-label="Share product"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className={`w-full py-3.5 px-6 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all shadow-xs flex items-center justify-center gap-2 ${
                      isOutOfStock
                        ? 'border-stone-300 dark:border-stone-800 text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-900 cursor-not-allowed'
                        : 'border-[#C49A50] hover:bg-[#FAF7F1] dark:hover:bg-[#201519] text-[#5B1022] dark:text-[#C49A50] bg-white dark:bg-[#170E12] cursor-pointer hover:shadow-sm'
                    }`}
                  >
                    <span>{isOutOfStock ? 'Temporarily Unavailable' : 'Buy Now with Insured Delivery'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pincode & Express Delivery Verification */}
                <div className="p-4 rounded-2xl bg-[#FAF7F1] dark:bg-[#1A1215] border border-[#E7DEC8] dark:border-[#3E2D34] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#252329] dark:text-[#FAF7F1] flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#C49A50]" />
                      <span>Delivery &amp; Pincode Verification</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      Free Insured Courier
                    </span>
                  </div>

                  <form onSubmit={handleCheckPincode} className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="w-3.5 h-3.5 text-[#716A6C] dark:text-[#B5ABB0] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit Indian PIN code"
                        value={pincodeInput}
                        onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] rounded-xl text-xs text-[#252329] dark:text-[#FAF7F1] outline-none focus:border-[#C49A50] font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#5B1022] hover:bg-[#7A1930] text-white dark:bg-[#C49A50] dark:hover:bg-[#D5AD63] dark:text-[#140E10] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Check
                    </button>
                  </form>

                  {pincodeStatus && (
                    <div className={`text-[11px] flex items-start gap-1.5 pt-0.5 ${pincodeStatus.valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {pincodeStatus.valid ? <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />}
                      <span>{pincodeStatus.deliveryText}</span>
                    </div>
                  )}
                </div>

                {/* Royal Emporium & 1-on-1 Video Consultation Privileges */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF7F1] to-[#F5EFE6] dark:from-[#1D1418] dark:to-[#120B0E] border border-[#C49A50]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-[#C49A50] uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#C49A50]" /> ROYAL BOUTIQUE CONCIERGE
                    </span>
                    <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0]">
                      Chennai • Coimbatore • Madurai
                    </span>
                  </div>

                  <p className="text-xs text-[#252329] dark:text-[#FAF7F1] leading-relaxed">
                    Preview this piece in person at our royal emporium or book a private 1-on-1 video appointment with our certified gemologists.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAppointmentService('In-Store Jewellery Trial & Styling');
                        setIsStoreLocatorOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-[#5B1022] dark:border-[#C49A50] text-[#5B1022] dark:text-[#C49A50] bg-white dark:bg-[#140E10] hover:bg-[#5B1022] hover:text-white dark:hover:bg-[#C49A50] dark:hover:text-[#140E10] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Book In-Store Trial</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAppointmentService('Live Video Shopping Consultation');
                        setIsStoreLocatorOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-[#C49A50] text-[#5B1022] dark:text-[#C49A50] bg-white dark:bg-[#140E10] hover:bg-[#C49A50]/15 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5 text-[#C49A50]" />
                      <span>Video Call Shopping</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Trust & Patron Benefits Bar */}
            <ProductTrustBadges
              onOpenHuidModal={() => {
                setPurityInitialTab('huid');
                setIsPurityEducationOpen(true);
              }}
              onOpenCareGuide={() => {
                setPurityInitialTab('care');
                setIsPurityEducationOpen(true);
              }}
              onOpenExchangeModal={() => setIsGoldExchangeOpen(true)}
            />

            {/* Complete the Royal Set (Frequently Bought Together Bundle) */}
            {companionProduct && (
              <MatchingSetBundle
                primaryProduct={product}
                primaryPrice={displayPrice}
                companionProduct={companionProduct}
                companionPrice={Math.round((companionProduct.price || 45000))}
                onAddBundleToCart={handleAddBundleToCart}
              />
            )}

            {/* Comprehensive 8-Tab Information Section */}
            <ProductTabsSection
              product={product}
              selectedWeight={selectedWeight}
              selectedPurity={selectedPurity}
              displayPrice={displayPrice}
              baseMetalValue={pricingDetails?.baseMetalValue || 0}
              makingCharges={pricingDetails?.makingCharges || 0}
              gstAmount={pricingDetails?.gstAmount || 0}
              reviews={customerReviews}
              onWriteReview={() => setIsReviewModalOpen(true)}
            />

            {/* Curated Recommendations ("You May Also Like") */}
            {relatedProducts.length > 0 && (
              <section className="pt-6 border-t border-[#E7DEC8] dark:border-[#3E2D34]">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <span className="text-[10.5px] uppercase font-sans font-bold tracking-[0.25em] text-[#5B1022] dark:text-[#C49A50] block mb-1">
                    CURATED COMPANIONS
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#252329] dark:text-[#FAF7F1]">
                    You May Also Admire
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedProducts.map((item) => (
                    <SignatureLuxuryCard
                      key={item.id}
                      product={item}
                      onQuickView={(p) => navigate(`/product/${p.id}`)}
                      onAddToCart={(p) => {
                        addToCartWithAnimation(p.id, p.weight, null, p.image_url ?? undefined, p.name);
                        setIsMiniCartOpen(true);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Recently Viewed Jewellery Creations */}
            {recentlyViewed.length > 0 && (
              <section className="pt-6 border-t border-[#E7DEC8] dark:border-[#3E2D34]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#C49A50] block mb-1">
                      YOUR BROWSING ATELIER
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#252329] dark:text-[#FAF7F1]">
                      Recently Viewed Pieces
                    </h3>
                  </div>
                  <Link
                    to="/#catalog"
                    className="text-xs font-bold text-[#5B1022] dark:text-[#C49A50] hover:underline flex items-center gap-1"
                  >
                    <span>View All Collections</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recentlyViewed.map((viewed) => (
                    <div
                      key={viewed.id}
                      onClick={() => navigate(`/product/${viewed.id}`)}
                      className="p-3.5 rounded-2xl bg-[#FAF7F1] dark:bg-[#1A1215] border border-[#E7DEC8] dark:border-[#3E2D34] hover:border-[#C49A50] transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="mb-2.5">
                        <ProductImage
                          src={viewed.image_url}
                          alt={viewed.name}
                          category={viewed.category}
                          metalType={viewed.metal_type}
                          aspectRatio="4/5"
                          padding=""
                          fit="cover"
                          containerClassName="rounded-xl border border-[#E7DEC8]/60 dark:border-[#3E2D34]/60 shadow-2xs"
                        />
                      </div>
                      <div>
                        <span className="text-[9.5px] text-[#716A6C] dark:text-[#B5ABB0] uppercase tracking-wider block font-semibold">
                          {viewed.category}
                        </span>
                        <h4 className="font-serif text-xs font-bold text-[#252329] dark:text-[#FAF7F1] truncate mt-0.5">
                          {viewed.name}
                        </h4>
                        <span className="font-serif text-xs font-bold text-[#5B1022] dark:text-[#C49A50] block mt-1">
                          {formatCurrencyINR(viewed.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Modal Suites */}
        <SizeGuideModal
          isOpen={isSizeGuideOpen}
          onClose={() => setIsSizeGuideOpen(false)}
          defaultTab={product?.category?.toLowerCase().includes('bangle') ? 'bangle' : 'ring'}
          onSelectSize={(sz) => setSelectedSize(sz)}
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
            toast.success('Thank you! Your verified review has been submitted for publication.');
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

        <PriceBreakdownExplainerModal
          isOpen={isExplainerOpen}
          onClose={() => setIsExplainerOpen(false)}
          initialWeight={selectedWeight}
          initialPurity={selectedPurity}
        />

        {/* Mini-Cart Confirmation Drawer */}
        <MiniCartDrawer
          isOpen={isMiniCartOpen}
          onClose={() => setIsMiniCartOpen(false)}
          product={{
            name: product?.name || '',
            image_url: product?.image_url ?? undefined
          }}
          purity={selectedPurity}
          weight={selectedWeight}
          size={selectedSize}
          quantity={quantity}
          price={displayPrice}
          totalCartCount={totalItems + quantity}
        />
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
