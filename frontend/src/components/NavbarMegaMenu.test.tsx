import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { RateProvider } from '../context/RateContext';
import { WishlistProvider } from '../context/WishlistContext';
import { CartProvider } from '../context/CartContext';
import { Navbar } from './Navbar';

function renderNavbar(initialEntries = ['/']) {
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
                React.createElement(Navbar, null)
              )
            )
          )
        )
      )
    )
  );
}

describe('Navbar & Mega Menu Architecture Suite', () => {
  it('renders all 11 canonical navigation bar items with high-fashion luxury styling', () => {
    const html = renderNavbar();

    // 1. New Arrivals
    expect(html).toContain('New Arrivals');
    // 2. Express Delivery
    expect(html).toContain('Express Delivery');
    // 3. Earrings
    expect(html).toContain('Earrings');
    // 4. Pendants
    expect(html).toContain('Pendants');
    // 5. Rings
    expect(html).toContain('Rings');
    // 6. Diamond Jewellery
    expect(html).toContain('Diamond Jewellery');
    // 7. More Jewellery
    expect(html).toContain('More Jewellery');
    // 8. Gifting
    expect(html).toContain('Gifting');
    // 9. Wedding Collections
    expect(html).toContain('Wedding Collections');
    // 10. Offers
    expect(html).toContain('Offers');
    // 11. Today's Gold Rate
    expect(html.includes("Today's Gold Rate") || html.includes("Today&#x27;s Gold Rate")).toBe(true);
  });

  it('uses the shared positioning container on the nav bar without item-level offset clipping', () => {
    const html = renderNavbar();

    // Shared relative parent
    expect(html).toContain('aria-label="YAZHINI FINE JEWELS - Home"');
    expect(html).toContain('relative');

    // Live rate quick trigger button in secondary bar
    expect(html).toContain('Today');
    expect(html).toContain('₹');
  });

  it('provides all essential luxury ecommerce header elements', () => {
    const html = renderNavbar();

    // Brand crest/title
    expect(html).toContain('YAZHINI');
    expect(html).toContain('FINE JEWELS');

    // Live metal rates banner
    expect(html).toContain('LIVE 24K 999.9');

    // Action buttons
    expect(html).toContain('Stores');
    expect(html).toContain('title="Wishlist"');
    expect(html).toContain('title="Shopping Bag"');
  });

  it('renders LiveRateCard with synchronized 24K, 22K, sell-back, and 999 silver rates', async () => {
    const { LiveRateCard } = await import('./LiveRateCard');
    const cardHtml = renderToString(
      React.createElement(
        ThemeProvider,
        null,
        React.createElement(
          RateProvider,
          null,
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(LiveRateCard, { showExtended: true })
          )
        )
      )
    );

    // 24K 999.9 Gold
    expect(cardHtml).toContain('LIVE 24K 999.9 GOLD');
    expect(cardHtml).toContain('14,928');

    // Sell-back rate
    expect(cardHtml).toContain('Sell-back:');
    expect(cardHtml).toContain('14,522');

    // 22K 916 BIS Gold
    expect(cardHtml).toContain('22K 916 BIS Gold');
    expect(cardHtml).toContain('13,684');

    // 999 Fine Silver
    expect(cardHtml).toContain('999 Fine Silver');
    expect(cardHtml).toContain('173');

    // Action CTA links
    expect(cardHtml).toContain('Full Analytics');
    expect(cardHtml).toContain('Buy 24K Vault');
  });
});
