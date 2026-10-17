import { JewelryItem } from '../lib/supabase';

export interface DuplicateViolation {
  field: 'id' | 'sku' | 'name' | 'slug' | 'image_url';
  value: string;
  itemA: string;
  itemB: string;
}

export interface IncompleteFieldWarning {
  id: string;
  name: string;
  missingFields: string[];
}

export interface CatalogueAuditReport {
  timestamp: string;
  totalItemsScanned: number;
  uniqueProductsCount: number;
  duplicateViolationsCount: number;
  duplicateViolations: DuplicateViolation[];
  incompleteWarningsCount: number;
  incompleteWarnings: IncompleteFieldWarning[];
  categoryDistribution: Record<string, number>;
  metalDistribution: Record<string, number>;
  isValid: boolean;
}

/**
 * Normalizes strings for robust, deterministic duplicate detection
 */
export function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Derives a standard SEO slug for a product name
 */
export function getProductSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Audits a given collection of jewelry items for zero-duplication,
 * image integrity, category coverage, and specification completeness.
 */
export function auditCatalogue(items: JewelryItem[]): CatalogueAuditReport {
  const seenIds = new Map<string, JewelryItem>();
  const seenSkus = new Map<string, JewelryItem>();
  const seenNames = new Map<string, JewelryItem>();
  const seenSlugs = new Map<string, JewelryItem>();
  const seenImages = new Map<string, JewelryItem>();

  const duplicateViolations: DuplicateViolation[] = [];
  const incompleteWarnings: IncompleteFieldWarning[] = [];
  const categoryDistribution: Record<string, number> = {};
  const metalDistribution: Record<string, number> = {};

  for (const item of items) {
    // 1. Check ID uniqueness
    if (seenIds.has(item.id)) {
      duplicateViolations.push({
        field: 'id',
        value: item.id,
        itemA: seenIds.get(item.id)!.name,
        itemB: item.name
      });
    } else {
      seenIds.set(item.id, item);
    }

    // 2. Check SKU uniqueness if provided
    if (item.sku) {
      const normSku = normalizeKey(item.sku);
      if (seenSkus.has(normSku)) {
        duplicateViolations.push({
          field: 'sku',
          value: item.sku,
          itemA: seenSkus.get(normSku)!.name,
          itemB: item.name
        });
      } else {
        seenSkus.set(normSku, item);
      }
    }

    // 3. Check Name uniqueness (normalized)
    const normName = normalizeKey(item.name);
    if (seenNames.has(normName)) {
      duplicateViolations.push({
        field: 'name',
        value: item.name,
        itemA: seenNames.get(normName)!.name,
        itemB: item.name
      });
    } else {
      seenNames.set(normName, item);
    }

    // 4. Check Slug uniqueness
    const slug = getProductSlug(item.name);
    if (seenSlugs.has(slug)) {
      duplicateViolations.push({
        field: 'slug',
        value: slug,
        itemA: seenSlugs.get(slug)!.name,
        itemB: item.name
      });
    } else {
      seenSlugs.set(slug, item);
    }

    // 5. Check Image uniqueness (no unrelated product reusing another product's main image)
    if (item.image_url) {
      const cleanImg = item.image_url.trim().toLowerCase();
      if (seenImages.has(cleanImg)) {
        duplicateViolations.push({
          field: 'image_url',
          value: item.image_url,
          itemA: seenImages.get(cleanImg)!.name,
          itemB: item.name
        });
      } else {
        seenImages.set(cleanImg, item);
      }
    }

    // 6. Check Field Completeness
    const missing: string[] = [];
    if (!item.id) missing.push('id');
    if (!item.name) missing.push('name');
    if (item.price === undefined || item.price === null || item.price < 0) missing.push('price');
    if (!item.category) missing.push('category');
    if (!item.image_url) missing.push('image_url');
    if (!item.metal_type) missing.push('metal_type');
    if (item.weight === undefined || item.weight === null || item.weight <= 0) missing.push('weight');

    if (missing.length > 0) {
      incompleteWarnings.push({
        id: item.id || 'unknown',
        name: item.name || 'Unnamed Product',
        missingFields: missing
      });
    }

    // 7. Aggregate distributions
    const cat = item.category || 'Uncategorized';
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;

    const metal = item.metal_type || 'Unknown';
    metalDistribution[metal] = (metalDistribution[metal] || 0) + 1;
  }

  return {
    timestamp: new Date().toISOString(),
    totalItemsScanned: items.length,
    uniqueProductsCount: items.length - duplicateViolations.length,
    duplicateViolationsCount: duplicateViolations.length,
    duplicateViolations,
    incompleteWarningsCount: incompleteWarnings.length,
    incompleteWarnings,
    categoryDistribution,
    metalDistribution,
    isValid: duplicateViolations.length === 0 && incompleteWarnings.length === 0
  };
}

/**
 * Deterministically merges and deduplicates an incoming array of products against an existing base.
 * Retains original items and rejects any candidates that duplicate ID, SKU, Name, Slug, or Image.
 */
export function deduplicateAndMerge(
  existingItems: JewelryItem[],
  incomingCandidates: JewelryItem[]
): {
  merged: JewelryItem[];
  insertedCount: number;
  skippedCount: number;
  skippedReasons: Array<{ name: string; reason: string }>;
} {
  const merged = [...existingItems];
  const seenIds = new Set(existingItems.map(i => i.id));
  const seenSkus = new Set(existingItems.filter(i => Boolean(i.sku)).map(i => normalizeKey(i.sku!)));
  const seenNames = new Set(existingItems.map(i => normalizeKey(i.name)));
  const seenImages = new Set(existingItems.filter(i => Boolean(i.image_url)).map(i => i.image_url!.trim().toLowerCase()));

  let insertedCount = 0;
  let skippedCount = 0;
  const skippedReasons: Array<{ name: string; reason: string }> = [];

  for (const candidate of incomingCandidates) {
    if (seenIds.has(candidate.id)) {
      skippedCount++;
      skippedReasons.push({ name: candidate.name, reason: `Duplicate ID: ${candidate.id}` });
      continue;
    }

    if (candidate.sku && seenSkus.has(normalizeKey(candidate.sku))) {
      skippedCount++;
      skippedReasons.push({ name: candidate.name, reason: `Duplicate SKU: ${candidate.sku}` });
      continue;
    }

    const normName = normalizeKey(candidate.name);
    if (seenNames.has(normName)) {
      skippedCount++;
      skippedReasons.push({ name: candidate.name, reason: `Duplicate Product Name: ${candidate.name}` });
      continue;
    }

    if (candidate.image_url && seenImages.has(candidate.image_url.trim().toLowerCase())) {
      skippedCount++;
      skippedReasons.push({ name: candidate.name, reason: `Duplicate Image URL: ${candidate.image_url}` });
      continue;
    }

    // Passed all duplicate checks
    merged.push(candidate);
    seenIds.add(candidate.id);
    if (candidate.sku) seenSkus.add(normalizeKey(candidate.sku));
    seenNames.add(normName);
    if (candidate.image_url) seenImages.add(candidate.image_url.trim().toLowerCase());
    insertedCount++;
  }

  return {
    merged,
    insertedCount,
    skippedCount,
    skippedReasons
  };
}
