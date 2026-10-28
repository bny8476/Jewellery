import React from 'react';
import { Package, Coins, TrendingUp, Sparkles, Bell } from 'lucide-react';

export interface NotificationPopupCardProps {
  title?: string;
  message?: string;
  timestamp?: string;
  icon?: React.ReactNode;
  category?: 'order' | 'vault' | 'rate' | 'concierge' | string;
  isRead?: boolean;
  onClick?: () => void;
  className?: string;
  gradient?: string;
  hoverGradient?: string;
}

export const NotificationPopupCard: React.FC<NotificationPopupCardProps> = ({
  title = 'Consignment Dispatched',
  message = 'Your fine jewellery piece has passed BIS 916 laser hallmarking and is in transit.',
  timestamp: _timestamp,
  icon,
  category = 'general',
  isRead = false,
  onClick,
  className = '',
  gradient,
  hoverGradient
}) => {
  // Determine gradient based on category or default
  const getDefaultGradient = () => {
    switch (category) {
      case 'order':
        return 'from-[#D8CFD0] to-[#8E97E6]';
      case 'vault':
        return 'from-[#F3E5CF] to-[#D8B878]';
      case 'rate':
        return 'from-[#CDEEDF] to-[#52B788]';
      case 'concierge':
        return 'from-[#EBD8CC] to-[#A37081]';
      default:
        return 'from-[#d7cfcf] to-[#9198e5]';
    }
  };

  const getDefaultIcon = () => {
    switch (category) {
      case 'order':
        return <Package className="w-5 h-5 text-[#1C171E] drop-shadow-xs" />;
      case 'vault':
        return <Coins className="w-5 h-5 text-[#1C171E] drop-shadow-xs" />;
      case 'rate':
        return <TrendingUp className="w-5 h-5 text-[#1C171E] drop-shadow-xs" />;
      case 'concierge':
        return <Sparkles className="w-5 h-5 text-[#1C171E] drop-shadow-xs" />;
      default:
        return <Bell className="w-5 h-5 text-[#1C171E] drop-shadow-xs" />;
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`card notification-popup-card group relative w-full rounded-[20px] p-2.5 flex items-center justify-start backdrop-blur-md transition-all duration-500 ease-in-out cursor-pointer select-none text-left ${
        isRead
          ? 'bg-[#2A2B30]/80 hover:bg-[#353535] dark:bg-[#1E2129]/80 dark:hover:bg-[#282C37] opacity-80 hover:opacity-100 border border-white/5 dark:border-white/5'
          : 'bg-[#353535] hover:bg-[#3D3E45] dark:bg-[#252831] dark:hover:bg-[#2E333F] border border-white/10 dark:border-[#D8B878]/30 shadow-lg hover:shadow-xl'
      } hover:scale-[1.03] active:scale-[0.99] ${className}`}
    >
      {/* Dynamic Animated Left Squircle Icon / Image */}
      <div 
        className={`img notification-card-img shrink-0 w-[50px] h-[50px] rounded-[10px] flex items-center justify-center transition-all duration-500 ease-in-out shadow-sm overflow-hidden bg-gradient-to-br ${
          gradient || getDefaultGradient()
        } group-hover:bg-gradient-to-br ${hoverGradient || 'group-hover:from-[#9198e5] group-hover:to-[#712020]'}`}
      >
        {icon !== undefined ? icon : getDefaultIcon()}
      </div>

      {/* Text Box Area */}
      <div className="textBox notification-card-textBox flex-1 min-w-0 ml-3 mr-1 text-white">
        {/* Top Content Row: Title */}
        <div className="textContent notification-card-textContent flex items-center justify-between gap-2">
          <p className="h1 notification-card-h1 text-sm font-bold text-white tracking-tight truncate leading-tight">
            {title}
          </p>
          {!isRead && (
            <span
              className="w-2 h-2 rounded-full bg-[#D8B878] shrink-0 ml-1.5 shadow-[0_0_8px_rgba(216,184,120,0.8)]"
              title="Unread Notification"
            />
          )}
        </div>

        {/* Subtitle / Message Row */}
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="p notification-card-p text-xs font-light text-white/80 line-clamp-1 leading-snug">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopupCard;
