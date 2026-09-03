import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI, adminAPI } from '../../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { 
  Wallet, 
  Search, 
  Eye, 
  Lock, 
  Unlock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  User,
  MoreVertical,
  Trash2,
  Ban,
  RotateCcw,
  Bell,
  Plus,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { formatCurrency, formatAccountNumber, getStatusColor } from '../../utils/helpers';

// ============================================
// CREDIT MODAL CONTENT
// ============================================
const CreditModalContent = ({ user, accounts, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    sendAlert: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.account_id) {
      setError('Please select an account');
      return;
    }
    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }
    setLoading(true);
    try {
      await transactionsAPI.adminCredit({
        userId: user.id,
        accountId: formData.account_id,
        amount: amountNum,
        description: formData.description,
        date: formData.date,
        sendAlert: formData.sendAlert,
      });
      toast.success(`Credited ${formatCurrency(amountNum)} to ${user.full_name}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.error || err.message || 'Failed to credit account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Account *</label>
        <select
          name="account_id"
          value={formData.account_id}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        >
          <option value="">Choose an account...</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.account_type} - {acc.account_number} (Balance: {formatCurrency(acc.balance)})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD) *</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., Salary bonus"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="sendAlert"
          id="sendAlert"
          checked={formData.sendAlert}
          onChange={handleChange}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="sendAlert" className="text-sm text-gray-700 flex items-center">
          <Bell className="h-4 w-4 mr-1" />
          Send notification to user
        </label>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          <span>{loading ? 'Processing...' : 'Credit Account'}</span>
        </button>
      </div>
    </form>
  );
};

// ============================================
// DEBIT MODAL CONTENT
// ============================================
const DebitModalContent = ({ user, accounts, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    sendAlert: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.account_id) {
      setError('Please select an account');
      return;
    }
    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }
    setLoading(true);
    try {
      await transactionsAPI.adminDebit({
        userId: user.id,
        accountId: formData.account_id,
        amount: amountNum,
        description: formData.description,
        note: formData.note,
        date: formData.date,
        sendAlert: formData.sendAlert,
      });
      toast.success(`Debited ${formatCurrency(amountNum)} from ${user.full_name}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.error || err.message || 'Failed to debit account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Account *</label>
        <select
          name="account_id"
          value={formData.account_id}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        >
          <option value="">Choose an account...</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.account_type} - {acc.account_number} (Balance: {formatCurrency(acc.balance)})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD) *</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="0.00"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="e.g., ATM withdrawal"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Store address / Purchase invoice ID)</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="e.g., Store #123, Invoice INV-001"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="sendAlert"
          id="sendAlert"
          checked={formData.sendAlert}
          onChange={handleChange}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="sendAlert" className="text-sm text-gray-700 flex items-center">
          <Bell className="h-4 w-4 mr-1" />
          Send notification to user
        </label>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingDown className="h-4 w-4" />}
          <span>{loading ? 'Processing...' : 'Debit Account'}</span>
        </button>
      </div>
    </form>
  );
};

// ============================================
// MAIN ACCOUNTS LIST COMPONENT
// ============================================
const AccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [accountsPerPage] = useState(9);
  const navigate = useNavigate();

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Credit / Debit modal states
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [selectedAccountForTransaction, setSelectedAccountForTransaction] = useState(null);

  // Create Account modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [createFormData, setCreateFormData] = useState({
    account_type: 'checking',
    user_id: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // User dropdown states
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const dropdownRef = useRef(null);

  // Action Menu States
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // ------------------------------------------------------------
  // Fetch data
  // ------------------------------------------------------------
  useEffect(() => {
    fetchAccounts();
    fetchUsers();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.adminGetAll();
      setAccounts(data.accounts || []);
    } catch (error) {
      setError('Failed to load accounts');
      toast.error('Failed to load accounts');
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

  // ------------------------------------------------------------
  // Create account
  // ------------------------------------------------------------
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createFormData.user_id) {
      setCreateError('Please select a user');
      return;
    }
    setCreateLoading(true);
    try {
      await accountsAPI.create({
        account_type: createFormData.account_type,
        user_id: createFormData.user_id
      });
      toast.success('Account created successfully!');
      setShowCreateModal(false);
      setCreateFormData({ account_type: 'checking', user_id: '' });
      setUserSearch('');
      fetchAccounts();
    } catch (error) {
      setCreateError(error.error || 'Failed to create account');
      toast.error(error.error || 'Failed to create account');
    } finally {
      setCreateLoading(false);
    }
  };

  const selectUser = (userId) => {
    setCreateFormData(prev => ({ ...prev, user_id: userId }));
    const selected = users.find(u => u.id === userId);
    setUserSearch(selected ? selected.full_name : '');
    setIsUserDropdownOpen(false);
  };

  const clearUserSelection = () => {
    setCreateFormData(prev => ({ ...prev, user_id: '' }));
    setUserSearch('');
  };

  const getSelectedUser = () => {
    return users.find(u => u.id === createFormData.user_id);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

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

  // ------------------------------------------------------------
  // Credit / Debit handlers
  // ------------------------------------------------------------
  const openCreditModal = (account) => {
    setSelectedAccountForTransaction(account);
    setCreditModalOpen(true);
  };

  const openDebitModal = (account) => {
    setSelectedAccountForTransaction(account);
    setDebitModalOpen(true);
  };

  // ------------------------------------------------------------
  // Account status handlers (toggleLock, ban, delete)
  // ------------------------------------------------------------
  const handleToggleLock = (account) => {
    const newStatus = account.status === 'active' ? 'frozen' : 'active';
    setSelectedAccount(account);
    setModalContent({
      title: `${newStatus === 'frozen' ? 'Freeze' : 'Unfreeze'} Account`,
      message: `Are you sure you want to ${newStatus} account ${account.account_number}?`,
      type: newStatus === 'frozen' ? 'warning' : 'info',
      confirmText: newStatus === 'frozen' ? 'Freeze' : 'Unfreeze',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await accountsAPI.adminUpdateStatus(account.id, newStatus);
          setAccounts(accounts.map(acc => 
            acc.id === account.id ? { ...acc, status: newStatus } : acc
          ));
          setSuccess(`Account ${newStatus} successfully!`);
          toast.success(`Account ${newStatus} successfully!`);
        } catch (error) {
          setError('Failed to update account status');
          toast.error('Failed to update account status');
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      }
    });
    setModalOpen(true);
  };

  const handleBanAccount = (account) => {
    const newStatus = account.status === 'banned' ? 'active' : 'banned';
    setSelectedAccount(account);
    setModalContent({
      title: `${newStatus === 'banned' ? 'Ban' : 'Unban'} Account`,
      message: `Are you sure you want to ${newStatus} account ${account.account_number}? ${newStatus === 'banned' ? 'This will prevent all transactions.' : 'This will restore full access.'}`,
      type: newStatus === 'banned' ? 'danger' : 'info',
      confirmText: newStatus === 'banned' ? 'Ban' : 'Unban',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await accountsAPI.adminUpdateStatus(account.id, newStatus);
          setAccounts(accounts.map(acc => 
            acc.id === account.id ? { ...acc, status: newStatus } : acc
          ));
          setSuccess(`Account ${newStatus} successfully!`);
          toast.success(`Account ${newStatus} successfully!`);
        } catch (error) {
          setError('Failed to update account status');
          toast.error('Failed to update account status');
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      }
    });
    setModalOpen(true);
  };

  const handleDeleteAccount = (account) => {
    setSelectedAccount(account);
    setModalContent({
      title: 'Delete Account',
      message: `Are you sure you want to delete account ${account.account_number}? This will permanently delete the account and all associated transactions. The user will not be affected.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await accountsAPI.adminDelete(account.id);
          setAccounts(accounts.filter(acc => acc.id !== account.id));
          setSuccess('Account deleted successfully!');
          toast.success('Account deleted successfully!');
        } catch (error) {
          setError('Failed to delete account');
          toast.error('Failed to delete account');
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Account number copied!');
  };

  const toggleActionMenu = (accountId) => {
    setActionMenuOpen(actionMenuOpen === accountId ? null : accountId);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ------------------------------------------------------------
  // Stats & pagination
  // ------------------------------------------------------------
  const totalAccounts = accounts.length;
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
  const frozenAccounts = accounts.filter(acc => acc.status === 'frozen').length;
  const bannedAccounts = accounts.filter(acc => acc.status === 'banned').length;

  const statCards = [
    {
      label: 'Total Accounts',
      value: totalAccounts,
      icon: Building,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-200'
    },
    {
      label: 'Total Balance',
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-200'
    },
    {
      label: 'Active',
      value: activeAccounts,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-200'
    },
    {
      label: 'Frozen / Banned',
      value: frozenAccounts + bannedAccounts,
      icon: Ban,
      color: 'bg-red-50 text-red-600',
      border: 'border-red-200'
    }
  ];

  const filteredAccounts = accounts.filter(account =>
    account.account_number?.includes(search) ||
    account.account_type?.toLowerCase().includes(search.toLowerCase()) ||
    account.user_id?.toLowerCase().includes(search.toLowerCase()) ||
    account.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  const currentAccounts = filteredAccounts.slice(indexOfFirstAccount, indexOfLastAccount);
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading accounts...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500">Manage all user accounts</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Account</span>
          </button>
          <span className="text-sm text-gray-500">•</span>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{totalAccounts} accounts</span>
          </div>
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

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by account number, type, user, or owner name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Accounts Grid */}
      {currentAccounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No Accounts Found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-visible"
            >
              {/* Account Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      account.account_type === 'checking' 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'bg-green-50 text-green-600'
                    }`}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {account.account_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                      {account.status}
                    </span>
                    {/* Action Menu Button */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActionMenu(account.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {actionMenuOpen === account.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              navigate(`/admin/accounts/${account.id}`);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              openCreditModal(account);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span>Credit Account</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              openDebitModal(account);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span>Debit Account</span>
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              handleToggleLock(account);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            {account.status === 'active' ? (
                              <>
                                <Lock className="h-4 w-4 text-yellow-500" />
                                <span>Freeze Account</span>
                              </>
                            ) : account.status === 'frozen' ? (
                              <>
                                <Unlock className="h-4 w-4 text-green-500" />
                                <span>Unfreeze Account</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4 text-blue-500" />
                                <span>Unfreeze Account</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              handleBanAccount(account);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            {account.status === 'banned' ? (
                              <>
                                <RotateCcw className="h-4 w-4 text-green-500" />
                                <span>Unban Account</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4 text-red-500" />
                                <span>Ban Account</span>
                              </>
                            )}
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              setActionMenuOpen(null);
                              handleDeleteAccount(account);
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Account Number - Full */}
                <div className="mt-2 flex items-center space-x-2">
                  <p className="text-sm font-mono text-gray-600 font-medium tracking-wider">
                    {account.account_number}
                  </p>
                  <button
                    onClick={() => copyToClipboard(account.account_number)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                    title="Copy account number"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* User Info - Full Name */}
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span className="font-medium text-gray-700">
                    {account.profiles?.full_name || 'Unknown User'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">{account.user_id?.slice(0, 8)}...</span>
                </div>
                
                {/* Balance */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-medium">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>

              {/* Account Footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/admin/accounts/${account.id}`)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  View Details
                </button>
                <div className="flex items-center space-x-1">
                  {account.status === 'banned' && (
                    <span className="text-xs text-red-600 font-medium mr-2">BANNED</span>
                  )}
                  <button
                    onClick={() => openCreditModal(account)}
                    className="p-2 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                    title="Credit Account"
                  >
                    <TrendingUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDebitModal(account)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Debit Account"
                  >
                    <TrendingDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleLock(account)}
                    className={`p-2 rounded-lg transition-colors ${
                      account.status === 'active' 
                        ? 'text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700' 
                        : account.status === 'frozen'
                        ? 'text-green-600 hover:bg-green-50 hover:text-green-700'
                        : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                    title={account.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'}
                  >
                    {account.status === 'active' ? (
                      <Lock className="h-4 w-4" />
                    ) : account.status === 'frozen' ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredAccounts.length > accountsPerPage && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm text-gray-600">
            Showing {indexOfFirstAccount + 1} to {Math.min(indexOfLastAccount, filteredAccounts.length)} of {filteredAccounts.length} accounts
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  currentPage === number
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          CREATE ACCOUNT MODAL
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
                onClick={() => setCreateFormData(prev => ({ ...prev, account_type: 'checking' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  createFormData.account_type === 'checking'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  createFormData.account_type === 'checking' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Wallet className={`h-5 w-5 ${createFormData.account_type === 'checking' ? 'text-primary-600' : 'text-gray-400'}`} />
                </div>
                <span className="font-medium">Checking</span>
                <p className="text-xs text-gray-500 mt-1">Everyday spending</p>
              </button>

              <button
                type="button"
                onClick={() => setCreateFormData(prev => ({ ...prev, account_type: 'savings' }))}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  createFormData.account_type === 'savings'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  createFormData.account_type === 'savings' ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <TrendingUp className={`h-5 w-5 ${createFormData.account_type === 'savings' ? 'text-primary-600' : 'text-gray-400'}`} />
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
                    {createFormData.user_id && getSelectedUser() ? (
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
                    {createFormData.user_id && (
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
                              createFormData.user_id === user.id ? 'bg-primary-50' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              createFormData.user_id === user.id 
                                ? 'bg-primary-100 text-primary-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            {createFormData.user_id === user.id && (
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
          {createFormData.user_id && getSelectedUser() && (
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
                setCreateFormData({ account_type: 'checking', user_id: '' });
              }}
              disabled={createLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || users.length === 0 || !createFormData.user_id}
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

      {/* ============================================
          CREDIT MODAL
      ============================================ */}
      <Modal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        title="Credit Account"
        subtitle={`Add funds to ${selectedAccountForTransaction?.profiles?.full_name || 'user'}'s account`}
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {selectedAccountForTransaction && (
          <CreditModalContent
            user={{
              id: selectedAccountForTransaction.user_id,
              full_name: selectedAccountForTransaction.profiles?.full_name || 'User'
            }}
            accounts={[selectedAccountForTransaction]}
            onClose={() => setCreditModalOpen(false)}
            onSuccess={fetchAccounts}
          />
        )}
      </Modal>

      {/* ============================================
          DEBIT MODAL
      ============================================ */}
      <Modal
        isOpen={debitModalOpen}
        onClose={() => setDebitModalOpen(false)}
        title="Debit Account"
        subtitle={`Withdraw funds from ${selectedAccountForTransaction?.profiles?.full_name || 'user'}'s account`}
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {selectedAccountForTransaction && (
          <DebitModalContent
            user={{
              id: selectedAccountForTransaction.user_id,
              full_name: selectedAccountForTransaction.profiles?.full_name || 'User'
            }}
            accounts={[selectedAccountForTransaction]}
            onClose={() => setDebitModalOpen(false)}
            onSuccess={fetchAccounts}
          />
        )}
      </Modal>

      {/* ============================================
          CONFIRM MODAL (for freeze/ban/delete)
      ============================================ */}
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
                {selectedAccount && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Account Details</p>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <span className="text-sm font-medium text-gray-900 capitalize">{selectedAccount.account_type}</span>
                        <p className="text-xs font-mono text-gray-500">{selectedAccount.account_number}</p>
                        {selectedAccount.profiles && (
                          <p className="text-xs text-gray-500">Owner: {selectedAccount.profiles.full_name}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedAccount.balance)}</span>
                    </div>
                  </div>
                )}
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
                  <span>{modalContent.confirmText || 'Confirm'}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default AccountsList;