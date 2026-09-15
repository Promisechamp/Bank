import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import Receipt from '../Receipt';

import {
  ArrowLeft,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  History,
  User,
  CalendarDays,
  Clock3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Copy,
  ShieldCheck,
  Building2,
  Eye,
  Ban,
  RotateCcw,
  Trash2,
  Edit3,
  Save,
  FileText,
  X,
  MoreHorizontal,
  ChevronDown,
  Mail,
  Phone,
  Hash,
  Activity,
  CircleDollarSign,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import {
  formatCurrency,
  formatDate,
  getStatusColor,
} from '../../utils/helpers';

/* =========================================================
   SMALL HELPERS
========================================================= */

const cx = (...classes) => classes.filter(Boolean).join(' ');

const getTransactionStatus = (status) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        dot: 'bg-emerald-500',
      };

    case 'pending_review':
      return {
        label: 'Pending review',
        className: 'bg-amber-50 text-amber-700 border-amber-100',
        dot: 'bg-amber-500',
      };

    case 'failed':
      return {
        label: 'Failed',
        className: 'bg-rose-50 text-rose-700 border-rose-100',
        dot: 'bg-rose-500',
      };

    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };

    default:
      return {
        label: status || 'Unknown',
        className: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

const getAccountStatus = (status) => {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        description: 'This account is fully operational.',
        icon: CheckCircle2,
        wrapper: 'bg-emerald-50 border-emerald-100',
        iconWrapper: 'bg-white text-emerald-600 border-emerald-100',
        text: 'text-emerald-800',
      };

    case 'frozen':
      return {
        label: 'Frozen',
        description: 'Transactions are currently blocked.',
        icon: Lock,
        wrapper: 'bg-amber-50 border-amber-100',
        iconWrapper: 'bg-white text-amber-600 border-amber-100',
        text: 'text-amber-800',
      };

    case 'banned':
      return {
        label: 'Banned',
        description: 'This account has been permanently restricted.',
        icon: Ban,
        wrapper: 'bg-rose-50 border-rose-100',
        iconWrapper: 'bg-white text-rose-600 border-rose-100',
        text: 'text-rose-800',
      };

    default:
      return {
        label: status || 'Unknown',
        description: 'Account status requires attention.',
        icon: AlertCircle,
        wrapper: 'bg-slate-50 border-slate-200',
        iconWrapper: 'bg-white text-slate-500 border-slate-200',
        text: 'text-slate-700',
      };
  }
};

const getTransactionVisual = (type) => {
  switch (type) {
    case 'credit':
      return {
        icon: ArrowDownLeft,
        iconClass: 'text-emerald-600',
        bg: 'bg-emerald-50',
        amount: 'text-emerald-600',
        prefix: '+',
        label: 'Credit',
      };

    case 'debit':
      return {
        icon: ArrowUpRight,
        iconClass: 'text-rose-600',
        bg: 'bg-rose-50',
        amount: 'text-rose-600',
        prefix: '-',
        label: 'Debit',
      };

    case 'transfer':
      return {
        icon: ArrowRight,
        iconClass: 'text-indigo-600',
        bg: 'bg-indigo-50',
        amount: 'text-indigo-600',
        prefix: '',
        label: 'Transfer',
      };

    default:
      return {
        icon: Wallet,
        iconClass: 'text-slate-500',
        bg: 'bg-slate-50',
        amount: 'text-slate-700',
        prefix: '',
        label: 'Transaction',
      };
  }
};

/* =========================================================
   EDIT TRANSACTION MODAL
========================================================= */

const EditTransactionForm = ({
  transaction,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    amount: Math.abs(transaction.amount || 0),
    description: transaction.description || '',
    date: transaction.created_at
      ? transaction.created_at.slice(0, 10)
      : '',
    status: transaction.status || 'pending_review',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!transaction) return;

    setFormData({
      amount: Math.abs(transaction.amount || 0),
      description: transaction.description || '',
      date: transaction.created_at
        ? transaction.created_at.slice(0, 10)
        : '',
      status: transaction.status || 'pending_review',
    });
  }, [transaction]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await transactionsAPI.updateTransaction(transaction.id, {
        amount: Number.parseFloat(formData.amount),
        description: formData.description,
        date: formData.date ? new Date(formData.date).toISOString() : formData.date,
        status: formData.status,
      });

      toast.success('Transaction updated successfully');

      await onSuccess();
      onClose();
    } catch (error) {
      const message =
        error?.error ||
        error?.message ||
        'Failed to update transaction';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="text-sm font-semibold">Unable to save changes</p>
            <p className="mt-0.5 text-sm text-rose-600">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100">
            <Hash className="h-4 w-4 text-slate-500" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Transaction reference
            </p>
            <p className="mt-0.5 truncate font-mono text-sm font-semibold text-slate-700">
              {transaction.reference_id || transaction.id}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Amount
        </label>

        <div className="relative">
          <CircleDollarSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Description
        </label>

        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Transaction description"
          required
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Date
          </label>

          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="pending_review">Pending Review</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

/* =========================================================
   TRANSACTION ROW
========================================================= */

const TransactionRow = ({
  transaction,
  onEdit,
  onView,
  onReceipt,
}) => {
  const [expanded, setExpanded] = useState(false);

  const visual = getTransactionVisual(
    transaction.transaction_type
  );

  const status = getTransactionStatus(transaction.status);
  const Icon = visual.icon;

  const amount = Math.abs(transaction.amount || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group border-b border-slate-100 last:border-b-0"
    >
      <div className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70 lg:px-6">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div
            className={cx(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              visual.bg
            )}
          >
            <Icon className={cx('h-5 w-5', visual.iconClass)} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">
                {transaction.description || 'Transaction'}
              </p>

              {transaction.status === 'pending_review' && (
                <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 sm:inline-flex">
                  Review
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {formatDate(transaction.created_at)}
              </span>

              <span className="text-slate-200">•</span>

              <span className="text-xs capitalize text-slate-400">
                {visual.label}
              </span>
            </div>
          </div>

          <ChevronDown
            className={cx(
              'ml-2 h-4 w-4 shrink-0 text-slate-300 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </button>

        <div className="hidden sm:block">
          <span
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
              status.className
            )}
          >
            <span
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                status.dot
              )}
            />
            {status.label}
          </span>
        </div>

        <div className="text-right">
          <p
            className={cx(
              'whitespace-nowrap text-sm font-bold',
              visual.amount
            )}
          >
            {visual.prefix}
            {formatCurrency(amount)}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {transaction.currency || 'USD'}
          </p>
        </div>

        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700 hover:shadow-sm"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50"
          >
            <div className="px-5 pb-5 pt-1 lg:px-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Reference
                    </p>

                    <p className="mt-1 truncate font-mono text-xs font-semibold text-slate-700">
                      {transaction.reference_id || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </p>

                    <span
                      className={cx(
                        'mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                        status.className
                      )}
                    >
                      <span
                        className={cx(
                          'h-1.5 w-1.5 rounded-full',
                          status.dot
                        )}
                      />
                      {status.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Created
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>

                {transaction.metadata && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Metadata
                    </p>

                    <pre className="mt-2 max-h-32 overflow-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
                      {typeof transaction.metadata === 'string'
                        ? transaction.metadata
                        : JSON.stringify(transaction.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => onView(transaction)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View details
                  </button>

                  <button
                    type="button"
                    onClick={() => onReceipt(transaction)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Receipt
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(transaction)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* =========================================================
   MOBILE TRANSACTION CARD
========================================================= */

const MobileTransactionCard = ({
  transaction,
  onEdit,
  onView,
  onReceipt,
}) => {
  const [expanded, setExpanded] = useState(false);

  const visual = getTransactionVisual(
    transaction.transaction_type
  );

  const status = getTransactionStatus(transaction.status);
  const Icon = visual.icon;
  const amount = Math.abs(transaction.amount || 0);

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100/60"
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div
          className={cx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            visual.bg
          )}
        >
          <Icon className={cx('h-5 w-5', visual.iconClass)} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {transaction.description || 'Transaction'}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {formatDate(transaction.created_at)}
            </span>

            <span
              className={cx(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                status.className
              )}
            >
              <span
                className={cx(
                  'h-1.5 w-1.5 rounded-full',
                  status.dot
                )}
              />
              {status.label}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p
            className={cx(
              'text-sm font-bold',
              visual.amount
            )}
          >
            {visual.prefix}
            {formatCurrency(amount)}
          </p>

          <ChevronDown
            className={cx(
              'ml-auto mt-1 h-4 w-4 text-slate-300 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50/60 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400">
                    Reference
                  </span>

                  <span className="max-w-[60%] truncate font-mono text-[11px] font-semibold text-slate-600">
                    {transaction.reference_id || '—'}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onView(transaction)}
                    className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-100"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => onReceipt(transaction)}
                    className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-600 shadow-sm ring-1 ring-slate-100"
                  >
                    Receipt
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(transaction)}
                    className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-100"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const AccountDetails = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('all');

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchAccountDetails = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const accountData =
        await accountsAPI.adminGetOne(accountId);

      setAccount(accountData?.account || null);

      try {
        const txData =
          await transactionsAPI.adminGetAll({
            accountId,
            limit: 50,
          });

        setTransactions(txData?.transactions || []);
      } catch (transactionError) {
        console.error(
          'Failed to load transactions:',
          transactionError
        );

        setTransactions([]);

        if (!silent) {
          toast.warning(
            'Account loaded, but transaction history could not be loaded.'
          );
        }
      }
    } catch (requestError) {
      console.error(
        'Failed to load account:',
        requestError
      );

      setError(
        requestError?.error ||
          requestError?.message ||
          'Failed to load account details'
      );

      if (!silent) {
        toast.error('Failed to load account details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
  }, [accountId]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const filteredTransactions = useMemo(() => {
    const search = transactionSearch.trim().toLowerCase();

    return transactions
      .filter((transaction) => {
        if (transactionFilter === 'all') return true;

        return (
          transaction.status === transactionFilter ||
          transaction.transaction_type === transactionFilter
        );
      })
      .filter((transaction) => {
        if (!search) return true;

        const values = [
          transaction.description,
          transaction.reference_id,
          transaction.transaction_type,
          transaction.status,
        ];

        return values.some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(search)
        );
      });
  }, [
    transactions,
    transactionFilter,
    transactionSearch,
  ]);

  const transactionStats = useMemo(() => {
    const credits = transactions.filter(
      (transaction) =>
        transaction.transaction_type === 'credit'
    );

    const debits = transactions.filter(
      (transaction) =>
        transaction.transaction_type === 'debit'
    );

    const pending = transactions.filter(
      (transaction) =>
        transaction.status === 'pending_review'
    );

    const completed = transactions.filter(
      (transaction) =>
        transaction.status === 'completed'
    );

    const creditTotal = credits.reduce(
      (total, transaction) =>
        total + Math.abs(Number(transaction.amount || 0)),
      0
    );

    const debitTotal = debits.reduce(
      (total, transaction) =>
        total + Math.abs(Number(transaction.amount || 0)),
      0
    );

    return {
      creditTotal,
      debitTotal,
      pending: pending.length,
      completed: completed.length,
    };
  }, [transactions]);

  /* =======================================================
     ACTIONS
  ======================================================= */

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Account number copied');
    } catch {
      toast.error('Unable to copy account number');
    }
  };

  const openConfirmation = (data) => {
    setConfirmData(data);
    setConfirmOpen(true);
  };

  const closeConfirmation = () => {
    if (!confirmLoading) {
      setConfirmOpen(false);
      setConfirmData(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmData?.onConfirm) return;

    try {
      setConfirmLoading(true);
      await confirmData.onConfirm();
    } catch (requestError) {
      console.error(requestError);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleToggleLock = () => {
    if (!account) return;

    const freeze = account.status === 'active';
    const nextStatus = freeze ? 'frozen' : 'active';

    openConfirmation({
      title: freeze
        ? 'Freeze this account?'
        : 'Unfreeze this account?',
      description: freeze
        ? 'Freezing this account will prevent transactions from being processed until the account is restored.'
        : 'Unfreezing this account will restore normal transaction access.',
      type: freeze ? 'warning' : 'info',
      actionLabel: freeze ? 'Freeze account' : 'Unfreeze account',
      onConfirm: async () => {
        try {
          await accountsAPI.adminUpdateStatus(
            accountId,
            nextStatus
          );

          setAccount((current) => ({
            ...current,
            status: nextStatus,
          }));

          setSuccess(
            `Account ${
              freeze ? 'frozen' : 'unfrozen'
            } successfully.`
          );

          toast.success(
            `Account ${
              freeze ? 'frozen' : 'unfrozen'
            } successfully`
          );

          setConfirmOpen(false);
          setConfirmData(null);
        } catch (requestError) {
          setError(
            requestError?.error ||
              requestError?.message ||
              'Failed to update account status'
          );

          toast.error(
            'Failed to update account status'
          );
        }
      },
    });
  };

  const handleBanAccount = () => {
    if (!account) return;

    const banning = account.status !== 'banned';
    const nextStatus = banning ? 'banned' : 'active';

    openConfirmation({
      title: banning
        ? 'Ban this account?'
        : 'Unban this account?',
      description: banning
        ? 'This will prevent the account from operating. Use this only when the account should be permanently restricted.'
        : 'This will restore the account to an active state.',
      type: banning ? 'danger' : 'info',
      actionLabel: banning
        ? 'Ban account'
        : 'Unban account',
      onConfirm: async () => {
        try {
          await accountsAPI.adminUpdateStatus(
            accountId,
            nextStatus
          );

          setAccount((current) => ({
            ...current,
            status: nextStatus,
          }));

          setSuccess(
            `Account ${
              banning ? 'banned' : 'unbanned'
            } successfully.`
          );

          toast.success(
            `Account ${
              banning ? 'banned' : 'unbanned'
            } successfully`
          );

          setConfirmOpen(false);
          setConfirmData(null);
        } catch (requestError) {
          setError(
            requestError?.error ||
              requestError?.message ||
              'Failed to update account status'
          );

          toast.error(
            'Failed to update account status'
          );
        }
      },
    });
  };

  const handleDeleteAccount = () => {
    if (!account) return;

    openConfirmation({
      title: 'Delete this account?',
      description:
        'This action permanently deletes the account and its associated transaction records. The account owner profile will not be deleted.',
      type: 'danger',
      actionLabel: 'Delete account',
      onConfirm: async () => {
        try {
          await accountsAPI.adminDelete(accountId);

          toast.success('Account deleted successfully');

          navigate('/admin/accounts');
        } catch (requestError) {
          setError(
            requestError?.error ||
              requestError?.message ||
              'Failed to delete account'
          );

          toast.error('Failed to delete account');
        }
      },
    });
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleViewTransaction = (transaction) => {
    navigate(
      `/admin/transactions/${transaction.id}`
    );
  };

  const handleViewReceipt = (transaction) => {
    setReceiptTransaction(transaction);
    setReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setReceiptModalOpen(false);
    setReceiptTransaction(null);
  };

  const handleEditSuccess = async () => {
    await fetchAccountDetails(true);
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-slate-50/40 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-5">
            <div className="h-10 w-52 animate-pulse rounded-xl bg-slate-100" />

            <div className="h-56 animate-pulse rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!account) {
    return (
      <div className="min-h-[60vh] bg-slate-50/40 px-4 py-12">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <AlertCircle className="h-7 w-7 text-slate-300" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Account not found
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            The account you're looking for doesn't exist or
            is no longer available.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/admin/accounts')
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to accounts
          </button>
        </div>
      </div>
    );
  }

  const accountStatus = getAccountStatus(
    account.status
  );

  const StatusIcon = accountStatus.icon;

  const owner = account.profiles;

  const initials =
    owner?.full_name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase() || 'U';

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-slate-50/40 px-3 py-4 sm:px-5 lg:px-8 lg:py-7"
    >
      <div className="mx-auto max-w-7xl space-y-5 lg:space-y-6">

        {/* =================================================
            TOP NAV
        ================================================= */}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              navigate('/admin/accounts')
            }
            className="group inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => fetchAccountDetails(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
          >
            <RefreshCw
              className={cx(
                'h-3.5 w-3.5',
                refreshing && 'animate-spin'
              )}
            />
            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm shadow-slate-200/50">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-50 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-sky-50 blur-3xl" />

          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">

              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Account
                  </span>

                  <span className="text-xs text-slate-300">
                    /
                  </span>

                  <span className="text-xs font-medium text-slate-400">
                    Details
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600 sm:flex">
                    <Wallet className="h-7 w-7" />
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      {owner?.full_name
                        ? `${owner.full_name}'s account`
                        : 'Account details'}
                    </h1>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            account.account_number
                          )
                        }
                        className="group inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {account.account_number}
                        <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                      </button>

                      <span className="text-xs text-slate-300">
                        •
                      </span>

                      <span className="text-xs font-medium capitalize text-slate-400">
                        {account.account_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={cx(
                    'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                    account.status === 'active'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  )}
                >
                  {account.status === 'active' ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}

                  <span>
                    {account.status === 'active'
                      ? 'Freeze'
                      : 'Unfreeze'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleBanAccount}
                  className={cx(
                    'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                    account.status === 'banned'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  )}
                >
                  {account.status === 'banned' ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}

                  <span>
                    {account.status === 'banned'
                      ? 'Unban'
                      : 'Ban'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Delete
                  </span>
                </button>
              </div>
            </div>

            {/* HERO FOOTER */}

            <div className="mt-7 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Created
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700">
                    {formatDate(account.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Updated
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700">
                    {account.updated_at
                      ? formatDate(account.updated_at)
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={cx(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    accountStatus.iconWrapper
                  )}
                >
                  <StatusIcon className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current status
                  </p>

                  <p
                    className={cx(
                      'mt-0.5 text-xs font-bold',
                      accountStatus.text
                    )}
                  >
                    {accountStatus.label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ALERTS
        ================================================= */}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

              <div className="flex-1">
                <p className="text-sm font-bold text-rose-800">
                  Something went wrong
                </p>

                <p className="mt-0.5 text-sm text-rose-600">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError('')}
                className="rounded-lg p-1 text-rose-400 transition hover:bg-white hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-800">
                  Action completed
                </p>

                <p className="mt-0.5 text-sm text-emerald-600">
                  {success}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSuccess('')}
                className="rounded-lg p-1 text-emerald-400 transition hover:bg-white hover:text-emerald-600"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            STATUS STRIP
        ================================================= */}

        <section
          className={cx(
            'flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center',
            accountStatus.wrapper
          )}
        >
          <div
            className={cx(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
              accountStatus.iconWrapper
            )}
          >
            <StatusIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                Account is {accountStatus.label.toLowerCase()}
              </p>

              <span
                className={cx(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  account.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : account.status === 'frozen'
                    ? 'bg-amber-100 text-amber-700'
                    : account.status === 'banned'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {accountStatus.label}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-600">
              {accountStatus.description}
            </p>
          </div>
        </section>

        {/* =================================================
            FINANCIAL OVERVIEW
        ================================================= */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Financial overview
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Account snapshot
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

            {/* BALANCE */}

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm shadow-slate-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <Wallet className="h-5 w-5 text-indigo-600" />
                </div>

                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600">
                  Current
                </span>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Available balance
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {formatCurrency(account.balance)}
              </p>
            </motion.div>

            {/* CREDITS */}

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm shadow-slate-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total credits
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {formatCurrency(
                  transactionStats.creditTotal
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Incoming transactions
              </p>
            </motion.div>

            {/* DEBITS */}

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm shadow-slate-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total debits
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {formatCurrency(
                  transactionStats.debitTotal
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Outgoing transactions
              </p>
            </motion.div>

            {/* TRANSACTIONS */}

            <motion.div
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <Activity className="h-5 w-5 text-slate-600" />
                </div>

                {transactionStats.pending > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                    {transactionStats.pending} pending
                  </span>
                )}
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Transactions
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {transactions.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {transactionStats.completed} completed
              </p>
            </motion.div>
          </div>
        </section>

        {/* =================================================
            TWO COLUMN INFORMATION
        ================================================= */}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">

          {/* OWNER */}

          {owner && (
            <section className="rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100/70">
              <div className="border-b border-slate-100 px-5 py-4 lg:px-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Account owner
                  </h2>
                </div>
              </div>

              <div className="p-5 lg:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-600">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {owner.full_name || 'Unknown user'}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={cx(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          getStatusColor(owner.status)
                        )}
                      >
                        {owner.status || 'active'}
                      </span>

                      <span className="text-xs text-slate-300">
                        •
                      </span>

                      <span className="text-xs font-medium capitalize text-slate-400">
                        {owner.role || 'user'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                      {owner.email || 'Not provided'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Phone
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                      {owner.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ACCOUNT DETAILS */}

          <section className="rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100/70">
            <div className="border-b border-slate-100 px-5 py-4 lg:px-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-900">
                  Account information
                </h2>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-5 px-5 py-4 lg:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Account number
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                    {account.account_number}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      account.account_number
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-5 px-5 py-4 lg:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Account type
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize text-slate-700">
                    {account.account_type || '—'}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                  <Building2 className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center justify-between gap-5 px-5 py-4 lg:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(account.created_at)}
                  </p>
                </div>

                <CalendarDays className="h-4 w-4 text-slate-300" />
              </div>

              <div className="flex items-center justify-between gap-5 px-5 py-4 lg:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Last updated
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {account.updated_at
                      ? formatDate(account.updated_at)
                      : 'Never'}
                  </p>
                </div>

                <Clock3 className="h-4 w-4 text-slate-300" />
              </div>
            </div>
          </section>
        </div>

        {/* =================================================
            TRANSACTIONS
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100/70">

          {/* HEADER */}

          <div className="border-b border-slate-100 p-5 lg:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <History className="h-5 w-5 text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Transaction history
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Review activity associated with this account.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {/* SEARCH */}

                <div className="relative">
                  <Activity className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />

                  <input
                    type="search"
                    value={transactionSearch}
                    onChange={(event) =>
                      setTransactionSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search transactions..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 sm:w-56"
                  />
                </div>

                {/* FILTER */}

                <select
                  value={transactionFilter}
                  onChange={(event) =>
                    setTransactionFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="all">
                    All transactions
                  </option>
                  <option value="completed">
                    Completed
                  </option>
                  <option value="pending_review">
                    Pending
                  </option>
                  <option value="failed">
                    Failed
                  </option>
                  <option value="cancelled">
                    Cancelled
                  </option>
                  <option value="credit">
                    Credits
                  </option>
                  <option value="debit">
                    Debits
                  </option>
                  <option value="transfer">
                    Transfers
                  </option>
                </select>
              </div>
            </div>

            {/* MINI STATS */}

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                {transactions.length} total
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                {transactionStats.completed} completed
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                {transactionStats.pending} pending
              </span>
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden md:block">
            {filteredTransactions.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                  <History className="h-6 w-6 text-slate-300" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  No transactions found
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {transactionSearch ||
                  transactionFilter !== 'all'
                    ? 'Try changing your search or filter.'
                    : 'This account has no transaction history yet.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[minmax(0,1fr)_130px_150px_44px] items-center border-b border-slate-100 bg-slate-50/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:px-6">
                  <span>Transaction</span>
                  <span>Status</span>
                  <span className="text-right">
                    Amount
                  </span>
                  <span />
                </div>

                {filteredTransactions
                  .slice(0, 50)
                  .map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEditTransaction}
                      onView={handleViewTransaction}
                      onReceipt={handleViewReceipt}
                    />
                  ))}
              </>
            )}
          </div>

          {/* MOBILE */}

          <div className="space-y-3 bg-slate-50/40 p-3 md:hidden">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl bg-white px-5 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                  <History className="h-6 w-6 text-slate-300" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  No transactions found
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Try changing your search or filter.
                </p>
              </div>
            ) : (
              filteredTransactions
                .slice(0, 50)
                .map((transaction) => (
                  <MobileTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEditTransaction}
                    onView={handleViewTransaction}
                    onReceipt={handleViewReceipt}
                  />
                ))
            )}
          </div>

          {/* FOOTER */}

          {filteredTransactions.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <span>
                Showing{' '}
                <strong className="font-semibold text-slate-600">
                  {Math.min(
                    filteredTransactions.length,
                    50
                  )}
                </strong>{' '}
                of{' '}
                <strong className="font-semibold text-slate-600">
                  {filteredTransactions.length}
                </strong>{' '}
                transactions
              </span>

              <span>
                Account activity
              </span>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          CONFIRMATION MODAL
      ===================================================== */}

      <Modal
        isOpen={confirmOpen}
        onClose={closeConfirmation}
        title={confirmData?.title || 'Confirm action'}
        size="sm"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        {confirmData && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={cx(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  confirmData.type === 'danger'
                    ? 'bg-rose-50 text-rose-600'
                    : confirmData.type === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-indigo-50 text-indigo-600'
                )}
              >
                {confirmData.type === 'danger' ? (
                  <AlertCircle className="h-6 w-6" />
                ) : confirmData.type === 'warning' ? (
                  <Lock className="h-6 w-6" />
                ) : (
                  <ShieldCheck className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  {confirmData.title}
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {confirmData.description}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Account
                  </p>

                  <p className="mt-1 truncate font-mono text-xs font-semibold text-slate-700">
                    {account.account_number}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Balance
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-800">
                    {formatCurrency(account.balance)}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Owner
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {owner?.full_name || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={confirmLoading}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmLoading}
                className={cx(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60',
                  confirmData.type === 'danger'
                    ? 'bg-rose-600 shadow-rose-100 hover:bg-rose-700'
                    : confirmData.type === 'warning'
                    ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600'
                    : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
                )}
              >
                {confirmLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {confirmLoading
                  ? 'Processing...'
                  : confirmData.actionLabel}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================
          EDIT TRANSACTION
      ===================================================== */}

      <Modal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        title="Edit transaction"
        subtitle="Update the transaction details below."
        size="md"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        {selectedTransaction && (
          <EditTransactionForm
            transaction={selectedTransaction}
            onClose={closeEditModal}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>

      {/* =====================================================
          RECEIPT
      ===================================================== */}

      <Modal
        isOpen={receiptModalOpen}
        onClose={closeReceiptModal}
        title="Transaction receipt"
        size="lg"
        position="center"
        showCloseButton
        closeOnOutsideClick
      >
        {receiptTransaction && (
          <Receipt
            transaction={receiptTransaction}
            //onClose={closeReceiptModal}
          />
        )}
      </Modal>
    </motion.div>
  );
};

export default AccountDetails;