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
  AlertCircle
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

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rates, isLive, calculateProductPrice } = useRates();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<JewelryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id, selectedWeight);
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
        title: product?.name || 'RCB Fine Jewellery',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Related recommended products (excluding current one)
  const relatedProducts = product
    ? localJewelryItems
        .filter((item) => item.id !== product.id && (item.category === product.category || item.metal_type === product.metal_type))
        .slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 w-full">
        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-[#702638] dark:hover:text-[#E8A598] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-stone-400" />
          <Link to="/#catalog" className="hover:text-[#702638] dark:hover:text-[#E8A598] transition-colors">
            Catalogue
          </Link>
          {product && (
            <>
              <ChevronRight className="w-3 h-3 text-stone-400" />
              <span className="capitalize">{product.category}</span>
              <ChevronRight className="w-3 h-3 text-stone-400" />
              <span className="text-stone-900 dark:text-stone-100 font-medium truncate max-w-xs sm:max-w-md">
                {product.name}
              </span>
            </>
          )}
        </nav>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse pt-6">
            <div className="aspect-square bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-4 bg-stone-200 dark:bg-stone-800 w-32 rounded"></div>
              <div className="h-10 bg-stone-200 dark:bg-stone-800 w-3/4 rounded"></div>
              <div className="h-8 bg-stone-200 dark:bg-stone-800 w-48 rounded"></div>
              <div className="h-28 bg-stone-200 dark:bg-stone-800 rounded-xl"></div>
              <div className="h-12 bg-stone-200 dark:bg-stone-800 rounded-xl"></div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!loading && (error || !product) && (
          <div className="p-12 sm:p-16 text-center bg-white dark:bg-[#1E1B1D] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm max-w-xl mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-[#C69A8B] mx-auto mb-4" />
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 dark:text-stone-100 mb-2">
              Jewellery Piece Unavailable
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
              {error || 'The requested jewellery piece could not be located in our inventory catalogue.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/#catalog')}
                className="px-6 py-3 bg-[#702638] hover:bg-[#541C2A] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Browse All Collections
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
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
              <div className="relative aspect-square bg-[#F7F4F0] dark:bg-[#150F13] rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-sm group">
                <img
                  src={activeImage || product.image_url || getJewelryFallbackImage(product.category, product.metal_type)}
                  alt={product.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                />

                {/* Floating Hallmarking Badge */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#C69A8B]/40 text-[#FAF5F0] text-[10px] font-sans font-semibold tracking-wider uppercase shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C69A8B]" />
                    <span>{product.purity || 'BIS 916 Laser Hallmarked'}</span>
                  </div>
                </div>

                {/* Floating Wishlist Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md border transition-all ${
                      isInWishlist(product.id)
                        ? 'bg-[#702638] text-white border-[#702638] scale-105'
                        : 'bg-white/90 dark:bg-black/70 text-stone-700 dark:text-stone-300 border-stone-200 hover:bg-white hover:text-[#702638]'
                    }`}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setActiveImage(product.image_url || '')}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === product.image_url
                      ? 'border-[#702638] ring-2 ring-[#702638]/30 scale-102'
                      : 'border-stone-200 dark:border-stone-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={product.image_url || getJewelryFallbackImage(product.category, product.metal_type)}
                    alt="Main view"
                    className="w-full h-full object-cover"
                  />
                </button>

                {product.secondary_image_url && (
                  <button
                    type="button"
                    onClick={() => setActiveImage(product.secondary_image_url || '')}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImage === product.secondary_image_url
                        ? 'border-[#702638] ring-2 ring-[#702638]/30 scale-102'
                        : 'border-stone-200 dark:border-stone-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={product.secondary_image_url}
                      alt="Alternate angle"
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
              </div>

              {/* Guarantees & Service Assurance */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-200 dark:border-stone-800 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#1E1B1D] border border-stone-100 dark:border-stone-800/80 flex flex-col items-center text-center">
                  <ShieldCheck className="w-5 h-5 text-[#8C5D3B] dark:text-[#E8A598] mb-1.5" />
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-[11px]">BIS Hallmarked</span>
                  <span className="text-[10px] text-stone-500">100% Purity Certified</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#1E1B1D] border border-stone-100 dark:border-stone-800/80 flex flex-col items-center text-center">
                  <Truck className="w-5 h-5 text-[#8C5D3B] dark:text-[#E8A598] mb-1.5" />
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-[11px]">Insured Shipping</span>
                  <span className="text-[10px] text-stone-500">Free Transit Cover</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#1E1B1D] border border-stone-100 dark:border-stone-800/80 flex flex-col items-center text-center">
                  <RotateCcw className="w-5 h-5 text-[#8C5D3B] dark:text-[#E8A598] mb-1.5" />
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-[11px]">Lifetime Exchange</span>
                  <span className="text-[10px] text-stone-500">Guaranteed Buyback</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#1E1B1D] border border-stone-100 dark:border-stone-800/80 flex flex-col items-center text-center">
                  <Sparkles className="w-5 h-5 text-[#8C5D3B] dark:text-[#E8A598] mb-1.5" />
                  <span className="font-semibold text-stone-900 dark:text-stone-100 text-[11px]">Free Maintenance</span>
                  <span className="text-[10px] text-stone-500">Ultrasonic Spa Clean</span>
                </div>
              </div>
            </div>

            {/* Right Column: Pricing, Specifications, and Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Product Identity */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.22em] text-[#8C5D3B] dark:text-[#E8A598]">
                    {product.category} • {product.metal_type?.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                    SKU: RCBJ-{product.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-normal text-stone-900 dark:text-stone-100 leading-snug tracking-[-0.01em]">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-amber-500 text-xs">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-xs text-stone-500">
                    4.9 ({product.reviews_count || 42} verified customer reviews)
                  </span>
                </div>
              </div>

              {/* Price & Rate Anchor */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1B1D] border border-stone-200/80 dark:border-stone-800 shadow-xs">
                <div className="flex items-baseline justify-between mb-1">
                  <div>
                    <span className="text-xs text-stone-500 dark:text-stone-400 block mb-0.5">
                      All-Inclusive Selling Price
                    </span>
                    <div className="price-featured text-3xl sm:text-4xl text-[#702638] dark:text-[#E8A598]">
                      {formatCurrencyINR(displayPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      In Stock
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                  Inclusive of all statutory taxes (3% GST), hallmark registration, and insured courier.
                </p>

                {/* Live Metal Rate Benchmark Strip */}
                <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                    <TrendingUp className="w-3.5 h-3.5 text-[#8C5D3B] dark:text-[#E8A598]" />
                    <span>Applied Rate:</span>
                    <strong className="text-stone-900 dark:text-stone-100 font-semibold">
                      ₹{Math.round(metalRateApplied).toLocaleString('en-IN')}/g
                    </strong>
                    <span className="text-stone-400 text-[10px]">
                      ({product.metal_type === 'gold' ? (product.name.includes('24k') ? '24K' : '22K') : product.metal_type})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Clock className="w-3 h-3" />
                    <span>{isLive ? 'Live verified' : 'Daily IBJA benchmark'}</span>
                  </div>
                </div>
              </div>

              {/* Weight Customizer (Preset & Revaluation) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Selected Product Weight
                  </span>
                  <span className="text-stone-500">
                    Net Gold: {netGoldWeight}g
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[product.weight, 10, 15, 20, 30, 48].filter((w, idx, arr) => w > 0 && arr.indexOf(w) === idx).slice(0, 4).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeight(w)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                        selectedWeight === w
                          ? 'bg-[#702638] text-white border-[#702638] shadow-xs'
                          : 'bg-white dark:bg-[#1E1B1D] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-[#702638]'
                      }`}
                    >
                      {w} grams
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparent Price Breakdown Accordion */}
              {pricingBreakdown && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1A1819] border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                  <div className="font-semibold text-stone-900 dark:text-stone-100 text-[11.5px] pb-1 border-b border-stone-200 dark:border-stone-800">
                    Transparent Price Breakdown
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Base Metal Value ({selectedWeight}g × {formatCurrencyINR(Math.round(metalRateApplied))}/g)</span>
                    <span className="number-supporting text-stone-900 dark:text-stone-200 font-medium">
                      {formatCurrencyINR(pricingBreakdown.basePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Making Charges &amp; Artistry ({product.wastage_percent || 12}%)</span>
                    <span className="number-supporting text-stone-900 dark:text-stone-200 font-medium">
                      {formatCurrencyINR(pricingBreakdown.wastageAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Statutory GST (1.5% CGST + 1.5% SGST)</span>
                    <span className="number-supporting text-stone-900 dark:text-stone-200 font-medium">
                      {formatCurrencyINR(pricingBreakdown.cgst + pricingBreakdown.sgst)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-semibold text-stone-900 dark:text-stone-100 items-baseline">
                    <span>Total Calculated Value</span>
                    <span className="price-total text-base text-[var(--gold-primary)]">{formatCurrencyINR(displayPrice)}</span>
                  </div>
                </div>
              )}

              {/* Quantity and Primary Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* Quantity Counter */}
                  <div className="inline-flex items-center border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-[#1E1B1D] p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#702638] hover:bg-[#541C2A] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-11 h-11 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-[#1E1B1D] flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors"
                    title="Share this jewellery piece"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Instant Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3 px-5 rounded-xl border border-[#8C5D3B] hover:bg-[#8C5D3B] hover:text-white text-[#8C5D3B] dark:text-[#E8A598] text-xs font-semibold uppercase tracking-widest transition-all"
                >
                  Buy Now with 100% Insured Delivery
                </button>
              </div>

              {/* Toast Feedback */}
              {addedToCartToast && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Added {quantity} × {product.name} to your shopping bag!</span>
                </div>
              )}

              {/* Product Specifications Table */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                <h3 className="font-serif text-base font-medium text-stone-900 dark:text-stone-100 mb-3">
                  Jewellery Specifications
                </h3>
                <dl className="grid grid-cols-2 gap-y-2 text-xs">
                  <dt className="text-stone-500">Metal &amp; Purity</dt>
                  <dd className="text-stone-900 dark:text-stone-100 font-medium">
                    {product.purity || '22K (BIS 916)'}
                  </dd>

                  <dt className="text-stone-500">Gross Weight</dt>
                  <dd className="text-stone-900 dark:text-stone-100 font-medium">
                    {product.weight} grams
                  </dd>

                  <dt className="text-stone-500">Net Metal Weight</dt>
                  <dd className="text-stone-900 dark:text-stone-100 font-medium">
                    {netGoldWeight} grams
                  </dd>

                  <dt className="text-stone-500">Category</dt>
                  <dd className="text-stone-900 dark:text-stone-100 font-medium capitalize">
                    {product.category}
                  </dd>

                  <dt className="text-stone-500">Hallmarking ID</dt>
                  <dd className="text-stone-900 dark:text-stone-100 font-mono text-[11px]">
                    HUID-916-RCBJ-{(product.id.slice(0, 6)).toUpperCase()}
                  </dd>

                  <dt className="text-stone-500">Dispatch Window</dt>
                  <dd className="text-stone-900 dark:text-stone-100 font-medium">
                    24 - 48 Hours Insured
                  </dd>
                </dl>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  <h3 className="font-serif text-base font-medium text-stone-900 dark:text-stone-100 mb-2">
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
          <section className="mt-24 pt-12 border-t border-stone-200 dark:border-stone-800">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[10.5px] uppercase font-sans font-bold tracking-[0.25em] text-[#8C5D3B] dark:text-[#E8A598] block mb-1">
                Curated Companions
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 dark:text-stone-100">
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
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
