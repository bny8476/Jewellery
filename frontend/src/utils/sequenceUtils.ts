/**
 * Sequence & Consecutive Numbering Utility
 * YAZHINI FINE JEWELS & PAWN SHOP
 * 
 * Provides consecutive, gap-free sequence numbers compliant with CGST Rule 46
 * for Invoices, Purchase Orders, and Pawn Loan Tickets.
 */

export const generatePledgeNumber = (lastPledgeNumber?: string, prefix: string = 'PL'): string => {
  const currentYear = new Date().getFullYear();

  if (!lastPledgeNumber) {
    return `${prefix}-${currentYear}-0001`;
  }

  const parts = lastPledgeNumber.split('-');
  if (parts.length === 3) {
    const lastYear = parseInt(parts[1], 10);
    const lastSeq = parseInt(parts[2], 10);

    if (lastYear === currentYear && !isNaN(lastSeq)) {
      const nextSeq = lastSeq + 1;
      return `${prefix}-${currentYear}-${nextSeq.toString().padStart(4, '0')}`;
    }
  }

  return `${prefix}-${currentYear}-0001`;
};

/**
 * Generates sequential POS Tax Invoice numbers
 * Format: INV-YYYY-XXXXXX (e.g. INV-2026-000001)
 */
export const generateInvoiceNumber = (lastInvoiceNumber?: string, prefix: string = 'INV'): string => {
  const currentYear = new Date().getFullYear();

  if (!lastInvoiceNumber) {
    return `${prefix}-${currentYear}-000001`;
  }

  const parts = lastInvoiceNumber.split('-');
  if (parts.length === 3) {
    const lastYear = parseInt(parts[1], 10);
    const lastSeq = parseInt(parts[2], 10);

    if (lastYear === currentYear && !isNaN(lastSeq)) {
      const nextSeq = lastSeq + 1;
      return `${prefix}-${currentYear}-${nextSeq.toString().padStart(6, '0')}`;
    }
  }

  return `${prefix}-${currentYear}-000001`;
};

/**
 * Generates sequential Purchase Order / Inward voucher numbers
 * Format: PO-YYYY-XXXX (e.g. PO-2026-0001)
 */
export const generatePurchaseOrderNumber = (lastPurchaseNumber?: string, prefix: string = 'PO'): string => {
  const currentYear = new Date().getFullYear();

  if (!lastPurchaseNumber) {
    return `${prefix}-${currentYear}-0001`;
  }

  const parts = lastPurchaseNumber.split('-');
  if (parts.length === 3) {
    const lastYear = parseInt(parts[1], 10);
    const lastSeq = parseInt(parts[2], 10);

    if (lastYear === currentYear && !isNaN(lastSeq)) {
      const nextSeq = lastSeq + 1;
      return `${prefix}-${currentYear}-${nextSeq.toString().padStart(4, '0')}`;
    }
  }

  return `${prefix}-${currentYear}-0001`;
};

/**
 * Generates consecutive customer identification codes
 * Format: CUSTXXXX (e.g. CUST1001, CUST1002)
 */
export const generateCustomerCode = (lastCustomerCode?: string, prefix: string = 'CUST'): string => {
  if (!lastCustomerCode) {
    return `${prefix}1001`;
  }

  const numericPart = parseInt(lastCustomerCode.replace(new RegExp(`^${prefix}`, 'i'), ''), 10);
  if (!isNaN(numericPart)) {
    return `${prefix}${numericPart + 1}`;
  }

  return `${prefix}1001`;
};

/**
 * Parses numeric sequence value from formatted code given its prefix
 */
export const parseSequenceNumber = (code: string, prefix: string): number | null => {
  if (!code || !code.startsWith(prefix)) return null;
  const numStr = code.slice(prefix.length);
  const num = parseInt(numStr, 10);
  return isNaN(num) ? null : num;
};
