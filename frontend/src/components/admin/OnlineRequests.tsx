import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PawnRequest } from '../../lib/supabase';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from '../../utils/toast';

interface OnlineRequestsProps {
    onApprove: (request: PawnRequest) => void;
}

const OnlineRequests: React.FC<OnlineRequestsProps> = ({ onApprove }) => {
    const [requests, setRequests] = useState<PawnRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            // 1. Fetch Requests
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

            // 2. Fetch Profiles for these requests
            const userIds = Array.from(new Set(requestsData.map(r => r.user_id)));
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone')
                .in('id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                // Continue without profiles if error, but log it
            }

            // 3. Merge Data
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

    if (loading && requests.length === 0) {
        return (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-12 text-center shadow-sm">
                <div className="flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-[var(--gold-primary)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Loading online pawn requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-main)]">Online Pawn Requests</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Review and approve online digital pawn appraisal requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors"
                        title="Refresh requests"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold">
                        {requests.length} Pending
                    </span>
                </div>
            </div>

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
                                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                            >
                                                <CheckCircle className="h-4 w-4" /> Convert to Pledge
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
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
        </div>
    );
};

export default OnlineRequests;
