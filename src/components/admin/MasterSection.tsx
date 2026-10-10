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
        { id: 'company' as MasterTab, label: 'Company', icon: Building },
        { id: 'loan_type' as MasterTab, label: 'Loan Types', icon: Briefcase },
        { id: 'jewellery_type' as MasterTab, label: 'Jewellery Types', icon: Gem },
        { id: 'scheme' as MasterTab, label: 'Schemes', icon: FileText },
        { id: 'bank' as MasterTab, label: 'Bank Master', icon: Building2 },
        { id: 'users' as MasterTab, label: 'User List', icon: Users },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Master Data Management</h2>

            {/* Sub Tabs */}
            <div className="bg-white rounded-lg shadow-md p-2">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-md p-6">
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Company / Branch Management</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Company</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold">{editingItem ? 'Edit Company' : 'Add New Company'}</h4>
                        <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                            <input
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                            <input
                                type="text"
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                            <select
                                value={formData.language_preference}
                                onChange={(e) => setFormData({ ...formData, language_preference: e.target.value as 'en' | 'ta' | 'hi' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="en">English</option>
                                <option value="ta">Tamil</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingItem ? 'Update' : 'Save'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Branch</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">City</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {companies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.company_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{company.branch_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{company.city || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{company.phone || '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => startEdit(company)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(company.id)}
                                            className="text-red-600 hover:text-red-800"
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

// Loan Type Master Component (Simplified version - similar pattern)
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
        if (!window.confirm('Are you sure?')) return;
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Loan Types</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Loan Type</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type Name *</label>
                            <input
                                type="text"
                                value={formData.loan_type_name}
                                onChange={(e) => setFormData({ ...formData, loan_type_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                {editingItem ? 'Update' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-gray-900">{item.loan_type_name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{item.description || 'No description'}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-800">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
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

// Jewellery Type Master (Similar to Loan Type)
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
        if (!window.confirm('Are you sure?')) return;
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Jewellery Types</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Jewellery Type</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jewellery Type Name *</label>
                            <input
                                type="text"
                                value={formData.jewellery_type_name}
                                onChange={(e) => setFormData({ ...formData, jewellery_type_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                {editingItem ? 'Update' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <Gem className="h-8 w-8 text-purple-600" />
                                <div>
                                    <h4 className="font-semibold text-gray-900">{item.jewellery_type_name}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{item.description || 'No description'}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-800">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
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

// Scheme Master - More complex with interest rates
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
        if (!window.confirm('Are you sure?')) return;
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Loan Schemes</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Scheme</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Name *</label>
                            <input
                                type="text"
                                value={formData.scheme_name}
                                onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.interest_rate}
                                onChange={(e) => setFormData({ ...formData, interest_rate: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Type *</label>
                            <select
                                value={formData.interest_type}
                                onChange={(e) => setFormData({ ...formData, interest_type: e.target.value as 'monthly' | 'annual' | 'daily' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="annual">Annual</option>
                                <option value="daily">Daily</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Redemption Period (Days)</label>
                            <input
                                type="number"
                                value={formData.redemption_period_days}
                                onChange={(e) => setFormData({ ...formData, redemption_period_days: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Rate (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.penalty_rate}
                                onChange={(e) => setFormData({ ...formData, penalty_rate: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2 flex space-x-2">
                            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                {editingItem ? 'Update' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Scheme Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Interest Rate</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Redemption Period</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.scheme_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{item.interest_rate}%</td>
                                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{item.interest_type}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{item.redemption_period_days} days</td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex space-x-2">
                                        <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-800">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
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

// Bank Master Component (Similar to Company)
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
        if (!window.confirm('Are you sure?')) return;
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Bank Master</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Bank</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                            <input
                                type="text"
                                value={formData.bank_name}
                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                            <input
                                type="text"
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <input
                                type="text"
                                value={formData.account_number}
                                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                            <input
                                type="text"
                                value={formData.ifsc_code}
                                onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input
                                type="text"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="md:col-span-2 flex space-x-2">
                            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                {editingItem ? 'Update' : 'Save'}
                            </button>
                            <button type="button" onClick={resetForm} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bank Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Branch</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Account Number</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IFSC Code</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.bank_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{item.branch_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{item.account_number || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{item.ifsc_code || '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                    <div className="flex space-x-2">
                                        <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-800">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
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

// User List Component (Placeholder)
const UserList: React.FC = () => {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">User Management</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">User management functionality will be implemented with proper authentication system.</p>
            </div>
        </div>
    );
};

export default MasterSection;
