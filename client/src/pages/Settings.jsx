import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  FiSettings,
  FiUser,
  FiUsers,
  FiUserCheck,
  FiTrash2,
  FiLock,
  FiShield,
} from 'react-icons/fi';

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const { showToast, confirmAction } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await API.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/auth/users/${userId}/role`, { role: newRole });
      showToast('User role updated successfully!', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update user role.', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirm = await confirmAction({
      title: 'Delete User Account',
      message: 'Are you sure you want to delete this user account? They will lose access immediately.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel'
    });

    if (!confirm) return;

    try {
      await API.delete(`/auth/users/${userId}`);
      showToast('User account deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN: CURRENT USER PROFILE CARD */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center space-x-2">
            <FiUser className="text-gray-400" />
            <h2 className="text-base font-bold text-gray-800">Your Profile Account</h2>
          </div>

          <div className="flex flex-col items-center py-4 text-center">
            <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-2xl flex items-center justify-center shadow-inner">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-base font-extrabold text-gray-800 mt-3">{user?.name}</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider mt-3">
              {user?.role.replace('_', ' ')}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-3 text-xs text-gray-400 flex items-center space-x-2">
            <FiShield />
            <span>Role restrictions are enforced across all actions.</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: USER MANAGEMENT (ADMIN ONLY) */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl border border-gray-250 shadow-sm p-6 flex flex-col min-h-[400px]">
          <div className="border-b border-gray-150 pb-3 flex items-center space-x-2">
            <FiUsers className="text-gray-400" />
            <h2 className="text-base font-bold text-gray-800">System Users & Roles</h2>
          </div>

          {!isAdmin ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 text-sm">
              <FiLock size={32} className="text-gray-300 mb-2" />
              <p>System User administration and role changing is restricted to Admins.</p>
            </div>
          ) : error ? (
            <div className="p-4 text-rose-600 text-xs">{error}</div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-lg mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-250 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">User Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {users.map((u) => {
                    const isSelf = u.id === user.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-855">
                          {u.name} {isSelf && <span className="text-[10px] text-gray-400 font-normal italic">(You)</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed font-medium text-gray-750"
                          >
                            <option value="VIEWER">Viewer</option>
                            <option value="KITCHEN_STAFF">Kitchen Staff</option>
                            <option value="STORE_MANAGER">Store Manager</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={isSelf}
                            className="p-1 text-red-650 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? 'Cannot delete yourself' : 'Delete user account'}
                          >
                            <FiTrash2 size={14} className="inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
