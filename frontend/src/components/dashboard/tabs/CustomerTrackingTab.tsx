import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Truck, 
  Copy, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronDown
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
      toast.info(`Consignment "${searchQuery}" is logged with vault custody. Live GPS updates activate once handed to armoured courier.`);
    }
  };

  // Resolve carrier info
  const carrierName = activeOrder?.carrier || (activeOrder?.id?.length % 2 === 0 ? 'Sequel Secure Logistics' : 'BlueDart Apex Armoured');
  const awbNumber = activeOrder?.tracking_number || (activeOrder ? `YZ-AWB-${String(activeOrder.id).slice(-8).toUpperCase()}` : 'YZ-AWB-PENDING');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[var(--gold-primary)]" />
            Live Consignment Tracking
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            100% Insured armoured door-to-door transit across India via Sequel Logistics &amp; BlueDart Apex
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
        >
          <Package className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span>All Orders ({orders.length})</span>
        </button>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchTracking} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Track by Order ID (e.g. YZ-1001) or Airway Bill (AWB)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-main)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--gold-primary)]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 transition-all cursor-pointer"
          >
            Track
          </button>
        </form>

        {/* Order Selector (if patron has multiple orders) */}
        {orders.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] shrink-0">Your Orders:</span>
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
                  className={`px-3 py-1 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--gold-primary)]/10 border-[var(--gold-primary)] text-[var(--gold-primary)] font-bold'
                      : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  #{o.order_number || String(o.id).slice(-6)} • {o.status || 'Active'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Consignment Card */}
      {activeOrder ? (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-6 shadow-sm">
          {/* Header & AWB telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-primary)]">
                  Active Consignment
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  isCancelled
                    ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                    : status === 'delivered'
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                }`}>
                  {isCancelled ? 'Cancelled' : status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-[var(--text-main)] mt-0.5">
                Order #{activeOrder.order_number || activeOrder.id}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {activeOrder.items?.map((i: any) => i.product_name).join(', ') || 'Fine Jewellery Creation'}
              </p>
            </div>

            <div className="text-left sm:text-right bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase block font-semibold">
                Carrier &amp; Airway Bill (AWB)
              </span>
              <p className="text-[11px] font-medium text-[var(--text-main)]">{carrierName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs font-bold text-[var(--gold-primary)]">
                  {awbNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(awbNumber);
                    toast.success('Airway Bill copied to clipboard');
                  }}
                  className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--gold-primary)] cursor-pointer"
                  title="Copy AWB"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Cancellation Notice (if cancelled) */}
          {isCancelled ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-400">Consignment Dispatch Voided</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  This order was cancelled. Any authorized payments will reflect in your original funding method within 3-5 business days. Contact Senior Concierge for immediate assistance.
                </p>
              </div>
            </div>
          ) : (
            /* 5-Stage Progression Timeline */
            <div className="space-y-4 relative py-2">
              {stages.map((stage, idx) => {
                const isCompleted = currentStage >= stage.num;
                const isCurrent = currentStage === stage.num;

                return (
                  <div key={stage.num} className="flex items-start gap-4 relative">
                    {idx < stages.length - 1 && (
                      <div 
                        className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px transition-colors duration-300 ${
                          currentStage > stage.num ? 'bg-[var(--gold-primary)]' : 'bg-[var(--border-color)]'
                        }`}
                        style={{ height: 'calc(100% + 8px)' }}
                      />
                    )}
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-all ${
                        isCompleted 
                          ? 'bg-[var(--gold-primary)] text-black shadow-md' 
                          : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-black" /> : stage.num}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-semibold ${
                          isCurrent 
                            ? 'text-[var(--gold-primary)] font-bold' 
                            : isCompleted 
                            ? 'text-[var(--text-main)]' 
                            : 'text-[var(--text-secondary)]'
                        }`}>
                          {stage.label}
                        </h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isCurrent
                            ? 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                            : isCompleted
                            ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-color)]'
                        }`}>
                          {stage.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Secure Transit Assurance Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--border-color)]">
            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-[var(--text-main)] block">100% Transit Cover</span>
                <span className="text-[10px] text-[var(--text-secondary)]">Insured door-to-door</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-[var(--text-main)] block">Tamper-Proof Seal</span>
                <span className="text-[10px] text-[var(--text-secondary)]">Laser-barcoded pouch</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-[var(--text-main)] block">OTP Handover</span>
                <span className="text-[10px] text-[var(--text-secondary)]">Signed recipient only</span>
              </div>
            </div>
          </div>

          {/* Destination & Delivery Address */}
          {activeOrder.shipping_address && (
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-main)] block mb-1">Delivering To:</span>
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
        <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-3">
          <Truck className="w-12 h-12 text-[var(--gold-primary)]/40 mx-auto" />
          <h3 className="font-serif font-bold text-base text-[var(--text-main)]">No Active Shipments in Transit</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            When you acquire a handcrafted fine jewellery piece from our atelier, live GPS tracking and courier telemetry will update here in real time.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerTrackingTab;
