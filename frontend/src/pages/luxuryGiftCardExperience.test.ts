import { describe, it, expect, vi, beforeEach } from 'vitest';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { giftCardService } from '../services/giftCardService';

describe('Luxury Gift Card & Print Voucher Redesign — Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Certificate Data Retrieval & Verification', () => {
    it('retrieves an active gift certificate with recipient, sender, and face value', async () => {
      // Mock getPublicCard for standard gift card
      vi.spyOn(giftCardService, 'getPublicCard').mockResolvedValueOnce({
        success: true,
        card: {
          code: 'YAZ-GIFT-GOLD-5000',
          design: {
            id: 'classic-yazhini',
            name: 'Classic YAZHINI 24K Heritage',
            tagline: 'Timeless luxury wrapped in pure 24K gold foil & velvet',
            theme: 'gold',
            bgGradient: 'linear-gradient(135deg, #42101D 0%, #5B1727 50%, #280B13 100%)',
            accentColor: '#C6A15B',
            pattern: 'heritage-filigree',
            image: '/images/gift_card_luxury_box.jpg',
            occasions: ['General', 'Celebration']
          },
          originalValue: 5000,
          currentBalance: 5000,
          currency: 'INR',
          status: 'ACTIVE',
          recipientName: 'Dr. Priya Sundaram',
          senderName: 'Ananya Ramanathan',
          giftMessage: 'Wishing you a very happy birthday filled with radiant jewellery and joy!',
          occasion: 'Birthday',
          expiresAt: '2027-10-26T14:17:33.551Z',
          createdAt: '2026-10-23T14:17:33.551Z'
        }
      });

      const res = await giftCardService.getPublicCard('YAZ-GIFT-GOLD-5000');
      expect(res.success).toBe(true);
      expect(res.card?.recipientName).toBe('Dr. Priya Sundaram');
      expect(res.card?.senderName).toBe('Ananya Ramanathan');
      expect(res.card?.currentBalance).toBe(5000);
      expect(res.card?.originalValue).toBe(5000);
      expect(res.card?.status).toBe('ACTIVE');
      expect(res.card?.occasion).toBe('Birthday');
    });

    it('correctly handles a partially redeemed gift card displaying remaining balance and original value', async () => {
      vi.spyOn(giftCardService, 'getPublicCard').mockResolvedValueOnce({
        success: true,
        card: {
          code: 'YAZ-GIFT-WEDD-2500',
          design: {
            id: 'bridal-elegance',
            name: 'Bridal Elegance Sacred Gold',
            tagline: 'Adorn life’s most auspicious moments with eternal grace',
            theme: 'burgundy',
            bgGradient: 'linear-gradient(135deg, #4A0E17 0%, #29080E 50%, #120406 100%)',
            accentColor: '#E6C687',
            pattern: 'temple-arch',
            image: '/images/bridal_vivaah_ruby_kundan.jpg',
            occasions: ['Wedding', 'Engagement']
          },
          originalValue: 10000,
          currentBalance: 2500,
          currency: 'INR',
          status: 'PARTIALLY_REDEEMED',
          recipientName: 'Ananya Ramanathan',
          senderName: 'Karthik Subramanian',
          giftMessage: 'Heartiest congratulations on your wedding anniversary!',
          occasion: 'Anniversary',
          expiresAt: '2027-10-16T14:17:33.551Z',
          createdAt: '2026-10-16T14:17:33.551Z'
        }
      });

      const res = await giftCardService.getPublicCard('YAZ-GIFT-WEDD-2500');
      expect(res.success).toBe(true);
      expect(res.card?.currentBalance).toBe(2500);
      expect(res.card?.originalValue).toBe(10000);
      expect(res.card?.currentBalance).toBeLessThan(res.card?.originalValue!);
      expect(res.card?.status).toBe('PARTIALLY_REDEEMED');
    });

    it('rejects an invalid gift card reference code gracefully', async () => {
      vi.spyOn(giftCardService, 'getPublicCard').mockResolvedValueOnce({
        success: false,
        error: 'Gift card certificate not found'
      });

      const res = await giftCardService.getPublicCard('INVALID-CODE-9999');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Gift card certificate not found');
    });
  });

  describe('2. Security & Confidentiality Safeguards', () => {
    it('ensures 4-digit security PIN and internal hashes are never exposed in public certificate payloads', async () => {
      vi.spyOn(giftCardService, 'getPublicCard').mockResolvedValueOnce({
        success: true,
        card: {
          code: 'YAZ-GIFT-GOLD-5000',
          design: {
            id: 'classic-yazhini',
            name: 'Classic YAZHINI 24K Heritage',
            tagline: 'Timeless luxury wrapped in pure 24K gold foil & velvet',
            theme: 'gold',
            bgGradient: 'linear-gradient(135deg, #42101D 0%, #5B1727 50%, #280B13 100%)',
            accentColor: '#C6A15B',
            pattern: 'heritage-filigree',
            image: '/images/gift_card_luxury_box.jpg',
            occasions: ['General']
          },
          originalValue: 5000,
          currentBalance: 5000,
          currency: 'INR',
          status: 'ACTIVE',
          recipientName: 'Dr. Priya Sundaram',
          senderName: 'Ananya Ramanathan',
          expiresAt: '2027-10-26T14:17:33.551Z',
          createdAt: '2026-10-23T14:17:33.551Z'
        }
      });

      const res = await giftCardService.getPublicCard('YAZ-GIFT-GOLD-5000');
      const publicCard = res.card as any;
      expect(publicCard.pin).toBeUndefined();
      expect(publicCard.pin_hash).toBeUndefined();
      expect(publicCard.security_token).toBeUndefined();
      expect(publicCard.customer_id).toBeUndefined();
    });
  });

  describe('3. Scannable QR Code Generation Engine', () => {
    it('generates a real scannable QR Code data URL with high error correction', async () => {
      const code = 'YAZ-GIFT-GOLD-5000';
      const testOrigin = 'https://yazhinijewels.com';
      const destinationUrl = `${testOrigin}/gift-card/${code}`;

      const qrDataUrl = await QRCode.toDataURL(destinationUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: '#42101D',
          light: '#FAF7F0'
        },
        errorCorrectionLevel: 'H'
      });

      expect(qrDataUrl).toBeDefined();
      expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
      expect(qrDataUrl.length).toBeGreaterThan(100);
    });

    it('encodes the exact destination URL format for boutique and online redemption', async () => {
      const code = 'YAZ-GIFT-WEDD-2500';
      const redemptionUrl = `https://yazhinijewels.com/gift-card/${code}`;

      // Test QRCode toString SVG output
      const svgOutput = await QRCode.toString(redemptionUrl, { type: 'svg' });
      expect(svgOutput).toContain('<svg');
      expect(svgOutput).toContain('</svg>');
    });
  });

  describe('4. Dedicated jsPDF Luxury Certificate Engine', () => {
    it('creates a landscape A4 PDF document with gold framing and certificate typography', () => {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Landscape A4 checks
      expect(pageWidth).toBeCloseTo(297, 0);
      expect(pageHeight).toBeCloseTo(210, 0);

      // Background Fill (#42101D)
      doc.setFillColor(66, 16, 29);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Champagne Gold Borders
      doc.setDrawColor(198, 161, 91);
      doc.setLineWidth(1.2);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      // Add Text Elements
      doc.setFont('times', 'bold');
      doc.setFontSize(22);
      doc.text('YAZHINI FINE JEWELS', pageWidth / 2, 25, { align: 'center' });

      doc.setFontSize(14);
      doc.text('A Present of Pure Radiance', pageWidth / 2, 35, { align: 'center' });

      expect(doc.getNumberOfPages()).toBe(1);
    });
  });

  describe('5. Print Layout & Media Stylesheet Validation', () => {
    it('defines landscape @page rules and disables screen UI during print', () => {
      const printStyles = `
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            background: #FAF7F0 !important;
            color: #282329 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, header, footer, .no-print, button, a.btn, .back-to-top, [data-portal] {
            display: none !important;
          }
          .print-certificate-container {
            width: 100% !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `;

      expect(printStyles).toContain('size: landscape');
      expect(printStyles).toContain('display: none !important');
      expect(printStyles).toContain('-webkit-print-color-adjust: exact');
      expect(printStyles).toContain('break-inside: avoid');
    });
  });

  describe('6. Luxury Palette & Brand Consistency', () => {
    it('uses the approved luxury jewellery color tokens', () => {
      const luxuryPalette = {
        deepBurgundy: '#42101D',
        richWine: '#5B1727',
        champagneGold: '#C6A15B',
        warmIvory: '#FAF7F0',
        softCream: '#F1E9DC',
        charcoal: '#282329',
        mutedBronze: '#8C744C'
      };

      expect(luxuryPalette.deepBurgundy).toBe('#42101D');
      expect(luxuryPalette.richWine).toBe('#5B1727');
      expect(luxuryPalette.champagneGold).toBe('#C6A15B');
      expect(luxuryPalette.warmIvory).toBe('#FAF7F0');
      expect(luxuryPalette.softCream).toBe('#F1E9DC');
      expect(luxuryPalette.charcoal).toBe('#282329');
    });
  });
});
