import { describe, it, expect } from 'vitest';
import { 
  canAccessTab, 
  hasPermission, 
  normalizeAdminRole, 
  getAuditLogs,
  logAuditEvent
} from './rbac';

describe('Role-Based Access Control (RBAC) & Security Audit Engine', () => {

  it('correctly maps and normalizes raw role strings', () => {
    expect(normalizeAdminRole('super_admin')).toBe('super_admin');
    expect(normalizeAdminRole('SuperAdmin')).toBe('super_admin');
    expect(normalizeAdminRole('manager')).toBe('manager');
    expect(normalizeAdminRole('sales')).toBe('sales_staff');
    expect(normalizeAdminRole('inventory')).toBe('inventory_staff');
    expect(normalizeAdminRole('pawn')).toBe('pawn_officer');
    expect(normalizeAdminRole('accountant')).toBe('accountant');
    expect(normalizeAdminRole('auditor')).toBe('auditor');
    expect(normalizeAdminRole(undefined)).toBe('admin');
  });

  it('enforces tab access according to permission matrix', () => {
    // Super admin can access all operational tabs
    expect(canAccessTab('super_admin', 'dashboard')).toBe(true);
    expect(canAccessTab('super_admin', 'pos')).toBe(true);
    expect(canAccessTab('super_admin', 'settings')).toBe(true);
    expect(canAccessTab('super_admin', 'users')).toBe(true);

    // Sales staff has restricted access
    expect(canAccessTab('sales_staff', 'pos')).toBe(true);
    expect(canAccessTab('sales_staff', 'orders')).toBe(true);
    expect(canAccessTab('sales_staff', 'settings')).toBe(false);
    expect(canAccessTab('sales_staff', 'users')).toBe(false);
    expect(canAccessTab('sales_staff', 'bank')).toBe(false);

    // Inventory staff can access inventory & purchases but not accounts
    expect(canAccessTab('inventory_staff', 'inventory')).toBe(true);
    expect(canAccessTab('inventory_staff', 'purchases')).toBe(true);
    expect(canAccessTab('inventory_staff', 'diamonds')).toBe(true);
    expect(canAccessTab('inventory_staff', 'accounts')).toBe(false);

    // Auditor can view reports and audit logs but cannot create POS sales
    expect(canAccessTab('auditor', 'reports')).toBe(true);
    expect(canAccessTab('auditor', 'settings')).toBe(true);
    expect(canAccessTab('auditor', 'pos')).toBe(false);
  });

  it('enforces granular action permissions on resources', () => {
    // Super admin can delete users
    expect(hasPermission('super_admin', 'users', 'delete')).toBe(true);

    // Manager can create purchases but cannot delete users
    expect(hasPermission('manager', 'purchases', 'create')).toBe(true);
    expect(hasPermission('manager', 'users', 'delete')).toBe(false);

    // Auditor has read-only permissions
    expect(hasPermission('auditor', 'reports', 'read')).toBe(true);
    expect(hasPermission('auditor', 'reports', 'export')).toBe(true);
    expect(hasPermission('auditor', 'inventory', 'create')).toBe(false);
  });

  it('records and retrieves security audit events', () => {
    logAuditEvent(
      'TEST_INVOICE_GENERATED',
      'pos',
      'Test invoice created for customer Smt. Kamala',
      'admin@luxury.com',
      'super_admin',
      'info'
    );

    const logs = getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    const latest = logs[0];
    expect(latest.action).toBe('TEST_INVOICE_GENERATED');
    expect(latest.resource).toBe('pos');
    expect(latest.actor_email).toBe('admin@luxury.com');
  });
});
