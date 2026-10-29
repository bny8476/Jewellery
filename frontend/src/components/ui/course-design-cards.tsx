import React from 'react';

// Define the type for the card data
export interface CardData {
  id: number;
  colorClass: string;
  themeColor?: string; // HSL color string e.g. "172 99% 39%" for card-21 animation
  imageUrl?: string; // Luxury background image for parallax zoom
  date?: string;
  title: string;
  description: string;
  countdownText: string;
  actionKey?: 'store' | 'price' | 'care' | string;
  progressPercent?: string;
  progressValue?: string;
  statusBadge?: string;
  imgSrc1?: string;
  imgAlt1?: string;
  imgSrc2?: string;
  imgAlt2?: string;
  showAddBtn?: boolean;
}

export interface CardProps {
  data: CardData;
  onActionClick?: (data: CardData) => void;
  className?: string;
  showOptionsBtn?: boolean;
}

// SVG components (extracted for reusability and clarity)
export const EllipsisIcon: React.FC<{ className?: string }> = ({ className = 'size-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
  </svg>
);

export const AddIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
  </svg>
);

export const Card: React.FC<CardProps> = ({ 
  data, 
  onActionClick, 
  className = '', 
  showOptionsBtn: propShowOptionsBtn = false 
}) => {
  const {
    colorClass,
    themeColor,
    imageUrl,
    date,
    title,
    description,
    countdownText,
    showAddBtn: _showAddBtn,
  } = data;

  const hasOptions = propShowOptionsBtn || Boolean(data.showAddBtn);

  return (
    <div 
      className={`card group ${imageUrl ? 'has-bg-image' : ''} ${colorClass} ${className} relative overflow-hidden flex flex-col justify-between min-h-[400px] sm:min-h-[430px] rounded-2xl`}
      style={{ 
        ...(themeColor ? { ['--theme-color' as string]: themeColor } as React.CSSProperties : {})
      }}
    >
      {/* Background Image with Card-21 Parallax Zoom & High Visibility */}
      {imageUrl && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none brightness-[1.04] contrast-[1.02]"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {/* Bottom-anchored gradient scrim: text is readable while image remains 100% visible across top 52%+ of card */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, rgba(0, 0, 0, 0.90) 0%, rgba(0, 0, 0, 0.60) 20%, rgba(0, 0, 0, 0.12) 36%, transparent 48%)`,
            }}
          />
        </>
      )}

      {/* Card Header: Floating Frosted Pill Tag & 3-Dot Options Button */}
      {(Boolean(date) || hasOptions) && (
        <div className="card-header relative z-10 flex items-center justify-between p-4 sm:p-5">
          {date && (
            <div className="date inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wider shadow-md">
              {date}
            </div>
          )}
          {hasOptions && (
            <button
              type="button"
              onClick={() => onActionClick?.(data)}
              className="header-action-btn w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black flex items-center justify-center transition-all shadow-md cursor-pointer ml-auto"
              aria-label="Options"
            >
              <EllipsisIcon />
            </button>
          )}
        </div>
      )}

      {/* Card Content & Action Button (docked at the bottom where gradient provides high contrast) */}
      <div className="relative z-10 p-5 sm:p-6 mt-auto">
        {/* Card Body */}
        <div 
          className="cursor-pointer"
          onClick={() => onActionClick?.(data)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onActionClick?.(data);
            }
          }}
        >
          <h3 className="card-title-animated text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1.5">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-stone-200 font-medium leading-relaxed drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)] mb-4 line-clamp-2">
            {description}
          </p>
        </div>

        {/* Card Footer: Explore Button with Arrow Animation */}
        <div className="flex items-center justify-between pt-1">
          <button 
            type="button" 
            className="btn-countdown cursor-pointer inline-flex items-center justify-between w-full sm:w-auto gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md" 
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.(data);
            }}
          >
            <span>{countdownText}</span>
            <svg className="action-arrow w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;
