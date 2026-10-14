import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ShoppingBag, Users, FileText, Gem, Settings, ArrowRight, Truck, Coins, Shield } from 'lucide-react';
import type { TabType } from '../../../pages/Admin';
import { modalBackdropVariants, modalContentVariants } from '../../../utils/motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
}

export const AdminCommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickLinks: Array<{ label: string; tab: TabType; category: string; icon: any; desc: string }> = [
    { label: 'Executive Command Center', tab: 'dashboard', category: 'Overview', icon: Shield, desc: 'Real-time KPIs & daily statistics' },
    { label: 'Point of Sale (POS) Billing', tab: 'pos', category: 'Commercial', icon: ShoppingBag, desc: 'New retail sales & 3% GST tax invoices' },
    { label: 'Customer Relationship CRM', tab: 'customer', category: 'CRM', icon: Users, desc: 'Patron directory, KYC verification & 14-tab profiles' },
    { label: 'Pawn Loan Management', tab: 'transaction', category: 'Credit', icon: Coins, desc: 'Gold collateral pledges & disbursements' },
    { label: 'Precious Metals & GoldAPI Rates', tab: 'rates', category: 'Treasury', icon: Gem, desc: '9:00 AM IST live bullion rates & margins' },
    { label: 'Certified Solitaire Vault', tab: 'diamonds', category: 'Treasury', icon: Gem, desc: 'Rapaport 4Cs natural & lab-grown stones' },
    { label: 'Procurement & Inward Receipts', tab: 'purchases', category: 'Procurement', icon: Truck, desc: 'Bullion suppliers & purchase orders' },
    { label: 'Day Book & Financial Accounts', tab: 'accounts', category: 'Finance', icon: FileText, desc: 'Cash reconciliation & double-entry ledger' },
    { label: 'Settings & Security Audit', tab: 'settings', category: 'Governance', icon: Settings, desc: 'GSTIN credentials & immutable security log' }
  ];

  const filteredLinks = quickLinks.filter(l => 
    l.label.toLowerCase().includes(query.toLowerCase()) ||
    l.category.toLowerCase().includes(query.toLowerCase()) ||
    l.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <motion.div 
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md" 
          />
          
          <motion.div 
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-[var(--bg-card)] border border-[var(--gold-primary)]/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 relative z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]">
              <Search className="w-5 h-5 text-[var(--gold-primary)] shrink-0 mr-3" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, page name, patron, or stock item..."
                className="w-full bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] mr-2">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[var(--bg-card)] text-[var(--text-muted)] rounded border border-[var(--border-color)]">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="p-3 max-h-[60vh] overflow-y-auto space-y-1 text-xs">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-1.5 block">
                Navigation Shortcuts
              </span>

              {filteredLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.tab}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      onNavigateTab(item.tab);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[var(--gold-primary)]/10 hover:border-[var(--gold-primary)]/30 border border-transparent text-left transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-[var(--bg-elevated)] group-hover:bg-[var(--gold-primary)]/20 text-[var(--text-secondary)] group-hover:text-[var(--gold-primary)] transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--text-main)] group-hover:text-[var(--gold-primary)] block text-sm">
                          {item.label}
                        </span>
                        <span className="text-[var(--text-secondary)] text-[11px] mt-0.5 block">
                          {item.category} • {item.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-[var(--text-muted)] group-hover:text-[var(--gold-primary)]">
                      <span className="text-[10px] font-mono">Jump</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </motion.button>
                );
              })}

              {filteredLinks.length === 0 && (
                <div className="py-8 text-center text-[var(--text-muted)]">
                  <p>No commands or pages matching "{query}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-[var(--bg-elevated)] border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>RCB JEWELRY’S & PAWN SHOP • Quick Navigation</span>
              <span className="font-mono">Use ↑ ↓ to navigate, ↵ to select</span>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
