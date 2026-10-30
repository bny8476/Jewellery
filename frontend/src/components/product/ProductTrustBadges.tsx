import React from 'react';
import { 
  ShieldCheck, Truck, RotateCcw, Sparkles, Gem, 
  Headphones, Award, Lock 
} from 'lucide-react';

interface ProductTrustBadgesProps {
  onOpenHuidModal?: () => void;
  onOpenCareGuide?: () => void;
  onOpenExchangeModal?: () => void;
}

export const ProductTrustBadges: React.FC<ProductTrustBadgesProps> = ({
  onOpenHuidModal,
  onOpenCareGuide,
  onOpenExchangeModal
}) => {
  const benefits = [
    {
      id: 'bis',
      icon: ShieldCheck,
      title: 'BIS 916 Hallmarked',
      subtitle: 'Laser Engraved HUID',
      action: onOpenHuidModal,
      actionText: 'Verify HUID'
    },
    {
      id: 'shipping',
      icon: Truck,
      title: 'Insured Shipping',
      subtitle: 'Free BlueDart Transit',
      actionText: 'Tamper-Proof Box'
    },
    {
      id: 'exchange',
      icon: RotateCcw,
      title: 'Lifetime Exchange',
      subtitle: '100% Value Trade-In',
      action: onOpenExchangeModal,
      actionText: 'Exchange Policy'
    },
    {
      id: 'maintenance',
      icon: Sparkles,
      title: 'Free Maintenance',
      subtitle: 'Annual Ultrasonic Polish',
      action: onOpenCareGuide,
      actionText: 'Care Guide'
    },
    {
      id: 'diamonds',
      icon: Gem,
      title: 'Certified Stones',
      subtitle: 'IGI & GIA Inspected',
      actionText: '100% Authentic'
    },
    {
      id: 'support',
      icon: Headphones,
      title: 'Dedicated Stylist',
      subtitle: '1-on-1 Concierge Desk',
      actionText: 'WhatsApp / Call'
    }
  ];

  return (
    <div className="rounded-3xl bg-[#FAF7F1] dark:bg-[#1A1215] border border-[#E7DEC8] dark:border-[#3E2D34] p-5 sm:p-6 shadow-xs select-none">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E7DEC8]/60 dark:border-[#3E2D34]/60">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#C49A50]" />
          <h4 className="font-serif text-sm font-semibold text-[#252329] dark:text-[#FAF7F1] tracking-wide">
            The YAZHINI Royal Guarantee &amp; Patron Privileges
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#5B1022] dark:text-[#C49A50]">
          100% CERTIFIED
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              onClick={b.action}
              className={`p-3 rounded-2xl bg-white dark:bg-[#140E10] border border-[#E7DEC8] dark:border-[#3E2D34] flex flex-col items-center text-center transition-all group ${
                b.action ? 'cursor-pointer hover:border-[#C49A50] hover:shadow-xs' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#FAF7F1] dark:bg-[#201519] border border-[#C49A50]/30 flex items-center justify-center text-[#5B1022] dark:text-[#C49A50] mb-2 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-bold text-[#252329] dark:text-[#FAF7F1] text-[11px] leading-tight block">
                {b.title}
              </span>
              <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] mt-0.5 block">
                {b.subtitle}
              </span>
              {b.actionText && (
                <span className={`text-[9.5px] mt-1 font-medium ${b.action ? 'text-[#5B1022] dark:text-[#C49A50] underline' : 'text-[#716A6C] dark:text-[#B5ABB0]'}`}>
                  {b.actionText}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
