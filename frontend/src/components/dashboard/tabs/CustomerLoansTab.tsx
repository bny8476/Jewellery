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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
            Active Gold Loans &amp; Collateral
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your pledged jewellery and repay monthly interest securely online
          </p>
        </div>
        <Link
          to="/pawn"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-xs"
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
              <div key={loan.id} className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-4 shadow-xs">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">{loan.pledge_number}</span>
                      <p className="text-xs text-[var(--text-secondary)]">{new Date(loan.pledge_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div>
                      <p className="text-[10px] text-[var(--text-secondary)]">Principal Loan</p>
                      <p className="font-semibold text-[var(--text-main)]">₹{Number(loan.loan_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-secondary)]">Collateral Weight</p>
                      <p className="font-semibold text-[var(--text-main)]">{loan.total_weight_grams} g</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-secondary)]">Interest Scheme</p>
                      <p className="font-semibold text-[var(--text-main)]">{loan.interest_rate}% {loan.interest_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-secondary)]">Current Balance</p>
                      <p className="font-bold text-gold-gradient">₹{balance.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => onOpenRepayment(loan)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-highlight)] text-black text-xs font-semibold uppercase py-2.5 rounded-xl hover:brightness-105 transition-all shadow-xs cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Pay Interest Online
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-3">
          <Scale className="w-12 h-12 text-[var(--gold-primary)]/40 mx-auto" />
          <p className="text-xs text-[var(--text-secondary)]">
            No active collateral loans on file. Visit our showroom or apply online for immediate appraisal.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerLoansTab;
