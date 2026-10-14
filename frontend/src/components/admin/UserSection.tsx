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
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setShowForm(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    <span>Add New User</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search by name, username, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Designation</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                                                {user.photo_url ? (
                                                    <img src={user.photo_url} alt={user.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-purple-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.full_name}</p>
                                                <p className="text-xs text-gray-500">@{user.username}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div>{user.designation || '-'}</div>
                                            <div className="text-xs text-gray-400">{user.qualification}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div>{user.phone || '-'}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                    user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.is_blocked ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                    Blocked
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">
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
                                                    className="p-1 hover:bg-blue-50 text-blue-600 rounded-md"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1 hover:bg-red-50 text-red-600 rounded-md"
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
