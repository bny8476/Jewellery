import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Save, Loader } from 'lucide-react';
import { toast } from '../../utils/toast';
import FormFieldError from '../FormFieldError';
import {
    validateBankPledgeEntry,
    hasErrors,
    firstError
} from '../../utils/adminFormRules';

interface Bank {
    id: string;
    bank_name: string;
    branch_name: string;
}

interface Pledge {
    id: string;
    pledge_number: string;
    customer: { full_name: string };
    loan_amount: number;
    total_weight_grams: number;
}

const BankPledgeEntryForm: React.FC<{ onSuccess: () => void, onCancel: () => void }> = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundPledges, setFoundPledges] = useState<Pledge[]>([]);
    const [selectedPledge, setSelectedPledge] = useState<Pledge | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        bank_id: '',
        amount_received: '',
        bank_interest_rate: '',
        sent_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        const { data } = await supabase
            .from('bank_master')
            .select('id, bank_name, branch_name')
            .eq('is_active', true);
        if (data) setBanks(data);
    };

    const handleSearch = async () => {
        if (!searchTerm) return;
        setSearching(true);
        try {
            // Find active pledges that are NOT already bank pledged or closed
            const { data, error } = await supabase
                .from('pledges')
                .select(`
                    id, 
                    pledge_number, 
                    loan_amount, 
                    total_weight_grams,
                    customer:customers(full_name)
                `)
                .eq('status', 'active')
                .or(`pledge_number.ilike.%${searchTerm}%`)
                .limit(5);

            if (error) throw error;
            setFoundPledges(data as any || []);
        } catch (error) {
            console.error('Error searching pledges:', error);
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPledge) {
            toast.error('Please select a pledge first');
            return;
        }

        const errs = validateBankPledgeEntry({
            pledge_id: selectedPledge.id,
            bank_id: formData.bank_id,
            amount_received: formData.amount_received,
            bank_interest_rate: formData.bank_interest_rate,
            sent_date: formData.sent_date,
            customerLoanAmount: selectedPledge.loan_amount
        });

        if (hasErrors(errs)) {
            setFormErrors(errs);
            const first = firstError(errs);
            if (first) toast.error(first);
            return;
        }
        setFormErrors({});

        setLoading(true);
        try {
            // 1. Create Bank Pledge Record
            const { error: insertError } = await supabase
                .from('bank_pledges')
                .insert({
                    pledge_id: selectedPledge.id,
                    bank_id: formData.bank_id,
                    amount_received: parseFloat(formData.amount_received),
                    bank_interest_rate: parseFloat(formData.bank_interest_rate || '0'),
                    sent_date: formData.sent_date,
                    status: 'sent',
                    notes: formData.notes
                });

            if (insertError) throw insertError;

            // 2. Update Pledge Status
            const { error: updateError } = await supabase
                .from('pledges')
                .update({ status: 'bank_pledged' })
                .eq('id', selectedPledge.id);

            if (updateError) throw updateError;

            toast.success('Pledge successfully sent to bank');
            setFormErrors({});
            onSuccess();
        } catch (error: any) {
            console.error('Error creating bank pledge:', error);
            toast.error(error.message || 'Failed to create bank pledge');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">New Bank Pledge Placement</h3>

            {!selectedPledge ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Search Customer Pawn Pledge</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none"
                                placeholder="Enter Pledge Number (e.g., PL-2026-0001)..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="bg-[var(--gold-primary)] text-black font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-xs flex items-center justify-center"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {foundPledges.map(pledge => (
                            <div
                                key={pledge.id}
                                onClick={() => setSelectedPledge(pledge)}
                                className="p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-elevated)] hover:border-[var(--gold-primary)] cursor-pointer flex justify-between items-center transition-colors"
                            >
                                <div>
                                    <p className="font-semibold text-xs text-[var(--gold-primary)] font-mono">{pledge.pledge_number}</p>
                                    <p className="text-xs text-[var(--text-main)] mt-0.5">{pledge.customer?.full_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xs text-[var(--text-main)] tabular-nums">₹{pledge.loan_amount.toLocaleString('en-IN')}</p>
                                    <p className="text-[11px] text-[var(--text-secondary)]">{pledge.total_weight_grams}g Gross</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl mb-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-mono font-bold text-[var(--gold-primary)]">{selectedPledge.pledge_number}</p>
                            <p className="text-xs text-[var(--text-main)] font-medium">{selectedPledge.customer?.full_name}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedPledge(null)}
                            className="text-xs text-[var(--gold-primary)] hover:underline font-semibold"
                        >
                            Change Pledge
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Select Partner Bank *</label>
                            <select
                                required
                                value={formData.bank_id}
                                onChange={(e) => {
                                    setFormData({ ...formData, bank_id: e.target.value });
                                    if (formErrors.bank_id) {
                                        setFormErrors(prev => { const n = { ...prev }; delete n.bank_id; return n; });
                                    }
                                }}
                                aria-invalid={Boolean(formErrors.bank_id)}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none ${
                                    formErrors.bank_id ? 'border-rose-500' : 'border-[var(--border-color)]'
                                }`}
                            >
                                <option value="">Select a bank...</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.bank_name} - {bank.branch_name}</option>
                                ))}
                            </select>
                            <FormFieldError error={formErrors.bank_id} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Sent Date *</label>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.sent_date}
                                onChange={(e) => {
                                    setFormData({ ...formData, sent_date: e.target.value });
                                    if (formErrors.sent_date) {
                                        setFormErrors(prev => { const n = { ...prev }; delete n.sent_date; return n; });
                                    }
                                }}
                                aria-invalid={Boolean(formErrors.sent_date)}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none ${
                                    formErrors.sent_date ? 'border-rose-500' : 'border-[var(--border-color)]'
                                }`}
                            />
                            <FormFieldError error={formErrors.sent_date} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Amount Received (₹) *</label>
                            <input
                                type="number"
                                required
                                step="any"
                                min="0.01"
                                value={formData.amount_received}
                                onChange={(e) => {
                                    setFormData({ ...formData, amount_received: e.target.value });
                                    if (formErrors.amount_received) {
                                        setFormErrors(prev => { const n = { ...prev }; delete n.amount_received; return n; });
                                    }
                                }}
                                aria-invalid={Boolean(formErrors.amount_received)}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none tabular-nums font-semibold ${
                                    formErrors.amount_received ? 'border-rose-500' : 'border-[var(--border-color)]'
                                }`}
                            />
                            <FormFieldError error={formErrors.amount_received} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Bank Interest Rate (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.bank_interest_rate}
                                onChange={(e) => {
                                    setFormData({ ...formData, bank_interest_rate: e.target.value });
                                    if (formErrors.bank_interest_rate) {
                                        setFormErrors(prev => { const n = { ...prev }; delete n.bank_interest_rate; return n; });
                                    }
                                }}
                                aria-invalid={Boolean(formErrors.bank_interest_rate)}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none tabular-nums font-semibold ${
                                    formErrors.bank_interest_rate ? 'border-rose-500' : 'border-[var(--border-color)]'
                                }`}
                            />
                            <FormFieldError error={formErrors.bank_interest_rate} />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Custody Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none"
                                rows={2}
                                placeholder="Packet sealing tags, reference IDs..."
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
                            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl shadow-sm text-xs font-semibold text-black bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>Submit Bank Pledge</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default BankPledgeEntryForm;
