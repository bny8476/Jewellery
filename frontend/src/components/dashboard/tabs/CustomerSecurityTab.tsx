import React from 'react';
import { KeyRound, Shield, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export interface CustomerSecurityTabProps {
  user: User | null;
  onRequestPasswordReset: () => void;
  onSignOut: () => void;
}

export const CustomerSecurityTab: React.FC<CustomerSecurityTabProps> = ({
  user,
  onRequestPasswordReset,
  onSignOut
}) => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-inter font-bold text-[#25282D]">
          Security &amp; Account Settings
        </h1>
        <p className="text-xs text-[#8792A2] mt-0.5">
          Password management, account authentication, and active portal sessions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Security Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#25282D]">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="font-inter font-bold text-base text-[#25282D]">
              Authentication &amp; Password
            </h3>
          </div>

          <p className="text-xs text-[#8792A2] leading-relaxed">
            Ensure your account is protected with a secure password. You can dispatch a secure reset link to your registered email (<strong className="text-[#25282D]">{user?.email}</strong>).
          </p>

          <button
            type="button"
            onClick={onRequestPasswordReset}
            className="px-4 py-2.5 rounded-lg bg-[#25282D] hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Send Password Reset Link
          </button>
        </div>

        {/* Session Sign Out Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-[#25282D]">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-inter font-bold text-base text-[#25282D]">
                Active Portal Session
              </h3>
            </div>
            <p className="text-xs text-[#8792A2] leading-relaxed">
              Signed in as <strong className="text-[#25282D]">{user?.email}</strong>. Terminate your active session securely across this browser.
            </p>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Portal</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerSecurityTab;
