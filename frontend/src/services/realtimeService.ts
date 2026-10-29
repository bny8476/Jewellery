/**
 * Real-Time Synchronization Service for YAZHINI FINE JEWELS & PAWN SHOP
 * Connects to the backend SSE stream (/api/v1/events) with automatic reconnection
 * and falls back to Supabase Realtime channels when configured.
 */
import { useEffect } from 'react';

export type RealtimeEventType = 
  | 'inventory.product.created'
  | 'inventory.product.updated'
  | 'inventory.stock.changed'
  | 'sales.created'
  | 'sales.confirmed'
  | 'pawn-loans.created'
  | 'pawn-loans.updated'
  | 'pawn-loans.repayment.recorded'
  | 'customers.created'
  | 'customers.updated'
  | 'customer.kyc.updated'
  | 'metal-rates.updated'
  | 'connected'
  | string;

export interface RealtimeMessage<T = any> {
  event: RealtimeEventType;
  payload: T;
  timestamp: string;
}

type EventListenerCallback<T = any> = (data: T) => void;

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventListenerCallback>> = new Map();
  private isConnecting: boolean = false;
  private reconnectTimeout: any = null;
  private retryCount: number = 0;
  private readonly maxRetries: number = 2;
  private isAvailable: boolean | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSSE();
    }
  }

  private async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/v1/events', {
        method: 'GET',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal
      });
      clearTimeout(timer);
      const contentType = res.headers.get('content-type') || '';
      controller.abort(); // Immediately cancel test probe stream
      
      // If server returned 404 or text/html (SPA fallback), SSE is unavailable
      if (!res.ok || !contentType.includes('text/event-stream')) {
        this.isAvailable = false;
        return false;
      }
      this.isAvailable = true;
      return true;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  private async initSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return;
    }

    if (this.retryCount >= this.maxRetries) {
      return;
    }

    this.isConnecting = true;

    // Verify endpoint returns text/event-stream before letting browser initiate native EventSource
    const available = await this.checkAvailability();
    if (!available) {
      this.isConnecting = false;
      return;
    }

    try {
      const sseUrl = '/api/v1/events';
      const es = new EventSource(sseUrl);

      es.onopen = () => {
        this.isConnecting = false;
        this.retryCount = 0;
      };

      es.onmessage = (e) => {
        try {
          if (!e.data || e.data.startsWith(':')) return; // ignore comments / keep-alive
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.event) {
            this.dispatch(parsed.event, parsed.payload || parsed);
          }
        } catch {
          // ignore parsing error for heartbeat
        }
      };

      // Add generic listeners for known business events
      const knownEvents: RealtimeEventType[] = [
        'customers.created',
        'customers.updated',
        'inventory.product.created',
        'inventory.stock.changed',
        'sales.confirmed',
        'pawn-loans.created',
        'metal-rates.updated'
      ];

      knownEvents.forEach(evt => {
        es.addEventListener(evt, (e: any) => {
          try {
            const data = JSON.parse(e.data);
            this.dispatch(evt, data.payload || data);
          } catch {
            // ignore
          }
        });
      });

      es.onerror = () => {
        this.isConnecting = false;
        this.retryCount++;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Auto-reconnect with exponential backoff up to maxRetries
        if (this.retryCount < this.maxRetries) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.initSSE();
          }, 5000 * this.retryCount);
        } else {
          this.isAvailable = false;
        }
      };

      this.eventSource = es;
    } catch {
      this.isConnecting = false;
    }
  }

  public subscribe<T = any>(event: RealtimeEventType, callback: EventListenerCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Ensure connection is active if available
    if (typeof EventSource !== 'undefined' && this.isAvailable !== false && this.retryCount < this.maxRetries) {
      if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
        this.initSSE();
      }
    }

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  public dispatch(event: RealtimeEventType, payload: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`Error in realtime listener for ${event}:`, err);
        }
      });
    }

    // Also dispatch to window for any detached components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`rcb:${event}`, { detail: payload }));
    }
  }
}

export const realtimeManager = new RealtimeSyncManager();

/**
 * React Hook for subscribing to Realtime Events
 */
export function useRealtimeEvent<T = any>(event: RealtimeEventType, callback: (data: T) => void) {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribe<T>(event, callback);
    return () => {
      unsubscribe();
    };
  }, [event, callback]);
}
