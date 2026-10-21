import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Save, Loader } from 'lucide-react';
import { toast } from '../../utils/toast';
import FormFieldError from '../FormFieldError';
import {
    validateBankPledgeReceive,
    hasErrors,
    firstError
} from '../../utils/adminFormRules';

interface BankPledge {
    id: string;
    pledge_id: string;
    amount_received: number;
    pledges: {
        pledge_number: string;
        customer: { full_name: string };
    };
    bank_master: {
        bank_name: string;
    };
}

const BankPledgeReceiveForm: React.FC<{ onSuccess: () => void, onCancel: () => void }> = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);

    // Search
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundPledges, setFoundPledges] = useState<BankPledge[]>([]);
    const [selectedBankPledge, setSelectedBankPledge] = useState<BankPledge | null>(null);

    // Form
    const [formData, setFormData] = useState({
        amount_paid: '',
        interest_paid: '0',
        received_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [receiveErrors, setReceiveErrors] = useState<Record<string, string>>({});

    const handleSearch = async () => {
        if (!searchTerm) return;
        setSearching(true);
        try {
            // Find 'sent' bank pledges by pledge number
            const { data, error } = await supabase
                .from('bank_pledges')
                .select(`
                    id,
                    pledge_id,
                    amount_received,
                    pledges!inner(pledge_number, customer:customers(full_name)),
                    bank_master(bank_name)
                `)
                .eq('status', 'sent')
                .ilike('pledges.pledge_number', `%${searchTerm}%`)
                .limit(5);

            if (error) throw error;
            setFoundPledges(data as any || []);
        } catch (error) {
            console.error('Error searching bank pledges:', error);
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBankPledge) return;

        const errs = validateBankPledgeReceive({
            amount_paid: formData.amount_paid,
            interest_paid: formData.interest_paid,
            received_date: formData.received_date,
            bankDisbursedAmount: selectedBankPledge.amount_received
        });

        if (hasErrors(errs)) {
            setReceiveErrors(errs);
            const first = firstError(errs);
            if (first) toast.error(first);
            return;
        }
        setReceiveErrors({});

        setLoading(true);
        try {
            // 1. Create Receipt Record
            const { error: insertError } = await supabase
                .from('bank_pledge_receives')
                .insert({
                    bank_pledge_id: selectedBankPledge.id,
                    received_date: formData.received_date,
                    amount_paid: parseFloat(formData.amount_paid),
                    interest_paid: parseFloat(formData.interest_paid),
                    notes: formData.notes
                });

            if (insertError) throw insertError;

            // 2. Update Bank Pledge Status -> 'received'
            const { error: updateBankPledgeError } = await supabase
                .from('bank_pledges')
                .update({ status: 'received' })
                .eq('id', selectedBankPledge.id);

            if (updateBankPledgeError) throw updateBankPledgeError;

            // 3. Update Original Pledge Status -> 'active' (Available for customer redemption now)
            const { error: updatePledgeError } = await supabase
                .from('pledges')
                .update({ status: 'active' })
                .eq('id', selectedBankPledge.pledge_id);

            if (updatePledgeError) throw updatePledgeError;

            toast.success('Pledge received back from bank');
            setReceiveErrors({});
            onSuccess();
        } catch (error: any) {
            console.error('Error receiving bank pledge:', error);
            toast.error('Failed to process receive');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-6">Receive Collateral from Bank Custody</h3>

            {!selectedBankPledge ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Search Bank Pledged Packet</label>
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
                        {foundPledges.map(bp => (
                            <div
                                key={bp.id}
                                onClick={() => {
                                    setSelectedBankPledge(bp);
                                    setFormData(prev => ({ ...prev, amount_paid: bp.amount_received.toString() }));
                                }}
                                className="p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-elevated)] hover:border-[var(--gold-primary)] cursor-pointer flex justify-between items-center transition-colors"
                            >
                                <div>
                                    <p className="font-semibold text-xs text-[var(--gold-primary)] font-mono">{bp.pledges.pledge_number}</p>
                                    <p className="text-xs text-[var(--text-main)] mt-0.5">{bp.bank_master.bank_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xs text-rose-400 tabular-nums">Due: ₹{bp.amount_received.toLocaleString('en-IN')}</p>
                                    <p className="text-[11px] text-[var(--text-secondary)]">{bp.pledges.customer.full_name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl mb-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs font-mono font-bold text-[var(--gold-primary)]">{selectedBankPledge.pledges.pledge_number}</p>
                            <p className="text-xs text-[var(--text-main)] font-medium">{selectedBankPledge.bank_master.bank_name}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedBankPledge(null)}
                            className="text-xs text-[var(--gold-primary)] hover:underline font-semibold"
                        >
                            Change Packet
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Received Date *</label>
                            <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.received_date}
                                onChange={(e) => {
                                    setFormData({ ...formData, received_date: e.target.value });
                                    if (receiveErrors.received_date) {
                                        setReceiveErrors(prev => { const n = { ...prev }; delete n.received_date; return n; });
                                    }
                                }}
                                aria-invalid={Boolean(receiveErrors.received_date)}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none ${
                                    receiveErrors.received_date ? 'border-rose-500' : 'border-[var(--border-color)]'
                                }`}
                            />
                            <FormFieldError error={receiveErrors.received_date} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Amount Paid (Principal) (₹) *</label>
                            <input
                                type="number"
                                required
                                step="any"
                                min="0.01"
                                max={selectedBankPledge.amount_received}
                                value={formData.amount_paid}
                                onChange={(e) => {
                                    setFormData({ ...formData, amount_paid: e.target.value });
                                    if (receiveErrors.amount_paid) {
                                        setReceiveErrors(prev => { const n = { ...prev }; delete n.amount_paid; return n; });
                                    }
                                }}
                                aria-invalid={Boolean(receiveErrors.amount_paid)}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none tabular-nums font-semibold ${
                                    receiveErrors.amount_paid ? 'border-rose-500' : 'border-[var(--border-color)]'
                                }`}
                            />
                            <FormFieldError error={receiveErrors.amount_paid} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Interest Paid (₹)</label>
                            <input
                                type="number"
                                required
                                step="any"
                                min="0"
                                value={formData.interest_paid}
                                onChange={(e) => {
                                    setFormData({ ...formData, interest_paid: e.target.value });
                                    if (receiveErrors.interest_paid) {
                                        setReceiveErrors(prev => { const n = { ...prev }; delete n.interest_paid; return n; });
                                    }
                                }}
                                aria-invalid={Boolean(receiveErrors.interest_paid)}
                                className={`w-full rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none tabular-nums font-semibold ${
                                    receiveErrors.interest_paid ? 'border-rose-500' : 'border-[var(--border-color)]'
                                }`}
                            />
                            <FormFieldError error={receiveErrors.interest_paid} />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Release Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm focus:border-[var(--gold-primary)] p-2.5 text-xs focus:outline-none"
                                rows={2}
                                placeholder="Verification seal status, receipt number..."
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
                            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl shadow-sm text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>Save Bank Release</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default BankPledgeReceiveForm;
