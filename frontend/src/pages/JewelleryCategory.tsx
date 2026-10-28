import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SlidersHorizontal, 
  ChevronRight, 
  Sparkles, 
  Grid3X3, 
  LayoutGrid, 
  X, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Gem, 
  Filter,
  ChevronDown
} from 'lucide-react';
import { JewelryItem } from '../lib/supabase';
import { ApiService } from '../services/apiService';
import { localJewelryItems } from '../utils/localData';
import { useRates } from '../context/RateContext';
import { SignatureLuxuryCard } from '../components/cards/SignatureLuxuryCard';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { BackButton } from '../components/ui/BackButton';
import Footer from '../components/Footer';

export interface CategoryMeta {
  title: string;
  tagline: string;
  description: string;
  bannerImage: string;
  bannerVideo?: string;
  bannerPoster?: string;
  videoTitle?: string;
  videoQuality?: string;
  objectPosition?: string;
  defaultMetal?: string;
  defaultCategory?: string;
  defaultCollection?: string;
  defaultGender?: string;
  subcategories: { label: string; filterKey: 'category' | 'metal' | 'collection' | 'subcat' | 'gender'; filterValue: string }[];
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryMeta> = {
  'diamond-jewellery': {
    title: 'Diamond Jewellery',
    tagline: 'Rare Brilliance & Solitaire Elegance',
    description: 'Explore our master-crafted natural diamond collection certified by IGI & GIA. Set in luminous 18K and 22K gold with exceptional VVS clarity and immaculate cut grades.',
    bannerImage: '/images/cat_diamond.jpg',
    bannerVideo: '/images/Diamond_jewellery_advertisement_…_20261024110532.mp4',
    bannerPoster: '/images/poster_diamond_full_set.jpg',
    videoTitle: 'Certified Natural Solitaire Haute Joaillerie Parure',
    videoQuality: 'HD 720p',
    objectPosition: 'center center',
    defaultMetal: 'diamond',
    subcategories: [
      { label: 'All Diamonds', filterKey: 'metal', filterValue: 'diamond' },
      { label: 'Diamond Rings', filterKey: 'category', filterValue: 'Rings' },
      { label: 'Diamond Earrings', filterKey: 'category', filterValue: 'Earrings' },
      { label: 'Diamond Necklaces', filterKey: 'category', filterValue: 'Necklaces' },
      { label: 'Diamond Bangles', filterKey: 'category', filterValue: 'Bangles' },
      { label: 'Solitaire Studs', filterKey: 'subcat', filterValue: 'solitaire' }
    ]
  },
  'gold-jewellery': {
    title: 'Gold Jewellery',
    tagline: 'Timeless 22K & 24K BIS 916 Hallmarked Creations',
    description: 'Authentic South Indian artistry crafted in pure 22 Karat gold. From auspicious temple antique harams to lightweight everyday elegance.',
    bannerImage: '/images/cat_gold.jpg',
    bannerVideo: '/images/Gold_jewelry_product_film_20261024110513.mp4',
    bannerPoster: '/images/poster_gold_jewelry_product_film.jpg',
    videoTitle: '22K BIS Hallmarked Heritage Gold Film',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultMetal: 'gold',
    subcategories: [
      { label: 'All Gold', filterKey: 'metal', filterValue: 'gold' },
      { label: 'Necklaces & Harams', filterKey: 'category', filterValue: 'Necklaces' },
      { label: 'Bangles & Kadas', filterKey: 'category', filterValue: 'Bangles' },
      { label: 'Earrings & Jhumkas', filterKey: 'category', filterValue: 'Earrings' },
      { label: 'Rings & Bands', filterKey: 'category', filterValue: 'Rings' },
      { label: 'Chains', filterKey: 'category', filterValue: 'Chains' },
      { label: 'Pendants', filterKey: 'category', filterValue: 'Pendants' }
    ]
  },
  'platinum-jewellery': {
    title: 'Platinum Jewellery',
    tagline: 'Rare, Enduring & Uncompromising Pure Pt 950',
    description: 'Crafted in 95% pure rare platinum with 18K rose gold accents. Distinctive, eternal couple bands and solitaire settings designed to endure a lifetime.',
    bannerImage: '/images/ring_platinum_couple_bands.jpg',
    bannerVideo: '/images/Diamond_necklace_commercial_display_20261024110527.mp4',
    bannerPoster: '/images/poster_diamond_necklace_display.jpg',
    videoTitle: 'Pt 950 Pure Platinum & Solitaire Diamond Craft',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultMetal: 'platinum',
    subcategories: [
      { label: 'All Platinum', filterKey: 'metal', filterValue: 'platinum' },
      { label: 'Couple Bands', filterKey: 'category', filterValue: 'Rings' },
      { label: 'Solitaire Settings', filterKey: 'subcat', filterValue: 'solitaire' }
    ]
  },
  'silver-jewellery': {
    title: 'Silver Jewellery & Bullion',
    tagline: '925 Sterling Silver & 999 Pooja Articles',
    description: 'Sacred pooja coins, hallmarked 925 sterling chains, and pure silver bullion bars crafted with divine motifs for auspicious celebrations.',
    bannerImage: '/images/silver_pooja_coin_50g.jpg',
    bannerVideo: '/images/Gold_jewellery_commercial_produc…_20261024110518.mp4',
    bannerPoster: '/images/poster_gold_jewellery_commercial.jpg',
    videoTitle: '925 Sterling Silver & 999 Fine Bullion',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultMetal: 'silver',
    subcategories: [
      { label: 'All Silver', filterKey: 'metal', filterValue: 'silver' },
      { label: 'Pooja Coins & Bars', filterKey: 'category', filterValue: 'Gold coins' },
      { label: 'Silver Chains', filterKey: 'category', filterValue: 'Chains' }
    ]
  },
  'rings': {
    title: 'Rings & Solitaires',
    tagline: 'Signature Bands, Cocktail Rings & Solitaires',
    description: 'Heirloom cocktail rings, navaratna gems, Burmese rubies, and brilliant solitaire bands crafted in 22K gold, 18K diamond, and platinum.',
    bannerImage: '/images/ring_solitaire_diamond.jpg',
    bannerVideo: '/images/Diamond_jewellery_advertisement_…_20261024110532.mp4',
    bannerPoster: '/images/poster_diamond_full_set.jpg',
    videoTitle: 'Signature Solitaire Rings & Diamond Parure',
    videoQuality: 'HD 720p',
    objectPosition: '28% 65%',
    defaultCategory: 'Rings',
    subcategories: [
      { label: 'All Rings', filterKey: 'category', filterValue: 'Rings' },
      { label: 'Diamond Solitaires', filterKey: 'metal', filterValue: 'diamond' },
      { label: '22K Gold Rings', filterKey: 'metal', filterValue: 'gold' },
      { label: 'Platinum Bands', filterKey: 'metal', filterValue: 'platinum' },
      { label: 'Gemstone Rings', filterKey: 'subcat', filterValue: 'gemstone' }
    ]
  },
  'earrings': {
    title: 'Earrings & Jhumkas',
    tagline: 'Temple Jhumkas, Chandbalis & Solitaire Studs',
    description: 'From majestic peacock nakshi temple jhumkas to sparkling diamond halo studs and kundan chandbalis. Handcrafted with authentic hallmark precision.',
    bannerImage: '/images/earring_peacock_jhumkas.jpg',
    bannerVideo: '/images/Gold_jewellery_commercial_produc…_20261024110518.mp4',
    bannerPoster: '/images/poster_gold_jewellery_commercial.jpg',
    videoTitle: 'Handcrafted Temple Peacock Jhumkas & Heritage Parure',
    videoQuality: 'HD 720p',
    objectPosition: '58% 30%',
    defaultCategory: 'Earrings',
    subcategories: [
      { label: 'All Earrings', filterKey: 'category', filterValue: 'Earrings' },
      { label: 'Temple Jhumkas', filterKey: 'metal', filterValue: 'gold' },
      { label: 'Diamond Studs', filterKey: 'metal', filterValue: 'diamond' },
      { label: 'Polki Chandbalis', filterKey: 'subcat', filterValue: 'chandbali' }
    ]
  },
  'necklaces': {
    title: 'Necklaces & Harams',
    tagline: 'Opulent Chokers, Temple Harams & Manga Malai',
    description: 'Heritage temple nakshi long harams, royal mango malais, basra pearl necklaces, and modern geometric collars designed for royalty.',
    bannerImage: '/images/necklace_temple_nagas_haram.jpg',
    bannerVideo: '/images/Diamond_necklace_commercial_display_20261024110527.mp4',
    bannerPoster: '/images/poster_diamond_necklace_display.jpg',
    videoTitle: 'Opulent Chokers & Diamond Harams',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultCategory: 'Necklaces',
    subcategories: [
      { label: 'All Necklaces', filterKey: 'category', filterValue: 'Necklaces' },
      { label: 'Temple Harams', filterKey: 'collection', filterValue: 'Heritage & Artistry' },
      { label: 'Chokers & Collars', filterKey: 'metal', filterValue: 'gold' },
      { label: 'Diamond Sets', filterKey: 'metal', filterValue: 'diamond' }
    ]
  },
  'bangles': {
    title: 'Bangles & Bracelets',
    tagline: 'Kadas, Kasu Bangles & Diamond Tennis Bracelets',
    description: 'Traditional Kasu Mala bangles, antique jadau ruby cuffs, designer rose gold kadas, and flexible diamond tennis bracelets.',
    bannerImage: '/images/bangle_traditional_kasu_pair.jpg',
    bannerVideo: '/images/Gold_jewellery_commercial_produc…_20261024110518.mp4',
    bannerPoster: '/images/poster_gold_jewellery_commercial.jpg',
    videoTitle: '22K Solid Gold Kadas & Antique Ruby Bangles',
    videoQuality: 'HD 720p',
    objectPosition: '22% 42%',
    defaultCategory: 'Bangles',
    subcategories: [
      { label: 'All Bangles', filterKey: 'category', filterValue: 'Bangles' },
      { label: '22K Gold Bangles', filterKey: 'metal', filterValue: 'gold' },
      { label: 'Diamond Bracelets', filterKey: 'metal', filterValue: 'diamond' },
      { label: 'Antique Kadas', filterKey: 'subcat', filterValue: 'kada' }
    ]
  },
  'bridal': {
    title: 'Bridal Trousseau & Heritage Sets',
    tagline: 'The Sacred Muhurtham Royal Collection',
    description: 'Grand royal bridal sets featuring Sita Kalyanam harams, uncut rubies, basra pearls, divine Oddiyanams, and matching bridal jewellery.',
    bannerImage: '/images/cat_bridal.jpg',
    bannerVideo: '/images/Gold_jewellery_commercial_produc…_20261024110518.mp4',
    bannerPoster: '/images/poster_gold_jewellery_commercial.jpg',
    videoTitle: 'The Royal Muhurtham Complete Temple Bridal Trousseau',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultCollection: 'The Sacred Muhurtham',
    subcategories: [
      { label: 'All Bridal', filterKey: 'collection', filterValue: 'The Sacred Muhurtham' },
      { label: 'Bridal Choker Sets', filterKey: 'category', filterValue: 'Bridal Sets' },
      { label: 'Antique Oddiyanams', filterKey: 'subcat', filterValue: 'oddiyanam' },
      { label: 'Temple Harams', filterKey: 'category', filterValue: 'Necklaces' }
    ]
  },
  'traditional': {
    title: 'Traditional & Mangalsutra',
    tagline: 'Sacred Motifs, Temple Nakshi & Heirloom Jewellery',
    description: 'Auspicious South Indian heirlooms, black bead diamond mangalsutras, Ganesha pendants, and Nakshi repoussé jewellery carrying divine blessings.',
    bannerImage: '/images/cat_traditional.jpg',
    bannerVideo: '/images/Gold_jewellery_advertisement_sho…_20261024110543.mp4',
    bannerPoster: '/images/poster_gold_jewellery_showcase.jpg',
    videoTitle: 'Sacred Temple Nakshi & Heirloom Jewellery',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultCollection: 'Heritage & Artistry',
    subcategories: [
      { label: 'All Traditional', filterKey: 'collection', filterValue: 'Heritage & Artistry' },
      { label: 'Mangalsutras', filterKey: 'subcat', filterValue: 'mangalsutra' },
      { label: 'Temple Harams', filterKey: 'category', filterValue: 'Necklaces' },
      { label: 'Divine Pendants', filterKey: 'category', filterValue: 'Pendants' }
    ]
  },
  'chains': {
    title: 'Chains & Mangalsutras',
    tagline: 'Classic Gold Rope Chains & Sacred Filigree',
    description: 'Solid handcrafted 22K gold rope chains, everyday lightweight links, and sacred thali chains engineered for lifelong durability and comfort.',
    bannerImage: '/images/gold_rope_chain.jpg',
    bannerVideo: '/images/Gold_jewellery_commercial_produc…_20261024110518.mp4',
    bannerPoster: '/images/poster_gold_jewellery_commercial.jpg',
    videoTitle: 'Classic Gold Rope Chains & Sacred Thali Links',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultCategory: 'Chains',
    subcategories: [
      { label: 'All Chains', filterKey: 'category', filterValue: 'Chains' },
      { label: '22K Gold Chains', filterKey: 'metal', filterValue: 'gold' },
      { label: 'Sterling Silver Chains', filterKey: 'metal', filterValue: 'silver' }
    ]
  },
  'pendants': {
    title: 'Pendants & Medallions',
    tagline: 'Divine Deities, Solitaires & Emerald Drops',
    description: 'Auspicious Goddess Lakshmi & Lord Ganesha medallions, Colombian emerald pendants, and diamond teardrop pendants.',
    bannerImage: '/images/pendant_ganesha_gold_divine.jpg',
    bannerVideo: '/images/Gold_jewelry_product_film_20261024110513.mp4',
    bannerPoster: '/images/poster_gold_jewelry_product_film.jpg',
    videoTitle: 'Divine Medallions & Solitaire Pendants Film',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultCategory: 'Pendants',
    subcategories: [
      { label: 'All Pendants', filterKey: 'category', filterValue: 'Pendants' },
      { label: 'Divine Deities', filterKey: 'subcat', filterValue: 'ganesha' },
      { label: 'Gemstone Drops', filterKey: 'metal', filterValue: 'gold' }
    ]
  },
  'coins': {
    title: 'Coins, Bars & Bullion',
    tagline: '24K 999.9 Fine Gold & 999 Pure Silver Bullion',
    description: 'Zero-making charge investment coins and festive pooja bars featuring Goddess Lakshmi and Lord Ganesha. Tamper-proof CertiCard packaging with guaranteed buyback.',
    bannerImage: '/images/gold_coin_8g.jpg',
    bannerVideo: '/images/Gold_jewellery_advertisement_sho…_20261024110543.mp4',
    bannerPoster: '/images/poster_gold_jewellery_showcase.jpg',
    videoTitle: '24K 999.9 Gold & 999 Silver Investment Bullion',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultCategory: 'Gold coins',
    subcategories: [
      { label: 'All Coins & Bars', filterKey: 'category', filterValue: 'Gold coins' },
      { label: '24K Gold Coins', filterKey: 'metal', filterValue: 'gold' },
      { label: '999 Silver Coins', filterKey: 'metal', filterValue: 'silver' }
    ]
  },
  'mens': {
    title: "Men's Luxury Fine Jewellery Collection",
    tagline: 'Solid Kadas, Cuban Chains, Signet Rings & Medallions',
    description: 'Forged in 22K BIS hallmarked gold, Pt950 platinum, and sterling silver. Substantial solid kadas, heavy Cuban and Figaro chains, royal lion signet rings, Mahadev Trishul pendants, and luxury diamond cufflinks.',
    bannerImage: '/images/mens_gold_kada.jpg',
    bannerVideo: '/images/Gold_jewellery_advertisement_sho…_20261024110543.mp4',
    bannerPoster: '/images/poster_gold_jewellery_showcase.jpg',
    videoTitle: "Men's Solid Kadas & Cuban Chains Film",
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultGender: 'men',
    subcategories: [
      { label: "All Men's", filterKey: 'gender', filterValue: 'men' },
      { label: 'Cuban & Rope Chains', filterKey: 'category', filterValue: 'Chains' },
      { label: 'Solid Kadas & Bracelets', filterKey: 'category', filterValue: 'Bangles' },
      { label: 'Signet Rings & Bands', filterKey: 'category', filterValue: 'Rings' },
      { label: 'Spiritual Pendants & Malas', filterKey: 'category', filterValue: 'Pendants' },
      { label: 'Platinum Pt 950', filterKey: 'metal', filterValue: 'platinum' }
    ]
  },
  'women': {
    title: "Women's Haute Joaillerie & Heritage Collection",
    tagline: 'Temple Harams, Bridal Trousseaus, Solitaires & Kasu Bangles',
    description: 'Explore YAZHINI’s master-crafted women’s collection featuring heirloom Nakshi harams, certified diamond solitaires, bridal trousseaus, everyday gold pendants, and traditional Kasu mangalsutras.',
    bannerImage: '/images/cat_gold.jpg',
    bannerVideo: '/images/Gold_jewellery_advertisement_sho…_20261024110543.mp4',
    bannerPoster: '/images/poster_gold_jewellery_showcase.jpg',
    videoTitle: "Women's Royal Trousseau & Heritage Showcase",
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultGender: 'women',
    subcategories: [
      { label: "All Women's", filterKey: 'gender', filterValue: 'women' },
      { label: 'Necklaces & Harams', filterKey: 'category', filterValue: 'Necklaces' },
      { label: 'Earrings & Jhumkas', filterKey: 'category', filterValue: 'Earrings' },
      { label: 'Rings & Solitaires', filterKey: 'category', filterValue: 'Rings' },
      { label: 'Bangles & Kadas', filterKey: 'category', filterValue: 'Bangles' },
      { label: 'Bridal Sets', filterKey: 'category', filterValue: 'Bridal Sets' },
      { label: 'Mangalsutras', filterKey: 'subcat', filterValue: 'mangalsutra' },
      { label: 'Pendants', filterKey: 'category', filterValue: 'Pendants' }
    ]
  },
  'unisex': {
    title: 'Unisex & Heritage Bullion Collection',
    tagline: '24K Investment Coins, Platinum Bands & Sacred Talismans',
    description: 'Universal fine jewellery and certified investment bullion. 24K 999.9 pure gold coins, 999 silver bars, platinum couple bands, and sacred divine talismans crafted for every connoisseur.',
    bannerImage: '/images/gold_coin_8g.jpg',
    bannerVideo: '/images/Gold_jewellery_advertisement_sho…_20261024110543.mp4',
    bannerPoster: '/images/poster_gold_jewellery_showcase.jpg',
    videoTitle: 'Universal 24K Bullion & Sacred Talismans',
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultGender: 'unisex',
    subcategories: [
      { label: 'All Unisex', filterKey: 'gender', filterValue: 'unisex' },
      { label: '24K Gold Coins', filterKey: 'category', filterValue: 'Gold coins' },
      { label: '999 Fine Silver', filterKey: 'metal', filterValue: 'silver' },
      { label: 'Platinum Bands', filterKey: 'metal', filterValue: 'platinum' },
      { label: 'Sacred Pendants', filterKey: 'category', filterValue: 'Pendants' }
    ]
  },
  'kids': {
    title: "Children's Jewellery",
    tagline: 'Nazariya Bracelets & Baby Bangles',
    description: 'Gentle, hypoallergenic 22K gold baby bangles, black bead nazariya evil-eye protection anklets, and playful divine pendants crafted safely for children.',
    bannerImage: '/images/kids_baby_bangles.jpg',
    bannerVideo: '/images/Gold_jewelry_product_film_20261024110513.mp4',
    bannerPoster: '/images/poster_gold_jewelry_product_film.jpg',
    videoTitle: "Children's 22K Gold Nazariya & Bangles",
    videoQuality: 'HD 720p',
    objectPosition: 'center 40%',
    defaultCategory: 'Bangles',
    defaultGender: 'kids',
    subcategories: [
      { label: 'All Kids', filterKey: 'gender', filterValue: 'kids' },
      { label: 'Baby Bangles', filterKey: 'category', filterValue: 'Bangles' },
      { label: 'Nazariya Anklets', filterKey: 'subcat', filterValue: 'anklet' }
    ]
  },
  'all': {
    title: 'All Fine Jewellery',
    tagline: 'YAZHINI Complete High Jewellery Haute Parure',
    description: 'Explore the full catalogue of 22K gold, certified solitaires, temple nakshi heirlooms, and platinum masterworks.',
    bannerImage: '/images/catalogue_top_banner.png',
    bannerVideo: '/images/Diamond_jewellery_advertisement_…_20261024110532.mp4',
    bannerPoster: '/images/poster_diamond_full_set.jpg',
    videoTitle: 'Complete Haute Joaillerie Diamond & Gold Parure',
    videoQuality: 'HD 720p',
    objectPosition: 'center center',
    subcategories: [
      { label: 'All Collections', filterKey: 'category', filterValue: 'All' },
      { label: 'Women', filterKey: 'gender', filterValue: 'women' },
      { label: 'Men', filterKey: 'gender', filterValue: 'men' },
      { label: 'Diamond', filterKey: 'metal', filterValue: 'diamond' },
      { label: 'Gold', filterKey: 'metal', filterValue: 'gold' },
      { label: 'Necklaces', filterKey: 'category', filterValue: 'Necklaces' },
      { label: 'Bridal Sets', filterKey: 'category', filterValue: 'Bridal Sets' },
      { label: 'Earrings', filterKey: 'category', filterValue: 'Earrings' },
      { label: 'Rings', filterKey: 'category', filterValue: 'Rings' },
      { label: 'Bangles', filterKey: 'category', filterValue: 'Bangles' }
    ]
  }
};

// Aliases mapping common URL variations to our canonical keys
export function resolveCategoryKey(slug: string | undefined): string {
  if (!slug) return 'all';
  const clean = slug.toLowerCase().replace(/\.html$/i, '').trim();

  if (['women', 'womens', 'womens-jewellery', 'ladies'].includes(clean)) return 'women';
  if (['men', 'mens', 'mens-jewellery', 'gent', 'gents'].includes(clean)) return 'mens';
  if (['unisex', 'unisex-jewellery'].includes(clean)) return 'unisex';
  if (['diamond', 'diamond-jewellery', 'diamonds', 'solitaire', 'solitaires'].includes(clean)) return 'diamond-jewellery';
  if (['gold', 'gold-jewellery', '22k-gold', 'yellow-gold'].includes(clean)) return 'gold-jewellery';
  if (['platinum', 'platinum-jewellery', 'pt950'].includes(clean)) return 'platinum-jewellery';
  if (['silver', 'silver-jewellery', 'sterling-silver', 'pooja-silver'].includes(clean)) return 'silver-jewellery';
  if (['ring', 'rings', 'couple-rings', 'finger-rings'].includes(clean)) return 'rings';
  if (['earring', 'earrings', 'jhumka', 'jhumkas', 'studs', 'chandbali'].includes(clean)) return 'earrings';
  if (['necklace', 'necklaces', 'haram', 'harams', 'choker', 'chokers'].includes(clean)) return 'necklaces';
  if (['bangle', 'bangles', 'bracelet', 'bracelets', 'bangles-bracelets', 'kada', 'kadas'].includes(clean)) return 'bangles';
  if (['bridal', 'bridal-jewellery', 'wedding', 'wedding-jewellery', 'trousseau', 'muhurtham'].includes(clean)) return 'bridal';
  if (['traditional', 'traditional-jewellery', 'temple', 'temple-jewellery', 'mangalsutra'].includes(clean)) return 'traditional';
  if (['chain', 'chains', 'rope-chains'].includes(clean)) return 'chains';
  if (['pendant', 'pendants', 'locket', 'lockets'].includes(clean)) return 'pendants';
  if (['coin', 'coins', 'bars', 'coins-bars', 'bullion', 'gold-coins', 'silver-coins'].includes(clean)) return 'coins';
  if (['kid', 'kids', 'children', 'baby', 'baby-jewellery'].includes(clean)) return 'kids';

  return clean in CATEGORY_DEFINITIONS ? clean : 'all';
}

export default function JewelleryCategory() {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { rates } = useRates();

  // Resolve current active category metadata
  const categoryKey = resolveCategoryKey(categorySlug);
  const categoryMeta = CATEGORY_DEFINITIONS[categoryKey] || CATEGORY_DEFINITIONS.all;

  // Filter States
  const [selectedMetal, setSelectedMetal] = useState<string>(() => {
    return searchParams.get('metal') || categoryMeta.defaultMetal || 'All';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return searchParams.get('category') || categoryMeta.defaultCategory || 'All';
  });
  const [selectedCollection, setSelectedCollection] = useState<string>(() => {
    return searchParams.get('collection') || categoryMeta.defaultCollection || 'All';
  });
  const [selectedGender, setSelectedGender] = useState<string>(() => {
    return searchParams.get('gender') || categoryMeta.defaultGender || 'All';
  });
  const [selectedPurity, setSelectedPurity] = useState<string>(() => searchParams.get('purity') || 'All');
  const [selectedBudget, setSelectedBudget] = useState<string>(() => searchParams.get('budget') || 'All');
  const [selectedOccasion, setSelectedOccasion] = useState<string>(() => searchParams.get('occasion') || 'All');
  const [inStockOnly, setInStockOnly] = useState<boolean>(() => searchParams.get('inStock') === 'true');
  const [sortBy, setSortBy] = useState<string>(() => searchParams.get('sort') || 'featured');
  const [searchQuery, setSearchQuery] = useState<string>(() => searchParams.get('q') || '');
  const [activeSubcatFilter, setActiveSubcatFilter] = useState<string>('All');

  // UI States
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<3 | 4>(4);
  const [quickViewProduct, setQuickViewProduct] = useState<JewelryItem | null>(null);
  const [products, setProducts] = useState<JewelryItem[]>(localJewelryItems);
  const [loading, setLoading] = useState(false);

  // Ambient background video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [categorySlug]);

  // Sync state whenever category URL changes
  useEffect(() => {
    const nextKey = resolveCategoryKey(categorySlug);
    const nextMeta = CATEGORY_DEFINITIONS[nextKey] || CATEGORY_DEFINITIONS.all;
    
    // Set default filters based on category metadata if not explicitly provided in URL
    const urlMetal = searchParams.get('metal');
    const urlCategory = searchParams.get('category');
    const urlCollection = searchParams.get('collection');
    const urlGender = searchParams.get('gender');

    setSelectedMetal(urlMetal || nextMeta.defaultMetal || 'All');
    setSelectedCategory(urlCategory || nextMeta.defaultCategory || 'All');
    setSelectedCollection(urlCollection || nextMeta.defaultCollection || 'All');
    setSelectedGender(urlGender || nextMeta.defaultGender || 'All');
    setActiveSubcatFilter('All');
  }, [categorySlug]);

  // Load live products from ApiService with fallback and live event synchronization
  useEffect(() => {
    let isMounted = true;

    const fetchCatalogue = () => {
      ApiService.getJewelryItems()
        .then(items => {
          if (isMounted && items && items.length > 0) {
            setProducts(items);
          }
        })
        .catch(() => {
          if (isMounted) setProducts(localJewelryItems);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    setLoading(true);
    fetchCatalogue();

    const handleCatalogueUpdated = () => {
      fetchCatalogue();
    };

    window.addEventListener('catalogue:updated', handleCatalogueUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('catalogue:updated', handleCatalogueUpdated);
    };
  }, []);

  // Update URL search parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedMetal !== 'All') params.set('metal', selectedMetal);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedCollection !== 'All') params.set('collection', selectedCollection);
    if (selectedGender !== 'All') params.set('gender', selectedGender);
    if (selectedPurity !== 'All') params.set('purity', selectedPurity);
    if (selectedBudget !== 'All') params.set('budget', selectedBudget);
    if (selectedOccasion !== 'All') params.set('occasion', selectedOccasion);
    if (inStockOnly) params.set('inStock', 'true');
    if (sortBy !== 'featured') params.set('sort', sortBy);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());

    setSearchParams(params, { replace: true });
  }, [selectedMetal, selectedCategory, selectedCollection, selectedGender, selectedPurity, selectedBudget, selectedOccasion, inStockOnly, sortBy, searchQuery]);

  // Filter and Sort Engine
  const filteredProducts = useMemo(() => {
    const isPreview = searchParams.get('preview') === 'true';

    return products.filter(product => {
      // Exclude draft and archived items from public customer store
      if (!isPreview && (product.status === 'archived' || product.status === 'draft')) {
        return false;
      }

      // 0. Gender filter
      if (selectedGender !== 'All') {
        const prodGender = (product.gender || 'unisex').toLowerCase();
        const targetGender = selectedGender.toLowerCase();
        if (targetGender === 'men' || targetGender === 'mens') {
          if (prodGender !== 'men' && prodGender !== 'unisex') return false;
        } else if (targetGender === 'women' || targetGender === 'womens') {
          if (prodGender !== 'women' && prodGender !== 'unisex') return false;
        } else if (targetGender === 'unisex') {
          if (prodGender !== 'unisex') return false;
        } else if (targetGender === 'kids') {
          if (prodGender !== 'kids') return false;
        }
      }

      // 1. Metal filter
      if (selectedMetal !== 'All') {
        const prodMetal = (product.metal_type || '').toLowerCase();
        const targetMetal = selectedMetal.toLowerCase();
        if (targetMetal === 'diamond' && prodMetal !== 'diamond' && !(product.tags || []).includes('diamond')) return false;
        if (targetMetal === 'gold' && prodMetal !== 'gold') return false;
        if (targetMetal === 'platinum' && prodMetal !== 'platinum') return false;
        if (targetMetal === 'silver' && prodMetal !== 'silver') return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All') {
        const prodCat = (product.category || '').toLowerCase();
        const targetCat = selectedCategory.toLowerCase();
        if (!prodCat.includes(targetCat) && !targetCat.includes(prodCat)) {
          // Special checks for aliases
          if (targetCat === 'bangles' && (prodCat.includes('bangle') || prodCat.includes('kada') || prodCat.includes('bracelet'))) {
            // match
          } else if (targetCat === 'necklaces' && (prodCat.includes('necklace') || prodCat.includes('haram') || prodCat.includes('choker'))) {
            // match
          } else {
            return false;
          }
        }
      }

      // 3. Collection filter
      if (selectedCollection !== 'All') {
        const prodColl = (product.collection || '').toLowerCase();
        const prodTags = (product.tags || []).map(t => t.toLowerCase());
        const targetColl = selectedCollection.toLowerCase();
        if (!prodColl.includes(targetColl) && !prodTags.some(t => t.includes(targetColl))) {
          return false;
        }
      }

      // 4. Subcat filter (from quick pills)
      if (activeSubcatFilter !== 'All') {
        const sub = activeSubcatFilter.toLowerCase();
        const name = product.name.toLowerCase();
        const desc = (product.description || '').toLowerCase();
        const tags = (product.tags || []).map(t => t.toLowerCase());
        const match = name.includes(sub) || desc.includes(sub) || tags.some(t => t.includes(sub));
        if (!match) return false;
      }

      // 5. Purity filter
      if (selectedPurity !== 'All') {
        const prodPurity = (product.purity || '').toUpperCase();
        if (!prodPurity.includes(selectedPurity.toUpperCase())) return false;
      }

      // 6. Occasion filter
      if (selectedOccasion !== 'All') {
        const prodOccasion = (product.occasion || '').toLowerCase();
        const prodTags = (product.tags || []).map(t => t.toLowerCase());
        if (!prodOccasion.includes(selectedOccasion.toLowerCase()) && !prodTags.includes(selectedOccasion.toLowerCase())) {
          return false;
        }
      }

      // 7. Budget filter
      if (selectedBudget !== 'All') {
        const p = product.price;
        if (selectedBudget === 'under-25k' && p >= 25000) return false;
        if (selectedBudget === '25k-50k' && (p < 25000 || p >= 50000)) return false;
        if (selectedBudget === '50k-1L' && (p < 50000 || p >= 100000)) return false;
        if (selectedBudget === '1L-2.5L' && (p < 100000 || p >= 250000)) return false;
        if (selectedBudget === 'above-2.5L' && p < 250000) return false;
      }

      // 8. In Stock filter
      if (inStockOnly && product.in_stock === false) return false;

      // 9. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = product.name.toLowerCase().includes(q);
        const skuMatch = (product.sku || '').toLowerCase().includes(q);
        const catMatch = (product.category || '').toLowerCase().includes(q);
        const descMatch = (product.description || '').toLowerCase().includes(q);
        const tagMatch = (product.tags || []).some(t => t.toLowerCase().includes(q));
        if (!nameMatch && !skuMatch && !catMatch && !descMatch && !tagMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'weight-low') return (a.weight || 0) - (b.weight || 0);
      return (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0);
    });
  }, [products, selectedGender, selectedMetal, selectedCategory, selectedCollection, activeSubcatFilter, selectedPurity, selectedOccasion, selectedBudget, inStockOnly, searchQuery, sortBy]);

  const clearAllFilters = useCallback(() => {
    setSelectedMetal('All');
    setSelectedCategory('All');
    setSelectedCollection('All');
    setSelectedGender('All');
    setSelectedPurity('All');
    setSelectedBudget('All');
    setSelectedOccasion('All');
    setInStockOnly(false);
    setSearchQuery('');
    setActiveSubcatFilter('All');
    setSortBy('featured');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      selectedGender !== 'All' ||
      selectedMetal !== 'All' ||
      selectedCategory !== 'All' ||
      selectedCollection !== 'All' ||
      selectedPurity !== 'All' ||
      selectedBudget !== 'All' ||
      selectedOccasion !== 'All' ||
      inStockOnly ||
      searchQuery.trim().length > 0 ||
      activeSubcatFilter !== 'All'
    );
  }, [selectedGender, selectedMetal, selectedCategory, selectedCollection, selectedPurity, selectedBudget, selectedOccasion, inStockOnly, searchQuery, activeSubcatFilter]);

  // Handle pill click
  const handleSubcategoryPillClick = (item: { label: string; filterKey: string; filterValue: string }) => {
    if (item.filterKey === 'category') {
      setSelectedCategory(selectedCategory === item.filterValue ? 'All' : item.filterValue);
    } else if (item.filterKey === 'gender') {
      setSelectedGender(selectedGender === item.filterValue ? 'All' : item.filterValue);
    } else if (item.filterKey === 'metal') {
      setSelectedMetal(selectedMetal === item.filterValue ? 'All' : item.filterValue);
    } else if (item.filterKey === 'collection') {
      setSelectedCollection(selectedCollection === item.filterValue ? 'All' : item.filterValue);
    } else if (item.filterKey === 'subcat') {
      setActiveSubcatFilter(activeSubcatFilter === item.filterValue ? 'All' : item.filterValue);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] dark:bg-[#120D0F] text-[#241B1D] dark:text-[#F8F3F4] transition-colors duration-200">
      
      {/* ===================================================================== */}
      {/* 1. LUXURY CATEGORY HERO BANNER (Ambient Background Video Experience)   */}
      {/* ===================================================================== */}
      <section 
        className="relative overflow-hidden bg-[#1A0308] text-white border-b border-[#C6A15B]/30 min-h-[360px] sm:min-h-[400px] md:min-h-[440px] flex flex-col justify-between"
      >
        {/* Full-Bleed Low-Opacity Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {categoryMeta.bannerVideo ? (
            <video
              key={categoryMeta.bannerVideo}
              ref={videoRef}
              src={categoryMeta.bannerVideo}
              poster={categoryMeta.bannerPoster || categoryMeta.bannerImage}
              preload="auto"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover select-none scale-[1.01] opacity-95 transition-opacity duration-700"
              style={{ objectPosition: categoryMeta.objectPosition || 'center center' }}
            />
          ) : (
            <img
              src={categoryMeta.bannerPoster || categoryMeta.bannerImage}
              alt={categoryMeta.title}
              className="w-full h-full object-cover select-none opacity-95"
            />
          )}

          {/* High-Clarity Scrim: Soft shade on text side only, fading to transparent so the video is fully visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#170105]/85 via-[#170105]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 w-full flex-1 flex flex-col justify-between">
          {/* Top Navigation Bar: Reusable Back Button & Breadcrumbs */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
            <BackButton
              fallbackPath="/"
              label={categorySlug ? 'Back to All Collections' : 'Back to Storefront'}
              variant="pill"
            />
            <nav className="flex items-center gap-2 text-xs font-sans text-stone-300" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-[#D8B878] transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#C6A15B]" />
              <Link to="/jewellery" className="hover:text-[#D8B878] transition-colors">Jewellery</Link>
              {categorySlug && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C6A15B]" />
                  <span className="text-[#D8B878] font-semibold">{categoryMeta.title}</span>
                </>
              )}
            </nav>
          </div>

          {/* Category Information */}
          <div className="max-w-3xl space-y-4 my-auto">
            {/* Hallmark & Certification Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#C6A15B]/40 text-[#D8B878] text-[11px] font-sans font-semibold tracking-wider uppercase shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D8B878]" />
              <span>{categoryMeta.tagline}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {categoryMeta.title}
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-stone-200/95 leading-relaxed font-sans max-w-2xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {categoryMeta.description}
            </p>

            {/* Live Precious Metals Benchmark Strip (Real-time Gold & Silver Rates) */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-sans text-stone-200 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-white/70">Live Benchmark:</span>
                
                {categoryMeta.defaultMetal === 'silver' || selectedMetal.toLowerCase() === 'silver' ? (
                  <div className="flex items-center gap-1.5">
                    <strong className="text-white font-bold">999 Silver ₹{rates.silver.toLocaleString('en-IN')}/g</strong>
                    <span className="text-[#D8B878] font-mono text-[11px]">(₹{(Math.round(rates.silver * 1000)).toLocaleString('en-IN')}/Kg)</span>
                  </div>
                ) : categoryMeta.defaultMetal === 'platinum' || selectedMetal.toLowerCase() === 'platinum' ? (
                  <strong className="text-white font-bold">Pt 950 Platinum ₹{rates.platinum.toLocaleString('en-IN')}/g</strong>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-white/70">24K Gold:</span>
                      <strong className="text-white font-bold">₹{rates.gold.toLocaleString('en-IN')}/g</strong>
                    </div>
                    <span className="text-white/30 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white/70">999 Silver:</span>
                      <strong className="text-[#D8B878] font-bold">₹{rates.silver.toLocaleString('en-IN')}/g</strong>
                      <span className="text-white/50 font-mono text-[10px] hidden md:inline">(₹{(Math.round(rates.silver * 1000)).toLocaleString('en-IN')}/Kg)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/80 shadow-sm">
                <span>Total Designs: </span>
                <strong className="text-[#D8B878] font-bold">{filteredProducts.length}</strong>
              </div>

              <Link 
                to="/live-rates" 
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#C6A15B]/20 hover:bg-[#C6A15B] text-[#D8B878] hover:text-[#1A080B] text-[11px] font-sans font-medium transition-all border border-[#C6A15B]/30"
                title="View full bullion rate charts and 24h market trends"
              >
                <span>Live Bullion Board</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Joyalukkas 4-Pillar Trust Strip */}
        <div className="relative z-10 bg-[#160207]/80 backdrop-blur-md border-t border-[#C6A15B]/25 py-2.5 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left text-[11px] font-sans text-stone-300">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D8B878] shrink-0" />
              <span>100% Certified (BIS 916 &amp; IGI)</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Truck className="w-4 h-4 text-[#D8B878] shrink-0" />
              <span>Free Insured Express Delivery</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <RefreshCw className="w-4 h-4 text-[#D8B878] shrink-0" />
              <span>Lifetime Exchange &amp; Buyback</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Gem className="w-4 h-4 text-[#D8B878] shrink-0" />
              <span>Zero Deduction Old Gold Exchange</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. SUBCATEGORY QUICK-FILTER CHIPS (Joyalukkas Style Category Navigation) */}
      {/* ===================================================================== */}
      {categoryMeta.subcategories && categoryMeta.subcategories.length > 0 && (
        <section className="bg-white dark:bg-[#1A1215] border-b border-[#EAE5E6] dark:border-[#332026] sticky top-[100px] z-20 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1 hidden sm:inline">
                Curated:
              </span>
              {categoryMeta.subcategories.map((sub, idx) => {
                const isActive = 
                  (sub.filterKey === 'category' && selectedCategory === sub.filterValue) ||
                  (sub.filterKey === 'metal' && selectedMetal === sub.filterValue) ||
                  (sub.filterKey === 'collection' && selectedCollection === sub.filterValue) ||
                  (sub.filterKey === 'subcat' && activeSubcatFilter === sub.filterValue);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubcategoryPillClick(sub)}
                    className={`text-xs px-3.5 py-1.5 rounded-full font-sans font-medium transition-all shrink-0 cursor-pointer border ${
                      isActive
                        ? 'bg-[#450817] text-[#D8B878] border-[#450817] dark:bg-[#D8B878] dark:text-[#120D0F] dark:border-[#D8B878] shadow-xs'
                        : 'bg-[#FAF9F8] dark:bg-[#251B1F] text-[#4A4245] dark:text-[#D1C7CA] border-[#EAE5E6] dark:border-[#3D2830] hover:border-[#C6A15B] hover:text-[#450817] dark:hover:text-[#D8B878]'
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 3. MAIN LISTING CONTENT: Sidebar Filters + Responsive Grid            */}
      {/* ===================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Top Controls Bar: Results Counter, Active Filter Chips, Grid View & Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#EAE5E6] dark:border-[#332026]">
          
          {/* Left: Product Counter & Search */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1A1215] border border-[#EAE5E6] dark:border-[#332026] text-xs font-semibold shadow-xs hover:border-[#C6A15B] cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#C6A15B]" />
              <span>Filters ({hasActiveFilters ? 'Active' : 'All'})</span>
            </button>

            <span className="text-xs sm:text-sm font-sans font-medium text-[#777174] dark:text-[#C1B4B8]">
              Showing <strong className="text-[#241B1D] dark:text-[#F8F3F4] font-semibold">{filteredProducts.length}</strong> creations
            </span>
          </div>

          {/* Right: Sort & Grid Layout */}
          <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap">
            
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-sans text-[#777174] dark:text-[#C1B4B8] shrink-0 hidden sm:inline">
                Sort By:
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none text-xs font-sans font-medium py-2 pl-3 pr-8 rounded-xl bg-white dark:bg-[#1A1215] border border-[#EAE5E6] dark:border-[#332026] focus:outline-none focus:border-[#C6A15B] cursor-pointer text-[#241B1D] dark:text-[#F8F3F4] shadow-xs"
                >
                  <option value="featured">Featured Picks</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">New Arrivals First</option>
                  <option value="rating">Highest Customer Rating</option>
                  <option value="weight-low">Lightweight Designs First</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#777174] dark:text-[#C1B4B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Grid Toggle (Desktop) */}
            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-[#1A1215] p-1 rounded-xl border border-[#EAE5E6] dark:border-[#332026] shadow-xs">
              <button
                type="button"
                onClick={() => setGridColumns(3)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${gridColumns === 3 ? 'bg-[#450817] text-[#D8B878]' : 'text-stone-400 hover:text-stone-700'}`}
                title="3 Columns (Editorial View)"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setGridColumns(4)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${gridColumns === 4 ? 'bg-[#450817] text-[#D8B878]' : 'text-stone-400 hover:text-stone-700'}`}
                title="4 Columns (Compact Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Badges Strip */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap mb-6 p-3 rounded-xl bg-white dark:bg-[#1A1215] border border-[#EAE5E6] dark:border-[#332026] text-xs">
            <span className="font-semibold text-stone-500 text-[11px] uppercase tracking-wider mr-1">Active:</span>
            {selectedGender !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-xs font-medium text-[#450817] dark:text-[#D8B878]">
                <span>Gender: {selectedGender === 'men' ? "Men's Collection" : selectedGender === 'women' ? "Women's Collection" : selectedGender === 'unisex' ? "Unisex & Bullion" : selectedGender}</span>
                <button type="button" onClick={() => setSelectedGender('All')} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedMetal !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-xs">
                <span>Metal: {selectedMetal}</span>
                <button type="button" onClick={() => setSelectedMetal('All')} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-xs">
                <span>Category: {selectedCategory}</span>
                <button type="button" onClick={() => setSelectedCategory('All')} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBudget !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-xs">
                <span>Budget: {selectedBudget}</span>
                <button type="button" onClick={() => setSelectedBudget('All')} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedPurity !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-xs">
                <span>Purity: {selectedPurity}</span>
                <button type="button" onClick={() => setSelectedPurity('All')} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeSubcatFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-xs">
                <span>Keyword: {activeSubcatFilter}</span>
                <button type="button" onClick={() => setActiveSubcatFilter('All')} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] text-xs">
                <span>In Stock Only</span>
                <button type="button" onClick={() => setInStockOnly(false)} className="hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[#450817] dark:text-[#D8B878] font-semibold hover:underline ml-auto text-xs"
            >
              Reset All
            </button>
          </div>
        )}

        {/* 2-Column Desktop Layout: Left Sidebar + Right Products Grid */}
        <div className="flex gap-8 items-start">
          
          {/* DESKTOP SIDEBAR FILTERS (Sticky Joyalukkas Standard) */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-[160px] space-y-6 bg-white dark:bg-[#1A1215] p-5 rounded-2xl border border-[#EAE5E6] dark:border-[#332026] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5E6] dark:border-[#332026]">
              <span className="font-serif text-base font-semibold text-[#450817] dark:text-[#D8B878] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Refine Selection</span>
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] font-sans font-medium text-stone-500 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Group: Shop by Gender */}
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5 flex items-center justify-between">
                <span>Shop by Gender</span>
                <span className="text-[10px] text-[#C6A15B] font-semibold">Curated</span>
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'All', label: 'All Collections' },
                  { id: 'women', label: "Women's Fine Jewels" },
                  { id: 'men', label: "Men's Luxury Jewellery" },
                  { id: 'unisex', label: 'Unisex & Bullion' }
                ].map(g => (
                  <label
                    key={g.id}
                    className="flex items-center gap-2 text-xs font-sans text-[#241B1D] dark:text-[#F8F3F4] cursor-pointer py-0.5 hover:text-[#450817] dark:hover:text-[#D8B878]"
                  >
                    <input
                      type="radio"
                      name="sidebar-gender"
                      checked={selectedGender.toLowerCase() === g.id.toLowerCase()}
                      onChange={() => setSelectedGender(g.id)}
                      className="rounded border-[#C6A15B] text-[#450817] focus:ring-[#C6A15B]"
                    />
                    <span className={selectedGender.toLowerCase() === g.id.toLowerCase() ? 'font-semibold text-[#450817] dark:text-[#D8B878]' : ''}>
                      {g.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Precious Metals */}
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                Precious Metal
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'All', label: 'All Metals' },
                  { id: 'gold', label: 'Pure Gold (22K / 24K)' },
                  { id: 'diamond', label: 'Natural Diamond' },
                  { id: 'platinum', label: 'Platinum 950' },
                  { id: 'silver', label: 'Sterling Silver 925' }
                ].map(metal => (
                  <label
                    key={metal.id}
                    className="flex items-center gap-2 text-xs font-sans text-[#241B1D] dark:text-[#F8F3F4] cursor-pointer py-0.5 hover:text-[#450817] dark:hover:text-[#D8B878]"
                  >
                    <input
                      type="radio"
                      name="sidebar-metal"
                      checked={selectedMetal.toLowerCase() === metal.id.toLowerCase()}
                      onChange={() => setSelectedMetal(metal.id)}
                      className="rounded border-[#C6A15B] text-[#450817] focus:ring-[#C6A15B]"
                    />
                    <span>{metal.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Category Type */}
            <div className="pt-4 border-t border-[#EAE5E6] dark:border-[#332026]">
              <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                Jewellery Type
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {[
                  'All',
                  'Necklaces',
                  'Bridal Sets',
                  'Earrings',
                  'Rings',
                  'Bangles',
                  'Chains',
                  'Pendants',
                  'Gold coins'
                ].map(cat => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 text-xs font-sans text-[#241B1D] dark:text-[#F8F3F4] cursor-pointer py-0.5 hover:text-[#450817] dark:hover:text-[#D8B878]"
                  >
                    <input
                      type="radio"
                      name="sidebar-category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="rounded border-[#C6A15B] text-[#450817] focus:ring-[#C6A15B]"
                    />
                    <span>{cat === 'All' ? 'All Jewellery' : cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Price Budget */}
            <div className="pt-4 border-t border-[#EAE5E6] dark:border-[#332026]">
              <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
                Price Budget
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'All', label: 'All Budgets' },
                  { id: 'under-25k', label: 'Under ₹25,000' },
                  { id: '25k-50k', label: '₹25,000 – ₹50,000' },
                  { id: '50k-1L', label: '₹50,000 – ₹1,00,000' },
                  { id: '1L-2.5L', label: '₹1,00,000 – ₹2,50,000' },
                  { id: 'above-2.5L', label: 'Above ₹2,50,000' }
                ].map(b => (
                  <label
                    key={b.id}
                    className="flex items-center gap-2 text-xs font-sans text-[#241B1D] dark:text-[#F8F3F4] cursor-pointer py-0.5 hover:text-[#450817] dark:hover:text-[#D8B878]"
                  >
                    <input
                      type="radio"
                      name="sidebar-budget"
                      checked={selectedBudget === b.id}
                      onChange={() => setSelectedBudget(b.id)}
                      className="rounded border-[#C6A15B] text-[#450817] focus:ring-[#C6A15B]"
                    />
                    <span>{b.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Fast Shipping & In Stock */}
            <div className="pt-4 border-t border-[#EAE5E6] dark:border-[#332026]">
              <label className="flex items-center gap-2 text-xs font-sans text-[#241B1D] dark:text-[#F8F3F4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-[#C6A15B] text-[#450817] focus:ring-[#C6A15B]"
                />
                <span className="font-medium">In Stock Only (Ready to Dispatch)</span>
              </label>
            </div>
          </aside>

          {/* RIGHT: PRODUCT GRID */}
          <section className="flex-1 min-w-0">
            {loading ? (
              // Skeleton loading state
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-[#1A1215] rounded-2xl p-4 border border-stone-200 dark:border-stone-800 space-y-4">
                    <div className="aspect-square bg-stone-200 dark:bg-stone-800 rounded-xl" />
                    <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              // Grid of authentic creations
              <div className={`grid grid-cols-2 sm:grid-cols-3 ${gridColumns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
                {filteredProducts.map((product) => (
                  <SignatureLuxuryCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            ) : (
              // Empty State
              <div className="bg-white dark:bg-[#1A1215] rounded-2xl p-10 sm:p-14 text-center border border-[#EAE5E6] dark:border-[#332026] shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#FAF9F8] dark:bg-[#20171A] border border-[#EAE5E6] dark:border-[#46343A] flex items-center justify-center mx-auto mb-4 text-[#C6A15B]">
                  <Gem className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-medium mb-2">No Matching Jewels Found</h3>
                <p className="text-xs sm:text-sm text-[#777174] dark:text-[#C1B4B8] max-w-md mx-auto mb-6">
                  We could not find any creation matching your specific filter criteria in this category. Try adjusting or resetting your filters.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#450817] hover:bg-[#6A1B2B] text-[#D8B878] text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 4. MOBILE SLIDE-OUT FILTER DRAWER                                     */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative ml-auto w-full max-w-xs bg-white dark:bg-[#1A1215] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#EAE5E6] dark:border-[#332026] mb-6">
                  <h3 className="font-serif text-lg font-medium">Refine Filters</h3>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Gender Filter */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Shop by Gender</h4>
                    <div className="space-y-1.5">
                      {[
                        { id: 'All', label: 'All Collections' },
                        { id: 'women', label: "Women's Collection" },
                        { id: 'men', label: "Men's Collection" },
                        { id: 'unisex', label: 'Unisex & Bullion' }
                      ].map(g => (
                        <label key={g.id} className="flex items-center gap-2 text-xs font-sans">
                          <input
                            type="radio"
                            name="mobile-gender"
                            checked={selectedGender.toLowerCase() === g.id.toLowerCase()}
                            onChange={() => setSelectedGender(g.id)}
                            className="rounded border-[#C6A15B] text-[#450817]"
                          />
                          <span className={selectedGender.toLowerCase() === g.id.toLowerCase() ? 'font-semibold text-[#450817] dark:text-[#D8B878]' : ''}>
                            {g.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Metal Filter */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Metal</h4>
                    <div className="space-y-1.5">
                      {['All', 'Gold', 'Diamond', 'Platinum', 'Silver'].map(m => (
                        <label key={m} className="flex items-center gap-2 text-xs font-sans">
                          <input
                            type="radio"
                            name="mobile-metal"
                            checked={selectedMetal.toLowerCase() === m.toLowerCase()}
                            onChange={() => setSelectedMetal(m)}
                            className="rounded border-[#C6A15B] text-[#450817]"
                          />
                          <span>{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Category</h4>
                    <div className="space-y-1.5">
                      {['All', 'Necklaces', 'Bridal Sets', 'Earrings', 'Rings', 'Bangles', 'Chains', 'Pendants', 'Gold coins'].map(c => (
                        <label key={c} className="flex items-center gap-2 text-xs font-sans">
                          <input
                            type="radio"
                            name="mobile-category"
                            checked={selectedCategory === c}
                            onChange={() => setSelectedCategory(c)}
                            className="rounded border-[#C6A15B] text-[#450817]"
                          />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Budget</h4>
                    <div className="space-y-1.5">
                      {[
                        { id: 'All', label: 'All Budgets' },
                        { id: 'under-25k', label: 'Under ₹25,000' },
                        { id: '25k-50k', label: '₹25,000 – ₹50,000' },
                        { id: '50k-1L', label: '₹50,000 – ₹1,00,000' },
                        { id: '1L-2.5L', label: '₹1,00,000 – ₹2,50,000' },
                        { id: 'above-2.5L', label: 'Above ₹2,50,000' }
                      ].map(b => (
                        <label key={b.id} className="flex items-center gap-2 text-xs font-sans">
                          <input
                            type="radio"
                            name="mobile-budget"
                            checked={selectedBudget === b.id}
                            onChange={() => setSelectedBudget(b.id)}
                            className="rounded border-[#C6A15B] text-[#450817]"
                          />
                          <span>{b.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#EAE5E6] dark:border-[#332026] flex gap-3">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#450817] text-[#D8B878] text-xs font-semibold shadow-md"
                >
                  Apply ({filteredProducts.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 5. PRODUCT QUICK-VIEW MODAL INTEGRATION                               */}
      {/* ===================================================================== */}
      {quickViewProduct && (
        <ProductDetailsModal
          isOpen={Boolean(quickViewProduct)}
          item={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
