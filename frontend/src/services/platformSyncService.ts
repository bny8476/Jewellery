/**
 * Platform Synchronization Service
 * Centralizes real-time, cross-tab, and live website dynamic synchronization
 * for Aura Gold, Pawn Shop, and Jewellery E-Commerce.
 */

export type PlatformSyncTarget = 'auragold' | 'pawnshop' | 'ecommerce' | 'all';

export type PlatformSyncAction = 'create' | 'update' | 'delete' | 'modify' | 'refresh';

export interface PlatformSyncPayload {
  platform: PlatformSyncTarget;
  action: PlatformSyncAction;
  entityType: 'product' | 'category' | 'loan' | 'metal_rate' | 'digital_gold' | 'campaign' | 'order' | 'config';
  entityId?: string;
  data?: any;
  timestamp: string;
}

const BROADCAST_CHANNEL_NAME = 'yazhini_platform_live_sync';

class PlatformSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(payload: PlatformSyncPayload) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.debug('[PlatformSync] BroadcastChannel unsupported, using event fallback:', err);
      }
    }

    // Storage event fallback for cross-window messaging if BroadcastChannel is blocked
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'yazhini_platform_sync_trigger' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners(parsed);
          } catch {}
        }
      });

      // Internal window event fallback
      window.addEventListener('platform:sync', ((e: CustomEvent) => {
        if (e.detail) {
          this.notifyListeners(e.detail);
        }
      }) as EventListener);
    }
  }

  // Broadcast a dynamic synchronization event to live website instances
  broadcast(
    platform: PlatformSyncTarget,
    action: PlatformSyncAction,
    entityType: PlatformSyncPayload['entityType'],
    data?: any,
    entityId?: string
  ): void {
    const payload: PlatformSyncPayload = {
      platform,
      action,
      entityType,
      entityId,
      data,
      timestamp: new Date().toISOString()
    };

    // 1. Send via BroadcastChannel (instant across open browser tabs/windows)
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.debug('Failed to post to BroadcastChannel:', err);
      }
    }

    // 2. Fallback via localStorage to trigger cross-tab storage event
    try {
      localStorage.setItem('yazhini_platform_sync_trigger', JSON.stringify(payload));
    } catch {}

    // 3. Dispatch in current window & notify local listeners immediately
    this.notifyListeners(payload);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('platform:sync', { detail: payload }));
    }

    // Also dispatch legacy specific events for backwards compatibility
    if (entityType === 'product' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('catalogue:updated', { 
        detail: { action, item: data, id: entityId } 
      }));
    }
  }

  // Subscribe to dynamic live platform updates (optionally filtered by platform)
  subscribe(
    platformOrCallback: PlatformSyncTarget | ((payload: PlatformSyncPayload) => void),
    maybeCallback?: (payload: PlatformSyncPayload) => void
  ): () => void {
    let targetPlatform: PlatformSyncTarget | null = null;
    let cb: (payload: PlatformSyncPayload) => void;

    if (typeof platformOrCallback === 'function') {
      cb = platformOrCallback;
    } else {
      targetPlatform = platformOrCallback;
      cb = maybeCallback || (() => {});
    }

    const wrapped = (payload: PlatformSyncPayload) => {
      if (!targetPlatform || targetPlatform === 'all' || payload.platform === 'all' || payload.platform === targetPlatform) {
        cb(payload);
      }
    };

    this.listeners.add(wrapped);
    return () => {
      this.listeners.delete(wrapped);
    };
  }

  private notifyListeners(payload: PlatformSyncPayload): void {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[PlatformSync] Error in sync listener callback:', err);
      }
    });
  }
}

export const platformSyncService = new PlatformSyncManager();
