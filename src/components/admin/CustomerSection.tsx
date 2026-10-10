import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, User, Camera, Loader } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer } from '../../services/pawnshopService';
import type { Customer, CustomerFormData } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { supabase } from '../../lib/supabase';
import { validatePhone, validateEmail, validateAadhar, validatePAN, validatePincode, validateMinLength, validateRequired } from '../../utils/validation';
import { FormFieldError } from '../FormFieldError';

const CustomerSection: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<CustomerFormData>({
        full_name: '',
        phone: '',
        address: '',
        father_name: '',
        email: '',
        city: '',
        state: '',
        pincode: '',
        id_proof_type: 'aadhar',
        id_proof_number: '',
        photo_url: '',
        // Nominee
        nominee_name: '',
        nominee_relation: '',
        nominee_contact: '',
        nominee_id_proof: ''
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await getCustomers(searchTerm);
            setCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    };

    const handleSearch = () => {
        loadCustomers();
    };

    const validateCustomerForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!validateRequired(formData.full_name)) {
            errors.full_name = 'Full name is required';
        } else if (!validateMinLength(formData.full_name, 2)) {
            errors.full_name = 'Full name must be at least 2 characters';
        }

        if (!validateRequired(formData.phone)) {
            errors.phone = 'Phone number is required';
        } else if (!validatePhone(formData.phone)) {
            errors.phone = 'Please enter a valid 10-digit Indian phone number';
        }

        if (!validateRequired(formData.address)) {
            errors.address = 'Address is required';
        } else if (!validateMinLength(formData.address, 5)) {
            errors.address = 'Address must be at least 5 characters';
        }

        if (formData.email && !validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (formData.pincode && !validatePincode(formData.pincode)) {
            errors.pincode = 'Please enter a valid 6-digit PIN code';
        }

        if (formData.id_proof_number) {
            if (formData.id_proof_type === 'aadhar' && !validateAadhar(formData.id_proof_number)) {
                errors.id_proof_number = 'Aadhaar must be 12 digits (e.g. 1234 5678 9012)';
            } else if (formData.id_proof_type === 'pan' && !validatePAN(formData.id_proof_number)) {
                errors.id_proof_number = 'PAN format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateCustomerForm()) {
            toast.error('Please resolve the highlighted validation errors');
            return;
        }

        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, formData);
            } else {
                await createCustomer(formData);
            }
            resetForm();
            loadCustomers();
            toast.success(editingCustomer ? 'Customer updated successfully' : 'Customer created successfully');
        } catch (error) {
            console.error('Error saving customer:', error);
            toast.error('Failed to save customer');
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            phone: '',
            address: '',
            father_name: '',
            email: '',
            city: '',
            state: '',
            pincode: '',
            id_proof_type: 'aadhar',
            id_proof_number: '',
            nominee_name: '',
            nominee_relation: '',
            nominee_contact: '',
            nominee_id_proof: ''
        });
        setLoading(false);
        setShowForm(false);
        setEditingCustomer(null);
    };

    const [loading, setLoading] = useState(false);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `cust-${Math.random()}.${fileExt}`;
            const filePath = `customer-photos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
            toast.success('Photo uploaded');
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Failed to upload photo');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (customer: Customer) => {
        setFormData({
            full_name: customer.full_name,
            phone: customer.phone,
            address: customer.address,
            father_name: customer.father_name || '',
            email: customer.email || '',
            city: customer.city || '',
            state: customer.state || '',
            pincode: customer.pincode || '',
            id_proof_type: customer.id_proof_type || 'aadhar',
            id_proof_number: customer.id_proof_number || '',
            photo_url: customer.photo_url || '',
            nominee_name: customer.nominee_name || '',
            nominee_relation: customer.nominee_relation || '',
            nominee_contact: customer.nominee_contact || '',
            nominee_id_proof: customer.nominee_id_proof || ''
        });
        setEditingCustomer(customer);
        setShowForm(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900">Customer Management</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Customer</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex space-x-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by name, phone, or customer code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Photo Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                    {formData.photo_url ? (
                                        <img src={formData.photo_url} alt="Customer" className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-16 w-16 text-gray-400" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 shadow-lg">
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={loading} />
                                    {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, full_name: e.target.value });
                                        if (fieldErrors.full_name) setFieldErrors(prev => ({ ...prev, full_name: '' }));
                                    }}
                                    aria-invalid={Boolean(fieldErrors.full_name)}
                                    aria-describedby={fieldErrors.full_name ? "cust-name-error" : undefined}
                                    className={`w-full px-3 py-2 border ${fieldErrors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                    required
                                />
                                <FormFieldError id="cust-name-error" error={fieldErrors.full_name} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                                <input
                                    type="text"
                                    value={formData.father_name}
                                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                                    }}
                                    aria-invalid={Boolean(fieldErrors.phone)}
                                    aria-describedby={fieldErrors.phone ? "cust-phone-error" : undefined}
                                    className={`w-full px-3 py-2 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                    required
                                />
                                <FormFieldError id="cust-phone-error" error={fieldErrors.phone} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                                    }}
                                    aria-invalid={Boolean(fieldErrors.email)}
                                    aria-describedby={fieldErrors.email ? "cust-email-error" : undefined}
                                    className={`w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                />
                                <FormFieldError id="cust-email-error" error={fieldErrors.email} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => {
                                        setFormData({ ...formData, address: e.target.value });
                                        if (fieldErrors.address) setFieldErrors(prev => ({ ...prev, address: '' }));
                                    }}
                                    rows={2}
                                    aria-invalid={Boolean(fieldErrors.address)}
                                    aria-describedby={fieldErrors.address ? "cust-address-error" : undefined}
                                    className={`w-full px-3 py-2 border ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                    required
                                />
                                <FormFieldError id="cust-address-error" error={fieldErrors.address} />
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.pincode}
                                    onChange={(e) => {
                                        setFormData({ ...formData, pincode: e.target.value });
                                        if (fieldErrors.pincode) setFieldErrors(prev => ({ ...prev, pincode: '' }));
                                    }}
                                    aria-invalid={Boolean(fieldErrors.pincode)}
                                    aria-describedby={fieldErrors.pincode ? "cust-pincode-error" : undefined}
                                    placeholder="600001"
                                    className={`w-full px-3 py-2 border ${fieldErrors.pincode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                />
                                <FormFieldError id="cust-pincode-error" error={fieldErrors.pincode} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
                                <select
                                    value={formData.id_proof_type}
                                    onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="aadhar">Aadhar Card</option>
                                    <option value="pan">PAN Card</option>
                                    <option value="voter_id">Voter ID</option>
                                    <option value="passport">Passport</option>
                                    <option value="driving_license">Driving License</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Number</label>
                                <input
                                    type="text"
                                    value={formData.id_proof_number}
                                    onChange={(e) => {
                                        setFormData({ ...formData, id_proof_number: e.target.value });
                                        if (fieldErrors.id_proof_number) setFieldErrors(prev => ({ ...prev, id_proof_number: '' }));
                                    }}
                                    aria-invalid={Boolean(fieldErrors.id_proof_number)}
                                    aria-describedby={fieldErrors.id_proof_number ? "cust-idproof-error" : undefined}
                                    placeholder={formData.id_proof_type === 'aadhar' ? '1234 5678 9012' : formData.id_proof_type === 'pan' ? 'ABCDE1234F' : 'Enter ID number'}
                                    className={`w-full px-3 py-2 border ${fieldErrors.id_proof_number ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                />
                                <FormFieldError id="cust-idproof-error" error={fieldErrors.id_proof_number} />
                            </div>

                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {editingCustomer ? 'Update Customer' : 'Add Customer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Customer List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer Code</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">City</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {customers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-purple-600">{customer.customer_code}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{customer.full_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{customer.city || '-'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => startEdit(customer)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="text-green-600 hover:text-green-800"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {customers.length === 0 && (
                    <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No customers found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerSection;
