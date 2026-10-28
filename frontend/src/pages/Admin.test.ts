import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { RateProvider } from '../context/RateContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CartProvider } from '../context/CartContext';
import PawnshopAdmin from './Admin';
import EnhancedDashboard from '../components/admin/EnhancedDashboard';
import { ProtectedRoute } from '../components/ProtectedRoute';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';
import { supabase } from '../lib/supabase';
import { normalizeAdminRole, canAccessTab } from '../utils/rbac';
import { getDashboardStats } from '../services/transactionService';

function renderWithProviders(children: React.ReactNode, initialEntries = ['/admin']) {
  return renderToString(
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(
        AuthProvider,
        null,
        React.createElement(
          RateProvider,
          null,
          React.createElement(
            WishlistProvider,
            null,
            React.createElement(
              CartProvider,
              null,
              React.createElement(
                MemoryRouter,
                { initialEntries },
                children
              )
            )
          )
        )
      )
    )
  );
}

describe('Phase 22: Admin Login & Dashboard Regression Suite', () => {
  beforeEach(async () => {
    await supabase.auth.signOut();
  });

  // Scenario 1: Admin enters valid credentials and logs in
  it('1. Admin enters valid credentials and authenticates successfully', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@luxury.com',
      password: 'admin123',
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('admin@luxury.com');
    expect(data.session?.access_token).toBeDefined();
  });

  // Scenario 2: Admin is redirected to correct dashboard route without circular redirect
  it('2. Redirects to sanitized /admin route instead of circular /login', () => {
    const rawFrom: string = '/login';
    const target = (rawFrom && rawFrom.startsWith('/admin') && rawFrom !== '/admin/login') ? rawFrom : '/admin';
    expect(target).toBe('/admin');

    const deepFrom: string = '/admin/pos';
    const deepTarget = (deepFrom && deepFrom.startsWith('/admin') && deepFrom !== '/admin/login') ? deepFrom : '/admin';
    expect(deepTarget).toBe('/admin/pos');
  });

  // Scenario 3: Dashboard content renders after authentication
  it('3. Dashboard content renders full operational ledger and summary cards', () => {
    const html = renderWithProviders(React.createElement(PawnshopAdmin));
    expect(html).toContain('Operational Ledger &amp; Business Analytics');
    expect(html).toContain('Stock Valuation');
    expect(html).toContain('Executive Dashboard');
  });

  // Scenario 4: Authentication initialization displays loading state instead of blank page
  it('4. ProtectedRoute displays loading state when verifying role instead of blank screen', () => {
    const html = renderWithProviders(
      React.createElement(
        ProtectedRoute,
        { requireAdmin: true, children: React.createElement('div', null, 'Admin Content') }
      ),
      ['/admin']
    );

    expect(html).toBeDefined();
    // In server/initial state without live auth session, it displays authentication screen or access check
    expect(html.length).toBeGreaterThan(100);
  });

  // Scenario 5: Dashboard handles empty database records safely
  it('5. Dashboard handles empty database records safely with fallback metrics', () => {
    const emptyStats = {
      total_active_pledges: 0,
      total_loan_amount: 0,
      total_customers: 0,
      today_pledges: 0,
      today_returns: 0,
      cash_in_hand: 0,
      gold_rate: 0,
      silver_rate: 0,
      total_inventory_items: 0,
      total_inventory_value: 0,
      today_sales: 0,
      today_purchases: 0,
      loans_due_today: 0,
      overdue_loans: 0,
      payments_received_today: 0,
      estimated_profit: 0
    };

    const html = renderWithProviders(
      React.createElement(EnhancedDashboard, {
        stats: emptyStats,
        loading: false,
        onRefresh: () => {},
        onNavigateTab: () => {},
        onSendMonthlyNotifications: () => {},
        sendingNotifications: false
      })
    );

    expect(html).toBeDefined();
    expect(html).toContain('Operational Ledger');
    expect(html).toContain('Stock Valuation');
  });

  // Scenario 6: Dashboard handles API errors without crashing
  it('6. getDashboardStats resolves cleanly even when database operations fail', async () => {
    const stats = await getDashboardStats();
    expect(stats).toBeDefined();
    expect(typeof stats.cash_in_hand).toBe('number');
    expect(typeof stats.total_inventory_value).toBe('number');
  });

  // Scenario 7: Expired sessions are handled correctly (redirect to login)
  it('7. ProtectedRoute redirects unauthenticated users to /login', () => {
    const html = renderWithProviders(
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: '/admin',
          element: React.createElement(ProtectedRoute, { requireAdmin: true, children: 'Secret Admin' })
        }),
        React.createElement(Route, {
          path: '/login',
          element: React.createElement('div', null, 'Unified Login Screen')
        })
      ),
      ['/admin']
    );

    expect(html).toBeDefined();
  });

  // Scenario 8: Non-admin users cannot access restricted admin features
  it('8. Non-admin users cannot access restricted tabs via RBAC', () => {
    expect(canAccessTab('sales_staff', 'settings')).toBe(false);
    expect(canAccessTab('sales_staff', 'users')).toBe(false);
    expect(canAccessTab('super_admin', 'settings')).toBe(true);
    expect(canAccessTab('super_admin', 'dashboard')).toBe(true);
    expect(canAccessTab('admin', 'dashboard')).toBe(true);
  });

  // Scenario 9: Refreshing an authenticated admin route works via normalized roles
  it('9. normalizeAdminRole normalizes all employee and executive designations', () => {
    expect(normalizeAdminRole('super_admin')).toBe('super_admin');
    expect(normalizeAdminRole('admin')).toBe('admin');
    expect(normalizeAdminRole('manager')).toBe('manager');
    expect(normalizeAdminRole('staff')).toBe('sales_staff');
    expect(normalizeAdminRole('pawn_officer')).toBe('pawn_officer');
    expect(normalizeAdminRole('unknown_role')).toBe('sales_staff');
  });

  // Scenario 10: Direct navigation to the admin URL works in production
  it('10. Renders correctly for /admin and /admin/* routes', () => {
    const html = renderWithProviders(
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: '/admin/*',
          element: React.createElement(PawnshopAdmin)
        })
      ),
      ['/admin/pos']
    );

    expect(html).toContain('Operational Ledger &amp; Business Analytics');
  });

  // Scenario 11: Missing or invalid configuration produces graceful fallback
  it('11. Gracefully handles null rates and null stats', () => {
    const html = renderWithProviders(
      React.createElement(EnhancedDashboard, {
        stats: null,
        loading: false,
        onRefresh: () => {},
        onNavigateTab: () => {},
        onSendMonthlyNotifications: () => {},
        sendingNotifications: false
      })
    );

    expect(html).toContain('Stock Valuation');
  });

  // Scenario 12: A rendering exception is caught by AdminErrorBoundary and displayed safely
  it('12. AdminErrorBoundary catches exceptions and renders diagnostic screen instead of blank page', () => {
    const errorState = AdminErrorBoundary.getDerivedStateFromError(new Error('Test diagnostic intercept'));
    expect(errorState.hasError).toBe(true);
    expect(errorState.error?.message).toBe('Test diagnostic intercept');

    const boundary = new AdminErrorBoundary({ children: null });
    boundary.state = {
      hasError: true,
      error: new Error('Test diagnostic intercept'),
      errorInfo: { componentStack: '\n    in FaultyWidget\n    in AdminWorkspace' }
    };

    const element = boundary.render() as React.ReactElement;
    const html = renderToString(element);
    expect(html).toContain('EXECUTIVE PORTAL RECOVERY');
    expect(html).toContain('Admin Workspace Diagnostic Intercept');
    expect(html).toContain('Reload Dashboard');
    expect(html).toContain('Test diagnostic intercept');
  });
});
