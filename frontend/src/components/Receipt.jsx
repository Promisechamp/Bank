import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Check,
  Copy,
  Share2,
  Download,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  User,
  Building2,
  FileText,
  Calendar,
  Clock,
  Printer,
  Loader2,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ShieldCheck,
  Receipt as ReceiptText,
  ExternalLink,
} from 'lucide-react';

import { formatCurrency, formatAccountNumber } from '../utils/helpers';
import { transactionsAPI } from '../api';
import { toast } from 'sonner';

const statusConfig = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    soft: 'bg-emerald-50',
    ring: 'ring-emerald-100',
    accent: 'bg-emerald-500',
  },

  pending_review: {
    label: 'Pending Review',
    icon: Clock3,
    iconClass: 'text-amber-600',
    soft: 'bg-amber-50',
    ring: 'ring-amber-100',
    accent: 'bg-amber-500',
  },

  failed: {
    label: 'Failed',
    icon: XCircle,
    iconClass: 'text-red-600',
    soft: 'bg-red-50',
    ring: 'ring-red-100',
    accent: 'bg-red-500',
  },

  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    iconClass: 'text-gray-500',
    soft: 'bg-gray-100',
    ring: 'ring-gray-200',
    accent: 'bg-gray-400',
  },
};

const getStatusConfig = (status) => {
  const normalized = String(status || '').toLowerCase();

  return (
    statusConfig[normalized] ||
    statusConfig.completed
  );
};

/* ================================================================
   SMALL HELPERS
================================================================ */

const DetailRow = ({
  label,
  value,
  icon: Icon,
  mono = false,
  valueClass = '',
  action,
}) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          </div>
        )}

        <span className="text-xs font-medium text-gray-500">
          {label}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2 text-right">
        <span
          className={`
            max-w-[190px] truncate
            text-xs font-semibold text-gray-900
            sm:max-w-[260px] sm:text-[13px]
            ${mono ? 'font-mono tracking-tight' : ''}
            ${valueClass}
          `}
        >
          {value}
        </span>

        {action}
      </div>
    </div>
  );
};

const Section = ({
  title,
  eyebrow,
  icon: Icon,
  children,
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_2px_10px_-6px_rgba(15,23,42,0.14)]">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 ring-1 ring-gray-200/80">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary-600">
              {eyebrow}
            </p>
          )}

          <h3 className="text-xs font-bold text-gray-800">
            {title}
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {children}
      </div>
    </section>
  );
};

const SearchReceipt = ({
  searchRef,
  setSearchRef,
  handleSearch,
  error,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.18)] sm:p-5">
      <div className="mb-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary-600">
          Find a transaction
        </p>

        <h2 className="mt-1 text-sm font-bold tracking-tight text-gray-900">
          Search by reference
        </h2>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-2.5 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Enter transaction reference"
            className="
              h-11 w-full rounded-xl
              border border-gray-200
              bg-gray-50/70
              pl-10 pr-4
              text-sm text-gray-900
              outline-none
              transition
              placeholder:text-gray-400
              focus:border-primary-400
              focus:bg-white
              focus:ring-4
              focus:ring-primary-50
            "
          />
        </div>

        <button
          type="submit"
          disabled={!searchRef.trim()}
          className="
            h-11 rounded-xl
            bg-primary-600 px-5
            text-xs font-bold text-white
            shadow-[0_6px_18px_-8px_rgba(79,70,229,0.65)]
            transition
            hover:bg-primary-700
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!error && (
        <p className="mt-2 text-[10px] leading-4 text-gray-400">
          Enter the reference shown on your transaction confirmation.
        </p>
      )}
    </div>
  );
};

/* ================================================================
   RECEIPT
================================================================ */

const Receipt = ({
  transaction: propTransaction,
  reference: propReference,
  onClose,
  standalone = false,
  showSearch = false,
}) => {
  // Helper to extract reference from URL path if standalone (e.g., /receipt/REF123)
  const getUrlReference = () => {
    if (typeof window === 'undefined') return '';
    const segments = window.location.pathname.split('/').filter(Boolean);
    // Assuming pattern like /receipt/:reference
    const receiptIndex = segments.indexOf('receipt');
    if (receiptIndex !== -1 && segments[receiptIndex + 1]) {
      return segments[receiptIndex + 1];
    }
    return '';
  };

  const initialReference = propReference || (standalone ? getUrlReference() : '');

  const [transaction, setTransaction] = useState(
    propTransaction || null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchRef, setSearchRef] = useState(initialReference);

  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  /* ================================================================
     LOAD TRANSACTION
  ================================================================ */

  useEffect(() => {
    if (propTransaction) {
      setTransaction(propTransaction);
      setLoading(false);
      return;
    }

    const activeRef = propReference || (standalone ? getUrlReference() : '');

    if (activeRef) {
      setSearchRef(activeRef);
      fetchTransaction(activeRef);
      return;
    }

    if (standalone && !activeRef) {
      setTransaction(null);
      setLoading(false);
      setError('');
    }
  }, [
    propTransaction,
    propReference,
    standalone,
  ]);

  const fetchTransaction = async (ref) => {
    if (!ref?.trim()) return;

    try {
      setLoading(true);
      setError('');

      const response =
        await transactionsAPI.getByReference(
          ref.trim()
        );

      if (
        response?.success &&
        response?.transaction
      ) {
        setTransaction(response.transaction);

        if (
          standalone &&
          window.location.pathname !==
            `/receipt/${ref.trim()}`
        ) {
          window.history.pushState(
            {},
            '',
            `/receipt/${ref.trim()}`
          );
        }
      } else {
        setTransaction(null);
        setError(
          'Transaction not found. Please check the reference number.'
        );
      }
    } catch (err) {
      console.error(
        'Failed to load transaction:',
        err
      );

      setTransaction(null);
      setError(
        err?.message ||
          'Unable to load this transaction.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchRef.trim()) {
      fetchTransaction(searchRef.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchRef('');
    setError('');
    setTransaction(null);

    if (standalone) {
      window.history.pushState(
        {},
        '',
        '/receipt'
      );
    }
  };

  /* ================================================================
     COPY
  ================================================================ */

  const handleCopyReference = async () => {
    if (!transaction?.reference_id) return;

    try {
      await navigator.clipboard.writeText(
        transaction.reference_id
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        1800
      );

      toast.success('Reference copied');
    } catch (err) {
      console.error(
        'Unable to copy reference:',
        err
      );
    }
  };

  /* ================================================================
     SHARE
  ================================================================ */

  const handleShare = async () => {
    if (!transaction) return;

    const amount = Math.abs(
      Number(transaction.amount || 0)
    );

    const formattedAmount =
      `${formatCurrency(amount)} USD`;

    const shareData = {
      title: 'Transaction Receipt',
      text:
        `Transaction of ${formattedAmount} · ` +
        `${getStatusConfig(transaction.status).label}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error(
            'Share failed:',
            err
          );
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          window.location.href
        );

        setShareFeedback(true);

        setTimeout(
          () => setShareFeedback(false),
          2000
        );

        toast.success('Receipt link copied');
      } catch (err) {
        console.error(
          'Unable to copy link:',
          err
        );
      }
    }
  };

  /* ================================================================
     PRINT
  ================================================================ */

  const handleDownload = () => {
    setIsPrinting(true);

    window.print();

    setTimeout(() => {
      setIsPrinting(false);
    }, 1000);
  };

  /* ================================================================
     DERIVED DATA
  ================================================================ */

  const receiptData = useMemo(() => {
    if (!transaction) return null;

    const status = String(
      transaction.status || 'completed'
    ).toLowerCase();

    const statusData =
      getStatusConfig(status);

    const amount = Math.abs(
      Number(transaction.amount || 0)
    );

    let metadata = {};

    try {
      metadata =
        typeof transaction.metadata === 'string'
          ? JSON.parse(transaction.metadata)
          : transaction.metadata || {};
    } catch {
      metadata = {};
    }

    const dateObj = new Date(
      transaction.created_at || Date.now()
    );

    const formattedDate =
      dateObj.toLocaleDateString(
        'en-US',
        {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }
      );

    const formattedTime =
      dateObj.toLocaleTimeString(
        'en-US',
        {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      );

    const isCredit =
      transaction.transaction_type ===
      'credit';

    const isDebit =
      transaction.transaction_type ===
      'debit';

    return {
      status,
      statusData,
      amount,
      formattedAmount:
        `${formatCurrency(amount)} USD`,
      dateObj,
      formattedDate,
      formattedTime,
      isCredit,
      isDebit,
      metadata,
    };
  }, [transaction]);

  /* ================================================================
     LOADING
  ================================================================ */

  if (loading && standalone) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-gray-200 bg-white">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>

          <p className="mt-4 text-sm font-bold text-gray-900">
            Loading receipt
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Retrieving your transaction details…
          </p>
        </div>
      </div>
    );
  }

  /* ================================================================
     STANDALONE SEARCH
  ================================================================ */

  const hasActiveRef = Boolean(initialReference);

  if (
    standalone &&
    !transaction &&
    !loading &&
    !error &&
    !hasActiveRef
  ) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <SearchReceipt
          searchRef={searchRef}
          setSearchRef={(value) => {
            setSearchRef(value);
            setError('');
          }}
          handleSearch={handleSearch}
          error={error}
        />

        <div className="rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center shadow-[0_8px_40px_-24px_rgba(15,23,42,0.22)] sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <ReceiptText className="h-7 w-7" strokeWidth={1.6} />
          </div>

          <h3 className="mt-5 text-lg font-bold tracking-tight text-gray-900">
            Find your transaction receipt
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-500">
            Enter your transaction reference above
            to securely retrieve the full receipt and
            transaction details.
          </p>
        </div>
      </div>
    );
  }

  /* ================================================================
     ERROR
  ================================================================ */

  if (
    error &&
    standalone &&
    !transaction
  ) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <SearchReceipt
          searchRef={searchRef}
          setSearchRef={(value) => {
            setSearchRef(value);
            setError('');
          }}
          handleSearch={handleSearch}
          error={error}
        />

        <div className="rounded-3xl border border-red-100 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertCircle
              className="h-7 w-7"
              strokeWidth={1.7}
            />
          </div>

          <h3 className="mt-5 text-lg font-bold tracking-tight text-gray-900">
            Receipt unavailable
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={handleClearSearch}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <Search className="h-3.5 w-3.5" />
            Try another reference
          </button>
        </div>
      </div>
    );
  }

  if (!transaction || !receiptData) {
    return null;
  }

  const {
    statusData,
    formattedAmount,
    formattedDate,
    formattedTime,
    isCredit,
    isDebit,
    metadata,
  } = receiptData;

  const StatusIcon =
    statusData.icon;

  const senderName =
    metadata.senderName || null;

  const senderBank =
    metadata.senderBank || null;

  const senderAccountNo =
    metadata.senderAccountNo || null;

  const receiverName =
    metadata.receiverName || null;

  const receiverBank =
    metadata.receiverBank || null;

  const receiverAccountNo =
    metadata.receiverAccountNo || null;

  const adminNote =
    metadata.admin_note || null;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .transaction-receipt,
          .transaction-receipt * {
            visibility: visible !important;
          }

          .transaction-receipt {
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 100% !important;
            max-width: 680px !important;
            margin: 0 !important;
            padding: 24px !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .receipt-no-print {
            display: none !important;
          }

          .receipt-print-white {
            background: white !important;
          }
        }
      `}</style>

      <div
        className={`
          transaction-receipt
          mx-auto w-full
          max-w-[680px]
          text-gray-900
          ${standalone ? 'rounded-[28px] border border-gray-200 bg-white shadow-[0_20px_70px_-35px_rgba(15,23,42,0.3)]' : ''}
        `}
      >
        {/* ========================================================
            TOP BAR
        ======================================================== */}

        <div className="receipt-no-print flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <ReceiptText className="h-4 w-4" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Transaction receipt
            </span>
          </div>

          {!standalone && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              aria-label="Close receipt"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ========================================================
            OPTIONAL SEARCH
        ======================================================== */}

        {standalone && showSearch && (
          <div className="receipt-no-print px-4 pt-4 sm:px-6">
            <SearchReceipt
              searchRef={searchRef}
              setSearchRef={(value) => {
                setSearchRef(value);
                setError('');
              }}
              handleSearch={handleSearch}
              error={error}
            />
          </div>
        )}

        {/* ========================================================
            HERO
        ======================================================== */}

        <div className="px-4 pb-6 pt-7 text-center sm:px-8 sm:pb-8 sm:pt-9">
          <div
            className={`
              mx-auto flex h-[72px] w-[72px]
              items-center justify-center
              rounded-[22px]
              ${statusData.soft}
              ${statusData.iconClass}
              ring-8 ${statusData.ring}
            `}
          >
            <StatusIcon
              className="h-8 w-8"
              strokeWidth={1.8}
            />
          </div>

          <p
            className={`
              mt-5 inline-flex items-center gap-1.5
              rounded-full px-3 py-1
              text-[10px] font-bold
              ${statusData.soft}
              ${statusData.iconClass}
            `}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusData.accent}`}
            />

            {statusData.label}
          </p>

          <h1 className="mt-3 text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            {isCredit
              ? 'Money received'
              : isDebit
                ? 'Payment sent'
                : 'Transaction completed'}
          </h1>

          <div
            className={`
              mt-3
              text-[30px]
              font-extrabold
              tracking-[-0.04em]
              sm:text-[38px]
              ${isCredit
                ? 'text-emerald-600'
                : isDebit
                  ? 'text-gray-950'
                  : 'text-gray-950'
              }
            `}
          >
            {isCredit ? '+' : isDebit ? '−' : ''}
            {formattedAmount}
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {formattedDate} · {formattedTime}
          </p>
        </div>

        {/* ========================================================
            REFERENCE STRIP
        ======================================================== */}

        <div className="mx-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 sm:mx-6">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
                Reference ID
              </p>

              <p className="mt-1 truncate font-mono text-xs font-bold tracking-tight text-gray-800">
                {transaction.reference_id}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyReference}
              className="
                receipt-no-print
                flex h-9 shrink-0
                items-center gap-1.5
                rounded-xl border border-gray-200
                bg-white px-3
                text-[10px] font-bold
                text-gray-600
                shadow-sm
                transition
                hover:border-primary-200
                hover:text-primary-600
              "
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================
            MAIN DETAILS
        ======================================================== */}

        <div className="mt-5 space-y-4 px-4 sm:px-6">
          <Section
            eyebrow="Overview"
            title="Transaction details"
            icon={FileText}
          >
            <DetailRow
              label="Status"
              value={statusData.label}
              icon={CheckCircle2}
              valueClass={statusData.iconClass}
            />

            <DetailRow
              label="Transaction type"
              value={
                isCredit
                  ? 'Credit'
                  : isDebit
                    ? 'Debit'
                    : transaction.transaction_type || 'Transaction'
              }
              icon={
                isCredit
                  ? ArrowDownLeft
                  : isDebit
                    ? ArrowUpRight
                    : FileText
              }
              valueClass={
                isCredit
                  ? 'text-emerald-600'
                  : isDebit
                    ? 'text-gray-900'
                    : ''
              }
            />

            <DetailRow
              label="Amount"
              value={formattedAmount}
              icon={ReceiptText}
              valueClass={
                isCredit
                  ? 'text-emerald-600'
                  : 'text-gray-900'
              }
            />

            <DetailRow
              label="Date"
              value={formattedDate}
              icon={Calendar}
            />

            <DetailRow
              label="Time"
              value={formattedTime}
              icon={Clock}
            />

            <DetailRow
              label="Description"
              value={
                transaction.description ||
                'Transaction'
              }
              icon={FileText}
            />
          </Section>

          {/* ======================================================
              SENDER
          ====================================================== */}

          {isCredit &&
            (senderName ||
              senderBank ||
              senderAccountNo) && (
              <Section
                eyebrow="From"
                title="Sender information"
                icon={ArrowDownLeft}
              >
                <DetailRow
                  label="Name"
                  value={senderName}
                  icon={User}
                />

                <DetailRow
                  label="Bank"
                  value={senderBank}
                  icon={Building2}
                />

                <DetailRow
                  label="Account"
                  value={
                    senderAccountNo
                      ? formatAccountNumber(
                          senderAccountNo
                        )
                      : null
                  }
                  icon={CreditCard}
                  mono
                />
              </Section>
            )}

          {/* ======================================================
              RECEIVER
          ====================================================== */}

          {isDebit &&
            (receiverName ||
              receiverBank ||
              receiverAccountNo) && (
              <Section
                eyebrow="To"
                title="Recipient information"
                icon={ArrowUpRight}
              >
                <DetailRow
                  label="Name"
                  value={receiverName}
                  icon={User}
                />

                <DetailRow
                  label="Bank"
                  value={receiverBank}
                  icon={Building2}
                />

                <DetailRow
                  label="Account"
                  value={
                    receiverAccountNo
                      ? formatAccountNumber(
                          receiverAccountNo
                        )
                      : null
                  }
                  icon={CreditCard}
                  mono
                />
              </Section>
            )}

          {/* ======================================================
              ACCOUNT
          ====================================================== */}

          {transaction.accounts && (
            <Section
              eyebrow="Account"
              title="Account details"
              icon={Building2}
            >
              <DetailRow
                label="Account number"
                value={
                  transaction.accounts
                    .account_number
                    ? formatAccountNumber(
                        transaction.accounts
                          .account_number
                      )
                    : null
                }
                icon={CreditCard}
                mono
              />

              <DetailRow
                label="Account holder"
                value={
                  transaction.accounts
                    .profiles?.full_name
                }
                icon={User}
              />
            </Section>
          )}

          {/* ======================================================
              ADMIN NOTE
          ====================================================== */}

          {adminNote && (
            <Section
              eyebrow="Additional information"
              title="Note"
              icon={FileText}
            >
              <div className="px-4 py-4 sm:px-5">
                <p className="text-xs leading-5 text-gray-600">
                  {adminNote}
                </p>
              </div>
            </Section>
          )}

          {/* ======================================================
              SECURITY
          ====================================================== */}

          <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/50 px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 ring-1 ring-primary-100">
              <ShieldCheck
                className="h-4 w-4"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-700">
                Keep your transaction details secure
              </p>

              <p className="mt-1 text-[10px] leading-4 text-gray-500">
                Never share your password, OTP,
                PIN or other sensitive banking
                information with anyone.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            FOOTER
        ======================================================== */}

        <div className="px-4 pb-4 pt-6 sm:px-6 sm:pb-6">
          <div className="border-t border-dashed border-gray-200 pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5" />

              <span className="text-[9px] font-bold uppercase tracking-[0.14em]">
                Secure transaction record
              </span>
            </div>

            <p className="mt-2 text-[9px] text-gray-400">
              Generated on{' '}
              {new Date().toLocaleString()}
            </p>

            {standalone && (
              <p className="mt-1 text-[9px] text-gray-400">
                This is an official transaction receipt.
              </p>
            )}
          </div>
        </div>

        {/* ========================================================
            ACTIONS
        ======================================================== */}

        <div className="receipt-no-print border-t border-gray-100 bg-gray-50/50 px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="
                flex h-11
                items-center justify-center gap-2
                rounded-xl
                border border-gray-200
                bg-white
                text-xs font-bold
                text-gray-700
                shadow-sm
                transition
                hover:border-gray-300
                hover:bg-gray-50
                active:scale-[0.98]
              "
            >
              <Share2 className="h-4 w-4 text-gray-500" />

              {shareFeedback
                ? 'Link copied'
                : 'Share receipt'}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isPrinting}
              className="
                flex h-11
                items-center justify-center gap-2
                rounded-xl
                bg-primary-600
                text-xs font-bold
                text-white
                shadow-[0_8px_20px_-10px_rgba(79,70,229,0.7)]
                transition
                hover:bg-primary-700
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {isPrinting
                ? 'Preparing…'
                : 'Download PDF'}
            </button>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-medium text-gray-400">
            <ShieldCheck className="h-3 w-3" />
            Your receipt is securely generated
          </p>
        </div>
      </div>
    </>
  );
};

export default Receipt;
