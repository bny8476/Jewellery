import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, User } from 'lucide-react';
import StaffEntryForm from './StaffEntryForm';
import { supabase } from '../../lib/supabase';
import { AppUser } from '../../types/pawnshop';
import { toast } from '../../utils/toast';

const UserSection: React.FC = () => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const { error } = await supabase
                .from('app_users')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('User deleted successfully');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.username.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.phone || '').includes(searchQuery)
    );

    if (showForm) {
        return (
            <StaffEntryForm
                onSuccess={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                    loadUsers();
                }}
                onCancel={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                }}
                initialData={selectedUser}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-[26px] font-semibold text-[var(--text-main)] tracking-tight admin-page-heading">Staff &amp; App Roles</h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manage store associates, appraisers, cashiers, and branch security permissions</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setShowForm(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2.5 bg-[var(--gold-primary)] text-black rounded-xl hover:opacity-90 transition-opacity font-semibold text-xs shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add New Staff Member</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-[var(--bg-card)] p-4 rounded-2xl shadow-sm border border-[var(--border-color)]">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search by name, username, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-[var(--gold-primary)]"
                    />
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] font-semibold border-b border-[var(--border-color)]">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Designation</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">Loading user profiles...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">No staff members found matching search.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                        <td className="p-4 flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 flex items-center justify-center overflow-hidden shrink-0">
                                                {user.photo_url ? (
                                                    <img src={user.photo_url} alt={user.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-[var(--gold-primary)]" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-[var(--text-main)]">{user.full_name}</p>
                                                <p className="text-[11px] text-[var(--text-secondary)]">@{user.username}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-[var(--text-main)]">
                                            <div className="font-medium">{user.designation || '-'}</div>
                                            <div className="text-[11px] text-[var(--text-secondary)]">{user.qualification}</div>
                                        </td>
                                        <td className="p-4 text-xs text-[var(--text-main)]">
                                            <div className="font-mono">{user.phone || '-'}</div>
                                            <div className="text-[11px] text-[var(--text-secondary)]">{user.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border ${
                                                user.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                user.role === 'manager' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.is_blocked ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                    Blocked
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowForm(true);
                                                    }}
                                                    className="p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)] rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1.5 hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-rose-400 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
        </div>
    );
};

export default UserSection;
