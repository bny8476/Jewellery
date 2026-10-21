import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import CashTransactionForm from './CashTransactionForm';

interface CashTransaction {
    id: string;
    transaction_type: string;
    amount: number;
    category: string;
    description: string;
    transaction_date: string;
    payment_mode: string;
}

const AccountsSection: React.FC = () => {
    const [showForm, setShowForm] = useState<'cash_in' | 'cash_out' | null>(null);
    const [transactions, setTransactions] = useState<CashTransaction[]>([]);

    useEffect(() => {
        fetchTransactions();
    }, [showForm]);

    const fetchTransactions = async () => {
        const { data } = await supabase
            .from('cash_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setTransactions(data);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">Accounts &amp; Cash Management</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Track daily cash-in inflows, cash-out operational expenses, and audit ledger transactions</p>
            </div>

            {!showForm ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--text-main)]">Cash In</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Record cash received (Sales, Deposits, Interest)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowForm('cash_in')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors w-full text-xs shadow-sm"
                            >
                                + Record Cash In
                            </button>
                        </div>

                        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                                    <TrendingDown className="h-6 w-6 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--text-main)]">Cash Out</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Record cash disbursements (Expenses, Withdrawals, Salary)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowForm('cash_out')}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors w-full text-xs shadow-sm"
                            >
                                - Record Cash Out
                            </button>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                        <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-[var(--gold-primary)]" />
                            <h3 className="font-bold text-sm text-[var(--text-main)]">Recent Transactions Ledger</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border-color)]">
                                <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] font-semibold">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Date</th>
                                        <th className="px-6 py-3 text-left">Type</th>
                                        <th className="px-6 py-3 text-left">Category</th>
                                        <th className="px-6 py-3 text-left">Amount</th>
                                        <th className="px-6 py-3 text-left">Mode</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                {tx.transaction_date}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                                                    tx.transaction_type === 'cash_in'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                    {tx.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-main)]">{tx.category}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold tabular-nums ${
                                                tx.transaction_type === 'cash_in' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                                {tx.transaction_type === 'cash_in' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)] uppercase font-mono text-xs">{tx.payment_mode}</td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-[var(--text-secondary)]">No recent transactions recorded</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <CashTransactionForm
                    type={showForm}
                    onSuccess={() => {
                        setShowForm(null);
                        fetchTransactions();
                    }}
                    onCancel={() => setShowForm(null)}
                />
            )}
        </div>
    );
};

export default AccountsSection;
