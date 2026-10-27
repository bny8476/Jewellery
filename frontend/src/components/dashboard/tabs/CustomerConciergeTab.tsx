import React from 'react';
import { Calendar, Sparkles, MessageSquare, Phone, CheckCircle2 } from 'lucide-react';

export interface CustomerConciergeTabProps {
  appointmentData: {
    date: string;
    showroom: string;
    category: string;
    notes: string;
  };
  setAppointmentData: React.Dispatch<React.SetStateAction<{
    date: string;
    showroom: string;
    category: string;
    notes: string;
  }>>;
  onBookAppointment: (e: React.FormEvent) => void;
}

export const CustomerConciergeTab: React.FC<CustomerConciergeTabProps> = ({
  appointmentData,
  setAppointmentData,
  onBookAppointment
}) => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[var(--border-color)]">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
          Patron Concierge Suite
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Private jewellery consultations, showroom previews, and dedicated bridal concierge
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Book VIP Showroom Appointment */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-color)]">
            <Calendar className="w-5 h-5 text-[var(--gold-primary)]" />
            <div>
              <h3 className="font-serif font-bold text-sm text-[var(--text-main)]">
                Book Private Showroom Preview
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Dedicated VIP Suite with your Senior Patron Advisor</p>
            </div>
          </div>

          <form onSubmit={onBookAppointment} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Preferred Date *
              </label>
              <input
                type="date"
                required
                value={appointmentData.date}
                onChange={e => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Select Showroom
              </label>
              <select
                value={appointmentData.showroom}
                onChange={e => setAppointmentData(prev => ({ ...prev, showroom: e.target.value }))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              >
                <option value="Cathedral Road Flagship, Chennai">Cathedral Road Flagship, Chennai</option>
                <option value="Cross Cut Road, Coimbatore">Cross Cut Road, Coimbatore</option>
                <option value="West Masi Street, Madurai">West Masi Street, Madurai</option>
                <option value="Jayanagar 4th Block, Bengaluru">Jayanagar 4th Block, Bengaluru</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Collection of Interest
              </label>
              <select
                value={appointmentData.category}
                onChange={e => setAppointmentData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              >
                <option value="Bridal & Heritage Jewellery">Bridal &amp; Sacred Muhurtham Trousseau</option>
                <option value="Certified Solitaire Diamonds">Certified Solitaire Diamonds (GIA / IGI)</option>
                <option value="Antique Temple Kasu Jewellery">Antique Temple &amp; Nakshi Work</option>
                <option value="Old Gold Exchange & Valuation">Old Gold Exchange &amp; Caratage Valuation</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Specific Requests
              </label>
              <textarea
                rows={2}
                value={appointmentData.notes}
                onChange={e => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="E.g. Request specific diamond caratage, private parking, or Tamil-speaking bridal specialist..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-md cursor-pointer"
            >
              Confirm Private Appointment
            </button>
          </form>
        </div>

        {/* Direct Concierge Contact Channels */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#4A1521] via-[#702638] to-[#2B0B13] rounded-2xl p-6 text-white shadow-md border border-[#D4AF37]/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-white">Mr. S. Natarajan</h4>
                <p className="text-xs text-[#E8D5D0]">Senior Patron Concierge Advisor</p>
              </div>
            </div>

            <p className="text-xs text-[#E8D5D0] leading-relaxed">
              Available 7 days a week from 09:30 AM to 08:30 PM IST for high-carat diamond consultation, custom jewel CAD renderings, and safe vault transfers.
            </p>

            <div className="space-y-2.5 pt-2">
              <a
                href="https://wa.me/919840123456?text=Hello%20YAZHINI%20Concierge"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat via WhatsApp (+91 98401 23456)</span>
              </a>

              <a
                href="tel:+919840123456"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span>Direct Telephone Helpline</span>
              </a>
            </div>
          </div>

          {/* Patron Guarantee Accordion / Info */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 text-xs">
            <span className="font-serif font-bold text-xs text-[var(--text-main)] block mb-1">
              YAZHINI Patron Guarantees
            </span>
            <div className="flex items-start gap-2 text-[var(--text-secondary)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>100% BIS Hallmarked (916) with unique laser HUID serial certificate.</span>
            </div>
            <div className="flex items-start gap-2 text-[var(--text-secondary)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Complimentary lifetime cleaning, re-stringing, and repair at all boutiques.</span>
            </div>
            <div className="flex items-start gap-2 text-[var(--text-secondary)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Lifetime gold buyback and exchange guarantee based on live benchmark rates.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerConciergeTab;
