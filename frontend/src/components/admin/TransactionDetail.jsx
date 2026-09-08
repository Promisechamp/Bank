import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import Receipt from '../Receipt';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock3,
  UserRound,
  Banknote,
  Hash,
  CalendarDays,
  FileText,
  TrendingUp,
  TrendingDown,
  Copy,
  ShieldCheck,
  Pencil,
  Save,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  RefreshCw,
  Info,
  Eye,
  Receipt as ReceiptIcon,
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

const cn = (...classes) => classes.filter(Boolean).join(' ');

const getStatusMeta = (status) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        description: 'This transaction has been processed successfully.',
        icon: CheckCircle2,
        wrapper: 'bg-emerald-50 border-emerald-200',
        iconWrap: 'bg-emerald-100 text-emerald-600',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };

    case 'pending_review':
      return {
        label: 'Pending review',
        description: 'This transaction is waiting for administrative approval.',
        icon: Clock3,
        wrapper: 'bg-amber-50 border-amber-200',
        iconWrap: 'bg-amber-100 text-amber-600',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };

    case 'failed':
    case 'rejected':
      return {
        label: status === 'rejected' ? 'Rejected' : 'Failed',
        description: 'This transaction was not completed successfully.',
        icon: XCircle,
        wrapper: 'bg-rose-50 border-rose-200',
        iconWrap: 'bg-rose-100 text-rose-600',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
      };

    default:
      return {
        label: status || 'Unknown',
        description: 'Transaction status information.',
        icon: Info,
        wrapper: 'bg-slate-50 border-slate-200',
        iconWrap: 'bg-slate-100 text-slate-600',
        badge: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
};

const getTypeMeta = (type) => {
  switch (type) {
    case 'credit':
      return {
        label: 'Credit',
        icon: TrendingUp,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        amountColor: 'text-emerald-600',
      };

    case 'debit':
      return {
        label: 'Debit',
        icon: TrendingDown,
        iconColor: 'text-rose-600',
        iconBg: 'bg-rose-50',
        amountColor: 'text-rose-600',
      };

    case 'transfer':
      return {
        label: 'Transfer',
        icon: ArrowRight,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        amountColor: 'text-blue-600',
      };

    default:
      return {
        label: type || 'Transaction',
        icon: Banknote,
        iconColor: 'text-slate-600',
        iconBg: 'bg-slate-50',
        amountColor: 'text-slate-700',
      };
  }
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/* =========================================================
   EDIT TRANSACTION MODAL
========================================================= */

const EditTransactionModal = ({
  transaction,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    amount: Math.abs(transaction.amount),
    description: transaction.description || '',
    date: transaction.created_at
      ? transaction.created_at.slice(0, 10)
      : '',
    status: transaction.status || 'pending_review',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    const amount = Number.parseFloat(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid transaction amount.');
      return;
    }

    setLoading(true);

    try {
      await transactionsAPI.updateTransaction(transaction.id, {
        amount,
        description: formData.description,
        date: formData.date,
        status: formData.status,
      });

      toast.success('Transaction updated successfully');

      await onSuccess();
      onClose();
    } catch (err) {
      const message =
        err?.error ||
        err?.message ||
        'Failed to update transaction';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-5">{error}</p>
        </motion.div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Transaction reference
        </p>

        <p className="mt-2 break-all font-mono text-sm font-medium text-slate-700">
          {transaction.reference_id}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="transaction-amount"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Amount
          </label>

          <div className="relative">
            <CircleDollarSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="transaction-amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base font-semibold text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="transaction-description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Description
          </label>

          <div className="relative">
            <FileText className="absolute left-4 top-4 h-5 w-5 text-slate-400" />

            <input
              id="transaction-description"
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter transaction description"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="transaction-date"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Transaction date
          </label>

          <div className="relative">
            <CalendarDays className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="transaction-date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="transaction-status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Status
          </label>

          <select
            id="transaction-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
          >
            <option value="pending_review">Pending review</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* =========================================================
   DETAIL ITEM
========================================================= */

const DetailItem = ({
  icon: Icon,
  label,
  value,
  subValue,
  action,
}) => {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
            <Icon className="h-[18px] w-[18px]" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {label}
            </p>

            <p className="mt-1.5 truncate text-sm font-semibold text-slate-800">
              {value || '—'}
            </p>

            {subValue && (
              <p className="mt-1 truncate text-xs text-slate-500">
                {subValue}
              </p>
            )}
          </div>
        </div>

        {action}
      </div>
    </div>
  );
};

/* =========================================================
   MAIN TRANSACTION DETAIL
========================================================= */

const TransactionDetail = () => {
  const { txId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchTransaction = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError('');

      const data = await transactionsAPI.adminGetById(txId);

      if (data?.transaction) {
        setTransaction(data.transaction);
      } else {
        setTransaction(null);
        setError('Transaction not found');
      }
    } catch (err) {
      console.error('Fetch transaction error:', err);

      const message =
        err?.error ||
        err?.message ||
        'Failed to load transaction';

      setError(message);

      if (showLoader) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [txId]);

  const statusMeta = useMemo(
    () => getStatusMeta(transaction?.status),
    [transaction?.status]
  );

  const typeMeta = useMemo(
    () => getTypeMeta(transaction?.transaction_type),
    [transaction?.transaction_type]
  );

  const StatusIcon = statusMeta.icon;
  const TypeIcon = typeMeta.icon;

  const copyToClipboard = async (text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Reference ID copied');
    } catch {
      toast.error('Unable to copy reference ID');
    }
  };

  const openConfirmation = (action) => {
    const isApprove = action === 'approve';

    setConfirmAction({
      type: action,
      title: isApprove
        ? 'Approve transaction?'
        : 'Reject transaction?',
      message: isApprove
        ? 'This will mark the transaction as approved and allow it to continue processing.'
        : 'This will reject the transaction and prevent it from being processed.',
      confirmText: isApprove ? 'Approve transaction' : 'Reject transaction',
      icon: isApprove ? CheckCircle2 : XCircle,
      iconBg: isApprove ? 'bg-emerald-50' : 'bg-rose-50',
      iconColor: isApprove ? 'text-emerald-600' : 'text-rose-600',
      button:
        isApprove
          ? 'bg-emerald-600 hover:bg-emerald-700'
          : 'bg-rose-600 hover:bg-rose-700',
    });

    setConfirmModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction || !transaction) return;

    setModalLoading(true);

    try {
      if (confirmAction.type === 'approve') {
        await transactionsAPI.adminApprove(txId);
        toast.success('Transaction approved successfully');
      } else {
        await transactionsAPI.adminReject(txId);
        toast.success('Transaction rejected successfully');
      }

      await fetchTransaction(false);
      setConfirmModalOpen(false);
    } catch (err) {
      const message =
        err?.error ||
        err?.message ||
        `Failed to ${confirmAction.type} transaction`;

      setError(message);
      toast.error(message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewReceipt = () => {
    setReceiptModalOpen(true);
  };

  const handleOpenFullReceipt = () => {
    if (transaction?.reference_id) {
      navigate(`/receipt/${transaction.reference_id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-50/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-40 rounded-xl bg-slate-200" />

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
              <div className="h-2 bg-slate-200" />

              <div className="p-6 sm:p-8">
                <div className="h-5 w-32 rounded bg-slate-200" />
                <div className="mt-5 h-14 w-64 rounded bg-slate-200" />
                <div className="mt-4 h-6 w-48 rounded bg-slate-200" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-28 rounded-2xl bg-slate-200" />
              <div className="h-28 rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-[70vh] bg-slate-50/40 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>

            <h2 className="mt-6 text-xl font-bold tracking-tight text-slate-900">
              Transaction not found
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              We couldn't find the transaction you're looking for. It may
              have been removed or the reference may be incorrect.
            </p>

            <button
              onClick={() => navigate('/admin/transactions')}
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const amount = Math.abs(Number(transaction.amount || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-slate-50/40 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl space-y-6">

        {/* =====================================================
            TOP NAV
        ====================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate('/admin/transactions')}
            className="group inline-flex w-fit items-center gap-2 rounded-xl px-1 py-1 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition group-hover:-translate-x-0.5 group-hover:border-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </span>

            <span>All transactions</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTransaction(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  refreshing && 'animate-spin'
                )}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </button>

            {/* View Receipt Button */}
            <button
              onClick={handleViewReceipt}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <ReceiptIcon className="h-4 w-4" />
              <span>Receipt</span>
            </button>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Something went wrong
              </p>

              <p className="mt-0.5 text-sm text-rose-600">
                {error}
              </p>
            </div>
          </motion.div>
        )}

        {/* =====================================================
            HERO TRANSACTION CARD
        ====================================================== */}

        <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">

          {/* subtle decorative background */}
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full " />

          <div className="relative border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex min-w-0 items-start gap-4">
                <div
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                    typeMeta.iconBg
                  )}
                >
                  <TypeIcon
                    className={cn(
                      'h-6 w-6',
                      typeMeta.iconColor
                    )}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">
                      Transaction
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                    <span className="text-sm font-medium text-slate-400">
                      {typeMeta.label}
                    </span>
                  </div>

                  <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {transaction.description || 'Transaction'}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">
                      {transaction.reference_id}
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(transaction.reference_id)
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      title="Copy reference ID"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  'inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold',
                  statusMeta.badge
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    transaction.status === 'completed'
                      ? 'bg-emerald-500'
                      : transaction.status === 'pending_review'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  )}
                />

                {statusMeta.label}
              </span>
            </div>
          </div>

          <div className="relative px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Transaction amount
                </p>

                <div
                  className={cn(
                    'mt-2 break-words text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl',
                    typeMeta.amountColor
                  )}
                >
                  {transaction.transaction_type === 'credit'
                    ? '+'
                    : transaction.transaction_type === 'debit'
                      ? '-'
                      : ''}
                  {formatCurrency(amount)}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {formatDate(transaction.created_at)}
                  </span>

                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <TypeIcon className="h-4 w-4 text-slate-400" />
                    {typeMeta.label}
                  </span>

                  {/* View Receipt link in hero */}
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                  <button
                    onClick={handleViewReceipt}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <ReceiptIcon className="h-4 w-4" />
                    View Receipt
                  </button>
                </div>
              </div>

              {transaction.status === 'pending_review' && (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    onClick={() => openConfirmation('reject')}
                    disabled={modalLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-3.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>

                  <button
                    onClick={() => openConfirmation('approve')}
                    disabled={modalLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            STATUS STRIP
        ====================================================== */}

        <motion.div
          layout
          className={cn(
            'flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center',
            statusMeta.wrapper
          )}
        >
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              statusMeta.iconWrap
            )}
          >
            <StatusIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              Transaction {statusMeta.label.toLowerCase()}
            </p>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              {statusMeta.description}
            </p>
          </div>

          <div className="sm:ml-auto flex items-center gap-3">
            <span
              className={cn(
                'inline-flex rounded-full border px-3 py-1.5 text-xs font-bold',
                statusMeta.badge
              )}
            >
              {formatStatus(transaction.status)}
            </span>

            <button
              onClick={handleViewReceipt}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ReceiptIcon className="h-3.5 w-3.5" />
              Receipt
            </button>
          </div>
        </motion.div>

        {/* =====================================================
            DETAILS
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">

          {/* LEFT */}
          <div className="space-y-6">

            {/* Transaction information */}
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Transaction information
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Details
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleViewReceipt}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    title="View Receipt"
                  >
                    <ReceiptIcon className="h-4.5 w-4.5" />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={Hash}
                  label="Reference ID"
                  value={transaction.reference_id}
                  action={
                    <button
                      onClick={() =>
                        copyToClipboard(transaction.reference_id)
                      }
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  }
                />

                <DetailItem
                  icon={CreditCard}
                  label="Transaction type"
                  value={typeMeta.label}
                  subValue="Financial movement"
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDate(transaction.created_at)}
                  subValue={transaction.created_at}
                />

                <DetailItem
                  icon={ShieldCheck}
                  label="Status"
                  value={formatStatus(transaction.status)}
                  subValue="Current transaction state"
                />
              </div>
            </section>

            {/* Description */}
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {transaction.description ||
                      'No description was provided for this transaction.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Account relationship */}
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Money movement
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Transaction parties
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                {transaction.account_id && (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound className="h-[18px] w-[18px]" />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          Account
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {transaction.accounts?.account_number ||
                            transaction.account_id}
                        </p>
                      </div>
                    </div>

                    {transaction.accounts?.profiles?.full_name && (
                      <div className="mt-5 border-t border-slate-200/80 pt-4">
                        <p className="text-xs text-slate-400">
                          Account holder
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {transaction.accounts.profiles.full_name}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {transaction.counterparty_account && (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <ArrowRight className="h-[18px] w-[18px]" />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          Counterparty
                        </p>

                        <p className="mt-1 break-all text-sm font-bold text-slate-800">
                          {transaction.counterparty_account}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!transaction.account_id &&
                  !transaction.counterparty_account && (
                    <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
                      <Info className="mx-auto h-6 w-6 text-slate-300" />

                      <p className="mt-3 text-sm font-semibold text-slate-600">
                        No account relationship information
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        No account or counterparty details were attached to
                        this transaction.
                      </p>
                    </div>
                  )}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">

            {/* Amount summary */}
            <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Financial summary
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Amount
                </h2>
              </div>

              <div className="p-5">
                <div
                  className={cn(
                    'rounded-2xl p-5',
                    typeMeta.iconBg
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl bg-white/80',
                        typeMeta.iconColor
                      )}
                    >
                      <TypeIcon className="h-5 w-5" />
                    </div>

                    <span
                      className={cn(
                        'text-xs font-bold uppercase tracking-[0.12em]',
                        typeMeta.iconColor
                      )}
                    >
                      {typeMeta.label}
                    </span>
                  </div>

                  <p
                    className={cn(
                      'mt-7 break-words text-3xl font-extrabold tracking-tight',
                      typeMeta.amountColor
                    )}
                  >
                    {transaction.transaction_type === 'credit'
                      ? '+'
                      : transaction.transaction_type === 'debit'
                        ? '-'
                        : ''}
                    {formatCurrency(amount)}
                  </p>
                </div>

                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-slate-500">
                      Status
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {formatStatus(transaction.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 py-2.5">
                    <span className="text-sm text-slate-500">
                      Date
                    </span>

                    <span className="text-right text-sm font-semibold text-slate-800">
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick action */}
            {transaction.status === 'pending_review' && (
              <section className="rounded-[26px] border border-amber-200 bg-amber-50/70 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                  <Clock3 className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  Review required
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  This transaction is waiting for an administrator to
                  approve or reject it.
                </p>

                <div className="mt-5 grid gap-2">
                  <button
                    onClick={() => openConfirmation('approve')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve transaction
                  </button>

                  <button
                    onClick={() => openConfirmation('reject')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject transaction
                  </button>
                </div>
              </section>
            )}

            {/* Reference card */}
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Hash className="h-4.5 w-4.5" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Reference
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    Transaction ID
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="min-w-0 flex-1 break-all font-mono text-xs text-slate-500">
                  {transaction.reference_id}
                </p>

                <button
                  onClick={() =>
                    copyToClipboard(transaction.reference_id)
                  }
                  className="shrink-0 rounded-lg bg-white p-2 text-slate-400 shadow-sm transition hover:text-slate-700"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* View Receipt Button in reference card */}
              <button
                onClick={handleViewReceipt}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ReceiptIcon className="h-4 w-4" />
                View Receipt
              </button>
            </section>
          </aside>
        </div>

        {/* =====================================================
            FOOTER NAV
        ====================================================== */}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row">
          <button
            onClick={() => navigate('/admin/transactions')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all transactions
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleViewReceipt}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
            >
              <ReceiptIcon className="h-4 w-4" />
              View Receipt
            </button>

            <span className="text-slate-300">|</span>

            <button
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
            >
              Edit transaction
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================
          APPROVE / REJECT MODAL
      ======================================================== */}

      <Modal
        isOpen={confirmModalOpen}
        onClose={() => {
          if (!modalLoading) {
            setConfirmModalOpen(false);
          }
        }}
        title={confirmAction?.title || 'Confirm action'}
        subtitle="Please review this action before continuing."
        size="sm"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        {confirmAction && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  confirmAction.iconBg
                )}
              >
                <confirmAction.icon
                  className={cn(
                    'h-6 w-6',
                    confirmAction.iconColor
                  )}
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmAction.title}
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {confirmAction.message}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Amount
                  </p>

                  <p className="mt-1 text-base font-bold text-slate-900">
                    {formatCurrency(amount)}
                  </p>
                </div>

                <div className="max-w-[55%] text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Reference
                  </p>

                  <p className="mt-1 truncate font-mono text-xs text-slate-500">
                    {transaction.reference_id}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={modalLoading}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={modalLoading}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60',
                  confirmAction.button
                )}
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {confirmAction.type === 'approve' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {confirmAction.confirmText}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* =======================================================
          EDIT MODAL
      ======================================================== */}

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          if (!modalLoading) {
            setEditModalOpen(false);
          }
        }}
        title="Edit transaction"
        subtitle="Update the transaction information below."
        size="md"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        <EditTransactionModal
          transaction={transaction}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => fetchTransaction(false)}
        />
      </Modal>

      {/* =======================================================
          RECEIPT MODAL
      ======================================================== */}

      <Modal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
        }}
        title="Transaction Receipt"
        size="lg"
        position="center"
        showCloseButton={true}
        closeOnOutsideClick={true}
      >
        <Receipt
          transaction={transaction}
          //onClose={() => setReceiptModalOpen(false)}
        />
      </Modal>
    </motion.div>
  );
};

export default TransactionDetail;