import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Truck, 
  Package, 
  Heart, 
  Coins, 
  Scale, 
  MapPin, 
  MessageSquare, 
  ArrowRight, 
  Download, 
  Printer 
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { CustomerAvatar } from '../CustomerAvatar';
import { AnimatedCounter, GoldShimmerText } from '../../ui/text-animations';

export interface CustomerOverviewTabProps {
  user: User | null;
  customerName?: string;
  customerGender?: string;
  customerPhotoUrl?: string;
  customerTier?: string;
  orders: any[];
  activeOrdersCount: number;
  wishlist: string[];
  goldVault: {
    account_number: string;
    gold_balance_grams: number;
    reserved_grams: number;
    market_value: number;
    transactions: any[];
  } | null;
  vaultMarketValue: number;
  activeLoans: any[];
  recommendedProducts: any[];
  onSelectTab: (tabId: string) => void;
  onTrackOrder: (order: any) => void;
  onDownloadTaxInvoice: (order: any) => void;
  onPrintReceipt: (order: any) => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (id: string, weight?: number, purity?: any, image?: string, name?: string) => void;
  getStatusColor: (status: string) => string;
  formatCurrencyINR: (amt: number) => string;
}

export const CustomerOverviewTab: React.FC<CustomerOverviewTabProps> = ({
  user,
  customerName,
  customerGender,
  customerPhotoUrl,
  customerTier,
  orders,
  activeOrdersCount,
  wishlist,
  goldVault,
  vaultMarketValue,
  activeLoans,
  recommendedProducts,
  onSelectTab,
  onTrackOrder,
  onDownloadTaxInvoice,
  onPrintReceipt,
  onToggleWishlist,
  onAddToCart,
  getStatusColor,
  formatCurrencyINR
}) => {
  const rawRealTimeName = customerName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Valued Patron';
  const realTimeName = rawRealTimeName.replace(/\s*\((?:Royal Patron|Patron)\)\s*/gi, '').replace(/\s*Royal Patron\s*/gi, '').trim() || 'Valued Patron';
  const cleanFirstName = realTimeName.replace(/\s*\(.*?\)\s*/g, '').trim().split(' ')[0] || 'Valued Patron';
  const activeGender = customerGender || user?.user_metadata?.gender || 'female';
  const rawTier = customerTier || user?.user_metadata?.loyalty_tier;
  const activeTier = (rawTier && rawTier !== 'Royal Patron') ? rawTier : '';

  return (
    <div className="space-y-6">
      {/* Refined Luxury Welcome Hero with Fine Jewellery Background & Real-time Text Animation */}
      <div className="relative overflow-hidden bg-[#1E2128] rounded-2xl p-6 sm:p-7 text-white shadow-xl border border-[#C9A45C]/25 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Fine Jewellery Image in Background with Seamless Luxury Gradient */}
        <div className="absolute inset-y-0 right-0 w-full sm:w-3/4 md:w-3/5 lg:w-1/2 pointer-events-none overflow-hidden flex justify-end">
          <img 
            src="/images/luxury_necklace_hero.jpg" 
            alt="Yazhini Fine Jewellery" 
            className="w-full h-full object-cover object-right opacity-90 sm:opacity-95 filter brightness-105 contrast-105 transition-opacity duration-300" 
          />
          {/* Subtle smooth left edge feathering so text remains legible while keeping the necklace bright and fully visible */}
          <div className="absolute inset-y-0 left-0 w-1/3 sm:w-2/5 bg-gradient-to-r from-[#1E2128] to-transparent pointer-events-none" />
        </div>

        {/* Left Side: Animated Greetings & Portfolio Progress */}
        <div className="min-w-0 relative z-10 max-w-xl flex items-start gap-4 sm:gap-5">
          <CustomerAvatar
            name={realTimeName}
            gender={activeGender}
            photoUrl={customerPhotoUrl || user?.user_metadata?.photo_url}
            size="lg"
            loyaltyTier={activeTier}
            withMotion
            className="hidden sm:inline-flex mt-1"
          />

          <div className="min-w-0 flex-1">
            {/* Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#C9A45C]/40 text-[#FAF3E8] text-[11px] font-semibold mb-2.5 shadow-2xs backdrop-blur-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D8B878] animate-pulse" />
              <span className="font-sans tracking-wide">{activeTier} • Client Portfolio</span>
            </motion.div>

            {/* Animated Heading with Shimmering Customer Name */}
            <motion.h1 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl font-inter font-bold text-white leading-tight flex items-center gap-2 flex-wrap"
            >
              <span>Welcome,</span>
              <GoldShimmerText variant="champagne" className="font-bold tracking-tight">
                {cleanFirstName}
              </GoldShimmerText>
          </motion.h1>

          {/* Animated Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-stone-300 mt-2 max-w-lg leading-relaxed font-sans"
          >
            Your jewellery account overview. Track your fine jewellery orders, insured courier dispatches, and gold bullion savings in one secure portal.
          </motion.p>
          
          {/* Profile completion indicator with animated progress bar */}
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-4 flex items-center gap-3"
          >
            <div className="w-36 sm:w-44 bg-white/15 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '85%' }}
                transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
                className="bg-gradient-to-r from-[#C9A45C] to-[#E9D19E] h-full rounded-full shadow-xs" 
              />
            </div>
            <span className="text-[11px] text-[#D8B878] font-medium tracking-wide">85% Profile Completed</span>
          </motion.div>
        </div>
      </div>
    </div>

      {/* 5 Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Orders */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className="bg-white dark:bg-[#13151A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5]">Total Orders</span>
            <Package className="w-4 h-4 text-[#8792A2] dark:text-[#8D96A5] group-hover:text-[#25282D] dark:group-hover:text-[#D8B878] transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            <AnimatedCounter value={orders.length} />
          </div>
          <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] group-hover:text-[#25282D] dark:group-hover:text-[#D8B878] font-medium mt-1 block">
            View orders →
          </span>
        </button>

        {/* Active Dispatches */}
        <button
          type="button"
          onClick={() => onSelectTab('track')}
          className="bg-white dark:bg-[#13151A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5]">In Transit</span>
            <Truck className="w-4 h-4 text-[#8792A2] dark:text-[#8D96A5] group-hover:text-[#25282D] dark:group-hover:text-[#D8B878] transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            <AnimatedCounter value={activeOrdersCount} />
          </div>
          <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] group-hover:text-[#25282D] dark:group-hover:text-[#D8B878] font-medium mt-1 block">
            Live tracking →
          </span>
        </button>

        {/* Wishlist Items */}
        <button
          type="button"
          onClick={() => onSelectTab('wishlist')}
          className="bg-white dark:bg-[#13151A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5]">Wishlist</span>
            <Heart className="w-4 h-4 text-[#8792A2] dark:text-[#8D96A5] group-hover:text-rose-500 transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            <AnimatedCounter value={wishlist.length} />
          </div>
          <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] group-hover:text-rose-500 dark:group-hover:text-rose-400 font-medium mt-1 block">
            Saved pieces →
          </span>
        </button>

        {/* Gold Vault */}
        <button
          type="button"
          onClick={() => onSelectTab('vault')}
          className="bg-white dark:bg-[#13151A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5]">Gold Vault</span>
            <Coins className="w-4 h-4 text-[#C9A45C] group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA] truncate">
            <AnimatedCounter value={goldVault ? goldVault.gold_balance_grams : 0} decimals={2} suffix="g" />
          </div>
          <span className="text-[10px] font-mono text-[#8792A2] dark:text-[#8D96A5] block truncate">
            ₹{vaultMarketValue.toLocaleString('en-IN')}
          </span>
        </button>

        {/* Gold Loans */}
        <button
          type="button"
          onClick={() => onSelectTab('loans')}
          className="bg-white dark:bg-[#13151A] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5]">Gold Loans</span>
            <Scale className="w-4 h-4 text-[#8792A2] dark:text-[#8D96A5] group-hover:text-[#25282D] dark:group-hover:text-[#D8B878] transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            <AnimatedCounter value={activeLoans.length} />
          </div>
          <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] group-hover:text-[#25282D] dark:group-hover:text-[#D8B878] font-medium mt-1 block">
            Manage loans →
          </span>
        </button>

      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => onSelectTab('orders')}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Package className="w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5]" />
          <span>All Orders</span>
        </button>
        <button
          onClick={() => onSelectTab('track')}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Truck className="w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5]" />
          <span>Track Delivery</span>
        </button>
        <button
          onClick={() => onSelectTab('addresses')}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <MapPin className="w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5]" />
          <span>Address Book</span>
        </button>
        <Link
          to="/auragold"
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Coins className="w-3.5 h-3.5 text-[#C9A45C]" />
          <span>Buy Gold Bullion</span>
        </Link>
        <button
          onClick={() => onSelectTab('support')}
          className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 hover:text-[#25282D] dark:hover:text-[#F7F8FA] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5]" />
          <span>Customer Support</span>
        </button>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-[#222733]">
          <div>
            <h3 className="font-inter font-bold text-base text-[#25282D] dark:text-[#F7F8FA] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#25282D] dark:text-[#D8B878]" />
              Recent Orders
            </h3>
            <p className="text-xs text-[#8792A2] dark:text-[#8D96A5]">Doorstep deliveries with insured transit</p>
          </div>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs text-[#25282D] dark:text-[#D8B878] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Package className="w-8 h-8 text-[#8792A2] dark:text-[#8D96A5] mx-auto" />
            <p className="text-xs text-[#8792A2] dark:text-[#8D96A5]">No jewellery orders placed yet.</p>
            <Link
              to="/jewellery"
              className="inline-block px-4 py-2 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#181B22] dark:hover:bg-[#202530] dark:border dark:border-[#222733] text-white text-xs font-semibold transition-colors"
            >
              Explore Boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => (
              <div
                key={order.id}
                className="p-4 rounded-lg bg-[#F3F4F6]/60 dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D] dark:hover:border-[#C9A45C]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#25282D] dark:text-[#F7F8FA]">
                      #{order.order_number || order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[#8792A2] dark:text-[#8D96A5]">• {new Date(order.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-inter text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2]">
                    {order.items?.map((i: any) => i.product_name).join(', ') || 'Fine Jewellery Piece'}
                  </p>
                  <p className="text-[11px] text-[#8792A2] dark:text-[#8D96A5]">
                    AWB: <span className="font-mono text-[#25282D] dark:text-[#F7F8FA] font-semibold">{order.tracking_number || `SQ-${order.id.slice(-6).toUpperCase()}`}</span> • {order.courier_partner || 'Sequel Armoured Express'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#E5E7EB] dark:border-[#222733]">
                  <span className="text-sm font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
                    {formatCurrencyINR(order.total_amount)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTrackOrder(order)}
                      className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] bg-white dark:bg-[#13151A] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 hover:text-[#25282D] dark:hover:text-[#F7F8FA] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Truck className="w-3 h-3 text-[#25282D] dark:text-[#D8B878]" /> Track
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadTaxInvoice(order)}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] bg-white dark:bg-[#13151A] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 cursor-pointer transition-colors"
                      title="Download Tax Invoice"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(order)}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] bg-white dark:bg-[#13151A] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 transition-colors cursor-pointer"
                      title="Print Thermal Order Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curated Recommendations */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <div>
            <h3 className="font-inter font-bold text-base text-[#25282D] dark:text-[#F7F8FA]">
              Recommended For You
            </h3>
            <p className="text-xs text-[#8792A2] dark:text-[#8D96A5]">Handcrafted jewellery pieces matching your collection</p>
          </div>
          <Link to="/jewellery" className="text-xs text-[#25282D] dark:text-[#D8B878] font-semibold hover:underline">
            View Catalogue →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recommendedProducts.map(product => (
            <div
              key={product.id}
              className="bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] overflow-hidden hover:border-[#25282D] dark:hover:border-[#C9A45C]/50 transition-all flex flex-col group shadow-xs"
            >
              <div className="relative aspect-[4/5] bg-gradient-to-b from-[#FAF7F1] via-[#FAF6F0] to-[#F5EFE6] dark:from-[#170E12] dark:via-[#140C10] dark:to-[#0F080C] flex items-center justify-center overflow-hidden border-b border-[#FAF0E6]/80 dark:border-[#2E1A22]/80">
                <img
                  src={product.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 select-none"
                />
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                    wishlist.includes(product.id)
                      ? 'bg-rose-500 text-white'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#8792A2] dark:text-[#8D96A5] tracking-wider">
                    {product.category} • {product.purity}
                  </span>
                  <h4 className="font-inter text-sm font-semibold text-[#25282D] dark:text-[#F7F8FA] line-clamp-1 mt-0.5">
                    {product.name}
                  </h4>
                  <p className="text-xs font-bold text-[#25282D] dark:text-[#F7F8FA] font-mono mt-1">
                    {formatCurrencyINR(product.price)}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] text-[11px] font-semibold text-center text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C]/60 hover:text-[#25282D] dark:hover:text-[#F7F8FA] bg-white dark:bg-[#181B22] transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product.id, product.weight, null, product.image_url || undefined, product.name)}
                    className="flex-1 py-1.5 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white text-[11px] font-semibold transition-colors cursor-pointer dark:border dark:border-[#C9A45C]/40"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerOverviewTab;
