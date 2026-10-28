import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Truck, 
  ArrowUpRight, 
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

export interface CustomerOverviewTabProps {
  user: User | null;
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
  return (
    <div className="space-y-6">
      {/* Refined Luxury Welcome Hero */}
      <div className="bg-[#25282D] rounded-xl px-6 py-6 text-white shadow-xs border border-[#25282D] flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-[#C9A45C]/30 text-[#FAF3E8] text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-[#C9A45C]" />
            <span className="font-sans">Client Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-inter font-bold text-white leading-tight">
            Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'Valued Patron'}
          </h1>
          <p className="text-xs text-stone-300 mt-1.5 max-w-xl leading-relaxed font-sans">
            Your jewellery account overview. Track your fine jewellery orders, insured courier dispatches, and gold bullion savings in one secure portal.
          </p>
          
          {/* Profile completion indicator */}
          <div className="mt-3 flex items-center gap-3">
            <div className="w-36 bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#C9A45C] h-full rounded-full" style={{ width: '85%' }} />
            </div>
            <span className="text-[10px] text-stone-300 font-medium">85% Profile Completed</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab('track')}
            className="px-4 py-2.5 rounded-lg bg-white text-[#25282D] text-xs font-semibold hover:bg-[#F3F4F6] transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-[#25282D]" />
            <span>Track Delivery</span>
          </button>
          <Link
            to="/jewellery"
            className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 transition-colors flex items-center gap-1.5"
          >
            <span>Explore Boutique</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 5 Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Orders */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className="bg-white p-4 rounded-xl border border-[#E5E7EB] hover:border-[#25282D] transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2]">Total Orders</span>
            <Package className="w-4 h-4 text-[#8792A2] group-hover:text-[#25282D] transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D]">
            {orders.length}
          </div>
          <span className="text-[10px] text-[#8792A2] group-hover:text-[#25282D] font-medium mt-1 block">
            View orders →
          </span>
        </button>

        {/* Active Dispatches */}
        <button
          type="button"
          onClick={() => onSelectTab('track')}
          className="bg-white p-4 rounded-xl border border-[#E5E7EB] hover:border-[#25282D] transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2]">In Transit</span>
            <Truck className="w-4 h-4 text-[#8792A2] group-hover:text-[#25282D] transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D]">
            {activeOrdersCount}
          </div>
          <span className="text-[10px] text-[#8792A2] group-hover:text-[#25282D] font-medium mt-1 block">
            Live tracking →
          </span>
        </button>

        {/* Wishlist Items */}
        <button
          type="button"
          onClick={() => onSelectTab('wishlist')}
          className="bg-white p-4 rounded-xl border border-[#E5E7EB] hover:border-[#25282D] transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2]">Wishlist</span>
            <Heart className="w-4 h-4 text-[#8792A2] group-hover:text-rose-500 transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D]">
            {wishlist.length}
          </div>
          <span className="text-[10px] text-[#8792A2] group-hover:text-rose-500 font-medium mt-1 block">
            Saved pieces →
          </span>
        </button>

        {/* Gold Vault */}
        <button
          type="button"
          onClick={() => onSelectTab('vault')}
          className="bg-white p-4 rounded-xl border border-[#E5E7EB] hover:border-[#25282D] transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2]">Gold Vault</span>
            <Coins className="w-4 h-4 text-[#C9A45C] group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D] truncate">
            {goldVault ? `${goldVault.gold_balance_grams.toFixed(2)}g` : '0.00g'}
          </div>
          <span className="text-[10px] font-mono text-[#8792A2] block truncate">
            ₹{vaultMarketValue.toLocaleString('en-IN')}
          </span>
        </button>

        {/* Gold Loans */}
        <button
          type="button"
          onClick={() => onSelectTab('loans')}
          className="bg-white p-4 rounded-xl border border-[#E5E7EB] hover:border-[#25282D] transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2]">Gold Loans</span>
            <Scale className="w-4 h-4 text-[#8792A2] group-hover:text-[#25282D] transition-colors" />
          </div>
          <div className="text-2xl font-inter font-bold text-[#25282D]">
            {activeLoans.length}
          </div>
          <span className="text-[10px] text-[#8792A2] group-hover:text-[#25282D] font-medium mt-1 block">
            Manage loans →
          </span>
        </button>

      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => onSelectTab('orders')}
          className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Package className="w-3.5 h-3.5 text-[#8792A2]" />
          <span>All Orders</span>
        </button>
        <button
          onClick={() => onSelectTab('track')}
          className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Truck className="w-3.5 h-3.5 text-[#8792A2]" />
          <span>Track Delivery</span>
        </button>
        <button
          onClick={() => onSelectTab('addresses')}
          className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <MapPin className="w-3.5 h-3.5 text-[#8792A2]" />
          <span>Address Book</span>
        </button>
        <Link
          to="/auragold"
          className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Coins className="w-3.5 h-3.5 text-[#C9A45C]" />
          <span>Buy Gold Bullion</span>
        </Link>
        <button
          onClick={() => onSelectTab('support')}
          className="px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#8792A2]" />
          <span>Customer Support</span>
        </button>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
          <div>
            <h3 className="font-inter font-bold text-base text-[#25282D] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#25282D]" />
              Recent Orders
            </h3>
            <p className="text-xs text-[#8792A2]">Doorstep deliveries with insured transit</p>
          </div>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs text-[#25282D] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Package className="w-8 h-8 text-[#8792A2] mx-auto" />
            <p className="text-xs text-[#8792A2]">No jewellery orders placed yet.</p>
            <Link
              to="/jewellery"
              className="inline-block px-4 py-2 rounded-lg bg-[#25282D] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              Explore Boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => (
              <div
                key={order.id}
                className="p-4 rounded-lg bg-[#F3F4F6]/60 border border-[#E5E7EB] hover:border-[#25282D] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#25282D]">
                      #{order.order_number || order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[#8792A2]">• {new Date(order.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-inter text-xs font-semibold text-[#343A40]">
                    {order.items?.map((i: any) => i.product_name).join(', ') || 'Fine Jewellery Piece'}
                  </p>
                  <p className="text-[11px] text-[#8792A2]">
                    AWB: <span className="font-mono text-[#25282D] font-semibold">{order.tracking_number || `SQ-${order.id.slice(-6).toUpperCase()}`}</span> • {order.courier_partner || 'Sequel Armoured Express'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#E5E7EB]">
                  <span className="text-sm font-inter font-bold text-[#25282D]">
                    {formatCurrencyINR(order.total_amount)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTrackOrder(order)}
                      className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Truck className="w-3 h-3 text-[#25282D]" /> Track
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadTaxInvoice(order)}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#8792A2] hover:text-[#25282D] hover:border-[#25282D] cursor-pointer transition-colors"
                      title="Download Tax Invoice"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(order)}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#8792A2] hover:text-[#25282D] hover:border-[#25282D] transition-colors cursor-pointer"
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
            <h3 className="font-inter font-bold text-base text-[#25282D]">
              Recommended For You
            </h3>
            <p className="text-xs text-[#8792A2]">Handcrafted jewellery pieces matching your collection</p>
          </div>
          <Link to="/jewellery" className="text-xs text-[#25282D] font-semibold hover:underline">
            View Catalogue →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recommendedProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:border-[#25282D] transition-all flex flex-col group shadow-xs"
            >
              <div className="relative aspect-[3/4] bg-[#F3F4F6] overflow-hidden">
                <img
                  src={product.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <span className="text-[10px] font-semibold uppercase text-[#8792A2] tracking-wider">
                    {product.category} • {product.purity}
                  </span>
                  <h4 className="font-inter text-sm font-semibold text-[#25282D] line-clamp-1 mt-0.5">
                    {product.name}
                  </h4>
                  <p className="text-xs font-bold text-[#25282D] font-mono mt-1">
                    {formatCurrencyINR(product.price)}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] text-[11px] font-semibold text-center text-[#343A40] hover:border-[#25282D] hover:text-[#25282D] transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product.id, product.weight, null, product.image_url || undefined, product.name)}
                    className="flex-1 py-1.5 rounded-lg bg-[#25282D] text-white text-[11px] font-semibold hover:bg-black transition-colors cursor-pointer"
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
