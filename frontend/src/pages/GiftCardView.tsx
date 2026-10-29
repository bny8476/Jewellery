import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  Share2, 
  ShoppingBag, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Gift, 
  QrCode, 
  Info,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { giftCardService, GiftCardDesign } from '../services/giftCardService';
import { toast } from '../utils/toast';
import { BackButton } from '../components/ui/BackButton';

// Luxury Brand Palette Constants
// Deep burgundy: #42101D
// Rich wine: #5B1727
// Champagne gold: #C6A15B
// Warm ivory: #FAF7F0
// Soft cream: #F1E9DC
// Charcoal: #282329
// Muted bronze: #8C744C

const CornerOrnament = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={`w-8 h-8 pointer-events-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 38V12C2 6.47715 6.47715 2 12 2H38" stroke="#C6A15B" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 38V14C6 9.58172 9.58172 6 14 6H38" stroke="#C6A15B" strokeWidth="0.75" strokeOpacity="0.7" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.5" fill="#C6A15B" />
    <circle cx="2" cy="38" r="1.5" fill="#C6A15B" />
    <circle cx="38" cy="2" r="1.5" fill="#C6A15B" />
  </svg>
);

const JewelDivider = () => (
  <div className="flex items-center justify-center gap-3 py-1">
    <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent" />
    <svg className="w-3.5 h-3.5 text-[#C6A15B]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
    <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent" />
  </div>
);

export default function GiftCardView() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  // Fetch certificate data from database
  useEffect(() => {
    async function fetchCard() {
      if (!code) {
        setError('Missing gift card reference code.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await giftCardService.getPublicCard(code);
        if (res.success && res.card) {
          setCardData(res.card);

          // Generate genuine scannable QR Code encoding secure redemption destination
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yazhinijewels.com';
          const redemptionUrl = `${origin}/gift-card/${res.card.code}`;
          
          try {
            const qrData = await QRCode.toDataURL(redemptionUrl, {
              width: 256,
              margin: 1,
              color: {
                dark: '#42101D',
                light: '#FAF7F0'
              },
              errorCorrectionLevel: 'H'
            });
            setQrCodeUrl(qrData);
          } catch (qrErr) {
            console.warn('QR Code generation notice:', qrErr);
          }
        } else {
          setError(res.error || 'Gift card not found or invalid reference.');
        }
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve gift card.');
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [code]);

  // Copy redemption code with toast & button state feedback
  const handleCopyCode = () => {
    if (cardData?.code) {
      navigator.clipboard.writeText(cardData.code);
      setCopied(true);
      toast.success('Redemption code copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Dedicated Print Action
  const handlePrint = () => {
    if (!cardData) {
      toast.error('Voucher data is still loading.');
      return;
    }
    window.print();
  };

  // Dedicated PDF Download Action using jsPDF
  const handleDownloadPdf = async () => {
    if (!cardData) return;
    try {
      setIsGeneratingPdf(true);
      toast.info('Preparing luxury certificate PDF...');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const burgundy = '#42101D';
      const richWine = '#5B1727';
      const gold = '#C6A15B';
      const ivory = '#FAF7F0';
      const charcoal = '#282329';

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Certificate Background Fill (Rich Wine gradient effect)
      doc.setFillColor(66, 16, 29); // #42101D
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Outer Champagne Gold Border
      doc.setDrawColor(198, 161, 91); // #C6A15B
      doc.setLineWidth(1.2);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      // Inner Fine Gold Inset Border
      doc.setLineWidth(0.4);
      doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

      // Header Brand
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(230, 198, 135);
      doc.text('YAZHINI FINE JEWELS', pageWidth / 2, 22, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(198, 161, 91);
      doc.text('OFFICIAL DIGITAL GIFT CERTIFICATE', pageWidth / 2, 28, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(22);
      doc.setTextColor(250, 247, 240);
      doc.text('A Present of Pure Radiance', pageWidth / 2, 38, { align: 'center' });

      // Divider Line
      doc.setDrawColor(198, 161, 91);
      doc.setLineWidth(0.3);
      doc.line(pageWidth / 2 - 40, 42, pageWidth / 2 + 40, 42);

      // Recipient Greeting
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(198, 161, 91);
      doc.text('PRESENTED WITH COMPLIMENTS TO', 24, 55);

      doc.setFont('times', 'bolditalic');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text(cardData.recipientName || 'Valued Recipient', 24, 65);

      if (cardData.occasion) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(230, 198, 135);
        doc.text(`OCCASION: ${cardData.occasion.toUpperCase()}`, 24, 72);
      }

      // Personal Message Box
      const message = `"${cardData.giftMessage || 'Wishing you eternal joy and brilliant elegance with YAZHINI Fine Jewels.'}"`;
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(220, 215, 205);
      const splitMessage = doc.splitTextToSize(message, 150);
      doc.text(splitMessage, 24, 82);

      // Sender Info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(198, 161, 91);
      doc.text('PRESENTED BY', 24, 110);
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(cardData.senderName || 'Valued Patron', 24, 116);

      // Right Side: Card Value Box
      doc.setFillColor(91, 23, 39); // #5B1727
      doc.rect(pageWidth - 95, 52, 75, 45, 'F');
      doc.setDrawColor(198, 161, 91);
      doc.setLineWidth(0.6);
      doc.rect(pageWidth - 95, 52, 75, 45);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(230, 198, 135);
      doc.text(cardData.currentBalance < cardData.originalValue ? 'AVAILABLE BALANCE' : 'GIFT CARD VALUE', pageWidth - 57.5, 62, { align: 'center' });

      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(255, 255, 255);
      doc.text(`₹${cardData.currentBalance.toLocaleString('en-IN')}`, pageWidth - 57.5, 75, { align: 'center' });

      if (cardData.currentBalance < cardData.originalValue) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(200, 190, 180);
        doc.text(`Face Value: ₹${cardData.originalValue.toLocaleString('en-IN')}`, pageWidth - 57.5, 84, { align: 'center' });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(200, 190, 180);
        doc.text('Indian Rupees (INR) • 100% Guaranteed', pageWidth - 57.5, 84, { align: 'center' });
      }

      // Add Scannable QR Code on Right
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', pageWidth - 80, 105, 45, 45);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(198, 161, 91);
        doc.text(`SCAN TO VERIFY / REDEEM`, pageWidth - 57.5, 154, { align: 'center' });
      }

      // Bottom Row: Voucher Code & Expiry
      doc.setDrawColor(198, 161, 91);
      doc.setLineWidth(0.4);
      doc.line(24, 160, pageWidth - 24, 160);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(198, 161, 91);
      doc.text('REDEMPTION VOUCHER CODE:', 24, 168);

      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(cardData.code, 24, 175);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(198, 161, 91);
      doc.text('VALID UNTIL:', 120, 168);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      const expiryFormatted = new Date(cardData.expiresAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      doc.text(expiryFormatted, 120, 174);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(198, 161, 91);
      doc.text('ASSURANCE SEAL:', 180, 168);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(230, 198, 135);
      doc.text('BIS 916 HALLMARK CERTIFIED', 180, 174);

      // Footnote
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(170, 150, 140);
      doc.text('Redeemable at yazhinijewels.com and all authorized YAZHINI Fine Jewels boutiques across India. Valid for 12 months.', pageWidth / 2, 192, { align: 'center' });

      // Save document
      doc.save(`YAZHINI-Gift-Certificate-${cardData.code}.pdf`);
      toast.success('Luxury Gift Certificate PDF downloaded successfully!');
    } catch (pdfErr: any) {
      console.error('PDF generation error:', pdfErr);
      toast.error('Could not generate PDF. Please use the Print Voucher button.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Native Web Share or Link Copy
  const handleShare = async () => {
    if (!cardData) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `YAZHINI Royal Gift Certificate for ${cardData.recipientName}`,
          text: `You have received a luxury YAZHINI Fine Jewels gift certificate of ₹${cardData.currentBalance.toLocaleString('en-IN')}`,
          url: shareUrl
        });
        toast.success('Certificate shared!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl);
          toast.success('Certificate link copied to clipboard!');
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Certificate link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#1A0D12] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full border-2 border-[#C6A15B] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-[0.25em] text-[#C6A15B] font-semibold font-inter">
            Opening Luxury Gift Certificate Vault...
          </p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#1A0D12] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#28131B] p-8 rounded-3xl border border-[#C6A15B]/30 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto border border-red-200 dark:border-red-800">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-inter font-bold text-[#42101D] dark:text-[#FAF7F0]">
            Gift Certificate Unavailable
          </h2>
          <p className="text-xs text-[#5B1727]/80 dark:text-[#F1E9DC]/70 leading-relaxed">
            {error || 'The requested gift certificate could not be retrieved. Please check the code in your notification email or contact our boutique concierge.'}
          </p>
          <div className="pt-2">
            <Link
              to="/gift-cards"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#42101D] text-[#C6A15B] hover:bg-[#5B1727] font-bold text-xs shadow-md transition-all"
            >
              <Gift className="w-4 h-4" />
              Return to Gift Cards Boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const design: GiftCardDesign = cardData.design || {
    id: 'classic-yazhini',
    name: 'Classic YAZHINI 24K Heritage',
    tagline: 'Timeless luxury wrapped in pure 24K gold foil & velvet',
    theme: 'gold',
    bgGradient: 'linear-gradient(135deg, #42101D 0%, #5B1727 50%, #280B13 100%)',
    accentColor: '#C6A15B',
    pattern: 'heritage-filigree',
    image: '/images/gift_card_luxury_box.jpg',
    occasions: ['General']
  };

  const isPartiallyRedeemed = cardData.currentBalance < cardData.originalValue;
  const isExpired = cardData.status === 'EXPIRED' || (cardData.expiresAt && new Date(cardData.expiresAt).getTime() < Date.now());

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#1A0D12] text-[#282329] dark:text-[#FAF7F0] py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#C6A15B] selection:text-[#42101D]">
      {/* Print-specific style injection to force landscape luxury rendering & hide all UI */}
      <style>{`
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
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-card-box {
            box-shadow: none !important;
            border: 2px solid #C6A15B !important;
            background: #42101D !important;
            color: #FAF7F0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-voucher-breakup {
            border: 1px solid #C6A15B !important;
            background: #FAF7F0 !important;
            color: #282329 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-8 print-certificate-container">
        
        {/* Top Navigation Bar (Hidden on Print) */}
        <div className="flex items-center justify-between no-print">
          <BackButton fallbackPath="/gift-cards" label="Back to Gift Cards" variant="pill" />
        </div>

        {/* Top Eyebrow & Page Intro (Hidden on Print) */}
        <div className="text-center space-y-2 no-print">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6A15B]/15 border border-[#C6A15B]/40 text-[#42101D] dark:text-[#C6A15B] text-[10px] font-semibold tracking-[0.2em] uppercase font-sans">
            <Sparkles className="w-3 h-3 text-[#C6A15B]" />
            OFFICIAL DIGITAL GIFT CERTIFICATE
          </div>
          <h1 className="text-3xl sm:text-4xl font-inter font-bold text-[#42101D] dark:text-[#FAF7F0] tracking-tight">
            A Present of Pure Radiance
          </h1>
          <p className="text-xs sm:text-sm text-[#5B1727]/80 dark:text-[#F1E9DC]/70 font-sans">
            Presented to <strong className="text-[#42101D] dark:text-[#C6A15B] font-inter">{cardData.recipientName}</strong> with warmest compliments from{' '}
            <strong className="text-[#42101D] dark:text-[#C6A15B] font-inter">{cardData.senderName}</strong>
          </p>
        </div>

        {/* =========================================================================
            SECTION 2: ULTRA-PREMIUM LUXURY DIGITAL CERTIFICATE (LANDSCAPE VOUCHER)
            ========================================================================= */}
        <motion.div
          ref={certificateRef}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="print-card-box relative rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden bg-gradient-to-br from-[#42101D] via-[#5B1727] to-[#280B13] text-[#FAF7F0] border-2 border-[#C6A15B] flex flex-col justify-between"
          style={{
            minHeight: '440px'
          }}
        >
          {/* Ornamental Corner Filigree Brackets */}
          <CornerOrnament className="absolute top-3 left-3" />
          <CornerOrnament className="absolute top-3 right-3 rotate-90" />
          <CornerOrnament className="absolute bottom-3 left-3 -rotate-90" />
          <CornerOrnament className="absolute bottom-3 right-3 rotate-180" />

          {/* Fine Inner Inset Border Frame */}
          <div className="absolute inset-4 sm:inset-6 border border-[#C6A15B]/35 rounded-2xl pointer-events-none" />

          {/* Subtle Guilloché / Watermark Pattern */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#C6A15B_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* 1. CERTIFICATE HEADER */}
          <div className="relative z-10 text-center space-y-1.5 pb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs sm:text-sm font-inter uppercase tracking-[0.35em] text-[#C6A15B] font-bold">
                YAZHINI FINE JEWELS
              </span>
            </div>
            <div className="inline-block">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#FAF7F0]/80 font-sans border-b border-[#C6A15B]/40 pb-0.5">
                CERTIFICATE OF GIFT VALUE & AUTHENTICITY
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-inter italic text-[#FAF7F0] pt-1">
              A Present of Pure Radiance
            </h2>
            <JewelDivider />
          </div>

          {/* 2. RECIPIENT, GREETING & VALUE GRID */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-4">
            
            {/* Left Column: Greeting, Occasion & Message (7 Cols) */}
            <div className="md:col-span-7 space-y-3 pl-2 sm:pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-sans tracking-widest text-[#C6A15B] font-semibold">
                  Presented To:
                </span>
                {cardData.occasion && (
                  <span className="text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#FAF7F0]/10 border border-[#C6A15B]/30 text-[#FAF7F0] font-mono">
                    {cardData.occasion}
                  </span>
                )}
              </div>

              <p className="text-2xl sm:text-3xl font-inter font-bold text-white tracking-wide">
                {cardData.recipientName}
              </p>

              <div className="relative pl-3 border-l-2 border-[#C6A15B]/50 py-0.5">
                <p className="text-xs sm:text-sm text-[#F1E9DC] font-inter italic leading-relaxed line-clamp-3">
                  "{cardData.giftMessage || 'Wishing you eternal joy, prosperity, and brilliant radiance with YAZHINI Fine Jewels.'}"
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2 text-xs text-[#FAF7F0]/70 font-sans">
                <span>With compliments from:</span>
                <strong className="text-white font-inter tracking-wide">{cardData.senderName}</strong>
              </div>
            </div>

            {/* Right Column: Prominent Luxury Value Plaque (5 Cols) */}
            <div className="md:col-span-5 pr-2 sm:pr-4 flex justify-center md:justify-end">
              <div className="w-full max-w-xs bg-[#42101D]/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-[#C6A15B] text-center shadow-xl space-y-1.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#C6A15B]/20 to-transparent rounded-bl-full pointer-events-none" />
                
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C6A15B] font-mono font-bold block">
                  {isPartiallyRedeemed ? 'AVAILABLE BALANCE' : 'GIFT CERTIFICATE VALUE'}
                </span>

                <div className="text-3xl sm:text-4xl font-inter font-bold text-white tracking-tight py-1">
                  ₹{cardData.currentBalance.toLocaleString('en-IN')}
                </div>

                {isPartiallyRedeemed && (
                  <div className="text-[10px] text-[#FAF7F0]/70 font-mono pt-0.5 border-t border-[#C6A15B]/30 flex items-center justify-between">
                    <span>Original Value:</span>
                    <span className="line-through">₹{cardData.originalValue.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="text-[9px] uppercase tracking-wider text-[#C6A15B] font-sans pt-1">
                  Indian Rupees (INR) • 100% Insured
                </div>
              </div>
            </div>
          </div>

          {/* 3. CERTIFICATE FOOTER: IDENTITY, DATES & OFFICIAL ASSURANCE */}
          <div className="relative z-10 pt-4 border-t border-[#C6A15B]/30 flex flex-wrap items-end justify-between gap-4 text-xs">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-[#C6A15B] block font-mono font-semibold">
                Voucher Reference ID
              </span>
              <span className="text-sm sm:text-base font-mono font-bold tracking-widest text-white">
                {cardData.code}
              </span>
              <span className="text-[9px] text-[#FAF7F0]/60 block font-sans">
                Collection: {design.name}
              </span>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-[9px] uppercase tracking-widest text-[#C6A15B] block font-mono font-semibold">
                Validity & Expiry
              </span>
              <div className="flex items-center gap-1.5 text-xs font-sans text-white">
                <Clock className="w-3.5 h-3.5 text-[#C6A15B]" />
                <span>
                  Valid until{' '}
                  <strong className="text-[#C6A15B]">
                    {new Date(cardData.expiresAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </strong>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-[#C6A15B] block font-mono font-semibold">
                Assurance Status
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 border border-[#C6A15B]/40 text-[10px] font-mono text-[#FAF7F0]">
                <ShieldCheck className="w-3 h-3 text-[#C6A15B]" />
                <span className={isExpired ? 'text-red-400' : 'text-emerald-400 font-semibold'}>
                  {isExpired ? 'EXPIRED' : cardData.status}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =========================================================================
            SECTION 3: UPGRADED REDEMPTION VOUCHER & CONTROLS
            ========================================================================= */}
        <div className="print-voucher-breakup bg-white dark:bg-[#28131B] rounded-3xl p-6 sm:p-8 border border-[#C6A15B]/40 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#C6A15B]/20 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#C6A15B] font-mono font-bold">
                <Gift className="w-4 h-4 text-[#C6A15B]" />
                GIFT CARD REDEMPTION
              </div>
              <h3 className="text-xl font-inter font-bold text-[#42101D] dark:text-[#FAF7F0]">
                Official Redemption Voucher & Verification
              </h3>
            </div>

            {/* Quick Action Button Toolbar (Hidden on Print) */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-[#42101D] text-[#C6A15B] hover:bg-[#5B1727] text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
                aria-label="Copy gift card redemption code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Code Copied!' : 'Copy Code'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] dark:bg-[#3D1D29] border border-[#C6A15B]/50 hover:border-[#C6A15B] text-xs font-semibold flex items-center gap-2 text-[#42101D] dark:text-[#FAF7F0] transition-all cursor-pointer shadow-sm"
                aria-label="Print gift card voucher"
              >
                <Printer className="w-3.5 h-3.5 text-[#C6A15B]" />
                Print Voucher
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] dark:bg-[#3D1D29] border border-[#C6A15B]/50 hover:border-[#C6A15B] text-xs font-semibold flex items-center gap-2 text-[#42101D] dark:text-[#FAF7F0] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                aria-label="Download gift card certificate as PDF"
              >
                <Download className="w-3.5 h-3.5 text-[#C6A15B]" />
                {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-[#FAF7F0] dark:bg-[#3D1D29] border border-[#C6A15B]/50 hover:border-[#C6A15B] text-[#42101D] dark:text-[#FAF7F0] transition-all cursor-pointer shadow-sm"
                title="Share Certificate"
                aria-label="Share gift card certificate"
              >
                <Share2 className="w-4 h-4 text-[#C6A15B]" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              SECTION 4: REAL, SCANNABLE QR CODE & CONCIERGE BARCODE
              ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 rounded-2xl bg-[#FAF7F0] dark:bg-[#1E0C13] border border-[#C6A15B]/30">
            
            {/* Scannable QR Code (Camera Verified) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white dark:bg-[#28131B] rounded-2xl border border-[#C6A15B]/30 shadow-inner">
              {qrCodeUrl ? (
                <div className="p-2 bg-[#FAF7F0] rounded-xl border border-[#C6A15B]/40">
                  <img
                    src={qrCodeUrl}
                    alt={`Scannable QR Code for Gift Card ${cardData.code}`}
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-36 h-36 flex items-center justify-center border border-dashed border-[#C6A15B] rounded-xl text-xs text-[#C6A15B]">
                  <QrCode className="w-10 h-10 animate-pulse" />
                </div>
              )}
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#42101D] dark:text-[#C6A15B] font-semibold mt-2">
                Scan with Phone Camera
              </span>
              <span className="text-[9px] text-[#5B1727]/70 dark:text-[#FAF7F0]/60 text-center font-sans">
                Instant digital verification & checkout redemption
              </span>
            </div>

            {/* Human-Readable Code & Optical Barcode (8 Cols) */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#5B1727] dark:text-[#C6A15B] font-semibold block">
                  Confidential Voucher Code
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-[#42101D] dark:text-[#FAF7F0] bg-white/70 dark:bg-black/30 px-3.5 py-1.5 rounded-xl border border-[#C6A15B]/40">
                    {cardData.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-[#42101D] text-[#C6A15B] hover:bg-[#5B1727] transition-all cursor-pointer no-print"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#5B1727]/80 dark:text-[#F1E9DC]/70 mt-1.5">
                  Enter this 16-character code at online checkout or present it at any YAZHINI boutique.
                </p>
              </div>

              {/* Optical Concierge POS Barcode Representation */}
              <div className="pt-2 border-t border-[#C6A15B]/20">
                <span className="text-[9px] uppercase tracking-widest text-[#5B1727]/70 dark:text-[#C6A15B]/70 font-mono block mb-1">
                  In-Boutique Concierge Optical Scanner Barcode
                </span>
                <div className="h-10 max-w-sm flex items-center gap-[3px] bg-white p-2 rounded-lg border border-[#C6A15B]/30 opacity-90 overflow-hidden">
                  {Array.from({ length: 42 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-full bg-[#42101D] ${
                        idx % 5 === 0 ? 'w-1.5' : idx % 3 === 0 ? 'w-1' : idx % 2 === 0 ? 'w-0.5' : 'w-2'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-[#42101D] dark:text-[#FAF7F0] mt-1 block">
                  REF: {cardData.code}
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECURITY & PIN SAFEGUARD NOTICE
              ========================================================================= */}
          <div className="p-4 rounded-2xl bg-[#42101D]/5 dark:bg-[#42101D]/30 border border-[#C6A15B]/30 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[#42101D] dark:text-[#C6A15B] block font-inter">
                Private Security Credentials Safeguard
              </strong>
              <p className="text-[#5B1727]/80 dark:text-[#F1E9DC]/80 leading-relaxed font-sans">
                In strict adherence to RBI prepaid instrument regulations and luxury security standards, your <strong>4-digit security PIN</strong> is never printed on this certificate. The PIN was delivered privately to your recipient email or SMS. Keep the PIN confidential until you finalize your purchase.
              </p>
            </div>
          </div>

          {/* =========================================================================
              HOW TO REDEEM: STEP-BY-STEP INSTRUCTIONS
              ========================================================================= */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-inter font-bold text-[#42101D] dark:text-[#FAF7F0] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C6A15B]" />
              How to Redeem Your YAZHINI Gift Certificate
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] dark:bg-[#1E0C13] border border-[#C6A15B]/20 space-y-1">
                <span className="text-[10px] font-bold font-mono text-[#C6A15B] uppercase block">
                  Method 1 • Online Boutique Checkout
                </span>
                <p className="text-[#5B1727]/80 dark:text-[#F1E9DC]/80 leading-relaxed font-sans">
                  Browse our collection of 22K gold, diamond, or silver jewellery. At Checkout, expand <strong className="text-[#42101D] dark:text-white">"Apply Gift Card"</strong>, enter code <span className="font-mono text-[#42101D] dark:text-[#C6A15B]">{cardData.code}</span> and your 4-digit PIN.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F0] dark:bg-[#1E0C13] border border-[#C6A15B]/20 space-y-1">
                <span className="text-[10px] font-bold font-mono text-[#C6A15B] uppercase block">
                  Method 2 • Showroom Concierge Billing
                </span>
                <p className="text-[#5B1727]/80 dark:text-[#F1E9DC]/80 leading-relaxed font-sans">
                  Present this printed voucher or show the QR code on your mobile phone to our showroom manager. The balance is verified and debited against your invoice in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Direct Shop Redirection (Hidden on Print) */}
          <div className="pt-2 no-print">
            <Link
              to="/jewellery"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#42101D] via-[#5B1727] to-[#42101D] text-[#C6A15B] hover:text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.005] active:scale-[0.995] transition-all border border-[#C6A15B]/40"
            >
              <ShoppingBag className="w-4 h-4 text-[#C6A15B]" />
              Explore Fine Jewellery & Redeem Your Certificate
              <ArrowRight className="w-4 h-4 text-[#C6A15B]" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
