import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, MapPin, Save, Loader } from 'lucide-react';
import Footer from '../components/Footer';
import { toast } from '../utils/toast';
import { validatePhone, validatePincode, validateMinLength } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';

interface ProfileData {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    created_at: string;
}

const Profile: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = '/login';
                return;
            }

            // Determine table based on role
            const role = user.user_metadata?.role;
            const table = ['admin', 'manager', 'staff'].includes(role) ? 'app_users' : 'customers';

            // Fetch profile data
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Profile missing
                } else {
                    console.error('Error fetching profile:', error);
                }
            }

            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    pincode: data.pincode || ''
                });
            } else {
                setFormData(prev => ({ ...prev, full_name: user.user_metadata?.full_name || '' }));
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (formData.full_name && !validateMinLength(formData.full_name, 2)) {
            errors.full_name = 'Full name must be at least 2 characters';
        }

        if (formData.phone && !validatePhone(formData.phone)) {
            errors.phone = 'Please enter a valid 10-digit Indian phone number (with optional +91)';
        }

        if (formData.pincode && !validatePincode(formData.pincode)) {
            errors.pincode = 'Please enter a valid 6-digit Indian PIN code';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please resolve the errors highlighted below.');
            return;
        }

        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const role = user.user_metadata?.role;
            const table = ['admin', 'manager', 'staff'].includes(role) ? 'app_users' : 'customers';

            // Prepare updates based on table schema
            const updates: any = {
                id: user.id,
                full_name: formData.full_name,
                phone: formData.phone,
                updated_at: new Date().toISOString(),
            };

            if (table === 'app_users') {
                // app_users only has address field
                updates.address = formData.address;
                // Append city/state/zip to address if needed, or just ignore for now as field isn't there
            } else {
                // customers has all fields
                updates.address = formData.address;
                updates.city = formData.city;
                updates.state = formData.state;
                updates.pincode = formData.pincode;
            }

            const { error } = await supabase
                .from(table)
                .upsert(updates);

            if (error) throw error;

            toast.success('Profile updated successfully');
            fetchProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center transition-colors duration-300">
                <Loader className="h-8 w-8 text-[var(--gold-primary)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
            <div className="flex-grow container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8 pb-4 border-b border-[var(--border-color)]">
                        <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase block mb-1">
                            ACCOUNT SETTINGS
                        </span>
                        <h1 className="text-3xl font-inter font-bold text-[var(--text-main)]">Client Profile</h1>
                        <p className="text-[var(--text-secondary)] text-xs mt-1">Manage your identity and secured shipping addresses</p>
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
                        <div className="bg-[var(--bg-elevated)] border-b border-[var(--border-color)] px-6 py-5">
                            <div className="flex items-center space-x-4">
                                <div className="h-14 w-14 bg-[var(--bg-card)] border border-[var(--gold-primary)]/40 rounded-xl flex items-center justify-center text-xl font-inter font-bold text-gold-gradient shadow-md">
                                    {formData.full_name ? formData.full_name[0].toUpperCase() : <User className="h-6 w-6 text-[var(--gold-primary)]" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-inter font-bold text-[var(--text-main)]">{formData.full_name || 'Client'}</h2>
                                    <p className="text-[var(--text-secondary)] flex items-center text-xs mt-0.5">
                                        <Mail className="h-3.5 w-3.5 mr-1.5 text-[var(--gold-primary)]" />
                                        {profile?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <User className="h-4 w-4 text-[var(--text-secondary)]" />
                                        </div>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            aria-invalid={Boolean(fieldErrors.full_name)}
                                            aria-describedby={fieldErrors.full_name ? "profile-fullname-error" : undefined}
                                            className={`pl-10 block w-full bg-[var(--bg-elevated)] border ${fieldErrors.full_name ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] p-2.5 text-xs`}
                                            placeholder="Alexander Hamilton"
                                        />
                                    </div>
                                    <FormFieldError id="profile-fullname-error" error={fieldErrors.full_name} />
                                </div>

                                <div>
                                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Phone className="h-4 w-4 text-[var(--text-secondary)]" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            aria-invalid={Boolean(fieldErrors.phone)}
                                            aria-describedby={fieldErrors.phone ? "profile-phone-error" : undefined}
                                            className={`pl-10 block w-full bg-[var(--bg-elevated)] border ${fieldErrors.phone ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] p-2.5 text-xs`}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <FormFieldError id="profile-phone-error" error={fieldErrors.phone} />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                                        Default Shipping Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 pt-3 pointer-events-none">
                                            <MapPin className="h-4 w-4 text-[var(--text-secondary)]" />
                                        </div>
                                        <textarea
                                            name="address"
                                            rows={3}
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="pl-10 block w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] p-2.5 text-xs"
                                            placeholder="Suite / Street, Apartment"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="block w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] p-2.5 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="block w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] p-2.5 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider text-[11px]">
                                        Pincode
                                    </label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        aria-invalid={Boolean(fieldErrors.pincode)}
                                        aria-describedby={fieldErrors.pincode ? "profile-pincode-error" : undefined}
                                        className={`block w-full bg-[var(--bg-elevated)] border ${fieldErrors.pincode ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] p-2.5 text-xs`}
                                        placeholder="600001"
                                    />
                                    <FormFieldError id="profile-pincode-error" error={fieldErrors.pincode} />
                                </div>
                            </div>

                            <div className="pt-5 border-t border-[var(--border-color)] flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black px-5 py-2.5 rounded-xl font-semibold uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-md shadow-[var(--gold-primary)]/20 disabled:opacity-50"
                                >
                                    {saving ? (
                                        'Saving...'
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Profile;
