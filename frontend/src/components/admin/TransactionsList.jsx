import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';

import {
  History,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw
} from 'lucide-react';

import {
  formatCurrency,
  formatDate
} from '../../utils/helpers';

// ============================================================
// CONSTANTS
// ============================================================

const TRANSACTIONS_PER_PAGE = 10;

// ============================================================
// HELPERS
// ============================================================

const getDisplayStatus = (status) => {
  switch (status) {
    case 'pending_review':
      return 'Pending Review';

    case 'pending':
      return 'Pending';

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

const isReviewable = (transaction) => {
  return transaction?.status === 'pending_review';
};

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
      return 'text-blue-600';
  }
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'pending_review':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'pending':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';

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
    profile?.email
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

// ============================================================
// ACTION MENU
// ============================================================

const ActionMenu = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

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

  if (!actions.length) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="
          inline-flex h-9 w-9 items-center justify-center
          rounded-lg border border-gray-200
          text-gray-500
          transition-colors
          hover:bg-gray-50 hover:text-gray-900
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
            initial={{
              opacity: 0,
              y: -4,
              scale: 0.98
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: -4,
              scale: 0.98
            }}
            transition={{ duration: 0.12 }}
            className="
              absolute right-0 top-full mt-2
              z-50 w-52 max-w-[calc(100vw-2rem)]
              overflow-hidden rounded-xl
              border border-gray-200
              bg-white
              shadow-xl
            "
          >
            <div className="py-1">
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
                      px-4 py-2.5
                      text-left text-sm
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
                    {Icon && (
                      <Icon className="h-4 w-4 shrink-0" />
                    )}

                    <span className="truncate">
                      {action.label}
                    </span>
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

// ============================================================
// TRANSACTION ICON
// ============================================================

const TransactionIcon = ({ transaction, compact = false }) => {
  const size = compact
    ? 'h-9 w-9'
    : 'h-10 w-10';

  const iconSize = compact
    ? 'h-4 w-4'
    : 'h-[18px] w-[18px]';

  if (transaction?.status === 'pending_review') {
    return (
      <div
        className={`${size} shrink-0 rounded-xl bg-amber-50 flex items-center justify-center`}
      >
        <ShieldAlert
          className={`${iconSize} text-amber-600`}
        />
      </div>
    );
  }

  if (transaction?.transaction_type === 'credit') {
    return (
      <div
        className={`${size} shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center`}
      >
        <ArrowDownLeft
          className={`${iconSize} text-emerald-600`}
        />
      </div>
    );
  }

  if (transaction?.transaction_type === 'debit') {
    return (
      <div
        className={`${size} shrink-0 rounded-xl bg-red-50 flex items-center justify-center`}
      >
        <ArrowUpRight
          className={`${iconSize} text-red-600`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${size} shrink-0 rounded-xl bg-blue-50 flex items-center justify-center`}
    >
      <ArrowRight
        className={`${iconSize} text-blue-600`}
      />
    </div>
  );
};

// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({ status }) => {
  const reviewable = status === 'pending_review';

  return (
    <span
      className={`
        inline-flex max-w-full items-center gap-1.5
        rounded-full border
        px-2.5 py-1
        text-[11px] font-semibold
        leading-none
        whitespace-nowrap
        ${getStatusClasses(status)}
      `}
    >
      {reviewable && (
        <Clock className="h-3 w-3 shrink-0" />
      )}

      <span className="truncate">
        {getDisplayStatus(status)}
      </span>
    </span>
  );
};

// ============================================================
// SKELETON
// ============================================================

const TransactionSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="
            animate-pulse rounded-2xl
            border border-gray-200
            bg-white p-4
          "
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-32 max-w-full rounded bg-gray-100" />
              <div className="h-3 w-24 max-w-full rounded bg-gray-100" />
            </div>

            <div className="h-8 w-20 shrink-0 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({ searchActive }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
        <History className="h-7 w-7 text-gray-300" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        No transactions found
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-gray-500">
        {searchActive
          ? 'No transactions match your search on this page.'
          : 'There are no transactions matching the selected filter.'}
      </p>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = 'gray'
}) => {
  const tones = {
    gray: {
      card: 'border-gray-200 bg-white',
      label: 'text-gray-400',
      value: 'text-gray-900',
      iconBg: 'bg-gray-50',
      icon: 'text-gray-500'
    },

    amber: {
      card: 'border-amber-200 bg-amber-50/60',
      label: 'text-amber-600',
      value: 'text-amber-700',
      iconBg: 'bg-amber-100',
      icon: 'text-amber-600'
    },

    emerald: {
      card: 'border-emerald-200 bg-emerald-50/60',
      label: 'text-emerald-600',
      value: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      icon: 'text-emerald-600'
    },

    blue: {
      card: 'border-blue-200 bg-blue-50/60',
      label: 'text-blue-600',
      value: 'text-blue-700',
      iconBg: 'bg-blue-100',
      icon: 'text-blue-600'
    }
  };

  const currentTone = tones[tone] || tones.gray;

  return (
    <div
      className={`
        min-w-0 overflow-hidden
        rounded-2xl border p-4
        ${currentTone.card}
      `}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`
              truncate
              text-[11px] font-semibold
              uppercase tracking-wide
              ${currentTone.label}
            `}
          >
            {label}
          </p>

          <p
            className={`
              mt-1 truncate
              text-xl font-bold
              sm:text-2xl
              ${currentTone.value}
            `}
            title={String(value)}
          >
            {value}
          </p>
        </div>

        <div
          className={`
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            ${currentTone.iconBg}
          `}
        >
          <Icon
            className={`h-5 w-5 ${currentTone.icon}`}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MOBILE TRANSACTION CARD
// ============================================================

const MobileTransactionCard = ({
  transaction,
  index,
  onView,
  onApprove,
  onReject
}) => {
  const reviewable = isReviewable(transaction);

  const amount = Math.abs(
    Number(transaction?.amount) || 0
  );

  const type = transaction?.transaction_type;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 8
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        delay: index * 0.025
      }}
      className={`
        min-w-0 max-w-full overflow-hidden
        rounded-2xl border bg-white p-4
        ${
          reviewable
            ? 'border-amber-200 bg-amber-50/20'
            : 'border-gray-200'
        }
      `}
    >
      {/* Top */}
      <div className="flex min-w-0 items-start gap-3">
        <TransactionIcon
          transaction={transaction}
          compact
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {transaction?.description || 'Transaction'}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {getTransactionTypeLabel(type)}
              </p>
            </div>

            <div className="shrink-0">
              <ActionMenu
                actions={[
                  {
                    label: 'View Details',
                    icon: Eye,
                    onClick: onView
                  },

                  ...(reviewable
                    ? [
                        {
                          label: 'Approve Transfer',
                          icon: CheckCircle,
                          success: true,
                          onClick: onApprove
                        },
                        {
                          label: 'Decline Transfer',
                          icon: XCircle,
                          danger: true,
                          onClick: onReject
                        }
                      ]
                    : [])
                ]}
              />
            </div>
          </div>

          {/* Reference */}
          <div className="mt-2 flex min-w-0 items-start gap-1.5">
            <span className="mt-0.5 shrink-0 text-[10px] text-gray-400">
              Ref
            </span>

            <span
              className="
                min-w-0
                break-all
                font-mono text-[10px]
                leading-4 text-gray-500
              "
            >
              {transaction?.reference_id || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom information */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex min-w-0 items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400">
              Amount
            </p>

            <p
              className={`
                mt-0.5
                truncate
                text-lg font-bold
                ${getAmountClass(transaction)}
              `}
            >
              {type === 'credit' && '+'}
              {type === 'debit' && '-'}
              {formatCurrency(amount)}
            </p>
          </div>

          <div className="min-w-0 max-w-[52%] text-right">
            <StatusBadge
              status={transaction?.status}
            />

            <p className="mt-1.5 truncate text-[11px] text-gray-400">
              {formatDate(transaction?.created_at)}
            </p>
          </div>
        </div>

        {reviewable && (
          <div className="mt-3 flex min-w-0 items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />

            <p className="min-w-0 text-[11px] font-medium leading-4 text-amber-700">
              No money has moved. This transfer requires admin review.
            </p>
          </div>
        )}
      </div>
    </motion.article>
  );
};

// ============================================================
// DESKTOP TABLE ROW
// ============================================================

const DesktopTransactionRow = ({
  transaction,
  index,
  onView,
  onApprove,
  onReject
}) => {
  const reviewable = isReviewable(transaction);

  const amount = Math.abs(
    Number(transaction?.amount) || 0
  );

  const type = transaction?.transaction_type;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        delay: index * 0.015
      }}
      className={`
        transition-colors
        ${
          reviewable
            ? 'bg-amber-50/30 hover:bg-amber-50/60'
            : 'hover:bg-gray-50'
        }
      `}
    >
      {/* Transaction */}
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <TransactionIcon
            transaction={transaction}
            compact
          />

          <div className="min-w-0">
            <p
              className="max-w-[220px] truncate text-sm font-semibold text-gray-900"
              title={transaction?.description || 'Transaction'}
            >
              {transaction?.description || 'Transaction'}
            </p>

            <p className="mt-0.5 text-xs capitalize text-gray-400">
              {getTransactionTypeLabel(type)}
            </p>
          </div>
        </div>
      </td>

      {/* Reference */}
      <td className="max-w-[190px] px-4 py-4">
        <span
          className="
            block max-w-[180px]
            break-all
            font-mono text-[11px]
            leading-4 text-gray-500
          "
          title={transaction?.reference_id}
        >
          {transaction?.reference_id || '—'}
        </span>
      </td>

      {/* Amount */}
      <td className="px-4 py-4 text-right">
        <p
          className={`
            whitespace-nowrap
            text-sm font-bold
            ${getAmountClass(transaction)}
          `}
        >
          {type === 'credit' && '+'}
          {type === 'debit' && '-'}
          {formatCurrency(amount)}
        </p>

        {reviewable && (
          <p className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-amber-600">
            Awaiting approval
          </p>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <StatusBadge status={transaction?.status} />
      </td>

      {/* Date */}
      <td className="whitespace-nowrap px-4 py-4">
        <span className="text-xs text-gray-600">
          {formatDate(transaction?.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onView}
            className="
              inline-flex h-9 w-9
              items-center justify-center
              rounded-lg
              text-gray-400
              transition-colors
              hover:bg-primary-50 hover:text-primary-600
              focus:outline-none
              focus:ring-2 focus:ring-primary-500/20
            "
            title="View details"
            aria-label="View transaction details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {reviewable ? (
            <>
              <button
                type="button"
                onClick={onApprove}
                className="
                  inline-flex items-center gap-1.5
                  rounded-lg
                  border border-emerald-200
                  bg-emerald-50
                  px-3 py-1.5
                  text-xs font-semibold
                  text-emerald-700
                  transition-colors
                  hover:bg-emerald-100
                  focus:outline-none
                  focus:ring-2 focus:ring-emerald-500/20
                "
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                className="
                  inline-flex items-center gap-1.5
                  rounded-lg
                  border border-red-200
                  bg-red-50
                  px-3 py-1.5
                  text-xs font-semibold
                  text-red-700
                  transition-colors
                  hover:bg-red-100
                  focus:outline-none
                  focus:ring-2 focus:ring-red-500/20
                "
              >
                <XCircle className="h-3.5 w-3.5" />
                Decline
              </button>
            </>
          ) : (
            <ActionMenu
              actions={[
                {
                  label: 'View Details',
                  icon: Eye,
                  onClick: onView
                }
              ]}
            />
          )}
        </div>
      </td>
    </motion.tr>
  );
};

// ============================================================
// PAGINATION
// ============================================================

const Pagination = ({
  currentPage,
  totalPages,
  pagination,
  onPageChange
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const total = pagination?.total || 0;
  const offset = pagination?.offset || 0;
  const limit = pagination?.limit || TRANSACTIONS_PER_PAGE;

  const start = total === 0
    ? 0
    : offset + 1;

  const end = Math.min(
    offset + limit,
    total
  );

  const pages = [];

  const addPage = (page) => {
    if (
      page >= 1 &&
      page <= totalPages &&
      !pages.includes(page)
    ) {
      pages.push(page);
    }
  };

  addPage(1);
  addPage(2);

  for (
    let page = currentPage - 1;
    page <= currentPage + 1;
    page += 1
  ) {
    addPage(page);
  }

  addPage(totalPages - 1);
  addPage(totalPages);

  pages.sort((a, b) => a - b);

  const paginationItems = [];

  pages.forEach((page, index) => {
    const previous = pages[index - 1];

    if (
      previous &&
      page - previous > 1
    ) {
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
          rounded-lg px-2
          text-xs font-medium
          transition-colors
          ${
            currentPage === page
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }
        `}
      >
        {page}
      </button>
    );
  });

  return (
    <div
      className="
        flex min-w-0 flex-col gap-3
        border-t border-gray-200
        px-4 py-4
        sm:flex-row sm:items-center sm:justify-between
        sm:px-5
      "
    >
      <p className="min-w-0 text-xs text-gray-500">
        Showing{' '}
        <span className="font-medium text-gray-700">
          {start}
        </span>{' '}
        to{' '}
        <span className="font-medium text-gray-700">
          {end}
        </span>{' '}
        of{' '}
        <span className="font-medium text-gray-700">
          {total}
        </span>
      </p>

      <div className="flex min-w-0 items-center justify-between gap-1 sm:justify-end">
        <button
          type="button"
          onClick={() =>
            onPageChange(currentPage - 1)
          }
          disabled={currentPage === 1}
          className="
            flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            border border-gray-200
            text-gray-500
            transition-colors
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-1 overflow-hidden">
          {paginationItems}
        </div>

        <button
          type="button"
          onClick={() =>
            onPageChange(currentPage + 1)
          }
          disabled={currentPage === totalPages}
          className="
            flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            border border-gray-200
            text-gray-500
            transition-colors
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const TransactionsList = () => {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    limit: TRANSACTIONS_PER_PAGE,
    offset: 0
  });

  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  const [error, setError] = useState('');

  // ----------------------------------------------------------
  // MODAL
  // ----------------------------------------------------------

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // ==========================================================
  // FETCH
  // ==========================================================

  const fetchAllTransactions = useCallback(
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
          offset:
            (currentPage - 1) *
            TRANSACTIONS_PER_PAGE,

          status:
            filter !== 'all'
              ? filter
              : undefined
        };

        const response =
          await transactionsAPI.adminGetAll(params);

        setTransactions(
          Array.isArray(response?.transactions)
            ? response.transactions
            : []
        );

        setPagination(
          response?.pagination || {
            total: 0,
            limit: TRANSACTIONS_PER_PAGE,
            offset: 0
          }
        );
      } catch (err) {
        const message =
          err?.error ||
          err?.message ||
          'Failed to load transactions.';

        setError(message);

        if (!silent) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, filter]
  );

  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const filteredTransactions = useMemo(() => {
    if (!normalizedSearch) {
      return transactions;
    }

    return transactions.filter(
      (transaction) =>
        getTransactionSearchText(transaction).includes(
          normalizedSearch
        )
    );
  }, [transactions, normalizedSearch]);

  // ==========================================================
  // PAGE STATS
  // ==========================================================

  const pageStats = useMemo(() => {
    let pendingReview = 0;
    let completed = 0;
    let volume = 0;

    transactions.forEach((transaction) => {
      if (
        transaction?.status ===
        'pending_review'
      ) {
        pendingReview += 1;
      }

      if (
        transaction?.status ===
        'completed'
      ) {
        completed += 1;
      }

      volume += Math.abs(
        Number(transaction?.amount) || 0
      );
    });

    return {
      pendingReview,
      completed,
      volume
    };
  }, [transactions]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      (pagination?.total || 0) /
        TRANSACTIONS_PER_PAGE
    )
  );

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);
  };

  // ==========================================================
  // VIEW
  // ==========================================================

  const handleView = (transaction) => {
    navigate(
      `/admin/transactions/${transaction.id}`
    );
  };

  // ==========================================================
  // APPROVE
  // ==========================================================

  const handleApprove = (transaction) => {
    setSelectedTx(transaction);

    setModalContent({
      title: 'Approve transfer',
      type: 'success',
      confirmText: 'Approve Transfer',
      message:
        'Approving this transfer will allow the system to debit the sender and credit the recipient. The transaction will then be marked as completed.'
    });

    setModalOpen(true);
  };

  // ==========================================================
  // REJECT
  // ==========================================================

  const handleReject = (transaction) => {
    setSelectedTx(transaction);

    setModalContent({
      title: 'Decline transfer',
      type: 'danger',
      confirmText: 'Decline Transfer',
      message:
        'Declining this transfer will reject the request. No money will be moved from the sender to the recipient.'
    });

    setModalOpen(true);
  };

  // ==========================================================
  // CONFIRM MODAL ACTION
  // ==========================================================

  const handleConfirm = async () => {
    if (
      !selectedTx ||
      !modalContent
    ) {
      return;
    }

    try {
      setModalLoading(true);

      if (
        modalContent.type ===
        'success'
      ) {
        await transactionsAPI.adminApprove(
          selectedTx.id
        );

        toast.success(
          'Transfer approved successfully.'
        );
      } else {
        await transactionsAPI.adminReject(
          selectedTx.id
        );

        toast.success(
          'Transfer declined successfully.'
        );
      }

      setModalOpen(false);
      setSelectedTx(null);

      await fetchAllTransactions({
        silent: true
      });
    } catch (err) {
      const message =
        err?.error ||
        err?.message ||
        `Failed to ${
          modalContent.type === 'success'
            ? 'approve'
            : 'decline'
        } transaction.`;

      setError(message);
      toast.error(message);
    } finally {
      setModalLoading(false);
    }
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleModalClose = () => {
    if (modalLoading) {
      return;
    }

    setModalOpen(false);
    setSelectedTx(null);
    setModalContent(null);
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6 overflow-hidden">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl bg-gray-100"
              />
            )
          )}
        </div>

        <TransactionSkeleton />
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.25
      }}
      className="
        w-full min-w-0 max-w-full
        overflow-hidden
        space-y-5
        sm:space-y-6
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className="
          flex min-w-0 flex-col gap-4
          sm:flex-row sm:items-end sm:justify-between
        "
      >
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <History className="h-5 w-5 text-primary-600" />
            </div>

            <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Operations
            </span>
          </div>

          <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
            Transactions
          </h1>

          <p className="mt-1 max-w-xl text-sm leading-5 text-gray-500">
            Review, monitor and manage account transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchAllTransactions({
              silent: true
            })
          }
          disabled={refreshing}
          className="
            inline-flex shrink-0
            items-center justify-center gap-2
            self-start
            rounded-xl
            border border-gray-200
            bg-white
            px-3.5 py-2.5
            text-sm font-medium
            text-gray-700
            shadow-sm
            transition-colors
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:self-auto
          "
        >
          <RefreshCw
            className={`
              h-4 w-4
              ${refreshing ? 'animate-spin' : ''}
            `}
          />

          <span>Refresh</span>
        </button>
      </header>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            flex min-w-0 items-start gap-3
            rounded-xl
            border border-red-200
            bg-red-50
            px-4 py-3
          "
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">
              Something went wrong
            </p>

            <p className="mt-0.5 break-words text-sm leading-5 text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={pagination?.total || 0}
          icon={History}
          tone="gray"
        />

        <StatCard
          label="Pending Review"
          value={pageStats.pendingReview}
          icon={ShieldAlert}
          tone="amber"
        />

        <StatCard
          label="Completed"
          value={pageStats.completed}
          icon={CheckCircle}
          tone="emerald"
        />

        <StatCard
          label="Page Volume"
          value={formatCurrency(pageStats.volume)}
          icon={TrendingUp}
          tone="blue"
        />
      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <section
        className="
          min-w-0 overflow-hidden
          rounded-2xl
          border border-gray-200
          bg-white
          p-3 sm:p-4
        "
      >
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search
              className="
                pointer-events-none
                absolute left-3.5 top-1/2
                h-4 w-4
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search transactions..."
              className="
                block w-full min-w-0
                rounded-xl
                border border-gray-200
                bg-gray-50
                py-2.5 pl-10 pr-4
                text-sm text-gray-900
                placeholder:text-gray-400
                transition-colors
                focus:border-primary-500
                focus:bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
              "
            />
          </div>

          {/* Filter */}
          <div className="flex min-w-0 items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-gray-400" />

            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setCurrentPage(1);
                setSearch('');
              }}
              className="
                min-w-0 flex-1
                rounded-xl
                border border-gray-200
                bg-gray-50
                px-3.5 py-2.5
                text-sm text-gray-700
                transition-colors
                focus:border-primary-500
                focus:bg-white
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
                sm:min-w-[190px]
                sm:flex-none
              "
            >
              <option value="all">
                All Transactions
              </option>

              <option value="pending_review">
                Pending Review
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="failed">
                Failed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>
        </div>

        {normalizedSearch && (
          <p className="mt-2 px-1 text-[11px] text-gray-400">
            Searching the transactions currently loaded on this page.
          </p>
        )}
      </section>

      {/* ======================================================
          REVIEW NOTICE
      ====================================================== */}

      {transactions.some(
        (transaction) =>
          transaction?.status ===
          'pending_review'
      ) && (
        <div
          className="
            flex min-w-0 items-start gap-3
            rounded-2xl
            border border-amber-200
            bg-amber-50
            px-4 py-3
          "
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              Transfers require attention
            </p>

            <p className="mt-0.5 text-xs leading-5 text-amber-700 sm:text-sm">
              Pending Review transfers have not moved any money.
              Approve or decline them after reviewing the transfer.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          MOBILE
      ====================================================== */}

      <div className="min-w-0 space-y-3 md:hidden">
        {filteredTransactions.length === 0 ? (
          <EmptyState
            searchActive={Boolean(normalizedSearch)}
          />
        ) : (
          filteredTransactions.map(
            (transaction, index) => (
              <MobileTransactionCard
                key={transaction.id}
                transaction={transaction}
                index={index}
                onView={() =>
                  handleView(transaction)
                }
                onApprove={() =>
                  handleApprove(transaction)
                }
                onReject={() =>
                  handleReject(transaction)
                }
              />
            )
          )
        )}

        {pagination.total > TRANSACTIONS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* ======================================================
          DESKTOP / TABLET
      ====================================================== */}

      <section
        className="
          hidden min-w-0 max-w-full
          overflow-hidden
          rounded-2xl
          border border-gray-200
          bg-white
          shadow-sm
          md:block
        "
      >
        {filteredTransactions.length === 0 ? (
          <EmptyState
            searchActive={Boolean(normalizedSearch)}
          />
        ) : (
          <>
            {/* Important:
                The horizontal scroll belongs to the table container,
                not the page. */}
            <div
              className="
                min-w-0 max-w-full
                overflow-x-auto
                overscroll-x-contain
              "
            >
              <table className="w-full min-w-[900px] table-fixed">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[19%]" />
                  <col className="w-[15%]" />
                  <col className="w-[14%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Transaction
                    </th>

                    <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Reference
                    </th>

                    <th className="px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Amount
                    </th>

                    <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Status
                    </th>

                    <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Date
                    </th>

                    <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map(
                    (transaction, index) => (
                      <DesktopTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        index={index}
                        onView={() =>
                          handleView(transaction)
                        }
                        onApprove={() =>
                          handleApprove(transaction)
                        }
                        onReject={() =>
                          handleReject(transaction)
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total >
              TRANSACTIONS_PER_PAGE && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </section>

      {/* ======================================================
          APPROVE / REJECT MODAL
      ====================================================== */}

      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={
          modalContent?.title ||
          'Confirm action'
        }
        size="sm"
        position="center"
        showCloseButton={!modalLoading}
        closeOnOutsideClick={false}
      >
        {modalContent && selectedTx && (
          <div className="min-w-0 space-y-5">
            {/* Message */}
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`
                  flex h-11 w-11 shrink-0
                  items-center justify-center
                  rounded-xl
                  ${
                    modalContent.type ===
                    'danger'
                      ? 'bg-red-50'
                      : 'bg-emerald-50'
                  }
                `}
              >
                {modalContent.type ===
                'danger' ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">
                  {modalContent.title}
                </h3>

                <p className="mt-1.5 text-sm leading-5 text-gray-600">
                  {modalContent.message}
                </p>
              </div>
            </div>

            {/* Transaction summary */}
            <div
              className={`
                min-w-0 overflow-hidden
                rounded-xl border p-4
                ${
                  isReviewable(selectedTx)
                    ? 'border-amber-200 bg-amber-50/60'
                    : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">
                    Transfer amount
                  </p>

                  <p
                    className={`
                      mt-0.5 truncate
                      text-xl font-bold
                      ${
                        isReviewable(selectedTx)
                          ? 'text-amber-700'
                          : 'text-gray-900'
                      }
                    `}
                  >
                    {formatCurrency(
                      Math.abs(
                        Number(
                          selectedTx.amount
                        ) || 0
                      )
                    )}
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge
                    status={
                      selectedTx.status
                    }
                  />
                </div>
              </div>

              <div className="mt-3 border-t border-gray-200/70 pt-3">
                <p className="text-xs text-gray-500">
                  Reference
                </p>

                <p
                  className="
                    mt-1
                    break-all
                    font-mono text-[11px]
                    leading-4 text-gray-700
                  "
                >
                  {selectedTx.reference_id ||
                    '—'}
                </p>
              </div>

              {selectedTx.account?.account_number && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500">
                    Sender account
                  </p>

                  <p
                    className="
                      mt-1
                      break-all
                      font-mono text-[11px]
                      leading-4 text-gray-700
                    "
                  >
                    {selectedTx.account.account_number}
                  </p>
                </div>
              )}

              {isReviewable(selectedTx) && (
                <div className="mt-3 flex min-w-0 items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                  <p className="min-w-0 text-xs leading-4 text-amber-700">
                    This transfer is awaiting approval.
                    No money has moved yet.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={modalLoading}
                className="
                  inline-flex
                  items-center justify-center
                  rounded-xl
                  px-4 py-2.5
                  text-sm font-medium
                  text-gray-700
                  transition-colors
                  hover:bg-gray-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={modalLoading}
                className={`
                  inline-flex
                  items-center justify-center
                  gap-2
                  rounded-xl
                  px-4 py-2.5
                  text-sm font-semibold
                  text-white
                  transition-colors
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  ${
                    modalContent.type ===
                    'danger'
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
                    {modalContent.type ===
                    'danger' ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}

                    <span>
                      {modalContent.confirmText}
                    </span>
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

export default TransactionsList;