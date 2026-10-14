import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Save, Loader } from 'lucide-react';
import { toast } from '../../utils/toast';

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
            onSuccess();
        } catch (error: any) {
            console.error('Error receiving bank pledge:', error);
            toast.error('Failed to process receive');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Receive from Bank</h3>

            {!selectedBankPledge ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Bank Pledge</label>
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
                        {foundPledges.map(bp => (
                            <div
                                key={bp.id}
                                onClick={() => {
                                    setSelectedBankPledge(bp);
                                    setFormData(prev => ({ ...prev, amount_paid: bp.amount_received.toString() }));
                                }}
                                className="p-3 border border-gray-200 rounded hover:bg-purple-50 cursor-pointer flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{bp.pledges.pledge_number}</p>
                                    <p className="text-sm text-gray-500">{bp.bank_master.bank_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-red-600">Due: ₹{bp.amount_received}</p>
                                    <p className="text-xs text-gray-500">{bp.pledges.customer.full_name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg mb-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-blue-900 font-bold">{selectedBankPledge.pledges.pledge_number}</p>
                            <p className="text-xs text-blue-700">{selectedBankPledge.bank_master.bank_name}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedBankPledge(null)}
                            className="text-xs text-blue-600 underline"
                        >
                            Change
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
                            <input
                                type="date"
                                required
                                value={formData.received_date}
                                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (Principal) (₹)</label>
                            <input
                                type="number"
                                required
                                step="any"
                                value={formData.amount_paid}
                                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Paid (₹)</label>
                            <input
                                type="number"
                                required
                                step="any"
                                value={formData.interest_paid}
                                onChange={(e) => setFormData({ ...formData, interest_paid: e.target.value })}
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
                            className="flex items-center space-x-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>Save Receive</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default BankPledgeReceiveForm;
