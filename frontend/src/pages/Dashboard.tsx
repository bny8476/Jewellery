import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '../utils/motion';
import { supabase } from '../lib/supabase';
import { 
  User as UserIcon, 
  CreditCard, 
  X, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Copy 
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
import { useNotifications } from '../context/NotificationContext';
import { localJewelryItems } from '../utils/localData';
import { validatePhone } from '../utils/validation';

// Specialized Dashboard sub-components
import { CustomerAccountHeader } from '../components/dashboard/CustomerAccountHeader';
import { CustomerAccountSidebar } from '../components/dashboard/CustomerAccountSidebar';
import { CustomerAccountRightPanel } from '../components/dashboard/CustomerAccountRightPanel';
import { AddressModal, SavedAddress } from '../components/dashboard/AddressModal';
import { ReturnExchangeModal } from '../components/dashboard/ReturnExchangeModal';
import { addressService } from '../services/addressService';
import { ReceiptPrinterModal } from '../components/ui/ReceiptPrinterModal';
import { type ThermalReceiptData, convertOrderToReceipt } from '../utils/thermalReceiptUtils';
import { TabLoadingSkeleton } from '../components/dashboard/TabLoadingSkeleton';

// Primary landing tab loaded immediately for instantaneous first paint
import { CustomerOverviewTab } from '../components/dashboard/tabs/CustomerOverviewTab';

// Dynamic code-split tabs loaded on-demand via React.lazy
const CustomerOrdersTab = lazy(() => import('../components/dashboard/tabs/CustomerOrdersTab'));
const CustomerTrackingTab = lazy(() => import('../components/dashboard/tabs/CustomerTrackingTab'));
const CustomerWishlistTab = lazy(() => import('../components/dashboard/tabs/CustomerWishlistTab'));
const CustomerAddressesTab = lazy(() => import('../components/dashboard/tabs/CustomerAddressesTab'));
const CustomerProfileTab = lazy(() => import('../components/dashboard/tabs/CustomerProfileTab'));
const CustomerVaultTab = lazy(() => import('../components/dashboard/tabs/CustomerVaultTab'));
const CustomerLoansTab = lazy(() => import('../components/dashboard/tabs/CustomerLoansTab'));
const CustomerGiftCardsTab = lazy(() => import('../components/dashboard/CustomerGiftCardsTab'));
const CustomerLedgerTab = lazy(() => import('../components/dashboard/tabs/CustomerLedgerTab'));
const CustomerConciergeTab = lazy(() => import('../components/dashboard/tabs/CustomerConciergeTab'));
const CustomerSecurityTab = lazy(() => import('../components/dashboard/tabs/CustomerSecurityTab'));

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

  const {
    notifications: liveNotifications,
    unreadCount: liveUnreadCount,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead
  } = useNotifications();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setPawns] = useState<PawnRequest[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [goldVault, setGoldVault] = useState<DigitalGoldVaultData | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('rcb-customer-sidebar-collapsed') === 'true';
      }
    } catch {}
    return false;
  });

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('rcb-customer-sidebar-collapsed', String(next));
        }
      } catch {}
      return next;
    });
  }, []);

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
    dob: '',
    gender: 'female',
    preferredLanguage: 'English',
    photoUrl: ''
  };
  const [profileForm, setProfileForm] = useState(initialProfileState);
  const [initialProfileData, setInitialProfileData] = useState(initialProfileState);
  const [customerProfile, setCustomerProfile] = useState<{
    id: string;
    fullName: string;
    gender: string;
    photoUrl: string;
    loyaltyTier: string;
    phone: string;
    email: string;
  }>({
    id: '',
    fullName: '',
    gender: 'female',
    photoUrl: '',
    loyaltyTier: 'Valued Member',
    phone: '',
    email: ''
  });
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

  const displayNotifications = useMemo(() => {
    if (liveNotifications && liveNotifications.length > 0) {
      return liveNotifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        category: (n.category === 'pawn' ? 'concierge' : n.category) as any,
        timestamp: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        isRead: n.is_read
      }));
    }
    return notifications;
  }, [liveNotifications, notifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    await contextMarkAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  }, [contextMarkAllAsRead]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    await contextMarkAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, [contextMarkAsRead]);

  // Real-time Customer Profile synchronization across components & database
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.fullName) {
        const { fullName, gender, photoUrl, phone, loyaltyTier } = e.detail;
        setCustomerProfile(prev => ({
          ...prev,
          fullName: fullName || prev.fullName,
          gender: gender || prev.gender,
          photoUrl: photoUrl !== undefined ? photoUrl : prev.photoUrl,
          phone: phone || prev.phone,
          loyaltyTier: loyaltyTier || prev.loyaltyTier
        }));
        setUser(prev => prev ? ({
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            full_name: fullName || prev.user_metadata?.full_name,
            gender: gender || prev.user_metadata?.gender,
            photo_url: photoUrl !== undefined ? photoUrl : prev.user_metadata?.photo_url
          }
        }) : null);
      }
    };

    window.addEventListener('yazhini:customer-profile-updated', handleProfileUpdate);

    // Supabase realtime channel for customers table
    const channel = supabase
      .channel('public:customers_realtime_profile')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload: any) => {
          if (payload.new && (payload.new.user_id === user?.id || payload.new.email === user?.email)) {
            const updated = payload.new;
            setCustomerProfile(prev => ({
              ...prev,
              fullName: updated.full_name || prev.fullName,
              gender: updated.gender || prev.gender,
              photoUrl: updated.photo_url || prev.photoUrl,
              phone: updated.phone || prev.phone,
              loyaltyTier: updated.loyalty_tier || prev.loyaltyTier
            }));
            setUser(prev => prev ? ({
              ...prev,
              user_metadata: {
                ...prev.user_metadata,
                full_name: updated.full_name || prev.user_metadata?.full_name,
                gender: updated.gender || prev.user_metadata?.gender,
                photo_url: updated.photo_url || prev.user_metadata?.photo_url
              }
            }) : null);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('yazhini:customer-profile-updated', handleProfileUpdate);
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email]);

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
        // Query customer record dynamically from database
        let customerRecord: any = null;
        try {
          const { data } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          customerRecord = data;

          if (!customerRecord && user.email) {
            const { data: emailCust } = await supabase
              .from('customers')
              .select('*')
              .eq('email', user.email)
              .maybeSingle();
            customerRecord = emailCust;
          }
        } catch (err) {
          console.warn('[Dashboard] Error querying customers table:', err);
        }

        const rawName = customerRecord?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Valued Patron';
        const realFullName = rawName.replace(/\s*\((?:Royal Patron|Patron)\)\s*/gi, '').replace(/\s*Royal Patron\s*/gi, '').trim() || 'Valued Patron';
        const realGender = customerRecord?.gender || user.user_metadata?.gender || 'female';
        const realPhoto = customerRecord?.photo_url || user.user_metadata?.photo_url || user.user_metadata?.avatar_url || (realGender === 'male' ? '/images/male_patron_avatar.jpg' : '/images/female_patron_avatar.jpg');
        const rawTier = customerRecord?.loyalty_tier || user.user_metadata?.loyalty_tier;
        const realTier = (rawTier && rawTier !== 'Royal Patron') ? rawTier : 'Valued Member';

        const profileData = {
          fullName: realFullName,
          phone: customerRecord?.phone || user.phone || user.user_metadata?.phone || '',
          dob: customerRecord?.date_of_birth || user.user_metadata?.dob || '',
          gender: realGender,
          preferredLanguage: customerRecord?.preferred_language || user.user_metadata?.preferred_language || 'English',
          photoUrl: realPhoto
        };

        setProfileForm(profileData);
        setInitialProfileData(profileData);
        setCustomerProfile({
          id: customerRecord?.id || user.id,
          fullName: realFullName,
          gender: realGender,
          photoUrl: realPhoto,
          loyaltyTier: realTier,
          phone: profileData.phone,
          email: customerRecord?.email || user.email || ''
        });

        setUser(prev => prev ? ({
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            full_name: realFullName,
            gender: realGender,
            photo_url: realPhoto,
            loyalty_tier: realTier
          }
        }) : null);

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
            setOrders([]);
          }
        } catch (err) {
          console.warn('[Dashboard] Error fetching orders:', err);
          setOrders([]);
        }

        // 2. Fetch Pawn Applications & Loans
        try {
          const { data: pawnData } = await supabase
            .from('pawn_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (pawnData) setPawns(pawnData);

          if (customerRecord) {
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

          if (dgAccount) {
            const balance = Number(dgAccount.gold_balance_grams || 0);
            const estRate = rates.gold || 14928.00;
            setGoldVault({
              account_number: dgAccount.account_number,
              gold_balance_grams: balance,
              reserved_grams: Number(dgAccount.reserved_grams || 0),
              market_value: Math.round(balance * estRate * 100) / 100,
              transactions: dgTxns || []
            });
          } else {
            setGoldVault(null);
          }
        } catch (dgErr) {
          console.warn('[Dashboard] Error fetching digital gold account:', dgErr);
          setGoldVault(null);
        }

        // 4. Load Saved Addresses with multi-tier persistence (Cloud -> DB -> Cache)
        const loadedAddresses = await addressService.getAddresses(user.id);
        setAddresses(loadedAddresses);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // Save address handler with multi-tier sync
  const handleSaveAddress = async (address: SavedAddress) => {
    if (!user) return;
    try {
      const updated = await addressService.saveAddress(user.id, address, addresses);
      setAddresses(updated);
      toast.success(address.id && addresses.some(a => a.id === address.id) ? 'Address details updated' : 'New delivery address added');
    } catch (err) {
      console.warn('Failed to persist address:', err);
    }
  };

  // Delete address handler with multi-tier sync
  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    try {
      const updated = await addressService.deleteAddress(user.id, id, addresses);
      setAddresses(updated);
      toast.info('Address removed from address book');
    } catch (err) {
      console.warn('Failed to delete address:', err);
    }
  };

  // Set default address with multi-tier sync
  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    try {
      const updated = await addressService.setDefaultAddress(user.id, id, addresses);
      setAddresses(updated);
      toast.success('Default delivery address updated');
    } catch (err) {
      console.warn('Failed to update default address:', err);
    }
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
            preferred_language: profileForm.preferredLanguage,
            photo_url: profileForm.photoUrl
          }
        });
        await supabase
          .from('customers')
          .update({
            full_name: profileForm.fullName.trim(),
            phone: profileForm.phone.trim(),
            gender: profileForm.gender,
            photo_url: profileForm.photoUrl,
            date_of_birth: profileForm.dob || null
          })
          .or(`user_id.eq.${user.id},email.eq.${user.email || ''}`);

        const updatedProfile = {
          fullName: profileForm.fullName.trim(),
          gender: profileForm.gender,
          photoUrl: profileForm.photoUrl || (profileForm.gender === 'male' ? '/images/male_patron_avatar.jpg' : '/images/female_patron_avatar.jpg'),
          phone: profileForm.phone.trim(),
          loyaltyTier: (customerProfile.loyaltyTier && customerProfile.loyaltyTier !== 'Royal Patron') ? customerProfile.loyaltyTier : 'Valued Member'
        };

        setCustomerProfile(prev => ({
          ...prev,
          ...updatedProfile
        }));

        setUser(prev => prev ? ({
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            ...updatedProfile
          }
        }) : null);

        // Broadcast real-time customer profile update
        window.dispatchEvent(new CustomEvent('yazhini:customer-profile-updated', {
          detail: updatedProfile
        }));
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

  // Consignment Tracking navigation
  const handleTrackOrder = (order: any) => {
    setSelectedOrderForTracking(order);
    handleSelectTab('track');
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
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'shipped': case 'processing': case 'partially_paid':
        return 'text-[#25282D] bg-[#F3F4F6] border-[#E5E7EB] font-semibold';
      case 'pending': case 'active': case 'open': case 'PENDING':
        return 'text-[#25282D] bg-[#FAF3E8] border-[#C9A45C]/40 font-semibold';
      case 'rejected': case 'cancelled': case 'FAILED':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-[#8792A2] bg-[#F3F4F6] border-[#E5E7EB]';
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="customer-portal-root font-sans min-h-screen bg-[#F3F4F6] dark:bg-[#0B0C0E] flex items-center justify-center transition-colors duration-200">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#25282D] dark:border-[#D8B878] border-t-transparent animate-spin mx-auto" />
          <p className="font-inter text-sm tracking-wider text-[#25282D] dark:text-[#F7F8FA]">
            Accessing Customer Portal...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated Patron Screen
  if (!user) {
    return (
      <div className="customer-portal-root font-sans min-h-screen bg-[#F3F4F6] text-[#343A40] dark:bg-[#0B0C0E] dark:text-[#D2D7E2] flex items-center justify-center p-4 transition-colors duration-200">
        <div className="bg-white dark:bg-[#13151A] p-8 sm:p-10 rounded-xl shadow-xl border border-[#E5E7EB] dark:border-[#222733] max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-lg bg-[#25282D] dark:bg-[#181B22] border border-[#25282D] dark:border-[#D8B878]/30 flex items-center justify-center mx-auto shadow-xs">
            <UserIcon className="h-7 w-7 text-[#D8B878]" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#8792A2] dark:text-[#8D96A5] font-semibold block mb-1">
              Customer Portal
            </span>
            <h2 className="text-2xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-[#8792A2] dark:text-[#8D96A5] mt-2 leading-relaxed">
              Please authenticate to review your fine jewellery orders, live delivery tracking, insured gold savings vault, and account profile.
            </p>
          </div>
          <Link
            to="/login"
            className="block w-full bg-[#25282D] hover:bg-black dark:bg-[#171A22] dark:hover:bg-[#222733] dark:border dark:border-[#D8B878]/40 text-white py-3 rounded-lg font-semibold tracking-wider text-xs transition-colors shadow-xs"
          >
            Sign In with Email
          </Link>
          <div className="pt-2">
            <Link to="/" className="text-xs text-[#8792A2] hover:text-[#25282D] dark:text-[#8D96A5] dark:hover:text-[#F7F8FA] transition-colors">
              Return to Boutique Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-portal-root font-sans min-h-screen bg-[#F3F4F6] text-[#343A40] dark:bg-[#0B0C0E] dark:text-[#D2D7E2] flex flex-col transition-colors duration-200">
      
      {/* 1. Dedicated Compact Customer Account Header */}
      <CustomerAccountHeader
        user={user}
        customerName={customerProfile.fullName || profileForm.fullName || user?.user_metadata?.full_name}
        customerGender={customerProfile.gender || profileForm.gender || user?.user_metadata?.gender}
        customerPhotoUrl={customerProfile.photoUrl || profileForm.photoUrl || user?.user_metadata?.photo_url}
        customerTier={customerProfile.loyaltyTier || user?.user_metadata?.loyalty_tier}
        activeTabTitle={activeTabTitle}
        onSelectTab={handleSelectTab}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onSignOut={handleSignOut}
        unreadCount={liveUnreadCount !== undefined ? liveUnreadCount : displayNotifications.filter(n => !n.isRead).length}
        notifications={displayNotifications}
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
          customerName={customerProfile.fullName || profileForm.fullName || user?.user_metadata?.full_name}
          customerGender={customerProfile.gender || profileForm.gender || user?.user_metadata?.gender}
          customerPhotoUrl={customerProfile.photoUrl || profileForm.photoUrl || user?.user_metadata?.photo_url}
          customerTier={customerProfile.loyaltyTier || user?.user_metadata?.loyalty_tier}
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
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >

          {/* TAB 1: OVERVIEW (Immediate Render) */}
          {currentTab === 'overview' && (
            <CustomerOverviewTab
              user={user}
              customerName={customerProfile.fullName || profileForm.fullName || user?.user_metadata?.full_name}
              customerGender={customerProfile.gender || profileForm.gender || user?.user_metadata?.gender}
              customerPhotoUrl={customerProfile.photoUrl || profileForm.photoUrl || user?.user_metadata?.photo_url}
              customerTier={customerProfile.loyaltyTier || user?.user_metadata?.loyalty_tier}
              orders={orders}
              activeOrdersCount={activeOrdersCount}
              wishlist={wishlist}
              goldVault={goldVault}
              vaultMarketValue={vaultMarketValue}
              activeLoans={activeLoans}
              recommendedProducts={recommendedProducts}
              onSelectTab={handleSelectTab}
              onTrackOrder={handleTrackOrder}
              onDownloadTaxInvoice={order => {
                const invoiceItems = (order.items && order.items.length > 0)
                  ? order.items.map((i: any) => ({
                      name: i.product_name || 'Fine Jewellery Creation',
                      price: Number(i.price || order.total_amount),
                      weight: Number(i.weight || 10),
                      unit: 'g'
                    }))
                  : [{ name: 'Fine Jewellery Creation', price: Number(order.total_amount), weight: 10, unit: 'g' }];
                generateInvoice(customerProfile.fullName || user?.user_metadata?.full_name || 'Valued Patron', invoiceItems, Number(order.total_amount));
                toast.success('Tax invoice PDF generated');
              }}
              onPrintReceipt={order => {
                const receipt = convertOrderToReceipt(order, undefined, true);
                setThermalReceiptData(receipt);
                setIsThermalPrinterOpen(true);
              }}
              onToggleWishlist={toggleWishlist}
              onAddToCart={(id, weight, purity, image, name) => addToCartWithAnimation(id, weight, purity, image, name)}
              getStatusColor={getStatusColor}
              formatCurrencyINR={formatCurrencyINR}
            />
          )}

          {/* TAB 2: MY ORDERS (Lazy Loaded) */}
          {currentTab === 'orders' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerOrdersTab
                orders={orders}
                filteredOrders={filteredOrders}
                orderSearchQuery={orderSearchQuery}
                setOrderSearchQuery={setOrderSearchQuery}
                orderStatusFilter={orderStatusFilter}
                setOrderStatusFilter={setOrderStatusFilter}
                onTrackOrder={handleTrackOrder}
                onOpenReturnExchange={order => setSelectedOrderForReturn(order)}
                onDownloadTaxInvoice={order => {
                  const invoiceItems = (order.items && order.items.length > 0)
                    ? order.items.map((i: any) => ({
                        name: i.product_name || 'Fine Jewellery Creation',
                        price: Number(i.price || order.total_amount),
                        weight: Number(i.weight || 10),
                        unit: 'g'
                      }))
                    : [{ name: 'Fine Jewellery Creation', price: Number(order.total_amount), weight: 10, unit: 'g' }];
                  generateInvoice(order.customer_name || customerProfile.fullName || user?.user_metadata?.full_name || 'Valued Patron', invoiceItems, Number(order.total_amount));
                  toast.success('Tax invoice PDF generated');
                }}
                onPrintReceipt={order => {
                  const receipt = convertOrderToReceipt(order, undefined, true);
                  setThermalReceiptData(receipt);
                  setIsThermalPrinterOpen(true);
                }}
                getStatusColor={getStatusColor}
                formatCurrencyINR={formatCurrencyINR}
              />
            </Suspense>
          )}

          {/* TAB 3: LIVE TRACKING (Lazy Loaded) */}
          {currentTab === 'track' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerTrackingTab
                orders={orders}
                selectedOrder={selectedOrderForTracking}
                onSelectOrder={setSelectedOrderForTracking}
                onSelectTab={handleSelectTab}
              />
            </Suspense>
          )}

          {/* TAB 4: MY WISHLIST (Lazy Loaded) */}
          {currentTab === 'wishlist' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerWishlistTab
                wishlist={wishlist}
                wishlistProducts={wishlistProducts}
                onToggleWishlist={toggleWishlist}
                onAddToCart={(id, weight, purity, image, name) => addToCartWithAnimation(id, weight, purity, image, name)}
                formatCurrencyINR={formatCurrencyINR}
              />
            </Suspense>
          )}

          {/* TAB 5: SAVED ADDRESSES (Lazy Loaded) */}
          {currentTab === 'addresses' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerAddressesTab
                addresses={addresses}
                onAddNew={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}
                onEdit={addr => { setEditingAddress(addr); setIsAddressModalOpen(true); }}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefaultAddress}
              />
            </Suspense>
          )}

          {/* TAB 6: PATRON PROFILE (Lazy Loaded) */}
          {currentTab === 'profile' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerProfileTab
                user={user}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                profileErrors={profileErrors}
                profileTouched={profileTouched}
                handleProfileFieldChange={handleProfileFieldChange}
                handleProfileFieldBlur={handleProfileFieldBlur}
                handleSaveProfile={handleSaveProfile}
                handleResetProfile={handleResetProfile}
                isProfileDirty={isProfileDirty}
                isSavingProfile={isSavingProfile}
              />
            </Suspense>
          )}

          {/* TAB 7: AURA GOLD VAULT (Lazy Loaded) */}
          {currentTab === 'vault' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerVaultTab
                goldVault={goldVault}
                vaultMarketValue={vaultMarketValue}
                getStatusColor={getStatusColor}
                formatCurrencyINR={formatCurrencyINR}
              />
            </Suspense>
          )}

          {/* TAB 8: COLLATERAL LOANS (PAWN) (Lazy Loaded) */}
          {currentTab === 'loans' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerLoansTab
                activeLoans={activeLoans}
                onOpenRepayment={handleOpenRepayment}
                getStatusColor={getStatusColor}
              />
            </Suspense>
          )}

          {/* TAB 9: MY GIFT CARDS (Lazy Loaded) */}
          {currentTab === 'giftcards' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerGiftCardsTab />
            </Suspense>
          )}

          {/* TAB 10: TRANSACTIONS LEDGER (Lazy Loaded) */}
          {currentTab === 'transactions' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerLedgerTab
                orders={orders}
                goldVault={goldVault}
                getStatusColor={getStatusColor}
                formatCurrencyINR={formatCurrencyINR}
              />
            </Suspense>
          )}

          {/* TAB 11: PATRON CONCIERGE & SUPPORT (Lazy Loaded) */}
          {currentTab === 'support' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerConciergeTab
                appointmentData={appointmentData}
                setAppointmentData={setAppointmentData}
                onBookAppointment={handleBookAppointment}
              />
            </Suspense>
          )}

          {/* TAB 12: SECURITY & SETTINGS (Lazy Loaded) */}
          {currentTab === 'settings' && (
            <Suspense fallback={<TabLoadingSkeleton />}>
              <CustomerSecurityTab
                user={user}
                onRequestPasswordReset={handleRequestPasswordReset}
                onSignOut={handleSignOut}
              />
            </Suspense>
          )}

            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right Concierge & Live Pulse Panel (Desktop, 320px) */}
        {(currentTab === 'overview' || currentTab === 'orders' || currentTab === 'vault' || currentTab === 'track' || currentTab === 'addresses') && (
          <aside className="hidden xl:block w-[320px] shrink-0 p-6 border-l border-[var(--border-color)] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <CustomerAccountRightPanel
              latestOrder={orders[0] || null}
              onTrackOrder={handleTrackOrder}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#13151A] rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] dark:border-[#222733] relative transition-colors">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] p-1 rounded-lg hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#25282D] dark:bg-[#181B22] flex items-center justify-center text-[#C9A45C]">
                <CreditCard className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">Gold Loan Repayment</h3>
            </div>

            <div className="bg-[#F3F4F6] dark:bg-[#181B22] p-4 rounded-lg border border-[#E5E7EB] dark:border-[#222733] mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#8792A2] dark:text-[#8D96A5]">Pledge Ticket:</span>
                <span className="font-mono font-bold text-[#25282D] dark:text-[#F7F8FA]">{selectedLoanForRepayment.pledge_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8792A2] dark:text-[#8D96A5]">Principal Amount:</span>
                <span className="font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">{formatCurrencyINR(selectedLoanForRepayment.loan_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8792A2] dark:text-[#8D96A5]">Interest Rate:</span>
                <span className="font-semibold text-[#25282D] dark:text-[#F7F8FA]">{selectedLoanForRepayment.interest_rate}% {selectedLoanForRepayment.interest_type}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#8792A2] dark:text-[#8D96A5] mb-1.5 uppercase tracking-wider">
                Repayment Amount (₹)
              </label>
              <input
                type="number"
                min="100"
                value={repayAmount}
                onChange={(e) => setRepayAmount(Number(e.target.value))}
                className="w-full bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] rounded-lg px-4 py-2.5 text-base font-bold text-[#25282D] dark:text-[#F7F8FA] font-mono focus:outline-none focus:border-[#25282D] dark:focus:border-[#C9A45C]"
              />
            </div>

            <PaymentGateway
              amount={repayAmount}
              customerInfo={{
                email: user?.email || undefined,
                name: customerProfile.fullName || user?.user_metadata?.full_name || 'Customer'
              }}
              onSuccess={handlePaymentSuccess}
              onError={(err: string) => toast.error(`Repayment failed: ${err}`)}
            />
          </div>
        </div>
      )}

      {/* 6. Live Shipment Tracking Modal */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#13151A] rounded-xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#E5E7EB] dark:border-[#222733] relative max-h-[90vh] overflow-y-auto transition-colors">
            <button
              type="button"
              onClick={() => setSelectedOrderForTracking(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] hover:bg-[#F3F4F6] dark:hover:bg-[#181B22] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 border-b border-[#E5E7EB] dark:border-[#222733] pb-4">
              <div className="w-10 h-10 rounded-lg bg-[#25282D] dark:bg-[#181B22] flex items-center justify-center text-[#C9A45C]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-inter font-bold text-[#25282D] dark:text-[#F7F8FA]">Delivery Tracking</h3>
                <p className="text-xs text-[#8792A2] dark:text-[#8D96A5]">
                  Order #{selectedOrderForTracking.order_number || selectedOrderForTracking.id.slice(-6).toUpperCase()} • Placed on {new Date(selectedOrderForTracking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Courier & AWB Bar */}
            <div className="bg-[#F3F4F6] dark:bg-[#181B22] p-4 rounded-lg border border-[#E5E7EB] dark:border-[#222733] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5] block font-semibold">Logistics Partner</span>
                <span className="font-semibold text-xs text-[#25282D] dark:text-[#F7F8FA] flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {selectedOrderForTracking.courier_partner || 'Sequel Logistics / BlueDart Insured Express'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8792A2] dark:text-[#8D96A5] block font-semibold">Airway Bill (AWB)</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-bold text-[#25282D] dark:text-[#F7F8FA]">
                    {selectedOrderForTracking.tracking_number || `SQ-${selectedOrderForTracking.id.slice(-6).toUpperCase()}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const awb = selectedOrderForTracking.tracking_number || `SQ-${selectedOrderForTracking.id.slice(-6).toUpperCase()}`;
                      navigator.clipboard?.writeText(awb);
                      toast.success('AWB copied to clipboard');
                    }}
                    title="Copy AWB Tracking Number"
                    className="p-1 rounded text-[#8792A2] dark:text-[#8D96A5] hover:text-[#25282D] dark:hover:text-[#F7F8FA] cursor-pointer"
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
                { num: 1, label: 'Order Confirmed', desc: 'Secure order confirmed and allocated from vault' },
                { num: 2, label: 'Insurance Activated', desc: 'Complimentary 100% transit insurance cover activated' },
                { num: 3, label: 'BIS Hallmarking Verified', desc: 'Government HUID and caratage laser-seal inspected' },
                { num: 4, label: 'Dispatched via Armoured Transit', desc: 'Handed to tamper-proof courier logistics' },
                { num: 5, label: 'Delivered to Address', desc: 'OTP verification & signed recipient handover' },
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
                              currentStage > stage.num ? 'bg-[#25282D] dark:bg-[#D8B878]' : 'bg-[#E5E7EB] dark:border-[#222733]'
                            }`}
                            style={{ height: 'calc(100% + 4px)' }}
                          />
                        )}
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-colors ${
                            isCompleted 
                              ? 'bg-[#25282D] dark:bg-[#181B22] text-white shadow-xs border dark:border-[#C9A45C]/50' 
                              : 'bg-white dark:bg-[#13151A] border border-[#E5E7EB] dark:border-[#222733] text-[#8792A2] dark:text-[#8D96A5]'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#C9A45C]" /> : stage.num}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-semibold ${isCurrent ? 'text-[#25282D] dark:text-[#F7F8FA] font-bold' : isCompleted ? 'text-[#343A40] dark:text-[#D2D7E2]' : 'text-[#8792A2] dark:text-[#8D96A5]'}`}>
                              {stage.label}
                            </h4>
                            {isCompleted && (
                              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                                {isCurrent ? 'In Transit' : 'Completed'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#8792A2] dark:text-[#8D96A5] mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Destination summary */}
            {selectedOrderForTracking.shipping_address && (
              <div className="p-3.5 rounded-lg bg-[#F3F4F6] dark:bg-[#181B22] border border-[#E5E7EB] dark:border-[#222733] text-xs text-[#8792A2] dark:text-[#8D96A5]">
                <span className="font-semibold text-[#25282D] dark:text-[#F7F8FA] block mb-1">Delivering To:</span>
                <p>{selectedOrderForTracking.shipping_address.fullName} • {selectedOrderForTracking.shipping_address.street}, {selectedOrderForTracking.shipping_address.city} - {selectedOrderForTracking.shipping_address.zipCode}</p>
                <p className="mt-0.5 font-mono text-[11px]">Contact: {selectedOrderForTracking.shipping_address.phone}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderForTracking(null)}
                className="px-5 py-2.5 rounded-lg bg-[#25282D] hover:bg-black dark:bg-[#1C2029] dark:hover:bg-[#252A36] text-white font-semibold text-xs tracking-wider uppercase transition-colors cursor-pointer shadow-xs dark:border dark:border-[#C9A45C]/40"
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
