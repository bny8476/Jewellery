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
            <h2 className="text-3xl font-bold text-gray-900">Accounts & Cash Management</h2>

            {!showForm ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Cash In</h3>
                            </div>
                            <p className="text-gray-600 mb-4">Record cash received (Sales, Deposits...)</p>
                            <button
                                onClick={() => setShowForm('cash_in')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full"
                            >
                                Add Cash In
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-red-100 p-3 rounded-full">
                                    <TrendingDown className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Cash Out</h3>
                            </div>
                            <p className="text-gray-600 mb-4">Record cash payments (Expenses, Withdrawals...)</p>
                            <button
                                onClick={() => setShowForm('cash_out')}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full"
                            >
                                Add Cash Out
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            <h3 className="font-bold text-gray-700">Recent Transactions</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tx.transaction_date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.transaction_type === 'cash_in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {tx.transaction_type === 'cash_in' ? 'Cash In' : 'Cash Out'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.category}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.transaction_type === 'cash_in' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {tx.transaction_type === 'cash_in' ? '+' : '-'} ₹{tx.amount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{tx.payment_mode}</td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No recent transactions</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
