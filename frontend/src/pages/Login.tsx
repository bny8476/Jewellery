import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  X,
  User,
  Phone,
  ArrowRight,
  Gem,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateEmail, validateRequired } from '../utils/validation';
import { FormFieldError } from '../components/FormFieldError';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

export interface LoginProps {
  initialMode?: 'login' | 'signup';
}

export default function Login({ initialMode }: LoginProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Theme integration
  let isDark = false;
  try {
    const themeCtx = useTheme();
    isDark = themeCtx.theme === 'dark';
  } catch {
    isDark = false;
  }

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(() => {
    if (initialMode === 'signup') return true;
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/signup' || window.location.pathname === '/register') return true;
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'signup' || params.get('mode') === 'signup') return true;
    }
    return false;
  });

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

  // Synchronize sign-in/up mode with route or prop changes
  useEffect(() => {
    if (initialMode === 'signup' || location.pathname === '/signup' || location.pathname === '/register') {
      setIsSignUp(true);
    } else if (location.pathname === '/login') {
      const params = new URLSearchParams(location.search);
      if (params.get('tab') === 'signup' || params.get('mode') === 'signup') {
        setIsSignUp(true);
      }
    }
  }, [initialMode, location.pathname, location.search]);

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
          const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
          const adminRoles = ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'];
          
          const isAdmin =
            adminRoles.includes(userRole) ||
            adminRoles.includes(appRole) ||
            userEmail === 'admin@luxury.com' ||
            userEmail.includes('admin') ||
            (Boolean(configuredAdminEmail) && userEmail === configuredAdminEmail);

          if (isAdmin) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('rcb_active_admin_role', userRole || appRole || 'super_admin');
            }
            const rawFrom = (location.state as any)?.from?.pathname;
            const target = (rawFrom && rawFrom.startsWith('/admin') && rawFrom !== '/admin/login') ? rawFrom : '/admin';
            if (location.pathname !== target) {
              navigate(target, { replace: true });
            }
          } else {
            const rawFrom = (location.state as any)?.from?.pathname;
            const target = (rawFrom && !rawFrom.startsWith('/admin') && rawFrom !== '/login' && rawFrom !== '/admin/login') ? rawFrom : '/';
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
  }, [navigate, location.pathname, location.state]);

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
              full_name: fullName.trim() || email.trim().split('@')[0],
              phone: phone.trim() || undefined,
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
            const rawFrom = (location.state as any)?.from?.pathname;
            const target = (rawFrom && !rawFrom.startsWith('/admin') && rawFrom !== '/login' && rawFrom !== '/admin/login') ? rawFrom : '/';
            navigate(target, { replace: true });
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
          const configuredAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
          const adminRoles = ['super_admin', 'admin', 'manager', 'staff', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor'];
          
          const isAdmin =
            adminRoles.includes(userRole) ||
            adminRoles.includes(appRole) ||
            userEmail === 'admin@luxury.com' ||
            userEmail.includes('admin') ||
            (Boolean(configuredAdminEmail) && userEmail === configuredAdminEmail);

          if (isAdmin) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('rcb_active_admin_role', userRole || appRole || 'super_admin');
            }
            setSuccess('Executive access verified. Opening Admin Panel...');
            setTimeout(() => {
              const rawFrom = (location.state as any)?.from?.pathname;
              const target = (rawFrom && rawFrom.startsWith('/admin') && rawFrom !== '/admin/login') ? rawFrom : '/admin';
              navigate(target, { replace: true });
            }, 700);
          } else {
            setSuccess('Access verified. Welcome back to YAZHINI Fine Jewels.');
            setTimeout(() => {
              const rawFrom = (location.state as any)?.from?.pathname;
              const target = (rawFrom && !rawFrom.startsWith('/admin') && rawFrom !== '/login' && rawFrom !== '/admin/login') ? rawFrom : '/';
              navigate(target, { replace: true });
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

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(`${provider === 'google' ? 'Google' : 'Apple'} authentication is currently unavailable in this local test environment. Please use email & password or Quick Demo Access below.`);
      }
    } catch (err: any) {
      setError(err?.message || `Unable to initialize ${provider} login.`);
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

  const switchMode = (target?: 'login' | 'signup') => {
    const nextMode = (target === 'login' || target === 'signup') ? target === 'signup' : !isSignUp;
    setIsSignUp(nextMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setResetEmailError(null);
  };

  return (
    <div className={`min-h-screen lg:h-screen w-full font-sans transition-colors duration-300 flex flex-col justify-between relative overflow-x-hidden ${
      isDark ? 'bg-[#0E070A] text-[#FAF7F1]' : 'bg-[#FAF7F1] text-[#241318]'
    }`}>

      {/* ========================================================================= */}
      {/* MAIN BODY: SPLIT-SCREEN LUXURY EXPERIENCE                                */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: HERO CAMPAIGN PHOTOGRAPHY & COPY (~58% on desktop)         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="relative w-full lg:w-[58%] min-h-[520px] lg:min-h-full flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden shrink-0">
          
          {/* Background Photography spanning top-to-bottom of the left section */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src="/images/yazhini_timeless_journey_model.jpg"
              alt="YAZHINI Fine Jewels Model in Burgundy Silk Saree with Diamond & Ruby Jewellery"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('royal_jewels_login_hero.jpg')) {
                  target.src = '/images/royal_jewels_login_hero.jpg';
                }
              }}
              className="w-full h-full object-cover object-[72%_center] lg:object-[70%_center] filter brightness-[1.02] contrast-[1.03]"
            />
            {/* Gradients ensuring flawless contrast over the image without darkening the woman */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 via-48% to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/45" />
          </div>

          {/* TOP-LEFT BRAND CREST & TAGLINE */}
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-3 group" aria-label="YAZHINI Home">
              {/* Burgundy square with gold Y */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#4A0717] border border-[#D6B477]/40 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                <span 
                  className="text-lg sm:text-xl font-bold text-[#D6B477] leading-none select-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Y
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span 
                  className="text-lg sm:text-xl font-bold tracking-[0.2em] text-[#FAF7F1] drop-shadow-md leading-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  YAZHINI
                </span>
                <span className="text-[9px] sm:text-[10px] font-sans font-semibold tracking-[0.32em] text-[#D6B477] uppercase leading-none mt-0.5">
                  FINE JEWELS
                </span>
              </div>
            </Link>

            {/* Vertical Divider & Tagline */}
            <div className="hidden sm:flex items-center gap-3 pl-2">
              <span className="text-[#D6B477]/60 text-base font-light">|</span>
              <span 
                className="text-xs tracking-wider text-[#FAF7F1]/90 drop-shadow-sm font-normal"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Timeless Elegance <span className="text-[#D6B477]/60 mx-1">|</span> Eternal Value
              </span>
            </div>
          </div>

          {/* CENTER HERO COPY & 3 BENEFIT ICONS */}
          <div className="relative z-10 my-auto py-6 sm:py-8 max-w-lg">
            {/* Welcome Back Badge */}
            <div className="mb-2 sm:mb-3">
              <span className="inline-block text-[11px] font-sans font-bold tracking-[0.25em] text-[#D6B477] uppercase drop-shadow-md">
                WELCOME BACK
              </span>
            </div>

            {/* Main Headline in Title Case */}
            <h1 
              className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-normal text-white leading-[1.15] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Continue Your<br />
              Timeless Journey
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed max-w-md mt-3.5 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              Login to explore our exclusive collections, track your orders, manage your account and experience the world of fine jewellery.
            </p>

            {/* 3 Circular Benefit Badges */}
            <div className="flex items-start gap-7 sm:gap-9 pt-7 sm:pt-9">
              {/* Badge 1: Exclusive Collections */}
              <div className="flex flex-col items-center text-center gap-2 group">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/40 bg-black/25 backdrop-blur-md flex items-center justify-center text-white/95 group-hover:border-[#D6B477] group-hover:text-[#D6B477] group-hover:scale-105 transition-all shadow-md">
                  <Gem className="w-5 h-5 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-sans font-medium text-white/90 leading-tight drop-shadow-sm">
                  Exclusive<br />Collections
                </span>
              </div>

              {/* Badge 2: Secure Shopping */}
              <div className="flex flex-col items-center text-center gap-2 group">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/40 bg-black/25 backdrop-blur-md flex items-center justify-center text-white/95 group-hover:border-[#D6B477] group-hover:text-[#D6B477] group-hover:scale-105 transition-all shadow-md">
                  <Lock className="w-5 h-5 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-sans font-medium text-white/90 leading-tight drop-shadow-sm">
                  Secure<br />Shopping
                </span>
              </div>

              {/* Badge 3: Personalized Experience */}
              <div className="flex flex-col items-center text-center gap-2 group">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/40 bg-black/25 backdrop-blur-md flex items-center justify-center text-white/95 group-hover:border-[#D6B477] group-hover:text-[#D6B477] group-hover:scale-105 transition-all shadow-md">
                  <User className="w-5 h-5 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-sans font-medium text-white/90 leading-tight drop-shadow-sm">
                  Personalized<br />Experience
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM-LEFT WATERMARK */}
          <div className="relative z-10 select-none">
            <p 
              className="italic text-2xl sm:text-3xl text-white/95 tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Crafted for
            </p>
            <p 
              className="text-3xl sm:text-4xl text-[#F5E5C9] font-normal leading-tight ml-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Alex Brush', cursive" }}
            >
              Your Moments
            </p>
          </div>

        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: WARM IVORY BACKGROUND + TOP-RIGHT NAV + AUTH CARD        */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`relative w-full lg:w-[42%] flex flex-col justify-between p-6 sm:p-8 lg:p-10 transition-colors overflow-y-auto ${
          isDark 
            ? 'bg-[#140A0F]' 
            : 'bg-[#FAF7F1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#EDE3D5]/40 via-transparent to-transparent'
        }`}>
          
          {/* Subtle Decorative Floral Line Engraving Watermark in the Right Corner */}
          <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none opacity-[0.04] overflow-hidden">
            <svg viewBox="0 0 200 200" className="w-full h-full text-[#4A0717] fill-current">
              <path d="M100 0 C120 40 160 40 200 0 C160 20 160 60 200 100 C160 80 120 120 100 200 C80 120 40 80 0 100 C40 60 40 20 0 0 C40 40 80 40 100 0 Z" />
            </svg>
          </div>

          {/* TOP-RIGHT NAVIGATION */}
          <div className="relative z-20 w-full flex items-center justify-end gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={isDark ? 'text-white/60' : 'text-[#7A6D71]'}>
                {isSignUp ? 'Already have an account?' : 'New to YAZHINI?'}
              </span>
              <button
                type="button"
                onClick={() => switchMode()}
                className={`font-semibold transition-all inline-flex items-center gap-1 cursor-pointer py-1 px-1.5 ${
                  isDark ? 'text-[#D6B477] hover:text-white' : 'text-[#241318] hover:text-[#4A0717]'
                }`}
              >
                <span className="underline underline-offset-4">
                  {isSignUp ? 'Sign In' : 'Create an Account'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ThemeToggle className={`!w-8 !h-8 !p-0 ml-1 flex items-center justify-center rounded-full backdrop-blur-md transition-all ${
              isDark
                ? '!bg-black/50 !border-[#D6B477]/30 !text-[#D6B477]'
                : '!bg-white !border-[#EDE3D5] !text-[#4A0717] shadow-sm'
            }`} />
          </div>

          {/* CENTER: FLOATING LUXURY AUTHENTICATION CARD */}
          <div className="relative z-10 w-full my-auto flex flex-col items-center justify-center">
            <div className={`w-full max-w-[430px] rounded-[30px] p-6 sm:p-8 transition-all duration-300 border shadow-2xl ${
              isDark 
                ? 'bg-[#1A0E15]/95 border-[#D6B477]/30 shadow-[0_24px_70px_rgba(0,0,0,0.85)] text-[#FAF7F1]' 
                : 'bg-white border-[#EDE3D5] shadow-[0_24px_60px_rgba(74,7,23,0.07)] text-[#241318]'
            }`}>

              {/* Card Centered Brand Header */}
              <div className="text-center mb-4">
                {/* Burgundy square with gold Y */}
                <div className="w-11 h-11 rounded-xl bg-[#4A0717] border border-[#D6B477]/40 flex items-center justify-center shadow-sm mx-auto mb-2">
                  <span 
                    className="text-xl font-bold text-[#D6B477] leading-none select-none"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Y
                  </span>
                </div>
                <h2 
                  className="text-lg font-bold tracking-[0.2em] uppercase leading-tight"
                  style={{ 
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    color: isDark ? '#FAF7F1' : '#241318' 
                  }}
                >
                  YAZHINI
                </h2>
                <span className={`text-[9px] font-sans font-semibold tracking-[0.32em] uppercase block mt-0.5 ${
                  isDark ? 'text-[#D6B477]' : 'text-[#826E74]'
                }`}>
                  FINE JEWELS
                </span>

                {/* Title & Subtitle in Title Case */}
                <h3 
                  className="text-2xl font-bold mt-2.5 mb-1"
                  style={{ 
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    color: isDark ? '#FAF7F1' : '#241318' 
                  }}
                >
                  {isSignUp ? 'Create Your Account' : 'Login to Your Account'}
                </h3>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-[#7A6D71]'}`}>
                  {isSignUp
                    ? 'Welcome! Please enter your details to continue.'
                    : 'Welcome back! Please enter your details to continue.'}
                </p>
              </div>

              {/* Error & Success Messages */}
              {error && (
                <div
                  role="alert"
                  className="mb-3.5 bg-rose-950/60 border border-rose-800/60 text-rose-200 px-3.5 py-2 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="flex-1 leading-snug">{error}</span>
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mb-3.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 px-3.5 py-2 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span className="flex-1 leading-snug">{success}</span>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-3" noValidate>

                {/* Full Name Field (Sign Up Mode) */}
                {isSignUp && (
                  <div>
                    <div className={`rounded-xl border px-3.5 py-2.5 transition-all flex items-center gap-3 ${
                      isDark 
                        ? 'border-[#D6B477]/30 bg-white/[0.04] focus-within:border-[#D6B477] focus-within:ring-1 focus-within:ring-[#D6B477]/30' 
                        : 'border-[#EDE3D5] bg-[#FAF8F5]/50 focus-within:bg-white focus-within:border-[#4A0717] focus-within:ring-1 focus-within:ring-[#4A0717]/20'
                    }`}>
                      <User className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#D6B477]' : 'text-[#7A6D71]'}`} />
                      <div className="flex-1 min-w-0">
                        <label htmlFor="client-fullname" className="block text-[10px] font-sans font-medium text-[#7A6D71] leading-none mb-1">
                          Full Name
                        </label>
                        <input
                          id="client-fullname"
                          type="text"
                          autoComplete="name"
                          placeholder="e.g. Sangeetha Natarajan"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={loading}
                          className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none font-sans ${
                            isDark ? 'text-[#FAF7F1] placeholder-white/25' : 'text-[#200E14] placeholder-[#A09396]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Address / Mobile Number Field */}
                <div>
                  <div className={`rounded-xl border px-3.5 py-2.5 transition-all flex items-center gap-3 ${
                    fieldErrors.email
                      ? 'border-rose-500 bg-rose-950/20'
                      : isDark
                        ? 'border-[#D6B477]/30 bg-white/[0.04] focus-within:border-[#D6B477] focus-within:ring-1 focus-within:ring-[#D6B477]/30'
                        : 'border-[#EDE3D5] bg-[#FAF8F5]/50 focus-within:bg-white focus-within:border-[#4A0717] focus-within:ring-1 focus-within:ring-[#4A0717]/20'
                  }`}>
                    <Mail className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#D6B477]' : 'text-[#7A6D71]'}`} />
                    <div className="flex-1 min-w-0">
                      <label htmlFor="client-email" className="block text-[10px] font-sans font-medium text-[#7A6D71] leading-none mb-1">
                        Email Address / Mobile Number
                      </label>
                      <input
                        id="client-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="patron@rcbjewelry.in"
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
                        className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none font-sans ${
                          isDark ? 'text-[#FAF7F1] placeholder-white/25' : 'text-[#200E14] placeholder-[#A09396]'
                        }`}
                      />
                    </div>
                  </div>
                  <FormFieldError id="client-email-error" error={fieldErrors.email} />
                </div>

                {/* Mobile Phone Field (Sign Up Mode) */}
                {isSignUp && (
                  <div>
                    <div className={`rounded-xl border px-3.5 py-2.5 transition-all flex items-center gap-3 ${
                      isDark 
                        ? 'border-[#D6B477]/30 bg-white/[0.04] focus-within:border-[#D6B477] focus-within:ring-1 focus-within:ring-[#D6B477]/30' 
                        : 'border-[#EDE3D5] bg-[#FAF8F5]/50 focus-within:bg-white focus-within:border-[#4A0717] focus-within:ring-1 focus-within:ring-[#4A0717]/20'
                    }`}>
                      <Phone className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#D6B477]' : 'text-[#7A6D71]'}`} />
                      <span className="text-xs font-mono font-medium text-[#7A6D71] border-r border-[#EDE3D5] pr-2">+91</span>
                      <div className="flex-1 min-w-0">
                        <label htmlFor="client-phone" className="block text-[10px] font-sans font-medium text-[#7A6D71] leading-none mb-1">
                          Mobile Number
                        </label>
                        <input
                          id="client-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                          className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none font-sans ${
                            isDark ? 'text-[#FAF7F1] placeholder-white/25' : 'text-[#200E14] placeholder-[#A09396]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <div className={`rounded-xl border px-3.5 py-2.5 transition-all flex items-center gap-3 ${
                    fieldErrors.password
                      ? 'border-rose-500 bg-rose-950/20'
                      : isDark
                        ? 'border-[#D6B477]/30 bg-white/[0.04] focus-within:border-[#D6B477] focus-within:ring-1 focus-within:ring-[#D6B477]/30'
                        : 'border-[#EDE3D5] bg-[#FAF8F5]/50 focus-within:bg-white focus-within:border-[#4A0717] focus-within:ring-1 focus-within:ring-[#4A0717]/20'
                  }`}>
                    <Lock className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#D6B477]' : 'text-[#7A6D71]'}`} />
                    <div className="flex-1 min-w-0">
                      <label htmlFor="client-password" className="block text-[10px] font-sans font-medium text-[#7A6D71] leading-none mb-1">
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
                          setActiveDemoRole(null);
                          if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                        }}
                        onBlur={() => handleBlur('password')}
                        disabled={loading}
                        minLength={6}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? "client-password-error" : undefined}
                        className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none font-sans ${
                          isDark ? 'text-[#FAF7F1] placeholder-white/25' : 'text-[#200E14] placeholder-[#A09396]'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`p-1 focus:outline-none cursor-pointer transition-colors ${
                        isDark ? 'text-white/40 hover:text-white' : 'text-[#8A7D81] hover:text-[#200E14]'
                      }`}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FormFieldError id="client-password-error" error={fieldErrors.password} />
                </div>

                {/* Confirm Password Field (Sign Up Mode) */}
                {isSignUp && (
                  <div>
                    <div className={`rounded-xl border px-3.5 py-2.5 transition-all flex items-center gap-3 ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-500 bg-rose-950/20'
                        : isDark
                          ? 'border-[#D6B477]/30 bg-white/[0.04] focus-within:border-[#D6B477] focus-within:ring-1 focus-within:ring-[#D6B477]/30'
                          : 'border-[#EDE3D5] bg-[#FAF8F5]/50 focus-within:bg-white focus-within:border-[#4A0717] focus-within:ring-1 focus-within:ring-[#4A0717]/20'
                    }`}>
                      <Lock className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#D6B477]' : 'text-[#7A6D71]'}`} />
                      <div className="flex-1 min-w-0">
                        <label htmlFor="confirm-password" className="block text-[10px] font-sans font-medium text-[#7A6D71] leading-none mb-1">
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
                          onBlur={() => handleBlur('confirmPassword')}
                          disabled={loading}
                          aria-invalid={Boolean(fieldErrors.confirmPassword)}
                          aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                          className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none font-sans ${
                            isDark ? 'text-[#FAF7F1] placeholder-white/25' : 'text-[#200E14] placeholder-[#A09396]'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`p-1 focus:outline-none cursor-pointer transition-colors ${
                          isDark ? 'text-white/40 hover:text-white' : 'text-[#8A7D81] hover:text-[#200E14]'
                        }`}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <FormFieldError id="confirm-password-error" error={fieldErrors.confirmPassword} />
                  </div>
                )}

                {/* Remember Me & Forgot Password Row (Sign In Mode) */}
                {!isSignUp && (
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded cursor-pointer accent-[#4A0717] text-[#4A0717]"
                      />
                      <span className={`text-xs ${isDark ? 'text-white/80' : 'text-[#382315]'}`}>
                        Remember me
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setIsForgotPasswordOpen(true);
                      }}
                      className={`text-xs font-semibold hover:underline transition-colors cursor-pointer ${
                        isDark ? 'text-[#D6B477]' : 'text-[#241318] hover:text-[#4A0717]'
                      }`}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Primary Action Button (Deep Burgundy with arrow) */}
                <div className="pt-1.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 px-6 rounded-full font-sans font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark 
                        ? 'bg-gradient-to-r from-[#D6B477] via-[#F3E5CF] to-[#AA771C] text-[#12070A] hover:brightness-110 active:scale-[0.99]' 
                        : 'bg-[#4A0717] hover:bg-[#380512] text-white shadow-[#4A0717]/25 hover:shadow-lg hover:shadow-[#4A0717]/35 active:scale-[0.99]'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                        <span>{isSignUp ? 'CREATING ACCOUNT...' : 'VERIFYING...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Divider: ── OR ── */}
                <div className="relative py-1 flex items-center justify-center">
                  <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-[#EDE3D5]'}`} />
                  <span className={`absolute px-3 text-[11px] font-sans uppercase tracking-wider ${
                    isDark ? 'bg-[#1A0E15] text-white/40' : 'bg-white text-[#8A7D81]'
                  }`}>
                    OR
                  </span>
                </div>

                {/* Social Login Buttons (Google & Apple) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={loading}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      isDark 
                        ? 'bg-white/[0.04] border-white/15 text-white/90 hover:bg-white/10' 
                        : 'bg-white border-[#EDE3D5] text-[#241318] hover:bg-[#FAF8F5] shadow-xs'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="truncate">Continue with Google</span>
                  </button>

                  {/* Apple Button */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('apple')}
                    disabled={loading}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                      isDark 
                        ? 'bg-white/[0.04] border-white/15 text-white/90 hover:bg-white/10' 
                        : 'bg-white border-[#EDE3D5] text-[#241318] hover:bg-[#FAF8F5] shadow-xs'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.63 1.34-.56.64-1.05 1.7-0.92 2.73 1.01.08 2.03-.5 2.63-1.22z"/>
                    </svg>
                    <span className="truncate">Continue with Apple</span>
                  </button>
                </div>

                {/* Bottom Security Trust Badge */}
                <div className={`mt-3.5 pt-3 border-t flex items-center gap-3 ${
                  isDark ? 'border-white/10' : 'border-[#F2ECE4]'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-white/5 text-[#D6B477]' : 'bg-[#FAF7F1] border border-[#EDE3D5] text-[#D6B477]'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className={`block text-xs font-semibold leading-tight ${
                      isDark ? 'text-[#FAF7F1]' : 'text-[#241318]'
                    }`}>
                      Your information is 100% secure
                    </span>
                    <span className={`block text-[11px] leading-tight mt-0.5 ${
                      isDark ? 'text-white/50' : 'text-[#7A6D71]'
                    }`}>
                      We never share your data with third parties.
                    </span>
                  </div>
                </div>

              </form>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="w-full max-w-[430px] mt-2.5 px-2">
              <button
                type="button"
                onClick={() => setShowDemoAccess(!showDemoAccess)}
                className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-sans font-semibold tracking-wider transition-colors cursor-pointer py-1 ${
                  isDark ? 'text-white/40 hover:text-[#D6B477]' : 'text-[#8A7D81] hover:text-[#4A0717]'
                }`}
              >
                <span>✨ 1-Click Test Credentials</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showDemoAccess ? 'rotate-180' : ''}`} />
              </button>

              {showDemoAccess && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1.5 animate-in fade-in duration-150">
                  {demoAccounts.map(acc => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition-all cursor-pointer text-center truncate ${
                        activeDemoRole === acc.role
                          ? isDark 
                            ? 'bg-[#D6B477] text-[#12070A] border-[#D6B477]'
                            : 'bg-[#4A0717] text-white border-[#4A0717]'
                          : isDark
                            ? 'bg-white/[0.03] border-white/10 text-white/70 hover:border-[#D6B477]/50 hover:text-white'
                            : 'bg-white border-[#EDE3D5] text-[#4A3D41] hover:border-[#4A0717] hover:text-[#200E14] shadow-xs'
                      }`}
                      title={acc.email}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>


      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL (Luxury Glassmorphic)                                */}
      {/* ========================================================================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`relative rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border animate-in fade-in zoom-in-95 duration-200 ${
            isDark 
              ? 'bg-[#160E12] text-[#FAF5ED] border-[#C9A46A]/40' 
              : 'bg-white text-[#241A1E] border-[#E2D5C3] shadow-[0_24px_50px_rgba(66,11,22,0.15)]'
          }`}>
            
            <button
              onClick={() => setIsForgotPasswordOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
                isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[#7A6D71] hover:text-[#241A1E] hover:bg-black/5'
              }`}
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`flex items-center gap-2.5 mb-2 ${isDark ? 'text-[#D8B878]' : 'text-[#420B16]'}`}>
              <Lock className="w-5 h-5" />
              <h3 
                className="text-xl font-bold"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                Reset Password
              </h3>
            </div>

            <p className={`text-xs leading-relaxed mb-5 ${isDark ? 'text-[#C5B5B8]' : 'text-[#6B5E62]'}`}>
              Enter your registered email address. We will send an encrypted recovery link to safely reset your password.
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
                <span className="flex-1 leading-snug">{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
              <div>
                <label htmlFor="reset-client-email" className={`block text-[11px] uppercase tracking-wider font-semibold mb-1 ${
                  isDark ? 'text-[#D8B878]' : 'text-[#420B16]'
                }`}>
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
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-colors ${
                    resetEmailError 
                      ? 'border-rose-500 bg-rose-950/20' 
                      : isDark
                        ? 'border-[#C9A46A]/30 focus:border-[#C9A46A] bg-white/[0.04] text-[#FAF5ED] placeholder-white/30'
                        : 'border-[#D8C9B9] focus:border-[#420B16] bg-[#FAF8F5] text-[#241A1E] placeholder-[#9C8F93]'
                  }`}
                />
                <FormFieldError id="reset-email-error" error={resetEmailError} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-sans cursor-pointer transition-colors ${
                    isDark ? 'text-white/60 hover:text-white' : 'text-[#6B5E62] hover:text-[#241A1E]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`px-6 py-2.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#D8B878] to-[#C9A46A] text-[#12070A] hover:brightness-105' 
                      : 'bg-[#420B16] text-white hover:bg-[#320810]'
                  }`}
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