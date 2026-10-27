import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Package, 
  Truck, 
  Download, 
  Printer 
} from 'lucide-react';

export interface CustomerOrdersTabProps {
  orders: any[];
  filteredOrders: any[];
  orderSearchQuery: string;
  setOrderSearchQuery: (q: string) => void;
  orderStatusFilter: 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  setOrderStatusFilter: (st: 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => void;
  onTrackOrder: (order: any) => void;
  onOpenReturnExchange: (order: any) => void;
  onDownloadTaxInvoice: (order: any) => void;
  onPrintReceipt: (order: any) => void;
  getStatusColor: (status: string) => string;
  formatCurrencyINR: (amt: number) => string;
}

export const CustomerOrdersTab: React.FC<CustomerOrdersTabProps> = ({
  orders,
  filteredOrders,
  orderSearchQuery,
  setOrderSearchQuery,
  orderStatusFilter,
  setOrderStatusFilter,
  onTrackOrder,
  onOpenReturnExchange,
  onDownloadTaxInvoice,
  onPrintReceipt,
  getStatusColor,
  formatCurrencyINR
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
            My Acquisitions &amp; Orders
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Review order history, download official tax invoices, and track live dispatches
          </p>
        </div>
        <Link
          to="/jewellery"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-xs"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shop Fine Jewellery</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={orderSearchQuery}
            onChange={e => setOrderSearchQuery(e.target.value)}
            placeholder="Search by Order #, Item Name, or AWB tracking..."
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setOrderStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                orderStatusFilter === st
                  ? 'bg-[#702638] text-white shadow-xs'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              {st === 'all' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Listing */}
      {orders.length === 0 ? (
        <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-4 p-8">
          <div className="w-16 h-16 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 flex items-center justify-center mx-auto text-[var(--gold-primary)]">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-serif text-base font-bold text-[var(--text-main)]">
              No Jewellery Acquisitions Yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Your acquisitions of BIS 916 hallmarked gold, bridal trousseaus, and IGI-certified natural diamonds will appear here with live armoured tracking and downloadable tax invoices.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/jewellery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Haute Joaillerie</span>
            </Link>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-3">
          <Package className="w-12 h-12 text-[var(--gold-primary)]/40 mx-auto" />
          <h3 className="font-serif text-sm font-bold text-[var(--text-main)]">
            No matching orders found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Try adjusting your search criteria or review our latest jewellery collections.
          </p>
          <button
            onClick={() => { setOrderSearchQuery(''); setOrderStatusFilter('all'); }}
            className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:border-[var(--gold-primary)] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 transition-all p-5 space-y-4 shadow-xs"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[var(--text-main)]">
                      #{order.order_number || order.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Total Amount</span>
                  <span className="text-base font-serif font-bold text-gold-gradient">
                    {formatCurrencyINR(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] overflow-hidden shrink-0">
                        <img
                          src={item.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-serif font-semibold text-[var(--text-main)]">
                          {item.product_name || 'Bespoke Fine Jewellery'}
                        </h4>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          Purity: {item.purity || '22K (BIS 916)'} • Weight: {item.weight || 10}g
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-[var(--text-main)]">
                      {formatCurrencyINR(item.price || order.total_amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Logistics & Delivery Summary */}
              <div className="bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>
                    {order.courier_partner || 'Sequel / BlueDart Armoured Courier'} • AWB: <strong className="font-mono text-[var(--text-main)]">{order.tracking_number || `BLUEDART-${order.id.slice(-6).toUpperCase()}`}</strong>
                  </span>
                </div>
                {order.shipping_address && (
                  <span className="text-[11px] text-[var(--text-secondary)] truncate">
                    Delivering to: {order.shipping_address.city} ({order.shipping_address.zipCode})
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenReturnExchange(order)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  Exchange / Assistance
                </button>

                <button
                  type="button"
                  onClick={() => onDownloadTaxInvoice(order)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                  <span>Download Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintReceipt(order)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#C9A45C]/50 bg-[#351018] text-[#C9A45C] hover:brightness-110 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Print tactile thermal order receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTrackOrder(order)}
                  className="px-4 py-1.5 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track Consignment</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersTab;
