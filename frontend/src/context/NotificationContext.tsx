import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '../utils/toast';

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
  const [loading, setLoading] = useState<boolean>(true);
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
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Helper to get auth token and user headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    try {
      const stored = localStorage.getItem('yazhini_auth_token') || sessionStorage.getItem('yazhini_auth_token');
      if (stored) {
        headers['Authorization'] = `Bearer ${stored}`;
      }
      const patronUser = localStorage.getItem('yazhini_patron_user');
      if (patronUser) {
        const parsed = JSON.parse(patronUser);
        if (parsed.id) headers['x-user-id'] = parsed.id;
        if (parsed.email) headers['x-user-email'] = parsed.email;
      }
    } catch {
      // LocalStorage error fallback
    }
    return headers;
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();

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

      const res = await fetch(`/api/v1/notifications?${params.toString()}`, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to load notifications: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      }
    } catch (err: any) {
      console.warn('[NotificationContext] Fetch warning:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, activeCategory, searchQuery]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Broadcast cross-tab sync
    broadcastChannelRef.current?.postMessage({
      type: 'NOTIFICATION_READ',
      id
    });

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
        headers
      });

      if (res.ok) {
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
  }, [getAuthHeaders]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<number> => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);

    // Broadcast cross-tab sync
    broadcastChannelRef.current?.postMessage({
      type: 'ALL_READ'
    });

    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        return data.count || 0;
      }
      return 0;
    } catch (err) {
      console.warn('[NotificationContext] markAllAsRead error:', err);
      return 0;
    }
  }, [getAuthHeaders]);

  // Delete / archive a notification
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));

    broadcastChannelRef.current?.postMessage({
      type: 'NOTIFICATION_DELETED',
      id
    });

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers
      });
      return res.ok;
    } catch (err) {
      console.warn('[NotificationContext] deleteNotification error:', err);
      return false;
    }
  }, [getAuthHeaders]);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Record<string, boolean>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
    try {
      const headers = getAuthHeaders();
      await fetch('/api/v1/notifications/preferences', {
        method: 'PUT',
        headers,
        body: JSON.stringify(newPrefs)
      });
    } catch (err) {
      console.warn('[NotificationContext] updatePreferences error:', err);
    }
  }, [getAuthHeaders]);

  // Local toast helper
  const dispatchLocalToast = useCallback((title: string, message: string, severity: NotificationSeverity = 'info') => {
    if (severity === 'critical' || severity === 'error') {
      toast.error(message, title);
    } else if (severity === 'warning') {
      toast.warning(message, title);
    } else if (severity === 'success') {
      toast.success(message, title);
    } else {
      toast.info(message, title);
    }
  }, []);

  // Multi-Tab Synchronization via BroadcastChannel
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        broadcastChannelRef.current = bc;

        bc.onmessage = (event) => {
          const msg = event.data;
          if (!msg || !msg.type) return;

          switch (msg.type) {
            case 'NOTIFICATION_READ':
              setNotifications(prev =>
                prev.map(n => (n.id === msg.id ? { ...n, is_read: true } : n))
              );
              setUnreadCount(prev => Math.max(0, prev - 1));
              break;

            case 'ALL_READ':
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
              setUnreadCount(0);
              break;

            case 'NOTIFICATION_DELETED':
              setNotifications(prev => prev.filter(n => n.id !== msg.id));
              break;

            case 'NEW_NOTIFICATION':
              if (msg.notification) {
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
      }
    } catch {
      // BroadcastChannel unsupported fallback
    }

    return () => {
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  // Connect to SSE Realtime Stream
  useEffect(() => {
    let active = true;

    const connectSSE = () => {
      if (!active) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      let token = '';
      let userId = 'customer_default';
      try {
        token = localStorage.getItem('yazhini_auth_token') || '';
        const patron = localStorage.getItem('yazhini_patron_user');
        if (patron) {
          const parsed = JSON.parse(patron);
          if (parsed.id) userId = parsed.id;
        }
      } catch {
        // storage fallback
      }

      const sseUrl = `/api/v1/events?userId=${encodeURIComponent(userId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!active) return;
        setIsRealtimeConnected(true);
      };

      // Handle connected event
      es.addEventListener('connected', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        } catch {
          // ignore
        }
      });

      // Handle live incoming notifications
      es.addEventListener('notification', (e: MessageEvent) => {
        if (!active) return;
        try {
          const data = JSON.parse(e.data);
          const notif: NotificationRecord = data.payload;
          const count: number = data.unreadCount;

          if (notif && notif.id) {
            // Update state
            setNotifications(prev => {
              if (prev.some(x => x.id === notif.id)) return prev;
              return [notif, ...prev];
            });

            if (typeof count === 'number') {
              setUnreadCount(count);
            } else {
              setUnreadCount(prev => prev + 1);
            }

            // Display Luxury Toast Popup
            dispatchLocalToast(notif.title, notif.message, notif.severity || 'info');

            // Broadcast to other open tabs
            broadcastChannelRef.current?.postMessage({
              type: 'NEW_NOTIFICATION',
              notification: notif,
              unreadCount: typeof count === 'number' ? count : undefined
            });
          }
        } catch (err) {
          console.warn('[NotificationContext] SSE notification parse error:', err);
        }
      });

      // Handle cross-tab or server unread sync
      es.addEventListener('unread_sync', (e: MessageEvent) => {
        if (!active) return;
        try {
          const data = JSON.parse(e.data);
          if (typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
            broadcastChannelRef.current?.postMessage({
              type: 'SYNC_UNREAD',
              unreadCount: data.unreadCount
            });
          }
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        if (!active) return;
        setIsRealtimeConnected(false);
        es.close();

        // Retry connection after 5 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (active) connectSSE();
        }, 5000);
      };
    };

    connectSSE();

    return () => {
      active = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Initial fetch on mount & whenever filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

const defaultContextValue: NotificationContextType = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  activeCategory: 'all',
  searchQuery: '',
  isRealtimeConnected: false,
  preferences: {
    orders: true,
    payments: true,
    vault: true,
    pawn: true,
    rates: true,
    giftcards: true,
    security: true
  },
  setActiveCategory: () => {},
  setSearchQuery: () => {},
  fetchNotifications: async () => {},
  markAsRead: async () => false,
  markAllAsRead: async () => 0,
  deleteNotification: async () => false,
  updatePreferences: async () => {},
  dispatchLocalToast: () => {}
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    return defaultContextValue;
  }
  return context;
};
