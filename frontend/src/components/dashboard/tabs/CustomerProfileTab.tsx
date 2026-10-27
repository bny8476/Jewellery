import React from 'react';
import { 
  AlertCircle, 
  Lock, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

export interface CustomerProfileTabProps {
  user: User | null;
  profileForm: {
    fullName: string;
    phone: string;
    dob: string;
    gender: string;
    preferredLanguage: string;
  };
  setProfileForm: React.Dispatch<React.SetStateAction<{
    fullName: string;
    phone: string;
    dob: string;
    gender: string;
    preferredLanguage: string;
  }>>;
  profileErrors: {
    fullName?: string;
    phone?: string;
    dob?: string;
  };
  profileTouched: {
    fullName?: boolean;
    phone?: boolean;
    dob?: boolean;
  };
  handleProfileFieldChange: (field: 'fullName' | 'phone' | 'dob', val: string) => void;
  handleProfileFieldBlur: (field: 'fullName' | 'phone' | 'dob') => void;
  handleSaveProfile: (e: React.FormEvent) => void;
  handleResetProfile: () => void;
  isProfileDirty: boolean;
  isSavingProfile: boolean;
}

export const CustomerProfileTab: React.FC<CustomerProfileTabProps> = ({
  user,
  profileForm,
  setProfileForm,
  profileErrors,
  profileTouched,
  handleProfileFieldChange,
  handleProfileFieldBlur,
  handleSaveProfile,
  handleResetProfile,
  isProfileDirty,
  isSavingProfile
}) => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[var(--border-color)]">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
          Patron Profile &amp; KYC Records
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Update your contact credentials and verify government-issued identity documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Form */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
          <form onSubmit={handleSaveProfile} noValidate className="space-y-4 text-xs">
            
            {/* Full Legal Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="profile-fullName" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[var(--text-secondary)]">As per PAN / Aadhaar card</span>
              </div>
              <input
                id="profile-fullName"
                type="text"
                required
                value={profileForm.fullName}
                onChange={e => handleProfileFieldChange('fullName', e.target.value)}
                onBlur={() => handleProfileFieldBlur('fullName')}
                placeholder="e.g. Rajeshwari Sundaram"
                maxLength={50}
                className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] transition-colors focus:outline-none ${
                  profileTouched.fullName && profileErrors.fullName
                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                    : profileTouched.fullName && !profileErrors.fullName
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                }`}
              />
              {profileTouched.fullName && profileErrors.fullName && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{profileErrors.fullName}</span>
                </p>
              )}
            </div>

            {/* Registered Email (Readonly Authentication ID) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Registered Email Address (Auth ID)
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-medium">
                  <Lock className="w-3 h-3 text-[var(--gold-primary)]" /> Verified Auth
                </span>
              </div>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full bg-[var(--bg-elevated)]/50 border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-secondary)] cursor-not-allowed select-none"
              />
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                Tied to your 2FA cryptographic token. Contact private concierge to request an email migration.
              </p>
            </div>

            {/* Primary Mobile Phone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="profile-phone" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Primary Mobile Phone (OTP &amp; Armoured Dispatch) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[var(--text-secondary)]">10 digits Indian</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--gold-primary)] select-none">
                  +91
                </span>
                <input
                  id="profile-phone"
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={e => handleProfileFieldChange('phone', e.target.value)}
                  onBlur={() => handleProfileFieldBlur('phone')}
                  placeholder="98401 23456"
                  maxLength={10}
                  className={`w-full bg-[var(--bg-elevated)] border rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-[var(--text-main)] font-mono transition-colors focus:outline-none ${
                    profileTouched.phone && profileErrors.phone
                      ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                      : profileTouched.phone && !profileErrors.phone
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                  }`}
                />
              </div>
              {profileTouched.phone && profileErrors.phone && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{profileErrors.phone}</span>
                </p>
              )}
            </div>

            {/* Date of Birth & Age Compliance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="profile-dob" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Date of Birth (KYC Verification) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[var(--text-secondary)]">Min. 18 years for bullion</span>
              </div>
              <input
                id="profile-dob"
                type="date"
                required
                value={profileForm.dob}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                onChange={e => handleProfileFieldChange('dob', e.target.value)}
                onBlur={() => handleProfileFieldBlur('dob')}
                className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] transition-colors focus:outline-none ${
                  profileTouched.dob && profileErrors.dob
                    ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                    : profileTouched.dob && !profileErrors.dob
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                }`}
              />
              {profileTouched.dob && profileErrors.dob && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{profileErrors.dob}</span>
                </p>
              )}
            </div>

            {/* Gender & Language Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-gender" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  id="profile-gender"
                  value={profileForm.gender}
                  onChange={e => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label htmlFor="profile-lang" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Preferred Language
                </label>
                <select
                  id="profile-lang"
                  value={profileForm.preferredLanguage}
                  onChange={e => setProfileForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                >
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="English">English</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons: Discard & Save */}
            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetProfile}
                disabled={!isProfileDirty || isSavingProfile}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--gold-primary)] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard Changes</span>
              </button>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* KYC & Identity Status Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-serif font-bold text-sm text-[var(--text-main)]">
              KYC Verification Status
            </h3>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Patron (Tier 1 Certified)</span>
            </div>
            <p className="text-[11px] opacity-90">
              Eligible for high-value bullion acquisitions exceeding ₹2,00,000 with PAN compliance.
            </p>
          </div>

          <div className="space-y-2 text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
              <span>PAN Record:</span>
              <span className="font-mono font-bold text-[var(--text-main)]">ABCDE****F</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
              <span>Aadhaar Masked:</span>
              <span className="font-mono font-bold text-[var(--text-main)]">**** **** 9012</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Verified By:</span>
              <span className="font-medium text-[var(--text-main)]">YAZHINI Compliance</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerProfileTab;
