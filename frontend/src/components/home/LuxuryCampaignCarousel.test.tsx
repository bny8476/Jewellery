import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LuxuryCampaignCarousel, CAMPAIGN_STORIES } from './LuxuryCampaignCarousel';

function renderCarousel() {
  return renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      React.createElement(LuxuryCampaignCarousel, null)
    )
  );
}

describe('LuxuryCampaignCarousel', () => {
  it('renders section title, eyebrow and campaign items correctly', () => {
    const html = renderCarousel();

    // Section Eyebrow and Heading
    expect(html).toContain('THE ART OF ADORNMENT');
    expect(html).toContain('Stories of Timeless Elegance');

    // Section ID for anchor scrolling
    expect(html).toContain('id="campaigns"');

    // Verify all 6 campaign titles are rendered in the HTML
    CAMPAIGN_STORIES.forEach((c) => {
      expect(html).toContain(c.name);
    });
  });

  it('renders navigation buttons and campaign links', () => {
    const html = renderCarousel();

    // Circular arrow buttons
    expect(html).toContain('aria-label="Previous campaign"');
    expect(html).toContain('aria-label="Next campaign"');

    // First card (MIRAGE) active CTA
    expect(html).toContain('Explore Collection');
    expect(html).toContain('/category/diamonds');
  });

  it('renders campaign counter and navigation pills', () => {
    const html = renderCarousel();

    // Counter shows 01 / 06
    expect(html).toContain('01');
    expect(html).toContain('06');

    // All campaign images are referenced
    CAMPAIGN_STORIES.forEach((c) => {
      expect(html).toContain(c.image);
    });
  });
});
