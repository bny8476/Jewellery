import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CollectionCTAProps {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'light' | 'dark' | 'gold';
  className?: string;
  ariaLabel?: string;
}

export const CollectionCTA: React.FC<CollectionCTAProps> = ({
  label,
  href,
  onClick,
  variant = 'gold',
  className = '',
  ariaLabel,
}) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick();
    } else if (href) {
      if (href.startsWith('http')) {
        window.location.href = href;
      } else {
        navigate(href);
      }
    }
  };

  // Sharp, rectangular styling: rounded-none, uppercase tracking-widest, thin border
  const variantStyles = {
    gold: 'bg-[#C6A15B] text-[#1A0B0E] border border-[#C6A15B] hover:bg-white hover:text-[#1A0B0E] hover:border-white shadow-sm hover:shadow-md',
    dark: 'bg-transparent text-white border border-white/70 hover:bg-white hover:text-[#120D10] hover:border-white shadow-sm hover:shadow-lg',
    light: 'bg-transparent text-[#1F171A] dark:text-[#FAF5F0] border border-[#1F171A]/40 dark:border-white/30 hover:bg-[#1F171A] hover:text-white dark:hover:bg-white dark:hover:text-[#180309] shadow-sm',
  }[variant];

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel || label}
      className={`group relative inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-none text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C6A15B] cursor-pointer ${variantStyles} ${className}`}
    >
      <span className="relative z-10 transition-colors duration-300">{label}</span>
      <ArrowRight className="w-3.5 h-3.5 transition-all duration-300 ease-out group-hover:translate-x-1 relative z-10" />
    </button>
  );
};
