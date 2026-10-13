import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [roleVerified, setRoleVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!requireAdmin || !user) {
      if (isMounted) setRoleVerified(true);
      return;
    }

    // 1. Fast check against server-controlled app_metadata or configured admin email
    const appRole = (user.app_metadata as any)?.role;
    const configuredAdminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const isMetadataAdmin =
      appRole === 'admin' ||
      appRole === 'manager' ||
      appRole === 'staff' ||
      (Boolean(configuredAdminEmail) && user.email === configuredAdminEmail);

    if (isMetadataAdmin) {
      if (isMounted) setRoleVerified(true);
      return;
    }

    // 2. Authoritative check against verified database profile role
    const verifyRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;
        if (!error && data && ['admin', 'manager', 'staff'].includes(data.role)) {
          setRoleVerified(true);
        } else {
          setRoleVerified(false);
        }
      } catch {
        if (isMounted) setRoleVerified(false);
      }
    };

    verifyRole();

    return () => {
      isMounted = false;
    };
  }, [requireAdmin, user]);

  if (loading || (requireAdmin && roleVerified === null)) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)] text-sm tracking-wide">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && roleVerified === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
