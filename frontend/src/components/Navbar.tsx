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
  Tag,
  Truck
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
import { drawerLeftVariants, dropdownVariants } from '../utils/motion';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface MegaMenuData {
  title: string;
  categorySlug: string;
  styles: { label: string; href: string; badge?: string }[];
  prices: { label: string; href: string }[];
  metals: { label: string; href: string; purity?: string }[];
  promo: {
    title: string;
    tagline: string;
    image: string;
    href: string;
    ctaText: string;
    badge?: string;
  };
}

const MEGA_MENUS: Record<string, MegaMenuData> = {
  earrings: {
    title: 'Earrings',
    categorySlug: 'earrings',
    styles: [
      { label: 'All Earrings', href: '/jewellery/earrings' },
      { label: 'Stud Earrings', href: '/jewellery/earrings?style=studs' },
      { label: 'Temple Jhumkas', href: '/jewellery/earrings?style=jhumkas', badge: 'Heritage' },
      { label: 'Polki Chandbalis', href: '/jewellery/earrings?style=chandbali' },
      { label: 'Solitaire Drops', href: '/jewellery/diamond-jewellery.html?category=earrings' },
      { label: 'Hoop & Huggie Earrings', href: '/jewellery/earrings?style=hoops' },
      { label: 'Sui Dhaga / Threaders', href: '/jewellery/earrings?style=threader' }
    ],
    prices: [
      { label: 'Under ₹10,000', href: '/jewellery/earrings?budget=<10k' },
      { label: '₹10,000 – ₹25,000', href: '/jewellery/earrings?budget=10k-25k' },
      { label: '₹25,000 – ₹50,000', href: '/jewellery/earrings?budget=25k-50k' },
      { label: '₹50,000 – ₹1,00,000', href: '/jewellery/earrings?budget=50k-1L' },
      { label: 'Above ₹1,00,000', href: '/jewellery/earrings?budget=>1L' }
    ],
    metals: [
      { label: '22K Yellow Gold', href: '/jewellery/earrings?metal=gold', purity: '916 BIS' },
      { label: '18K Rose Gold', href: '/jewellery/earrings?metal=rosegold', purity: '750' },
      { label: 'Natural Diamond', href: '/jewellery/diamond-jewellery.html?category=earrings', purity: 'IGI' },
      { label: 'Platinum Pt 950', href: '/jewellery/platinum-jewellery.html', purity: 'Pt 950' },
      { label: '925 Sterling Silver', href: '/jewellery/silver-jewellery.html', purity: '925' },
      { label: 'Gemstone & Navaratna', href: '/jewellery/earrings?stone=gemstone' }
    ],
    promo: {
      title: 'Solitaire Halo Studs',
      tagline: 'VVS-Clarity Natural Diamonds set in 18K Hallmarked Gold.',
      image: '/images/trend_diamond_earrings.jpg',
      href: '/jewellery/earrings',
      ctaText: 'Explore Earrings Collection',
      badge: 'Bestseller'
    }
  },
  pendants: {
    title: 'Pendants',
    categorySlug: 'pendants',
    styles: [
      { label: 'All Pendants & Lockets', href: '/jewellery/pendants' },
      { label: 'Religious & Deity Pendants', href: '/jewellery/pendants?style=deity', badge: 'Devotional' },
      { label: 'Ganesha Gold Lockets', href: '/jewellery/pendants?style=ganesha' },
      { label: 'Solitaire Diamond Drops', href: '/jewellery/diamond-jewellery.html?category=pendants' },
      { label: 'Floral & Nature Motifs', href: '/jewellery/pendants?style=floral' },
      { label: 'Diamond Nose Pins', href: '/jewellery/pendants?style=nosepin', badge: 'Trending' },
      { label: 'Heart & Contemporary', href: '/jewellery/pendants?style=heart' }
    ],
    prices: [
      { label: 'Under ₹10,000', href: '/jewellery/pendants?budget=<10k' },
      { label: '₹10,000 – ₹25,000', href: '/jewellery/pendants?budget=10k-25k' },
      { label: '₹25,000 – ₹50,000', href: '/jewellery/pendants?budget=25k-50k' },
      { label: '₹50,000 – ₹1,00,000', href: '/jewellery/pendants?budget=50k-1L' },
      { label: 'Above ₹1,00,000', href: '/jewellery/pendants?budget=>1L' }
    ],
    metals: [
      { label: '22K Yellow Gold', href: '/jewellery/pendants?metal=gold', purity: '916 BIS' },
      { label: '18K Rose Gold', href: '/jewellery/pendants?metal=rosegold', purity: '750' },
      { label: 'Certified Diamonds', href: '/jewellery/diamond-jewellery.html?category=pendants', purity: 'IGI' },
      { label: 'Colombian Emerald', href: '/jewellery/pendants?stone=emerald' },
      { label: 'Sacred Pooja Silver', href: '/jewellery/silver-jewellery.html', purity: '925' }
    ],
    promo: {
      title: 'Aashirwad Temple Pendants',
      tagline: '22K BIS Hallmarked laser-etched divine protective talismans.',
      image: '/images/gold_pendant_ganesha.jpg',
      href: '/jewellery/pendants',
      ctaText: 'Explore Pendants Collection',
      badge: 'Sacred'
    }
  },
  rings: {
    title: 'Rings',
    categorySlug: 'rings',
    styles: [
      { label: 'All Rings', href: '/jewellery/rings' },
      { label: 'Solitaire Diamond Rings', href: '/jewellery/diamond-jewellery.html?category=rings', badge: 'Solitaire' },
      { label: 'Daily Wear Gold Rings', href: '/jewellery/rings?style=daily' },
      { label: 'Cocktail Statement Rings', href: '/jewellery/rings?style=cocktail' },
      { label: 'Couple & Wedding Bands', href: '/jewellery/rings?style=couple', badge: 'Everlasting' },
      { label: 'Platinum Pt 950 Bands', href: '/jewellery/platinum-jewellery.html' },
      { label: 'Men\'s Signet Rings', href: '/jewellery/mens.html' },
      { label: 'Navaratna Gemstone Rings', href: '/jewellery/rings?style=navaratna' }
    ],
    prices: [
      { label: 'Under ₹15,000', href: '/jewellery/rings?budget=<15k' },
      { label: '₹15,000 – ₹30,000', href: '/jewellery/rings?budget=15k-30k' },
      { label: '₹30,000 – ₹60,000', href: '/jewellery/rings?budget=30k-60k' },
      { label: '₹60,000 – ₹1,50,000', href: '/jewellery/rings?budget=60k-1.5L' },
      { label: 'Above ₹1,50,000', href: '/jewellery/rings?budget=>1.5L' }
    ],
    metals: [
      { label: '22K Yellow Gold', href: '/jewellery/rings?metal=gold', purity: '916 BIS' },
      { label: '18K Rose & White Gold', href: '/jewellery/rings?metal=rosegold', purity: '750' },
      { label: 'IGI Certified Solitaires', href: '/jewellery/diamond-jewellery.html?category=rings', purity: 'IGI / GIA' },
      { label: 'Pure Platinum Pt 950', href: '/jewellery/platinum-jewellery.html', purity: 'Pt 950' },
      { label: 'Burmese Ruby & Emeralds', href: '/jewellery/rings?stone=ruby' }
    ],
    promo: {
      title: 'Celestial Solitaires',
      tagline: 'GIA & IGI Certified Solitaires set in luminous platinum and 18K gold.',
      image: '/images/ring_solitaire_diamond.jpg',
      href: '/jewellery/rings',
      ctaText: 'Explore Rings Collection',
      badge: 'Solitaire'
    }
  },
  diamond: {
    title: 'Diamond Jewellery',
    categorySlug: 'diamond-jewellery.html',
    styles: [
      { label: 'All Diamond Jewellery', href: '/jewellery/diamond-jewellery.html' },
      { label: 'Solitaire Diamond Rings', href: '/jewellery/diamond-jewellery.html?category=rings', badge: 'Iconic' },
      { label: 'Diamond Studs & Drops', href: '/jewellery/diamond-jewellery.html?category=earrings' },
      { label: 'Diamond Tennis Bracelets', href: '/jewellery/diamond-jewellery.html?category=bangles', badge: 'Luxury' },
      { label: 'Diamond Chokers & Necklaces', href: '/jewellery/diamond-jewellery.html?category=necklaces' },
      { label: 'Diamond Mangalsutra', href: '/jewellery/diamond-jewellery.html?category=traditional' },
      { label: 'Everyday Diamond Pendants', href: '/jewellery/diamond-jewellery.html?category=pendants' }
    ],
    prices: [
      { label: 'Under ₹25,000', href: '/jewellery/diamond-jewellery.html?budget=under-25k' },
      { label: '₹25,000 – ₹50,000', href: '/jewellery/diamond-jewellery.html?budget=25k-50k' },
      { label: '₹50,000 – ₹1,00,000', href: '/jewellery/diamond-jewellery.html?budget=50k-1L' },
      { label: '₹1,00,000 – ₹2,50,000', href: '/jewellery/diamond-jewellery.html?budget=1L-2.5L' },
      { label: 'Above ₹2,50,000', href: '/jewellery/diamond-jewellery.html?budget=>2.5L' }
    ],
    metals: [
      { label: 'VVS-EF Natural Diamonds', href: '/jewellery/diamond-jewellery.html?clarity=vvs', purity: 'IGI' },
      { label: '18K Yellow Gold', href: '/jewellery/diamond-jewellery.html?metal=yellowgold', purity: '750' },
      { label: '18K Rose Gold', href: '/jewellery/diamond-jewellery.html?metal=rosegold', purity: '750' },
      { label: '18K White Gold', href: '/jewellery/diamond-jewellery.html?metal=whitegold', purity: '750' },
      { label: 'Platinum & Diamond', href: '/jewellery/diamond-jewellery.html?metal=platinum', purity: 'Pt 950' },
      { label: 'Solitaire Sets (0.50ct – 3.00ct)', href: '/jewellery/diamond-jewellery.html?type=solitaire' }
    ],
    promo: {
      title: 'Aurelle Solitaire Radiance',
      tagline: '100% natural, conflict-free certified diamonds with lifetime buy-back promise.',
      image: '/images/cat_diamond.jpg',
      href: '/jewellery/diamond-jewellery.html',
      ctaText: 'Explore Diamond Suite',
      badge: 'Certified'
    }
  },
  more: {
    title: 'More Jewellery',
    categorySlug: 'more',
    styles: [
      { label: "Women's Haute Joaillerie", href: '/jewellery/women', badge: 'Curated' },
      { label: "Men's Luxury Fine Jewels", href: '/jewellery/mens', badge: 'Signature' },
      { label: 'Unisex Bullion & Bands', href: '/jewellery/unisex', badge: 'Pure' },
      { label: 'Necklaces & Regal Harams', href: '/jewellery/necklaces', badge: 'Grand' },
      { label: 'Bangles, Kadas & Bracelets', href: '/jewellery/bangles' },
      { label: 'Gold Chains & Rope Chains', href: '/jewellery/chains' },
      { label: 'Traditional Temple & Mangalsutra', href: '/jewellery/traditional', badge: 'Sacred' },
      { label: 'Pure Platinum Pt 950', href: '/jewellery/platinum-jewellery.html' },
      { label: '925 Sterling Silver & Pooja', href: '/jewellery/silver-jewellery.html' },
      { label: 'Kids & Baby Jewellery', href: '/jewellery/kids.html' },
      { label: '24K Gold Coins & Bullion', href: '/jewellery/coins.html' }
    ],
    prices: [
      { label: 'Under ₹25,000', href: '/jewellery?budget=under-25k' },
      { label: '₹25,000 – ₹50,000', href: '/jewellery?budget=25k-50k' },
      { label: '₹50,000 – ₹1,00,000', href: '/jewellery?budget=50k-1L' },
      { label: '₹1,00,000 – ₹3,00,000', href: '/jewellery?budget=1L-3L' },
      { label: 'Above ₹3,00,000', href: '/jewellery?budget=>3L' }
    ],
    metals: [
      { label: '22K BIS 916 Hallmarked Gold', href: '/jewellery/gold-jewellery.html', purity: '916 BIS' },
      { label: 'Pt 950 Pure Platinum', href: '/jewellery/platinum-jewellery.html', purity: 'Pt 950' },
      { label: '925 Fine Sterling Silver', href: '/jewellery/silver-jewellery.html', purity: '925' },
      { label: '24K 999.9 Fine Gold Bullion', href: '/jewellery/coins.html', purity: '999.9' },
      { label: 'Burmese Ruby & Kundan', href: '/jewellery/bridal', purity: 'Polki' },
      { label: 'South Sea Pearls', href: '/jewellery/necklaces?stone=pearl', purity: 'Natural' }
    ],
    promo: {
      title: 'Temple Nagas Heritage',
      tagline: 'Heirloom handcrafted bridal masterpieces inspired by ancient Tamil temple art.',
      image: '/images/necklace_temple_nagas_haram.jpg',
      href: '/jewellery',
      ctaText: 'View All Collections',
      badge: 'Heritage'
    }
  }
};

interface NavbarProps {
  onOpenOffer?: () => void;
}

export function Navbar({ onOpenOffer: _onOpenOffer }: NavbarProps = {}) {
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
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const megaMenuCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleOpenMegaMenu = (menuKey: string) => {
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
    setActiveMegaMenu(menuKey);
  };

  const handleScheduleCloseMegaMenu = () => {
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current);
    }
    megaMenuCloseTimer.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 180);
  };

  const handleCancelCloseMegaMenu = () => {
    if (megaMenuCloseTimer.current) {
      clearTimeout(megaMenuCloseTimer.current);
      megaMenuCloseTimer.current = null;
    }
  };

  // Live rate benchmark figures reactive to RateContext updates
  const buyRate24k = rates?.gold ? Math.round(rates.gold) : 14928;
  const sellRate24k = rates?.sellBack24k ? Math.round(rates.sellBack24k) : (Math.round(buyRate24k * 0.9728) || 14522);
  const rate22k = rates?.gold22k ? Math.round(rates.gold22k) : 13684;
  const rateSilver = rates?.silver ? Math.round(rates.silver) : 220;

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
    setActiveMegaMenu(null);
  }, [location.pathname, location.search]);

  // Click outside and Escape key to close mega menu, rate popover, and search dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMegaMenu(null);
        setIsSearchFocused(false);
        setIsRatePopoverOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveMegaMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    setActiveMegaMenu(null);
    setIsMobileMenuOpen(false);

    // Navigate to dedicated jewellery category landing pages (Joyalukkas UX)
    if (paramKey === 'category') {
      const lower = paramValue.toLowerCase();
      if (lower === 'all') {
        navigate('/jewellery');
        return;
      }
      if (lower === 'necklaces') {
        navigate('/jewellery/necklaces');
        return;
      }
      if (lower === 'earrings') {
        navigate('/jewellery/earrings');
        return;
      }
      if (lower === 'rings') {
        navigate('/jewellery/rings');
        return;
      }
      if (lower.includes('bangle') || lower.includes('bracelet')) {
        navigate('/jewellery/bangles');
        return;
      }
      if (lower.includes('bridal')) {
        navigate('/jewellery/bridal');
        return;
      }
      if (lower.includes('traditional') || lower.includes('temple')) {
        navigate('/jewellery/traditional');
        return;
      }
      if (lower.includes('chain')) {
        navigate('/jewellery/chains');
        return;
      }
      if (lower.includes('pendant')) {
        navigate('/jewellery/pendants');
        return;
      }
      if (lower.includes('coin') || lower.includes('bar')) {
        navigate('/jewellery/coins');
        return;
      }
    } else if (paramKey === 'metal') {
      const lower = paramValue.toLowerCase();
      if (lower === 'diamond') {
        navigate('/jewellery/diamond-jewellery.html');
        return;
      }
      if (lower === 'gold') {
        navigate('/jewellery/gold-jewellery.html');
        return;
      }
      if (lower === 'platinum') {
        navigate('/jewellery/platinum-jewellery.html');
        return;
      }
      if (lower === 'silver') {
        navigate('/jewellery/silver-jewellery.html');
        return;
      }
    }

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
      <header className={`sticky top-0 z-40 text-white transition-all duration-300 ${
        isScrolled
          ? 'bg-[#2A040D]/95 backdrop-blur-md border-b border-[#C6A15B]/40 shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
          : 'bg-[#450817] border-b border-[#C6A15B]/25 shadow-xs'
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

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                to="/jewellery-rate-comparison"
                className="hover:text-white text-[10.5px] font-semibold text-[#D8B878] transition-colors flex items-center gap-1 cursor-pointer bg-white/10 px-2 py-0.5 rounded border border-[#C6A15B]/30"
              >
                <Scale className="w-3 h-3 text-[#D8B878]" />
                <span className="hidden sm:inline">Compare Rates</span>
                <span className="sm:hidden">Compare</span>
              </Link>

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
                    style={{ backgroundColor: 'transparent' }}
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
                  <motion.span 
                    key={wishlist.length}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-1 -right-1 bg-[#D8B878] text-[#450817] text-[9.5px] font-bold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm pointer-events-none"
                  >
                    {wishlist.length}
                  </motion.span>
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
                <motion.span 
                  key={totalItems}
                  id="cart-bag-counter"
                  initial={{ scale: 0.75 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.22 }}
                  className="absolute -top-1 -right-1 bg-[#D8B878] text-[#450817] text-[9.5px] font-bold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center leading-none shadow-sm pointer-events-none transition-transform"
                >
                  {totalItems}
                </motion.span>
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
        <nav 
          ref={navContainerRef}
          className="relative hidden md:block bg-[#380612] border-t border-[#C6A15B]/25 border-b border-[#C6A15B]/30 text-[11.5px] lg:text-[12px] font-sans font-medium text-white/90"
          onMouseLeave={handleScheduleCloseMegaMenu}
        >
          <div className="max-w-[1440px] mx-auto px-2 sm:px-3 lg:px-4 xl:px-6">
            <div className="flex items-center justify-between w-full h-11 tracking-tight xl:tracking-normal whitespace-nowrap overflow-x-auto no-scrollbar">

              {/* 1. New Arrivals */}
              <Link
                to="/jewellery?badge=new-arrival"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-2 px-1 lg:px-1.5 xl:px-2 transition-colors flex items-center gap-1 font-medium shrink-0"
              >
                <span>New Arrivals</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0 whitespace-nowrap">New</span>
              </Link>

              {/* 2. Women's Collection */}
              <Link
                to="/jewellery/women"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-2 px-1 lg:px-1.5 xl:px-2 transition-colors flex items-center gap-1 font-medium shrink-0"
              >
                <span>Women</span>
              </Link>

              {/* 3. Men's Collection */}
              <Link
                to="/jewellery/mens"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-2 px-1 lg:px-1.5 xl:px-2 transition-colors flex items-center gap-1 font-medium shrink-0"
              >
                <span>Men</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#D8B878]/20 text-[#D8B878] border border-[#D8B878]/30 font-semibold shrink-0 whitespace-nowrap">New</span>
              </Link>

              {/* 4. Express Delivery */}
              <Link
                to="/jewellery?delivery=express"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-2 px-1 lg:px-1.5 xl:px-2 transition-colors flex items-center gap-1 font-medium shrink-0"
              >
                <Truck className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Express Delivery</span>
              </Link>

              {/* 3. Earrings (Mega Menu) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  navigate('/jewellery/earrings');
                }}
                onMouseEnter={() => handleOpenMegaMenu('earrings')}
                onFocus={() => handleOpenMegaMenu('earrings')}
                className={`relative flex items-center gap-1 py-2 px-1 lg:px-1.5 xl:px-2 transition-colors cursor-pointer shrink-0 font-medium ${
                  activeMegaMenu === 'earrings'
                    ? 'text-[#D8B878] bg-[#450817]'
                    : 'text-stone-200 hover:text-[#D8B878]'
                }`}
                aria-expanded={activeMegaMenu === 'earrings'}
                aria-haspopup="true"
              >
                <span>Earrings</span>
                <ChevronDown className={`w-3 h-3 text-[#D8B878] transition-transform duration-200 ${activeMegaMenu === 'earrings' ? 'rotate-180' : ''}`} />
                {activeMegaMenu === 'earrings' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D8B878]" />
                )}
              </button>

              {/* 4. Pendants (Mega Menu) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  navigate('/jewellery/pendants');
                }}
                onMouseEnter={() => handleOpenMegaMenu('pendants')}
                onFocus={() => handleOpenMegaMenu('pendants')}
                className={`relative flex items-center gap-1 py-2 px-1 lg:px-1.5 xl:px-2 transition-colors cursor-pointer shrink-0 font-medium ${
                  activeMegaMenu === 'pendants'
                    ? 'text-[#D8B878] bg-[#450817]'
                    : 'text-stone-200 hover:text-[#D8B878]'
                }`}
                aria-expanded={activeMegaMenu === 'pendants'}
                aria-haspopup="true"
              >
                <span>Pendants</span>
                <ChevronDown className={`w-3 h-3 text-[#D8B878] transition-transform duration-200 ${activeMegaMenu === 'pendants' ? 'rotate-180' : ''}`} />
                {activeMegaMenu === 'pendants' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D8B878]" />
                )}
              </button>

              {/* 5. Rings (Mega Menu) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  navigate('/jewellery/rings');
                }}
                onMouseEnter={() => handleOpenMegaMenu('rings')}
                onFocus={() => handleOpenMegaMenu('rings')}
                className={`relative flex items-center gap-1 py-2 px-1 lg:px-1.5 xl:px-2 transition-colors cursor-pointer shrink-0 font-medium ${
                  activeMegaMenu === 'rings'
                    ? 'text-[#D8B878] bg-[#450817]'
                    : 'text-stone-200 hover:text-[#D8B878]'
                }`}
                aria-expanded={activeMegaMenu === 'rings'}
                aria-haspopup="true"
              >
                <span>Rings</span>
                <ChevronDown className={`w-3 h-3 text-[#D8B878] transition-transform duration-200 ${activeMegaMenu === 'rings' ? 'rotate-180' : ''}`} />
                {activeMegaMenu === 'rings' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D8B878]" />
                )}
              </button>

              {/* 6. Diamond Jewellery (Mega Menu) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  navigate('/jewellery/diamond-jewellery.html');
                }}
                onMouseEnter={() => handleOpenMegaMenu('diamond')}
                onFocus={() => handleOpenMegaMenu('diamond')}
                className={`relative flex items-center gap-1 py-2 px-1 lg:px-1.5 xl:px-2 transition-colors cursor-pointer shrink-0 font-medium ${
                  activeMegaMenu === 'diamond'
                    ? 'text-[#D8B878] bg-[#450817]'
                    : 'text-stone-200 hover:text-[#D8B878]'
                }`}
                aria-expanded={activeMegaMenu === 'diamond'}
                aria-haspopup="true"
              >
                <Sparkles className="w-3 h-3 text-[#D8B878]" />
                <span>Diamond Jewellery</span>
                <ChevronDown className={`w-3 h-3 text-[#D8B878] transition-transform duration-200 ${activeMegaMenu === 'diamond' ? 'rotate-180' : ''}`} />
                {activeMegaMenu === 'diamond' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D8B878]" />
                )}
              </button>

              {/* 7. More Jewellery (Mega Menu) */}
              <button
                type="button"
                onClick={() => {
                  setActiveMegaMenu(null);
                  navigate('/jewellery');
                }}
                onMouseEnter={() => handleOpenMegaMenu('more')}
                onFocus={() => handleOpenMegaMenu('more')}
                className={`relative flex items-center gap-1 py-2 px-1 lg:px-1.5 xl:px-2 transition-colors cursor-pointer shrink-0 font-medium ${
                  activeMegaMenu === 'more'
                    ? 'text-[#D8B878] bg-[#450817]'
                    : 'text-stone-200 hover:text-[#D8B878]'
                }`}
                aria-expanded={activeMegaMenu === 'more'}
                aria-haspopup="true"
              >
                <span>More Jewellery</span>
                <ChevronDown className={`w-3 h-3 text-[#D8B878] transition-transform duration-200 ${activeMegaMenu === 'more' ? 'rotate-180' : ''}`} />
                {activeMegaMenu === 'more' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D8B878]" />
                )}
              </button>

              {/* 8. Gifting */}
              <Link
                to="/gift-cards"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-2 px-1 lg:px-1.5 xl:px-2 transition-colors flex items-center gap-1 font-medium shrink-0"
              >
                <Gift className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Gifting</span>
              </Link>

              {/* 9. Wedding Collections */}
              <Link
                to="/jewellery/bridal"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-[#D8B878] font-semibold py-2 px-1 lg:px-1.5 xl:px-2 transition-colors hover:text-white flex items-center gap-1 shrink-0"
              >
                <span>Wedding Collections</span>
              </Link>

              {/* 10. Aura Gold™ */}
              <Link
                to="/auragold"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-amber-300 hover:text-white py-2 px-1 lg:px-1.5 xl:px-2 transition-colors flex items-center gap-1 font-semibold shrink-0"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Aura Gold™</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono font-bold shrink-0 whitespace-nowrap">24K</span>
              </Link>

              {/* 11. Offers */}
              <Link
                to="/offer-zone"
                onClick={() => setActiveMegaMenu(null)}
                onMouseEnter={handleScheduleCloseMegaMenu}
                className="hover-underline-gold text-stone-200 hover:text-[#D8B878] py-2 px-1.5 lg:px-2 xl:px-2.5 pr-2 sm:pr-3 transition-colors flex items-center gap-1 font-medium shrink-0"
              >
                <Tag className="w-3.5 h-3.5 text-rose-400" />
                <span>Offers</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROBUST FULL-WIDTH ANCHORED MEGA-MENU CONTAINER (DIRECTLY BELOW NAV BAR) */}
          {/* ========================================================================= */}
          <AnimatePresence>
            {activeMegaMenu && MEGA_MENUS[activeMegaMenu] && (
              <motion.div 
                key={activeMegaMenu}
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                id="navbar-mega-menu"
                role="region"
                aria-label={`${MEGA_MENUS[activeMegaMenu].title} Mega Menu`}
                className="absolute top-full left-0 right-0 w-full bg-[#24191D]/98 backdrop-blur-md text-[#FAF5F0] border-t border-[#C6A15B]/30 border-b border-[#C6A15B]/35 shadow-2xl z-50"
                onMouseEnter={handleCancelCloseMegaMenu}
                onMouseLeave={handleScheduleCloseMegaMenu}
              >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
                <div className="grid grid-cols-12 gap-8 items-start">
                  
                  {/* Col 1: Shop by Style (col-span-3) */}
                  <div className="col-span-3 space-y-3">
                    <p className="text-[11px] font-sans font-bold uppercase tracking-[0.16em] text-[#D8B878] pb-1.5 border-b border-[#46343A] flex items-center justify-between">
                      <span>Shop by Style</span>
                      <span className="text-[9px] text-[#C1B4B8] font-normal lowercase">{MEGA_MENUS[activeMegaMenu].styles.length} styles</span>
                    </p>
                    <ul className="space-y-1.5 text-xs font-sans">
                      {MEGA_MENUS[activeMegaMenu].styles.map((item) => (
                        <li key={item.label}>
                          <Link
                            to={item.href}
                            onClick={() => setActiveMegaMenu(null)}
                            className="group flex items-center justify-between py-1 text-stone-300 hover:text-white transition-colors"
                          >
                            <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C6A15B]/20 text-[#D8B878] border border-[#C6A15B]/30 font-medium">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 2: Shop by Price (col-span-3) */}
                  <div className="col-span-3 space-y-3">
                    <p className="text-[11px] font-sans font-bold uppercase tracking-[0.16em] text-[#D8B878] pb-1.5 border-b border-[#46343A]">
                      Shop by Price
                    </p>
                    <ul className="space-y-1.5 text-xs font-sans">
                      {MEGA_MENUS[activeMegaMenu].prices.map((item) => (
                        <li key={item.label}>
                          <Link
                            to={item.href}
                            onClick={() => setActiveMegaMenu(null)}
                            className="group flex items-center justify-between py-1 text-stone-300 hover:text-white transition-colors"
                          >
                            <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                            <ChevronRight className="w-3 h-3 text-[#C1B4B8]/40 group-hover:text-[#D8B878] transition-colors" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2">
                      <Link
                        to={`/jewellery/${MEGA_MENUS[activeMegaMenu].categorySlug}`}
                        onClick={() => setActiveMegaMenu(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D8B878] hover:text-white transition-colors"
                      >
                        <span>View price filter options in catalogue</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Col 3: Shop by Metal & Stone (col-span-3) */}
                  <div className="col-span-3 space-y-3">
                    <p className="text-[11px] font-sans font-bold uppercase tracking-[0.16em] text-[#D8B878] pb-1.5 border-b border-[#46343A]">
                      Shop by Metal &amp; Stone
                    </p>
                    <ul className="space-y-1.5 text-xs font-sans">
                      {MEGA_MENUS[activeMegaMenu].metals.map((item) => (
                        <li key={item.label}>
                          <Link
                            to={item.href}
                            onClick={() => setActiveMegaMenu(null)}
                            className="group flex items-center justify-between py-1 text-stone-300 hover:text-white transition-colors"
                          >
                            <span className="group-hover:translate-x-1 transition-transform">{item.label}</span>
                            {item.purity && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono bg-white/5 text-[#D8B878] border border-white/10">
                                {item.purity}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 4: Promotional Image & Showcase (col-span-3) */}
                  <div className="col-span-3">
                    <div className="relative group overflow-hidden rounded-[2px] bg-[#1B1316] border border-[#46343A] p-3 shadow-lg">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] mb-3 bg-[#120D0F]">
                        <img
                          src={MEGA_MENUS[activeMegaMenu].promo.image}
                          alt={MEGA_MENUS[activeMegaMenu].promo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {MEGA_MENUS[activeMegaMenu].promo.badge && (
                          <span className="absolute top-2 left-2 bg-[#450817] text-[#D8B878] text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] border border-[#C6A15B]/40 shadow-sm">
                            {MEGA_MENUS[activeMegaMenu].promo.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-base font-normal text-white group-hover:text-[#D8B878] transition-colors leading-snug">
                        {MEGA_MENUS[activeMegaMenu].promo.title}
                      </h4>
                      <p className="text-[11px] font-sans text-[#C1B4B8] mt-1 leading-relaxed line-clamp-2">
                        {MEGA_MENUS[activeMegaMenu].promo.tagline}
                      </p>
                      <Link
                        to={MEGA_MENUS[activeMegaMenu].promo.href}
                        onClick={() => setActiveMegaMenu(null)}
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#D8B878] hover:text-white mt-2.5 transition-colors group/link"
                      >
                        <span>{MEGA_MENUS[activeMegaMenu].promo.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Link
                to="/live-rates"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded bg-[#320510] border border-[#C6A15B]/30 text-left flex flex-col justify-between"
              >
                <TrendingUp className="w-4 h-4 text-[#D8B878] mb-1" />
                <div>
                  <span className="block font-semibold text-[10px] text-white">Live Rates</span>
                  <span className="text-[9px] text-[#D8B878] font-medium">₹{rates.gold22k}/g</span>
                </div>
              </Link>

              <Link
                to="/jewellery-rate-comparison"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded bg-[#320510] border border-[#C6A15B]/30 text-left flex flex-col justify-between"
              >
                <Scale className="w-4 h-4 text-[#D8B878] mb-1" />
                <div>
                  <span className="block font-semibold text-[10px] text-white">Compare</span>
                  <span className="text-[9px] text-emerald-400 font-medium">Benchmark</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsStoreLocatorOpen(true);
                }}
                className="p-2 rounded bg-[#320510] border border-[#C6A15B]/30 text-left flex flex-col justify-between cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#D8B878] mb-1" />
                <div>
                  <span className="block font-semibold text-[10px] text-white">Boutiques</span>
                  <span className="text-[9px] text-stone-300">Book Visit</span>
                </div>
              </button>
            </div>

            {/* Shop by Gender */}
            <div className="space-y-1 text-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#D8B878] pb-1 border-b border-[#C6A15B]/30">
                Shop by Gender
              </p>
              <Link 
                to="/jewellery/women" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block py-1.5 text-stone-200 hover:text-[#D8B878] font-medium"
              >
                Women's Haute Joaillerie
              </Link>
              <Link 
                to="/jewellery/mens" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block py-1.5 text-stone-200 hover:text-[#D8B878] font-medium flex items-center justify-between"
              >
                <span>Men's Fine Jewellery</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D8B878]/20 text-[#D8B878] border border-[#D8B878]/30 font-semibold">New</span>
              </Link>
              <Link 
                to="/jewellery/unisex" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block py-1.5 text-stone-200 hover:text-[#D8B878] font-medium"
              >
                Unisex Bullion &amp; Platinum Bands
              </Link>
            </div>

            {/* Categories */}
            <div className="space-y-1 text-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#D8B878] pb-1 border-b border-[#C6A15B]/30">
                Shop Categories
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
              <button onClick={() => { setIsMobileMenuOpen(false); handleNavigateFilter('category', 'bridal'); }} className="w-full text-left py-1.5 text-[#D8B878] font-medium hover:text-white">Bridal Collection &amp; Trousseau</button>
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
              <button onClick={() => { setIsMobileMenuOpen(false); setIsPawnModalOpen(true); }} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Pawn Services &amp; Gold Loans</span>
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); setIsGoldExchangeModalOpen(true); }} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878] flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Old Gold Exchange (0% Deduction)</span>
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); setIsSwarnaNidhiOpen(true); }} className="w-full text-left py-1.5 text-stone-200 hover:text-[#D8B878] flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#D8B878]" />
                <span>Swarna Nidhi Savings Scheme</span>
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
          navigate('/checkout');
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

export default Navbar;