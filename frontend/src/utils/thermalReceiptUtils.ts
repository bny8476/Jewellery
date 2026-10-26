import { jsPDF } from 'jspdf';
import type { PosSaleRecord, StoreProfileConfig } from '../services/retailService';
import type { Order } from '../types/pawnshop';

export interface ThermalReceiptItem {
  name: string;
  sku?: string;
  huid?: string;
  purity?: string;
  grossWeight?: number | string;
  netWeight?: number | string;
  unit?: string;
  qty: number;
  rate?: number;
  makingCharge?: number;
  total: number;
}

export interface ThermalReceiptData {
  brandName: string;
  tagline?: string;
  branchName?: string;
  address?: string;
  phone?: string;
  gstin?: string;
  bisLicence?: string;
  receiptNumber: string;
  invoiceNumber?: string;
  transactionId?: string;
  dateTime: string | Date;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: ThermalReceiptItem[];
  subtotal: number;
  makingChargesTotal?: number;
  hallmarkingFee?: number;
  discount?: number;
  taxAmount: number;
  taxRatePercent?: number; // e.g. 3% GST
  grandTotal: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'GIFT_CARD' | 'BANK_TRANSFER' | string;
  paymentStatus: 'PAID' | 'COMPLETED' | 'SETTLED' | string;
  paymentReference?: string;
  amountPaid?: number;
  changeDue?: number;
  balanceDue?: number;
  isReprint?: boolean;
  reprintCount?: number;
  originalPrintTime?: string;
  terms?: string[];
  barcodeValue?: string;
  qrPayload?: string;
}

export interface ReceiptPrintAuditLog {
  id: string;
  receiptNumber: string;
  transactionId?: string;
  type: 'POS' | 'ORDER' | 'PLEDGE' | 'MANUAL';
  status: 'SUCCESS' | 'CANCELLED' | 'FAILED' | 'RETRY';
  mode: 'BROWSER_PRINT' | 'PDF_DOWNLOAD';
  width: '80mm' | '58mm';
  cashier?: string;
  timestamp: string;
  note?: string;
}

const DEFAULT_TERMS = [
  '• Certified 100% BIS Hallmarked (HUID) 22K/18K Fine Jewellery.',
  '• 7-day exchange against authentic tax invoice as per YAZHINI Gold Buyback & Exchange policy.',
  '• No exchange without original tax receipt.'
];

/**
 * Record a print attempt into persistent localStorage audit trail.
 */
export const recordReceiptPrintAudit = (audit: Omit<ReceiptPrintAuditLog, 'id' | 'timestamp'>): ReceiptPrintAuditLog => {
  const newLog: ReceiptPrintAuditLog = {
    ...audit,
    id: `prt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  try {
    const raw = localStorage.getItem('rcb_receipt_print_audits');
    const logs: ReceiptPrintAuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(newLog);
    // Keep last 200 logs
    localStorage.setItem('rcb_receipt_print_audits', JSON.stringify(logs.slice(0, 200)));
  } catch (e) {
    console.warn('Could not record receipt print audit:', e);
  }

  return newLog;
};

/**
 * Get all print audit logs from localStorage.
 */
export const getReceiptPrintAudits = (receiptNumber?: string): ReceiptPrintAuditLog[] => {
  try {
    const raw = localStorage.getItem('rcb_receipt_print_audits');
    const logs: ReceiptPrintAuditLog[] = raw ? JSON.parse(raw) : [];
    if (receiptNumber) {
      return logs.filter(l => l.receiptNumber === receiptNumber);
    }
    return logs;
  } catch {
    return [];
  }
};

/**
 * Convert POS Sale Record to standardized Thermal Receipt structure
 */
export const convertPosSaleToReceipt = (
  sale: PosSaleRecord,
  storeConfig?: StoreProfileConfig,
  cashierName: string = 'Staff / Cashier #01',
  isReprint: boolean = false
): ThermalReceiptData => {
  const store = storeConfig || {
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

  const audits = getReceiptPrintAudits(sale.invoice_number);
  const successfulPrints = audits.filter(a => a.status === 'SUCCESS').length;

  const items: ThermalReceiptItem[] = sale.items.map(it => ({
    name: it.name,
    purity: it.purity || it.metal_type,
    grossWeight: it.weight,
    netWeight: it.weight,
    unit: 'g',
    qty: it.quantity,
    rate: Math.round(it.price / (it.quantity || 1)),
    makingCharge: it.making_charge,
    total: it.price + (it.making_charge || 0)
  }));

  return {
    brandName: store.storeName,
    tagline: store.tagline,
    branchName: 'T. Nagar Flagship Heritage Salon',
    address: store.address,
    phone: store.phone,
    gstin: store.gstin,
    bisLicence: store.bisLicence,
    receiptNumber: sale.invoice_number,
    invoiceNumber: sale.invoice_number,
    transactionId: sale.id,
    dateTime: sale.created_at,
    cashierName,
    customerName: sale.customer_name,
    customerPhone: sale.customer_phone,
    items,
    subtotal: sale.subtotal,
    makingChargesTotal: sale.making_charges_total,
    hallmarkingFee: sale.hallmarking_fee,
    discount: sale.discount,
    taxAmount: sale.tax_amount,
    taxRatePercent: 3,
    grandTotal: sale.final_amount,
    paymentMethod: sale.payment_method.toUpperCase(),
    paymentStatus: 'PAID',
    paymentReference: sale.payment_reference,
    amountPaid: sale.final_amount,
    changeDue: 0,
    balanceDue: 0,
    isReprint: isReprint || successfulPrints > 0,
    reprintCount: successfulPrints,
    terms: DEFAULT_TERMS,
    barcodeValue: sale.invoice_number,
    qrPayload: `YAZHINI|INV:${sale.invoice_number}|AMT:${sale.final_amount}|GST:${store.gstin}`
  };
};

/**
 * Convert E-Commerce Order to standardized Thermal Receipt structure
 */
export const convertOrderToReceipt = (
  order: Order,
  storeConfig?: StoreProfileConfig,
  isReprint: boolean = false
): ThermalReceiptData => {
  const store = storeConfig || {
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

  const rawItems = order.items && order.items.length > 0 ? order.items : [];
  const items: ThermalReceiptItem[] = rawItems.map(it => {
    const qty = it.quantity || 1;
    const price = Number(it.price || (it as any).total_price || 0);
    return {
      name: it.product_name || 'Fine Jewellery Creation',
      grossWeight: it.weight || 8.5,
      netWeight: it.weight || 8.5,
      unit: it.unit || 'g',
      qty,
      rate: price,
      makingCharge: 0,
      total: price * qty
    };
  });

  if (items.length === 0) {
    items.push({
      name: 'Fine Jewellery Creation',
      grossWeight: 10,
      netWeight: 10,
      unit: 'g',
      qty: 1,
      rate: Number(order.total_amount),
      total: Number(order.total_amount)
    });
  }

  const grandTotal = Number(order.total_amount);
  const taxableAmount = Math.round(grandTotal / 1.03);
  const taxAmount = grandTotal - taxableAmount;

  const addr = order.shipping_address;
  const customerName = addr?.fullName || order.customer_name || 'Valued Patron';
  const customerPhone = addr?.phone || '+91 Direct Order';
  const customerAddress = addr ? `${addr.street}, ${addr.city} - ${addr.zipCode}` : undefined;

  const audits = getReceiptPrintAudits(order.id);
  const successfulPrints = audits.filter(a => a.status === 'SUCCESS').length;

  return {
    brandName: store.storeName,
    tagline: store.tagline,
    branchName: 'Online Concierge & Vault Fulfillment',
    address: store.address,
    phone: store.phone,
    gstin: store.gstin,
    bisLicence: store.bisLicence,
    receiptNumber: order.id,
    invoiceNumber: order.id,
    transactionId: order.id,
    dateTime: order.created_at || new Date().toISOString(),
    cashierName: 'E-Commerce Dispatch Vault',
    customerName,
    customerPhone,
    customerAddress,
    items,
    subtotal: taxableAmount,
    makingChargesTotal: 0,
    hallmarkingFee: items.length * 45,
    discount: 0,
    taxAmount,
    taxRatePercent: 3,
    grandTotal,
    paymentMethod: 'ONLINE_PREPAID',
    paymentStatus: order.status === 'delivered' ? 'DELIVERED' : 'PAID',
    paymentReference: order.id,
    amountPaid: grandTotal,
    changeDue: 0,
    balanceDue: 0,
    isReprint: isReprint || successfulPrints > 0,
    reprintCount: successfulPrints,
    terms: [
      '• 100% Insured Transit Delivery with Tamper-Evident Security Seal.',
      '• Certified BIS 916 / 750 laser hallmarked with individual certificate card.',
      '• Lifetime buyback & exchange guarantee at any YAZHINI boutique.'
    ],
    barcodeValue: order.id,
    qrPayload: `YAZHINI|ORD:${order.id}|AMT:${grandTotal}`
  };
};

/**
 * Generate authentic Thermal Receipt PDF (80mm or 58mm width) using jsPDF
 */
export const generateThermalReceiptPDF = (
  receipt: ThermalReceiptData,
  widthMm: 80 | 58 = 80
): void => {
  // Estimate height dynamically based on items and terms count
  const baseHeight = 150;
  const itemsHeight = receipt.items.length * 9;
  const termsHeight = (receipt.terms?.length || 0) * 5;
  const totalHeightMm = Math.max(160, baseHeight + itemsHeight + termsHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, totalHeightMm]
  });

  const margin = 4;
  const printableWidth = widthMm - (margin * 2);
  const centerX = widthMm / 2;
  let y = 8;

  // Header Brand
  doc.setFont('courier', 'bold');
  doc.setFontSize(widthMm === 80 ? 12 : 10);
  doc.text(receipt.brandName.toUpperCase(), centerX, y, { align: 'center' });
  y += 4;

  if (receipt.tagline) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.text(receipt.tagline, centerX, y, { align: 'center' });
    y += 3.5;
  }

  doc.setFontSize(6.5);
  if (receipt.branchName) {
    doc.text(receipt.branchName, centerX, y, { align: 'center' });
    y += 3;
  }
  if (receipt.address) {
    doc.text(receipt.address, centerX, y, { align: 'center' });
    y += 3;
  }
  if (receipt.phone || receipt.gstin) {
    const line = [receipt.phone, receipt.gstin ? `GST: ${receipt.gstin}` : ''].filter(Boolean).join(' | ');
    doc.text(line, centerX, y, { align: 'center' });
    y += 3;
  }
  if (receipt.bisLicence) {
    doc.text(`BIS Lic: ${receipt.bisLicence}`, centerX, y, { align: 'center' });
    y += 4;
  }

  // Divider
  doc.setLineDashPattern([0.5, 0.5], 0);
  doc.setLineWidth(0.2);
  doc.line(margin, y, widthMm - margin, y);
  y += 3.5;

  // Title / Type
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  const receiptTitle = receipt.isReprint ? '*** DUPLICATE / REPRINT RECEIPT ***' : 'TAX INVOICE / CASH MEMO';
  doc.text(receiptTitle, centerX, y, { align: 'center' });
  y += 4;

  // Details Meta
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Receipt #: ${receipt.receiptNumber}`, margin, y);
  y += 3;
  doc.text(`Date/Time : ${new Date(receipt.dateTime).toLocaleString('en-IN')}`, margin, y);
  y += 3;
  if (receipt.cashierName) {
    doc.text(`Cashier   : ${receipt.cashierName}`, margin, y);
    y += 3;
  }
  if (receipt.customerName) {
    doc.text(`Patron    : ${receipt.customerName} (${receipt.customerPhone || 'Walk-in'})`, margin, y);
    y += 3;
  }

  // Table Divider
  doc.line(margin, y, widthMm - margin, y);
  y += 3;

  // Items Header
  doc.setFont('courier', 'bold');
  doc.text('ITEM / SPEC', margin, y);
  doc.text('QTY', widthMm - 24, y, { align: 'right' });
  doc.text('TOTAL', widthMm - margin, y, { align: 'right' });
  y += 3;
  doc.line(margin, y, widthMm - margin, y);
  y += 3.5;

  // Items List
  doc.setFont('courier', 'normal');
  receipt.items.forEach(it => {
    doc.setFont('courier', 'bold');
    const truncatedName = it.name.length > (widthMm === 80 ? 26 : 18)
      ? it.name.substring(0, widthMm === 80 ? 24 : 16) + '..'
      : it.name;
    doc.text(truncatedName, margin, y);
    doc.text(String(it.qty), widthMm - 24, y, { align: 'right' });
    doc.text(it.total.toLocaleString('en-IN'), widthMm - margin, y, { align: 'right' });
    y += 3;

    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    const spec = [it.purity, it.grossWeight ? `${it.grossWeight}g` : '', it.makingCharge ? `MC:${it.makingCharge}` : ''].filter(Boolean).join(' • ');
    if (spec) {
      doc.text(spec, margin + 1.5, y);
      y += 3;
    }
    doc.setFontSize(6.5);
  });

  // Totals Divider
  doc.line(margin, y, widthMm - margin, y);
  y += 3.5;

  const printRow = (label: string, value: string, bold: boolean = false) => {
    if (bold) doc.setFont('courier', 'bold');
    else doc.setFont('courier', 'normal');
    doc.text(label, margin, y);
    doc.text(value, widthMm - margin, y, { align: 'right' });
    y += 3;
  };

  printRow('Subtotal:', receipt.subtotal.toLocaleString('en-IN'));
  if (receipt.makingChargesTotal && receipt.makingChargesTotal > 0) {
    printRow('Making Charges:', receipt.makingChargesTotal.toLocaleString('en-IN'));
  }
  if (receipt.hallmarkingFee && receipt.hallmarkingFee > 0) {
    printRow('BIS Hallmarking:', receipt.hallmarkingFee.toLocaleString('en-IN'));
  }
  if (receipt.discount && receipt.discount > 0) {
    printRow('Discount:', `-${receipt.discount.toLocaleString('en-IN')}`);
  }
  printRow(`GST (${receipt.taxRatePercent || 3}%):`, receipt.taxAmount.toLocaleString('en-IN'));

  // Grand Total
  y += 1;
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, widthMm - margin, y);
  y += 3.5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(widthMm === 80 ? 9 : 8);
  doc.text('TOTAL PAID:', margin, y);
  doc.text(`INR ${receipt.grandTotal.toLocaleString('en-IN')}`, widthMm - margin, y, { align: 'right' });
  y += 4;
  doc.line(margin, y, widthMm - margin, y);
  y += 3;

  // Payment Info
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Payment: ${receipt.paymentMethod} (${receipt.paymentStatus})`, margin, y);
  y += 3;
  if (receipt.paymentReference) {
    doc.text(`Ref    : ${receipt.paymentReference}`, margin, y);
    y += 3;
  }

  // Barcode representation
  y += 2;
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.4);
  const barWidth = printableWidth;
  const barcodeY = y;
  // Draw simulated thermal barcode stripes
  for (let b = 0; b < 28; b++) {
    const x = margin + 2 + (b * (barWidth - 4) / 28);
    const w = (b % 3 === 0) ? 0.7 : 0.35;
    doc.setLineWidth(w);
    doc.line(x, barcodeY, x, barcodeY + 6);
  }
  y += 8;
  doc.setFontSize(5.5);
  doc.text(receipt.receiptNumber, centerX, y, { align: 'center' });
  y += 4;

  // Terms & Conditions
  if (receipt.terms && receipt.terms.length > 0) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(5);
    receipt.terms.forEach(term => {
      const split = doc.splitTextToSize(term, printableWidth);
      doc.text(split, margin, y);
      y += (split.length * 2.5);
    });
  }

  // Footer Thank You
  y += 2;
  doc.setFont('courier', 'bold');
  doc.setFontSize(6);
  doc.text('THANK YOU FOR YOUR PATRONAGE', centerX, y, { align: 'center' });
  y += 3;
  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  doc.text('YAZHINI FINE JEWELS • CHENNAI', centerX, y, { align: 'center' });

  // Save PDF (trigger download in browser, avoid disk artifacts during automated tests)
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined' && !(globalThis as any).process?.env?.VITEST) {
    doc.save(`Thermal_Receipt_${receipt.receiptNumber}.pdf`);
  } else if (typeof (doc as any).output === 'function') {
    (doc as any).output('arraybuffer');
  } else {
    doc.save(`Thermal_Receipt_${receipt.receiptNumber}.pdf`);
  }
};
