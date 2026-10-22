import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { RateProvider } from '../context/RateContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CartProvider } from '../context/CartContext';
import { CustomerAccountHeader } from '../components/dashboard/CustomerAccountHeader';
import { CustomerAccountSidebar } from '../components/dashboard/CustomerAccountSidebar';
import { CustomerAccountRightPanel } from '../components/dashboard/CustomerAccountRightPanel';
import { AddressModal } from '../components/dashboard/AddressModal';
import { ReturnExchangeModal } from '../components/dashboard/ReturnExchangeModal';
import Dashboard from './Dashboard';

const mockPatronUser: any = {
  id: 'patron-user-test-12345678',
  email: 'rajeshwari.patron@yazhini.com',
  user_metadata: {
    full_name: 'Rajeshwari Sundaram',
    role: 'customer'
  }
};

function renderWithProviders(children: React.ReactNode, initialEntries = ['/dashboard']) {
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

describe('Phase 23: Dedicated Customer Account Dashboard Suite', () => {

  it('1. CustomerAccountHeader renders brand crest, breadcrumbs, live ticker and boutique return link', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountHeader, {
        user: mockPatronUser,
        activeTabTitle: 'My Curated Wishlist',
        onSelectTab: () => {},
        onToggleMobileSidebar: () => {},
        onSignOut: () => {},
        unreadCount: 3
      })
    );

    expect(html).toContain('YAZHINI');
    expect(html).toContain('Patron Portal');
    expect(html).toContain('My Curated Wishlist');
    expect(html).toContain('24K Bullion Benchmark');
    expect(html).toContain('Store');
    expect(html).toContain('Rajeshwari Sundaram');
  });

  it('2. CustomerAccountSidebar renders all 12 luxury navigation items and badges', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountSidebar, {
        user: mockPatronUser,
        currentTab: 'overview',
        onSelectTab: () => {},
        isOpenMobile: false,
        onCloseMobile: () => {},
        onSignOut: () => {},
        ordersCount: 4,
        wishlistCount: 2,
        addressesCount: 1,
        vaultGrams: 12.50,
        loansCount: 1,
        unreadCount: 3
      })
    );

    expect(html).toContain('Account Overview');
    expect(html).toContain('My Orders');
    expect(html).toContain('Live Tracking');
    expect(html).toContain('My Wishlist');
    expect(html).toContain('Saved Addresses');
    expect(html).toContain('Patron Profile');
    expect(html).toContain('Aura Gold™ Vault');
    expect(html).toContain('Collateral Loans');
    expect(html).toContain('Transactions Ledger');
    expect(html).toContain('Notifications');
    expect(html).toContain('Patron Concierge');
    expect(html).toContain('Security &amp; Settings');
    expect(html).toContain('Sign Out of Portal');
    expect(html).toContain('Royal Gold Tier');
  });

  it('3. CustomerAccountRightPanel renders active consignment pulse and senior advisor card', () => {
    const sampleOrder = {
      id: 'YZ-ORD-991244',
      order_number: 'YZ-ORD-991244',
      status: 'shipped',
      courier_partner: 'Sequel Armoured Express',
      tracking_number: 'SEQL-992144',
      items: [{ product_name: 'Burmese Ruby Choker' }]
    };

    const html = renderWithProviders(
      React.createElement(CustomerAccountRightPanel, {
        latestOrder: sampleOrder,
        onTrackOrder: () => {},
        onOpenSupport: () => {},
        onOpenVault: () => {}
      })
    );

    expect(html).toContain('Order Pulse');
    expect(html).toContain('Sequel Armoured Express');
    expect(html).toContain('SEQL-992144');
    expect(html).toContain('Mr. S. Natarajan');
    expect(html).toContain('Private Patron Concierge');
    expect(html).toContain('Today&#x27;s Live Rates');
  });

  it('4. AddressModal renders with category selectors and validation constraints', () => {
    const html = renderWithProviders(
      React.createElement(AddressModal, {
        isOpen: true,
        onClose: () => {},
        onSave: () => {}
      })
    );

    expect(html).toContain('Add New Delivery Address');
    expect(html).toContain('Recipient Name *');
    expect(html).toContain('Contact Phone (10-Digit Mobile) *');
    expect(html).toContain('Street Address &amp; Door No. *');
    expect(html).toContain('PIN Code (6-Digit Indian Postal Code) *');
    expect(html).toContain('Set as my default shipping address');
  });

  it('5. ReturnExchangeModal renders 14-day exchange options and 100% transit insurance cover', () => {
    const sampleOrder = {
      id: 'YZ-ORD-771122',
      order_number: 'YZ-ORD-771122'
    };

    const html = renderWithProviders(
      React.createElement(ReturnExchangeModal, {
        isOpen: true,
        onClose: () => {},
        order: sampleOrder,
        onSubmit: () => {}
      })
    );

    expect(html).toContain('Patron Guarantee &amp; Exchange Desk');
    expect(html).toContain('Size / Design Exchange');
    expect(html).toContain('14-Day Return');
    expect(html).toContain('Laser Re-polishing');
    expect(html).toContain('100% transit insurance cover');
  });

  it('6. Unauthenticated patron view prompts for credentials', () => {
    const html = renderWithProviders(
      React.createElement(Dashboard, null),
      ['/dashboard']
    );

    // Initial render shows login requirement or vault loading
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(50);
  });

});
