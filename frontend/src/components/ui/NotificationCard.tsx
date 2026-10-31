import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert 
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationCardProps {
  id?: string;
  type?: NotificationType;
  title?: string;
  message?: string;
  timestamp?: string;
  duration?: number; // Exactly 5000ms by default for standard notifications
  persistent?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Premium Luxury Toast & Notification Card for YAZHINI FINE JEWELS.
 * Features:
 * - 5-Second auto-dismiss countdown timer
 * - Interactive hover-pause & resume
 * - Animated remaining-time progress bar
 * - Color-coded type themes (Green Success, Red Error, Amber Warning, Neutral/Burgundy Info)
 * - Accessible close button
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  id: _id,
  type = 'info',
  title = 'Notifications',
  message = 'All notifications marked as read',
  timestamp,
  duration = 5000,
  persistent = false,
  onClose,
  onClick,
  className = '',
}) => {
  // If persistent is true or duration is 0, do not auto-dismiss
  const effectiveDuration = persistent || duration <= 0 ? 0 : duration;
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const remainingTimeRef = useRef<number>(effectiveDuration);
  const lastTickRef = useRef<number | null>(null);
  const timerIdRef = useRef<any>(null);

  // Set up the countdown interval with hover pause support
  useEffect(() => {
    if (effectiveDuration <= 0) return;

    remainingTimeRef.current = effectiveDuration;
    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = lastTickRef.current ? now - lastTickRef.current : 0;
      lastTickRef.current = now;

      if (!isPaused) {
        remainingTimeRef.current -= delta;
        const currentPct = Math.max(0, Math.min(100, (remainingTimeRef.current / effectiveDuration) * 100));
        setProgress(currentPct);

        if (remainingTimeRef.current <= 0) {
          clearInterval(interval);
          onClose?.();
        }
      }
    }, 25);

    timerIdRef.current = interval;

    return () => {
      clearInterval(interval);
    };
  }, [effectiveDuration, isPaused, onClose]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (effectiveDuration > 0) {
      lastTickRef.current = Date.now();
      setIsPaused(true);
    }
  };

  // Resume on mouse leave
  const handleMouseLeave = () => {
    if (effectiveDuration > 0) {
      lastTickRef.current = Date.now();
      setIsPaused(false);
    }
  };

  // Manual close with immediate timer cleanup
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    onClose?.();
  };

  // Luxury visual style configuration per notification type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          label: 'Success',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          border: 'border-emerald-500/40 dark:border-emerald-500/35',
          glow: 'shadow-[0_12px_28px_-6px_rgba(16,185,129,0.25)]',
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          progress: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300',
          iconBg: 'bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 shadow-inner',
        };
      case 'error':
        return {
          label: 'Notice',
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          border: 'border-rose-500/40 dark:border-rose-500/35',
          glow: 'shadow-[0_12px_28px_-6px_rgba(244,63,94,0.25)]',
          badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          progress: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-400',
          iconBg: 'bg-rose-950/70 border border-rose-500/30 text-rose-400 shadow-inner',
        };
      case 'warning':
        return {
          label: 'Attention',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          border: 'border-amber-500/40 dark:border-amber-500/35',
          glow: 'shadow-[0_12px_28px_-6px_rgba(245,158,11,0.25)]',
          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          progress: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
          iconBg: 'bg-amber-950/70 border border-amber-500/30 text-amber-400 shadow-inner',
        };
      case 'info':
      default:
        return {
          label: 'Update',
          icon: <Sparkles className="w-4 h-4 text-[#D4AF37]" />,
          border: 'border-[#C9A45C]/45 dark:border-[#C9A45C]/40',
          glow: 'shadow-[0_12px_28px_-6px_rgba(201,164,92,0.22)]',
          badge: 'bg-[#C9A45C]/15 text-[#D4AF37] border-[#C9A45C]/35',
          progress: 'bg-gradient-to-r from-[#C9A45C] via-[#E5C378] to-[#996515]',
          iconBg: 'bg-[#2A0C14]/80 border border-[#C9A45C]/35 text-[#D4AF37] shadow-inner',
        };
    }
  };

  const cfg = getTypeConfig();

  return (
    <div 
      className={`notification-card-wrapper relative select-none w-full ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={`card overflow-hidden relative backdrop-blur-xl transition-all duration-300 rounded-2xl p-3 border ${cfg.border} ${cfg.glow}`}>
        <div className="flex items-start gap-2.5 w-full">
          {/* Accessible Close Button on Left Side Corner */}
          <button
            type="button"
            onClick={handleClose}
            className="closeBtn w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform duration-200 hover:scale-110 active:scale-95 text-stone-400 hover:text-white"
            style={{ marginLeft: 0, marginRight: '4px' }}
            aria-label="Dismiss notification"
            title="Dismiss notification"
          >
            <svg 
              className="w-3.5 h-3.5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Icon Capsule */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.iconBg}`}>
            {persistent ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : cfg.icon}
          </div>

          {/* Text Box */}
          <div className="textBox flex-1 min-w-0 pr-1">
            <div className="textContent flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-wider uppercase border ${persistent ? 'bg-rose-500/20 text-rose-300 border-rose-500/35' : cfg.badge}`}>
                {persistent ? 'ACTION REQUIRED' : cfg.label}
              </span>
              <p className="h1 font-serif text-[13px] font-bold tracking-wide truncate text-stone-100 flex-1">
                {title}
              </p>
              {timestamp && (
                <span className="timestamp text-[10px] text-stone-400 font-mono ml-auto flex-shrink-0">
                  {timestamp}
                </span>
              )}
            </div>
            <p className="p text-[11.5px] leading-snug text-stone-300 break-words line-clamp-3">
              {message}
            </p>
          </div>
        </div>

        {/* 5-Second Animated Progress Bar Indicator */}
        {effectiveDuration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/40 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ease-linear ${cfg.progress}`}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
