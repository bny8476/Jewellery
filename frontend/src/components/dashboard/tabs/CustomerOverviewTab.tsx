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
    <div className="space-y-8">
      {/* Refined Compact Welcome Panel */}
      <div className="bg-gradient-to-r from-[#4A1521] via-[#702638] to-[#2B0B13] rounded-2xl px-5 py-4 sm:px-6 sm:py-5 text-white shadow-lg border border-[#D4AF37]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FAF7F2] text-[11px] font-semibold mb-1.5">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>YAZHINI Royal Patron • Tier Gold</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Valued Patron'}
          </h1>
          <p className="text-xs text-[#E8D5D0] mt-1 max-w-xl leading-relaxed">
            Private client and fine jewellery wealth portfolio. Monitor your bespoke acquisitions, insured consignment dispatches, and 24K bullion holdings in one unified suite.
          </p>
          
          {/* Profile Completion Indicator */}
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="w-36 bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: '85%' }} />
            </div>
            <span className="text-[10px] text-[#E8D5D0] font-medium">85% Profile Completed</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab('track')}
            className="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#C5A059] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Order</span>
          </button>
          <Link
            to="/jewellery"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <span>Browse Store</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 5 Live Summary Metrics Cards (Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Orders */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Total Orders</span>
            <Package className="w-4 h-4 text-[var(--gold-primary)] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-serif font-bold text-[var(--text-main)]">
            {orders.length}
          </div>
          <span className="text-[10px] text-[var(--gold-primary)] font-medium mt-1 block">
            View order archive →
          </span>
        </button>

        {/* Active Dispatches */}
        <button
          type="button"
          onClick={() => onSelectTab('track')}
          className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">In Transit</span>
            <Truck className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-serif font-bold text-sky-500">
            {activeOrdersCount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1 block">
            Live GPS tracking →
          </span>
        </button>

        {/* Wishlist Items */}
        <button
          type="button"
          onClick={() => onSelectTab('wishlist')}
          className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Wishlist</span>
            <Heart className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-serif font-bold text-[var(--text-main)]">
            {wishlist.length}
          </div>
          <span className="text-[10px] text-rose-500 font-medium mt-1 block">
            Saved curations →
          </span>
        </button>

        {/* Aura Gold Vault */}
        <button
          type="button"
          onClick={() => onSelectTab('vault')}
          className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">24K Vault</span>
            <Coins className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-serif font-bold text-[#D4AF37] truncate">
            {goldVault ? `${goldVault.gold_balance_grams.toFixed(2)}g` : '0.00g'}
          </div>
          <span className="text-[10px] font-mono text-[var(--text-secondary)] block truncate">
            ₹{vaultMarketValue.toLocaleString('en-IN')}
          </span>
        </button>

        {/* Collateral Pawn Loans */}
        <button
          type="button"
          onClick={() => onSelectTab('loans')}
          className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Pawn Loans</span>
            <Scale className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-serif font-bold text-[var(--text-main)]">
            {activeLoans.length}
          </div>
          <span className="text-[10px] text-amber-500 font-medium mt-1 block">
            Online interest pay →
          </span>
        </button>

      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => onSelectTab('orders')}
          className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Package className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>View All Acquisitions</span>
        </button>
        <button
          onClick={() => onSelectTab('track')}
          className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Truck className="w-3.5 h-3.5 text-sky-500" />
          <span>Track Consignments</span>
        </button>
        <button
          onClick={() => onSelectTab('addresses')}
          className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span>Delivery Address Book</span>
        </button>
        <Link
          to="/auragold"
          className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5"
        >
          <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Instant 24K Bullion Buy</span>
        </Link>
        <button
          onClick={() => onSelectTab('support')}
          className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
          <span>Concierge Appointment</span>
        </button>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
          <div>
            <h3 className="font-serif font-bold text-base text-[var(--text-main)] flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--gold-primary)]" />
              Recent Acquisitions &amp; Orders
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Insured doorstep deliveries across India</p>
          </div>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs text-[var(--gold-primary)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Package className="w-10 h-10 text-[var(--gold-primary)]/40 mx-auto" />
            <p className="text-xs text-[var(--text-secondary)]">No jewellery acquisitions placed yet.</p>
            <Link
              to="/jewellery"
              className="inline-block px-4 py-2 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider"
            >
              Explore Boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--text-main)]">
                      #{order.order_number || order.id}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">• {new Date(order.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="font-serif text-xs font-medium text-[var(--text-main)]">
                    {order.items?.map((i: any) => i.product_name).join(', ') || 'Fine Jewellery Piece'}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    AWB: <span className="font-mono text-[var(--gold-primary)]">{order.tracking_number || `BLUEDART-${order.id.slice(-6).toUpperCase()}`}</span> • {order.courier_partner || 'Sequel Armoured Express'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border-color)]">
                  <span className="text-sm font-serif font-bold text-gold-gradient">
                    {formatCurrencyINR(order.total_amount)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTrackOrder(order)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] flex items-center gap-1 cursor-pointer"
                    >
                      <Truck className="w-3 h-3 text-sky-500" /> Track
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadTaxInvoice(order)}
                      className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)] cursor-pointer"
                      title="Download Tax Invoice"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(order)}
                      className="p-1.5 rounded-lg border border-[var(--gold-primary)]/40 bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] hover:bg-[var(--gold-primary)] hover:text-black transition-colors cursor-pointer"
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

      {/* Curated Recommendations Row (Real Catalogue Items) */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <div>
            <h3 className="font-serif font-bold text-base text-[var(--text-main)]">
              Curated For Your Trousseau
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Handcrafted masterpieces matching your aesthetic</p>
          </div>
          <Link to="/jewellery" className="text-xs text-[var(--gold-primary)] font-bold hover:underline">
            View Complete Catalogue →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recommendedProducts.map(product => (
            <div
              key={product.id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:border-[var(--gold-primary)]/40 transition-all flex flex-col group shadow-xs"
            >
              <div className="relative aspect-[3/4] bg-[var(--bg-elevated)] overflow-hidden">
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
                      : 'bg-black/40 text-white hover:bg-black/60'
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <Heart className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[var(--gold-primary)] tracking-wider">
                    {product.category} • {product.purity}
                  </span>
                  <h4 className="font-serif text-xs font-semibold text-[var(--text-main)] line-clamp-1 mt-0.5">
                    {product.name}
                  </h4>
                  <p className="text-xs font-bold text-gold-gradient mt-1">
                    {formatCurrencyINR(product.price)}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 py-1.5 rounded-lg border border-[var(--border-color)] text-[11px] font-semibold text-center text-[var(--text-main)] hover:border-[var(--gold-primary)]"
                  >
                    Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product.id, product.weight, null, product.image_url || undefined, product.name)}
                    className="flex-1 py-1.5 rounded-lg bg-[var(--gold-primary)] text-black text-[11px] font-bold uppercase tracking-wider hover:brightness-105 cursor-pointer"
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
