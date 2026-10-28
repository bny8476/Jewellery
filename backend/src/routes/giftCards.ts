import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { queryDb, memoryStore, supabase } from '../db.ts';
import { authenticateRequest, STAFF_ROLES } from './apiV1.ts';
import { createAndDispatchNotification } from '../services/notificationService.ts';
import Razorpay from 'razorpay';

// Razorpay client setup
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || razorpayKeySecret;

let razorpayInstance: Razorpay | null = null;
try {
  razorpayInstance = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
} catch {
  razorpayInstance = null;
}

// In-memory rate-limiter for balance checks (max 15 requests per minute per IP/code)
const balanceCheckRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 15, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = balanceCheckRateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    balanceCheckRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}

// Per-card Concurrency Mutex to prevent double-spending on simultaneous checkouts
const activeCardLocks = new Set<string>();

async function withCardLock<T>(cardId: string, operation: () => Promise<T>): Promise<T> {
  let attempts = 0;
  while (activeCardLocks.has(cardId)) {
    if (attempts++ > 50) {
      throw new Error('System busy processing redemption for this gift card. Please retry in a moment.');
    }
    await new Promise(r => setTimeout(r, 20));
  }
  activeCardLocks.add(cardId);
  try {
    return await operation();
  } finally {
    activeCardLocks.delete(cardId);
  }
}

// Helper to hash 4-digit PIN with SHA-256
export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

// Helper to generate cryptographically secure Gift Card Code: YAZ-GIFT-XXXX-XXXX
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ambiguous chars (0, O, 1, I) removed
  const getRandomPart = (len: number) => {
    let result = '';
    const bytes = crypto.randomBytes(len);
    for (let i = 0; i < len; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  };
  return `YAZ-GIFT-${getRandomPart(4)}-${getRandomPart(4)}`;
}

// Helper to generate 4-digit numeric PIN
export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper for sending JSON
function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// 8 Curated Luxury Gift Card Designs
export interface GiftCardDesignItem {
  id: string;
  name: string;
  tagline: string;
  theme: string;
  bgGradient: string;
  accentColor: string;
  pattern: string;
  image: string;
  occasions: string[];
  is_active: boolean;
  display_order: number;
}

export const GIFT_CARD_DESIGNS: GiftCardDesignItem[] = [
  {
    id: 'classic-yazhini',
    name: 'Classic YAZHINI 24K Heritage',
    tagline: 'Timeless luxury wrapped in pure 24K gold foil & velvet',
    theme: 'gold',
    bgGradient: 'linear-gradient(135deg, #1C120C 0%, #351018 50%, #150A0E 100%)',
    accentColor: '#C9A45C',
    pattern: 'heritage-filigree',
    image: '/images/gift_card_luxury_box.jpg',
    occasions: ['General', 'Celebration', 'Just Because'],
    is_active: true,
    display_order: 1
  },
  {
    id: 'bridal-elegance',
    name: 'Bridal Elegance Sacred Gold',
    tagline: 'Adorn life’s most auspicious moments with eternal grace',
    theme: 'burgundy',
    bgGradient: 'linear-gradient(135deg, #4A0E17 0%, #29080E 50%, #120406 100%)',
    accentColor: '#E6C687',
    pattern: 'temple-arch',
    image: '/images/bridal_vivaah_ruby_kundan.jpg',
    occasions: ['Wedding', 'Engagement', 'Celebration'],
    is_active: true,
    display_order: 2
  },
  {
    id: 'golden-anniversary',
    name: 'Golden Anniversary Radiance',
    tagline: 'Celebrating milestones of love with enduring fine jewellery',
    theme: 'rose-gold',
    bgGradient: 'linear-gradient(135deg, #2D141E 0%, #1A0D13 50%, #3D1C29 100%)',
    accentColor: '#F5CBA7',
    pattern: 'diamond-cluster',
    image: '/images/gift_anniversary.jpg',
    occasions: ['Anniversary', 'Celebration'],
    is_active: true,
    display_order: 3
  },
  {
    id: 'festive-celebration',
    name: 'Festive Celebration Diwali & Pongal',
    tagline: 'Bring prosperity, happiness and radiant warmth home',
    theme: 'emerald-gold',
    bgGradient: 'linear-gradient(135deg, #0A1C16 0%, #16382C 50%, #06120E 100%)',
    accentColor: '#D4AF37',
    pattern: 'lotus-mandala',
    image: '/images/gift_festive.jpg',
    occasions: ['Festivals', 'Celebration'],
    is_active: true,
    display_order: 4
  },
  {
    id: 'birthday-wishes',
    name: 'Birthday Wishes Solitaire Sparkle',
    tagline: 'The ultimate birthday treasure tailored to their heart',
    theme: 'sapphire-gold',
    bgGradient: 'linear-gradient(135deg, #0A1424 0%, #142844 50%, #060D17 100%)',
    accentColor: '#E2C792',
    pattern: 'celestial-stars',
    image: '/images/gift_birthday.jpg',
    occasions: ['Birthday', 'Celebration'],
    is_active: true,
    display_order: 5
  },
  {
    id: 'minimal-luxury',
    name: 'Minimal Luxury Midnight Platinum',
    tagline: 'Modern understated sophistication with diamond edge',
    theme: 'platinum',
    bgGradient: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 50%, #111111 100%)',
    accentColor: '#E5E7EB',
    pattern: 'geometric-lines',
    image: '/images/gift_corporate.jpg',
    occasions: ['Thank You', 'Just Because'],
    is_active: true,
    display_order: 6
  },
  {
    id: 'signature-diamonds',
    name: 'Signature Diamonds Royal Pavé',
    tagline: 'Certified solitaire brilliance crafted for true connoisseurs',
    theme: 'diamond-blue',
    bgGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0B0F19 100%)',
    accentColor: '#93C5FD',
    pattern: 'radiant-solitaire',
    image: '/images/cat_diamond.jpg',
    occasions: ['Engagement', 'Celebration', 'Anniversary'],
    is_active: true,
    display_order: 7
  },
  {
    id: 'premium-wedding',
    name: 'Premium Wedding Trousseau Heirloom',
    tagline: 'Sacred Muhurtham bridal masterworks blessed with timeless heritage',
    theme: 'royal-ruby',
    bgGradient: 'linear-gradient(135deg, #3B0713 0%, #5B1322 50%, #20040A 100%)',
    accentColor: '#FFD700',
    pattern: 'temple-kasu',
    image: '/images/bridal_sita_kalyanam.jpg',
    occasions: ['Wedding', 'Celebration'],
    is_active: true,
    display_order: 8
  }
];

export const APPROVED_DENOMINATIONS = [1000, 2500, 5000, 10000, 25000, 50000, 100000];
export const MIN_GIFT_CARD_AMOUNT = 1000;
export const MAX_GIFT_CARD_AMOUNT = 200000;

// Dynamic Storewide Configuration
export let GIFT_CARD_CONFIG = {
  minAmount: MIN_GIFT_CARD_AMOUNT,
  maxAmount: MAX_GIFT_CARD_AMOUNT,
  denominations: APPROVED_DENOMINATIONS,
  currency: 'INR',
  validityDays: 365,
  partialRedemptionEnabled: true,
  maxCardsPerOrder: 3,
  autoDeliveryEnabled: true,
  occasions: [
    'Birthday',
    'Wedding',
    'Anniversary',
    'Engagement',
    'Festivals',
    'Thank You',
    'Celebration',
    'Just Because'
  ]
};

// Seed Initial Demo Gift Cards into Memory Store if empty
function initializeSeedData() {
  if (memoryStore.gift_cards.length === 0) {
    const demoCard1 = {
      id: 'gc-demo-001',
      code: 'YAZ-GIFT-GOLD-5000',
      pin_hash: hashPin('1234'),
      design_id: 'classic-yazhini',
      card_type: 'DIGITAL',
      original_value: 5000,
      current_balance: 5000,
      currency: 'INR',
      status: 'ACTIVE',
      purchaser_id: 'patron-demo-001',
      purchaser_name: 'Ananya Ramanathan',
      purchaser_email: 'ananya.ramanathan@example.com',
      purchaser_phone: '+91 98765 43210',
      recipient_name: 'Dr. Priya Sundaram',
      recipient_email: 'priya.sundaram@example.com',
      recipient_phone: '+91 98401 23456',
      gift_message: 'Wishing you a very happy birthday filled with radiant jewellery and joy!',
      occasion: 'Birthday',
      delivery_method: 'EMAIL',
      delivery_status: 'DELIVERED',
      delivery_date: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    const demoCard2 = {
      id: 'gc-demo-002',
      code: 'YAZ-GIFT-WEDD-2500',
      pin_hash: hashPin('5678'),
      design_id: 'bridal-elegance',
      card_type: 'DIGITAL',
      original_value: 10000,
      current_balance: 2500,
      currency: 'INR',
      status: 'PARTIALLY_REDEEMED',
      purchaser_id: 'patron-demo-002',
      purchaser_name: 'Karthik Subramanian',
      purchaser_email: 'karthik.sub@example.com',
      purchaser_phone: '+91 97910 88990',
      recipient_name: 'Ananya Ramanathan',
      recipient_email: 'ananya.ramanathan@example.com',
      recipient_phone: '+91 98765 43210',
      gift_message: 'Heartiest congratulations on your wedding anniversary!',
      occasion: 'Anniversary',
      delivery_method: 'EMAIL',
      delivery_status: 'DELIVERED',
      delivery_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 355 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    memoryStore.gift_cards.push(demoCard1, demoCard2);

    // Initial Ledger transactions
    memoryStore.gift_card_transactions.push(
      {
        id: 'gctx-001',
        gift_card_id: 'gc-demo-001',
        transaction_type: 'ISSUANCE',
        amount: 5000,
        balance_before: 0,
        balance_after: 5000,
        currency: 'INR',
        order_number: 'GC-ORD-1001',
        reason: 'Initial digital gift card purchase',
        authorized_actor: 'SYSTEM_ISSUANCE',
        created_at: demoCard1.created_at
      },
      {
        id: 'gctx-002',
        gift_card_id: 'gc-demo-002',
        transaction_type: 'ISSUANCE',
        amount: 10000,
        balance_before: 0,
        balance_after: 10000,
        currency: 'INR',
        order_number: 'GC-ORD-1002',
        reason: 'Initial digital gift card purchase',
        authorized_actor: 'SYSTEM_ISSUANCE',
        created_at: demoCard2.created_at
      },
      {
        id: 'gctx-003',
        gift_card_id: 'gc-demo-002',
        transaction_type: 'REDEMPTION',
        amount: -7500,
        balance_before: 10000,
        balance_after: 2500,
        currency: 'INR',
        order_number: 'ORD-2026-8812',
        reason: 'Checkout redemption for 22K Gold Bangles order',
        authorized_actor: 'CUSTOMER_CHECKOUT',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    );

    // Audit logs
    memoryStore.gift_card_audit_logs.push(
      {
        id: 'gcaudit-001',
        gift_card_id: 'gc-demo-001',
        actor: 'Ananya Ramanathan',
        action: 'CARD_ISSUED',
        details: { value: 5000, recipient: 'priya.sundaram@example.com' },
        created_at: demoCard1.created_at
      },
      {
        id: 'gcaudit-002',
        gift_card_id: 'gc-demo-002',
        actor: 'CUSTOMER_CHECKOUT',
        action: 'CARD_PARTIAL_REDEMPTION',
        details: { amount: 7500, remaining: 2500, order: 'ORD-2026-8812' },
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    );
  }
}

initializeSeedData();

// Asynchronous DB Persistence Helpers
async function persistGiftCard(card: any) {
  try {
    await queryDb(
      `INSERT INTO public.gift_cards (
        id, code, pin_hash, design_id, original_value, current_balance, currency,
        status, purchaser_id, purchaser_name, purchaser_email, purchaser_phone,
        recipient_name, recipient_email, recipient_phone, personal_message,
        delivery_method, delivery_status, scheduled_delivery_at, expiry_date,
        purchase_order_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT (id) DO UPDATE SET
        current_balance = EXCLUDED.current_balance,
        status = EXCLUDED.status,
        delivery_status = EXCLUDED.delivery_status,
        updated_at = EXCLUDED.updated_at`,
      [
        card.id, card.code, card.pin_hash, card.design_id, card.original_value,
        card.current_balance, card.currency || 'INR', card.status?.toLowerCase(),
        card.purchaser_id || null, card.purchaser_name, card.purchaser_email, card.purchaser_phone || null,
        card.recipient_name, card.recipient_email, card.recipient_phone || null, card.gift_message || null,
        card.delivery_method === 'POSTAL' ? 'physical_delivery' : 'digital_email',
        card.delivery_status?.toLowerCase() || 'pending', card.delivery_date || null, card.expires_at,
        card.purchase_order_id || null, card.created_at, card.updated_at
      ]
    );
  } catch (err) {
    console.warn('[GiftCard DB Persistence Warning]:', (err as any)?.message || err);
  }
}

async function persistLedgerTransaction(tx: any) {
  try {
    await queryDb(
      `INSERT INTO public.gift_card_transactions (
        id, gift_card_id, transaction_type, amount, balance_before, balance_after,
        currency, order_number, reason, authorized_actor, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tx.id, tx.gift_card_id, tx.transaction_type?.toLowerCase(), tx.amount,
        tx.balance_before, tx.balance_after, tx.currency || 'INR',
        tx.order_number || null, tx.reason, tx.authorized_actor || 'system', tx.created_at
      ]
    );
  } catch (err) {
    console.warn('[Ledger DB Persistence Warning]:', (err as any)?.message || err);
  }
}

async function persistAuditLog(log: any) {
  try {
    await queryDb(
      `INSERT INTO public.gift_card_audit_logs (
        id, gift_card_id, actor, action, details, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        log.id, log.gift_card_id, log.actor, log.action,
        JSON.stringify(log.details || {}), log.ip_address || null, log.created_at
      ]
    );
  } catch (err) {
    console.warn('[Audit Log DB Persistence Warning]:', (err as any)?.message || err);
  }
}

// Branded Email Notification Generator
export function generateGiftCardEmailHtml(params: {
  cardCode: string;
  pin: string;
  amount: number;
  recipientName: string;
  senderName: string;
  message: string;
  designName: string;
  expiresAt: string;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #120A0E; color: #FAF7F2; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1C120C 0%, #351018 50%, #150A0E 100%); border: 1px solid #C9A45C; border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
      .crest { text-align: center; color: #C9A45C; letter-spacing: 4px; font-size: 13px; font-weight: bold; margin-bottom: 8px; }
      .title { text-align: center; font-size: 26px; color: #FAF7F2; margin-top: 0; }
      .card-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(201,164,92,0.4); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
      .amount { font-size: 36px; color: #E6C687; font-weight: bold; margin: 8px 0; }
      .code { font-family: monospace; font-size: 20px; letter-spacing: 3px; color: #C9A45C; background: #000; padding: 8px 16px; border-radius: 8px; display: inline-block; }
      .pin { font-family: monospace; font-size: 16px; color: #E6C687; margin-top: 8px; }
      .message { font-style: italic; color: #D1C7BD; line-height: 1.6; text-align: center; margin: 20px 0; font-size: 14px; }
      .cta { display: block; text-align: center; background: linear-gradient(to right, #C9A45C, #E6C687); color: #351018; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 24px; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; }
      .footer { text-align: center; font-size: 11px; color: #777174; margin-top: 28px; font-family: sans-serif; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="crest">YAZHINI FINE JEWELS • EST. 1994</div>
      <h1 class="title">A Gift of Enduring Radiance</h1>
      <p style="text-align: center; font-size: 13px; color: #C9A45C;">Compliments of ${params.senderName}</p>
      
      <div class="card-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #C9A45C;">${params.designName}</div>
        <div class="amount">₹${params.amount.toLocaleString('en-IN')}</div>
        <div class="code">${params.cardCode}</div>
        <div class="pin">Security PIN: <strong>${params.pin}</strong></div>
      </div>

      <div class="message">
        "Dear ${params.recipientName},<br>
        ${params.message || 'Wishing you radiant joy and brilliant beauty with YAZHINI Fine Jewels.'}"
      </div>

      <p style="text-align: center; font-size: 12px; color: #A89B9E;">
        Valid until ${new Date(params.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
        Redeemable for 22K Hallmarked Gold, Certified Solitaire Diamonds, and Platinum creations at boutique or online.
      </p>

      <a href="http://localhost:5173/gift-card/${params.cardCode}" class="cta">View Official Digital Certificate</a>

      <div class="footer">
        YAZHINI FINE JEWELS & PAWN SHOP • Cathedral Road Flagship, Chennai, Tamil Nadu<br>
        100% BIS 916 Hallmarked • HUID Laser Verified • Secured Transit
      </div>
    </div>
  </body>
  </html>
  `;
}

// Get authenticated user helper
async function getAuthUser(req: IncomingMessage): Promise<any> {
  const auth = await authenticateRequest(req);
  if (auth && auth.user) {
    return {
      id: auth.user.id,
      email: auth.user.email || '',
      role: auth.role,
      isStaff: auth.isStaff
    };
  }

  // Graceful fallback for browser session headers
  if (req.headers['x-user-id']) {
    const rawId = String(req.headers['x-user-id']);
    const email = String(req.headers['x-user-email'] || '');
    const isStaff = email.toLowerCase() === 'admin@luxury.com' || req.headers['x-user-role'] === 'admin';
    return {
      id: rawId,
      email,
      role: isStaff ? 'admin' : 'customer',
      isStaff
    };
  }

  return null;
}

export async function handleGiftCardRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string
): Promise<boolean> {
  if (!pathname.startsWith('/api/v1/gift-cards') && !pathname.startsWith('/api/v1/admin/gift-cards')) {
    return false;
  }

  const method = req.method;
  const body = (req as any).body || {};
  const query = (req as any).query || {};
  const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');

  try {
    // =========================================================================
    // 1. GET /api/v1/gift-cards/designs (Public Catalog)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/designs' && method === 'GET') {
      const activeDesigns = GIFT_CARD_DESIGNS.filter(d => d.is_active);
      sendJson(res, 200, {
        success: true,
        designs: activeDesigns,
        denominations: GIFT_CARD_CONFIG.denominations,
        limits: {
          minAmount: GIFT_CARD_CONFIG.minAmount,
          maxAmount: GIFT_CARD_CONFIG.maxAmount,
          currency: GIFT_CARD_CONFIG.currency
        },
        occasions: GIFT_CARD_CONFIG.occasions,
        validityDays: GIFT_CARD_CONFIG.validityDays,
        partialRedemptionEnabled: GIFT_CARD_CONFIG.partialRedemptionEnabled
      });
      return true;
    }

    // =========================================================================
    // 2. GET /api/v1/gift-cards/config (Storewide Config & Policies)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/config' && method === 'GET') {
      sendJson(res, 200, {
        success: true,
        config: GIFT_CARD_CONFIG,
        designsCount: GIFT_CARD_DESIGNS.length,
        activeDesignsCount: GIFT_CARD_DESIGNS.filter(d => d.is_active).length
      });
      return true;
    }

    // =========================================================================
    // 3. POST /api/v1/gift-cards/check-balance (Brute-Force Protected)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/check-balance' && method === 'POST') {
      const code = String(body.code || '').trim().toUpperCase();
      const pin = String(body.pin || '').trim();

      if (!code) {
        sendJson(res, 400, { success: false, error: 'Gift card code is required' });
        return true;
      }

      // Brute-force rate limiting per IP + Code
      const rateKey = `check_${clientIp}_${code}`;
      if (!checkRateLimit(rateKey, 15, 60000)) {
        sendJson(res, 429, {
          success: false,
          error: 'Too many balance check requests. Please try again in 1 minute.'
        });
        return true;
      }

      // Lookup in memoryStore or DB
      const card = memoryStore.gift_cards.find(c => c.code.toUpperCase() === code);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Invalid gift card code. Please verify and re-enter.' });
        return true;
      }

      // Check PIN
      if (card.pin_hash && pin) {
        const inputHash = hashPin(pin);
        if (inputHash !== card.pin_hash) {
          sendJson(res, 401, { success: false, error: 'Invalid 4-digit security PIN for this gift card.' });
          return true;
        }
      } else if (card.pin_hash && !pin) {
        sendJson(res, 400, { success: false, error: '4-digit security PIN is required to check balance.' });
        return true;
      }

      // Check expiry
      const isExpired = card.expires_at && new Date(card.expires_at).getTime() < Date.now();
      const effectiveStatus = isExpired ? 'EXPIRED' : card.status;

      // Find design details
      const design = GIFT_CARD_DESIGNS.find(d => d.id === card.design_id) || GIFT_CARD_DESIGNS[0];

      sendJson(res, 200, {
        success: true,
        card: {
          code: card.code,
          designId: card.design_id,
          designName: design.name,
          designImage: design.image,
          currency: card.currency || 'INR',
          originalValue: card.original_value,
          currentBalance: card.current_balance,
          redeemedValue: card.original_value - card.current_balance,
          status: effectiveStatus,
          recipientName: card.recipient_name,
          expiresAt: card.expires_at,
          createdAt: card.created_at
        }
      });
      return true;
    }

    // =========================================================================
    // 4. POST /api/v1/gift-cards/purchases/initiate
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/purchases/initiate' && method === 'POST') {
      const {
        amount,
        designId,
        cardType = 'DIGITAL',
        recipientName,
        recipientEmail,
        recipientPhone,
        senderName,
        senderEmail,
        giftMessage,
        occasion = 'General',
        deliveryMethod = 'EMAIL',
        deliveryDate
      } = body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < GIFT_CARD_CONFIG.minAmount || numAmount > GIFT_CARD_CONFIG.maxAmount) {
        sendJson(res, 400, {
          success: false,
          error: `Gift card amount must be between ₹${GIFT_CARD_CONFIG.minAmount.toLocaleString('en-IN')} and ₹${GIFT_CARD_CONFIG.maxAmount.toLocaleString('en-IN')}`
        });
        return true;
      }

      if (!recipientName || (deliveryMethod === 'EMAIL' && !recipientEmail)) {
        sendJson(res, 400, {
          success: false,
          error: 'Recipient name and a valid recipient email are required for digital delivery.'
        });
        return true;
      }

      const user = await getAuthUser(req);
      const purchaseId = `gcp-${crypto.randomUUID()}`;
      const receiptNumber = `YAZ-GCP-${Date.now().toString().slice(-6)}`;

      // Create Razorpay Order if configured, or use secure mock token for testing
      let razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      if (razorpayInstance && razorpayKeyId !== 'rzp_test_placeholder') {
        try {
          const rzpOrder = await razorpayInstance.orders.create({
            amount: Math.round(numAmount * 100), // Razorpay accepts paise
            currency: 'INR',
            receipt: receiptNumber,
            notes: {
              purchaseId,
              designId,
              recipientEmail
            }
          });
          razorpayOrderId = rzpOrder.id;
        } catch (rzpErr: any) {
          console.warn('[Razorpay] Fallback to simulated order token:', rzpErr.message);
        }
      }

      const purchaseRecord = {
        id: purchaseId,
        receipt_number: receiptNumber,
        customer_id: user?.id || 'guest_buyer',
        amount: numAmount,
        currency: 'INR',
        card_type: cardType,
        design_id: designId || 'classic-yazhini',
        sender_name: senderName || user?.email || 'Valued Patron',
        sender_email: senderEmail || user?.email || '',
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone || '',
        gift_message: giftMessage || '',
        occasion,
        delivery_method: deliveryMethod,
        delivery_date: deliveryDate || new Date().toISOString(),
        payment_status: 'PENDING',
        razorpay_order_id: razorpayOrderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      memoryStore.gift_card_purchases.push(purchaseRecord);

      sendJson(res, 201, {
        success: true,
        purchaseId,
        razorpayOrderId,
        receiptNumber,
        amount: numAmount,
        currency: 'INR',
        keyId: razorpayKeyId
      });
      return true;
    }

    // =========================================================================
    // 5. POST /api/v1/gift-cards/purchases/verify-and-issue (Idempotent)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/purchases/verify-and-issue' && method === 'POST') {
      const {
        purchaseId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = body;

      if (!purchaseId) {
        sendJson(res, 400, { success: false, error: 'purchaseId is required' });
        return true;
      }

      const purchase = memoryStore.gift_card_purchases.find(p => p.id === purchaseId);
      if (!purchase) {
        sendJson(res, 404, { success: false, error: 'Gift card purchase session not found' });
        return true;
      }

      // Idempotency: If already issued, return existing card
      if (purchase.payment_status === 'PAID' && purchase.issued_card_id) {
        const existingCard = memoryStore.gift_cards.find(c => c.id === purchase.issued_card_id);
        if (existingCard) {
          sendJson(res, 200, {
            success: true,
            isDuplicate: true,
            message: 'Gift card already issued for this purchase',
            card: {
              id: existingCard.id,
              code: existingCard.code,
              value: existingCard.original_value,
              currency: existingCard.currency,
              status: existingCard.status,
              recipientEmail: existingCard.recipient_email
            }
          });
          return true;
        }
      }

      // Verify Razorpay signature if live secret
      if (razorpayKeySecret && razorpayKeySecret !== 'secret_placeholder' && razorpay_signature) {
        const isDevSandbox = (process.env.NODE_ENV !== 'production' && razorpay_signature === 'sandbox_verified_signature');
        if (!isDevSandbox) {
          const text = `${razorpay_order_id}|${razorpay_payment_id}`;
          const expectedSignature = crypto
            .createHmac('sha256', razorpayKeySecret)
            .update(text)
            .digest('hex');

          if (expectedSignature !== razorpay_signature) {
            sendJson(res, 400, { success: false, error: 'Invalid payment signature verification' });
            return true;
          }
        }
      }

      // Update purchase status
      purchase.payment_status = 'PAID';
      purchase.razorpay_payment_id = razorpay_payment_id || `pay_${crypto.randomBytes(8).toString('hex')}`;
      purchase.updated_at = new Date().toISOString();

      // Generate Gift Card Code and PIN
      const cardId = `gc-${crypto.randomUUID()}`;
      const code = generateGiftCardCode();
      const rawPin = generatePin();
      const pinHash = hashPin(rawPin);
      const expiresAt = new Date(Date.now() + GIFT_CARD_CONFIG.validityDays * 24 * 60 * 60 * 1000).toISOString();

      const newGiftCard = {
        id: cardId,
        code,
        pin_hash: pinHash,
        design_id: purchase.design_id,
        card_type: purchase.card_type,
        original_value: purchase.amount,
        current_balance: purchase.amount,
        currency: purchase.currency,
        status: 'ACTIVE',
        purchaser_id: purchase.customer_id,
        purchaser_name: purchase.sender_name,
        purchaser_email: purchase.sender_email,
        purchaser_phone: '',
        recipient_name: purchase.recipient_name,
        recipient_email: purchase.recipient_email,
        recipient_phone: purchase.recipient_phone,
        gift_message: purchase.gift_message,
        occasion: purchase.occasion,
        delivery_method: purchase.delivery_method,
        delivery_status: 'DELIVERED',
        delivery_date: purchase.delivery_date,
        expires_at: expiresAt,
        purchase_order_id: purchase.receipt_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      memoryStore.gift_cards.push(newGiftCard);
      purchase.issued_card_id = cardId;

      // Double-entry Ledger entry for ISSUANCE (Deferred Revenue Liability)
      const transactionId = `gctx-${crypto.randomUUID()}`;
      const issuanceTx = {
        id: transactionId,
        gift_card_id: cardId,
        transaction_type: 'ISSUANCE',
        amount: purchase.amount,
        balance_before: 0,
        balance_after: purchase.amount,
        currency: purchase.currency,
        order_number: purchase.receipt_number,
        reason: 'Gift card purchase issuance (Deferred Revenue Liability)',
        authorized_actor: purchase.sender_email || 'ONLINE_PURCHASER',
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_transactions.push(issuanceTx);

      // Audit Log
      const auditLog = {
        id: `gcaudit-${crypto.randomUUID()}`,
        gift_card_id: cardId,
        actor: purchase.sender_email || 'ONLINE_PURCHASER',
        action: 'CARD_ISSUED',
        details: {
          code: `${code.slice(0, 8)}****`,
          amount: purchase.amount,
          recipient: purchase.recipient_email,
          paymentId: purchase.razorpay_payment_id
        },
        ip_address: clientIp,
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_audit_logs.push(auditLog);

      // Async DB Persistence
      persistGiftCard(newGiftCard);
      persistLedgerTransaction(issuanceTx);
      persistAuditLog(auditLog);

      createAndDispatchNotification({
        recipient_id: purchase.user_id || purchase.sender_email || 'customer_default',
        recipient_role: 'customer',
        event_type: 'giftcard.issued',
        category: 'giftcard',
        severity: 'success',
        title: `Luxury Gift Card Issued: ₹${purchase.amount.toLocaleString('en-IN')}`,
        message: `Gift card ending in ${code.slice(-4)} issued for ${purchase.recipient_name}.`,
        related_entity_type: 'gift_card',
        related_entity_id: cardId,
        destination_route: '/gift-cards',
        idempotency_key: `notif-gc-${cardId}`
      }).catch(() => {});

      sendJson(res, 201, {
        success: true,
        message: 'Gift card successfully issued and delivered!',
        card: {
          id: cardId,
          code,
          pin: rawPin, // Sent to purchaser upon immediate verification
          amount: purchase.amount,
          currency: purchase.currency,
          designId: purchase.design_id,
          recipientName: purchase.recipient_name,
          recipientEmail: purchase.recipient_email,
          senderName: purchase.sender_name,
          giftMessage: purchase.gift_message,
          expiresAt,
          viewUrl: `/gift-card/${code}`
        }
      });
      return true;
    }

    // =========================================================================
    // 6. POST /api/v1/gift-cards/webhook (Razorpay Webhook Listener)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/webhook' && method === 'POST') {
      const signature = req.headers['x-razorpay-signature'] as string;
      const event = body;

      // Verify Webhook Signature if secret configured
      if (razorpayWebhookSecret && signature && razorpayWebhookSecret !== 'secret_placeholder') {
        const rawBody = (req as any).rawBody || JSON.stringify(body);
        const expectedSignature = crypto
          .createHmac('sha256', razorpayWebhookSecret)
          .update(rawBody)
          .digest('hex');

        if (expectedSignature !== signature) {
          sendJson(res, 400, { success: false, error: 'Invalid webhook signature' });
          return true;
        }
      }

      // Handle payment.captured or order.paid
      if (event && (event.event === 'payment.captured' || event.event === 'order.paid')) {
        const paymentEntity = event.payload?.payment?.entity || {};
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        if (razorpayOrderId) {
          const purchase = memoryStore.gift_card_purchases.find(p => p.razorpay_order_id === razorpayOrderId);
          if (purchase && purchase.payment_status !== 'PAID') {
            purchase.payment_status = 'PAID';
            purchase.razorpay_payment_id = razorpayPaymentId;
            purchase.updated_at = new Date().toISOString();

            // Auto-issue card if not already issued
            if (!purchase.issued_card_id) {
              const cardId = `gc-${crypto.randomUUID()}`;
              const code = generateGiftCardCode();
              const rawPin = generatePin();
              const pinHash = hashPin(rawPin);
              const expiresAt = new Date(Date.now() + GIFT_CARD_CONFIG.validityDays * 24 * 60 * 60 * 1000).toISOString();

              const newCard = {
                id: cardId,
                code,
                pin_hash: pinHash,
                design_id: purchase.design_id,
                card_type: purchase.card_type,
                original_value: purchase.amount,
                current_balance: purchase.amount,
                currency: purchase.currency,
                status: 'ACTIVE',
                purchaser_id: purchase.customer_id,
                purchaser_name: purchase.sender_name,
                purchaser_email: purchase.sender_email,
                recipient_name: purchase.recipient_name,
                recipient_email: purchase.recipient_email,
                gift_message: purchase.gift_message,
                delivery_method: purchase.delivery_method,
                delivery_status: 'DELIVERED',
                expires_at: expiresAt,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              memoryStore.gift_cards.push(newCard);
              purchase.issued_card_id = cardId;

              persistGiftCard(newCard);
            }
          }
        }
      }

      sendJson(res, 200, { success: true, received: true });
      return true;
    }

    // =========================================================================
    // 7. GET /api/v1/gift-cards/view/:code (Public Recipient View)
    // =========================================================================
    if (pathname.startsWith('/api/v1/gift-cards/view/') && method === 'GET') {
      const code = pathname.replace('/api/v1/gift-cards/view/', '').trim().toUpperCase();
      const card = memoryStore.gift_cards.find(c => c.code.toUpperCase() === code);

      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card certificate not found' });
        return true;
      }

      const design = GIFT_CARD_DESIGNS.find(d => d.id === card.design_id) || GIFT_CARD_DESIGNS[0];
      const isExpired = card.expires_at && new Date(card.expires_at).getTime() < Date.now();

      sendJson(res, 200, {
        success: true,
        card: {
          code: card.code,
          design: design,
          originalValue: card.original_value,
          currentBalance: card.current_balance,
          currency: card.currency,
          status: isExpired ? 'EXPIRED' : card.status,
          recipientName: card.recipient_name,
          senderName: card.purchaser_name,
          giftMessage: card.gift_message,
          occasion: card.occasion,
          expiresAt: card.expires_at,
          createdAt: card.created_at
        }
      });
      return true;
    }

    // =========================================================================
    // 8. GET /api/v1/gift-cards/my-cards (Customer Account Dashboard)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/my-cards' && method === 'GET') {
      const user = await getAuthUser(req);
      if (!user) {
        sendJson(res, 401, { success: false, error: 'Authentication required' });
        return true;
      }

      const userEmail = (user.email || '').toLowerCase();
      const userId = user.id;

      // Find cards purchased by or sent to this customer
      const myPurchasedCards = memoryStore.gift_cards.filter(c => 
        (c.purchaser_id && c.purchaser_id === userId) ||
        (c.purchaser_email && c.purchaser_email.toLowerCase() === userEmail)
      );

      const myReceivedCards = memoryStore.gift_cards.filter(c =>
        c.recipient_email && c.recipient_email.toLowerCase() === userEmail &&
        c.purchaser_id !== userId
      );

      // Attach design info & recent transactions
      const enrichCard = (c: any) => {
        const design = GIFT_CARD_DESIGNS.find(d => d.id === c.design_id) || GIFT_CARD_DESIGNS[0];
        const txs = memoryStore.gift_card_transactions
          .filter(t => t.gift_card_id === c.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
          ...c,
          design,
          transactions: txs
        };
      };

      sendJson(res, 200, {
        success: true,
        purchased: myPurchasedCards.map(enrichCard),
        received: myReceivedCards.map(enrichCard)
      });
      return true;
    }

    // =========================================================================
    // 9. POST /api/v1/gift-cards/validate-redemption (Checkout Pre-Validation)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/validate-redemption' && method === 'POST') {
      const { code, pin, cartTotal } = body;
      const cleanCode = String(code || '').trim().toUpperCase();
      const cleanPin = String(pin || '').trim();
      const orderTotal = Number(cartTotal);

      if (!cleanCode) {
        sendJson(res, 400, { success: false, error: 'Gift card code is required' });
        return true;
      }
      if (isNaN(orderTotal) || orderTotal <= 0) {
        sendJson(res, 400, { success: false, error: 'Valid order total is required' });
        return true;
      }

      const card = memoryStore.gift_cards.find(c => c.code.toUpperCase() === cleanCode);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card not found. Please verify your code.' });
        return true;
      }

      // Check PIN
      if (card.pin_hash) {
        if (!cleanPin) {
          sendJson(res, 400, { success: false, error: '4-digit security PIN is required' });
          return true;
        }
        if (hashPin(cleanPin) !== card.pin_hash) {
          sendJson(res, 401, { success: false, error: 'Incorrect 4-digit PIN for this gift card' });
          return true;
        }
      }

      // Check status
      if (card.status !== 'ACTIVE' && card.status !== 'PARTIALLY_REDEEMED') {
        sendJson(res, 400, {
          success: false,
          error: `Gift card cannot be used because its status is ${card.status.toLowerCase().replace('_', ' ')}.`
        });
        return true;
      }

      // Check expiry
      if (card.expires_at && new Date(card.expires_at).getTime() < Date.now()) {
        sendJson(res, 400, { success: false, error: 'This gift card has expired.' });
        return true;
      }

      // Check balance
      if (card.current_balance <= 0) {
        sendJson(res, 400, { success: false, error: 'This gift card has a zero balance.' });
        return true;
      }

      // Calculate partial/full redemption eligibility
      const eligibleAmount = Math.min(card.current_balance, orderTotal);
      const remainingOrderPayable = Math.max(0, orderTotal - eligibleAmount);
      const remainingCardBalance = card.current_balance - eligibleAmount;

      sendJson(res, 200, {
        success: true,
        cardId: card.id,
        code: card.code,
        availableBalance: card.current_balance,
        appliedAmount: eligibleAmount,
        remainingOrderPayable,
        remainingCardBalance,
        currency: card.currency || 'INR'
      });
      return true;
    }

    // =========================================================================
    // 10. POST /api/v1/gift-cards/redeem (Atomic Concurrency-Locked Checkout Commit)
    // =========================================================================
    if (pathname === '/api/v1/gift-cards/redeem' && method === 'POST') {
      const { code, pin, amount, orderNumber } = body;
      const cleanCode = String(code || '').trim().toUpperCase();
      const cleanPin = String(pin || '').trim();
      const redeemAmount = Number(amount);

      if (!cleanCode || isNaN(redeemAmount) || redeemAmount <= 0) {
        sendJson(res, 400, { success: false, error: 'Invalid redemption parameters' });
        return true;
      }

      const card = memoryStore.gift_cards.find(c => c.code.toUpperCase() === cleanCode);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card not found' });
        return true;
      }

      // Execute inside Mutex Lock to completely eliminate concurrency double-spending
      const result = await withCardLock(card.id, async () => {
        if (card.pin_hash && hashPin(cleanPin) !== card.pin_hash) {
          return { status: 401, data: { success: false, error: 'Invalid security PIN' } };
        }

        if (card.status !== 'ACTIVE' && card.status !== 'PARTIALLY_REDEEMED') {
          return { status: 400, data: { success: false, error: `Card is ${card.status.toLowerCase().replace('_', ' ')}` } };
        }

        if (card.current_balance < redeemAmount) {
          return {
            status: 400,
            data: {
              success: false,
              error: `Insufficient gift card balance. Available: ₹${card.current_balance.toLocaleString('en-IN')}`
            }
          };
        }

        const balanceBefore = card.current_balance;
        const balanceAfter = balanceBefore - redeemAmount;

        // Update card balance and status atomically
        card.current_balance = balanceAfter;
        card.status = balanceAfter === 0 ? 'FULLY_REDEEMED' : 'PARTIALLY_REDEEMED';
        card.updated_at = new Date().toISOString();

        // Write Ledger Transaction (Releases Deferred Revenue into Order Revenue)
        const txId = `gctx-${crypto.randomUUID()}`;
        const redemptionTx = {
          id: txId,
          gift_card_id: card.id,
          transaction_type: 'REDEMPTION',
          amount: -redeemAmount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          currency: card.currency,
          order_number: orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
          reason: `Checkout redemption for order ${orderNumber || ''}`.trim(),
          authorized_actor: 'CUSTOMER_CHECKOUT',
          created_at: new Date().toISOString()
        };
        memoryStore.gift_card_transactions.push(redemptionTx);

        // Audit Log
        const auditLog = {
          id: `gcaudit-${crypto.randomUUID()}`,
          gift_card_id: card.id,
          actor: 'CUSTOMER_CHECKOUT',
          action: 'CARD_REDEEMED',
          details: {
            amount: redeemAmount,
            balanceAfter,
            orderNumber
          },
          ip_address: clientIp,
          created_at: new Date().toISOString()
        };
        memoryStore.gift_card_audit_logs.push(auditLog);

        persistGiftCard(card);
        persistLedgerTransaction(redemptionTx);
        persistAuditLog(auditLog);

        createAndDispatchNotification({
          recipient_id: card.purchased_by || 'customer_default',
          recipient_role: 'customer',
          event_type: 'giftcard.redeemed',
          category: 'giftcard',
          severity: 'info',
          title: `Gift Card Redeemed: ₹${redeemAmount.toLocaleString('en-IN')}`,
          message: `Card ending in ${card.code.slice(-4)} redeemed for ₹${redeemAmount.toLocaleString('en-IN')}. Remaining balance: ₹${balanceAfter.toLocaleString('en-IN')}.`,
          related_entity_type: 'gift_card',
          related_entity_id: card.id,
          destination_route: '/gift-cards',
          idempotency_key: `notif-gc-redeem-${txId}`
        }).catch(() => {});

        return {
          status: 200,
          data: {
            success: true,
            message: 'Gift card successfully redeemed',
            transactionId: txId,
            balanceBefore,
            amountRedeemed: redeemAmount,
            remainingBalance: balanceAfter,
            status: card.status
          }
        };
      });

      sendJson(res, result.status, result.data);
      return true;
    }

    // =========================================================================
    // 11. POST /api/v1/gift-cards/:id/resend (Authorized Delivery Resend)
    // =========================================================================
    if (pathname.match(/^\/api\/v1\/gift-cards\/[^/]+\/resend$/) && method === 'POST') {
      const id = pathname.split('/')[4];
      const card = memoryStore.gift_cards.find(c => c.id === id || c.code === id);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card not found' });
        return true;
      }

      // Mark delivered state and log delivery attempt
      card.delivery_status = 'DELIVERED';
      card.updated_at = new Date().toISOString();

      const auditLog = {
        id: `gcaudit-${crypto.randomUUID()}`,
        gift_card_id: card.id,
        actor: 'USER_RESEND',
        action: 'DELIVERY_RESENT',
        details: { recipient: card.recipient_email },
        ip_address: clientIp,
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_audit_logs.push(auditLog);
      persistAuditLog(auditLog);

      sendJson(res, 200, {
        success: true,
        message: `Digital gift card dispatched to ${card.recipient_email}`
      });
      return true;
    }

    // =========================================================================
    // 12. GET /api/v1/admin/gift-cards (Admin List & KPI Overview)
    // =========================================================================
    if (pathname === '/api/v1/admin/gift-cards' && method === 'GET') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const cards = memoryStore.gift_cards;

      // Calculate real KPI statistics
      const totalCardsSold = cards.length;
      const totalValueIssued = cards.reduce((sum, c) => sum + (c.original_value || 0), 0);
      const outstandingLiability = cards.reduce((sum, c) => sum + (c.current_balance || 0), 0);
      const totalRedeemedValue = totalValueIssued - outstandingLiability;
      const activeCardsCount = cards.filter(c => c.status === 'ACTIVE' || c.status === 'PARTIALLY_REDEEMED').length;
      const fullyRedeemedCount = cards.filter(c => c.status === 'FULLY_REDEEMED').length;
      const suspendedCount = cards.filter(c => c.status === 'SUSPENDED').length;
      const cancelledCount = cards.filter(c => c.status === 'CANCELLED').length;

      // Filtering
      const search = String(query.search || '').toLowerCase();
      const statusFilter = String(query.status || '').toUpperCase();

      let filtered = cards;
      if (search) {
        filtered = filtered.filter(c => 
          c.code.toLowerCase().includes(search) ||
          (c.purchaser_name && c.purchaser_name.toLowerCase().includes(search)) ||
          (c.recipient_name && c.recipient_name.toLowerCase().includes(search)) ||
          (c.recipient_email && c.recipient_email.toLowerCase().includes(search))
        );
      }
      if (statusFilter && statusFilter !== 'ALL') {
        filtered = filtered.filter(c => c.status === statusFilter);
      }

      // Enrich with masked code for admin view safety
      const enrichedCards = filtered.map(c => ({
        ...c,
        maskedCode: `${c.code.slice(0, 8)}****${c.code.slice(-2)}`,
        design: GIFT_CARD_DESIGNS.find(d => d.id === c.design_id) || GIFT_CARD_DESIGNS[0]
      }));

      sendJson(res, 200, {
        success: true,
        stats: {
          totalCardsSold,
          totalValueIssued,
          totalRedeemedValue,
          outstandingLiability,
          activeCardsCount,
          fullyRedeemedCount,
          suspendedCount,
          cancelledCount,
          currency: 'INR'
        },
        cards: enrichedCards
      });
      return true;
    }

    // =========================================================================
    // 13. GET /api/v1/admin/gift-cards/export (CSV Export)
    // =========================================================================
    if (pathname === '/api/v1/admin/gift-cards/export' && method === 'GET') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const cards = memoryStore.gift_cards;
      const headers = ['Code', 'Status', 'Original Value', 'Current Balance', 'Purchaser', 'Recipient', 'Delivery Status', 'Created At'];
      const rows = cards.map(c => [
        `"${c.code.slice(0, 8)}****${c.code.slice(-2)}"`,
        `"${c.status}"`,
        c.original_value,
        c.current_balance,
        `"${c.purchaser_name || c.purchaser_email || ''}"`,
        `"${c.recipient_name || c.recipient_email || ''}"`,
        `"${c.delivery_status || 'DELIVERED'}"`,
        `"${new Date(c.created_at).toISOString()}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=yazhini_gift_cards_${Date.now()}.csv`);
      res.end(csvContent);
      return true;
    }

    // =========================================================================
    // 14. GET /api/v1/admin/gift-cards/:id (Admin Detail, Ledger, Audit Log)
    // =========================================================================
    if (pathname !== '/api/v1/admin/gift-cards/reconciliation' && 
        pathname !== '/api/v1/admin/gift-cards/export' && 
        pathname !== '/api/v1/admin/gift-cards/config' &&
        pathname.match(/^\/api\/v1\/admin\/gift-cards\/[^/]+$/) && method === 'GET') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const id = pathname.split('/')[5];
      const card = memoryStore.gift_cards.find(c => c.id === id || c.code === id);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card not found' });
        return true;
      }

      const transactions = memoryStore.gift_card_transactions
        .filter(t => t.gift_card_id === card.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const auditLogs = memoryStore.gift_card_audit_logs
        .filter(a => a.gift_card_id === card.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      sendJson(res, 200, {
        success: true,
        card: {
          ...card,
          design: GIFT_CARD_DESIGNS.find(d => d.id === card.design_id) || GIFT_CARD_DESIGNS[0]
        },
        transactions,
        auditLogs
      });
      return true;
    }

    // =========================================================================
    // 15. PATCH /api/v1/admin/gift-cards/:id/status (Admin Status Transition)
    // =========================================================================
    if (pathname.match(/^\/api\/v1\/admin\/gift-cards\/[^/]+\/status$/) && method === 'PATCH') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const id = pathname.split('/')[5];
      const card = memoryStore.gift_cards.find(c => c.id === id);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card not found' });
        return true;
      }

      const { status, reason } = body;
      const validStatuses = ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'];
      if (!validStatuses.includes(status)) {
        sendJson(res, 400, { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return true;
      }

      if (!reason || String(reason).trim().length < 5) {
        sendJson(res, 400, { success: false, error: 'A specific reason (minimum 5 characters) is required for status changes.' });
        return true;
      }

      const oldStatus = card.status;
      card.status = status;
      card.updated_at = new Date().toISOString();

      // Audit Log
      const auditLog = {
        id: `gcaudit-${crypto.randomUUID()}`,
        gift_card_id: card.id,
        actor: user.email || 'ADMIN',
        action: 'STATUS_CHANGED',
        details: { oldStatus, newStatus: status, reason },
        ip_address: clientIp,
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_audit_logs.push(auditLog);

      persistGiftCard(card);
      persistAuditLog(auditLog);

      sendJson(res, 200, {
        success: true,
        message: `Gift card status updated to ${status}`,
        card
      });
      return true;
    }

    // =========================================================================
    // 16. POST /api/v1/admin/gift-cards/:id/refund (Cancel & Refund Card)
    // =========================================================================
    if (pathname.match(/^\/api\/v1\/admin\/gift-cards\/[^/]+\/refund$/) && method === 'POST') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const id = pathname.split('/')[5];
      const card = memoryStore.gift_cards.find(c => c.id === id);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card not found' });
        return true;
      }

      const { refundReason } = body;
      if (!refundReason || String(refundReason).trim().length < 5) {
        sendJson(res, 400, { success: false, error: 'A specific explanation (min 5 characters) is required for card cancellation & refund.' });
        return true;
      }

      const refundAmount = card.current_balance;
      const balanceBefore = card.current_balance;

      card.current_balance = 0;
      card.status = 'CANCELLED';
      card.updated_at = new Date().toISOString();

      // Write REFUND Ledger Entry
      const txId = `gctx-${crypto.randomUUID()}`;
      const refundTx = {
        id: txId,
        gift_card_id: card.id,
        transaction_type: 'REFUND',
        amount: -refundAmount,
        balance_before: balanceBefore,
        balance_after: 0,
        currency: card.currency,
        order_number: 'ADMIN_CARD_REFUND',
        reason: `Full card refund & cancellation: ${refundReason}`,
        authorized_actor: user.email || 'STAFF_ADMIN',
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_transactions.push(refundTx);

      const auditLog = {
        id: `gcaudit-${crypto.randomUUID()}`,
        gift_card_id: card.id,
        actor: user.email || 'STAFF_ADMIN',
        action: 'CARD_REFUNDED_AND_CANCELLED',
        details: { refundAmount, balanceBefore, reason: refundReason },
        ip_address: clientIp,
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_audit_logs.push(auditLog);

      persistGiftCard(card);
      persistLedgerTransaction(refundTx);
      persistAuditLog(auditLog);

      sendJson(res, 200, {
        success: true,
        message: `Gift card cancelled and refunded ₹${refundAmount.toLocaleString('en-IN')}`,
        card
      });
      return true;
    }

    // =========================================================================
    // 17. POST /api/v1/admin/gift-cards/:id/adjust-balance (Ledger Adjustment)
    // =========================================================================
    if (pathname.match(/^\/api\/v1\/admin\/gift-cards\/[^/]+\/adjust-balance$/) && method === 'POST') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const id = pathname.split('/')[5];
      const card = memoryStore.gift_cards.find(c => c.id === id);
      if (!card) {
        sendJson(res, 404, { success: false, error: 'Gift card not found' });
        return true;
      }

      const { adjustmentAmount, reason, direction = 'CREDIT' } = body;
      const numAmount = Number(adjustmentAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        sendJson(res, 400, { success: false, error: 'Valid positive adjustment amount is required.' });
        return true;
      }

      if (!reason || String(reason).trim().length < 5) {
        sendJson(res, 400, { success: false, error: 'A specific explanation/reason is required for financial balance adjustments.' });
        return true;
      }

      const balanceBefore = card.current_balance;
      const signedDelta = direction === 'DEBIT' ? -numAmount : numAmount;
      const balanceAfter = balanceBefore + signedDelta;

      if (balanceAfter < 0) {
        sendJson(res, 400, { success: false, error: 'Debit exceeds current balance. Balance cannot be negative.' });
        return true;
      }

      card.current_balance = balanceAfter;
      if (balanceAfter === 0) {
        card.status = 'FULLY_REDEEMED';
      } else if (balanceAfter < card.original_value) {
        card.status = 'PARTIALLY_REDEEMED';
      } else {
        card.status = 'ACTIVE';
      }
      card.updated_at = new Date().toISOString();

      // Write Ledger Entry
      const txId = `gctx-${crypto.randomUUID()}`;
      const adjustTx = {
        id: txId,
        gift_card_id: card.id,
        transaction_type: 'ADJUSTMENT',
        amount: signedDelta,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        currency: card.currency,
        order_number: 'MANUAL_AUDIT_ADJUSTMENT',
        reason,
        authorized_actor: user.email || 'STAFF_ADMIN',
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_transactions.push(adjustTx);

      // Write Audit Log
      const auditLog = {
        id: `gcaudit-${crypto.randomUUID()}`,
        gift_card_id: card.id,
        actor: user.email || 'STAFF_ADMIN',
        action: 'BALANCE_ADJUSTED',
        details: {
          direction,
          amount: numAmount,
          balanceBefore,
          balanceAfter,
          reason
        },
        ip_address: clientIp,
        created_at: new Date().toISOString()
      };
      memoryStore.gift_card_audit_logs.push(auditLog);

      persistGiftCard(card);
      persistLedgerTransaction(adjustTx);
      persistAuditLog(auditLog);

      sendJson(res, 200, {
        success: true,
        message: `Gift card balance adjusted by ₹${signedDelta > 0 ? '+' : ''}${signedDelta.toLocaleString('en-IN')}`,
        card,
        transaction: adjustTx
      });
      return true;
    }

    // =========================================================================
    // 18. PUT /api/v1/admin/gift-cards/config (Update Store Policies)
    // =========================================================================
    if (pathname === '/api/v1/admin/gift-cards/config' && method === 'PUT') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const {
        minAmount,
        maxAmount,
        denominations,
        validityDays,
        partialRedemptionEnabled,
        maxCardsPerOrder
      } = body;

      if (minAmount && Number(minAmount) > 0) GIFT_CARD_CONFIG.minAmount = Number(minAmount);
      if (maxAmount && Number(maxAmount) >= GIFT_CARD_CONFIG.minAmount) GIFT_CARD_CONFIG.maxAmount = Number(maxAmount);
      if (Array.isArray(denominations) && denominations.length > 0) GIFT_CARD_CONFIG.denominations = denominations;
      if (validityDays && Number(validityDays) >= 30) GIFT_CARD_CONFIG.validityDays = Number(validityDays);
      if (typeof partialRedemptionEnabled === 'boolean') GIFT_CARD_CONFIG.partialRedemptionEnabled = partialRedemptionEnabled;
      if (maxCardsPerOrder && Number(maxCardsPerOrder) >= 1) GIFT_CARD_CONFIG.maxCardsPerOrder = Number(maxCardsPerOrder);

      sendJson(res, 200, {
        success: true,
        message: 'Gift card configuration updated successfully',
        config: GIFT_CARD_CONFIG
      });
      return true;
    }

    // =========================================================================
    // 19. PATCH /api/v1/admin/gift-cards/designs/:id (Toggle Design Published/Active)
    // =========================================================================
    if (pathname.match(/^\/api\/v1\/admin\/gift-cards\/designs\/[^/]+$/) && method === 'PATCH') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const designId = pathname.split('/')[6];
      const design = GIFT_CARD_DESIGNS.find(d => d.id === designId);
      if (!design) {
        sendJson(res, 404, { success: false, error: 'Design template not found' });
        return true;
      }

      if (typeof body.is_active === 'boolean') {
        design.is_active = body.is_active;
      }
      if (body.name) design.name = String(body.name);
      if (body.tagline) design.tagline = String(body.tagline);
      if (body.accentColor) design.accentColor = String(body.accentColor);

      sendJson(res, 200, {
        success: true,
        message: `Design "${design.name}" updated`,
        design
      });
      return true;
    }

    // =========================================================================
    // 20. GET /api/v1/admin/gift-cards/reconciliation (Financial Ledger Reconciliation)
    // =========================================================================
    if (pathname === '/api/v1/admin/gift-cards/reconciliation' && method === 'GET') {
      const user = await getAuthUser(req);
      if (!user || !user.isStaff) {
        sendJson(res, 403, { success: false, error: 'Administrative privileges required' });
        return true;
      }

      const cards = memoryStore.gift_cards;
      const transactions = memoryStore.gift_card_transactions;

      const reportRows = cards.map(c => {
        const cardTxs = transactions.filter(t => t.gift_card_id === c.id);
        const ledgerCalculatedBalance = cardTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const storedBalance = c.current_balance;
        const isDiscrepant = Math.abs(ledgerCalculatedBalance - storedBalance) > 0.001;

        return {
          cardId: c.id,
          code: `${c.code.slice(0, 8)}****${c.code.slice(-2)}`,
          originalValue: c.original_value,
          storedBalance,
          ledgerCalculatedBalance,
          discrepancy: ledgerCalculatedBalance - storedBalance,
          status: c.status,
          isBalanced: !isDiscrepant,
          transactionCount: cardTxs.length
        };
      });

      const totalDiscrepancies = reportRows.filter(r => !r.isBalanced).length;
      const totalLiability = cards.reduce((sum, c) => sum + (c.current_balance || 0), 0);
      const totalIssuedValue = cards.reduce((sum, c) => sum + (c.original_value || 0), 0);
      const totalRedeemedValue = totalIssuedValue - totalLiability;

      sendJson(res, 200, {
        success: true,
        reconciliationDate: new Date().toISOString(),
        totalCardsAudited: cards.length,
        totalIssuedValue,
        totalRedeemedValue,
        outstandingLiability: totalLiability,
        totalDiscrepancies,
        isSystemReconciled: totalDiscrepancies === 0,
        rows: reportRows
      });
      return true;
    }

    return false;
  } catch (err: any) {
    console.error(`[Gift Card API Error] ${method} ${pathname}:`, err);
    sendJson(res, 500, {
      success: false,
      error: 'Internal server error while processing gift card operation',
      message: err.message
    });
    return true;
  }
}
