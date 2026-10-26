import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShoppingBag, Scale, Package, ArrowRight, User as UserIcon, 
  CreditCard, X, ShieldCheck, Coins, Sparkles, History,
  Download, Truck, CheckCircle2, Copy, Heart, MapPin, 
  Search, Plus, Trash2, Edit3, Check, Phone, 
  Calendar, MessageSquare, KeyRound, ArrowUpRight, Bell,
  AlertCircle, RotateCcw, Lock, Printer
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Order } from '../types/pawnshop';
import { PawnRequest } from '../lib/supabase';
import { PaymentGateway } from '../components/PaymentGateway';
import { createPartPayment } from '../services/transactionService';
import { toast } from '../utils/toast';
import { formatCurrencyINR } from '../utils/formatters';
import { generateInvoice } from '../utils/invoiceUtils';
import { useRates } from '../context/RateContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { localJewelryItems } from '../utils/localData';
import { validatePhone, validateMinLength } from '../utils/validation';

// Specialized Dashboard sub-components
import { CustomerAccountHeader } from '../components/dashboard/CustomerAccountHeader';
import { CustomerAccountSidebar } from '../components/dashboard/CustomerAccountSidebar';
import { CustomerAccountRightPanel } from '../components/dashboard/CustomerAccountRightPanel';
import { AddressModal, SavedAddress } from '../components/dashboard/AddressModal';
import { ReturnExchangeModal } from '../components/dashboard/ReturnExchangeModal';
import { CustomerGiftCardsTab } from '../components/dashboard/CustomerGiftCardsTab';
import { ReceiptPrinterModal } from '../components/ui/ReceiptPrinterModal';
import { type ThermalReceiptData, convertOrderToReceipt } from '../utils/thermalReceiptUtils';

interface ActiveLoan {
  id: string;
  pledge_number: string;
  pledge_date: string;
  loan_amount: number;
  interest_rate: number;
  interest_type: string;
  status: string;
  total_weight_grams: number;
  part_payments?: Array<{ payment_amount: number; payment_date: string }>;
}

interface DigitalGoldVaultData {
  account_number: string;
  gold_balance_grams: number;
  reserved_grams: number;
  market_value: number;
  transactions: any[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'order' | 'rate' | 'vault' | 'concierge';
  timestamp: string;
  isRead: boolean;
}

export default function Dashboard() {
  const { rates } = useRates();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCartWithAnimation } = useCart();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setPawns] = useState<PawnRequest[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [goldVault, setGoldVault] = useState<DigitalGoldVaultData | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Address management state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  // Modals state
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<ActiveLoan | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any | null>(null);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any | null>(null);

  // Thermal Receipt Printer state
  const [thermalReceiptData, setThermalReceiptData] = useState<ThermalReceiptData | null>(null);
  const [isThermalPrinterOpen, setIsThermalPrinterOpen] = useState(false);

  // Orders tab filtering
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  // Profile Form state with inline validation tracking
  const initialProfileState = {
    fullName: '',
    phone: '',
    dob: '1988-06-15',
    gender: 'female',
    preferredLanguage: 'Tamil'
  };
  const [profileForm, setProfileForm] = useState(initialProfileState);
  const [initialProfileData, setInitialProfileData] = useState(initialProfileState);
  const [profileErrors, setProfileErrors] = useState<{
    fullName?: string;
    phone?: string;
    dob?: string;
  }>({});
  const [profileTouched, setProfileTouched] = useState<{
    fullName?: boolean;
    phone?: boolean;
    dob?: boolean;
  }>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Consignment Dispatched via Sequel Armoured Logistics',
      message: 'Your fine jewellery piece has passed BIS 916 laser hallmarking and is in transit with full insurance cover.',
      category: 'order',
      timestamp: 'Today, 10:30 AM',
      isRead: false
    },
    {
      id: 'notif-2',
      title: 'Aura Gold™ Market Benchmark Update',
      message: '24K 999.9 Bullion rate updated to prevailing benchmark ₹14,928/g. Your vault holding has been re-evaluated.',
      category: 'vault',
      timestamp: 'Yesterday, 04:15 PM',
      isRead: false
    },
    {
      id: 'notif-3',
      title: 'Complimentary Ultrasonic Cleaning Service Due',
      message: 'Your annual complimentary jewellery inspection and cleaning is available at our Cathedral Road Showroom, Chennai.',
      category: 'concierge',
      timestamp: '3 days ago',
      isRead: true
    }
  ]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // If user visits /dashboard?tab=notifications, open the nav notification popover and redirect to overview
  useEffect(() => {
    if (searchParams.get('tab') === 'notifications') {
      setIsNotificationOpen(true);
      setSearchParams({ tab: 'overview' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  // Appointment Form state
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '11:00 AM',
    showroom: 'Cathedral Road Flagship, Chennai',
    category: 'Bridal & Heritage Jewellery',
    notes: ''
  });

  // Calculate live Aura Gold market valuation
  const vaultMarketValue = useMemo(() => {
    if (!goldVault) return 0;
    const currentRate = rates.gold || 14928.00;
    return Math.round(Number(goldVault.gold_balance_grams || 0) * currentRate * 100) / 100;
  }, [goldVault, rates.gold]);

  // Active in-transit orders
  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'processing' || o.status === 'shipped').length;
  }, [orders]);

  // Wishlist matching real products
  const wishlistProducts = useMemo(() => {
    return localJewelryItems.filter(item => wishlist.includes(item.id));
  }, [wishlist]);

  // Curated recommendations (3 top items)
  const recommendedProducts = useMemo(() => {
    return localJewelryItems.slice(0, 3);
  }, []);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        !orderSearchQuery ||
        (order.order_number || order.id).toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.items?.some(i => i.product_name.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
        order.tracking_number?.toLowerCase().includes(orderSearchQuery.toLowerCase());

      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearchQuery, orderStatusFilter]);

  // Tab Title helper
  const activeTabTitle = useMemo(() => {
    switch (currentTab) {
      case 'orders': return 'My Orders';
      case 'track': return 'Live Tracking';
      case 'wishlist': return 'My Wishlist';
      case 'addresses': return 'Saved Addresses';
      case 'profile': return 'Patron Profile';
      case 'vault': return 'Aura Gold™ Vault';
      case 'loans': return 'Collateral Loans';
      case 'transactions': return 'Transactions Ledger';
      case 'support': return 'Patron Concierge';
      case 'settings': return 'Security & Settings';
      default: return 'Account Overview';
    }
  }, [currentTab]);

  // Tab switch handler
  const handleSelectTab = useCallback((tabId: string) => {
    setSearchParams({ tab: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  // Initial Data Fetching & Sync
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Initial profile form population
        const initialUserData = {
          fullName: user.user_metadata?.full_name || '',
          phone: user.phone || '9840123456',
          dob: user.user_metadata?.dob || '1988-06-15',
          gender: user.user_metadata?.gender || 'female',
          preferredLanguage: user.user_metadata?.preferred_language || 'Tamil'
        };
        setProfileForm(initialUserData);
        setInitialProfileData(initialUserData);

        // 1. Fetch Orders
        try {
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (ordersData && ordersData.length > 0) {
            setOrders(ordersData);
          } else {
            // High-fidelity fallback order for authenticated patron preview if none placed yet
            setOrders([
              {
                id: 'YZ-ORD-882194',
                order_number: 'YZ-ORD-882194',
                user_id: user.id,
                total_amount: 185000,
                status: 'shipped',
                courier_partner: 'Sequel Armoured Express Logistics',
                tracking_number: 'SEQL-EXP-992144',
                shipping_address: {
                  fullName: user.user_metadata?.full_name || 'Rajeshwari Sundaram',
                  street: 'No. 42, Poes Garden, Cathedral Road',
                  city: 'Chennai',
                  zipCode: '600086',
                  phone: '9840123456'
                },
                items: [
                  {
                    id: 'item-1',
                    order_id: 'YZ-ORD-882194',
                    product_name: 'Royal Vivaah Ruby & Kundan Bridal Choker',
                    price: 185000,
                    weight: 48.5,
                    purity: '22K (BIS 916)',
                    image_url: '/images/bridal_vivaah_ruby_kundan.jpg'
                  } as any
                ],
                created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
          }
        } catch (err) {
          console.warn('[Dashboard] Error fetching orders:', err);
        }

        // 2. Fetch Pawn Applications & Loans
        try {
          const { data: pawnData } = await supabase
            .from('pawn_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (pawnData) setPawns(pawnData);

          const { data: customerRecord } = await supabase
            .from('customers')
            .select('id, full_name, phone, address, city, state, pincode')
            .eq('user_id', user.id)
            .maybeSingle();

          if (customerRecord) {
            if (customerRecord.full_name) {
              setProfileForm(prev => ({
                ...prev,
                fullName: customerRecord.full_name,
                phone: customerRecord.phone || prev.phone
              }));
            }

            const { data: pledgesData } = await supabase
              .from('pledges')
              .select('id, pledge_number, pledge_date, loan_amount, interest_rate, interest_type, status, total_weight_grams, part_payments(payment_amount, payment_date)')
              .eq('customer_id', customerRecord.id)
              .order('pledge_date', { ascending: false });

            if (pledgesData) setActiveLoans(pledgesData as any);
          }
        } catch (err) {
          console.warn('[Dashboard] Error fetching pledges:', err);
        }

        // 3. Fetch Aura Gold Vault Data
        try {
          const { data: dgAccount } = await supabase
            .from('digital_gold_accounts')
            .select('*')
            .eq('customer_id', user.id)
            .maybeSingle();

          const { data: dgTxns } = await supabase
            .from('digital_gold_transactions')
            .select('*')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          const balance = dgAccount ? Number(dgAccount.gold_balance_grams || 0) : 12.5042;
          const estRate = rates.gold || 14928.00;
          setGoldVault({
            account_number: dgAccount?.account_number || 'AG-ACC-MVJ6ZIYM-B3AD',
            gold_balance_grams: balance,
            reserved_grams: Number(dgAccount?.reserved_grams || 0),
            market_value: Math.round(balance * estRate * 100) / 100,
            transactions: dgTxns && dgTxns.length > 0 ? dgTxns : [
              {
                id: 'tx-1',
                transaction_reference: 'AG-TXN-99412',
                type: 'BUY',
                grams: 10.0000,
                total_amount: 149280,
                status: 'COMPLETED',
                created_at: new Date(Date.now() - 86400000 * 5).toISOString()
              },
              {
                id: 'tx-2',
                transaction_reference: 'AG-TXN-88124',
                type: 'BUY',
                grams: 2.5042,
                total_amount: 37382,
                status: 'COMPLETED',
                created_at: new Date(Date.now() - 86400000 * 18).toISOString()
              }
            ]
          });
        } catch (dgErr) {
          console.warn('[Dashboard] Error fetching digital gold account:', dgErr);
        }

        // 4. Load Saved Addresses from localStorage / profile
        const storageKey = `yazhini_addresses_${user.id}`;
        const storedAddresses = localStorage.getItem(storageKey);
        if (storedAddresses) {
          try {
            setAddresses(JSON.parse(storedAddresses));
          } catch (e) {
            console.error('Error parsing stored addresses', e);
          }
        } else {
          // Default primary address
          const defaultAddr: SavedAddress = {
            id: 'addr-primary',
            fullName: user.user_metadata?.full_name || 'Rajeshwari Sundaram',
            phone: user.phone || '9840123456',
            street: 'No. 42, Poes Garden, Cathedral Road',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600086',
            isDefault: true,
            label: 'Home'
          };
          setAddresses([defaultAddr]);
          localStorage.setItem(storageKey, JSON.stringify([defaultAddr]));
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // Save address handler
  const handleSaveAddress = (address: SavedAddress) => {
    if (!user) return;
    const storageKey = `yazhini_addresses_${user.id}`;
    let updated: SavedAddress[];

    if (address.isDefault) {
      updated = addresses.map(a => ({ ...a, isDefault: a.id === address.id }));
      const exists = updated.some(a => a.id === address.id);
      if (!exists) {
        updated.push(address);
      } else {
        updated = updated.map(a => a.id === address.id ? address : a);
      }
    } else {
      const exists = addresses.some(a => a.id === address.id);
      if (exists) {
        updated = addresses.map(a => a.id === address.id ? address : a);
      } else {
        updated = [...addresses, address];
      }
    }

    setAddresses(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Delete address handler
  const handleDeleteAddress = (id: string) => {
    if (!user) return;
    const storageKey = `yazhini_addresses_${user.id}`;
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.info('Address removed from address book');
  };

  // Set default address
  const handleSetDefaultAddress = (id: string) => {
    if (!user) return;
    const storageKey = `yazhini_addresses_${user.id}`;
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success('Default delivery address updated');
  };

  // Profile Field-Level Validation Rules
  const validateProfileField = useCallback((field: 'fullName' | 'phone' | 'dob', value: string): string | undefined => {
    switch (field) {
      case 'fullName': {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'Full legal name is required';
        }
        if (trimmed.length < 2) {
          return 'Name must contain at least 2 characters';
        }
        if (trimmed.length > 50) {
          return 'Name cannot exceed 50 characters';
        }
        if (!/^[a-zA-Z\s.']{2,50}$/.test(trimmed)) {
          return 'Name must only contain letters, spaces, and periods';
        }
        return undefined;
      }
      case 'phone': {
        const cleaned = value.trim();
        if (!cleaned) {
          return 'Primary mobile number is required';
        }
        if (!validatePhone(cleaned)) {
          return 'Enter a valid 10-digit Indian mobile number (e.g. 9840123456)';
        }
        return undefined;
      }
      case 'dob': {
        if (!value) {
          return 'Date of birth is required for KYC compliance';
        }
        const birthDate = new Date(value);
        if (isNaN(birthDate.getTime())) {
          return 'Please select a valid date';
        }
        const today = new Date();
        if (birthDate > today) {
          return 'Date of birth cannot be in the future';
        }
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          return 'Patron must be at least 18 years of age for bullion transactions';
        }
        if (age > 120) {
          return 'Please enter a realistic date of birth';
        }
        return undefined;
      }
      default:
        return undefined;
    }
  }, []);

  // Profile Field Change Handler with live validation
  const handleProfileFieldChange = (field: 'fullName' | 'phone' | 'dob', rawValue: string) => {
    let sanitized = rawValue;
    if (field === 'phone') {
      // Auto-filter non-digit characters if no country code
      if (!rawValue.startsWith('+')) {
        sanitized = rawValue.replace(/\D/g, '').slice(0, 10);
      }
    }
    setProfileForm(prev => ({ ...prev, [field]: sanitized }));

    // Run real-time validation if user already blurred the field
    if (profileTouched[field]) {
      const err = validateProfileField(field, sanitized);
      setProfileErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  // Profile Field Blur Handler (mark touched and validate)
  const handleProfileFieldBlur = (field: 'fullName' | 'phone' | 'dob') => {
    setProfileTouched(prev => ({ ...prev, [field]: true }));
    const err = validateProfileField(field, profileForm[field]);
    setProfileErrors(prev => ({ ...prev, [field]: err }));
  };

  // Check if profile form has unsaved modifications
  const isProfileDirty = useMemo(() => {
    return (
      profileForm.fullName !== initialProfileData.fullName ||
      profileForm.phone !== initialProfileData.phone ||
      profileForm.dob !== initialProfileData.dob ||
      profileForm.gender !== initialProfileData.gender ||
      profileForm.preferredLanguage !== initialProfileData.preferredLanguage
    );
  }, [profileForm, initialProfileData]);

  // Discard profile form modifications
  const handleResetProfile = () => {
    setProfileForm(initialProfileData);
    setProfileErrors({});
    setProfileTouched({});
    toast.info('Profile edits reverted');
  };

  // Profile Submit with comprehensive validation
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all required fields as touched
    setProfileTouched({ fullName: true, phone: true, dob: true });

    const nameErr = validateProfileField('fullName', profileForm.fullName);
    const phoneErr = validateProfileField('phone', profileForm.phone);
    const dobErr = validateProfileField('dob', profileForm.dob);

    const validationErrors = {
      fullName: nameErr,
      phone: phoneErr,
      dob: dobErr
    };
    setProfileErrors(validationErrors);

    if (nameErr || phoneErr || dobErr) {
      toast.error(nameErr || phoneErr || dobErr || 'Please resolve the highlighted errors in the form');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (user) {
        await supabase.auth.updateUser({
          data: {
            full_name: profileForm.fullName.trim(),
            dob: profileForm.dob,
            gender: profileForm.gender,
            preferred_language: profileForm.preferredLanguage
          }
        });
        await supabase
          .from('customers')
          .update({
            full_name: profileForm.fullName.trim(),
            phone: profileForm.phone.trim()
          })
          .eq('user_id', user.id);
      }
      setInitialProfileData({ ...profileForm, fullName: profileForm.fullName.trim() });
      toast.success('Patron profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password reset request
  const handleRequestPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login`
      });
      toast.success(`Password reset link dispatched to ${user.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Error sending password reset email');
    }
  };

  // Appointment Submission
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentData.date) {
      toast.error('Please select a preferred consultation date');
      return;
    }
    toast.success(`VIP appointment confirmed for ${appointmentData.date} at ${appointmentData.showroom}. A dedicated concierge advisor will contact you.`);
    setAppointmentData(prev => ({ ...prev, notes: '' }));
  };

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.info('Signed out of Patron Portal');
    navigate('/login');
  };

  // Loan Repayment
  const handleOpenRepayment = (loan: ActiveLoan) => {
    const totalPaid = loan.part_payments?.reduce((s, p) => s + (Number(p.payment_amount) || 0), 0) || 0;
    const outstanding = Math.max(0, Number(loan.loan_amount) - totalPaid);
    const monthlyInterest = Math.round((outstanding * (Number(loan.interest_rate) || 2)) / 100);
    setRepayAmount(monthlyInterest > 0 ? monthlyInterest : 1000);
    setSelectedLoanForRepayment(loan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (paymentResult: any) => {
    if (!selectedLoanForRepayment) return;
    try {
      await createPartPayment({
        pledge_id: selectedLoanForRepayment.id,
        payment_amount: repayAmount,
        payment_mode: 'upi',
        receipt_number: `RZP-${paymentResult.id || Date.now()}`,
        notes: `Online portal repayment via Razorpay (${paymentResult.id})`
      });

      toast.success(`Payment of ₹${repayAmount.toLocaleString('en-IN')} recorded successfully!`);
      setIsPaymentModalOpen(false);
      setSelectedLoanForRepayment(null);

      setActiveLoans(prev => prev.map(loan => {
        if (loan.id === selectedLoanForRepayment.id) {
          const currentParts = loan.part_payments || [];
          return {
            ...loan,
            status: 'partially_paid',
            part_payments: [...currentParts, { payment_amount: repayAmount, payment_date: new Date().toISOString().split('T')[0] }]
          };
        }
        return loan;
      }));
    } catch (err: any) {
      toast.error(err.message || 'Payment recorded, but ledger update failed.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': case 'approved': case 'closed': case 'COMPLETED':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'shipped': case 'processing': case 'partially_paid':
        return 'text-sky-500 bg-sky-500/10 border-sky-500/30';
      case 'pending': case 'active': case 'open': case 'PENDING':
        return 'text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/30';
      case 'rejected': case 'cancelled': case 'FAILED':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-color)]';
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="customer-portal-root font-inter min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--gold-primary)] border-t-transparent animate-spin mx-auto" />
          <p className="font-serif text-sm tracking-widest text-[var(--gold-primary)] uppercase">
            Accessing Private Patron Vault...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated Patron Screen
  if (!user) {
    return (
      <div className="customer-portal-root font-inter min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-4">
        <div className="bg-[var(--bg-card)] p-8 sm:p-10 rounded-3xl shadow-2xl border border-[var(--border-color)] max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#702638] to-[#450817] border border-[#D4AF37]/40 flex items-center justify-center mx-auto shadow-md">
            <UserIcon className="h-8 w-8 text-[#D8B878]" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold-primary)] font-bold block mb-1">
              Private Client Concierge
            </span>
            <h2 className="text-2xl font-serif font-bold text-[var(--text-main)]">
              Patron Portal Sign In
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              Please authenticate to review your fine jewellery acquisitions, live consignment tracking, insured Aura Gold™ vault, and collateral portfolios.
            </p>
          </div>
          <Link
            to="/login"
            className="block w-full bg-gradient-to-r from-[#702638] via-[#450817] to-[#2B0B13] text-[#FAF7F2] py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all shadow-md border border-[#D4AF37]/30"
          >
            Authenticate Patron Credentials
          </Link>
          <div className="pt-2">
            <Link to="/" className="text-xs text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors">
              Return to Boutique Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-portal-root font-inter min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      
      {/* 1. Dedicated Compact Customer Account Header */}
      <CustomerAccountHeader
        user={user}
        activeTabTitle={activeTabTitle}
        onSelectTab={handleSelectTab}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onSignOut={handleSignOut}
        unreadCount={notifications.filter(n => !n.isRead).length}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        isNotificationOpen={isNotificationOpen}
        onToggleNotifications={() => setIsNotificationOpen(prev => !prev)}
        onCloseNotifications={() => setIsNotificationOpen(false)}
      />

      {/* 2. Main Dashboard Shell: Sidebar + Content Area + Right Concierge Panel */}
      <div className="flex-1 max-w-[1500px] w-full mx-auto flex">
        
        {/* Left Sticky Sidebar (260px) */}
        <CustomerAccountSidebar
          user={user}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onSignOut={handleSignOut}
          ordersCount={orders.length}
          wishlistCount={wishlist.length}
          addressesCount={addresses.length}
          vaultGrams={goldVault?.gold_balance_grams || 0}
          loansCount={activeLoans.length}
          unreadCount={notifications.filter(n => !n.isRead).length}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8">

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================= */}
          {currentTab === 'overview' && (
            <div className="space-y-8">
              
              {/* Refined Compact Welcome Panel */}
              <div className="bg-gradient-to-r from-[#4A1521] via-[#702638] to-[#2B0B13] rounded-2xl px-5 py-4 sm:px-6 sm:py-5 text-white shadow-lg border border-[#D4AF37]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FAF7F2] text-[11px] font-semibold mb-1.5">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>YAZHINI Royal Patron • Tier Gold</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                    Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Valued Patron'}
                  </h1>
                  <p className="text-xs text-[#E8D5D0] mt-1 max-w-xl leading-relaxed">
                    Private client and fine jewellery wealth portfolio. Monitor your bespoke acquisitions, insured consignment dispatches, and 24K bullion holdings in one unified suite.
                  </p>
                  
                  {/* Profile Completion Indicator */}
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="w-36 bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: '85%' }} />
                    </div>
                    <span className="text-[10px] text-[#E8D5D0] font-medium">85% Profile Completed</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => handleSelectTab('track')}
                    className="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#C5A059] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Order</span>
                  </button>
                  <Link
                    to="/jewellery"
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5"
                  >
                    <span>Browse Store</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 5 Live Summary Metrics Cards (Clickable) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                
                {/* Total Orders */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('orders')}
                  className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Total Orders</span>
                    <Package className="w-4 h-4 text-[var(--gold-primary)] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl font-serif font-bold text-[var(--text-main)]">
                    {orders.length}
                  </div>
                  <span className="text-[10px] text-[var(--gold-primary)] font-medium mt-1 block">
                    View order archive →
                  </span>
                </button>

                {/* Active Dispatches */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('track')}
                  className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">In Transit</span>
                    <Truck className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl font-serif font-bold text-sky-500">
                    {activeOrdersCount}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1 block">
                    Live GPS tracking →
                  </span>
                </button>

                {/* Wishlist Items */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('wishlist')}
                  className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Wishlist</span>
                    <Heart className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl font-serif font-bold text-[var(--text-main)]">
                    {wishlist.length}
                  </div>
                  <span className="text-[10px] text-rose-500 font-medium mt-1 block">
                    Saved curations →
                  </span>
                </button>

                {/* Aura Gold Vault */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('vault')}
                  className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">24K Vault</span>
                    <Coins className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl font-serif font-bold text-[#D4AF37] truncate">
                    {goldVault ? `${goldVault.gold_balance_grams.toFixed(2)}g` : '0.00g'}
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] block truncate">
                    ₹{vaultMarketValue.toLocaleString('en-IN')}
                  </span>
                </button>

                {/* Collateral Pawn Loans */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('loans')}
                  className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/50 transition-all text-left shadow-xs group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Pawn Loans</span>
                    <Scale className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-xl font-serif font-bold text-[var(--text-main)]">
                    {activeLoans.length}
                  </div>
                  <span className="text-[10px] text-amber-500 font-medium mt-1 block">
                    Online interest pay →
                  </span>
                </button>

              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => handleSelectTab('orders')}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                  <span>View All Acquisitions</span>
                </button>
                <button
                  onClick={() => handleSelectTab('track')}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Track Consignments</span>
                </button>
                <button
                  onClick={() => handleSelectTab('addresses')}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Delivery Address Book</span>
                </button>
                <Link
                  to="/auragold"
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Instant 24K Bullion Buy</span>
                </Link>
                <button
                  onClick={() => handleSelectTab('support')}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Concierge Appointment</span>
                </button>
              </div>

              {/* Recent Orders Preview */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[var(--text-main)] flex items-center gap-2">
                      <Package className="w-4 h-4 text-[var(--gold-primary)]" />
                      Recent Acquisitions &amp; Orders
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">Insured doorstep deliveries across India</p>
                  </div>
                  <button
                    onClick={() => handleSelectTab('orders')}
                    className="text-xs text-[var(--gold-primary)] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View All ({orders.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Package className="w-10 h-10 text-[var(--gold-primary)]/40 mx-auto" />
                    <p className="text-xs text-[var(--text-secondary)]">No jewellery acquisitions placed yet.</p>
                    <Link
                      to="/jewellery"
                      className="inline-block px-4 py-2 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider"
                    >
                      Explore Boutique
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map(order => (
                      <div
                        key={order.id}
                        className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[var(--text-main)]">
                              #{order.order_number || order.id}
                            </span>
                            <span className="text-[11px] text-[var(--text-secondary)]">• {new Date(order.created_at).toLocaleDateString()}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="font-serif text-xs font-medium text-[var(--text-main)]">
                            {order.items?.map(i => i.product_name).join(', ') || 'Fine Jewellery Piece'}
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            AWB: <span className="font-mono text-[var(--gold-primary)]">{order.tracking_number || `BLUEDART-${order.id.slice(-6).toUpperCase()}`}</span> • {order.courier_partner || 'Sequel Armoured Express'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--border-color)]">
                          <span className="text-sm font-serif font-bold text-gold-gradient">
                            {formatCurrencyINR(order.total_amount)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForTracking(order)}
                              className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3 text-sky-500" /> Track
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const invoiceItems = (order.items && order.items.length > 0)
                                  ? order.items.map((i: any) => ({
                                      name: i.product_name || 'Fine Jewellery Creation',
                                      price: Number(i.price || order.total_amount),
                                      weight: Number(i.weight || 10),
                                      unit: 'g'
                                    }))
                                  : [{ name: 'Fine Jewellery Creation', price: Number(order.total_amount), weight: 10, unit: 'g' }];
                                generateInvoice(user?.user_metadata?.full_name || 'Valued Patron', invoiceItems, Number(order.total_amount));
                                toast.success('Tax invoice PDF generated');
                              }}
                              className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)]"
                              title="Download Tax Invoice"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const receipt = convertOrderToReceipt(order, undefined, true);
                                setThermalReceiptData(receipt);
                                setIsThermalPrinterOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-[var(--gold-primary)]/40 bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] hover:bg-[var(--gold-primary)] hover:text-black transition-colors"
                              title="Print Thermal Order Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Curated Recommendations Row (Real Catalogue Items) */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[var(--text-main)]">
                      Curated For Your Trousseau
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">Handcrafted masterpieces matching your aesthetic</p>
                  </div>
                  <Link to="/jewellery" className="text-xs text-[var(--gold-primary)] font-bold hover:underline">
                    View Complete Catalogue →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recommendedProducts.map(product => (
                    <div
                      key={product.id}
                      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:border-[var(--gold-primary)]/40 transition-all flex flex-col group shadow-xs"
                    >
                      <div className="relative aspect-[3/4] bg-[var(--bg-elevated)] overflow-hidden">
                        <img
                          src={product.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors ${
                            wishlist.includes(product.id)
                              ? 'bg-rose-500 text-white'
                              : 'bg-black/40 text-white hover:bg-black/60'
                          }`}
                          aria-label="Toggle Wishlist"
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-[var(--gold-primary)] tracking-wider">
                            {product.category} • {product.purity}
                          </span>
                          <h4 className="font-serif text-xs font-semibold text-[var(--text-main)] line-clamp-1 mt-0.5">
                            {product.name}
                          </h4>
                          <p className="text-xs font-bold text-gold-gradient mt-1">
                            {formatCurrencyINR(product.price)}
                          </p>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <Link
                            to={`/product/${product.id}`}
                            className="flex-1 py-1.5 rounded-lg border border-[var(--border-color)] text-[11px] font-semibold text-center text-[var(--text-main)] hover:border-[var(--gold-primary)]"
                          >
                            Details
                          </Link>
                          <button
                            type="button"
                            onClick={() => addToCartWithAnimation(product.id, product.weight, null, product.image_url || undefined, product.name)}
                            className="flex-1 py-1.5 rounded-lg bg-[var(--gold-primary)] text-black text-[11px] font-bold uppercase tracking-wider hover:brightness-105"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MY ORDERS */}
          {/* ========================================================================= */}
          {currentTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                    My Acquisitions &amp; Orders
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Review order history, download official tax invoices, and track live dispatches
                  </p>
                </div>
                <Link
                  to="/jewellery"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Shop Fine Jewellery</span>
                </Link>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by Order #, Item Name, or AWB tracking..."
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(['all', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                        orderStatusFilter === st
                          ? 'bg-[#702638] text-white shadow-xs'
                          : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {st === 'all' ? 'All Orders' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Listing */}
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-3">
                  <Package className="w-12 h-12 text-[var(--gold-primary)]/40 mx-auto" />
                  <h3 className="font-serif text-sm font-bold text-[var(--text-main)]">
                    No matching orders found
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                    Try adjusting your search criteria or review our latest jewellery collections.
                  </p>
                  <button
                    onClick={() => { setOrderSearchQuery(''); setOrderStatusFilter('all'); }}
                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:border-[var(--gold-primary)]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div
                      key={order.id}
                      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 transition-all p-5 space-y-4 shadow-xs"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-[var(--text-main)]">
                              #{order.order_number || order.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Total Amount</span>
                          <span className="text-base font-serif font-bold text-gold-gradient">
                            {formatCurrencyINR(order.total_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items?.map((item: any, idx) => (
                          <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] overflow-hidden shrink-0">
                                <img
                                  src={item.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-serif font-semibold text-[var(--text-main)]">
                                  {item.product_name || 'Bespoke Fine Jewellery'}
                                </h4>
                                <p className="text-[11px] text-[var(--text-secondary)]">
                                  Purity: {item.purity || '22K (BIS 916)'} • Weight: {item.weight || 10}g
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-[var(--text-main)]">
                              {formatCurrencyINR(item.price || order.total_amount)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Logistics & Delivery Summary */}
                      <div className="bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Truck className="w-4 h-4 text-sky-500 shrink-0" />
                          <span>
                            {order.courier_partner || 'Sequel / BlueDart Armoured Courier'} • AWB: <strong className="font-mono text-[var(--text-main)]">{order.tracking_number || `BLUEDART-${order.id.slice(-6).toUpperCase()}`}</strong>
                          </span>
                        </div>
                        {order.shipping_address && (
                          <span className="text-[11px] text-[var(--text-secondary)] truncate">
                            Delivering to: {order.shipping_address.city} ({order.shipping_address.zipCode})
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForReturn(order)}
                          className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                        >
                          Exchange / Assistance
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const invoiceItems = (order.items && order.items.length > 0)
                              ? order.items.map((i: any) => ({
                                  name: i.product_name || 'Fine Jewellery Creation',
                                  price: Number(i.price || order.total_amount),
                                  weight: Number(i.weight || 10),
                                  unit: 'g'
                                }))
                              : [{ name: 'Fine Jewellery Creation', price: Number(order.total_amount), weight: 10, unit: 'g' }];
                            generateInvoice(order.customer_name || user?.user_metadata?.full_name || 'Valued Patron', invoiceItems, Number(order.total_amount));
                            toast.success('Tax invoice PDF generated');
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--gold-primary)] flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                          <span>Download Invoice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const receipt = convertOrderToReceipt(order, undefined, true);
                            setThermalReceiptData(receipt);
                            setIsThermalPrinterOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-[#C9A45C]/50 bg-[#351018] text-[#C9A45C] hover:brightness-110 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          title="Print tactile thermal order receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderForTracking(order)}
                          className="px-4 py-1.5 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 flex items-center gap-1.5 shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Consignment</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LIVE TRACKING */}
          {/* ========================================================================= */}
          {currentTab === 'track' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                    Live Tracking
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    100% Insured armoured delivery progression with Sequel Logistics &amp; BlueDart
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTab('orders')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                  <span>View All Orders</span>
                </button>
              </div>

              {/* Order Selection Card */}
              {orders.length > 0 ? (
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-primary)] block">
                        Tracking Consignment
                      </span>
                      <h3 className="font-serif font-bold text-lg text-[var(--text-main)]">
                        Order #{orders[0].order_number || orders[0].id}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {orders[0].items?.map(i => i.product_name).join(', ') || 'Fine Jewellery Piece'}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[var(--text-secondary)] uppercase block">Airway Bill (AWB)</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[var(--gold-primary)]">
                          {orders[0].tracking_number || `BLUEDART-${orders[0].id.slice(-6).toUpperCase()}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(orders[0].tracking_number || `BLUEDART-${orders[0].id.slice(-6).toUpperCase()}`);
                            toast.success('AWB copied to clipboard');
                          }}
                          className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--gold-primary)]"
                          title="Copy AWB"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 5-Stage Progression Timeline */}
                  {(() => {
                    const status = orders[0].status || 'processing';
                    const currentStage = status === 'delivered' ? 5 : status === 'shipped' ? 4 : 2;
                    const stages = [
                      { num: 1, label: 'Order Confirmed & Insured', desc: 'Secure order logged with vault reserves' },
                      { num: 2, label: 'Payment & Custody Assigned', desc: 'Complimentary 100% transit insurance cover activated' },
                      { num: 3, label: 'BIS 916 Hallmarking Inspected', desc: 'Government HUID & caratage laser-seal verified' },
                      { num: 4, label: 'Dispatched via Armoured Courier', desc: 'Handed to tamper-proof secure delivery agent' },
                      { num: 5, label: 'Delivered to Residence', desc: 'OTP verification & signed patron handover' },
                    ];

                    return (
                      <div className="space-y-4 relative py-2">
                        {stages.map((stage, idx) => {
                          const isCompleted = currentStage >= stage.num;
                          const isCurrent = currentStage === stage.num;
                          return (
                            <div key={stage.num} className="flex items-start gap-4 relative">
                              {idx < stages.length - 1 && (
                                <div 
                                  className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                                    currentStage > stage.num ? 'bg-[var(--gold-primary)]' : 'bg-[var(--border-color)]'
                                  }`}
                                  style={{ height: 'calc(100% + 8px)' }}
                                />
                              )}
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-colors ${
                                  isCompleted 
                                    ? 'bg-[var(--gold-primary)] text-black shadow-md' 
                                    : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                                }`}
                              >
                                {isCompleted ? <CheckCircle2 className="w-4 h-4 text-black" /> : stage.num}
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-xs font-semibold ${isCurrent ? 'text-[var(--gold-primary)] font-bold' : isCompleted ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)]'}`}>
                                    {stage.label}
                                  </h4>
                                  {isCompleted && (
                                    <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      {isCurrent ? 'In Progress' : 'Verified'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{stage.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Destination summary */}
                  {orders[0].shipping_address && (
                    <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-main)] block mb-1">Delivering To:</span>
                      <p>{orders[0].shipping_address.fullName} • {orders[0].shipping_address.street}, {orders[0].shipping_address.city} - {orders[0].shipping_address.zipCode}</p>
                      <p className="mt-0.5 font-mono text-[11px]">Contact: {orders[0].shipping_address.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-3">
                  <Truck className="w-12 h-12 text-[var(--gold-primary)]/40 mx-auto" />
                  <p className="text-xs text-[var(--text-secondary)]">No active shipments in transit.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MY WISHLIST */}
          {/* ========================================================================= */}
          {currentTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="flex justify-between items-baseline pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                    My Curated Wishlist ({wishlist.length})
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Your privately saved jewellery pieces and bridal trousseau selections
                  </p>
                </div>
                <Link to="/jewellery" className="text-xs text-[var(--gold-primary)] font-bold hover:underline">
                  + Add More Pieces
                </Link>
              </div>

              {wishlist.length === 0 ? (
                <div className="py-20 text-center bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[var(--text-main)]">
                      Your Private Curation is Empty
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 leading-relaxed">
                      Save bridal chokers, certified solitaire rings, and antique temple harams to review and compare at your leisure.
                    </p>
                  </div>
                  <Link
                    to="/jewellery"
                    className="inline-block px-6 py-2.5 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105 shadow-sm"
                  >
                    Explore Jewellery Boutique
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistProducts.map(product => (
                    <div
                      key={product.id}
                      className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:border-[var(--gold-primary)]/50 transition-all flex flex-col group shadow-xs"
                    >
                      <div className="relative aspect-[3/4] bg-[var(--bg-elevated)] overflow-hidden">
                        <img
                          src={product.image_url || '/images/bridal_vivaah_ruby_kundan.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-rose-500 hover:bg-black/80 transition-colors"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-[var(--gold-primary)] tracking-wider">
                            {product.category} • {product.purity}
                          </span>
                          <h4 className="font-serif text-sm font-semibold text-[var(--text-main)] line-clamp-1 mt-0.5">
                            {product.name}
                          </h4>
                          <p className="text-sm font-bold text-gold-gradient mt-1">
                            {formatCurrencyINR(product.price)}
                          </p>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <Link
                            to={`/product/${product.id}`}
                            className="flex-1 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-center text-[var(--text-main)] hover:border-[var(--gold-primary)]"
                          >
                            View Piece
                          </Link>
                          <button
                            type="button"
                            onClick={() => addToCartWithAnimation(product.id, product.weight, null, product.image_url || undefined, product.name)}
                            className="flex-1 py-2 rounded-xl bg-[var(--gold-primary)] text-black text-xs font-bold uppercase tracking-wider hover:brightness-105"
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: SAVED ADDRESSES */}
          {/* ========================================================================= */}
          {currentTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                    Saved Addresses
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Manage insured residential and private studio delivery destinations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    className={`bg-[var(--bg-card)] rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      addr.isDefault 
                        ? 'border-[var(--gold-primary)] shadow-sm' 
                        : 'border-[var(--border-color)] hover:border-[var(--gold-primary)]/40'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[10px] font-semibold uppercase text-[var(--text-secondary)] shrink-0">
                            {addr.label}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-[var(--text-main)] truncate" title={addr.fullName}>
                            {addr.fullName}
                          </h4>
                        </div>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--gold-primary)]/30 shrink-0">
                            <Check className="w-3 h-3" /> Default Address
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {addr.street}, {addr.city}, {addr.state} - <strong className="text-[var(--text-main)] font-mono">{addr.pincode}</strong>
                      </p>

                      <p className="text-xs text-[var(--text-secondary)] font-mono">
                        Contact: {addr.phone}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-color)] text-xs">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs text-[var(--gold-primary)] font-semibold hover:underline"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Primary Dispatch
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingAddress(addr); setIsAddressModalOpen(true); }}
                          className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                          title="Edit Address"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-rose-500"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PATRON PROFILE */}
          {/* ========================================================================= */}
          {currentTab === 'profile' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[var(--border-color)]">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                  Patron Profile &amp; KYC Records
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Update your contact credentials and verify government-issued identity documents
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Form */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-sm">
                  <form onSubmit={handleSaveProfile} noValidate className="space-y-4 text-xs">
                    
                    {/* Full Legal Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="profile-fullName" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          Full Legal Name <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-[var(--text-secondary)]">As per PAN / Aadhaar card</span>
                      </div>
                      <input
                        id="profile-fullName"
                        type="text"
                        required
                        value={profileForm.fullName}
                        onChange={e => handleProfileFieldChange('fullName', e.target.value)}
                        onBlur={() => handleProfileFieldBlur('fullName')}
                        placeholder="e.g. Rajeshwari Sundaram"
                        maxLength={50}
                        className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] transition-colors focus:outline-none ${
                          profileTouched.fullName && profileErrors.fullName
                            ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                            : profileTouched.fullName && !profileErrors.fullName
                            ? 'border-emerald-500/50 focus:border-emerald-500'
                            : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                        }`}
                      />
                      {profileTouched.fullName && profileErrors.fullName && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{profileErrors.fullName}</span>
                        </p>
                      )}
                    </div>

                    {/* Registered Email (Readonly Authentication ID) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          Registered Email Address (Auth ID)
                        </label>
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-medium">
                          <Lock className="w-3 h-3 text-[var(--gold-primary)]" /> Verified Auth
                        </span>
                      </div>
                      <input
                        type="email"
                        readOnly
                        value={user.email}
                        className="w-full bg-[var(--bg-elevated)]/50 border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-secondary)] cursor-not-allowed select-none"
                      />
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                        Tied to your 2FA cryptographic token. Contact private concierge to request an email migration.
                      </p>
                    </div>

                    {/* Primary Mobile Phone */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="profile-phone" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          Primary Mobile Phone (OTP &amp; Armoured Dispatch) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-[var(--text-secondary)]">10 digits Indian</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--gold-primary)] select-none">
                          +91
                        </span>
                        <input
                          id="profile-phone"
                          type="tel"
                          required
                          value={profileForm.phone}
                          onChange={e => handleProfileFieldChange('phone', e.target.value)}
                          onBlur={() => handleProfileFieldBlur('phone')}
                          placeholder="98401 23456"
                          maxLength={10}
                          className={`w-full bg-[var(--bg-elevated)] border rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-[var(--text-main)] font-mono transition-colors focus:outline-none ${
                            profileTouched.phone && profileErrors.phone
                              ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                              : profileTouched.phone && !profileErrors.phone
                              ? 'border-emerald-500/50 focus:border-emerald-500'
                              : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                          }`}
                        />
                      </div>
                      {profileTouched.phone && profileErrors.phone && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{profileErrors.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Date of Birth & Age Compliance */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="profile-dob" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          Date of Birth (KYC Verification) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-[var(--text-secondary)]">Min. 18 years for bullion</span>
                      </div>
                      <input
                        id="profile-dob"
                        type="date"
                        required
                        value={profileForm.dob}
                        max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                        onChange={e => handleProfileFieldChange('dob', e.target.value)}
                        onBlur={() => handleProfileFieldBlur('dob')}
                        className={`w-full bg-[var(--bg-elevated)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] transition-colors focus:outline-none ${
                          profileTouched.dob && profileErrors.dob
                            ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                            : profileTouched.dob && !profileErrors.dob
                            ? 'border-emerald-500/50 focus:border-emerald-500'
                            : 'border-[var(--border-color)] focus:border-[var(--gold-primary)]'
                        }`}
                      />
                      {profileTouched.dob && profileErrors.dob && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{profileErrors.dob}</span>
                        </p>
                      )}
                    </div>

                    {/* Gender & Language Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="profile-gender" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                          Gender
                        </label>
                        <select
                          id="profile-gender"
                          value={profileForm.gender}
                          onChange={e => setProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                        >
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="other">Prefer not to say</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="profile-lang" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                          Preferred Language
                        </label>
                        <select
                          id="profile-lang"
                          value={profileForm.preferredLanguage}
                          onChange={e => setProfileForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                        >
                          <option value="Tamil">Tamil (தமிழ்)</option>
                          <option value="English">English</option>
                          <option value="Telugu">Telugu (తెలుగు)</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons: Discard & Save */}
                    <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleResetProfile}
                        disabled={!isProfileDirty || isSavingProfile}
                        className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--gold-primary)] text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Discard Changes</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* KYC & Identity Status Card */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-serif font-bold text-sm text-[var(--text-main)]">
                      KYC Verification Status
                    </h3>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified Patron (Tier 1 Certified)</span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      Eligible for high-value bullion acquisitions exceeding ₹2,00,000 with PAN compliance.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                      <span>PAN Record:</span>
                      <span className="font-mono font-bold text-[var(--text-main)]">ABCDE****F</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--border-color)]">
                      <span>Aadhaar Masked:</span>
                      <span className="font-mono font-bold text-[var(--text-main)]">**** **** 9012</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Verified By:</span>
                      <span className="font-medium text-[var(--text-main)]">YAZHINI Compliance</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: AURA GOLD VAULT */}
          {/* ========================================================================= */}
          {currentTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                    Aura Gold™ 24K Digital Vault
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    100% Insured physical 24K 999.9 bullion vaulted with Sequel &amp; Brink's Global Vaults
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    to="/auragold"
                    className="h-10 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#C5A059] text-stone-950 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs hover:shadow transition-all"
                  >
                    + Buy 24K Bullion
                  </Link>
                  <Link
                    to="/auragold?tab=SELL"
                    className="h-10 px-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--gold-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--gold-primary)]/10 text-[var(--text-main)] hover:text-[var(--gold-primary)] text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
                  >
                    Liquidate / Cash Out
                  </Link>
                </div>
              </div>

              {/* Vault Spotlight Card */}
              <div className="bg-gradient-to-r from-[#4A1521] via-[#702638] to-[#2B0B13] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#D4AF37]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FAF7F2] text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Allocated Physical Bullion • 100% Insured</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                    {goldVault ? `${goldVault.gold_balance_grams.toFixed(4)} grams` : '0.0000 grams'}
                  </h2>
                  <p className="text-xs text-[#E8D5D0] mt-1.5">
                    Current Valuation: <strong className="text-white text-base font-serif">₹{vaultMarketValue.toLocaleString('en-IN')}</strong>
                    {goldVault && <span className="ml-3 font-mono text-[11px] text-[#E8D5D0]/80">• Acc: {goldVault.account_number}</span>}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/auragold"
                    className="h-10 px-5 rounded-xl bg-[#D4AF37] text-stone-950 text-xs font-bold uppercase tracking-wider hover:bg-[#C5A059] transition-all shadow-md inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    + Buy 24K Gold
                  </Link>
                  <Link
                    to="/auragold?tab=REDEEM"
                    className="h-10 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider border border-white/20 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    Redeem Coins
                  </Link>
                </div>
              </div>

              {/* Transaction Ledger Table */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                  <h3 className="font-serif font-bold text-base text-[var(--text-main)] flex items-center gap-2">
                    <History className="w-4 h-4 text-[var(--gold-primary)]" />
                    Digital Gold Vault Ledger
                  </h3>
                  <span className="text-xs text-[var(--text-secondary)]">Last 10 transactions</span>
                </div>

                {goldVault && goldVault.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] uppercase text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Weight</th>
                          <th className="py-2.5 px-3">Total Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {goldVault.transactions.map((t: any) => (
                          <tr key={t.id} className="hover:bg-[var(--bg-elevated)]/50">
                            <td className="py-3 px-3 text-[var(--text-secondary)]">{new Date(t.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-3 font-mono font-medium">{t.transaction_reference}</td>
                            <td className="py-3 px-3 font-semibold text-[#D4AF37]">{t.type}</td>
                            <td className="py-3 px-3 font-mono">{Number(t.grams).toFixed(4)}g</td>
                            <td className="py-3 px-3 font-serif font-bold text-gold-gradient">{formatCurrencyINR(Number(t.total_amount))}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                    No transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: COLLATERAL LOANS (PAWN) */}
          {/* ========================================================================= */}
          {currentTab === 'loans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                    Active Gold Loans &amp; Collateral
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Manage your pledged jewellery and repay monthly interest securely online
                  </p>
                </div>
                <Link
                  to="/pawn"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-xs"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Pawn Loan Calculator</span>
                </Link>
              </div>

              {activeLoans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeLoans.map(loan => {
                    const totalPaid = loan.part_payments?.reduce((s, p) => s + (Number(p.payment_amount) || 0), 0) || 0;
                    const balance = Math.max(0, Number(loan.loan_amount) - totalPaid);
                    const isClosed = loan.status === 'closed' || balance === 0;

                    return (
                      <div key={loan.id} className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-4 shadow-xs">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">{loan.pledge_number}</span>
                              <p className="text-xs text-[var(--text-secondary)]">{new Date(loan.pledge_date).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getStatusColor(loan.status)}`}>
                              {loan.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                            <div>
                              <p className="text-[10px] text-[var(--text-secondary)]">Principal Loan</p>
                              <p className="font-semibold text-[var(--text-main)]">₹{loan.loan_amount.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[var(--text-secondary)]">Collateral Weight</p>
                              <p className="font-semibold text-[var(--text-main)]">{loan.total_weight_grams} g</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[var(--text-secondary)]">Interest Scheme</p>
                              <p className="font-semibold text-[var(--text-main)]">{loan.interest_rate}% {loan.interest_type}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[var(--text-secondary)]">Current Balance</p>
                              <p className="font-bold text-gold-gradient">₹{balance.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>

                        {!isClosed && (
                          <button
                            type="button"
                            onClick={() => handleOpenRepayment(loan)}
                            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-highlight)] text-black text-xs font-semibold uppercase py-2.5 rounded-xl hover:brightness-105 transition-all shadow-xs cursor-pointer"
                          >
                            <CreditCard className="h-3.5 h-3.5" /> Pay Interest Online
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-3">
                  <Scale className="w-12 h-12 text-[var(--gold-primary)]/40 mx-auto" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    No active collateral loans on file. Visit our showroom or apply online for immediate appraisal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: MY GIFT CARDS */}
          {/* ========================================================================= */}
          {currentTab === 'giftcards' && (
            <CustomerGiftCardsTab />
          )}

          {/* ========================================================================= */}
          {/* TAB 9: TRANSACTIONS LEDGER */}
          {/* ========================================================================= */}
          {currentTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                    Unified Transactions Ledger
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Complete consolidated ledger across jewellery acquisitions, digital gold, and loan repayments
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Consolidated tax statement download initiated')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:border-[var(--gold-primary)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Annual Statement</span>
                </button>
              </div>

              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px]">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-4">Particulars</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {/* Retail Orders */}
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-[var(--bg-elevated)]/50">
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium">
                            #{order.order_number || order.id}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[var(--gold-primary)]">
                            Fine Jewellery
                          </td>
                          <td className="py-3.5 px-4 line-clamp-1">
                            {order.items?.map(i => i.product_name).join(', ') || 'Retail Acquisition'}
                          </td>
                          <td className="py-3.5 px-4 font-serif font-bold text-gold-gradient">
                            {formatCurrencyINR(order.total_amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Digital Gold Transactions */}
                      {goldVault?.transactions.map(t => (
                        <tr key={t.id} className="hover:bg-[var(--bg-elevated)]/50">
                          <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium">
                            {t.transaction_reference}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#D4AF37]">
                            Aura Gold™
                          </td>
                          <td className="py-3.5 px-4">
                            {t.type} 24K Bullion ({Number(t.grams).toFixed(4)}g)
                          </td>
                          <td className="py-3.5 px-4 font-serif font-bold text-gold-gradient">
                            {formatCurrencyINR(Number(t.total_amount))}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(t.status)}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* ========================================================================= */}
          {/* TAB 11: PATRON CONCIERGE & SUPPORT */}
          {/* ========================================================================= */}
          {currentTab === 'support' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[var(--border-color)]">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                  Patron Concierge Suite
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Private jewellery consultations, showroom previews, and dedicated bridal concierge
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Book VIP Showroom Appointment */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-color)]">
                    <Calendar className="w-5 h-5 text-[var(--gold-primary)]" />
                    <div>
                      <h3 className="font-serif font-bold text-sm text-[var(--text-main)]">
                        Book Private Showroom Preview
                      </h3>
                      <p className="text-[11px] text-[var(--text-secondary)]">Dedicated VIP Suite with your Senior Patron Advisor</p>
                    </div>
                  </div>

                  <form onSubmit={handleBookAppointment} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={appointmentData.date}
                        onChange={e => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                        Select Showroom
                      </label>
                      <select
                        value={appointmentData.showroom}
                        onChange={e => setAppointmentData(prev => ({ ...prev, showroom: e.target.value }))}
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      >
                        <option value="Cathedral Road Flagship, Chennai">Cathedral Road Flagship, Chennai</option>
                        <option value="Cross Cut Road, Coimbatore">Cross Cut Road, Coimbatore</option>
                        <option value="West Masi Street, Madurai">West Masi Street, Madurai</option>
                        <option value="Jayanagar 4th Block, Bengaluru">Jayanagar 4th Block, Bengaluru</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                        Collection of Interest
                      </label>
                      <select
                        value={appointmentData.category}
                        onChange={e => setAppointmentData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      >
                        <option value="Bridal & Heritage Jewellery">Bridal &amp; Sacred Muhurtham Trousseau</option>
                        <option value="Certified Solitaire Diamonds">Certified Solitaire Diamonds (GIA / IGI)</option>
                        <option value="Antique Temple Kasu Jewellery">Antique Temple &amp; Nakshi Work</option>
                        <option value="Old Gold Exchange & Valuation">Old Gold Exchange &amp; Caratage Valuation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                        Specific Requests
                      </label>
                      <textarea
                        rows={2}
                        value={appointmentData.notes}
                        onChange={e => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="E.g. Request specific diamond caratage, private parking, or Tamil-speaking bridal specialist..."
                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#702638] to-[#450817] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-md"
                    >
                      Confirm Private Appointment
                    </button>
                  </form>
                </div>

                {/* Direct Concierge Contact Channels */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#4A1521] via-[#702638] to-[#2B0B13] rounded-2xl p-6 text-white shadow-md border border-[#D4AF37]/30 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-base text-white">Mr. S. Natarajan</h4>
                        <p className="text-xs text-[#E8D5D0]">Senior Patron Concierge Advisor</p>
                      </div>
                    </div>

                    <p className="text-xs text-[#E8D5D0] leading-relaxed">
                      Available 7 days a week from 09:30 AM to 08:30 PM IST for high-carat diamond consultation, custom jewel CAD renderings, and safe vault transfers.
                    </p>

                    <div className="space-y-2.5 pt-2">
                      <a
                        href="https://wa.me/919840123456?text=Hello%20YAZHINI%20Concierge"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat via WhatsApp (+91 98401 23456)</span>
                      </a>

                      <a
                        href="tel:+919840123456"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
                      >
                        <Phone className="w-4 h-4 text-[#D4AF37]" />
                        <span>Direct Telephone Helpline</span>
                      </a>
                    </div>
                  </div>

                  {/* Patron Guarantee Accordion / Info */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 text-xs">
                    <span className="font-serif font-bold text-xs text-[var(--text-main)] block mb-1">
                      YAZHINI Patron Guarantees
                    </span>
                    <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>100% BIS Hallmarked (916) with unique laser HUID serial certificate.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Complimentary lifetime cleaning, re-stringing, and repair at all boutiques.</span>
                    </div>
                    <div className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Lifetime gold buyback and exchange guarantee based on live benchmark rates.</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 12: SECURITY & SETTINGS */}
          {/* ========================================================================= */}
          {currentTab === 'settings' && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-[var(--border-color)]">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                  Security &amp; Account Settings
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Password management, notification preferences, and active portal sessions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Security Card */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[var(--gold-primary)]" />
                    <h3 className="font-serif font-bold text-sm text-[var(--text-main)]">
                      Authentication &amp; Password
                    </h3>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Protect your account credentials. You can dispatch a secure password reset link to your registered email (<strong className="text-[var(--text-main)]">{user.email}</strong>).
                  </p>

                  <button
                    type="button"
                    onClick={handleRequestPasswordReset}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-xs font-semibold text-[var(--text-main)] transition-colors"
                  >
                    Send Password Reset Link
                  </button>
                </div>

                {/* Session Sign Out Card */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 space-y-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[var(--text-main)] mb-1">
                      Active Portal Session
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Signed in as <strong className="text-[var(--text-main)]">{user.email}</strong>. Terminate your active patron session securely across this browser.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Sign Out of Patron Portal
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>

        {/* Right Concierge & Live Pulse Panel (Desktop, 320px) */}
        {(currentTab === 'overview' || currentTab === 'orders' || currentTab === 'vault' || currentTab === 'track' || currentTab === 'addresses') && (
          <aside className="hidden xl:block w-[320px] shrink-0 p-6 border-l border-[var(--border-color)] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <CustomerAccountRightPanel
              latestOrder={orders[0] || null}
              onTrackOrder={order => setSelectedOrderForTracking(order)}
              onOpenSupport={() => handleSelectTab('support')}
              onOpenVault={() => handleSelectTab('vault')}
            />
          </aside>
        )}

      </div>

      {/* 3. Address Management Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => { setIsAddressModalOpen(false); setEditingAddress(null); }}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />

      {/* 4. Return / Exchange Request Modal */}
      <ReturnExchangeModal
        isOpen={Boolean(selectedOrderForReturn)}
        onClose={() => setSelectedOrderForReturn(null)}
        order={selectedOrderForReturn}
        onSubmit={() => setSelectedOrderForReturn(null)}
      />

      {/* 5. Repayment Modal (Razorpay) */}
      {isPaymentModalOpen && selectedLoanForRepayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border-color)] relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-[var(--gold-primary)]" />
              <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">Pawn Loan Repayment</h3>
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-color)] mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Pledge Ticket:</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{selectedLoanForRepayment.pledge_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Principal Amount:</span>
                <span className="price-total text-[var(--text-main)]">{formatCurrencyINR(selectedLoanForRepayment.loan_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Interest Rate:</span>
                <span className="font-semibold text-[var(--text-main)]">{selectedLoanForRepayment.interest_rate}% {selectedLoanForRepayment.interest_type}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Repayment Amount (₹)
              </label>
              <input
                type="number"
                min="100"
                value={repayAmount}
                onChange={(e) => setRepayAmount(Number(e.target.value))}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-base font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>

            <PaymentGateway
              amount={repayAmount}
              customerInfo={{
                email: user?.email || undefined,
                name: user?.user_metadata?.full_name || 'Customer'
              }}
              onSuccess={handlePaymentSuccess}
              onError={(err: string) => toast.error(`Repayment failed: ${err}`)}
            />
          </div>
        </div>
      )}

      {/* 6. Live Shipment Tracking Modal */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[var(--border-color)] relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedOrderForTracking(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-color)] pb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/30 flex items-center justify-center text-[var(--gold-primary)]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">Live Consignment Tracking</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Order #{selectedOrderForTracking.order_number || selectedOrderForTracking.id} • Placed on {new Date(selectedOrderForTracking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Courier & AWB Bar */}
            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-color)] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] block">Insured Logistics Partner</span>
                <span className="font-semibold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {selectedOrderForTracking.courier_partner || 'Sequel Logistics / BlueDart Insured Express'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] block">AWB / Airway Bill No.</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--gold-primary)]">
                    {selectedOrderForTracking.tracking_number || `BLUEDART-${selectedOrderForTracking.id.slice(-6).toUpperCase()}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const awb = selectedOrderForTracking.tracking_number || `BLUEDART-${selectedOrderForTracking.id.slice(-6).toUpperCase()}`;
                      navigator.clipboard?.writeText(awb);
                      toast.success('AWB copied to clipboard');
                    }}
                    title="Copy AWB Tracking Number"
                    className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--gold-primary)]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5-Stage Timeline */}
            {(() => {
              const status = selectedOrderForTracking.status || 'processing';
              const currentStage = status === 'delivered' ? 5 : status === 'shipped' ? 4 : 2;
              const stages = [
                { num: 1, label: 'Order Placed', desc: 'Secure order confirmed & logged with bullion vault' },
                { num: 2, label: 'Payment Verified & Insured', desc: 'Complimentary 100% transit insurance cover activated' },
                { num: 3, label: 'BIS Hallmarking Inspected', desc: 'Government HUID & caratage laser-seal verified' },
                { num: 4, label: 'Dispatched via Armoured Courier', desc: 'Handed to tamper-proof secure delivery agent' },
                { num: 5, label: 'Delivered to Residence', desc: 'OTP verification & signed patron handover' },
              ];

              return (
                <div className="space-y-4 mb-6 relative">
                  {stages.map((stage, idx) => {
                    const isCompleted = currentStage >= stage.num;
                    const isCurrent = currentStage === stage.num;
                    return (
                      <div key={stage.num} className="flex items-start gap-4 relative">
                        {idx < stages.length - 1 && (
                          <div 
                            className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                              currentStage > stage.num ? 'bg-[var(--gold-primary)]' : 'bg-[var(--border-color)]'
                            }`}
                            style={{ height: 'calc(100% + 4px)' }}
                          />
                        )}
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-colors ${
                            isCompleted 
                              ? 'bg-[var(--gold-primary)] text-black shadow-md' 
                              : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4 text-black" /> : stage.num}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-semibold ${isCurrent ? 'text-[var(--gold-primary)] font-bold' : isCompleted ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)]'}`}>
                              {stage.label}
                            </h4>
                            {isCompleted && (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {isCurrent ? 'In Transit' : 'Completed'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Destination summary */}
            {selectedOrderForTracking.shipping_address && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-main)] block mb-1">Delivering To:</span>
                <p>{selectedOrderForTracking.shipping_address.fullName} • {selectedOrderForTracking.shipping_address.street}, {selectedOrderForTracking.shipping_address.city} - {selectedOrderForTracking.shipping_address.zipCode}</p>
                <p className="mt-0.5 font-mono text-[11px]">Contact: {selectedOrderForTracking.shipping_address.phone}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderForTracking(null)}
                className="px-5 py-2 rounded-xl bg-[var(--gold-primary)] text-black font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TACTILE THERMAL RECEIPT PRINTER MODAL */}
      <ReceiptPrinterModal
        isOpen={isThermalPrinterOpen}
        onClose={() => setIsThermalPrinterOpen(false)}
        receiptData={thermalReceiptData}
        isReprint={true}
      />

    </div>
  );
}
