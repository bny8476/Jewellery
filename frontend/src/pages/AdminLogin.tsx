import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Gem, Lock, Mail } from 'lucide-react';
import { LanguageSwitcherDropdown } from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { validateEmail, validateRequired } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated AND is admin
  useEffect(() => {
    if (isAuthenticated && user) {
      const email = user.email?.toLowerCase().trim() || '';
      const userRole = ((user.user_metadata as any)?.role || '').toLowerCase().trim();
      const appRole = ((user.app_metadata as any)?.role || '').toLowerCase().trim();
      const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
      const adminRoles = ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'];
      
      const isAdmin =
        adminRoles.includes(userRole) ||
        adminRoles.includes(appRole) ||
        email === 'admin@luxury.com' ||
        email.includes('admin') ||
        (Boolean(configuredAdminEmail) && email === configuredAdminEmail);

      if (isAdmin) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rcb_active_admin_role', userRole || appRole || 'super_admin');
        }
        const rawFrom = (location.state as any)?.from?.pathname;
        const target = (rawFrom && rawFrom !== '/admin/login' && rawFrom !== '/login') ? rawFrom : '/admin';
        if (location.pathname !== target) {
          navigate(target, { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateFields = (): boolean => {
    const errs: { email?: string; password?: string } = {};
    if (!validateRequired(email)) {
      errs.email = 'Administrator email is required';
    } else if (!validateEmail(email)) {
      errs.email = 'Please enter a valid administrator email';
    }

    if (!validateRequired(password)) {
      errs.password = 'Administrator password is required';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signInError, data } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError(t('login.invalidCredentials'));
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in.');
        } else {
          setError(signInError.message || t('messages.loginFailed'));
        }
      } else {
        // Successful login - persist active admin role
        const signedUser = data?.user || user;
        const assignedRole = signedUser?.user_metadata?.role || signedUser?.app_metadata?.role || 'super_admin';
        if (typeof window !== 'undefined') {
          localStorage.setItem('rcb_active_admin_role', assignedRole);
        }
        const rawFrom = (location.state as any)?.from?.pathname;
        const target = (rawFrom && rawFrom !== '/admin/login' && rawFrom !== '/login') ? rawFrom : '/admin';
        navigate(target, { replace: true });
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@luxury.com');
    setPassword('admin123');
    setFieldErrors({});
    setError('');
  };

  return (
    <div className="admin-root font-sans min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col justify-center py-16 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--gold-primary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-between items-center mb-6 px-4">
          <ThemeToggle />
          <LanguageSwitcherDropdown />
        </div>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/40 shadow-[0_0_25px_rgba(214,179,106,0.15)] mb-4">
          <Gem className="h-7 w-7 text-[var(--gold-primary)]" />
        </div>
        <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase block mb-1">
          EXECUTIVE CONTROL
        </span>
        <h2 className="text-[28px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">
          {t('login.adminLogin')}
        </h2>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {t('login.signInToAccount')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[var(--bg-card)] py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-[var(--border-color)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-950/20 border border-rose-500/40 text-rose-500 dark:text-rose-300 px-4 py-3 rounded-xl text-xs flex items-center">
                <Lock className="h-4 w-4 text-rose-500 mr-2 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                {t('login.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "admin-email-error" : undefined}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border ${fieldErrors.email ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] placeholder-[var(--text-secondary)]/50 rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs`}
                  placeholder="admin@luxury.com"
                  disabled={loading}
                />
              </div>
              <FormFieldError id="admin-email-error" error={fieldErrors.email} />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "admin-password-error" : undefined}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border ${fieldErrors.password ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] placeholder-[var(--text-secondary)]/50 rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs`}
                  placeholder="Enter administrator password"
                  disabled={loading}
                />
              </div>
              <FormFieldError id="admin-password-error" error={fieldErrors.password} />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black font-semibold py-3.5 rounded-xl uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-lg shadow-[var(--gold-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('login.signingIn')}
                  </span>
                ) : (
                  t('login.signIn')
                )}
              </button>
            </div>

            {/* Dev Only Demo Credentials Helper */}
            {import.meta.env.DEV && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="w-full py-2 px-3 rounded-lg bg-[var(--bg-main)]/60 hover:bg-[var(--bg-main)] border border-[var(--gold-primary)]/30 text-[11px] text-[var(--gold-primary)] hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <span>[Dev Only] Quick Fill Super Admin</span>
                </button>
              </div>
            )}
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border-color)] text-center">
            <span className="text-[10px] text-[var(--gold-primary)] uppercase tracking-widest font-bold block mb-1">{t('login.securityNotice')}</span>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {t('login.secureAdminArea')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

