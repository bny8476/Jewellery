import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import { Bell, CheckCircle, Clock, DollarSign, RefreshCw } from 'lucide-react';

interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    pledge_id: string | null;
    interest_amount: number | null;
    total_amount: number | null;
    is_read: boolean;
    sent_via_email: boolean;
    created_at: string;
}

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Set up real-time subscription for new notifications
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get customer_id from profiles or customers table
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!profile) return;

            const subscription = supabase
                .channel('notifications_changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `customer_id=eq.${profile.id}`
                    },
                    () => {
                        console.log('New notification received');
                        fetchNotifications();
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        };

        setupSubscription();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get customer record
            const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!customer) {
                setNotifications([]);
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('customer_id', customer.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds);

            if (error) throw error;

            // Update local state
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'monthly_interest':
                return <DollarSign className="h-5 w-5 text-[#c5a044]" />;
            case 'payment_reminder':
                return <Clock className="h-5 w-5 text-[#d4af37]" />;
            case 'pledge_status':
                return <CheckCircle className="h-5 w-5 text-emerald-400" />;
            default:
                return <Bell className="h-5 w-5 text-[#c5a044]" />;
        }
    };

    const getNotificationColor = (_type: string) => {
        return 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--gold-primary)]/40';
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
            <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-10 pb-6 border-b border-[var(--border-color)]">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[var(--gold-primary)] uppercase block mb-1">
                                CLIENT ALERTS
                            </span>
                            <h1 className="text-3xl md:text-5xl font-serif text-[var(--text-main)] tracking-tight">Account Notifications</h1>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">
                                {unreadCount > 0 ? `You have ${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'Your portfolio alerts are up to date.'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-3.5 py-2 text-xs font-semibold text-black bg-gradient-to-r from-[var(--gold-primary)] via-[var(--gold-highlight)] to-[var(--gold-primary)] rounded-lg hover:brightness-105 transition-colors uppercase tracking-wider shadow-sm"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--gold-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--gold-primary)]"></div>
                        <p className="mt-4 text-[var(--text-secondary)] text-xs">Retrieving updates...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-[var(--bg-card)] p-12 rounded-2xl border border-[var(--border-color)] text-center">
                        <Bell className="h-12 w-12 text-[var(--gold-primary)]/40 mx-auto mb-3" />
                        <h3 className="text-lg font-serif font-semibold text-[var(--text-main)] mb-1">No alerts on file</h3>
                        <p className="text-[var(--text-secondary)] text-xs">Notifications regarding interest schedules and pledge status will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`rounded-xl border transition-all cursor-pointer ${notification.is_read ? 'opacity-70' : 'shadow-lg'
                                    } ${getNotificationColor(notification.notification_type)}`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)]">
                                            {getNotificationIcon(notification.notification_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-serif font-medium text-[var(--text-main)] mb-1 flex items-center">
                                                        {notification.title}
                                                        {!notification.is_read && (
                                                            <span className="ml-2 inline-block w-2 h-2 bg-[var(--gold-primary)] rounded-full shadow-[0_0_8px_var(--gold-primary)]"></span>
                                                        )}
                                                    </h3>
                                                    <p className="text-[var(--text-secondary)] text-xs mb-3 leading-relaxed">{notification.message}</p>

                                                    {notification.interest_amount !== null && notification.total_amount !== null && (
                                                        <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)]">
                                                            <div>
                                                                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-0.5">Interest Accrual</p>
                                                                <p className="text-base font-serif font-bold text-gold-gradient">
                                                                    ₹{notification.interest_amount.toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-0.5">Total Amount Due</p>
                                                                <p className="text-base font-serif font-bold text-[var(--text-main)]">
                                                                    ₹{notification.total_amount.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0 text-right">
                                                    <p className="text-xs text-[var(--text-secondary)]">
                                                        {new Date(notification.created_at).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-secondary)]/70">
                                                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    {notification.sent_via_email && (
                                                        <p className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-1">✓ Dispatch Logged</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Notifications;
