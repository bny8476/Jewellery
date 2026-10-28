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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#222733]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            Transactions &amp; Payments Ledger
          </h1>
          <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] mt-0.5">
            Consolidated record across jewellery orders, digital bullion purchases, and loan repayments
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast.success('Consolidated tax statement download initiated')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] bg-white dark:bg-[#181B22] text-xs font-semibold text-[#343A40] dark:text-[#D2D7E2] hover:border-[#25282D] dark:hover:border-[#C9A45C] hover:text-[#25282D] dark:hover:text-white cursor-pointer shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#8792A2] dark:text-[#8D96A5]" />
          <span>Download Statement</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#222733] bg-[#F3F4F6]/70 dark:bg-[#181B22]/70 text-[#8792A2] dark:text-[#8D96A5] uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#222733]">
              {/* Retail Orders */}
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-[#F3F4F6]/40 dark:hover:bg-[#181B22]/50 transition-colors">
                  <td className="py-3.5 px-4 text-[#8792A2] dark:text-[#8D96A5]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[#25282D] dark:text-[#F7F8FA]">
                    #{order.order_number || order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#25282D] dark:text-[#D8B878]">
                    Fine Jewellery
                  </td>
                  <td className="py-3.5 px-4 text-[#343A40] dark:text-[#D2D7E2] line-clamp-1">
                    {order.items?.map((i: any) => i.product_name).join(', ') || 'Retail Acquisition'}
                  </td>
                  <td className="py-3.5 px-4 font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
                    {formatCurrencyINR(order.total_amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Digital Gold Transactions */}
              {goldVault?.transactions?.map((t: any) => (
                <tr key={t.id} className="hover:bg-[#F3F4F6]/40 dark:hover:bg-[#181B22]/50 transition-colors">
                  <td className="py-3.5 px-4 text-[#8792A2] dark:text-[#8D96A5]">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-[#25282D] dark:text-[#F7F8FA]">
                    {t.transaction_reference}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#25282D] dark:text-[#D8B878]">
                    24K Gold Vault
                  </td>
                  <td className="py-3.5 px-4 text-[#343A40] dark:text-[#D2D7E2]">
                    {t.type} 24K Bullion ({Number(t.grams).toFixed(4)}g)
                  </td>
                  <td className="py-3.5 px-4 font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
                    {formatCurrencyINR(Number(t.total_amount))}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
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
