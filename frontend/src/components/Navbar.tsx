import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Heart, 
  User, 
  ShoppingBag, 
  Menu, 
  X, 
  ChevronDown, 
  Sparkles, 
  LogOut, 
  Gem, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Coins,
  ArrowRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CartDrawer } from './CartDrawer';
import { WishlistDrawer } from './WishlistDrawer';
import { StoreLocatorModal } from './StoreLocatorModal';
import { PriceBreakdownExplainerModal } from './PriceBreakdownExplainerModal';
import { PawnValuationModal } from './PawnValuationModal';
import { ThemeToggle } from './ThemeToggle';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRates } from '../context/RateContext';
import { JewelryItem } from '../lib/supabase';
import { localJewelryItems } from '../utils/localData';
import { formatCurrencyINR } from '../utils/formatters';
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
      <header className="sticky top-0 z-40 bg-[#702638] dark:bg-[#140509] text-[#FAF5F0] border-b border-[#C69A8B]/25 shadow-lg transition-colors duration-300">
        
        {/* Top utility row: Brand + Search + Quick Shortcuts + User Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-15 gap-2 sm:gap-4">

            {/* Brand Identity */}
            <Link 
              to="/" 
              className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none shrink-0"
              aria-label="RCB Jewellery & Pawn Shop - Home"
            >
              <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-[#C69A8B]/15 border border-[#C69A8B]/40 flex items-center justify-center text-[#C69A8B] group-hover:scale-105 group-hover:border-[#C69A8B] transition-transform shrink-0">
                <Gem className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif tracking-[0.14em] text-sm sm:text-base md:text-lg font-normal text-[#FAF5F0] uppercase leading-none group-hover:text-[#C69A8B] transition-colors">
                  RCB JEWELLERY
                </span>
                <span className="text-[7.5px] sm:text-[8px] font-sans tracking-[0.24em] text-[#C69A8B] uppercase mt-0.5 font-semibold flex items-center gap-1">
                  <span>&amp; PAWN SHOP</span>
                  <span className="hidden sm:inline text-[#FAF5F0]/40">•</span>
                  <span className="hidden sm:inline text-[7.5px] text-[#FAF5F0]/70 font-normal">EST. 1994</span>
                </span>
              </div>
            </Link>

            {/* Search Option & 22K Gold Pill Group */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 max-w-2xl mx-3 lg:mx-6">
              
              {/* Search Pill */}
              <div ref={searchContainerRef} className="relative flex-1">
                <form 
                  onSubmit={handleExecuteSearch} 
                  className="relative flex items-center h-9 px-3 rounded-full bg-[#3D0F1B]/95 dark:bg-[#1A050B]/90 border border-[#C69A8B]/60 focus-within:border-[#C69A8B] transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-[#C69A8B] shrink-0" strokeWidth={2} />
                  <div className="h-3.5 w-px bg-[#C69A8B]/35 mx-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search gold, temple jewellery, diamonds, rings, coins..."
                    className="w-full bg-transparent text-[#FAF5F0] placeholder-[#E8D5D0]/60 text-xs font-sans font-light focus:outline-none tracking-normal"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#FAF5F0]/60 hover:text-[#FAF5F0] pr-1 focus:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#FAF5F0] dark:bg-[#1C1C1C] text-[#34252A] dark:text-[#FAF5F0] rounded-2xl shadow-2xl border border-[#C69A8B]/40 overflow-hidden z-50">
                    <div className="p-2.5 border-b border-stone-200 dark:border-stone-800 text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                      Matching Products ({searchResults.length})
                    </div>
                    {searchResults.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectSearchResult(item)}
                            className="flex items-center gap-3 p-2.5 hover:bg-[#702638]/5 dark:hover:bg-[#702638]/20 cursor-pointer transition-colors"
                          >
                            <img
                              src={item.image_url || '/images/cat_rings.jpg'}
                              alt={item.name}
                              className="w-10 h-10 rounded-md object-cover border border-stone-200 dark:border-stone-700"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">{item.name}</p>
                              <p className="text-[10px] text-stone-500 dark:text-stone-400">{item.category} • {item.weight || 0}g</p>
                            </div>
                            <div className="text-xs font-semibold text-[#702638] dark:text-[#E8A598]">
                              {formatCurrencyINR(item.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-stone-500">
                        No jewellery found matching "{searchQuery}". Try "Gold", "Necklace", or "Diamond".
                      </div>
                    )}
                    <button
                      onClick={handleExecuteSearch}
                      className="w-full py-2.5 bg-[#702638] text-white text-xs font-medium hover:bg-[#541C2A] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View all matching results in catalogue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 22K Gold Rate Pill Button */}
              <button
                type="button"
                onClick={() => setIsRatesExplainerOpen(true)}
                className="relative flex items-center h-9 px-3 rounded-full bg-[#3D0F1B]/95 dark:bg-[#1A050B]/90 border border-[#C69A8B]/60 hover:border-[#C69A8B] transition-colors shrink-0 group focus:outline-none"
                title="View live 22K gold rate breakdown and pricing calculator"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#C69A8B] group-hover:scale-105 transition-transform shrink-0" strokeWidth={2} />
                <div className="h-3.5 w-px bg-[#C69A8B]/35 mx-2 shrink-0" />
                <div className="flex items-center gap-1.5 text-xs whitespace-nowrap font-sans">
                  <span className="text-[#E8D5D0] font-normal">22K Gold:</span>
                  <span className="text-[#FAF5F0] font-semibold tracking-tight">
                    ₹{rates.gold22k ? Math.round(rates.gold22k).toLocaleString('en-IN') : '13,515'}/g
                  </span>
                </div>
              </button>

            </div>

            {/* Quick Action Badges & Header Utilities */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">

              {/* Store Locator shortcut */}
              <button
                onClick={() => setIsStoreLocatorOpen(true)}
                className="hidden lg:flex items-center gap-1 h-8 px-2.5 rounded-lg text-[#FAF5F0] hover:text-[#C69A8B] hover:bg-white/5 transition-colors text-xs font-sans tracking-wide"
                title="Find RCB Store & Book In-Store Appointment"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C69A8B]" />
                <span className="text-[11px] font-medium tracking-wide">Stores</span>
              </button>

              {/* Theme Toggle (Dark / Light) */}
              <div className="flex items-center justify-center w-8 h-8">
                <ThemeToggle className="scale-85" />
              </div>

              {/* Wishlist */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[#FAF5F0] hover:text-[#C69A8B] hover:bg-white/5 relative transition-colors focus:outline-none"
                aria-label={`Wishlist (${wishlist.length} items)`}
                title="Wishlist"
              >
                <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-[#C69A8B] text-[#C69A8B]' : 'text-[#FAF5F0]'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#C69A8B] text-[#34252A] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Shopping Bag / Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[#FAF5F0] hover:text-[#C69A8B] hover:bg-white/5 relative transition-colors focus:outline-none"
                aria-label={`Shopping bag (${totalItems} items)`}
                title="Shopping Bag"
              >
                <ShoppingBag className="w-4 h-4 text-[#FAF5F0]" />
                <span className="absolute -top-0.5 -right-0.5 bg-[#C69A8B] text-[#34252A] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {totalItems}
                </span>
              </button>

              {/* User Account / Profile */}
              {user ? (
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[#FAF5F0] hover:text-[#C69A8B] hover:bg-white/5 transition-colors focus:outline-none"
                    aria-label="User profile"
                  >
                    <User className="w-4 h-4 text-[#FAF5F0]" />
                  </Link>
                  <div className="absolute right-0 top-full hidden group-hover:block pt-2 z-50">
                    <div className="bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] border border-[#C69A8B]/30 rounded-xl shadow-2xl py-2 px-3 min-w-[200px] text-xs">
                      <p className="text-stone-500 truncate max-w-[180px] pb-1.5 border-b border-stone-200 dark:border-stone-800 mb-1">{user.email}</p>
                      
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
                          className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-400/15 text-amber-700 dark:text-amber-400 font-semibold mb-1.5 border border-amber-400/30 hover:bg-amber-400/25 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                          <span>Executive Admin Panel</span>
                        </Link>
                      )}

                      <Link to="/profile" className="block py-1.5 hover:text-[#702638] dark:hover:text-[#E8A598]">My Profile</Link>
                      <Link to="/dashboard?tab=orders" className="block py-1.5 hover:text-[#702638] dark:hover:text-[#E8A598]">My Orders</Link>
                      <Link to="/dashboard?tab=loans" className="block py-1.5 hover:text-[#702638] dark:hover:text-[#E8A598]">My Pawn Loans</Link>
                      <Link to="/auragold?tab=VAULT" className="block py-1.5 hover:text-[#702638] dark:hover:text-[#E8A598] text-[#D4AF37] font-semibold">My Gold Wallet</Link>
                      <Link to="/dashboard?tab=transactions" className="block py-1.5 hover:text-[#702638] dark:hover:text-[#E8A598]">Transactions</Link>
                      <Link to="/notifications" className="block py-1.5 hover:text-[#702638] dark:hover:text-[#E8A598]">Notifications</Link>
                      <a href="#footer" className="block py-1.5 hover:text-[#702638] dark:hover:text-[#E8A598]">Help &amp; Support</a>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 text-red-600 dark:text-red-400 py-1.5 w-full text-left mt-1 border-t border-stone-200 dark:border-stone-800"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-[#FAF5F0] hover:text-[#C69A8B] hover:bg-white/5 transition-colors focus:outline-none"
                  aria-label="Account sign in"
                  title="Sign In"
                >
                  <User className="w-4 h-4 text-[#FAF5F0]" />
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-8.5 h-8.5 rounded-full flex items-center justify-center text-[#FAF5F0] hover:text-[#C69A8B] hover:bg-white/5 focus:outline-none"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* MEGA MENU SECONDARY NAVIGATION BAR */}
        <nav className="hidden md:block bg-[#541C2A] dark:bg-[#1C060D] border-t border-[#C69A8B]/20 text-[11px] lg:text-[11.5px] font-sans font-medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-9 tracking-normal">

              {/* 1. Shop by Metal */}
              <div 
                className="relative group h-full flex items-center"
                onMouseEnter={() => setActiveDropdown('metal')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1">
                  <span>Shop by Metal</span>
                  <ChevronDown className="w-3 h-3 text-[#C69A8B]/80" />
                </button>
                {activeDropdown === 'metal' && (
                  <div className="absolute top-full left-0 bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] border border-[#C69A8B]/30 rounded-b-xl shadow-2xl py-3 px-4 w-56 text-xs normal-case tracking-normal z-50">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598] mb-2">Precious Metals</p>
                    <div className="space-y-1">
                      <button onClick={() => handleNavigateFilter('metal', 'Gold')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10 dark:hover:bg-[#702638]/30 flex items-center justify-between">
                        <span>Gold Jewellery (22K / 18K)</span>
                        <span className="text-[10px] text-amber-600 font-medium">916 Hallmark</span>
                      </button>
                      <button onClick={() => handleNavigateFilter('metal', 'Diamond')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10 dark:hover:bg-[#702638]/30 flex items-center justify-between">
                        <span>Diamond Jewellery</span>
                        <span className="text-[10px] text-cyan-600 font-medium">IGI / GIA</span>
                      </button>
                      <button onClick={() => handleNavigateFilter('metal', 'Silver')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10 dark:hover:bg-[#702638]/30 flex items-center justify-between">
                        <span>Silver Jewellery &amp; Articles</span>
                        <span className="text-[10px] text-stone-500 font-medium">925 Sterling</span>
                      </button>
                      <button onClick={() => handleNavigateFilter('metal', 'Platinum')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10 dark:hover:bg-[#702638]/30 flex items-center justify-between">
                        <span>Platinum Jewellery</span>
                        <span className="text-[10px] text-blue-500 font-medium">950 Pure</span>
                      </button>
                      <button onClick={() => handleNavigateFilter('metal', 'Gemstone')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10 dark:hover:bg-[#702638]/30">
                        <span>Gemstones &amp; Navaratna</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Shop by Category (Mega Menu Dropdown) */}
              <div 
                className="relative group h-full flex items-center"
                onMouseEnter={() => setActiveDropdown('category')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1">
                  <span>Shop by Category</span>
                  <ChevronDown className="w-3 h-3 text-[#C69A8B]/80" />
                </button>
                {activeDropdown === 'category' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/3 bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] border border-[#C69A8B]/30 rounded-b-xl shadow-2xl p-6 w-[560px] text-xs normal-case tracking-normal z-50">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598] mb-2 pb-1 border-b border-stone-200 dark:border-stone-800">
                          Neck &amp; Sets
                        </p>
                        <div className="space-y-1">
                          <button onClick={() => handleNavigateFilter('category', 'Necklaces')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Necklaces</button>
                          <button onClick={() => handleNavigateFilter('category', 'Jewellery sets')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Jewellery Sets</button>
                          <button onClick={() => handleNavigateFilter('category', 'Mangalsutra')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Mangalsutra</button>
                          <button onClick={() => handleNavigateFilter('category', 'Chains')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Chains</button>
                          <button onClick={() => handleNavigateFilter('category', 'Pendants')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Pendants</button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598] mb-2 pb-1 border-b border-stone-200 dark:border-stone-800">
                          Ear &amp; Hand
                        </p>
                        <div className="space-y-1">
                          <button onClick={() => handleNavigateFilter('category', 'Earrings')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Earrings &amp; Jhumkas</button>
                          <button onClick={() => handleNavigateFilter('category', 'Rings')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Rings &amp; Bands</button>
                          <button onClick={() => handleNavigateFilter('category', 'Bangles and bracelets')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Bangles &amp; Kadas</button>
                          <button onClick={() => handleNavigateFilter('category', 'Nose pins')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Nose Pins</button>
                          <button onClick={() => handleNavigateFilter('category', 'Anklets')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/10">Anklets &amp; Kolusu</button>
                        </div>
                      </div>

                      <div className="bg-[#702638]/5 dark:bg-[#702638]/20 p-3 rounded-lg border border-[#C69A8B]/30">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598] mb-2">
                          Bullion &amp; Investment
                        </p>
                        <div className="space-y-1.5">
                          <button onClick={() => handleNavigateFilter('category', 'Gold coins and bars')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/15 font-medium flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span>24K Gold Coins</span>
                          </button>
                          <button onClick={() => handleNavigateFilter('metal', 'Silver')} className="w-full text-left px-2 py-1 rounded hover:bg-[#702638]/15 font-medium flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-stone-400" />
                            <span>Silver Pooja Coins</span>
                          </button>
                        </div>
                        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700 text-[10px] text-stone-500">
                          100% 24K 999 certified mint bars with assay certificate.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Shop by Occasion */}
              <div 
                className="relative group h-full flex items-center"
                onMouseEnter={() => setActiveDropdown('occasion')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1">
                  <span>Shop by Occasion</span>
                  <ChevronDown className="w-3 h-3 text-[#C69A8B]/80" />
                </button>
                {activeDropdown === 'occasion' && (
                  <div className="absolute top-full left-0 bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] border border-[#C69A8B]/30 rounded-b-xl shadow-2xl py-3 px-4 w-56 text-xs normal-case tracking-normal z-50">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598] mb-2">Celebrations</p>
                    <div className="space-y-1">
                      <button onClick={() => handleNavigateFilter('occasion', 'Wedding and bridal')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10 font-medium text-[#702638] dark:text-[#E8A598]">Wedding &amp; Bridal</button>
                      <button onClick={() => handleNavigateFilter('occasion', 'Engagement')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Engagement &amp; Solitaires</button>
                      <button onClick={() => handleNavigateFilter('occasion', 'Festive wear')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Festive &amp; Pooja Wear</button>
                      <button onClick={() => handleNavigateFilter('occasion', 'Daily wear')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Daily Wear Lightweight</button>
                      <button onClick={() => handleNavigateFilter('occasion', 'Office wear')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Office &amp; Workwear</button>
                      <button onClick={() => handleNavigateFilter('occasion', 'Anniversary gifts')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Anniversary Gifts</button>
                      <button onClick={() => handleNavigateFilter('occasion', 'Birthday gifts')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Birthday Gifting</button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Shop by Customer / Gender */}
              <div 
                className="relative group h-full flex items-center"
                onMouseEnter={() => setActiveDropdown('customer')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1">
                  <span>Shop by Customer</span>
                  <ChevronDown className="w-3 h-3 text-[#C69A8B]/80" />
                </button>
                {activeDropdown === 'customer' && (
                  <div className="absolute top-full left-0 bg-[#FAF5F0] dark:bg-[#1A1A1A] text-[#34252A] dark:text-[#FAF5F0] border border-[#C69A8B]/30 rounded-b-xl shadow-2xl py-3 px-4 w-48 text-xs normal-case tracking-normal z-50">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#702638] dark:text-[#E8A598] mb-2">Curated For</p>
                    <div className="space-y-1">
                      <button onClick={() => handleNavigateFilter('gender', 'Women')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Women's Collection</button>
                      <button onClick={() => handleNavigateFilter('gender', 'Men')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Men's Kadas, Rings &amp; Chains</button>
                      <button onClick={() => handleNavigateFilter('gender', 'Kids')} className="w-full text-left px-2 py-1.5 rounded hover:bg-[#702638]/10">Kids' Nazariya &amp; Earrings</button>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Bridal Destination Link */}
              <a 
                href="#bridal"
                className="text-[#C69A8B] hover:text-white transition-colors py-1 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bridal Trousseau</span>
              </a>

              {/* 6. Pawn Services Link */}
              <button
                onClick={() => setIsPawnModalOpen(true)}
                className="text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1 flex items-center gap-1 font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C69A8B]" />
                <span>Pawn &amp; Loans</span>
              </button>

              {/* 7. Aura Gold Link */}
              <Link
                to="/auragold"
                className="text-[#D4AF37] hover:text-white transition-colors py-1 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Aura Gold™</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-white font-mono font-normal">24K</span>
              </Link>

              {/* 8. Live Rates Link */}
              <Link
                to="/live-rates"
                className="text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1 flex items-center gap-1 text-amber-300 font-medium"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Rates</span>
              </Link>

              {/* 9. Store Locator Button */}
              <button
                onClick={() => setIsStoreLocatorOpen(true)}
                className="text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1 flex items-center gap-1 font-medium"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C69A8B]" />
                <span>Store Locator</span>
              </button>

              {/* 10. Contact / Support */}
              <a 
                href="#footer"
                className="text-[#FAF5F0] hover:text-[#C69A8B] transition-colors py-1 font-medium"
              >
                Contact
              </a>
            </div>
          </div>
        </nav>

        {/* ========================================================================= */}
        {/* MOBILE NAVIGATION DRAWER                                                  */}
        {/* ========================================================================= */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#C69A8B]/20 bg-[#541C2A] dark:bg-[#1C060D] px-4 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Mobile Search */}
            <form onSubmit={handleExecuteSearch} className="relative flex items-center h-10 px-3.5 rounded-full bg-[#3D0F1B]/95 dark:bg-[#1A050B]/90 border border-[#C69A8B]/70 overflow-hidden">
              <Search className="w-4 h-4 text-[#C69A8B] shrink-0" strokeWidth={1.8} />
              <div className="h-4 w-px bg-[#C69A8B]/35 mx-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gold, temple jewellery, diamonds, rings, coins..."
                className="w-full bg-transparent text-[#FAF5F0] placeholder-[#E8D5D0]/65 text-xs font-sans font-light focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#FAF5F0]/60 hover:text-[#FAF5F0] pr-1"
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
                className="p-2.5 rounded-lg bg-[#250810] border border-[#C69A8B]/30 text-left flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4 text-[#C69A8B]" />
                <div>
                  <span className="block font-semibold text-[11px]">Live Rates Hub</span>
                  <span className="text-[10px] text-[#C69A8B]">₹{rates.gold22k}/g (22K)</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsStoreLocatorOpen(true);
                }}
                className="p-2.5 rounded-lg bg-[#250810] border border-[#C69A8B]/30 text-left flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#C69A8B]" />
                <div>
                  <span className="block font-semibold text-[11px]">Store Locator</span>
                  <span className="text-[10px] text-stone-400">Book Visit</span>
                </div>
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-1 text-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#C69A8B] pb-1 border-b border-[#C69A8B]/20">
                Explore Categories
              </p>
              <button onClick={() => handleNavigateFilter('category', 'Necklaces')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Necklaces &amp; Harams</button>
              <button onClick={() => handleNavigateFilter('category', 'Jewellery sets')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Bridal Jewellery Sets</button>
              <button onClick={() => handleNavigateFilter('category', 'Earrings')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Earrings &amp; Jhumkas</button>
              <button onClick={() => handleNavigateFilter('category', 'Rings')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Rings &amp; Solitaires</button>
              <button onClick={() => handleNavigateFilter('category', 'Bangles and bracelets')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Bangles &amp; Bracelets</button>
              <button onClick={() => handleNavigateFilter('category', 'Gold coins and bars')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">24K Gold Coins &amp; Bullion</button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#C69A8B] pb-1 border-b border-[#C69A8B]/20">
                Special Collections &amp; Services
              </p>
              <Link 
                to="/auragold" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block py-1.5 text-[#D4AF37] font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Aura Gold™ 24K Vault</span>
              </Link>
              <a href="#bridal" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 text-[#C69A8B] font-semibold">South Indian Bridal Trousseau</a>
              <button onClick={() => { setIsMobileMenuOpen(false); setIsPawnModalOpen(true); }} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Pawn Services &amp; Gold Loans</button>
              <button onClick={() => handleNavigateFilter('gender', 'Men')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Men's Jewellery</button>
              <button onClick={() => handleNavigateFilter('gender', 'Kids')} className="w-full text-left py-1.5 hover:text-[#C69A8B]">Kids' Jewellery</button>
              <a href="#footer" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 hover:text-[#C69A8B]">Customer Support &amp; Enquiries</a>
            </div>

            {/* Mobile User Account & Sign In / Out */}
            <div className="pt-2 border-t border-[#C69A8B]/20">
              {user ? (
                <div className="bg-[#250810] rounded-xl p-3 border border-[#C69A8B]/30 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#702638] flex items-center justify-center text-amber-300 font-bold text-xs shrink-0 border border-amber-400/40">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="text-[11px] text-[#FAF5F0] font-medium truncate">{user.email}</p>
                      <p className="text-[10px] text-amber-400/90 capitalize">
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500/20 text-amber-400 font-semibold text-xs border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Executive Admin Panel</span>
                    </Link>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 py-1.5 text-center text-[11px] bg-[#34121D] hover:bg-[#451827] text-stone-200 rounded-lg border border-[#C69A8B]/20 font-medium"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex-1 py-1.5 text-center text-[11px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/40 flex items-center justify-center gap-1 font-medium transition-colors"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8942A] hover:brightness-110 text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <User className="w-4 h-4 text-black" />
                  <span>Sign In / Create Royal Account</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Supporting Modals & Drawers */}
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
      </header>
    </>
  );
}