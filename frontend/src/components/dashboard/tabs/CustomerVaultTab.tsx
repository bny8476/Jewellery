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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D]">
            24K Gold Vault &amp; Savings
          </h1>
          <p className="text-xs text-[#8792A2] mt-0.5">
            100% insured physical 24K 999.9 gold bullion vaulted in secure institutional storage
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/auragold"
            className="px-4 py-2.5 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
          >
            + Buy 24K Gold
          </Link>
          <Link
            to="/auragold?tab=SELL"
            className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white hover:border-[#25282D] text-[#343A40] hover:text-[#25282D] text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors shadow-xs"
          >
            Sell / Cash Out
          </Link>
        </div>
      </div>

      {/* Vault Spotlight Card */}
      <div className="bg-[#25282D] rounded-xl p-6 sm:p-8 text-white shadow-xs border border-[#25282D] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C9A45C]/40 text-[#FAF3E8] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Allocated Physical Bullion • 100% Insured</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-inter font-bold text-white">
            {goldVault ? `${goldVault.gold_balance_grams.toFixed(4)} grams` : '0.0000 grams'}
          </h2>
          <p className="text-xs text-stone-300 mt-2">
            Market Value: <strong className="text-white text-base font-inter font-bold">₹{vaultMarketValue.toLocaleString('en-IN')}</strong>
            {goldVault && <span className="ml-3 font-mono text-[11px] text-[#8792A2]">• Account: {goldVault.account_number}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/auragold"
            className="px-5 py-2.5 rounded-lg bg-white text-[#25282D] text-xs font-semibold hover:bg-[#F3F4F6] transition-colors shadow-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            + Accumulate Gold
          </Link>
          <Link
            to="/auragold?tab=REDEEM"
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            Redeem Bullion Coins
          </Link>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]">
          <h3 className="font-inter font-bold text-base text-[#25282D] flex items-center gap-2">
            <History className="w-4 h-4 text-[#25282D]" />
            Gold Vault Transaction Ledger
          </h3>
          <span className="text-xs text-[#8792A2]">Recent transactions</span>
        </div>

        {goldVault && goldVault.transactions && goldVault.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#8792A2] uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {goldVault.transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[#F3F4F6]/50 transition-colors">
                    <td className="py-3 px-3 text-[#8792A2]">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 font-mono font-medium text-[#25282D]">{t.transaction_reference}</td>
                    <td className="py-3 px-3 font-semibold text-[#25282D]">{t.type}</td>
                    <td className="py-3 px-3 font-mono font-semibold">{Number(t.grams).toFixed(4)}g</td>
                    <td className="py-3 px-3 font-inter font-bold text-[#25282D]">{formatCurrencyINR(Number(t.total_amount))}</td>
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
          <div className="py-12 text-center bg-[#F3F4F6]/60 rounded-lg border border-[#E5E7EB] space-y-3 p-6">
            <Coins className="w-8 h-8 text-[#8792A2] mx-auto" />
            <p className="text-xs text-[#25282D] font-semibold">No 24K Vault Holdings Yet</p>
            <p className="text-xs text-[#8792A2] max-w-sm mx-auto leading-relaxed">
              Accumulate 24 Karat 999.9 pure gold in grams starting from ₹100 with free vault custody and doorstep coin delivery.
            </p>
            <Link
              to="/auragold"
              className="inline-block px-4 py-2 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Start Gold Savings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerVaultTab;
