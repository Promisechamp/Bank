import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, accountsAPI, transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import { 
  Users, 
  Search, 
  Eye, 
  Edit2, 
  Loader2,
  UserPlus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Mail,
  Lock,
  User,
  Phone,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  Wallet,
  Lock as LockIcon,
  Unlock as UnlockIcon
} from 'lucide-react';
import { formatDate, getStatusColor, formatCurrency } from '../../utils/helpers.js';

// ============================================
// ACTION MENU COMPONENT
// ============================================
const ActionMenu = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    if (action.onClick) action.onClick();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
          >
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className={`w-full px-4 py-2 text-sm text-left flex items-center space-x-2 transition-colors ${
                  action.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                <span>{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// ADD USER MODAL CONTENT
// ============================================
const AddUserContent = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
      });
      if (response.success) {
        toast.success(`User ${formData.full_name} created successfully!`);
        onSuccess();
        onClose();
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (error) {
      setError(error.message || 'Failed to create user');
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="John Doe"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="john.doe@email.com"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="+1-555-0101"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
            required
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          <span>{loading ? 'Creating...' : 'Create User'}</span>
        </button>
      </div>
    </form>
  );
};

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
// MAIN USERS LIST COMPONENT
// ============================================
const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, accountsRes] = await Promise.all([
        authAPI.getAllUsers(),
        accountsAPI.adminGetAll()
      ]);
      setUsers(usersRes.users || []);
      setAllAccounts(accountsRes.accounts || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccounts = async (userId) => {
    try {
      const response = await accountsAPI.adminGetAll();
      const accounts = (response.accounts || []).filter(acc => acc.user_id === userId);
      setUserAccounts(accounts);
    } catch (error) {
      toast.error('Failed to load user accounts');
      setUserAccounts([]);
    }
  };

  const getUserAccountStatus = (userId) => {
    const userAccs = allAccounts.filter(acc => acc.user_id === userId);
    if (userAccs.length === 0) return { status: 'No accounts', color: 'bg-gray-100 text-gray-800' };
    if (userAccs.some(acc => acc.status === 'banned')) {
      return { status: 'Banned', color: 'bg-red-100 text-red-800' };
    }
    if (userAccs.some(acc => acc.status === 'frozen')) {
      return { status: 'Frozen', color: 'bg-blue-100 text-blue-800' };
    }
    if (userAccs.some(acc => acc.status === 'closed')) {
      return { status: 'Closed', color: 'bg-gray-100 text-gray-800' };
    }
    if (userAccs.every(acc => acc.status === 'active')) {
      return { status: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'Mixed', color: 'bg-yellow-100 text-yellow-800' };
  };

  const getFreezeActionLabel = (userId) => {
    const userAccs = allAccounts.filter(acc => acc.user_id === userId);
    if (userAccs.some(acc => acc.status === 'frozen' || acc.status === 'banned')) {
      return { label: 'Unfreeze All Accounts', icon: UnlockIcon, action: 'unfreeze' };
    }
    return { label: 'Freeze All Accounts', icon: LockIcon, action: 'freeze' };
  };

  const handleFreezeUnfreezeAll = async (user) => {
    const userAccs = allAccounts.filter(acc => acc.user_id === user.id);
    const isFrozen = userAccs.some(acc => acc.status === 'frozen' || acc.status === 'banned');
    const newStatus = isFrozen ? 'active' : 'frozen';
    
    setModalType('confirm');
    setModalContent({
      title: `${isFrozen ? 'Unfreeze' : 'Freeze'} All Accounts`,
      message: `Are you sure you want to ${isFrozen ? 'unfreeze' : 'freeze'} all accounts of ${user.full_name}?`,
      type: isFrozen ? 'info' : 'warning',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await Promise.all(
            userAccs.map(acc => accountsAPI.adminUpdateStatus(acc.id, newStatus))
          );
          toast.success(`All accounts ${isFrozen ? 'unfrozen' : 'frozen'} successfully!`);
          fetchData();
          setModalOpen(false);
        } catch (error) {
          toast.error(error.error || 'Failed to update accounts');
        } finally {
          setModalLoading(false);
        }
      }
    });
    setModalOpen(true);
  };

  const showConfirmModal = (title, message, onConfirm, type = 'danger') => {
    setModalType('confirm');
    setModalContent({ title, message, type, onConfirm });
    setModalOpen(true);
  };

  const showAddUserModal = () => {
    setModalType('add');
    setModalContent(null);
    setModalOpen(true);
  };

  const showCreditModal = (user) => {
    setSelectedUser(user);
    fetchUserAccounts(user.id);
    setModalType('credit');
    setModalOpen(true);
  };

  const showDebitModal = (user) => {
    setSelectedUser(user);
    fetchUserAccounts(user.id);
    setModalType('debit');
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!modalContent) return;
    setModalLoading(true);
    try {
      await modalContent.onConfirm();
    } catch (error) {
      toast.error(error.message || 'Action failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUserAction = (userId, action) => {
    const user = users.find(u => u.id === userId);
    const actionMap = {
      delete: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user?.full_name}? This action cannot be undone.`,
        action: async () => {
          await authAPI.deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
        }
      }
    };
    const config = actionMap[action];
    if (config) {
      showConfirmModal(
        config.title,
        config.message,
        config.action,
        'danger'
      );
    }
  };

  // Filter & pagination
  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 text-sm">Manage all banking users</p>
        </div>
        <button 
          onClick={showAddUserModal}
          className="btn-primary flex items-center justify-center space-x-2 px-4 py-2 text-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-3">
        {currentUsers.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          currentUsers.map((user) => {
            const accountStatus = getUserAccountStatus(user.id);
            const freezeAction = getFreezeActionLabel(user.id);
            return (
              <div key={user.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-600">{user.full_name?.charAt(0) || 'U'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${accountStatus.color}`}>
                    <Wallet className="h-3 w-3 inline mr-1" />
                    {accountStatus.status}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Joined {formatDate(user.created_at)}</span>
                  <ActionMenu
                    actions={[
                      { label: 'View Details', icon: Eye, onClick: () => navigate(`/admin/users/${user.id}`) },
                      { label: 'Edit User', icon: Edit2, onClick: () => navigate(`/admin/users/${user.id}/edit`) },
                      { label: 'Credit Account', icon: TrendingUp, onClick: () => showCreditModal(user) },
                      { label: 'Debit Account', icon: TrendingDown, onClick: () => showDebitModal(user) },
                      { label: freezeAction.label, icon: freezeAction.icon, onClick: () => handleFreezeUnfreezeAll(user) },
                      { label: 'Delete', icon: AlertCircle, danger: true, onClick: () => handleUserAction(user.id, 'delete') }
                    ]}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Account Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => {
              const accountStatus = getUserAccountStatus(user.id);
              const freezeAction = getFreezeActionLabel(user.id);
              return (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-600">{user.full_name?.charAt(0) || 'U'}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${accountStatus.color}`}>
                      <Wallet className="h-3 w-3 inline mr-1" />
                      {accountStatus.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end">
                      <ActionMenu
                        actions={[
                          { label: 'View Details', icon: Eye, onClick: () => navigate(`/admin/users/${user.id}`) },
                          { label: 'Edit User', icon: Edit2, onClick: () => navigate(`/admin/users/${user.id}/edit`) },
                          { label: 'Credit Account', icon: TrendingUp, onClick: () => showCreditModal(user) },
                          { label: 'Debit Account', icon: TrendingDown, onClick: () => showDebitModal(user) },
                          { label: freezeAction.label, icon: freezeAction.icon, onClick: () => handleFreezeUnfreezeAll(user) },
                          { label: 'Delete', icon: AlertCircle, danger: true, onClick: () => handleUserAction(user.id, 'delete') }
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredUsers.length > usersPerPage && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm text-gray-600">
            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
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
          MODALS
          ============================================ */}

      {/* Add User Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'add'}
        onClose={() => setModalOpen(false)}
        title="Add New User"
        subtitle="Create a new banking user"
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        <AddUserContent onClose={() => setModalOpen(false)} onSuccess={fetchData} />
      </Modal>

      {/* Credit Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'credit'}
        onClose={() => setModalOpen(false)}
        title="Credit Account"
        subtitle={`Add funds to ${selectedUser?.full_name}'s account`}
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {selectedUser && (
          <CreditModalContent
            user={selectedUser}
            accounts={userAccounts}
            onClose={() => setModalOpen(false)}
            onSuccess={fetchData}
          />
        )}
      </Modal>

      {/* Debit Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'debit'}
        onClose={() => setModalOpen(false)}
        title="Debit Account"
        subtitle={`Withdraw funds from ${selectedUser?.full_name}'s account`}
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {selectedUser && (
          <DebitModalContent
            user={selectedUser}
            accounts={userAccounts}
            onClose={() => setModalOpen(false)}
            onSuccess={fetchData}
          />
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'confirm'}
        onClose={() => setModalOpen(false)}
        title={modalContent?.title || 'Confirm'}
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {modalContent && (
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-full ${modalContent.type === 'danger' ? 'bg-red-50' : modalContent.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                <AlertCircle className={`h-6 w-6 ${modalContent.type === 'danger' ? 'text-red-600' : modalContent.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{modalContent.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{modalContent.message}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)} disabled={modalLoading} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleConfirm} disabled={modalLoading} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${modalContent.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : modalContent.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 flex items-center space-x-2`}>
                {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{modalLoading ? 'Processing...' : 'Confirm'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersList;