import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Gem, 
  Award, 
  Users, 
  Coins, 
  ArrowUpDown, 
  SlidersHorizontal, 
  ChevronDown, 
  Check, 
  X, 
  RotateCcw, 
  Sparkles,
  Search
} from 'lucide-react';

export interface LuxuryFilterProps {
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedMetal: string;
  setSelectedMetal: (val: string) => void;
  selectedPurity: string;
  setSelectedPurity: (val: string) => void;
  selectedGender: string;
  setSelectedGender: (val: string) => void;
  budgetFilter: string;
  setBudgetFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCollection: string;
  setSelectedCollection: (val: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  totalResults: number;
  totalItems: number;
}

export const CATEGORY_OPTIONS = [
  { value: 'All', label: 'All Categories' },
  { value: 'Necklaces', label: 'Necklaces & Harams' },
  { value: 'Jewellery sets', label: 'Jewellery Sets' },
  { value: 'Earrings', label: 'Earrings & Jhumkas' },
  { value: 'Rings', label: 'Rings & Solitaires' },
  { value: 'Bangles', label: 'Bangles & Kadas' },
  { value: 'Chains', label: 'Chains & Mangalsutras' },
  { value: 'Pendants', label: 'Pendants & Medallions' },
  { value: 'Gold coins', label: 'Gold Coins & Bullion' },
];

export const METAL_OPTIONS = [
  { value: 'All', label: 'All Metals' },
  { value: 'Gold', label: 'Pure Gold (22K/24K)' },
  { value: 'Diamond', label: 'Natural Diamond' },
  { value: 'Silver', label: 'Sterling Silver 925' },
  { value: 'Platinum', label: 'Platinum 950' },
];

export const PURITY_OPTIONS = [
  { value: 'All', label: 'All Purities' },
  { value: '24K', label: '24K • 999 Fine Gold' },
  { value: '22K', label: '22K • 916 BIS Hallmark' },
  { value: '18K', label: '18K • 750 Diamond Gold' },
];

export const CUSTOMER_OPTIONS = [
  { value: 'All', label: 'All Patrons' },
  { value: 'Women', label: 'Women’s Jewellery' },
  { value: 'Men', label: 'Men’s Ornaments' },
  { value: 'Kids', label: 'Children & Babies' },
];

export const BUDGET_OPTIONS = [
  { value: 'All', label: 'Any Budget' },
  { value: '<10k', label: 'Under ₹10,000' },
  { value: '10k-25k', label: '₹10,000 – ₹25,000' },
  { value: '25k-50k', label: '₹25,000 – ₹50,000' },
  { value: '50k-1L', label: '₹50,000 – ₹1,00,000' },
  { value: '>1L', label: 'Above ₹1,00,000' },
];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured Picks' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'New Arrivals First' },
];

export const COLLECTION_LABELS: Record<string, string> = {
  All: 'All Pieces',
  latest: 'Latest Arrivals',
  bestseller: 'Best Sellers',
  bridal: 'Bridal Heritage',
  diamond: 'Diamond Brilliance',
  traditional: 'Temple Gold',
};

interface CustomSelectDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function CustomSelectDropdown({
  label,
  icon,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  onClose,
}: CustomSelectDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeOption = options.find(o => o.value === value) || options[0];
  const isFiltered = value !== 'All' && value !== 'featured';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full text-left px-3.5 py-2.5 rounded-none border transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#702638] shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
          isFiltered
            ? 'bg-[#702638]/[0.05] dark:bg-[#702638]/25 border-[#702638] dark:border-[#E5C388] shadow-xs'
            : isOpen
            ? 'bg-white dark:bg-[#252023] border-[#702638] dark:border-[#E5C388] ring-1 ring-[#702638]/20 shadow-xs'
            : 'bg-[#FBF9F5] hover:bg-white dark:bg-[#252023] dark:hover:bg-[#2C262A] border-[#EBE3D7] dark:border-[#38262E] hover:border-[#C69A8B]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`transition-colors shrink-0 ${isFiltered ? 'text-[#702638] dark:text-[#E5C388]' : 'text-[#8E867C]'}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <span className={`block text-[9.5px] font-sans font-semibold tracking-[0.16em] uppercase truncate ${isFiltered ? 'text-[#702638] dark:text-[#E5C388]' : 'text-[#8E867C]'}`}>
              {label}
            </span>
            <span className={`block text-xs font-sans font-semibold truncate leading-tight ${isFiltered ? 'text-[#702638] dark:text-[#FAF5F0]' : 'text-[#29231C] dark:text-[#FAF5F0]'}`}>
              {activeOption.label}
            </span>
          </div>
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#702638] dark:text-[#E5C388]' : isFiltered ? 'text-[#702638] dark:text-[#E5C388]' : 'text-[#8E867C]'}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-64 overflow-y-auto rounded-none bg-white dark:bg-[#1E191C] border border-[#E8DEC8] dark:border-[#38262E] shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)] py-1.5 backdrop-blur-md"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    onClose();
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#702638]/10 dark:bg-[#702638]/30 text-[#702638] dark:text-[#E5C388] font-semibold'
                      : 'text-[var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#702638] dark:text-[#E5C388] shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LuxuryCatalogFilter({
  selectedCategory,
  setSelectedCategory,
  selectedMetal,
  setSelectedMetal,
  selectedPurity,
  setSelectedPurity,
  selectedGender,
  setSelectedGender,
  budgetFilter,
  setBudgetFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  selectedCollection,
  setSelectedCollection,
  clearAllFilters,
  hasActiveFilters,
  totalResults,
  totalItems,
}: LuxuryFilterProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Active filter count
  const activeCount = [
    selectedCategory !== 'All',
    selectedMetal !== 'All',
    selectedPurity !== 'All',
    selectedGender !== 'All',
    budgetFilter !== 'All',
    selectedCollection !== 'All',
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileDrawerOpen]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  return (
    <div className="bg-white dark:bg-[#1E191C] rounded-none border border-[#EBE3D7] dark:border-[#38262E] shadow-[0_6px_28px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-4 sm:p-5 mb-8 transition-all duration-300">
      
      {/* Top Header Row within Filter Dock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#EBE3D7]/70 dark:border-[#38262E]/70">
        
        {/* Left: Section Label & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-none bg-[#FAF7F2] dark:bg-[#282124] border border-[#EBE3D7] dark:border-[#38262E] flex items-center justify-center text-[#702638] dark:text-[#E5C388] shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-sans font-bold tracking-[0.22em] uppercase text-[#702638] dark:text-[#E5C388] block">
              CURATED FILTERS
            </span>
            <span className="text-xs sm:text-[13px] text-[#7D756C] dark:text-[#B5ADA0] font-editorial-italic italic">
              Find your perfect piece with refined filters
            </span>
          </div>

          {activeCount > 0 && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-1 px-2.5 py-0.5 rounded-none text-[10.5px] font-medium bg-[#702638] text-white shadow-xs"
            >
              {activeCount} active
            </motion.span>
          )}
        </div>

        {/* Right: Live Result Counter & Quick Search */}
        <div className="flex items-center gap-3">
          {/* Subtle Instant Search input (Straight Shape) */}
          <div className="relative min-w-[200px] sm:min-w-[250px]">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E867C] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search necklace, ring, earrings..."
              className="w-full pl-9 pr-7 py-2 text-xs bg-[#FAF7F2] dark:bg-[#252023] border border-[#EBE3D7] dark:border-[#38262E] rounded-none text-[#29231C] dark:text-[#FAF5F0] placeholder-[#8E867C] placeholder:italic focus:outline-none focus:bg-white dark:focus:bg-[#1E191C] focus:border-[#702638] focus:ring-1 focus:ring-[#702638]/20 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E867C] hover:text-[#29231C] dark:hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Results Badge (Straight Shape) */}
          <div className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-none bg-[#FAF7F2] dark:bg-[#252023] border border-[#EBE3D7] dark:border-[#38262E] text-xs text-[#29231C] dark:text-[#FAF5F0] whitespace-nowrap shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#C69A8B] dark:text-[#E5C388]" />
            <span className="font-editorial-italic italic">
              <strong className="font-normal">{totalResults}</strong> of {totalItems} pieces
            </span>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet: 6-Dropdown Elegant Grid */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-3.5">
        <CustomSelectDropdown
          label="Category"
          icon={<Layers className="w-3.5 h-3.5" />}
          value={selectedCategory}
          options={CATEGORY_OPTIONS}
          onChange={setSelectedCategory}
          isOpen={openDropdown === 'category'}
          onToggle={() => toggleDropdown('category')}
          onClose={closeDropdown}
        />

        <CustomSelectDropdown
          label="Metal"
          icon={<Gem className="w-3.5 h-3.5" />}
          value={selectedMetal}
          options={METAL_OPTIONS}
          onChange={setSelectedMetal}
          isOpen={openDropdown === 'metal'}
          onToggle={() => toggleDropdown('metal')}
          onClose={closeDropdown}
        />

        <CustomSelectDropdown
          label="Purity"
          icon={<Award className="w-3.5 h-3.5" />}
          value={selectedPurity}
          options={PURITY_OPTIONS}
          onChange={setSelectedPurity}
          isOpen={openDropdown === 'purity'}
          onToggle={() => toggleDropdown('purity')}
          onClose={closeDropdown}
        />

        <CustomSelectDropdown
          label="Patron"
          icon={<Users className="w-3.5 h-3.5" />}
          value={selectedGender}
          options={CUSTOMER_OPTIONS}
          onChange={setSelectedGender}
          isOpen={openDropdown === 'gender'}
          onToggle={() => toggleDropdown('gender')}
          onClose={closeDropdown}
        />

        <CustomSelectDropdown
          label="Budget"
          icon={<Coins className="w-3.5 h-3.5" />}
          value={budgetFilter}
          options={BUDGET_OPTIONS}
          onChange={setBudgetFilter}
          isOpen={openDropdown === 'budget'}
          onToggle={() => toggleDropdown('budget')}
          onClose={closeDropdown}
        />

        <CustomSelectDropdown
          label="Sort By"
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={setSortBy}
          isOpen={openDropdown === 'sort'}
          onToggle={() => toggleDropdown('sort')}
          onClose={closeDropdown}
        />
      </div>

      {/* Mobile: Compact Action Bar Triggering Bottom Sheet */}
      <div className="flex md:hidden items-center justify-between gap-2 pt-3">
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex-1 py-2.5 px-4 rounded-none bg-[#702638] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#E5C388]" />
          <span>Filter &amp; Sort</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-none bg-white text-[#702638] text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Quick Sort for Mobile */}
        <div className="w-40 relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full text-xs py-2.5 px-3 rounded-none border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-main)] appearance-none font-medium focus:outline-none focus:border-[#702638]"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3.5 mt-3 border-t border-[var(--border-color)]/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-sans font-semibold tracking-wider uppercase text-[var(--text-muted)] mr-1">
                  Active:
                </span>

                {selectedCategory !== 'All' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 border border-[#702638]/30 text-[#702638] dark:text-[#E5C388] text-[11px] font-medium"
                  >
                    <span>{CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label || selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {selectedMetal !== 'All' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 border border-[#702638]/30 text-[#702638] dark:text-[#E5C388] text-[11px] font-medium"
                  >
                    <span>Metal: {selectedMetal}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMetal('All')}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove metal filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {selectedPurity !== 'All' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 border border-[#702638]/30 text-[#702638] dark:text-[#E5C388] text-[11px] font-medium"
                  >
                    <span>Purity: {selectedPurity}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPurity('All')}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove purity filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {selectedGender !== 'All' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 border border-[#702638]/30 text-[#702638] dark:text-[#E5C388] text-[11px] font-medium"
                  >
                    <span>Patron: {selectedGender}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGender('All')}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove patron filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {budgetFilter !== 'All' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 border border-[#702638]/30 text-[#702638] dark:text-[#E5C388] text-[11px] font-medium"
                  >
                    <span>Budget: {BUDGET_OPTIONS.find(b => b.value === budgetFilter)?.label || budgetFilter}</span>
                    <button
                      type="button"
                      onClick={() => setBudgetFilter('All')}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove budget filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {selectedCollection !== 'All' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 border border-[#702638]/30 text-[#702638] dark:text-[#E5C388] text-[11px] font-medium"
                  >
                    <span>Collection: {COLLECTION_LABELS[selectedCollection] || selectedCollection}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCollection('All')}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove collection filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}

                {searchQuery && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#702638]/10 dark:bg-[#702638]/30 border border-[#702638]/30 text-[#702638] dark:text-[#E5C388] text-[11px] font-medium"
                  >
                    <span>Search: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Remove search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                )}
              </div>

              {/* Reset All Filters Button */}
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-[var(--text-secondary)] hover:text-[#702638] dark:hover:text-[#E5C388] transition-colors cursor-pointer group"
              >
                <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-90 duration-300" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet Drawer for Filters */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-[#1E191C] rounded-t-3xl border-t border-[#E8DEC8] dark:border-[#38262E] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drag Handle & Header */}
              <div className="p-4 border-b border-[var(--border-color)]/70 flex items-center justify-between">
                <div>
                  <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-700 mx-auto mb-2" />
                  <h3 className="font-serif text-lg font-semibold text-[var(--text-main)]">
                    Refine Signature Catalogue
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Showing {totalResults} matching pieces
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Filter Options */}
              <div className="p-4 overflow-y-auto space-y-5 text-xs">
                
                {/* Category Section */}
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-2">
                    Category
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedCategory(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedCategory === opt.value
                            ? 'bg-[#702638] text-white border-[#702638]'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metal Section */}
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-2">
                    Metal
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {METAL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedMetal(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedMetal === opt.value
                            ? 'bg-[#702638] text-white border-[#702638]'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purity Section */}
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-2">
                    Purity
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PURITY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedPurity(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedPurity === opt.value
                            ? 'bg-[#702638] text-white border-[#702638]'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patron Section */}
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-2">
                    Patron
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CUSTOMER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedGender(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selectedGender === opt.value
                            ? 'bg-[#702638] text-white border-[#702638]'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Section */}
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-2">
                    Budget
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {BUDGET_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBudgetFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          budgetFilter === opt.value
                            ? 'bg-[#702638] text-white border-[#702638]'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Section */}
                <div>
                  <span className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-2">
                    Sort By
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSortBy(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          sortBy === opt.value
                            ? 'bg-[#702638] text-white border-[#702638]'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="p-4 border-t border-[var(--border-color)]/70 bg-[var(--bg-card)] flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 py-3 px-4 rounded-xl border border-[var(--border-color)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[#702638] cursor-pointer"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex-2 py-3 px-4 rounded-xl bg-[#702638] text-white text-xs font-semibold uppercase tracking-wider shadow-md cursor-pointer"
                >
                  Show {totalResults} Pieces
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Editorial Heritage Rule */}
      <div className="flex items-center gap-3 pt-1 pb-4 px-1 text-[10px] sm:text-[10.5px] font-sans tracking-[0.24em] text-[#8E867C] dark:text-[#A89F93] uppercase select-none">
        <span className="text-[#C69A8B] dark:text-[#E5C388] text-sm">✦</span>
        <div className="h-[1px] w-8 sm:w-12 bg-[#C69A8B]/60 dark:bg-[#E5C388]/40" />
        <span>TIMELESS DESIGNS &nbsp;/&nbsp; AUTHENTICITY &nbsp;/&nbsp; GENERATIONS</span>
      </div>

    </div>
  );
}
