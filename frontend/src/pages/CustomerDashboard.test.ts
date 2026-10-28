import { describe, it, expect } from 'vitest';
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
import { CustomerOverviewTab } from '../components/dashboard/tabs/CustomerOverviewTab';
import { CustomerAvatar } from '../components/dashboard/CustomerAvatar';
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

  it('2. CustomerAccountSidebar renders luxury navigation items without notifications (moved to nav header)', () => {
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
        loansCount: 1
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
    expect(html).not.toContain('Notifications');
    expect(html).toContain('Patron Concierge');
    expect(html).toContain('Security &amp; Settings');
    expect(html).toContain('Sign Out of Portal');
  });

  it('2b. CustomerAccountHeader renders interactive notification popover with unread alerts', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountHeader, {
        user: mockPatronUser,
        activeTabTitle: 'Account Overview',
        onSelectTab: () => {},
        onToggleMobileSidebar: () => {},
        onSignOut: () => {},
        unreadCount: 2,
        isNotificationOpen: true
      })
    );

    expect(html).toContain('Patron Notifications');
    expect(html).toContain('Mark all read');
    expect(html).toContain('Consignment Dispatched via Sequel Armoured Logistics');
    expect(html).toContain('Aura Gold™ Market Benchmark Update');
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
    expect(html).not.toContain('Private Patron Concierge');
    expect(html).not.toContain('Today&#x27;s Live Rates');
  });

  it('3b. CustomerAccountHeader renders interactive Today\'s Live Rates dropdown when opened', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountHeader, {
        user: mockPatronUser,
        activeTabTitle: 'Account Overview',
        onSelectTab: () => {},
        onToggleMobileSidebar: () => {},
        onSignOut: () => {},
        isRatesOpen: true
      })
    );

    expect(html).toContain('Today&#x27;s Live Rates');
    expect(html).toContain('24K Pure Gold (999.9)');
    expect(html).toContain('22K Standard (916)');
    expect(html).toContain('999 Fine Silver');
    expect(html).toContain('Pt950 Platinum');
    expect(html).toContain('Gold Savings Vault');
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

  it('6. Unauthenticated patron view prompts for credentials with dark mode styling', () => {
    const html = renderWithProviders(
      React.createElement(Dashboard, null),
      ['/dashboard']
    );

    // Initial render shows login requirement or vault loading
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(50);
    expect(html).toContain('customer-portal-root');
    expect(html).toContain('dark:bg-[#0B0C0E]');
  });

  it('7. CustomerAccountHeader renders interactive theme toggle button with aria-label and tooltips', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountHeader, {
        user: mockPatronUser,
        activeTabTitle: 'Account Overview',
        onSelectTab: () => {},
        onToggleMobileSidebar: () => {},
        onSignOut: () => {},
        unreadCount: 0
      })
    );

    expect(html).toContain('aria-label="Toggle Theme"');
    expect(html).toContain('dark:text-[#D2D7E2]');
    expect(html).toContain('dark:hover:bg-[#181B22]');
  });

  it('8. Customer portal dual theme architecture supports light and dark modes seamlessly', () => {
    const headerHtml = renderWithProviders(
      React.createElement(CustomerAccountHeader, {
        user: mockPatronUser,
        activeTabTitle: 'My Orders',
        onSelectTab: () => {},
        onToggleMobileSidebar: () => {},
        onSignOut: () => {}
      })
    );

    // Check that header contains both light and dark theme transition classes
    expect(headerHtml).toContain('transition-colors');
    expect(headerHtml).toContain('dark:border-[#222733]');
    expect(headerHtml).toContain('dark:text-[#F7F8FA]');
  });

  it('9. CustomerOverviewTab renders fine jewellery showcase image, real-time patron name, and animated hero elements', () => {
    const html = renderWithProviders(
      React.createElement(CustomerOverviewTab, {
        user: mockPatronUser,
        customerName: 'Rajesh Sharma',
        orders: [],
        activeOrdersCount: 0,
        wishlist: [],
        goldVault: null,
        vaultMarketValue: 0,
        activeLoans: [],
        recommendedProducts: [],
        onSelectTab: () => {},
        onTrackOrder: () => {},
        onDownloadTaxInvoice: () => {},
        onPrintReceipt: () => {},
        onToggleWishlist: () => {},
        onAddToCart: () => {},
        getStatusColor: () => '',
        formatCurrencyINR: (n: number) => `₹${n}`
      })
    );

    expect(html).toContain('Client Portfolio');
    expect(html).toContain('Welcome,');
    expect(html).toContain('Rajesh');
    expect(html).toContain('/images/luxury_necklace_hero.jpg');
    expect(html).toContain('85% Profile Completed');
  });

  it('10. CustomerAvatar renders male and female luxury styles with gold halo and crown status badge', () => {
    const femaleHtml = renderToString(
      React.createElement(CustomerAvatar, {
        name: 'Rajeshwari Sundaram',
        gender: 'female',
        size: 'lg',
        loyaltyTier: 'Valued Member'
      })
    );
    expect(femaleHtml).toContain('female_patron_avatar.jpg');
    expect(femaleHtml).toContain('ring-[#E9D19E]');
    expect(femaleHtml).toContain('Rajeshwari Sundaram (Valued Member)');

    const maleHtml = renderToString(
      React.createElement(CustomerAvatar, {
        name: 'Vikramaditya Varma',
        gender: 'male',
        size: 'lg',
        loyaltyTier: 'Valued Member'
      })
    );
    expect(maleHtml).toContain('male_patron_avatar.jpg');
    expect(maleHtml).toContain('ring-[#C9A45C]');
    expect(maleHtml).toContain('Vikramaditya Varma');
  });

  it('11. CustomerAccountHeader renders dynamic patron profile without Royal Patron or hardcoded black box', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountHeader, {
        user: mockPatronUser,
        customerName: 'Smt. Rajeshwari Sundaram',
        customerGender: 'female',
        customerTier: 'Valued Member',
        activeTabTitle: 'Account Overview',
        onSelectTab: () => {},
        onToggleMobileSidebar: () => {},
        onSignOut: () => {}
      })
    );

    expect(html).toContain('Smt. Rajeshwari Sundaram');
    expect(html).toContain('Valued Member');
    expect(html).toContain('female_patron_avatar.jpg');
    expect(html).not.toContain('Royal Patron');
  });

  it('12. CustomerAccountSidebar renders Patron Quick Glance card with dynamic customer name and tier without Royal Patron', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountSidebar, {
        user: mockPatronUser,
        customerName: 'Smt. Rajeshwari Sundaram',
        customerGender: 'female',
        customerTier: 'Valued Member',
        currentTab: 'overview',
        onSelectTab: () => {},
        isOpenMobile: false,
        onCloseMobile: () => {},
        onSignOut: () => {}
      })
    );

    expect(html).toContain('Smt. Rajeshwari Sundaram');
    expect(html).toContain('Valued Member');
    expect(html).toContain('female_patron_avatar.jpg');
    expect(html).not.toContain('Royal Patron');
  });

  it('13. CustomerAccountSidebar renders collapse toggle button with aria-label in expanded mode', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountSidebar, {
        user: mockPatronUser,
        currentTab: 'overview',
        onSelectTab: () => {},
        isOpenMobile: false,
        onCloseMobile: () => {},
        onSignOut: () => {},
        isCollapsed: false
      })
    );

    expect(html).toContain('aria-label="Collapse sidebar"');
    expect(html).toContain('title="Collapse sidebar"');
    expect(html).toContain('w-[260px]');
    expect(html).toContain('data-collapsed="false"');
  });

  it('14. CustomerAccountSidebar renders compact layout with floating tooltips and expand button in collapsed mode', () => {
    const html = renderWithProviders(
      React.createElement(CustomerAccountSidebar, {
        user: mockPatronUser,
        customerName: 'Smt. Rajeshwari Sundaram',
        currentTab: 'overview',
        onSelectTab: () => {},
        isOpenMobile: false,
        onCloseMobile: () => {},
        onSignOut: () => {},
        isCollapsed: true,
        ordersCount: 3
      })
    );

    expect(html).toContain('aria-label="Expand sidebar"');
    expect(html).toContain('title="Expand sidebar"');
    expect(html).toContain('w-[72px]');
    expect(html).toContain('data-collapsed="true"');
    expect(html).toContain('role="tooltip"');
    // Active item highlight in collapsed mode
    expect(html).toContain('bg-[#C9A45C]');
  });

});


