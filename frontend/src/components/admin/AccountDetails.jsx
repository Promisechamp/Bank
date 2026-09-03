import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { 
  ArrowLeft,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  History,
  User,
  CreditCard,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Copy,
  Shield,
  Building,
  Eye,
  Ban,
  RotateCcw,
  Trash2,
  Edit2,
  Save
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

// ============================================
// EDIT TRANSACTION MODAL
// ============================================
const EditTransactionModal = ({ transaction, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: Math.abs(transaction.amount),
    description: transaction.description || '',
    date: transaction.created_at ? transaction.created_at.slice(0,10) : '',
    status: transaction.status || 'pending',
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
    setLoading(true);
    try {
      await transactionsAPI.updateTransaction(transaction.id, {
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        status: formData.status,
      });
      toast.success('Transaction updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.error || 'Failed to update transaction');
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Transaction description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
};

// ============================================
// MAIN ACCOUNT DETAILS
// ============================================
const AccountDetails = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchAccountDetails();
  }, [accountId]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch account details
      const accountData = await accountsAPI.adminGetOne(accountId);
      setAccount(accountData.account);

      // 2. Fetch transactions using admin endpoint with account filter
      try {
        const txData = await transactionsAPI.adminGetAll({ accountId, limit: 50 });
        setTransactions(txData.transactions || []);
      } catch (txError) {
        console.error('Failed to load transactions:', txError);
        toast.warning('Could not load transaction history');
        setTransactions([]);
      }
    } catch (error) {
      setError('Failed to load account details');
      toast.error('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = () => {
    const newStatus = account.status === 'active' ? 'frozen' : 'active';
    setModalContent({
      title: `${newStatus === 'frozen' ? 'Freeze' : 'Unfreeze'} Account`,
      message: `Are you sure you want to ${newStatus} account ${account.account_number}? ${newStatus === 'frozen' ? 'This will prevent any transactions.' : 'This will restore full access.'}`,
      type: newStatus === 'frozen' ? 'warning' : 'info',
      confirmText: newStatus === 'frozen' ? 'Freeze' : 'Unfreeze',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await accountsAPI.adminUpdateStatus(accountId, newStatus);
          setAccount({ ...account, status: newStatus });
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

  const handleBanAccount = () => {
    const newStatus = account.status === 'banned' ? 'active' : 'banned';
    setModalContent({
      title: `${newStatus === 'banned' ? 'Ban' : 'Unban'} Account`,
      message: `Are you sure you want to ${newStatus} account ${account.account_number}? ${newStatus === 'banned' ? 'This will prevent all transactions.' : 'This will restore full access.'}`,
      type: newStatus === 'banned' ? 'danger' : 'info',
      confirmText: newStatus === 'banned' ? 'Ban' : 'Unban',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await accountsAPI.adminUpdateStatus(accountId, newStatus);
          setAccount({ ...account, status: newStatus });
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

  const handleDeleteAccount = () => {
    setModalContent({
      title: 'Delete Account',
      message: `Are you sure you want to delete account ${account.account_number}? This will permanently delete the account and all associated transactions. The user will not be affected.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await accountsAPI.adminDelete(accountId);
          toast.success('Account deleted successfully!');
          navigate('/admin/accounts');
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

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'credit':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'debit':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleEditTransaction = (tx) => {
    setSelectedTransaction(tx);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchAccountDetails(); // refresh transactions
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Account Not Found</h3>
        <p className="text-gray-500 mt-2">The account you're looking for doesn't exist</p>
        <button onClick={() => navigate('/admin/accounts')} className="btn-primary mt-6">
          Back to Accounts
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
            onClick={() => navigate('/admin/accounts')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Details</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-mono font-medium text-gray-700">{account.account_number}</span>
              <button
                onClick={() => copyToClipboard(account.account_number)}
                className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                title="Copy account number"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {account.profiles && (
              <p className="text-sm text-gray-500 mt-1">
                Owner: {account.profiles.full_name} ({account.profiles.email})
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleToggleLock}
            className={`px-4 py-2 rounded-xl text-white font-medium transition-all flex items-center space-x-2 ${
              account.status === 'active' 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {account.status === 'active' ? (
              <>
                <Lock className="h-4 w-4" />
                <span>Freeze</span>
              </>
            ) : account.status === 'frozen' ? (
              <>
                <Unlock className="h-4 w-4" />
                <span>Unfreeze</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Unfreeze</span>
              </>
            )}
          </button>
          <button
            onClick={handleBanAccount}
            className={`px-4 py-2 rounded-xl text-white font-medium transition-all flex items-center space-x-2 ${
              account.status === 'banned' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {account.status === 'banned' ? (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Unban</span>
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                <span>Ban</span>
              </>
            )}
          </button>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 rounded-xl text-white font-medium bg-red-600 hover:bg-red-700 transition-all flex items-center space-x-2"
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

      {/* Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center space-x-4 ${
        account.status === 'active' ? 'bg-green-50 border-green-200' :
        account.status === 'frozen' ? 'bg-yellow-50 border-yellow-200' :
        account.status === 'banned' ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div className={`p-2 rounded-lg ${
          account.status === 'active' ? 'bg-green-100' :
          account.status === 'frozen' ? 'bg-yellow-100' :
          account.status === 'banned' ? 'bg-red-100' :
          'bg-gray-100'
        }`}>
          {account.status === 'active' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : account.status === 'frozen' ? (
            <Lock className="h-5 w-5 text-yellow-600" />
          ) : account.status === 'banned' ? (
            <Ban className="h-5 w-5 text-red-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-gray-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 capitalize">Account is {account.status}</p>
          <p className="text-sm text-gray-600">
            {account.status === 'active' ? 'This account is fully operational and can process transactions.' :
             account.status === 'frozen' ? 'This account is frozen. No transactions can be processed.' :
             account.status === 'banned' ? 'This account is permanently banned.' :
             'This account is closed.'}
          </p>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Wallet className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Balance</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Building className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Type</p>
          </div>
          <p className="text-lg font-medium capitalize text-gray-900">{account.account_type}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Shield className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Status</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(account.status)}`}>
            {account.status}
          </span>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center space-x-2 text-gray-500 mb-3">
          <User className="h-4 w-4" />
          <p className="text-xs font-medium uppercase tracking-wider">Account Owner</p>
        </div>
        {account.profiles ? (
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-600">
                {account.profiles.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{account.profiles.full_name}</p>
              <p className="text-sm text-gray-500">{account.profiles.email}</p>
              <p className="text-xs text-gray-400">{account.profiles.phone || 'No phone'}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(account.profiles.status)}`}>
                  {account.profiles.status || 'active'}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400 capitalize">{account.profiles.role || 'user'}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">User information not available</p>
        )}
      </div>

      {/* Additional Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Calendar className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Created</p>
          </div>
          <p className="text-sm font-medium text-gray-900">{formatDate(account.created_at)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Clock className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Last Updated</p>
          </div>
          <p className="text-sm font-medium text-gray-900">{account.updated_at ? formatDate(account.updated_at) : 'Never'}</p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          </div>
          <span className="text-sm text-gray-500">{transactions.length} transactions</span>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found for this account</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.slice(0, 20).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    tx.transaction_type === 'credit' 
                      ? 'bg-green-50 text-green-600' 
                      : tx.transaction_type === 'debit' 
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {getTransactionIcon(tx.transaction_type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs text-gray-500">{formatDate(tx.created_at)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditTransaction(tx)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit transaction"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/transactions/${tx.id}`)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <div className="text-right">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================
          CONFIRM MODAL (for Freeze/Ban/Delete)
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
                modalContent.type === 'warning' ? 'bg-yellow-50' : 
                'bg-blue-50'
              } flex-shrink-0`}>
                {modalContent.type === 'danger' ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : modalContent.type === 'warning' ? (
                  <Lock className="h-6 w-6 text-yellow-600" />
                ) : (
                  <Unlock className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{modalContent.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{modalContent.message}</p>
                {account && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Account</p>
                        <p className="text-sm font-mono font-medium">{account.account_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p className="text-sm font-bold">{formatCurrency(account.balance)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm font-medium capitalize">{account.account_type}</p>
                      </div>
                      {account.profiles && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Owner</p>
                          <p className="text-sm font-medium">{account.profiles.full_name}</p>
                        </div>
                      )}
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

      {/* ============================================
          EDIT TRANSACTION MODAL
          ============================================ */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Transaction"
        subtitle="Update transaction details"
        size="md"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {selectedTransaction && (
          <EditTransactionModal
            transaction={selectedTransaction}
            onClose={() => setEditModalOpen(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>
    </motion.div>
  );
};

export default AccountDetails;