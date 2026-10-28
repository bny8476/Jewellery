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
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-inter font-bold text-[#25282D]">
          Customer Concierge &amp; Appointments
        </h1>
        <p className="text-xs text-[#8792A2] mt-0.5">
          Private jewellery consultations, showroom previews, and dedicated bridal advisory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Book VIP Showroom Appointment */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E7EB]">
            <Calendar className="w-5 h-5 text-[#25282D]" />
            <div>
              <h3 className="font-inter font-bold text-base text-[#25282D]">
                Book Showroom Appointment
              </h3>
              <p className="text-[11px] text-[#8792A2]">Dedicated consultation suite with our jewellery specialist</p>
            </div>
          </div>

          <form onSubmit={onBookAppointment} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider mb-1.5">
                Preferred Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={appointmentData.date}
                onChange={e => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] focus:outline-none focus:border-[#25282D]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider mb-1.5">
                Select Boutique Showroom
              </label>
              <select
                value={appointmentData.showroom}
                onChange={e => setAppointmentData(prev => ({ ...prev, showroom: e.target.value }))}
                className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-xs text-[#343A40] focus:outline-none focus:border-[#25282D]"
              >
                <option value="Cathedral Road Flagship, Chennai">Cathedral Road Flagship, Chennai</option>
                <option value="Cross Cut Road, Coimbatore">Cross Cut Road, Coimbatore</option>
                <option value="West Masi Street, Madurai">West Masi Street, Madurai</option>
                <option value="Jayanagar 4th Block, Bengaluru">Jayanagar 4th Block, Bengaluru</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider mb-1.5">
                Collection of Interest
              </label>
              <select
                value={appointmentData.category}
                onChange={e => setAppointmentData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-xs text-[#343A40] focus:outline-none focus:border-[#25282D]"
              >
                <option value="Bridal & Heritage Jewellery">Bridal &amp; Sacred Muhurtham Trousseau</option>
                <option value="Certified Solitaire Diamonds">Certified Solitaire Diamonds (GIA / IGI)</option>
                <option value="Antique Temple Kasu Jewellery">Antique Temple &amp; Nakshi Work</option>
                <option value="Old Gold Exchange & Valuation">Old Gold Exchange &amp; Caratage Valuation</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider mb-1.5">
                Specific Requests or Preferences
              </label>
              <textarea
                rows={2}
                value={appointmentData.notes}
                onChange={e => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="E.g. Request specific diamond caratage, private parking, or bridal consultation..."
                className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] focus:outline-none focus:border-[#25282D]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold uppercase tracking-wider shadow-xs cursor-pointer transition-colors"
            >
              Confirm Appointment
            </button>
          </form>
        </div>

        {/* Direct Concierge Contact Channels */}
        <div className="space-y-4">
          <div className="bg-[#25282D] rounded-xl p-6 text-white shadow-xs border border-[#25282D] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-[#C9A45C]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-inter font-bold text-lg text-white">Mr. S. Natarajan</h4>
                <p className="text-xs text-[#8792A2]">Senior Patron Concierge Specialist</p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              Available Monday to Sunday from 09:30 AM to 08:30 PM IST for solitaire diamond guidance, custom CAD designs, and secure vault transactions.
            </p>

            <div className="space-y-2.5 pt-2">
              <a
                href="https://wa.me/919840123456?text=Hello%20YAZHINI%20Concierge"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp (+91 98401 23456)</span>
              </a>

              <a
                href="tel:+919840123456"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#C9A45C]" />
                <span>Call Concierge Helpline</span>
              </a>
            </div>
          </div>

          {/* Patron Guarantee Accordion / Info */}
          <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] space-y-2.5 text-xs shadow-xs">
            <span className="font-inter font-bold text-sm text-[#25282D] block mb-2">
              The YAZHINI Promise
            </span>
            <div className="flex items-start gap-2.5 text-[#343A40]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>100% BIS Hallmarked (916) with unique laser HUID serial certificate.</span>
            </div>
            <div className="flex items-start gap-2.5 text-[#343A40]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Complimentary lifetime cleaning, re-stringing, and inspection at all showrooms.</span>
            </div>
            <div className="flex items-start gap-2.5 text-[#343A40]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Transparent lifetime gold buyback and exchange guarantee based on prevailing rates.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerConciergeTab;
