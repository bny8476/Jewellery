import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProductImage } from './ProductImage';
import { localJewelryItems } from '../../utils/localData';
import { getJewelryFallbackImage } from '../../utils/imageUtils';
import { CATEGORY_DEFINITIONS } from '../../pages/JewelleryCategory';
import { JewelryItem } from '../../lib/supabase';

describe('Global Product Image Fit & Consistency Upgrade (TSX)', () => {
  describe('ProductImage Reusable Component HTML & CSS Rules', () => {
    it('enforces standardized 4:5 aspect ratio by default in server/static markup', () => {
      const html = renderToStaticMarkup(
        <ProductImage
          src="/images/necklace_temple_nagas_haram.jpg"
          alt="Temple Nagas Haram"
          category="Necklaces"
        />
      );

      expect(html).toContain('product-image-container');
      expect(html).toContain('aspect-[4/5]');
      expect(html).toContain('flex');
      expect(html).toContain('items-center');
      expect(html).toContain('justify-center');
      expect(html).toContain('overflow-hidden');
    });

    it('enforces strict object-fit: contain and centered positioning on the main image', () => {
      const html = renderToStaticMarkup(
        <ProductImage
          src="/images/bangle_traditional_kasu_pair.jpg"
          alt="Kasu Bangles"
          category="Bangles"
        />
      );

      expect(html).toContain('src="/images/bangle_traditional_kasu_pair.jpg"');
      expect(html).toContain('object-contain');
      expect(html).toContain('object-center');
      expect(html).not.toContain('object-cover');
    });

    it('applies luxury warm ivory / white background with safe internal padding', () => {
      const html = renderToStaticMarkup(
        <ProductImage
          src="/images/ring_solitaire_diamond.jpg"
          alt="Solitaire Diamond Ring"
          padding="p-4"
        />
      );

      expect(html).toContain('p-4');
      expect(html).toContain('bg-gradient-to-b');
      expect(html).toContain('from-[#FAF7F1]');
    });

    it('supports 1:1 aspect ratio when explicitly requested', () => {
      const html = renderToStaticMarkup(
        <ProductImage
          src="/images/gold_coin_8g.jpg"
          alt="Gold Coin"
          aspectRatio="1/1"
        />
      );

      expect(html).toContain('aspect-square');
      expect(html).not.toContain('aspect-[4/5]');
    });

    it('resolves proper fallback image for category when src is missing', () => {
      const expectedFallback = getJewelryFallbackImage('Necklaces', 'gold');
      const html = renderToStaticMarkup(
        <ProductImage
          src={null}
          alt="Missing Necklace"
          category="Necklaces"
          metalType="gold"
        />
      );

      expect(html).toContain(`src="${expectedFallback}"`);
    });

    it('renders secondary image for smooth hover crossfade when provided', () => {
      const html = renderToStaticMarkup(
        <ProductImage
          src="/images/bridal_vivaah_ruby_kundan.jpg"
          secondarySrc="/images/bridal_sita_kalyanam.jpg"
          alt="Bridal Set"
          crossfadeSecondary={true}
        />
      );

      expect(html).toContain('src="/images/bridal_vivaah_ruby_kundan.jpg"');
      expect(html).toContain('src="/images/bridal_sita_kalyanam.jpg"');
      expect(html).toContain('group-hover:opacity-100');
    });

    it('renders shimmer skeleton container to eliminate Cumulative Layout Shift (CLS)', () => {
      const html = renderToStaticMarkup(
        <ProductImage
          src="/images/earring_peacock_jhumkas.jpg"
          alt="Peacock Jhumkas"
          showSkeleton={true}
        />
      );

      expect(html).toContain('animate-pulse');
    });
  });

  describe('Category-Wide Product Image Audit across All 14 Categories', () => {
    const requiredCategories = [
      'Gold Jewellery',
      'Diamond Jewellery',
      'Platinum Jewellery',
      'Silver Jewellery',
      'Rings',
      'Earrings',
      'Necklaces',
      'Pendants',
      'Bangles & Bracelets',
      'Chains',
      'Mangalsutras',
      'Bridal Jewellery',
      "Men's Jewellery",
      "Kids' Jewellery"
    ];

    it('verifies that each of the 14 jewellery categories has matching valid product records', () => {
      requiredCategories.forEach((reqCat) => {
        let matchingItems: JewelryItem[] = [];

        if (reqCat === 'Gold Jewellery') {
          matchingItems = localJewelryItems.filter(i => i.metal_type === 'gold');
        } else if (reqCat === 'Diamond Jewellery') {
          matchingItems = localJewelryItems.filter(i => i.metal_type === 'diamond');
        } else if (reqCat === 'Platinum Jewellery') {
          matchingItems = localJewelryItems.filter(i => i.metal_type === 'platinum');
        } else if (reqCat === 'Silver Jewellery') {
          matchingItems = localJewelryItems.filter(i => i.metal_type === 'silver');
        } else if (reqCat === 'Rings') {
          matchingItems = localJewelryItems.filter(i => i.category.toLowerCase().includes('ring'));
        } else if (reqCat === 'Earrings') {
          matchingItems = localJewelryItems.filter(i => i.category.toLowerCase().includes('earring'));
        } else if (reqCat === 'Necklaces') {
          matchingItems = localJewelryItems.filter(i => i.category.toLowerCase().includes('necklace'));
        } else if (reqCat === 'Pendants') {
          matchingItems = localJewelryItems.filter(i => i.category.toLowerCase().includes('pendant'));
        } else if (reqCat === 'Bangles & Bracelets') {
          matchingItems = localJewelryItems.filter(i => i.category.toLowerCase().includes('bangle'));
        } else if (reqCat === 'Chains') {
          matchingItems = localJewelryItems.filter(i => i.category.toLowerCase().includes('chain'));
        } else if (reqCat === 'Mangalsutras') {
          matchingItems = localJewelryItems.filter(i => 
            i.category.toLowerCase().includes('chain') || 
            i.name.toLowerCase().includes('mangalsutra') ||
            (i.tags && i.tags.includes('mangalsutra'))
          );
        } else if (reqCat === 'Bridal Jewellery') {
          matchingItems = localJewelryItems.filter(i => 
            i.category.toLowerCase().includes('bridal') || 
            i.occasion === 'bridal'
          );
        } else if (reqCat === "Men's Jewellery") {
          matchingItems = localJewelryItems.filter(i => i.gender === 'men');
        } else if (reqCat === "Kids' Jewellery") {
          matchingItems = localJewelryItems.filter(i => i.gender === 'kids');
        }

        expect(matchingItems.length, `Expected category "${reqCat}" to have at least one product`).toBeGreaterThan(0);

        // Verify each matching product has a valid non-empty image URL
        matchingItems.forEach(item => {
          expect(item.image_url, `Product ${item.id} (${item.name}) must have image_url`).toBeDefined();
          expect(typeof item.image_url).toBe('string');
          const imgUrl = item.image_url ?? '';
          expect(imgUrl.trim().length).toBeGreaterThan(0);
          expect(imgUrl).toMatch(/\.(jpg|jpeg|png|webp|svg)$/i);
        });
      });
    });

    it('verifies that all CATEGORY_DEFINITIONS keys have valid metadata and banner imagery', () => {
      const keys = Object.keys(CATEGORY_DEFINITIONS);
      expect(keys.length).toBeGreaterThanOrEqual(14);

      keys.forEach(key => {
        const cat = CATEGORY_DEFINITIONS[key];
        expect(cat.title).toBeTruthy();
        expect(cat.tagline).toBeTruthy();
        expect(cat.bannerImage).toBeTruthy();
        expect(cat.bannerImage).toMatch(/\.(jpg|jpeg|png|webp)$/i);
      });
    });

    it('confirms every product in localJewelryItems has distinct authentic attributes', () => {
      const ids = new Set<string>();
      localJewelryItems.forEach(item => {
        expect(ids.has(item.id), `Duplicate product ID detected: ${item.id}`).toBe(false);
        ids.add(item.id);

        expect(item.name.trim().length).toBeGreaterThan(0);
        expect(item.price).toBeGreaterThan(0);
        expect(item.weight).toBeGreaterThan(0);
        expect(item.image_url).toMatch(/^\/images\//);
      });
    });
  });
});
