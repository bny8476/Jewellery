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
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-inter font-bold text-[#25282D]">
          Customer Profile &amp; Verification
        </h1>
        <p className="text-xs text-[#8792A2] mt-0.5">
          Manage your personal details, contact preferences, and verified KYC records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xs">
          <form onSubmit={handleSaveProfile} noValidate className="space-y-4 text-xs">
            
            {/* Full Legal Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="profile-fullName" className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#8792A2]">As per Government ID</span>
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
                className={`w-full bg-[#F3F4F6] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] transition-colors focus:outline-none ${
                  profileTouched.fullName && profileErrors.fullName
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                    : profileTouched.fullName && !profileErrors.fullName
                    ? 'border-emerald-500 focus:border-emerald-600'
                    : 'border-[#E5E7EB] focus:border-[#25282D]'
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider">
                  Registered Email Address (Auth ID)
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#8792A2] font-medium">
                  <Lock className="w-3 h-3 text-[#25282D]" /> Verified Account
                </span>
              </div>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-xs text-[#8792A2] cursor-not-allowed select-none"
              />
              <p className="text-[10px] text-[#8792A2] mt-1">
                Tied to your secure login credentials. Contact concierge to update your registered email address.
              </p>
            </div>

            {/* Primary Mobile Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="profile-phone" className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider">
                  Mobile Number (Dispatch &amp; OTP) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#8792A2]">10 digit Indian mobile</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-[#8792A2] select-none">
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
                  className={`w-full bg-[#F3F4F6] border rounded-lg pl-12 pr-3.5 py-2.5 text-xs text-[#343A40] font-mono transition-colors focus:outline-none ${
                    profileTouched.phone && profileErrors.phone
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : profileTouched.phone && !profileErrors.phone
                      ? 'border-emerald-500 focus:border-emerald-600'
                      : 'border-[#E5E7EB] focus:border-[#25282D]'
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="profile-dob" className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#8792A2]">Required for compliance</span>
              </div>
              <input
                id="profile-dob"
                type="date"
                required
                value={profileForm.dob}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                onChange={e => handleProfileFieldChange('dob', e.target.value)}
                onBlur={() => handleProfileFieldBlur('dob')}
                className={`w-full bg-[#F3F4F6] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] transition-colors focus:outline-none ${
                  profileTouched.dob && profileErrors.dob
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                    : profileTouched.dob && !profileErrors.dob
                    ? 'border-emerald-500 focus:border-emerald-600'
                    : 'border-[#E5E7EB] focus:border-[#25282D]'
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
                <label htmlFor="profile-gender" className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  id="profile-gender"
                  value={profileForm.gender}
                  onChange={e => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-xs text-[#343A40] focus:outline-none focus:border-[#25282D]"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label htmlFor="profile-lang" className="block text-[11px] font-semibold text-[#8792A2] uppercase tracking-wider mb-1.5">
                  Preferred Language
                </label>
                <select
                  id="profile-lang"
                  value={profileForm.preferredLanguage}
                  onChange={e => setProfileForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-xs text-[#343A40] focus:outline-none focus:border-[#25282D]"
                >
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="English">English</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons: Discard & Save */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetProfile}
                disabled={!isProfileDirty || isSavingProfile}
                className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] text-[#8792A2] hover:text-[#25282D] hover:border-[#25282D] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer bg-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard Changes</span>
              </button>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-lg bg-[#25282D] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#C9A45C]" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* KYC & Identity Status Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#25282D]" />
            <h3 className="font-inter font-bold text-base text-[#25282D]">
              KYC &amp; Compliance
            </h3>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Patron (Tier 1)</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Verified for high-value jewellery transactions exceeding ₹2,00,000 in accordance with bullion regulations.
            </p>
          </div>

          <div className="space-y-2 text-xs text-[#8792A2]">
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB]">
              <span>PAN Record:</span>
              <span className="font-mono font-bold text-[#25282D]">ABCDE****F</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB]">
              <span>Aadhaar Masked:</span>
              <span className="font-mono font-bold text-[#25282D]">**** **** 9012</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span>Verification:</span>
              <span className="font-semibold text-[#25282D]">YAZHINI Compliance</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerProfileTab;
