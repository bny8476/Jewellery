/**
 * Role-Based Access Control (RBAC) & Security Audit Engine
 * RCB JEWELRY'S & PAWN SHOP
 */

export type AdminRole = 
  | 'super_admin' 
  | 'admin' 
  | 'manager' 
  | 'sales_staff' 
  | 'inventory_staff' 
  | 'pawn_officer' 
  | 'accountant' 
  | 'auditor';

export type AdminResource = 
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'inventory'
  | 'purchases'
  | 'pawn_loans'
  | 'online_requests'
  | 'customers'
  | 'diamonds'
  | 'rates'
  | 'bank'
  | 'accounts'
  | 'reports'
  | 'master'
  | 'users'
  | 'settings'
  | 'audit_logs';

export type AdminAction = 'read' | 'create' | 'update' | 'delete' | 'export' | 'approve';

export interface RoleDefinition {
  id: AdminRole;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
  allowedTabs: string[];
  permissions: Partial<Record<AdminResource, AdminAction[]>>;
}

export const ROLE_DEFINITIONS: Record<AdminRole, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Full unconstrained system authority, audit control & administrative configuration',
    color: '#D4AF37', // Gold
    badgeBg: 'rgba(212, 175, 55, 0.15)',
    allowedTabs: [
      'dashboard', 'pos', 'orders', 'online_requests', 'rates', 
      'inventory', 'purchases', 'diamonds', 'transaction', 'customer', 
      'bank', 'accounts', 'reports', 'master', 'users', 'settings'
    ],
    permissions: {
      dashboard: ['read', 'export'],
      pos: ['read', 'create', 'update', 'export'],
      orders: ['read', 'create', 'update', 'delete', 'export'],
      inventory: ['read', 'create', 'update', 'delete', 'export'],
      purchases: ['read', 'create', 'update', 'delete', 'export'],
      pawn_loans: ['read', 'create', 'update', 'delete', 'approve', 'export'],
      online_requests: ['read', 'update', 'approve'],
      customers: ['read', 'create', 'update', 'delete', 'export'],
      diamonds: ['read', 'create', 'update', 'delete', 'export'],
      rates: ['read', 'update', 'export'],
      bank: ['read', 'create', 'update', 'delete', 'export'],
      accounts: ['read', 'create', 'update', 'export'],
      reports: ['read', 'export'],
      users: ['read', 'create', 'update', 'delete'],
      settings: ['read', 'update'],
      audit_logs: ['read', 'export']
    }
  },
  admin: {
    id: 'admin',
    label: 'Administrator',
    description: 'Executive management authority across inventory, bullion, loans, and ledgers',
    color: '#C9A46A',
    badgeBg: 'rgba(201, 164, 106, 0.15)',
    allowedTabs: [
      'dashboard', 'pos', 'orders', 'online_requests', 'rates', 
      'inventory', 'purchases', 'diamonds', 'transaction', 'customer', 
      'bank', 'accounts', 'reports', 'master', 'users', 'settings'
    ],
    permissions: {
      dashboard: ['read', 'export'],
      pos: ['read', 'create', 'update', 'export'],
      orders: ['read', 'create', 'update', 'delete', 'export'],
      inventory: ['read', 'create', 'update', 'delete', 'export'],
      purchases: ['read', 'create', 'update', 'delete', 'export'],
      pawn_loans: ['read', 'create', 'update', 'approve', 'export'],
      online_requests: ['read', 'update', 'approve'],
      customers: ['read', 'create', 'update', 'export'],
      diamonds: ['read', 'create', 'update', 'export'],
      rates: ['read', 'update', 'export'],
      bank: ['read', 'create', 'update', 'export'],
      accounts: ['read', 'create', 'update', 'export'],
      reports: ['read', 'export'],
      users: ['read', 'create', 'update'],
      settings: ['read', 'update'],
      audit_logs: ['read', 'export']
    }
  },
  manager: {
    id: 'manager',
    label: 'Store Manager',
    description: 'Daily operational management, loan approvals, purchases and retail billing',
    color: '#38BDF8', // Sky
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    allowedTabs: [
      'dashboard', 'pos', 'orders', 'online_requests', 'rates', 
      'inventory', 'purchases', 'diamonds', 'transaction', 'customer', 
      'bank', 'accounts', 'reports', 'master'
    ],
    permissions: {
      dashboard: ['read', 'export'],
      pos: ['read', 'create', 'update', 'export'],
      orders: ['read', 'update', 'export'],
      inventory: ['read', 'create', 'update', 'export'],
      purchases: ['read', 'create', 'update', 'export'],
      pawn_loans: ['read', 'create', 'update', 'approve', 'export'],
      online_requests: ['read', 'update', 'approve'],
      customers: ['read', 'create', 'update', 'export'],
      diamonds: ['read', 'create', 'update', 'export'],
      rates: ['read', 'update'],
      bank: ['read', 'create', 'update'],
      accounts: ['read', 'create', 'export'],
      reports: ['read', 'export'],
      master: ['read', 'update']
    }
  },
  sales_staff: {
    id: 'sales_staff',
    label: 'Sales Executive',
    description: 'Point of sale billing, retail customer care and order dispatch',
    color: '#34D399', // Emerald
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    allowedTabs: ['dashboard', 'pos', 'orders', 'inventory', 'customer', 'rates'],
    permissions: {
      dashboard: ['read'],
      pos: ['read', 'create', 'update'],
      orders: ['read', 'update'],
      inventory: ['read'],
      customers: ['read', 'create', 'update'],
      rates: ['read']
    }
  },
  inventory_staff: {
    id: 'inventory_staff',
    label: 'Inventory Custodian',
    description: 'Stock inward, tagging, weighing, diamond specs and vault custody',
    color: '#A78BFA', // Purple
    badgeBg: 'rgba(167, 139, 250, 0.15)',
    allowedTabs: ['dashboard', 'inventory', 'purchases', 'diamonds', 'rates', 'master'],
    permissions: {
      dashboard: ['read'],
      inventory: ['read', 'create', 'update', 'export'],
      purchases: ['read', 'create', 'update'],
      diamonds: ['read', 'create', 'update'],
      rates: ['read'],
      master: ['read']
    }
  },
  pawn_officer: {
    id: 'pawn_officer',
    label: 'Pawn Loan Officer',
    description: 'Collateral evaluation, pledge contract issuance, repayments and releases',
    color: '#F59E0B', // Amber
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    allowedTabs: ['dashboard', 'transaction', 'customer', 'online_requests', 'rates', 'reports'],
    permissions: {
      dashboard: ['read'],
      pawn_loans: ['read', 'create', 'update', 'export'],
      online_requests: ['read', 'update', 'approve'],
      customers: ['read', 'create', 'update'],
      rates: ['read'],
      reports: ['read']
    }
  },
  accountant: {
    id: 'accountant',
    label: 'Chief Accountant',
    description: 'Day book, financial ledgers, cash flows, supplier payables and tax audit',
    color: '#2DD4BF', // Teal
    badgeBg: 'rgba(45, 212, 191, 0.15)',
    allowedTabs: ['dashboard', 'accounts', 'bank', 'purchases', 'orders', 'reports'],
    permissions: {
      dashboard: ['read', 'export'],
      accounts: ['read', 'create', 'update', 'export'],
      bank: ['read', 'create', 'update', 'export'],
      purchases: ['read', 'export'],
      orders: ['read', 'export'],
      reports: ['read', 'export']
    }
  },
  auditor: {
    id: 'auditor',
    label: 'Compliance Auditor',
    description: 'Read-only inspection across all financial ledgers, stock counts and logs',
    color: '#94A3B8', // Slate
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    allowedTabs: ['dashboard', 'reports', 'accounts', 'inventory', 'rates', 'settings'],
    permissions: {
      dashboard: ['read', 'export'],
      reports: ['read', 'export'],
      accounts: ['read', 'export'],
      inventory: ['read', 'export'],
      rates: ['read'],
      audit_logs: ['read', 'export']
    }
  }
};

/**
 * Normalizes user role from metadata or profile
 */
export function normalizeAdminRole(rawRole?: string): AdminRole {
  if (!rawRole) return 'admin';
  const clean = rawRole.toLowerCase().trim();
  if (clean === 'super_admin' || clean === 'superadmin' || clean === 'owner') return 'super_admin';
  if (clean === 'admin' || clean === 'administrator') return 'admin';
  if (clean === 'manager') return 'manager';
  if (clean === 'sales' || clean === 'sales_staff' || clean === 'salesperson' || clean === 'cashier' || clean === 'billing') return 'sales_staff';
  if (clean === 'inventory' || clean === 'inventory_staff' || clean === 'stock') return 'inventory_staff';
  if (clean === 'pawn' || clean === 'pawn_officer' || clean === 'loan_officer') return 'pawn_officer';
  if (clean === 'accountant' || clean === 'accounts' || clean === 'finance') return 'accountant';
  if (clean === 'auditor' || clean === 'read_only' || clean === 'inspector') return 'auditor';
  return 'admin';
}

/**
 * Check if a role can access a specific tab
 */
export function canAccessTab(role: AdminRole, tabId: string): boolean {
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  return def.allowedTabs.includes(tabId);
}

/**
 * Check specific CRUD permission
 */
export function hasPermission(role: AdminRole, resource: AdminResource, action: AdminAction): boolean {
  const def = ROLE_DEFINITIONS[role];
  if (!def) return false;
  const actions = def.permissions[resource];
  if (!actions) return false;
  return actions.includes(action);
}

/**
 * Get current active role from session or default
 */
export function getCurrentRole(): AdminRole {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('rcb_active_admin_role') : null;
    return normalizeAdminRole(raw || 'admin');
  } catch {
    return 'admin';
  }
}

/**
 * High-level action capability checker
 */
export function canPerformAction(role: AdminRole, actionKey: string): boolean {
  if (role === 'super_admin' || role === 'admin' || role === 'manager') return true;
  if (role === 'auditor') return actionKey === 'view' || actionKey === 'export';
  if (role === 'sales_staff') return actionKey !== 'archive_customer' && actionKey !== 'delete';
  return true;
}


// ============================================================================
// AUDIT LOG MANAGEMENT
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  details: string;
  ip_address?: string;
  severity: 'info' | 'warning' | 'security' | 'critical';
}

const AUDIT_STORAGE_KEY = 'rcb_audit_logs';

const memoryAuditStorage = new Map<string, string>();

function safeAuditGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(key);
    }
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      return localStorage.getItem(key);
    }
    return memoryAuditStorage.get(key) ?? null;
  } catch {
    return memoryAuditStorage.get(key) ?? null;
  }
}

function safeAuditSet(key: string, value: string): void {
  try {
    memoryAuditStorage.set(key, value);
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(key, value);
    } else if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore in non-browser env
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = safeAuditGet(AUDIT_STORAGE_KEY);
    if (!raw) {
      const initialLogs: AuditLogEntry[] = [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          actor_email: 'admin@luxury.com',
          actor_role: 'admin',
          action: 'DAILY_RATES_SYNC',
          resource: 'rates',
          details: 'Automatic 9:00 AM IST Bullion rates synced successfully from GoldAPI.io',
          severity: 'info'
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          actor_email: 'admin@luxury.com',
          actor_role: 'admin',
          action: 'LOGIN_SUCCESS',
          resource: 'auth',
          details: 'Administrator session established via 2FA authenticated channel',
          severity: 'info'
        },
        {
          id: 'log-3',
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
          actor_email: 'admin@luxury.com',
          actor_role: 'admin',
          action: 'VAULT_INSPECTION',
          resource: 'inventory',
          details: 'Physical jewellery vault custody count verified against BIS ledger',
          severity: 'info'
        }
      ];
      safeAuditSet(AUDIT_STORAGE_KEY, JSON.stringify(initialLogs));
      return initialLogs;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function logAuditEvent(
  actionOrConfig: string | {
    action: string;
    resource?: string;
    entity_type?: string;
    entity_id?: string;
    details?: any;
    actor_email?: string;
    actor_role?: string;
    severity?: 'info' | 'warning' | 'security' | 'critical';
  },
  resourceArg?: string,
  detailsArg?: any,
  actorEmailArg: string = 'admin@luxury.com',
  actorRoleArg: string = 'admin',
  severityArg: 'info' | 'warning' | 'security' | 'critical' = 'info'
): void {
  try {
    let action = '';
    let resource = 'system';
    let details = '';
    let actorEmail = actorEmailArg;
    let actorRole = actorRoleArg;
    let severity = severityArg;

    if (typeof actionOrConfig === 'object' && actionOrConfig !== null) {
      action = actionOrConfig.action || 'AUDIT_EVENT';
      resource = actionOrConfig.resource || actionOrConfig.entity_type || 'system';
      details = typeof actionOrConfig.details === 'object' 
        ? JSON.stringify(actionOrConfig.details) 
        : String(actionOrConfig.details || actionOrConfig.entity_id || '');
      actorEmail = actionOrConfig.actor_email || 'admin@luxury.com';
      actorRole = actionOrConfig.actor_role || 'admin';
      severity = actionOrConfig.severity || 'info';
    } else {
      action = String(actionOrConfig);
      resource = resourceArg || 'system';
      details = typeof detailsArg === 'object' ? JSON.stringify(detailsArg) : String(detailsArg || '');
    }

    const logs = getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor_email: actorEmail,
      actor_role: actorRole,
      action,
      resource,
      details,
      severity
    };
    logs.unshift(newEntry);
    // Keep last 150 entries
    if (logs.length > 150) logs.pop();
    safeAuditSet(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('Failed to record audit log:', err);
  }
}
