import React, { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import {
  History,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreVertical,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Users,
  Wallet,
  Activity,
  CircleDollarSign,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
} from '../../utils/helpers';

const TRANSACTIONS_PER_PAGE = 10;

/* ============================================================
   HELPERS
   ============================================================ */

const getDisplayStatus = (status) => {
  switch (status) {
    case 'pending_review':
      return 'Pending Review';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
};

const isReviewable = (transaction) => transaction?.status === 'pending_review';

const getAmountClass = (transaction) => {
  if (transaction?.status === 'pending_review') {
    return 'text-amber-600';
  }
  switch (transaction?.transaction_type) {
    case 'credit':
      return 'text-emerald-600';
    case 'debit':
      return 'text-red-600';
    default:
      return 'text-gray-900';
  }
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'pending_review':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getTransactionTypeLabel = (type) => {
  switch (type) {
    case 'credit':
      return 'Credit';
    case 'debit':
      return 'Debit';
    case 'transfer':
      return 'Transfer';
    default:
      return type || 'Transaction';
  }
};

const getTransactionSearchText = (transaction) => {
  const profile = transaction?.account?.profiles;
  const account = transaction?.account;

  return [
    transaction?.description,
    transaction?.reference_id,
    transaction?.transaction_type,
    account?.account_number,
    profile?.full_name,
    profile?.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

/* ============================================================
   ACTION MENU
   ============================================================ */

const ActionMenu = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!actions.length) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="
          inline-flex h-9 w-9 items-center justify-center
          rounded-xl border border-gray-200 bg-white
          text-gray-500 transition-all duration-200
          hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800
          focus:outline-none focus:ring-2 focus:ring-primary-500/20
        "
        aria-label="Transaction actions"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14 }}
            className="
              absolute right-0 top-full z-50 mt-2
              w-56 max-w-[calc(100vw-2rem)]
              overflow-hidden rounded-2xl
              border border-gray-200 bg-white
              shadow-[0_18px_50px_rgba(15,23,42,0.12)]
            "
          >
            <div className="p-1.5">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={`${action.label}-${index}`}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      action.onClick?.();
                    }}
                    className={`
                      flex w-full min-w-0 items-center gap-3
                      rounded-xl px-3.5 py-2.5
                      text-left text-sm font-medium
                      transition-colors
                      ${
                        action.danger
                          ? 'text-red-600 hover:bg-red-50'
                          : action.success
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================================================
   TRANSACTION ICON
   ============================================================ */

const TransactionIcon = ({
  transaction,
  compact = false,
}) => {
  const wrapper = compact ? 'h-10 w-10 rounded-xl' : 'h-11 w-11 rounded-xl';
  const icon = compact ? 'h-4 w-4' : 'h-[18px] w-[18px]';

  if (transaction?.status === 'pending_review') {
    return (
      <div
        className={`
          ${wrapper} flex shrink-0 items-center justify-center
          border border-amber-100 bg-amber-50
        `}
      >
        <ShieldAlert className={`${icon} text-amber-600`} />
      </div>
    );
  }

  if (transaction?.transaction_type === 'credit') {
    return (
      <div
        className={`
          ${wrapper} flex shrink-0 items-center justify-center
          border border-emerald-100 bg-emerald-50
        `}
      >
        <ArrowDownLeft className={`${icon} text-emerald-600`} />
      </div>
    );
  }

  if (transaction?.transaction_type === 'debit') {
    return (
      <div
        className={`
          ${wrapper} flex shrink-0 items-center justify-center
          border border-red-100 bg-red-50
        `}
      >
        <ArrowUpRight className={`${icon} text-red-600`} />
      </div>
    );
  }

  return (
    <div
      className={`
        ${wrapper} flex shrink-0 items-center justify-center
        border border-gray-100 bg-gray-50
      `}
    >
      <ArrowRight className={`${icon} text-gray-500`} />
    </div>
  );
};

/* ============================================================
   STATUS BADGE
   ============================================================ */

const StatusBadge = ({ status }) => {
  const reviewable = status === 'pending_review';

  return (
    <span
      className={`
        inline-flex max-w-full items-center gap-1.5
        whitespace-nowrap rounded-full border
        px-2.5 py-1 text-[11px] font-semibold leading-none
        ${getStatusClasses(status)}
      `}
    >
      {reviewable && <Clock3 className="h-3 w-3 shrink-0" />}
      <span className="truncate">{getDisplayStatus(status)}</span>
    </span>
  );
};

/* ============================================================
   SKELETON
   ============================================================ */

const TransactionSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-40 max-w-full rounded bg-gray-100" />
              <div className="h-3 w-28 max-w-full rounded bg-gray-100" />
            </div>
            <div className="hidden h-8 w-24 shrink-0 rounded-lg bg-gray-100 sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   EMPTY STATE
   ============================================================ */

const EmptyState = ({ searchActive }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
        <History className="h-7 w-7 text-gray-300" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-gray-900">
        {searchActive ? 'No matching transactions' : 'You\'re all caught up'}
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-gray-500">
        {searchActive
          ? 'Try another name, email, reference or account number.'
          : 'There are currently no transactions waiting for administrative review.'}
      </p>
    </div>
  );
};

/* ============================================================
   MOBILE CARD
   ============================================================ */

const MobileTransactionCard = ({
  transaction,
  index,
  onView,
  onApprove,
  onReject,
}) => {
  const reviewable = isReviewable(transaction);
  const amount = Math.abs(Number(transaction?.amount) || 0);
  const type = transaction?.transaction_type;
  const profile = transaction?.account?.profiles;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.22 }}
      className={`
        min-w-0 overflow-hidden rounded-2xl border bg-white
        transition-shadow duration-200 hover:shadow-[0_10px_30px_rgba(15,23,42,0.05)]
        ${reviewable ? 'border-amber-200' : 'border-gray-200'}
      `}
    >
      {/* Top */}
      <div className="p-4">
        <div className="flex min-w-0 items-start gap-3">
          <TransactionIcon transaction={transaction} compact />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {transaction?.description || 'Transaction'}
                </p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  {getTransactionTypeLabel(type)}
                  {profile?.full_name ? ` • ${profile.full_name}` : ''}
                </p>
              </div>
              <ActionMenu
                actions={[
                  {
                    label: 'View Details',
                    icon: Eye,
                    onClick: onView,
                  },
                  ...(reviewable
                    ? [
                        {
                          label: 'Approve Transfer',
                          icon: CheckCircle2,
                          success: true,
                          onClick: onApprove,
                        },
                        {
                          label: 'Decline Transfer',
                          icon: XCircle,
                          danger: true,
                          onClick: onReject,
                        },
                      ]
                    : []),
                ]}
              />
            </div>
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Ref
              </span>
              <span className="min-w-0 truncate font-mono text-[10px] text-gray-500">
                {transaction?.reference_id || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom information */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Amount
            </p>
            <p className={`mt-1 truncate text-base font-bold ${getAmountClass(transaction)}`}>
              {type === 'credit' && '+'}
              {type === 'debit' && '-'}
              {formatCurrency(amount)}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Status
            </p>
            <div className="mt-1 flex justify-end">
              <StatusBadge status={transaction?.status} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="truncate text-[11px] text-gray-400">
            {formatDate(transaction?.created_at)}
          </p>
          {transaction?.account?.account_number && (
            <p className="truncate font-mono text-[10px] text-gray-400">
              ••••{' '}
              {String(transaction.account.account_number).slice(-4)}
            </p>
          )}
        </div>
      </div>

      {/* Review notice */}
      {reviewable && (
        <div className="flex items-start gap-2.5 border-t border-amber-100 bg-amber-50/60 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="min-w-0 text-[11px] font-medium leading-4 text-amber-700">
            This transfer is awaiting review. No money has moved yet.
          </p>
        </div>
      )}
    </motion.article>
  );
};

/* ============================================================
   PAGINATION
   ============================================================ */

const Pagination = ({
  currentPage,
  totalPages,
  pagination,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const total = pagination?.total || 0;
  const offset = pagination?.offset || 0;
  const limit = pagination?.limit || TRANSACTIONS_PER_PAGE;

  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);

  const pages = [];
  const addPage = (page) => {
    if (page >= 1 && page <= totalPages && !pages.includes(page)) {
      pages.push(page);
    }
  };

  addPage(1);
  addPage(2);
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    addPage(page);
  }
  addPage(totalPages - 1);
  addPage(totalPages);

  pages.sort((a, b) => a - b);

  const paginationItems = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous && page - previous > 1) {
      paginationItems.push(
        <span
          key={`ellipsis-${page}`}
          className="flex h-8 min-w-8 items-center justify-center text-xs text-gray-400"
        >
          …
        </span>
      );
    }
    paginationItems.push(
      <button
        key={page}
        type="button"
        onClick={() => onPageChange(page)}
        className={`
          flex h-8 min-w-8 items-center justify-center
          rounded-lg px-2 text-xs font-semibold
          transition-all duration-150
          ${
            currentPage === page
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }
        `}
      >
        {page}
      </button>
    );
  });

  return (
    <div className="flex min-w-0 flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-gray-500">
        Showing{' '}
        <span className="font-semibold text-gray-700">{start}</span> to{' '}
        <span className="font-semibold text-gray-700">{end}</span> of{' '}
        <span className="font-semibold text-gray-700">{total}</span>
      </p>
      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 overflow-hidden">
          {paginationItems}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   DESKTOP TABLE
   ============================================================ */

const DesktopTransactionsTable = ({
  transactions,
  onView,
  onApprove,
  onReject,
}) => {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[820px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Transaction
            </th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              User
            </th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Amount
            </th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Status
            </th>
            <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Date
            </th>
            <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => {
            const reviewable = isReviewable(transaction);
            const amount = Math.abs(Number(transaction?.amount) || 0);
            const type = transaction?.transaction_type;
            const profile = transaction?.account?.profiles;

            return (
              <motion.tr
                key={transaction.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.025, duration: 0.2 }}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50/70"
              >
                {/* Transaction */}
                <td className="px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <TransactionIcon transaction={transaction} />
                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900">
                        {transaction?.description || 'Transaction'}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">
                          {getTransactionTypeLabel(type)}
                        </span>
                        <span className="text-gray-200"> • </span>
                        <span className="max-w-[130px] truncate font-mono text-[10px] text-gray-400">
                          {transaction?.reference_id || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* User */}
                <td className="px-5 py-4">
                  <div className="min-w-0">
                    <p className="max-w-[170px] truncate text-sm font-medium text-gray-800">
                      {profile?.full_name || 'Unknown user'}
                    </p>
                    <p className="mt-0.5 max-w-[190px] truncate text-xs text-gray-400">
                      {profile?.email || transaction?.account?.account_number || '—'}
                    </p>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-5 py-4">
                  <p className={`whitespace-nowrap text-sm font-bold ${getAmountClass(transaction)}`}>
                    {type === 'credit' && '+'}
                    {type === 'debit' && '-'}
                    {formatCurrency(amount)}
                  </p>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <StatusBadge status={transaction?.status} />
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <p className="whitespace-nowrap text-xs text-gray-500">
                    {formatDate(transaction?.created_at)}
                  </p>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <ActionMenu
                      actions={[
                        {
                          label: 'View Details',
                          icon: Eye,
                          onClick: () => onView(transaction),
                        },
                        ...(reviewable
                          ? [
                              {
                                label: 'Approve Transfer',
                                icon: CheckCircle2,
                                success: true,
                                onClick: () => onApprove(transaction),
                              },
                              {
                                label: 'Decline Transfer',
                                icon: XCircle,
                                danger: true,
                                onClick: () => onReject(transaction),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

const PendingTransactions = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: TRANSACTIONS_PER_PAGE,
    offset: 0,
  });

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  /* ==========================================================
     FETCH
     ========================================================== */

  const fetchPendingTransactions = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');

        const params = {
          limit: TRANSACTIONS_PER_PAGE,
          offset: (currentPage - 1) * TRANSACTIONS_PER_PAGE,
          status: 'pending_review',
        };

        const response = await transactionsAPI.adminGetAll(params);

        setTransactions(Array.isArray(response?.transactions) ? response.transactions : []);
        setPagination(
          response?.pagination || {
            total: 0,
            limit: TRANSACTIONS_PER_PAGE,
            offset: 0,
          }
        );
      } catch (err) {
        const message = err?.error || err?.message || 'Failed to load pending transactions.';
        setError(message);
        if (!silent) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage]
  );

  useEffect(() => {
    fetchPendingTransactions();
  }, [fetchPendingTransactions]);

  /* ==========================================================
     SEARCH
     ========================================================== */

  const normalizedSearch = search.trim().toLowerCase();

  const filteredTransactions = useMemo(() => {
    if (!normalizedSearch) {
      return transactions;
    }
    return transactions.filter((transaction) =>
      getTransactionSearchText(transaction).includes(normalizedSearch)
    );
  }, [transactions, normalizedSearch]);

  /* ==========================================================
     SUMMARY
     ========================================================== */

  const summary = useMemo(() => {
    const total = pagination?.total || 0;
    const currentAmount = transactions.reduce(
      (sum, transaction) => sum + Math.abs(Number(transaction?.amount) || 0),
      0
    );
    const currentUsers = new Set(
      transactions.map((transaction) => transaction?.account?.user_id).filter(Boolean)
    ).size;

    return { total, currentAmount, currentUsers };
  }, [transactions, pagination]);

  /* ==========================================================
     PAGINATION
     ========================================================== */

  const totalPages = Math.max(1, Math.ceil((pagination?.total || 0) / TRANSACTIONS_PER_PAGE));

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    setCurrentPage(page);
  };

  /* ==========================================================
     ACTIONS
     ========================================================== */

  const handleView = (transaction) => {
    navigate(`/admin/transactions/${transaction.id}`);
  };

  const handleApprove = (transaction) => {
    setSelectedTx(transaction);
    setModalContent({
      title: 'Approve transfer',
      type: 'success',
      confirmText: 'Approve Transfer',
      message: 'Approving this transfer will debit the sender and credit the recipient.',
    });
    setModalOpen(true);
  };

  const handleReject = (transaction) => {
    setSelectedTx(transaction);
    setModalContent({
      title: 'Decline transfer',
      type: 'danger',
      confirmText: 'Decline Transfer',
      message: 'Declining this transfer will reject the request. No money will be moved.',
    });
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedTx || !modalContent) {
      return;
    }

    try {
      setModalLoading(true);

      if (modalContent.type === 'success') {
        await transactionsAPI.adminApprove(selectedTx.id);
        toast.success('Transfer approved successfully.');
      } else {
        await transactionsAPI.adminReject(selectedTx.id);
        toast.success('Transfer declined successfully.');
      }

      setModalOpen(false);
      setSelectedTx(null);
      setModalContent(null);

      await fetchPendingTransactions({ silent: true });
    } catch (err) {
      const message = err?.error || err?.message || 'Action failed.';
      setError(message);
      toast.error(message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalClose = () => {
    if (modalLoading) return;
    setModalOpen(false);
    setSelectedTx(null);
    setModalContent(null);
  };

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-56 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
        <TransactionSkeleton />
      </div>
    );
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full min-w-0 max-w-full space-y-5 overflow-hidden sm:space-y-6 p-3" >
    
      {/* ======================================================
          HEADER
          ====================================================== */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
              <History className="h-5 w-5 text-gray-600" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Transaction Management
            </span>
          </div>
          <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Pending Transactions
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-5 text-gray-500">
            Review transfers that require administrative attention before they are processed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchPendingTransactions({ silent: true })}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-w-0 items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">Something went wrong</p>
            <p className="mt-0.5 break-words text-sm leading-5 text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* ======================================================
          SEARCH
          ====================================================== */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by user, email, account, reference..."
            className="block w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        {normalizedSearch && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <Search className="h-3 w-3 text-gray-400" />
            <p className="text-[11px] text-gray-400">
              Showing matches from the transactions currently loaded on this page.
            </p>
          </div>
        )}
      </section>

      {/* ======================================================
          REVIEW INFO
          ====================================================== */}

      {transactions.length > 0 && (
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {pagination.total || transactions.length} transaction{' '}
              {(pagination.total || transactions.length) !== 1 ? 's' : ''} awaiting review
            </p>
            <p className="mt-0.5 text-xs leading-5 text-amber-700 sm:text-sm">
              Review the transaction details before approving or declining a transfer. Pending
              transfers have not moved funds.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          TRANSACTIONS
          ====================================================== */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Section heading */}
        <div className="flex min-w-0 flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Transactions</h2>
            </div>
            <p className="mt-1 text-xs text-gray-400">Review the latest pending activity.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
              {filteredTransactions.length} shown
            </span>
          </div>
        </div>

        {/* Desktop */}
        {filteredTransactions.length > 0 && (
          <DesktopTransactionsTable
            transactions={filteredTransactions}
            onView={handleView}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {/* Mobile */}
        <div className="space-y-3 p-3 md:hidden">
          {filteredTransactions.length === 0 ? (
            <EmptyState searchActive={Boolean(normalizedSearch)} />
          ) : (
            filteredTransactions.map((transaction, index) => (
              <MobileTransactionCard
                key={transaction.id}
                transaction={transaction}
                index={index}
                onView={() => handleView(transaction)}
                onApprove={() => handleApprove(transaction)}
                onReject={() => handleReject(transaction)}
              />
            ))
          )}
        </div>

        {/* Desktop empty */}
        {filteredTransactions.length === 0 && (
          <div className="hidden md:block">
            <EmptyState searchActive={Boolean(normalizedSearch)} />
          </div>
        )}

        {/* Pagination */}
        {pagination.total > TRANSACTIONS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        )}
      </section>

      {/* ======================================================
          APPROVE / REJECT MODAL
          ====================================================== */}

      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={modalContent?.title || 'Confirm action'}
        size="sm"
        position="center"
        showCloseButton={!modalLoading}
        closeOnOutsideClick={false}
      >
        {modalContent && selectedTx && (
          <div className="min-w-0 space-y-5">
            {/* Intro */}
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`
                  flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                  ${modalContent.type === 'danger' ? 'bg-red-50' : 'bg-emerald-50'}
                `}
              >
                {modalContent.type === 'danger' ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{modalContent.title}</h3>
                <p className="mt-1.5 text-sm leading-5 text-gray-600">{modalContent.message}</p>
              </div>
            </div>

            {/* Transaction summary */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <div className="p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Transfer amount
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold tracking-tight text-gray-900">
                      {formatCurrency(Math.abs(Number(selectedTx.amount) || 0))}
                    </p>
                  </div>
                  <StatusBadge status={selectedTx.status} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Description
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-gray-800">
                      {selectedTx.description || 'Transfer'}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Reference
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] leading-4 text-gray-600">
                      {selectedTx.reference_id || '—'}
                    </p>
                  </div>
                  {selectedTx.account?.account_number && (
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Sender account
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-gray-600">
                        {selectedTx.account.account_number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-amber-100 bg-amber-50/70 px-4 py-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-4 text-amber-700">
                  This transfer is still awaiting approval. No money has moved yet.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={modalLoading}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={modalLoading}
                className={`
                  inline-flex items-center justify-center gap-2
                  rounded-xl px-4 py-2.5 text-sm font-semibold text-white
                  shadow-sm transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${
                    modalContent.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }
                `}
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {modalContent.type === 'danger' ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>{modalContent.confirmText}</span>
                  </>
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