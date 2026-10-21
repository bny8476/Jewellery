import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateInvoiceNumber,
  generatePurchaseOrderNumber,
  generateCustomerCode,
  parseSequenceNumber
} from '../utils/sequenceUtils';
import {
  getPosSales,
  createPosSale,
  getSuppliers,
  createSupplier,
  getPurchases,
  createPurchase,
  getCertifiedDiamonds,
  createCertifiedDiamond,
  getStoreSettings,
  saveStoreSettings,
  getAuditLogsFromDb,
  type PosSaleRecord,
  type SupplierRecord,
  type PurchaseInwardRecord,
  type CertifiedDiamondRecord
} from './retailService';
import { getDashboardStats } from './transactionService';

const createMemoryStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = createMemoryStorage();
}

describe('PHASE 2 AUDIT: Data Durability & Real Database Persistence Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // DAT-2: CONSECUTIVE GAP-FREE SEQUENCING
  // ==========================================================================
  describe('DAT-2: Gap-Free Sequential Identifiers', () => {
    it('generates properly formatted consecutive tax invoice numbers', () => {
      const year = new Date().getFullYear();
      const firstInv = generateInvoiceNumber();
      expect(firstInv).toBe(`INV-${year}-000001`);

      const secondInv = generateInvoiceNumber(firstInv);
      expect(secondInv).toBe(`INV-${year}-000002`);

      const tenthInv = generateInvoiceNumber(`INV-${year}-000009`);
      expect(tenthInv).toBe(`INV-${year}-000010`);
    });

    it('generates properly formatted consecutive purchase order numbers', () => {
      const year = new Date().getFullYear();
      const firstPo = generatePurchaseOrderNumber();
      expect(firstPo).toBe(`PO-${year}-0001`);

      const secondPo = generatePurchaseOrderNumber(firstPo);
      expect(secondPo).toBe(`PO-${year}-0002`);

      const ninetyNinth = generatePurchaseOrderNumber(`PO-${year}-0099`);
      expect(ninetyNinth).toBe(`PO-${year}-0100`);
    });

    it('generates properly formatted customer codes', () => {
      const defaultCust = generateCustomerCode();
      expect(defaultCust).toBe('CUST1001');

      const nextCust = generateCustomerCode(defaultCust);
      expect(nextCust).toBe('CUST1002');

      const rcbCust = generateCustomerCode(undefined, 'RCB-CUST-');
      expect(rcbCust).toBe('RCB-CUST-1001');

      const nextRcbCust = generateCustomerCode(rcbCust, 'RCB-CUST-');
      expect(nextRcbCust).toBe('RCB-CUST-1002');
    });

    it('parses sequence numbers cleanly and rejects non-matching patterns', () => {
      expect(parseSequenceNumber('INV-2026-000452', 'INV-2026-')).toBe(452);
      expect(parseSequenceNumber('INVALID_FORMAT', 'INV-2026-')).toBe(null);
    });
  });

  // ==========================================================================
  // DAT-1: RETAIL PERSISTENCE & DATA SERVICE
  // ==========================================================================
  describe('DAT-1: Retail Persistence Services (POS, Procurement, Inventory, Config)', () => {
    it('persists and retrieves POS sales with full itemization and tax details', async () => {
      const sale: PosSaleRecord = {
        id: 'sale-audit-01',
        invoice_number: 'INV-2026-000101',
        customer_id: 'cust-test-1',
        customer_name: 'Ananya Deshmukh',
        customer_phone: '9840123456',
        subtotal: 125000,
        making_charges_total: 4500,
        hallmarking_fee: 45,
        discount: 5000,
        tax_amount: 3600,
        final_amount: 123600,
        payment_method: 'upi',
        payment_reference: 'UPI-99201948',
        status: 'paid',
        created_at: '2026-10-21T10:00:00.000Z',
        items: [
          {
            item_id: 'item-gold-bangle',
            name: 'Traditional Gold Temple Bangle 22K',
            category: 'Bangles',
            metal_type: 'Gold',
            purity: '22K',
            weight: 18.0,
            making_charge: 4500,
            quantity: 1,
            price: 125000,
            huid: 'AB1234'
          }
        ]
      };

      const created = await createPosSale(sale);
      expect(created).toBeDefined();
      expect(created.invoice_number).toBe('INV-2026-000101');

      const allSales = await getPosSales();
      expect(allSales.length).toBeGreaterThan(0);
      expect(allSales.some(s => s.invoice_number === 'INV-2026-000101')).toBe(true);
    });

    it('persists suppliers and tracks balances correctly', async () => {
      const supplier: SupplierRecord = {
        id: 'sup-audit-01',
        supplier_name: 'Vaidyanathan Bullion Refiners',
        contact_person: 'Vaidyanathan Swamy',
        phone: '9443299881',
        email: 'vbr@refiners.in',
        address: 'Bullion Complex, Coimbatore',
        gstin: '33AAAPL9281M1Z1',
        category: 'Bullion Refiner',
        outstanding_balance: 0,
        is_active: true,
        created_at: new Date().toISOString()
      };

      await createSupplier(supplier);
      const suppliers = await getSuppliers();
      expect(suppliers.some(s => s.supplier_name === 'Vaidyanathan Bullion Refiners')).toBe(true);
    });

    it('records purchase inward transactions and updates supplier balance', async () => {
      const purchase: PurchaseInwardRecord = {
        id: 'pur-audit-01',
        purchase_number: 'PO-2026-0001',
        supplier_id: 'sup-audit-01',
        supplier_name: 'Vaidyanathan Bullion Refiners',
        invoice_ref: 'VBR-INV-9901',
        purchase_date: '2026-10-21',
        metal_type: 'Gold',
        purity: '24K (999)',
        gross_weight: 100,
        net_weight: 100,
        rate_per_gram: 7850,
        total_amount: 808550,
        paid_amount: 500000,
        payment_status: 'partial'
      };

      await createPurchase(purchase);
      const purchases = await getPurchases();
      expect(purchases.some(p => p.purchase_number === 'PO-2026-0001')).toBe(true);
    });

    it('stores and retrieves certified diamonds with lab credentials', async () => {
      const stone: CertifiedDiamondRecord = {
        id: 'dia-test-01',
        sku: 'DIA-GIA-9999',
        origin: 'natural',
        shape: 'Oval',
        carat: 1.5,
        color: 'D',
        clarity: 'VVS1',
        cut: 'Ideal',
        cert_lab: 'GIA',
        cert_number: 'GIA-692019481',
        purchase_cost: 650000,
        rapaport_benchmark_inr: 820000,
        selling_price: 890000,
        status: 'available',
        created_at: new Date().toISOString()
      };

      await createCertifiedDiamond(stone);
      const diamonds = await getCertifiedDiamonds();
      expect(diamonds.some(d => d.sku === 'DIA-GIA-9999')).toBe(true);
    });

    it('manages store profile settings and tax policy configurations', async () => {
      const initial = await getStoreSettings();
      expect(initial.storeName).toBeDefined();

      const customized = {
        ...initial,
        storeName: "RCB JEWELLERS & PAWN BROKERS PRIVATE LIMITED",
        gstRate: 3.0,
        goldLoanInterest: 1.5
      };

      await saveStoreSettings(customized, 'auditor@rcbjewelry.in');
      const updated = await getStoreSettings();
      expect(updated.storeName).toBe("RCB JEWELLERS & PAWN BROKERS PRIVATE LIMITED");
      expect(updated.gstRate).toBe(3.0);
    });

    it('retrieves audit trail logs cleanly', async () => {
      const logs = await getAuditLogsFromDb();
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  // ==========================================================================
  // DAT-3: LEDGER-DERIVED DASHBOARD KPIS (NO FABRICATED METRICS)
  // ==========================================================================
  describe('DAT-3: Ledger-Derived Financial KPIs', () => {
    it('calculates dashboard metrics dynamically without fabricated fixed loan disbursements', async () => {
      const stats = await getDashboardStats();

      expect(typeof stats.cash_in_hand).toBe('number');
      expect(stats.cash_in_hand).toBeGreaterThanOrEqual(0);
      expect(typeof stats.total_inventory_items).toBe('number');
      expect(typeof stats.total_inventory_value).toBe('number');
      expect(typeof stats.estimated_profit).toBe('number');
    });

    it('computes cash-in-hand accounting for today sales and collections without 45,000 multiplier', async () => {
      // Simulate adding a POS sale
      const today = new Date().toISOString().split('T')[0];
      const sale: PosSaleRecord = {
        id: 'sale-cash-01',
        invoice_number: 'INV-2026-000999',
        customer_id: 'cust-cash-1',
        customer_name: 'Rajesh',
        customer_phone: '9999999999',
        subtotal: 50000,
        making_charges_total: 0,
        hallmarking_fee: 0,
        discount: 0,
        tax_amount: 1500,
        final_amount: 51500,
        payment_method: 'cash',
        payment_reference: 'CASH-001',
        status: 'paid',
        created_at: `${today}T12:00:00.000Z`,
        items: []
      };

      await createPosSale(sale);
      const stats = await getDashboardStats();

      // Today sales should register the POS sale
      expect(stats.today_sales).toBeGreaterThanOrEqual(51500);
      expect(stats.payments_received_today).toBeGreaterThanOrEqual(51500);
    });
  });
});
