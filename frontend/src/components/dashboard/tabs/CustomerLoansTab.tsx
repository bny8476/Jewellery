import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, CreditCard } from 'lucide-react';

export interface CustomerLoansTabProps {
  activeLoans: any[];
  onOpenRepayment: (loan: any) => void;
  getStatusColor: (status: string) => string;
}

export const CustomerLoansTab: React.FC<CustomerLoansTabProps> = ({
  activeLoans,
  onOpenRepayment,
  getStatusColor
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#222733]">
        <div>
          <h1 className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
            Active Gold Loans &amp; Collateral
          </h1>
          <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] mt-0.5">
            Manage your pledged jewellery collateral and repay monthly interest securely online
          </p>
        </div>
        <Link
          to="/pawn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#181B22] dark:hover:bg-[#202530] dark:border dark:border-[#222733] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Pawn Loan Calculator</span>
        </Link>
      </div>

      {activeLoans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLoans.map(loan => {
            const totalPaid = loan.part_payments?.reduce((s: number, p: any) => s + (Number(p.payment_amount) || 0), 0) || 0;
            const balance = Math.max(0, Number(loan.loan_amount) - totalPaid);
            const isClosed = loan.status === 'closed' || balance === 0;

            return (
              <div key={loan.id} className="bg-white dark:bg-[#13151A] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#222733] hover:border-[#25282D] dark:hover:border-[#C9A45C]/50 transition-all flex flex-col justify-between space-y-4 shadow-xs">
                <div>
                  <div className="flex justify-between items-start mb-2 pb-2 border-b border-[#E5E7EB] dark:border-[#222733]">
                    <div>
                      <span className="text-[10px] font-bold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider">{loan.pledge_number}</span>
                      <p className="text-xs text-[#8792A2] dark:text-[#8D96A5]">{new Date(loan.pledge_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                    <div>
                      <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] uppercase font-semibold">Principal Loan</p>
                      <p className="font-semibold text-[#25282D] dark:text-[#F7F8FA] text-sm">₹{Number(loan.loan_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] uppercase font-semibold">Collateral Weight</p>
                      <p className="font-semibold text-[#25282D] dark:text-[#F7F8FA] text-sm">{loan.total_weight_grams} g</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] uppercase font-semibold">Interest Scheme</p>
                      <p className="font-semibold text-[#25282D] dark:text-[#F7F8FA]">{loan.interest_rate}% {loan.interest_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] uppercase font-semibold">Current Balance</p>
                      <p className="font-bold text-[#25282D] dark:text-[#F7F8FA] font-mono text-sm">₹{balance.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => onOpenRepayment(loan)}
                    className="w-full flex items-center justify-center gap-2 bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer dark:border dark:border-[#C9A45C]/40"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#C9A45C]" /> Pay Interest Online
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] space-y-3 p-8">
          <Scale className="w-10 h-10 text-[#8792A2] dark:text-[#8D96A5] mx-auto" />
          <h3 className="font-inter font-bold text-base text-[#25282D] dark:text-[#F7F8FA]">No Active Gold Loans</h3>
          <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] max-w-sm mx-auto leading-relaxed">
            No active collateral loans on file. Visit our boutique showroom or apply online for instant appraisal and disbursement.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerLoansTab;
