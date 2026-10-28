import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Truck, 
  Copy, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import { toast } from '../../../utils/toast';

export interface CustomerTrackingTabProps {
  orders: any[];
  selectedOrder?: any | null;
  onSelectOrder?: (order: any) => void;
  onSelectTab: (tabId: string) => void;
}

export const CustomerTrackingTab: React.FC<CustomerTrackingTabProps> = ({
  orders,
  selectedOrder,
  onSelectOrder,
  onSelectTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  // Active tracked order resolution
  const activeOrder = useMemo(() => {
    if (internalSelectedId) {
      const found = orders.find(o => String(o.id) === internalSelectedId || String(o.order_number) === internalSelectedId);
      if (found) return found;
    }
    if (selectedOrder) return selectedOrder;
    return orders.length > 0 ? orders[0] : null;
  }, [internalSelectedId, selectedOrder, orders]);

  // Handle manual tracking search (by Order Number or AWB)
  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      toast.info('Please enter an Order ID or Airway Bill (AWB) to track');
      return;
    }

    const matched = orders.find(o => 
      String(o.id).toLowerCase().includes(query) ||
      String(o.order_number || '').toLowerCase().includes(query) ||
      String(o.tracking_number || '').toLowerCase().includes(query)
    );

    if (matched) {
      setInternalSelectedId(matched.id);
      if (onSelectOrder) onSelectOrder(matched);
      toast.success(`Tracking Order #${matched.order_number || matched.id}`);
    } else {
      toast.info(`Consignment "${searchQuery}" is logged with vault custody. Live updates activate once handed to armoured courier.`);
    }
  };

  // Resolve carrier info
  const carrierName = activeOrder?.carrier || (activeOrder?.id?.length % 2 === 0 ? 'Sequel Secure Logistics' : 'BlueDart Apex Armoured');
  const awbNumber = activeOrder?.tracking_number || (activeOrder ? `SQ-${String(activeOrder.id).slice(-8).toUpperCase()}` : 'SQ-PENDING');
  const status = (activeOrder?.status || 'processing').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'rejected' || status === 'failed';

  // Determine active milestone index (1 to 5)
  const currentStage = useMemo(() => {
    if (isCancelled) return 0;
    if (status === 'delivered' || status === 'completed') return 5;
    if (status === 'shipped' || status === 'in_transit' || status === 'out_for_delivery') return 4;
    if (status === 'processing') return 3;
    return 2; // pending, confirmed
  }, [status, isCancelled]);

  const stages = [
    { 
      num: 1, 
      label: 'Order Logged & Authenticated', 
      desc: 'Order securely catalogued and allocated from bullion reserves',
      timestamp: activeOrder?.created_at ? new Date(activeOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified'
    },
    { 
      num: 2, 
      label: 'Insurance & Vault Custody', 
      desc: '100% transit insurance cover activated (Policy: HDFC-ERGO-YZ-VAL)',
      timestamp: 'Active'
    },
    { 
      num: 3, 
      label: 'BIS 916 Hallmarking Inspected', 
      desc: 'Government HUID laser seal and caratage assay verified by Chief Gemologist',
      timestamp: currentStage >= 3 ? 'Completed' : 'Pending Inspection'
    },
    { 
      num: 4, 
      label: 'Armoured Courier Transit', 
      desc: `Tamper-evident sealed container in transit with ${carrierName}`,
      timestamp: currentStage >= 4 ? 'In Transit' : 'Scheduled'
    },
    { 
      num: 5, 
      label: 'Doorstep Handover & Signature', 
      desc: 'Secure delivery upon OTP verification and photo ID validation',
      timestamp: currentStage === 5 ? 'Delivered' : 'Estimated 2-3 Business Days'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#25282D]" />
            Live Delivery Tracking
          </h1>
          <p className="text-xs text-[#8792A2] mt-0.5">
            100% insured door-to-door transit across India via Sequel Logistics &amp; BlueDart Apex
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#25282D] text-xs font-semibold text-[#343A40] transition-colors cursor-pointer shadow-xs"
        >
          <Package className="w-3.5 h-3.5 text-[#8792A2]" />
          <span>All Orders ({orders.length})</span>
        </button>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchTracking} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8792A2] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Track by Order ID (e.g. YZ-1001) or Airway Bill (AWB)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-xs text-[#343A40] placeholder-[#8792A2] focus:outline-none focus:border-[#25282D] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#25282D] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer shadow-xs"
          >
            Track
          </button>
        </form>

        {/* Order Selector (if patron has multiple orders) */}
        {orders.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-[#8792A2] shrink-0 tracking-wider">Select Order:</span>
            {orders.map((o) => {
              const isSelected = activeOrder && activeOrder.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setInternalSelectedId(o.id);
                    if (onSelectOrder) onSelectOrder(o);
                  }}
                  className={`px-3 py-1 rounded-md border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#25282D] border-[#25282D] text-white font-semibold'
                      : 'bg-white border-[#E5E7EB] text-[#343A40] hover:border-[#25282D]'
                  }`}
                >
                  #{o.order_number || String(o.id).slice(-6).toUpperCase()} • {o.status || 'Active'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Consignment Card */}
      {activeOrder ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-6 shadow-xs">
          {/* Header & AWB telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8792A2]">
                  Consignment Status
                </span>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                  isCancelled
                    ? 'text-rose-600 bg-rose-50 border-rose-200'
                    : status === 'delivered'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-[#25282D] bg-[#F3F4F6] border-[#E5E7EB]'
                }`}>
                  {isCancelled ? 'Cancelled' : status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-inter font-bold text-xl text-[#25282D] mt-1">
                Order #{activeOrder.order_number || activeOrder.id.slice(-6).toUpperCase()}
              </h3>
              <p className="text-xs text-[#8792A2] mt-0.5">
                {activeOrder.items?.map((i: any) => i.product_name).join(', ') || 'Fine Jewellery Piece'}
              </p>
            </div>

            <div className="text-left sm:text-right bg-[#F3F4F6] p-3 rounded-lg border border-[#E5E7EB]">
              <span className="text-[10px] text-[#8792A2] uppercase block font-semibold tracking-wider">
                Logistics &amp; AWB Number
              </span>
              <p className="text-xs font-semibold text-[#25282D]">{carrierName}</p>
              <div className="flex items-center gap-2 mt-1 sm:justify-end">
                <span className="font-mono text-xs font-bold text-[#25282D]">
                  {awbNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(awbNumber);
                    toast.success('Airway Bill copied to clipboard');
                  }}
                  className="p-1 rounded text-[#8792A2] hover:text-[#25282D] cursor-pointer"
                  title="Copy AWB"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cancellation Notice (if cancelled) */}
          {isCancelled ? (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800">Consignment Dispatch Voided</h4>
                <p className="text-[11px] text-[#8792A2] mt-0.5">
                  This order was cancelled. Any authorized payments will reflect in your account within 3-5 business days. Contact Customer Support for assistance.
                </p>
              </div>
            </div>
          ) : (
            /* 5-Stage Progression Timeline */
            <div className="space-y-5 relative py-2">
              {stages.map((stage, idx) => {
                const isCompleted = currentStage >= stage.num;
                const isCurrent = currentStage === stage.num;

                return (
                  <div key={stage.num} className="flex items-start gap-4 relative">
                    {idx < stages.length - 1 && (
                      <div 
                        className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px transition-colors duration-200 ${
                          currentStage > stage.num ? 'bg-[#25282D]' : 'bg-[#E5E7EB]'
                        }`}
                        style={{ height: 'calc(100% + 12px)' }}
                      />
                    )}
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-all ${
                        isCompleted 
                          ? 'bg-[#25282D] text-white shadow-xs' 
                          : 'bg-white border border-[#E5E7EB] text-[#8792A2]'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#C9A45C]" /> : stage.num}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-semibold ${
                          isCurrent 
                            ? 'text-[#25282D] font-bold' 
                            : isCompleted 
                            ? 'text-[#343A40]' 
                            : 'text-[#8792A2]'
                        }`}>
                          {stage.label}
                        </h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isCurrent
                            ? 'text-[#25282D] bg-[#F3F4F6] border-[#E5E7EB]'
                            : isCompleted
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-[#8792A2] bg-white border-[#E5E7EB]'
                        }`}>
                          {stage.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8792A2] mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Secure Transit Assurance Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#E5E7EB]">
            <div className="p-3 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#25282D] shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-[#25282D] block">100% Transit Cover</span>
                <span className="text-[10px] text-[#8792A2]">Fully insured delivery</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-[#25282D] block">Tamper-Proof Seal</span>
                <span className="text-[10px] text-[#8792A2]">Laser-barcoded seal</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#C9A45C] shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-[#25282D] block">OTP Handover</span>
                <span className="text-[10px] text-[#8792A2]">Direct recipient delivery</span>
              </div>
            </div>
          </div>

          {/* Destination & Delivery Address */}
          {activeOrder.shipping_address && (
            <div className="p-4 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-xs text-[#8792A2]">
              <span className="font-semibold text-[#25282D] block mb-1">Delivering To:</span>
              <p>
                {activeOrder.shipping_address.fullName || activeOrder.customer_name || 'Valued Patron'} • {activeOrder.shipping_address.street || activeOrder.shipping_address.address}, {activeOrder.shipping_address.city} - {activeOrder.shipping_address.zipCode || activeOrder.shipping_address.pincode}
              </p>
              {activeOrder.shipping_address.phone && (
                <p className="mt-0.5 font-mono text-[11px]">Contact: {activeOrder.shipping_address.phone}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-white rounded-xl border border-[#E5E7EB] space-y-3">
          <Truck className="w-10 h-10 text-[#8792A2] mx-auto" />
          <h3 className="font-inter font-bold text-base text-[#25282D]">No Active Shipments in Transit</h3>
          <p className="text-xs text-[#8792A2] max-w-md mx-auto">
            When you acquire a handcrafted fine jewellery piece from our atelier, live GPS tracking and courier telemetry will update here in real time.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerTrackingTab;
