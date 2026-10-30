import React from 'react';
import { Ruler, Sparkles, Gem, Scale, Check, Plus, Minus } from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';

export type GoldPurityOption = '24K' | '22K' | '18K' | '14K';
export type MetalColorOption = 'yellow_gold' | 'rose_gold' | 'white_gold' | 'platinum';
export type StoneGradeOption = 'natural_vvs' | 'lab_grown_cvd' | 'gemstone_accent';

interface ProductCustomizerProps {
  product: {
    category: string;
    metal_type: string;
    weight: number;
    purity?: string;
    stone_details?: string;
  };
  selectedPurity: GoldPurityOption;
  onChangePurity: (purity: GoldPurityOption) => void;
  selectedMetalColor: MetalColorOption;
  onChangeMetalColor: (color: MetalColorOption) => void;
  selectedWeight: number;
  onChangeWeight: (weight: number) => void;
  selectedSize: string;
  onChangeSize: (size: string) => void;
  selectedStoneGrade: StoneGradeOption;
  onChangeStoneGrade: (grade: StoneGradeOption) => void;
  quantity: number;
  onChangeQuantity: (qty: number) => void;
  maxQuantity?: number;
  onOpenSizeGuide: () => void;
}

export const ProductCustomizer: React.FC<ProductCustomizerProps> = ({
  product,
  selectedPurity,
  onChangePurity,
  selectedMetalColor,
  onChangeMetalColor,
  selectedWeight,
  onChangeWeight,
  selectedSize,
  onChangeSize,
  selectedStoneGrade,
  onChangeStoneGrade,
  quantity,
  onChangeQuantity,
  maxQuantity = 10,
  onOpenSizeGuide
}) => {
  const isRing = Boolean(product.category?.toLowerCase().includes('ring'));
  const isBangle = Boolean(
    product.category?.toLowerCase().includes('bangle') ||
    product.category?.toLowerCase().includes('kada') ||
    product.category?.toLowerCase().includes('bracelet')
  );
  const isNecklace = Boolean(
    product.category?.toLowerCase().includes('necklace') ||
    product.category?.toLowerCase().includes('chain') ||
    product.category?.toLowerCase().includes('mangalsutra')
  );
  const isDiamond = Boolean(
    product.category?.toLowerCase().includes('diamond') ||
    product.stone_details?.toLowerCase().includes('diamond')
  );

  // Available Purity tiers
  const purityOptions: Array<{ id: GoldPurityOption; label: string; badge: string }> = [
    { id: '22K', label: '22K Gold', badge: 'BIS 916' },
    { id: '18K', label: '18K Gold', badge: 'Diamond Standard' },
    { id: '14K', label: '14K Gold', badge: 'Modern Luxe' },
    { id: '24K', label: '24K Bullion', badge: '999 Pure' }
  ];

  // Metal Color options
  const metalColors: Array<{ id: MetalColorOption; name: string; bgClass: string }> = [
    { id: 'yellow_gold', name: 'Yellow Gold', bgClass: 'bg-[#E5C158]' },
    { id: 'rose_gold', name: 'Rose Gold', bgClass: 'bg-[#E8A598]' },
    { id: 'white_gold', name: 'White Gold', bgClass: 'bg-[#E6E8EA]' },
    { id: 'platinum', name: 'Platinum 950', bgClass: 'bg-[#D2D7DF]' }
  ];

  // Dynamic Weight Presets based on Product baseline weight
  const baseWeight = product.weight || 10;
  const weightPresets = Array.from(
    new Set([
      Math.max(1, Math.round(baseWeight * 0.7 * 10) / 10),
      baseWeight,
      Math.round(baseWeight * 1.25 * 10) / 10,
      Math.round(baseWeight * 1.5 * 10) / 10
    ])
  ).sort((a, b) => a - b);

  // Sizing tiers
  const ringSizes = ['10', '12', '14', '16', '18', '20', '22'];
  const bangleSizes = ['2.2', '2.4', '2.6', '2.8', '2.10'];
  const necklaceLengths = ['16"', '18"', '20"', '22"', '24"'];

  return (
    <div className="space-y-6 pt-2 select-none">
      {/* 1. Metal Purity Selector */}
      {product.metal_type === 'gold' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#252329] dark:text-[#FAF7F1] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C49A50]" />
              <span>Gold Purity &amp; Hallmarking</span>
            </span>
            <span className="text-[11px] font-mono text-[#5B1022] dark:text-[#C49A50] font-bold">
              {selectedPurity} Selected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {purityOptions.map((opt) => {
              const isSelected = selectedPurity === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangePurity(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[#5B1022] dark:border-[#C49A50] bg-[#FAF7F1] dark:bg-[#1F1418] shadow-xs'
                      : 'border-[#E7DEC8] dark:border-[#3E2D34] bg-white dark:bg-[#170E12] hover:border-[#C49A50]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#5B1022] dark:text-[#C49A50]' : 'text-[#252329] dark:text-[#FAF7F1]'}`}>
                      {opt.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#5B1022] dark:text-[#C49A50]" />}
                  </div>
                  <span className="text-[9.5px] text-[#716A6C] dark:text-[#B5ABB0] block mt-0.5">
                    {opt.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Metal Color Palette Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">
            Metal Finish &amp; Color
          </span>
          <span className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0] capitalize">
            {selectedMetalColor.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {metalColors.map((color) => {
            const isSelected = selectedMetalColor === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onChangeMetalColor(color.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#5B1022] dark:border-[#C49A50] bg-[#FAF7F1] dark:bg-[#1F1418] font-bold text-[#5B1022] dark:text-[#C49A50] shadow-xs'
                    : 'border-[#E7DEC8] dark:border-[#3E2D34] bg-white dark:bg-[#170E12] text-[#252329] dark:text-[#FAF7F1] hover:border-[#C49A50]/60'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${color.bgClass} border border-black/15 shadow-2xs shrink-0`} />
                <span className="text-[11px]">{color.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Weight Variant Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#252329] dark:text-[#FAF7F1] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#C49A50]" />
            <span>Gross Metal Weight</span>
          </span>
          <span className="text-[11px] text-[#716A6C] dark:text-[#B5ABB0]">
            Net Weight: ~{Math.round(selectedWeight * 0.94 * 10) / 10}g
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {weightPresets.map((w) => {
            const isSelected = selectedWeight === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => onChangeWeight(w)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#5B1022] text-white dark:bg-[#C49A50] dark:text-[#140E10] border-[#5B1022] dark:border-[#C49A50] shadow-xs scale-102'
                    : 'bg-white dark:bg-[#170E12] text-[#252329] dark:text-[#FAF7F1] border-[#E7DEC8] dark:border-[#3E2D34] hover:border-[#5B1022] dark:hover:border-[#C49A50]'
                }`}
              >
                {w} grams
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sizing Section (Rings, Bangles, Necklaces) */}
      {(isRing || isBangle || isNecklace) && (
        <div className="space-y-2 pt-2 border-t border-[#E7DEC8] dark:border-[#3E2D34]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#252329] dark:text-[#FAF7F1]">
              {isRing && 'Ring Size (Indian Standard)'}
              {isBangle && 'Bangle / Kada Size (Anna Standard)'}
              {isNecklace && 'Necklace Length & Fit'}
            </span>
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="text-[11px] text-[#5B1022] dark:text-[#C49A50] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Sizing Guide &amp; Fit Advisor</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(isRing ? ringSizes : isBangle ? bangleSizes : necklaceLengths).map((sz) => {
              const isSelected = selectedSize === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onChangeSize(sz)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#5B1022] text-white dark:bg-[#C49A50] dark:text-[#140E10] border-[#5B1022] dark:border-[#C49A50] shadow-xs scale-102'
                      : 'bg-white dark:bg-[#170E12] text-[#252329] dark:text-[#FAF7F1] border-[#E7DEC8] dark:border-[#3E2D34] hover:border-[#5B1022] dark:hover:border-[#C49A50]'
                  }`}
                >
                  Size {sz}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Stone / Diamond Grade Selection (where applicable) */}
      {isDiamond && (
        <div className="space-y-2 pt-2 border-t border-[#E7DEC8] dark:border-[#3E2D34]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#252329] dark:text-[#FAF7F1] flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-[#C49A50]" />
              <span>Diamond &amp; Gemstone Grade</span>
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              IGI / GIA Certified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeStoneGrade('natural_vvs')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedStoneGrade === 'natural_vvs'
                  ? 'border-[#5B1022] dark:border-[#C49A50] bg-[#FAF7F1] dark:bg-[#1F1418] shadow-xs'
                  : 'border-[#E7DEC8] dark:border-[#3E2D34] bg-white dark:bg-[#170E12]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#252329] dark:text-[#FAF7F1]">Natural VVS-EF</span>
                {selectedStoneGrade === 'natural_vvs' && <Check className="w-3.5 h-3.5 text-[#5B1022] dark:text-[#C49A50]" />}
              </div>
              <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] block mt-0.5">
                Rare mined natural diamonds with flawless brilliance
              </span>
            </button>

            <button
              type="button"
              onClick={() => onChangeStoneGrade('lab_grown_cvd')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedStoneGrade === 'lab_grown_cvd'
                  ? 'border-[#5B1022] dark:border-[#C49A50] bg-[#FAF7F1] dark:bg-[#1F1418] shadow-xs'
                  : 'border-[#E7DEC8] dark:border-[#3E2D34] bg-white dark:bg-[#170E12]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#252329] dark:text-[#FAF7F1]">Eco-Luxe CVD/HPHT</span>
                {selectedStoneGrade === 'lab_grown_cvd' && <Check className="w-3.5 h-3.5 text-[#5B1022] dark:text-[#C49A50]" />}
              </div>
              <span className="text-[10px] text-[#716A6C] dark:text-[#B5ABB0] block mt-0.5">
                Sustainable lab-grown diamonds with identical chemistry
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Quantity Counter */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E7DEC8] dark:border-[#3E2D34]">
        <div>
          <span className="text-xs font-semibold text-[#252329] dark:text-[#FAF7F1] block">
            Quantity
          </span>
          <span className="text-[10.5px] text-[#716A6C] dark:text-[#B5ABB0]">
            Maximum {maxQuantity} pieces per patron order
          </span>
        </div>

        <div className="inline-flex items-center border border-[#E7DEC8] dark:border-[#3E2D34] rounded-xl bg-white dark:bg-[#170E12] p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716A6C] dark:text-[#B5ABB0] hover:bg-[#FAF7F1] dark:hover:bg-[#251A20] disabled:opacity-40 cursor-pointer transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center font-bold text-xs text-[#252329] dark:text-[#FAF7F1]">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onChangeQuantity(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716A6C] dark:text-[#B5ABB0] hover:bg-[#FAF7F1] dark:hover:bg-[#251A20] disabled:opacity-40 cursor-pointer transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
