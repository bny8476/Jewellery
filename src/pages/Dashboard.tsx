import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Scale, Clock, CheckCircle2, Package, ArrowRight, User as UserIcon, XCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { Order } from '../types/pawnshop';
import { PawnRequest } from '../lib/supabase';

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [pawns, setPawns] = useState<PawnRequest[]>([]);

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

                // Fetch Pawn Requests
                const { data: pawnData } = await supabase
                    .from('pawn_requests')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (pawnData) setPawns(pawnData);
            }
            setLoading(false);
        };

        fetchUserData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': case 'approved': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'shipped': case 'processing': return 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30';
            case 'pending': return 'text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/30';
            case 'rejected': case 'cancelled': return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
            default: return 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border-color)]';
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
                                    <span className="text-xs font-semibold text-[var(--text-main)]">{pawns.length} Active {pawns.length === 1 ? 'Pledge' : 'Pledges'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
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

                    {/* Active Pawns */}
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
        </div>
    );
}
