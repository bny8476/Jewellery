import { describe, it, expect, vi, beforeEach } from 'vitest';
import { platformAccessService, PLATFORMS } from './platformAccessService';
import { platformSyncService, PlatformSyncPayload } from './platformSyncService';
import type { TabType } from '../pages/Admin';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] !== undefined ? this.store[key] : null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  key(index: number) { return Object.keys(this.store)[index] || null; }
}

const mockLocalStorage = new MockStorage();
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

// Mock window and CustomEvent if not present in node environment
if (typeof window === 'undefined') {
  const listeners: Record<string, Array<(e: any) => void>> = {};
  (globalThis as any).window = {
    addEventListener: (event: string, cb: any) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    },
    removeEventListener: (event: string, cb: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== cb);
      }
    },
    dispatchEvent: (e: any) => {
      const cbs = listeners[e.type] || [];
      cbs.forEach(cb => cb(e));
      return true;
    }
  };
}

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

describe('Multi-Platform Access Management System', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Platform Configuration & Registry', () => {
    it('contains all 3 required platforms plus the unified super admin view', () => {
      expect(PLATFORMS.auragold).toBeDefined();
      expect(PLATFORMS.pawnshop).toBeDefined();
      expect(PLATFORMS.ecommerce).toBeDefined();
      expect(PLATFORMS.all).toBeDefined();

      expect(PLATFORMS.auragold.name).toContain('Aura Gold');
      expect(PLATFORMS.auragold.liveRoute).toBe('/auragold');
      expect(PLATFORMS.auragold.primaryTab).toBe('auragold');

      expect(PLATFORMS.pawnshop.name).toContain('Pawn');
      expect(PLATFORMS.pawnshop.liveRoute).toBe('/pawn');
      expect(PLATFORMS.pawnshop.primaryTab).toBe('transaction');

      expect(PLATFORMS.ecommerce.name).toContain('E-Commerce');
      expect(PLATFORMS.ecommerce.liveRoute).toBe('/');
      expect(PLATFORMS.ecommerce.primaryTab).toBe('inventory');
    });

    it('persists and retrieves the active platform cleanly', () => {
      expect(platformAccessService.getActivePlatform()).toBe('all');

      platformAccessService.setActivePlatform('auragold');
      expect(platformAccessService.getActivePlatform()).toBe('auragold');
      expect(mockLocalStorage.getItem('yazhini_admin_active_platform')).toBe('auragold');

      platformAccessService.setActivePlatform('pawnshop');
      expect(platformAccessService.getActivePlatform()).toBe('pawnshop');

      platformAccessService.setActivePlatform('ecommerce');
      expect(platformAccessService.getActivePlatform()).toBe('ecommerce');
    });
  });

  describe('2. Platform Tab Scope Filtering', () => {
    it('allows appropriate tabs for Aura Gold while isolating other platforms', () => {
      // Aura Gold tabs
      expect(platformAccessService.isTabAllowedForPlatform('auragold', 'auragold')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('rates', 'auragold')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('rate_comparison', 'auragold')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('dashboard', 'auragold')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('customer', 'auragold')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('settings', 'auragold')).toBe(true);

      // Disallowed tabs for Aura Gold
      expect(platformAccessService.isTabAllowedForPlatform('inventory', 'auragold')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('pos', 'auragold')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('transaction', 'auragold')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('bank', 'auragold')).toBe(false);
    });

    it('allows appropriate tabs for Pawn Shop while isolating other platforms', () => {
      // Pawn Shop tabs
      expect(platformAccessService.isTabAllowedForPlatform('transaction', 'pawnshop')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('bank', 'pawnshop')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('online_requests', 'pawnshop')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('kyc', 'pawnshop')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('rates', 'pawnshop')).toBe(true);

      // Disallowed tabs for Pawn Shop
      expect(platformAccessService.isTabAllowedForPlatform('inventory', 'pawnshop')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('orders', 'pawnshop')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('campaigns', 'pawnshop')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('auragold', 'pawnshop')).toBe(false);
    });

    it('allows appropriate tabs for Jewellery E-Commerce while isolating other platforms', () => {
      // Jewellery E-Commerce tabs
      expect(platformAccessService.isTabAllowedForPlatform('inventory', 'ecommerce')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('orders', 'ecommerce')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('pos', 'ecommerce')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('campaigns', 'ecommerce')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('diamonds', 'ecommerce')).toBe(true);
      expect(platformAccessService.isTabAllowedForPlatform('giftcards', 'ecommerce')).toBe(true);

      // Disallowed tabs for E-Commerce
      expect(platformAccessService.isTabAllowedForPlatform('transaction', 'ecommerce')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('bank', 'ecommerce')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('online_requests', 'ecommerce')).toBe(false);
      expect(platformAccessService.isTabAllowedForPlatform('auragold', 'ecommerce')).toBe(false);
    });

    it('allows all tabs when unified view (all) is selected', () => {
      const allTabs: TabType[] = [
        'dashboard', 'pos', 'inventory', 'orders', 'campaigns',
        'rates', 'auragold', 'transaction', 'bank', 'customer', 'settings'
      ];
      allTabs.forEach(tab => {
        expect(platformAccessService.isTabAllowedForPlatform(tab, 'all')).toBe(true);
      });
    });
  });

  describe('3. Real-Time Dynamic Synchronization Engine', () => {
    it('broadcasts events and notifies target platform subscribers', () => {
      const received: PlatformSyncPayload[] = [];
      const unsub = platformSyncService.subscribe('ecommerce', (payload) => {
        received.push(payload);
      });

      // Broadcast an e-commerce product create
      platformSyncService.broadcast(
        'ecommerce',
        'create',
        'product',
        { id: 'prod_99', name: 'Royal Emerald Choker', price: 185000 },
        'prod_99'
      );

      expect(received.length).toBe(1);
      expect(received[0].platform).toBe('ecommerce');
      expect(received[0].action).toBe('create');
      expect(received[0].entityType).toBe('product');
      expect(received[0].entityId).toBe('prod_99');
      expect(received[0].data.name).toBe('Royal Emerald Choker');

      unsub();
    });

    it('filters out events for non-target platforms', () => {
      const auraReceived: PlatformSyncPayload[] = [];
      const pawnReceived: PlatformSyncPayload[] = [];

      const unsubAura = platformSyncService.subscribe('auragold', (p) => auraReceived.push(p));
      const unsubPawn = platformSyncService.subscribe('pawnshop', (p) => pawnReceived.push(p));

      // Broadcast for Aura Gold only
      platformSyncService.broadcast('auragold', 'update', 'metal_rate', { gold24k: 7850 });

      expect(auraReceived.length).toBe(1);
      expect(pawnReceived.length).toBe(0);

      // Broadcast for Pawn Shop only
      platformSyncService.broadcast('pawnshop', 'update', 'loan', { loanId: 'LN-1002', status: 'approved' });

      expect(auraReceived.length).toBe(1);
      expect(pawnReceived.length).toBe(1);

      unsubAura();
      unsubPawn();
    });

    it('allows universal subscribers to receive all events across platforms', () => {
      const allEvents: PlatformSyncPayload[] = [];
      const unsub = platformSyncService.subscribe('all', (p) => allEvents.push(p));

      platformSyncService.broadcast('ecommerce', 'delete', 'product', { id: 'p1' }, 'p1');
      platformSyncService.broadcast('auragold', 'refresh', 'digital_gold');
      platformSyncService.broadcast('pawnshop', 'create', 'loan', { loanId: 'LN-1' });

      expect(allEvents.length).toBe(3);
      expect(allEvents[0].action).toBe('delete');
      expect(allEvents[1].action).toBe('refresh');
      expect(allEvents[2].action).toBe('create');

      unsub();
    });

    it('dispatches legacy catalogue:updated event for product changes for backwards compatibility', () => {
      const dispatchSpy = vi.fn();
      window.addEventListener('catalogue:updated', dispatchSpy);

      platformSyncService.broadcast('ecommerce', 'create', 'product', { id: 'item_1' }, 'item_1');

      expect(dispatchSpy).toHaveBeenCalled();
      window.removeEventListener('catalogue:updated', dispatchSpy);
    });
  });
});
