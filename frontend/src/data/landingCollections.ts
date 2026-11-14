export interface FeaturedCollectionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  spanRows?: boolean;
  tag?: string;
}

export interface BridalSectionData {
  eyebrow: string;
  title: string;
  italicTitle?: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  highlights: string[];
}

export interface DivineSectionData {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  features: Array<{ label: string; value: string }>;
}

export interface OccasionJewelItem {
  id: string;
  name: string;
  category: string;
  occasion: string;
  image: string;
  href: string;
  badge?: string;
}

export interface OccasionMosaicData {
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage: string;
  backgroundAlt: string;
  items: OccasionJewelItem[];
}

export const featuredCollections: FeaturedCollectionItem[] = [
  {
    id: 'layered-luxe',
    title: 'Layered Luxe',
    subtitle: 'Stack it. Style it. Own it.',
    description: 'Modern minimalist silhouettes sculpted in solid 18K and 22K yellow gold for effortless everyday elegance.',
    image: '/images/editorial_layered_luxe.jpg',
    href: '/jewellery?collection=modern',
    spanRows: true,
    tag: 'EDITORIAL CURATION',
  },
  {
    id: 'ethnic-glow',
    title: 'Ethnic Glow',
    subtitle: 'Tradition with a timeless touch.',
    description: 'Generational temple kasigari infused with timeless heritage motifs.',
    image: '/images/editorial_ethnic_glow.jpg',
    href: '/jewellery?collection=traditional',
    tag: 'HERITAGE CRAFT',
  },
  {
    id: 'diamond-whisper',
    title: 'Diamond Whisper',
    subtitle: 'Delicate. Divine. Breathtaking.',
    description: 'Precision-cut certified natural diamonds and feather-light diamond pavé.',
    image: '/images/editorial_diamond_whisper.jpg',
    href: '/jewellery?category=Diamond%20Jewellery',
    tag: 'CERTIFIED SOLITAIRES',
  },
];

export const bridalCollectionData: BridalSectionData = {
  eyebrow: 'BRIDAL COLLECTION',
  title: 'Where Every Bride',
  italicTitle: 'Becomes a Tradition',
  description: 'Heirloom-inspired gold jewellery, designed to shine through sacred rituals and timeless celebrations. Each piece is meticulously hand-forged by generational karigars.',
  ctaText: 'EXPLORE COLLECTION',
  ctaHref: '/jewellery?category=Bridal%20Sets',
  image: '/images/editorial_bridal_temple_heirloom.jpg',
  imageAlt: 'Traditional South Indian bridal temple gold jewellery handcrafted with Lakshmi motifs',
  highlights: [
    '22K 916 BIS Hallmarked Purity',
    'Custom Bridal Trousseau Styling',
    'Certified Natural Gemstones',
  ],
};

export const divineCollectionData: DivineSectionData = {
  eyebrow: 'SACRED COLLECTION',
  title: 'Divine Idols',
  subtitle: 'Auspicious Icons of Serenity',
  description: 'Sacred idols crafted in fine gold and silver, designed to elevate every sacred space.',
  ctaText: 'EXPLORE COLLECTION',
  ctaHref: '/jewellery?category=Pendants',
  image: '/images/editorial_divine_ganesha_hero.jpg',
  imageAlt: '24K pure gold Ganesha sacred divine idol handcrafted in fine gold',
  features: [
    { label: 'Timeless', value: 'Craftsmanship' },
    { label: 'Purity', value: 'Assured' },
    { label: 'Perfect', value: 'For Gifting' },
  ],
};

export const occasionMosaicData: OccasionMosaicData = {
  eyebrow: 'JEWELS FOR EVERY OCCASION',
  title: 'From weddings to everyday moments, our jewellery shines with you.',
  description: 'Discover versatile adornments composed to transition seamlessly from boardroom poise to gala celebration and heirloom wedding rituals.',
  backgroundImage: '/images/yazhini_timeless_journey_model.jpg',
  backgroundAlt: 'Editorial monochrome jewellery model portrait',
  items: [
    {
      id: 'necklace',
      name: 'South Sea Pearl Necklace',
      category: 'NECKLACES',
      occasion: 'Grand Soirées',
      image: '/images/necklace_south_sea_pearl.jpg',
      href: '/jewellery?category=Necklaces',
      badge: 'Bespoke',
    },
    {
      id: 'bangles',
      name: 'Jadau Ruby & Emerald Bangles',
      category: 'BANGLES',
      occasion: 'Festive Ceremonies',
      image: '/images/bangle_jadau_ruby_emerald_antique.jpg',
      href: '/jewellery?category=Bangles',
      badge: 'Antique',
    },
    {
      id: 'earrings',
      name: 'Peacock Temple Jhumkas',
      category: 'EARRINGS',
      occasion: 'Traditional Celebrations',
      image: '/images/earring_peacock_jhumkas.jpg',
      href: '/jewellery?category=Earrings',
      badge: 'Heritage',
    },
    {
      id: 'rings',
      name: 'Burmese Ruby Solitaire Ring',
      category: 'RINGS',
      occasion: 'Signature Everyday',
      image: '/images/ring_burmese_ruby_gold.jpg',
      href: '/jewellery?category=Rings',
      badge: 'Precious',
    },
  ],
};
