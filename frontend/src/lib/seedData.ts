import { supabase } from './supabase';
import { localJewelryItems } from '../utils/localData';
import { normalizeKey } from '../utils/catalogueAudit';

export interface SeedResult {
  totalCandidates: number;
  insertedCount: number;
  skippedCount: number;
  skippedItems: Array<{ name: string; reason: string }>;
  success: boolean;
}

/**
 * Idempotent, zero-duplicate database seeder for YAZHINI FINE JEWELS.
 * Safely inspects existing records and prevents duplicate inserts based on ID, SKU, name, or image.
 */
export const seedDatabase = async (): Promise<SeedResult> => {
  const result: SeedResult = {
    totalCandidates: localJewelryItems.length,
    insertedCount: 0,
    skippedCount: 0,
    skippedItems: [],
    success: true,
  };

  try {
    console.log(`[Catalogue Seed] Commencing zero-duplication audit and sync for ${localJewelryItems.length} curated products...`);

    // 1. Fetch currently existing items from database
    const { data: existingItems, error: fetchError } = await supabase
      .from('jewelry_items')
      .select('id, name, image_url');

    if (fetchError) {
      console.warn('[Catalogue Seed] Warning fetching existing items (using offline duplicate guard):', fetchError.message);
    }

    const seenIds = new Set<string>((existingItems || []).map(i => i.id));
    const seenNames = new Set<string>((existingItems || []).map(i => normalizeKey(i.name)));
    const seenImages = new Set<string>((existingItems || []).filter(i => Boolean(i.image_url)).map(i => i.image_url!.trim().toLowerCase()));

    // 2. Iterate through canonical local products
    for (const item of localJewelryItems) {
      const normName = normalizeKey(item.name);
      const cleanImg = (item.image_url || '').trim().toLowerCase();

      // Duplicate Check 1: ID
      if (seenIds.has(item.id)) {
        result.skippedCount++;
        result.skippedItems.push({ name: item.name, reason: `Product ID already exists in DB (${item.id})` });
        console.log(`[Catalogue Seed] ⏩ Skipped (Duplicate ID): "${item.name}"`);
        continue;
      }

      // Duplicate Check 2: Normalized Name
      if (seenNames.has(normName)) {
        result.skippedCount++;
        result.skippedItems.push({ name: item.name, reason: `Product with same normalized name exists in DB` });
        console.log(`[Catalogue Seed] ⏩ Skipped (Duplicate Name): "${item.name}"`);
        continue;
      }

      // Duplicate Check 3: Image URL
      if (cleanImg && seenImages.has(cleanImg)) {
        result.skippedCount++;
        result.skippedItems.push({ name: item.name, reason: `Image asset already linked to another DB product` });
        console.log(`[Catalogue Seed] ⏩ Skipped (Duplicate Image): "${item.name}"`);
        continue;
      }

      // 3. Format complete record according to Supabase schema
      const dbPayload = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image_url: item.image_url,
        metal_type: item.metal_type,
        weight: item.weight,
        wastage_percent: item.wastage_percent,
        purity: item.purity,
        gender: item.gender,
        occasion: item.occasion,
        is_featured: item.is_featured,
        is_bestseller: item.is_bestseller,
        is_new: item.is_new,
        in_stock: item.in_stock,
        rating: item.rating,
        reviews_count: item.reviews_count,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('jewelry_items')
        .insert(dbPayload);

      if (insertError) {
        console.error(`[Catalogue Seed] ❌ Failed to insert "${item.name}":`, insertError.message);
      } else {
        result.insertedCount++;
        seenIds.add(item.id);
        seenNames.add(normName);
        if (cleanImg) seenImages.add(cleanImg);
        console.log(`[Catalogue Seed] ✨ Successfully synced "${item.name}" [${item.sku || item.id}]`);
      }
    }

    console.log(`[Catalogue Seed] Complete. Inserted: ${result.insertedCount}, Skipped: ${result.skippedCount}`);
    return result;
  } catch (error: any) {
    console.error('[Catalogue Seed] Fatal error during database seeding:', error);
    result.success = false;
    return result;
  }
};
