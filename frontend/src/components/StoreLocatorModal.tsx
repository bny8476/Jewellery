import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Clock,
  Phone,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Diamond,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { toast } from '../utils/toast';
import { useScrollLock } from '../utils/useScrollLock';

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
  mapUrl: string;
  image: string;
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
    image: '/images/store_chennai.jpg',
  },
  {
    id: 'coimbatore-branch',
    name: 'RCB Jewellery & Collateral Lending Showroom',
    address: '118, D.B. Road, R.S. Puram, Coimbatore, Tamil Nadu 641002',
    city: 'Coimbatore',
    hours: '10:00 AM – 8:30 PM (Mon – Sun)',
    phone: '+91 422 254 7788',
    mapUrl: 'https://maps.google.com/?q=DB+Road+RS+Puram+Coimbatore',
    image: '/images/store_coimbatore.jpg',
  },
  {
    id: 'madurai-branch',
    name: 'RCB Heritage Gold & Pawn Centre',
    address: '74, South Masi Street, Madurai, Tamil Nadu 625001',
    city: 'Madurai',
    hours: '9:30 AM – 8:30 PM (Mon – Sun)',
    phone: '+91 452 233 4455',
    mapUrl: 'https://maps.google.com/?q=South+Masi+Street+Madurai',
    image: '/images/store_madurai.jpg',
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
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    storeName: string;
    date: string;
    time: string;
  } | null>(null);

  // Lock background scroll and handle Escape key
  useScrollLock(isOpen, { onEscape: onClose });

  if (!isOpen || typeof document === 'undefined') return null;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentData.name.trim() || !appointmentData.phone.trim() || !appointmentData.date) {
      toast.error('Please enter your full name, phone number, and preferred date.');
      return;
    }

    const selectedStore = STORES.find((s) => s.id === selectedStoreId) || STORES[0];
    const bookingId = `RCB-APT-${Math.floor(100000 + Math.random() * 900000)}`;

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

  return createPortal(
    <div 
      className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-modal-title"
        className="relative bg-[#FAF7F2] dark:bg-[#150D11] border border-[#E5DAC8] dark:border-[#38232B] rounded-3xl shadow-[0_25px_70px_rgba(20,10,14,0.4)] w-full max-w-5xl max-h-[92vh] max-h-[92dvh] overflow-hidden flex flex-col text-[#24140D] dark:text-[#FAF5F0] transition-colors duration-200"
      >
        {/* Subtle Decorative Floral Watermark in Bottom Left */}
        <div className="absolute bottom-0 left-0 pointer-events-none select-none opacity-25 dark:opacity-10 z-0">
          <svg width="140" height="140" viewBox="0 0 100 100" fill="none" stroke="#C89D66">
            <path d="M0,100 C30,90 50,70 60,40 C70,10 90,0 100,0" strokeWidth="0.8" />
            <path d="M0,100 C20,70 40,50 70,30" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="60" cy="40" r="3" fill="#C89D66" />
            <circle cx="20" cy="80" r="2" fill="#C89D66" />
          </svg>
        </div>

        {/* Top Header with Luxury Velvet Backdrop */}
        <div className="relative overflow-hidden border-b border-[#EADFCF] dark:border-[#2E1821] p-6 sm:p-8 bg-[#FAF7F2] dark:bg-[#150D11] z-10">
          {/* Header Backdrop Image - Plush Ruby/Diamond Necklace on Royal Velvet */}
          <div className="absolute top-0 right-0 h-full w-full sm:w-[50%] md:w-[44%] lg:w-[40%] overflow-hidden pointer-events-none select-none">
            <img
              src="/images/store_modal_banner.jpg"
              alt="Luxury Bridal Necklace on Velvet"
              className="w-full h-full object-cover object-center"
            />
            {/* Smooth Champagne Gradient Overlay Fading Left */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/75 to-transparent dark:from-[#150D11] dark:via-[#150D11]/75" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white dark:bg-[#25151D]/95 dark:hover:bg-[#25151D] text-[#331C24] dark:text-[#E8DFC8] border border-[#E5DAC8] dark:border-[#4A2834] shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Header Left Title & Copy */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pr-12 sm:pr-14">
            <div className="max-w-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.24em] text-[#9E784E] uppercase">
                  RCB STORE NETWORK &amp; CONCIERGE
                </span>
                <span className="hidden sm:inline-block w-10 h-[1px] bg-[#C89D66]/70" />
              </div>

              <h2
                id="store-modal-title"
                className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-normal text-[#24140D] dark:text-[#FAF5F0] leading-[1.18]"
              >
                Store Locator &amp;{' '}
                <span className="italic font-light text-[#8A5A36] dark:text-[#E0B579]">
                  Private Appointments
                </span>
              </h2>

              <p className="text-xs sm:text-[12.5px] text-[#69564C] dark:text-[#C5B7AD] leading-relaxed max-w-sm sm:max-w-md mt-2.5">
                Visit our premier boutiques for personal bridal jewellery consultations, hallmark verification, bullion purchase, or confidential pawn valuation.
              </p>
            </div>

            {/* Header Concierge Feature Badges */}
            <div className="hidden lg:flex flex-col gap-2.5 py-1 border-l border-[#EADFCF] dark:border-[#2E1821] pl-6 ml-2">
              <div className="flex items-center gap-2.5 text-[11.5px] font-sans font-medium text-[#46352C] dark:text-[#E2D8CF]">
                <Diamond className="w-4 h-4 text-[#9E784E] shrink-0" strokeWidth={1.8} />
                <span>Premium Showrooms</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11.5px] font-sans font-medium text-[#46352C] dark:text-[#E2D8CF]">
                <ShieldCheck className="w-4 h-4 text-[#9E784E] shrink-0" strokeWidth={1.8} />
                <span>Trusted &amp; Certified</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11.5px] font-sans font-medium text-[#46352C] dark:text-[#E2D8CF]">
                <UserCheck className="w-4 h-4 text-[#9E784E] shrink-0" strokeWidth={1.8} />
                <span>Personalised Assistance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 pt-5 pb-3 bg-[#FAF7F2] dark:bg-[#150D11] relative z-10 border-b border-[#EADFCF]/60 dark:border-[#2E1821]/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl">
            {/* Tab 1: Store Locations */}
            <button
              type="button"
              onClick={() => setActiveTab('locate')}
              className={`relative px-5 py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-sans uppercase tracking-[0.16em] font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeTab === 'locate'
                  ? 'bg-[#541624] text-[#FAF5F0] shadow-md border border-[#7A2838]'
                  : 'bg-white/80 dark:bg-white/5 border border-[#E5DAC8] dark:border-[#38232B] text-[#6E5A4E] dark:text-[#C5B7AD] hover:bg-white hover:text-[#24140D]'
              }`}
            >
              <MapPin className={`w-4 h-4 ${activeTab === 'locate' ? 'text-[#E5C158]' : 'text-[#9E784E]'}`} />
              <span>OUR STORE LOCATIONS ({STORES.length})</span>
              {activeTab === 'locate' && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <span className="w-6 h-[1.5px] bg-[#E5C158]" />
                  <span className="text-[#E5C158] text-[8px] leading-none">✦</span>
                  <span className="w-6 h-[1.5px] bg-[#E5C158]" />
                </div>
              )}
            </button>

            {/* Tab 2: Book In-Store Appointment */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('book');
                setConfirmedBooking(null);
              }}
              className={`relative px-5 py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-sans uppercase tracking-[0.16em] font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeTab === 'book'
                  ? 'bg-[#541624] text-[#FAF5F0] shadow-md border border-[#7A2838]'
                  : 'bg-white/80 dark:bg-white/5 border border-[#E5DAC8] dark:border-[#38232B] text-[#6E5A4E] dark:text-[#C5B7AD] hover:bg-white hover:text-[#24140D]'
              }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'book' ? 'text-[#E5C158]' : 'text-[#9E784E]'}`} />
              <span>BOOK IN-STORE APPOINTMENT</span>
              {activeTab === 'book' && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  <span className="w-6 h-[1.5px] bg-[#E5C158]" />
                  <span className="text-[#E5C158] text-[8px] leading-none">✦</span>
                  <span className="w-6 h-[1.5px] bg-[#E5C158]" />
                </div>
              )}
            </button>
          </div>

          {/* Central Decorative Flourish */}
          <div className="flex items-center justify-center mt-3 text-[#C89D66]/60 text-xs">
            <span>✦</span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(92vh-180px)] z-10">
          {activeTab === 'locate' ? (
            /* Tab 1: Store Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STORES.map((store, idx) => (
                <div
                  key={store.id}
                  className="rounded-2xl bg-white dark:bg-[#1D1318] border border-[#E5DAC8] dark:border-[#38232B] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Store Showcase Image with Pills */}
                    <div className="relative h-44 w-full overflow-hidden bg-stone-900">
                      <img
                        src={store.image}
                        alt={store.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                      {/* City Pill Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 dark:bg-[#1D1318]/95 backdrop-blur-md rounded-full text-[10px] font-sans font-bold tracking-wider text-[#342016] dark:text-[#E8DFC8] flex items-center gap-1.5 shadow-sm border border-[#E5DAC8]/70">
                        <MapPin className="w-3 h-3 text-[#9E784E]" />
                        <span>{store.city.toUpperCase()}</span>
                      </div>

                      {/* View on Map Link */}
                      <a
                        href={store.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-3 right-3 px-2.5 py-1 bg-black/45 hover:bg-black/70 backdrop-blur-md rounded-full text-[10.5px] font-sans font-medium text-white flex items-center gap-1 transition-all"
                      >
                        <span>View on Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Store Details Body */}
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-serif text-[15.5px] sm:text-base font-semibold text-[#24140D] dark:text-[#FAF5F0] leading-snug">
                          {store.name}
                        </h3>
                        <a
                          href={store.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Directions to ${store.name}`}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#D8CEBF] dark:border-[#4A2D3A] flex items-center justify-center text-[#7E573C] dark:text-[#D4AF37] hover:border-[#541624] hover:bg-[#541624] hover:text-white transition-all shrink-0 mt-0.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="space-y-2 text-[11.5px] text-[#69564C] dark:text-[#C5B7AD]">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#9E784E] shrink-0 mt-0.5" />
                          <span className="leading-snug">{store.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#9E784E] shrink-0" />
                          <span>{store.hours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#9E784E] shrink-0" />
                          <a
                            href={`tel:${store.phone}`}
                            className="hover:text-[#541624] dark:hover:text-[#E0B579] hover:underline"
                          >
                            {store.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Visit Button */}
                  <div className="p-4 sm:p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStoreId(store.id);
                        setActiveTab('book');
                      }}
                      className={
                        idx === 1
                          ? 'w-full py-2.5 px-4 rounded-full border border-[#B38C62] hover:bg-[#541624] hover:border-[#541624] text-[#541624] dark:text-[#E0B579] hover:text-white text-[11px] font-sans font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all cursor-pointer'
                          : 'w-full py-2.5 px-4 rounded-full bg-[#541624] hover:bg-[#3D0F19] text-[#FAF5F0] text-[11px] font-sans font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer'
                      }
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>BOOK VISIT</span>
                      {idx !== 1 && <ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : confirmedBooking ? (
            /* Confirmation Screen */
            <div className="text-center py-8 px-4 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.22em] text-[#9E784E] block mb-1">
                  VIP RESERVATION CONFIRMED
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#24140D] dark:text-[#FAF5F0] font-normal">
                  Private Session Reserved
                </h3>
              </div>

              <p className="text-xs text-[#69564C] dark:text-[#C5B7AD] leading-relaxed">
                Your boutique appointment has been confirmed. Our master jewellery concierge will have your selected suite prepared for your arrival.
              </p>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1D1318] border border-[#E5DAC8] dark:border-[#38232B] text-left text-xs space-y-2.5 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-[#EADFCF]/60 dark:border-[#2E1821]/60">
                  <span className="text-[#69564C] dark:text-[#C5B7AD]">Booking Token:</span>
                  <span className="font-mono font-bold text-[#541624] dark:text-[#E0B579] tracking-wider">
                    {confirmedBooking.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#69564C] dark:text-[#C5B7AD]">Boutique:</span>
                  <span className="font-medium text-[#24140D] dark:text-[#FAF5F0] text-right">
                    {confirmedBooking.storeName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#69564C] dark:text-[#C5B7AD]">Scheduled Slot:</span>
                  <span className="font-medium text-[#24140D] dark:text-[#FAF5F0]">
                    {confirmedBooking.date} at {confirmedBooking.time}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleResetBooking}
                  className="flex-1 py-3 rounded-full border border-[#B38C62] text-xs font-sans font-semibold tracking-wider uppercase text-[#541624] dark:text-[#E0B579] hover:bg-[#541624]/10 transition-colors cursor-pointer"
                >
                  Book Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-full bg-[#541624] text-[#FAF5F0] text-xs font-sans font-semibold uppercase tracking-wider hover:bg-[#3D0F19] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Appointment Booking Form */
            <form onSubmit={handleBookingSubmit} className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.22em] text-[#9E784E] block mb-1">
                  VIP BESPOKE CONCIERGE
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#24140D] dark:text-[#FAF5F0] font-normal">
                  Schedule Your Boutique Consultation
                </h3>
                <p className="text-xs text-[#69564C] dark:text-[#C5B7AD] mt-1">
                  Enjoy complimentary valet parking, private viewing salon, and dedicated diamond &amp; gold specialists.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Selection */}
                <div>
                  <label className="block text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A6357] dark:text-[#C5B7AD] mb-1.5">
                    Select Store Location *
                  </label>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full px-3.5 py-3 bg-white dark:bg-[#1D1318] border border-[#DDD1C0] dark:border-[#3D252E] rounded-xl text-xs text-[#24140D] dark:text-[#FAF5F0] focus:outline-none focus:border-[#541624] dark:focus:border-[#E0B579] transition-colors"
                  >
                    {STORES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#1D1318]">
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purpose of Visit */}
                <div>
                  <label className="block text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A6357] dark:text-[#C5B7AD] mb-1.5">
                    Purpose of Visit *
                  </label>
                  <select
                    value={appointmentData.service}
                    onChange={(e) => setAppointmentData({ ...appointmentData, service: e.target.value })}
                    className="w-full px-3.5 py-3 bg-white dark:bg-[#1D1318] border border-[#DDD1C0] dark:border-[#3D252E] rounded-xl text-xs text-[#24140D] dark:text-[#FAF5F0] focus:outline-none focus:border-[#541624] dark:focus:border-[#E0B579] transition-colors"
                  >
                    <option value="Bridal Jewellery Consultation">Bridal Jewellery Consultation</option>
                    <option value="Gold Loan & Pawn Valuation">Gold Loan &amp; Pawn Valuation</option>
                    <option value="Custom Bespoke Design">Custom Bespoke Design</option>
                    <option value="Diamond Solitaire Viewing">Diamond Solitaire Viewing</option>
                    <option value="Gold / Silver Bullion Purchase">Gold / Silver Bullion Purchase</option>
                    <option value="Jewellery Cleaning & Hallmark Check">Jewellery Cleaning &amp; Hallmark Check</option>
                  </select>
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="block text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A6357] dark:text-[#C5B7AD] mb-1.5">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                    required
                    className="w-full px-3.5 py-3 bg-white dark:bg-[#1D1318] border border-[#DDD1C0] dark:border-[#3D252E] rounded-xl text-xs text-[#24140D] dark:text-[#FAF5F0] focus:outline-none focus:border-[#541624] dark:focus:border-[#E0B579] transition-colors"
                  />
                </div>

                {/* Preferred Time Slot */}
                <div>
                  <label className="block text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A6357] dark:text-[#C5B7AD] mb-1.5">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={appointmentData.timeSlot}
                    onChange={(e) => setAppointmentData({ ...appointmentData, timeSlot: e.target.value })}
                    className="w-full px-3.5 py-3 bg-white dark:bg-[#1D1318] border border-[#DDD1C0] dark:border-[#3D252E] rounded-xl text-xs text-[#24140D] dark:text-[#FAF5F0] focus:outline-none focus:border-[#541624] dark:focus:border-[#E0B579] transition-colors"
                  >
                    <option value="11:00 AM">11:00 AM – 12:00 PM</option>
                    <option value="1:00 PM">1:00 PM – 2:00 PM</option>
                    <option value="3:30 PM">3:30 PM – 4:30 PM</option>
                    <option value="5:30 PM">5:30 PM – 6:30 PM</option>
                    <option value="7:00 PM">7:00 PM – 8:00 PM</option>
                  </select>
                </div>

                {/* Guest Full Name */}
                <div>
                  <label className="block text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A6357] dark:text-[#C5B7AD] mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Sundaram"
                    value={appointmentData.name}
                    onChange={(e) => setAppointmentData({ ...appointmentData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-3 bg-white dark:bg-[#1D1318] border border-[#DDD1C0] dark:border-[#3D252E] rounded-xl text-xs text-[#24140D] dark:text-[#FAF5F0] focus:outline-none focus:border-[#541624] dark:focus:border-[#E0B579] transition-colors"
                  />
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A6357] dark:text-[#C5B7AD] mb-1.5">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={appointmentData.phone}
                    onChange={(e) => setAppointmentData({ ...appointmentData, phone: e.target.value })}
                    required
                    className="w-full px-3.5 py-3 bg-white dark:bg-[#1D1318] border border-[#DDD1C0] dark:border-[#3D252E] rounded-xl text-xs text-[#24140D] dark:text-[#FAF5F0] focus:outline-none focus:border-[#541624] dark:focus:border-[#E0B579] transition-colors"
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-[10.5px] font-sans font-semibold uppercase tracking-wider text-[#7A6357] dark:text-[#C5B7AD] mb-1.5">
                  Special Notes or Specific Jewellery Pieces (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell us if you wish to inspect specific necklace sets, diamond cuts, or confidential bullion..."
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                  className="w-full px-3.5 py-3 bg-white dark:bg-[#1D1318] border border-[#DDD1C0] dark:border-[#3D252E] rounded-xl text-xs text-[#24140D] dark:text-[#FAF5F0] focus:outline-none focus:border-[#541624] dark:focus:border-[#E0B579] transition-colors"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#541624] via-[#6B1E30] to-[#541624] hover:brightness-110 text-[#FAF5F0] font-sans font-semibold text-xs uppercase tracking-[0.16em] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#E5C158]" />
                  <span>Confirm &amp; Book In-Store Appointment</span>
                </button>
                <p className="text-[10.5px] text-center text-[#7A6357] dark:text-[#C5B7AD] mt-2.5">
                  No consultation charge • Confidential private salon • Dedicated VIP jewellery specialist guaranteed
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StoreLocatorModal;
