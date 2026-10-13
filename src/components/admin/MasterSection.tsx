import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building, Briefcase, Gem, FileText, Building2, Users, X, Save } from 'lucide-react';
import {
    getCompanies, createCompany, updateCompany, deleteCompany,
    getLoanTypes, createLoanType, updateLoanType, deleteLoanType,
    getJewelleryTypes, createJewelleryType, updateJewelleryType, deleteJewelleryType,
    getSchemes, createScheme, updateScheme, deleteScheme,
    getBanks, createBank, updateBank, deleteBank
} from '../../services/pawnshopService';
import type { Company, LoanType, JewelleryType, Scheme, BankMaster } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { validateRequired, validatePhone, validateEmail, validatePositiveNumber, validateNonNegativeNumber } from '../../utils/validation';

type MasterTab = 'company' | 'loan_type' | 'jewellery_type' | 'scheme' | 'bank' | 'users';

const MasterSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MasterTab>('company');

    const tabs = [
        { id: 'company' as MasterTab, label: 'Company / Branch', icon: Building },
        { id: 'loan_type' as MasterTab, label: 'Loan Types', icon: Briefcase },
        { id: 'jewellery_type' as MasterTab, label: 'Jewellery Types', icon: Gem },
        { id: 'scheme' as MasterTab, label: 'Schemes & Rates', icon: FileText },
        { id: 'bank' as MasterTab, label: 'Bank Master', icon: Building2 },
        { id: 'users' as MasterTab, label: 'User Directory', icon: Users },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-serif font-bold text-[var(--text-main)]">Master Configuration</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Core business rules, scheme schedules, asset categories, and institutional banking parameters.</p>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-1.5 shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all ${
                                    isActive
                                        ? 'bg-[var(--gold-primary)] text-black shadow-sm'
                                        : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Workspace */}
            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                {activeTab === 'company' && <CompanyMaster />}
                {activeTab === 'loan_type' && <LoanTypeMaster />}
                {activeTab === 'jewellery_type' && <JewelleryTypeMaster />}
                {activeTab === 'scheme' && <SchemeMaster />}
                {activeTab === 'bank' && <BankMasterComponent />}
                {activeTab === 'users' && <UserList />}
            </div>
        </div>
    );
};

// Company Master Component
const CompanyMaster: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Company | null>(null);
    const [formData, setFormData] = useState<Partial<Company>>({
        company_name: '',
        branch_name: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        language_preference: 'en'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getCompanies();
        setCompanies(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateRequired(formData.company_name)) {
            toast.error('Company name is required');
            return;
        }
        if (formData.phone && !validatePhone(formData.phone)) {
            toast.error('Please enter a valid 10-digit Indian phone number');
            return;
        }
        if (formData.email && !validateEmail(formData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            if (editingItem) {
                await updateCompany(editingItem.id, formData);
            } else {
                await createCompany(formData);
            }
            resetForm();
            loadData();
            toast.success(editingItem ? 'Company updated successfully' : 'Company created successfully');
        } catch (error) {
            console.error('Error saving company:', error);
            toast.error('Failed to save company');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this company?')) return;
        try {
            await deleteCompany(id);
            loadData();
            toast.success('Company deleted successfully');
        } catch (error) {
            console.error('Error deleting company:', error);
            toast.error('Failed to delete company');
        }
    };

    const resetForm = () => {
        setFormData({
            company_name: '',
            branch_name: '',
            address: '',
            city: '',
            state: '',
            phone: '',
            email: '',
            language_preference: 'en'
        });
        setShowForm(false);
        setEditingItem(null);
    };

    const startEdit = (item: Company) => {
        setFormData(item);
        setEditingItem(item);
        setShowForm(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-main)]">Company &amp; Branch Directory</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Registered lending branch identities and official contact details.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Company</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-color)]">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
                        <h4 className="text-sm font-semibold text-[var(--text-main)]">{editingItem ? 'Edit Company Information' : 'Register New Company / Branch'}</h4>
                        <button onClick={resetForm} className="text-[var(--text-secondary)] hover:text-[var(--text-main)] p-1">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Company Name *</label>
                            <input
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Branch Name</label>
                            <input
                                type="text"
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">State</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Language</label>
                            <select
                                value={formData.language_preference}
                                onChange={(e) => setFormData({ ...formData, language_preference: e.target.value as 'en' | 'ta' | 'hi' })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            >
                                <option value="en">English</option>
                                <option value="ta">Tamil</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex space-x-2 pt-2">
                            <button
                                type="submit"
                                className="bg-[var(--gold-primary)] text-black px-5 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingItem ? 'Update' : 'Save'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
                <table className="w-full">
                    <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Company Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Branch</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">City</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Phone</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-xs text-[var(--text-secondary)]">No company records registered. Click "Add Company" above.</td>
                            </tr>
                        ) : companies.map((company) => (
                            <tr key={company.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-[var(--text-main)]">{company.company_name}</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{company.branch_name || '—'}</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{company.city || '—'}</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] tabular-nums">{company.phone || '—'}</td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <div className="inline-flex space-x-2">
                                        <button
                                            onClick={() => startEdit(company)}
                                            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors"
                                            title="Edit Company"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(company.id)}
                                            className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
                                            title="Delete Company"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Loan Type Master Component
const LoanTypeMaster: React.FC = () => {
    const [items, setItems] = useState<LoanType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<LoanType | null>(null);
    const [formData, setFormData] = useState({ loan_type_name: '', description: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getLoanTypes();
        setItems(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateLoanType(editingItem.id, formData);
            } else {
                await createLoanType(formData);
            }
            resetForm();
            loadData();
            toast.success(editingItem ? 'Loan type updated successfully' : 'Loan type created successfully');
        } catch (error) {
            console.error('Error saving loan type:', error);
            toast.error('Failed to save loan type');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this loan type?')) return;
        try {
            await deleteLoanType(id);
            loadData();
            toast.success('Loan type deleted successfully');
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete loan type');
        }
    };

    const resetForm = () => {
        setFormData({ loan_type_name: '', description: '' });
        setShowForm(false);
        setEditingItem(null);
    };

    const startEdit = (item: LoanType) => {
        setFormData({ loan_type_name: item.loan_type_name, description: item.description || '' });
        setEditingItem(item);
        setShowForm(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-main)]">Loan Types</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Classification of pawn contracts (e.g., Gold Loan, Silver Pawn, Asset Mortgage).</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Loan Type</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-color)]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Loan Type Name *</label>
                            <input
                                type="text"
                                value={formData.loan_type_name}
                                onChange={(e) => setFormData({ ...formData, loan_type_name: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="bg-[var(--gold-primary)] text-black px-5 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingItem ? 'Update' : 'Save'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-[var(--text-secondary)]">No loan types defined yet. Click "Add Loan Type" above.</div>
                ) : items.map((item) => (
                    <div key={item.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--gold-primary)] transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-sm text-[var(--text-main)]">{item.loan_type_name}</h4>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">{item.description || 'No description provided'}</p>
                            </div>
                            <div className="flex space-x-2 ml-2">
                                <button onClick={() => startEdit(item)} className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Jewellery Type Master
const JewelleryTypeMaster: React.FC = () => {
    const [items, setItems] = useState<JewelleryType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<JewelleryType | null>(null);
    const [formData, setFormData] = useState({ jewellery_type_name: '', description: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getJewelleryTypes();
        setItems(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateJewelleryType(editingItem.id, formData);
            } else {
                await createJewelleryType(formData);
            }
            resetForm();
            loadData();
            toast.success(editingItem ? 'Jewellery type updated successfully' : 'Jewellery type created successfully');
        } catch (error) {
            console.error('Error saving jewellery type:', error);
            toast.error('Failed to save jewellery type');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this jewellery type?')) return;
        try {
            await deleteJewelleryType(id);
            loadData();
            toast.success('Jewellery type deleted successfully');
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete jewellery type');
        }
    };

    const resetForm = () => {
        setFormData({ jewellery_type_name: '', description: '' });
        setShowForm(false);
        setEditingItem(null);
    };

    const startEdit = (item: JewelleryType) => {
        setFormData({ jewellery_type_name: item.jewellery_type_name, description: item.description || '' });
        setEditingItem(item);
        setShowForm(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-main)]">Jewellery Categories</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Ornament classification (Necklaces, Bangles, Coins, Bullion, Rings).</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Jewellery Type</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-color)]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Jewellery Type Name *</label>
                            <input
                                type="text"
                                value={formData.jewellery_type_name}
                                onChange={(e) => setFormData({ ...formData, jewellery_type_name: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="bg-[var(--gold-primary)] text-black px-5 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingItem ? 'Update' : 'Save'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs text-[var(--text-secondary)]">No jewellery types defined yet. Click "Add Jewellery Type" above.</div>
                ) : items.map((item) => (
                    <div key={item.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 hover:border-[var(--gold-primary)] transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--gold-primary)]">
                                    <Gem className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-[var(--text-main)]">{item.jewellery_type_name}</h4>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.description || 'No description'}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => startEdit(item)} className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Scheme Master - Schemes with interest rates
const SchemeMaster: React.FC = () => {
    const [items, setItems] = useState<Scheme[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Scheme | null>(null);
    const [formData, setFormData] = useState<Partial<Scheme>>({
        scheme_name: '',
        interest_rate: 0,
        interest_type: 'monthly',
        redemption_period_days: 365,
        penalty_rate: 0,
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getSchemes();
        setItems(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateRequired(formData.scheme_name)) {
            toast.error('Scheme name is required');
            return;
        }
        if (!validatePositiveNumber(formData.interest_rate)) {
            toast.error('Interest rate must be a positive number');
            return;
        }
        if (formData.redemption_period_days !== undefined && !validatePositiveNumber(formData.redemption_period_days)) {
            toast.error('Redemption period days must be greater than 0');
            return;
        }
        if (formData.penalty_rate !== undefined && !validateNonNegativeNumber(formData.penalty_rate)) {
            toast.error('Penalty rate must be non-negative');
            return;
        }

        try {
            if (editingItem) {
                await updateScheme(editingItem.id, formData);
            } else {
                await createScheme(formData);
            }
            resetForm();
            loadData();
            toast.success(editingItem ? 'Scheme updated successfully' : 'Scheme created successfully');
        } catch (error) {
            console.error('Error saving scheme:', error);
            toast.error('Failed to save scheme');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this scheme?')) return;
        try {
            await deleteScheme(id);
            loadData();
            toast.success('Scheme deleted successfully');
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete scheme');
        }
    };

    const resetForm = () => {
        setFormData({
            scheme_name: '',
            interest_rate: 0,
            interest_type: 'monthly',
            redemption_period_days: 365,
            penalty_rate: 0,
            description: ''
        });
        setShowForm(false);
        setEditingItem(null);
    };

    const startEdit = (item: Scheme) => {
        setFormData(item);
        setEditingItem(item);
        setShowForm(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-main)]">Loan &amp; Interest Schemes</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Interest schedules, tenure durations, and grace-period terms.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Scheme</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-color)]">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Scheme Name *</label>
                            <input
                                type="text"
                                value={formData.scheme_name}
                                onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Interest Rate (%) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.interest_rate}
                                onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] tabular-nums"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Interest Type *</label>
                            <select
                                value={formData.interest_type}
                                onChange={(e) => setFormData({ ...formData, interest_type: e.target.value as 'monthly' | 'annual' | 'daily' })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="annual">Annual</option>
                                <option value="daily">Daily</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Redemption Period (Days)</label>
                            <input
                                type="number"
                                value={formData.redemption_period_days}
                                onChange={(e) => setFormData({ ...formData, redemption_period_days: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] tabular-nums"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Penalty Rate (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.penalty_rate}
                                onChange={(e) => setFormData({ ...formData, penalty_rate: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] tabular-nums"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div className="md:col-span-2 flex space-x-2 pt-2">
                            <button
                                type="submit"
                                className="bg-[var(--gold-primary)] text-black px-5 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingItem ? 'Update' : 'Save'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
                <table className="w-full">
                    <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Scheme Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Interest Rate</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Redemption Period</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-xs text-[var(--text-secondary)]">No schemes registered. Click "Add Scheme" above.</td>
                            </tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-[var(--text-main)]">{item.scheme_name}</td>
                                <td className="px-4 py-3 text-sm text-[var(--gold-primary)] font-semibold tabular-nums">{item.interest_rate}%</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] capitalize">{item.interest_type}</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] tabular-nums">{item.redemption_period_days} days</td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <div className="inline-flex space-x-2">
                                        <button onClick={() => startEdit(item)} className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Bank Master Component
const BankMasterComponent: React.FC = () => {
    const [items, setItems] = useState<BankMaster[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<BankMaster | null>(null);
    const [formData, setFormData] = useState<Partial<BankMaster>>({
        bank_name: '',
        branch_name: '',
        account_number: '',
        ifsc_code: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getBanks();
        setItems(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateBank(editingItem.id, formData);
            } else {
                await createBank(formData);
            }
            resetForm();
            loadData();
            toast.success(editingItem ? 'Bank updated successfully' : 'Bank created successfully');
        } catch (error) {
            console.error('Error saving bank:', error);
            toast.error('Failed to save bank');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this bank?')) return;
        try {
            await deleteBank(id);
            loadData();
            toast.success('Bank deleted successfully');
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete bank');
        }
    };

    const resetForm = () => {
        setFormData({
            bank_name: '',
            branch_name: '',
            account_number: '',
            ifsc_code: '',
            contact_person: '',
            phone: '',
            email: '',
            address: ''
        });
        setShowForm(false);
        setEditingItem(null);
    };

    const startEdit = (item: BankMaster) => {
        setFormData(item);
        setEditingItem(item);
        setShowForm(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-main)]">Institutional Banks</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Settlement bank accounts, IFSC routing codes, and treasury linkage.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Bank</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-color)]">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Bank Name *</label>
                            <input
                                type="text"
                                value={formData.bank_name}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Branch Name</label>
                            <input
                                type="text"
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Account Number</label>
                            <input
                                type="text"
                                value={formData.account_number}
                                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] tabular-nums"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">IFSC Code</label>
                            <input
                                type="text"
                                value={formData.ifsc_code}
                                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Contact Person</label>
                            <input
                                type="text"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)] tabular-nums"
                            />
                        </div>

                        <div className="md:col-span-2 flex space-x-2 pt-2">
                            <button
                                type="submit"
                                className="bg-[var(--gold-primary)] text-black px-5 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingItem ? 'Update' : 'Save'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
                <table className="w-full">
                    <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Bank Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Branch</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Account Number</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">IFSC Code</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-xs text-[var(--text-secondary)]">No banking records configured. Click "Add Bank" above.</td>
                            </tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-[var(--text-main)]">{item.bank_name}</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{item.branch_name || '—'}</td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] tabular-nums">{item.account_number || '—'}</td>
                                <td className="px-4 py-3 text-sm font-mono text-xs text-[var(--text-secondary)]">{item.ifsc_code || '—'}</td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <div className="inline-flex space-x-2">
                                        <button onClick={() => startEdit(item)} className="text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// User List Component
const UserList: React.FC = () => {
    return (
        <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--text-main)]">Administrative User Roles</h3>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl p-5 text-xs text-[var(--text-secondary)]">
                <p className="leading-relaxed">Administrative RBAC privileges are actively managed through the unified <strong className="text-[var(--text-main)]">Users Tab</strong> in the top navigation.</p>
            </div>
        </div>
    );
};

export default MasterSection;
