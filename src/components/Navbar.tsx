import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gem, LogOut, User, ShoppingBag, Heart, Bell, Menu, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CartDrawer } from './CartDrawer';
import { WishlistDrawer } from './WishlistDrawer';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { JewelryItem } from '../lib/supabase';
import { localJewelryItems } from '../utils/localData';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, updateQuantity, totalItems } = useCart();
  const { wishlist } = useWishlist();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [jewelryItems, setJewelryItems] = useState<JewelryItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Get initial user state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth state changes
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

  // Fetch unread notifications count
  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setUnreadNotifications(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!customer) return;

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.id)
          .eq('is_read', false);

        setUnreadNotifications(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, [user]);

  // Close mobile menu on route change
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

  const isActive = (path: string) => {
    if (path === '/jewelry' || path === '/') {
      return location.pathname === '/' || location.pathname === '/jewelry';
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-color)] shadow-[var(--shadow-luxury)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus:outline-none focus:ring-1 focus:ring-amber-400/50 rounded-lg p-1"
            aria-label="RCB Jewelry's & Pawn Shop Home"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-400/30 group-hover:border-amber-400/60 transition-colors shadow-[0_0_15px_rgba(214,179,106,0.15)]">
              <Gem className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-display tracking-[0.18em] text-sm sm:text-base md:text-lg font-bold text-[var(--text-main)] uppercase group-hover:text-amber-500 transition-colors">
                RCB Jewelry’s
              </span>
              <span className="text-[10px] sm:text-[11px] font-sans tracking-[0.25em] text-[var(--gold-primary)] uppercase font-semibold">
                &amp; Pawn Shop
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" aria-label="Main Navigation">
            <Link
              to="/"
              className={`relative px-4 py-2 rounded-full text-xs lg:text-sm font-sans tracking-widest uppercase transition-all duration-300 ${
                isActive('/')
                  ? 'text-[var(--gold-primary)] font-semibold bg-amber-400/10 border border-amber-400/30 shadow-[0_0_12px_rgba(214,179,106,0.2)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Jewelry
            </Link>
            <Link
              to="/pawn"
              className={`relative px-4 py-2 rounded-full text-xs lg:text-sm font-sans tracking-widest uppercase transition-all duration-300 ${
                isActive('/pawn')
                  ? 'text-[var(--gold-primary)] font-semibold bg-amber-400/10 border border-amber-400/30 shadow-[0_0_12px_rgba(214,179,106,0.2)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Pawn
            </Link>
          </nav>

          {/* Utility Icons & Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Theme Toggle (Desktop) */}
            <ThemeToggle className="hidden sm:inline-flex" />

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] relative transition-all duration-200"
              aria-label={`Wishlist (${wishlist.length} items)`}
            >
              <Heart className={`h-5 w-5 ${wishlist.length > 0 ? 'fill-amber-500 text-amber-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] relative transition-all duration-200"
              aria-label={`Shopping bag (${totalItems} items)`}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Notifications (if user is logged in) */}
            {user && (
              <Link
                to="/notifications"
                className="p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--gold-primary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] relative transition-all duration-200"
                aria-label={`Notifications (${unreadNotifications} unread)`}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* User Account / Sign In */}
            {!loading && (
              user ? (
                <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-[var(--border-color)]">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-[var(--text-main)] group px-2 py-1.5 rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
                    aria-label="User profile"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-black flex items-center justify-center font-bold text-xs shadow-sm">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-sans text-[var(--text-secondary)] group-hover:text-[var(--text-main)] max-w-[100px] truncate">
                      {user.email?.split('@')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-full text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--bg-elevated)] transition-colors"
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-sans font-semibold tracking-wider uppercase text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(214,179,106,0.25)] hover:shadow-[0_0_20px_rgba(214,179,106,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-[var(--text-main)] hover:bg-[var(--bg-elevated)] focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6 text-amber-500" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border-color)] animate-in fade-in slide-in-from-top-2 duration-200 bg-[var(--bg-main)]">
            <div className="flex flex-col space-y-2">
              <div className="px-4 py-2 flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-2">
                <span className="text-xs font-sans text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                  Theme
                </span>
                <ThemeToggle showLabel={true} />
              </div>

              <Link
                to="/jewelry"
                className={`px-4 py-2.5 rounded-lg text-sm font-sans tracking-wider uppercase transition-colors ${
                  isActive('/jewelry') ? 'bg-amber-400/10 text-[var(--gold-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                Jewelry Collection
              </Link>
              <Link
                to="/pawn"
                className={`px-4 py-2.5 rounded-lg text-sm font-sans tracking-wider uppercase transition-colors ${
                  isActive('/pawn') ? 'bg-amber-400/10 text-[var(--gold-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                Pawn Services
              </Link>
              
              <div className="pt-2 border-t border-[var(--border-color)] mt-2">
                {user ? (
                  <div className="flex items-center justify-between px-4 py-2">
                    <Link to="/profile" className="flex items-center space-x-2 text-sm text-[var(--text-main)]">
                      <div className="h-7 w-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <span>Account ({user.email})</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-xs text-red-500 hover:text-red-400 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-black bg-gradient-to-r from-amber-300 to-amber-500 shadow-md"
                  >
                    <User className="h-4 w-4" />
                    <span>Sign In / Account</span>
                  </Link>
                )}
              </div>
            </div>
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
          navigate('/jewelry?checkout=true');
        }}
      />
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={jewelryItems}
      />
    </header>
  );
}