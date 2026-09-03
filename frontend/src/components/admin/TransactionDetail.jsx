import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Banknote,
  Hash,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Copy,
  Shield,
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
// MAIN TRANSACTION DETAIL
// ============================================
const TransactionDetail = () => {
  const { txId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [txId]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await transactionsAPI.adminGetById(txId);
      if (data.transaction) {
        setTransaction(data.transaction);
      } else {
        setError('Transaction not found');
      }
    } catch (err) {
      console.error('Fetch transaction error:', err);
      setError(err.error || 'Failed to load transaction');
      toast.error('Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setModalContent({
      title: 'Approve Transaction',
      message: 'Are you sure you want to approve this transaction? This action cannot be undone.',
      type: 'success',
      confirmText: 'Approve',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await transactionsAPI.adminApprove(txId);
          toast.success('Transaction approved successfully!');
          fetchTransaction();
        } catch (err) {
          setError(err.error || 'Failed to approve');
          toast.error(err.error || 'Failed to approve');
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      }
    });
    setModalOpen(true);
  };

  const handleReject = () => {
    setModalContent({
      title: 'Reject Transaction',
      message: 'Are you sure you want to reject this transaction? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Reject',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          await transactionsAPI.adminReject(txId);
          toast.success('Transaction rejected successfully!');
          fetchTransaction();
        } catch (err) {
          setError(err.error || 'Failed to reject');
          toast.error(err.error || 'Failed to reject');
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      }
    });
    setModalOpen(true);
  };

  const handleModalClose = () => {
    if (!modalLoading) setModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!modalContent) return;
    setModalLoading(true);
    try {
      await modalContent.onConfirm();
    } catch (error) {
      // handled in specific action
    } finally {
      setModalLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Reference ID copied!');
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'credit': return <TrendingUp className="h-6 w-6 text-green-600" />;
      case 'debit': return <TrendingDown className="h-6 w-6 text-red-600" />;
      case 'transfer': return <ArrowRight className="h-6 w-6 text-blue-600" />;
      default: return <Banknote className="h-6 w-6 text-gray-600" />;
    }
  };

  const getTransactionTypeColor = (type) => {
    switch(type) {
      case 'credit': return 'bg-green-50 text-green-700 border-green-200';
      case 'debit': return 'bg-red-50 text-red-700 border-red-200';
      case 'transfer': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">Transaction Not Found</h3>
        <p className="text-gray-500 mt-2">The transaction you're looking for doesn't exist</p>
        <button onClick={() => navigate('/admin/transactions')} className="btn-primary mt-6">
          Back to Transactions
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
            onClick={() => navigate('/admin/transactions')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-500">Reference:</span>
              <span className="text-sm font-mono font-medium text-gray-700">{transaction.reference_id}</span>
              <button
                onClick={() => copyToClipboard(transaction.reference_id)}
                className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                title="Copy reference ID"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditModalOpen(true)}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-600"
                title="Edit transaction"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {transaction.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={handleApprove}
              disabled={modalLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center space-x-2 text-sm font-medium disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={handleReject}
              disabled={modalLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all flex items-center space-x-2 text-sm font-medium disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center space-x-4 ${
        transaction.status === 'completed' ? 'bg-green-50 border-green-200' :
        transaction.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className={`p-2 rounded-lg ${
          transaction.status === 'completed' ? 'bg-green-100' :
          transaction.status === 'pending' ? 'bg-yellow-100' :
          'bg-red-100'
        }`}>
          {transaction.status === 'completed' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : transaction.status === 'pending' ? (
            <Clock className="h-5 w-5 text-yellow-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 capitalize">Transaction {transaction.status}</p>
          <p className="text-sm text-gray-600">
            {transaction.status === 'completed' ? 'This transaction has been processed successfully.' :
             transaction.status === 'pending' ? 'This transaction is waiting for approval.' :
             'This transaction has been rejected.'}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Banknote className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Amount</p>
          </div>
          <p className={`text-2xl font-bold ${
            transaction.transaction_type === 'credit' ? 'text-green-600' : 
            transaction.transaction_type === 'debit' ? 'text-red-600' : 
            'text-blue-600'
          }`}>
            {transaction.transaction_type === 'credit' ? '+' : ''}
            {transaction.transaction_type === 'debit' ? '-' : ''}
            {formatCurrency(Math.abs(transaction.amount))}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Shield className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Status</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Hash className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Type</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
            {getTransactionIcon(transaction.transaction_type)}
            <span className="ml-2 capitalize">{transaction.transaction_type}</span>
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center space-x-2 text-gray-500 mb-2">
            <Calendar className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Date</p>
          </div>
          <p className="text-sm font-medium text-gray-900">{formatDate(transaction.created_at)}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-2 text-gray-500 mb-4">
          <FileText className="h-4 w-4" />
          <h3 className="text-sm font-medium uppercase tracking-wider">Description</h3>
        </div>
        <p className="text-gray-700">{transaction.description || 'No description provided'}</p>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transaction.account_id && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <User className="h-4 w-4" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Account</h3>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {transaction.accounts?.account_number || transaction.account_id}
            </p>
            {transaction.accounts?.profiles && (
              <p className="text-sm text-gray-500 mt-1">
                {transaction.accounts.profiles.full_name}
              </p>
            )}
          </div>
        )}
        {transaction.counterparty_account && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <ArrowRight className="h-4 w-4" />
              <h3 className="text-sm font-medium uppercase tracking-wider">Counterparty</h3>
            </div>
            <p className="text-sm font-medium text-gray-900">{transaction.counterparty_account}</p>
          </div>
        )}
      </div>

      {/* ============================================
          CONFIRM MODAL (Approve/Reject)
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
                modalContent.type === 'success' ? 'bg-green-50' : 
                'bg-yellow-50'
              } flex-shrink-0`}>
                {modalContent.type === 'danger' ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : modalContent.type === 'success' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{modalContent.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{modalContent.message}</p>
                {transaction && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Reference</p>
                        <p className="text-xs font-mono text-gray-600">{transaction.reference_id}</p>
                      </div>
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
                  modalContent.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
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
        <EditTransactionModal
          transaction={transaction}
          onClose={() => setEditModalOpen(false)}
          onSuccess={fetchTransaction}
        />
      </Modal>
    </motion.div>
  );
};

export default TransactionDetail;