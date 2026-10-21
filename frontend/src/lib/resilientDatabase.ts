import { localJewelryItems } from '../utils/localData';
import { Customer } from '../types/pawnshop';

// ============================================================================
// RESILIENT LOCAL DATABASE ENGINE
// Emulates Supabase PostgREST table querying & CRUD operations locally with
// localStorage persistence and in-memory fallback.
// ============================================================================

const memoryStore = new Map<string, string>();

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function safeSet(key: string, val: string): void {
  try {
    memoryStore.set(key, val);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch {
    // ignore
  }
}

// Initial Seed Data
const SEED_COMPANIES = [
  {
    id: 'comp-001',
    company_name: "YAZHINI FINE JEWELS & PAWN SHOP",
    branch_name: 'Main T. Nagar Branch',
    address: 'No. 88, Usman Road, T. Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    phone: '9840012345',
    email: 'contact@yazhinifinejewels.in',
    gst_number: '33AAAAA0000A1Z5',
    license_number: 'TN/CHN/PAWN/2024/0089',
    logo_url: '/logo.png',
    print_header: "YAZHINI FINE JEWELS & PAWN SHOP • TRUST • TRADITION • TIMELESS BEAUTY",
    print_footer: 'Thank you for trusting YAZHINI Fine Jewels. Interest payable monthly. Subject to Chennai jurisdiction.',
    language_preference: 'en',
    is_active: true,
    created_at: new Date('2024-01-01').toISOString(),
    updated_at: new Date().toISOString()
  }
];

const SEED_LOAN_TYPES = [
  { id: 'lt-001', loan_type_name: 'Gold Loan (Standard)', description: 'Standard loan against 22K/24K hallmarked gold jewellery', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'lt-002', loan_type_name: 'Silver Loan', description: 'Quick loan against certified silver articles and utensils', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'lt-003', loan_type_name: 'Emergency Express Loan', description: 'Same-day emergency disbursement at preferential rate', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'lt-004', loan_type_name: 'Business Gold Line', description: 'High-value credit line for merchants and business owners', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() }
];

const SEED_JEWELLERY_TYPES = [
  { id: 'jt-001', jewellery_type_name: 'Gold Necklace / Haram', description: 'Traditional and contemporary gold necklaces', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'jt-002', jewellery_type_name: 'Gold Bangles / Kada', description: 'Solid and machine-cut bangles', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'jt-003', jewellery_type_name: 'Gold Ring / Bands', description: 'Gentlemen and ladies gold rings', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'jt-004', jewellery_type_name: 'Gold Chain / Rope', description: 'Chains, ropes, and mangalsutras', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'jt-005', jewellery_type_name: 'Gold Earrings / Jhumka', description: 'Studs, drops, and heirloom jhumkas', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'jt-006', jewellery_type_name: 'Silver Articles / Pooja', description: 'Silver plates, lamps, and idols', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() }
];

const SEED_SCHEMES = [
  { id: 'sch-001', scheme_name: 'Royal Prime (12% p.a.)', interest_rate: 1.0, interest_type: 'monthly', redemption_period_days: 365, penalty_rate: 0.5, min_amount: 10000, max_amount: 5000000, is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'sch-002', scheme_name: 'Super Saver (18% p.a.)', interest_rate: 1.5, interest_type: 'monthly', redemption_period_days: 180, penalty_rate: 1.0, min_amount: 5000, max_amount: 1000000, is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'sch-003', scheme_name: 'Instant Quick Loan (24% p.a.)', interest_rate: 2.0, interest_type: 'monthly', redemption_period_days: 90, penalty_rate: 1.5, min_amount: 2000, max_amount: 500000, is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() }
];

const SEED_BANK_MASTERS = [
  { id: 'bm-001', bank_name: 'State Bank of India', branch_name: 'T. Nagar SME Branch', account_number: '30987654321', ifsc_code: 'SBIN0001234', contact_person: 'R. Krishnan', phone: '9840098400', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() },
  { id: 'bm-002', bank_name: 'HDFC Bank', branch_name: 'Pondy Bazaar Branch', account_number: '50100234567890', ifsc_code: 'HDFC0000456', contact_person: 'S. Priya', phone: '9840198401', is_active: true, created_at: new Date('2024-01-01').toISOString(), updated_at: new Date().toISOString() }
];

const SEED_APP_USERS = [
  { id: 'usr-001', username: 'admin', full_name: 'Chief Curator (Administrator)', role: 'admin', email: 'admin@luxury.com', phone: '+91 98000 00000', designation: 'General Manager', qualification: 'MBA Gold Finance', is_active: true, created_at: new Date('2024-01-01').toISOString() },
  { id: 'usr-002', username: 'manager', full_name: 'Sundar Ramanathan', role: 'manager', email: 'manager@rcbjewelry.in', phone: '+91 98402 11223', designation: 'Branch Manager', qualification: 'B.Com, Certified Valuer', is_active: true, created_at: new Date('2024-01-05').toISOString() },
  { id: 'usr-003', username: 'staff1', full_name: 'Kavitha Murugan', role: 'staff', email: 'kavitha@rcbjewelry.in', phone: '+91 98403 44556', designation: 'Senior Valuer', qualification: 'Gemology Diploma', is_active: true, created_at: new Date('2024-01-10').toISOString() }
];

const SEED_PROFILES = [
  { id: 'patron-demo-001', full_name: 'Rajesh Verma (Royal Patron)', email: 'patron@rcbjewelry.in', phone: '+91 98765 43210' },
  { id: 'demo-user-002', full_name: 'Aurelle Member', email: 'demo@luxury.com', phone: '+91 98111 22334' },
  { id: 'admin-demo-001', full_name: 'Chief Curator', email: 'admin@luxury.com', phone: '+91 98000 00000' }
];

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-101',
    customer_code: 'RCB-CUST-1001',
    full_name: 'Rajeshwari Sundaram',
    first_name: 'Rajeshwari',
    last_name: 'Sundaram',
    phone: '9840123456',
    alternate_phone: '9444012345',
    email: 'rajeshwari.sundaram@gmail.com',
    date_of_birth: '1984-11-24',
    anniversary_date: '2008-05-18',
    gender: 'female',
    preferred_language: 'Tamil',
    customer_type: 'individual',
    category: 'vip',
    address: 'No. 42, Poes Garden, Cathedral Road',
    street: 'Poes Garden',
    locality: 'Alwarpet',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600086',
    country: 'India',
    id_proof_type: 'aadhar',
    id_proof_number: '982144129012',
    kyc_status: 'verified',
    kyc_verified_at: '2024-01-15T10:30:00.000Z',
    kyc_verified_by: 'admin@luxury.com',
    loyalty_tier: 'VIP',
    loyalty_points: 4850,
    total_purchases: 4,
    total_purchase_value: 485000,
    active_pawn_loans: 0,
    outstanding_pawn_principal: 0,
    outstanding_receivables: 0,
    last_purchase_date: '2024-02-10T14:20:00.000Z',
    last_interaction_date: '2024-03-01T11:00:00.000Z',
    assigned_staff: 'Lakshmi Narayanan',
    communication_consent: {
      sms: true,
      whatsapp: true,
      email: true,
      promotions: true,
      birthday_reminders: true
    },
    product_interests: ['Bridal Sets', 'Temple Jewellery', 'Uncut Diamonds'],
    is_active: true,
    created_at: '2023-08-12T09:00:00.000Z',
    updated_at: '2024-03-01T11:00:00.000Z'
  },
  {
    id: 'cust-102',
    customer_code: 'RCB-CUST-1002',
    full_name: 'Vikramaditya Verma',
    first_name: 'Vikramaditya',
    last_name: 'Verma',
    phone: '9884098765',
    email: 'vikram.verma@industries.in',
    date_of_birth: '1979-06-15',
    gender: 'male',
    preferred_language: 'English',
    customer_type: 'individual',
    category: 'loyal',
    address: '77, Avinashi Road, Race Course',
    street: 'Avinashi Road',
    locality: 'Race Course',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    country: 'India',
    id_proof_type: 'pan',
    id_proof_number: 'ABCDE1234F',
    kyc_status: 'verified',
    kyc_verified_at: '2023-11-20T12:00:00.000Z',
    kyc_verified_by: 'admin@luxury.com',
    loyalty_tier: 'Gold',
    loyalty_points: 2100,
    total_purchases: 2,
    total_purchase_value: 153000,
    active_pawn_loans: 1,
    outstanding_pawn_principal: 85000,
    outstanding_receivables: 0,
    last_purchase_date: '2023-12-05T16:45:00.000Z',
    last_interaction_date: '2024-02-28T15:10:00.000Z',
    assigned_staff: 'Senthil Kumar',
    communication_consent: {
      sms: true,
      whatsapp: true,
      email: false,
      promotions: false,
      birthday_reminders: true
    },
    product_interests: ['Men Gold Chains', 'Kadas', 'Bullion Coins'],
    is_active: true,
    created_at: '2023-09-05T10:15:00.000Z',
    updated_at: '2024-02-28T15:10:00.000Z'
  },
  {
    id: 'cust-103',
    customer_code: 'RCB-CUST-1003',
    full_name: 'Meenakshi Natarajan',
    first_name: 'Meenakshi',
    last_name: 'Natarajan',
    phone: '9791011223',
    email: 'meenakshi.natarajan@outlook.com',
    date_of_birth: '1992-04-08',
    gender: 'female',
    preferred_language: 'Tamil',
    customer_type: 'individual',
    category: 'retail',
    address: '15, West Masi Street, Near Temple',
    street: 'West Masi Street',
    locality: 'Town',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625001',
    country: 'India',
    id_proof_type: 'voter_id',
    id_proof_number: 'TN/04/182901',
    kyc_status: 'pending',
    loyalty_tier: 'Silver',
    loyalty_points: 650,
    total_purchases: 1,
    total_purchase_value: 45000,
    active_pawn_loans: 0,
    outstanding_pawn_principal: 0,
    outstanding_receivables: 0,
    last_purchase_date: '2024-01-22T11:30:00.000Z',
    last_interaction_date: '2024-02-15T09:45:00.000Z',
    assigned_staff: 'Kavitha Raman',
    communication_consent: {
      sms: true,
      whatsapp: true,
      email: true,
      promotions: true,
      birthday_reminders: true
    },
    product_interests: ['Antique Earrings', 'Silver Pooja Articles'],
    is_active: true,
    created_at: '2024-01-20T11:00:00.000Z',
    updated_at: '2024-02-15T09:45:00.000Z'
  },
  {
    id: 'cust-104',
    customer_code: 'RCB-CUST-1004',
    full_name: 'Anand K. Srinivasan',
    first_name: 'Anand',
    last_name: 'Srinivasan',
    phone: '9444055667',
    email: 'anand.srinivasan@yahoo.com',
    date_of_birth: '1981-08-19',
    gender: 'male',
    preferred_language: 'Tamil',
    customer_type: 'individual',
    category: 'retail',
    address: '28, Thillai Nagar, Main Road',
    street: 'Thillai Nagar',
    locality: 'Cantonment',
    city: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    pincode: '620018',
    country: 'India',
    id_proof_type: 'aadhar',
    id_proof_number: '481920194819',
    kyc_status: 'verified',
    kyc_verified_at: '2023-10-10T14:00:00.000Z',
    kyc_verified_by: 'pawn_officer@rcbjewelry.in',
    loyalty_tier: 'Standard',
    loyalty_points: 120,
    total_purchases: 0,
    total_purchase_value: 0,
    active_pawn_loans: 1,
    outstanding_pawn_principal: 42000,
    outstanding_receivables: 0,
    last_interaction_date: '2024-03-02T16:00:00.000Z',
    assigned_staff: 'Senthil Kumar',
    communication_consent: {
      sms: true,
      whatsapp: false,
      email: false,
      promotions: false,
      birthday_reminders: false
    },
    product_interests: ['Pawn Credit', 'Emergency Gold Loans'],
    is_active: true,
    created_at: '2023-10-09T10:00:00.000Z',
    updated_at: '2024-03-02T16:00:00.000Z'
  },
  {
    id: 'cust-105',
    customer_code: 'RCB-CUST-1005',
    full_name: 'Divya Balasubramanian',
    first_name: 'Divya',
    last_name: 'Balasubramanian',
    phone: '9962044332',
    email: 'divya.bala@gmail.com',
    date_of_birth: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    gender: 'female',
    preferred_language: 'English',
    customer_type: 'individual',
    category: 'vip',
    address: 'Flat 4B, Harrington Court, Shenoy Nagar',
    street: 'Shenoy Nagar 2nd Cross',
    locality: 'Shenoy Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600030',
    country: 'India',
    id_proof_type: 'passport',
    id_proof_number: 'Z8920194',
    kyc_status: 'verified',
    kyc_verified_at: '2023-12-01T15:30:00.000Z',
    kyc_verified_by: 'admin@luxury.com',
    loyalty_tier: 'Gold',
    loyalty_points: 1800,
    total_purchases: 2,
    total_purchase_value: 320000,
    active_pawn_loans: 0,
    outstanding_pawn_principal: 0,
    outstanding_receivables: 25000,
    last_purchase_date: '2024-02-14T18:00:00.000Z',
    last_interaction_date: '2024-02-25T11:30:00.000Z',
    assigned_staff: 'Lakshmi Narayanan',
    communication_consent: {
      sms: true,
      whatsapp: true,
      email: true,
      promotions: true,
      birthday_reminders: true
    },
    product_interests: ['Solitaire Rings', 'Rose Gold Bangles'],
    is_active: true,
    created_at: '2023-11-28T14:00:00.000Z',
    updated_at: '2024-02-25T11:30:00.000Z'
  },
  {
    id: 'cust-106',
    customer_code: 'RCB-CUST-1006',
    full_name: 'Mohammed Farooq',
    first_name: 'Mohammed',
    last_name: 'Farooq',
    phone: '9841077889',
    email: 'farooq.jewellers@gmail.com',
    date_of_birth: '1975-03-30',
    gender: 'male',
    preferred_language: 'Tamil',
    customer_type: 'business',
    category: 'wholesale',
    address: 'Bazaar Street, Near Old Bus Stand',
    street: 'Bazaar Street',
    locality: 'Central',
    city: 'Salem',
    state: 'Tamil Nadu',
    pincode: '636001',
    country: 'India',
    id_proof_type: 'pan',
    id_proof_number: 'AAACB1290K',
    kyc_status: 'verified',
    kyc_verified_at: '2023-07-10T10:00:00.000Z',
    kyc_verified_by: 'admin@luxury.com',
    loyalty_tier: 'VIP',
    loyalty_points: 7200,
    total_purchases: 6,
    total_purchase_value: 1240000,
    active_pawn_loans: 0,
    outstanding_pawn_principal: 0,
    outstanding_receivables: 0,
    last_purchase_date: '2024-02-28T12:00:00.000Z',
    last_interaction_date: '2024-03-01T17:00:00.000Z',
    assigned_staff: 'Lakshmi Narayanan',
    communication_consent: {
      sms: true,
      whatsapp: true,
      email: true,
      promotions: false,
      birthday_reminders: false
    },
    product_interests: ['Wholesale Bullion', 'Gold Coins 999'],
    is_active: true,
    created_at: '2023-06-15T09:30:00.000Z',
    updated_at: '2024-03-01T17:00:00.000Z'
  }
];

const SEED_PLEDGES = [
  {
    id: 'pl-1001',
    pledge_number: 'PL-2026-0001',
    customer_id: 'cust-101',
    scheme_id: 'sch-001',
    loan_type_id: 'lt-001',
    loan_amount: 150000,
    interest_rate: 1.0,
    pledge_date: '2026-09-15',
    due_date: '2027-09-15',
    status: 'active',
    remarks: 'Bridal necklace set safe vault deposit',
    created_at: '2026-09-15T10:00:00.000Z',
    updated_at: '2026-09-15T10:00:00.000Z',
    items: [
      {
        id: 'item-101',
        pledge_id: 'pl-1001',
        jewellery_type_id: 'jt-001',
        item_description: '22K Hallmarked Gold Choker Necklace',
        gross_weight_grams: 42.5,
        net_weight_grams: 40.0,
        purity: '22K',
        item_value: 220000
      }
    ]
  },
  {
    id: 'pl-1002',
    pledge_number: 'PL-2026-0002',
    customer_id: 'cust-102',
    scheme_id: 'sch-002',
    loan_type_id: 'lt-001',
    loan_amount: 85000,
    interest_rate: 1.5,
    pledge_date: '2026-10-01',
    due_date: '2027-04-01',
    status: 'active',
    remarks: 'Pair of antique bangles',
    created_at: '2026-10-01T11:30:00.000Z',
    updated_at: '2026-10-01T11:30:00.000Z',
    items: [
      {
        id: 'item-102',
        pledge_id: 'pl-1002',
        jewellery_type_id: 'jt-002',
        item_description: '22K Temple Gold Bangles (Pair)',
        gross_weight_grams: 26.0,
        net_weight_grams: 25.0,
        purity: '22K',
        item_value: 135000
      }
    ]
  },
  {
    id: 'pl-1003',
    pledge_number: 'PL-2026-0003',
    customer_id: 'cust-103',
    scheme_id: 'sch-003',
    loan_type_id: 'lt-003',
    loan_amount: 45000,
    interest_rate: 2.0,
    pledge_date: '2026-10-10',
    due_date: '2027-01-10',
    status: 'active',
    remarks: 'Emergency quick loan against gold chain',
    created_at: '2026-10-10T14:15:00.000Z',
    updated_at: '2026-10-10T14:15:00.000Z',
    items: [
      {
        id: 'item-103',
        pledge_id: 'pl-1003',
        jewellery_type_id: 'jt-004',
        item_description: '22K Solid Rope Gold Chain',
        gross_weight_grams: 14.5,
        net_weight_grams: 14.2,
        purity: '22K',
        item_value: 75000
      }
    ]
  }
];

const SEED_PLEDGE_ITEMS = [
  {
    id: 'item-101',
    pledge_id: 'pl-1001',
    jewellery_type_id: 'jt-001',
    item_description: '22K Hallmarked Gold Choker Necklace',
    gross_weight_grams: 42.5,
    net_weight_grams: 40.0,
    purity: '22K',
    item_value: 220000
  },
  {
    id: 'item-102',
    pledge_id: 'pl-1002',
    jewellery_type_id: 'jt-002',
    item_description: '22K Temple Gold Bangles (Pair)',
    gross_weight_grams: 26.0,
    net_weight_grams: 25.0,
    purity: '22K',
    item_value: 135000
  },
  {
    id: 'item-103',
    pledge_id: 'pl-1003',
    jewellery_type_id: 'jt-004',
    item_description: '22K Solid Rope Gold Chain',
    gross_weight_grams: 14.5,
    net_weight_grams: 14.2,
    purity: '22K',
    item_value: 75000
  }
];

const SEED_PAWN_REQUESTS = [
  {
    id: 'pr-001',
    user_id: 'patron-demo-001',
    item_description: '22K Gold Antique Choker with Uncut Emeralds (approx 35g)',
    requested_amount: 120000,
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pr-002',
    user_id: 'demo-user-002',
    item_description: '18K Diamond Solitaire Ring (1.2ct) with Certificate',
    requested_amount: 80000,
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const SEED_CASH_TRANSACTIONS = [
  {
    id: 'tx-001',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'receipt',
    category: 'interest_payment',
    amount: 1500,
    payment_method: 'upi',
    reference_type: 'pledge',
    reference_id: 'pl-1001',
    description: 'Monthly interest payment for PL-2026-0001',
    created_at: new Date().toISOString()
  },
  {
    id: 'tx-002',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'payment',
    category: 'loan_disbursement',
    amount: 45000,
    payment_method: 'cash',
    reference_type: 'pledge',
    reference_id: 'pl-1003',
    description: 'Loan disbursement for PL-2026-0003',
    created_at: new Date().toISOString()
  }
];

const SEED_METAL_RATES = [
  {
    id: 'mr-gold-today',
    metal_type: 'gold',
    rate_per_gram: 7250,
    effective_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mr-silver-today',
    metal_type: 'silver',
    rate_per_gram: 94.5,
    effective_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Map of table names to storage keys and default seed factories
interface TableConfig {
  storageKey: string;
  getDefaults: () => any[];
}

const TABLE_CONFIGS: Record<string, TableConfig> = {
  companies: { storageKey: 'rcb_master_companies', getDefaults: () => SEED_COMPANIES },
  loan_types: { storageKey: 'rcb_master_loan_types', getDefaults: () => SEED_LOAN_TYPES },
  jewellery_types: { storageKey: 'rcb_master_jewellery_types', getDefaults: () => SEED_JEWELLERY_TYPES },
  schemes: { storageKey: 'rcb_master_schemes', getDefaults: () => SEED_SCHEMES },
  bank_master: { storageKey: 'rcb_master_bank_masters', getDefaults: () => SEED_BANK_MASTERS },
  bank_masters: { storageKey: 'rcb_master_bank_masters', getDefaults: () => SEED_BANK_MASTERS },
  app_users: { storageKey: 'rcb_admin_app_users', getDefaults: () => SEED_APP_USERS },
  customers: {
    storageKey: 'rcb_crm_customers',
    getDefaults: () => {
      const crmRaw = safeGet('rcb_crm_customers');
      if (crmRaw) {
        try { return JSON.parse(crmRaw); } catch { /* ignore */ }
      }
      return SEED_CUSTOMERS;
    }
  },
  pledges: { storageKey: 'rcb_pawn_pledges', getDefaults: () => SEED_PLEDGES },
  pledge_items: { storageKey: 'rcb_pawn_pledge_items', getDefaults: () => SEED_PLEDGE_ITEMS },
  jewelry_items: { storageKey: 'rcb_admin_inventory', getDefaults: () => localJewelryItems },
  pawn_requests: { storageKey: 'rcb_pawn_requests', getDefaults: () => SEED_PAWN_REQUESTS },
  pawn_enquiries: { storageKey: 'rcb_pawn_enquiries', getDefaults: () => [] },
  cash_transactions: { storageKey: 'rcb_cash_transactions', getDefaults: () => SEED_CASH_TRANSACTIONS },
  pledge_returns: { storageKey: 'rcb_pledge_returns', getDefaults: () => [] },
  part_payments: { storageKey: 'rcb_part_payments', getDefaults: () => [] },
  additional_pledges: { storageKey: 'rcb_additional_pledges', getDefaults: () => [] },
  pledge_sales: { storageKey: 'rcb_pledge_sales', getDefaults: () => [] },
  bank_pledges: { storageKey: 'rcb_bank_pledges', getDefaults: () => [] },
  bank_pledge_receives: { storageKey: 'rcb_bank_pledge_receives', getDefaults: () => [] },
  cancelled_transactions: { storageKey: 'rcb_cancelled_transactions', getDefaults: () => [] },
  metal_rates: { storageKey: 'rcb_metal_rates', getDefaults: () => SEED_METAL_RATES },
  profiles: { storageKey: 'rcb_user_profiles', getDefaults: () => SEED_PROFILES },
  orders: { storageKey: 'rcb_orders', getDefaults: () => [{ id: 'ord-001', total_amount: 85000, status: 'completed', created_at: new Date().toISOString() }] },
  notifications: { storageKey: 'rcb_notifications', getDefaults: () => [] },
  pos_sales: { storageKey: 'rcb_pos_sales', getDefaults: () => [] },
  pos_sale_items: { storageKey: 'rcb_pos_sale_items', getDefaults: () => [] },
  suppliers: { storageKey: 'rcb_suppliers', getDefaults: () => [] },
  purchases: { storageKey: 'rcb_purchases', getDefaults: () => [] },
  certified_diamonds: { storageKey: 'rcb_certified_diamonds', getDefaults: () => [] },
  store_settings: { storageKey: 'rcb_store_settings', getDefaults: () => [] },
  audit_logs: { storageKey: 'rcb_audit_logs', getDefaults: () => [] },
  app_sequences: { storageKey: 'rcb_app_sequences', getDefaults: () => [] }
};

export function getLocalTableData(tableName: string): any[] {
  const norm = tableName.toLowerCase().trim();
  const config = TABLE_CONFIGS[norm] || {
    storageKey: `rcb_table_${norm}`,
    getDefaults: () => []
  };

  const raw = safeGet(config.storageKey);
  if (!raw) {
    const defaults = config.getDefaults();
    safeSet(config.storageKey, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults));
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return config.getDefaults();
  } catch {
    return config.getDefaults();
  }
}

export function saveLocalTableData(tableName: string, data: any[]): void {
  const norm = tableName.toLowerCase().trim();
  const config = TABLE_CONFIGS[norm] || {
    storageKey: `rcb_table_${norm}`,
    getDefaults: () => []
  };
  safeSet(config.storageKey, JSON.stringify(data));
}

// ============================================================================
// CHAINABLE POSTGREST BUILDER EMULATOR
// ============================================================================
export class ResilientPostgrestBuilder<T = any> implements PromiseLike<{ data: T | null; error: any; count: number | null }> {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private selectColumns: string = '*';
  private countMode?: 'exact' | 'planned' | 'estimated';
  private headOnly: boolean = false;
  private payload: any = null;
  private filters: Array<(row: any) => boolean> = [];
  private orderColumn?: string;
  private orderAscending: boolean = true;
  private limitCount?: number;
  private rangeStart?: number;
  private rangeEnd?: number;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    this.selectColumns = columns;
    if (options?.count) this.countMode = options.count;
    if (options?.head) this.headOnly = options.head;
    return this;
  }

  insert(values: any | any[], _options?: any) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  upsert(values: any | any[], _options?: any) {
    this.action = 'upsert';
    this.payload = values;
    return this;
  }

  update(values: any, _options?: any) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete(_options?: any) {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(row => {
      const val = row[column];
      if (val === undefined) return false;
      return String(val) === String(value);
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(row => String(row[column]) !== String(value));
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push(row => Number(row[column]) > Number(value));
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'string' && typeof value === 'string') {
        return rowVal >= value;
      }
      return Number(rowVal) >= Number(value);
    });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push(row => Number(row[column]) < Number(value));
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(row => {
      const rowVal = row[column];
      if (typeof rowVal === 'string' && typeof value === 'string') {
        return rowVal <= value;
      }
      return Number(rowVal) <= Number(value);
    });
    return this;
  }

  like(column: string, pattern: string) {
    const cleanPattern = pattern.replace(/%/g, '');
    this.filters.push(row => String(row[column] || '').includes(cleanPattern));
    return this;
  }

  ilike(column: string, pattern: string) {
    const cleanPattern = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push(row => String(row[column] || '').toLowerCase().includes(cleanPattern));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push(row => row[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    const set = new Set(values.map(String));
    this.filters.push(row => set.has(String(row[column])));
    return this;
  }

  contains(column: string, value: any) {
    this.filters.push(row => {
      const val = row[column];
      if (Array.isArray(val)) {
        return Array.isArray(value) ? value.every(v => val.includes(v)) : val.includes(value);
      }
      return String(val).includes(String(value));
    });
    return this;
  }

  containedBy(column: string, value: any) {
    this.filters.push(row => {
      const val = row[column];
      if (Array.isArray(value)) {
        return value.includes(val);
      }
      return false;
    });
    return this;
  }

  or(filterStr: string) {
    // Basic comma-separated OR condition evaluator: e.g. "status.eq.active,status.eq.partially_paid"
    try {
      const clauses = filterStr.split(',').map(s => s.trim());
      this.filters.push(row => {
        return clauses.some(c => {
          const parts = c.split('.');
          if (parts.length >= 3) {
            const [field, op, val] = parts;
            if (op === 'eq') return String(row[field]) === String(val);
            if (op === 'neq') return String(row[field]) !== String(val);
          }
          return false;
        });
      });
    } catch {
      // Ignore complex unparsable OR filters
    }
    return this;
  }

  filter(column: string, _operator: string, value: any) {
    return this.eq(column, value);
  }

  match(query: Record<string, any>) {
    Object.entries(query).forEach(([col, val]) => {
      this.eq(col, val);
    });
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'eq') return this.neq(column, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }) {
    this.orderColumn = column;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number, _options?: any) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number, _options?: any) {
    this.rangeStart = from;
    this.rangeEnd = to;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  csv() {
    return this;
  }

  private execute(): { data: any; error: any; count: number | null; status: number; statusText: string } {
    let rows = getLocalTableData(this.tableName);

    if (this.action === 'insert') {
      const itemsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = itemsToInsert.map(item => {
        const id = item.id || `${this.tableName}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        const now = new Date().toISOString();
        return {
          ...item,
          id,
          created_at: item.created_at || now,
          updated_at: now
        };
      });

      rows = [...rows, ...inserted];
      saveLocalTableData(this.tableName, rows);

      const resultData = this.isSingle || !Array.isArray(this.payload) ? inserted[0] : inserted;
      return {
        data: resultData,
        error: null,
        count: inserted.length,
        status: 201,
        statusText: 'Created'
      };
    }

    if (this.action === 'upsert') {
      const itemsToUpsert = Array.isArray(this.payload) ? this.payload : [this.payload];
      const upserted: any[] = [];

      itemsToUpsert.forEach(item => {
        const id = item.id || item.effective_date ? `${item.metal_type}_${item.effective_date}` : null;
        const existingIdx = rows.findIndex(r => (id && r.id === id) || (item.id && r.id === item.id));

        const now = new Date().toISOString();
        if (existingIdx >= 0) {
          rows[existingIdx] = { ...rows[existingIdx], ...item, updated_at: now };
          upserted.push(rows[existingIdx]);
        } else {
          const newItem = {
            ...item,
            id: id || `${this.tableName}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
            created_at: item.created_at || now,
            updated_at: now
          };
          rows.push(newItem);
          upserted.push(newItem);
        }
      });

      saveLocalTableData(this.tableName, rows);
      const resultData = this.isSingle || !Array.isArray(this.payload) ? upserted[0] : upserted;
      return {
        data: resultData,
        error: null,
        count: upserted.length,
        status: 200,
        statusText: 'OK'
      };
    }

    if (this.action === 'update') {
      const updated: any[] = [];
      const now = new Date().toISOString();

      rows = rows.map(row => {
        const matches = this.filters.every(f => f(row));
        if (matches) {
          const updatedRow = { ...row, ...this.payload, updated_at: now };
          updated.push(updatedRow);
          return updatedRow;
        }
        return row;
      });

      saveLocalTableData(this.tableName, rows);
      const resultData = this.isSingle ? updated[0] || null : updated;
      return {
        data: resultData,
        error: null,
        count: updated.length,
        status: 200,
        statusText: 'OK'
      };
    }

    if (this.action === 'delete') {
      const deleted: any[] = [];
      const remaining: any[] = [];

      rows.forEach(row => {
        const matches = this.filters.every(f => f(row));
        if (matches) {
          deleted.push(row);
        } else {
          remaining.push(row);
        }
      });

      saveLocalTableData(this.tableName, remaining);
      return {
        data: this.isSingle ? deleted[0] || null : deleted,
        error: null,
        count: deleted.length,
        status: 200,
        statusText: 'OK'
      };
    }

    // SELECT
    let result = rows;

    // Apply filters
    if (this.filters.length > 0) {
      result = result.filter(row => this.filters.every(fn => fn(row)));
    }

    const totalCount = result.length;

    // Expand foreign table relationships if requested
    if (this.selectColumns && this.selectColumns !== '*') {
      const normSelect = this.selectColumns;

      if (normSelect.includes('customer') || normSelect.includes('customers')) {
        const customers = getLocalTableData('customers');
        result = result.map(r => ({
          ...r,
          customer: customers.find(c => c.id === r.customer_id) || null
        }));
      }

      if (normSelect.includes('scheme') || normSelect.includes('schemes')) {
        const schemes = getLocalTableData('schemes');
        result = result.map(r => ({
          ...r,
          scheme: schemes.find(s => s.id === r.scheme_id) || null
        }));
      }

      if (normSelect.includes('loan_type') || normSelect.includes('loan_types')) {
        const loanTypes = getLocalTableData('loan_types');
        result = result.map(r => ({
          ...r,
          loan_type: loanTypes.find(l => l.id === r.loan_type_id) || null
        }));
      }

      if (normSelect.includes('items') || normSelect.includes('pledge_items')) {
        const items = getLocalTableData('pledge_items');
        result = result.map(r => ({
          ...r,
          items: r.items || items.filter(it => it.pledge_id === r.id)
        }));
      }
    }

    // Order
    if (this.orderColumn) {
      const col = this.orderColumn;
      const asc = this.orderAscending;
      result = [...result].sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA == null) return asc ? 1 : -1;
        if (valB == null) return asc ? -1 : 1;
        if (typeof valA === 'string') {
          return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return asc ? valA - valB : valB - valA;
      });
    }

    // Range / Limit
    if (this.rangeStart !== undefined && this.rangeEnd !== undefined) {
      result = result.slice(this.rangeStart, this.rangeEnd + 1);
    } else if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    if (this.headOnly) {
      return {
        data: null,
        error: null,
        count: totalCount,
        status: 200,
        statusText: 'OK'
      };
    }

    if (this.isSingle) {
      const singleItem = result.length > 0 ? result[0] : null;
      return {
        data: singleItem,
        error: singleItem ? null : { message: 'Row not found', code: 'PGRST116' },
        count: totalCount,
        status: singleItem ? 200 : 406,
        statusText: singleItem ? 'OK' : 'Not Acceptable'
      };
    }

    if (this.isMaybeSingle) {
      return {
        data: result.length > 0 ? result[0] : null,
        error: null,
        count: totalCount,
        status: 200,
        statusText: 'OK'
      };
    }

    return {
      data: result,
      error: null,
      count: this.countMode ? totalCount : result.length,
      status: 200,
      statusText: 'OK'
    };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): PromiseLike<any | TResult> {
    return Promise.resolve()
      .then(() => this.execute())
      .catch(onrejected as any);
  }
}
