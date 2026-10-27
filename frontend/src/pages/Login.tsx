import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail, validateRequired, validateMinLength } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Status state
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick Demo Testing Accounts
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);

  const demoAccounts = [
    { role: 'patron', label: 'Customer Patron', email: 'patron@rcbjewelry.in', pass: 'password123' },
    { role: 'admin', label: 'Super Admin', email: 'admin@luxury.com', pass: 'admin123' },
    { role: 'manager', label: 'Store Manager', email: 'manager@luxury.com', pass: 'manager123' },
    { role: 'staff', label: 'Appraiser Staff', email: 'staff@luxury.com', pass: 'staff123' }
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setIsSignUp(false);
    setActiveDemoRole(acc.role);
    setFieldErrors({});
    setError('');
  };

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user && isMounted) {
          const userEmail = data.user.email?.toLowerCase().trim() || '';
          const userRole = ((data.user.user_metadata as any)?.role || '').toLowerCase().trim();
          const appRole = ((data.user.app_metadata as any)?.role || '').toLowerCase().trim();
          const adminRoles = ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'];
          
          const isAdmin =
            adminRoles.includes(userRole) ||
            adminRoles.includes(appRole) ||
            userEmail === 'admin@luxury.com' ||
            userEmail.includes('admin');

          if (isAdmin) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('rcb_active_admin_role', userRole || appRole || 'super_admin');
            }
            if (location.pathname !== '/admin') {
              navigate('/admin', { replace: true });
            }
          } else {
            const rawFrom = (location.state as any)?.from?.pathname;
            const target = (rawFrom && rawFrom !== '/login' && rawFrom !== '/admin/login') ? rawFrom : '/';
            if (location.pathname !== target) {
              navigate(target, { replace: true });
            }
          }
        }
      } catch (err) {
        console.warn('Silent user check warning:', err);
      }
    };
    checkUser();
    return () => { isMounted = false; };
  }, [navigate]);

  // Load remembered email
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('rcb_remembered_client_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (err) {
      void err;
    }
  }, []);

  const validateSingleField = (field: 'email' | 'password' | 'confirmPassword', val: string): string | undefined => {
    if (field === 'email') {
      const trimmed = val.trim();
      if (!validateRequired(trimmed)) {
        return 'Email address is required';
      }
      if (!validateEmail(trimmed)) {
        return 'Please enter a valid email address';
      }
    }

    if (field === 'password') {
      if (!validateRequired(val)) {
        return 'Password is required';
      }
      if (val.length < 6) {
        return 'Password must be at least 6 characters long';
      }
    }

    if (field === 'confirmPassword' && isSignUp) {
      if (!validateRequired(val)) {
        return 'Please confirm your password';
      }
      if (val !== password) {
        return 'Passwords do not match';
      }
    }

    return undefined;
  };

  const handleBlur = (field: 'email' | 'password' | 'confirmPassword') => {
    const val = field === 'email' ? email : field === 'password' ? password : confirmPassword;
    if (val.trim().length > 0 || fieldErrors[field]) {
      const err = validateSingleField(field, val);
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string; confirmPassword?: string } = {};

    const emailErr = validateSingleField('email', email);
    if (emailErr) errors.email = emailErr;

    const passErr = validateSingleField('password', password);
    if (passErr) errors.password = passErr;

    if (isSignUp) {
      const confirmErr = validateSingleField('confirmPassword', confirmPassword);
      if (confirmErr) errors.confirmPassword = confirmErr;
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

    // Save or clear remembered email
    try {
      if (rememberMe) {
        localStorage.setItem('rcb_remembered_client_email', email.trim());
      } else {
        localStorage.removeItem('rcb_remembered_client_email');
      }
    } catch (err) {
      void err;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              role: 'customer',
              full_name: email.trim().split('@')[0]
            }
          }
        });

        if (signUpError) {
          const msg = signUpError.message || '';
          if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
            setError('An account with this email already exists. Please sign in instead.');
          } else {
            setError(msg || 'Unable to create royal account. Please try again.');
          }
          return;
        }

        if (signUpData?.session || signUpData?.user) {
          setSuccess('Royal account created! Welcome to YAZHINI Fine Jewels.');
          setTimeout(() => {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
          }, 900);
          return;
        }

        setSuccess('Royal account created! Please sign in with your credentials.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          const msg = signInError.message || '';
          if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
            setError('Invalid email or password. Please verify and try again.');
          } else {
            setError(msg || 'Authentication failed. Please verify and try again.');
          }
          return;
        }

        if (data?.user) {
          const userEmail = data.user.email?.toLowerCase().trim() || '';
          const userRole = ((data.user.user_metadata as any)?.role || '').toLowerCase().trim();
          const appRole = ((data.user.app_metadata as any)?.role || '').toLowerCase().trim();
          const adminRoles = ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'];
          
          const isAdmin =
            adminRoles.includes(userRole) ||
            adminRoles.includes(appRole) ||
            userEmail === 'admin@luxury.com' ||
            userEmail.includes('admin');

          if (isAdmin) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('rcb_active_admin_role', userRole || appRole || 'super_admin');
            }
            setSuccess('Executive access verified. Opening Admin Panel...');
            setTimeout(() => {
              navigate('/admin', { replace: true });
            }, 700);
          } else {
            setSuccess('Access verified. Welcome back to YAZHINI Fine Jewels.');
            setTimeout(() => {
              const from = (location.state as any)?.from?.pathname || '/';
              navigate(from, { replace: true });
            }, 800);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected authentication error occurred.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    setResetEmailError(null);

    const trimmed = resetEmail.trim();
    if (!validateRequired(trimmed)) {
      setResetEmailError('Email address is required');
      return;
    }
    if (!validateEmail(trimmed)) {
      setResetEmailError('Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      });

      if (resetErr) {
        setResetStatus({ type: 'error', message: resetErr.message });
      } else {
        setResetStatus({
          type: 'success',
          message: 'Password reset link sent! Please check your email inbox.'
        });
        setTimeout(() => {
          setIsForgotPasswordOpen(false);
          setResetStatus(null);
          setResetEmailError(null);
        }, 3000);
      }
    } catch (err: any) {
      setResetStatus({ type: 'error', message: err.message || 'Unable to send reset email.' });
    } finally {
      setResetLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setResetEmailError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0B0709] text-[#FAF5ED] font-sans selection:bg-[#C9A46A] selection:text-[#0B0709] relative overflow-hidden">
      
      {/* ========================================================================= */}
      {/* LEFT CANVAS: EDITORIAL BRAND SHOWCASE (Desktop)                           */}
      {/* ========================================================================= */}
      <aside className="relative hidden lg:flex lg:w-1/2 xl:w-[52%] flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-[#C9A46A]/20">
        {/* Editorial Background Image with Smooth Depth & Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/poster_diamond_full_set.jpg"
            alt="Royal Indian Heritage Solitaire & Diamond Jewellery Suite"
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05]"
          />
          {/* Multi-layer luxury vignette overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0709] via-[#0B0709]/30 to-[#0B0709]/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B0709]/10 to-[#0B0709]" />
        </div>

        {/* Top Header: Return to Storefront */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-[0.2em] text-[#FAF5ED]/80 hover:text-[#C9A46A] transition-colors py-1.5 px-3.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group shadow-sm"
            aria-label="Return to Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#C9A46A] group-hover:-translate-x-1 transition-transform" />
            <span>Return to Store</span>
          </Link>

          <div className="flex items-center gap-2.5 text-[10px] font-sans tracking-[0.25em] uppercase text-[#D8B878] bg-black/40 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-sm">
            <span>BIS 916 HALLMARKED</span>
            <span className="text-[#C9A46A]/40">•</span>
            <span>EST. 1994</span>
          </div>
        </div>

        {/* Bottom Editorial Content */}
        <div className="relative z-10 space-y-4 max-w-lg pb-4">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-8 h-8 text-[#D8B878]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3L7 9l5 12 5-12-4-6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h20" />
            </svg>
            <div>
              <span className="font-serif text-lg tracking-[0.25em] text-[#FAF5ED] uppercase block leading-none font-medium">
                YAZHINI
              </span>
              <span className="font-sans text-[9px] font-bold tracking-[0.4em] text-[#C9A46A] uppercase block mt-1">
                FINE JEWELS
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-3xl xl:text-4xl text-[#FAF5ED] font-normal leading-[1.15] tracking-tight">
              More Than Jewellery.
            </h2>
            <p className="font-script text-[#E5C388] text-4xl xl:text-5xl leading-tight drop-shadow-[0_2px_12px_rgba(201,164,106,0.35)]">
              It’s a Royal Legacy.
            </p>
          </div>

          <p className="text-xs xl:text-sm text-[#FAF5ED]/75 font-light leading-relaxed max-w-md">
            Enter your private sanctuary of certified natural diamonds, heritage temple gold, insured nationwide dispatch, and digital gold vaults.
          </p>

          <div className="flex items-center gap-3 pt-2 text-[#C9A46A]/90 text-[10px] font-sans tracking-[0.2em] uppercase font-medium">
            <span>100% TRANSIT INSURED</span>
            <span className="text-[#C9A46A]/40">•</span>
            <span>NATURAL DIAMONDS</span>
            <span className="text-[#C9A46A]/40">•</span>
            <span>LIFETIME BUYBACK</span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* RIGHT CANVAS: REFINED AUTHENTICATION SALON                                */}
      {/* ========================================================================= */}
      <main className="w-full lg:w-1/2 xl:w-[48%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative bg-[#0C080A]">
        {/* Subtle Ambient Gold Glow */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 25%, rgba(201, 164, 106, 0.12) 0%, transparent 65%)`
          }}
        />

        {/* Mobile Top Header */}
        <div className="flex items-center justify-between lg:hidden relative z-10 mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-sans font-medium uppercase tracking-[0.16em] text-[#FAF5ED]/80 hover:text-[#C9A46A] transition-colors py-1 px-3 rounded-full bg-white/5 border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#C9A46A]" />
            <span>Store</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm tracking-[0.2em] text-[#FAF5ED] uppercase font-medium">YAZHINI</span>
            <span className="text-[9px] text-[#C9A46A] tracking-[0.3em] uppercase font-bold">JEWELS</span>
          </div>
        </div>

        {/* Centered Compact Form Card Container */}
        <div className="w-full max-w-[390px] mx-auto my-auto relative z-10 py-2 sm:py-4">
          <div className="rounded-3xl border border-[#C9A46A]/25 bg-[#140D11]/90 backdrop-blur-xl p-6 sm:p-7 shadow-[0_24px_50px_rgba(0,0,0,0.7)] text-left">
            
            {/* Form Header */}
            <div className="mb-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#C9A46A]/10 border border-[#C9A46A]/30 mb-2.5 text-[#D8B878]">
                <Lock className="w-4 h-4" />
              </div>
              <h1 className="font-serif text-2xl font-normal text-[#FAF5ED] tracking-tight">
                {isSignUp ? 'Create Royal Account' : 'Client Access Portal'}
              </h1>
              <p className="font-sans text-xs text-[#C5B5B8] mt-1 leading-relaxed">
                {isSignUp
                  ? 'Join our private clientele for bespoke jewellery & vault access'
                  : 'Sign in to access your orders, wishlist, and portfolio'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div
                role="alert"
                className="mb-4 bg-rose-950/60 border border-rose-800/60 text-rose-200 px-3 py-2 rounded-xl text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-4 bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 px-3 py-2 rounded-xl text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="flex-1 leading-snug">{success}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
              
              {/* Email Address Field */}
              <div>
                <label
                  htmlFor="client-email"
                  className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-[#D8B878] mb-1"
                >
                  Email Address
                </label>
                <div
                  className={`rounded-xl border ${
                    fieldErrors.email
                      ? 'border-rose-500 bg-rose-950/20'
                      : 'border-[#C9A46A]/25 focus-within:border-[#C9A46A] focus-within:ring-1 focus-within:ring-[#C9A46A]/50 bg-white/[0.03]'
                  } px-3 py-2 flex items-center gap-2.5 transition-colors`}
                >
                  <Mail className="w-4 h-4 text-[#C9A46A] shrink-0" />
                  <input
                    id="client-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setActiveDemoRole(null);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    onBlur={() => handleBlur('email')}
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "client-email-error" : undefined}
                    className="w-full bg-transparent text-xs sm:text-sm text-[#FAF5ED] placeholder-white/30 focus:outline-none font-sans"
                  />
                </div>
                <FormFieldError id="client-email-error" error={fieldErrors.email} />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="client-password"
                  className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-[#D8B878] mb-1"
                >
                  Password
                </label>
                <div
                  className={`rounded-xl border ${
                    fieldErrors.password
                      ? 'border-rose-500 bg-rose-950/20'
                      : 'border-[#C9A46A]/25 focus-within:border-[#C9A46A] focus-within:ring-1 focus-within:ring-[#C9A46A]/50 bg-white/[0.03]'
                  } px-3 py-2 flex items-center gap-2.5 transition-colors`}
                >
                  <Lock className="w-4 h-4 text-[#C9A46A] shrink-0" />
                  <input
                    id="client-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setActiveDemoRole(null);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    onBlur={() => handleBlur('password')}
                    disabled={loading}
                    minLength={6}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "client-password-error" : undefined}
                    className="w-full bg-transparent text-xs sm:text-sm text-[#FAF5ED] placeholder-white/30 focus:outline-none font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/40 hover:text-[#FAF5ED] transition-colors p-0.5 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FormFieldError id="client-password-error" error={fieldErrors.password} />
              </div>

              {/* Confirm Password Field (Sign Up Mode Only) */}
              {isSignUp && (
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-[#D8B878] mb-1"
                  >
                    Confirm Password
                  </label>
                  <div
                    className={`rounded-xl border ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-500 bg-rose-950/20'
                        : 'border-[#C9A46A]/25 focus-within:border-[#C9A46A] focus-within:ring-1 focus-within:ring-[#C9A46A]/50 bg-white/[0.03]'
                    } px-3 py-2 flex items-center gap-2.5 transition-colors`}
                  >
                    <Lock className="w-4 h-4 text-[#C9A46A] shrink-0" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }}
                      onBlur={() => handleBlur('confirmPassword')}
                      disabled={loading}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                      className="w-full bg-transparent text-xs sm:text-sm text-[#FAF5ED] placeholder-white/30 focus:outline-none font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-white/40 hover:text-[#FAF5ED] transition-colors p-0.5 focus:outline-none cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormFieldError id="confirm-password-error" error={fieldErrors.confirmPassword} />
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              {!isSignUp && (
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#C9A46A]/40 bg-black/40 text-[#C9A46A] accent-[#C9A46A] cursor-pointer"
                    />
                    <span className="text-xs text-[#FAF5ED]/80">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsForgotPasswordOpen(true);
                    }}
                    className="text-xs font-semibold text-[#D8B878] hover:text-[#FAF5ED] hover:underline transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl font-sans font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-lg bg-gradient-to-r from-[#D8B878] via-[#F3E5CF] to-[#C9A46A] hover:brightness-105 active:scale-[0.99] text-[#150D11] border border-[#C9A46A]/50 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#150D11] border-t-transparent" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <span>{isSignUp ? 'REGISTER ACCOUNT' : 'SIGN IN'}</span>
                  )}
                </button>
              </div>
            </form>

            {/* Switch Mode Toggle Link */}
            <div className="mt-4 pt-3 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="text-xs text-[#FAF5ED]/80 hover:text-[#D8B878] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>{isSignUp ? 'Already registered?' : 'New to Yazhini?'}</span>
                <span className="font-semibold text-[#D8B878] underline underline-offset-2">
                  {isSignUp ? 'Sign In' : 'Create an account'}
                </span>
              </button>
            </div>

            {/* Quick-Access Testing Role Chips (Chic, Compact & Space-Saving) */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D8B878]">
                  Quick Demo Access
                </span>
                <span className="text-[9px] text-white/40">1-Click Fill</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {demoAccounts.map((acc) => {
                  const isSelected = activeDemoRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#C9A46A]/20 border-[#C9A46A] text-[#FAF5ED] shadow-xs'
                          : 'bg-white/[0.03] border-white/10 hover:border-[#C9A46A]/50 text-white/70 hover:text-[#FAF5ED]'
                      }`}
                      title={acc.email}
                    >
                      <span className="text-[11px] font-medium truncate">{acc.label}</span>
                      <span className="text-[9px] text-[#C9A46A] font-mono shrink-0 ml-1">Auto</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security Footnote */}
            <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-white/50">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9A46A]" />
              <span>256-Bit SSL Encrypted Client Portal</span>
            </div>

          </div>
        </div>

        {/* Bottom Footer */}
        <footer className="relative z-10 text-center text-[10px] text-white/40 pt-2">
          <p>© {new Date().getFullYear()} YAZHINI FINE JEWELS. All rights reserved.</p>
        </footer>
      </main>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL (Luxury Obsidian Glassmorphic)                       */}
      {/* ========================================================================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-[#160E12] text-[#FAF5ED] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#C9A46A]/40 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-[#D8B878]">
              <Lock className="w-5 h-5" />
              <h3 className="font-serif text-xl font-normal text-[#FAF5ED]">
                Reset Client Password
              </h3>
            </div>

            <p className="text-xs text-[#C5B5B8] leading-relaxed mb-5">
              Enter your registered client email address. We will send an encrypted recovery link to safely reset your credentials.
            </p>

            {resetStatus && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                resetStatus.type === 'success' 
                  ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-200' 
                  : 'bg-rose-950/60 border border-rose-800/60 text-rose-200'
              }`}>
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span className="leading-snug">{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reset-client-email" className="block text-[11px] uppercase tracking-wider text-[#D8B878] font-semibold mb-1">
                  Registered Email
                </label>
                <input
                  id="reset-client-email"
                  type="email"
                  required
                  placeholder="client@luxury.com"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    if (resetEmailError) setResetEmailError(null);
                  }}
                  onBlur={() => {
                    const trimmed = resetEmail.trim();
                    if (trimmed.length > 0 && !validateEmail(trimmed)) {
                      setResetEmailError('Please enter a valid email address');
                    }
                  }}
                  aria-invalid={Boolean(resetEmailError)}
                  aria-describedby={resetEmailError ? "reset-email-error" : undefined}
                  className={`w-full bg-white/[0.04] border ${
                    resetEmailError ? 'border-rose-500 bg-rose-950/20' : 'border-[#C9A46A]/30 focus:border-[#C9A46A]'
                  } rounded-xl px-3.5 py-2.5 text-xs text-[#FAF5ED] placeholder-white/30 focus:outline-none`}
                />
                <FormFieldError id="reset-email-error" error={resetEmailError} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-sans text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-6 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#D8B878] to-[#C9A46A] text-[#150D11] hover:brightness-105 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}