import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { toast } from '../../utils/toast';
import { validatePositiveNumber, validateRequired, validateDateNotFuture } from '../../utils/validation';
import { FormFieldError } from '../FormFieldError';

interface CashTransactionFormProps {
    type: 'cash_in' | 'cash_out';
    onSuccess: () => void;
    onCancel: () => void;
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

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

            toast.success(`Cash ${type === 'cash_in' ? 'Inward' : 'Outward'} recorded successfully`);
            onSuccess();
        } catch (error: any) {
            console.error('Error recording transaction:', error);
            toast.error('Failed to record transaction');
        } finally {
            setLoading(false);
        }
    };

    const isInflow = type === 'cash_in';

    return (
        <div className="relative overflow-hidden bg-white/95 dark:bg-[#130D11]/95 rounded-2xl border border-[#E8DFD5] dark:border-white/10 shadow-[0_8px_32px_rgba(91,16,34,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            {/* Top Accent Gradient Line */}
            <div className={`absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r ${
                isInflow ? 'from-emerald-400 via-teal-500 to-emerald-600' : 'from-rose-400 via-rose-500 to-red-600'
            }`} />

            {/* Header Banner */}
            <div className="px-6 py-5 border-b border-[var(--border-color)]/70 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xs ${
                        isInflow 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                    }`}>
                        {isInflow ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-[var(--text-main)]">
                                {isInflow ? 'Record Cash Inward Voucher' : 'Record Cash Outward Voucher'}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                                isInflow 
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                            }`}>
                                {isInflow ? '+ Inflow' : '– Outflow'}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {isInflow 
                                ? 'Record receipts from retail sales, customer deposits, or pledge interest payments' 
                                : 'Record operational withdrawals, staff advances, supplier payouts, or loan disbursements'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onCancel}
                    className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors border border-transparent hover:border-[var(--border-color)]"
                    title="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Date Field */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5">
                            Transaction Date
                        </label>
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
                            className={`w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] ${fieldErrors.transaction_date ? 'border-red-500' : 'border-[var(--border-color)]'} shadow-xs focus:border-[var(--gold-primary)] border p-2.5 text-xs font-semibold focus:outline-none`}
                        />
                        <FormFieldError id="cash-date-error" error={fieldErrors.transaction_date} />
                    </div>

                    {/* Amount Field with Quick Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">
                                Amount (₹ INR)
                            </label>
                            <span className="text-[10px] text-[var(--text-secondary)]">Indian Rupee</span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[var(--text-secondary)]">₹</span>
                            <input
                                type="number"
                                required
                                min="1"
                                step="any"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => {
                                    setFormData({ ...formData, amount: e.target.value });
                                    if (fieldErrors.amount) setFieldErrors(prev => ({ ...prev, amount: '' }));
                                }}
                                aria-invalid={Boolean(fieldErrors.amount)}
                                aria-describedby={fieldErrors.amount ? "cash-amount-error" : undefined}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] pl-8 pr-3 py-2.5 text-sm font-bold tabular-nums ${fieldErrors.amount ? 'border-red-500' : 'border-[var(--border-color)]'} shadow-xs focus:border-[var(--gold-primary)] border focus:outline-none`}
                            />
                        </div>
                        <FormFieldError id="cash-amount-error" error={fieldErrors.amount} />

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {QUICK_AMOUNTS.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, amount: amt.toString() })}
                                    className="px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-semibold bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                                >
                                    +₹{amt.toLocaleString('en-IN')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5">
                            Transaction Category
                        </label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) => {
                                setFormData({ ...formData, category: e.target.value });
                                if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: '' }));
                            }}
                            aria-invalid={Boolean(fieldErrors.category)}
                            aria-describedby={fieldErrors.category ? "cash-category-error" : undefined}
                            className={`w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] ${fieldErrors.category ? 'border-red-500' : 'border-[var(--border-color)]'} shadow-xs focus:border-[var(--gold-primary)] border p-2.5 text-xs font-semibold focus:outline-none`}
                        >
                            <option value="">Select Category</option>
                            {isInflow ? (
                                <>
                                    <option value="Sales">Retail POS Jewelry Sales</option>
                                    <option value="Deposit">Customer Gold / Cash Deposit</option>
                                    <option value="Return Interest">Pledge Loan Interest Return</option>
                                    <option value="Loan Principal">Pledge Principal Redemption</option>
                                    <option value="Bullion Sale">Bullion Ingot Sale</option>
                                    <option value="Other">Other Inward Receipt</option>
                                </>
                            ) : (
                                <>
                                    <option value="Loan Disbursement">Pledge Loan Disbursement</option>
                                    <option value="Expense">Store Operational Expense</option>
                                    <option value="Supplier Payout">Bullion / Supplier Settlement</option>
                                    <option value="Salary">Staff Advance / Monthly Salary</option>
                                    <option value="Withdrawal">Bank / Vault Cash Withdrawal</option>
                                    <option value="Other">Other Operational Disbursement</option>
                                </>
                            )}
                        </select>
                        <FormFieldError id="cash-category-error" error={fieldErrors.category} />
                    </div>

                    {/* Payment Mode Selector */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5">
                            Payment Mode / Instrument
                        </label>
                        <select
                            required
                            value={formData.payment_mode}
                            onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                            className="w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-color)] shadow-xs focus:border-[var(--gold-primary)] border p-2.5 text-xs font-semibold focus:outline-none"
                        >
                            <option value="cash">Hard Cash (Vault Drawer)</option>
                            <option value="upi">UPI / Instant QR Payment</option>
                            <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                            <option value="card">Credit / Debit Card POS</option>
                        </select>
                    </div>

                    {/* Description & Reference Memo */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5">
                            Audit Description &amp; Memo Notes
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-xl bg-[var(--bg-elevated)] text-[var(--text-main)] border-[var(--border-color)] shadow-xs focus:border-[var(--gold-primary)] border p-3 text-xs focus:outline-none"
                            rows={3}
                            placeholder="Add reference bill numbers, voucher ID, customer details, or purpose..."
                        />
                    </div>
                </div>

                {/* Form Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]/70">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    >
                        Cancel &amp; Discard
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl shadow-md text-xs font-bold text-white transition-all cursor-pointer ${
                            isInflow 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' 
                                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'
                        } disabled:opacity-50`}
                    >
                        {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Save &amp; Post Voucher</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CashTransactionForm;

