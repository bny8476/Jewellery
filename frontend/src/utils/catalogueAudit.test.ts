import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { localJewelryItems } from './localData';
import { auditCatalogue, deduplicateAndMerge, normalizeKey, getProductSlug } from './catalogueAudit';

describe('YAZHINI FINE JEWELS — Catalogue Expansion & Zero-Duplication Audit', () => {

  it('1. Catalogue contains expanded collection of 34 authentic luxury products', () => {
    expect(localJewelryItems.length).toBe(34);
  });

  it('2. Zero duplicate Product IDs exist in the catalogue', () => {
    const idSet = new Set<string>();
    const duplicateIds: string[] = [];

    for (const item of localJewelryItems) {
      if (idSet.has(item.id)) {
        duplicateIds.push(item.id);
      }
      idSet.add(item.id);
    }

    expect(duplicateIds).toEqual([]);
    expect(idSet.size).toBe(localJewelryItems.length);
  });

  it('3. Zero duplicate SKUs exist across the catalogue', () => {
    const skuSet = new Set<string>();
    const duplicateSkus: string[] = [];

    for (const item of localJewelryItems) {
      expect(item.sku).toBeDefined();
      const normSku = normalizeKey(item.sku!);
      if (skuSet.has(normSku)) {
        duplicateSkus.push(item.sku!);
      }
      skuSet.add(normSku);
    }

    expect(duplicateSkus).toEqual([]);
    expect(skuSet.size).toBe(localJewelryItems.length);
  });

  it('4. Zero duplicate or near-identical product names exist', () => {
    const nameSet = new Set<string>();
    const duplicateNames: string[] = [];

    for (const item of localJewelryItems) {
      const norm = normalizeKey(item.name);
      if (nameSet.has(norm)) {
        duplicateNames.push(item.name);
      }
      nameSet.add(norm);
    }

    expect(duplicateNames).toEqual([]);
    expect(nameSet.size).toBe(localJewelryItems.length);
  });

  it('5. Zero duplicate product slugs exist', () => {
    const slugSet = new Set<string>();
    const duplicateSlugs: string[] = [];

    for (const item of localJewelryItems) {
      const slug = getProductSlug(item.name);
      if (slugSet.has(slug)) {
        duplicateSlugs.push(slug);
      }
      slugSet.add(slug);
    }

    expect(duplicateSlugs).toEqual([]);
    expect(slugSet.size).toBe(localJewelryItems.length);
  });

  it('6. Zero reused main product image assets across products', () => {
    const imageSet = new Set<string>();
    const duplicateImages: string[] = [];

    for (const item of localJewelryItems) {
      expect(item.image_url).toBeDefined();
      const cleanImg = item.image_url!.trim().toLowerCase();
      if (imageSet.has(cleanImg)) {
        duplicateImages.push(item.image_url!);
      }
      imageSet.add(cleanImg);
    }

    expect(duplicateImages).toEqual([]);
    expect(imageSet.size).toBe(localJewelryItems.length);
  });

  it('7. All referenced product images physically exist in public directory', () => {
    const publicDir = path.resolve(__dirname, '../../public');
    const missingImages: string[] = [];

    for (const item of localJewelryItems) {
      if (item.image_url && item.image_url.startsWith('/images/')) {
        const relativeFilePath = item.image_url.replace(/^\//, '');
        const fullPath = path.join(publicDir, relativeFilePath);
        if (!fs.existsSync(fullPath)) {
          missingImages.push(`${item.name}: ${item.image_url}`);
        }
      }
    }

    expect(missingImages).toEqual([]);
  });

  it('8. Complete factual specifications on all items (price, weight, metal, purity, wastage)', () => {
    for (const item of localJewelryItems) {
      expect(item.price).toBeGreaterThan(0);
      expect(item.weight).toBeGreaterThan(0);
      expect(['gold', 'diamond', 'silver', 'platinum', 'none']).toContain(item.metal_type);
      expect(item.category).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.purity).toBeTruthy();
      expect(item.wastage_percent).toBeGreaterThanOrEqual(0);
    }
  });

  it('9. Audit utility runs and confirms 100% validity with 0 violations', () => {
    const report = auditCatalogue(localJewelryItems);
    expect(report.isValid).toBe(true);
    expect(report.duplicateViolationsCount).toBe(0);
    expect(report.incompleteWarningsCount).toBe(0);
    expect(report.totalItemsScanned).toBe(34);
    expect(report.uniqueProductsCount).toBe(34);
  });

  it('10. Deduplication engine idempotency: re-merging skips 100% of duplicates', () => {
    // Attempting to merge the same catalogue into itself
    const result = deduplicateAndMerge(localJewelryItems, localJewelryItems);
    expect(result.insertedCount).toBe(0);
    expect(result.skippedCount).toBe(34);
    expect(result.merged.length).toBe(34);
  });

  it('11. Comprehensive luxury category coverage across all departments', () => {
    const report = auditCatalogue(localJewelryItems);
    const cats = Object.keys(report.categoryDistribution);

    expect(cats).toContain('Bridal Sets');
    expect(cats).toContain('Necklaces');
    expect(cats).toContain('Earrings');
    expect(cats).toContain('Rings');
    expect(cats).toContain('Bangles');
    expect(cats).toContain('Chains');
    expect(cats).toContain('Pendants');
    expect(cats).toContain('Gold coins');

    // Metal diversity
    const metals = Object.keys(report.metalDistribution);
    expect(metals).toContain('gold');
    expect(metals).toContain('diamond');
    expect(metals).toContain('silver');
    expect(metals).toContain('platinum');
  });

});
