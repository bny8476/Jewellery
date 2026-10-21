import { describe, it, expect } from 'vitest';
import { 
  generatePledgeNumber, 
  generateInvoiceNumber, 
  generatePurchaseOrderNumber, 
  generateCustomerCode 
} from './sequenceUtils';

describe('Sequence Number Utilities', () => {
  const currentYear = new Date().getFullYear();

  describe('generatePledgeNumber', () => {
    it('generates initial pledge number when lastPledgeNumber is not provided', () => {
      expect(generatePledgeNumber()).toBe(`PL-${currentYear}-0001`);
    });

    it('generates initial pledge number with custom prefix', () => {
      expect(generatePledgeNumber(undefined, 'PJ')).toBe(`PJ-${currentYear}-0001`);
    });

    it('increments sequence number when in the same year', () => {
      const lastPledge = `PL-${currentYear}-0005`;
      expect(generatePledgeNumber(lastPledge)).toBe(`PL-${currentYear}-0006`);
    });

    it('pads sequence number to 4 digits', () => {
      const lastPledge = `PL-${currentYear}-0099`;
      expect(generatePledgeNumber(lastPledge)).toBe(`PL-${currentYear}-0100`);
    });

    it('resets sequence to 0001 if the last pledge was from a previous year', () => {
      const lastPledge = `PL-2020-0500`;
      expect(generatePledgeNumber(lastPledge)).toBe(`PL-${currentYear}-0001`);
    });

    it('falls back to default initial number when format is invalid', () => {
      expect(generatePledgeNumber('INVALID-FORMAT')).toBe(`PL-${currentYear}-0001`);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('generates initial invoice number when lastInvoiceNumber is not provided', () => {
      expect(generateInvoiceNumber()).toBe(`INV-${currentYear}-000001`);
    });

    it('increments consecutive invoice sequence cleanly', () => {
      const lastInvoice = `INV-${currentYear}-000042`;
      expect(generateInvoiceNumber(lastInvoice)).toBe(`INV-${currentYear}-000043`);
    });

    it('pads invoice sequence number to 6 digits', () => {
      const lastInvoice = `INV-${currentYear}-000999`;
      expect(generateInvoiceNumber(lastInvoice)).toBe(`INV-${currentYear}-001000`);
    });

    it('resets sequence to 000001 if last invoice was from previous financial year', () => {
      const oldInvoice = `INV-2023-000850`;
      expect(generateInvoiceNumber(oldInvoice)).toBe(`INV-${currentYear}-000001`);
    });
  });

  describe('generatePurchaseOrderNumber', () => {
    it('generates initial purchase order number when not provided', () => {
      expect(generatePurchaseOrderNumber()).toBe(`PO-${currentYear}-0001`);
    });

    it('increments purchase sequence number consecutively', () => {
      const lastPO = `PO-${currentYear}-0015`;
      expect(generatePurchaseOrderNumber(lastPO)).toBe(`PO-${currentYear}-0016`);
    });
  });

  describe('generateCustomerCode', () => {
    it('generates initial customer code when not provided', () => {
      expect(generateCustomerCode()).toBe('CUST1001');
    });

    it('increments customer code consecutively', () => {
      expect(generateCustomerCode('CUST1042')).toBe('CUST1043');
      expect(generateCustomerCode('CUST1999')).toBe('CUST2000');
    });
  });
});
