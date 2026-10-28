import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * AdminLogin has been deprecated. Admin authentication is now unified into /login.
 * Any direct visits to /admin/login are automatically redirected to /login.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    navigate('/login', { replace: true, state: location.state });
  }, [navigate, location]);

  return null;
}
