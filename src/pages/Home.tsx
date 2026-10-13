import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { 
  Heart, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Crown, 
  Star, 
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured, JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import MetalPriceTicker from '../components/MetalPriceTicker';
import { localJewelryItems } from '../utils/localData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrencyINR } from '../utils/formatters';

export default function Home() {
  const [searchParams] = useSearchParams();
  const { addToCart, totalItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<JewelryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<{ name: string; price: number; weight: number; unit: string; image_url?: string }[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = heroRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: '0% 0%',
          end: '100% 0%',
          scrub: 0,
        },
      });

      const layers = [
        { layer: '1', yPercent: 35 },
        { layer: '2', yPercent: 20 },
        { layer: '3', yPercent: 12 },
        { layer: '4', yPercent: 6 },
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: 'none',
          },
          idx === 0 ? undefined : '<'
        );
      });
    }

    const lenis = new Lenis();
    const handleScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on('scroll', handleScroll);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (triggerElement) {
        gsap.killTweensOf(triggerElement);
      }
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    fetchJewelryItems();
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
        // Merge with our 4 featured items if not present in DB
        const featuredIds = ['aurelle-1', 'aurelle-2', 'aurelle-3', 'aurelle-4'];
        const missingFeatured = localJewelryItems.filter(item => 
          featuredIds.includes(item.id) && !data.some(d => d.name === item.name)
        );
        setJewelryItems([...missingFeatured, ...data]);
      } else {
        setJewelryItems(localJewelryItems);
      }
    } catch {
      setJewelryItems(localJewelryItems);
    } finally {
      setLoading(false);
    }
  };

  // 4 Featured Products matching the prompt & visual mockup
  const featuredProducts = [
    jewelryItems.find(i => i.id === 'aurelle-1') || {
      id: 'aurelle-1',
      name: 'Royal Ruby Necklace Set',
      category: 'Bridal Collection',
      price: 125000,
      image_url: '/images/cat_bridal.jpg',
      description: 'Exquisite 22K hallmarked bridal necklace set crafted with royal rubies, hand-selected pearls and intricate filigree.',
      metal_type: 'gold',
      weight: 42.5,
      wastage_percent: 10,
    } as JewelryItem,
    jewelryItems.find(i => i.id === 'aurelle-2') || {
      id: 'aurelle-2',
      name: 'Diamond Halo Earrings',
      category: 'Diamond Collection',
      price: 85000,
      image_url: '/images/trend_diamond_earrings.jpg',
      description: 'Elegantly matched round brilliant diamonds enclosed in a luminous halo setting of 18K gold.',
      metal_type: 'gold',
      weight: 8.6,
      wastage_percent: 8,
    } as JewelryItem,
    jewelryItems.find(i => i.id === 'aurelle-3') || {
      id: 'aurelle-3',
      name: 'Temple Gold Necklace',
      category: 'Traditional Collection',
      price: 98000,
      image_url: '/images/cat_traditional.jpg',
      description: 'Heirloom temple antique necklace featuring handcrafted divine motifs, nagas work and royal embellishments.',
      metal_type: 'gold',
      weight: 34.2,
      wastage_percent: 12,
    } as JewelryItem,
    jewelryItems.find(i => i.id === 'aurelle-4') || {
      id: 'aurelle-4',
      name: 'Rose Gold Kada',
      category: 'Everyday Collection',
      price: 62000,
      image_url: '/images/trend_rose_gold_kada.jpg',
      description: 'Handcrafted 18K rose gold designer kada bangle embellished with shimmering floral diamond accents.',
      metal_type: 'gold',
      weight: 22.0,
      wastage_percent: 10,
    } as JewelryItem,
  ];

  // 4 Categories
  const categoryCards = [
    {
      title: 'Bridal Collection',
      image: '/images/cat_bridal.jpg',
      target: '#featured',
      categoryKey: 'Bridal Collection'
    },
    {
      title: 'Gold Jewellery',
      image: '/images/cat_gold.jpg',
      target: '#featured',
      categoryKey: 'Gold'
    },
    {
      title: 'Diamond Collection',
      image: '/images/cat_diamond.jpg',
      target: '#featured',
      categoryKey: 'Diamond'
    },
    {
      title: 'Traditional Jewellery',
      image: '/images/cat_traditional.jpg',
      target: '#featured',
      categoryKey: 'Traditional'
    }
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "The craftsmanship is simply outstanding. My bridal jewellery from RCB was beyond beautiful!",
      author: "Ananya S.",
      stars: 5,
    },
    {
      quote: "Elegant designs, premium quality and exceptional service. Truly a brand you can trust.",
      author: "Priya M.",
      stars: 5,
    },
    {
      quote: "Every piece feels special. RCB Jewellery has defined elegance for me. I'm a lifetime customer now!",
      author: "Radhika T.",
      stars: 5,
    }
  ];

  const handleProductClick = (item: JewelryItem) => {
    setSelectedProduct(item);
    setIsDetailsOpen(true);
  };

  const handleQuickAdd = (e: React.MouseEvent, item: JewelryItem) => {
    e.stopPropagation();
    addToCart(item.id);
    showNotification(`Added ${item.name} to shopping bag`);
  };

  const handleWishlistToggle = (e: React.MouseEvent, item: JewelryItem) => {
    e.stopPropagation();
    toggleWishlist(item.id);
    showNotification(isInWishlist(item.id) ? `Removed from wishlist` : `Saved to wishlist`);
  };

  const handleBuyNow = (item: JewelryItem) => {
    setCheckoutItems([{
      name: item.name,
      price: item.price,
      weight: item.weight,
      unit: 'grams',
      image_url: item.image_url
    }]);
    setCheckoutTotal(item.price);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF5F0] text-[#34252A] font-sans selection:bg-[#702638] selection:text-[#FAF5F0]">

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#34252A] text-[#FAF5F0] border border-[#C69A8B] px-5 py-3 rounded-full text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#C69A8B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 1. HERO SECTION (Full-Screen Viewport with Large Editorial Model & Parallax Scrolling) */}
      {/* ========================================================= */}
      <section
        ref={heroRef}
        className="parallax relative w-full min-h-[calc(100svh-120px)] sm:min-h-[calc(100svh-120px)] lg:min-h-[calc(100svh-120px)] bg-[#702638] text-[#FAF5F0] overflow-hidden flex items-center"
      >
        <div data-parallax-layers className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Layer 1: Ambient Background Depth */}
          <div
            data-parallax-layer="1"
            className="absolute inset-0 bg-gradient-to-br from-[#541C2A] via-[#702638] to-[#34111A] pointer-events-none"
          />

          {/* Layer 2: Editorial Full-Height Bridal Photography */}
          <div
            data-parallax-layer="2"
            className="absolute inset-0 md:left-auto md:right-0 md:w-1/2 lg:w-[55%] xl:w-[58%] z-0 h-full overflow-hidden"
          >
            <img
              src="/images/hero_bride_aurelle.jpg"
              alt="RCB Jewellery Royal Indian Bridal Collection - Handcrafted Kundan & Ruby Necklace Set"
              className="w-full h-full object-cover"
              style={{ objectPosition: '65% center' }}
              loading="eager"
            />

            {/* Desktop/Tablet Left Fade: Blends smoothly into the #702638 background */}
            <div className="hidden md:block absolute inset-y-0 left-0 w-32 lg:w-48 xl:w-64 bg-gradient-to-r from-[#702638] via-[#702638]/70 to-transparent pointer-events-none" />

            {/* Mobile Bottom Fade: Ensures text contrast on small stacked screens */}
            <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#702638] via-[#702638]/85 to-[#702638]/30 pointer-events-none" />
          </div>

          {/* Layer 4: Foreground Subtle Glimmer and Ambient Gradient */}
          <div
            data-parallax-layer="4"
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"
          />
        </div>

        {/* Layer 3: Editorial Content (Interactive with CTA button & typography) */}
        <div
          data-parallax-layer="3"
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 md:py-20 lg:py-24"
        >
          <div className="w-full md:max-w-md lg:max-w-lg xl:max-w-xl space-y-6">
            
            {/* Eyebrow Label */}
            <div className="flex items-center gap-2.5">
              <span className="h-[1px] w-8 bg-[#C69A8B]"></span>
              <span className="text-[11px] sm:text-xs font-sans font-semibold tracking-[0.25em] text-[#C69A8B] uppercase">
                ROYAL HERITAGE · MODERN ELEGANCE
              </span>
            </div>

            {/* Large Editorial Serif Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] xl:text-[64px] font-normal leading-[1.12] text-[#FAF5F0] tracking-[-0.01em]">
              Jewellery for<br />
              Life’s Most Precious<br />
              <span className="italic font-serif text-[#FAF5F0]">Moments</span>
            </h1>

            {/* Supporting Editorial Subtitle */}
            <p className="text-xs sm:text-sm lg:text-base font-sans text-[#FAF5F0]/85 font-light leading-relaxed max-w-lg">
              Discover our bridal collection, where tradition meets timeless elegance. Crafted for the moments that matter.
            </p>

            {/* Primary CTA */}
            <div className="pt-2">
              <a
                href="#categories"
                className="bg-[#FAF5F0] text-[#702638] hover:bg-[#C69A8B] hover:text-[#FAF5F0] px-8 py-3.5 rounded-full text-xs font-sans font-semibold tracking-[0.18em] uppercase transition-all duration-300 shadow-xl inline-flex items-center gap-2.5 group"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

          </div>
        </div>

      </section>

      {/* Real-time Metal Price Ticker with NumberFlow and Motion (Anchored at bottom of Hero) */}
      <MetalPriceTicker />

      {/* ========================================================= */}
      {/* 2. SHOP BY CATEGORY                                       */}
      {/* ========================================================= */}
      <section id="categories" className="py-20 bg-[#FAF5F0] border-b border-[#E5D5D0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header with delicate rose-gold accents */}
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] uppercase block mb-2">
              SHOP BY CATEGORY
            </span>
            <div className="flex items-center justify-center gap-4">
              <span className="h-[1px] w-10 bg-[#C69A8B]/60"></span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] font-normal tracking-[-0.01em]">
                Discover Your Favourite
              </h2>
              <span className="h-[1px] w-10 bg-[#C69A8B]/60"></span>
            </div>
          </div>

          {/* 4 Equal-width Image Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryCards.map((cat, idx) => (
              <a
                key={idx}
                href={cat.target}
                className="group relative h-96 overflow-hidden bg-[#34252A] block cursor-pointer"
              >
                {/* Background Image */}
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>

                {/* Content at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <h3 className="font-serif text-xl sm:text-2xl text-[#FAF5F0] font-normal mb-2 group-hover:text-[#C69A8B] transition-colors">
                    {cat.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-sans uppercase tracking-[0.18em] text-[#FAF5F0]/90 group-hover:text-[#C69A8B] transition-colors">
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. BRAND STORY SECTION (Split layout)                     */}
      {/* ========================================================= */}
      <section id="story" className="py-20 lg:py-24 bg-[#FAF5F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left: Atmospheric Bangle Photograph */}
            <div className="lg:col-span-6">
              <div className="relative shadow-xl overflow-hidden bg-[#702638]">
                <img
                  src="/images/story_bangle_aurelle.jpg"
                  alt="Aurelle Heirloom Gold Kada Bangle on Burgundy Velvet with Jasmine Petals"
                  className="w-full h-auto max-h-[520px] object-cover object-center hover:scale-103 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Right: Editorial Brand Narrative & 3 Highlights */}
            <div className="lg:col-span-6 space-y-6">
              
              <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] uppercase block">
                OUR STORY
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#34252A] font-normal leading-[1.18]">
                A Legacy of Craftsmanship<br />and Trust
              </h2>

              <p className="text-xs sm:text-sm font-sans text-[#34252A]/80 leading-relaxed font-light">
                At RCB Jewellery, we believe jewellery is more than an accessory — it’s a legacy. Each piece is thoughtfully designed and handcrafted by skilled artisans, blending traditional techniques with modern elegance.
              </p>

              <div>
                <a
                  href="#featured"
                  className="inline-flex items-center gap-2 border border-[#34252A] text-[#34252A] hover:bg-[#702638] hover:text-[#FAF5F0] hover:border-[#702638] rounded-full px-6 py-2.5 text-xs font-sans font-semibold tracking-[0.16em] uppercase transition-all duration-300"
                >
                  <span>LEARN MORE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 3 Minimal Feature Highlights with Rose-Gold Icons */}
              <div className="pt-6 border-t border-[#E5D5D0] space-y-4">
                
                {/* Feature 1 */}
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F0E4DF]/60 transition-colors">
                  <div className="w-11 h-11 rounded-full border border-[#C69A8B] flex items-center justify-center text-[#702638] bg-[#FAF5F0] shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#C69A8B]" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs sm:text-sm font-semibold tracking-wide text-[#34252A]">
                      Authentic Hallmarked Gold
                    </h4>
                    <p className="text-[11px] font-sans text-[#34252A]/60">
                      100% BIS Hallmarked 22K &amp; 24K purity with certified laser inscriptions.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F0E4DF]/60 transition-colors">
                  <div className="w-11 h-11 rounded-full border border-[#C69A8B] flex items-center justify-center text-[#702638] bg-[#FAF5F0] shrink-0">
                    <Award className="w-5 h-5 text-[#C69A8B]" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs sm:text-sm font-semibold tracking-wide text-[#34252A]">
                      Exquisite Craftsmanship
                    </h4>
                    <p className="text-[11px] font-sans text-[#34252A]/60">
                      Master karigars blending centuries-old jadau filigree with precision setting.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F0E4DF]/60 transition-colors">
                  <div className="w-11 h-11 rounded-full border border-[#C69A8B] flex items-center justify-center text-[#702638] bg-[#FAF5F0] shrink-0">
                    <Crown className="w-5 h-5 text-[#C69A8B]" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs sm:text-sm font-semibold tracking-wide text-[#34252A]">
                      Timeless Designs
                    </h4>
                    <p className="text-[11px] font-sans text-[#34252A]/60">
                      Heirloom silhouettes designed to be treasured across generations.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. FEATURED PRODUCTS ("Trending Now")                     */}
      {/* ========================================================= */}
      <section id="featured" className="py-20 bg-[#FAF5F0] border-t border-[#E5D5D0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] uppercase block mb-2">
              FEATURED COLLECTION
            </span>
            <div className="flex items-center justify-center gap-4">
              <span className="h-[1px] w-10 bg-[#C69A8B]/60"></span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] font-normal tracking-[-0.01em]">
                Trending Now
              </h2>
              <span className="h-[1px] w-10 bg-[#C69A8B]/60"></span>
            </div>
          </div>

          {/* 4 Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.map((product) => {
              const inWishlist = isInWishlist(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="group bg-[#FAF5F0] cursor-pointer flex flex-col justify-between"
                >
                  {/* Image Container with Wishlist Icon */}
                  <div className="relative aspect-square overflow-hidden bg-white border border-[#E5D5D0] mb-4">
                    <img
                      src={product.image_url || '/images/cat_bridal.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm text-[#34252A] hover:text-[#702638] transition-colors"
                      aria-label="Add to wishlist"
                    >
                      <Heart className={`w-4 h-4 ${inWishlist ? 'fill-[#702638] text-[#702638]' : 'text-[#34252A]/80'}`} />
                    </button>

                    {/* Quick View Hover Badge */}
                    <div className="absolute inset-x-0 bottom-0 py-2 bg-black/40 backdrop-blur-xs text-white text-[10px] font-sans uppercase tracking-widest text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      Quick View &amp; Details
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1">
                    <h3 className="font-serif text-base sm:text-lg text-[#34252A] font-normal group-hover:text-[#702638] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[11px] font-sans text-[#34252A]/60">
                      {product.category || 'Fine Jewellery'}
                    </p>
                    
                    {/* Price and Cart Action */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-sans font-semibold text-sm sm:text-base text-[#34252A] font-mono">
                        {formatCurrencyINR(product.price)}
                      </span>

                      <button
                        onClick={(e) => handleQuickAdd(e, product)}
                        className="p-2 rounded-full hover:bg-[#F0E4DF] text-[#34252A] hover:text-[#702638] transition-colors"
                        aria-label={`Add ${product.name} to shopping bag`}
                        title="Add to shopping bag"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. PROMOTIONAL BANNER                                     */}
      {/* ========================================================= */}
      <section id="bridal" className="relative bg-[#702638] overflow-hidden py-24 sm:py-28 my-10">
        {/* Background Image with High-Clarity Visibility */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/special_offer_velvet.jpg"
            alt="Aurelle Bridal Offer - Ruby and Diamond Gold Jewellery on Burgundy Velvet"
            className="w-full h-full object-cover object-right sm:object-center"
          />
          {/* Subtle soft gradient strictly on the left to keep text ultra-legible while keeping the flowers and velvet 100% vibrant */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A0A12]/80 via-[#2A0A12]/35 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="max-w-xl space-y-4">
            
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#C69A8B] uppercase block">
              SPECIAL OFFER
            </span>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#FAF5F0] font-normal leading-tight">
              Up to 20% Off
            </h2>

            <p className="text-sm font-sans text-[#FAF5F0]/85 tracking-wide">
              On Selected Bridal Jewellery
            </p>

            <div className="pt-4">
              <a
                href="#featured"
                className="inline-flex items-center gap-2 border border-[#C69A8B] text-[#FAF5F0] hover:bg-[#C69A8B] hover:text-[#34252A] rounded-full px-8 py-3 text-xs font-sans font-semibold tracking-[0.2em] uppercase transition-all duration-300"
              >
                <span>SHOP THE SALE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CUSTOMER TESTIMONIALS                                  */}
      {/* ========================================================= */}
      <section id="journal" className="py-20 lg:py-24 bg-[#FAF5F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#702638] uppercase block mb-2">
              WHAT OUR CUSTOMERS SAY
            </span>
            <div className="flex items-center justify-center gap-4">
              <span className="h-[1px] w-10 bg-[#C69A8B]/60"></span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#34252A] font-normal tracking-[-0.01em]">
                Trusted by Thousands
              </h2>
              <span className="h-[1px] w-10 bg-[#C69A8B]/60"></span>
            </div>
          </div>

          {/* 3 Testimonials Columns with Delicate Separators */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5D5D0]">
            {testimonials.map((item, index) => (
              <div key={index} className="px-6 lg:px-10 py-6 md:py-0 text-center flex flex-col justify-between">
                <div>
                  {/* Rose Gold Quotation Marks */}
                  <span className="font-serif text-4xl text-[#C69A8B] leading-none block mb-2">“</span>
                  
                  {/* Quote */}
                  <p className="font-sans text-xs sm:text-sm text-[#34252A]/85 italic leading-relaxed mb-6 font-light">
                    "{item.quote}"
                  </p>
                </div>

                <div>
                  {/* Author Name */}
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-[#34252A] mb-2">
                    {item.author}
                  </p>

                  {/* 5 Small Star Icons */}
                  <div className="flex items-center justify-center gap-1 text-[#C69A8B]">
                    {[...Array(item.stars)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C69A8B]" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FOOTER                                                 */}
      {/* ========================================================= */}
      <Footer />

      {/* Product Details Modal */}
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

      {/* Direct Buy Now Checkout Modal */}
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

    </div>
  );
}
