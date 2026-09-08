import React, { useState, useEffect, useRef, useMemo } from 'react';
import { transactionsAPI, accountsAPI } from '../api';
import {
  formatCurrency,
  formatDate,
  formatAccountNumber,
} from '../utils/helpers';
import Modal from './Modal';
import Receipt from './Receipt'; // ✅ Import the standalone Receipt

import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Wallet,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Printer,
  X,
  CheckCircle2,
  Clock3,
  XCircle,
  Copy,
  Check,
  Receipt as ReceiptText,
  CalendarDays,
  Hash,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  Share2,
  CalendarRange,
  Info,
} from 'lucide-react';

/* ============================================================
   TRANSACTION TYPE HELPERS
============================================================ */

const getTransactionDirection = (type) => {
  const normalizedType = String(type || '').toLowerCase();

  if (normalizedType === 'credit') {
    return 'credit';
  }

  if (
    normalizedType === 'debit' ||
    normalizedType === 'transfer'
  ) {
    return 'debit';
  }

  return 'debit';
};

const getTransactionAmount = (transaction) => {
  const amount = Math.abs(Number(transaction?.amount || 0));

  return getTransactionDirection(
    transaction?.transaction_type
  ) === 'credit'
    ? amount
    : -amount;
};

const getTransactionAmountPrefix = (transaction) => {
  return getTransactionAmount(transaction) >= 0 ? '+' : '−';
};

const getTransactionAmountClass = (transaction) => {
  return getTransactionAmount(transaction) >= 0
    ? 'text-emerald-600'
    : 'text-red-600';
};

/* ============================================================
   TRANSACTION TYPE CONFIG
============================================================ */

const transactionConfig = {
  credit: {
    label: 'Money received',
    icon: ArrowDownLeft,
    iconContainer: 'bg-emerald-50 text-emerald-600',
  },

  debit: {
    label: 'Money sent',
    icon: ArrowUpRight,
    iconContainer: 'bg-red-50 text-red-600',
  },

  transfer: {
    label: 'Transfer sent',
    icon: ArrowLeftRight,
    iconContainer: 'bg-red-50 text-red-600',
  },
};

const getTransactionConfig = (type) => {
  return (
    transactionConfig[String(type || '').toLowerCase()] ||
    transactionConfig.debit
  );
};

/* ============================================================
   STATUS CONFIG
============================================================ */

const statusConfig = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    iconClass: 'text-emerald-600',
  },

  pending_review: {
    label: 'Pending Review',
    icon: Clock3,
    classes: 'bg-amber-50 text-amber-700 border-amber-100',
    iconClass: 'text-amber-600',
  },

  failed: {
    label: 'Failed',
    icon: XCircle,
    classes: 'bg-red-50 text-red-700 border-red-100',
    iconClass: 'text-red-600',
  },

  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    classes: 'bg-gray-100 text-gray-600 border-gray-200',
    iconClass: 'text-gray-500',
  },
};

/* ============================================================
   STATUS BADGE
============================================================ */

const StatusBadge = ({ status }) => {
  const normalizedStatus = String(status || '').toLowerCase();

  const config =
    statusConfig[normalizedStatus] ||
    statusConfig.pending_review;

  const StatusIcon = config.icon;

  // Only spin for pending_review
  const isSpinning = normalizedStatus === 'pending_review';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${config.classes}`}
    >
      <StatusIcon
        className={`h-3.5 w-3.5 ${config.iconClass} ${
          isSpinning ? 'animate-spin' : ''
        }`}
      />

      {config.label}
    </span>
  );
};

/* ============================================================
   TRANSACTION ICON
============================================================ */

const TransactionIcon = ({ type }) => {
  const config = getTransactionConfig(type);

  const Icon = config.icon;

  return (
    <div
      className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconContainer}`}
    >
      <Icon
        className="h-5 w-5"
        strokeWidth={2}
      />
    </div>
  );
};

/* ============================================================
   CUSTOM ACCOUNT SELECT
============================================================ */

const AccountSelector = ({
  accounts,
  selectedAccount,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);

  const selected = accounts.find(
    (account) => account.id === selectedAccount
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  if (!selected) return null;

  return (
    <div
      className="relative w-full sm:w-[320px]"
      ref={selectorRef}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors ${
          open
            ? 'border-primary-500 ring-2 ring-primary-100'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <Wallet className="h-4 w-4" />
          </div>

          <div className="ml-3 min-w-0">
            <p className="text-sm font-semibold text-gray-900 capitalize truncate">
              {selected.account_type} account
            </p>

            <p className="text-xs text-gray-500 font-mono truncate">
              {formatAccountNumber(
                selected.account_number
              )}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Select account
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            {accounts.map((account) => {
              const isSelected =
                account.id === selectedAccount;

              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    onChange(account.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-primary-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Wallet className="h-4 w-4" />
                    </div>

                    <div className="ml-3 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {account.account_type} account
                      </p>

                      <p className="text-xs text-gray-500 font-mono">
                        {formatAccountNumber(
                          account.account_number
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(account.balance)}
                    </p>

                    {isSelected && (
                      <p className="text-[10px] text-primary-600 font-medium mt-0.5">
                        Selected
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   DESKTOP TRANSACTION ROW
============================================================ */

const TransactionRow = ({
  transaction,
  onReceipt,
}) => {
  const config = getTransactionConfig(
    transaction.transaction_type
  );

  const amountClass =
    getTransactionAmountClass(transaction);

  const prefix =
    getTransactionAmountPrefix(transaction);

  return (
    <tr className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <TransactionIcon
            type={transaction.transaction_type}
          />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {transaction.transaction_type}
            </p>

            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">
              {config.label}
            </p>
          </div>
        </div>
      </td>

      <td className="py-4 px-4">
        <p className="text-sm text-gray-700 max-w-[230px] truncate">
          {transaction.description ||
            'Transaction'}
        </p>

        {transaction.reference_id && (
          <p className="text-[11px] text-gray-400 font-mono mt-1 truncate max-w-[230px]">
            {transaction.reference_id}
          </p>
        )}
      </td>

      <td className="py-4 px-4">
        <span
          className={`text-sm font-bold tabular-nums ${amountClass}`}
        >
          {prefix}
          {formatCurrency(
            Math.abs(
              Number(transaction.amount || 0)
            )
          )}
        </span>
      </td>

      <td className="py-4 px-4">
        <StatusBadge
          status={transaction.status}
        />
      </td>

      <td className="py-4 px-4">
        <p className="text-sm text-gray-600 whitespace-nowrap">
          {formatDate(transaction.created_at)}
        </p>
      </td>

      <td className="py-4 px-4 text-right">
        <button
          type="button"
          onClick={() =>
            onReceipt(transaction)
          }
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="View receipt"
        >
          <ReceiptText className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
};

/* ============================================================
   MOBILE TRANSACTION CARD
============================================================ */

const TransactionCard = ({
  transaction,
  onReceipt,
}) => {
  const amountClass =
    getTransactionAmountClass(transaction);

  const prefix =
    getTransactionAmountPrefix(transaction);

  return (
    <button
      type="button"
      onClick={() =>
        onReceipt(transaction)
      }
      className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <TransactionIcon
          type={transaction.transaction_type}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 capitalize truncate">
                {transaction.transaction_type}
              </p>

              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {transaction.description ||
                  'Transaction'}
              </p>
            </div>

            <p
              className={`text-sm font-bold whitespace-nowrap tabular-nums ${amountClass}`}
            >
              {prefix}
              {formatCurrency(
                Math.abs(
                  Number(transaction.amount || 0)
                )
              )}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge
                status={transaction.status}
              />

              <span className="text-[11px] text-gray-400">
                {formatDate(
                  transaction.created_at
                )}
              </span>
            </div>

            <ReceiptText className="h-4 w-4 text-gray-300" />
          </div>
        </div>
      </div>
    </button>
  );
};

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyTransactions = () => {
  return (
    <div className="py-16 px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
        <History className="h-7 w-7" />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mt-5">
        No transactions yet
      </h3>

      <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
        Transactions for this account will appear
        here once activity begins.
      </p>
    </div>
  );
};

/* ============================================================
   STATEMENT REQUEST MODAL
============================================================ */

const StatementRequest = ({
  onClose,
  onGenerate,
}) => {
  const [period, setPeriod] =
    useState('30d');

  const [fromDate, setFromDate] =
    useState('');

  const [toDate, setToDate] =
    useState('');

  const today = new Date();

  const formatInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const end = new Date();
    let start = new Date();

    if (period === '7d') {
      start.setDate(start.getDate() - 7);
    }
    if (period === '30d') {
      start.setDate(start.getDate() - 30);
    }
    if (period === '90d') {
      start.setDate(start.getDate() - 90);
    }
    if (period === 'year') {
      start = new Date(today.getFullYear(), 0, 1);
    }

    if (period !== 'custom') {
      setFromDate(formatInputDate(start));
      setToDate(formatInputDate(end));
    }
  }, [period]);

  const handleGenerate = () => {
    if (!fromDate || !toDate) return;

    onGenerate({
      from: fromDate,
      to: toDate,
    });
  };

  return (
    <div className="bg-white">
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Request statement
            </h2>

            <p className="text-xs text-gray-500 mt-0.5">
              Select the period for your account statement.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Statement period
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['7d', 'Last 7 days'],
            ['30d', 'Last 30 days'],
            ['90d', 'Last 90 days'],
            ['year', 'This year'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                period === value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPeriod('custom')}
          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            period === 'custom'
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CalendarRange className="h-4 w-4" />
          Custom date range
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              From
            </label>

            <input
              type="date"
              value={fromDate}
              max={toDate || formatInputDate(today)}
              onChange={(event) => {
                setPeriod('custom');
                setFromDate(event.target.value);
              }}
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              To
            </label>

            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={formatInputDate(today)}
              onChange={(event) => {
                setPeriod('custom');
                setToDate(event.target.value);
              }}
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                Your statement will include
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Account details, transaction dates,
                descriptions, references, transaction
                amounts, status and a period summary.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!fromDate || !toDate}
            className="flex-1 h-11 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   GENERATED STATEMENT
============================================================ */

const Statement = ({
  account,
  transactions,
  from,
  to,
  onClose,
}) => {
  const statementTransactions = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);

    return transactions
      .filter((transaction) => {
        const date = new Date(transaction.created_at);
        return date >= start && date <= end;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [transactions, from, to]);

  const credits = statementTransactions
    .filter(
      (transaction) =>
        getTransactionDirection(
          transaction.transaction_type
        ) === 'credit'
    )
    .reduce(
      (sum, transaction) =>
        sum +
        Math.abs(
          Number(transaction.amount || 0)
        ),
      0
    );

  const debits = statementTransactions
    .filter(
      (transaction) =>
        getTransactionDirection(
          transaction.transaction_type
        ) === 'debit'
    )
    .reduce(
      (sum, transaction) =>
        sum +
        Math.abs(
          Number(transaction.amount || 0)
        ),
      0
    );

  const netMovement = credits - debits;

  const handlePrint = () => {
    window.print();
  };

  const accountNumber =
    account?.account_number
      ? formatAccountNumber(
          account.account_number
        )
      : 'N/A';

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .account-statement,
          .account-statement * {
            visibility: visible !important;
          }

          .account-statement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }

          .statement-no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="account-statement bg-white max-w-4xl mx-auto">
        <div className="px-6 sm:px-8 py-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Account Statement
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Transaction statement
                  </p>
                </div>
              </div>
            </div>

            <div className="statement-no-print flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="h-9 px-3 rounded-lg bg-primary-600 text-white text-xs font-semibold flex items-center gap-2 hover:bg-primary-700"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Account
              </p>

              <p className="text-sm font-semibold text-gray-900 mt-1">
                {account?.account_type || 'Account'}
              </p>

              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {accountNumber}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Statement period
              </p>

              <p className="text-sm font-semibold text-gray-900 mt-1">
                {from}
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                to {to}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Transactions
              </p>

              <p className="text-sm font-semibold text-gray-900 mt-1">
                {statementTransactions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">
                Money received
              </p>

              <p className="text-lg font-bold text-emerald-700 mt-1">
                +
                {formatCurrency(credits)}
              </p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs text-red-700">
                Money sent
              </p>

              <p className="text-lg font-bold text-red-700 mt-1">
                −
                {formatCurrency(debits)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Net movement
              </p>

              <p
                className={`text-lg font-bold mt-1 ${
                  netMovement >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {netMovement >= 0
                  ? '+'
                  : '−'}
                {formatCurrency(
                  Math.abs(netMovement)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                      Date
                    </th>

                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                      Description
                    </th>

                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                      Reference
                    </th>

                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                      Amount
                    </th>

                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {statementTransactions.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-12 text-center"
                      >
                        <FileText className="h-8 w-8 text-gray-300 mx-auto" />

                        <p className="text-sm font-semibold text-gray-700 mt-3">
                          No transactions found
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          There were no transactions
                          during this period.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    statementTransactions.map(
                      (transaction) => {
                        const amountClass =
                          getTransactionAmountClass(
                            transaction
                          );

                        const prefix =
                          getTransactionAmountPrefix(
                            transaction
                          );

                        return (
                          <tr
                            key={transaction.id}
                            className="border-b border-gray-100 last:border-b-0"
                          >
                            <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                              {formatDate(
                                transaction.created_at
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-800">
                                {transaction.description ||
                                  'Transaction'}
                              </p>

                              <p className="text-[10px] text-gray-400 capitalize mt-0.5">
                                {
                                  transaction.transaction_type
                                }
                              </p>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-[10px] font-mono text-gray-500">
                                {transaction.reference_id ||
                                  'N/A'}
                              </span>
                            </td>

                            <td
                              className={`px-4 py-3 text-right text-xs font-bold tabular-nums whitespace-nowrap ${amountClass}`}
                            >
                              {prefix}
                              {formatCurrency(
                                Math.abs(
                                  Number(
                                    transaction.amount ||
                                      0
                                  )
                                )
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge
                                status={
                                  transaction.status
                                }
                              />
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400">
              This is a computer-generated account
              statement.
            </p>

            <p className="text-[10px] text-gray-400 mt-1">
              Generated from the transaction history
              available for this account.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

const Transactions = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
  });

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [statementRequestOpen, setStatementRequestOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementPeriod, setStatementPeriod] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
    }
  }, [
    selectedAccount,
    pagination.offset,
  ]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await accountsAPI.getAll();
      const accountList = data.accounts || [];

      setAccounts(accountList);

      if (accountList.length > 0) {
        const sorted = [...accountList].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setSelectedAccount(sorted[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('Failed to load your accounts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const data = await transactionsAPI.getHistory(
        selectedAccount,
        {
          limit: pagination.limit,
          offset: pagination.offset,
        }
      );

      setTransactions(data.transactions || []);
      setPagination(
        data.pagination || {
          total: (data.transactions || []).length,
          limit: 100,
          offset: 0,
        }
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.error || 'Failed to load transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAccountChange = (accountId) => {
    setSelectedAccount(accountId);
    setPagination((prev) => ({
      ...prev,
      offset: 0,
    }));
  };

  const handlePrevPage = () => {
    if (pagination.offset === 0) return;

    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }));
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit >= pagination.total) {
      return;
    }

    setPagination((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const openReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setReceiptModalOpen(true);
  };

  const closeReceipt = () => {
    setReceiptModalOpen(false);
    setSelectedTransaction(null);
  };

  const openStatementRequest = () => {
    setStatementRequestOpen(true);
  };

  const closeStatementRequest = () => {
    setStatementRequestOpen(false);
  };

  const generateStatement = ({ from, to }) => {
    setStatementPeriod({ from, to });
    setStatementRequestOpen(false);
    setStatementOpen(true);
  };

  const closeStatement = () => {
    setStatementOpen(false);
    setStatementPeriod(null);
  };

  const selectedAccountData = accounts.find(
    (account) => account.id === selectedAccount
  );

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center">
          <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  if (!loading && accounts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 text-center shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <Wallet className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mt-5">
            No accounts available
          </h1>

          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            You need an active account before transaction history can be displayed.
          </p>
        </div>
      </div>
    );
  }

  const showingFrom = pagination.total === 0 ? 0 : pagination.offset + 1;
  const showingTo = Math.min(pagination.offset + pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary-600 mb-2">
            <History className="h-4 w-4" />
            <span>Financial activity</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Transactions
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Review and manage your transaction history.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={openStatementRequest}
            disabled={!selectedAccount}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Request Statement</span>
            <span className="sm:hidden">Statement</span>
          </button>

          <button
            type="button"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing || !selectedAccount}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Transaction account
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Select an account to view its activity.
            </p>
          </div>

          <AccountSelector
            accounts={accounts}
            selectedAccount={selectedAccount}
            onChange={handleAccountChange}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">
              Unable to load transactions
            </p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Recent activity
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pagination.total === 0
                ? 'No activity recorded'
                : `${pagination.total} transaction${pagination.total === 1 ? '' : 's'}`}
            </p>
          </div>

          {pagination.total > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <History className="h-3.5 w-3.5" />
              Transaction history
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
            <p className="text-sm text-gray-500 mt-3">Loading activity...</p>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Transaction
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onReceipt={openReceipt}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onReceipt={openReceipt}
                />
              ))}
            </div>

            {pagination.total > pagination.limit && (
              <div className="px-4 sm:px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-semibold text-gray-700">{showingFrom}</span> to{' '}
                  <span className="font-semibold text-gray-700">{showingTo}</span> of{' '}
                  <span className="font-semibold text-gray-700">{pagination.total}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={pagination.offset === 0}
                    className="h-9 w-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="h-9 min-w-9 px-2 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-semibold">
                    {Math.floor(pagination.offset / pagination.limit) + 1}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className="h-9 w-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={closeReceipt}
        title=""
        size="md"
        position="center"
        showCloseButton={false}
        closeOnOutsideClick={false}
      >
        <Receipt transaction={selectedTransaction} onClose={closeReceipt} />
      </Modal>

      <Modal
        isOpen={statementRequestOpen}
        onClose={closeStatementRequest}
        title=""
        size="md"
        position="center"
        showCloseButton={false}
        closeOnOutsideClick={false}
      >
        <StatementRequest onClose={closeStatementRequest} onGenerate={generateStatement} />
      </Modal>

      <Modal
        isOpen={statementOpen}
        onClose={closeStatement}
        title=""
        size="xl"
        position="center"
        showCloseButton={false}
        closeOnOutsideClick={false}
      >
        {statementPeriod && (
          <Statement
            account={selectedAccountData}
            transactions={transactions}
            from={statementPeriod.from}
            to={statementPeriod.to}
            onClose={closeStatement}
          />
        )}
      </Modal>
    </div>
  );
};

export default Transactions;