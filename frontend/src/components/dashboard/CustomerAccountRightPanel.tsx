import React from 'react';
import { 
  Truck, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useRates } from '../../context/RateContext';
import { formatCurrencyINR } from '../../utils/formatters';

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
  const silver = rates.silver || 173;
  const platinum = rates.platinum || 5085;

  return (
    <div className="space-y-6">
      {/* 1. Active Consignment Pulse Card */}
      <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-3.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gold-primary)] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Order Pulse
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
          </span>
        </div>

        {latestOrder ? (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">
                  Order #{latestOrder.order_number || latestOrder.id.slice(-6).toUpperCase()}
                </p>
                <h4 className="font-serif text-xs font-semibold text-[var(--text-main)] mt-0.5 line-clamp-1">
                  {latestOrder.items?.[0]?.product_name || 'Bespoke Fine Jewellery'}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-sky-500/10 text-sky-500 border border-sky-500/20">
                {latestOrder.status}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[11px] space-y-1">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Insured Courier:</span>
                <span className="font-semibold text-[var(--text-main)]">
                  {latestOrder.courier_partner || 'Sequel Logistics'}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Airway Bill (AWB):</span>
                <span className="font-mono text-[10px] font-bold text-[var(--gold-primary)]">
                  {latestOrder.tracking_number || `BLUEDART-${latestOrder.id.slice(-6).toUpperCase()}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onTrackOrder(latestOrder)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--gold-primary)] hover:brightness-105 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" /> Track Consignment
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-center space-y-2">
            <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-[var(--text-main)]">100% Insured Armoured Transit</p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Every parcel dispatched in tamper-evident secure lockboxes via Sequel &amp; BlueDart Armoured Logistics.
            </p>
          </div>
        )}
      </div>

      {/* 2. Senior Patron Concierge Desk */}
      <div className="bg-gradient-to-br from-[#4A1521] via-[#702638] to-[#2B0B13] p-5 rounded-2xl text-white shadow-md border border-[#D4AF37]/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-serif font-bold text-white">Private Patron Concierge</h4>
            <p className="text-[10px] text-[#E8D5D0]">Mr. S. Natarajan • Senior Advisor</p>
          </div>
        </div>

        <p className="text-[11px] text-[#E8D5D0] leading-relaxed mb-4">
          Dedicated assistance for high-value bespoke bridal trousseaus, diamond valuations, and showroom appointments.
        </p>

        <div className="space-y-2">
          <a
            href="https://wa.me/919840123456?text=Hello%20YAZHINI%20Concierge%2C%20I%20am%20a%20patron%20requesting%20assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Instant WhatsApp Concierge</span>
          </a>

          <button
            type="button"
            onClick={onOpenSupport}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Book Private Showroom Suite</span>
          </button>
        </div>
      </div>

      {/* 3. Live Benchmark Bullion Rates */}
      <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gold-primary)] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Today's Live Rates
          </span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">Per Gram</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-[var(--border-color)]/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[var(--text-secondary)]">24K Bullion (999.9)</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-main)]">₹{gold24k.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[var(--border-color)]/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[var(--text-secondary)]">22K Hallmarked (916)</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-main)]">₹{gold22k.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-[var(--border-color)]/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-[var(--text-secondary)]">999 Fine Silver</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-main)]">₹{silver.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[var(--text-secondary)]">Pt950 Platinum</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-main)]">₹{platinum.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenVault}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-[var(--gold-primary)] font-semibold hover:underline"
        >
          <span>Aura Gold™ Digital Vault</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
