import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  Lock, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { CustomerAvatar } from '../CustomerAvatar';
import { Camera } from 'lucide-react';
import { kycService } from '../../../services/kycService';
import { CustomerKycModal } from '../CustomerKycModal';
import { useRealtimeEvent } from '../../../services/realtimeService';
import type { KycStatus, CustomerKycRecord } from '../../../types/kyc';

export interface CustomerProfileTabProps {
  user: User | null;
  profileForm: {
    fullName: string;
    phone: string;
    dob: string;
    gender: string;
    preferredLanguage: string;
    photoUrl: string;
  };
  setProfileForm: React.Dispatch<React.SetStateAction<{
    fullName: string;
    phone: string;
    dob: string;
    gender: string;
    preferredLanguage: string;
    photoUrl: string;
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
  const [kycStatus, setKycStatus] = useState<KycStatus>('NOT_SUBMITTED');
  const [kycRecord, setKycRecord] = useState<CustomerKycRecord | null>(null);
  const [isLoadingKyc, setIsLoadingKyc] = useState<boolean>(true);
  const [isKycModalOpen, setIsKycModalOpen] = useState<boolean>(false);
  const [kycModalMode, setKycModalMode] = useState<'submit' | 'resubmit'>('submit');

  const loadKycStatus = useCallback(async () => {
    try {
      setIsLoadingKyc(true);
      const res = await kycService.getCustomerKycStatus();
      setKycStatus(res.status);
      setKycRecord(res.kyc);
    } catch (err) {
      console.warn('[Profile] Failed to fetch KYC status:', err);
    } finally {
      setIsLoadingKyc(false);
    }
  }, []);

  useEffect(() => {
    loadKycStatus();
  }, [loadKycStatus, user]);

  // Real-time synchronization: Auto update profile card immediately when status changes in backend
  useRealtimeEvent('customer.kyc.updated', () => {
    loadKycStatus();
  });

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E7EB] dark:border-[#222733]">
        <h1 className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
          Customer Profile &amp; Verification
        </h1>
        <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] mt-0.5">
          Manage your personal details, contact preferences, and verified KYC records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Form */}
        <div className="lg:col-span-2 bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] p-6 shadow-xs transition-colors">
          <form onSubmit={handleSaveProfile} noValidate className="space-y-4 text-xs">
            
            {/* Interactive Luxury Avatar & Identity Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#FAF8F5] via-white to-[#F5F2EB] dark:from-[#181B22] dark:via-[#13151A] dark:to-[#101217] border border-[#C9A45C]/30 shadow-xs mb-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <CustomerAvatar
                  name={profileForm.fullName || user?.user_metadata?.full_name || 'Valued Patron'}
                  gender={profileForm.gender}
                  photoUrl={profileForm.photoUrl}
                  size="xl"
                  loyaltyTier="Valued Member"
                  withMotion
                />
                
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="font-inter font-bold text-base sm:text-lg text-[#25282D] dark:text-[#F7F8FA]">
                      {profileForm.fullName || 'Valued Patron'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#8792A2] dark:text-[#A0AEC0] mt-0.5">
                    {user?.email || 'Registered Fine Jewellery Client'}
                  </p>

                  {/* Avatar Preset Switcher */}
                  <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileForm(prev => ({ ...prev, gender: 'female', photoUrl: '/images/female_patron_avatar.jpg' }))}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        (profileForm.gender === 'female' || !profileForm.gender) && (!profileForm.photoUrl || profileForm.photoUrl === '/images/female_patron_avatar.jpg')
                          ? 'bg-[#25282D] text-white border-[#25282D] shadow-xs'
                          : 'bg-white dark:bg-[#1E2128] border-stone-200 dark:border-stone-700 text-[#343A40] dark:text-stone-300 hover:border-[#C9A45C]'
                      }`}
                    >
                      <span>👑  (Female)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileForm(prev => ({ ...prev, gender: 'male', photoUrl: '/images/male_patron_avatar.jpg' }))}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profileForm.gender === 'male' && (!profileForm.photoUrl || profileForm.photoUrl === '/images/male_patron_avatar.jpg')
                          ? 'bg-[#25282D] text-white border-[#25282D] shadow-xs'
                          : 'bg-white dark:bg-[#1E2128] border-stone-200 dark:border-stone-700 text-[#343A40] dark:text-stone-300 hover:border-[#C9A45C]'
                      }`}
                    >
                      <span>⚜️ Distinguished (Male)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Legal Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="profile-fullName" className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">As per Government ID</span>
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
                className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] transition-colors focus:outline-none ${
                  profileTouched.fullName && profileErrors.fullName
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500'
                    : profileTouched.fullName && !profileErrors.fullName
                    ? 'border-emerald-500 focus:border-emerald-600'
                    : 'border-[#E5E7EB] dark:border-[#222733] focus:border-[#25282D] dark:focus:border-[#C9A45C]'
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
                <label className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider">
                  Registered Email Address (Auth ID)
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#8792A2] dark:text-[#8D96A5] font-medium">
                  <Lock className="w-3 h-3 text-[#25282D] dark:text-[#D8B878]" /> Verified Account
                </span>
              </div>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full bg-[#F3F4F6] dark:bg-[#181B22]/50 border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-3.5 py-2.5 text-xs text-[#8792A2] dark:text-[#8D96A5] cursor-not-allowed select-none"
              />
              <p className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] mt-1">
                Tied to your secure login credentials. Contact concierge to update your registered email address.
              </p>
            </div>

            {/* Primary Mobile Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="profile-phone" className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider">
                  Mobile Number (Dispatch &amp; OTP) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">10 digit Indian mobile</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-[#8792A2] dark:text-[#8D96A5] select-none">
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
                  className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg pl-12 pr-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] font-mono transition-colors focus:outline-none ${
                    profileTouched.phone && profileErrors.phone
                      ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500'
                      : profileTouched.phone && !profileErrors.phone
                      ? 'border-emerald-500 focus:border-emerald-600'
                      : 'border-[#E5E7EB] dark:border-[#222733] focus:border-[#25282D] dark:focus:border-[#C9A45C]'
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
                <label htmlFor="profile-dob" className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5]">Required for compliance</span>
              </div>
              <input
                id="profile-dob"
                type="date"
                required
                value={profileForm.dob}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                onChange={e => handleProfileFieldChange('dob', e.target.value)}
                onBlur={() => handleProfileFieldBlur('dob')}
                className={`w-full bg-[#F3F4F6] dark:bg-[#181B22] border rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] transition-colors focus:outline-none ${
                  profileTouched.dob && profileErrors.dob
                    ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 focus:border-rose-500'
                    : profileTouched.dob && !profileErrors.dob
                    ? 'border-emerald-500 focus:border-emerald-600'
                    : 'border-[#E5E7EB] dark:border-[#222733] focus:border-[#25282D] dark:focus:border-[#C9A45C]'
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
                <label htmlFor="profile-gender" className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <select
                  id="profile-gender"
                  value={profileForm.gender}
                  onChange={e => {
                    const newGender = e.target.value;
                    setProfileForm(prev => ({
                      ...prev,
                      gender: newGender,
                      photoUrl: !prev.photoUrl || prev.photoUrl.includes('patron_avatar.jpg')
                        ? newGender === 'male' ? '/images/male_patron_avatar.jpg' : '/images/female_patron_avatar.jpg'
                        : prev.photoUrl
                    }));
                  }}
                  className="w-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-3 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C]"
                >
                  <option value="female">Female (👑 )</option>
                  <option value="male">Male (⚜️)</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label htmlFor="profile-lang" className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider mb-1.5">
                  Preferred Language
                </label>
                <select
                  id="profile-lang"
                  value={profileForm.preferredLanguage}
                  onChange={e => setProfileForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-3 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C]"
                >
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="English">English</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>

            {/* Custom Avatar Photo URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="profile-photoUrl" className="block text-[11px] font-semibold text-[#8792A2] dark:text-[#8D96A5] uppercase tracking-wider">
                  Profile Portrait / Photo URL (Optional)
                </label>
                <span className="text-[10px] text-[#8792A2] dark:text-[#8D96A5] flex items-center gap-1">
                  <Camera className="w-3 h-3 text-[#C9A45C]" /> High Resolution
                </span>
              </div>
              <input
                id="profile-photoUrl"
                type="url"
                value={profileForm.photoUrl || ''}
                onChange={e => setProfileForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                placeholder="Paste custom image URL or use royal fine jewellery presets above"
                className="w-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-3.5 py-2.5 text-xs text-[#343A40] dark:text-[#F7F8FA] focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C]"
              />
            </div>

            {/* Action Buttons: Discard & Save */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#222733] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetProfile}
                disabled={!isProfileDirty || isSavingProfile}
                className="px-4 py-2.5 rounded-lg border border-[#E5E7EB] dark:border-[#222733] text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:border-[#25282D] dark:hover:border-[#C9A45C] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#181B22]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard Changes</span>
              </button>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-lg bg-[#25282D] dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white text-xs font-semibold hover:bg-black transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer dark:border dark:border-[#C9A45C]/40"
              >
                <Check className="w-4 h-4 text-[#C9A45C]" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* KYC & Compliance Card (Dynamic Real-Time Verification Lifecycle) */}
        <div className="bg-white dark:bg-[#13151A] rounded-xl border border-[#E5E7EB] dark:border-[#222733] p-6 space-y-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#25282D] dark:text-[#D8B878]" />
              <h3 className="font-inter font-bold text-base text-[#25282D] dark:text-[#F7F8FA]">
                KYC &amp; Compliance
              </h3>
            </div>
            <button
              type="button"
              onClick={loadKycStatus}
              title="Refresh status"
              disabled={isLoadingKyc}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingKyc ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 1. VERIFIED STATE (Green Success Panel) */}
          {kycStatus === 'VERIFIED' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>KYC Verified (Tier 1)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-semibold">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                Verified for high-value jewellery transactions exceeding ₹2,00,000 in accordance with bullion regulations.
              </p>
              {kycRecord?.verified_at && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400/70 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/30">
                  Approved on {new Date(kycRecord.verified_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          )}

          {/* 2. PENDING OR UNDER REVIEW STATE (Amber Panel) */}
          {(kycStatus === 'PENDING' || kycStatus === 'PENDING_VERIFICATION' || kycStatus === 'UNDER_REVIEW') && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {kycStatus === 'UNDER_REVIEW' ? 'Under Compliance Review' : 'Verification Pending'}
                </span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                Your identity verification details have been submitted and are awaiting compliance review. Verification is typically completed within 1–2 business hours.
              </p>
              {kycRecord?.submitted_at && (
                <div className="text-[10px] text-amber-700 dark:text-amber-400/80 pt-1 border-t border-amber-200/60 dark:border-amber-800/40 flex justify-between">
                  <span>Submitted:</span>
                  <span className="font-medium">
                    {new Date(kycRecord.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3. NOT SUBMITTED / UNVERIFIED STATE (Prominent Red Alert Panel) */}
          {(kycStatus === 'NOT_SUBMITTED' || kycStatus === 'UNVERIFIED') && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>KYC Verification Required</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300/80 leading-relaxed">
                Under PMLA guidelines and bullion regulations, identity verification is required before initiating transactions over ₹50,000 or custom jewellery orders.
              </p>
              <button
                type="button"
                onClick={() => {
                  setKycModalMode('submit');
                  setIsKycModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-semibold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Complete KYC Verification</span>
              </button>
            </div>
          )}

          {/* 4. REJECTED STATE (Red Panel with Reason & Resubmit Action) */}
          {kycStatus === 'REJECTED' && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>KYC Submission Rejected</span>
              </div>
              {kycRecord?.rejection_reason && (
                <div className="p-2.5 rounded-lg bg-rose-100/60 dark:bg-rose-900/40 text-[11px] text-rose-900 dark:text-rose-200">
                  <span className="font-semibold block mb-0.5">Reason for Rejection:</span>
                  <p>{kycRecord.rejection_reason}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setKycModalMode('resubmit');
                  setIsKycModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-semibold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Correct Details and Resubmit</span>
              </button>
            </div>
          )}

          {/* 5. ACTION REQUIRED STATE (Amber/Warning Panel with Requested Corrections) */}
          {kycStatus === 'ACTION_REQUIRED' && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Action Required on KYC</span>
              </div>
              {kycRecord?.action_required_notes && (
                <div className="p-2.5 rounded-lg bg-amber-100/60 dark:bg-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
                  <span className="font-semibold block mb-0.5">Requested Information:</span>
                  <p>{kycRecord.action_required_notes}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setKycModalMode('resubmit');
                  setIsKycModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-semibold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Update Requested Information</span>
              </button>
            </div>
          )}

          {/* Masked Credentials & Identification Details */}
          <div className="space-y-2 text-xs text-[#8792A2] dark:text-[#8D96A5] pt-2">
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#222733]">
              <span>PAN Record:</span>
              <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">
                {kycRecord?.pan_masked || kycRecord?.pan_number_masked || 'Not Submitted'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#222733]">
              <span>Aadhaar Masked:</span>
              <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">
                {kycRecord?.aadhaar_masked || kycRecord?.aadhaar_number_masked || 'Not Submitted'}
              </span>
            </div>
            {kycRecord?.reference_id && (
              <div className="flex justify-between py-1.5 border-b border-[#E5E7EB] dark:border-[#222733]">
                <span>Reference ID:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  {kycRecord.reference_id}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span>Verification Authority:</span>
              <span className="font-semibold text-[#25282D] dark:text-[#D8B878]">YAZHINI Compliance</span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive KYC Modal for Submitting or Resubmitting Details */}
      <CustomerKycModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onSuccess={() => {
          loadKycStatus();
        }}
        existingKyc={kycRecord}
        mode={kycModalMode}
      />
    </div>
  );
};

export default CustomerProfileTab;
