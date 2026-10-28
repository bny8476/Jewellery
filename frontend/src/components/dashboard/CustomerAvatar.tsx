import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Crown, Gem, User as UserIcon } from 'lucide-react';

export type CustomerGender = 'female' | 'male' | 'other' | string;

export interface CustomerAvatarProps {
  name: string;
  gender?: CustomerGender;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  loyaltyTier?: string;
  showBadge?: boolean;
  withMotion?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: {
    container: 'w-7 h-7 text-[10px]',
    badge: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-1.5 h-1.5',
  },
  sm: {
    container: 'w-8 h-8 sm:w-9 sm:h-9 text-xs',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-2 h-2',
  },
  md: {
    container: 'w-11 h-11 text-sm',
    badge: 'w-4 h-4 -bottom-1 -right-1',
    badgeIcon: 'w-2.5 h-2.5',
  },
  lg: {
    container: 'w-14 h-14 text-base',
    badge: 'w-5 h-5 -bottom-1 -right-1',
    badgeIcon: 'w-3 h-3',
  },
  xl: {
    container: 'w-20 h-20 text-xl',
    badge: 'w-6 h-6 -bottom-1.5 -right-1.5',
    badgeIcon: 'w-3.5 h-3.5',
  },
  '2xl': {
    container: 'w-24 h-24 text-2xl',
    badge: 'w-7 h-7 -bottom-1.5 -right-1.5',
    badgeIcon: 'w-4 h-4',
  },
};

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
  name,
  gender = 'female',
  photoUrl,
  size = 'sm',
  loyaltyTier,
  showBadge = true,
  withMotion = true,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Normalize gender
  const normalizedGender = (gender || '').toLowerCase().trim();
  const isMale = normalizedGender === 'male' || normalizedGender === 'm';
  const isFemale = normalizedGender === 'female' || normalizedGender === 'f' || (!isMale && normalizedGender !== 'other');

  // Determine avatar source
  const defaultAvatar = isMale
    ? '/images/male_patron_avatar.jpg'
    : '/images/female_patron_avatar.jpg';

  const avatarSrc = photoUrl && photoUrl.trim().length > 0 ? photoUrl : defaultAvatar;

  // Clean initials for monogram fallback
  const cleanName = (name || 'Valued Patron').replace(/\s*\((?:Royal Patron|Patron)\)\s*/gi, '').replace(/\s*Royal Patron\s*/gi, '').replace(/\s*\(.*?\)\s*/g, '').trim() || 'Valued Patron';
  const initials = cleanName
    ? cleanName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'P';

  const currentSize = sizeConfig[size] || sizeConfig.sm;

  // Gender-adaptive Luxury Styling
  // Female: Radiant warm gold and subtle rose-gold glow with fine jewelry aura
  // Male: Architectural polished champagne gold border with regal depth
  const genderRingClass = isFemale
    ? 'ring-1 ring-[#E9D19E]/60 shadow-[0_0_14px_rgba(233,209,158,0.3)] hover:ring-2 hover:ring-[#D8B878] hover:shadow-[0_0_20px_rgba(216,184,120,0.45)]'
    : 'ring-1 ring-[#C9A45C]/60 shadow-[0_0_14px_rgba(201,164,92,0.3)] hover:ring-2 hover:ring-[#E9D19E] hover:shadow-[0_0_20px_rgba(201,164,92,0.45)]';

  const monogramGradient = isFemale
    ? 'bg-gradient-to-br from-[#2A1E24] via-[#1E2128] to-[#14161C] text-[#FAF3E8]'
    : 'bg-gradient-to-br from-[#1C2028] via-[#14161C] to-[#0E1015] text-[#E9D19E]';

  const BadgeIcon = loyaltyTier?.toLowerCase().includes('royal')
    ? Crown
    : loyaltyTier?.toLowerCase().includes('vip')
    ? Gem
    : Sparkles;

  const content = (
    <div
      className={`relative inline-flex shrink-0 rounded-full select-none ${className}`}
      title={`${cleanName} (${loyaltyTier || 'Valued Member'})`}
    >
      {/* Outer Luxury Halo Container */}
      <div
        className={`relative ${currentSize.container} rounded-full overflow-hidden transition-all duration-300 border border-[#C9A45C]/50 ${genderRingClass}`}
      >
        {!imageError && avatarSrc ? (
          <img
            src={avatarSrc}
            alt={cleanName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center filter contrast-[1.05] brightness-[1.02] transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center font-serif font-bold tracking-wider ${monogramGradient} border border-[#C9A45C]/30`}
          >
            {initials || <UserIcon className="w-1/2 h-1/2 text-[#D8B878]" />}
          </div>
        )}

        {/* Delicate Glassmorphism Vignette */}
        <div className="absolute inset-0 rounded-full pointer-events-none ring-1 ring-inset ring-black/15 shadow-inner" />
      </div>

      {/* Luxury Royal Status Badge */}
      {showBadge && (
        <span
          className={`absolute ${currentSize.badge} rounded-full bg-gradient-to-r from-[#D8B878] via-[#C9A45C] to-[#B38E46] p-0.5 shadow-md flex items-center justify-center border border-white/60 dark:border-[#1E2128] z-10`}
          aria-hidden="true"
        >
          <BadgeIcon className={`${currentSize.badgeIcon} text-[#1E2128] shrink-0`} />
        </span>
      )}
    </div>
  );

  if (withMotion) {
    return (
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="inline-flex items-center justify-center"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

export default CustomerAvatar;
