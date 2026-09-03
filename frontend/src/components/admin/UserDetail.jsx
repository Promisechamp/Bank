import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, accountsAPI, transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  History,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit2,
  Save,
  X,
  Shield,
  Building,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  Key,
  Calendar as CalendarIcon,
  Globe,
  UserCheck,
  Trash2,
  Eye,
  EyeOff,
  Home,
  Flag
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user details from API
      const userResponse = await authAPI.getUserById(userId);
      setUser(userResponse.user);
      setFormData(userResponse.user);
      
      // Reset password fields
      setShowPassword(false);
      setNewPassword('');
      
      // Get ALL accounts from admin endpoint, then filter by user
      const accountsResponse = await accountsAPI.adminGetAll();
      const userAccounts = (accountsResponse.accounts || []).filter(
        acc => acc.user_id === userId
      );
      setAccounts(userAccounts);
      
      // Get transactions for each account
      let allTransactions = [];
      for (const account of userAccounts) {
        try {
          const txResponse = await transactionsAPI.getHistory(account.id, { limit: 10 });
          allTransactions = [...allTransactions, ...(txResponse.transactions || [])];
        } catch (e) {
          // Skip if no transactions
        }
      }
      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(allTransactions.slice(0, 10));
      
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError(error.error || 'Failed to load user details');
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setModalLoading(true);
      
      const updateData = { ...formData };
      
      // Include new password if set
      if (newPassword && newPassword.length > 0) {
        updateData.password = newPassword;
        setUser(prev => ({ ...prev, password: newPassword }));
      }
      
      await authAPI.updateUser(userId, updateData);
      
      setSuccess('User updated successfully!');
      toast.success('User updated successfully!');
      setIsEditing(false);
      setEditModalOpen(false);
      setNewPassword('');
      
      // Refresh user data
      await fetchUserDetails();
      
    } catch (error) {
      setError(error.error || 'Failed to update user');
      toast.error(error.error || 'Failed to update user');
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModal = () => {
    setFormData(user);
    setNewPassword('');
    setShowPassword(false);
    setEditModalOpen(true);
  };

  const handleStatusToggle = () => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    setModalType('confirm');
    setModalContent({
      title: `${newStatus === 'active' ? 'Activate' : 'Suspend'} User`,
      message: `Are you sure you want to ${newStatus} ${user.full_name}?`,
      type: newStatus === 'suspended' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await authAPI.updateUserStatus(userId, newStatus);
          setUser({ ...user, status: newStatus });
          setSuccess(`User ${newStatus} successfully!`);
          toast.success(`User ${newStatus} successfully!`);
        } catch (error) {
          setError(error.error || `Failed to ${newStatus} user`);
          toast.error(error.error || `Failed to ${newStatus} user`);
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      }
    });
    setModalOpen(true);
  };

  const handleDeleteUser = () => {
    setModalType('confirm');
    setModalContent({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.full_name}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await authAPI.deleteUser(userId);
          toast.success('User deleted successfully!');
          navigate('/admin/users');
        } catch (error) {
          setError(error.error || 'Failed to delete user');
          toast.error(error.error || 'Failed to delete user');
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      }
    });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    if (!modalLoading) {
      setModalOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!modalContent) return;
    
    setModalLoading(true);
    try {
      await modalContent.onConfirm();
    } catch (error) {
      // Error handled in the specific action
    } finally {
      setModalLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const statCards = [
    {
      label: 'Total Balance',
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-200'
    },
    {
      label: 'Total Accounts',
      value: accounts.length,
      icon: Building,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-200'
    },
    {
      label: 'Total Transactions',
      value: transactions.length,
      icon: History,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-purple-200'
    },
    {
      label: 'Member Since',
      value: user?.created_at ? formatDate(user.created_at) : 'N/A',
      icon: Calendar,
      color: 'bg-orange-50 text-orange-600',
      border: 'border-orange-200'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="card text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Error Loading User</h3>
        <p className="text-gray-500 mt-2">{error}</p>
        <button onClick={() => navigate('/admin/users')} className="btn-primary mt-6">
          Back to Users
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card text-center py-16">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">User Not Found</h3>
        <p className="text-gray-500 mt-2">The user you're looking for doesn't exist</p>
        <button onClick={() => navigate('/admin/users')} className="btn-primary mt-6">
          Back to Users
        </button>
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            <p className="text-sm text-gray-500">View and manage user information</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openEditModal}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all flex items-center space-x-2"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit All</span>
          </button>
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all flex items-center space-x-2 ${
              user.status === 'active' 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>{user.status === 'active' ? 'Suspend' : 'Activate'}</span>
          </button>
          <button
            onClick={handleDeleteUser}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-all flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-start space-x-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{success}</span>
        </div>
      )}

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
            <p className="text-xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {user.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="mt-2 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                  {user.status || 'active'}
                </span>
              </div>
            </div>

            {/* All User Information */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Key className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Password</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {showPassword ? user.password : '••••••••'}
                      </p>
                      <button 
                        onClick={togglePasswordVisibility}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Date of Birth</p>
                    <p className="text-sm font-semibold text-gray-900">{user.date_of_birth || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Flag className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Country</p>
                    <p className="text-sm font-semibold text-gray-900">{user.country || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Home className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{user.address || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Role</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{user.role || 'User'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <UserCheck className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status || 'active'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Created At</p>
                    <p className="text-sm font-semibold text-gray-900">{user.created_at ? formatDate(user.created_at) : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Last Updated</p>
                    <p className="text-sm font-semibold text-gray-900">{user.updated_at ? formatDate(user.updated_at) : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-primary-600" />
            <span>User Accounts</span>
          </h3>
          <span className="text-sm text-gray-500">{accounts.length} accounts</span>
        </div>
        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No accounts found for this user</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/accounts/${account.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      account.account_type === 'checking' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-green-50 text-green-600'
                    }`}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{account.account_type}</p>
                      <p className="text-xs text-gray-500">#{account.account_number}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                    {account.status}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-3">
                  {formatCurrency(account.balance)}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Available balance</span>
                  <span className="text-xs text-primary-600 font-medium">View Details →</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <span>Recent Transactions</span>
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      tx.transaction_type === 'credit' 
                        ? 'bg-green-50 text-green-600' 
                        : tx.transaction_type === 'debit' 
                        ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {tx.transaction_type === 'credit' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : tx.transaction_type === 'debit' ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">{tx.created_at ? formatDate(tx.created_at) : 'N/A'}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${
                    tx.transaction_type === 'credit' ? 'text-green-600' : 
                    tx.transaction_type === 'debit' ? 'text-red-600' : 
                    'text-blue-600'
                  }`}>
                    {tx.transaction_type === 'credit' ? '+' : ''}
                    {tx.transaction_type === 'debit' ? '-' : ''}
                    {formatCurrency(Math.abs(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          EDIT USER MODAL
          ============================================ */}
      
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User"
        subtitle="Update all user information"
        size="lg"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="United States"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role || 'user'}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="2"
              placeholder="No 12, Example Street, Florida, United States"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status || 'active'}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                placeholder="Enter new password (leave blank to keep current)"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
            {user?.password && user.password !== '••••••••' && (
              <p className="text-xs text-green-600 mt-1">Current password: {user.password}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setEditModalOpen(false)}
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={modalLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {modalLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={modalContent?.title || 'Confirm'}
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {modalContent && (
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${
                modalContent.type === 'danger' ? 'bg-red-50' : 
                modalContent.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
              } flex-shrink-0`}>
                <AlertCircle className={`h-6 w-6 ${
                  modalContent.type === 'danger' ? 'text-red-600' : 
                  modalContent.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{modalContent.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{modalContent.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleModalClose}
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={modalLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  modalContent.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                  modalContent.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-primary-600 hover:bg-primary-700'
                } disabled:opacity-50 flex items-center space-x-2`}
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default UserDetail;