/**
 * Retail & Operations Data Persistence Service Layer
 * YAZHINI FINE JEWELS & PAWN SHOP
 * 
 * Provides durable database persistence via Supabase / PostgreSQL for:
 * - POS Sales & Line Invoices
 * - Gap-Free Sequential Invoice & Purchase Numbering (CGST Rule 46)
 * - Procurement & Suppliers
 * - Certified Diamonds Register
 * - Store Configuration & Legal Identity
 * - Immutable Security & Operations Audit Logs
 */

import { supabase } from '../lib/supabase';
import { realtimeManager } from './realtimeService';
import { 
  generateInvoiceNumber, 
  generatePurchaseOrderNumber, 
  generateCustomerCode 
} from '../utils/sequenceUtils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PosSaleItem {
  id?: string;
  item_id: string;
  name: string;
  category: string;
  metal_type: string;
  purity: string;
  weight: number;
  making_charge: number;
  quantity: number;
  price: number;
  huid?: string;
}

export interface PosSaleRecord {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  items: PosSaleItem[];
  subtotal: number;
  making_charges_total: number;
  hallmarking_fee: number;
  discount: number;
  tax_amount: number;
  final_amount: number;
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer';
  payment_reference: string;
  status?: string;
  created_at: string;
  created_by?: string;
}

export interface SupplierRecord {
  id: string;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  category: 'Bullion Refiner' | 'Jewellery Manufacturer' | 'Diamond Merchant' | 'Artisan / Karigar';
  outstanding_balance: number;
  is_active?: boolean;
  created_at: string;
}

export interface PurchaseInwardRecord {
  id: string;
  purchase_number: string;
  supplier_id: string;
  supplier_name: string;
  invoice_ref: string;
  metal_type: string;
  purity: string;
  gross_weight: number;
  net_weight: number;
  rate_per_gram: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'paid' | 'partial' | 'pending';
  purchase_date: string;
  notes?: string;
  created_at?: string;
}

export interface CertifiedDiamondRecord {
  id: string;
  sku: string;
  origin: 'natural' | 'lab_grown';
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  cert_lab: string;
  cert_number: string;
  purchase_cost: number;
  rapaport_benchmark_inr: number;
  selling_price: number;
  status: 'available' | 'mounted' | 'sold' | 'reserved';
  created_at: string;
}

export interface StoreProfileConfig {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  bisLicence: string;
  gstRate: number;
  goldLoanInterest: number;
  makingChargeBuffer?: number;
  bisFeePerPiece?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  details: string;
  severity: 'info' | 'warning' | 'security' | 'critical';
}

// Default Seed Suppliers
const DEFAULT_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'sup-1',
    supplier_name: 'MMTC-PAMP India Bullion Refinery',
    contact_person: 'Ramesh Sundar',
    phone: '+91 98410 88210',
    email: 'bullion@mmtcpamp.in',
    gstin: '33AABCM8291K1Z3',
    address: 'Industrial Bullion Complex, Chennai',
    category: 'Bullion Refiner',
    outstanding_balance: 0,
    created_at: '2024-01-10T00:00:00.000Z'
  },
  {
    id: 'sup-2',
    supplier_name: 'Emerald Jewel Industry India Ltd',
    contact_person: 'K. Srinivasan',
    phone: '+91 94432 19020',
    email: 'procurement@ejindia.com',
    gstin: '33AABCE1289P1Z9',
    address: 'Rakkiyapalayam, Coimbatore - 641029',
    category: 'Jewellery Manufacturer',
    outstanding_balance: 245000,
    created_at: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'sup-3',
    supplier_name: 'Surat Solitaire DTC Sight Holder',
    contact_person: 'Pravin Mehta',
    phone: '+91 98251 77310',
    email: 'rough@suratsolitaire.in',
    gstin: '24AACCS9011J1Z8',
    address: 'Diamond Research and Mercantile City, Surat',
    category: 'Diamond Merchant',
    outstanding_balance: 512000,
    created_at: '2024-01-20T00:00:00.000Z'
  }
];

// Default Seed Diamonds
const DEFAULT_DIAMONDS: CertifiedDiamondRecord[] = [
  {
    id: 'dia-1',
    sku: 'DIA-GIA-8921',
    origin: 'natural',
    shape: 'Round Brilliant',
    carat: 1.05,
    color: 'E',
    clarity: 'VVS2',
    cut: 'Excellent',
    cert_lab: 'GIA',
    cert_number: '2489102941',
    purchase_cost: 420000,
    rapaport_benchmark_inr: 512000,
    selling_price: 545000,
    status: 'available',
    created_at: '2024-01-12T00:00:00.000Z'
  },
  {
    id: 'dia-2',
    sku: 'DIA-IGI-4412',
    origin: 'natural',
    shape: 'Oval',
    carat: 0.85,
    color: 'F',
    clarity: 'VS1',
    cut: 'Very Good',
    cert_lab: 'IGI',
    cert_number: '592019482',
    purchase_cost: 210000,
    rapaport_benchmark_inr: 265000,
    selling_price: 285000,
    status: 'mounted',
    created_at: '2024-01-18T00:00:00.000Z'
  },
  {
    id: 'dia-3',
    sku: 'DIA-CVD-1092',
    origin: 'lab_grown',
    shape: 'Emerald Cut',
    carat: 2.10,
    color: 'D',
    clarity: 'VVS1',
    cut: 'Ideal',
    cert_lab: 'IGI-LG',
    cert_number: 'LG58291029',
    purchase_cost: 95000,
    rapaport_benchmark_inr: 135000,
    selling_price: 155000,
    status: 'available',
    created_at: '2024-01-22T00:00:00.000Z'
  }
];

// Default Store Profile
export const DEFAULT_STORE_CONFIG: StoreProfileConfig = {
  storeName: "YAZHINI FINE JEWELS & PAWN SHOP",
  tagline: "Fine Diamond Atelier, 916 BIS Hallmarked Gold & Secure Gold Loans",
  phone: "+91 94432 19020",
  email: "concierge@yazhinifinejewels.in",
  address: "Showroom: 104, Cross Cut Road, Gandhipuram, Coimbatore - 641012, Tamil Nadu",
  gstin: "33AAAAA0000A1Z5",
  bisLicence: "HM/C-6819201934",
  gstRate: 3.0,
  goldLoanInterest: 1.5,
  makingChargeBuffer: 0.0,
  bisFeePerPiece: 45.0
};

// ============================================================================
// POS SALES & INVOICES SERVICE
// ============================================================================

export async function getPosSales(): Promise<PosSaleRecord[]> {
  try {
    const { data: sales, error } = await supabase
      .from('pos_sales')
      .select('*, pos_sale_items(*)')
      .order('created_at', { ascending: false });

    if (!error && sales && sales.length > 0) {
      return sales.map(s => ({
        id: s.id,
        invoice_number: s.invoice_number,
        customer_id: s.customer_id,
        customer_name: s.customer_name,
        customer_phone: s.customer_phone,
        items: s.pos_sale_items || [],
        subtotal: Number(s.subtotal),
        making_charges_total: Number(s.making_charges_total),
        hallmarking_fee: Number(s.hallmarking_fee),
        discount: Number(s.discount),
        tax_amount: Number(s.tax_amount),
        final_amount: Number(s.final_amount),
        payment_method: s.payment_method,
        payment_reference: s.payment_reference,
        status: s.status,
        created_at: s.created_at,
        created_by: s.created_by
      }));
    }
  } catch (err) {
    console.warn('[RetailService] getPosSales DB fallback:', err);
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem('rcb_pos_sales');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getNextInvoiceNumber(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('pos_sales')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = (!error && data && data.length > 0) ? data[0].invoice_number : undefined;
    return generateInvoiceNumber(lastNumber);
  } catch {
    const raw = localStorage.getItem('rcb_pos_sales');
    if (raw) {
      const sales: PosSaleRecord[] = JSON.parse(raw);
      if (sales.length > 0) {
        return generateInvoiceNumber(sales[0].invoice_number);
      }
    }
    return generateInvoiceNumber();
  }
}

export async function getNextCustomerCode(): Promise<string> {
  try {
    const { data } = await supabase
      .from('customers')
      .select('customer_code')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastCode = data?.[0]?.customer_code;
    return generateCustomerCode(lastCode);
  } catch {
    return generateCustomerCode();
  }
}

export async function createPosSale(saleRecord: PosSaleRecord): Promise<PosSaleRecord> {
  // 1. Try PostgreSQL insertion
  try {
    const { data: insertedSale, error: saleErr } = await supabase
      .from('pos_sales')
      .insert({
        invoice_number: saleRecord.invoice_number,
        customer_id: saleRecord.customer_id || null,
        customer_name: saleRecord.customer_name,
        customer_phone: saleRecord.customer_phone,
        subtotal: saleRecord.subtotal,
        making_charges_total: saleRecord.making_charges_total,
        hallmarking_fee: saleRecord.hallmarking_fee,
        discount: saleRecord.discount,
        tax_amount: saleRecord.tax_amount,
        final_amount: saleRecord.final_amount,
        payment_method: saleRecord.payment_method,
        payment_reference: saleRecord.payment_reference,
        status: 'completed',
        created_at: saleRecord.created_at,
        created_by: saleRecord.created_by || 'staff'
      })
      .select()
      .single();

    if (!saleErr && insertedSale) {
      // Insert Line Items
      if (saleRecord.items && saleRecord.items.length > 0) {
        const lineItems = saleRecord.items.map(item => ({
          sale_id: insertedSale.id,
          item_id: item.item_id,
          name: item.name,
          category: item.category,
          metal_type: item.metal_type,
          purity: item.purity,
          weight: item.weight,
          making_charge: item.making_charge,
          quantity: item.quantity,
          price: item.price,
          huid: item.huid || null
        }));

        await supabase.from('pos_sale_items').insert(lineItems);

        // Update Inventory: mark sold items
        for (const item of saleRecord.items) {
          if (item.item_id) {
            await supabase
              .from('jewelry_items')
              .update({ in_stock: false, updated_at: new Date().toISOString() })
              .eq('id', item.item_id);
          }
        }
      }
    }
  } catch (dbErr) {
    console.warn('[RetailService] createPosSale DB notice (caching locally):', dbErr);
  }

  // 2. Always maintain local cache for resilient offline performance
  try {
    const rawSales = localStorage.getItem('rcb_pos_sales');
    const sales: PosSaleRecord[] = rawSales ? JSON.parse(rawSales) : [];
    sales.unshift(saleRecord);
    localStorage.setItem('rcb_pos_sales', JSON.stringify(sales));
  } catch {}

  // 3. Dispatch realtime event
  try {
    realtimeManager.dispatch('sales.invoice.created', saleRecord);
  } catch {}

  return saleRecord;
}

// ============================================================================
// SUPPLIERS SERVICE
// ============================================================================

export async function getSuppliers(): Promise<SupplierRecord[]> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('supplier_name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[RetailService] getSuppliers DB fallback:', err);
  }

  try {
    const raw = localStorage.getItem('rcb_suppliers');
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem('rcb_suppliers', JSON.stringify(DEFAULT_SUPPLIERS));
    return DEFAULT_SUPPLIERS;
  } catch {
    return DEFAULT_SUPPLIERS;
  }
}

export async function createSupplier(supplier: SupplierRecord): Promise<SupplierRecord> {
  try {
    await supabase.from('suppliers').insert(supplier);
  } catch (err) {
    console.warn('[RetailService] createSupplier DB notice:', err);
  }

  try {
    const suppliers = await getSuppliers();
    const updated = [supplier, ...suppliers.filter(s => s.id !== supplier.id)];
    localStorage.setItem('rcb_suppliers', JSON.stringify(updated));
  } catch {}

  return supplier;
}

export async function updateSupplier(id: string, updates: Partial<SupplierRecord>): Promise<void> {
  try {
    await supabase.from('suppliers').update(updates).eq('id', id);
  } catch (err) {
    console.warn('[RetailService] updateSupplier DB notice:', err);
  }

  try {
    const suppliers = await getSuppliers();
    const updated = suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    localStorage.setItem('rcb_suppliers', JSON.stringify(updated));
  } catch {}
}

// ============================================================================
// PURCHASES & PROCUREMENT SERVICE
// ============================================================================

export async function getPurchases(): Promise<PurchaseInwardRecord[]> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[RetailService] getPurchases DB fallback:', err);
  }

  try {
    const raw = localStorage.getItem('rcb_purchases');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getNextPurchaseOrderNumber(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('purchase_number')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = (!error && data && data.length > 0) ? data[0].purchase_number : undefined;
    return generatePurchaseOrderNumber(lastNumber);
  } catch {
    const raw = localStorage.getItem('rcb_purchases');
    if (raw) {
      const records: PurchaseInwardRecord[] = JSON.parse(raw);
      if (records.length > 0) {
        return generatePurchaseOrderNumber(records[0].purchase_number);
      }
    }
    return generatePurchaseOrderNumber();
  }
}

export async function createPurchase(purchase: PurchaseInwardRecord): Promise<PurchaseInwardRecord> {
  try {
    await supabase.from('purchases').insert(purchase);

    // Update supplier balance if partially paid or pending
    const unpaid = Math.max(0, purchase.total_amount - purchase.paid_amount);
    if (unpaid > 0) {
      const suppliers = await getSuppliers();
      const sup = suppliers.find(s => s.id === purchase.supplier_id);
      if (sup) {
        await updateSupplier(sup.id, {
          outstanding_balance: (sup.outstanding_balance || 0) + unpaid
        });
      }
    }
  } catch (err) {
    console.warn('[RetailService] createPurchase DB notice:', err);
  }

  try {
    const purchases = await getPurchases();
    const updated = [purchase, ...purchases.filter(p => p.id !== purchase.id)];
    localStorage.setItem('rcb_purchases', JSON.stringify(updated));
  } catch {}

  return purchase;
}

// ============================================================================
// CERTIFIED DIAMONDS REGISTER SERVICE
// ============================================================================

export async function getCertifiedDiamonds(): Promise<CertifiedDiamondRecord[]> {
  try {
    const { data, error } = await supabase
      .from('certified_diamonds')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[RetailService] getCertifiedDiamonds DB fallback:', err);
  }

  try {
    const raw = localStorage.getItem('rcb_certified_diamonds');
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem('rcb_certified_diamonds', JSON.stringify(DEFAULT_DIAMONDS));
    return DEFAULT_DIAMONDS;
  } catch {
    return DEFAULT_DIAMONDS;
  }
}

export async function createCertifiedDiamond(diamond: CertifiedDiamondRecord): Promise<CertifiedDiamondRecord> {
  try {
    await supabase.from('certified_diamonds').insert(diamond);
  } catch (err) {
    console.warn('[RetailService] createCertifiedDiamond DB notice:', err);
  }

  try {
    const diamonds = await getCertifiedDiamonds();
    const updated = [diamond, ...diamonds.filter(d => d.id !== diamond.id)];
    localStorage.setItem('rcb_certified_diamonds', JSON.stringify(updated));
  } catch {}

  return diamond;
}

// ============================================================================
// STORE PROFILE & SETTINGS SERVICE
// ============================================================================

export async function getStoreSettings(): Promise<StoreProfileConfig> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('settings_key', 'store_profile')
      .maybeSingle();

    if (!error && data?.value) {
      return { ...DEFAULT_STORE_CONFIG, ...data.value };
    }
  } catch (err) {
    console.warn('[RetailService] getStoreSettings DB fallback:', err);
  }

  try {
    const raw = localStorage.getItem('rcb_store_settings');
    if (raw) {
      return { ...DEFAULT_STORE_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}

  return DEFAULT_STORE_CONFIG;
}

export async function saveStoreSettings(config: StoreProfileConfig, updatedBy = 'admin'): Promise<void> {
  try {
    await supabase
      .from('store_settings')
      .upsert({
        id: 'primary',
        settings_key: 'store_profile',
        value: config,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      });
  } catch (err) {
    console.warn('[RetailService] saveStoreSettings DB notice:', err);
  }

  try {
    localStorage.setItem('rcb_store_settings', JSON.stringify(config));
  } catch {}
}

// ============================================================================
// AUDIT LOGS PERSISTENCE SERVICE
// ============================================================================

export async function getAuditLogsFromDb(): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[RetailService] getAuditLogs DB fallback:', err);
  }

  try {
    const raw = localStorage.getItem('rcb_audit_logs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function recordAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase.from('audit_logs').insert(entry);
  } catch (err) {
    console.warn('[RetailService] recordAuditLog DB notice:', err);
  }

  try {
    const raw = localStorage.getItem('rcb_audit_logs');
    const logs: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    logs.unshift(entry);
    if (logs.length > 200) logs.pop();
    localStorage.setItem('rcb_audit_logs', JSON.stringify(logs));
  } catch {}
}
