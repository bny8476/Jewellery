import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PawnRequest } from '../../lib/supabase';
import { CheckCircle, XCircle, RefreshCw, Calendar, Clock, MapPin, Sparkles, Phone, Mail } from 'lucide-react';
import { toast } from '../../utils/toast';

interface StoreAppointment {
    id: string;
    user_id?: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    store_id: string;
    store_name: string;
    service_type: string;
    preferred_date: string;
    time_slot: string;
    notes?: string;
    status: 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
}

interface OnlineRequestsProps {
    onApprove: (request: PawnRequest) => void;
}

const OnlineRequests: React.FC<OnlineRequestsProps> = ({ onApprove }) => {
    const [activeTab, setActiveTab] = useState<'pawn' | 'appointments'>('pawn');
    const [requests, setRequests] = useState<PawnRequest[]>([]);
    const [appointments, setAppointments] = useState<StoreAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

    useEffect(() => {
        fetchRequests();
        fetchAppointments();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data: requestsData, error: requestsError } = await supabase
                .from('pawn_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (requestsError) throw requestsError;

            if (!requestsData || requestsData.length === 0) {
                setRequests([]);
                return;
            }

            const userIds = Array.from(new Set(requestsData.map(r => r.user_id)));
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone')
                .in('id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            const requestsWithProfiles = requestsData.map(req => {
                const profile = profilesData?.find(p => p.id === req.user_id);
                return {
                    ...req,
                    profiles: profile ? {
                        full_name: profile.full_name,
                        email: profile.email,
                        phone: profile.phone
                    } : undefined
                };
            });

            setRequests(requestsWithProfiles);
        } catch (error) {
            console.error('Error fetching online requests:', error);
            toast.error('Failed to load online requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            setLoadingAppointments(true);
            const { data, error } = await supabase
                .from('store_appointments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Could not query store_appointments:', error.message);
                setAppointments([]);
            } else if (data) {
                setAppointments(data as StoreAppointment[]);
            }
        } catch (err) {
            console.error('Failed to fetch store appointments:', err);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this request?')) return;

        try {
            const { error } = await supabase
                .from('pawn_requests')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) throw error;
            toast.success('Request rejected');
            fetchRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast.error('Failed to reject request');
        }
    };

    const handleUpdateAppointmentStatus = async (id: string, newStatus: 'completed' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('store_appointments')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Appointment marked as ${newStatus}`);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        } catch (error) {
            console.error('Error updating appointment:', error);
            toast.error('Failed to update appointment status');
        }
    };

    if (loading && requests.length === 0 && appointments.length === 0) {
        return (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-12 text-center shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-[var(--gold-primary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Loading requests & appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
            {/* Header with Sub-tabs */}
            <div className="p-6 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)]">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-main)]">Patron Requests & Appointments</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage digital appraisal pledges and Joyalukkas VIP showroom styling visits</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                        onClick={() => { fetchRequests(); fetchAppointments(); }}
                        disabled={loading || loadingAppointments}
                        className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                        title="Refresh all"
                    >
                        <RefreshCw className={`h-4 w-4 ${(loading || loadingAppointments) ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-color)]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('pawn')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'pawn'
                                    ? 'bg-[var(--gold-primary)] text-black font-bold shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                            }`}
                        >
                            Pawn Requests ({requests.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('appointments')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'appointments'
                                    ? 'bg-[var(--gold-primary)] text-black font-bold shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                            }`}
                        >
                            VIP Appointments ({appointments.filter(a => a.status === 'confirmed').length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab 1: Pawn Appraisal Requests */}
            {activeTab === 'pawn' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] font-semibold border-b border-[var(--border-color)]">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">User ID / Customer</th>
                                <th className="p-4">Item Description</th>
                                <th className="p-4">Requested Amount</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-[var(--text-secondary)]">
                                        <p className="text-sm font-medium">No pending online appraisal requests found.</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Incoming digital pawn submissions will appear here for appraisal & pledge conversion.</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-[var(--text-main)] whitespace-nowrap">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="font-mono text-xs text-[var(--gold-primary)] font-medium">
                                                {(req as any).profiles?.full_name || (req as any).profiles?.email || req.user_id}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-[var(--text-main)] font-medium">
                                            {req.item_description}
                                        </td>
                                        <td className="p-4 text-sm text-[var(--text-main)] font-bold tabular-nums">
                                            ₹{req.requested_amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onApprove(req)}
                                                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                                                >
                                                    <CheckCircle className="h-4 w-4" /> Convert to Pledge
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                                                >
                                                    <XCircle className="h-4 w-4" /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab 2: VIP Appointments */}
            {activeTab === 'appointments' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] font-semibold border-b border-[var(--border-color)]">
                            <tr>
                                <th className="p-4">Appt Ref / Date</th>
                                <th className="p-4">Patron Details</th>
                                <th className="p-4">Showroom & Service</th>
                                <th className="p-4">Schedule Slot</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-[var(--text-secondary)]">
                                        <Sparkles className="w-8 h-8 text-[var(--gold-primary)] mx-auto mb-2 opacity-60" />
                                        <p className="text-sm font-medium">No showroom appointments booked yet.</p>
                                        <p className="text-xs text-[var(--text-muted)] mt-1">Bookings made via the PDP "Book In-Store Trial" or Store Locator modal will stream here in real time.</p>
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <span className="font-mono text-xs font-bold text-[var(--gold-primary)] block">
                                                {appt.id.slice(0, 14)}
                                            </span>
                                            <span className="text-[11px] text-[var(--text-secondary)]">
                                                {new Date(appt.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="font-semibold text-[var(--text-main)]">{appt.customer_name}</div>
                                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-0.5">
                                                <Phone className="w-3 h-3 text-[var(--gold-primary)]" /> {appt.customer_phone}
                                            </div>
                                            {appt.customer_email && (
                                                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                                    <Mail className="w-3 h-3" /> {appt.customer_email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="font-medium text-[var(--text-main)] flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-[var(--gold-primary)]" /> {appt.store_name}
                                            </div>
                                            <span className="inline-block mt-1 text-[11px] font-semibold text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 px-2 py-0.5 rounded border border-[var(--gold-primary)]/20">
                                                {appt.service_type}
                                            </span>
                                            {appt.notes && (
                                                <p className="text-xs text-[var(--text-secondary)] italic mt-1 max-w-xs truncate" title={appt.notes}>
                                                    "{appt.notes}"
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="flex items-center gap-1 font-semibold text-[var(--text-main)] text-xs">
                                                <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> {appt.preferred_date}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mt-0.5">
                                                <Clock className="w-3.5 h-3.5" /> {appt.time_slot}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                appt.status === 'completed'
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : appt.status === 'cancelled'
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            {appt.status === 'confirmed' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateAppointmentStatus(appt.id, 'completed')}
                                                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                                        title="Mark visit completed"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" /> Completed
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateAppointmentStatus(appt.id, 'cancelled')}
                                                        className="flex items-center gap-1 bg-rose-600/80 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                                        title="Cancel appointment"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" /> Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[var(--text-secondary)] italic">Archived</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OnlineRequests;
