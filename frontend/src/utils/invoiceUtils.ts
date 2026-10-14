import { jsPDF } from 'jspdf';

interface InvoiceItem {
    name: string;
    price: number;
    weight: number;
    unit: string;
}

export const generateInvoice = (customerName: string, items: InvoiceItem[], total: number) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('en-IN');
    const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    // Add Brand Header
    doc.setFillColor(107, 33, 168); // Purple-800
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("RCB Jewelry's & Pawn Shop", 20, 25);
    doc.setFontSize(10);
    doc.text("123 Diamond Avenue, Sparkling City, India", 20, 32);

    // Invoice Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("INVOICE", 20, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoiceNumber}`, 20, 70);
    doc.text(`Date: ${date}`, 20, 75);
    doc.text(`Customer: ${customerName}`, 20, 80);

    // Table Header
    doc.setFillColor(243, 244, 246);
    doc.rect(20, 95, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text("Product Details", 25, 102);
    doc.text("Total Price", 160, 102);

    // Table Content
    let y = 115;
    items.forEach((item) => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.name, 25, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`Weight: ${item.weight}${item.unit}`, 25, y + 5);
        doc.text(`Price: INR ${item.price.toLocaleString()}`, 160, y);
        y += 20;
    });

    // Totals
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Total Amount", 25, y + 15);
    doc.setTextColor(107, 33, 168);
    doc.text(`INR ${total.toLocaleString()}`, 160, y + 15);

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text("Thank you for shopping with RCB Jewelry's! This is a computer-generated invoice.", 105, 280, { align: 'center' });

    doc.save(`${invoiceNumber}.pdf`);
};
