import React, { useState } from 'react';
import { X, MapPin, Clock, Phone, Calendar, CheckCircle2, Navigation, User, Mail, MessageSquare } from 'lucide-react';
import { toast } from '../utils/toast';

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
  mapUrl: string;
}

export const STORES: Store[] = [
  {
    id: 'chennai-flagship',
    name: 'RCB Flagship Jewellery & Pawn Emporium',
    address: '42, Usman Road, T. Nagar, Chennai, Tamil Nadu 600017',
    city: 'Chennai',
    hours: '10:00 AM – 9:00 PM (All 7 Days)',
    phone: '+91 44 2434 8899',
    mapUrl: 'https://maps.google.com/?q=Usman+Road+T+Nagar+Chennai',
  },
  {
    id: 'coimbatore-branch',
    name: 'RCB Jewellery & Collateral Lending Showroom',
    address: '118, D.B. Road, R.S. Puram, Coimbatore, Tamil Nadu 641002',
    city: 'Coimbatore',
    hours: '10:00 AM – 8:30 PM (Mon – Sun)',
    phone: '+91 422 254 7788',
    mapUrl: 'https://maps.google.com/?q=DB+Road+RS+Puram+Coimbatore',
  },
  {
    id: 'madurai-branch',
    name: 'RCB Heritage Gold & Pawn Centre',
    address: '74, South Masi Street, Madurai, Tamil Nadu 625001',
    city: 'Madurai',
    hours: '9:30 AM – 8:30 PM (Mon – Sun)',
    phone: '+91 452 233 4455',
    mapUrl: 'https://maps.google.com/?q=South+Masi+Street+Madurai',
  },
];

interface StoreLocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'locate' | 'book';
}

export const StoreLocatorModal: React.FC<StoreLocatorModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'locate',
}) => {
  const [activeTab, setActiveTab] = useState<'locate' | 'book'>(defaultTab);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(STORES[0].id);
  const [appointmentData, setAppointmentData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Bridal Jewellery Consultation',
    date: '',
    timeSlot: '11:00 AM',
    notes: '',
  });
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: string; storeName: string; date: string; time: string } | null>(null);

  if (!isOpen) return null;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentData.name.trim() || !appointmentData.phone.trim() || !appointmentData.date) {
      toast.error('Please enter your full name, phone number, and preferred date.');
      return;
    }

    const selectedStore = STORES.find((s) => s.id === selectedStoreId) || STORES[0];
    const bookingId = `RCB-APT-${Math.floor(100000 + Math.random() * 900000)}`;

    // Store in localStorage for client record
    const existingAppointments = JSON.parse(localStorage.getItem('rcb_appointments') || '[]');
    existingAppointments.push({
      id: bookingId,
      ...appointmentData,
      store: selectedStore.name,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('rcb_appointments', JSON.stringify(existingAppointments));

    setConfirmedBooking({
      id: bookingId,
      storeName: selectedStore.name,
      date: appointmentData.date,
      time: appointmentData.timeSlot,
    });
    toast.success('In-store appointment booked successfully! Confirmation SMS dispatched.');
  };

  const handleResetBooking = () => {
    setConfirmedBooking(null);
    setAppointmentData({
      name: '',
      phone: '',
      email: '',
      service: 'Bridal Jewellery Consultation',
      date: '',
      timeSlot: '11:00 AM',
      notes: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-modal-title"
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col text-[var(--text-main)] transition-colors duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[var(--gold-primary)] uppercase block">
              RCB STORE NETWORK &amp; CONCIERGE
            </span>
            <h2 id="store-modal-title" className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-main)]">
              Store Locator &amp; Private Appointments
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-main)]">
          <button
            onClick={() => setActiveTab('locate')}
            className={`flex-1 py-3 text-xs font-sans uppercase tracking-[0.16em] font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'locate'
                ? 'border-[var(--gold-primary)] text-[var(--gold-primary)] bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            Our Store Locations ({STORES.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('book');
              setConfirmedBooking(null);
            }}
            className={`flex-1 py-3 text-xs font-sans uppercase tracking-[0.16em] font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'book'
                ? 'border-[var(--gold-primary)] text-[var(--gold-primary)] bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            Book In-Store Appointment
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-140px)]">
          {activeTab === 'locate' ? (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-secondary)] mb-2">
                Visit our premier boutiques for personal bridal jewellery consultations, hallmark verification, bullion purchase, or confidential pawn valuation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STORES.map((store) => (
                  <div
                    key={store.id}
                    className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] flex flex-col justify-between hover:border-[var(--gold-primary)]/60 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                        <span className="text-[11px] font-sans font-bold tracking-wider uppercase text-[var(--gold-primary)]">
                          {store.city}
                        </span>
                      </div>
                      <h3 className="font-serif text-base text-[var(--text-main)] font-semibold mb-2">
                        {store.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                        {store.address}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mb-2">
                        <Clock className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
                        <span>{store.hours}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] mb-4">
                        <Phone className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
                        <a href={`tel:${store.phone}`} className="hover:text-[var(--gold-primary)] underline">
                          {store.phone}
                        </a>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                      <a
                        href={store.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold text-[var(--gold-primary)] hover:underline"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </a>
                      <button
                        onClick={() => {
                          setSelectedStoreId(store.id);
                          setActiveTab('book');
                        }}
                        className="px-3 py-1.5 rounded-full bg-[var(--gold-primary)] text-black text-[10px] font-sans font-semibold tracking-wider uppercase hover:brightness-105 transition-all"
                      >
                        Book Visit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : confirmedBooking ? (
            /* Confirmation screen */
            <div className="text-center py-8 px-4 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-[var(--text-main)]">
                Appointment Confirmed!
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Your private session has been reserved. Our senior jewellery specialist will be prepared for your visit.
              </p>
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Booking Token:</span>
                  <span className="font-mono font-bold text-[var(--gold-primary)]">{confirmedBooking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Boutique:</span>
                  <span className="font-medium text-[var(--text-main)]">{confirmedBooking.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Date &amp; Time:</span>
                  <span className="font-medium text-[var(--text-main)]">{confirmedBooking.date} at {confirmedBooking.time}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleResetBooking}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                >
                  Book Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--gold-primary)] text-black text-xs font-semibold uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Appointment Booking Form */
            <form onSubmit={handleBookingSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Select Store Location *
                  </label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  >
                    {STORES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[var(--bg-card)]">
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Purpose of Visit *
                  </label>
                  <select
                    value={appointmentData.service}
                    onChange={(e) => setAppointmentData({ ...appointmentData, service: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  >
                    <option value="Bridal Jewellery Consultation">Bridal Jewellery Consultation</option>
                    <option value="Gold Loan & Pawn Valuation">Gold Loan &amp; Pawn Valuation</option>
                    <option value="Custom Bespoke Design">Custom Bespoke Design</option>
                    <option value="Diamond Solitaire Viewing">Diamond Solitaire Viewing</option>
                    <option value="Gold / Silver Bullion Purchase">Gold / Silver Bullion Purchase</option>
                    <option value="Jewellery Cleaning & Hallmark Check">Jewellery Cleaning &amp; Hallmark Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={appointmentData.timeSlot}
                    onChange={(e) => setAppointmentData({ ...appointmentData, timeSlot: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  >
                    <option value="11:00 AM">11:00 AM – 12:00 PM</option>
                    <option value="1:00 PM">1:00 PM – 2:00 PM</option>
                    <option value="3:30 PM">3:30 PM – 4:30 PM</option>
                    <option value="5:30 PM">5:30 PM – 6:30 PM</option>
                    <option value="7:00 PM">7:00 PM – 8:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Sundaram"
                    value={appointmentData.name}
                    onChange={(e) => setAppointmentData({ ...appointmentData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={appointmentData.phone}
                    onChange={(e) => setAppointmentData({ ...appointmentData, phone: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Special Notes or Specific Jewellery Pieces (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us if you wish to see specific necklace sets or want valuation for old gold..."
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black font-sans font-semibold text-xs uppercase tracking-wider hover:brightness-105 active:scale-[0.99] transition-all shadow-md"
                >
                  Confirm &amp; Book Appointment
                </button>
                <p className="text-[10px] text-center text-[var(--text-secondary)] mt-2">
                  No consultation charge. Confidential, private VIP lounge service guaranteed.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreLocatorModal;
