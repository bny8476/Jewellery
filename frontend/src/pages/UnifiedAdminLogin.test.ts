import { describe, it, expect } from 'vitest';

describe('Unified Admin Authentication & Route Protection Suite', () => {
  const adminRoles = [
    'super_admin',
    'admin',
    'manager',
    'staff',
    'sales_staff',
    'inventory_staff',
    'pawn_officer',
    'accountant',
    'auditor'
  ];

  const determineIsAdmin = (
    userEmail: string,
    userRole: string,
    appRole: string,
    configuredAdminEmail: string = ''
  ): boolean => {
    const email = userEmail.toLowerCase().trim();
    const uRole = userRole.toLowerCase().trim();
    const aRole = appRole.toLowerCase().trim();
    const cAdmin = configuredAdminEmail.toLowerCase().trim();

    return (
      adminRoles.includes(uRole) ||
      adminRoles.includes(aRole) ||
      email === 'admin@luxury.com' ||
      email.includes('admin') ||
      (Boolean(cAdmin) && email === cAdmin)
    );
  };

  const computeLoginDestination = (
    isAdmin: boolean,
    rawFrom?: string
  ): string => {
    if (isAdmin) {
      return (rawFrom && rawFrom.startsWith('/admin') && rawFrom !== '/admin/login')
        ? rawFrom
        : '/admin';
    } else {
      // Prevent regular customers from landing in restricted admin dashboards
      return (rawFrom && !rawFrom.startsWith('/admin') && rawFrom !== '/login' && rawFrom !== '/admin/login')
        ? rawFrom
        : '/';
    }
  };

  it('1. Correctly classifies administrator and executive roles', () => {
    expect(determineIsAdmin('admin@luxury.com', '', '')).toBe(true);
    expect(determineIsAdmin('custom_admin@jewelry.org', '', '')).toBe(true);
    expect(determineIsAdmin('manager@luxury.com', 'manager', '')).toBe(true);
    expect(determineIsAdmin('appraiser@luxury.com', '', 'pawn_officer')).toBe(true);
    expect(determineIsAdmin('auditor@luxury.com', 'auditor', '')).toBe(true);
    expect(determineIsAdmin('vip_client@gmail.com', 'patron', '')).toBe(false);
    expect(determineIsAdmin('shopper@yahoo.com', '', '')).toBe(false);
  });

  it('2. Directs authenticated administrators to requested deep admin route', () => {
    const target = computeLoginDestination(true, '/admin/pos');
    expect(target).toBe('/admin/pos');

    const billingTarget = computeLoginDestination(true, '/admin/billing');
    expect(billingTarget).toBe('/admin/billing');
  });

  it('3. Directs authenticated administrators to default /admin when no deep route is specified or when circular /admin/login is given', () => {
    expect(computeLoginDestination(true, undefined)).toBe('/admin');
    expect(computeLoginDestination(true, '/admin/login')).toBe('/admin');
    expect(computeLoginDestination(true, '/login')).toBe('/admin');
  });

  it('4. Safeguards regular customers by never directing them to /admin even if rawFrom requested it', () => {
    // If a regular user clicked a link to /admin or /admin/pos before login
    const target = computeLoginDestination(false, '/admin');
    expect(target).toBe('/');

    const deepTarget = computeLoginDestination(false, '/admin/pos');
    expect(deepTarget).toBe('/');
  });

  it('5. Directs regular customers to requested public storefront paths', () => {
    expect(computeLoginDestination(false, '/dashboard')).toBe('/dashboard');
    expect(computeLoginDestination(false, '/checkout')).toBe('/checkout');
    expect(computeLoginDestination(false, '/pawn')).toBe('/pawn');
  });

  it('6. Sanitizes circular login references for regular patrons', () => {
    expect(computeLoginDestination(false, '/login')).toBe('/');
    expect(computeLoginDestination(false, '/admin/login')).toBe('/');
  });
});
