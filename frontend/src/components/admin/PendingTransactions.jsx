import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { 
  History, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Banknote,
  Calendar,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

const PendingTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0 });

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchPendingTransactions();
  }, [currentPage]);

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        status: 'pending',
        limit: transactionsPerPage,
        offset: (currentPage - 1) * transactionsPerPage,
      };
      const response = await transactionsAPI.adminGetAll(params);
      setTransactions(response.transactions || []);
      setPagination(response.pagination || { total: 0, limit: 10, offset: 0 });
    } catch (err) {
      setError(err.error || 'Failed to load pending transactions');
      toast.error('Failed to load pending transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (tx, action) => {
    setSelectedTx(tx);
    setModalContent({
      title: `${action === 'approve' ? 'Approve' : 'Reject'} Transfer`,
      message: `Are you sure you want to ${action} this transfer of ${formatCurrency(tx.amount)} from ${tx.accounts?.profiles?.full_name || 'Unknown'}?`,
      type: action === 'approve' ? 'success' : 'danger',
      confirmText: action === 'approve' ? 'Approve' : 'Reject',
      onConfirm: async () => {
        try {
          setModalLoading(true);
          if (action === 'approve') {
            await transactionsAPI.adminApprove(tx.id);
            toast.success('Transaction approved successfully');
          } else {
            await transactionsAPI.adminReject(tx.id);
            toast.success('Transaction rejected successfully');
          }
          // Refresh list
          await fetchPendingTransactions();
          setModalOpen(false);
        } catch (err) {
          toast.error(err.error || 'Action failed');
        } finally {
          setModalLoading(false);
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
      // handled in action
    } finally {
      setModalLoading(false);
    }
  };

  // Filter by search (local)
  const filteredTransactions = transactions.filter(tx =>
    tx.reference_id?.toLowerCase().includes(search.toLowerCase()) ||
    tx.description?.toLowerCase().includes(search.toLowerCase()) ||
    tx.accounts?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil((pagination.total || 0) / transactionsPerPage);
  const paginate = (page) => setCurrentPage(page);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
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
          <h1 className="text-2xl font-bold text-gray-900">Pending Transactions</h1>
          <p className="text-sm text-gray-500">Review and approve or reject pending transfers</p>
        </div>
        <button
          onClick={fetchPendingTransactions}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Pending</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Amount Pending</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-sm text-gray-500">Actions Needed</p>
          <p className="text-2xl font-bold text-yellow-600">{transactions.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reference, description, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Pending Transactions</h3>
            <p className="text-gray-500 mt-2">All transfers have been reviewed.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-xs font-mono text-gray-600">{tx.reference_id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {tx.accounts?.profiles?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {tx.metadata?.recipientName || tx.metadata?.recipientAccountNumber || 'External'}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(Math.abs(tx.amount))}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleAction(tx, 'approve')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleAction(tx, 'reject')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/transactions/${tx.id}`)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > transactionsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
                <span className="text-sm text-gray-600">
                  Showing {(pagination.offset || 0) + 1} to {Math.min((pagination.offset || 0) + transactionsPerPage, pagination.total)} of {pagination.total} transactions
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
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={modalContent?.title || 'Confirm'}
        size="sm"
        position="center"
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
                {selectedTx && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(Math.abs(selectedTx.amount))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Reference</p>
                        <p className="text-xs font-mono text-gray-600">{selectedTx.reference_id}</p>
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
    </motion.div>
  );
};

export default PendingTransactions;