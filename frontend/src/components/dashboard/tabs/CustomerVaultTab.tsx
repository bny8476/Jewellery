import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, History, Coins } from 'lucide-react';
import { goldCardEntrance } from '../../../utils/motion';

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
    <motion.div 
      variants={goldCardEntrance}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9] dark:border-[#38242C]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#2A040D] dark:text-[#FAF5ED]">
            24K Gold Vault &amp; Savings
          </h1>
          <p className="text-xs text-[#7A6A64] dark:text-[#C1B4B8] mt-0.5">
            100% insured physical 24K 999.9 gold bullion vaulted in secure institutional storage
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/auragold"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#450817] via-[#5C0B1F] to-[#450817] hover:from-[#5C0B1F] hover:to-[#700D26] text-[#FAF5ED] border border-[#C6A15B]/50 text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
          >
            + Buy 24K Gold
          </Link>
          <Link
            to="/auragold?tab=SELL"
            className="px-4 py-2.5 rounded-xl border border-[#E8E2D9] dark:border-[#38242C] bg-white dark:bg-[#1B1317] hover:border-[#C6A15B] dark:hover:border-[#D8B878] text-[#2A040D] dark:text-[#FAF5ED] text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors shadow-xs"
          >
            Sell / Cash Out
          </Link>
        </div>
      </div>

      {/* Vault Spotlight Card */}
      <div className="bg-gradient-to-br from-[#2D040E] via-[#450817] to-[#2D040E] rounded-2xl p-6 sm:p-8 text-white shadow-md border border-[#C6A15B]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 border border-[#C6A15B]/50 text-[#FAF5ED] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#D8B878]" />
            <span>Allocated Physical Bullion • 100% Insured</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-inter font-bold text-white tracking-tight">
            {goldVault ? `${goldVault.gold_balance_grams.toFixed(4)} grams` : '0.0000 grams'}
          </h2>
          <p className="text-xs text-stone-200 mt-2">
            Market Value: <strong className="text-[#D8B878] text-base font-inter font-bold">₹{vaultMarketValue.toLocaleString('en-IN')}</strong>
            {goldVault && <span className="ml-3 font-mono text-[11px] text-[#D8B878]/80">• Account: {goldVault.account_number}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/auragold"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C6A15B] via-[#D8B878] to-[#C6A15B] hover:from-[#D8B878] hover:to-[#E5CA8F] text-[#2A040D] text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            + Accumulate Gold
          </Link>
          <Link
            to="/auragold?tab=REDEEM"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            Redeem Bullion Coins
          </Link>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white dark:bg-[#1B1317] rounded-2xl border border-[#E8E2D9] dark:border-[#38242C] p-5 space-y-4 shadow-[0_4px_24px_rgba(69,8,23,0.04)] transition-colors">
        <div className="flex justify-between items-center pb-3 border-b border-[#E8E2D9] dark:border-[#38242C]">
          <h3 className="font-inter font-bold text-base text-[#2A040D] dark:text-[#FAF5ED] flex items-center gap-2">
            <History className="w-4 h-4 text-[#C6A15B] dark:text-[#D8B878]" />
            Gold Vault Transaction Ledger
          </h3>
          <span className="text-xs text-[#7A6A64] dark:text-[#C1B4B8]">Recent transactions</span>
        </div>

        {goldVault && goldVault.transactions && goldVault.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] dark:border-[#38242C] text-[#7A6A64] dark:text-[#C1B4B8] uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9] dark:divide-[#38242C]">
                {goldVault.transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-stone-50/70 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-[#7A6A64] dark:text-[#C1B4B8]">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-3 font-mono font-medium text-[#2A040D] dark:text-[#FAF5ED]">{t.transaction_reference}</td>
                    <td className="py-3 px-3 font-semibold text-[#2A040D] dark:text-[#FAF5ED]">{t.type}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#2A040D] dark:text-[#FAF5ED]">{Number(t.grams).toFixed(4)}g</td>
                    <td className="py-3 px-3 font-bold text-[#2A040D] dark:text-[#FAF5ED]">{formatCurrencyINR(Number(t.total_amount))}</td>
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
          <div className="py-12 text-center bg-[#FAF7F2] dark:bg-[#140D10] rounded-xl border border-[#E8E2D9] dark:border-[#38242C] space-y-3 p-6">
            <Coins className="w-8 h-8 text-[#C6A15B] dark:text-[#D8B878] mx-auto" />
            <p className="text-xs text-[#2A040D] dark:text-[#FAF5ED] font-semibold">No 24K Vault Holdings Yet</p>
            <p className="text-xs text-[#7A6A64] dark:text-[#C1B4B8] max-w-sm mx-auto leading-relaxed">
              Accumulate 24 Karat 999.9 pure gold in grams starting from ₹100 with free vault custody and doorstep coin delivery.
            </p>
            <Link
              to="/auragold"
              className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-[#450817] via-[#5C0B1F] to-[#450817] hover:from-[#5C0B1F] hover:to-[#700D26] text-[#FAF5ED] border border-[#C6A15B]/50 text-xs font-semibold transition-colors shadow-xs"
            >
              Start Gold Savings
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerVaultTab;
