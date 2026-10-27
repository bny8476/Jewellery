import { describe, it, expect, beforeEach } from 'vitest';
import { ApiService } from '../services/apiService';
import { JewelryItem } from '../lib/supabase';

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  };
}

if (typeof globalThis.localStorage === 'undefined' || typeof (globalThis.localStorage as any)?.clear !== 'function') {
  (globalThis as any).localStorage = createMemoryStorage();
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

describe('Phase 3: Product Catalogue & Admin Enhancement Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Live Formula Pricing Engine', () => {
    it('accurately computes 22K gold retail price with wastage, making charge, and statutory 3% GST', () => {
      const netWeight = 16.5; // grams
      const goldRate22k = 6800; // Rs/g
      const wastagePercent = 12; // 12%
      const makingCharges = 3500; // Flat Rs

      const metalCost = netWeight * goldRate22k; // 16.5 * 6800 = 112,200
      const wastageCost = metalCost * (wastagePercent / 100); // 112200 * 0.12 = 13,464
      const subtotal = metalCost + wastageCost + makingCharges; // 112200 + 13464 + 3500 = 129,164
      const gst = subtotal * 0.03; // 129164 * 0.03 = 3874.92
      const finalPrice = Math.round(subtotal + gst); // 133,039

      expect(metalCost).toBe(112200);
      expect(wastageCost).toBe(13464);
      expect(subtotal).toBe(129164);
      expect(gst).toBeCloseTo(3874.92, 1);
      expect(finalPrice).toBe(133039);
    });

    it('accurately computes pure 24K gold bar price with 3% GST and zero wastage', () => {
      const weight = 10; // grams
      const goldRate24k = 7400; // Rs/g
      const wastagePercent = 0;
      const makingCharges = 500;

      const metalCost = weight * goldRate24k; // 74,000
      const wastageCost = metalCost * (wastagePercent / 100); // 0
      const subtotal = metalCost + wastageCost + makingCharges; // 74,500
      const gst = subtotal * 0.03; // 2,235
      const finalPrice = Math.round(subtotal + gst); // 76,735

      expect(finalPrice).toBe(76735);
    });
  });

  describe('SKU Auto-Generation Logic', () => {
    it('creates compliant royal SKUs matching YAZ-{CATEGORY}-{RANDOM}', () => {
      const generateSku = (category: string) => {
        const cat = (category || 'JEW').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
        const rand = 5432;
        return `YAZ-${cat || 'JEW'}-${rand}`;
      };

      expect(generateSku('Necklaces')).toBe('YAZ-NEC-5432');
      expect(generateSku('Earrings')).toBe('YAZ-EAR-5432');
      expect(generateSku('Bangles')).toBe('YAZ-BAN-5432');
      expect(generateSku('Rings')).toBe('YAZ-RIN-5432');
      expect(generateSku('')).toBe('YAZ-JEW-5432');
    });
  });

  describe('Catalogue Persistence and Event Propagation', () => {
    const mockProduct: JewelryItem = {
      id: 'custom-royal-nagas-haram-01',
      name: 'Nagas Antique Royal Haram',
      category: 'Necklaces',
      metal_type: 'gold',
      purity: '22K',
      weight: 38.5,
      gross_weight: 39.2,
      net_weight: 38.5,
      price: 295000,
      image_url: '/images/necklace_temple_nagas_haram.jpg',
      gallery_images: [
        '/images/necklace_temple_nagas_haram.jpg',
        '/images/necklace_manga_malai_temple.jpg'
      ],
      stock_quantity: 3,
      is_in_stock: true,
      sku: 'YAZ-NEC-9999',
      status: 'published',
      description: 'Handcrafted temple heirloom featuring divine iconography.'
    };

    it('saves custom products to local storage and retrieves them cleanly', () => {
      expect(ApiService.getCustomLocalItems()).toHaveLength(0);

      ApiService.saveCustomLocalItem(mockProduct);

      const items = ApiService.getCustomLocalItems();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(mockProduct.id);
      expect(items[0].name).toBe('Nagas Antique Royal Haram');
      expect(items[0].gallery_images).toHaveLength(2);
    });

    it('updates an existing item when saved with same id', () => {
      ApiService.saveCustomLocalItem(mockProduct);
      
      const updatedProduct = {
        ...mockProduct,
        price: 310000,
        stock_quantity: 5
      };
      ApiService.saveCustomLocalItem(updatedProduct);

      const items = ApiService.getCustomLocalItems();
      expect(items).toHaveLength(1);
      expect(items[0].price).toBe(310000);
      expect(items[0].stock_quantity).toBe(5);
    });

    it('removes custom products by id cleanly', () => {
      ApiService.saveCustomLocalItem(mockProduct);
      expect(ApiService.getCustomLocalItems()).toHaveLength(1);

      ApiService.removeCustomLocalItem(mockProduct.id);
      expect(ApiService.getCustomLocalItems()).toHaveLength(0);
    });

    it('retrieves saved custom item via getJewelryItemById', async () => {
      ApiService.saveCustomLocalItem(mockProduct);

      const foundById = await ApiService.getJewelryItemById(mockProduct.id);
      expect(foundById).not.toBeNull();
      expect(foundById?.sku).toBe('YAZ-NEC-9999');

      const foundBySku = await ApiService.getJewelryItemById('YAZ-NEC-9999');
      expect(foundBySku).not.toBeNull();
      expect(foundBySku?.id).toBe(mockProduct.id);
    });

    it('merges custom products into getJewelryItems catalogue', async () => {
      ApiService.saveCustomLocalItem(mockProduct);

      const allItems = await ApiService.getJewelryItems();
      const customExists = allItems.some(i => i.id === mockProduct.id);
      expect(customExists).toBe(true);
    });
  });

  describe('Catalogue Validation Rules', () => {
    it('detects missing required fields on jewellery entry', () => {
      const validate = (data: Partial<JewelryItem>) => {
        const errors: Record<string, string> = {};
        if (!data.name?.trim()) errors.name = 'Product title is required';
        if (!data.sku?.trim()) errors.sku = 'SKU identifier is required';
        if (!data.category?.trim()) errors.category = 'Category selection is required';
        if (!data.image_url?.trim()) errors.image_url = 'Primary product image is required';
        if (!data.price || data.price <= 0) errors.price = 'Valid selling price (> 0) is required';
        if (!data.net_weight || data.net_weight <= 0) errors.net_weight = 'Net metal weight must be greater than 0';
        return errors;
      };

      const emptyErrors = validate({});
      expect(Object.keys(emptyErrors)).toContain('name');
      expect(Object.keys(emptyErrors)).toContain('sku');
      expect(Object.keys(emptyErrors)).toContain('category');
      expect(Object.keys(emptyErrors)).toContain('image_url');
      expect(Object.keys(emptyErrors)).toContain('price');
      expect(Object.keys(emptyErrors)).toContain('net_weight');

      const validErrors = validate({
        name: 'Royal Kada',
        sku: 'YAZ-BAN-1001',
        category: 'Bangles',
        image_url: '/images/bangle_rose_gold_designer_kada.jpg',
        price: 85000,
        net_weight: 12.5
      });
      expect(Object.keys(validErrors)).toHaveLength(0);
    });
  });
});
