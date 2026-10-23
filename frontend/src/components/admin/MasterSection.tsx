import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building, Briefcase, Gem, FileText, Building2, Users, X, Save, AlertCircle, Loader2 } from 'lucide-react';
import {
    getCompanies, createCompany, updateCompany, deleteCompany,
    getLoanTypes, createLoanType, updateLoanType, deleteLoanType,
    getJewelleryTypes, createJewelleryType, updateJewelleryType, deleteJewelleryType,
    getSchemes, createScheme, updateScheme, deleteScheme,
    getBanks, createBank, updateBank, deleteBank
} from '../../services/pawnshopService';
import type { Company, LoanType, JewelleryType, Scheme, BankMaster } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { validateRequired, validatePhone, validateEmail, validatePositiveNumber, validateNonNegativeNumber, validatePincode, validateGSTIN, validateMinLength } from '../../utils/validation';

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
                <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">Master Configuration</h2>
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
    const [isSaving, setIsSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const initialFormData: Partial<Company> = {
        company_name: '',
        branch_name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        gst_number: '',
        license_number: '',
        language_preference: 'en',
        is_active: true
    };

    const [formData, setFormData] = useState<Partial<Company>>(initialFormData);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getCompanies();
        setCompanies(data);
    };

    const validateField = (field: string, value: any): string | null => {
        switch (field) {
            case 'company_name': {
                const val = (value || '').trim();
                if (!val) return 'Company name is required';
                if (!validateMinLength(val, 2)) return 'Company name must be at least 2 characters';
                if (val.length > 100) return 'Company name cannot exceed 100 characters';
                return null;
            }
            case 'branch_name': {
                const val = (value || '').trim();
                if (val && !validateMinLength(val, 2)) return 'Branch name must be at least 2 characters';
                if (val && val.length > 80) return 'Branch name cannot exceed 80 characters';
                return null;
            }
            case 'phone': {
                const val = (value || '').trim();
                if (val && !validatePhone(val)) {
                    return 'Enter a valid 10-digit Indian phone number (starts with 6-9)';
                }
                return null;
            }
            case 'email': {
                const val = (value || '').trim();
                if (val && !validateEmail(val)) {
                    return 'Please enter a valid email address';
                }
                return null;
            }
            case 'pincode': {
                const val = (value || '').trim();
                if (val && !validatePincode(val)) {
                    return 'Enter a valid 6-digit Indian PIN code';
                }
                return null;
            }
            case 'gst_number': {
                const val = (value || '').trim();
                if (val && !validateGSTIN(val)) {
                    return 'Enter a valid 15-character GSTIN (e.g. 33AAAAA0000A1Z5)';
                }
                return null;
            }
            case 'license_number': {
                const val = (value || '').trim();
                if (val && val.length > 50) return 'License number cannot exceed 50 characters';
                return null;
            }
            default:
                return null;
        }
    };

    const handleFieldChange = (field: keyof Company, val: any) => {
        setFormData((prev) => ({ ...prev, [field]: val }));
        if (touched[field]) {
            const error = validateField(field, val);
            setFormErrors((prev) => {
                const updated = { ...prev };
                if (error) {
                    updated[field] = error;
                } else {
                    delete updated[field];
                }
                return updated;
            });
        }
    };

    const handleBlur = (field: keyof Company) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const error = validateField(field, formData[field]);
        setFormErrors((prev) => {
            const updated = { ...prev };
            if (error) {
                updated[field] = error;
            } else {
                delete updated[field];
            }
            return updated;
        });
    };

    const validateAll = (): boolean => {
        const fieldsToValidate: Array<keyof Company> = [
            'company_name',
            'branch_name',
            'phone',
            'email',
            'pincode',
            'gst_number',
            'license_number'
        ];
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        fieldsToValidate.forEach((f) => {
            newTouched[f] = true;
            const err = validateField(f, formData[f]);
            if (err) {
                newErrors[f] = err;
            }
        });

        setTouched((prev) => ({ ...prev, ...newTouched }));
        setFormErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateAll()) {
            toast.error('Please fix the highlighted errors before saving');
            return;
        }

        setIsSaving(true);
        try {
            const payload: Partial<Company> = {
                ...formData,
                company_name: formData.company_name?.trim() || '',
                branch_name: formData.branch_name?.trim() || undefined,
                address: formData.address?.trim() || undefined,
                city: formData.city?.trim() || undefined,
                state: formData.state?.trim() || undefined,
                pincode: formData.pincode?.trim() || undefined,
                phone: formData.phone?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                gst_number: formData.gst_number?.trim().toUpperCase() || undefined,
                license_number: formData.license_number?.trim() || undefined,
            };

            if (editingItem) {
                await updateCompany(editingItem.id, payload);
            } else {
                await createCompany(payload);
            }
            resetForm();
            await loadData();
            toast.success(editingItem ? 'Company updated successfully' : 'Company registered successfully');
        } catch (error: any) {
            console.error('Error saving company:', error);
            toast.error(error?.message || 'Failed to save company');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this company?')) return;
        try {
            await deleteCompany(id);
            await loadData();
            toast.success('Company deleted successfully');
        } catch (error: any) {
            console.error('Error deleting company:', error);
            toast.error(error?.message || 'Failed to delete company');
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setFormErrors({});
        setTouched({});
        setShowForm(false);
        setEditingItem(null);
    };

    const startEdit = (item: Company) => {
        setFormData({
            company_name: item.company_name || '',
            branch_name: item.branch_name || '',
            address: item.address || '',
            city: item.city || '',
            state: item.state || '',
            pincode: item.pincode || '',
            phone: item.phone || '',
            email: item.email || '',
            gst_number: item.gst_number || '',
            license_number: item.license_number || '',
            language_preference: item.language_preference || 'en',
            is_active: item.is_active ?? true
        });
        setFormErrors({});
        setTouched({});
        setEditingItem(item);
        setShowForm(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-main)]">Company &amp; Branch Directory</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Registered lending branch identities, statutory GSTIN, and official contact details.</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-lg hover:brightness-105 active:scale-95 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Company</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-color)] transition-all">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
                        <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-[var(--gold-primary)]" />
                            <h4 className="text-sm font-semibold text-[var(--text-main)]">{editingItem ? 'Edit Company Information' : 'Register New Company / Branch'}</h4>
                        </div>
                        <button onClick={resetForm} className="text-[var(--text-secondary)] hover:text-[var(--text-main)] p-1 rounded-md transition-colors" title="Close Form">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Company Name */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                Company Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.company_name || ''}
                                onChange={(e) => handleFieldChange('company_name', e.target.value)}
                                onBlur={() => handleBlur('company_name')}
                                placeholder="e.g. Yazhini Fine Jewels &amp; Pawn Brokers"
                                className={`w-full px-3 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-colors ${
                                    touched.company_name && formErrors.company_name
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                            />
                            {touched.company_name && formErrors.company_name && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{formErrors.company_name}</span>
                                </p>
                            )}
                        </div>

                        {/* Branch Name */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                Branch Name
                            </label>
                            <input
                                type="text"
                                value={formData.branch_name || ''}
                                onChange={(e) => handleFieldChange('branch_name', e.target.value)}
                                onBlur={() => handleBlur('branch_name')}
                                placeholder="e.g. T. Nagar Flagship Branch"
                                className={`w-full px-3 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-colors ${
                                    touched.branch_name && formErrors.branch_name
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                            />
                            {touched.branch_name && formErrors.branch_name && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{formErrors.branch_name}</span>
                                </p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={formData.phone || ''}
                                onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    handleFieldChange('phone', cleaned);
                                }}
                                onBlur={() => handleBlur('phone')}
                                placeholder="e.g. 9876543210 (10 digits)"
                                className={`w-full px-3 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-colors ${
                                    touched.phone && formErrors.phone
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                            />
                            {touched.phone && formErrors.phone ? (
                                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{formErrors.phone}</span>
                                </p>
                            ) : (
                                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">10-digit Indian mobile number starting with 6, 7, 8, or 9.</p>
                            )}
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleFieldChange('email', e.target.value.trim())}
                                onBlur={() => handleBlur('email')}
                                placeholder="e.g. branch@yazhini.com"
                                className={`w-full px-3 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-colors ${
                                    touched.email && formErrors.email
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                            />
                            {touched.email && formErrors.email && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{formErrors.email}</span>
                                </p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                Street Address
                            </label>
                            <textarea
                                value={formData.address || ''}
                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                rows={2}
                                placeholder="Door no., building, street name, and locality..."
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                value={formData.city || ''}
                                onChange={(e) => handleFieldChange('city', e.target.value)}
                                placeholder="e.g. Chennai"
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        {/* State */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                State
                            </label>
                            <input
                                type="text"
                                value={formData.state || ''}
                                onChange={(e) => handleFieldChange('state', e.target.value)}
                                placeholder="e.g. Tamil Nadu"
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        {/* PIN Code */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                PIN Code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formData.pincode || ''}
                                onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    handleFieldChange('pincode', cleaned);
                                }}
                                onBlur={() => handleBlur('pincode')}
                                placeholder="e.g. 600017"
                                className={`w-full px-3 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-colors ${
                                    touched.pincode && formErrors.pincode
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                            />
                            {touched.pincode && formErrors.pincode && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{formErrors.pincode}</span>
                                </p>
                            )}
                        </div>

                        {/* GST Number (GSTIN) */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                GSTIN (Tax Identification)
                            </label>
                            <input
                                type="text"
                                value={formData.gst_number || ''}
                                onChange={(e) => {
                                    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                                    handleFieldChange('gst_number', cleaned);
                                }}
                                onBlur={() => handleBlur('gst_number')}
                                placeholder="e.g. 33AAAAA0000A1Z5"
                                className={`w-full px-3 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-main)] font-mono placeholder:font-sans placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-colors uppercase ${
                                    touched.gst_number && formErrors.gst_number
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                            />
                            {touched.gst_number && formErrors.gst_number ? (
                                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{formErrors.gst_number}</span>
                                </p>
                            ) : (
                                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">15-digit alphanumeric Indian Goods &amp; Services Tax ID.</p>
                            )}
                        </div>

                        {/* License Number */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                Pawnbroker / Lending License No.
                            </label>
                            <input
                                type="text"
                                value={formData.license_number || ''}
                                onChange={(e) => handleFieldChange('license_number', e.target.value)}
                                onBlur={() => handleBlur('license_number')}
                                placeholder="e.g. PB-TN-CHN-2024-089"
                                className={`w-full px-3 py-2 bg-[var(--bg-card)] border rounded-lg text-sm text-[var(--text-main)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none transition-colors ${
                                    touched.license_number && formErrors.license_number
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                            />
                            {touched.license_number && formErrors.license_number && (
                                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    <span>{formErrors.license_number}</span>
                                </p>
                            )}
                        </div>

                        {/* Language Preference */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                                Print &amp; UI Language
                            </label>
                            <select
                                value={formData.language_preference || 'en'}
                                onChange={(e) => handleFieldChange('language_preference', e.target.value as 'en' | 'ta' | 'hi')}
                                className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            >
                                <option value="en">English (Default)</option>
                                <option value="ta">Tamil (தமிழ்)</option>
                                <option value="hi">Hindi (हिन्दी)</option>
                            </select>
                        </div>

                        {/* Active Status Checkbox */}
                        <div className="md:col-span-2 flex items-center space-x-2 pt-1">
                            <input
                                type="checkbox"
                                id="is_active_company"
                                checked={formData.is_active ?? true}
                                onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-[var(--border-color)] text-[var(--gold-primary)] focus:ring-[var(--gold-primary)]"
                            />
                            <label htmlFor="is_active_company" className="text-xs font-medium text-[var(--text-main)] select-none cursor-pointer">
                                Branch identity is active for official loan issuances, billing, and receipt generation
                            </label>
                        </div>

                        {/* Form Action Buttons */}
                        <div className="md:col-span-2 flex items-center space-x-3 pt-3 border-t border-[var(--border-color)]">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-[var(--gold-primary)] text-black px-6 py-2.5 rounded-lg hover:brightness-105 active:scale-95 disabled:opacity-60 disabled:pointer-events-none text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>{editingItem ? 'Update Company Record' : 'Register Company'}</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={resetForm}
                                className="px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Table */}
            <div className="overflow-x-auto max-h-[60vh] rounded-xl border border-[var(--border-color)] shadow-sm">
                <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)]/95 backdrop-blur-md border-b border-[var(--border-color)] shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Company &amp; Tax ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Branch</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Location</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Contact Info</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-xs text-[var(--text-secondary)]">
                                    No company records registered. Click &quot;Add Company&quot; above to configure your first establishment.
                                </td>
                            </tr>
                        ) : companies.map((company) => (
                            <tr key={company.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                <td className="px-4 py-3 text-sm">
                                    <div className="font-semibold text-[var(--text-main)]">{company.company_name}</div>
                                    {company.gst_number && (
                                        <div className="text-[11px] font-mono text-[var(--gold-primary)] mt-0.5">
                                            GST: {company.gst_number}
                                        </div>
                                    )}
                                    {company.license_number && (
                                        <div className="text-[10px] text-[var(--text-secondary)]">
                                            Lic: {company.license_number}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                    {company.branch_name || '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                    {company.city ? (
                                        <div>
                                            <span>{company.city}</span>
                                            {company.state && <span className="text-xs text-[var(--text-secondary)]/70">, {company.state}</span>}
                                            {company.pincode && <span className="block text-xs font-mono text-[var(--text-secondary)]/60">PIN: {company.pincode}</span>}
                                        </div>
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                    {company.phone && <div className="tabular-nums font-medium text-[var(--text-main)]">{company.phone}</div>}
                                    {company.email && <div className="text-xs text-[var(--text-secondary)]">{company.email}</div>}
                                    {!company.phone && !company.email && '—'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                        company.is_active !== false
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                    }`}>
                                        {company.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
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

            <div className="overflow-x-auto max-h-[60vh] rounded-xl border border-[var(--border-color)]">
                <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)]/95 backdrop-blur-md border-b border-[var(--border-color)] shadow-sm">
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

            <div className="overflow-x-auto max-h-[60vh] rounded-xl border border-[var(--border-color)]">
                <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)]/95 backdrop-blur-md border-b border-[var(--border-color)] shadow-sm">
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
