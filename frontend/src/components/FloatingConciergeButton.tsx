import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Video, Calendar, X, Sparkles, ChevronRight, PhoneCall } from 'lucide-react';

interface FloatingConciergeButtonProps {
  onOpenWhatsApp?: () => void;
  onOpenVideoCall?: () => void;
  onOpenBookVisit?: () => void;
}

export const FloatingConciergeButton: React.FC<FloatingConciergeButtonProps> = ({
  onOpenWhatsApp,
  onOpenVideoCall,
  onOpenBookVisit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultWhatsAppUrl =
    'https://wa.me/914424347888?text=Hello%20YAZHINI%20Fine%20Jewels,%20I%20would%20like%20to%20inquire%20about%20your%20jewellery%20collection';

  const handleWhatsApp = () => {
    setIsOpen(false);
    if (onOpenWhatsApp) {
      onOpenWhatsApp();
    } else {
      window.open(defaultWhatsAppUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVideoCall = () => {
    setIsOpen(false);
    onOpenVideoCall?.();
  };

  const handleBookVisit = () => {
    setIsOpen(false);
    onOpenBookVisit?.();
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const conciergeOptions = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Chat',
      subtitle: 'Instant personal styling & CAD advice',
      icon: <MessageCircle className="w-5 h-5 text-white" />,
      badgeBg: 'bg-[#25D366]',
      onClick: handleWhatsApp,
      highlight: 'Available 10 AM - 9 PM',
    },
    {
      id: 'video',
      title: 'Video Call',
      subtitle: 'Live 1-on-1 virtual jewellery preview',
      icon: <Video className="w-5 h-5 text-white" />,
      badgeBg: 'bg-gradient-to-tr from-[#BD8238] to-[#D9AE70]',
      onClick: handleVideoCall,
      highlight: 'Virtual Showroom',
    },
    {
      id: 'visit',
      title: 'Book Visit',
      subtitle: 'Reserve boutique appointment & sizing',
      icon: <Calendar className="w-5 h-5 text-white" />,
      badgeBg: 'bg-gradient-to-tr from-[#4E1020] to-[#710E2B]',
      onClick: handleBookVisit,
      highlight: 'VIP In-Store Experience',
    },
  ];

  return (
    <aside aria-label="Concierge quick access" ref={containerRef} className="fixed bottom-6 left-6 z-50 select-none">
      {/* --------------------------------------------------------------------- */}
      {/* POPUP MENU CONTAINER: Floats gracefully above the circular button     */}
      {/* --------------------------------------------------------------------- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-16 sm:bottom-18 left-0 w-[290px] sm:w-[320px] rounded-2xl bg-white/95 dark:bg-[#1C0F16]/95 backdrop-blur-xl border border-[#D9AE70]/50 shadow-[0_16px_50px_rgba(78,16,32,0.35)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden p-3.5 flex flex-col gap-2.5 z-50 text-[#171411] dark:text-[#FAF0E6]"
          >
            {/* Header Eyebrow */}
            <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-[#E8DEC4]/70 dark:border-[#38262E]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#BD8238]" />
                <span className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-[#BD8238] dark:text-[#D9AE70]">
                  YAZHINI Concierge
                </span>
              </div>
              <span className="flex items-center gap-1 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Stylists Online
              </span>
            </div>

            {/* 3 Interactive Service Option Cards */}
            <div className="flex flex-col gap-2 pt-1">
              {conciergeOptions.map((opt, index) => (
                <motion.button
                  key={opt.id}
                  type="button"
                  onClick={opt.onClick}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="w-full text-left p-2.5 rounded-xl bg-stone-50/80 dark:bg-[#281520]/80 hover:bg-[#FDF6ED] dark:hover:bg-[#341B2A] border border-[#E9DFD5] dark:border-[#422534] hover:border-[#BD8238]/60 transition-all duration-200 group flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#BD8238]"
                >
                  <div className="flex items-center gap-3">
                    {/* Option Icon Badge */}
                    <div
                      className={`w-10 h-10 rounded-full ${opt.badgeBg} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}
                    >
                      {opt.icon}
                    </div>

                    {/* Titles */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-[14px] font-semibold text-[#3D1420] dark:text-[#FAF5F0] tracking-tight group-hover:text-[#BD8238] dark:group-hover:text-[#D9AE70] transition-colors leading-tight">
                          {opt.title}
                        </span>
                      </div>
                      <span className="font-sans text-[10.5px] text-[#78646C] dark:text-[#C5B4B9] font-light leading-snug mt-0.5">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#BD8238]/60 group-hover:text-[#BD8238] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------------------- */}
      {/* CIRCULAR ROUNDED BUTTON (Bottom-Right Corner)                         */}
      {/* --------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close concierge services menu' : 'Open concierge services menu'}
        aria-expanded={isOpen}
        className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#4E1020] via-[#68172C] to-[#BD8238] hover:from-[#3D0C18] hover:to-[#A76E2A] text-white flex items-center justify-center border-2 border-[#D9AE70]/90 shadow-[0_8px_30px_rgba(78,16,32,0.45)] hover:shadow-[0_12px_36px_rgba(189,130,56,0.55)] transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BD8238]"
      >
        {/* Subtle Ambient Pulse Ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border-2 border-[#D9AE70] opacity-40 animate-ping pointer-events-none" />
        )}

        {/* Hover Tooltip when closed */}
        {!isOpen && (
          <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-[#250810]/95 backdrop-blur-sm text-[#F8EBDD] border border-[#BD8238]/50 rounded-lg text-xs font-sans font-medium tracking-wide shadow-xl opacity-0 hover:opacity-100 sm:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden sm:block">
            Concierge Services
          </div>
        )}

        {/* Smooth Morphing Icon: PhoneCall/Message when closed, X when open */}
        <motion.div
          key={isOpen ? 'close' : 'open'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white stroke-[2.2]" />
          ) : (
            <div className="relative">
              <PhoneCall className="w-6 h-6 text-white stroke-[1.9]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-[#4E1020]" />
            </div>
          )}
        </motion.div>
      </button>
    </aside>
  );
};

export default FloatingConciergeButton;

