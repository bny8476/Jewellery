import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Scale, Clock, CheckCircle2, Package, ArrowRight, User as UserIcon, XCircle, CreditCard, X, ShieldCheck } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Order } from '../types/pawnshop';
import { PawnRequest } from '../lib/supabase';
import { PaymentGateway } from '../components/PaymentGateway';
import { createPartPayment } from '../services/transactionService';
import { toast } from '../utils/toast';

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

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [pawns, setPawns] = useState<PawnRequest[]>([]);
    const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);

    // Repayment Modal State
    const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<ActiveLoan | null>(null);
    const [repayAmount, setRepayAmount] = useState<number>(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Orders
                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (ordersData) setOrders(ordersData);

                // Fetch Pawn Requests (Online Applications)
                const { data: pawnData } = await supabase
                    .from('pawn_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (pawnData) setPawns(pawnData);

                // Fetch Actual Active Pawn Loans (from pledges table via customer match)
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
            }
            setLoading(false);
        };

        fetchUserData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': case 'approved': case 'closed': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'shipped': case 'processing': case 'partially_paid': return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30';
            case 'pending': case 'active': case 'open': return 'text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/30';
            case 'rejected': case 'cancelled': return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
            default: return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-color)]';
        }
    };

    const handleOpenRepayment = (loan: ActiveLoan) => {
        const totalPaid = loan.part_payments?.reduce((s, p) => s + (Number(p.payment_amount) || 0), 0) || 0;
        const outstanding = Math.max(0, Number(loan.loan_amount) - totalPaid);
        // Default repayment recommendation: 1 month interest
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
                <p className="text-[var(--text-secondary)] text-xs mb-8 leading-relaxed">Please authenticate to review your jewelry acquisitions, order tracking, and active collateral portfolio.</p>
                <a href="/login" className="block w-full bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] text-black py-3.5 rounded-xl font-semibold uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-lg shadow-[var(--gold-primary)]/20">
                    Sign In to Portal
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-20 transition-colors duration-300">
            {/* Header / Profile Summary */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] pt-12 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--gold-primary)]/40 flex items-center justify-center shadow-xl">
                            <span className="text-2xl font-serif font-bold text-gold-gradient">{user.email?.[0].toUpperCase()}</span>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="text-[10px] font-sans font-semibold tracking-[0.2em] text-[var(--gold-primary)] uppercase block mb-1">
                                VALUED CLIENT
                            </span>
                            <h1 className="text-2xl md:text-4xl font-serif font-bold text-[var(--text-main)] mb-1">Welcome back</h1>
                            <p className="text-[var(--text-secondary)] text-xs">{user.email}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5">
                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                                    <ShoppingBag className="h-3.5 w-3.5 text-[var(--gold-primary)]" />
                                    <span className="text-xs font-semibold text-[var(--text-main)]">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
                                </div>
                                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3.5 py-1.5 rounded-lg flex items-center gap-2">
                                    <Scale className="h-3.5 w-3.5 text-[var(--gold-primary)]" />
                                    <span className="text-xs font-semibold text-[var(--text-main)]">{pawns.length + activeLoans.length} Collateral Items</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-8">
                {/* Active Gold Loans (If any exists in pledges ledger) */}
                {activeLoans.length > 0 && (
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-xl">
                        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-4">
                            <div>
                                <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-[var(--gold-primary)]" /> Active Gold Loans & Collateral Portfolio
                                </h2>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage your pledged jewelry and repay monthly interest securely online.</p>
                            </div>
                        </div>

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
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Orders */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2">
                            <h2 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                                <Package className="h-4 w-4 text-[var(--gold-primary)]" /> Acquisitions & Orders
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {orders.length === 0 ? (
                                <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                                    <Package className="h-10 w-10 text-[var(--gold-primary)]/40 mx-auto mb-3" />
                                    <p className="text-[var(--text-secondary)] text-xs">No orders placed yet.</p>
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
                                            <span className="text-base font-serif font-bold text-gold-gradient">₹{order.total_amount.toLocaleString()}</span>
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
                                <Scale className="h-4 w-4 text-[var(--gold-primary)]" /> Collateral Applications
                            </h2>
                            <a href="/pawn" className="text-[var(--gold-primary)] font-semibold text-xs hover:underline flex items-center gap-1 uppercase tracking-wider">
                                New Application <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                        </div>

                        <div className="space-y-3">
                            {pawns.length === 0 ? (
                                <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                                    <Scale className="h-10 w-10 text-[var(--gold-primary)]/40 mx-auto mb-3" />
                                    <p className="text-[var(--text-secondary)] text-xs">No pledge applications on file.</p>
                                </div>
                            ) : (
                                pawns.map(pawn => (
                                    <div key={pawn.id} className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{pawn.id.slice(0, 8)}... • {new Date(pawn.created_at).toLocaleDateString()}</p>
                                                <h3 className="font-serif text-sm font-medium text-[var(--text-main)] mt-1">{pawn.item_description}</h3>
                                            </div>
                                            <div className="p-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                                                {pawn.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : pawn.status === 'rejected' ? <XCircle className="h-4 w-4 text-rose-500" /> : <Clock className="h-4 w-4 text-[var(--gold-primary)]" />}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border-color)]">
                                            <div>
                                                <p className="text-[9px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Requested</p>
                                                <p className="text-base font-serif font-bold text-gold-gradient">₹{pawn.requested_amount.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Status</p>
                                                <p className="text-xs font-semibold capitalize text-[var(--text-main)]">{pawn.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Online Repayment Gateway Modal */}
            {isPaymentModalOpen && selectedLoanForRepayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-4">
                            <span className="text-[10px] font-semibold text-[var(--gold-primary)] uppercase tracking-wider">LOAN REPAYMENT</span>
                            <h3 className="text-lg font-serif font-bold text-[var(--text-main)] mt-0.5">
                                Repay Loan #{selectedLoanForRepayment.pledge_number}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)]">Pay monthly interest or make a principal part-payment securely with UPI/Card.</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                                Repayment Amount (₹ INR)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(Math.max(1, Number(e.target.value)))}
                                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-sm font-semibold text-[var(--text-main)] focus:outline-none focus:border-[var(--gold-primary)]"
                            />
                        </div>

                        <PaymentGateway
                            amount={repayAmount}
                            customerInfo={{
                                email: user.email || undefined,
                            }}
                            onSuccess={handlePaymentSuccess}
                            onError={(err) => toast.error(`Payment failed: ${err}`)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
