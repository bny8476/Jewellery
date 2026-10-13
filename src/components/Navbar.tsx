import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, User, ShoppingBag, Menu, X, ChevronDown, Sparkles, LogOut, Gem } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CartDrawer } from './CartDrawer';
import { WishlistDrawer } from './WishlistDrawer';
import { ExpandingSearchDock } from './ui/expanding-search-dock-shadcnui';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { JewelryItem } from '../lib/supabase';
import { localJewelryItems } from '../utils/localData';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, updateQuantity, totalItems } = useCart();
  const { wishlist } = useWishlist();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);

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
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  return (
    <>
      <header className="sticky top-0 z-50 bg-[#702638] text-[#FAF5F0] border-b border-[#C69A8B]/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Brand Wordmark */}
            <Link 
              to="/" 
              className="flex flex-col group focus:outline-none"
              aria-label="RCB Jewellery & Pawn Shop - Home"
            >
              <span className="font-serif tracking-[0.18em] text-lg sm:text-xl font-normal text-[#FAF5F0] uppercase leading-none group-hover:text-[#C69A8B] transition-colors">
                RCB JEWELLERY
              </span>
              <span className="text-[8px] sm:text-[9px] font-sans tracking-[0.28em] text-[#C69A8B] uppercase mt-1 font-medium">
                &amp; PAWN SHOP
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 text-xs font-sans uppercase tracking-[0.18em]" aria-label="Main Navigation">
              <Link
                to="/"
                className="relative py-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#C69A8B] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)] hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                Home
              </Link>

              <div className="relative group">
                <a
                  href="#categories"
                  className="relative py-1 inline-flex items-center gap-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors cursor-pointer after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#C69A8B] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)] hover:after:origin-bottom-left hover:after:scale-x-100"
                >
                  <span>Collections</span>
                  <ChevronDown className="w-3 h-3 text-[#C69A8B]" />
                </a>
                <div className="absolute top-full left-0 hidden group-hover:block pt-2">
                  <div className="bg-[#541C2A] border border-[#C69A8B]/30 rounded shadow-xl py-2 w-48 text-[11px] normal-case tracking-normal">
                    <a href="#categories" className="block px-4 py-2 text-[#FAF5F0] hover:bg-[#702638] hover:text-[#C69A8B]">Bridal Collection</a>
                    <a href="#categories" className="block px-4 py-2 text-[#FAF5F0] hover:bg-[#702638] hover:text-[#C69A8B]">Gold Jewellery</a>
                    <a href="#categories" className="block px-4 py-2 text-[#FAF5F0] hover:bg-[#702638] hover:text-[#C69A8B]">Diamond Collection</a>
                    <a href="#categories" className="block px-4 py-2 text-[#FAF5F0] hover:bg-[#702638] hover:text-[#C69A8B]">Traditional Jewellery</a>
                    <div className="border-t border-[#C69A8B]/20 my-1"></div>
                    <Link to="/pawn" className="block px-4 py-2 text-[#C69A8B] hover:bg-[#702638]">Pawn &amp; Collateral</Link>
                  </div>
                </div>
              </div>

              <a
                href="#bridal"
                className="relative py-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#C69A8B] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)] hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                Bridal
              </a>

              <a
                href="#story"
                className="relative py-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#C69A8B] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)] hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                About
              </a>

              <a
                href="#footer"
                className="relative py-1 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#C69A8B] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65_0.05_0.36_1)] hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                Contact
              </a>
            </nav>

            {/* Utility Icons */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              
              {/* Expanding Animated Search Dock */}
              <ExpandingSearchDock
                onSearch={(query) => {
                  navigate(`/?q=${encodeURIComponent(query)}#featured`);
                }}
                placeholder="Search jewellery, bridal, gold..."
                buttonClassName="h-8 w-8 sm:h-9 sm:w-9 bg-transparent border-transparent hover:bg-[#541C2A] text-[#FAF5F0] hover:text-[#C69A8B] p-0 shadow-none"
                inputClassName="h-8 sm:h-9 bg-[#541C2A]/95 border-[#C69A8B]/40 text-[#FAF5F0] text-xs shadow-xl"
              />

              {/* Wishlist Icon */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="p-1.5 text-[#FAF5F0] hover:text-[#C69A8B] relative transition-colors"
                aria-label={`Wishlist (${wishlist.length} items)`}
              >
                <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-[#C69A8B] text-[#C69A8B]' : 'text-[#FAF5F0]'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C69A8B] text-[#34252A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Account / User Icon */}
              {user ? (
                <div className="relative group">
                  <Link
                    to="/profile"
                    className="p-1.5 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors flex items-center gap-1.5"
                    aria-label="User profile"
                  >
                    <User className="w-5 h-5 text-[#FAF5F0]" />
                  </Link>
                  <div className="absolute right-0 top-full hidden group-hover:block pt-2">
                    <div className="bg-[#541C2A] border border-[#C69A8B]/30 rounded shadow-xl py-2 px-3 min-w-[160px] text-xs">
                      <p className="text-[#FAF5F0]/70 truncate max-w-[140px] mb-2">{user.email}</p>
                      <Link to="/profile" className="block py-1 text-[#FAF5F0] hover:text-[#C69A8B]">Account Profile</Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1 text-red-300 hover:text-red-200 py-1 w-full text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-1.5 text-[#FAF5F0] hover:text-[#C69A8B] transition-colors"
                  aria-label="Account sign in"
                >
                  <User className="w-5 h-5 text-[#FAF5F0]" />
                </Link>
              )}

              {/* Shopping Bag Icon */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-1.5 text-[#FAF5F0] hover:text-[#C69A8B] relative transition-colors"
                aria-label={`Shopping bag (${totalItems} items)`}
              >
                <ShoppingBag className="w-5 h-5 text-[#FAF5F0]" />
                <span className="absolute -top-1 -right-1 bg-[#C69A8B] text-[#34252A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 text-[#FAF5F0] hover:text-[#C69A8B] focus:outline-none"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>


          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[#C69A8B]/20 bg-[#541C2A] px-4 space-y-3">
              <Link to="/" className="block py-2 text-sm text-[#FAF5F0] hover:text-[#C69A8B] uppercase tracking-wider">Home</Link>
              <a href="#categories" className="block py-2 text-sm text-[#FAF5F0] hover:text-[#C69A8B] uppercase tracking-wider">Collections</a>
              <a href="#bridal" className="block py-2 text-sm text-[#FAF5F0] hover:text-[#C69A8B] uppercase tracking-wider">Bridal</a>
              <a href="#story" className="block py-2 text-sm text-[#FAF5F0] hover:text-[#C69A8B] uppercase tracking-wider">About Us</a>
              <Link to="/pawn" className="block py-2 text-sm text-[#C69A8B] hover:underline uppercase tracking-wider">Pawn Services</Link>
              <a href="#footer" className="block py-2 text-sm text-[#FAF5F0] hover:text-[#C69A8B] uppercase tracking-wider">Contact</a>
            </div>
          )}
        </div>

        {/* Cart & Wishlist Drawers */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          items={jewelryItems}
          updateCart={updateQuantity}
          onCheckout={() => {
            setIsCartOpen(false);
            navigate('/?checkout=true#featured');
          }}
        />
        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          items={jewelryItems}
        />
      </header>
    </>
  );
}