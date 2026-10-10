import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Gem } from 'lucide-react';
import { validateEmail, validateRequired, validateMinLength } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!validateRequired(email)) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!validateRequired(password)) {
      errors.password = 'Password is required';
    } else if (isSignUp && !validateMinLength(password, 6)) {
      errors.password = 'Password must be at least 6 characters long';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
          } else {
            setError(signUpError.message);
          }
          return;
        }

        setSuccess('Account created! Please check your email for a verification link to complete sign up.');
        setIsSignUp(false);
      } else {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(signInError.message);
          }
          return;
        }

        if (data.user) {
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => {
            navigate('/');
          }, 1000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col justify-center py-16 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--gold-primary)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/40 shadow-[0_0_25px_rgba(214,179,106,0.15)] mb-4">
          <Gem className="h-7 w-7 text-[var(--gold-primary)]" />
        </div>
        <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase block mb-1">
          RCB JEWELRY'S & PAWN SHOP
        </span>
        <h2 className="text-3xl font-serif font-bold text-[var(--text-main)] tracking-tight">
          {isSignUp ? 'Create Royal Account' : 'Client Access Portal'}
        </h2>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {isSignUp ? 'Join our private clientele for bespoke jewelry and instant lending' : 'Sign in to access your orders, wishlist, and pledge portfolio'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[var(--bg-card)] py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-[var(--border-color)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-950/20 border border-rose-500/40 text-rose-500 dark:text-rose-300 px-4 py-3 rounded-xl text-xs">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-950/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="client@luxury.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-elevated)] border ${fieldErrors.email ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] placeholder-[var(--text-secondary)]/50 rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs`}
                  disabled={loading}
                />
              </div>
              <FormFieldError id="email-error" error={fieldErrors.email} />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className={`w-full px-4 py-2.5 bg-[var(--bg-elevated)] border ${fieldErrors.password ? 'border-rose-500' : 'border-[var(--border-color)]'} text-[var(--text-main)] placeholder-[var(--text-secondary)]/50 rounded-xl focus:outline-none focus:border-[var(--gold-primary)] focus:ring-1 focus:ring-[var(--gold-primary)] text-xs`}
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <FormFieldError id="password-error" error={fieldErrors.password} />
              {isSignUp && !fieldErrors.password && (
                <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black font-semibold py-3.5 rounded-xl uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-lg shadow-[var(--gold-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border-color)] text-center">
            <button
              onClick={switchMode}
              disabled={loading}
              className="text-xs text-[var(--gold-primary)] hover:text-[var(--gold-highlight)] font-semibold transition-colors disabled:opacity-50"
            >
              {isSignUp
                ? 'Already a client? Sign in to your account'
                : "New client? Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}