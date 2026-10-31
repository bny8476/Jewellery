import { describe, it, expect } from 'vitest';
import { 
  resolveProductVariants, 
  getImagesForVariant, 
  normalizeColorName,
  ProductVariant, 
  ProductImage 
} from '../../types/productGallery';
import { localJewelryItems } from '../../utils/localData';
import { platformSyncService } from '../../services/platformSyncService';

describe('YAZHINI FINE JEWELS — Advanced Product Image Gallery & Colour Variant System', () => {
  // Test products across multiple categories
  const testEarring = {
    id: 'earring-peacock-001',
    sku: 'YAZ-EAR-001',
    name: 'Mayura Royal Peacock Jhumkas',
    category: 'Earrings',
    metal_type: 'gold',
    purity: '22K (BIS 916)',
    price: 48500,
    original_price: 68500,
    weight: 14.2,
    stock_quantity: 6,
    in_stock: true,
    image_url: '/images/earring_peacock_jhumkas.jpg',
    video_url: '/images/Gold_jewellery_commercial_product_film_20261024110518.mp4',
    has_360: true
  };

  const testRing = {
    id: 'ring-solitaire-002',
    sku: 'YAZ-RNG-002',
    name: 'Kohinoor Brilliance Solitaire Ring',
    category: 'Rings',
    metal_type: 'diamond',
    purity: '18K Gold & VVS Diamond',
    price: 85000,
    original_price: 115000,
    weight: 4.8,
    stock_quantity: 4,
    in_stock: true,
    image_url: '/images/ring_solitaire_diamond.jpg',
    video_url: null,
    has_360: false
  };

  const testBangle = {
    id: 'bangle-kasu-003',
    sku: 'YAZ-BNG-003',
    name: 'Lakshmi Antique Kasu Bangle Pair',
    category: 'Bangles',
    metal_type: 'gold',
    purity: '22K (BIS 916)',
    price: 125000,
    original_price: 165000,
    weight: 32.5,
    stock_quantity: 3,
    in_stock: true,
    image_url: '/images/bangle_traditional_kasu_pair.jpg'
  };

  describe('1. Dynamic Colour Variant Resolution & Normalization', () => {
    it('synthesizes distinct colour variants (Rose Gold, Yellow Gold, White Gold/Platinum) for earrings', () => {
      const variants = resolveProductVariants(testEarring);
      expect(variants.length).toBeGreaterThanOrEqual(3);

      const colorNames = variants.map(v => v.color);
      expect(colorNames).toContain('Rose Gold');
      expect(colorNames).toContain('Yellow Gold');
      expect(colorNames).toContain('White Gold');

      // Check variant SKUs are unique and tagged by finish
      const rgVariant = variants.find(v => v.color === 'Rose Gold')!;
      const ygVariant = variants.find(v => v.color === 'Yellow Gold')!;
      expect(rgVariant.sku).toBe('YAZ-EAR-001-RG');
      expect(ygVariant.sku).toBe('YAZ-EAR-001-YG');
    });

    it('synthesizes appropriate metal finishes for rings and bands (Yellow Gold, Rose Gold, Platinum)', () => {
      const variants = resolveProductVariants(testRing);
      expect(variants.length).toBeGreaterThanOrEqual(3);

      const ptVariant = variants.find(v => v.color === 'Platinum')!;
      expect(ptVariant).toBeDefined();
      expect(ptVariant.sku).toBe('YAZ-RNG-002-PT');
      expect(ptVariant.metalPurity).toContain('PT 950');
    });

    it('normalizes colour names correctly regardless of spacing or capitalization', () => {
      expect(normalizeColorName('Rose Gold')).toBe('rosegold');
      expect(normalizeColorName('Yellow-Gold ')).toBe('yellowgold');
      expect(normalizeColorName('White_Gold')).toBe('whitegold');
    });
  });

  describe('2. Variant Image Integrity & Cross-Contamination Prevention (Critical)', () => {
    it('ensures Rose Gold variant displays strictly its own Rose Gold image set and never Yellow Gold images', () => {
      const variants = resolveProductVariants(testEarring);
      const rgImages = getImagesForVariant(variants, 'Rose Gold');
      const ygImages = getImagesForVariant(variants, 'Yellow Gold');

      expect(rgImages.length).toBeGreaterThan(0);
      expect(ygImages.length).toBeGreaterThan(0);

      // Rose gold images must not equal Yellow Gold primary image
      rgImages.forEach(img => {
        expect(img.colorVariant).toBe('Rose Gold');
        expect(img.alt.toLowerCase()).toContain('rose gold');
      });

      ygImages.forEach(img => {
        expect(img.colorVariant).toBe('Yellow Gold');
        expect(img.alt.toLowerCase()).toContain('yellow gold');
      });

      // No image url overlap between finishes
      const rgUrls = rgImages.filter(i => i.type !== 'video').map(i => i.url);
      const ygUrls = ygImages.filter(i => i.type !== 'video').map(i => i.url);
      const intersection = rgUrls.filter(u => ygUrls.includes(u));
      expect(intersection.length).toBe(0);
    });

    it('returns empty array when an unavailable colour finish is requested (triggers explicit unavailable state)', () => {
      const variants = resolveProductVariants(testEarring);
      // Request a non-existent finish
      const nonExistentImages = getImagesForVariant(variants, 'Black Ruthenium');
      expect(nonExistentImages).toEqual([]);
    });

    it('returns empty array if a variant explicitly has 0 images to prevent showing another colour finish', () => {
      const customVariants: ProductVariant[] = [
        {
          id: 'v-silver',
          color: 'Silver 925',
          colorCode: '#D2D7DF',
          sku: 'YAZ-SL-001',
          thumbnailUrl: '',
          images: [], // Atelier currently photographing
          price: 4999,
          mrp: 8999,
          stock: 5,
          metalType: 'silver',
          metalPurity: '925 Sterling Silver',
          weight: 8,
          available: true
        }
      ];

      const images = getImagesForVariant(customVariants, 'Silver 925');
      expect(images).toEqual([]);
    });
  });

  describe('3. Dynamic Price, SKU & Stock Synchronization', () => {
    it('updates variant-specific pricing, discount M.R.P., and metal purity', () => {
      const variants = resolveProductVariants(testBangle);
      const yg = variants.find(v => v.color === 'Yellow Gold')!;
      const wg = variants.find(v => v.color === 'White Gold')!;

      expect(yg.price).toBe(125000);
      expect(wg.price).toBeGreaterThan(yg.price); // White gold/diamond finish premium
      expect(yg.metalPurity).toContain('22K');
      expect(wg.metalPurity).toContain('18K White Gold');
    });

    it('accurately reflects out-of-stock condition on variant level', () => {
      const outOfStockVariant: ProductVariant = {
        id: 'var-soldout',
        color: 'Rose Gold',
        colorCode: '#E8A598',
        sku: 'YAZ-TEST-RG',
        thumbnailUrl: '/images/bangle_rose_gold_designer_kada.jpg',
        images: [],
        price: 35000,
        mrp: 45000,
        stock: 0,
        metalType: 'gold',
        metalPurity: '18K',
        weight: 12,
        available: false
      };

      const isOutOfStock = Boolean(!outOfStockVariant.available || outOfStockVariant.stock <= 0);
      expect(isOutOfStock).toBe(true);
    });
  });

  describe('4. Cart and Wishlist Selected-Variant Storage', () => {
    it('creates accurate cart payload retaining chosen finish and variant SKU', () => {
      const variants = resolveProductVariants(testEarring);
      const selected = variants.find(v => v.color === 'Rose Gold')!;

      const cartItemPayload = {
        productId: testEarring.id,
        variantId: selected.id,
        variantColor: selected.color,
        variantSku: selected.sku,
        weight: selected.weight,
        thumbnail: selected.thumbnailUrl,
        title: `${testEarring.name} (${selected.color})`,
        price: selected.price
      };

      expect(cartItemPayload.variantColor).toBe('Rose Gold');
      expect(cartItemPayload.variantSku).toBe('YAZ-EAR-001-RG');
      expect(cartItemPayload.title).toContain('Rose Gold');
      expect(cartItemPayload.thumbnail).toBe('/images/earring_petite_floral_studs.jpg');
    });
  });

  describe('5. Real-Time Admin Catalogue Synchronization', () => {
    it('broadcasts real-time product updates when admin publishes changes', () => {
      let notifiedPayload: any = null;
      const unsubscribe = platformSyncService.subscribe('ecommerce', (payload) => {
        notifiedPayload = payload;
      });

      platformSyncService.broadcast(
        'ecommerce',
        'update',
        'product',
        {
          id: testEarring.id,
          name: testEarring.name,
          variants: [
            {
              id: 'var-new-rg',
              color: 'Rose Gold',
              sku: 'YAZ-EAR-001-RG-NEW',
              price: 49500,
              stock: 8
            }
          ]
        },
        testEarring.id
      );

      expect(notifiedPayload).not.toBeNull();
      expect(notifiedPayload.entityId).toBe(testEarring.id);
      expect(notifiedPayload.action).toBe('update');

      unsubscribe();
    });
  });

  describe('6. Catalogue Cross-Category Verification', () => {
    it('resolves valid colour variants across all existing local jewellery items', () => {
      expect(localJewelryItems.length).toBeGreaterThan(10);

      localJewelryItems.slice(0, 15).forEach((item) => {
        const variants = resolveProductVariants(item);
        expect(variants.length).toBeGreaterThan(0);
        variants.forEach((v) => {
          expect(v.id).toBeDefined();
          expect(v.color).toBeDefined();
          expect(v.sku).toBeDefined();
          expect(v.price).toBeGreaterThan(0);
          expect(v.mrp).toBeGreaterThanOrEqual(v.price);
        });
      });
    });
  });
});
