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
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user && isMounted) {
          const email = data.user.email?.toLowerCase().trim() || '';
          const userRole = ((data.user.user_metadata as any)?.role || '').toLowerCase().trim();
          const appRole = ((data.user.app_metadata as any)?.role || '').toLowerCase().trim();
          const adminRoles = ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'];
          
          const isAdmin =
            adminRoles.includes(userRole) ||
            adminRoles.includes(appRole) ||
            email === 'admin@luxury.com' ||
            email.includes('admin');

          if (isAdmin) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('rcb_active_admin_role', userRole || appRole || 'super_admin');
            }
            navigate('/admin', { replace: true });
          } else {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from, { replace: true });
          }
        }
      } catch (err) {
        console.warn('Silent user check warning:', err);
      }
    };
    checkUser();
    return () => { isMounted = false; };
  }, [navigate, location]);

  // Load remembered email
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('rcb_remembered_client_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string; confirmPassword?: string } = {};

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

    if (isSignUp) {
      if (!validateRequired(confirmPassword)) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Passwords do not match';
      }
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
    } catch {}

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
          setSuccess('Royal account created! Welcome to RCB Jewelry.');
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
          const email = data.user.email?.toLowerCase().trim() || '';
          const userRole = ((data.user.user_metadata as any)?.role || '').toLowerCase().trim();
          const appRole = ((data.user.app_metadata as any)?.role || '').toLowerCase().trim();
          const adminRoles = ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'];
          
          const isAdmin =
            adminRoles.includes(userRole) ||
            adminRoles.includes(appRole) ||
            email === 'admin@luxury.com' ||
            email.includes('admin');

          if (isAdmin) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('rcb_active_admin_role', userRole || appRole || 'super_admin');
            }
            setSuccess('Executive access verified. Opening Admin Panel...');
            setTimeout(() => {
              navigate('/admin', { replace: true });
            }, 700);
          } else {
            setSuccess('Access verified. Welcome back to RCB Jewelry.');
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

    if (!validateRequired(resetEmail) || !validateEmail(resetEmail)) {
      setResetStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setResetLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
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
  };

  return (
    <div className="min-h-screen bg-[#0C0705] text-[#F8F1E5] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#C9A46A] selection:text-[#100C09] font-sans">
      
      {/* Background High-Res Photographic Wallpaper: Ruby & Diamond Necklace on Velvet Stand */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/login_necklace_clean_bg.jpg"
          alt="Royal Indian Heritage Ruby and Diamond Necklace on Black Velvet"
          className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02]"
        />
        {/* Subtle cinematic vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 lg:hidden" />
      </div>

      {/* Top Navigation Bar: Return to Store Link */}
      <header className="relative z-20 px-6 sm:px-10 lg:px-16 pt-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-[0.2em] text-[#EFE3D0]/80 hover:text-[#C9A46A] transition-colors py-2 group"
          aria-label="Return to Storefront"
        >
          <ArrowLeft className="w-4 h-4 text-[#C9A46A] group-hover:-translate-x-1 transition-transform" />
          <span>Return to Store</span>
        </Link>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-sans tracking-[0.25em] uppercase text-[#C9A46A]/90">
          <span>BIS 916 HALLMARKED</span>
          <span className="text-[#C9A46A]/40">•</span>
          <span>EST. 1994</span>
        </div>
      </header>

      {/* Main Split-Screen Content Layout */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 lg:py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8">
        
        {/* ========================================================================= */}
        {/* LEFT SECTION: BRAND STORYTELLING                                         */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-1/2 max-w-xl text-center lg:text-left space-y-6 pt-2 lg:pt-0">
          
          {/* Brand Diamond Emblem & Name */}
          <div className="flex flex-col items-center lg:items-start gap-1">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-9 h-9 text-[#DDB77E]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3L7 9l5 12 5-12-4-6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h20" />
              </svg>
              <div>
                <span className="font-serif text-xl tracking-[0.24em] text-[#FAF5ED] uppercase block leading-none font-medium">
                  RCB JEWELRY’S
                </span>
                <span className="font-sans text-[10px] font-semibold tracking-[0.4em] text-[#C9A46A] uppercase block mt-1.5">
                  &amp; PAWN SHOP
                </span>
              </div>
            </div>

            {/* Tagline Pill */}
            <div className="mt-4 flex items-center justify-center lg:justify-start gap-3 text-[#C9A46A]/90 text-[10px] sm:text-[11px] font-sans tracking-[0.3em] uppercase font-medium">
              <span>TRUST</span>
              <span className="text-[#C9A46A]/50">•</span>
              <span>TRADITION</span>
              <span className="text-[#C9A46A]/50">•</span>
              <span>TIMELESS BEAUTY</span>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="space-y-0.5 pt-3">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#FAF5ED] font-normal leading-[1.14] tracking-tight">
              More Than
            </h2>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#FAF5ED] font-normal leading-[1.14] tracking-tight">
              Jewellery.
            </h2>
            <p className="font-script text-[#E5C388] text-5xl sm:text-6xl lg:text-7xl pt-2 pb-1 leading-[1.1] filter drop-shadow-[0_2px_10px_rgba(201,164,106,0.3)]">
              It’s a Legacy.
            </p>
          </div>

          {/* Supporting Copy */}
          <div className="space-y-3.5 pt-1">
            <p className="font-sans text-xs sm:text-sm text-[#EFE3D0]/85 leading-relaxed font-light max-w-sm mx-auto lg:mx-0">
              Exquisite jewellery for life’s most precious moments.
            </p>
            {/* Delicate Gold Diamond Ornament */}
            <div className="flex items-center justify-center lg:justify-start gap-3 text-[#C9A46A]/70 pt-0.5">
              <span className="w-12 h-px bg-gradient-to-r from-transparent to-[#C9A46A]/60" />
              <span className="text-xs">◇</span>
              <span className="w-12 h-px bg-gradient-to-l from-transparent to-[#C9A46A]/60" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SECTION: EXACT WARM IVORY MARBLE PRESENTATION BOX CARD              */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[425px] transition-all duration-300">
            
            {/* Top Overlapping Medallion with Diamond Emblem */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30">
              <div className="w-15 h-15 rounded-full bg-gradient-to-b from-[#1C120C] to-[#0E0805] border-2 border-[#D5B075] shadow-[0_6px_22px_rgba(0,0,0,0.7),0_0_12px_rgba(213,176,117,0.3)] flex items-center justify-center p-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-7 h-7 text-[#E5C388]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 3L7 9l5 12 5-12-4-6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h20" />
                </svg>
              </div>
            </div>

            {/* Warm Ivory Marble Presentation Card */}
            <div className="relative bg-gradient-to-b from-[#FAF6F0] via-[#F4EDE2] to-[#EFE5D6] border-2 border-[#D8BE96]/90 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(201,164,106,0.18)] rounded-[32px] p-7 sm:p-9 pt-11 text-center text-[#21170F]">
              
              {/* 1. Brand Wordmark on Card */}
              <div className="mb-1.5">
                <span className="font-serif text-lg sm:text-xl font-normal tracking-[0.24em] text-[#140C08] uppercase block leading-tight">
                  RCB JEWELRY’S
                </span>
                <span className="font-sans text-[9px] font-bold tracking-[0.38em] text-[#8C6239] uppercase block mt-1">
                  &amp; PAWN SHOP
                </span>
              </div>

              {/* Delicate Diamond Divider */}
              <div className="flex items-center justify-center gap-2 text-[#C9A46A] my-2">
                <span className="w-8 h-px bg-[#C9A46A]/50" />
                <span className="text-[10px]">◇</span>
                <span className="w-8 h-px bg-[#C9A46A]/50" />
              </div>

              {/* 2. Heading & Subtitle */}
              <div className="mb-5 space-y-1">
                <h1 className="font-serif text-2xl sm:text-[26px] font-normal text-[#170E0A] tracking-tight">
                  {isSignUp ? 'Create Royal Account' : 'Client Access Portal'}
                </h1>
                <p className="font-sans text-[12px] text-[#705F52] font-normal leading-relaxed max-w-xs mx-auto">
                  {isSignUp
                    ? 'Join our private clientele for bespoke jewellery, insured orders, and pledge portfolios.'
                    : 'Sign in to access your orders, wishlist, and pledge portfolio.'}
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div 
                  role="alert" 
                  className="mb-4 bg-rose-100 border border-rose-300 text-rose-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 text-left"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="flex-1 leading-snug">{error}</span>
                </div>
              )}

              {success && (
                <div 
                  role="status" 
                  className="mb-4 bg-emerald-100 border border-emerald-300 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 text-left"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="flex-1 leading-snug">{success}</span>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5 text-left" noValidate>
                
                {/* Email Address Field */}
                <div>
                  <div className={`rounded-2xl border ${fieldErrors.email ? 'border-rose-500 bg-rose-50/50' : 'border-[#D5C2AF] focus-within:border-[#8C6239] focus-within:ring-1 focus-within:ring-[#8C6239]/40 bg-[#FAF6EE]'} p-2.5 sm:p-3 flex items-center gap-3 transition-colors shadow-xs`}>
                    <Mail className="w-5 h-5 text-[#543F30] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor="client-email" 
                        className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-[#6B5A4B] leading-none mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        id="client-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                        }}
                        disabled={loading}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "client-email-error" : undefined}
                        className="w-full bg-transparent p-0 text-xs sm:text-sm text-[#140C09] placeholder-[#9E8E80] focus:outline-none font-sans"
                      />
                    </div>
                  </div>
                  <FormFieldError id="client-email-error" error={fieldErrors.email} />
                </div>

                {/* Password Field */}
                <div>
                  <div className={`rounded-2xl border ${fieldErrors.password ? 'border-rose-500 bg-rose-50/50' : 'border-[#D5C2AF] focus-within:border-[#8C6239] focus-within:ring-1 focus-within:ring-[#8C6239]/40 bg-[#FAF6EE]'} p-2.5 sm:p-3 flex items-center gap-3 transition-colors shadow-xs`}>
                    <Lock className="w-5 h-5 text-[#543F30] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor="client-password" 
                        className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-[#6B5A4B] leading-none mb-1"
                      >
                        Password
                      </label>
                      <input
                        id="client-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                        }}
                        disabled={loading}
                        minLength={6}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? "client-password-error" : undefined}
                        className="w-full bg-transparent p-0 text-xs sm:text-sm text-[#140C09] placeholder-[#9E8E80] focus:outline-none font-sans"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#6B5A4B] hover:text-[#140C09] transition-colors p-1 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormFieldError id="client-password-error" error={fieldErrors.password} />
                  {isSignUp && !fieldErrors.password && (
                    <p className="mt-1 text-[10px] text-[#7A6B5D]">
                      Minimum 6 characters long
                    </p>
                  )}
                </div>

                {/* Confirm Password (Sign Up Mode Only) */}
                {isSignUp && (
                  <div>
                    <div className={`rounded-2xl border ${fieldErrors.confirmPassword ? 'border-rose-500 bg-rose-50/50' : 'border-[#D5C2AF] focus-within:border-[#8C6239] focus-within:ring-1 focus-within:ring-[#8C6239]/40 bg-[#FAF6EE]'} p-2.5 sm:p-3 flex items-center gap-3 transition-colors shadow-xs`}>
                      <Lock className="w-5 h-5 text-[#543F30] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor="confirm-password" 
                          className="block text-[10px] font-sans font-semibold uppercase tracking-wider text-[#6B5A4B] leading-none mb-1"
                        >
                          Confirm Password
                        </label>
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
                          disabled={loading}
                          aria-invalid={Boolean(fieldErrors.confirmPassword)}
                          aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                          className="w-full bg-transparent p-0 text-xs sm:text-sm text-[#140C09] placeholder-[#9E8E80] focus:outline-none font-sans"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-[#6B5A4B] hover:text-[#140C09] transition-colors p-1 focus:outline-none"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FormFieldError id="confirm-password-error" error={fieldErrors.confirmPassword} />
                  </div>
                )}

                {/* Remember Me & Forgot Password Row */}
                {!isSignUp && (
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-[#B5A08C] bg-[#1A110D] text-[#8C6239] cursor-pointer accent-[#1A110D]"
                      />
                      <span className="text-xs font-medium text-[#2E2017]">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setIsForgotPasswordOpen(true);
                      }}
                      className="text-xs font-semibold text-[#7A5832] hover:text-[#140C09] hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Primary Button: SIGN IN */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative py-3.5 px-6 rounded-full font-sans font-bold text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-md bg-gradient-to-r from-[#180F0A] via-[#0E0805] to-[#180F0A] hover:from-[#241710] hover:to-[#241710] text-[#F3E5CF] border border-[#C9A46A]/60 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#F3E5CF] border-t-transparent" />
                        <span>Verifying Credentials...</span>
                      </div>
                    ) : (
                      <>
                        <span>{isSignUp ? 'REGISTER ACCOUNT' : 'SIGN IN'}</span>
                        <ArrowRight className="w-4 h-4 text-[#F3E5CF] absolute right-6" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* OR Divider */}
              <div className="flex items-center my-3.5">
                <div className="flex-1 h-px bg-[#D5C2AF]/80" />
                <span className="px-3 text-[10px] text-[#7A6B5D] font-sans font-bold tracking-[0.2em] uppercase">
                  OR
                </span>
                <div className="flex-1 h-px bg-[#D5C2AF]/80" />
              </div>

              {/* Secondary Button: CREATE A NEW ACCOUNT */}
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="w-full py-3 px-6 rounded-full border border-[#C9A46A]/80 bg-gradient-to-b from-[#FAF4EA] to-[#F1E6D6] hover:from-[#F4EADC] hover:to-[#EADCC8] text-[#7A542C] font-sans font-bold text-xs uppercase tracking-[0.16em] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                {isSignUp ? (
                  <>
                    <LogIn className="w-4 h-4 text-[#7A542C]" />
                    <span>ALREADY REGISTERED? SIGN IN</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-[#7A542C]" />
                    <span>CREATE A NEW ACCOUNT</span>
                  </>
                )}
              </button>

              {/* Security Footnote */}
              <div className="mt-4 pt-2.5 border-t border-[#D5C2AF]/60 flex items-center justify-center gap-1.5 text-[11px] text-[#7A6B5D] font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8C6239] shrink-0" />
                <span>Your data is protected and secure</span>
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* Footer Info */}
      <footer className="relative z-20 px-6 sm:px-12 py-5 text-center text-[11px] font-sans text-[#EFE3D0]/60 border-t border-[#C9A46A]/15">
        <p>© {new Date().getFullYear()} RCB Jewelry &amp; Pawn Shop. All rights reserved. 256-Bit Encrypted Client Portal.</p>
      </footer>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL                                                     */}
      {/* ========================================================================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-[#FAF5EE] text-[#21170F] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#C9A46A] animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#7A6B5D] hover:text-[#140C09] hover:bg-stone-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-[#8C6239]">
              <Lock className="w-5 h-5" />
              <h3 className="font-serif text-xl font-normal text-[#1A110D]">
                Reset Client Password
              </h3>
            </div>

            <p className="text-xs text-[#7A6B5D] leading-relaxed mb-5">
              Enter your registered client email address. We will send an encrypted recovery link to safely reset your credentials.
            </p>

            {resetStatus && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                resetStatus.type === 'success' 
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' 
                  : 'bg-rose-100 border border-rose-300 text-rose-800'
              }`}>
                {resetStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <span className="leading-snug">{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#6B5A4B] font-semibold mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@luxury.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-[#D5C2AF] focus:border-[#8C6239] rounded-2xl px-3.5 py-2.5 text-xs text-[#140C09] placeholder-[#9E8E80] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-sans text-[#7A6B5D] hover:text-[#140C09]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-6 py-2.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#1E140E] to-[#100A07] text-[#F3E5CF] hover:brightness-110 transition-all shadow-md disabled:opacity-50"
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