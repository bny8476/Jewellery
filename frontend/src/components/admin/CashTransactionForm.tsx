import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader } from 'lucide-react';
import { toast } from '../../utils/toast';
import { validatePositiveNumber, validateRequired, validateDateNotFuture } from '../../utils/validation';
import { FormFieldError } from '../FormFieldError';

interface CashTransactionFormProps {
    type: 'cash_in' | 'cash_out';
    onSuccess: () => void;
    onCancel: () => void;
}

const CashTransactionForm: React.FC<CashTransactionFormProps> = ({ type, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        payment_mode: 'cash',
        transaction_date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!validateRequired(formData.transaction_date)) {
            errors.transaction_date = 'Transaction date is required';
        } else if (!validateDateNotFuture(formData.transaction_date)) {
            errors.transaction_date = 'Transaction date cannot be in the future';
        }

        if (!validatePositiveNumber(formData.amount)) {
            errors.amount = 'Amount must be a positive number';
        }

        if (!validateRequired(formData.category)) {
            errors.category = 'Category is required';
        }

        if (!validateRequired(formData.payment_mode)) {
            errors.payment_mode = 'Payment mode is required';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the transaction form');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('cash_transactions')
                .insert({
                    transaction_type: type,
                    amount: parseFloat(formData.amount),
                    category: formData.category,
                    payment_mode: formData.payment_mode,
                    transaction_date: formData.transaction_date,
                    description: formData.description
                });

            if (error) throw error;

            toast.success(`Cash ${type === 'cash_in' ? 'In' : 'Out'} recorded successfully`);
            onSuccess();
        } catch (error: any) {
            console.error('Error recording transaction:', error);
            toast.error('Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className={`px-6 py-4 border-b border-[var(--border-color)] ${type === 'cash_in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <h3 className="text-lg font-bold">
                    {type === 'cash_in' ? 'Record Cash Inward' : 'Record Cash Outward'}
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                    {type === 'cash_in' ? 'Disbursements from retail, gold purchase deposits, or return interests' : 'Operational withdrawals, salary advances, or supplier payouts'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.transaction_date}
                            onChange={(e) => {
                                setFormData({ ...formData, transaction_date: e.target.value });
                                if (fieldErrors.transaction_date) setFieldErrors(prev => ({ ...prev, transaction_date: '' }));
                            }}
                            aria-invalid={Boolean(fieldErrors.transaction_date)}
                            aria-describedby={fieldErrors.transaction_date ? "cash-date-error" : undefined}
                            className={`w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] ${fieldErrors.transaction_date ? 'border-red-500' : 'border-[var(--border-color)]'} shadow-sm focus:border-[var(--gold-primary)] border p-2.5 text-sm focus:outline-none`}
                        />
                        <FormFieldError id="cash-date-error" error={fieldErrors.transaction_date} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Amount (₹)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            step="any"
                            value={formData.amount}
                            onChange={(e) => {
                                setFormData({ ...formData, amount: e.target.value });
                                if (fieldErrors.amount) setFieldErrors(prev => ({ ...prev, amount: '' }));
                            }}
                            aria-invalid={Boolean(fieldErrors.amount)}
                            aria-describedby={fieldErrors.amount ? "cash-amount-error" : undefined}
                            className={`w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] ${fieldErrors.amount ? 'border-red-500' : 'border-[var(--border-color)]'} shadow-sm focus:border-[var(--gold-primary)] border p-2.5 text-sm focus:outline-none tabular-nums font-semibold`}
                        />
                        <FormFieldError id="cash-amount-error" error={fieldErrors.amount} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Category</label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => {
                                setFormData({ ...formData, category: e.target.value });
                                if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: '' }));
                            }}
                            aria-invalid={Boolean(fieldErrors.category)}
                            aria-describedby={fieldErrors.category ? "cash-category-error" : undefined}
                            className={`w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] ${fieldErrors.category ? 'border-red-500' : 'border-[var(--border-color)]'} shadow-sm focus:border-[var(--gold-primary)] border p-2.5 text-sm focus:outline-none`}
                        >
                            <option value="">Select Category</option>
                            {type === 'cash_in' ? (
                                <>
                                    <option value="Deposit">Deposit</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Return Interest">Pledge Interest</option>
                                    <option value="Other">Other</option>
                                </>
                            ) : (
                                <>
                                    <option value="Expense">Office Expense</option>
                                    <option value="Withdrawal">Withdrawal</option>
                                    <option value="Salary">Salary</option>
                                    <option value="Other">Other</option>
                                </>
                            )}
                        </select>
                        <FormFieldError id="cash-category-error" error={fieldErrors.category} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Payment Mode</label>
                        <select
                            required
                            value={formData.payment_mode}
                            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                            className="w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-color)] shadow-sm focus:border-[var(--gold-primary)] border p-2.5 text-sm focus:outline-none"
                        >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="card">Card</option>
                        </select>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-color)] shadow-sm focus:border-[var(--gold-primary)] border p-2.5 text-sm focus:outline-none"
                            rows={2}
                            placeholder="Add memo or reference note..."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl shadow-sm text-xs font-semibold text-white ${
                            type === 'cash_in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                        } disabled:opacity-50 transition-colors`}
                    >
                        {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Save Record</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CashTransactionForm;
