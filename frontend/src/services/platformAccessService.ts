import { LucideIcon, Coins, Scale, Gem, LayoutGrid } from 'lucide-react';
import type { TabType } from '../pages/Admin';

export type PlatformId = 'all' | 'auragold' | 'pawnshop' | 'ecommerce';

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  themeColor: string;
  badgeBg: string;
  borderColor: string;
  icon: LucideIcon;
  liveRoute: string;
  primaryTab: TabType;
  allowedTabs: TabType[];
  accentGradient: string;
  statsTitle: string;
}

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  all: {
    id: 'all',
    name: 'Unified Multi-Platform Suite',
    shortName: 'All Platforms',
    tagline: 'Consolidated Enterprise Management',
    description: 'Centralized command center overseeing Aura Gold, Pawn Brokerage, and Jewellery E-Commerce simultaneously.',
    themeColor: '#D4AF37',
    badgeBg: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    icon: LayoutGrid,
    liveRoute: '/',
    primaryTab: 'dashboard',
    allowedTabs: [
      'dashboard', 'pos', 'inventory', 'orders', 'campaigns', 'online_requests',
      'rates', 'rate_comparison', 'auragold', 'giftcards', 'diamonds', 'master',
      'transaction', 'purchases', 'bank', 'customer', 'kyc', 'accounts',
      'reports', 'users', 'settings'
    ],
    accentGradient: 'from-amber-400 via-amber-500 to-amber-700',
    statsTitle: 'Enterprise Consolidated Overview'
  },
  auragold: {
    id: 'auragold',
    name: 'Aura Gold™ Vault & Bullion',
    shortName: 'Aura Gold',
    tagline: '24K 999.9 Digital Gold & Bullion Custody',
    description: 'Manage 24K digital gold vault, live buy/sell bullion quotes, systematic investment plans (SIP), gold delivery & redemption ledger.',
    themeColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: Coins,
    liveRoute: '/auragold',
    primaryTab: 'auragold',
    allowedTabs: [
      'auragold', 'rates', 'rate_comparison', 'dashboard', 'customer',
      'accounts', 'reports', 'settings'
    ],
    accentGradient: 'from-yellow-400 via-amber-500 to-yellow-600',
    statsTitle: 'Aura Gold™ Vault Metrics'
  },
  pawnshop: {
    id: 'pawnshop',
    name: 'Yazhini Pawn Brokerage & Lending',
    shortName: 'Pawn Shop',
    tagline: 'Regulated Collateral Credit & Vault Custody',
    description: 'Manage collateral pawn loans, gold pledge registers, part payments, interest accruals, bank custody, and PMLA KYC audits.',
    themeColor: '#10B981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: Scale,
    liveRoute: '/pawn',
    primaryTab: 'transaction',
    allowedTabs: [
      'transaction', 'bank', 'online_requests', 'kyc', 'rates', 'dashboard',
      'customer', 'accounts', 'reports', 'settings'
    ],
    accentGradient: 'from-emerald-400 via-teal-500 to-emerald-700',
    statsTitle: 'Pawn Brokerage & Loan Ledger'
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'Yazhini Fine Jewels E-Commerce',
    shortName: 'Jewellery Store',
    tagline: 'BIS 916 Hallmarked Jewellery & Solitaires',
    description: 'Manage retail product catalogue, dynamic pricing, orders & shipments, POS billing, solitaire diamonds, and promotional campaigns.',
    themeColor: '#C69A8B',
    badgeBg: 'rgba(198, 154, 139, 0.15)',
    borderColor: 'rgba(198, 154, 139, 0.4)',
    icon: Gem,
    liveRoute: '/',
    primaryTab: 'inventory',
    allowedTabs: [
      'inventory', 'orders', 'pos', 'campaigns', 'diamonds', 'giftcards',
      'master', 'purchases', 'dashboard', 'customer', 'accounts', 'reports', 'settings'
    ],
    accentGradient: 'from-rose-400 via-amber-500 to-rose-700',
    statsTitle: 'Retail Jewellery & E-Commerce Metrics'
  }
};

const STORAGE_KEY = 'yazhini_admin_active_platform';

export const platformAccessService = {
  // Get active platform from persistent storage
  getActivePlatform(): PlatformId {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY) as PlatformId;
        if (saved && PLATFORMS[saved]) {
          return saved;
        }
      }
    } catch (err) {
      console.debug('Failed to read platform from storage:', err);
    }
    return 'all';
  },

  // Set active platform in persistent storage
  setActivePlatform(platform: PlatformId): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, platform);
        window.dispatchEvent(new CustomEvent('platform:changed', { detail: { platform } }));
      }
    } catch (err) {
      console.debug('Failed to write platform to storage:', err);
    }
  },

  // Get config for specified or active platform
  getPlatformConfig(platform?: PlatformId): PlatformConfig {
    const id = platform || this.getActivePlatform();
    return PLATFORMS[id] || PLATFORMS.all;
  },

  // Check if a tab is relevant for the specified platform
  isTabAllowedForPlatform(tab: TabType, platform: PlatformId): boolean {
    if (platform === 'all') return true;
    const config = PLATFORMS[platform];
    return config ? config.allowedTabs.includes(tab) : true;
  }
};
