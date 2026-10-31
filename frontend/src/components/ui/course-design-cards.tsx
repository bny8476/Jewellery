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
      className={`card group ${imageUrl ? 'has-bg-image' : ''} ${colorClass} ${className} relative overflow-hidden flex flex-col justify-between min-h-[420px] sm:min-h-[440px] rounded-2xl`}
      style={{ 
        ...(themeColor ? { ['--theme-color' as string]: themeColor } as React.CSSProperties : {})
      }}
    >
      {/* Background Image with Card-21 Parallax Zoom & High Visibility */}
      {imageUrl && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none brightness-[1.03] contrast-[1.02]"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          {/* Smooth, multi-stop gradient scrim: jewellery image remains bright and clear at top, text has deep contrast at bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to top, rgba(12, 7, 10, 0.97) 0%, rgba(12, 7, 10, 0.90) 28%, rgba(12, 7, 10, 0.60) 52%, rgba(12, 7, 10, 0.20) 70%, transparent 84%)`,
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

      {/* Card Content & Action Button (docked at the bottom with perfect placement across all cards) */}
      <div className="relative z-10 p-5 sm:p-6 mt-auto flex flex-col justify-end">
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
          <h3 className="card-title-animated text-xl sm:text-[22px] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] mb-1.5 leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-[13px] text-stone-200/90 font-normal leading-relaxed drop-shadow-[0_1px_5px_rgba(0,0,0,0.95)] mb-4 line-clamp-2 min-h-[2.5rem]">
            {description}
          </p>
        </div>

        {/* Card Footer: Explore Button with Arrow Animation (Left-aligned stroked pill with filled hover) */}
        <div className="flex items-center justify-start pt-1">
          <button 
            type="button" 
            className="btn-countdown cursor-pointer inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all" 
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
