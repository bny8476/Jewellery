import crypto from 'crypto';
import { queryDb, memoryStore, supabase } from '../db.ts';

export type NotificationCategory = 
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
  recipient_role: 'customer' | 'admin' | 'staff' | string;
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
  is_archived: boolean;
  idempotency_key?: string;
  created_at: string;
}

export interface CreateNotificationInput {
  recipient_id: string;
  recipient_role?: 'customer' | 'admin' | 'staff' | string;
  event_type: string;
  category: NotificationCategory;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  destination_route?: string;
  idempotency_key?: string;
}

export interface NotificationQueryFilters {
  category?: string;
  unreadOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// Seed Initial System & Patron Notifications for testing/dev if empty
function ensureInitialSeed() {
  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  if (memoryStore.notifications.length === 0) {
    const defaultNotifs: NotificationRecord[] = [
      {
        id: 'notif-seed-01',
        recipient_id: 'customer_default',
        recipient_role: 'customer',
        event_type: 'order.dispatched',
        category: 'order',
        severity: 'info',
        title: 'Consignment Dispatched via Sequel Armoured Logistics',
        message: 'Your fine jewellery piece has passed BIS 916 laser hallmarking and is in transit with 100% insurance cover.',
        related_entity_type: 'order',
        related_entity_id: 'YZ-ORD-991244',
        destination_route: '/dashboard?tab=orders',
        is_read: false,
        read_at: null,
        is_archived: false,
        idempotency_key: 'seed-order-dispatch-01',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'notif-seed-02',
        recipient_id: 'customer_default',
        recipient_role: 'customer',
        event_type: 'vault.rate_benchmark',
        category: 'vault',
        severity: 'info',
        title: 'Aura Gold™ Market Benchmark Update',
        message: 'Precious metal spot benchmark for 24K 999.9 pure gold has refreshed. Your vault valuation has updated automatically.',
        related_entity_type: 'vault',
        destination_route: '/dashboard?tab=vault',
        is_read: false,
        read_at: null,
        is_archived: false,
        idempotency_key: 'seed-vault-rate-01',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      },
      {
        id: 'notif-seed-03',
        recipient_id: 'admin_all',
        recipient_role: 'admin',
        event_type: 'rates.daily_update',
        category: 'rate',
        severity: 'info',
        title: 'Bullion Spot Rates Refreshed',
        message: 'Daily market benchmark recorded from official precious metal feed for 24K, 22K, 18K & Silver.',
        destination_route: '/admin?tab=rates',
        is_read: false,
        read_at: null,
        is_archived: false,
        idempotency_key: 'seed-admin-rates-01',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'notif-seed-04',
        recipient_id: 'admin_all',
        recipient_role: 'admin',
        event_type: 'pawn.contract_due',
        category: 'pawn',
        severity: 'warning',
        title: 'Pawn Contracts Due for Interest Renewal',
        message: 'Active pledges approaching tenure renewal date. Renewal reminders queued for patron notification.',
        destination_route: '/admin?tab=pawn_loans',
        is_read: false,
        read_at: null,
        is_archived: false,
        idempotency_key: 'seed-admin-pawn-01',
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
      },
      {
        id: 'notif-seed-05',
        recipient_id: 'admin_all',
        recipient_role: 'admin',
        event_type: 'inventory.low_stock',
        category: 'inventory',
        severity: 'warning',
        title: 'Low Stock Alert: 22K Hallmarked Kadas',
        message: 'Available inventory units in Temple Jewellery collection has reached minimum reorder threshold.',
        destination_route: '/admin?tab=inventory',
        is_read: false,
        read_at: null,
        is_archived: false,
        idempotency_key: 'seed-admin-inv-01',
        created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString()
      }
    ];
    memoryStore.notifications.push(...defaultNotifs);
  }
}

// In-process event subscribers (e.g. SSE broadcaster)
type NotificationListener = (notification: NotificationRecord) => void;
const listeners: Set<NotificationListener> = new Set();

export function onNotificationEmitted(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Creates and persists a notification record with deduplication and realtime dispatch
 */
export async function createAndDispatchNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
  ensureInitialSeed();

  // Deduplication check: if idempotency_key is provided and already exists, return existing
  if (input.idempotency_key) {
    const existing = memoryStore.notifications.find(n => n.idempotency_key === input.idempotency_key);
    if (existing) {
      return existing;
    }
  }

  const newRecord: NotificationRecord = {
    id: 'ntf_' + crypto.randomUUID().substring(0, 18),
    recipient_id: input.recipient_id,
    recipient_role: input.recipient_role || 'customer',
    event_type: input.event_type,
    category: input.category,
    severity: input.severity || 'info',
    title: input.title,
    message: input.message,
    related_entity_type: input.related_entity_type,
    related_entity_id: input.related_entity_id,
    destination_route: input.destination_route,
    is_read: false,
    read_at: null,
    is_archived: false,
    idempotency_key: input.idempotency_key,
    created_at: new Date().toISOString()
  };

  // 1. Persist to in-memory store
  memoryStore.notifications.unshift(newRecord);

  // 2. Persist to PostgreSQL if configured
  try {
    await queryDb(
      `INSERT INTO notifications (
        id, customer_id, notification_type, title, message, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        newRecord.id,
        newRecord.recipient_id,
        newRecord.category,
        newRecord.title,
        newRecord.message,
        false,
        newRecord.created_at
      ]
    );
  } catch (err) {
    // Falls back seamlessly to memory store
  }

  // 3. Dispatch to realtime listeners (SSE broadcaster)
  listeners.forEach(fn => {
    try {
      fn(newRecord);
    } catch (e) {
      console.warn('[NotificationService] Error executing listener:', e);
    }
  });

  return newRecord;
}

/**
 * Retrieves notifications for an authenticated recipient (customer or admin/staff)
 */
export async function getNotificationsForRecipient(
  recipientId: string,
  role: string = 'customer',
  filters: NotificationQueryFilters = {}
): Promise<{ items: NotificationRecord[]; total: number; unreadCount: number }> {
  ensureInitialSeed();

  const isStaffRole = ['admin', 'super_admin', 'manager', 'sales_staff', 'cashier', 'staff', 'pawn_officer'].includes(role);

  // Filter by recipient: match specific ID or broad admin broadcast
  let list = memoryStore.notifications.filter(n => {
    if (n.is_archived) return false;

    if (isStaffRole) {
      // Staff can see admin broadcasts + alerts assigned to staff or specific ID
      return n.recipient_role === 'admin' || n.recipient_role === 'staff' || n.recipient_id === recipientId || n.recipient_id === 'admin_all';
    }

    // Customers only see their own notifications or global customer broadcasts
    return n.recipient_id === recipientId || n.recipient_id === 'customer_default';
  });

  // Category filter
  if (filters.category && filters.category !== 'all') {
    list = list.filter(n => n.category === filters.category);
  }

  // Unread filter
  if (filters.unreadOnly) {
    list = list.filter(n => !n.is_read);
  }

  // Search filter
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(n => 
      n.title.toLowerCase().includes(q) || 
      n.message.toLowerCase().includes(q) ||
      (n.related_entity_id && n.related_entity_id.toLowerCase().includes(q))
    );
  }

  // Compute total unread for this recipient
  const unreadCount = memoryStore.notifications.filter(n => {
    if (n.is_archived || n.is_read) return false;
    if (isStaffRole) {
      return n.recipient_role === 'admin' || n.recipient_role === 'staff' || n.recipient_id === recipientId || n.recipient_id === 'admin_all';
    }
    return n.recipient_id === recipientId || n.recipient_id === 'customer_default';
  }).length;

  const total = list.length;
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  const paginated = list.slice(offset, offset + limit);

  return {
    items: paginated,
    total,
    unreadCount
  };
}

/**
 * Retrieves unread notification count for an authenticated recipient
 */
export async function getUnreadNotificationCount(recipientId: string, role: string = 'customer'): Promise<number> {
  ensureInitialSeed();
  const isStaffRole = ['admin', 'super_admin', 'manager', 'sales_staff', 'cashier', 'staff'].includes(role);

  return memoryStore.notifications.filter(n => {
    if (n.is_archived || n.is_read) return false;
    if (isStaffRole) {
      return n.recipient_role === 'admin' || n.recipient_role === 'staff' || n.recipient_id === recipientId || n.recipient_id === 'admin_all';
    }
    return n.recipient_id === recipientId || n.recipient_id === 'customer_default';
  }).length;
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(id: string, recipientId: string, role: string = 'customer'): Promise<boolean> {
  ensureInitialSeed();
  const isStaffRole = ['admin', 'super_admin', 'manager', 'staff'].includes(role);

  const notif = memoryStore.notifications.find(n => n.id === id);
  if (!notif) return false;

  // Authorization check: customer cannot mark other customer's notification as read
  if (!isStaffRole && notif.recipient_id !== recipientId && notif.recipient_id !== 'customer_default') {
    throw new Error('Unauthorized: Cannot modify notifications belonging to another patron.');
  }

  notif.is_read = true;
  notif.read_at = new Date().toISOString();

  try {
    await queryDb(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
  } catch (err) {
    // Memory store already updated
  }

  return true;
}

/**
 * Marks all notifications as read for a recipient
 */
export async function markAllNotificationsAsRead(recipientId: string, role: string = 'customer'): Promise<number> {
  ensureInitialSeed();
  const isStaffRole = ['admin', 'super_admin', 'manager', 'staff'].includes(role);

  let updatedCount = 0;
  const now = new Date().toISOString();

  memoryStore.notifications.forEach(n => {
    if (n.is_read || n.is_archived) return;

    const belongs = isStaffRole 
      ? (n.recipient_role === 'admin' || n.recipient_role === 'staff' || n.recipient_id === recipientId || n.recipient_id === 'admin_all')
      : (n.recipient_id === recipientId || n.recipient_id === 'customer_default');

    if (belongs) {
      n.is_read = true;
      n.read_at = now;
      updatedCount++;
    }
  });

  return updatedCount;
}

/**
 * Archives / deletes a notification
 */
export async function archiveNotification(id: string, recipientId: string, role: string = 'customer'): Promise<boolean> {
  ensureInitialSeed();
  const isStaffRole = ['admin', 'super_admin', 'manager', 'staff'].includes(role);

  const notif = memoryStore.notifications.find(n => n.id === id);
  if (!notif) return false;

  if (!isStaffRole && notif.recipient_id !== recipientId && notif.recipient_id !== 'customer_default') {
    throw new Error('Unauthorized: Cannot archive notifications belonging to another patron.');
  }

  notif.is_archived = true;
  return true;
}

/**
 * Notification preferences management
 */
export async function getNotificationPreferences(userId: string): Promise<Record<string, boolean>> {
  if (!memoryStore.notification_preferences) {
    memoryStore.notification_preferences = [];
  }

  const existing = memoryStore.notification_preferences.find(p => p.user_id === userId);
  if (existing) {
    return existing.preferences;
  }

  // Default preferences
  return {
    orders: true,
    payments: true,
    vault: true,
    pawn: true,
    rates: true,
    giftcards: true,
    security: true,
    marketing: false
  };
}

export async function updateNotificationPreferences(userId: string, preferences: Record<string, boolean>): Promise<Record<string, boolean>> {
  if (!memoryStore.notification_preferences) {
    memoryStore.notification_preferences = [];
  }

  let record = memoryStore.notification_preferences.find(p => p.user_id === userId);
  if (!record) {
    const current = await getNotificationPreferences(userId);
    record = { user_id: userId, preferences: { ...current } };
    memoryStore.notification_preferences.push(record);
  }

  record.preferences = {
    ...record.preferences,
    ...preferences
  };

  return record.preferences;
}
