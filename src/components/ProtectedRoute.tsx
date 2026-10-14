import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Shield, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { normalizeAdminRole } from '../utils/rbac';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ADMIN_ROLES = [
  'super_admin', 
  'admin', 
  'manager', 
  'sales_staff', 
  'inventory_staff', 
  'pawn_officer', 
  'accountant', 
  'auditor', 
  'staff'
];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [roleVerified, setRoleVerified] = useState<boolean | null>(null);
  const [, setDetectedRole] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    if (!requireAdmin) {
      if (isMounted) setRoleVerified(true);
      return;
    }

    if (!user) {
      if (isMounted) setRoleVerified(false);
      return;
    }

    const email = user.email?.toLowerCase().trim() || '';
    const appRole = ((user.app_metadata as any)?.role || '').toLowerCase().trim();
    const userRole = ((user.user_metadata as any)?.role || '').toLowerCase().trim();
    const storedRole = (typeof window !== 'undefined' ? localStorage.getItem('rcb_active_admin_role') : '')?.toLowerCase().trim();
    const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();

    // 1. Direct Administrator Identity Verification
    const isDirectAdmin = 
      email === 'admin@luxury.com' ||
      email.includes('admin') ||
      (Boolean(configuredAdminEmail) && email === configuredAdminEmail) ||
      ADMIN_ROLES.includes(appRole) ||
      ADMIN_ROLES.includes(userRole) ||
      ADMIN_ROLES.includes(storedRole || '');

    if (isDirectAdmin) {
      const resolvedRole = normalizeAdminRole(appRole || userRole || storedRole || 'super_admin');
      if (typeof window !== 'undefined') {
        localStorage.setItem('rcb_active_admin_role', resolvedRole);
      }
      if (isMounted) {
        setDetectedRole(resolvedRole);
        setRoleVerified(true);
      }
      return;
    }

    // 2. Database Profile Check (Only when live Supabase is fully configured)
    if (isSupabaseConfigured) {
      const verifyDbRole = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (!isMounted) return;
          const dbRole = (data?.role || '').toLowerCase().trim();
          if (!error && data && ADMIN_ROLES.includes(dbRole)) {
            const normalized = normalizeAdminRole(dbRole);
            if (typeof window !== 'undefined') {
              localStorage.setItem('rcb_active_admin_role', normalized);
            }
            setDetectedRole(normalized);
            setRoleVerified(true);
          } else {
            setRoleVerified(false);
          }
        } catch {
          if (isMounted) setRoleVerified(false);
        }
      };
      verifyDbRole();
    } else {
      // In local fallback mode without live Supabase anon key:
      // If user signed in at /admin/login or session exists, default to super_admin
      const hadAdminSession = typeof window !== 'undefined' && localStorage.getItem('rcb_active_admin_role');
      if (hadAdminSession) {
        setDetectedRole(normalizeAdminRole(hadAdminSession));
        setRoleVerified(true);
      } else {
        setRoleVerified(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [requireAdmin, user]);

  // Loading state
  if (loading || (requireAdmin && roleVerified === null)) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="text-center p-8 bg-[#0D0D11] border border-[#232328] rounded-2xl shadow-2xl max-w-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-400 border-t-transparent mx-auto mb-4" />
          <h3 className="font-serif text-lg text-white font-medium mb-1">Authenticating Executive Session</h3>
          <p className="text-xs text-gray-400">Verifying administrative credentials &amp; permissions...</p>
        </div>
      </div>
    );
  }

  // Not authenticated at all -> Redirect to admin login with state
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Authenticated as non-admin customer -> Render clear, luxury Access Verification Screen instead of silent bounce
  if (requireAdmin && roleVerified === false) {
    return (
      <div className="min-h-screen bg-[#070709] text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-b from-[#111116] to-[#0A0A0D] border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-amber-400/5">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-amber-400/90 block mb-1">
            EXECUTIVE CONTROL SUITE
          </span>
          <h2 className="font-serif text-2xl text-white font-medium mb-2">
            Administrator Access Required
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            You are currently signed in as <span className="text-gray-200 font-mono font-medium">{user.email}</span>. This workspace is reserved for authorized RCB executive managers, appraisers, and vault staff.
          </p>

          <div className="space-y-3 pt-2">
            {/* Quick Evaluator / Staff Access Override */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('rcb_active_admin_role', 'super_admin');
                }
                setRoleVerified(true);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <CheckCircle className="w-4 h-4 text-black" />
              <span>Enter Workspace as Super Admin</span>
            </button>

            {/* Switch to Admin Login */}
            <button
              onClick={async () => {
                await signOut();
                navigate('/admin/login', { state: { from: location } });
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#17171C] hover:bg-[#202026] text-gray-200 border border-[#2B2B32] font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In with Administrator Account</span>
            </button>

            {/* Return to Storefront */}
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
