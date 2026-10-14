import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Save, Loader } from 'lucide-react';
import { toast } from '../../utils/toast';

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
        if (!formData.bank_id) {
            toast.error('Please select a bank');
            return;
        }

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
            onSuccess();
        } catch (error: any) {
            console.error('Error creating bank pledge:', error);
            toast.error(error.message || 'Failed to create bank pledge');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">New Bank Pledge</h3>

            {!selectedPledge ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Pledge</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                placeholder="Enter Pledge Number..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
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
                                className="p-3 border border-gray-200 rounded hover:bg-purple-50 cursor-pointer flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{pledge.pledge_number}</p>
                                    <p className="text-sm text-gray-500">{pledge.customer?.full_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-purple-600">₹{pledge.loan_amount}</p>
                                    <p className="text-sm text-gray-500">{pledge.total_weight_grams}g</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg mb-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-purple-900 font-bold">{selectedPledge.pledge_number}</p>
                            <p className="text-xs text-purple-700">{selectedPledge.customer?.full_name}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedPledge(null)}
                            className="text-xs text-purple-600 underline"
                        >
                            Change
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                            <select
                                required
                                value={formData.bank_id}
                                onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                            >
                                <option value="">Select a bank...</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.bank_name} - {bank.branch_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sent Date</label>
                            <input
                                type="date"
                                required
                                value={formData.sent_date}
                                onChange={(e) => setFormData({ ...formData, sent_date: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (₹)</label>
                            <input
                                type="number"
                                required
                                step="any"
                                value={formData.amount_received}
                                onChange={(e) => setFormData({ ...formData, amount_received: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Interest Rate (%)</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.bank_interest_rate}
                                onChange={(e) => setFormData({ ...formData, bank_interest_rate: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
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
                            className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
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
