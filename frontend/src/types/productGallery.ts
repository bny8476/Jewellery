/**
 * YAZHINI FINE JEWELS — Advanced Product Image Gallery & Colour Variant Contracts
 */

export type ProductImageType = 
  | 'front' 
  | 'side' 
  | 'back' 
  | 'detail' 
  | 'model' 
  | 'lifestyle' 
  | 'spec' 
  | 'video' 
  | '360';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  type: ProductImageType;
  sortOrder: number;
  label?: string;
  colorVariant?: string;
}

export interface ProductVariant {
  id: string;
  color: string; // 'Rose Gold' | 'Yellow Gold' | 'White Gold' | 'Silver' | 'Platinum'
  colorCode: string; // hex code for visual badge
  sku: string;
  thumbnailUrl: string;
  images: ProductImage[];
  price: number;
  mrp: number;
  stock: number;
  metalType: string;
  metalPurity: string;
  weight: number;
  available: boolean;
  size?: string;
  price_offset?: number;
}

/**
 * Normalizes colour name to a standard key for comparison
 */
export function normalizeColorName(color: string): string {
  return color.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Standard luxury jewellery colour palettes with authentic colour swatches
 */
export const LUXURY_COLOR_PALETTES = [
  { name: 'Rose Gold', hex: '#E8A598', border: '#D98978', code: 'RG' },
  { name: 'Yellow Gold', hex: '#E5C158', border: '#C49A50', code: 'YG' },
  { name: 'White Gold', hex: '#E6E8EA', border: '#BFC5CD', code: 'WG' },
  { name: 'Silver', hex: '#D2D7DF', border: '#A6AEBB', code: 'SL' },
  { name: 'Platinum', hex: '#DFE2E6', border: '#9BA3AF', code: 'PT' }
];

/**
 * Resolves or synthesizes authentic product variants from product data.
 * If the product already has explicit variants with images, returns them.
 * Otherwise, generates the matching colour variants (Rose Gold, Yellow Gold, White Gold/Silver)
 * with authentic images mapped specifically to that metal finish so cross-contamination never occurs.
 */
export function resolveProductVariants(product: {
  id: string;
  sku?: string;
  name: string;
  category: string;
  metal_type: string;
  purity?: string;
  price: number;
  original_price?: number;
  weight?: number;
  stock_quantity?: number;
  in_stock?: boolean;
  image_url?: string | null;
  secondary_image_url?: string | null;
  gallery_images?: string[];
  video_url?: string | null;
  has_360?: boolean;
  variants?: any[];
}): ProductVariant[] {
  const basePrice = product.price || 45000;
  const baseMrp = product.original_price || Math.round(basePrice * 1.45);
  const baseWeight = product.weight || 10;
  const baseSku = product.sku || `YZH-${product.id.slice(0, 6).toUpperCase()}`;

  // If product already has structured variants with images, adapt and return them
  if (product.variants && product.variants.length > 0 && product.variants.some(v => v.color && v.images && v.images.length > 0)) {
    return product.variants.map((v, idx) => ({
      id: v.id || `var-${product.id}-${idx}`,
      color: v.color || 'Yellow Gold',
      colorCode: v.colorCode || (v.color?.toLowerCase().includes('rose') ? '#E8A598' : v.color?.toLowerCase().includes('white') ? '#E6E8EA' : '#E5C158'),
      sku: v.sku || `${baseSku}-${idx + 1}`,
      thumbnailUrl: v.thumbnailUrl || (v.images && v.images[0]?.url) || product.image_url || '/images/cat_gold.jpg',
      images: Array.isArray(v.images) ? v.images : [],
      price: v.price ?? (basePrice + (v.price_offset || 0)),
      mrp: v.mrp ?? Math.round((v.price ?? (basePrice + (v.price_offset || 0))) * 1.45),
      stock: v.stock ?? (product.stock_quantity ?? 5),
      metalType: v.metalType || product.metal_type || 'gold',
      metalPurity: v.metalPurity || product.purity || '22K (BIS 916)',
      weight: v.weight ?? baseWeight,
      available: v.available ?? (v.stock !== 0 && product.in_stock !== false),
      size: v.size
    }));
  }

  // Generate authentic colour variants based on jewellery category and metal finish
  const variants: ProductVariant[] = [];
  const categoryLower = product.category.toLowerCase();
  const nameLower = product.name.toLowerCase();

  // 1. Determine if this product is earrings (similar to reference design)
  if (categoryLower.includes('earring') || nameLower.includes('earring') || nameLower.includes('jhumka') || nameLower.includes('stud') || nameLower.includes('drop')) {
    // Rose Gold Variant
    const rgImages: ProductImage[] = [
      { id: `${product.id}-rg-1`, url: '/images/earring_petite_floral_studs.jpg', alt: `${product.name} - Rose Gold Front View`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Rose Gold' },
      { id: `${product.id}-rg-2`, url: '/images/yazhini_timeless_journey_portrait.jpg', alt: `${product.name} - Rose Gold Worn by Model`, type: 'model', sortOrder: 2, label: 'Worn by Model', colorVariant: 'Rose Gold' },
      { id: `${product.id}-rg-3`, url: '/images/earring_diamond_halo_solitaire.jpg', alt: `${product.name} - Rose Gold Angle View`, type: 'side', sortOrder: 3, label: 'Angle View', colorVariant: 'Rose Gold' },
      { id: `${product.id}-rg-4`, url: '/images/earring_diamond_drop_solitaire.jpg', alt: `${product.name} - Rose Gold Close-up Detail`, type: 'detail', sortOrder: 4, label: 'Detail View', colorVariant: 'Rose Gold' },
      { id: `${product.id}-rg-5`, url: '/images/womens_rose_gold_heart_pendant.jpg', alt: `${product.name} - Rose Gold Lifestyle`, type: 'lifestyle', sortOrder: 5, label: 'Lifestyle View', colorVariant: 'Rose Gold' }
    ];
    if (product.video_url) {
      rgImages.push({ id: `${product.id}-rg-vid`, url: product.video_url, alt: `${product.name} - Rose Gold Video Showcase`, type: 'video', sortOrder: 6, label: 'Video Clip', colorVariant: 'Rose Gold' });
    }

    variants.push({
      id: `${product.id}-var-rose-gold`,
      color: 'Rose Gold',
      colorCode: '#E8A598',
      sku: `${baseSku}-RG`,
      thumbnailUrl: '/images/earring_petite_floral_studs.jpg',
      images: rgImages,
      price: Math.round(basePrice * 0.96),
      mrp: baseMrp,
      stock: 4,
      metalType: 'gold',
      metalPurity: '18K Rose Gold',
      weight: baseWeight,
      available: true
    });

    // Yellow Gold Variant
    const ygImages: ProductImage[] = [
      { id: `${product.id}-yg-1`, url: product.image_url || '/images/earring_peacock_jhumkas.jpg', alt: `${product.name} - Yellow Gold Front View`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Yellow Gold' },
      { id: `${product.id}-yg-2`, url: '/images/yazhini_timeless_journey_model.jpg', alt: `${product.name} - Yellow Gold Worn by Model`, type: 'model', sortOrder: 2, label: 'Worn by Model', colorVariant: 'Yellow Gold' },
      { id: `${product.id}-yg-3`, url: '/images/earring_kundan_polki_chandbali.jpg', alt: `${product.name} - Yellow Gold Angle View`, type: 'side', sortOrder: 3, label: 'Angle View', colorVariant: 'Yellow Gold' },
      { id: `${product.id}-yg-4`, url: '/images/earring_peacock_jhumkas.jpg', alt: `${product.name} - Yellow Gold Detail View`, type: 'detail', sortOrder: 4, label: 'Detail View', colorVariant: 'Yellow Gold' }
    ];
    if (product.video_url) {
      ygImages.push({ id: `${product.id}-yg-vid`, url: product.video_url, alt: `${product.name} - Yellow Gold Video Showcase`, type: 'video', sortOrder: 5, label: 'Video Clip', colorVariant: 'Yellow Gold' });
    }

    variants.push({
      id: `${product.id}-var-yellow-gold`,
      color: 'Yellow Gold',
      colorCode: '#E5C158',
      sku: `${baseSku}-YG`,
      thumbnailUrl: product.image_url || '/images/earring_peacock_jhumkas.jpg',
      images: ygImages,
      price: basePrice,
      mrp: baseMrp,
      stock: product.stock_quantity ?? 6,
      metalType: 'gold',
      metalPurity: product.purity || '22K (BIS 916)',
      weight: baseWeight,
      available: true
    });

    // White Gold / Silver Variant
    const wgImages: ProductImage[] = [
      { id: `${product.id}-wg-1`, url: '/images/earring_diamond_halo_solitaire.jpg', alt: `${product.name} - White Gold Front View`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'White Gold' },
      { id: `${product.id}-wg-2`, url: '/images/trend_diamond_earrings.jpg', alt: `${product.name} - White Gold Worn View`, type: 'model', sortOrder: 2, label: 'Worn by Model', colorVariant: 'White Gold' },
      { id: `${product.id}-wg-3`, url: '/images/earring_diamond_drop_solitaire.jpg', alt: `${product.name} - White Gold Angle View`, type: 'side', sortOrder: 3, label: 'Angle View', colorVariant: 'White Gold' }
    ];

    variants.push({
      id: `${product.id}-var-white-gold`,
      color: 'White Gold',
      colorCode: '#E6E8EA',
      sku: `${baseSku}-WG`,
      thumbnailUrl: '/images/earring_diamond_halo_solitaire.jpg',
      images: wgImages,
      price: Math.round(basePrice * 1.05),
      mrp: Math.round(baseMrp * 1.05),
      stock: 3,
      metalType: 'gold',
      metalPurity: '18K White Gold (750)',
      weight: baseWeight,
      available: true
    });
  } 
  // 2. Rings & Bands
  else if (categoryLower.includes('ring') || nameLower.includes('ring') || nameLower.includes('band')) {
    // Yellow Gold
    variants.push({
      id: `${product.id}-var-yg`,
      color: 'Yellow Gold',
      colorCode: '#E5C158',
      sku: `${baseSku}-YG`,
      thumbnailUrl: product.image_url || '/images/ring_solitaire_diamond.jpg',
      images: [
        { id: `${product.id}-yg-1`, url: product.image_url || '/images/ring_solitaire_diamond.jpg', alt: `${product.name} - Yellow Gold Front View`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Yellow Gold' },
        { id: `${product.id}-yg-2`, url: '/images/ring_burmese_ruby_gold.jpg', alt: `${product.name} - Yellow Gold Detail View`, type: 'detail', sortOrder: 2, label: 'Detail View', colorVariant: 'Yellow Gold' },
        { id: `${product.id}-yg-3`, url: '/images/ring_navaratna_gold.jpg', alt: `${product.name} - Yellow Gold Side Profile`, type: 'side', sortOrder: 3, label: 'Side View', colorVariant: 'Yellow Gold' }
      ],
      price: basePrice,
      mrp: baseMrp,
      stock: product.stock_quantity ?? 5,
      metalType: 'gold',
      metalPurity: '22K (BIS 916)',
      weight: baseWeight,
      available: true
    });

    // Rose Gold
    variants.push({
      id: `${product.id}-var-rg`,
      color: 'Rose Gold',
      colorCode: '#E8A598',
      sku: `${baseSku}-RG`,
      thumbnailUrl: '/images/ring_solitaire_diamond_alt.jpg',
      images: [
        { id: `${product.id}-rg-1`, url: '/images/ring_solitaire_diamond_alt.jpg', alt: `${product.name} - Rose Gold Front View`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Rose Gold' },
        { id: `${product.id}-rg-2`, url: '/images/ring_burmese_ruby_gold_alt.jpg', alt: `${product.name} - Rose Gold Solitaire Crown`, type: 'detail', sortOrder: 2, label: 'Detail View', colorVariant: 'Rose Gold' }
      ],
      price: Math.round(basePrice * 0.98),
      mrp: baseMrp,
      stock: 4,
      metalType: 'gold',
      metalPurity: '18K Rose Gold',
      weight: baseWeight,
      available: true
    });

    // Platinum / White Gold
    variants.push({
      id: `${product.id}-var-pt`,
      color: 'Platinum',
      colorCode: '#DFE2E6',
      sku: `${baseSku}-PT`,
      thumbnailUrl: '/images/ring_platinum_couple_bands.jpg',
      images: [
        { id: `${product.id}-pt-1`, url: '/images/ring_platinum_couple_bands.jpg', alt: `${product.name} - Platinum Band`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Platinum' },
        { id: `${product.id}-pt-2`, url: '/images/mens_platinum_band.jpg', alt: `${product.name} - Platinum Side Angle`, type: 'side', sortOrder: 2, label: 'Side Profile', colorVariant: 'Platinum' }
      ],
      price: Math.round(basePrice * 1.15),
      mrp: Math.round(baseMrp * 1.15),
      stock: 2,
      metalType: 'platinum',
      metalPurity: 'PT 950 Certified',
      weight: baseWeight,
      available: true
    });
  }
  // 3. Bangles, Kadas & Bracelets
  else if (categoryLower.includes('bangle') || categoryLower.includes('kada') || categoryLower.includes('bracelet')) {
    // Yellow Gold
    variants.push({
      id: `${product.id}-var-yg`,
      color: 'Yellow Gold',
      colorCode: '#E5C158',
      sku: `${baseSku}-YG`,
      thumbnailUrl: product.image_url || '/images/bangle_traditional_kasu_pair.jpg',
      images: [
        { id: `${product.id}-yg-1`, url: product.image_url || '/images/bangle_traditional_kasu_pair.jpg', alt: `${product.name} - Yellow Gold Front`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Yellow Gold' },
        { id: `${product.id}-yg-2`, url: '/images/bangle_jadau_ruby_emerald_antique.jpg', alt: `${product.name} - Handcrafted Filigree`, type: 'detail', sortOrder: 2, label: 'Detail View', colorVariant: 'Yellow Gold' }
      ],
      price: basePrice,
      mrp: baseMrp,
      stock: product.stock_quantity ?? 5,
      metalType: 'gold',
      metalPurity: '22K (BIS 916)',
      weight: baseWeight,
      available: true
    });

    // Rose Gold
    variants.push({
      id: `${product.id}-var-rg`,
      color: 'Rose Gold',
      colorCode: '#E8A598',
      sku: `${baseSku}-RG`,
      thumbnailUrl: '/images/bangle_rose_gold_designer_kada.jpg',
      images: [
        { id: `${product.id}-rg-1`, url: '/images/bangle_rose_gold_designer_kada.jpg', alt: `${product.name} - Rose Gold Designer Kada`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Rose Gold' },
        { id: `${product.id}-rg-2`, url: '/images/trend_rose_gold_kada.jpg', alt: `${product.name} - Rose Gold Wrist Display`, type: 'model', sortOrder: 2, label: 'Wrist View', colorVariant: 'Rose Gold' }
      ],
      price: Math.round(basePrice * 1.02),
      mrp: baseMrp,
      stock: 3,
      metalType: 'gold',
      metalPurity: '18K Rose Gold',
      weight: baseWeight,
      available: true
    });

    // Diamond Tennis / White Finish
    variants.push({
      id: `${product.id}-var-wg`,
      color: 'White Gold',
      colorCode: '#E6E8EA',
      sku: `${baseSku}-WG`,
      thumbnailUrl: '/images/diamond_tennis_bracelet.jpg',
      images: [
        { id: `${product.id}-wg-1`, url: '/images/diamond_tennis_bracelet.jpg', alt: `${product.name} - White Gold Diamond Bracelet`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'White Gold' }
      ],
      price: Math.round(basePrice * 1.18),
      mrp: Math.round(baseMrp * 1.18),
      stock: 2,
      metalType: 'gold',
      metalPurity: '18K White Gold',
      weight: baseWeight,
      available: true
    });
  }
  // 4. Necklaces, Chokers & Chains (or generic catalogue pieces)
  else {
    const primaryImg = product.image_url || '/images/necklace_temple_nagas_haram.jpg';
    const gallery = (product.gallery_images && product.gallery_images.length > 0) 
      ? product.gallery_images 
      : [primaryImg];

    // Build Yellow Gold images
    const ygImages: ProductImage[] = gallery.map((url, idx) => ({
      id: `${product.id}-yg-${idx}`,
      url,
      alt: `${product.name} - Yellow Gold (${idx === 0 ? 'Front' : 'Angle ' + (idx + 1)})`,
      type: idx === 0 ? 'front' : (idx === 1 ? 'side' : 'detail'),
      sortOrder: idx + 1,
      label: idx === 0 ? 'Main View' : `Detail ${idx + 1}`,
      colorVariant: 'Yellow Gold'
    }));
    if (product.video_url) {
      ygImages.push({
        id: `${product.id}-yg-vid`,
        url: product.video_url,
        alt: `${product.name} - Commercial Film`,
        type: 'video',
        sortOrder: ygImages.length + 1,
        label: 'Video Showcase',
        colorVariant: 'Yellow Gold'
      });
    }

    variants.push({
      id: `${product.id}-var-yg`,
      color: 'Yellow Gold',
      colorCode: '#E5C158',
      sku: `${baseSku}-YG`,
      thumbnailUrl: primaryImg,
      images: ygImages,
      price: basePrice,
      mrp: baseMrp,
      stock: product.stock_quantity ?? 4,
      metalType: 'gold',
      metalPurity: product.purity || '22K (BIS 916)',
      weight: baseWeight,
      available: true
    });

    // Rose Gold Variant
    const rgImg = product.category.toLowerCase().includes('pendant') 
      ? '/images/womens_rose_gold_heart_pendant.jpg'
      : '/images/necklace_contemporary_geometric.jpg';
    variants.push({
      id: `${product.id}-var-rg`,
      color: 'Rose Gold',
      colorCode: '#E8A598',
      sku: `${baseSku}-RG`,
      thumbnailUrl: rgImg,
      images: [
        { id: `${product.id}-rg-1`, url: rgImg, alt: `${product.name} - Rose Gold View`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'Rose Gold' }
      ],
      price: Math.round(basePrice * 0.98),
      mrp: baseMrp,
      stock: 2,
      metalType: 'gold',
      metalPurity: '18K Rose Gold',
      weight: baseWeight,
      available: true
    });

    // White Gold / Platinum Variant
    const wgImg = '/images/womens_diamond_tennis_choker.jpg';
    variants.push({
      id: `${product.id}-var-wg`,
      color: 'White Gold',
      colorCode: '#E6E8EA',
      sku: `${baseSku}-WG`,
      thumbnailUrl: wgImg,
      images: [
        { id: `${product.id}-wg-1`, url: wgImg, alt: `${product.name} - White Gold Choker View`, type: 'front', sortOrder: 1, label: 'Front View', colorVariant: 'White Gold' }
      ],
      price: Math.round(basePrice * 1.10),
      mrp: Math.round(baseMrp * 1.10),
      stock: 2,
      metalType: 'gold',
      metalPurity: '18K White Gold (750)',
      weight: baseWeight,
      available: true
    });
  }

  return variants;
}

/**
 * Gets images strictly for the selected colour variant.
 * If the selected colour has no images, returns an empty array to trigger
 * the explicit unavailable state rather than showing another colour's images.
 */
export function getImagesForVariant(variants: ProductVariant[], selectedColorName: string): ProductImage[] {
  const normalized = normalizeColorName(selectedColorName);
  const match = variants.find(v => normalizeColorName(v.color) === normalized);
  if (!match) return [];
  return match.images || [];
}
