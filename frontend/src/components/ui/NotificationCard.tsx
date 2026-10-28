import React from 'react';

export interface NotificationCardProps {
  title?: string;
  message?: string;
  timestamp?: string;
  onClose?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * iOS-inspired Dynamic Capsule Notification Card
 * Gradient image box removed; clean notification title and message displayed with a sleek close button.
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  title = 'Notifications',
  message = 'All notifications marked as read',
  timestamp,
  onClose,
  onClick,
  className = '',
}) => {
  return (
    <div 
      className={`notification-card-wrapper ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="card">
        <div className="textBox">
          <div className="textContent">
            <p className="h1">{title}</p>
            {timestamp && <span className="timestamp text-[10px] text-stone-400 font-mono ml-auto">{timestamp}</span>}
          </div>
          <p className="p">{message}</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="closeBtn"
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
      </div>
    </div>
  );
};

export default NotificationCard;
