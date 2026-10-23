import React, { useState, useEffect } from 'react';
import { Save, User, Camera, Loader2 } from 'lucide-react';
import { toast } from '../../utils/toast';
import { supabase } from '../../lib/supabase';
import { AppUser } from '../../types/pawnshop';
import { 
    validateRequired, 
    validateMinLength, 
    validatePhone, 
    validateEmail, 
    validateAadhar, 
    validatePAN, 
    validateFile,
    validateIFSC,
    validateBankAccount,
    validateMinimumAge,
    validateDateNotFuture
} from '../../utils/validation';
import { FormFieldError } from '../FormFieldError';

async function hashStaffPassword(pwd: string, salt: string = 'jewellery_staff_app'): Promise<string> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(pwd),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: enc.encode(salt),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    return '$pbkdf2$100000$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface StaffEntryFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialData?: AppUser | null;
}

const StaffEntryForm: React.FC<StaffEntryFormProps> = ({ onSuccess, onCancel, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<AppUser>>({
        username: '',
        password_hash: '',
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
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Password field state (separate as it's not plain-text stored)
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                password_hash: '' // Clear hash for security
            });
        }
    }, [initialData]);

    const validateSingleField = (name: string, value: any, currentPassword = password): string | null => {
        switch (name) {
            case 'username': {
                const val = (value || '').trim();
                if (!val) return 'Username is required';
                if (!validateMinLength(val, 3)) return 'Username must be at least 3 characters';
                if (val.length > 30) return 'Username cannot exceed 30 characters';
                if (!/^[a-zA-Z0-9._-]+$/.test(val)) return 'Username can only contain letters, numbers, dots, and hyphens';
                return null;
            }
            case 'full_name': {
                const val = (value || '').trim();
                if (!val) return 'Full name is required';
                if (!validateMinLength(val, 2)) return 'Full name must be at least 2 characters';
                if (val.length > 80) return 'Full name cannot exceed 80 characters';
                return null;
            }
            case 'password': {
                if (!initialData) {
                    if (!currentPassword) return 'Password is required for new accounts';
                    if (!validateMinLength(currentPassword, 6)) return 'Password must be at least 6 characters';
                } else if (currentPassword && !validateMinLength(currentPassword, 6)) {
                    return 'New password must be at least 6 characters';
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
            case 'phone': {
                const val = (value || '').trim();
                if (val && !validatePhone(val)) {
                    return 'Please enter a valid 10-digit Indian phone number (starts with 6-9)';
                }
                return null;
            }
            case 'date_of_birth': {
                const val = (value || '').trim();
                if (val) {
                    if (!validateDateNotFuture(val)) return 'Date of birth cannot be in the future';
                    if (!validateMinimumAge(val, 18)) return 'Staff associate must be at least 18 years old';
                }
                return null;
            }
            case 'id_proof_number': {
                const val = (value || '').trim();
                if (val) {
                    if (formData.id_proof_type === 'aadhar' && !validateAadhar(val)) {
                        return 'Aadhaar must be 12 digits (e.g. 1234 5678 9012)';
                    } else if (formData.id_proof_type === 'pan' && !validatePAN(val)) {
                        return 'PAN format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
                    } else if (val.length < 4) {
                        return 'ID proof number must be at least 4 characters';
                    }
                }
                return null;
            }
            case 'account_number': {
                const val = (value || '').trim();
                if (val && !validateBankAccount(val)) {
                    return 'Account number must be 9 to 18 numeric digits';
                }
                return null;
            }
            case 'ifsc_code': {
                const val = (value || '').trim();
                if (val && !validateIFSC(val)) {
                    return 'Enter valid 11-character IFSC (e.g. SBIN0000456 or HDFC0001234)';
                }
                return null;
            }
            default:
                return null;
        }
    };

    const handleFieldChange = (name: string, rawValue: any) => {
        let cleanValue = rawValue;

        // Field-specific automatic sanitization
        if (name === 'phone') {
            cleanValue = String(rawValue).replace(/\D/g, '').slice(0, 10);
        } else if (name === 'account_number') {
            cleanValue = String(rawValue).replace(/\D/g, '').slice(0, 18);
        } else if (name === 'ifsc_code') {
            cleanValue = String(rawValue).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        } else if (name === 'id_proof_number') {
            if (formData.id_proof_type === 'aadhar') {
                cleanValue = String(rawValue).replace(/\D/g, '').slice(0, 12);
            } else if (formData.id_proof_type === 'pan') {
                cleanValue = String(rawValue).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
            }
        }

        setFormData(prev => ({ ...prev, [name]: cleanValue }));

        // Re-validate if touched or has error
        if (touched[name] || fieldErrors[name]) {
            const error = validateSingleField(name, cleanValue);
            setFieldErrors(prev => {
                const updated = { ...prev };
                if (error) {
                    updated[name] = error;
                } else {
                    delete updated[name];
                }
                return updated;
            });
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const value = field === 'password' ? password : (formData as any)[field];
        const error = validateSingleField(field, value);
        setFieldErrors(prev => {
            const updated = { ...prev };
            if (error) {
                updated[field] = error;
            } else {
                delete updated[field];
            }
            return updated;
        });
    };

    const validateStaffForm = (): boolean => {
        const fieldsToCheck = [
            'username',
            'full_name',
            'password',
            'email',
            'phone',
            'date_of_birth',
            'id_proof_number',
            'account_number',
            'ifsc_code'
        ];

        const errors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        fieldsToCheck.forEach(field => {
            newTouched[field] = true;
            const val = field === 'password' ? password : (formData as any)[field];
            const err = validateSingleField(field, val);
            if (err) {
                errors[field] = err;
            }
        });

        setTouched(prev => ({ ...prev, ...newTouched }));
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Security: Validate file format and size (max 5MB, safe image formats)
        const check = validateFile(file, {
            maxSizeMB: 5,
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
        });
        if (!check.isValid) {
            toast.error(check.error || 'Invalid file format. Allowed: JPG, PNG, WebP');
            return;
        }

        try {
            const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
            const fileName = `${crypto.randomUUID()}.${safeExt}`;
            const filePath = `staff-photos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file, { contentType: file.type });

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
            toast.error('Please resolve the highlighted errors before saving.');
            return;
        }

        setLoading(true);
        try {
            // Check if username exists (only for new)
            if (!initialData) {
                const { data: existing } = await supabase
                    .from('app_users')
                    .select('id')
                    .eq('username', formData.username!.trim())
                    .single();

                if (existing) {
                    setFieldErrors(prev => ({ ...prev, username: 'Username already exists' }));
                    setTouched(prev => ({ ...prev, username: true }));
                    toast.error('Username already exists');
                    setLoading(false);
                    return;
                }
            }

            // Prepare data with cryptographically hashed password
            const userPayload: any = { 
                ...formData,
                username: formData.username?.trim(),
                full_name: formData.full_name?.trim(),
                email: formData.email?.trim() || null,
                phone: formData.phone?.trim() || null,
                designation: formData.designation?.trim() || null,
                qualification: formData.qualification?.trim() || null,
                address: formData.address?.trim() || null,
                id_proof_number: formData.id_proof_number?.trim() || null,
                bank_name: formData.bank_name?.trim() || null,
                account_number: formData.account_number?.trim() || null,
                ifsc_code: formData.ifsc_code?.trim().toUpperCase() || null,
            };

            if (password) {
                userPayload.password_hash = await hashStaffPassword(password, formData.username || 'staff');
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
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)]">
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-3">
                    {initialData ? 'Edit Staff Profile' : 'New Staff Registration'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Photo Upload Section */}
                    <div className="md:col-span-1 flex flex-col items-center space-y-4">
                        <div className="h-36 w-36 rounded-full bg-[var(--bg-elevated)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center overflow-hidden relative group">
                            {formData.photo_url ? (
                                <img src={formData.photo_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-[var(--text-muted)]" />
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                <Camera className="text-white h-7 w-7" />
                            </label>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">Click avatar to upload photo (Max 5MB)</p>
                    </div>

                    {/* Basic Info */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                Username <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username || ''}
                                onChange={(e) => handleFieldChange('username', e.target.value)}
                                onBlur={() => handleBlur('username')}
                                aria-invalid={Boolean(touched.username && fieldErrors.username)}
                                aria-describedby={touched.username && fieldErrors.username ? "staff-username-error" : undefined}
                                className={`w-full px-3 py-2.5 bg-[var(--bg-elevated)] border rounded-xl text-xs text-[var(--text-main)] focus:outline-none transition-colors ${
                                    touched.username && fieldErrors.username 
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                                disabled={!!initialData}
                                placeholder="e.g. rajesh.sharma"
                            />
                            <FormFieldError id="staff-username-error" error={fieldErrors.username} touched={touched.username} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                Password {!initialData && <span className="text-rose-500">*</span>}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (touched.password || fieldErrors.password) {
                                        const err = validateSingleField('password', null, e.target.value);
                                        setFieldErrors(prev => {
                                            const updated = { ...prev };
                                            if (err) updated.password = err;
                                            else delete updated.password;
                                            return updated;
                                        });
                                    }
                                }}
                                onBlur={() => handleBlur('password')}
                                aria-invalid={Boolean(touched.password && fieldErrors.password)}
                                aria-describedby={touched.password && fieldErrors.password ? "staff-password-error" : undefined}
                                className={`w-full px-3 py-2.5 bg-[var(--bg-elevated)] border rounded-xl text-xs text-[var(--text-main)] focus:outline-none transition-colors ${
                                    touched.password && fieldErrors.password 
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                                placeholder={initialData ? 'Leave blank to retain password' : 'Min 6 characters'}
                            />
                            <FormFieldError id="staff-password-error" error={fieldErrors.password} touched={touched.password} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name || ''}
                                onChange={(e) => handleFieldChange('full_name', e.target.value)}
                                onBlur={() => handleBlur('full_name')}
                                aria-invalid={Boolean(touched.full_name && fieldErrors.full_name)}
                                aria-describedby={touched.full_name && fieldErrors.full_name ? "staff-fullname-error" : undefined}
                                className={`w-full px-3 py-2.5 bg-[var(--bg-elevated)] border rounded-xl text-xs text-[var(--text-main)] focus:outline-none transition-colors ${
                                    touched.full_name && fieldErrors.full_name 
                                        ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                        : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                                }`}
                                placeholder="e.g. Rajesh Sharma"
                            />
                            <FormFieldError id="staff-fullname-error" error={fieldErrors.full_name} touched={touched.full_name} />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                Role <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="role"
                                value={formData.role || 'staff'}
                                onChange={(e) => handleFieldChange('role', e.target.value)}
                                className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            >
                                <option value="staff">Staff Associate</option>
                                <option value="manager">Branch Manager</option>
                                <option value="admin">System Administrator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation || ''}
                                onChange={(e) => handleFieldChange('designation', e.target.value)}
                                className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                                placeholder="e.g. Senior Gold Appraiser"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Qualification</label>
                            <input
                                type="text"
                                name="qualification"
                                value={formData.qualification || ''}
                                onChange={(e) => handleFieldChange('qualification', e.target.value)}
                                className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                                placeholder="e.g. GIA Gemologist / B.Com"
                            />
                        </div>
                    </div>
                </div>

                {/* Personal & Contact Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[var(--border-color)]">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Phone</label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                            onBlur={() => handleBlur('phone')}
                            aria-invalid={Boolean(touched.phone && fieldErrors.phone)}
                            aria-describedby={touched.phone && fieldErrors.phone ? "staff-phone-error" : undefined}
                            placeholder="e.g. 9876543210 (10 digits)"
                            className={`w-full px-3 py-2.5 bg-[var(--bg-elevated)] border rounded-xl text-xs text-[var(--text-main)] font-mono focus:outline-none transition-colors ${
                                touched.phone && fieldErrors.phone 
                                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                            }`}
                        />
                        <FormFieldError id="staff-phone-error" error={fieldErrors.phone} touched={touched.phone} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Date of Birth</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth || ''}
                            onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                            onBlur={() => handleBlur('date_of_birth')}
                            aria-invalid={Boolean(touched.date_of_birth && fieldErrors.date_of_birth)}
                            aria-describedby={touched.date_of_birth && fieldErrors.date_of_birth ? "staff-dob-error" : undefined}
                            className={`w-full px-3 py-2.5 bg-[var(--bg-elevated)] border rounded-xl text-xs text-[var(--text-main)] focus:outline-none transition-colors ${
                                touched.date_of_birth && fieldErrors.date_of_birth 
                                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                            }`}
                        />
                        <FormFieldError id="staff-dob-error" error={fieldErrors.date_of_birth} touched={touched.date_of_birth} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender || 'male'}
                            onChange={(e) => handleFieldChange('gender', e.target.value)}
                            className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address || ''}
                            onChange={(e) => handleFieldChange('address', e.target.value)}
                            placeholder="Current residential address..."
                            className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            aria-invalid={Boolean(touched.email && fieldErrors.email)}
                            aria-describedby={touched.email && fieldErrors.email ? "staff-email-error" : undefined}
                            placeholder="e.g. staff@yazhini.com"
                            className={`w-full px-3 py-2.5 bg-[var(--bg-elevated)] border rounded-xl text-xs text-[var(--text-main)] focus:outline-none transition-colors ${
                                touched.email && fieldErrors.email 
                                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                            }`}
                        />
                        <FormFieldError id="staff-email-error" error={fieldErrors.email} touched={touched.email} />
                    </div>
                </div>

                {/* ID Proof & Status */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[var(--border-color)]">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">ID Proof Type</label>
                        <select
                            name="id_proof_type"
                            value={formData.id_proof_type || 'aadhar'}
                            onChange={(e) => {
                                handleFieldChange('id_proof_type', e.target.value);
                                if (formData.id_proof_number) {
                                    handleBlur('id_proof_number');
                                }
                            }}
                            className="w-full px-3 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                        >
                            <option value="aadhar">Aadhaar Card (12 digits)</option>
                            <option value="pan">PAN Card (10 chars)</option>
                            <option value="voter_id">Voter ID</option>
                            <option value="driving_license">Driving License</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Proof ID Number</label>
                        <input
                            type="text"
                            name="id_proof_number"
                            value={formData.id_proof_number || ''}
                            onChange={(e) => handleFieldChange('id_proof_number', e.target.value)}
                            onBlur={() => handleBlur('id_proof_number')}
                            aria-invalid={Boolean(touched.id_proof_number && fieldErrors.id_proof_number)}
                            aria-describedby={touched.id_proof_number && fieldErrors.id_proof_number ? "staff-idproof-error" : undefined}
                            placeholder={formData.id_proof_type === 'aadhar' ? 'e.g. 123456789012' : formData.id_proof_type === 'pan' ? 'e.g. ABCDE1234F' : 'ID Number'}
                            className={`w-full px-3 py-2.5 bg-[var(--bg-elevated)] border rounded-xl text-xs text-[var(--text-main)] font-mono uppercase focus:outline-none transition-colors ${
                                touched.id_proof_number && fieldErrors.id_proof_number 
                                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                            }`}
                        />
                        <FormFieldError id="staff-idproof-error" error={fieldErrors.id_proof_number} touched={touched.id_proof_number} />
                    </div>

                    <div>
                        <div className="flex items-center mt-6">
                            <input
                                type="checkbox"
                                id="is_blocked_checkbox"
                                name="is_blocked"
                                checked={formData.is_blocked || false}
                                onChange={(e) => handleFieldChange('is_blocked', e.target.checked)}
                                className="h-4 w-4 text-rose-500 focus:ring-rose-500 border-[var(--border-color)] rounded cursor-pointer"
                            />
                            <label htmlFor="is_blocked_checkbox" className="ml-2 block text-xs font-bold text-rose-400 select-none cursor-pointer">
                                Suspend / Block Staff Login
                            </label>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-color)]">
                    <h4 className="md:col-span-3 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Payroll &amp; Bank Account Details</h4>
                    
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Bank Name</label>
                        <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name || ''}
                            onChange={(e) => handleFieldChange('bank_name', e.target.value)}
                            placeholder="e.g. State Bank of India"
                            className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Account Number</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            name="account_number"
                            value={formData.account_number || ''}
                            onChange={(e) => handleFieldChange('account_number', e.target.value)}
                            onBlur={() => handleBlur('account_number')}
                            aria-invalid={Boolean(touched.account_number && fieldErrors.account_number)}
                            aria-describedby={touched.account_number && fieldErrors.account_number ? "staff-account-error" : undefined}
                            placeholder="e.g. 123456789012 (9-18 digits)"
                            className={`w-full px-3 py-2.5 bg-[var(--bg-card)] border rounded-xl text-xs text-[var(--text-main)] font-mono focus:outline-none transition-colors ${
                                touched.account_number && fieldErrors.account_number 
                                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                            }`}
                        />
                        <FormFieldError id="staff-account-error" error={fieldErrors.account_number} touched={touched.account_number} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">IFSC Code</label>
                        <input
                            type="text"
                            name="ifsc_code"
                            value={formData.ifsc_code || ''}
                            onChange={(e) => handleFieldChange('ifsc_code', e.target.value)}
                            onBlur={() => handleBlur('ifsc_code')}
                            aria-invalid={Boolean(touched.ifsc_code && fieldErrors.ifsc_code)}
                            aria-describedby={touched.ifsc_code && fieldErrors.ifsc_code ? "staff-ifsc-error" : undefined}
                            placeholder="e.g. SBIN0000456 (11 chars)"
                            className={`w-full px-3 py-2.5 bg-[var(--bg-card)] border rounded-xl text-xs text-[var(--text-main)] font-mono uppercase focus:outline-none transition-colors ${
                                touched.ifsc_code && fieldErrors.ifsc_code 
                                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500' 
                                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                            }`}
                        />
                        <FormFieldError id="staff-ifsc-error" error={fieldErrors.ifsc_code} touched={touched.ifsc_code} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                {onCancel && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onCancel}
                        className="px-5 py-2.5 border border-[var(--border-color)] rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--gold-primary)] text-black rounded-xl hover:opacity-90 font-semibold text-xs shadow-sm disabled:opacity-50 transition-opacity"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving Profile...</span>
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            <span>{initialData ? 'Update Staff Profile' : 'Save Staff Profile'}</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default StaffEntryForm;
