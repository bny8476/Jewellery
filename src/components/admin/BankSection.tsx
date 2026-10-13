import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Send, Download, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from '../../utils/toast';
import BankPledgeEntryForm from './BankPledgeEntryForm';
import BankPledgeReceiveForm from './BankPledgeReceiveForm';

// Types
interface Bank {
    id: string;
    bank_name: string;
    branch_name: string;
    account_number: string;
    ifsc_code: string;
    contact_person: string;
    phone: string;
    is_active: boolean;
}

const BankSection: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'manage_banks' | 'pledge_entry' | 'pledge_receive'>('dashboard');
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(false);

    // Bank Master State
    const [editingBank, setEditingBank] = useState<Bank | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [bankForm, setBankForm] = useState({
        bank_name: '',
        branch_name: '',
        account_number: '',
        ifsc_code: '',
        contact_person: '',
        phone: '',
        is_active: true
    });

    useEffect(() => {
        if (view === 'manage_banks') {
            fetchBanks();
        }
    }, [view]);

    const fetchBanks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bank_master')
                .select('*')
                .order('bank_name');

            if (error) throw error;
            setBanks(data || []);
        } catch (error) {
            console.error('Error fetching banks:', error);
            toast.error('Failed to load banks');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBank = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const bankData = {
                ...bankForm,
                // Add any other fields if necessary
            };

            let error;
            if (editingBank) {
                const { error: updateError } = await supabase
                    .from('bank_master')
                    .update(bankData)
                    .eq('id', editingBank.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('bank_master')
                    .insert([bankData]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(editingBank ? 'Bank updated successfully' : 'Bank added successfully');
            setIsFormOpen(false);
            setEditingBank(null);
            setBankForm({
                bank_name: '',
                branch_name: '',
                account_number: '',
                ifsc_code: '',
                contact_person: '',
                phone: '',
                is_active: true
            });
            fetchBanks();
        } catch (error) {
            console.error('Error saving bank:', error);
            toast.error('Failed to save bank details');
        }
    };

    const handleEditBank = (bank: Bank) => {
        setEditingBank(bank);
        setBankForm({
            bank_name: bank.bank_name,
            branch_name: bank.branch_name || '',
            account_number: bank.account_number || '',
            ifsc_code: bank.ifsc_code || '',
            contact_person: bank.contact_person || '',
            phone: bank.phone || '',
            is_active: bank.is_active
        });
        setIsFormOpen(true);
    };

    const handleDeleteBank = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bank?')) return;
        try {
            const { error } = await supabase
                .from('bank_master')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Bank deleted successfully');
            fetchBanks();
        } catch (error) {
            console.error('Error deleting bank:', error);
            toast.error('Failed to delete bank');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Bank Operations</h2>
                {view !== 'dashboard' && (
                    <button
                        onClick={() => setView('dashboard')}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                        &larr; Back to Dashboard
                    </button>
                )}
            </div>

            {view === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-blue-500" onClick={() => setView('manage_banks')}>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Manage Banks</h3>
                        </div>
                        <p className="text-gray-600">Add, edit, or remove bank partners.</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-purple-500" onClick={() => setView('pledge_entry')}>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <Send className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Bank Pledge Entry</h3>
                        </div>
                        <p className="text-gray-600">Re-pledge customer items to a bank.</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-green-500" onClick={() => setView('pledge_receive')}>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Download className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Bank Pledge Receive</h3>
                        </div>
                        <p className="text-gray-600">Receive items back from the bank.</p>
                    </div>
                </div>
            )}

            {view === 'manage_banks' && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">Bank List</h3>
                        <button
                            onClick={() => {
                                setEditingBank(null);
                                setBankForm({
                                    bank_name: '',
                                    branch_name: '',
                                    account_number: '',
                                    ifsc_code: '',
                                    contact_person: '',
                                    phone: '',
                                    is_active: true
                                });
                                setIsFormOpen(true);
                            }}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Bank</span>
                        </button>
                    </div>

                    {isFormOpen && (
                        <div className="p-6 bg-gray-50 border-b border-gray-200">
                            <h4 className="text-lg font-medium mb-4">{editingBank ? 'Edit Bank' : 'Add New Bank'}</h4>
                            <form onSubmit={handleSaveBank} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={bankForm.bank_name}
                                        onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={bankForm.branch_name}
                                        onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={bankForm.account_number}
                                        onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={bankForm.ifsc_code}
                                        onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={bankForm.contact_person}
                                        onChange={(e) => setBankForm({ ...bankForm, contact_person: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                        value={bankForm.phone}
                                        onChange={(e) => setBankForm({ ...bankForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                                    >
                                        Save Bank
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {banks.map((bank) => (
                                    <tr key={bank.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bank.bank_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bank.branch_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{bank.contact_person}</div>
                                            <div className="text-xs">{bank.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bank.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {bank.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleEditBank(bank)} className="text-indigo-600 hover:text-indigo-900">
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDeleteBank(bank.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {banks.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No banks found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'pledge_entry' && (
                <BankPledgeEntryForm
                    onSuccess={() => setView('dashboard')}
                    onCancel={() => setView('dashboard')}
                />
            )}

            {view === 'pledge_receive' && (
                <BankPledgeReceiveForm
                    onSuccess={() => setView('dashboard')}
                    onCancel={() => setView('dashboard')}
                />
            )}
        </div>
    );
};

export default BankSection;
