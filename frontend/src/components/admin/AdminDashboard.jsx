import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI, adminAPI } from '../../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  Users,
  Wallet,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Plus,
  Eye,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  ChevronRight,
  ChevronDown,
  User,
  Search,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    totalVolume: 0,
    pendingTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    account_type: 'checking',
    user_id: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // User dropdown states
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const accountsData = await accountsAPI.getAll();
      const accounts = accountsData.accounts || [];
      
      let allTransactions = [];
      let totalVolume = 0;
      let pendingCount = 0;

      if (accounts.length > 0) {
        const txData = await transactionsAPI.getHistory(accounts[0].id, { limit: 50 });
        allTransactions = txData.transactions || [];
        totalVolume = allTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        pendingCount = allTransactions.filter(tx => tx.status === 'pending').length;
        setRecentTransactions(allTransactions.slice(0, 5));
      }

      try {
        const statsData = await adminAPI.getStats();
        setStats({
          totalUsers: statsData.stats?.totalUsers || 0,
          totalAccounts: statsData.stats?.totalAccounts || accounts.length,
          totalTransactions: statsData.stats?.totalTransactions || allTransactions.length,
          totalVolume: statsData.stats?.totalVolume || totalVolume,
          pendingTransactions: statsData.stats?.pendingTransactions || pendingCount,
        });
      } catch (e) {
        setStats({
          totalUsers: users.length || 0,
          totalAccounts: accounts.length,
          totalTransactions: allTransactions.length,
          totalVolume: totalVolume,
          pendingTransactions: pendingCount,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateError('');
    
    if (!formData.user_id) {
      setCreateError('Please select a user');
      return;
    }

    setCreateLoading(true);
    try {
      await accountsAPI.create({
        account_type: formData.account_type,
        user_id: formData.user_id
      });
      toast.success('Account created successfully!');
      setShowCreateModal(false);
      setFormData({ account_type: 'checking', user_id: '' });
      setUserSearch('');
      fetchStats();
    } catch (error) {
      setCreateError(error.error || 'Failed to create account');
      toast.error(error.error || 'Failed to create account');
    } finally {
      setCreateLoading(false);
    }
  };

  const selectUser = (userId) => {
    setFormData(prev => ({ ...prev, user_id: userId }));
    const selected = users.find(u => u.id === userId);
    setUserSearch(selected ? selected.full_name : '');
    setIsUserDropdownOpen(false);
  };

  const clearUserSelection = () => {
    setFormData(prev => ({ ...prev, user_id: '' }));
    setUserSearch('');
  };

  const getSelectedUser = () => {
    return users.find(u => u.id === formData.user_id);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-200'
    },
    {
      label: 'Total Accounts',
      value: stats.totalAccounts,
      icon: Building,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-200'
    },
    {
      label: 'Total Transactions',
      value: stats.totalTransactions,
      icon: History,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-purple-200'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingTransactions,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
      border: 'border-yellow-200'
    },
  ];

  const quickActions = [
    { label: 'View All Users', icon: Users, path: '/admin/users', color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Approvals', icon: Clock, path: '/admin/transactions?status=pending', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Create Account', icon: Plus, action: () => setShowCreateModal(true), color: 'bg-green-50 text-green-600' },
    { label: 'View Reports', icon: TrendingUp, path: '#', color: 'bg-purple-50 text-purple-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of the entire banking system</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Account</span>
          </button>
          <button
            onClick={fetchStats}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl border ${stat.border} p-4 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Total Volume</h3>
          <p className="text-3xl font-bold text-primary-600">
            {formatCurrency(stats.totalVolume)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Across all accounts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  if (action.path) {
                    navigate(action.path);
                  } else if (action.action) {
                    action.action();
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className={`p-1.5 rounded-lg ${action.color}`}>
                  <action.icon className="h-3.5 w-3.5" />
                </div>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <button
            onClick={() => navigate('/admin/transactions')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recent transactions</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    tx.transaction_type === 'credit' 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {tx.transaction_type === 'credit' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">{tx.reference_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.transaction_type === 'credit' ? '+' : '-'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          CREATE ACCOUNT MODAL WITH COOL DROPDOWN
          ============================================ */}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Account"
        subtitle="Assign a new account to a user"
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {createError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{createError}</span>
            </div>
          )}

          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, account_type: 'checking' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.account_type === 'checking'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  formData.account_type === 'checking' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Wallet className={`h-5 w-5 ${formData.account_type === 'checking' ? 'text-primary-600' : 'text-gray-400'}`} />
                </div>
                <span className="font-medium">Checking</span>
                <p className="text-xs text-gray-500 mt-1">Everyday spending</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, account_type: 'savings' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.account_type === 'savings'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  formData.account_type === 'savings' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <TrendingUp className={`h-5 w-5 ${formData.account_type === 'savings' ? 'text-primary-600' : 'text-gray-400'}`} />
                </div>
                <span className="font-medium">Savings</span>
                <p className="text-xs text-gray-500 mt-1">Earn interest</p>
              </button>
            </div>
          </div>

          {/* User Selection - Custom Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to User
            </label>
            {users.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-sm text-yellow-700 mb-2">No users available</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    navigate('/admin/users');
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Create a user first
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2 border rounded-xl cursor-pointer transition-all ${
                    isUserDropdownOpen 
                      ? 'border-primary-500 ring-2 ring-primary-500/20' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <User className="h-4 w-4 text-gray-400" />
                    {formData.user_id && getSelectedUser() ? (
                      <span className="text-sm text-gray-700">
                        {getSelectedUser().full_name}
                        <span className="text-xs text-gray-400 ml-2">
                          ({getSelectedUser().email})
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Select a user...</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {formData.user_id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearUserSelection();
                        }}
                        className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isUserDropdownOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No users found
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectUser(user.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              formData.user_id === user.id ? 'bg-primary-50' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              formData.user_id === user.id 
                                ? 'bg-primary-100 text-primary-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            {formData.user_id === user.id && (
                              <CheckCircle className="h-4 w-4 text-primary-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected User Preview */}
          {formData.user_id && getSelectedUser() && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary-50 border border-primary-200 rounded-xl p-3 flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                {getSelectedUser().full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{getSelectedUser().full_name}</p>
                <p className="text-xs text-gray-500">{getSelectedUser().email}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-primary-600" />
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setUserSearch('');
                setFormData({ account_type: 'checking', user_id: '' });
              }}
              disabled={createLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || users.length === 0 || !formData.user_id}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default AdminDashboard;