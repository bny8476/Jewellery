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
                <div>
                    <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">Bank Pledges &amp; Custody</h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage bank partner custody, re-pledging loans to institutional financiers, and release tracking</p>
                </div>
                {view !== 'dashboard' && (
                    <button
                        onClick={() => setView('dashboard')}
                        className="px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] text-xs font-semibold transition-colors"
                    >
                        &larr; Back to Dashboard
                    </button>
                )}
            </div>

            {view === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 hover:border-[var(--gold-primary)] transition-all cursor-pointer" onClick={() => setView('manage_banks')}>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                                <Building2 className="h-6 w-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">Manage Banks</h3>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">Add, edit, or configure institutional banking partners.</p>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 hover:border-[var(--gold-primary)] transition-all cursor-pointer" onClick={() => setView('pledge_entry')}>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                                <Send className="h-6 w-6 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">Bank Pledge Entry</h3>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">Re-pledge customer collateral packets into bank custody.</p>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 hover:border-[var(--gold-primary)] transition-all cursor-pointer" onClick={() => setView('pledge_receive')}>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                                <Download className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">Bank Pledge Receive</h3>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">Release and receive collateral packets back from banks.</p>
                    </div>
                </div>
            )}

            {view === 'manage_banks' && (
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">Institutional Bank List</h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Authorized bank branches holding customer collateral packages</p>
                        </div>
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
                            className="bg-[var(--gold-primary)] text-black px-4 py-2.5 rounded-xl font-semibold text-xs hover:opacity-90 transition-opacity flex items-center space-x-2 shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Partner Bank</span>
                        </button>
                    </div>

                    {isFormOpen && (
                        <div className="p-6 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                            <h4 className="text-sm font-bold text-[var(--text-main)] mb-4">{editingBank ? 'Edit Bank Partner' : 'Add New Bank Partner'}</h4>
                            <form onSubmit={handleSaveBank} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] p-2.5 text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                                        value={bankForm.bank_name}
                                        onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Branch Name</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] p-2.5 text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                                        value={bankForm.branch_name}
                                        onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] p-2.5 text-xs focus:outline-none focus:border-[var(--gold-primary)] font-mono"
                                        value={bankForm.account_number}
                                        onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] p-2.5 text-xs focus:outline-none focus:border-[var(--gold-primary)] uppercase font-mono"
                                        value={bankForm.ifsc_code}
                                        onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] p-2.5 text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                                        value={bankForm.contact_person}
                                        onChange={(e) => setBankForm({ ...bankForm, contact_person: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Phone</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] p-2.5 text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                                        value={bankForm.phone}
                                        onChange={(e) => setBankForm({ ...bankForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[var(--gold-primary)] text-black px-5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                                    >
                                        Save Bank Partner
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border-color)] text-xs">
                            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] font-semibold border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="px-6 py-3.5 text-left">Bank Name</th>
                                    <th className="px-6 py-3.5 text-left">Branch</th>
                                    <th className="px-6 py-3.5 text-left">Contact</th>
                                    <th className="px-6 py-3.5 text-left">Status</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {banks.map((bank) => (
                                    <tr key={bank.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--text-main)]">{bank.bank_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">{bank.branch_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[var(--text-secondary)]">
                                            <div className="text-[var(--text-main)] font-medium">{bank.contact_person}</div>
                                            <div className="text-xs font-mono">{bank.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 inline-flex text-[11px] font-bold rounded-full border ${
                                                bank.is_active 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}>
                                                {bank.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="inline-flex space-x-2">
                                                <button onClick={() => handleEditBank(bank)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteBank(bank.id)} className="p-1 text-[var(--text-secondary)] hover:text-rose-400 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {banks.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-[var(--text-secondary)]">No banking partners registered yet.</td>
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
