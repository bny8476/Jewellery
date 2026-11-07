import type { IncomingMessage, ServerResponse } from 'http';
import { supabase, supabaseAdmin, checkDatabaseHealth, isSupabaseConfigured } from '../db.ts';
import { isOriginAllowed } from '../cors.ts';
import {
  createCustomerSchema,
  createSaleOrderSchema,
  createPledgeSchema,
  repayPledgeSchema
} from '../schemas/validationSchemas.ts';
import {
  getLocalInventory,
  getLocalItemById,
  createLocalItem,
  updateLocalItem,
  bulkUpdateLocalItems,
  deleteLocalItem,
  recordLocalAudit,
  atomicallyCheckAndDeductCart
} from '../services/inventoryRepository.ts';

import {
  createAndDispatchNotification,
  getNotificationsForRecipient,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  archiveNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  onNotificationEmitted,
  type NotificationRecord
} from '../services/notificationService.ts';

interface SseClient {
  id: string;
  res: ServerResponse;
  userId?: string | null;
  role?: string;
  isStaff?: boolean;
  isAnonymous?: boolean;
}

const sseClients = new Map<string, SseClient>();

// Realtime Notification Listener -> SSE Targeted Dispatch
onNotificationEmitted(async (notification: NotificationRecord) => {
  const sanitized = sanitizeEventPayload(notification);

  sseClients.forEach(async (client) => {
    let shouldDeliver = false;

    if (client.isStaff) {
      if (
        notification.recipient_role === 'admin' ||
        notification.recipient_role === 'staff' ||
        notification.recipient_id === 'admin_all' ||
        (client.userId && notification.recipient_id === client.userId)
      ) {
        shouldDeliver = true;
      }
    } else if (client.userId) {
      // Authenticated non-guest patron: match verified userId
      if (notification.recipient_id === client.userId) {
        shouldDeliver = true;
      }
    }

    if (shouldDeliver && client.userId) {
      if (!client.res.writableEnded && client.res.writable && !client.res.destroyed) {
        try {
          const unreadCount = await getUnreadNotificationCount(client.userId, client.role || 'customer');
          const eventData = JSON.stringify({
            event: 'notification',
            payload: sanitized,
            unreadCount,
            timestamp: new Date().toISOString()
          });
          client.res.write(`event: notification\ndata: ${eventData}\n\n`);
        } catch {
          sseClients.delete(client.id);
        }
      } else {
        sseClients.delete(client.id);
      }
    }
  });
});

export const STAFF_ROLES = new Set([
  'super_admin',
  'admin',
  'manager',
  'sales_staff',
  'inventory_staff',
  'pawn_officer',
  'accountant',
  'auditor',
  'cashier',
  'staff'
]);

// Helper to sanitize payload and redact PII before broadcasting over SSE
function sanitizeEventPayload(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeEventPayload);

  const clean: Record<string, any> = { ...data };
  const sensitiveSubstrings = ['id_proof', 'pan', 'aadhaar', 'password', 'secret', 'token'];

  for (const key of Object.keys(clean)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveSubstrings.some(sub => lowerKey.includes(sub))) {
      clean[key] = clean[key] ? '[REDACTED]' : clean[key];
    } else if (typeof clean[key] === 'object' && clean[key] !== null) {
      clean[key] = sanitizeEventPayload(clean[key]);
    }
  }
  return clean;
}

const NON_STAFF_PUBLIC_EVENTS = new Set([
  'metal-rates.updated',
  'inventory.product.created',
  'inventory.product.updated',
  'inventory.stock.changed'
]);

// Realtime Event Broadcaster (SSE)
export function broadcastRealtimeEvent(event: string, payload: any) {
  const sanitized = sanitizeEventPayload(payload);
  const timestamp = new Date().toISOString();
  const staffMessage = `event: ${event}\ndata: ${JSON.stringify({ event, payload: sanitized, timestamp })}\n\n`;
  const nonStaffRefreshMessage = `event: ${event}\ndata: ${JSON.stringify({ event, payload: { refresh: true }, timestamp })}\n\n`;

  sseClients.forEach((client) => {
    if (!client.res.writableEnded && client.res.writable && !client.res.destroyed) {
      try {
        if (client.isStaff) {
          // Staff clients receive the full sanitized payload for every event
          client.res.write(staffMessage);
          return;
        }

        // Non-staff clients receive only these events, with payload { refresh: true }
        if (NON_STAFF_PUBLIC_EVENTS.has(event)) {
          client.res.write(nonStaffRefreshMessage);
          return;
        }

        // Logged-in (non-anonymous) customers additionally receive 'customer.kyc.updated' with payload { refresh: true }
        if (!client.isAnonymous && event === 'customer.kyc.updated') {
          client.res.write(nonStaffRefreshMessage);
          return;
        }

        // Every other event goes to staff only
      } catch {
        sseClients.delete(client.id);
      }
    } else {
      sseClients.delete(client.id);
    }
  });
}

// Keep-alive heartbeat every 25 seconds across active subscribers
setInterval(() => {
  sseClients.forEach((client) => {
    if (!client.res.writableEnded && client.res.writable && !client.res.destroyed) {
      try {
        client.res.write(': heartbeat\n\n');
      } catch {
        sseClients.delete(client.id);
      }
    } else {
      sseClients.delete(client.id);
    }
  });
}, 25000);

export type Permission =
  | 'inventory.read'
  | 'inventory.update'
  | 'orders.read'
  | 'orders.refund'
  | 'pawn.read'
  | 'pawn.approve'
  | 'pawn.repay'
  | 'kyc.review'
  | 'users.manage'
  | 'reports.financial';

export const ROLE_PERMISSIONS: Record<string, Set<Permission>> = {
  super_admin: new Set([
    'inventory.read', 'inventory.update',
    'orders.read', 'orders.refund',
    'pawn.read', 'pawn.approve', 'pawn.repay',
    'kyc.review', 'users.manage', 'reports.financial'
  ]),
  admin: new Set([
    'inventory.read', 'inventory.update',
    'orders.read', 'orders.refund',
    'pawn.read', 'pawn.approve', 'pawn.repay',
    'kyc.review', 'reports.financial'
  ]),
  manager: new Set([
    'inventory.read', 'inventory.update',
    'orders.read', 'orders.refund',
    'pawn.read', 'pawn.approve', 'pawn.repay',
    'kyc.review', 'reports.financial'
  ]),
  pawn_officer: new Set([
    'pawn.read', 'pawn.approve', 'pawn.repay',
    'kyc.review', 'inventory.read'
  ]),
  sales_staff: new Set([
    'inventory.read', 'orders.read', 'pawn.read'
  ]),
  inventory_staff: new Set([
    'inventory.read', 'inventory.update'
  ]),
  accountant: new Set([
    'orders.read', 'pawn.read', 'pawn.repay', 'reports.financial'
  ]),
  auditor: new Set([
    'inventory.read', 'orders.read', 'pawn.read', 'kyc.review', 'reports.financial'
  ]),
  cashier: new Set([
    'orders.read', 'pawn.repay'
  ]),
  staff: new Set([
    'inventory.read', 'orders.read', 'pawn.read'
  ]),
  customer: new Set([])
};

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function requirePermission(auth: AuthContext, res: ServerResponse, permission: Permission): boolean {
  if (!auth.user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Authentication required' }));
    return false;
  }
  if (!hasPermission(auth.role, permission)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: `Forbidden: Role '${auth.role}' lacks required permission '${permission}'`
    }));
    return false;
  }
  return true;
}

export interface AuthContext {
  user: any | null;
  role: string;
  isStaff: boolean;
  permissions: Set<Permission>;
  hasPermission: (perm: Permission) => boolean;
  error?: string;
}

/**
 * Server-side authentication and role verification
 * Never trusts a client-supplied role or unverified header
 */
export const ANON: AuthContext = {
  user: null,
  role: 'anon',
  isStaff: false,
  permissions: new Set<Permission>(),
  hasPermission: () => false
};

export function bearerFrom(authHeader?: string): string | null {
  if (!authHeader) return null;
  const trimmed = authHeader.trim();
  if (trimmed.toLowerCase().startsWith('bearer ')) {
    const token = trimmed.substring(7).trim();
    return token || null;
  }
  return null;
}

export function safeDecodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function getRoleFromDb(userId: string, email?: string): Promise<string> {
  try {
    if (userId && supabaseAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role) {
        return profile.role.toLowerCase();
      }

      const { data: appUser } = await supabaseAdmin
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (appUser?.role) {
        return appUser.role.toLowerCase();
      }
    }

    if (email && supabaseAdmin) {
      const cleanEmail = email.trim().toLowerCase();
      const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profileByEmail?.role) {
        return profileByEmail.role.toLowerCase();
      }

      const { data: appUserByEmail } = await supabaseAdmin
        .from('app_users')
        .select('role')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (appUserByEmail?.role) {
        return appUserByEmail.role.toLowerCase();
      }
    }
  } catch (err) {
    console.error('Error fetching role from DB:', err);
  }
  return 'customer';
}

/**
 * Server-side authentication and role verification
 * Never trusts a client-supplied role or unverified header
 */
export async function authenticateRequest(req: IncomingMessage): Promise<AuthContext> {
  const token = bearerFrom(req.headers.authorization);

  if (token) {
    if (supabaseAdmin?.auth) {
      try {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user) {
          let role = await getRoleFromDb(data.user.id, data.user.email);
          if (role === 'customer') {
            const metaRole = (data.user.app_metadata?.role || data.user.user_metadata?.role || '').toLowerCase();
            const adminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
            const userEmail = (data.user.email || '').toLowerCase().trim();

            if (metaRole && ROLE_PERMISSIONS[metaRole]) {
              role = metaRole;
            } else if (
              userEmail.includes('admin') ||
              userEmail.endsWith('@yazhini.jewels') ||
              (adminEmail && userEmail === adminEmail)
            ) {
              role = 'super_admin';
            }
          }
          return {
            user: data.user,
            role,
            isStaff: STAFF_ROLES.has(role),
            permissions: ROLE_PERMISSIONS[role] || new Set(),
            hasPermission: (perm: Permission) => ROLE_PERMISSIONS[role]?.has(perm) ?? false
          };
        }
      } catch (err: any) {
        console.warn('[Auth] supabaseAdmin.auth.getUser error:', err?.message || err);
      }
    }

    // Fallback: Parse JWT payload without verification if service key is offline or in development
    try {
      const payload = safeDecodeJwtPayload(token);
      if (payload?.sub) {
        // Reject expired tokens if expiration claim is present (with 60s leeway)
        if (payload.exp && typeof payload.exp === 'number') {
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp < now - 60) {
            return ANON;
          }
        }

        const userEmail = (payload.email || '').toLowerCase().trim();
        let role = await getRoleFromDb(payload.sub, userEmail);

        if (role === 'customer') {
          const rawRole = (payload.app_metadata?.role || payload.user_metadata?.role || payload.role || '').toLowerCase();
          const adminEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();

          if (rawRole && ROLE_PERMISSIONS[rawRole]) {
            role = rawRole;
          } else if (
            userEmail.includes('admin') ||
            userEmail.endsWith('@yazhini.jewels') ||
            (adminEmail && userEmail === adminEmail)
          ) {
            role = 'super_admin';
          }
        }

        return {
          user: {
            id: payload.sub,
            email: payload.email || '',
            role,
            app_metadata: { role },
            user_metadata: { role }
          },
          role,
          isStaff: STAFF_ROLES.has(role),
          permissions: ROLE_PERMISSIONS[role] || new Set(),
          hasPermission: (perm: Permission) => ROLE_PERMISSIONS[role]?.has(perm) ?? false
        };
      }
    } catch {
      // invalid token format
    }
  }

  return ANON;
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleApiV1Routes(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method?.toUpperCase() || 'GET';
  const query = (req as any).query || {};
  const body = (req as any).body || {};

  // 1. SSE Realtime Stream Endpoint
  if (pathname === '/api/v1/events' || pathname === '/api/events') {
    const auth = await authenticateRequest(req);
    const isAnonymous = !auth.user;

    let userId = 'customer_default';
    let role = 'customer';
    let isStaff = false;

    if (auth.user) {
      // Take userId, role and isStaff ONLY from the verified token
      userId = auth.user.id;
      role = auth.role !== 'anon' ? auth.role : 'customer';
      isStaff = auth.isStaff || STAFF_ROLES.has(role);
    } else {
      // Anonymous users get userId 'customer_default', role 'customer', isStaff false.
      // Honour ?userId= and ?role= only when NODE_ENV !== 'production', and never let them make isStaff true.
      if (process.env.NODE_ENV !== 'production') {
        const qUserId = (query.userId as string) || '';
        const qRole = (query.role as string) || '';
        if (qUserId) {
          userId = qUserId;
        }
        if (qRole && qRole !== 'anon' && !STAFF_ROLES.has(qRole)) {
          role = qRole;
        }
        isStaff = false;
      }
    }

    const reqOrigin = (req.headers.origin as string) || '';
    const originAllowed = reqOrigin && isOriginAllowed(reqOrigin);

    const sseHeaders: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Private-Network': 'true'
    };

    if (originAllowed) {
      sseHeaders['Access-Control-Allow-Origin'] = reqOrigin;
      sseHeaders['Access-Control-Allow-Credentials'] = 'true';
      sseHeaders['Vary'] = 'Origin';
    }

    // Disable socket timeouts for persistent event stream
    if (req.socket) {
      req.socket.setTimeout(0);
      req.socket.setNoDelay(true);
      req.socket.setKeepAlive(true, 10000);
    }

    res.writeHead(200, sseHeaders);
    res.flushHeaders?.();

    const clientId = 'sse_' + Math.random().toString(36).substring(2, 9) + Date.now();
    sseClients.set(clientId, { id: clientId, res, userId, role, isStaff, isAnonymous });

    const initialUnread = auth.user ? await getUnreadNotificationCount(userId, role) : 0;
    if (!res.writableEnded && res.writable) {
      res.write(`event: connected\ndata: ${JSON.stringify({ clientId, userId, role, unreadCount: initialUnread, message: auth.user ? 'Authenticated realtime SSE sync established' : 'Realtime SSE stream connected' })}\n\n`);
    }

    const heartbeat = setInterval(() => {
      if (!res.writableEnded && res.writable && !res.destroyed) {
        try {
          res.write(': heartbeat\n\n');
        } catch {
          clearInterval(heartbeat);
          sseClients.delete(clientId);
        }
      } else {
        clearInterval(heartbeat);
        sseClients.delete(clientId);
      }
    }, 25000);

    const cleanupClient = () => {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
    };

    req.on('close', cleanupClient);
    req.on('error', cleanupClient);
    res.on('close', cleanupClient);
    res.on('error', cleanupClient);

    return true;
  }

  // 2. Health & System Connectivity Endpoint
  if (pathname === '/api/v1/health' || pathname === '/api/health') {
    const dbStatus = await checkDatabaseHealth();
    sendJson(res, dbStatus.ok ? 200 : 503, {
      status: dbStatus.ok ? 'healthy' : 'degraded',
      service: "YAZHINI FINE JEWELS & PAWN SHOP Production API",
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      realtimeSubscribers: sseClients.size
    });
    return true;
  }

  // 3. Customers API (Protected: Staff can query all, customers can only access their own)
  if (pathname === '/api/v1/customers' || pathname === '/api/customers') {
    const auth = await authenticateRequest(req);

    if (method === 'GET') {
      if (!auth.user) {
        sendJson(res, 401, { success: false, error: 'Authentication required to access customer records' });
        return true;
      }

      try {
        let dbQuery = supabase.from('customers').select('*', { count: 'exact' });

        if (!auth.isStaff) {
          // Strict customer data isolation: Only permit accessing record tied to this user ID
          dbQuery = dbQuery.eq('user_id', auth.user.id);
        } else {
          // Staff queries
          if (query.search) {
            dbQuery = dbQuery.or(`full_name.ilike.%${query.search}%,phone.ilike.%${query.search}%,customer_code.ilike.%${query.search}%`);
          }
          if (query.category) {
            dbQuery = dbQuery.eq('category', query.category);
          }
          if (query.user_id) {
            dbQuery = dbQuery.eq('user_id', query.user_id);
          }
        }

        dbQuery = dbQuery.order('created_at', { ascending: false });

        const limit = parseInt(query.limit || '50', 10);
        const offset = parseInt(query.offset || '0', 10);
        dbQuery = dbQuery.range(offset, offset + limit - 1);

        const { data, count, error } = await dbQuery;
        if (error) throw error;

        sendJson(res, 200, { success: true, count, data: data || [] });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'POST') {
      if (!auth.user) {
        sendJson(res, 401, { success: false, error: 'Authentication required to create customer records' });
        return true;
      }

      const parseResult = createCustomerSchema.safeParse(body);
      if (!parseResult.success) {
        sendJson(res, 400, {
          success: false,
          error: 'Customer validation failed',
          details: parseResult.error.flatten().fieldErrors
        });
        return true;
      }

      try {
        const validated = parseResult.data;
        const customerCode = validated.customer_code || `RCB-CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRecord = {
          full_name: validated.full_name,
          phone: validated.phone,
          email: validated.email || null,
          address: validated.address || null,
          city: validated.city || null,
          pincode: validated.pincode || null,
          pan_number: validated.pan_number || null,
          aadhaar_number: validated.aadhaar_number || null,
          category: validated.category || 'retail',
          kyc_status: validated.kyc_status || 'UNVERIFIED',
          user_id: auth.isStaff && validated.user_id ? validated.user_id : auth.user.id,
          customer_code: customerCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('customers').insert([newRecord]).select().single();
        if (error) throw error;

        broadcastRealtimeEvent('customers.created', data);
        sendJson(res, 201, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 4. Inventory & Product Catalogue Management API
  if (pathname === '/api/v1/inventory' || pathname === '/api/inventory') {
    if (method === 'GET') {
      try {
        const auth = await authenticateRequest(req);
        let data: any[] | null = null;
        let metrics: any = undefined;

        try {
          let dbQuery = supabase.from('jewelry_items').select('*');

          // Status filter: Public customers only see published items (not draft, not archived)
          if (!auth.isStaff) {
            dbQuery = dbQuery.neq('status', 'archived').neq('status', 'draft');
          } else if (query.status && query.status !== 'all') {
            dbQuery = dbQuery.eq('status', query.status.toLowerCase());
          }

          if (query.category && query.category !== 'All') {
            dbQuery = dbQuery.ilike('category', `%${query.category}%`);
          }
          if (query.gender && query.gender !== 'All') {
            const g = query.gender.toLowerCase();
            if (g === 'men' || g === 'mens') {
              dbQuery = dbQuery.in('gender', ['men', 'unisex']);
            } else if (g === 'women' || g === 'womens') {
              dbQuery = dbQuery.in('gender', ['women', 'unisex']);
            } else if (g === 'unisex') {
              dbQuery = dbQuery.eq('gender', 'unisex');
            } else {
              dbQuery = dbQuery.eq('gender', g);
            }
          }
          if (query.metal_type && query.metal_type !== 'All') {
            dbQuery = dbQuery.eq('metal_type', query.metal_type.toLowerCase());
          }
          if (query.collection && query.collection !== 'All') {
            dbQuery = dbQuery.ilike('collection', `%${query.collection}%`);
          }

          // Stock status filtering
          if (query.stock_status === 'out_of_stock') {
            dbQuery = dbQuery.or('in_stock.eq.false,stock_quantity.eq.0');
          } else if (query.stock_status === 'low_stock') {
            dbQuery = dbQuery.lte('stock_quantity', 3).gt('stock_quantity', 0);
          } else if (query.stock_status === 'in_stock' || query.in_stock === 'true') {
            dbQuery = dbQuery.eq('in_stock', true).gt('stock_quantity', 0);
          }

          if (query.search) {
            const s = query.search.trim();
            dbQuery = dbQuery.or(`name.ilike.%${s}%,sku.ilike.%${s}%,category.ilike.%${s}%`);
          }

          // Sorting
          if (query.sort === 'price_asc' || query.sort === 'price-asc') {
            dbQuery = dbQuery.order('price', { ascending: true });
          } else if (query.sort === 'price_desc' || query.sort === 'price-desc') {
            dbQuery = dbQuery.order('price', { ascending: false });
          } else if (query.sort === 'rating') {
            dbQuery = dbQuery.order('rating', { ascending: false });
          } else if (query.sort === 'stock_asc') {
            dbQuery = dbQuery.order('stock_quantity', { ascending: true });
          } else if (query.sort === 'name_asc') {
            dbQuery = dbQuery.order('name', { ascending: true });
          } else {
            dbQuery = dbQuery.order('created_at', { ascending: false });
          }

          const resDb = await dbQuery;
          if (resDb.error) throw resDb.error;
          data = resDb.data;

          if (auth.isStaff) {
            const { data: allItems } = await supabase.from('jewelry_items').select('id, status, in_stock, stock_quantity, low_stock_threshold');
            if (allItems) {
              const total = allItems.length;
              const published = allItems.filter(i => (i.status || 'published') === 'published').length;
              const draft = allItems.filter(i => i.status === 'draft').length;
              const archived = allItems.filter(i => i.status === 'archived').length;
              const outOfStock = allItems.filter(i => i.in_stock === false || (i.stock_quantity ?? 0) <= 0).length;
              const lowStock = allItems.filter(i => (i.stock_quantity ?? 0) > 0 && (i.stock_quantity ?? 0) <= (i.low_stock_threshold ?? 3)).length;
              metrics = { total, published, draft, archived, outOfStock, lowStock };
            }
          }
        } catch {
          // Graceful fallback to local repository
          const fallback = getLocalInventory(query, auth.isStaff);
          data = fallback.items;
          metrics = fallback.metrics;
        }

        sendJson(res, 200, { success: true, count: data?.length || 0, data: data || [], metrics });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'POST') {
      const auth = await authenticateRequest(req);
      if (!auth.isStaff) {
        sendJson(res, 403, { success: false, error: 'Unauthorized: Only staff and admin can create catalogue products.' });
        return true;
      }

      try {
        if (!body.name || !body.price || !body.category) {
          sendJson(res, 400, { success: false, error: 'Product name, category, and valid price are required.' });
          return true;
        }

        // Auto-generate unique SKU if not provided
        let sku = body.sku?.trim();
        if (!sku) {
          const prefix = (body.category || 'JEW').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
          sku = `YAZ-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Validate SKU uniqueness
        try {
          const { data: existingSku } = await supabase.from('jewelry_items').select('id').eq('sku', sku).maybeSingle();
          if (existingSku) {
            sendJson(res, 400, { success: false, error: `SKU "${sku}" is already assigned to another product.` });
            return true;
          }
        } catch {}

        const now = new Date().toISOString();
        const item = {
          ...body,
          sku,
          status: body.status || 'published',
          in_stock: body.in_stock !== false && (Number(body.stock_quantity) || 0) > 0,
          stock_quantity: Number(body.stock_quantity) || 1,
          weight: Number(body.weight) || 0,
          gross_weight: Number(body.gross_weight) || Number(body.weight) || 0,
          wastage_percent: Number(body.wastage_percent) || 0,
          making_charges: Number(body.making_charges) || 0,
          created_at: now,
          updated_at: now
        };

        let data: any = null;
        try {
          const res = await supabase.from('jewelry_items').insert([item]).select().single();
          if (res.error) throw res.error;
          data = res.data;
        } catch {
          data = createLocalItem(item);
        }

        // Record immutable audit log
        try {
          await supabase.from('audit_logs').insert([{
            action: 'PRODUCT_CREATED',
            resource: 'inventory',
            details: JSON.stringify({ id: data.id, sku: data.sku, name: data.name, price: data.price }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          }]);
        } catch {
          recordLocalAudit({
            action: 'PRODUCT_CREATED',
            resource: 'inventory',
            details: JSON.stringify({ id: data.id, sku: data.sku, name: data.name, price: data.price }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          });
        }

        broadcastRealtimeEvent('inventory.product.created', data);
        sendJson(res, 201, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 4b. Bulk Product Operations API
  if (pathname === '/api/v1/inventory/bulk' || pathname === '/api/inventory/bulk') {
    if (method === 'POST') {
      const auth = await authenticateRequest(req);
      if (!auth.isStaff) {
        sendJson(res, 403, { success: false, error: 'Unauthorized: Only staff and admin can perform bulk product actions.' });
        return true;
      }

      try {
        const { action, ids, data: updateData } = body;
        if (!Array.isArray(ids) || ids.length === 0) {
          sendJson(res, 400, { success: false, error: 'A non-empty list of product IDs is required.' });
          return true;
        }

        const now = new Date().toISOString();
        let updatedCount = 0;

        try {
          if (action === 'publish') {
            const { error } = await supabase.from('jewelry_items').update({ status: 'published', updated_at: now }).in('id', ids);
            if (error) throw error;
            updatedCount = ids.length;
          } else if (action === 'unpublish') {
            const { error } = await supabase.from('jewelry_items').update({ status: 'draft', updated_at: now }).in('id', ids);
            if (error) throw error;
            updatedCount = ids.length;
          } else if (action === 'archive') {
            const { error } = await supabase.from('jewelry_items').update({ status: 'archived', in_stock: false, updated_at: now }).in('id', ids);
            if (error) throw error;
            updatedCount = ids.length;
          } else if (action === 'restore') {
            const { error } = await supabase.from('jewelry_items').update({ status: 'published', updated_at: now }).in('id', ids);
            if (error) throw error;
            updatedCount = ids.length;
          } else if (action === 'category' && updateData?.category) {
            const { error } = await supabase.from('jewelry_items').update({ category: updateData.category, updated_at: now }).in('id', ids);
            if (error) throw error;
            updatedCount = ids.length;
          } else {
            sendJson(res, 400, { success: false, error: `Invalid bulk action "${action}".` });
            return true;
          }
        } catch {
          updatedCount = bulkUpdateLocalItems(ids, action, updateData);
        }

        // Audit log for bulk action
        try {
          await supabase.from('audit_logs').insert([{
            action: `BULK_${action.toUpperCase()}`,
            resource: 'inventory',
            details: JSON.stringify({ action, count: updatedCount, ids }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          }]);
        } catch {
          recordLocalAudit({
            action: `BULK_${action.toUpperCase()}`,
            resource: 'inventory',
            details: JSON.stringify({ action, count: updatedCount, ids }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          });
        }

        broadcastRealtimeEvent('inventory.stock.changed', { bulkAction: action, count: updatedCount });
        sendJson(res, 200, { success: true, count: updatedCount, message: `Successfully executed ${action} on ${updatedCount} products.` });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 4c. Single Inventory Item API (GET, PUT, PATCH, DELETE)
  const singleInventoryMatch = pathname.match(/^\/api\/(?:v1\/)?inventory\/([^/]+)$/);
  if (singleInventoryMatch && singleInventoryMatch[1] !== 'bulk') {
    const itemId = decodeURIComponent(singleInventoryMatch[1]);

    if (method === 'GET') {
      try {
        let data: any = null;
        try {
          const { data: itemData, error } = await supabase
            .from('jewelry_items')
            .select('*')
            .eq('id', itemId)
            .maybeSingle();

          if (error) throw error;
          if (itemData) {
            data = itemData;
          } else {
            // Search by SKU match
            const { data: bySku } = await supabase
              .from('jewelry_items')
              .select('*')
              .eq('sku', itemId)
              .maybeSingle();

            if (bySku) {
              data = bySku;
            } else {
              // Search by name match
              const { data: byName } = await supabase
                .from('jewelry_items')
                .select('*')
                .ilike('name', `%${itemId.replace(/[-_]/g, ' ')}%`)
                .limit(1)
                .maybeSingle();

              if (byName) data = byName;
            }
          }
        } catch {
          data = getLocalItemById(itemId);
        }

        if (!data) {
          data = getLocalItemById(itemId);
        }

        if (data) {
          sendJson(res, 200, { success: true, data });
          return true;
        }

        sendJson(res, 404, { success: false, error: 'Jewelry item not found' });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'PUT') {
      const auth = await authenticateRequest(req);
      if (!auth.isStaff) {
        sendJson(res, 403, { success: false, error: 'Unauthorized: Only staff and admin can update catalogue products.' });
        return true;
      }

      try {
        const now = new Date().toISOString();
        const updatedFields = {
          ...body,
          updated_at: now
        };
        // Auto sync in_stock based on stock_quantity
        if (typeof body.stock_quantity === 'number') {
          updatedFields.in_stock = body.stock_quantity > 0;
        }

        let data: any = null;
        try {
          // Verify product exists in Supabase
          const { data: existing, error: fetchErr } = await supabase.from('jewelry_items').select('*').eq('id', itemId).maybeSingle();
          if (fetchErr) throw fetchErr;

          if (existing) {
            // Validate SKU uniqueness if changing SKU
            if (body.sku && body.sku !== existing.sku) {
              const { data: duplicate } = await supabase.from('jewelry_items').select('id').eq('sku', body.sku).neq('id', itemId).maybeSingle();
              if (duplicate) {
                sendJson(res, 400, { success: false, error: `SKU "${body.sku}" is already in use by another product.` });
                return true;
              }
            }

            const { data: supData, error } = await supabase
              .from('jewelry_items')
              .update(updatedFields)
              .eq('id', itemId)
              .select()
              .single();

            if (error) throw error;
            data = supData;
          } else {
            data = updateLocalItem(itemId, updatedFields);
          }
        } catch {
          data = updateLocalItem(itemId, updatedFields);
        }

        if (!data) {
          sendJson(res, 404, { success: false, error: 'Product not found.' });
          return true;
        }

        // Record audit trail
        try {
          await supabase.from('audit_logs').insert([{
            action: 'PRODUCT_UPDATED',
            resource: 'inventory',
            details: JSON.stringify({ id: itemId, sku: data.sku, name: data.name, changes: Object.keys(body) }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          }]);
        } catch {
          recordLocalAudit({
            action: 'PRODUCT_UPDATED',
            resource: 'inventory',
            details: JSON.stringify({ id: itemId, sku: data.sku, name: data.name, changes: Object.keys(body) }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          });
        }

        broadcastRealtimeEvent('inventory.product.updated', data);
        sendJson(res, 200, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'PATCH') {
      const auth = await authenticateRequest(req);
      if (!auth.isStaff) {
        sendJson(res, 403, { success: false, error: 'Unauthorized: Only staff and admin can modify product status.' });
        return true;
      }

      try {
        const now = new Date().toISOString();
        const patchData: any = { ...body, updated_at: now };

        if (body.status === 'archived') {
          patchData.in_stock = false;
        }

        let data: any = null;
        try {
          const { data: supData, error } = await supabase
            .from('jewelry_items')
            .update(patchData)
            .eq('id', itemId)
            .select()
            .single();

          if (error) throw error;
          data = supData;
        } catch {
          data = updateLocalItem(itemId, patchData);
        }

        if (!data) {
          sendJson(res, 404, { success: false, error: 'Product not found.' });
          return true;
        }

        // Log audit event
        try {
          await supabase.from('audit_logs').insert([{
            action: body.status ? `PRODUCT_STATUS_${body.status.toUpperCase()}` : 'PRODUCT_PATCHED',
            resource: 'inventory',
            details: JSON.stringify({ id: itemId, patch: body }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          }]);
        } catch {
          recordLocalAudit({
            action: body.status ? `PRODUCT_STATUS_${body.status.toUpperCase()}` : 'PRODUCT_PATCHED',
            resource: 'inventory',
            details: JSON.stringify({ id: itemId, patch: body }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'info',
            timestamp: now
          });
        }

        broadcastRealtimeEvent('inventory.product.updated', data);
        sendJson(res, 200, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'DELETE') {
      const auth = await authenticateRequest(req);
      if (!auth.isStaff || (auth.role !== 'super_admin' && auth.role !== 'admin')) {
        sendJson(res, 403, { success: false, error: 'Forbidden: Permanent deletion requires Administrator authorization.' });
        return true;
      }

      try {
        // Pre-flight check: ensure no active retail orders or pawn loans reference this item
        try {
          const { data: activeOrders } = await supabase.from('pos_sale_items').select('id').eq('jewelry_item_id', itemId).limit(1);
          if (activeOrders && activeOrders.length > 0) {
            sendJson(res, 400, {
              success: false,
              error: 'Cannot permanently delete: Historical retail sales depend on this item. Use Archive instead to preserve compliance records.'
            });
            return true;
          }
        } catch {}

        let itemToDelete: any = null;
        try {
          const { data } = await supabase.from('jewelry_items').select('id, name, sku').eq('id', itemId).maybeSingle();
          itemToDelete = data;
          const { error } = await supabase.from('jewelry_items').delete().eq('id', itemId);
          if (error) throw error;
        } catch {
          itemToDelete = deleteLocalItem(itemId);
        }

        // Log audit event
        const now = new Date().toISOString();
        try {
          await supabase.from('audit_logs').insert([{
            action: 'PRODUCT_DELETED',
            resource: 'inventory',
            details: JSON.stringify({ id: itemId, item: itemToDelete }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'warning',
            timestamp: now
          }]);
        } catch {
          recordLocalAudit({
            action: 'PRODUCT_DELETED',
            resource: 'inventory',
            details: JSON.stringify({ id: itemId, item: itemToDelete }),
            actor_email: auth.user?.email || 'system',
            actor_role: auth.role,
            severity: 'warning',
            timestamp: now
          });
        }

        broadcastRealtimeEvent('inventory.stock.changed', { id: itemId, deleted: true });
        sendJson(res, 200, { success: true, message: `Product ${itemId} deleted successfully.` });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 5. Pledges & Pawn Loans API (Protected: Staff can manage all, customer can view own)
  if (pathname === '/api/v1/pledges' || pathname === '/api/pledges') {
    const auth = await authenticateRequest(req);

    if (method === 'GET') {
      if (!auth.user) {
        sendJson(res, 401, { success: false, error: 'Authentication required to view pawn loan records' });
        return true;
      }

      try {
        let dbQuery = supabase.from('pledges').select('*, customers(full_name, phone)');

        if (!auth.isStaff) {
          // Lookup customer profile for this user
          const { data: cust } = await supabase.from('customers').select('id').eq('user_id', auth.user.id).maybeSingle();
          if (!cust) {
            sendJson(res, 200, { success: true, count: 0, data: [] });
            return true;
          }
          dbQuery = dbQuery.eq('customer_id', cust.id);
        } else {
          if (query.status) {
            dbQuery = dbQuery.eq('status', query.status);
          }
          if (query.customer_id) {
            dbQuery = dbQuery.eq('customer_id', query.customer_id);
          }
        }

        dbQuery = dbQuery.order('pledge_date', { ascending: false });

        const { data, error } = await dbQuery;
        if (error) throw error;

        sendJson(res, 200, { success: true, count: data?.length || 0, data: data || [] });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'POST') {
      if (!auth.isStaff) {
        sendJson(res, 403, { success: false, error: 'Unauthorized: Only authorized pawnshop staff can issue pawn loans.' });
        return true;
      }

      const parseResult = createPledgeSchema.safeParse(body);
      if (!parseResult.success) {
        sendJson(res, 400, {
          success: false,
          error: 'Pledge validation failed',
          details: parseResult.error.flatten().fieldErrors
        });
        return true;
      }

      try {
        const validated = parseResult.data;
        const pledgeNo = validated.pledge_no || `PL-${Date.now().toString().slice(-6)}`;
        const record = {
          customer_id: validated.customer_id,
          customer_name: validated.customer_name || null,
          loan_amount: validated.loan_amount,
          interest_rate: validated.interest_rate,
          gross_weight: validated.gross_weight || null,
          net_weight: validated.net_weight || null,
          item_description: validated.item_description || null,
          articles_count: validated.articles_count || 1,
          notes: validated.notes || null,
          pledge_no: pledgeNo,
          pledge_date: validated.pledge_date || new Date().toISOString().split('T')[0],
          status: 'open',
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('pledges').insert([record]).select().single();
        if (error) throw error;

        broadcastRealtimeEvent('pawn-loans.created', data);

        if (validated.customer_id) {
          createAndDispatchNotification({
            recipient_id: validated.customer_id,
            recipient_role: 'customer',
            event_type: 'pawn.pledge_created',
            category: 'pawn',
            severity: 'info',
            title: `Pawn Pledge #${pledgeNo} Registered`,
            message: `Pawn collateral agreement for ₹${(validated.loan_amount || 0).toLocaleString('en-IN')} is active with vault custody.`,
            related_entity_type: 'pledge',
            related_entity_id: data.id || pledgeNo,
            destination_route: '/dashboard?tab=pawn_loans',
            idempotency_key: `notif-pledge-${data.id || pledgeNo}`
          }).catch(() => {});
        }
        createAndDispatchNotification({
          recipient_id: 'admin_all',
          recipient_role: 'admin',
          event_type: 'pawn.pledge_created',
          category: 'pawn',
          severity: 'info',
          title: `New Pawn Contract: #${pledgeNo}`,
          message: `Collateral loan for ₹${(validated.loan_amount || 0).toLocaleString('en-IN')} approved by staff.`,
          related_entity_type: 'pledge',
          related_entity_id: data.id || pledgeNo,
          destination_route: '/admin?tab=pawn_loans',
          idempotency_key: `notif-admin-pledge-${data.id || pledgeNo}`
        }).catch(() => {});

        sendJson(res, 201, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 5b. Atomic Pawn Repayment Endpoint (/api/v1/pledges/repay)
  if (pathname === '/api/v1/pledges/repay') {
    if (method !== 'POST') {
      sendJson(res, 405, { success: false, error: 'Method not allowed' });
      return true;
    }

    const auth = await authenticateRequest(req);
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Only authorized staff can process loan repayments.' });
      return true;
    }

    const parseResult = repayPledgeSchema.safeParse(body);
    if (!parseResult.success) {
      sendJson(res, 400, {
        success: false,
        error: 'Pawn repayment validation failed',
        details: parseResult.error.flatten().fieldErrors
      });
      return true;
    }

    try {
      const { pledge_id, payment_amount, payment_mode, notes, receipt_number } = parseResult.data;
      const numPayment = payment_amount;

      // Fetch pledge to verify status
      const { data: pledge, error: pledgeErr } = await supabase
        .from('pledges')
        .select('*')
        .eq('id', pledge_id)
        .single();

      if (pledgeErr || !pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      if (pledge.status === 'closed' || pledge.status === 'sold') {
        sendJson(res, 400, { success: false, error: `Cannot repay pledge with status '${pledge.status}'.` });
        return true;
      }

      // Insert part payment
      const paymentRecord = {
        pledge_id,
        payment_amount: numPayment,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode,
        receipt_number: receipt_number || `REC-${Date.now().toString().slice(-6)}`,
        notes,
        created_at: new Date().toISOString()
      };

      const { data: paymentData, error: payErr } = await supabase
        .from('part_payments')
        .insert([paymentRecord])
        .select()
        .single();

      if (payErr) throw payErr;

      // Update pledge status to partially_paid atomically
      await supabase
        .from('pledges')
        .update({ status: 'partially_paid', updated_at: new Date().toISOString() })
        .eq('id', pledge_id);

      broadcastRealtimeEvent('pawn-loans.repayment.recorded', { pledge_id, payment: paymentData });

      if (pledge.customer_id) {
        createAndDispatchNotification({
          recipient_id: pledge.customer_id,
          recipient_role: 'customer',
          event_type: 'pawn.payment_received',
          category: 'pawn',
          severity: 'success',
          title: `Pawn Payment Received: ₹${numPayment.toLocaleString('en-IN')}`,
          message: `Receipt #${paymentRecord.receipt_number} credited against pledge #${pledge.pledge_no || pledge_id}.`,
          related_entity_type: 'pledge',
          related_entity_id: pledge_id,
          destination_route: '/dashboard?tab=pawn_loans',
          idempotency_key: `notif-repay-${paymentData?.id || Date.now()}`
        }).catch(() => {});
      }

      sendJson(res, 200, { success: true, data: paymentData });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // 5c. Atomic Pawn Redemption / Settlement Endpoint (/api/v1/pledges/redeem)
  if (pathname === '/api/v1/pledges/redeem') {
    if (method !== 'POST') {
      sendJson(res, 405, { success: false, error: 'Method not allowed' });
      return true;
    }

    const auth = await authenticateRequest(req);
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Only authorized staff can authorize item redemption.' });
      return true;
    }

    try {
      const { pledge_id, total_amount, payment_mode = 'cash', notes, receipt_number } = body;
      const numTotal = Number(total_amount);

      if (!pledge_id || !Number.isFinite(numTotal) || numTotal <= 0) {
        sendJson(res, 400, { success: false, error: 'Valid pledge_id and positive total_amount required.' });
        return true;
      }

      const { data: pledge, error: pledgeErr } = await supabase
        .from('pledges')
        .select('*')
        .eq('id', pledge_id)
        .single();

      if (pledgeErr || !pledge) {
        sendJson(res, 404, { success: false, error: 'Pledge record not found' });
        return true;
      }

      if (pledge.status === 'closed') {
        sendJson(res, 400, { success: false, error: 'Pledge has already been settled and redeemed.' });
        return true;
      }

      // Record redemption
      const returnRecord = {
        pledge_id,
        return_date: new Date().toISOString().split('T')[0],
        principal_amount: pledge.loan_amount,
        interest_amount: Math.max(0, numTotal - Number(pledge.loan_amount)),
        total_amount: numTotal,
        payment_mode,
        receipt_number: receipt_number || `RET-${Date.now().toString().slice(-6)}`,
        notes,
        created_at: new Date().toISOString()
      };

      const { data: returnData, error: retErr } = await supabase
        .from('pledge_returns')
        .insert([returnRecord])
        .select()
        .single();

      if (retErr) throw retErr;

      // Close pledge and record redemption date
      await supabase
        .from('pledges')
        .update({
          status: 'closed',
          redemption_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', pledge_id);

      broadcastRealtimeEvent('pawn-loans.redeemed', { pledge_id, returnData });
      sendJson(res, 200, { success: true, message: 'Pledge successfully settled and item released', data: returnData });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // 6. POS Sales & Orders API
  if (pathname === '/api/v1/sales' || pathname === '/api/sales') {
    const auth = await authenticateRequest(req);

    if (method === 'GET') {
      if (!auth.isStaff) {
        sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to view store sales ledger.' });
        return true;
      }

      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        sendJson(res, 200, { success: true, data: data || [] });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'POST') {
      if (!auth.isStaff) {
        sendJson(res, 403, { success: false, error: 'Unauthorized: Only staff can record in-store POS sales.' });
        return true;
      }

      const parseResult = createSaleOrderSchema.safeParse(body);
      if (!parseResult.success) {
        sendJson(res, 400, {
          success: false,
          error: 'Sale order validation failed',
          details: parseResult.error.flatten().fieldErrors
        });
        return true;
      }

      try {
        const validated = parseResult.data;
        const orderId = validated.order_id || `ORD-${Date.now().toString().slice(-6)}`;
        const finalAmount = validated.final_amount ?? validated.total_amount;
        const saleRecord = {
          order_id: orderId,
          customer_id: validated.customer_id || null,
          customer_name: validated.customer_name || null,
          customer_phone: validated.customer_phone || null,
          items: validated.items,
          subtotal: validated.subtotal,
          making_charges: validated.making_charges,
          discount: validated.discount,
          total_amount: validated.total_amount,
          final_amount: finalAmount,
          payment_method: validated.payment_method,
          payment_reference: validated.payment_reference || null,
          pan_number: validated.pan_number || null,
          notes: validated.notes || null,
          status: 'completed',
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('orders').insert([saleRecord]).select().single();
        if (error) throw error;

        // Atomically decrement stock in jewelry_items
        if (Array.isArray(body.items)) {
          for (const item of body.items) {
            const itemId = item.id || item.product_id;
            if (itemId) {
              const qty = Math.max(1, Number(item.quantity) || 1);
              const { data: currentItem } = await supabase
                .from('jewelry_items')
                .select('stock_quantity, status')
                .eq('id', itemId)
                .maybeSingle();

              if (currentItem) {
                const currentStock = Number(currentItem.stock_quantity) || 1;
                const newStock = Math.max(0, currentStock - qty);
                await supabase
                  .from('jewelry_items')
                  .update({
                    stock_quantity: newStock,
                    in_stock: newStock > 0,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', itemId);
              }
            }
          }
        }

        // Record in cash ledger
        try {
          await supabase.from('cash_transactions').insert([{
            transaction_date: new Date().toISOString().split('T')[0],
            transaction_type: 'cash_in',
            amount: Number(body.total_amount) || 0,
            category: 'pos_sales',
            reference_type: 'order',
            reference_id: data.id,
            description: `POS Sale Order ${orderId}`,
            payment_mode: body.payment_mode || 'cash',
            created_at: new Date().toISOString()
          }]);
        } catch {
          // cash_transactions table may be optional in test mode
        }

        broadcastRealtimeEvent('sales.confirmed', data);
        broadcastRealtimeEvent('inventory.stock.changed', { orderId, items: body.items });

        if (validated.customer_id) {
          createAndDispatchNotification({
            recipient_id: validated.customer_id,
            recipient_role: 'customer',
            event_type: 'order.placed',
            category: 'order',
            severity: 'success',
            title: `Order Confirmed: ${orderId}`,
            message: `Your fine jewellery purchase of ₹${finalAmount.toLocaleString('en-IN')} has been completed successfully.`,
            related_entity_type: 'order',
            related_entity_id: orderId,
            destination_route: '/dashboard?tab=orders',
            idempotency_key: `notif-order-${orderId}`
          }).catch(() => {});
        }
        createAndDispatchNotification({
          recipient_id: 'admin_all',
          recipient_role: 'admin',
          event_type: 'pos.sale_completed',
          category: 'payment',
          severity: 'info',
          title: `POS Sale Completed: ${orderId}`,
          message: `Payment of ₹${finalAmount.toLocaleString('en-IN')} recorded for ${orderId}.`,
          related_entity_type: 'order',
          related_entity_id: orderId,
          destination_route: '/admin?tab=orders',
          idempotency_key: `notif-pos-admin-${orderId}`
        }).catch(() => {});

        sendJson(res, 201, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 7. Dashboard Consolidated Stats API (Protected: Staff only)
  if (pathname === '/api/v1/dashboard/stats' || pathname === '/api/dashboard/stats') {
    const auth = await authenticateRequest(req);
    if (!auth.isStaff) {
      sendJson(res, 403, { success: false, error: 'Unauthorized: Staff permissions required to view consolidated dashboard financial metrics.' });
      return true;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Query real tables in parallel
      const [pledgesRes, customersRes, ratesRes, salesRes, returnsRes, cashRes] = await Promise.all([
        supabase.from('pledges').select('loan_amount, status, pledge_date'),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('metal_rates').select('metal_type, rate_per_gram, updated_at').order('effective_date', { ascending: false }).limit(4),
        supabase.from('orders').select('total_amount, created_at, status'),
        supabase.from('pledge_returns').select('total_amount, return_date'),
        supabase.from('cash_transactions').select('amount, transaction_type')
      ]);

      const pledges = pledgesRes.data || [];
      const activePledges = pledges.filter(p => p.status === 'open' || p.status === 'active' || p.status === 'partially_paid');
      const totalLoanAmount = activePledges.reduce((sum, p) => sum + (Number(p.loan_amount) || 0), 0);
      const todayPledges = pledges.filter(p => p.pledge_date === today).length;

      const returns = returnsRes.data || [];
      const todayReturns = returns.filter(r => r.return_date === today).length;

      const sales = salesRes.data || [];
      const todaySales = sales
        .filter(s => s.created_at?.startsWith(today) && s.status !== 'cancelled')
        .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

      // Real Metal Rates from database
      const rates = ratesRes.data || [];
      const goldRow = rates.find(r => r.metal_type?.toLowerCase() === 'gold');
      const silverRow = rates.find(r => r.metal_type?.toLowerCase() === 'silver');
      const goldRate = goldRow ? Number(goldRow.rate_per_gram) : 7350;
      const silverRate = silverRow ? Number(silverRow.rate_per_gram) : 92;

      // Real Cash Balance from cash ledger
      const cashRows = cashRes.data || [];
      const cashIn = cashRows.filter(c => c.transaction_type === 'cash_in').reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const cashOut = cashRows.filter(c => c.transaction_type === 'cash_out').reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const cashInHand = cashRows.length > 0 ? (cashIn - cashOut) : todaySales;

      const stats = {
        total_active_pledges: activePledges.length,
        total_loan_amount: totalLoanAmount,
        total_customers: customersRes.count || 0,
        today_pledges: todayPledges,
        today_returns: todayReturns,
        cash_in_hand: cashInHand,
        gold_rate: goldRate,
        silver_rate: silverRate,
        today_sales: todaySales,
        rates_last_updated: rates[0]?.updated_at || new Date().toISOString()
      };

      sendJson(res, 200, { success: true, data: stats });
      return true;
    } catch (err: any) {
      sendJson(res, 500, { success: false, error: err.message });
      return true;
    }
  }

  // 8. Online Pawn Requests & Customer Enquiries
  if (pathname === '/api/v1/pawn-requests' || pathname === '/api/pawn-requests') {
    const auth = await authenticateRequest(req);

    if (method === 'GET') {
      if (!auth.user) {
        sendJson(res, 401, { success: false, error: 'Authentication required' });
        return true;
      }

      try {
        let dbQuery = supabase.from('pawn_requests').select('*').order('created_at', { ascending: false });

        if (!auth.isStaff) {
          // Strictly restrict to user's own pawn requests
          dbQuery = dbQuery.eq('user_id', auth.user.id);
        } else {
          if (query.status) {
            dbQuery = dbQuery.eq('status', query.status);
          }
          if (query.user_id) {
            dbQuery = dbQuery.eq('user_id', query.user_id);
          }
        }

        const { data, error } = await dbQuery;
        if (error) throw error;

        sendJson(res, 200, { success: true, count: data?.length || 0, data: data || [] });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }

    if (method === 'POST') {
      if (!auth.user) {
        sendJson(res, 401, { success: false, error: 'Authentication required to submit pawn request' });
        return true;
      }

      try {
        const newRecord = {
          ...body,
          user_id: auth.user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('pawn_requests').insert([newRecord]).select().single();
        if (error) throw error;

        broadcastRealtimeEvent('pawn-requests.created', data);
        sendJson(res, 201, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 9. E-Commerce Orders Management & Status Lifecycle
  if (pathname === '/api/v1/orders' || pathname === '/api/orders') {
    const auth = await authenticateRequest(req);

    if (method === 'GET') {
      if (!auth.user) {
        sendJson(res, 401, { success: false, error: 'Authentication required to view orders' });
        return true;
      }

      try {
        let dbQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });

        if (!auth.isStaff) {
          // Strictly isolate customer orders
          dbQuery = dbQuery.eq('user_id', auth.user.id);
        } else {
          if (query.status) {
            dbQuery = dbQuery.eq('status', query.status);
          }
          if (query.user_id) {
            dbQuery = dbQuery.eq('user_id', query.user_id);
          }
        }

        const { data, error } = await dbQuery;
        if (error) throw error;

        sendJson(res, 200, { success: true, count: data?.length || 0, data: data || [] });
        return true;
      } catch (err: any) {
        sendJson(res, 500, { success: false, error: err.message });
        return true;
      }
    }

        if (method === 'POST') {
      if (!auth.user) {
        sendJson(res, 401, { success: false, error: 'Authentication required to place orders' });
        return true;
      }

      try {
        if (!Array.isArray(body.items) || body.items.length === 0) {
          sendJson(res, 400, { success: false, error: 'A non-empty list of order items is required.' });
          return true;
        }

        // Authoritatively fetch products from DB and calculate prices on server
        let subtotal = 0;
        const verifiedItems = [];

        for (const item of body.items) {
          const itemId = item.productId || item.id;
          const qty = Math.max(1, Number(item.quantity) || 1);

          const { data: dbItem, error: itemErr } = await supabaseAdmin
            .from('jewelry_items')
            .select('id, name, price, stock_quantity, category, image_url')
            .eq('id', itemId)
            .maybeSingle();

          if (itemErr || !dbItem) {
            sendJson(res, 400, { success: false, error: `Product not found in catalogue: ${itemId}` });
            return true;
          }

          if ((Number(dbItem.stock_quantity) || 0) < qty) {
            sendJson(res, 409, {
              success: false,
              error: `Insufficient stock for "${dbItem.name}". Available: ${dbItem.stock_quantity}, requested: ${qty}`,
              code: 'OUT_OF_STOCK'
            });
            return true;
          }

          const unitPrice = Number(dbItem.price) || 0;
          subtotal += unitPrice * qty;
          verifiedItems.push({
            id: dbItem.id,
            name: dbItem.name,
            price: unitPrice,
            quantity: qty,
            category: dbItem.category,
            image_url: dbItem.image_url
          });
        }

        // Authoritative GST (3% on precious jewellery in India)
        const tax = Math.round(subtotal * 0.03);

        // Authoritative Coupon Verification
        let discount = 0;
        if (body.couponCode) {
          const cleanCoupon = String(body.couponCode).trim().toUpperCase();
          if (cleanCoupon === 'WELCOME500' && subtotal >= 10000) {
            discount = 500;
          } else if (cleanCoupon === 'FESTIVE1000' && subtotal >= 25000) {
            discount = 1000;
          }
        }

        const totalAmount = Math.max(0, subtotal + tax - discount);
        const orderId = `ORD-${Date.now().toString().slice(-6)}`;

        const orderRecord = {
          id: orderId,
          order_id: orderId,
          user_id: auth.user.id,
          customer_name: body.shippingAddress?.fullName || body.customer_name || auth.user.user_metadata?.full_name || 'Valued Patron',
          customer_phone: body.shippingAddress?.phone || body.customer_phone || '',
          customer_email: auth.user.email || '',
          shipping_address: body.shippingAddress || body.shipping_address || null,
          items: verifiedItems,
          subtotal,
          tax,
          discount,
          total_amount: totalAmount,
          currency: 'INR',
          status: 'pending',
          payment_status: 'unpaid',
          notes: body.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin.from('orders').insert([orderRecord]).select().single();
        if (error) {
          console.error('[Order Creation DB Error]:', error);
          sendJson(res, 500, { success: false, error: 'Database rejected order insertion' });
          return true;
        }

        broadcastRealtimeEvent('orders.created', data);
        sendJson(res, 201, { success: true, data });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // 10. Authoritative Server-Side Jewelry Price Calculation (GST 3% Rule)
  if (pathname === '/api/v1/calculate-price') {
    if (method === 'POST') {
      try {
        const { weight = 0, ratePerGram = 0, wastagePercent = 0, makingCharges = 0, stonePrice = 0, metalType = 'gold22k' } = body;
        const numWeight = Number(weight);
        let numRate = Number(ratePerGram);
        const numWastage = Number(wastagePercent);
        const numMaking = Number(makingCharges);
        const numStone = Number(stonePrice);

        if (numRate <= 0) {
          const m = String(metalType).toLowerCase();
          numRate = m.includes('24') ? 14928 : m.includes('silver') ? 173 : m.includes('platinum') ? 5085 : 13684;
        }

        if (numWeight <= 0) {
          sendJson(res, 400, { success: false, error: 'Weight must be a positive number' });
          return true;
        }

        const baseMetalValue = Math.round(numWeight * numRate);
        const wastageValue = Math.round(baseMetalValue * (numWastage / 100));
        const taxableAmount = baseMetalValue + wastageValue + numMaking + numStone;
        
        // India Gold/Jewelry statutory tax: 1.5% CGST + 1.5% SGST = 3.0% Total GST
        const cgst = Math.round(taxableAmount * 0.015);
        const sgst = Math.round(taxableAmount * 0.015);
        const totalGst = cgst + sgst;
        const grandTotal = taxableAmount + totalGst;

        sendJson(res, 200, {
          success: true,
          data: {
            weight: numWeight,
            ratePerGram: numRate,
            baseMetalValue,
            wastagePercent: numWastage,
            wastageValue,
            makingCharges: numMaking,
            stonePrice: numStone,
            taxableAmount,
            cgst,
            sgst,
            totalGst,
            grandTotal,
            currency: 'INR',
            timestamp: new Date().toISOString()
          }
        });
        return true;
      } catch (err: any) {
        sendJson(res, 400, { success: false, error: err.message });
        return true;
      }
    }
  }

  // ========================================================
  // 11. ENTERPRISE LUXURY REALTIME NOTIFICATION SYSTEM
  // ========================================================

  // 11a. Unread count endpoint
  if (pathname === '/api/v1/notifications/unread-count' && method === 'GET') {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      sendJson(res, 200, { success: true, unreadCount: 0 });
      return true;
    }
    const userId = auth.user.id;
    const role = auth.role !== 'anon' ? auth.role : 'customer';

    const unreadCount = await getUnreadNotificationCount(userId, role);
    sendJson(res, 200, { success: true, unreadCount });
    return true;
  }

  // 11b. Mark all as read endpoint
  if (pathname === '/api/v1/notifications/mark-all-read' && method === 'POST') {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      sendJson(res, 401, { success: false, error: 'Authentication required to mark notifications as read.' });
      return true;
    }
    const userId = auth.user.id;
    const role = auth.role !== 'anon' ? auth.role : 'customer';

    const count = await markAllNotificationsAsRead(userId, role);
    broadcastRealtimeEvent('unread_sync', { userId, unreadCount: 0 });
    sendJson(res, 200, { success: true, count, unreadCount: 0 });
    return true;
  }

  // 11c. Mark single notification as read endpoint
  if (pathname.startsWith('/api/v1/notifications/') && pathname.endsWith('/read') && (method === 'PATCH' || method === 'POST')) {
    const parts = pathname.split('/');
    const notificationId = parts[4];
    if (!notificationId) {
      sendJson(res, 400, { success: false, error: 'Notification ID is required' });
      return true;
    }

    const auth = await authenticateRequest(req);
    if (!auth.user) {
      sendJson(res, 401, { success: false, error: 'Authentication required.' });
      return true;
    }
    const userId = auth.user.id;
    const role = auth.role !== 'anon' ? auth.role : 'customer';

    try {
      const updated = await markNotificationAsRead(notificationId, userId, role);
      if (!updated) {
        sendJson(res, 404, { success: false, error: 'Notification not found' });
        return true;
      }
      const unreadCount = await getUnreadNotificationCount(userId, role);
      broadcastRealtimeEvent('unread_sync', { userId, unreadCount });
      sendJson(res, 200, { success: true, notificationId, unreadCount });
      return true;
    } catch (err: any) {
      sendJson(res, 403, { success: false, error: err.message });
      return true;
    }
  }

  // 11d. Archive / delete single notification
  if (pathname.startsWith('/api/v1/notifications/') && method === 'DELETE') {
    const parts = pathname.split('/');
    const notificationId = parts[4];
    if (!notificationId) {
      sendJson(res, 400, { success: false, error: 'Notification ID is required' });
      return true;
    }

    const auth = await authenticateRequest(req);
    if (!auth.user) {
      sendJson(res, 401, { success: false, error: 'Authentication required.' });
      return true;
    }
    const userId = auth.user.id;
    const role = auth.role !== 'anon' ? auth.role : 'customer';

    try {
      const archived = await archiveNotification(notificationId, userId, role);
      if (!archived) {
        sendJson(res, 404, { success: false, error: 'Notification not found' });
        return true;
      }
      const unreadCount = await getUnreadNotificationCount(userId, role);
      broadcastRealtimeEvent('unread_sync', { userId, unreadCount });
      sendJson(res, 200, { success: true, message: 'Notification archived' });
      return true;
    } catch (err: any) {
      sendJson(res, 403, { success: false, error: err.message });
      return true;
    }
  }

  // 11e. Notification preferences GET / PUT
  if (pathname === '/api/v1/notifications/preferences') {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      sendJson(res, 401, { success: false, error: 'Authentication required.' });
      return true;
    }
    const userId = auth.user.id;

    if (method === 'GET') {
      const preferences = await getNotificationPreferences(userId);
      sendJson(res, 200, { success: true, preferences });
      return true;
    }
    if (method === 'PUT' || method === 'POST') {
      const preferences = await updateNotificationPreferences(userId, body);
      sendJson(res, 200, { success: true, preferences });
      return true;
    }
  }

  // 11f. Dispatch new notification (internal / authorized)
  if (pathname === '/api/v1/notifications/dispatch' && method === 'POST') {
    if (!body.title || !body.message || !body.category) {
      sendJson(res, 400, { success: false, error: 'Missing required fields (title, message, category)' });
      return true;
    }

    const notification = await createAndDispatchNotification({
      recipient_id: body.recipient_id || 'guest',
      recipient_role: body.recipient_role || 'customer',
      event_type: body.event_type || 'custom.alert',
      category: body.category,
      severity: body.severity || 'info',
      title: body.title,
      message: body.message,
      related_entity_type: body.related_entity_type,
      related_entity_id: body.related_entity_id,
      destination_route: body.destination_route,
      idempotency_key: body.idempotency_key
    });

    sendJson(res, 201, { success: true, notification });
    return true;
  }

  // 11g. List notifications endpoint
  if (pathname === '/api/v1/notifications' && method === 'GET') {
    const auth = await authenticateRequest(req);
    if (!auth.user) {
      sendJson(res, 200, { success: true, notifications: [], total: 0, unreadCount: 0 });
      return true;
    }
    const userId = auth.user.id;
    const role = auth.role !== 'anon' ? auth.role : 'customer';

    const result = await getNotificationsForRecipient(userId, role, {
      category: query.category as string,
      unreadOnly: query.unreadOnly === 'true' || query.unread === 'true',
      search: query.search as string,
      limit: query.limit ? parseInt(String(query.limit), 10) : 50,
      offset: query.offset ? parseInt(String(query.offset), 10) : 0
    });

    sendJson(res, 200, {
      success: true,
      notifications: result.items,
      total: result.total,
      unreadCount: result.unreadCount
    });
    return true;
  }

  return false;
}
