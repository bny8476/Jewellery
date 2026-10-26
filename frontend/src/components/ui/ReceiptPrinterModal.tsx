import React, { useState, useEffect } from 'react';
import { 
  Printer, CheckCircle2, AlertCircle, RefreshCw, 
  Download, X, ShieldCheck
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';
import { 
  type ThermalReceiptData, 
  recordReceiptPrintAudit, 
  generateThermalReceiptPDF 
} from '../../utils/thermalReceiptUtils';

export interface ReceiptPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ThermalReceiptData | null;
  isReprint?: boolean;
  autoPrintOnMount?: boolean;
  onPrintSuccess?: () => void;
}

export type PrintState = 'idle' | 'preparing' | 'printing' | 'spooling' | 'completed' | 'cancelled' | 'failed';

export const ReceiptPrinterModal: React.FC<ReceiptPrinterModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  isReprint = false,
  autoPrintOnMount = false,
  onPrintSuccess
}) => {
  const [printState, setPrintState] = useState<PrintState>('idle');
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [paperRevealed, setPaperRevealed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to print thermal receipt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && receiptData) {
      setPrintState('idle');
      setPaperRevealed(false);
      setErrorMessage(null);
      setStatusMessage(
        receiptData.isReprint || isReprint
          ? 'Ready to print duplicate receipt (Audit-tracked)'
          : 'Ready to print original thermal receipt'
      );

      if (autoPrintOnMount) {
        const timer = setTimeout(() => {
          handlePrint();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, receiptData]);

  if (!isOpen || !receiptData) return null;

  const handlePrint = async () => {
    if (printState === 'preparing' || printState === 'printing' || printState === 'spooling') {
      return; // Prevent duplicate requests
    }

    setErrorMessage(null);
    setPrintState('preparing');
    setStatusMessage('Preparing thermal print buffer...');

    // Micro-delay for button feedback
    await new Promise(resolve => setTimeout(resolve, 150));

    // Step 2: Printing & Paper Emergence
    setPrintState('printing');
    setStatusMessage('Feeding thermal paper from printer slot...');
    setPaperRevealed(true);

    // Easing duration: ~900ms for emergence (or 0ms if reduced motion)
    const feedDelay = prefersReducedMotion ? 100 : 900;
    await new Promise(resolve => setTimeout(resolve, feedDelay));

    // Step 3: Trigger Browser Print Spooler
    setPrintState('spooling');
    setStatusMessage('Spooling to system receipt printer...');

    try {
      let printCompletedDispatched = false;

      const handleAfterPrint = () => {
        printCompletedDispatched = true;
        window.removeEventListener('afterprint', handleAfterPrint);
        
        recordReceiptPrintAudit({
          receiptNumber: receiptData.receiptNumber,
          transactionId: receiptData.transactionId,
          type: receiptData.transactionId?.startsWith('sale-') ? 'POS' : 'ORDER',
          status: 'SUCCESS',
          mode: 'BROWSER_PRINT',
          width: paperWidth,
          cashier: receiptData.cashierName,
          note: isReprint || receiptData.isReprint ? 'Reprint / Duplicate' : 'Original Print'
        });

        setPrintState('completed');
        setStatusMessage('Receipt print job sent to spooler successfully.');
        onPrintSuccess?.();
      };

      window.addEventListener('afterprint', handleAfterPrint);

      // Trigger native browser print
      window.print();

      // Fallback timeout in case afterprint does not fire (Safari/Headless)
      setTimeout(() => {
        if (!printCompletedDispatched) {
          window.removeEventListener('afterprint', handleAfterPrint);
          setPrintState('completed');
          setStatusMessage('Print request dispatched to browser spooler.');
          recordReceiptPrintAudit({
            receiptNumber: receiptData.receiptNumber,
            transactionId: receiptData.transactionId,
            type: receiptData.transactionId?.startsWith('sale-') ? 'POS' : 'ORDER',
            status: 'SUCCESS',
            mode: 'BROWSER_PRINT',
            width: paperWidth,
            cashier: receiptData.cashierName
          });
          onPrintSuccess?.();
        }
      }, 1800);

    } catch (err: any) {
      console.error('Receipt print failed:', err);
      setPrintState('failed');
      setErrorMessage(err.message || 'Printer communication error');
      setStatusMessage('Print operation failed. Original sale is safe.');

      recordReceiptPrintAudit({
        receiptNumber: receiptData.receiptNumber,
        transactionId: receiptData.transactionId,
        type: receiptData.transactionId?.startsWith('sale-') ? 'POS' : 'ORDER',
        status: 'FAILED',
        mode: 'BROWSER_PRINT',
        width: paperWidth,
        cashier: receiptData.cashierName,
        note: err.message
      });
    }
  };

  const handleDownloadPDF = () => {
    try {
      generateThermalReceiptPDF(receiptData, paperWidth === '80mm' ? 80 : 58);
      recordReceiptPrintAudit({
        receiptNumber: receiptData.receiptNumber,
        transactionId: receiptData.transactionId,
        type: receiptData.transactionId?.startsWith('sale-') ? 'POS' : 'ORDER',
        status: 'SUCCESS',
        mode: 'PDF_DOWNLOAD',
        width: paperWidth,
        cashier: receiptData.cashierName,
        note: 'Vector Thermal PDF downloaded'
      });
      setStatusMessage('Thermal receipt PDF downloaded successfully.');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setErrorMessage('Failed to generate PDF: ' + err.message);
    }
  };

  const handleManualCancel = () => {
    setPrintState('cancelled');
    setStatusMessage('Print operation cancelled by operator.');
    recordReceiptPrintAudit({
      receiptNumber: receiptData.receiptNumber,
      transactionId: receiptData.transactionId,
      type: receiptData.transactionId?.startsWith('sale-') ? 'POS' : 'ORDER',
      status: 'CANCELLED',
      mode: 'BROWSER_PRINT',
      width: paperWidth,
      cashier: receiptData.cashierName
    });
  };

  const isPrintingActive = printState === 'preparing' || printState === 'printing' || printState === 'spooling';
  const showReprintBadge = isReprint || receiptData.isReprint;

  return (
    <>
      {/* 1. INTERACTIVE MODAL OVERLAY */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-printer-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto print:hidden"
      >
        <div className="relative w-full max-w-xl bg-[#1E1920] border border-[#C9A45C]/30 rounded-3xl p-5 sm:p-7 shadow-2xl text-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Bar: Title, Width Switcher & Close */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#351018] border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C] shadow-inner">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C9A45C] block">
                  Showroom POS Hardware
                </span>
                <h3 id="receipt-printer-title" className="text-base sm:text-lg font-serif font-bold text-[#F7F4EF]">
                  Thermal Receipt Printer
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Paper Width Toggle */}
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  disabled={isPrintingActive}
                  className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                    paperWidth === '80mm'
                      ? 'bg-[#C9A45C] text-black shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Standard Showroom 80mm Roll (48 Columns)"
                >
                  80mm
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  disabled={isPrintingActive}
                  className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                    paperWidth === '58mm'
                      ? 'bg-[#C9A45C] text-black shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Compact Counter 58mm Roll (32 Columns)"
                >
                  58mm
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isPrintingActive}
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Printer Dialog"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. THE TACTILE THERMAL PRINTER CHASSIS & EMERGING PAPER */}
          <div className="relative flex flex-col items-center justify-center pt-2 pb-1 overflow-hidden">
            
            {/* PRINTER MOUTH / FEED SLOT CHAMBER */}
            <div className="w-full max-w-[420px] relative z-20 flex flex-col items-center">
              {/* Top Lid / Tear Bar */}
              <div className="w-full h-8 bg-gradient-to-b from-[#2B252E] to-[#1C171F] rounded-t-xl border-t border-x border-[#C9A45C]/30 flex items-center justify-between px-4 shadow-md">
                {/* Brand Engraving */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C9A45C]/40"></span>
                  <span className="text-[9px] font-mono tracking-widest uppercase text-[#C9A45C] font-bold">
                    YAZHINI POS-80T
                  </span>
                </div>
                {/* Hardware Status LED */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/50 uppercase">
                    {printState === 'completed' ? 'READY' : isPrintingActive ? 'PRINTING' : printState === 'failed' ? 'ERROR' : 'ONLINE'}
                  </span>
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                        printState === 'completed'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]'
                          : isPrintingActive
                          ? 'bg-amber-400 animate-pulse shadow-[0_0_10px_#FBBF24]'
                          : printState === 'failed' || printState === 'cancelled'
                          ? 'bg-rose-500 shadow-[0_0_8px_#F43F5E]'
                          : 'bg-[#C9A45C] shadow-[0_0_6px_#C9A45C]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Feed Slot / Serrated Dark Chamber */}
              <div className="w-[94%] h-3 bg-[#0D0A0F] border-b border-[#351018] relative shadow-inner">
                {/* Subtle serrated tear teeth */}
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A45C]/50 to-transparent"></div>
              </div>
            </div>

            {/* EMERGING THERMAL RECEIPT PAPER */}
            <div 
              className={`relative z-10 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                paperRevealed || prefersReducedMotion
                  ? 'max-h-[360px] opacity-100 translate-y-0'
                  : 'max-h-[70px] opacity-90 translate-y-2'
              } overflow-y-auto custom-scrollbar`}
              style={{
                width: paperWidth === '80mm' ? '360px' : '280px',
                transitionProperty: prefersReducedMotion ? 'none' : 'max-height, transform, opacity'
              }}
            >
              {/* Physical Paper Container */}
              <div className="bg-[#FAF8F5] text-[#1E1B18] font-mono p-4 sm:p-5 rounded-b-lg shadow-2xl border-x border-b border-black/10 select-none relative">
                
                {/* Perforated top tear edge effect */}
                <div className="absolute -top-1 inset-x-0 h-1 bg-[#FAF8F5] [mask-image:radial-gradient(circle,black_2px,transparent_2px)] [mask-size:6px_6px]"></div>

                {/* Reprint Watermark Banner */}
                {showReprintBadge && (
                  <div className="mb-3 py-1 px-2 border-2 border-dashed border-rose-600/70 text-rose-700 bg-rose-50 rounded text-center">
                    <span className="font-bold text-[10px] tracking-widest block uppercase">
                      *** DUPLICATE / REPRINT RECEIPT ***
                    </span>
                    <span className="text-[8px] block opacity-80">
                      Original Transaction: {receiptData.receiptNumber}
                    </span>
                  </div>
                )}

                {/* Receipt Header */}
                <div className="text-center space-y-0.5 border-b border-dashed border-black/30 pb-3">
                  <div className="flex items-center justify-center gap-1 text-[#8A6A27] font-bold text-xs tracking-wider">
                    <span>❖</span>
                    <span>{receiptData.brandName.toUpperCase()}</span>
                    <span>❖</span>
                  </div>
                  {receiptData.tagline && (
                    <p className="text-[8px] text-black/60 uppercase tracking-widest">{receiptData.tagline}</p>
                  )}
                  {receiptData.branchName && (
                    <p className="text-[9px] font-bold text-black/80">{receiptData.branchName}</p>
                  )}
                  {receiptData.address && (
                    <p className="text-[8px] text-black/60">{receiptData.address}</p>
                  )}
                  <p className="text-[8px] text-black/60">
                    Ph: {receiptData.phone || '+91 98765 43210'} • GST: {receiptData.gstin || '33AAAAA0000A1Z5'}
                  </p>
                  {receiptData.bisLicence && (
                    <p className="text-[8px] text-black/60">BIS Licence: {receiptData.bisLicence}</p>
                  )}
                </div>

                {/* Meta Details */}
                <div className="py-2.5 text-[9px] border-b border-dashed border-black/30 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-black/60">Receipt / Inv #:</span>
                    <span className="font-bold text-black">{receiptData.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Date & Time:</span>
                    <span>{new Date(receiptData.dateTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  {receiptData.cashierName && (
                    <div className="flex justify-between">
                      <span className="text-black/60">Cashier:</span>
                      <span>{receiptData.cashierName}</span>
                    </div>
                  )}
                  {receiptData.customerName && (
                    <div className="flex justify-between">
                      <span className="text-black/60">Client:</span>
                      <span className="font-bold">{receiptData.customerName}</span>
                    </div>
                  )}
                  {receiptData.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-black/60">Phone:</span>
                      <span>{receiptData.customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="py-2.5 border-b border-dashed border-black/30">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider font-bold text-black/50 mb-1.5 pb-0.5 border-b border-black/10">
                    <span className="w-1/2">Item / Karat</span>
                    <span className="w-1/4 text-center">Qty / Wt</span>
                    <span className="w-1/4 text-right">Price</span>
                  </div>
                  <div className="space-y-1.5 text-[9px]">
                    {receiptData.items.map((it, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-semibold">
                          <span className="w-1/2 truncate pr-1">{it.name}</span>
                          <span className="w-1/4 text-center text-black/70">
                            {it.qty} {it.grossWeight ? `(${it.grossWeight}g)` : ''}
                          </span>
                          <span className="w-1/4 text-right font-bold">
                            {formatCurrencyINR(it.total)}
                          </span>
                        </div>
                        {it.purity && (
                          <div className="text-[8px] text-black/50 pl-1">
                            Purity: {it.purity} {it.makingCharge ? `• MC: ${formatCurrencyINR(it.makingCharge)}` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="py-2.5 border-b border-dashed border-black/30 space-y-1 text-[9px]">
                  <div className="flex justify-between text-black/70">
                    <span>Subtotal:</span>
                    <span>{formatCurrencyINR(receiptData.subtotal)}</span>
                  </div>
                  {receiptData.makingChargesTotal && receiptData.makingChargesTotal > 0 && (
                    <div className="flex justify-between text-black/70">
                      <span>Making Charges:</span>
                      <span>{formatCurrencyINR(receiptData.makingChargesTotal)}</span>
                    </div>
                  )}
                  {receiptData.hallmarkingFee && receiptData.hallmarkingFee > 0 && (
                    <div className="flex justify-between text-black/70">
                      <span>BIS Hallmarking (Laser HUID):</span>
                      <span>{formatCurrencyINR(receiptData.hallmarkingFee)}</span>
                    </div>
                  )}
                  {receiptData.discount && receiptData.discount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>Discount / Privilege:</span>
                      <span>- {formatCurrencyINR(receiptData.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-black/70">
                    <span>GST ({receiptData.taxRatePercent || 3}% CGST+SGST):</span>
                    <span>{formatCurrencyINR(receiptData.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-black/20 text-[#8A6A27]">
                    <span>GRAND TOTAL:</span>
                    <span>{formatCurrencyINR(receiptData.grandTotal)}</span>
                  </div>
                </div>

                {/* Payment & Settlement */}
                <div className="py-2.5 border-b border-dashed border-black/30 text-[9px] space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Tender Mode:</span>
                    <span className="uppercase">{receiptData.paymentMethod}</span>
                  </div>
                  {receiptData.paymentReference && (
                    <div className="flex justify-between text-black/60">
                      <span>Ref / Auth:</span>
                      <span className="truncate max-w-[150px]">{receiptData.paymentReference}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-black/70">
                    <span>Status:</span>
                    <span className="font-bold text-emerald-700">{receiptData.paymentStatus}</span>
                  </div>
                </div>

                {/* Barcode & Verification */}
                <div className="py-3 text-center space-y-1">
                  <div className="flex justify-center items-center h-8 gap-[2px]">
                    {Array.from({ length: 32 }).map((_, bIdx) => (
                      <span
                        key={bIdx}
                        className={`h-full inline-block bg-black ${
                          bIdx % 4 === 0 ? 'w-[2.5px]' : bIdx % 2 === 0 ? 'w-[1.2px]' : 'w-[0.8px]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[8px] font-mono tracking-widest text-black/60">
                    {receiptData.receiptNumber}
                  </p>
                </div>

                {/* Legal & Policy Terms */}
                <div className="pt-2 text-[7px] text-black/50 border-t border-dashed border-black/20 space-y-0.5">
                  <p className="font-bold text-black/70 uppercase text-center">YAZHINI Guarantee & Return Policy</p>
                  {receiptData.terms?.map((term, tIdx) => (
                    <p key={tIdx}>{term}</p>
                  ))}
                  <p className="text-center font-bold text-black/70 pt-1">
                    THANK YOU FOR SHOPPING AT YAZHINI FINE JEWELS
                  </p>
                </div>
              </div>
            </div>

            {/* PRINTER BOTTOM BASE */}
            <div className="w-full max-w-[420px] h-6 bg-[#161219] rounded-b-xl border-b border-x border-[#C9A45C]/20 shadow-xl flex items-center justify-center px-4">
              <span className="w-16 h-1 bg-white/10 rounded-full"></span>
            </div>
          </div>

          {/* 3. STATUS & ACCURACY BANNER */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {printState === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isPrintingActive ? (
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
              ) : printState === 'failed' || printState === 'cancelled' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[#C9A45C] shrink-0" />
              )}
              <div className="leading-tight">
                <span className="text-[11px] text-white/90 font-medium block">
                  {statusMessage}
                </span>
                {errorMessage && (
                  <span className="text-[10px] text-rose-400 block mt-0.5">{errorMessage}</span>
                )}
              </div>
            </div>

            {isPrintingActive && (
              <span className="text-[10px] font-mono uppercase bg-[#C9A45C]/20 text-[#C9A45C] px-2 py-0.5 rounded-full border border-[#C9A45C]/30 animate-pulse">
                Active Spooler
              </span>
            )}
          </div>

          {/* 4. ACTIONS / BUTTON BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* PDF Backup Download */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isPrintingActive}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                title="Download thermal roll formatted PDF backup"
              >
                <Download className="w-4 h-4 text-[#C9A45C]" />
                <span>Download PDF</span>
              </button>

              {/* Close or Cancel Button */}
              {isPrintingActive ? (
                <button
                  type="button"
                  onClick={handleManualCancel}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all"
                  title="Cancel active print operation"
                >
                  Cancel Spooling
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/5 text-white/70 text-xs font-semibold transition-all"
                >
                  Done / Close
                </button>
              )}
            </div>

            {/* Primary Action Button: Print or Retry */}
            <div className="w-full sm:w-auto flex items-center gap-2">
              {printState === 'failed' || printState === 'cancelled' ? (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold inline-flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Printing</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isPrintingActive}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                    printState === 'completed'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#C9A45C] hover:brightness-110 text-black'
                  } disabled:opacity-60 disabled:pointer-events-none`}
                >
                  {isPrintingActive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Printing Receipt...</span>
                    </>
                  ) : printState === 'completed' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Print Another Copy</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>{showReprintBadge ? 'Reprint Thermal Receipt' : 'Print Receipt'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. DEDICATED NATIVE PRINT PORTAL FOR CLEAN THERMAL PRINTERS */}
      <div 
        id="thermal-receipt-printable" 
        className="hidden print:block thermal-receipt-printable-portal"
        style={{
          width: paperWidth === '80mm' ? '72mm' : '48mm',
          margin: '0 auto',
          color: '#000000',
          backgroundColor: '#FFFFFF',
          fontFamily: 'monospace, "Courier New", Courier'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0' }}>{receiptData.brandName.toUpperCase()}</h2>
          {receiptData.tagline && <p style={{ fontSize: '7px', margin: '2px 0' }}>{receiptData.tagline}</p>}
          {receiptData.branchName && <p style={{ fontSize: '8px', fontWeight: 'bold', margin: '2px 0' }}>{receiptData.branchName}</p>}
          {receiptData.address && <p style={{ fontSize: '7px', margin: '2px 0' }}>{receiptData.address}</p>}
          <p style={{ fontSize: '7px', margin: '2px 0' }}>
            Ph: {receiptData.phone || '+91 98765 43210'} • GSTIN: {receiptData.gstin || '33AAAAA0000A1Z5'}
          </p>
          {receiptData.bisLicence && <p style={{ fontSize: '7px', margin: '2px 0' }}>BIS: {receiptData.bisLicence}</p>}
        </div>

        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', fontSize: '8px', marginBottom: '6px' }}>
          {showReprintBadge && (
            <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#000', margin: '2px 0' }}>
              *** DUPLICATE / REPRINT ***
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Receipt #: {receiptData.receiptNumber}</span>
            <span>Date: {new Date(receiptData.dateTime).toLocaleDateString('en-IN')}</span>
          </div>
          {receiptData.cashierName && <div>Cashier: {receiptData.cashierName}</div>}
          {receiptData.customerName && <div>Patron : {receiptData.customerName} ({receiptData.customerPhone || 'Walk-in'})</div>}
        </div>

        <table style={{ width: '100%', fontSize: '8px', borderCollapse: 'collapse', marginBottom: '6px' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed #000', textAlign: 'left' }}>
              <th style={{ padding: '2px 0' }}>Item</th>
              <th style={{ padding: '2px 0', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '2px 0', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ padding: '2px 0' }}>
                  <div style={{ fontWeight: 'bold' }}>{it.name}</div>
                  {it.purity && <div style={{ fontSize: '7px' }}>{it.purity} • {it.grossWeight}g</div>}
                </td>
                <td style={{ padding: '2px 0', textAlign: 'center', verticalAlign: 'top' }}>{it.qty}</td>
                <td style={{ padding: '2px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                  {formatCurrencyINR(it.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', fontSize: '8px', lineHeight: '1.4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{formatCurrencyINR(receiptData.subtotal)}</span>
          </div>
          {receiptData.makingChargesTotal && receiptData.makingChargesTotal > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Making Chg:</span>
              <span>{formatCurrencyINR(receiptData.makingChargesTotal)}</span>
            </div>
          ) : null}
          {receiptData.hallmarkingFee && receiptData.hallmarkingFee > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>BIS Hallmark:</span>
              <span>{formatCurrencyINR(receiptData.hallmarkingFee)}</span>
            </div>
          ) : null}
          {receiptData.discount && receiptData.discount > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount:</span>
              <span>- {formatCurrencyINR(receiptData.discount)}</span>
            </div>
          ) : null}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>GST ({receiptData.taxRatePercent || 3}%):</span>
            <span>{formatCurrencyINR(receiptData.taxAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid #000', marginTop: '3px', paddingTop: '3px' }}>
            <span>TOTAL:</span>
            <span>{formatCurrencyINR(receiptData.grandTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span>Paid Via: {receiptData.paymentMethod}</span>
            <span>Status: {receiptData.paymentStatus}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '7px' }}>
          <p style={{ margin: '2px 0' }}>* {receiptData.receiptNumber} *</p>
          <p style={{ margin: '4px 0 2px' }}>Certified BIS 100% Hallmarked 22K (916) Jewellery</p>
          <p style={{ margin: '2px 0' }}>Exchange within 7 days against authentic tax invoice</p>
          <p style={{ fontWeight: 'bold', margin: '4px 0 0' }}>THANK YOU FOR YOUR PATRONAGE</p>
        </div>
      </div>
    </>
  );
};

export default ReceiptPrinterModal;
