import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import Receipt from '../Receipt';

import {
  History,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileText,
  Edit3,
  Save,
  X,
  ArrowUpDown,
  CalendarDays,
  CircleDollarSign,
  Activity,
  Sparkles,
  UserRound,
  Copy,
  Check,
} from 'lucide-react';

import {
  formatCurrency,
  formatDate,
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
      return 'Pending review';
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

const isReviewable = (transaction) =>
  transaction?.status === 'pending_review';

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

const getAmountClass = (transaction) => {
  if (transaction?.status === 'pending_review') {
    return 'text-amber-600';
  }

  switch (transaction?.transaction_type) {
    case 'credit':
      return 'text-emerald-600';
    case 'debit':
      return 'text-rose-600';
    default:
      return 'text-primary-600';
  }
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'pending_review':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'failed':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'cancelled':
      return 'border-slate-200 bg-slate-50 text-slate-600';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

const getTransactionSearchText = (transaction) => {
  const profile = transaction?.account?.profiles;
  const account = transaction?.account;

  return [
    transaction?.description,
    transaction?.reference_id,
    transaction?.transaction_type,
    transaction?.status,
    account?.account_number,
    profile?.full_name,
    profile?.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return 'TX';

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

const copyToClipboard = async (value) => {
  if (!value) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

// ============================================================
// STATUS BADGE
// ============================================================

const StatusBadge = ({ status }) => {
  const reviewable = status === 'pending_review';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border px-2.5 py-1
        text-[10px] font-bold tracking-wide
        whitespace-nowrap
        ${getStatusClasses(status)}
      `}
    >
      {reviewable ? (
        <Clock3 className="h-3 w-3" />
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === 'completed'
              ? 'bg-emerald-500'
              : status === 'failed'
              ? 'bg-rose-500'
              : 'bg-slate-400'
          }`}
        />
      )}

      {getDisplayStatus(status)}
    </span>
  );
};

// ============================================================
// TRANSACTION ICON
// ============================================================

const TransactionIcon = ({ transaction, compact = false }) => {
  const size = compact ? 'h-10 w-10' : 'h-12 w-12';
  const iconSize = compact ? 'h-[17px] w-[17px]' : 'h-5 w-5';

  let wrapper = 'bg-primary-50 text-primary-600';
  let Icon = ArrowRight;

  if (transaction?.status === 'pending_review') {
    wrapper = 'bg-amber-50 text-amber-600';
    Icon = Clock3;
  } else if (transaction?.transaction_type === 'credit') {
    wrapper = 'bg-emerald-50 text-emerald-600';
    Icon = ArrowDownLeft;
  } else if (transaction?.transaction_type === 'debit') {
    wrapper = 'bg-rose-50 text-rose-600';
    Icon = ArrowUpRight;
  }

  return (
    <div
      className={`
        ${size}
        shrink-0 rounded-2xl
        flex items-center justify-center
        ${wrapper}
      `}
    >
      <Icon className={iconSize} strokeWidth={2.2} />
    </div>
  );
};

// ============================================================
// ACTION MENU
// ============================================================

const ActionMenu = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!actions.length) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="More transaction actions"
        aria-expanded={isOpen}
        className="
          flex h-9 w-9 items-center justify-center
          rounded-xl border border-slate-200
          bg-white text-slate-400
          transition-all duration-200
          hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600
          focus:outline-none focus:ring-2 focus:ring-primary-500/15
        "
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="
              absolute right-0 top-full z-50 mt-2
              w-56 overflow-hidden
              rounded-2xl border border-slate-200
              bg-white p-1.5
              shadow-[0_18px_50px_rgba(15,23,42,0.12)]
            "
          >
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
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-left text-sm font-medium
                    transition-colors
                    ${
                      action.danger
                        ? 'text-rose-600 hover:bg-rose-50'
                        : action.success
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
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
  tone = 'neutral',
  helper,
}) => {
  const tones = {
    neutral: {
      icon: 'bg-slate-100 text-slate-600',
      value: 'text-slate-900',
      accent: 'bg-slate-200',
    },
    amber: {
      icon: 'bg-amber-100 text-amber-600',
      value: 'text-amber-700',
      accent: 'bg-amber-200',
    },
    emerald: {
      icon: 'bg-emerald-100 text-emerald-600',
      value: 'text-emerald-700',
      accent: 'bg-emerald-200',
    },
    blue: {
      icon: 'bg-primary-100 text-primary-600',
      value: 'text-primary-700',
      accent: 'bg-primary-200',
    },
  };

  const current = tones[tone] || tones.neutral;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="
        relative min-w-0 overflow-hidden
        rounded-2xl border border-slate-200
        bg-white p-4
        shadow-[0_4px_18px_rgba(15,23,42,0.035)]
      "
    >
      <div
        className={`absolute left-0 top-0 h-1 w-14 rounded-br-full ${current.accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p
            className={`mt-2 truncate text-xl font-extrabold tracking-tight sm:text-2xl ${current.value}`}
            title={String(value)}
          >
            {value}
          </p>

          {helper && (
            <p className="mt-1 truncate text-[11px] text-slate-400">
              {helper}
            </p>
          )}
        </div>

        <div
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl ${current.icon}
          `}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState = ({ searchActive }) => (
  <div className="px-5 py-16 text-center">
    <div
      className="
        mx-auto flex h-16 w-16 items-center justify-center
        rounded-[20px] bg-slate-50
        ring-1 ring-slate-100
      "
    >
      {searchActive ? (
        <Search className="h-7 w-7 text-slate-300" />
      ) : (
        <History className="h-7 w-7 text-slate-300" />
      )}
    </div>

    <h3 className="mt-5 text-base font-bold text-slate-900">
      {searchActive ? 'No matching transactions' : 'No transactions yet'}
    </h3>

    <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
      {searchActive
        ? 'Try a different name, reference, account number or transaction type.'
        : 'Transactions matching your current filter will appear here.'}
    </p>
  </div>
);

// ============================================================
// MOBILE TRANSACTION CARD
// ============================================================

const MobileTransactionCard = ({
  transaction,
  index,
  onView,
  onViewReceipt,
  onEdit,
  onApprove,
  onReject,
}) => {
  const reviewable = isReviewable(transaction);
  const amount = Math.abs(Number(transaction?.amount) || 0);
  const type = transaction?.transaction_type;
  const profile = transaction?.account?.profiles;

  const personName = profile?.full_name || 'Account holder';

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.25 }}
      className={`
        relative overflow-hidden
        rounded-[22px] border bg-white
        p-4
        shadow-[0_5px_22px_rgba(15,23,42,0.04)]
        ${
          reviewable
            ? 'border-amber-200 ring-1 ring-amber-100'
            : 'border-slate-200'
        }
      `}
    >
      {reviewable && (
        <div className="absolute inset-x-0 top-0 h-1 bg-amber-400" />
      )}

      <div className="flex items-start gap-3">
        <TransactionIcon transaction={transaction} compact />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {transaction?.description || 'Transaction'}
              </p>

              <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                <UserRound className="h-3 w-3 shrink-0 text-slate-300" />
                <span className="truncate text-xs text-slate-400">
                  {personName}
                </span>
              </div>
            </div>

            <ActionMenu
              actions={[
                {
                  label: 'View details',
                  icon: Eye,
                  onClick: onView,
                },
                {
                  label: 'View receipt',
                  icon: FileText,
                  onClick: onViewReceipt,
                },
                {
                  label: 'Edit transaction',
                  icon: Edit3,
                  onClick: onEdit,
                },
                ...(reviewable
                  ? [
                      {
                        label: 'Approve transfer',
                        icon: CheckCircle2,
                        success: true,
                        onClick: onApprove,
                      },
                      {
                        label: 'Decline transfer',
                        icon: XCircle,
                        danger: true,
                        onClick: onReject,
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
              {getTransactionTypeLabel(type)}
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-200" />

            <span className="truncate text-[10px] text-slate-400">
              {formatDate(transaction?.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Amount
            </p>

            <p
              className={`mt-1 truncate text-xl font-extrabold tracking-tight ${getAmountClass(
                transaction
              )}`}
            >
              {type === 'credit' && '+'}
              {type === 'debit' && '-'}
              {formatCurrency(amount)}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status={transaction?.status} />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Reference
            </span>

            <span className="min-w-0 truncate font-mono text-[10px] text-slate-500">
              {transaction?.reference_id || '—'}
            </span>
          </div>
        </div>

        {reviewable && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <p className="text-[11px] font-medium leading-4 text-amber-700">
              No money has moved. This transfer is waiting for admin review.
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
  onViewReceipt,
  onEdit,
  onApprove,
  onReject,
}) => {
  const reviewable = isReviewable(transaction);
  const amount = Math.abs(Number(transaction?.amount) || 0);
  const type = transaction?.transaction_type;
  const profile = transaction?.account?.profiles;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.018 }}
      className={`
        group border-b border-slate-100
        transition-colors last:border-b-0
        ${
          reviewable
            ? 'bg-amber-50/35 hover:bg-amber-50/60'
            : 'hover:bg-slate-50/70'
        }
      `}
    >
      {/* Transaction */}
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <TransactionIcon transaction={transaction} compact />

          <div className="min-w-0">
            <p
              className="max-w-[230px] truncate text-sm font-bold text-slate-900"
              title={transaction?.description || 'Transaction'}
            >
              {transaction?.description || 'Transaction'}
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400">
                {getTransactionTypeLabel(type)}
              </span>

              {profile?.full_name && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className="max-w-[130px] truncate text-[11px] text-slate-400">
                    {profile.full_name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Reference */}
      <td className="px-4 py-4">
        <div className="flex max-w-[185px] items-center gap-2">
          <span
            className="min-w-0 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[10px] text-slate-500"
            title={transaction?.reference_id}
          >
            {transaction?.reference_id || '—'}
          </span>
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-4 text-right">
        <p
          className={`whitespace-nowrap text-sm font-extrabold ${getAmountClass(
            transaction
          )}`}
        >
          {type === 'credit' && '+'}
          {type === 'debit' && '-'}
          {formatCurrency(amount)}
        </p>

        {reviewable && (
          <p className="mt-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-wide text-amber-600">
            Awaiting approval
          </p>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <StatusBadge status={transaction?.status} />
      </td>

      {/* Date */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-xs font-medium text-slate-500">
            {formatDate(transaction?.created_at)}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onView}
            title="View details"
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl text-slate-300
              transition-all
              hover:bg-primary-50 hover:text-primary-600
              focus:outline-none focus:ring-2 focus:ring-primary-500/15
            "
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onViewReceipt}
            title="View receipt"
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl text-slate-300
              transition-all
              hover:bg-emerald-50 hover:text-emerald-600
              focus:outline-none focus:ring-2 focus:ring-emerald-500/15
            "
          >
            <FileText className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit transaction"
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl text-slate-300
              transition-all
              hover:bg-blue-50 hover:text-blue-600
              focus:outline-none focus:ring-2 focus:ring-blue-500/15
            "
          >
            <Edit3 className="h-4 w-4" />
          </button>

          {reviewable ? (
            <>
              <button
                type="button"
                onClick={onApprove}
                className="
                  ml-1 inline-flex items-center gap-1.5
                  rounded-xl border border-emerald-200
                  bg-emerald-50 px-3 py-2
                  text-[11px] font-bold text-emerald-700
                  transition-all
                  hover:border-emerald-300 hover:bg-emerald-100
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/15
                "
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                className="
                  inline-flex items-center gap-1.5
                  rounded-xl border border-rose-200
                  bg-rose-50 px-3 py-2
                  text-[11px] font-bold text-rose-700
                  transition-all
                  hover:border-rose-300 hover:bg-rose-100
                  focus:outline-none focus:ring-2 focus:ring-rose-500/15
                "
              >
                <XCircle className="h-3.5 w-3.5" />
                Decline
              </button>
            </>
          ) : (
            <div className="ml-1">
              <ActionMenu
                actions={[
                  {
                    label: 'View details',
                    icon: Eye,
                    onClick: onView,
                  },
                  {
                    label: 'View receipt',
                    icon: FileText,
                    onClick: onViewReceipt,
                  },
                  {
                    label: 'Edit transaction',
                    icon: Edit3,
                    onClick: onEdit,
                  },
                ]}
              />
            </div>
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

  const items = [];

  pages.forEach((page, index) => {
    const previous = pages[index - 1];

    if (previous && page - previous > 1) {
      items.push(
        <span
          key={`ellipsis-${page}`}
          className="flex h-9 w-9 items-center justify-center text-xs text-slate-300"
        >
          •••
        </span>
      );
    }

    items.push(
      <button
        key={page}
        type="button"
        onClick={() => onPageChange(page)}
        className={`
          flex h-9 min-w-9 items-center justify-center
          rounded-xl px-2 text-xs font-bold
          transition-all
          ${
            currentPage === page
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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
        border-t border-slate-100
        px-4 py-4
        sm:flex-row sm:items-center sm:justify-between
        sm:px-5
      "
    >
      <p className="text-xs text-slate-400">
        Showing{' '}
        <span className="font-bold text-slate-600">{start}</span>
        {' '}–{' '}
        <span className="font-bold text-slate-600">{end}</span>
        {' '}of{' '}
        <span className="font-bold text-slate-600">{total}</span>
      </p>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            flex h-9 w-9 items-center justify-center
            rounded-xl border border-slate-200
            bg-white text-slate-400
            transition-all
            hover:bg-slate-50 hover:text-slate-600
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-0.5 overflow-hidden">
          {items}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            flex h-9 w-9 items-center justify-center
            rounded-xl border border-slate-200
            bg-white text-slate-400
            transition-all
            hover:bg-slate-50 hover:text-slate-600
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// EDIT TRANSACTION MODAL
// ============================================================

const EditTransactionModal = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: '',
    status: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!transaction || !isOpen) return;

    setFormData({
      amount: transaction.amount || '',
      description: transaction.description || '',
      date: transaction.created_at
        ? new Date(transaction.created_at)
            .toISOString()
            .split('T')[0]
        : '',
      status: transaction.status || '',
    });

    setError('');
  }, [transaction, isOpen]);

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

    const amountNum = parseFloat(formData.amount);

    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description.');
      return;
    }

    if (!formData.date) {
      setError('Please select a date.');
      return;
    }

    if (!formData.status) {
      setError('Please select a status.');
      return;
    }

    setLoading(true);

    try {
      await transactionsAPI.updateTransaction(transaction.id, {
        amount: amountNum,
        description: formData.description.trim(),
        date: formData.date,
        status: formData.status,
      });

      toast.success('Transaction updated successfully.');

      onSuccess?.();
      onClose?.();
    } catch (err) {
      const message =
        err?.error ||
        err?.message ||
        'Failed to update transaction.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit transaction"
      subtitle="Update the transaction record"
      size="md"
      position="bottom"
      showCloseButton={!loading}
      closeOnOutsideClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

            <p className="text-sm font-medium leading-5 text-rose-700">
              {error}
            </p>
          </div>
        )}

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Transaction
          </p>

          <p className="mt-1 truncate text-sm font-bold text-slate-800">
            {transaction?.description || 'Transaction'}
          </p>

          <p className="mt-1 truncate font-mono text-[10px] text-slate-400">
            {transaction?.reference_id || 'No reference'}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Amount
          </label>

          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            className="
              w-full rounded-xl border border-slate-200
              bg-white px-4 py-3 text-sm text-slate-900
              outline-none transition-all
              placeholder:text-slate-300
              focus:border-primary-400
              focus:ring-4 focus:ring-primary-500/10
            "
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600">
            Description
          </label>

          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="
              w-full rounded-xl border border-slate-200
              bg-white px-4 py-3 text-sm text-slate-900
              outline-none transition-all
              placeholder:text-slate-300
              focus:border-primary-400
              focus:ring-4 focus:ring-primary-500/10
            "
            placeholder="Transaction description"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Date
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="
                w-full rounded-xl border border-slate-200
                bg-white px-4 py-3 text-sm text-slate-900
                outline-none transition-all
                focus:border-primary-400
                focus:ring-4 focus:ring-primary-500/10
              "
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Status
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="
                w-full rounded-xl border border-slate-200
                bg-white px-4 py-3 text-sm text-slate-900
                outline-none transition-all
                focus:border-primary-400
                focus:ring-4 focus:ring-primary-500/10
              "
              required
            >
              <option value="">Select status</option>
              <option value="pending_review">Pending Review</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              rounded-xl px-4 py-2.5
              text-sm font-bold text-slate-500
              transition-colors
              hover:bg-slate-100 hover:text-slate-700
              disabled:opacity-40
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl bg-primary-600 px-5 py-2.5
              text-sm font-bold text-white
              shadow-sm shadow-primary-600/20
              transition-all
              hover:bg-primary-700
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const TransactionsList = () => {
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
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptTransaction, setReceiptTransaction] =
    useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);

  const [copiedReference, setCopiedReference] = useState(false);

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
            (currentPage - 1) * TRANSACTIONS_PER_PAGE,
          status:
            filter !== 'all' ? filter : undefined,
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
            offset: 0,
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

  const normalizedSearch = search.trim().toLowerCase();

  const filteredTransactions = useMemo(() => {
    if (!normalizedSearch) return transactions;

    return transactions.filter((transaction) =>
      getTransactionSearchText(transaction).includes(
        normalizedSearch
      )
    );
  }, [transactions, normalizedSearch]);

  // ==========================================================
  // STATS
  // ==========================================================

  const pageStats = useMemo(() => {
    let pendingReview = 0;
    let completed = 0;
    let volume = 0;

    transactions.forEach((transaction) => {
      if (transaction?.status === 'pending_review') {
        pendingReview += 1;
      }

      if (transaction?.status === 'completed') {
        completed += 1;
      }

      volume += Math.abs(
        Number(transaction?.amount) || 0
      );
    });

    return {
      pendingReview,
      completed,
      volume,
    };
  }, [transactions]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      (pagination?.total || 0) /
        TRANSACTIONS_PER_PAGE
    )
  );

  // ==========================================================
  // HANDLERS
  // ==========================================================

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

  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
    setSearch('');
  };

  const handleView = (transaction) => {
    navigate(`/admin/transactions/${transaction.id}`);
  };

  const handleViewReceipt = (transaction) => {
    setReceiptTransaction(transaction);
    setReceiptModalOpen(true);
  };

  const handleEdit = (transaction) => {
    setEditTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleApprove = (transaction) => {
    setSelectedTx(transaction);

    setModalContent({
      title: 'Approve transfer',
      type: 'success',
      confirmText: 'Approve transfer',
      message:
        'Approving this transfer will allow the system to debit the sender and credit the recipient. The transaction will then be marked as completed.',
    });

    setModalOpen(true);
  };

  const handleReject = (transaction) => {
    setSelectedTx(transaction);

    setModalContent({
      title: 'Decline transfer',
      type: 'danger',
      confirmText: 'Decline transfer',
      message:
        'Declining this transfer will reject the request. No money will be moved from the sender to the recipient.',
    });

    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedTx || !modalContent) return;

    try {
      setModalLoading(true);

      if (modalContent.type === 'success') {
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
      setModalContent(null);

      await fetchAllTransactions({
        silent: true,
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

  const handleModalClose = () => {
    if (modalLoading) return;

    setModalOpen(false);
    setSelectedTx(null);
    setModalContent(null);
  };

  const handleCopyReference = async () => {
    const success = await copyToClipboard(
      selectedTx?.reference_id
    );

    if (success) {
      setCopiedReference(true);

      setTimeout(() => {
        setCopiedReference(false);
      }, 1600);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-6 p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-8 w-44 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
          </div>

          <div className="hidden h-11 w-28 animate-pulse rounded-xl bg-slate-100 sm:block" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="
                h-24 animate-pulse
                rounded-2xl border border-slate-100
                bg-white
              "
            />
          ))}
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="
        w-full min-w-0 max-w-full
        space-y-5 overflow-hidden
								p-3
        sm:space-y-6
      "
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="relative overflow-hidden">
        <div
          className="
            absolute -right-10 -top-16
            h-40 w-40 rounded-full
            bg-primary-50/70 blur-3xl
            pointer-events-none
          "
        />

        <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="
                  flex h-9 w-9 shrink-0 items-center justify-center
                  rounded-xl bg-primary-50
                  text-primary-600
                  ring-1 ring-primary-100
                "
              >
                <Activity className="h-4.5 w-4.5" />
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Operations
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Transactions
              </h1>

              <Sparkles className="hidden h-5 w-5 text-primary-300 sm:block" />
            </div>

            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
              Review activity, monitor transaction health,
              and manage account transfers from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchAllTransactions({ silent: true })
            }
            disabled={refreshing}
            className="
              inline-flex shrink-0 items-center
              justify-center gap-2
              self-start rounded-xl
              border border-slate-200
              bg-white px-4 py-2.5
              text-sm font-bold text-slate-600
              shadow-[0_3px_12px_rgba(15,23,42,0.04)]
              transition-all
              hover:border-slate-300 hover:bg-slate-50
              hover:text-slate-800
              disabled:cursor-not-allowed disabled:opacity-50
              sm:self-auto
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            flex min-w-0 items-start gap-3
            rounded-2xl border border-rose-200
            bg-rose-50 px-4 py-3
          "
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-800">
              Something went wrong
            </p>

            <p className="mt-0.5 break-words text-sm leading-5 text-rose-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="rounded-lg p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="All transactions"
          value={pagination?.total || 0}
          icon={History}
          tone="neutral"
          helper="Across all pages"
        />

        <StatCard
          label="Pending review"
          value={pageStats.pendingReview}
          icon={Clock3}
          tone="amber"
          helper="On this page"
        />

        <StatCard
          label="Completed"
          value={pageStats.completed}
          icon={CheckCircle2}
          tone="emerald"
          helper="On this page"
        />

        <StatCard
          label="Page volume"
          value={formatCurrency(pageStats.volume)}
          icon={CircleDollarSign}
          tone="blue"
          helper="Current page"
        />
      </div>

      {/* ======================================================
          SEARCH / FILTER
      ====================================================== */}

      <section
        className="
          overflow-hidden rounded-[22px]
          border border-slate-200
          bg-white
          p-3
          shadow-[0_5px_24px_rgba(15,23,42,0.035)]
          sm:p-4
        "
      >
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="
                pointer-events-none
                absolute left-3.5 top-1/2
                h-4 w-4 -translate-y-1/2
                text-slate-300
              "
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by description, reference, account or customer…"
              className="
                block w-full min-w-0
                rounded-xl border border-slate-200
                bg-slate-50
                py-3 pl-10 pr-4
                text-sm text-slate-800
                outline-none transition-all
                placeholder:text-slate-400
                focus:border-primary-400
                focus:bg-white
                focus:ring-4 focus:ring-primary-500/10
              "
            />
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl bg-slate-50
                text-slate-400
              "
            >
              <Filter className="h-4 w-4" />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                handleFilterChange(event.target.value)
              }
              className="
                min-w-0 flex-1
                rounded-xl border border-slate-200
                bg-slate-50 px-3.5 py-3
                text-sm font-semibold text-slate-600
                outline-none transition-all
                focus:border-primary-400
                focus:bg-white
                focus:ring-4 focus:ring-primary-500/10
                sm:min-w-[190px] sm:flex-none
              "
            >
              <option value="all">All transactions</option>
              <option value="pending_review">
                Pending review
              </option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {normalizedSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex items-center justify-between gap-3 px-1">
                <p className="text-[11px] font-medium text-slate-400">
                  Searching the transactions currently loaded
                  on this page.
                </p>

                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="shrink-0 text-[11px] font-bold text-primary-600 hover:text-primary-700"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ======================================================
          REVIEW BANNER
      ====================================================== */}

      {transactions.some(isReviewable) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="
            relative overflow-hidden
            rounded-[22px]
            border border-amber-200
            bg-gradient-to-r from-amber-50 to-white
            px-4 py-4
            sm:px-5
          "
        >
          <div className="absolute right-0 top-0 h-full w-24 bg-amber-100/30 [clip-path:polygon(40%_0,100%_0,100%_100%,0_100%)]" />

          <div className="relative flex items-start gap-3">
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl bg-amber-100
                text-amber-600
              "
            >
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-amber-900">
                Transfers need your attention
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-amber-700 sm:text-sm">
                Pending Review transfers have not moved
                any money. Review the details before
                approving or declining them.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ======================================================
          MOBILE
      ====================================================== */}

      <div className="min-w-0 space-y-3 md:hidden">
        {filteredTransactions.length === 0 ? (
          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
            <EmptyState
              searchActive={Boolean(normalizedSearch)}
            />
          </div>
        ) : (
          filteredTransactions.map(
            (transaction, index) => (
              <MobileTransactionCard
                key={transaction.id}
                transaction={transaction}
                index={index}
                onView={() => handleView(transaction)}
                onViewReceipt={() =>
                  handleViewReceipt(transaction)
                }
                onEdit={() =>
                  handleEdit(transaction)
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

        {pagination.total >
          TRANSACTIONS_PER_PAGE && (
          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* ======================================================
          DESKTOP
      ====================================================== */}

      <section
        className="
          hidden min-w-0 max-w-full
          overflow-hidden
          rounded-[24px]
          border border-slate-200
          bg-white
          shadow-[0_7px_30px_rgba(15,23,42,0.045)]
          md:block
        "
      >
        {filteredTransactions.length === 0 ? (
          <EmptyState
            searchActive={Boolean(normalizedSearch)}
          />
        ) : (
          <>
            <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[980px] table-fixed">
                <colgroup>
                  <col className="w-[23%]" />
                  <col className="w-[16%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[24%]" />
                </colgroup>

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                        Transaction
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      </div>
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Reference
                    </th>

                    <th className="px-4 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Amount
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Status
                    </th>

                    <th className="px-4 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (transaction, index) => (
                      <DesktopTransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        index={index}
                        onView={() =>
                          handleView(transaction)
                        }
                        onViewReceipt={() =>
                          handleViewReceipt(transaction)
                        }
                        onEdit={() =>
                          handleEdit(transaction)
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
          APPROVE / DECLINE MODAL
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
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div
                className={`
                  flex h-12 w-12 shrink-0
                  items-center justify-center
                  rounded-2xl
                  ${
                    modalContent.type === 'danger'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }
                `}
              >
                {modalContent.type === 'danger' ? (
                  <XCircle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-900">
                  {modalContent.title}
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {modalContent.message}
                </p>
              </div>
            </div>

            <div
              className={`
                overflow-hidden rounded-2xl border p-4
                ${
                  isReviewable(selectedTx)
                    ? 'border-amber-200 bg-amber-50/60'
                    : 'border-slate-200 bg-slate-50'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Transfer amount
                  </p>

                  <p
                    className={`
                      mt-1 truncate text-2xl font-extrabold
                      ${
                        isReviewable(selectedTx)
                          ? 'text-amber-700'
                          : 'text-slate-900'
                      }
                    `}
                  >
                    {formatCurrency(
                      Math.abs(
                        Number(selectedTx.amount) || 0
                      )
                    )}
                  </p>
                </div>

                <StatusBadge
                  status={selectedTx.status}
                />
              </div>

              <div className="mt-4 border-t border-slate-200/70 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Reference
                  </p>

                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="
                      inline-flex shrink-0 items-center gap-1
                      rounded-lg px-2 py-1
                      text-[10px] font-bold text-primary-600
                      hover:bg-primary-50
                    "
                  >
                    {copiedReference ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-1 break-all font-mono text-[11px] leading-5 text-slate-600">
                  {selectedTx.reference_id ||
                    'No reference'}
                </p>
              </div>

              {selectedTx.account?.account_number && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Sender account
                  </p>

                  <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
                    {selectedTx.account.account_number}
                  </p>
                </div>
              )}

              {isReviewable(selectedTx) && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-white/70 px-3 py-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                  <p className="text-xs font-medium leading-5 text-amber-700">
                    This transfer is awaiting approval.
                    No money has moved yet.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={modalLoading}
                className="
                  rounded-xl px-4 py-2.5
                  text-sm font-bold text-slate-500
                  transition-colors
                  hover:bg-slate-100 hover:text-slate-700
                  disabled:opacity-40
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={modalLoading}
                className={`
                  inline-flex items-center justify-center gap-2
                  rounded-xl px-5 py-2.5
                  text-sm font-bold text-white
                  shadow-sm
                  transition-all
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${
                    modalContent.type === 'danger'
                      ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
                      : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                  }
                `}
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : modalContent.type === 'danger' ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    {modalContent.confirmText}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {modalContent.confirmText}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================
          RECEIPT
      ====================================================== */}

      <Modal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setReceiptTransaction(null);
        }}
        title="Transaction receipt"
        size="lg"
        position="center"
        showCloseButton
        closeOnOutsideClick
      >
        {receiptTransaction && (
          <Receipt
            transaction={receiptTransaction}
            
          />
        )}
      </Modal>

      {/* ======================================================
          EDIT
      ====================================================== */}

      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditTransaction(null);
        }}
        transaction={editTransaction}
        onSuccess={() =>
          fetchAllTransactions({ silent: true })
        }
      />
    </motion.div>
  );
};

export default TransactionsList;