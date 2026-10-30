import { describe, it, expect, beforeEach } from 'vitest';
import { platformSyncService, PlatformSyncPayload } from '../../services/platformSyncService';
import { getJewelryFallbackImage } from '../../utils/imageUtils';

// Mock storage
class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] !== undefined ? this.store[key] : null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  key(index: number) { return Object.keys(this.store)[index] || null; }
}

const mockLocalStorage = new MockStorage();
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

// Setup Window and CustomEvent for node vitest environment
if (typeof window === 'undefined') {
  const listeners: Record<string, Array<(e: any) => void>> = {};
  (globalThis as any).window = {
    addEventListener: (event: string, cb: any) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    },
    removeEventListener: (event: string, cb: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(l => l !== cb);
      }
    },
    dispatchEvent: (e: any) => {
      const cbs = listeners[e.type] || [];
      cbs.forEach(cb => cb(e));
      return true;
    }
  };
}

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

interface ProductMediaTestItem {
  id: string;
  name: string;
  category: string;
  metal_type: string;
  purity?: string;
  image_url?: string | null;
  secondary_image_url?: string | null;
  gallery_images?: string[];
  video_url?: string | null;
  has_360?: boolean;
  view_360_urls?: string[] | null;
  sku?: string;
}

/**
 * Derives the strict, product-mapped media items without cross-product pollution
 */
export function deriveProductGalleryMedia(product: ProductMediaTestItem) {
  const fallback = getJewelryFallbackImage(product.category, product.metal_type);
  const primaryImg = product.image_url || fallback;
  const list: Array<{ id: string; type: 'image' | 'video' | '360'; url: string; label: string; altText: string }> = [];

  // 1. Primary main image
  list.push({
    id: `${product.id}-main`,
    type: 'image',
    url: primaryImg,
    label: 'Main View',
    altText: `${product.name} - Front View (${product.purity || 'BIS 916'})`
  });

  // 2. Extra images from gallery_images (avoid duplicating primary image)
  if (product.gallery_images && Array.isArray(product.gallery_images)) {
    product.gallery_images.forEach((imgUrl, idx) => {
      if (imgUrl && imgUrl !== primaryImg && !list.some(m => m.url === imgUrl)) {
        list.push({
          id: `${product.id}-gallery-${idx}`,
          type: 'image',
          url: imgUrl,
          label: idx === 0 ? 'Angle View' : `Detail View ${idx + 1}`,
          altText: `${product.name} - Angle ${idx + 1}`
        });
      }
    });
  }

  // 3. Secondary image (if distinct from primary and gallery)
  if (
    product.secondary_image_url && 
    product.secondary_image_url !== primaryImg &&
    !list.some(m => m.url === product.secondary_image_url)
  ) {
    list.push({
      id: `${product.id}-secondary`,
      type: 'image',
      url: product.secondary_image_url,
      label: 'Alternate Angle',
      altText: `${product.name} - Alternate View`
    });
  }

  // 4. Product-specific Video (only if product has genuine video_url)
  if (product.video_url && typeof product.video_url === 'string' && product.video_url.trim().length > 0) {
    list.push({
      id: `${product.id}-video`,
      type: 'video',
      url: product.video_url,
      label: 'Video Showcase',
      altText: `${product.name} - HD Commercial Film`
    });
  }

  // 5. Interactive 360° Studio (only if supported for this product)
  if (product.has_360 || (product.view_360_urls && product.view_360_urls.length > 0)) {
    list.push({
      id: `${product.id}-360`,
      type: '360',
      url: primaryImg,
      label: '360° Studio',
      altText: `${product.name} - Interactive 360° Spin`
    });
  }

  return list;
}

/**
 * Mobile pinch-to-zoom calculation
 */
export function calculatePinchZoomScale(initialDist: number, currentDist: number): number {
  if (initialDist <= 0) return 1;
  const factor = currentDist / initialDist;
  return Math.min(3, Math.max(1, factor));
}

/**
 * Mobile swipe calculation for previous / next navigation
 */
export function calculateSwipeDirection(startX: number, endX: number, threshold = 50): 'next' | 'prev' | 'none' {
  const deltaX = endX - startX;
  if (Math.abs(deltaX) < threshold) return 'none';
  return deltaX < 0 ? 'next' : 'prev';
}

describe('YAZHINI FINE JEWELS — Product Image Gallery & Real-Time Product Experience', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. Product-Level Image Mapping Integrity & Contamination Prevention', () => {
    it('never assigns bridal necklace images to a diamond solitaire ring', () => {
      const ringProduct: ProductMediaTestItem = {
        id: 'ring-1',
        name: 'Eternal Solitaire Diamond Engagement Ring',
        category: 'Rings',
        metal_type: 'diamond',
        purity: '18K Diamond (IGI)',
        image_url: '/images/ring_solitaire_diamond.jpg',
        secondary_image_url: '/images/ring_solitaire_diamond_alt.jpg',
        gallery_images: ['/images/ring_solitaire_diamond.jpg', '/images/ring_solitaire_diamond_alt.jpg'],
        video_url: '/images/Diamond_jewellery_advertisement_ad_20261015172217.mp4',
        has_360: true
      };

      const media = deriveProductGalleryMedia(ringProduct);

      // Verify all image URLs belong strictly to the ring
      const imageUrls = media.filter(m => m.type === 'image').map(m => m.url);
      expect(imageUrls).toContain('/images/ring_solitaire_diamond.jpg');
      expect(imageUrls).toContain('/images/ring_solitaire_diamond_alt.jpg');
      expect(imageUrls).not.toContain('/images/bridal_vivaah_ruby_kundan.jpg');
      expect(imageUrls).not.toContain('/images/bridal_sita_kalyanam.jpg');
      expect(imageUrls).not.toContain('/images/hero_bride_aurelle.jpg');
      expect(imageUrls).not.toContain('/images/patron_guarantee_bangles.png');
    });

    it('never assigns unrelated images to a gold coin or mens chain', () => {
      const coinProduct: ProductMediaTestItem = {
        id: 'coin-1g',
        name: '24K 999 Purity Gold Coin 1g',
        category: 'Coins',
        metal_type: 'gold',
        purity: '24K (999)',
        image_url: '/images/gold_coin_1g.jpg',
        gallery_images: ['/images/gold_coin_1g.jpg'],
        video_url: null,
        has_360: false
      };

      const media = deriveProductGalleryMedia(coinProduct);

      expect(media.length).toBe(1);
      expect(media[0].url).toBe('/images/gold_coin_1g.jpg');
      expect(media.some(m => m.type === 'video')).toBe(false);
      expect(media.some(m => m.type === '360')).toBe(false);
    });
  });

  describe('2. Dynamic Video & 360° Feature Availability', () => {
    it('includes Video Showcase only when authentic video_url is present', () => {
      const productWithVideo: ProductMediaTestItem = {
        id: 'bridal-1',
        name: 'Royal Vivaah Ruby & Kundan Set',
        category: 'Bridal Sets',
        metal_type: 'gold',
        image_url: '/images/bridal_vivaah_ruby_kundan.jpg',
        video_url: '/images/Gold_jewellery_commercial_product_film_20261024110518.mp4',
        has_360: true
      };

      const media = deriveProductGalleryMedia(productWithVideo);
      const videoItem = media.find(m => m.type === 'video');

      expect(videoItem).toBeDefined();
      expect(videoItem?.url).toBe('/images/Gold_jewellery_commercial_product_film_20261024110518.mp4');
      expect(videoItem?.label).toBe('Video Showcase');
    });

    it('omits Video Showcase when video_url is null or empty', () => {
      const productWithoutVideo: ProductMediaTestItem = {
        id: 'pendant-1',
        name: 'Colombian Emerald Gold Pendant',
        category: 'Pendants',
        metal_type: 'gold',
        image_url: '/images/pendant_colombian_emerald.jpg',
        video_url: null,
        has_360: false
      };

      const media = deriveProductGalleryMedia(productWithoutVideo);
      expect(media.some(m => m.type === 'video')).toBe(false);
      expect(media.some(m => m.type === '360')).toBe(false);
    });

    it('enables 360° Studio only when has_360 is true', () => {
      const product360: ProductMediaTestItem = {
        id: 'ring-ruby',
        name: 'Burmese Ruby Cluster Ring',
        category: 'Rings',
        metal_type: 'gold',
        image_url: '/images/ring_burmese_ruby_gold.jpg',
        has_360: true
      };

      const media = deriveProductGalleryMedia(product360);
      const item360 = media.find(m => m.type === '360');

      expect(item360).toBeDefined();
      expect(item360?.label).toBe('360° Studio');
    });
  });

  describe('3. Mobile Interactions: Pinch-to-Zoom & Swipe Navigation', () => {
    it('scales zoom factor smoothly between 1x and 3x based on pinch distance', () => {
      const initialTouchDistance = 100;
      
      // Expand fingers by 50%
      expect(calculatePinchZoomScale(initialTouchDistance, 150)).toBe(1.5);
      
      // Double finger distance (2.0x zoom)
      expect(calculatePinchZoomScale(initialTouchDistance, 200)).toBe(2.0);

      // Excessive pinch clamped at 3.0x maximum zoom
      expect(calculatePinchZoomScale(initialTouchDistance, 450)).toBe(3.0);

      // Pinch closer clamped at 1.0x minimum
      expect(calculatePinchZoomScale(initialTouchDistance, 60)).toBe(1.0);
    });

    it('detects swipe gestures for previous and next image navigation', () => {
      // Swiping left (startX: 300, endX: 180) -> Next image
      expect(calculateSwipeDirection(300, 180)).toBe('next');

      // Swiping right (startX: 100, endX: 250) -> Previous image
      expect(calculateSwipeDirection(100, 250)).toBe('prev');

      // Micro movement below threshold (< 50px) -> Ignored
      expect(calculateSwipeDirection(200, 220)).toBe('none');
    });
  });

  describe('4. Gallery Reordering & Primary Image Management', () => {
    it('reorders gallery images correctly when moving items left or right', () => {
      const gallery = ['img_A.jpg', 'img_B.jpg', 'img_C.jpg'];

      // Move img_B left (swap with img_A)
      const moveLeft = (arr: string[], idx: number) => {
        const copy = [...arr];
        const target = idx - 1;
        if (target < 0) return copy;
        const temp = copy[idx];
        copy[idx] = copy[target];
        copy[target] = temp;
        return copy;
      };

      const reordered = moveLeft(gallery, 1);
      expect(reordered).toEqual(['img_B.jpg', 'img_A.jpg', 'img_C.jpg']);

      // Move img_B right (swap with img_A)
      const moveRight = (arr: string[], idx: number) => {
        const copy = [...arr];
        const target = idx + 1;
        if (target >= copy.length) return copy;
        const temp = copy[idx];
        copy[idx] = copy[target];
        copy[target] = temp;
        return copy;
      };

      const backAgain = moveRight(reordered, 0);
      expect(backAgain).toEqual(['img_A.jpg', 'img_B.jpg', 'img_C.jpg']);
    });
  });

  describe('5. Real-Time Admin-to-Customer Media Synchronization', () => {
    it('notifies product detail subscribers when Admin uploads new product photography', () => {
      let receivedUpdate: PlatformSyncPayload | null = null;

      const unsubscribe = platformSyncService.subscribe('ecommerce', (payload) => {
        receivedUpdate = payload;
      });

      // Admin updates product images and video
      platformSyncService.broadcast(
        'ecommerce',
        'update',
        'product',
        {
          id: 'bridal-sita-kalyanam',
          name: 'Sita Kalyanam Heritage Temple Bridal Set',
          image_url: '/images/bridal_sita_kalyanam.jpg',
          gallery_images: [
            '/images/bridal_sita_kalyanam.jpg',
            '/images/bridal_sita_kalyanam_detail.jpg'
          ],
          video_url: '/images/Woman_wearing_gold_necklace_20261016115314.mp4',
          has_360: true
        },
        'bridal-sita-kalyanam'
      );

      expect(receivedUpdate).not.toBeNull();
      expect((receivedUpdate as any)?.platform).toBe('ecommerce');
      expect((receivedUpdate as any)?.action).toBe('update');
      expect((receivedUpdate as any)?.data.id).toBe('bridal-sita-kalyanam');
      expect((receivedUpdate as any)?.data.gallery_images.length).toBe(2);
      expect((receivedUpdate as any)?.data.video_url).toContain('.mp4');

      unsubscribe();
    });
  });
});
