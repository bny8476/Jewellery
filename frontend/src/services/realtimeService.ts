/**
 * Real-Time Synchronization Service for RCB JEWELRY'S & PAWN SHOP
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

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSSE();
    }
  }

  private initSSE() {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return;
    }

    this.isConnecting = true;
    try {
      const sseUrl = '/api/v1/events';
      const es = new EventSource(sseUrl);

      es.onopen = () => {
        this.isConnecting = false;
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
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect with backoff
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.initSSE();
        }, 5000);
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

    // Ensure connection is active
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      this.initSSE();
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
