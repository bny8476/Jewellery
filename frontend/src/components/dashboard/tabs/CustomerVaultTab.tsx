import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, History, Coins } from 'lucide-react';

export interface CustomerVaultTabProps {
  goldVault: {
    account_number: string;
    gold_balance_grams: number;
    reserved_grams: number;
    market_value: number;
    transactions: any[];
  } | null;
  vaultMarketValue: number;
  getStatusColor: (status: string) => string;
  formatCurrencyINR: (amt: number) => string;
}

export const CustomerVaultTab: React.FC<CustomerVaultTabProps> = ({
  goldVault,
  vaultMarketValue,
  getStatusColor,
  formatCurrencyINR
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
            Aura Gold™ 24K Digital Vault
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            100% Insured physical 24K 999.9 bullion vaulted with Sequel &amp; Brink's Global Vaults
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/auragold"
            className="h-10 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#C5A059] text-stone-950 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs hover:shadow transition-all"
          >
            + Buy 24K Bullion
          </Link>
          <Link
            to="/auragold?tab=SELL"
            className="h-10 px-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--gold-primary)]/10 text-[var(--text-main)] hover:text-[var(--gold-primary)] text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
          >
            Liquidate / Cash Out
          </Link>
        </div>
      </div>

      {/* Vault Spotlight Card */}
      <div className="bg-gradient-to-r from-[#4A1521] via-[#702638] to-[#2B0B13] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#D4AF37]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FAF7F2] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Allocated Physical Bullion • 100% Insured</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
            {goldVault ? `${goldVault.gold_balance_grams.toFixed(4)} grams` : '0.0000 grams'}
          </h2>
          <p className="text-xs text-[#E8D5D0] mt-1.5">
            Current Valuation: <strong className="text-white text-base font-serif">₹{vaultMarketValue.toLocaleString('en-IN')}</strong>
            {goldVault && <span className="ml-3 font-mono text-[11px] text-[#E8D5D0]/80">• Acc: {goldVault.account_number}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/auragold"
            className="h-10 px-5 rounded-xl bg-[#D4AF37] text-stone-950 text-xs font-bold uppercase tracking-wider hover:bg-[#C5A059] transition-all shadow-md inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            + Buy 24K Gold
          </Link>
          <Link
            to="/auragold?tab=REDEEM"
            className="h-10 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/20 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            Redeem Coins
          </Link>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
          <h3 className="font-serif font-bold text-base text-[var(--text-main)] flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--gold-primary)]" />
            Digital Gold Vault Ledger
          </h3>
          <span className="text-xs text-[var(--text-secondary)]">Last 10 transactions</span>
        </div>

        {goldVault && goldVault.transactions && goldVault.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {goldVault.transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-elevated)]/50">
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 font-mono font-medium">{t.transaction_reference}</td>
                    <td className="py-3 px-3 font-semibold text-[#D4AF37]">{t.type}</td>
                    <td className="py-3 px-3 font-mono">{Number(t.grams).toFixed(4)}g</td>
                    <td className="py-3 px-3 font-serif font-bold text-gold-gradient">{formatCurrencyINR(Number(t.total_amount))}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] space-y-3 p-6">
            <Coins className="w-10 h-10 text-[#D4AF37]/40 mx-auto" />
            <p className="text-xs text-[var(--text-main)] font-semibold">No 24K Vault Holdings Yet</p>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              Accumulate 24 Karat 999.9 pure gold in grams starting from ₹100 with 100% free vault custody and doorstep coin redemption.
            </p>
            <Link
              to="/auragold"
              className="inline-block px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C5A059] text-stone-950 text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
            >
              Start Aura Gold™ Portfolio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerVaultTab;
