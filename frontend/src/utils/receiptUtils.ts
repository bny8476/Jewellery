import { jsPDF } from 'jspdf';
import type { Pledge, PledgeWithDetails, PartPayment, PledgeReturn, AdditionalPledge, PledgeSale } from '../types/pawnshop';

const COMPANY_NAME = "PAWNSHOP MANAGER"; // Replace with dynamic company details if available
const COMPANY_ADDRESS = "123 Gold Street, Market Road, City - 600001";
const COMPANY_PHONE = "Ph: 9876543210";

export const generatePledgeReceipt = (pledge: PledgeWithDetails) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(COMPANY_ADDRESS, pageWidth / 2, 28, { align: 'center' });
    doc.text(COMPANY_PHONE, pageWidth / 2, 33, { align: 'center' });

    doc.line(10, 38, pageWidth - 10, 38);

    // Title
    doc.setFontSize(16);
    doc.text("PLEDGE RECEIPT", pageWidth / 2, 50, { align: 'center' });

    // Details
    doc.setFontSize(11);
    const leftX = 20;
    const valueX = 70;
    const rightLabelX = 120;
    const rightValueX = 160;

    let y = 65;

    doc.text("Pledge No:", leftX, y);
    doc.text(pledge.pledge_number, valueX, y);

    doc.text("Date:", rightLabelX, y);
    doc.text(new Date(pledge.pledge_date).toLocaleDateString(), rightValueX, y);

    y += 10;
    doc.text("Customer:", leftX, y);
    doc.text(pledge.customer?.full_name || 'N/A', valueX, y);

    doc.text("Phone:", rightLabelX, y);
    doc.text(pledge.customer?.phone || 'N/A', rightValueX, y);

    y += 10;
    doc.text("Loan Amount:", leftX, y);
    doc.text(`${pledge.loan_amount.toLocaleString('en-IN')}`, valueX, y);

    doc.text("Interest:", rightLabelX, y);
    doc.text(`${pledge.interest_rate}% ${pledge.interest_type}`, rightValueX, y);

    // Items Table Header
    y += 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 5, pageWidth - 30, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text("Item Description", 20, y);
    doc.text("Qty", 100, y);
    doc.text("Gross Wt", 130, y);
    doc.text("Net Wt", 160, y);
    doc.setFont(undefined, 'normal');

    // Items List
    y += 10;
    pledge.items?.forEach((item) => {
        doc.text(item.item_description, 20, y);
        doc.text(item.quantity.toString(), 100, y);
        doc.text(`${item.gross_weight_grams}g`, 130, y);
        doc.text(`${item.net_weight_grams}g`, 160, y);
        y += 8;
    });

    // Terms
    y += 20;
    doc.setFontSize(9);
    doc.text("Terms & Conditions:", 20, y);
    y += 5;
    doc.text("1. Interest must be paid monthly.", 20, y);
    y += 5;
    doc.text("2. If interest is not paid for 6 months, items may be auctioned.", 20, y);
    y += 5;
    doc.text("3. Original receipt must be produced for redemption.", 20, y);

    // Signatures
    y += 30;
    doc.text("Customer Signature", 20, y);
    doc.text("Authorized Signatory", 150, y);

    // Save
    doc.save(`Pledge_${pledge.pledge_number}.pdf`);
};

export const generatePaymentReceipt = (payment: PartPayment, pledge: Pledge) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(COMPANY_ADDRESS, pageWidth / 2, 28, { align: 'center' });

    doc.line(10, 35, pageWidth - 10, 35);

    doc.setFontSize(16);
    doc.text("PAYMENT RECEIPT", pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(11);
    let y = 70;

    doc.text(`Receipt No: ${payment.receipt_number || 'N/A'}`, 20, y);
    doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 140, y);

    y += 10;
    doc.text(`Pledge No: ${pledge.pledge_number}`, 20, y);

    y += 15;
    doc.text("Amount Paid:", 20, y);
    doc.setFont(undefined, 'bold');
    doc.text(`Rs. ${payment.payment_amount.toLocaleString('en-IN')}/-`, 60, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text(`(Principal: ${payment.principal_paid} | Interest: ${payment.interest_paid})`, 60, y);

    y += 30;
    doc.text("Authorized Signatory", 140, y);

    doc.save(`Receipt_${payment.id.substring(0, 8)}.pdf`);
};

export const generatePledgeReturnReceipt = (returnDetails: PledgeReturn, pledge: Pledge) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(COMPANY_ADDRESS, pageWidth / 2, 28, { align: 'center' });

    doc.line(10, 35, pageWidth - 10, 35);

    doc.setFontSize(16);
    doc.text("PLEDGE REDEMPTION RECEIPT", pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(11);
    let y = 70;

    doc.text(`Receipt No: ${returnDetails.receipt_number || 'N/A'}`, 20, y);
    doc.text(`Date: ${new Date(returnDetails.return_date).toLocaleDateString()}`, 140, y);

    y += 10;
    doc.text(`Pledge No: ${pledge.pledge_number}`, 20, y);

    y += 15;
    doc.text("Total Paid:", 20, y);
    doc.setFont(undefined, 'bold');
    doc.text(`Rs. ${returnDetails.total_amount.toLocaleString('en-IN')}/-`, 60, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Breakdown:", 20, y);
    y += 7;
    doc.text(`- Principal: Rs. ${returnDetails.principal_amount}`, 30, y);
    y += 7;
    doc.text(`- Interest: Rs. ${returnDetails.interest_amount}`, 30, y);
    if (returnDetails.penalty_amount > 0) {
        y += 7;
        doc.text(`- Penalty: Rs. ${returnDetails.penalty_amount}`, 30, y);
    }

    y += 20;
    doc.setFontSize(10);
    doc.text("All items returned in good condition.", 20, y);
    doc.text("Pledge Closed.", 20, y + 5);

    y += 30;
    doc.text("Customer Signature", 20, y);
    doc.text("Authorized Signatory", 140, y);

    doc.save(`Return_Receipt_${pledge.pledge_number}.pdf`);
};

export const generateAdditionalPledgeReceipt = (additionalPledge: AdditionalPledge, pledge: Pledge) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(COMPANY_ADDRESS, pageWidth / 2, 28, { align: 'center' });

    doc.line(10, 35, pageWidth - 10, 35);

    doc.setFontSize(16);
    doc.text("ADDITIONAL PLEDGE RECEIPT", pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(11);
    let y = 70;

    doc.text(`Reference No: ${additionalPledge.id.substring(0, 8)}`, 20, y);
    doc.text(`Date: ${new Date(additionalPledge.additional_date).toLocaleDateString()}`, 140, y);

    y += 10;
    doc.text(`Original Pledge No: ${pledge.pledge_number}`, 20, y);

    y += 15;
    doc.text("Additional Loan Amount:", 20, y);
    doc.setFont(undefined, 'bold');
    doc.text(`Rs. ${additionalPledge.additional_amount.toLocaleString('en-IN')}/-`, 70, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Additional Weight:", 20, y);
    doc.text(`${additionalPledge.additional_weight_grams} g`, 70, y);

    y += 10;
    if (additionalPledge.notes) {
        doc.text("Notes:", 20, y);
        doc.text(additionalPledge.notes, 70, y);
    }

    y += 30;
    doc.text("Customer Signature", 20, y);
    doc.text("Authorized Signatory", 140, y);

    doc.save(`AddPending_${pledge.pledge_number}.pdf`);
};

export const generatePledgeSaleReceipt = (sale: PledgeSale, pledge: Pledge) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.text(COMPANY_NAME, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(COMPANY_ADDRESS, pageWidth / 2, 28, { align: 'center' });

    doc.line(10, 35, pageWidth - 10, 35);

    doc.setFontSize(16);
    doc.text("SALE RECEIPT", pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(11);
    let y = 70;

    doc.text(`Receipt No: ${sale.id.substring(0, 8)}`, 20, y);
    doc.text(`Date: ${new Date(sale.sale_date).toLocaleDateString()}`, 140, y);

    y += 10;
    doc.text(`Original Pledge Ref: ${pledge.pledge_number}`, 20, y);

    y += 15;
    doc.text("Sold To:", 20, y);
    doc.text(sale.buyer_name || "N/A", 50, y);
    if (sale.buyer_phone) {
        doc.text(`Ph: ${sale.buyer_phone}`, 140, y);
    }

    y += 15;
    doc.text("Sale Amount:", 20, y);
    doc.setFont(undefined, 'bold');
    doc.text(`Rs. ${sale.sale_amount.toLocaleString('en-IN')}/-`, 50, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text(`Payment Mode: ${sale.payment_mode?.toUpperCase()}`, 20, y);

    y += 15;
    if (sale.notes) {
        doc.text("Notes:", 20, y);
        doc.text(sale.notes, 50, y);
    }

    y += 30;
    doc.text("Buyer Signature", 20, y);
    doc.text("Authorized Signatory", 140, y);

    doc.save(`SaleReceipt_${pledge.pledge_number}.pdf`);
};
