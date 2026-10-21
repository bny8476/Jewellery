import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Heart, 
  User, 
  ShoppingBag, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight,
  Sparkles, 
  LogOut, 
  Gem, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Coins,
  ArrowRight,
  Sun,
  Scale,
  Gift,
  Tag
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CartDrawer } from './CartDrawer';
import { WishlistDrawer } from './WishlistDrawer';
import { StoreLocatorModal } from './StoreLocatorModal';
import { PriceBreakdownExplainerModal } from './PriceBreakdownExplainerModal';
import { PawnValuationModal } from './PawnValuationModal';
import { GoldExchangeModal } from './GoldExchangeModal';
import { SwarnaNidhiModal } from './SwarnaNidhiModal';
import { LiveRateCard } from './LiveRateCard';
import { LiveRateModal } from './LiveRateModal';
import { ThemeToggle } from './ThemeToggle';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRates } from '../context/RateContext';
import { JewelryItem } from '../lib/supabase';
import { localJewelryItems } from '../utils/localData';
import { formatCurrencyINR } from '../utils/formatters';
import { drawerLeftVariants } from '../utils/motion';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface NavbarProps {
  onOpenOffer?: () => void;
}

export default function Navbar({ onOpenOffer: _onOpenOffer }: NavbarProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, updateQuantity, totalItems } = useCart();
  const { wishlist } = useWishlist();
  const { rates } = useRates();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);
  const [isRatesExplainerOpen, setIsRatesExplainerOpen] = useState(false);
  const [isPawnModalOpen, setIsPawnModalOpen] = useState(false);
  const [isGoldExchangeModalOpen, setIsGoldExchangeModalOpen] = useState(false);
  const [isSwarnaNidhiOpen, setIsSwarnaNidhiOpen] = useState(false);
  const [isLiveRateModalOpen, setIsLiveRateModalOpen] = useState(false);
  const [isRatePopoverOpen, setIsRatePopoverOpen] = useState(false);
  const rateCardPopoverRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Default live rate figures matching 24K 999.9 gold standard
  const buyRate24k = rates?.gold && rates.gold >= 14000 ? Math.round(rates.gold) : 14928;
  const sellRate24k = rates?.sellBack24k || Math.round(buyRate24k * 0.9728) || 14523;
  const rate22k = rates?.gold22k && rates.gold22k >= 12000 ? Math.round(rates.gold22k) : 13684;
  const rateSilver = rates?.silver || 181.2;

  // Click outside to close rate popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rateCardPopoverRef.current && !rateCardPopoverRef.current.contains(e.target as Node)) {
        setIsRatePopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Autocomplete search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!isSupabaseConfigured) {
        setJewelryItems(localJewelryItems);
        return;
      }
      try {
        const { data } = await supabase.from('jewelry_items').select('*');
        if (data && data.length > 0) {
          setJewelryItems(data);
        } else {
          setJewelryItems(localJewelryItems);
        }
      } catch {
        setJewelryItems(localJewelryItems);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname, location.search]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('rcb_active_admin_role');
        } catch (err) {
          void err;
        }
      }
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Autocomplete filtering
  const searchResults = searchQuery.trim()
    ? jewelryItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.metal_type && item.metal_type.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  const handleSelectSearchResult = (item: JewelryItem) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    navigate(`/?item=${encodeURIComponent(item.id)}#catalog`);
  };

  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchFocused(false);
    navigate(`/?q=${encodeURIComponent(searchQuery.trim())}#catalog`);
  };

  const handleNavigateFilter = (paramKey: string, paramValue: string) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    navigate(`/?${paramKey}=${encodeURIComponent(paramValue)}#catalog`);
    // smooth scroll to catalog if already on page
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Main Elegant Header */}
      <header className={`sticky top-0 z-40 text-white bg-[#450817] transition-all duration-200 ${
        isScrolled
          ? 'border-b border-[#C6A15B]/35 shadow-lg'
          : 'border-b border-[#C6A15B]/25 shadow-xs'
      }`}>
        
        {/* Universal Top Live Precious Metals Bar (Visible on All Pages) */}
        <div className="bg-[#2D040E] border-b border-[#C6A15B]/25 text-white py-1 px-3 sm:px-4 text-xs font-sans">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setIsLiveRateModalOpen(true)}
                className="inline-flex items-center gap-1.5 font-medium text-[11px] text-amber-200 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Click to view full Live 24K 999.9 Gold Rate card"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]" />
                </span>
                <span className="font-semibold tracking-wide">LIVE 24K 999.9:</span>
                <strong className="text-white text-xs font-bold tracking-tight">₹{buyRate24k.toLocaleString('en-IN')}/g</strong>
              </button>

              <span className="text-white/20 shrink-0">•</span>

              <span className="inline-flex items-center gap-1 text-[10.5px] text-[#FAF7F2]/80 shrink-0">
                <span>Sell-back:</span>
                <strong className="text-white font-medium">₹{sellRate24k.toLocaleString('en-IN')}/g</strong>
                <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-[#34D399] font-medium border border-emerald-500/30">
                  +3% GST
                </span>
              </span>

              <span className="hidden sm:inline text-white/20 shrink-0">•</span>

              <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] text-amber-200/90 shrink-0">
                <span>22K (916 BIS):</span>
                <strong className="text-amber-300 font-medium">₹{rate22k.toLocaleString('en-IN')}/g</strong>
              </span>

              <span className="hidden md:inline text-white/20 shrink-0">•</span>

              <span className="hidden md:inline-flex items-center gap-1 text-[10.5px] text-stone-300 shrink-0">
                <span>999 Silver:</span>
                <strong className="text-stone-100 font-medium">₹{Math.round(rateSilver)}/g</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsLiveRateModalOpen(true)}
                className="hover:text-[#D8B878] text-[10.5px] font-semibold text-[#D8B878] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="hidden sm:inline">Inspect Live Card</span>
                <span className="sm:hidden">Rate Card</span>
                <ChevronRight className="w-3 h-3 text-[#D8B878]" />
              </button>
            </div>
          </div>
        </div>

        {/* Top utility row: Brand + Search + Quick Shortcuts + User Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

            {/* Brand Identity */}
            <Link 
              to="/" 
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none shrink-0"
              aria-label="YAZHINI FINE JEWELS - Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 border border-[#C6A15B]/40 flex items-center justify-center text-[#D8B878] group-hover:scale-105 group-hover:border-[#D8B878] transition-transform shrink-0">
                <Gem className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif tracking-[0.24em] text-base sm:text-lg md:text-xl font-medium text-white uppercase leading-none group-hover:text-[#D8B878] transition-colors">
                  YAZHINI
                </span>
                <span className="text-[7.5px] sm:text-[8px] font-sans tracking-[0.34em] text-[#D8B878] uppercase mt-0.5 font-bold flex items-center gap-1">
                  <span>FINE JEWELS</span>
                  <span className="hidden sm:inline text-[#D8B878]/50">•</span>
                  <span className="hidden sm:inline text-[7.5px] text-[#FAF9F8]/70 font-normal">EST. 1994</span>
                </span>
              </div>
            </Link>

            {/* Search Option & 22K Gold Group */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 max-w-2xl mx-3 lg:mx-6">
              
              {/* Search Container */}
              <div ref={searchContainerRef} className="relative flex-1">
                <form 
                  onSubmit={handleExecuteSearch} 
                  className="relative flex items-center h-9 px-3 rounded-[2px] bg-[#320510] border border-[#C6A15B]/30 focus-within:border-[#D8B878] transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-[#D8B878] shrink-0" strokeWidth={2} />
                  <div className="h-3.5 w-px bg-white/20 mx-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search gold necklaces, solitaire rings, bangles, bridal trousseau..."
                    className="w-full bg-transparent text-white placeholder-white/60 text-xs font-sans font-normal focus:outline-none tracking-normal"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-stone-300 hover:text-white pr-1 focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#24191D] text-white rounded-[2px] shadow-2xl border border-[#46343A] overflow-hidden z-50">
                    <div className="p-2.5 border-b border-[#46343A] text-[10px] uppercase font-semibold tracking-wider text-[#C1B4B8]">
                      Matching Creations ({searchResults.length})
                    </div>
                    {searchResults.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto divide-y divide-[#302126]">
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectSearchResult(item)}
                            className="flex items-center gap-3 p-2.5 hover:bg-[#450817] cursor-pointer transition-colors"
                          >
                            <img
                              src={item.image_url || '/images/ring_solitaire_diamond.jpg'}
                              alt={item.name}
                              className="w-10 h-10 rounded-[2px] object-contain bg-[#1B1316] border border-[#46343A] p-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{item.name}</p>
                              <p className="text-[10px] text-[#C1B4B8]">{item.category} • {item.weight || 0}g</p>
                            </div>
                            <div className="text-xs font-semibold text-[#D8B878]">
                              {formatCurrencyINR(item.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-[#C1B4B8]">
                        No jewellery found matching "{searchQuery}". Try "Gold", "Necklace", or "Diamond".
                      </div>
                    )}
                    <button
                      onClick={handleExecuteSearch}
                      className="w-full py-2.5 bg-[#450817] text-white text-xs font-medium hover:bg-[#6A1B2B] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View all matching results in catalogue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Live 24K & 22K Gold Rate Button & Dropdown Popover */}
              <div className="relative" ref={rateCardPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsRatePopoverOpen(prev => !prev)}
                  className="relative flex items-center h-9 px-3 rounded-[2px] bg-[#320510] border border-[#C6A15B]/30 hover:border-[#D8B878] transition-colors shrink-0 group focus:outline-none cursor-pointer"
                  title="Click to toggle live 24K & 22K precious metals card"
                >
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]" />
                  </span>
                  <div className="flex items-center gap-1.5 text-xs whitespace-nowrap font-sans">
                    <span className="text-white/70 font-normal">24K Gold:</span>
                    <span className="text-[#FAF5F0] font-bold tracking-tight">
                      ₹{buyRate24k.toLocaleString('en-IN')}/g
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 ml-1.5 text-[#D8B878] transition-transform ${isRatePopoverOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating Live Rate Popover Card */}
                {isRatePopoverOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 shadow-2xl">
                    <LiveRateCard onClose={() => setIsRatePopoverOpen(false)} />
                  </div>
                )}
              </div>

            </div>

            {/* Quick Action Badges & Header Utilities */}
            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 shrink-0">

              {/* Store Locator shortcut */}
              <button
                onClick={() => setIsStoreLocatorOpen(true)}
                className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-full text-white hover:text-[#D8B878] hover:bg-white/10 transition-colors text-xs font-sans tracking-wide shrink-0"
                title="Find YAZHINI Boutique & Book In-Store Appointment"
              >
                <MapPin className="w-4 h-4 text-[#D8B878] shrink-0" />
                <span className="text-[11.5px] font-medium tracking-wide">Stores</span>
              </button>

              {/* Theme Toggle (Dark / Light / System) */}
              <div className="w-9 h-9 flex items-center justify-center shrink-0">
                <ThemeToggle className="!w-9 !h-9 !p-0 !gap-0 flex items-center justify-center !bg-[#320510] !border-[#C6A15B]/50 !text-[#D8B878] hover:!border-[#D8B878] hover:!text-[#FAF5F0] hover:!bg-[#450817] transition-all" />
              </div>

              {/* Wishlist */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-[#D8B878] hover:bg-white/10 relative transition-all focus:outline-none shrink-0"
                aria-label={`Wishlist (${wishlist.length} items)`}
                title="Wishlist"
              >
                <Heart className={`w-[18px] h-[18px] transition-transform hover:scale-105 ${wishlist.length > 0 ? 'fill-[#D8B878] text-[#D8B878]' : 'text-current'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D8B878] text-[#450817] text-[9.5px] font-bold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm pointer-events-none">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Shopping Bag / Cart */}
              <button
                id="cart-bag-icon"
                data-cart-target="true"
                onClick={() => setIsCartOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-[#D8B878] hover:bg-white/10 relative transition-all focus:outline-none shrink-0"
                aria-label={`Shopping bag (${totalItems} items)`}
                title="Shopping Bag"
              >
                <ShoppingBag className="w-[18px] h-[18px] text-current transition-transform hover:scale-105" />
                <span 
                  id="cart-bag-counter"
                  className="absolute -top-1 -right-1 bg-[#D8B878] text-[#450817] text-[9.5px] font-bold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm pointer-events-none transition-transform"
                >
                  {totalItems}
                </span>
              </button>

              {/* User Account / Profile */}
              {user ? (
                <div className="relative group shrink-0">
                  <Link
                    to="/profile"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-[#D8B878] hover:bg-white/10 transition-all focus:outline-none"
                    aria-label="User profile"
                  >
                    <User className="w-[18px] h-[18px] text-white transition-transform hover:scale-105" />
                  </Link>
                  <div className="absolute right-0 top-full hidden group-hover:block pt-2 z-50">
                    <div className="bg-[#24191D] text-white border border-[#46343A] rounded shadow-xl py-2 px-3 min-w-[200px] text-xs">
                      <p className="text-[#C1B4B8] truncate max-w-[180px] pb-1.5 border-b border-[#46343A] mb-1">{user.email}</p>
                      
                      {/* Admin Portal Shortcut if user is Admin / Staff */}
                      {(
                        ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'].includes(
                          (((user.user_metadata as any)?.role || (user.app_metadata as any)?.role || '') as string).toLowerCase().trim()
                        ) ||
                        user.email?.toLowerCase().includes('admin') ||
                        user.email === 'admin@luxury.com'
                      ) && (
                        <Link 
                          to="/admin" 
                          className="flex items-center gap-1.5 py-1.5 px-2 rounded bg-white/10 text-[#D8B878] font-semibold mb-1.5 border border-[#C6A15B]/30 hover:bg-white/20 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#C6A15B]" />
                          <span>Executive Admin Panel</span>
                        </Link>
                      )}

                      <Link to="/profile" className="block py-1.5 hover:text-[#D8B878]">My Profile</Link>
                      <Link to="/dashboard?tab=orders" className="block py-1.5 hover:text-[#D8B878]">My Orders</Link>
                      <Link to="/dashboard?tab=loans" className="block py-1.5 hover:text-[#D8B878]">My Pawn Loans</Link>
                      <Link to="/auragold?tab=VAULT" className="block py-1.5 hover:text-[#D8B878] text-[#D8B878] font-semibold">My Gold Wallet</Link>
                      <Link to="/dashboard?tab=transactions" className="block py-1.5 hover:text-[#D8B878]">Transactions</Link>
                      <Link to="/notifications" className="block py-1.5 hover:text-[#D8B878]">Notifications</Link>
                      <a href="#footer" className="block py-1.5 hover:text-[#D8B878]">Help &amp; Support</a>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 text-rose-400 py-1.5 w-full text-left mt-1 border-t border-[#46343A]"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-[#D8B878] hover:bg-white/10 transition-all focus:outline-none shrink-0"
                  aria-label="Account sign in"
                  title="Sign In"
                >
                  <User className="w-[18px] h-[18px] text-white transition-transform hover:scale-105" />
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-[#D8B878] hover:bg-white/10 focus:outline-none shrink-0"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
          {/* MEGA MENU SECONDARY NAVIGATION BAR */}
        <nav className="hidden md:block bg-[#380612] border-t border-[#C6A15B]/25 border-b border-[#C6A15B]/30 text-[11.5px] lg:text-[12px] font-sans font-medium text-white/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3.5 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7 h-10 tracking-normal whitespace-nowrap overflow-x-auto no-scrollbar">

              {/* 1. Shop All */}
              <button
                onClick={() => {
                  if (window.location.pathname !== '/') {
                    navigate('/');
                  }
                  setTimeout(() => {
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="hover-underline-gold text-[#D8B878] font-semibold py-1 transition-colors hover:text-white shrink-0"
              >
                Shop All
              </button>

              {/* 2. Necklaces */}
              <button
                onClick={() => handleNavigateFilter('category', 'Necklaces')}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-1 transition-colors shrink-0"
              >
                Necklaces
              </button>

              {/* 3. Earrings */}
              <button
                onClick={() => handleNavigateFilter('category', 'Earrings')}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-1 transition-colors shrink-0"
              >
                Earrings
              </button>

              {/* 4. Rings */}
              <button
                onClick={() => handleNavigateFilter('category', 'Rings')}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-1 transition-colors shrink-0"
              >
                Rings
              </button>

              {/* 5. Bangles */}
              <button
                onClick={() => handleNavigateFilter('category', 'Bangles and bracelets')}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-1 transition-colors shrink-0"
              >
                Bangles
              </button>

              {/* 6. Diamond Collection */}
              <button
                onClick={() => handleNavigateFilter('metal', 'Diamond')}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-1 transition-colors flex items-center gap-1 font-medium shrink-0"
              >
                <Sparkles className="w-3 h-3 text-[#D8B878]" />
                <span>Diamond Collection</span>
              </button>

              {/* 7. Bridal Collection */}
              <a
                href="#bridal"
                className="hover-underline-gold text-[#D8B878] font-semibold py-1 transition-colors hover:text-white flex items-center gap-1 shrink-0"
              >
                <span>Bridal Collection</span>
              </a>

              {/* Subtle Elegant Divider */}
              <div className="h-3.5 w-px bg-white/20 shrink-0" />

              {/* 8. Precious Metals Dropdown */}
              <div 
                className="relative group h-full flex items-center shrink-0"
                onMouseEnter={() => setActiveDropdown('metal')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-stone-200 hover:text-[#D8B878] transition-colors py-1">
                  <span>Metals</span>
                  <ChevronDown className="w-3 h-3 text-[#D8B878]" />
                </button>
                {activeDropdown === 'metal' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 bg-[#24191D] text-white border border-[#46343A] rounded-b shadow-2xl py-3 px-4 w-60 text-xs normal-case tracking-normal z-50">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#D8B878] mb-2 pb-1 border-b border-[#46343A]">Precious Metals</p>
                    <div className="space-y-1">
                      <button onClick={() => handleNavigateFilter('metal', 'Gold')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#320510] flex items-center justify-between text-stone-200 hover:text-white">
                        <span>Gold Jewellery (22K / 18K)</span>
                        <span className="text-[10px] text-[#D8B878] font-medium">916 BIS</span>
                      </button>
                      <button onClick={() => handleNavigateFilter('metal', 'Diamond')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#320510] flex items-center justify-between text-stone-200 hover:text-white">
                        <span>Diamond Solitaires</span>
                        <span className="text-[10px] text-cyan-400 font-medium">IGI / GIA</span>
                      </button>
                      <button onClick={() => handleNavigateFilter('metal', 'Silver')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#320510] flex items-center justify-between text-stone-200 hover:text-white">
                        <span>Silver &amp; Articles</span>
                        <span className="text-[10px] text-stone-400 font-medium">925 Sterling</span>
                      </button>
                      <button onClick={() => handleNavigateFilter('metal', 'Platinum')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#320510] flex items-center justify-between text-stone-200 hover:text-white">
                        <span>Platinum Bands</span>
                        <span className="text-[10px] text-indigo-300 font-medium">Pt 950</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 9. Pawn Services Link */}
              <button
                onClick={() => setIsPawnModalOpen(true)}
                className="text-stone-200 hover:text-[#D8B878] transition-colors py-1 flex items-center gap-1 font-medium shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Pawn &amp; Loans</span>
              </button>

              {/* 9.5. Old Gold Exchange Link */}
              <button
                onClick={() => setIsGoldExchangeModalOpen(true)}
                className="text-stone-200 hover:text-[#D8B878] transition-colors py-1 flex items-center gap-1 font-medium shrink-0 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Exchange Gold</span>
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">100% Value</span>
              </button>

              {/* 10. Aura Gold Link */}
              <Link
                to="/auragold"
                className="hover:text-white transition-colors py-1 flex items-center gap-1 font-medium text-[#D8B878] shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aura Gold™</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#D8B878]/20 border border-[#D8B878]/40 text-[#D8B878] font-mono">24K</span>
              </Link>

              {/* 10.5. Swarna Nidhi Scheme Link */}
              <button
                type="button"
                onClick={() => setIsSwarnaNidhiOpen(true)}
                className="hover:text-white transition-colors py-1 flex items-center gap-1 font-medium text-[#D8B878] shrink-0 cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Swarna Nidhi™</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#D8B878]/20 border border-[#D8B878]/40 text-[#D8B878]">11+1 Free</span>
              </button>

              {/* 11. Live Rates */}
              <Link
                to="/live-rates"
                className="hover:text-[#D8B878] transition-colors py-1 flex items-center gap-1 font-medium text-stone-200 shrink-0"
              >
                <Coins className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Live Rates</span>
              </Link>

              {/* 12. Bespoke Custom Studio (CAD) */}
              <Link
                to="/customize-products"
                className="hover:text-[#D8B878] transition-colors py-1 flex items-center gap-1 font-medium text-stone-200 shrink-0"
                title="Bespoke CAD Jewellery Studio"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Custom Studio</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300">CAD</span>
              </Link>

              {/* 13. Digital Gift Cards */}
              <Link
                to="/gift-cards"
                className="hover:text-[#D8B878] transition-colors py-1 flex items-center gap-1 font-medium text-stone-200 shrink-0"
                title="Yazhini Digital Gift Vouchers"
              >
                <Gift className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Gift Cards</span>
              </Link>

              {/* 14. Royal Offer Zone */}
              <Link
                to="/offer-zone"
                className="hover:text-[#D8B878] transition-colors py-1 flex items-center gap-1 font-medium text-stone-200 shrink-0"
                title="Privilege Coupons & Muhurtham Deals"
              >
                <Tag className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Offers</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-600/30 border border-red-500/50 text-red-300 font-bold animate-pulse">New</span>
              </Link>

            </div>
          </div>
        </nav>

        {/* ========================================================================= */}
        {/* MOBILE NAVIGATION DRAWER                                                  */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              variants={drawerLeftVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="md:hidden py-4 border-t border-[#C6A15B]/30 bg-[#450817] text-white px-4 space-y-4 max-h-[80vh] overflow-y-auto shadow-2xl"
            >
            {/* Mobile Live 24K Gold Rate Card */}
            <div className="pb-1">
              <LiveRateCard onClose={() => setIsMobileMenuOpen(false)} showExtended={true} />
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleExecuteSearch} className="relative flex items-center h-10 px-3.5 rounded bg-[#320510] border border-[#C6A15B]/30 overflow-hidden">
              <Search className="w-4 h-4 text-[#D8B878] shrink-0" strokeWidth={1.8} />
              <div className="h-4 w-px bg-white/20 mx-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gold, temple jewellery, diamonds, rings, coins..."
                className="w-full bg-transparent text-white placeholder-white/60 text-xs font-sans font-light focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-stone-300 hover:text-white pr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Quick shortcuts */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/live-rates"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded bg-[#320510] border border-[#C6A15B]/30 text-left flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4 text-[#D8B878]" />
                <div>
                  <span className="block font-semibold text-[11px] text-white">Live Rates</span>
                  <span className="text-[10px] text-[#D8B878] font-medium">₹{rates.gold22k}/g (22K)</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsStoreLocatorOpen(true);
                }}
                className="p-2.5 rounded bg-[#320510] border border-[#C6A15B]/30 text-left flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#D8B878]" />
                <div>
                  <span className="block font-semibold text-[11px] text-white">Store Locator</span>
                  <span className="text-[10px] text-stone-300">Book Visit</span>
                </div>
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-1 text-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#D8B878] pb-1 border-b border-[#C6A15B]/30">
                Shop Collections
              </p>
              <button onClick={() => { setIsMobileMenuOpen(false); handleNavigateFilter('category', 'all'); }} className="w-full text-left py-1.5 font-medium text-[#D8B878] hover:text-white">Shop All Jewellery</button>
              <button onClick={() => handleNavigateFilter('category', 'Necklaces')} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878]">Necklaces &amp; Harams</button>
              <button onClick={() => handleNavigateFilter('category', 'Earrings')} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878]">Earrings &amp; Jhumkas</button>
              <button onClick={() => handleNavigateFilter('category', 'Rings')} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878]">Rings &amp; Solitaires</button>
              <button onClick={() => handleNavigateFilter('category', 'Bangles and bracelets')} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878]">Bangles &amp; Bracelets</button>
              <button onClick={() => handleNavigateFilter('metal', 'Diamond')} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D8B878]" />
                <span>Diamond Collection</span>
              </button>
              <a href="#bridal" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-[#D8B878] font-medium hover:text-white">Bridal Collection &amp; Trousseau</a>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#D8B878] pb-1 border-b border-[#C6A15B]/30">
                Services &amp; Specialities
              </p>
              <Link 
                to="/auragold" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block py-1.5 text-[#D8B878] font-bold flex items-center gap-1.5 hover:text-white"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Aura Gold™ 24K Vault</span>
              </Link>
              <button onClick={() => { setIsMobileMenuOpen(false); setIsPawnModalOpen(true); }} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Pawn Services &amp; Gold Loans</span>
              </button>
              <Link 
                to="/customize-products" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="py-1.5 text-stone-200 hover:text-[#D8B878] flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D8B878]" />
                  <span>Custom Studio (Bespoke CAD)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">CAD</span>
              </Link>
              <Link 
                to="/gift-cards" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="py-1.5 text-stone-200 hover:text-[#D8B878] flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#D8B878]" />
                  <span>Digital Gift Cards</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D8B878]/20 text-[#D8B878]">Instant</span>
              </Link>
              <Link 
                to="/offer-zone" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="py-1.5 text-stone-200 hover:text-[#D8B878] flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#D8B878]" />
                  <span>Offer Zone &amp; Muhurtham Calendar</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 font-bold">New</span>
              </Link>
              <a href="#footer" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-stone-300 hover:text-[#D8B878]">Customer Support &amp; Enquiries</a>
            </div>

            {/* Mobile User Account & Sign In / Out */}
            <div className="pt-2 border-t border-[#C6A15B]/30">
              {user ? (
                <div className="bg-[#320510] rounded p-3 border border-[#C6A15B]/30 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#D8B878] font-bold text-xs shrink-0 border border-[#C6A15B]/40">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="text-[11px] text-white font-medium truncate">{user.email}</p>
                      <p className="text-[10px] text-[#D8B878] capitalize">
                        {((user.user_metadata as any)?.role || (user.app_metadata as any)?.role || 'Customer')}
                      </p>
                    </div>
                  </div>

                  {/* Admin Portal Shortcut if user is Admin / Staff */}
                  {(
                    ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'].includes(
                      (((user.user_metadata as any)?.role || (user.app_metadata as any)?.role || '') as string).toLowerCase().trim()
                    ) ||
                    user.email?.toLowerCase().includes('admin') ||
                    user.email === 'admin@luxury.com'
                  ) && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-white/10 text-[#D8B878] font-semibold text-xs border border-[#C6A15B]/40 hover:bg-white/20 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#C6A15B]" />
                      <span>Executive Admin Panel</span>
                    </Link>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 py-1.5 text-center text-[11px] bg-white/10 hover:bg-white/20 text-white rounded border border-[#C6A15B]/30 font-medium"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex-1 py-1.5 text-center text-[11px] bg-rose-600 hover:bg-rose-700 text-white rounded flex items-center justify-center gap-1 font-medium transition-colors shadow-xs"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded bg-[#C6A15B] hover:bg-[#D8B878] text-[#120D0F] font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all uppercase tracking-wider"
                >
                  <User className="w-4 h-4 text-[#120D0F]" />
                  <span>Sign In / Customer Account</span>
                </Link>
              )}
            </div>

            {/* Mobile Theme Preference Selector */}
            <div className="pt-3 border-t border-[#C6A15B]/30">
              <div className="flex items-center justify-between p-2.5 rounded bg-[#320510] border border-[#C6A15B]/30">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#D8B878]" />
                  <span className="text-xs font-medium text-white">Theme Mode</span>
                </div>
                <ThemeToggle showLabel className="!px-2.5 !py-1 text-xs !bg-[#450817] !border-[#C6A15B]/40 !text-[#D8B878] hover:!border-[#D8B878]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </header>

      {/* Supporting Modals & Drawers — Rendered outside header to ensure true viewport stacking */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        items={jewelryItems}
        updateCart={updateQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/?checkout=true#catalog');
        }}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={jewelryItems}
      />

      <StoreLocatorModal
        isOpen={isStoreLocatorOpen}
        onClose={() => setIsStoreLocatorOpen(false)}
      />

      <PriceBreakdownExplainerModal
        isOpen={isRatesExplainerOpen}
        onClose={() => setIsRatesExplainerOpen(false)}
      />

      <PawnValuationModal
        isOpen={isPawnModalOpen}
        onClose={() => setIsPawnModalOpen(false)}
      />

      <GoldExchangeModal
        isOpen={isGoldExchangeModalOpen}
        onClose={() => setIsGoldExchangeModalOpen(false)}
        onBookAppointment={() => {
          setIsGoldExchangeModalOpen(false);
          setIsStoreLocatorOpen(true);
        }}
      />

      <SwarnaNidhiModal
        isOpen={isSwarnaNidhiOpen}
        onClose={() => setIsSwarnaNidhiOpen(false)}
        onBookAppointment={() => {
          setIsSwarnaNidhiOpen(false);
          setIsStoreLocatorOpen(true);
        }}
      />

      <LiveRateModal
        isOpen={isLiveRateModalOpen}
        onClose={() => setIsLiveRateModalOpen(false)}
      />
    </>
  );
}