import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Ruler, Sparkles, Info } from 'lucide-react';
import { useScrollLock } from '../utils/useScrollLock';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'ring' | 'bangle';
  onSelectSize?: (size: string) => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'ring',
  onSelectSize
}) => {
  const [activeTab, setActiveTab] = useState<'ring' | 'bangle'>(defaultTab);

  useScrollLock(isOpen, { onEscape: onClose });

  if (!isOpen || typeof document === 'undefined') return null;

  const ringSizes = [
    { inSize: '10', diameterMm: '15.9 mm', circMm: '50.0 mm', recommendedFor: 'Petite / Pinky' },
    { inSize: '12', diameterMm: '16.5 mm', circMm: '51.8 mm', recommendedFor: 'Standard Small' },
    { inSize: '14', diameterMm: '17.2 mm', circMm: '54.0 mm', recommendedFor: 'Standard Medium' },
    { inSize: '16', diameterMm: '17.8 mm', circMm: '55.9 mm', recommendedFor: 'Most Popular' },
    { inSize: '18', diameterMm: '18.5 mm', circMm: '58.1 mm', recommendedFor: 'Standard Large' },
    { inSize: '20', diameterMm: '19.1 mm', circMm: '60.0 mm', recommendedFor: 'Men / Broad Ring' },
    { inSize: '22', diameterMm: '19.7 mm', circMm: '61.9 mm', recommendedFor: 'Comfort Fit Plus' }
  ];

  const bangleSizes = [
    { size: '2.2', innerDiameterMm: '54.0 mm', innerDiameterInches: '2.125"', fit: 'Extra Small' },
    { size: '2.4', innerDiameterMm: '57.2 mm', innerDiameterInches: '2.25"', fit: 'Small / Slender Wrist' },
    { size: '2.6', innerDiameterMm: '60.3 mm', innerDiameterInches: '2.375"', fit: 'Standard Medium (Most Common)' },
    { size: '2.8', innerDiameterMm: '63.5 mm', innerDiameterInches: '2.50"', fit: 'Comfort Large' },
    { size: '2.10', innerDiameterMm: '66.7 mm', innerDiameterInches: '2.625"', fit: 'Extra Large Kada' }
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#120D0F] border border-[#EAE5E6] dark:border-[#46343A] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col text-[#241B1D] dark:text-[#F8F3F4]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE5E6] dark:border-[#46343A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F8] dark:bg-[#20171A] border border-[#C6A15B]/40 flex items-center justify-center text-[#C6A15B]">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B] block">YAZHINI ATELIER</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#241B1D] dark:text-[#F8F3F4]">
                Precious Sizing &amp; Fit Guide
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#777174] hover:text-[#241B1D] dark:text-[#C1B4B8] dark:hover:text-[#F8F3F4] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#EAE5E6] dark:border-[#46343A] bg-[#FAF9F8] dark:bg-[#1A1215] px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('ring')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'ring'
                ? 'border-[#450817] text-[#450817] dark:border-[#D8B878] dark:text-[#D8B878]'
                : 'border-transparent text-[#777174] dark:text-[#C1B4B8] hover:text-[#241B1D] dark:hover:text-[#F8F3F4]'
            }`}
          >
            💍 Ring Sizing (Indian Standard)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bangle')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'bangle'
                ? 'border-[#450817] text-[#450817] dark:border-[#D8B878] dark:text-[#D8B878]'
                : 'border-transparent text-[#777174] dark:text-[#C1B4B8] hover:text-[#241B1D] dark:hover:text-[#F8F3F4]'
            }`}
          >
            ✨ Bangle &amp; Kada Sizing
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'ring' ? (
            <div className="space-y-5">
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-900 dark:text-amber-200 leading-relaxed text-[11px]">
                  <strong>Curator Tip:</strong> If measuring over the knuckle, choose the size that slides smoothly with slight resistance. All YAZHINI solitaire and band rings include complimentary 30-day resizing.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#EAE5E6] dark:border-[#46343A]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF9F8] dark:bg-[#1F1619] border-b border-[#EAE5E6] dark:border-[#46343A] text-[11px] uppercase tracking-wider text-[#777174] dark:text-[#C1B4B8]">
                      <th className="p-3">Indian Size</th>
                      <th className="p-3">Inside Diameter</th>
                      <th className="p-3">Circumference</th>
                      <th className="p-3">Fitting Advice</th>
                      {onSelectSize && <th className="p-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE5E6] dark:divide-[#46343A]">
                    {ringSizes.map((row) => (
                      <tr key={row.inSize} className="hover:bg-stone-50 dark:hover:bg-[#20171A] transition-colors">
                        <td className="p-3 font-bold text-[#450817] dark:text-[#D8B878]">Size {row.inSize}</td>
                        <td className="p-3 font-mono">{row.diameterMm}</td>
                        <td className="p-3 font-mono">{row.circMm}</td>
                        <td className="p-3 text-[#777174] dark:text-[#C1B4B8]">{row.recommendedFor}</td>
                        {onSelectSize && (
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSize(row.inSize);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] font-semibold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Select
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-sm text-[#241B1D] dark:text-[#F8F3F4]">How to Measure at Home</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[#777174] dark:text-[#C1B4B8] leading-relaxed">
                  <li>Wrap a piece of thin non-stretchy string or strip of paper snugly around the base of your finger.</li>
                  <li>Mark the spot where the ends overlap with a fine pen.</li>
                  <li>Lay the string flat against a metric ruler to read the millimetres (inner circumference).</li>
                  <li>Match the millimetres with the chart above. If you fall between two sizes, we suggest choosing the larger size.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-900 dark:text-amber-200 leading-relaxed text-[11px]">
                  <strong>Bangle Sizing:</strong> Indian bangle sizes denote inner diameter in inches and annas (e.g. 2.6 is 2 inches and 6/16th of an inch = 2.375"). Measure across an existing well-fitting bangle’s inside rim.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#EAE5E6] dark:border-[#46343A]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF9F8] dark:bg-[#1F1619] border-b border-[#EAE5E6] dark:border-[#46343A] text-[11px] uppercase tracking-wider text-[#777174] dark:text-[#C1B4B8]">
                      <th className="p-3">Indian Size</th>
                      <th className="p-3">Inner Diameter (mm)</th>
                      <th className="p-3">Inner Diameter (Inches)</th>
                      <th className="p-3">Typical Fit</th>
                      {onSelectSize && <th className="p-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE5E6] dark:divide-[#46343A]">
                    {bangleSizes.map((row) => (
                      <tr key={row.size} className="hover:bg-stone-50 dark:hover:bg-[#20171A] transition-colors">
                        <td className="p-3 font-bold text-[#450817] dark:text-[#D8B878]">Size {row.size}</td>
                        <td className="p-3 font-mono">{row.innerDiameterMm}</td>
                        <td className="p-3 font-mono">{row.innerDiameterInches}</td>
                        <td className="p-3 text-[#777174] dark:text-[#C1B4B8]">{row.fit}</td>
                        {onSelectSize && (
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSize(row.size);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] font-semibold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Select
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-sm text-[#241B1D] dark:text-[#F8F3F4]">Measuring Your Hand for Bangles</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[#777174] dark:text-[#C1B4B8] leading-relaxed">
                  <li>Bring your thumb and little finger together, simulating slipping on a bangle.</li>
                  <li>Wrap a measuring tape or string around the widest part of your hand across knuckles.</li>
                  <li>Divide the measurement by 3.14 to find the required inner diameter, or compare directly with an existing bangle.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#EAE5E6] dark:border-[#46343A] bg-[#FAF9F8] dark:bg-[#1A1215] flex items-center justify-between">
          <span className="text-[11px] text-[#777174] dark:text-[#C1B4B8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C6A15B]" /> Custom bespoke sizes crafted on request at zero extra surcharge.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#450817] hover:bg-[#6A1B2B] text-white dark:bg-[#D8B878] dark:hover:bg-[#E4CC9C] dark:text-[#120D0F] rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
