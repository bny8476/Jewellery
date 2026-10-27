import React from 'react';
import { Download } from 'lucide-react';
import { toast } from '../../../utils/toast';

export interface CustomerLedgerTabProps {
  orders: any[];
  goldVault: {
    account_number: string;
    gold_balance_grams: number;
    reserved_grams: number;
    market_value: number;
    transactions: any[];
  } | null;
  getStatusColor: (status: string) => string;
  formatCurrencyINR: (amt: number) => string;
}

export const CustomerLedgerTab: React.FC<CustomerLedgerTabProps> = ({
  orders,
  goldVault,
  getStatusColor,
  formatCurrencyINR
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
            Unified Transactions Ledger
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Complete consolidated ledger across jewellery acquisitions, digital gold, and loan repayments
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.success('Consolidated tax statement download initiated')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:border-[var(--gold-primary)] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Annual Statement</span>
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {/* Retail Orders */}
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-[var(--bg-elevated)]/50">
                  <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">
                    #{order.order_number || order.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[var(--gold-primary)]">
                    Fine Jewellery
                  </td>
                  <td className="py-3.5 px-4 line-clamp-1">
                    {order.items?.map((i: any) => i.product_name).join(', ') || 'Retail Acquisition'}
                  </td>
                  <td className="py-3.5 px-4 font-serif font-bold text-gold-gradient">
                    {formatCurrencyINR(order.total_amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Digital Gold Transactions */}
              {goldVault?.transactions?.map((t: any) => (
                <tr key={t.id} className="hover:bg-[var(--bg-elevated)]/50">
                  <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">
                    {t.transaction_reference}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#D4AF37]">
                    Aura Gold™
                  </td>
                  <td className="py-3.5 px-4">
                    {t.type} 24K Bullion ({Number(t.grams).toFixed(4)}g)
                  </td>
                  <td className="py-3.5 px-4 font-serif font-bold text-gold-gradient">
                    {formatCurrencyINR(Number(t.total_amount))}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedgerTab;
