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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className={`px-6 py-4 ${type === 'cash_in' ? 'bg-green-600' : 'bg-red-600'}`}>
                <h3 className="text-xl font-bold text-white">
                    {type === 'cash_in' ? 'Record Cash In' : 'Record Cash Out'}
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
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
                            className={`w-full rounded-md ${fieldErrors.transaction_date ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-purple-500 focus:border-purple-500 border p-2`}
                        />
                        <FormFieldError id="cash-date-error" error={fieldErrors.transaction_date} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
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
                            className={`w-full rounded-md ${fieldErrors.amount ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-purple-500 focus:border-purple-500 border p-2`}
                        />
                        <FormFieldError id="cash-amount-error" error={fieldErrors.amount} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => {
                                setFormData({ ...formData, category: e.target.value });
                                if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: '' }));
                            }}
                            aria-invalid={Boolean(fieldErrors.category)}
                            aria-describedby={fieldErrors.category ? "cash-category-error" : undefined}
                            className={`w-full rounded-md ${fieldErrors.category ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:ring-purple-500 focus:border-purple-500 border p-2`}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                        <select
                            required
                            value={formData.payment_mode}
                            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 border p-2"
                        >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="card">Card</option>
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 border p-2"
                            rows={2}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${type === 'cash_in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            } disabled:opacity-50`}
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
