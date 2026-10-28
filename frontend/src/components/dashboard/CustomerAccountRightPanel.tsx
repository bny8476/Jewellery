import React from 'react';
import { 
  Truck, 
  ShieldCheck, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { useRates } from '../../context/RateContext';

interface CustomerAccountRightPanelProps {
  latestOrder: any | null;
  onTrackOrder: (order: any) => void;
  onOpenSupport: () => void;
  onOpenVault: () => void;
}

export const CustomerAccountRightPanel: React.FC<CustomerAccountRightPanelProps> = ({
  latestOrder,
  onTrackOrder,
  onOpenSupport,
  onOpenVault
}) => {
  const { rates } = useRates();

  const gold24k = rates.gold || 14928;
  const gold22k = rates.gold22k || 13684;
  const silver = rates.silver || 220;
  const platinum = rates.platinum || 5085;

  return (
    <div className="space-y-5">
      {/* 1. Active Order Pulse Card */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8792A2] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#25282D]" /> Order Pulse
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
          </span>
        </div>

        {latestOrder ? (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-[#8792A2] uppercase tracking-wider">
                  Order #{latestOrder.order_number || latestOrder.id.slice(-6).toUpperCase()}
                </p>
                <h4 className="font-inter text-sm font-semibold text-[#25282D] mt-0.5 line-clamp-1">
                  {latestOrder.items?.[0]?.product_name || 'Handcrafted Fine Jewellery'}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-stone-100 text-[#25282D] border border-stone-200">
                {latestOrder.status}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[11px] space-y-1">
              <div className="flex justify-between text-[#8792A2]">
                <span>Logistics:</span>
                <span className="font-semibold text-[#25282D]">
                  {latestOrder.courier_partner || 'Sequel Armoured Express'}
                </span>
              </div>
              <div className="flex justify-between text-[#8792A2]">
                <span>Airway Bill:</span>
                <span className="font-mono text-[10px] font-bold text-[#25282D]">
                  {latestOrder.tracking_number || `SQ-${latestOrder.id.slice(-6).toUpperCase()}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onTrackOrder(latestOrder)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#C9A45C]" /> Track Delivery
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-center space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#25282D] mx-auto" />
            <p className="text-xs font-semibold text-[#25282D]">100% Insured Transit</p>
            <p className="text-[11px] text-[#8792A2] leading-relaxed">
              Every parcel is dispatched with full transit insurance in sealed tamper-evident security cases.
            </p>
          </div>
        )}
      </div>

      {/* 2. Customer Concierge Desk */}
      <div className="bg-[#25282D] p-5 rounded-xl text-white shadow-xs border border-[#25282D]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#C9A45C]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-inter font-bold text-white tracking-wide">Private Patron Concierge</h4>
            <p className="text-[10px] text-[#8792A2]">Mr. S. Natarajan • Senior Advisor</p>
          </div>
        </div>

        <p className="text-[11px] text-stone-300 leading-relaxed mb-4">
          Personalized assistance for bespoke bridal selections, hallmark verifications, and private appointments.
        </p>

        <div className="space-y-2">
          <a
            href="https://wa.me/919840123456?text=Hello%20YAZHINI%20Concierge%2C%20I%20am%20a%20patron%20requesting%20assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onOpenSupport}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Book Boutique Visit</span>
          </button>
        </div>
      </div>

      {/* 3. Live Benchmark Bullion Rates */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8792A2] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#25282D]" /> Today's Live Rates
          </span>
          <span className="text-[10px] font-mono text-[#8792A2]">Per Gram</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A45C]" />
              <span className="text-[#343A40]">24K Pure Gold (999.9)</span>
            </div>
            <span className="font-mono font-bold text-[#25282D]">₹{gold24k.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="text-[#343A40]">22K Standard (916)</span>
            </div>
            <span className="font-mono font-bold text-[#25282D]">₹{gold22k.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-[#343A40]">999 Fine Silver</span>
            </div>
            <span className="font-mono font-bold text-[#25282D]">₹{silver.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8792A2]" />
              <span className="text-[#343A40]">Pt950 Platinum</span>
            </div>
            <span className="font-mono font-bold text-[#25282D]">₹{platinum.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenVault}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-[#25282D] hover:text-[#C9A45C] font-semibold transition-colors"
        >
          <span>Gold Savings Vault</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
