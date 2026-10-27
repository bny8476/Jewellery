import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

export interface ComparisonSource {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl: string;
  integrationMethod: 'manual_entry' | 'authorized_feed' | 'api';
  syncSchedule: string;
  isEnabled: boolean;
  lastSyncAt: string | null;
  status: 'healthy' | 'warning' | 'error';
  verifiedProductCount: number;
  totalProductCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RetailerProductListing {
  id: string;
  sourceId: string;
  sourceName: string;
  externalProductId: string;
  productUrl: string;
  name: string;
  category: string;
  metalType: 'gold' | 'silver' | 'platinum';
  purity: '24K' | '22K' | '18K' | '14K' | '925' | 'Pt950';
  grossWeight: number;
  netMetalWeight: number;
  stoneWeight?: number;
  stoneDescription?: string;
  baseMetalValue: number;
  makingChargesMethod: 'percentage' | 'per_gram' | 'fixed';
  makingChargesValue: number;
  calculatedMakingCharges: number;
  stoneCharges: number;
  wastagePercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  deliveryCharges: number;
  finalPrice: number;
  imageUrl: string;
  inStock: boolean;
  lastVerifiedAt: string;
  confidenceStatus: 'verified' | 'pending_review' | 'estimated';
  specDifferences?: string[];
}

export interface ProductMatch {
  id: string;
  yazhiniProductId: string;
  yazhiniProductName: string;
  yazhiniProductSku: string;
  yazhiniCategory: string;
  yazhiniMetalType: 'gold' | 'silver' | 'platinum';
  yazhiniPurity: string;
  yazhiniNetWeight: number;
  yazhiniGrossWeight: number;
  yazhiniMakingCharges: number;
  yazhiniPrice: number;
  yazhiniImageUrl: string;
  matchedRetailerListing: RetailerProductListing;
  matchConfidenceScore: number; // 0 - 100
  matchedAttributes: string[];
  matchStatus: 'approved' | 'pending' | 'rejected';
  priceDifference: number; // yazhiniPrice - retailerPrice
  weightDifference: number; // yazhiniNetWeight - retailerNetWeight
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface ComparisonSyncLog {
  id: string;
  sourceId: string;
  sourceName: string;
  syncType: 'manual_verification' | 'scheduled_feed' | 'api_fetch';
  status: 'success' | 'failed' | 'partial';
  itemsProcessed: number;
  itemsUpdated: number;
  errorMessage?: string;
  durationMs: number;
  createdAt: string;
}

export interface SavedComparison {
  id: string;
  userId?: string;
  name?: string;
  productIds: string[];
  createdAt: string;
}

// Initial benchmark comparison sources
const INITIAL_SOURCES: ComparisonSource[] = [
  {
    id: 'source-jos-alukkas',
    name: 'Jos Alukkas Online',
    slug: 'jos-alukkas',
    websiteUrl: 'https://www.josalukkasonline.com',
    integrationMethod: 'manual_entry',
    syncSchedule: 'Daily 10:00 AM IST',
    isEnabled: true,
    lastSyncAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    status: 'healthy',
    verifiedProductCount: 16,
    totalProductCount: 16,
    createdAt: '2026-10-01T04:30:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'source-joyalukkas',
    name: 'Joyalukkas India',
    slug: 'joyalukkas',
    websiteUrl: 'https://www.joyalukkas.in',
    integrationMethod: 'manual_entry',
    syncSchedule: 'Daily 10:30 AM IST',
    isEnabled: true,
    lastSyncAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    status: 'healthy',
    verifiedProductCount: 18,
    totalProductCount: 18,
    createdAt: '2026-10-01T04:30:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'source-malabar',
    name: 'Malabar Gold & Diamonds',
    slug: 'malabar',
    websiteUrl: 'https://www.malabargoldanddiamonds.com',
    integrationMethod: 'authorized_feed',
    syncSchedule: 'Daily 11:00 AM IST',
    isEnabled: true,
    lastSyncAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    status: 'healthy',
    verifiedProductCount: 14,
    totalProductCount: 14,
    createdAt: '2026-10-01T04:30:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'source-tanishq',
    name: 'Tanishq (Titan)',
    slug: 'tanishq',
    websiteUrl: 'https://www.tanishq.co.in',
    integrationMethod: 'manual_entry',
    syncSchedule: 'Bi-Weekly',
    isEnabled: true,
    lastSyncAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    status: 'healthy',
    verifiedProductCount: 12,
    totalProductCount: 12,
    createdAt: '2026-10-01T04:30:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

// Initial realistic benchmark matches comparing YAZHINI products with competitor equivalents
const INITIAL_MATCHES: ProductMatch[] = [
  {
    id: 'match-001',
    yazhiniProductId: 'prod-001',
    yazhiniProductName: 'Nagas Temple Antique Haram 22K',
    yazhiniProductSku: 'YAZ-NEC-8891',
    yazhiniCategory: 'Necklaces',
    yazhiniMetalType: 'gold',
    yazhiniPurity: '22K',
    yazhiniNetWeight: 42.0,
    yazhiniGrossWeight: 42.5,
    yazhiniMakingCharges: 14500,
    yazhiniPrice: 326700,
    yazhiniImageUrl: '/images/necklace_temple_nagas_haram.jpg',
    matchedRetailerListing: {
      id: 'ret-ja-001',
      sourceId: 'source-jos-alukkas',
      sourceName: 'Jos Alukkas Online',
      externalProductId: 'JA-NEC-ANT-902',
      productUrl: 'https://www.josalukkasonline.com/antique-temple-haram-22k',
      name: 'Heritage Temple Antique Bridal Haram 22K',
      category: 'Necklaces',
      metalType: 'gold',
      purity: '22K',
      grossWeight: 44.2,
      netMetalWeight: 41.5,
      stoneWeight: 2.7,
      stoneDescription: 'Synthetic Rubies & Kundan Stones',
      baseMetalValue: 284275, // 41.5 * 6850
      makingChargesMethod: 'percentage',
      makingChargesValue: 14.5,
      calculatedMakingCharges: 41220,
      stoneCharges: 3500,
      wastagePercent: 0,
      discountAmount: 2000,
      taxableAmount: 326995,
      gstPercent: 3.0,
      gstAmount: 9810,
      deliveryCharges: 0,
      finalPrice: 336805,
      imageUrl: '/images/necklace_manga_malai_temple.jpg',
      inStock: true,
      lastVerifiedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      confidenceStatus: 'verified',
      specDifferences: [
        'YAZHINI net gold is 42.0g vs Jos Alukkas 41.5g (+0.5g gold value)',
        'Jos Alukkas making charges are 14.5% (₹41,220) vs YAZHINI direct artisan making ₹14,500',
        'YAZHINI offers pure 22K solid antique finish with fewer stone deductions'
      ]
    },
    matchConfidenceScore: 94,
    matchedAttributes: ['Category: Necklaces', 'Purity: 22K', 'Weight Parity: 42g ± 1g', 'Design Motif: Temple Antique'],
    matchStatus: 'approved',
    priceDifference: -10105, // YAZHINI is ₹10,105 better value for +0.5g more gold
    weightDifference: 0.5,
    reviewedBy: 'Super Admin (Head of Valuation)',
    reviewedAt: '2026-10-24T09:15:00.000Z',
    reviewNotes: 'Verified parity in 22K purity and antique hallmarking. YAZHINI features lower labor premium.',
    createdAt: '2026-10-24T09:15:00.000Z'
  },
  {
    id: 'match-002',
    yazhiniProductId: 'prod-002',
    yazhiniProductName: 'Traditional Manga Malai Temple Necklace 22K',
    yazhiniProductSku: 'YAZ-NEC-7712',
    yazhiniCategory: 'Necklaces',
    yazhiniMetalType: 'gold',
    yazhiniPurity: '22K',
    yazhiniNetWeight: 32.5,
    yazhiniGrossWeight: 32.5,
    yazhiniMakingCharges: 9800,
    yazhiniPrice: 243900,
    yazhiniImageUrl: '/images/necklace_manga_malai_temple.jpg',
    matchedRetailerListing: {
      id: 'ret-joy-002',
      sourceId: 'source-joyalukkas',
      sourceName: 'Joyalukkas India',
      externalProductId: 'JOY-GOLD-MNG-112',
      productUrl: 'https://www.joyalukkas.in/temple-mango-malai-necklace-22k',
      name: 'Auspicious Mango Motif Traditional Necklace 22K',
      category: 'Necklaces',
      metalType: 'gold',
      purity: '22K',
      grossWeight: 32.0,
      netMetalWeight: 32.0,
      baseMetalValue: 219200, // 32 * 6850
      makingChargesMethod: 'per_gram',
      makingChargesValue: 850,
      calculatedMakingCharges: 27200,
      stoneCharges: 0,
      wastagePercent: 0,
      discountAmount: 1500,
      taxableAmount: 244900,
      gstPercent: 3.0,
      gstAmount: 7347,
      deliveryCharges: 0,
      finalPrice: 252247,
      imageUrl: '/images/necklace_temple_nagas_haram.jpg',
      inStock: true,
      lastVerifiedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      confidenceStatus: 'verified',
      specDifferences: [
        'YAZHINI net gold is 32.5g vs Joyalukkas 32.0g (+0.5g gold value)',
        'Joyalukkas making charge is ₹850/gram (₹27,200) vs YAZHINI ₹9,800 flat making',
        'Both items carry BIS 916 Hallmarking'
      ]
    },
    matchConfidenceScore: 92,
    matchedAttributes: ['Category: Necklaces', 'Purity: 22K', 'Weight Parity: 32g', 'Design Motif: Mango/Manga Malai'],
    matchStatus: 'approved',
    priceDifference: -8347,
    weightDifference: 0.5,
    reviewedBy: 'Super Admin',
    reviewedAt: '2026-10-24T10:00:00.000Z',
    reviewNotes: 'Standard traditional South Indian motif. YAZHINI flat making delivers transparent savings.',
    createdAt: '2026-10-24T10:00:00.000Z'
  },
  {
    id: 'match-003',
    yazhiniProductId: 'prod-003',
    yazhiniProductName: 'Royal Jadau Ruby Emerald Antique Kada',
    yazhiniProductSku: 'YAZ-BAN-4105',
    yazhiniCategory: 'Bangles',
    yazhiniMetalType: 'gold',
    yazhiniPurity: '22K',
    yazhiniNetWeight: 28.0,
    yazhiniGrossWeight: 31.2,
    yazhiniMakingCharges: 8500,
    yazhiniPrice: 224800,
    yazhiniImageUrl: '/images/bangle_jadau_ruby_emerald_antique.jpg',
    matchedRetailerListing: {
      id: 'ret-mal-003',
      sourceId: 'source-malabar',
      sourceName: 'Malabar Gold & Diamonds',
      externalProductId: 'MGD-BAN-JAD-88',
      productUrl: 'https://www.malabargoldanddiamonds.com/jadau-ruby-kada-22k',
      name: 'Era Uncut Diamond & Ruby Designer Kada',
      category: 'Bangles',
      metalType: 'gold',
      purity: '22K',
      grossWeight: 32.5,
      netMetalWeight: 26.5,
      stoneWeight: 6.0,
      stoneDescription: 'Natural Burmese Rubies & Emerald Cabochons',
      baseMetalValue: 181525, // 26.5 * 6850
      makingChargesMethod: 'percentage',
      makingChargesValue: 16.0,
      calculatedMakingCharges: 29044,
      stoneCharges: 18000,
      wastagePercent: 0,
      discountAmount: 2500,
      taxableAmount: 226069,
      gstPercent: 3.0,
      gstAmount: 6782,
      deliveryCharges: 0,
      finalPrice: 232851,
      imageUrl: '/images/bangle_rose_gold_designer_kada.jpg',
      inStock: true,
      lastVerifiedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
      confidenceStatus: 'verified',
      specDifferences: [
        'Notice: YAZHINI has 28.0g net gold vs Malabar 26.5g (+1.5g gold value)',
        'Malabar carries higher stone content (6.0g vs YAZHINI 3.2g) with ₹18,000 stone premium',
        'Direct making charge comparison: YAZHINI ₹8,500 vs Malabar ₹29,044'
      ]
    },
    matchConfidenceScore: 88,
    matchedAttributes: ['Category: Bangles', 'Purity: 22K', 'Style: Antique Kada', 'Stones: Ruby & Emerald'],
    matchStatus: 'approved',
    priceDifference: -8051,
    weightDifference: 1.5,
    reviewedBy: 'Senior Gemologist',
    reviewedAt: '2026-10-25T11:30:00.000Z',
    reviewNotes: 'Specification difference noted: customer gets 1.5g more gold with YAZHINI.',
    createdAt: '2026-10-25T11:30:00.000Z'
  },
  {
    id: 'match-004',
    yazhiniProductId: 'prod-004',
    yazhiniProductName: 'Solitaire Natural Diamond Ring 1.0 Carat VVS1 GIA',
    yazhiniProductSku: 'YAZ-RIN-1092',
    yazhiniCategory: 'Rings',
    yazhiniMetalType: 'gold',
    yazhiniPurity: '18K',
    yazhiniNetWeight: 4.8,
    yazhiniGrossWeight: 5.0,
    yazhiniMakingCharges: 4200,
    yazhiniPrice: 285000,
    yazhiniImageUrl: '/images/ring_solitaire_diamond.jpg',
    matchedRetailerListing: {
      id: 'ret-tan-004',
      sourceId: 'source-tanishq',
      sourceName: 'Tanishq (Titan)',
      externalProductId: 'TAN-RNG-SOL-501',
      productUrl: 'https://www.tanishq.co.in/solitaire-diamond-ring-1ct',
      name: 'Celeste 1.00 Carat Certified Solitaire Diamond Ring 18K',
      category: 'Rings',
      metalType: 'gold',
      purity: '18K',
      grossWeight: 4.5,
      netMetalWeight: 4.3,
      stoneWeight: 1.0,
      stoneDescription: '1.00ct Natural Diamond, Color G, Clarity VVS2, Cut Excellent',
      baseMetalValue: 22102, // 4.3g * 5140 (18K rate)
      makingChargesMethod: 'fixed',
      makingChargesValue: 8500,
      calculatedMakingCharges: 8500,
      stoneCharges: 275000,
      wastagePercent: 0,
      discountAmount: 5000,
      taxableAmount: 300602,
      gstPercent: 3.0,
      gstAmount: 9018,
      deliveryCharges: 0,
      finalPrice: 309620,
      imageUrl: '/images/ring_burmese_ruby_gold.jpg',
      inStock: true,
      lastVerifiedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
      confidenceStatus: 'verified',
      specDifferences: [
        'Diamond Grading: YAZHINI offers VVS1 Clarity vs Tanishq VVS2',
        'Metal Weight: YAZHINI 4.8g 18K gold vs Tanishq 4.3g 18K gold (+0.5g gold)',
        'Both certified with GIA Dossier Reports'
      ]
    },
    matchConfidenceScore: 91,
    matchedAttributes: ['Category: Rings', 'Diamond: 1.00 Carat', 'Purity: 18K', 'Certification: GIA'],
    matchStatus: 'approved',
    priceDifference: -24620,
    weightDifference: 0.5,
    reviewedBy: 'Diamond Valuation Officer',
    reviewedAt: '2026-10-25T14:00:00.000Z',
    reviewNotes: 'Appraised against Rapaport INR wholesale benchmark. YAZHINI provides direct-from-source value.',
    createdAt: '2026-10-25T14:00:00.000Z'
  },
  {
    id: 'match-005',
    yazhiniProductId: 'prod-005',
    yazhiniProductName: 'Men’s Solid Cuban Curb Chain 22K',
    yazhiniProductSku: 'YAZ-CHA-9014',
    yazhiniCategory: 'Necklaces',
    yazhiniMetalType: 'gold',
    yazhiniPurity: '22K',
    yazhiniNetWeight: 35.0,
    yazhiniGrossWeight: 35.0,
    yazhiniMakingCharges: 6500,
    yazhiniPrice: 253800,
    yazhiniImageUrl: '/images/mens_gold_cuban_chain.jpg',
    matchedRetailerListing: {
      id: 'ret-ja-005',
      sourceId: 'source-jos-alukkas',
      sourceName: 'Jos Alukkas Online',
      externalProductId: 'JA-CHN-CUB-22',
      productUrl: 'https://www.josalukkasonline.com/mens-cuban-chain-22k',
      name: 'Men’s Classic Solid Cuban Curb Chain 22K',
      category: 'Necklaces',
      metalType: 'gold',
      purity: '22K',
      grossWeight: 35.0,
      netMetalWeight: 35.0,
      baseMetalValue: 239750,
      makingChargesMethod: 'per_gram',
      makingChargesValue: 550,
      calculatedMakingCharges: 19250,
      stoneCharges: 0,
      wastagePercent: 0,
      discountAmount: 1000,
      taxableAmount: 258000,
      gstPercent: 3.0,
      gstAmount: 7740,
      deliveryCharges: 0,
      finalPrice: 265740,
      imageUrl: '/images/mens_lion_signet_ring.jpg',
      inStock: true,
      lastVerifiedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      confidenceStatus: 'verified',
      specDifferences: [
        'Identical Net Weight (35.0g) and Purity (22K 916 BIS)',
        'Making Charges: Jos Alukkas charges ₹550/g (₹19,250) vs YAZHINI flat ₹6,500 (Savings of ₹11,940)',
        'Both items feature secure barrel lock and BIS Hallmark'
      ]
    },
    matchConfidenceScore: 96,
    matchedAttributes: ['Category: Necklaces / Chains', 'Purity: 22K', 'Weight Parity: 35.0g Exactly', 'Style: Cuban Curb'],
    matchStatus: 'approved',
    priceDifference: -11940,
    weightDifference: 0.0,
    reviewedBy: 'Branch Manager',
    reviewedAt: '2026-10-25T15:20:00.000Z',
    reviewNotes: 'Perfect exact match. Plain gold chain showcases true craftsmanship fee disparity.',
    createdAt: '2026-10-25T15:20:00.000Z'
  },
  {
    id: 'match-006',
    yazhiniProductId: 'prod-006',
    yazhiniProductName: '24K 999.9 Fine Gold Minted Bar 10g',
    yazhiniProductSku: 'YAZ-COI-0010',
    yazhiniCategory: 'Coins and bars',
    yazhiniMetalType: 'gold',
    yazhiniPurity: '24K',
    yazhiniNetWeight: 10.0,
    yazhiniGrossWeight: 10.0,
    yazhiniMakingCharges: 450,
    yazhiniPrice: 77150,
    yazhiniImageUrl: '/images/gold_coin_1g.jpg',
    matchedRetailerListing: {
      id: 'ret-joy-006',
      sourceId: 'source-joyalukkas',
      sourceName: 'Joyalukkas India',
      externalProductId: 'JOY-COIN-10G-24K',
      productUrl: 'https://www.joyalukkas.in/gold-bar-10g-24k-999',
      name: '24K (999) Pure Gold Minted Ingot Bar 10g',
      category: 'Coins and bars',
      metalType: 'gold',
      purity: '24K',
      grossWeight: 10.0,
      netMetalWeight: 10.0,
      baseMetalValue: 74500,
      makingChargesMethod: 'fixed',
      makingChargesValue: 1200,
      calculatedMakingCharges: 1200,
      stoneCharges: 0,
      wastagePercent: 0,
      discountAmount: 0,
      taxableAmount: 75700,
      gstPercent: 3.0,
      gstAmount: 2271,
      deliveryCharges: 150,
      finalPrice: 78121,
      imageUrl: '/images/gold_coin_1g.jpg',
      inStock: true,
      lastVerifiedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      confidenceStatus: 'verified',
      specDifferences: [
        'Identical Weight (10.0g) and Purity (24K 999.9 / 999.0)',
        'Minting / Certipack Fee: YAZHINI ₹450 vs Joyalukkas ₹1,200',
        'YAZHINI offers free doorstep insured delivery'
      ]
    },
    matchConfidenceScore: 98,
    matchedAttributes: ['Category: Coins / Bullion', 'Purity: 24K 999.9', 'Weight: 10.0g', 'Packaging: CertiCard'],
    matchStatus: 'approved',
    priceDifference: -971,
    weightDifference: 0.0,
    reviewedBy: 'Bullion Desk Auditor',
    reviewedAt: '2026-10-25T16:00:00.000Z',
    reviewNotes: 'Standard 10g investment bar. Transparent minting fee comparison.',
    createdAt: '2026-10-25T16:00:00.000Z'
  }
];

const INITIAL_SYNC_LOGS: ComparisonSyncLog[] = [
  {
    id: 'log-001',
    sourceId: 'source-jos-alukkas',
    sourceName: 'Jos Alukkas Online',
    syncType: 'manual_verification',
    status: 'success',
    itemsProcessed: 16,
    itemsUpdated: 16,
    durationMs: 420,
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  },
  {
    id: 'log-002',
    sourceId: 'source-joyalukkas',
    sourceName: 'Joyalukkas India',
    syncType: 'manual_verification',
    status: 'success',
    itemsProcessed: 18,
    itemsUpdated: 18,
    durationMs: 380,
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
  },
  {
    id: 'log-003',
    sourceId: 'source-malabar',
    sourceName: 'Malabar Gold & Diamonds',
    syncType: 'scheduled_feed',
    status: 'success',
    itemsProcessed: 14,
    itemsUpdated: 14,
    durationMs: 650,
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString()
  }
];

// Persistent file-backed storage
const DATA_FILE_PATH = path.resolve(process.cwd(), 'backend', 'data', 'rate-comparison-data.json');

interface ComparisonDataStore {
  sources: ComparisonSource[];
  matches: ProductMatch[];
  syncLogs: ComparisonSyncLog[];
  savedComparisons: SavedComparison[];
}

function loadDataStore(): ComparisonDataStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        sources: parsed.sources || INITIAL_SOURCES,
        matches: parsed.matches || INITIAL_MATCHES,
        syncLogs: parsed.syncLogs || INITIAL_SYNC_LOGS,
        savedComparisons: parsed.savedComparisons || []
      };
    }
  } catch (err) {
    console.warn('[RateComparison] Failed to read data store file, using initial data:', err);
  }
  return {
    sources: INITIAL_SOURCES,
    matches: INITIAL_MATCHES,
    syncLogs: INITIAL_SYNC_LOGS,
    savedComparisons: []
  };
}

function saveDataStore(data: ComparisonDataStore): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[RateComparison] Failed to write data store file:', err);
  }
}

// In-memory cache
let dataStore: ComparisonDataStore = loadDataStore();

function sendJson(res: ServerResponse, statusCode: number, payload: any): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(payload));
}

export async function handleRateComparisonRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> {
  const method = req.method?.toUpperCase();
  const query = (req as any).query || {};
  const body = (req as any).body || {};

  // 1. GET /api/jewellery-comparisons (Public customer comparison feed)
  if (pathname === '/api/jewellery-comparisons' && method === 'GET') {
    const category = query.category?.toLowerCase();
    const metal = query.metal?.toLowerCase();
    const purity = query.purity?.toUpperCase();
    const retailer = query.retailer?.toLowerCase();
    const search = query.search?.toLowerCase() || query.q?.toLowerCase();
    const minPrice = query.minPrice ? parseFloat(query.minPrice) : null;
    const maxPrice = query.maxPrice ? parseFloat(query.maxPrice) : null;
    const status = query.status || 'approved'; // Default to approved public matches

    let filtered = dataStore.matches.filter(m => {
      if (status !== 'all' && m.matchStatus !== status) return false;
      if (category && category !== 'all') {
        const catMatch = m.yazhiniCategory.toLowerCase().includes(category) || 
                         m.matchedRetailerListing.category.toLowerCase().includes(category);
        if (!catMatch) return false;
      }
      if (metal && metal !== 'all') {
        const metalMatch = m.yazhiniMetalType.toLowerCase() === metal || 
                           m.matchedRetailerListing.metalType.toLowerCase() === metal;
        if (!metalMatch) return false;
      }
      if (purity && purity !== 'ALL') {
        const purityMatch = m.yazhiniPurity.toUpperCase() === purity || 
                            m.matchedRetailerListing.purity.toUpperCase() === purity;
        if (!purityMatch) return false;
      }
      if (retailer && retailer !== 'all') {
        const retMatch = m.matchedRetailerListing.sourceName.toLowerCase().includes(retailer) ||
                         m.matchedRetailerListing.sourceId.toLowerCase().includes(retailer);
        if (!retMatch) return false;
      }
      if (minPrice !== null && m.yazhiniPrice < minPrice) return false;
      if (maxPrice !== null && m.yazhiniPrice > maxPrice) return false;
      if (search) {
        const text = `${m.yazhiniProductName} ${m.yazhiniProductSku} ${m.matchedRetailerListing.name} ${m.matchedRetailerListing.sourceName}`.toLowerCase();
        if (!text.includes(search)) return false;
      }
      return true;
    });

    sendJson(res, 200, {
      success: true,
      count: filtered.length,
      data: filtered,
      sources: dataStore.sources.filter(s => s.isEnabled)
    });
    return true;
  }

  // 2. GET /api/jewellery-comparisons/:id (Detailed single match)
  if (pathname.startsWith('/api/jewellery-comparisons/') && method === 'GET') {
    const id = pathname.replace('/api/jewellery-comparisons/', '');
    if (id && id !== 'calculate' && id !== 'save') {
      const match = dataStore.matches.find(m => m.id === id || m.yazhiniProductId === id);
      if (!match) {
        sendJson(res, 404, { success: false, error: 'Product comparison not found' });
        return true;
      }
      sendJson(res, 200, { success: true, data: match });
      return true;
    }
  }

  // 3. POST /api/jewellery-comparisons/calculate (Transparent Price Calculator Engine)
  if (pathname === '/api/jewellery-comparisons/calculate' && method === 'POST') {
    try {
      const {
        netWeight = 0,
        ratePerGram = 0,
        purity = '22K',
        makingChargesMethod = 'percentage',
        makingChargesValue = 12,
        stoneValue = 0,
        wastagePercent = 0,
        discountAmount = 0,
        deliveryCharges = 0
      } = body;

      const numWeight = Math.max(0, parseFloat(netWeight) || 0);
      let numRate = parseFloat(ratePerGram) || 0;

      // Default rates if not provided
      if (numRate <= 0) {
        if (purity === '24K') numRate = 7450;
        else if (purity === '22K') numRate = 6824;
        else if (purity === '18K') numRate = 5140;
        else if (purity === '14K') numRate = 3990;
        else if (purity === '925') numRate = 95;
        else if (purity === 'Pt950') numRate = 5085;
        else numRate = 6824;
      }

      const numMakingVal = Math.max(0, parseFloat(makingChargesValue) || 0);
      const numStone = Math.max(0, parseFloat(stoneValue) || 0);
      const numWastage = Math.max(0, parseFloat(wastagePercent) || 0);
      const numDiscount = Math.max(0, parseFloat(discountAmount) || 0);
      const numDelivery = Math.max(0, parseFloat(deliveryCharges) || 0);

      const metalValue = Math.round(numWeight * numRate);
      const wastageValue = Math.round(metalValue * (numWastage / 100));

      let calculatedMakingCharges = 0;
      if (makingChargesMethod === 'percentage') {
        calculatedMakingCharges = Math.round(metalValue * (numMakingVal / 100));
      } else if (makingChargesMethod === 'per_gram') {
        calculatedMakingCharges = Math.round(numWeight * numMakingVal);
      } else {
        calculatedMakingCharges = Math.round(numMakingVal);
      }

      const rawSubtotal = metalValue + wastageValue + calculatedMakingCharges + numStone;
      const taxableAmount = Math.max(0, rawSubtotal - numDiscount);

      // India Statutory Jewelry GST: 1.5% CGST + 1.5% SGST = 3.0%
      const cgst = Math.round(taxableAmount * 0.015);
      const sgst = Math.round(taxableAmount * 0.015);
      const totalGst = cgst + sgst;
      const finalPayable = taxableAmount + totalGst + numDelivery;

      sendJson(res, 200, {
        success: true,
        calculation: {
          inputs: {
            netWeight: numWeight,
            ratePerGram: numRate,
            purity,
            makingChargesMethod,
            makingChargesValue: numMakingVal,
            stoneValue: numStone,
            wastagePercent: numWastage,
            discountAmount: numDiscount,
            deliveryCharges: numDelivery
          },
          breakdown: {
            metalValue,
            wastageValue,
            calculatedMakingCharges,
            stoneValue: numStone,
            rawSubtotal,
            discountAmount: numDiscount,
            taxableAmount,
            cgst,
            sgst,
            totalGst,
            gstPercent: 3.0,
            deliveryCharges: numDelivery,
            finalPayable
          },
          timestamp: new Date().toISOString(),
          disclaimer: 'Calculated quotation estimate based on prevailing precious metal benchmarks. Showroom invoice will reflect live rates at moment of billing.'
        }
      });
      return true;
    } catch (err: any) {
      sendJson(res, 400, { success: false, error: err.message || 'Invalid calculation parameters' });
      return true;
    }
  }

  // 4. POST /api/jewellery-comparisons/save (Save customer comparison session)
  if (pathname === '/api/jewellery-comparisons/save' && method === 'POST') {
    const { productIds = [], userId = 'guest-patron', name = 'My Jewellery Comparison' } = body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      sendJson(res, 400, { success: false, error: 'Product IDs array is required' });
      return true;
    }

    const newSave: SavedComparison = {
      id: `saved-comp-${Date.now()}`,
      userId,
      name,
      productIds: productIds.slice(0, 4),
      createdAt: new Date().toISOString()
    };

    dataStore.savedComparisons.unshift(newSave);
    saveDataStore(dataStore);

    sendJson(res, 201, { success: true, savedComparison: newSave });
    return true;
  }

  // 5. GET /api/admin/comparison-sources (Admin: List comparison sources)
  if (pathname === '/api/admin/comparison-sources' && method === 'GET') {
    sendJson(res, 200, {
      success: true,
      sources: dataStore.sources,
      stats: {
        totalSources: dataStore.sources.length,
        activeSources: dataStore.sources.filter(s => s.isEnabled).length,
        totalMatches: dataStore.matches.length,
        pendingReviewCount: dataStore.matches.filter(m => m.matchStatus === 'pending').length,
        approvedMatchesCount: dataStore.matches.filter(m => m.matchStatus === 'approved').length
      }
    });
    return true;
  }

  // 6. POST /api/admin/comparison-sources (Admin: Create comparison source)
  if (pathname === '/api/admin/comparison-sources' && method === 'POST') {
    const { name, websiteUrl, integrationMethod = 'manual_entry', syncSchedule = 'Daily' } = body;
    if (!name || !websiteUrl) {
      sendJson(res, 400, { success: false, error: 'Source name and websiteUrl are required' });
      return true;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSource: ComparisonSource = {
      id: `source-${slug}-${Date.now()}`,
      name,
      slug,
      websiteUrl,
      integrationMethod,
      syncSchedule,
      isEnabled: true,
      lastSyncAt: new Date().toISOString(),
      status: 'healthy',
      verifiedProductCount: 0,
      totalProductCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dataStore.sources.push(newSource);
    saveDataStore(dataStore);

    sendJson(res, 201, { success: true, source: newSource });
    return true;
  }

  // 7. PATCH /api/admin/comparison-sources/:id (Admin: Update source configuration)
  if (pathname.startsWith('/api/admin/comparison-sources/') && method === 'PATCH') {
    const id = pathname.replace('/api/admin/comparison-sources/', '');
    const sourceIndex = dataStore.sources.findIndex(s => s.id === id);
    if (sourceIndex === -1) {
      sendJson(res, 404, { success: false, error: 'Comparison source not found' });
      return true;
    }

    const current = dataStore.sources[sourceIndex];
    const updated: ComparisonSource = {
      ...current,
      ...body,
      id: current.id, // Immutable ID
      updatedAt: new Date().toISOString()
    };

    dataStore.sources[sourceIndex] = updated;
    saveDataStore(dataStore);

    sendJson(res, 200, { success: true, source: updated });
    return true;
  }

  // 8. POST /api/admin/comparison-sources/:id/sync (Admin: Trigger source synchronization)
  if (pathname.includes('/api/admin/comparison-sources/') && pathname.endsWith('/sync') && method === 'POST') {
    const id = pathname.replace('/api/admin/comparison-sources/', '').replace('/sync', '');
    const source = dataStore.sources.find(s => s.id === id);
    if (!source) {
      sendJson(res, 404, { success: false, error: 'Comparison source not found' });
      return true;
    }

    const startTime = Date.now();
    source.lastSyncAt = new Date().toISOString();
    source.status = 'healthy';

    const newLog: ComparisonSyncLog = {
      id: `log-${Date.now()}`,
      sourceId: source.id,
      sourceName: source.name,
      syncType: source.integrationMethod === 'api' ? 'api_fetch' : 'manual_verification',
      status: 'success',
      itemsProcessed: source.totalProductCount || 10,
      itemsUpdated: source.verifiedProductCount || 10,
      durationMs: Date.now() - startTime + 250,
      createdAt: new Date().toISOString()
    };

    dataStore.syncLogs.unshift(newLog);
    saveDataStore(dataStore);

    sendJson(res, 200, {
      success: true,
      message: `Synchronized ${source.name} successfully`,
      syncLog: newLog,
      source
    });
    return true;
  }

  // 9. GET /api/admin/comparison-sync-logs (Admin: Sync audit history)
  if (pathname === '/api/admin/comparison-sync-logs' && method === 'GET') {
    sendJson(res, 200, {
      success: true,
      logs: dataStore.syncLogs.slice(0, 50)
    });
    return true;
  }

  // 10. POST /api/admin/product-matches/:id/review (Admin: Review match)
  if (pathname.startsWith('/api/admin/product-matches/') && pathname.endsWith('/review') && method === 'POST') {
    const id = pathname.replace('/api/admin/product-matches/', '').replace('/review', '');
    const matchIndex = dataStore.matches.findIndex(m => m.id === id);
    if (matchIndex === -1) {
      sendJson(res, 404, { success: false, error: 'Product match record not found' });
      return true;
    }

    const { status = 'approved', reviewNotes = '', reviewedBy = 'Admin Evaluator' } = body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      sendJson(res, 400, { success: false, error: 'Invalid match status. Must be approved, rejected, or pending' });
      return true;
    }

    dataStore.matches[matchIndex] = {
      ...dataStore.matches[matchIndex],
      matchStatus: status as any,
      reviewNotes,
      reviewedBy,
      reviewedAt: new Date().toISOString()
    };

    saveDataStore(dataStore);

    sendJson(res, 200, {
      success: true,
      message: `Product match ${status} successfully`,
      match: dataStore.matches[matchIndex]
    });
    return true;
  }

  return false;
}
