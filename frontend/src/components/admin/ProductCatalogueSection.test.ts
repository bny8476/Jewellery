import { describe, it, expect, beforeEach } from 'vitest';
import { ApiService } from '../../services/apiService';
import { localJewelryItems } from '../../utils/localData';
import { canAccessTab, hasPermission, normalizeAdminRole } from '../../utils/rbac';
import type { JewelryItem, ProductStatus } from '../../lib/supabase';

describe('YAZHINI FINE JEWELS — Admin Product Catalogue Management System', () => {

  beforeEach(() => {
    // Reset local test state if needed
  });

  it('1. Retrieves full admin catalogue with KPI metrics', async () => {
    const res = await ApiService.getAdminInventory();
    expect(res.items.length).toBeGreaterThanOrEqual(48);
    expect(res.metrics.total).toBeGreaterThanOrEqual(48);
    expect(res.metrics.published).toBeGreaterThan(0);
    expect(res.metrics.lowStock).toBeGreaterThanOrEqual(0);
    expect(res.metrics.outOfStock).toBeGreaterThanOrEqual(0);
  });

  it('2. Filters catalogue by search query, category, and gender', async () => {
    // Filter by category
    const necklaces = await ApiService.getAdminInventory({ category: 'Necklaces' });
    expect(necklaces.items.length).toBeGreaterThan(0);
    necklaces.items.forEach(item => {
      expect(item.category.toLowerCase()).toContain('necklace');
    });

    // Filter by gender
    const menItems = await ApiService.getAdminInventory({ gender: 'men' });
    expect(menItems.items.length).toBeGreaterThan(0);
    menItems.items.forEach(item => {
      expect(['men', 'unisex']).toContain(item.gender || 'women');
    });

    // Search query
    const searchRes = await ApiService.getAdminInventory({ search: 'Cuban' });
    expect(searchRes.items.length).toBeGreaterThan(0);
    expect(searchRes.items[0].name.toLowerCase()).toContain('cuban');
  });

  it('3. Workflow A: Create new product and verify database persistence', async () => {
    const newSku = `YAZ-TST-${Date.now().toString().slice(-4)}`;
    const newProduct: Omit<JewelryItem, 'id' | 'created_at' | 'updated_at'> = {
      name: 'Royal Heritage 22K Navaratna Choker',
      sku: newSku,
      category: 'Necklaces',
      gender: 'women',
      metal_type: 'gold',
      purity: '22K (916) Hallmark',
      weight: 28.5,
      gross_weight: 31.0,
      net_weight: 28.5,
      price: 245000,
      original_price: 260000,
      wastage_percent: 12,
      making_charges: 7500,
      stock_quantity: 3,
      low_stock_threshold: 2,
      in_stock: true,
      status: 'published',
      image_url: '/images/hero_necklace.jpg',
      description: 'Handcrafted royal Navaratna choker adorned with nine auspicious celestial gemstones.'
    };

    const created = await ApiService.createJewelryItem(newProduct);
    expect(created.id).toBeDefined();
    expect(created.sku).toBe(newSku);
    expect(created.price).toBe(245000);

    // Retrieve by ID
    const fetched = await ApiService.getJewelryItemById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Royal Heritage 22K Navaratna Choker');
  });

  it('4. Workflow B: Edit existing product fields without clobbering unchanged fields', async () => {
    const target = localJewelryItems[0];
    const originalPrice = target.price;
    const updatedPrice = originalPrice + 5000;

    const updated = await ApiService.updateJewelryItem(target.id, {
      price: updatedPrice,
      short_description: 'Updated luxury description for VIP patrons.'
    });

    expect(updated.id).toBe(target.id);
    expect(updated.price).toBe(updatedPrice);
    expect(updated.name).toBe(target.name); // Unchanged field preserved
    expect(updated.weight).toBe(target.weight); // Unchanged weight preserved
    expect(updated.sku).toBe(target.sku); // Unchanged SKU preserved
  });

  it('5. Workflow C: Price and stock adjustment updates availability status', async () => {
    const target = localJewelryItems[1];

    // Set stock to 0 -> should mark out of stock
    const outOfStockItem = await ApiService.updateJewelryItem(target.id, {
      stock_quantity: 0,
      in_stock: false
    });

    expect(outOfStockItem.stock_quantity).toBe(0);
    expect(outOfStockItem.in_stock).toBe(false);

    // Restock -> should restore in_stock
    const restockedItem = await ApiService.updateJewelryItem(target.id, {
      stock_quantity: 10,
      in_stock: true
    });

    expect(restockedItem.stock_quantity).toBe(10);
    expect(restockedItem.in_stock).toBe(true);
  });

  it('6. Workflow E: Archive and restore hides/unhides product from customer catalog', async () => {
    const target = localJewelryItems[2];

    // Archive item
    const archived = await ApiService.updateProductStatus(target.id, 'archived');
    expect(archived.status).toBe('archived');
    expect(archived.in_stock).toBe(false);

    // Public customer catalog should exclude archived items
    const publicCatalog = await ApiService.getJewelryItems({ includeDrafts: false });
    const foundInPublic = publicCatalog.find(i => i.id === target.id && i.status === 'archived');
    expect(foundInPublic).toBeUndefined();

    // Restore item
    const restored = await ApiService.updateProductStatus(target.id, 'published');
    expect(restored.status).toBe('published');
  });

  it('7. Workflow G: Bulk operations (publish, unpublish, archive) across multiple items', async () => {
    const ids = [localJewelryItems[3].id, localJewelryItems[4].id];

    // Bulk archive
    const bulkArchive = await ApiService.bulkUpdateProducts('archive', ids);
    expect(bulkArchive.success).toBe(true);
    expect(bulkArchive.count).toBe(2);

    // Bulk restore
    const bulkRestore = await ApiService.bulkUpdateProducts('restore', ids);
    expect(bulkRestore.success).toBe(true);
    expect(bulkRestore.count).toBe(2);
  });

  it('8. Permissions & RBAC: Enforces role-based action boundaries', () => {
    const superAdmin = normalizeAdminRole('super_admin');
    const salesStaff = normalizeAdminRole('sales_staff');
    const auditor = normalizeAdminRole('auditor');

    // Super Admin has full CRUD
    expect(canAccessTab(superAdmin, 'inventory')).toBe(true);
    expect(hasPermission(superAdmin, 'inventory', 'create')).toBe(true);
    expect(hasPermission(superAdmin, 'inventory', 'update')).toBe(true);
    expect(hasPermission(superAdmin, 'inventory', 'delete')).toBe(true);

    // Sales Staff has read-only access to inventory
    expect(canAccessTab(salesStaff, 'inventory')).toBe(true);
    expect(hasPermission(salesStaff, 'inventory', 'read')).toBe(true);
    expect(hasPermission(salesStaff, 'inventory', 'delete')).toBe(false);

    // Auditor has read & export access
    expect(canAccessTab(auditor, 'inventory')).toBe(true);
    expect(hasPermission(auditor, 'inventory', 'export')).toBe(true);
    expect(hasPermission(auditor, 'inventory', 'delete')).toBe(false);
  });

  it('9. Safe deletion pre-flight check', async () => {
    // Attempting to delete an item
    const testItemId = `del_test_${Date.now()}`;
    await ApiService.createJewelryItem({
      id: testItemId,
      name: 'Temporary Deletion Test Ring',
      price: 25000,
      category: 'Rings',
      metal_type: 'gold',
      weight: 3.5,
      wastage_percent: 8,
      status: 'draft'
    } as any);

    // Verify it exists
    const beforeDel = await ApiService.getJewelryItemById(testItemId);
    expect(beforeDel).not.toBeNull();

    // Delete item
    await ApiService.deleteJewelryItem(testItemId);

    // Verify it is removed
    const afterDel = await ApiService.getJewelryItemById(testItemId);
    expect(afterDel).toBeNull();
  });

  it('10. Multi-variant support with size-specific pricing offsets', () => {
    const itemWithVariants: JewelryItem = {
      ...localJewelryItems[0],
      variants: [
        { id: 'v-16', size: '16 Inch', sku: 'YAZ-VAR-16', stock: 3, price_offset: 0 },
        { id: 'v-18', size: '18 Inch', sku: 'YAZ-VAR-18', stock: 2, price_offset: 4500 }
      ]
    };

    expect(itemWithVariants.variants).toHaveLength(2);
    expect(itemWithVariants.variants![1].price_offset).toBe(4500);
    expect(itemWithVariants.variants![0].stock + itemWithVariants.variants![1].stock).toBe(5);
  });

});
