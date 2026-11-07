import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '../utils/toast';
import { apiUrl } from '../config/api';
import { supabase } from '../lib/supabase';
import { authenticatedFetch, getValidAccessToken } from '../services/authenticatedApiClient';

export type NotificationCategory =
  | 'all'
  | 'unread'
  | 'order'
  | 'payment'
  | 'vault'
  | 'giftcard'
  | 'pawn'
  | 'inventory'
  | 'security'
  | 'rate'
  | 'system';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';

export interface NotificationRecord {
  id: string;
  recipient_id: string;
  recipient_role: string;
  event_type: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  destination_route?: string;
  is_read: boolean;
  read_at?: string | null;
  is_archived?: boolean;
  idempotency_key?: string;
  created_at: string;
}

export interface NotificationContextType {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  activeCategory: string;
  searchQuery: string;
  isRealtimeConnected: boolean;
  preferences: Record<string, boolean>;
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<number>;
  deleteNotification: (id: string) => Promise<boolean>;
  updatePreferences: (newPrefs: Record<string, boolean>) => Promise<void>;
  dispatchLocalToast: (title: string, message: string, severity?: NotificationSeverity) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SYNC_CHANNEL_NAME = 'yazhini_notification_sync';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    orders: true,
    payments: true,
    vault: true,
    pawn: true,
    rates: true,
    giftcards: true,
    security: true
  });

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);
  const sseConnectingRef = useRef<boolean>(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if session exists before fetching notifications
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (!data?.session?.user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all' && activeCategory !== 'unread') {
        params.append('category', activeCategory);
      }
      if (activeCategory === 'unread') {
        params.append('unreadOnly', 'true');
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await authenticatedFetch(`/api/v1/notifications?${params.toString()}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`Failed to load notifications: HTTP ${res.status}`);
      }

      const resData = await res.json();
      if (resData.success && Array.isArray(resData.notifications)) {
        setNotifications(resData.notifications);
        setUnreadCount(typeof resData.unreadCount === 'number' ? resData.unreadCount : 0);
      }
    } catch (err: any) {
      console.warn('[NotificationContext] Fetch warning:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    broadcastChannelRef.current?.postMessage({
      type: 'NOTIFICATION_READ',
      id
    });

    try {
      const res = await authenticatedFetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH'
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[NotificationContext] markAsRead sync error:', err);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<number> => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);

    broadcastChannelRef.current?.postMessage({
      type: 'ALL_READ'
    });

    try {
      const res = await authenticatedFetch('/api/v1/notifications/mark-all-read', {
        method: 'POST'
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data.count || 0;
      }
      return 0;
    } catch (err) {
      console.warn('[NotificationContext] markAllAsRead error:', err);
      return 0;
    }
  }, []);

  // Delete / archive a notification
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    broadcastChannelRef.current?.postMessage({
      type: 'NOTIFICATION_DELETED',
      id
    });

    try {
      const res = await authenticatedFetch(`/api/v1/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[NotificationContext] deleteNotification error:', err);
      return false;
    }
  }, []);

  // Update notification category preferences
  const updatePreferences = useCallback(async (newPrefs: Record<string, boolean>) => {
    setPreferences(newPrefs);
    try {
      await authenticatedFetch('/api/v1/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      });
    } catch (err) {
      console.warn('[NotificationContext] updatePreferences sync error:', err);
    }
  }, []);

  // Dispatch luxury local toast
  const dispatchLocalToast = useCallback((title: string, message: string, severity: NotificationSeverity = 'info') => {
    const isMuted = !preferences.orders && (title.includes('Order') || title.includes('Consignment'));
    if (isMuted) return;

    switch (severity) {
      case 'success':
        toast.success(`${title} — ${message}`);
        break;
      case 'warning':
        toast.warning(`${title} — ${message}`);
        break;
      case 'error':
      case 'critical':
        toast.error(`${title} — ${message}`);
        break;
      default:
        toast.info(`${title} — ${message}`);
        break;
    }
  }, [preferences]);

  // Initial fetch on mount & category change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Cross-Tab Broadcast Channel Sync
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    try {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        switch (msg.type) {
          case 'NOTIFICATION_READ':
            setNotifications(prev =>
              prev.map(n => (n.id === msg.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            break;

          case 'ALL_READ':
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
            setUnreadCount(0);
            break;

          case 'NOTIFICATION_DELETED':
            setNotifications(prev => prev.filter(n => n.id !== msg.id));
            break;

          case 'NEW_NOTIFICATION':
            if (msg.notification && msg.notification.id) {
              setNotifications(prev => {
                if (prev.some(x => x.id === msg.notification.id)) return prev;
                return [msg.notification, ...prev];
              });
              if (typeof msg.unreadCount === 'number') {
                setUnreadCount(msg.unreadCount);
              } else {
                setUnreadCount(prev => prev + 1);
              }
            }
            break;

          case 'SYNC_UNREAD':
            if (typeof msg.unreadCount === 'number') {
              setUnreadCount(msg.unreadCount);
            }
            break;
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }

    return () => {
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  // Connect to Authenticated SSE Realtime Stream via fetch + ReadableStream
  useEffect(() => {
    let active = true;

    const handleSseMessage = (raw: string) => {
      if (!raw || !active) return;
      const lines = raw.split('\n');
      let eventType = 'message';
      let dataStr = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataStr = line.slice(5).trim();
        }
      }

      if (!dataStr) return;

      try {
        const data = JSON.parse(dataStr);
        if (eventType === 'connected') {
          if (typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        } else if (eventType === 'notification') {
          const notif: NotificationRecord = data.payload;
          const count: number = data.unreadCount;

          if (notif && notif.id) {
            setNotifications(prev => {
              if (prev.some(x => x.id === notif.id)) return prev;
              return [notif, ...prev];
            });

            if (typeof count === 'number') {
              setUnreadCount(count);
            } else {
              setUnreadCount(prev => prev + 1);
            }

            dispatchLocalToast(notif.title, notif.message, notif.severity || 'info');

            broadcastChannelRef.current?.postMessage({
              type: 'NEW_NOTIFICATION',
              notification: notif,
              unreadCount: typeof count === 'number' ? count : undefined
            });
          }
        } else if (eventType === 'unread_sync') {
          if (typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
            broadcastChannelRef.current?.postMessage({
              type: 'SYNC_UNREAD',
              unreadCount: data.unreadCount
            });
          }
        }
      } catch {
        // Heartbeat or unparseable event
      }
    };

    const scheduleReconnect = () => {
      if (!active || reconnectTimeoutRef.current) return;
      if (retryCountRef.current < 5) {
        retryCountRef.current += 1;
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (active) connectSSE();
        }, delay);
      }
    };

    const connectSSE = async () => {
      if (!active || sseConnectingRef.current) return;
      if (typeof window === 'undefined') return;

      sseConnectingRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Check for valid Supabase session
      let token: string | null = null;
      try {
        token = await getValidAccessToken({ silent: true });
      } catch {
        token = null;
      }

      console.log("[Notification SSE] Authenticated:", Boolean(token));

      if (!token) {
        // Logged-out visitor: do not open private user stream
        setIsRealtimeConnected(false);
        sseConnectingRef.current = false;
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(apiUrl('/api/v1/events'), {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });

        // Handle authentication responses
        if (response.status === 401) {
          // Unauthenticated or session expired: stop cleanly, do NOT loop endlessly
          console.warn('[Notification SSE] Server rejected token with 401 Unauthorized.');
          setIsRealtimeConnected(false);
          sseConnectingRef.current = false;
          return;
        }

        if (response.status === 403) {
          console.warn('[NotificationContext] Forbidden from realtime SSE stream');
          setIsRealtimeConnected(false);
          sseConnectingRef.current = false;
          return;
        }

        if (!response.ok || !response.body) {
          setIsRealtimeConnected(false);
          sseConnectingRef.current = false;
          scheduleReconnect();
          return;
        }

        setIsRealtimeConnected(true);
        retryCountRef.current = 0;
        sseConnectingRef.current = false;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { value, done } = await reader.read();
          if (done) {
            setIsRealtimeConnected(false);
            if (active && !controller.signal.aborted) {
              scheduleReconnect();
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const msg of parts) {
            handleSseMessage(msg);
          }
        }
      } catch (err: any) {
        sseConnectingRef.current = false;
        if (controller.signal.aborted) return;
        setIsRealtimeConnected(false);

        // Exponential backoff reconnect for authenticated users
        if (active) {
          scheduleReconnect();
        }
      } finally {
        sseConnectingRef.current = false;
      }
    };

    // Initial connection attempt
    connectSSE();

    // Listen to Supabase auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        connectSSE();
        fetchNotifications();
      } else {
        sseConnectingRef.current = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setNotifications([]);
        setUnreadCount(0);
        setIsRealtimeConnected(false);
      }
    });

    return () => {
      active = false;
      sseConnectingRef.current = false;
      subscription?.unsubscribe();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsRealtimeConnected(false);
    };
  }, [dispatchLocalToast, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    activeCategory,
    searchQuery,
    isRealtimeConnected,
    preferences,
    setActiveCategory,
    setSearchQuery,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    dispatchLocalToast
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
