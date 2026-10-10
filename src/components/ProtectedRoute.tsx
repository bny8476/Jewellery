import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If admin access is required, you can add role checking here
  // For now, any authenticated user can access admin
  // TODO: Implement role-based access control
  // Role-Based Access Control
  if (requireAdmin && user) {
    const userRole = user.user_metadata?.role;
    const configuredAdminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const isAuthorized =
      userRole === 'admin' ||
      userRole === 'manager' ||
      userRole === 'staff' ||
      (Boolean(configuredAdminEmail) && user.email === configuredAdminEmail);

    if (!isAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

