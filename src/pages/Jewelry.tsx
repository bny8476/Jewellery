import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { JewelryItem } from '../lib/supabase';
import Footer from '../components/Footer';
import SeedButton from '../components/SeedButton';
import { Gem, ShoppingCart, Eye, Heart } from 'lucide-react';
import { CheckoutModal } from '../components/CheckoutModal';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import LiveMetalRates from '../components/LiveMetalRates';
import { TrustBadges } from '../components/TrustBadges';
import { localJewelryItems } from '../utils/localData';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useRates } from '../context/RateContext';
import { useWishlist } from '../context/WishlistContext';

const Jewelry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { cart, totalItems } = useCart();
  const { calculateProductPrice } = useRates();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<{ name: string, price: number, weight: number, unit: string, image_url?: string }[]>([]);
  const [checkoutTotal, setCheckoutTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedPurity, setSelectedPurity] = useState<string>('all');

  const [selectedProduct, setSelectedProduct] = useState<JewelryItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const [searchQuery, setSearchQuery] = useState('');

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
    }).filter(Boolean) as { name: string, price: number, weight: number, unit: string, image_url?: string }[];

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
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <div className="text-center">
          <Gem className="h-12 w-12 text-[#c5a044] animate-pulse mx-auto mb-4" />
          <p className="text-[#a09e98] font-sans tracking-wide">Curating royal collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f5f2eb]">
      <LiveMetalRates />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#23232c]">
          <div>
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#c5a044] uppercase block mb-2">
              EXQUISITE CRAFTSMANSHIP
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-[#f7f4ea] tracking-tight">
              Jewellery Collection
            </h1>
            <p className="text-[#9a9890] mt-2 text-sm md:text-base font-light">
              Hallmarked gold, certified diamonds, and precious gemstones valued at live market rates.
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-[#c5a044] font-medium tracking-wider">
            {filteredItems.length} {filteredItems.length === 1 ? 'PIECE' : 'PIECES'} AVAILABLE
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg capitalize text-xs tracking-wider font-semibold transition-all duration-200 ${selectedCategory === category
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#aa820a] text-black shadow-lg shadow-[#d4af37]/20'
                  : 'bg-[#121216] text-[#b3b1a8] hover:text-[#f5f2eb] hover:bg-[#1a1a20] border border-[#23232c]'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search and Dropdowns Container */}
          <div className="flex flex-wrap gap-3 items-center bg-[#121216] p-2.5 rounded-xl border border-[#23232c] shadow-lg flex-1">
            {/* Search Bar */}
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="Search jewellery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181f] text-xs text-[#f5f2eb] placeholder-[#666560] px-3.5 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c5a044] border border-[#282833]"
              />
            </div>

            <div className="h-6 w-[1px] bg-[#282833] hidden md:block"></div>

            {/* Purity */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#888680] uppercase tracking-wider hidden xl:inline">Purity:</span>
              <select
                value={selectedPurity}
                onChange={(e) => setSelectedPurity(e.target.value)}
                className="bg-[#18181f] text-xs font-medium text-[#d4af37] p-2 rounded-lg border border-[#282833] focus:outline-none focus:ring-1 focus:ring-[#c5a044]"
              >
                <option value="all">Any Purity</option>
                <option value="24k">24K (Pure Gold)</option>
                <option value="22k">22K (Jewellery Gold)</option>
              </select>
            </div>

            {/* Price */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#888680] uppercase tracking-wider hidden xl:inline">Price:</span>
              <select
                value={`${priceRange[0]}-${priceRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setPriceRange([min, max]);
                }}
                className="bg-[#18181f] text-xs font-medium text-[#e0ded8] p-2 rounded-lg border border-[#282833] focus:outline-none focus:ring-1 focus:ring-[#c5a044]"
              >
                <option value="0-1000000">Any Price</option>
                <option value="0-10000">Under ₹10,000</option>
                <option value="10000-50000">₹10,000 - ₹50,000</option>
                <option value="50000-200000">₹50,000 - ₹2,00,000</option>
                <option value="200000-1000000">Above ₹2,00,000</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#18181f] text-xs font-semibold text-[#c5a044] p-2 rounded-lg border border-[#282833] focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
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
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 uppercase tracking-wider px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#121216] rounded-2xl border border-[#23232c] my-8">
            <Gem className="h-16 w-16 text-[#c5a044]/40 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-[#f7f4ea] mb-2">No Jewellery Found</h3>
            <p className="text-[#888680] text-sm max-w-md mx-auto">
              We couldn't find any pieces matching your current filters. Try resetting the filters to view our full royal collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-[#121216] rounded-2xl border border-[#23232c] hover:border-[#c5a044]/50 overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 flex flex-col"
              >
                <div
                  className="h-64 bg-[#0d0d11] relative overflow-hidden cursor-pointer"
                  onClick={() => openProductDetails(item)}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#15151b]">
                      <Gem className="h-16 w-16 text-[#c5a044]/30" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button className="bg-[#f7f4ea] text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl scale-95 group-hover:scale-100 transition-transform">
                      <Eye className="h-3.5 w-3.5 text-[#c5a044]" /> Quick View
                    </button>
                  </div>

                  {/* Purity & Weight Tag */}
                  {item.metal_type !== 'none' && (
                    <div className="absolute top-3 left-3 bg-[#08080a]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#c5a044]/30">
                      <span className="text-[11px] font-semibold text-[#f7f4ea] uppercase tracking-wider">
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
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${isInWishlist(item.id)
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                      : 'bg-[#08080a]/60 text-[#a09e98] hover:text-rose-400 border border-[#282833]'
                      }`}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist(item.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-[#c5a044] uppercase tracking-widest block mb-1">
                      {item.category}
                    </span>
                    <h3 className="text-base font-serif font-medium text-[#f7f4ea] group-hover:text-[#d4af37] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-baseline justify-between pt-2 border-t border-[#1e1e26]">
                      <div className="flex flex-col">
                        <span className="text-xl font-serif font-bold text-gold-gradient">
                          {formatPrice(getDynamicPrice(item))}
                        </span>
                        <span className="text-[9px] text-[#7d7b75] uppercase font-medium tracking-wider">
                          + GST & Wastage
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => openProductDetails(item)}
                        className="bg-[#18181f] border border-[#33323e] text-[#d4af37] hover:border-[#c5a044] hover:bg-[#202028] py-2.5 rounded-xl flex items-center justify-center text-xs font-semibold tracking-wider transition-all"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleBuyNow(item)}
                        className="bg-gradient-to-r from-[#d4af37] via-[#c5a044] to-[#997305] text-black font-semibold py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md shadow-[#d4af37]/10 flex items-center justify-center gap-1.5 text-xs tracking-wider"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <TrustBadges />
      <Footer />
      <SeedButton />
    </div>
  );
};

export default Jewelry;
