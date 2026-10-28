import React from 'react';
import { 
  Truck, 
  ShieldCheck
} from 'lucide-react';

interface CustomerAccountRightPanelProps {
  latestOrder: any | null;
  onTrackOrder: (order: any) => void;
  onOpenSupport?: () => void;
  onOpenVault?: () => void;
}

export const CustomerAccountRightPanel: React.FC<CustomerAccountRightPanelProps> = ({
  latestOrder,
  onTrackOrder,
  onOpenSupport: _onOpenSupport,
  onOpenVault: _onOpenVault
}) => {

  return (
    <div className="space-y-5">
      {/* 1. Active Order Pulse Card */}
      <div className="bg-white dark:bg-[#13151A] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#222733] shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#222733] mb-3.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8792A2] dark:text-[#8D96A5] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#25282D] dark:text-[#D8B878]" /> Order Pulse
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
          </span>
        </div>

        {latestOrder ? (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider">
                  Order #{latestOrder.order_number || latestOrder.id.slice(-6).toUpperCase()}
                </p>
                <h4 className="font-inter text-sm font-semibold text-[#25282D] dark:text-[#F7F8FA] mt-0.5 line-clamp-1">
                  {latestOrder.items?.[0]?.product_name || 'Handcrafted Fine Jewellery'}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-stone-100 dark:bg-[#181B22] text-[#25282D] dark:text-[#F7F8FA] border border-stone-200 dark:border-[#222733]">
                {latestOrder.status}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] text-[11px] space-y-1">
              <div className="flex justify-between text-[#8792A2] dark:text-[#8D96A5]">
                <span>Logistics:</span>
                <span className="font-semibold text-[#25282D] dark:text-[#F7F8FA]">
                  {latestOrder.courier_partner || 'Sequel Armoured Express'}
                </span>
              </div>
              <div className="flex justify-between text-[#8792A2] dark:text-[#8D96A5]">
                <span>Airway Bill:</span>
                <span className="font-mono text-[10px] font-bold text-[#25282D] dark:text-[#F7F8FA]">
                  {latestOrder.tracking_number || `SQ-${latestOrder.id.slice(-6).toUpperCase()}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onTrackOrder(latestOrder)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer dark:border dark:border-[#C9A45C]/40"
            >
              <Truck className="w-3.5 h-3.5 text-[#C9A45C]" /> Track Delivery
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] text-center space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#25282D] dark:text-[#D8B878] mx-auto" />
            <p className="text-xs font-semibold text-[#25282D] dark:text-[#F7F8FA]">100% Insured Transit</p>
            <p className="text-[11px] text-[#8792A2] dark:text-[#8D96A5] leading-relaxed">
              Every parcel is dispatched with full transit insurance in sealed tamper-evident security cases.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

