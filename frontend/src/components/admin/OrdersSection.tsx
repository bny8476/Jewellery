import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Eye, CheckCircle2, Truck, Clock, XCircle, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Order } from '../../types/pawnshop';
import { toast } from '../../utils/toast';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

export const OrdersSection: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            if (!isSupabaseConfigured) {
                // Mock dev orders if Supabase is offline
                setOrders([
                    {
                        id: 'ORD-1728560000000',
                        user_id: 'sample-user-1',
                        total_amount: 145000,
                        status: 'processing',
                        shipping_address: {
                            fullName: 'Vikramaditya Sharma',
                            street: '42 Royal Crescent, T Nagar',
                            city: 'Chennai',
                            zipCode: '600017',
                            phone: '9840123456'
                        },
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                        updated_at: new Date().toISOString(),
                        items: [
                            {
                                id: 'item-1',
                                order_id: 'ORD-1728560000000',
                                product_name: '22K Traditional Temple Haram',
                                price: 145000,
                                weight: 24.5,
                                unit: 'grams',
                                quantity: 1,
                                created_at: new Date().toISOString()
                            }
                        ]
                    }
                ]);
                return;
            }

            const { data, error } = await supabase
                .from('orders')
                .select('*, items:order_items(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast.error(error.message || 'Failed to load retail orders');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            setUpdatingId(orderId);
            if (isSupabaseConfigured) {
                const { error } = await supabase
                    .from('orders')
                    .update({ status: newStatus, updated_at: new Date().toISOString() })
                    .eq('id', orderId);

                if (error) throw error;
            }

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
            toast.success(`Order #${orderId} marked as ${newStatus}`);
        } catch (error: any) {
            console.error('Error updating order:', error);
            toast.error(error.message || 'Failed to update order status');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shipping_address?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shipping_address?.phone?.includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status: Order['status']) => {
        switch (status) {
            case 'delivered':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"><CheckCircle2 className="h-3 w-3" /> Delivered</span>;
            case 'shipped':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/30"><Truck className="h-3 w-3" /> Shipped</span>;
            case 'processing':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30"><Clock className="h-3 w-3" /> Processing</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30"><XCircle className="h-3 w-3" /> Cancelled</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/30">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-[26px] font-semibold text-[var(--text-main)] flex items-center gap-2 tracking-tight admin-page-heading">
                        <ShoppingBag className="h-6 w-6 text-[var(--gold-primary)]" />
                        Retail Orders Management
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Review customer jewellery acquisitions, invoice tracking, and delivery fulfillment.
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)]/40 text-xs text-[var(--text-main)] transition-all"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="relative w-full md:w-80">
                    <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search by order ID, customer, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold-primary)]"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all whitespace-nowrap ${
                                statusFilter === tab
                                    ? 'bg-[var(--gold-primary)] text-black font-semibold shadow-sm'
                                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] font-semibold border-b border-[var(--border-color)]">
                            <tr>
                                <th className="p-4">Order Reference</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Date & Time</th>
                                <th className="p-4">Total Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">
                                        No matching retail orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                        <td className="p-4 font-mono font-medium text-[var(--gold-primary)]">
                                            {order.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-[var(--text-main)]">{order.shipping_address?.fullName || 'Client'}</div>
                                            <div className="text-[11px] text-[var(--text-secondary)]">{order.shipping_address?.phone}</div>
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">
                                            {formatDate(order.created_at, {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4 font-semibold text-[var(--text-main)]">
                                            {formatCurrencyINR(order.total_amount)}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--gold-primary)] text-[var(--text-main)] transition-colors"
                                                    title="View Order Details"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>

                                                {order.status === 'processing' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                                        disabled={updatingId === order.id}
                                                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-medium transition-all shadow-xs disabled:opacity-50"
                                                    >
                                                        Mark Shipped
                                                    </button>
                                                )}

                                                {order.status === 'shipped' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                                        disabled={updatingId === order.id}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-all shadow-xs disabled:opacity-50"
                                                    >
                                                        Mark Delivered
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
                        <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-4">
                            <div>
                                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--gold-primary)]">
                                    Order Specification
                                </span>
                                <h3 className="text-lg font-semibold text-[var(--text-main)] mt-0.5 admin-section-heading">
                                    {selectedOrder.id}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Customer Address Details */}
                        <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-color)] text-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[var(--gold-primary)] tracking-widest block mb-1">
                                Delivery Destination
                            </span>
                            <p className="font-semibold text-[var(--text-main)]">{selectedOrder.shipping_address?.fullName}</p>
                            <p className="text-[var(--text-secondary)]">{selectedOrder.shipping_address?.street}, {selectedOrder.shipping_address?.city} - {selectedOrder.shipping_address?.zipCode}</p>
                            <p className="text-[var(--text-secondary)]">Phone: <span className="text-[var(--text-main)] font-medium">{selectedOrder.shipping_address?.phone}</span></p>
                        </div>

                        {/* Items Purchased */}
                        <div>
                            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest block mb-2">
                                Purchased Items ({selectedOrder.items?.length || 0})
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {selectedOrder.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs">
                                        <div>
                                            <p className="font-semibold text-[var(--text-main)]">{item.product_name}</p>
                                            <p className="text-[11px] text-[var(--text-secondary)]">{item.weight} {item.unit} &bull; Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-semibold text-[var(--gold-primary)]">
                                            {formatCurrencyINR(item.price)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total & Action */}
                        <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)]">
                            <div>
                                <span className="text-xs text-[var(--text-secondary)]">Grand Total (Incl. GST):</span>
                                <p className="text-xl font-bold tabular-nums text-[var(--gold-primary)]">
                                    {formatCurrencyINR(selectedOrder.total_amount)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {selectedOrder.status !== 'delivered' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status === 'processing' ? 'shipped' : 'delivered')}
                                        disabled={updatingId === selectedOrder.id}
                                        className="px-4 py-2 rounded-xl bg-[var(--gold-primary)] text-black font-semibold text-xs hover:brightness-105"
                                    >
                                        Advance Status
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
