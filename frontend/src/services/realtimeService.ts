/**
 * Real-Time Synchronization Service for YAZHINI FINE JEWELS & PAWN SHOP
 * Connects to the backend SSE stream (/api/v1/events) with authenticated session token
 * and falls back to Supabase Realtime channels when configured.
 */
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEventsStreamUrl, apiUrl } from '../config/api';

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
  private currentAccessToken: string | null = null;
  private currentUserId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAuthSync();
    }
  }

  private async initAuthSync() {
    try {
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && session.user?.id) {
        this.currentAccessToken = session.access_token;
        this.currentUserId = session.user.id;
        this.initSSE();
      }

      // 2. Listen for auth changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (session?.access_token && session.user?.id) {
          const tokenChanged = this.currentAccessToken !== session.access_token;
          this.currentAccessToken = session.access_token;
          this.currentUserId = session.user.id;
          if (tokenChanged || !this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
            this.disconnect();
            this.initSSE();
          }
        } else {
          this.currentAccessToken = null;
          this.currentUserId = null;
          this.disconnect();
        }
      });
    } catch {
      // Session lookup skipped in non-browser or test context
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  private async initSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    // Only establish connection if a verified authenticated token is present
    if (!this.currentAccessToken || !this.currentUserId) {
      return;
    }

    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return;
    }

    if (this.retryCount >= this.maxRetries) {
      return;
    }

    this.isConnecting = true;

    try {
      // Ephemeral ticket exchange: credentials are sent via Authorization header, NOT in the URL
      const ticketRes = await fetch(apiUrl('/api/v1/events/ticket'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.currentAccessToken}`
        }
      });

      if (!ticketRes.ok) {
        this.isConnecting = false;
        return;
      }

      const ticketData = await ticketRes.json();
      if (!ticketData.ticket) {
        this.isConnecting = false;
        return;
      }

      const sseUrl = getEventsStreamUrl(ticketData.ticket);
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

      es.onerror = () => {
        this.disconnect();
        this.scheduleReconnect();
      };

      this.eventSource = es;
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (typeof EventSource !== 'undefined' && this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = Math.min(3000 * Math.pow(2, this.retryCount), 30000);
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.initSSE();
      }, delay);
    }
  }

  public subscribe<T = any>(event: RealtimeEventType, callback: EventListenerCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  public dispatch<T = any>(event: RealtimeEventType, payload: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error('[RealtimeSync] Listener execution error:', err);
        }
      });
    }

    // Also dispatch to wildcard listeners
    const wildcardCallbacks = this.listeners.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(cb => {
        try {
          cb({ event, payload });
        } catch (err) {
          console.error('[RealtimeSync] Wildcard listener execution error:', err);
        }
      });
    }
  }
}

export const realtimeManager = new RealtimeSyncManager();

export function useRealtimeEvent<T = any>(event: RealtimeEventType, callback: EventListenerCallback<T>): void {
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribe<T>(event, callback);
    return () => {
      unsubscribe();
    };
  }, [event, callback]);
}
