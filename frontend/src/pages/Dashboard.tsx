import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShoppingBag, Scale, Package, ArrowRight, User as UserIcon, 
  CreditCard, X, ShieldCheck, Coins, Sparkles, History,
  Download
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Order } from '../types/pawnshop';
import { PawnRequest } from '../lib/supabase';
import { PaymentGateway } from '../components/PaymentGateway';
import { createPartPayment } from '../services/transactionService';
import { toast } from '../utils/toast';
import { formatCurrencyINR } from '../utils/formatters';

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

export default function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'overview';

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [pawns, setPawns] = useState<PawnRequest[]>([]);
    const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
    const [goldVault, setGoldVault] = useState<DigitalGoldVaultData | null>(null);

    // Repayment Modal State
    const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<ActiveLoan | null>(null);
    const [repayAmount, setRepayAmount] = useState<number>(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // 1. Fetch Jewelry Orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (ordersData) setOrders(ordersData);

                // 2. Fetch Pawn Online Applications
                const { data: pawnData } = await supabase
                    .from('pawn_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (pawnData) setPawns(pawnData);

                // 3. Fetch Active Pawn Loans
                try {
                    const { data: customerRecord } = await supabase
                        .from('customers')
                        .select('id')
                        .eq('user_id', user.id)
                        .maybeSingle();

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

                // 4. Fetch Aura Gold Vault Data
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
                        const estRate = 12841.15; // Benchmark 24K rate
                        setGoldVault({
                            account_number: dgAccount.account_number,
                            gold_balance_grams: balance,
                            reserved_grams: Number(dgAccount.reserved_grams || 0),
                            market_value: Math.round(balance * estRate * 100) / 100,
                            transactions: dgTxns || []
                        });
                    }
                } catch (dgErr) {
                    console.warn('[Dashboard] Error fetching digital gold account:', dgErr);
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': case 'approved': case 'closed': case 'COMPLETED':
                return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'shipped': case 'processing': case 'partially_paid':
                return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30';
            case 'pending': case 'active': case 'open': case 'PENDING':
                return 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30';
            case 'rejected': case 'cancelled': case 'FAILED':
                return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
            default:
                return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-color)]';
        }
    };

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

            // Update local state
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

    if (loading) return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center transition-colors duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--gold-primary)]"></div>
        </div>
    );

    if (!user) return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-[var(--bg-card)] p-8 md:p-10 rounded-3xl shadow-2xl border border-[var(--border-color)] max-w-md w-full text-center">
                <div className="bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserIcon className="h-8 w-8 text-[var(--gold-primary)]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] mb-2">Private Client Access</h2>
                <p className="text-[var(--text-secondary)] text-xs mb-8 leading-relaxed">Please authenticate to review your jewelry acquisitions, order tracking, pawn collateral, and Aura Gold vault.</p>
                <a href="/login" className="block w-full bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black py-3.5 rounded-xl font-semibold uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-lg shadow-[var(--gold-primary)]/20">
                    Sign In to Portal
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-20 transition-colors duration-300">
            {/* Header / Profile Summary */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] pt-12 pb-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/40 flex items-center justify-center shadow-xl">
                                <span className="text-2xl font-serif font-bold text-gold-gradient">{user.email?.[0].toUpperCase()}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[var(--gold-primary)] uppercase block mb-1">
                                    YAZHINI UNIFIED PATRON PORTAL
                                </span>
                                <h1 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-main)] mb-1">Welcome back</h1>
                                <p className="text-[var(--text-secondary)] text-xs">{user.email}</p>
                            </div>
                        </div>

                        {/* Unified Three-Module Metrics */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-xl flex items-center gap-2.5">
                                <ShoppingBag className="h-4 w-4 text-[var(--gold-primary)]" />
                                <div>
                                    <span className="text-[10px] text-gray-500 block uppercase">Jewelry</span>
                                    <span className="text-xs font-bold text-[var(--text-main)]">{orders.length} Orders</span>
                                </div>
                            </div>
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-xl flex items-center gap-2.5">
                                <Scale className="h-4 w-4 text-amber-500" />
                                <div>
                                    <span className="text-[10px] text-gray-500 block uppercase">Pawn Loans</span>
                                    <span className="text-xs font-bold text-[var(--text-main)]">{activeLoans.length} Active</span>
                                </div>
                            </div>
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-xl flex items-center gap-2.5">
                                <Coins className="h-4 w-4 text-[#D4AF37]" />
                                <div>
                                    <span className="text-[10px] text-gray-500 block uppercase">Aura Vault</span>
                                    <span className="text-xs font-bold text-[var(--text-main)]">{goldVault ? `${goldVault.gold_balance_grams.toFixed(4)}g` : '0.0000g'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation Pill Bar */}
                    <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[var(--border-color)]">
                        {[
                            { id: 'overview', label: 'Unified Overview', icon: Sparkles },
                            { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
                            { id: 'loans', label: `Pawn Loans (${activeLoans.length})`, icon: Scale },
                            { id: 'vault', label: 'Aura Gold Vault', icon: Coins },
                            { id: 'transactions', label: 'All Transactions', icon: History }
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSearchParams({ tab: tab.id })}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        isActive 
                                            ? 'bg-[#702638] text-white shadow-md' 
                                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Dashboard Content Body */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
                
                {/* 1. Aura Gold Vault Spotlight Card (Visible on overview or vault tab) */}
                {(currentTab === 'overview' || currentTab === 'vault') && (
                    <div className="bg-gradient-to-r from-[#4A1521] via-[#702638] to-[#2B0B13] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#D4AF37]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FAF7F2] text-xs font-medium mb-3">
                                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>Aura Gold™ Digital Vault • 100% Insured</span>
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white">
                                {goldVault ? `${goldVault.gold_balance_grams.toFixed(4)} grams` : '0.0000 grams'}
                            </h2>
                            <p className="text-xs text-[#E8D5D0] mt-1">
                                Current Market Value: <strong className="text-white">₹{goldVault ? goldVault.market_value.toLocaleString('en-IN') : '0'}</strong>
                                {goldVault && <span className="ml-2 font-mono text-[11px] text-[#E8D5D0]/80">• Acc: {goldVault.account_number}</span>}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to="/auragold"
                                className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-bold hover:bg-[#C5A059] transition-colors shadow-sm"
                            >
                                + Buy 24K Gold
                            </Link>
                            <Link
                                to="/auragold?tab=SELL"
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
                            >
                                Cash-Out / Sell
                            </Link>
                            <Link
                                to="/auragold?tab=REDEEM"
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
                            >
                                Redeem Minted Coins
                            </Link>
                        </div>
                    </div>
                )}

                {/* 2. Active Gold Loans (Pawn) Section (Visible on overview or loans tab) */}
                {(currentTab === 'overview' || currentTab === 'loans') && (
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-xl">
                        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-4">
                            <div>
                                <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-[var(--gold-primary)]" /> Active Gold Loans &amp; Collateral Portfolio
                                </h2>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage your pledged jewelry and repay monthly interest securely online.</p>
                            </div>
                            <Link to="/pawn" className="text-xs text-[#702638] dark:text-[#D4AF37] font-semibold hover:underline flex items-center gap-1">
                                <span>Pawn Calculator</span> <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {activeLoans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeLoans.map(loan => {
                                    const totalPaid = loan.part_payments?.reduce((s, p) => s + (Number(p.payment_amount) || 0), 0) || 0;
                                    const balance = Math.max(0, Number(loan.loan_amount) - totalPaid);
                                    const isClosed = loan.status === 'closed' || balance === 0;

                                    return (
                                        <div key={loan.id} className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col justify-between">
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
                                                    onClick={() => handleOpenRepayment(loan)}
                                                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--gold-primary)] to-[var(--gold-highlight)] text-black text-xs font-semibold uppercase py-2 rounded-lg hover:brightness-105 transition-all shadow-sm"
                                                >
                                                    <CreditCard className="h-3.5 w-3.5" /> Pay Interest Online
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-xs text-gray-500">
                                No active collateral loans. Apply online or visit our showroom for instant appraisal.
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Jewelry Orders & Pawn Applications Grid (Visible on overview or orders tab) */}
                {(currentTab === 'overview' || currentTab === 'orders') && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Retail Jewelry Orders */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2">
                                <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                                    <Package className="h-4 w-4 text-[var(--gold-primary)]" /> Jewelry Acquisitions &amp; Orders
                                </h2>
                                <Link to="/" className="text-xs text-[#702638] dark:text-[#D4AF37] font-semibold hover:underline">
                                    Browse Store
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {orders.length === 0 ? (
                                    <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                                        <Package className="h-10 w-10 text-[var(--gold-primary)]/40 mx-auto mb-3" />
                                        <p className="text-[var(--text-secondary)] text-xs">No retail jewelry orders placed yet.</p>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div key={order.id} className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{order.id} • {new Date(order.created_at).toLocaleDateString()}</p>
                                                    <h3 className="font-serif text-sm font-medium text-[var(--text-main)] mt-1">
                                                        {order.items?.map(i => i.product_name).join(', ') || 'Fine Jewellery Piece'}
                                                    </h3>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-baseline pt-3 border-t border-[var(--border-color)]">
                                                <span className="text-xs text-[var(--text-secondary)]">Total Amount</span>
                                                <span className="text-base price-total text-gold-gradient">{formatCurrencyINR(order.total_amount)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Collateral Applications */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2">
                                <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                                    <Scale className="h-4 w-4 text-[var(--gold-primary)]" /> Collateral Enquiries
                                </h2>
                                <Link to="/pawn" className="text-[var(--gold-primary)] font-semibold text-xs hover:underline flex items-center gap-1 uppercase tracking-wider">
                                    New Valuation <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {pawns.length === 0 ? (
                                    <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                                        <Scale className="h-10 w-10 text-[var(--gold-primary)]/40 mx-auto mb-3" />
                                        <p className="text-[var(--text-secondary)] text-xs">No pending pledge valuations on file.</p>
                                    </div>
                                ) : (
                                    pawns.map(pawn => (
                                        <div key={pawn.id} className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{pawn.id.slice(0, 8)}... • {new Date(pawn.created_at).toLocaleDateString()}</p>
                                                    <h3 className="font-serif text-sm font-medium text-[var(--text-main)] mt-1">{pawn.item_description}</h3>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusColor(pawn.status)}`}>
                                                    {pawn.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-baseline pt-3 border-t border-[var(--border-color)]">
                                                <span className="text-xs text-[var(--text-secondary)]">Requested Valuation</span>
                                                <span className="text-base price-total text-gold-gradient">{formatCurrencyINR(pawn.requested_amount)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Unified Transactions Ledger (Visible on transactions tab) */}
                {currentTab === 'transactions' && (
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)]">
                            <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                                <History className="w-5 h-5 text-[var(--gold-primary)]" />
                                Unified Patron Transaction History
                            </h2>
                            <button
                                onClick={() => toast.success('Statement download initiated')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs hover:bg-[var(--bg-elevated)]"
                            >
                                <Download className="w-3.5 h-3.5" /> Statement
                            </button>
                        </div>

                        {goldVault && goldVault.transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] uppercase">
                                            <th className="py-2.5 px-3">Date</th>
                                            <th className="py-2.5 px-3">Reference</th>
                                            <th className="py-2.5 px-3">Module</th>
                                            <th className="py-2.5 px-3">Type</th>
                                            <th className="py-2.5 px-3">Quantity</th>
                                            <th className="py-2.5 px-3">Amount</th>
                                            <th className="py-2.5 px-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {goldVault.transactions.map((t: any) => (
                                            <tr key={t.id} className="hover:bg-[var(--bg-elevated)]/50">
                                                <td className="py-3 px-3 text-[var(--text-secondary)]">{new Date(t.created_at).toLocaleDateString()}</td>
                                                <td className="py-3 px-3 font-mono font-medium number-supporting">{t.transaction_reference}</td>
                                                <td className="py-3 px-3 font-semibold text-[#D4AF37]">Aura Gold™</td>
                                                <td className="py-3 px-3">{t.type}</td>
                                                <td className="py-3 px-3 rate-financial">{Number(t.grams).toFixed(4)}g</td>
                                                <td className="py-3 px-3 price-total">{formatCurrencyINR(Number(t.total_amount))}</td>
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
                            <div className="py-12 text-center text-xs text-gray-500">
                                No transaction records found.
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Repayment Modal */}
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
        </div>
    );
}
