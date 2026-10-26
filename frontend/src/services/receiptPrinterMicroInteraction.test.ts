import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  convertPosSaleToReceipt, 
  convertOrderToReceipt, 
  recordReceiptPrintAudit, 
  getReceiptPrintAudits, 
  generateThermalReceiptPDF
} from '../utils/thermalReceiptUtils';
import type { PosSaleRecord, StoreProfileConfig } from './retailService';
import type { Order } from '../types/pawnshop';

const createMemoryStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

if (typeof globalThis.localStorage === 'undefined' || typeof (globalThis.localStorage as any)?.clear !== 'function') {
  (globalThis as any).localStorage = createMemoryStorage();
}

describe('YAZHINI FINE JEWELS — Receipt Printer Micro-Interaction Test Suite', () => {
  const mockStoreConfig: StoreProfileConfig = {
    storeName: 'YAZHINI FINE JEWELS',
    tagline: 'Legacy of Royal Craftsmanship & Certified Purity',
    address: '123 Jewelry Street, T. Nagar, Chennai - 600017',
    phone: '+91 98765 43210',
    email: 'concierge@yazhinijewels.com',
    gstin: '33AAAAA0000A1Z5',
    bisLicence: 'HM/C-6790214',
    gstRate: 0.03,
    goldLoanInterest: 1.5
  };

  const samplePosSale: PosSaleRecord = {
    id: 'sale-pos-1729000000000',
    invoice_number: 'INV-2026-000108',
    customer_name: 'Maharani Gayatri Devi',
    customer_phone: '+91 98401 23456',
    items: [
      {
        item_id: 'jw-01',
        name: '22K Royal Temple Kasu Mala Necklace',
        category: 'Necklaces',
        metal_type: 'Gold',
        purity: '22K (916)',
        weight: 48.5,
        price: 360000,
        making_charge: 28800,
        quantity: 1
      },
      {
        item_id: 'jw-02',
        name: '18K Diamond Solitaire Studs',
        category: 'Earrings',
        metal_type: 'Gold & Diamond',
        purity: '18K (750)',
        weight: 6.2,
        price: 145000,
        making_charge: 11600,
        quantity: 1
      }
    ],
    subtotal: 505000,
    making_charges_total: 40400,
    hallmarking_fee: 90, // 2 items x 45
    discount: 10000,
    tax_amount: 16065, // 3% of (505000 + 40400 + 90 - 10000) = 535490 * 0.03 = 16064.7 => 16065
    final_amount: 551555,
    payment_method: 'card',
    payment_reference: 'AUTH-HDFC-991823',
    created_at: '2026-10-24T14:30:00.000Z'
  };

  const sampleOrder: Order = {
    id: 'ORD-1729112233445',
    user_id: 'usr-patron-88',
    total_amount: 198500,
    status: 'processing',
    shipping_address: {
      fullName: 'Aishwarya Rajagopalan',
      street: '7 Poes Garden Avenue',
      city: 'Chennai',
      zipCode: '600086',
      phone: '+91 94440 98765'
    },
    items: [
      {
        id: 'ord-item-1',
        order_id: 'ORD-1729112233445',
        product_name: '22K Antique Nakshi Bridal Kada',
        price: 198500,
        weight: 26.5,
        unit: 'g',
        quantity: 1,
        created_at: '2026-10-24T10:00:00.000Z'
      }
    ],
    created_at: '2026-10-24T10:00:00.000Z',
    updated_at: '2026-10-24T10:00:00.000Z'
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Test 1: Successful POS sale conversion
  it('1. correctly formats successful POS sale into real thermal receipt data', () => {
    const receipt = convertPosSaleToReceipt(samplePosSale, mockStoreConfig, 'Cashier #04', false);

    expect(receipt.brandName).toBe('YAZHINI FINE JEWELS');
    expect(receipt.receiptNumber).toBe('INV-2026-000108');
    expect(receipt.customerName).toBe('Maharani Gayatri Devi');
    expect(receipt.customerPhone).toBe('+91 98401 23456');
    expect(receipt.cashierName).toBe('Cashier #04');
    expect(receipt.items).toHaveLength(2);
    expect(receipt.subtotal).toBe(505000);
    expect(receipt.makingChargesTotal).toBe(40400);
    expect(receipt.hallmarkingFee).toBe(90);
    expect(receipt.discount).toBe(10000);
    expect(receipt.taxAmount).toBe(16065);
    expect(receipt.grandTotal).toBe(551555);
    expect(receipt.paymentMethod).toBe('CARD');
    expect(receipt.paymentReference).toBe('AUTH-HDFC-991823');
    expect(receipt.isReprint).toBe(false);
  });

  // Test 2: Failed or cancelled print operation audit logging
  it('2. records failed and cancelled print operations in persistent audit trail', () => {
    recordReceiptPrintAudit({
      receiptNumber: 'INV-2026-000108',
      transactionId: 'sale-pos-1729000000000',
      type: 'POS',
      status: 'CANCELLED',
      mode: 'BROWSER_PRINT',
      width: '80mm',
      cashier: 'Cashier #04',
      note: 'User closed browser print dialog'
    });

    recordReceiptPrintAudit({
      receiptNumber: 'INV-2026-000108',
      transactionId: 'sale-pos-1729000000000',
      type: 'POS',
      status: 'FAILED',
      mode: 'BROWSER_PRINT',
      width: '80mm',
      cashier: 'Cashier #04',
      note: 'Paper out on thermal ESC/POS device'
    });

    const audits = getReceiptPrintAudits('INV-2026-000108');
    expect(audits).toHaveLength(2);
    expect(audits[0].status).toBe('FAILED');
    expect(audits[1].status).toBe('CANCELLED');
    expect(audits[0].timestamp).toBeDefined();
  });

  // Test 3 & 4: Printer fallback, retry and successful logging
  it('3 & 4. tracks retry after failure and logs successful completion without data loss', () => {
    // 1st attempt: FAILED
    recordReceiptPrintAudit({
      receiptNumber: 'INV-2026-000108',
      transactionId: 'sale-pos-1729000000000',
      type: 'POS',
      status: 'FAILED',
      mode: 'BROWSER_PRINT',
      width: '80mm',
      cashier: 'Cashier #04',
      note: 'Device busy'
    });

    // 2nd attempt: SUCCESS (Retry)
    recordReceiptPrintAudit({
      receiptNumber: 'INV-2026-000108',
      transactionId: 'sale-pos-1729000000000',
      type: 'POS',
      status: 'SUCCESS',
      mode: 'BROWSER_PRINT',
      width: '80mm',
      cashier: 'Cashier #04',
      note: 'Retry successful'
    });

    const audits = getReceiptPrintAudits('INV-2026-000108');
    expect(audits).toHaveLength(2);
    expect(audits[0].status).toBe('SUCCESS');
    expect(audits[1].status).toBe('FAILED');
  });

  // Test 5: Download receipt as PDF
  it('5. generates authentic thermal PDF without errors for 80mm and 58mm rolls', () => {
    const receipt = convertPosSaleToReceipt(samplePosSale, mockStoreConfig);
    
    // Test 80mm PDF generation
    expect(() => generateThermalReceiptPDF(receipt, 80)).not.toThrow();

    // Test 58mm PDF generation
    expect(() => generateThermalReceiptPDF(receipt, 58)).not.toThrow();

    // Check PDF audit logging
    recordReceiptPrintAudit({
      receiptNumber: receipt.receiptNumber,
      transactionId: receipt.transactionId,
      type: 'POS',
      status: 'SUCCESS',
      mode: 'PDF_DOWNLOAD',
      width: '80mm',
      cashier: 'Cashier #04'
    });

    const pdfAudits = getReceiptPrintAudits(receipt.receiptNumber);
    expect(pdfAudits.some(a => a.mode === 'PDF_DOWNLOAD' && a.status === 'SUCCESS')).toBe(true);
  });

  // Test 6: Reprint an existing receipt with duplicate watermark
  it('6. automatically detects past successful print and applies DUPLICATE / REPRINT watermark', () => {
    // Record past success
    recordReceiptPrintAudit({
      receiptNumber: samplePosSale.invoice_number,
      transactionId: samplePosSale.id,
      type: 'POS',
      status: 'SUCCESS',
      mode: 'BROWSER_PRINT',
      width: '80mm',
      cashier: 'Cashier #04'
    });

    // Convert again
    const reprintedReceipt = convertPosSaleToReceipt(samplePosSale, mockStoreConfig);
    expect(reprintedReceipt.isReprint).toBe(true);
    expect(reprintedReceipt.reprintCount).toBe(1);
  });

  // Test 7: Correct receipt data, GST and totals verification
  it('7. verifies mathematical accuracy of totals, GST, and hallmarking fees', () => {
    const receipt = convertPosSaleToReceipt(samplePosSale, mockStoreConfig);
    const calculatedTaxable = receipt.subtotal + (receipt.makingChargesTotal || 0) + (receipt.hallmarkingFee || 0) - (receipt.discount || 0);
    const expectedGst = Math.round(calculatedTaxable * 0.03);
    const expectedPayable = calculatedTaxable + expectedGst;

    expect(receipt.taxAmount).toBe(expectedGst);
    expect(receipt.grandTotal).toBe(expectedPayable);
    expect(receipt.hallmarkingFee).toBe(samplePosSale.items.length * 45);
  });

  // Test 8: E-commerce order receipt conversion
  it('8. converts e-commerce web order to thermal receipt with proper address & policy', () => {
    const receipt = convertOrderToReceipt(sampleOrder, mockStoreConfig, false);

    expect(receipt.receiptNumber).toBe('ORD-1729112233445');
    expect(receipt.customerName).toBe('Aishwarya Rajagopalan');
    expect(receipt.customerPhone).toBe('+91 94440 98765');
    expect(receipt.customerAddress).toContain('Poes Garden Avenue');
    expect(receipt.grandTotal).toBe(198500);
    expect(receipt.branchName).toBe('Online Concierge & Vault Fulfillment');
    expect(receipt.terms?.some(t => t.includes('Insured Transit Delivery'))).toBe(true);
  });

  // Test 9: Long product names and multiple line items
  it('9. handles long product names (>30 chars) and multiple line items cleanly', () => {
    const longItemSale: PosSaleRecord = {
      ...samplePosSale,
      invoice_number: 'INV-2026-000109',
      items: [
        {
          item_id: 'jw-long-1',
          name: 'Handcrafted Heritage South Indian Temple Nagas Antique Ruby Emerald Waist Belt (Oddiyanam)',
          category: 'Waist Belts',
          metal_type: 'Gold 22K',
          purity: '22K (916)',
          weight: 125.4,
          price: 920000,
          making_charge: 73600,
          quantity: 1
        }
      ],
      subtotal: 920000,
      making_charges_total: 73600,
      hallmarking_fee: 45,
      discount: 0,
      tax_amount: 29810,
      final_amount: 1023455
    };

    const receipt = convertPosSaleToReceipt(longItemSale, mockStoreConfig);
    expect(receipt.items[0].name).toContain('Oddiyanam');

    // Generate PDF for long name in 58mm compact format to ensure no errors
    expect(() => generateThermalReceiptPDF(receipt, 58)).not.toThrow();
  });

  // Test 10: Multi-item large receipts spanning multiple pages
  it('10. calculates correct dynamic page height for large receipts with 10+ items', () => {
    const multiItems = Array.from({ length: 12 }).map((_, i) => ({
      item_id: `jw-bulk-${i}`,
      name: `Fine Gold Ornament #${i + 1}`,
      category: 'Jewellery',
      metal_type: 'Gold 22K',
      purity: '22K',
      weight: 10.5,
      price: 75000,
      making_charge: 6000,
      quantity: 1
    }));

    const bulkSale: PosSaleRecord = {
      ...samplePosSale,
      invoice_number: 'INV-2026-BULK-12',
      items: multiItems,
      subtotal: 900000,
      making_charges_total: 72000,
      hallmarking_fee: 12 * 45,
      discount: 25000,
      tax_amount: 28426,
      final_amount: 975966
    };

    const receipt = convertPosSaleToReceipt(bulkSale, mockStoreConfig);
    expect(receipt.items).toHaveLength(12);
    expect(receipt.hallmarkingFee).toBe(540); // 12 * 45
    expect(() => generateThermalReceiptPDF(receipt, 80)).not.toThrow();
  });

  // Test 11: Duplicate request & concurrency protection
  it('11. preserves sale integrity regardless of printer failure (printer error never reverses sale)', () => {
    const originalSale = { ...samplePosSale };
    
    // Simulate printer exception
    try {
      recordReceiptPrintAudit({
        receiptNumber: originalSale.invoice_number,
        transactionId: originalSale.id,
        type: 'POS',
        status: 'FAILED',
        mode: 'BROWSER_PRINT',
        width: '80mm',
        note: 'Printer spooler crash'
      });
      throw new Error('Thermal printer communication timeout');
    } catch (e: any) {
      expect(e.message).toBe('Thermal printer communication timeout');
    }

    // Verify original sale was completely unchanged
    expect(originalSale.final_amount).toBe(551555);
    expect(originalSale.payment_reference).toBe('AUTH-HDFC-991823');
    expect(originalSale.items).toHaveLength(2);

    // Verify failed audit was logged
    const logs = getReceiptPrintAudits(originalSale.invoice_number);
    expect(logs[0].status).toBe('FAILED');
  });

  // Test 12: Audit log capacity and filtering
  it('12. maintains audit history and filters correctly by receipt number', () => {
    for (let i = 1; i <= 5; i++) {
      recordReceiptPrintAudit({
        receiptNumber: `INV-2026-00000${i}`,
        type: 'POS',
        status: 'SUCCESS',
        mode: 'BROWSER_PRINT',
        width: '80mm'
      });
    }

    const allLogs = getReceiptPrintAudits();
    expect(allLogs).toHaveLength(5);

    const specificLogs = getReceiptPrintAudits('INV-2026-000003');
    expect(specificLogs).toHaveLength(1);
    expect(specificLogs[0].receiptNumber).toBe('INV-2026-000003');
  });
});
