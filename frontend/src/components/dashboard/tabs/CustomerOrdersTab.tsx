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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D]">
            Order History &amp; Consignments
          </h1>
          <p className="text-xs text-[#8792A2] mt-0.5">
            Review your fine jewellery orders, track insured shipments, and access official tax invoices.
          </p>
        </div>
        <Link
          to="/jewellery"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shop Collections</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8792A2]" />
          <input
            type="text"
            value={orderSearchQuery}
            onChange={e => setOrderSearchQuery(e.target.value)}
            placeholder="Search by Order #, Item Name, or AWB tracking..."
            className="w-full bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#343A40] focus:outline-none focus:border-[#25282D] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setOrderStatusFilter(st)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                orderStatusFilter === st
                  ? 'bg-[#25282D] text-white shadow-xs'
                  : 'bg-white border border-[#E5E7EB] text-[#8792A2] hover:text-[#25282D] hover:border-[#25282D]'
              }`}
            >
              {st === 'all' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Listing */}
      {orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-[#E5E7EB] space-y-4 p-8">
          <div className="w-14 h-14 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#8792A2]">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-inter text-lg font-bold text-[#25282D]">
              No Orders Found
            </h3>
            <p className="text-xs text-[#8792A2] leading-relaxed">
              Your acquisitions of BIS 916 hallmarked jewellery and natural diamonds will appear here with live tracking and downloadable tax invoices.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/jewellery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Jewellery</span>
            </Link>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-[#E5E7EB] space-y-3">
          <Package className="w-10 h-10 text-[#8792A2] mx-auto" />
          <h3 className="font-inter text-base font-bold text-[#25282D]">
            No matching orders found
          </h3>
          <p className="text-xs text-[#8792A2] max-w-sm mx-auto">
            Try adjusting your search criteria or reset your filters.
          </p>
          <button
            onClick={() => { setOrderSearchQuery(''); setOrderStatusFilter('all'); }}
            className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold hover:border-[#25282D] cursor-pointer bg-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#25282D] transition-all p-5 space-y-4 shadow-xs"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-[#25282D]">
                      #{order.order_number || order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8792A2] mt-0.5">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#8792A2] uppercase tracking-wider block">Total Amount</span>
                  <span className="text-base font-inter font-bold text-[#25282D]">
                    {formatCurrencyINR(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] overflow-hidden shrink-0">
                        <img
                          src={item.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-inter font-semibold text-[#25282D] text-sm">
                          {item.product_name || 'Handcrafted Fine Jewellery'}
                        </h4>
                        <p className="text-[11px] text-[#8792A2]">
                          Purity: {item.purity || '22K (BIS 916)'} • Weight: {item.weight || 10}g
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-[#25282D] font-mono">
                      {formatCurrencyINR(item.price || order.total_amount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Logistics & Delivery Summary */}
              <div className="bg-[#F3F4F6] p-3 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#8792A2]">
                  <Truck className="w-4 h-4 text-[#25282D] shrink-0" />
                  <span>
                    {order.courier_partner || 'Sequel Armoured Express'} • AWB: <strong className="font-mono text-[#25282D]">{order.tracking_number || `SQ-${order.id.slice(-6).toUpperCase()}`}</strong>
                  </span>
                </div>
                {order.shipping_address && (
                  <span className="text-[11px] text-[#8792A2] truncate">
                    Delivering to: {order.shipping_address.city} ({order.shipping_address.zipCode})
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenReturnExchange(order)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#8792A2] hover:text-[#25282D] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                >
                  Exchange / Support
                </button>

                <button
                  type="button"
                  onClick={() => onDownloadTaxInvoice(order)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#343A40] hover:border-[#25282D] flex items-center gap-1.5 cursor-pointer transition-colors bg-white shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#8792A2]" />
                  <span>Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintReceipt(order)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#343A40] hover:border-[#25282D] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Print order receipt"
                >
                  <Printer className="w-3.5 h-3.5 text-[#8792A2]" />
                  <span>Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTrackOrder(order)}
                  className="px-4 py-1.5 rounded-lg bg-[#25282D] text-white text-xs font-semibold hover:bg-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Truck className="w-3.5 h-3.5 text-[#C9A45C]" />
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
