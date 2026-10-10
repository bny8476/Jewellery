import React, { useState, useEffect } from 'react';
import { Save, User, Camera } from 'lucide-react';
import { toast } from '../../utils/toast';
import { supabase } from '../../lib/supabase';
import { AppUser } from '../../types/pawnshop';
import { validateRequired, validateMinLength, validatePhone, validateEmail, validateAadhar, validatePAN } from '../../utils/validation';
import { FormFieldError } from '../FormFieldError';

interface StaffEntryFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialData?: AppUser | null;
}

const StaffEntryForm: React.FC<StaffEntryFormProps> = ({ onSuccess, onCancel, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<AppUser>>({
        username: '',
        password_hash: '', // We set this for new users, but don't show existing hash
        full_name: '',
        role: 'staff',
        email: '',
        phone: '',
        designation: '',
        qualification: '',
        date_of_birth: '',
        gender: 'male',
        address: '',
        id_proof_type: 'aadhar',
        id_proof_number: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        photo_url: '',
        is_blocked: false,
        is_active: true
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Password field state (separate as it's not always in AppUser)
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                password_hash: '' // Clear hash for security
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({ ...prev, [name]: val }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStaffForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!validateRequired(formData.username)) {
            errors.username = 'Username is required';
        } else if (!validateMinLength(formData.username!, 3)) {
            errors.username = 'Username must be at least 3 characters';
        }

        if (!validateRequired(formData.full_name)) {
            errors.full_name = 'Full name is required';
        } else if (!validateMinLength(formData.full_name!, 2)) {
            errors.full_name = 'Full name must be at least 2 characters';
        }

        if (!initialData) {
            if (!validateRequired(password)) {
                errors.password = 'Password is required for new accounts';
            } else if (!validateMinLength(password, 6)) {
                errors.password = 'Password must be at least 6 characters';
            }
        } else if (password && !validateMinLength(password, 6)) {
            errors.password = 'New password must be at least 6 characters';
        }

        if (formData.email && !validateEmail(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !validatePhone(formData.phone)) {
            errors.phone = 'Please enter a valid 10-digit Indian phone number';
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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `staff-photos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents') // Reusing documents bucket or create 'staff-photos' bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
            toast.success('Photo uploaded successfully');
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Failed to upload photo');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStaffForm()) {
            toast.error('Please resolve the errors highlighted below.');
            return;
        }

        setLoading(true);
        try {
            // Check if username exists (only for new)
            if (!initialData) {
                const { data: existing } = await supabase
                    .from('app_users')
                    .select('id')
                    .eq('username', formData.username!)
                    .single();

                if (existing) {
                    setFieldErrors(prev => ({ ...prev, username: 'Username already exists' }));
                    toast.error('Username already exists');
                    setLoading(false);
                    return;
                }
            }

            // Prepare data
            const userPayload: any = { ...formData };
            if (password) {
                userPayload.password_hash = password;
            }

            let error;
            if (initialData?.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('app_users')
                    .update(userPayload)
                    .eq('id', initialData.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('app_users')
                    .insert([userPayload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(initialData ? 'Staff updated successfully' : 'Staff created successfully');
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error('Error saving staff:', error);
            toast.error(error.message || 'Failed to save staff');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                    {initialData ? 'Edit Staff / User' : 'New Staff / User'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Photo Upload Section */}
                    <div className="md:col-span-1 flex flex-col items-center space-y-4">
                        <div className="h-40 w-40 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                            {formData.photo_url ? (
                                <img src={formData.photo_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-20 w-20 text-gray-400" />
                            )}
                            <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                <Camera className="text-white opacity-0 group-hover:opacity-100 h-8 w-8" />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">Click to upload photo</p>
                    </div>

                    {/* Basic Info */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                aria-invalid={Boolean(fieldErrors.username)}
                                aria-describedby={fieldErrors.username ? "staff-username-error" : undefined}
                                className={`mt-1 w-full px-3 py-2 border ${fieldErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                required
                                disabled={!!initialData}
                            />
                            <FormFieldError id="staff-username-error" error={fieldErrors.username} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                                }}
                                aria-invalid={Boolean(fieldErrors.password)}
                                aria-describedby={fieldErrors.password ? "staff-password-error" : undefined}
                                className={`mt-1 w-full px-3 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                placeholder={initialData ? 'Leave blank to keep current' : 'Enter password'}
                            />
                            <FormFieldError id="staff-password-error" error={fieldErrors.password} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                aria-invalid={Boolean(fieldErrors.full_name)}
                                aria-describedby={fieldErrors.full_name ? "staff-fullname-error" : undefined}
                                className={`mt-1 w-full px-3 py-2 border ${fieldErrors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                required
                            />
                            <FormFieldError id="staff-fullname-error" error={fieldErrors.full_name} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="mt-1 w-full px-3 py-2 border rounded-md"
                            >
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                className="mt-1 w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Qualification</label>
                            <input
                                type="text"
                                name="qualification"
                                value={formData.qualification}
                                onChange={handleChange}
                                className="mt-1 w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    </div>
                </div>

                {/* Personal & Bank Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            aria-invalid={Boolean(fieldErrors.phone)}
                            aria-describedby={fieldErrors.phone ? "staff-phone-error" : undefined}
                            className={`mt-1 w-full px-3 py-2 border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                        />
                        <FormFieldError id="staff-phone-error" error={fieldErrors.phone} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            aria-invalid={Boolean(fieldErrors.email)}
                            aria-describedby={fieldErrors.email ? "staff-email-error" : undefined}
                            className={`mt-1 w-full px-3 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                        />
                        <FormFieldError id="staff-email-error" error={fieldErrors.email} />
                    </div>
                </div>

                {/* ID Proof & Bank */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ID Proof Type</label>
                        <select
                            name="id_proof_type"
                            value={formData.id_proof_type}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                        >
                            <option value="aadhar">Aadhar</option>
                            <option value="pan">PAN</option>
                            <option value="voter_id">Voter ID</option>
                            <option value="driving_license">Driving License</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Proof ID Number</label>
                        <input
                            type="text"
                            name="id_proof_number"
                            value={formData.id_proof_number}
                            onChange={handleChange}
                            aria-invalid={Boolean(fieldErrors.id_proof_number)}
                            aria-describedby={fieldErrors.id_proof_number ? "staff-idproof-error" : undefined}
                            className={`mt-1 w-full px-3 py-2 border ${fieldErrors.id_proof_number ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                        />
                        <FormFieldError id="staff-idproof-error" error={fieldErrors.id_proof_number} />
                    </div>
                    <div>
                        <div className="flex items-center mt-6">
                            <input
                                type="checkbox"
                                name="is_blocked"
                                checked={formData.is_blocked}
                                onChange={handleChange}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900 font-bold text-red-600">
                                Block this user
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t bg-gray-50 p-4 rounded-lg">
                    <h4 className="md:col-span-3 text-sm font-bold text-gray-700 uppercase">Bank Details</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input
                            type="text"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                        <input
                            type="text"
                            name="ifsc_code"
                            value={formData.ifsc_code}
                            onChange={handleChange}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow-sm"
                >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Save User'}</span>
                </button>
            </div>
        </form>
    );
};

export default StaffEntryForm;
