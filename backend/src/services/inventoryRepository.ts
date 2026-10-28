import { memoryStore } from '../db.ts';
import { localJewelryItems } from '../data/seedInventory.ts';

// Ensure memoryStore.jewelry_items is initialized with seed items
if (!memoryStore.jewelry_items || memoryStore.jewelry_items.length === 0) {
  memoryStore.jewelry_items = localJewelryItems.map(item => ({
    ...item,
    status: item.status || 'published',
    in_stock: item.in_stock !== false,
    stock_quantity: typeof item.stock_quantity === 'number' ? item.stock_quantity : (item.in_stock !== false ? 5 : 0),
    low_stock_threshold: item.low_stock_threshold || 3
  }));
}

if (!memoryStore.audit_logs) {
  memoryStore.audit_logs = [];
}

export interface InventoryMetrics {
  total: number;
  published: number;
  draft: number;
  archived: number;
  outOfStock: number;
  lowStock: number;
}

export function computeInventoryMetrics(items: any[]): InventoryMetrics {
  const total = items.length;
  const published = items.filter(i => (i.status || 'published') === 'published').length;
  const draft = items.filter(i => i.status === 'draft').length;
  const archived = items.filter(i => i.status === 'archived').length;
  const outOfStock = items.filter(i => i.in_stock === false || (i.stock_quantity ?? 0) <= 0).length;
  const lowStock = items.filter(i => (i.stock_quantity ?? 0) > 0 && (i.stock_quantity ?? 0) <= (i.low_stock_threshold ?? 3)).length;
  return { total, published, draft, archived, outOfStock, lowStock };
}

export function getLocalInventory(query: Record<string, any>, isStaff: boolean): { items: any[]; metrics?: InventoryMetrics } {
  let items: any[] = [...(memoryStore.jewelry_items || [])];

  // Status filtering
  if (!isStaff) {
    items = items.filter(i => i.status !== 'archived' && i.status !== 'draft');
  } else if (query.status && query.status !== 'all') {
    const s = String(query.status).toLowerCase();
    items = items.filter(i => (i.status || 'published').toLowerCase() === s);
  }

  // Category filtering
  if (query.category && query.category !== 'All') {
    const cat = String(query.category).toLowerCase();
    items = items.filter(i => (i.category || '').toLowerCase().includes(cat));
  }

  // Gender filtering
  if (query.gender && query.gender !== 'All') {
    const g = String(query.gender).toLowerCase();
    if (g === 'men' || g === 'mens') {
      items = items.filter(i => i.gender === 'men' || i.gender === 'unisex');
    } else if (g === 'women' || g === 'womens') {
      items = items.filter(i => i.gender === 'women' || i.gender === 'unisex');
    } else if (g === 'unisex') {
      items = items.filter(i => i.gender === 'unisex');
    } else {
      items = items.filter(i => (i.gender || '').toLowerCase() === g);
    }
  }

  // Metal type filtering
  if (query.metal_type && query.metal_type !== 'All') {
    const m = String(query.metal_type).toLowerCase();
    items = items.filter(i => (i.metal_type || '').toLowerCase() === m);
  }

  // Collection filtering
  if (query.collection && query.collection !== 'All') {
    const col = String(query.collection).toLowerCase();
    items = items.filter(i => (i.collection || '').toLowerCase().includes(col));
  }

  // Stock status filtering
  if (query.stock_status === 'out_of_stock') {
    items = items.filter(i => i.in_stock === false || (i.stock_quantity ?? 0) <= 0);
  } else if (query.stock_status === 'low_stock') {
    items = items.filter(i => (i.stock_quantity ?? 0) > 0 && (i.stock_quantity ?? 0) <= (i.low_stock_threshold ?? 3));
  } else if (query.stock_status === 'in_stock' || query.in_stock === 'true') {
    items = items.filter(i => i.in_stock === true && (i.stock_quantity ?? 0) > 0);
  }

  // Search filter
  if (query.search) {
    const s = String(query.search).trim().toLowerCase();
    items = items.filter(i =>
      (i.name || '').toLowerCase().includes(s) ||
      (i.sku || '').toLowerCase().includes(s) ||
      (i.category || '').toLowerCase().includes(s) ||
      (i.collection || '').toLowerCase().includes(s) ||
      (i.description || '').toLowerCase().includes(s)
    );
  }

  // Sorting
  if (query.sort === 'price_asc' || query.sort === 'price-asc') {
    items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (query.sort === 'price_desc' || query.sort === 'price-desc') {
    items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (query.sort === 'rating') {
    items.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  } else if (query.sort === 'stock_asc') {
    items.sort((a, b) => (Number(a.stock_quantity) || 0) - (Number(b.stock_quantity) || 0));
  } else if (query.sort === 'name_asc') {
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    // Default newest
    items.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  const metrics = isStaff ? computeInventoryMetrics(memoryStore.jewelry_items || []) : undefined;

  return { items, metrics };
}

export function getLocalItemById(idOrSku: string): any | null {
  const all: any[] = memoryStore.jewelry_items || [];
  const target = decodeURIComponent(idOrSku).trim().toLowerCase();
  
  // 1. Exact ID
  let item = all.find(i => String(i.id).toLowerCase() === target);
  if (item) return item;

  // 2. Exact SKU
  item = all.find(i => String(i.sku || '').toLowerCase() === target);
  if (item) return item;

  // 3. Name substring
  const searchName = target.replace(/[-_]/g, ' ');
  item = all.find(i => (i.name || '').toLowerCase().includes(searchName));
  return item || null;
}

export function createLocalItem(itemData: any): any {
  const all: any[] = memoryStore.jewelry_items || [];
  const now = new Date().toISOString();
  const id = itemData.id || `item-local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let sku = itemData.sku?.trim();
  if (!sku) {
    const prefix = (itemData.category || 'JEW').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    sku = `YAZ-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const newItem = {
    ...itemData,
    id,
    sku,
    status: itemData.status || 'published',
    in_stock: itemData.in_stock !== false && (Number(itemData.stock_quantity) || 0) > 0,
    stock_quantity: Number(itemData.stock_quantity) || 1,
    weight: Number(itemData.weight) || 0,
    gross_weight: Number(itemData.gross_weight) || Number(itemData.weight) || 0,
    wastage_percent: Number(itemData.wastage_percent) || 0,
    making_charges: Number(itemData.making_charges) || 0,
    created_at: itemData.created_at || now,
    updated_at: now
  };

  all.unshift(newItem);
  return newItem;
}

export function updateLocalItem(id: string, updates: any): any | null {
  const all: any[] = memoryStore.jewelry_items || [];
  const index = all.findIndex(i => String(i.id) === String(id));
  if (index === -1) return null;

  const now = new Date().toISOString();
  const existing = all[index];
  const updated = {
    ...existing,
    ...updates,
    id: existing.id,
    updated_at: now
  };

  if (typeof updates.stock_quantity === 'number') {
    updated.in_stock = updates.stock_quantity > 0;
  }

  all[index] = updated;
  return updated;
}

export function bulkUpdateLocalItems(ids: string[], action: string, data?: any): number {
  const all: any[] = memoryStore.jewelry_items || [];
  const idSet = new Set(ids.map(String));
  const now = new Date().toISOString();
  let updatedCount = 0;

  for (let i = 0; i < all.length; i++) {
    if (idSet.has(String(all[i].id))) {
      if (action === 'publish') {
        all[i] = { ...all[i], status: 'published', updated_at: now };
        updatedCount++;
      } else if (action === 'unpublish') {
        all[i] = { ...all[i], status: 'draft', updated_at: now };
        updatedCount++;
      } else if (action === 'archive') {
        all[i] = { ...all[i], status: 'archived', in_stock: false, updated_at: now };
        updatedCount++;
      } else if (action === 'restore') {
        all[i] = { ...all[i], status: 'published', updated_at: now };
        updatedCount++;
      } else if (action === 'category' && data?.category) {
        all[i] = { ...all[i], category: data.category, updated_at: now };
        updatedCount++;
      }
    }
  }

  return updatedCount;
}

export function deleteLocalItem(id: string): any | null {
  const all: any[] = memoryStore.jewelry_items || [];
  const index = all.findIndex(i => String(i.id) === String(id));
  if (index === -1) return null;

  const [removed] = all.splice(index, 1);
  return removed;
}

export function recordLocalAudit(entry: any) {
  if (!memoryStore.audit_logs) {
    memoryStore.audit_logs = [];
  }
  memoryStore.audit_logs.push({
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString()
  });
}
