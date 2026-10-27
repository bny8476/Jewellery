import React from 'react';
import { KeyRound } from 'lucide-react';
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
      <div className="pb-4 border-b border-[var(--border-color)]">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
          Security &amp; Account Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Password management, notification preferences, and active portal sessions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Security Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[var(--gold-primary)]" />
            <h3 className="font-serif font-bold text-sm text-[var(--text-main)]">
              Authentication &amp; Password
            </h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Protect your account credentials. You can dispatch a secure password reset link to your registered email (<strong className="text-[var(--text-main)]">{user?.email}</strong>).
          </p>

          <button
            type="button"
            onClick={onRequestPasswordReset}
            className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Send Password Reset Link
          </button>
        </div>

        {/* Session Sign Out Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-sm text-[var(--text-main)] mb-1">
              Active Portal Session
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Signed in as <strong className="text-[var(--text-main)]">{user?.email}</strong>. Terminate your active patron session securely across this browser.
            </p>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Sign Out of Patron Portal
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerSecurityTab;
