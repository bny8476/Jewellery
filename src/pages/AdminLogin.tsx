import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Gem, Lock, Mail } from 'lucide-react';
import { LanguageSwitcherDropdown } from '../components/LanguageSwitcher';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated AND is admin
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.user_metadata?.role;
      const isAdmin = userRole === 'admin' || userRole === 'manager' || user.email === (import.meta.env.VITE_ADMIN_EMAIL || '2002dineshmurugan@gmail.com');

      if (isAdmin) {
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      }
      // If not admin, stay here to allow login as admin
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError(t('login.invalidCredentials'));
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in.');
        } else {
          setError(signInError.message || t('messages.loginFailed'));
        }
      } else {
        // Successful login - navigate will happen via useEffect
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col justify-center py-16 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--gold-primary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-between items-center mb-6 px-4">
          <div></div>
          <LanguageSwitcherDropdown />
        </div>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/40 shadow-[0_0_25px_rgba(214,179,106,0.15)] mb-4">
          <Gem className="h-7 w-7 text-[var(--gold-primary)]" />
        </div>
        <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase block mb-1">
          EXECUTIVE CONTROL
        </span>
        <h2 className="text-3xl font-serif font-bold text-[var(--text-main)] tracking-tight">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-secondary)]/50 rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs"
                  placeholder="admin@luxury.com"
                  disabled={loading}
                />
              </div>
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-secondary)]/50 rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs"
                  placeholder="Enter administrator password"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black font-semibold py-3.5 rounded-xl uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-lg shadow-[var(--gold-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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

