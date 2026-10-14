import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PawnRequest } from '../../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Online Pawn Requests</h3>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                    {requests.length} Pending
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-black text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Item Description</th>
                            <th className="p-4">Requested Amount</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No pending requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm font-medium text-gray-900">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 font-mono text-xs">
                                        {(req as any).profiles?.full_name || (req as any).profiles?.email || req.user_id}
                                    </td>
                                    <td className="p-4 text-sm text-gray-900 font-medium">
                                        {req.item_description}
                                    </td>
                                    <td className="p-4 text-sm text-gray-900 font-bold">
                                        ₹{req.requested_amount.toLocaleString()}
                                    </td>
                                    <td className="p-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => onApprove(req)}
                                            className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                                        >
                                            <CheckCircle className="h-4 w-4" /> Convert to Pledge
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                        >
                                            <XCircle className="h-4 w-4" /> Reject
                                        </button>
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
