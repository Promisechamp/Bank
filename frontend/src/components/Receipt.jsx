import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ShieldCheck,
  Receipt as ReceiptText,
  Loader2,
  Search,
} from 'lucide-react';

import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import {
  formatCurrency,
  formatAccountNumber,
} from '../utils/helpers';

import { transactionsAPI } from '../api';
import { toast } from 'sonner';

/* ================================================================
   FONT
================================================================ */

const RECEIPT_FONT =
  '"Nunito", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/* ================================================================
   PROCESSING BANK
================================================================ */

const PROCESSING_BANK_NAME =
  'Trustycdu bank';

const PROCESSING_BANK_LOGO =
  '/logo.png';

/* ================================================================
   STATUS CONFIG
================================================================ */

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
    <div className="flex items-center justify-between gap-5 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
            <Icon
              className="h-4 w-4"
              strokeWidth={1.8}
            />
          </div>
        )}

        <span className="text-sm font-semibold text-gray-500">
          {label}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2 text-right">
        <span
          className={`
            max-w-[210px] truncate
            text-sm font-extrabold text-gray-900
            sm:max-w-[300px]
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
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 ring-1 ring-gray-200/80">
          <Icon
            className="h-5 w-5"
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary-600">
              {eyebrow}
            </p>
          )}

          <h3 className="text-sm font-extrabold text-gray-800">
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

/* ================================================================
   SEARCH
================================================================ */

const SearchReceipt = ({
  searchRef,
  setSearchRef,
  handleSearch,
  error,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.18)] sm:p-6">
      <div className="mb-4 p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary-600">
          Find a transaction
        </p>

        <h2 className="mt-1 text-base font-extrabold tracking-tight text-gray-900">
          Search by reference
        </h2>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={searchRef}
            onChange={(e) =>
              setSearchRef(e.target.value)
            }
            placeholder="Enter transaction reference"
            className="
              h-12 w-full rounded-xl
              border border-gray-200
              bg-gray-50/70
              pl-11 pr-4
              text-sm font-semibold text-gray-900
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
            h-12 rounded-xl
            bg-primary-600 px-6
            text-sm font-extrabold text-white
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
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {!error && (
        <p className="mt-3 text-xs leading-5 text-gray-400">
          Enter the reference shown on your
          transaction confirmation.
        </p>
      )}
    </div>
  );
};

/* ================================================================
   IMAGE / PDF RECEIPT
   FIXED EXPORT CANVAS
================================================================ */

const ImageReceipt = ({
  transaction,
  receiptData,
}) => {
  if (!transaction || !receiptData) {
    return null;
  }

  const {
    status,
    statusData,
    formattedAmount,
    formattedDate,
    formattedTime,
    isCredit,
    isDebit,
    metadata = {},
  } = receiptData;

  /* --------------------------------------------------------------
     PARTY — with all backward-compat fallbacks
  -------------------------------------------------------------- */

  const senderName =
    metadata.senderName ||
    metadata.sender_name ||
    null;

  const senderBank =
    metadata.senderBank ||
    metadata.sender_bank ||
    null;

  const senderAccountNo =
    metadata.senderAccountNo ||
    metadata.senderAccountNumber ||
    metadata.sender_account_no ||
    metadata.sender_account_number ||
    null;

  const receiverName =
    metadata.receiverName ||
    metadata.recipientName ||
    metadata.receiver_name ||
    metadata.recipient_name ||
    null;

  const receiverBank =
    metadata.receiverBank ||
    metadata.receiver_bank ||
    null;

  const receiverAccountNo =
    metadata.receiverAccountNo ||
    metadata.recipientAccountNumber ||
    metadata.receiver_account_no ||
    metadata.recipient_account_number ||
    null;

  /* --------------------------------------------------------------
     ACCOUNT
  -------------------------------------------------------------- */

  const accountNumber =
    transaction.accounts?.account_number ||
    metadata.accountNumber ||
    metadata.account_number ||
    null;

  const accountHolder =
    transaction.accounts?.profiles?.full_name ||
    metadata.accountHolder ||
    metadata.account_holder ||
    null;

  const accountBank =
    transaction.accounts?.bank_name ||
    metadata.accountBank ||
    metadata.bankName ||
    metadata.bank_name ||
    null;

  /* --------------------------------------------------------------
     DESCRIPTION / TYPE / TITLE
  -------------------------------------------------------------- */

  const description =
    transaction.description ||
    metadata.description ||
    'Transaction';

  const transactionType =
    isCredit
      ? 'Credit'
      : isDebit
        ? 'Debit'
        : transaction.transaction_type ||
          'Transaction';

  const transactionTitle =
    isCredit
      ? 'Money received'
      : isDebit
        ? 'Payment sent'
        : 'Transaction';

  const amountPrefix =
    isCredit
      ? '+'
      : isDebit
        ? '−'
        : '';

  /* --------------------------------------------------------------
     MONEY / META
  -------------------------------------------------------------- */

  const currency =
    transaction.currency ||
    metadata.currency ||
    'USD';

  const fee =
    transaction.fee ??
    transaction.transaction_fee ??
    metadata.fee ??
    metadata.transactionFee ??
    metadata.transaction_fee ??
    null;

  const balanceAfter =
    transaction.balance_after ??
    transaction.balanceAfter ??
    metadata.balanceAfter ??
    metadata.balance_after ??
    null;

  const channel =
    transaction.channel ||
    transaction.payment_channel ||
    metadata.channel ||
    metadata.paymentChannel ||
    metadata.payment_channel ||
    'Bank transfer';

  const paymentMethod =
    transaction.payment_method ||
    metadata.paymentMethod ||
    metadata.payment_method ||
    'Account Transfer';

  const adminNote =
    metadata.admin_note ||
    metadata.adminNote ||
    null;

  const transactionId =
    transaction.id ||
    metadata.transactionId ||
    metadata.transaction_id ||
    null;

  const category =
    transaction.category ||
    metadata.category ||
    null;

  /* --------------------------------------------------------------
     FORMATTERS
  -------------------------------------------------------------- */

  const formatOptionalMoney = (value) => {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    return `${formatCurrency(
      Math.abs(numericValue)
    )} ${currency}`;
  };

  const formattedFee =
    formatOptionalMoney(fee);

  const formattedBalance =
    formatOptionalMoney(balanceAfter);

  const formattedPartyAccount =
    (
      isCredit
        ? senderAccountNo
        : receiverAccountNo
    )
      ? formatAccountNumber(
          isCredit
            ? senderAccountNo
            : receiverAccountNo
        )
      : null;

  const partyName = (
  isCredit
    ? senderName
    : isDebit
      ? receiverName
      : null
)?.toUpperCase() || null;

const partyBank = (
  isCredit
    ? senderBank
    : isDebit
      ? receiverBank
      : null
)?.toUpperCase() || null;

const partyLabel = (
  isCredit
    ? 'Received from'
    : isDebit
      ? 'Paid to'
      : 'Transaction party'
).toUpperCase();
  /* --------------------------------------------------------------
     STATUS COLORS
  -------------------------------------------------------------- */

  const statusLabel =
    statusData?.label ||
    'Completed';

  const normalizedStatus =
    String(status || '').toLowerCase();

  const statusColors = {
    completed: {
      bg: '#ecfdf5',
      text: '#047857',
      dot: '#10b981',
    },

    pending_review: {
      bg: '#fffbeb',
      text: '#b45309',
      dot: '#f59e0b',
    },

    failed: {
      bg: '#fef2f2',
      text: '#b91c1c',
      dot: '#ef4444',
    },

    cancelled: {
      bg: '#f3f4f6',
      text: '#4b5563',
      dot: '#9ca3af',
    },
  };

  const currentStatus =
    statusColors[
      normalizedStatus
    ] || statusColors.completed;

  /* --------------------------------------------------------------
     SUB COMPONENTS
  -------------------------------------------------------------- */

  const Row = ({
    label,
    value,
    mono = false,
  }) => {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null;
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '30px',
          padding: '22px 28px',
          borderBottom:
            '1px solid #edf0f4',
          fontFamily: RECEIPT_FONT,
        }}
      >
        <span
          style={{
            flexShrink: 0,
            fontSize: '19px',
            lineHeight: 1.4,
            fontWeight: 700,
            color: '#697386',
          }}
        >
          {label}
        </span>

        <span
          style={{
            maxWidth: '64%',
            textAlign: 'right',
            fontSize: '19px',
            lineHeight: 1.4,
            fontWeight: 800,
            color: '#1f2937',
            fontFamily: mono
              ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              : RECEIPT_FONT,
            overflowWrap: 'anywhere',
          }}
        >
          {value}
        </span>
      </div>
    );
  };

  const DetailItem = ({
    label,
    value,
    mono = false,
  }) => {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null;
    }

    return (
      <div
        style={{
          minWidth: 0,
          fontFamily: RECEIPT_FONT,
        }}
      >
        <div
          style={{
            fontSize: '15px',
            lineHeight: 1.2,
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#818b9a',
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: '10px',
            fontSize: '20px',
            lineHeight: 1.35,
            fontWeight: 800,
            color: '#1f2937',
            fontFamily: mono
              ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              : RECEIPT_FONT,
            overflowWrap: 'anywhere',
          }}
        >
          {value}
        </div>
      </div>
    );
  };

  /* --------------------------------------------------------------
     EXTRA DETAILS GRID
  -------------------------------------------------------------- */

  const extraDetails = [
    {
      label: 'Currency',
      value: currency,
    },
    {
      label: 'Processing channel',
      value: channel,
    },
    {
      label: 'Payment method',
      value: paymentMethod,
    },
    {
      label: 'Category',
      value: category,
    },
    {
      label: 'Transaction ID',
      value: transactionId,
      mono: true,
    },
    {
      label: 'Fee',
      value: formattedFee,
    },
    {
      label: 'Balance after',
      value: formattedBalance,
    },
    {
      label: 'Account holder',
      value: accountHolder,
    },
    {
      label: 'Bank',
      value: accountBank,
    },
  ].filter(
    (item) =>
      item.value !== undefined &&
      item.value !== null &&
      item.value !== ''
  );

  return (
    <div
      style={{
        width: '1080px',
        height: '1500px',
        position: 'relative',
        overflow: 'hidden',
        background: '#f3f5f9',
        color: '#111827',
        fontFamily: RECEIPT_FONT,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, #f8fafc 0%, #f4f6fa 55%, #eef2ff 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '48px',
          right: '48px',
          top: '42px',
          bottom: '42px',
          overflow: 'hidden',
          borderRadius: '34px',
          background: '#ffffff',
          boxShadow:
            '0 30px 80px -30px rgba(15,23,42,0.25)',
          fontFamily: RECEIPT_FONT,
        }}
      >
        <div
          style={{
            height: '9px',
            width: '100%',
            background:
              'linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '34px 52px 0',
            fontFamily: RECEIPT_FONT,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                width: '110px',
                height: '110px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '24px',
                overflow: 'hidden',
              }}
            >
              <img
                src={PROCESSING_BANK_LOGO}
                alt={PROCESSING_BANK_NAME}
                crossOrigin="anonymous"
                width={100}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: '26px',
                  lineHeight: 1.15,
                  fontWeight: 900,
                  letterSpacing: '-0.025em',
                  color: '#111827',
                }}
              >
                {PROCESSING_BANK_NAME}
              </div>

              <div
                style={{
                  marginTop: '7px',
                  fontSize: '17px',
                  lineHeight: 1.3,
                  fontWeight: 700,
                  color: '#687386',
                }}
              >
                Transaction Receipt
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '10px 17px',
              borderRadius: '999px',
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              fontSize: '13px',
              fontWeight: 900,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#687386',
              whiteSpace: 'nowrap',
            }}
          >
            Official
          </div>
        </div>

        <div
          style={{
            padding: '38px 52px 0',
            fontFamily: RECEIPT_FONT,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '30px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '15px',
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: '0.17em',
                  textTransform: 'uppercase',
                  color: '#717b8b',
                }}
              >
                Transaction amount
              </div>

              <div
                style={{
                  marginTop: '11px',
                  fontSize: '24px',
                  lineHeight: 1.2,
                  fontWeight: 800,
                  color: '#374151',
                }}
              >
                {transactionTitle}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  fontSize: '68px',
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: '-0.055em',
                  color:
                    isCredit
                      ? '#047857'
                      : '#111827',
                }}
              >
                {amountPrefix}
                {formattedAmount}
              </div>

              <div
                style={{
                  marginTop: '16px',
                  fontSize: '17px',
                  lineHeight: 1.3,
                  fontWeight: 700,
                  color: '#687386',
                }}
              >
                {formattedDate}
                <span
                  style={{
                    margin: '0 9px',
                    color: '#c4c9d1',
                  }}
                >
                  •
                </span>
                {formattedTime}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 16px',
                marginTop: '3px',
                borderRadius: '999px',
                background: currentStatus.bg,
                color: currentStatus.text,
                fontSize: '16px',
                fontWeight: 900,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background:
                    currentStatus.dot,
                }}
              />

              {statusLabel}
            </div>
          </div>
        </div>

        <div
          style={{
            margin: '30px 52px 0',
            height: '1px',
            background: '#e7eaf0',
          }}
        />

        <div
          style={{
            margin: '26px 52px 0',
          }}
        >
          <div
            style={{
              marginBottom: '11px',
              fontSize: '16px',
              fontWeight: 900,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#717b8b',
            }}
          >
            {partyLabel}
          </div>

          <div
            style={{
              overflow: 'hidden',
              border: '1px solid #e2e6ec',
              borderRadius: '22px',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '22px 26px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '18px',
                  background:
                    isCredit
                      ? '#ecfdf5'
                      : '#eef2ff',
                  color:
                    isCredit
                      ? '#059669'
                      : '#4f46e5',
                }}
              >
                {isCredit ? (
                  <ArrowDownLeft
                    style={{
                      width: '30px',
                      height: '30px',
                    }}
                    strokeWidth={1.9}
                  />
                ) : (
                  <ArrowUpRight
                    style={{
                      width: '30px',
                      height: '30px',
                    }}
                    strokeWidth={1.9}
                  />
                )}
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    lineHeight: 1.25,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
																				textTransform: 'uppercase',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {partyName ||
                    'Transaction party'}
                </div>

                {partyBank && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '17px',
                      lineHeight: 1.3,
                      fontWeight: 700,
                      color: '#5f6875',
                    }}
                  >
                    {partyBank}
                  </div>
                )}
              </div>
            </div>

            {formattedPartyAccount && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '17px 26px',
                  borderTop:
                    '1px solid #e9ecf0',
                  background: '#f8fafc',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#717b8b',
                    }}
                  >
                    Account number
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#374151',
                    }}
                  >
                    {formattedPartyAccount}
                  </div>
                </div>

                <CreditCard
                  style={{
                    width: '24px',
                    height: '24px',
                    color: '#9aa3af',
                  }}
                  strokeWidth={1.7}
                />
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            margin: '25px 52px 0',
          }}
        >
          <div
            style={{
              marginBottom: '11px',
              fontSize: '16px',
              fontWeight: 900,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#717b8b',
            }}
          >
            Transaction details
          </div>

          <div
            style={{
              overflow: 'hidden',
              border: '1px solid #e2e6ec',
              borderRadius: '22px',
              background: '#ffffff',
            }}
          >
            <Row
              label="Transaction type"
              value={transactionType}
            />

            <Row
              label="Description"
              value={description}
            />

            <Row
              label="Reference"
              value={transaction.reference_id}
              mono
            />
          </div>
        </div>

        {extraDetails.length > 0 && (
          <div
            style={{
              margin: '25px 52px 0',
            }}
          >
            <div
              style={{
                marginBottom: '11px',
                fontSize: '16px',
                fontWeight: 900,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#717b8b',
              }}
            >
              Additional information
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1px',
                overflow: 'hidden',
                border: '1px solid #e2e6ec',
                borderRadius: '22px',
                background: '#e2e6ec',
              }}
            >
              {extraDetails
                .slice(0, 8)
                .map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    style={{
                      minHeight: '90px',
                      padding: '18px 21px',
                      background: '#ffffff',
                    }}
                  >
                    <DetailItem
                      label={item.label}
                      value={item.value}
                      mono={item.mono}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {adminNote && (
          <div
            style={{
              margin: '22px 52px 0',
              padding: '17px 21px',
              border: '1px solid #e2e6ec',
              borderRadius: '20px',
              background: '#f8fafc',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <FileText
                style={{
                  width: '21px',
                  height: '21px',
                  flexShrink: 0,
                  color: '#6366f1',
                  marginTop: '2px',
                }}
                strokeWidth={1.8}
              />

              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#6366f1',
                  }}
                >
                  Note
                </div>

                <div
                  style={{
                    marginTop: '6px',
                    fontSize: '16px',
                    lineHeight: 1.5,
                    fontWeight: 700,
                    color: '#4b5563',
                  }}
                >
                  {adminNote}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            left: '52px',
            right: '52px',
            bottom: '35px',
          }}
        >
          <div
            style={{
              height: '1px',
              marginBottom: '18px',
              background:
                'repeating-linear-gradient(to right, #d7dce3 0, #d7dce3 7px, transparent 7px, transparent 16px)',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '11px',
                  background: '#ecfdf5',
                  color: '#059669',
                }}
              >
                <ShieldCheck
                  style={{
                    width: '20px',
                    height: '20px',
                  }}
                  strokeWidth={1.9}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: '16px',
                    lineHeight: 1.2,
                    fontWeight: 900,
                    color: '#374151',
                  }}
                >
                  Secure transaction
                </div>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '16px',
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: '#8b95a5',
                  }}
                >
                  Official transaction receipt
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#7b8492',
                }}
              >
                {PROCESSING_BANK_NAME}
              </div>

              <div
                style={{
                  marginTop: '4px',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#9ca3af',
                }}
              >
                Keep this receipt for your records
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   MAIN RECEIPT
================================================================ */

const Receipt = ({
  transaction: propTransaction,
  reference: propReference,
  onClose,
  standalone = false,
  showSearch = false,
}) => {
  const getUrlReference = () => {
    if (typeof window === 'undefined') {
      return '';
    }

    const segments =
      window.location.pathname
        .split('/')
        .filter(Boolean);

    const receiptIndex =
      segments.indexOf('receipt');

    if (
      receiptIndex !== -1 &&
      segments[receiptIndex + 1]
    ) {
      return segments[receiptIndex + 1];
    }

    return '';
  };

  const initialReference =
    propReference ||
    (standalone ? getUrlReference() : '');

  const [transaction, setTransaction] =
    useState(propTransaction || null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [searchRef, setSearchRef] =
    useState(initialReference);

  const [copied, setCopied] =
    useState(false);

  const [shareFeedback, setShareFeedback] =
    useState(false);

  const [isPrinting, setIsPrinting] =
    useState(false);

  const [isDownloadingPng, setIsDownloadingPng] =
    useState(false);

  const [isDownloadingPdf, setIsDownloadingPdf] =
    useState(false);

  const imageReceiptRef = useRef(null);

  useEffect(() => {
    if (propTransaction) {
      setTransaction(propTransaction);
      setLoading(false);
      return;
    }

    const activeRef =
      propReference ||
      (standalone ? getUrlReference() : '');

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

  const handleCopyReference = async () => {
    if (!transaction?.reference_id) {
      return;
    }

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

      toast.error(
        'Unable to copy reference'
      );
    }
  };

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
      url:
        typeof window !== 'undefined'
          ? window.location.href
          : '',
    };

    if (
      typeof navigator !== 'undefined' &&
      navigator.share
    ) {
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

        toast.success(
          'Receipt link copied'
        );
      } catch (err) {
        console.error(
          'Unable to copy link:',
          err
        );

        toast.error(
          'Unable to share receipt'
        );
      }
    }
  };

  /* ================================================================
     PDF
     
     IMPORTANT:
     PDF is generated with html2canvas + jsPDF.
     It does NOT use browser print.
  ================================================================ */

  const handleDownloadPdf = async () => {
    if (
      !transaction ||
      !receiptData ||
      !imageReceiptRef.current ||
      isDownloadingPdf
    ) {
      return;
    }

    try {
      setIsDownloadingPdf(true);

      if (
        document.fonts &&
        document.fonts.ready
      ) {
        await document.fonts.ready;
      }

      await new Promise((resolve) =>
        requestAnimationFrame(resolve)
      );

      const node =
        imageReceiptRef.current;

      const canvas =
        await html2canvas(node, {
          backgroundColor: '#f3f5f9',
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          imageTimeout: 15000,
          width: 1080,
          height: 1500,
          windowWidth: 1080,
          windowHeight: 1500,
        });

      const imageData =
        canvas.toDataURL(
          'image/png',
          1.0
        );

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 8;

      const availableWidth =
        pageWidth - margin * 2;

      const availableHeight =
        pageHeight - margin * 2;

      const imageRatio =
        canvas.width / canvas.height;

      let renderWidth =
        availableWidth;

      let renderHeight =
        renderWidth / imageRatio;

      if (
        renderHeight >
        availableHeight
      ) {
        renderHeight =
          availableHeight;

        renderWidth =
          renderHeight *
          imageRatio;
      }

      const x =
        (pageWidth -
          renderWidth) /
        2;

      const y =
        (pageHeight -
          renderHeight) /
        2;

      pdf.addImage(
        imageData,
        'PNG',
        x,
        y,
        renderWidth,
        renderHeight,
        undefined,
        'FAST'
      );

      const reference =
        String(
          transaction.reference_id ||
            'transaction'
        )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            '-'
          )
          .slice(0, 80);

      pdf.save(
        `transaction-receipt-${reference}.pdf`
      );

      toast.success(
        'Receipt PDF downloaded'
      );
    } catch (err) {
      console.error(
        'Failed to generate PDF receipt:',
        err
      );

      toast.error(
        'Unable to generate receipt PDF. Please try again.'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /* ================================================================
     PNG
  ================================================================ */

  const handleDownloadPng = async () => {
    if (
      !transaction ||
      !receiptData ||
      !imageReceiptRef.current ||
      isDownloadingPng
    ) {
      return;
    }

    try {
      setIsDownloadingPng(true);

      if (
        document.fonts &&
        document.fonts.ready
      ) {
        await document.fonts.ready;
      }

      await new Promise((resolve) =>
        requestAnimationFrame(resolve)
      );

      const node =
        imageReceiptRef.current;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        width: 1080,
        height: 1500,
        pixelRatio: 1,
        backgroundColor: '#f3f5f9',
        canvasWidth: 2160,
        canvasHeight: 3000,
        style: {
          transform: 'none',
          margin: '0',
        },
      });

      const reference =
        String(
          transaction.reference_id ||
            'transaction'
        )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            '-'
          )
          .slice(0, 80);

      const fileName =
        `transaction-receipt-${reference}.png`;

      const link =
        document.createElement('a');

      link.download = fileName;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(
        'Receipt image downloaded'
      );
    } catch (err) {
      console.error(
        'Failed to generate PNG receipt:',
        err
      );

      toast.error(
        'Unable to generate receipt image. Please try again.'
      );
    } finally {
      setIsDownloadingPng(false);
    }
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
          ? JSON.parse(
              transaction.metadata
            )
          : transaction.metadata || {};
    } catch {
      metadata = {};
    }

    const dateObj = new Date(
      transaction.created_at ||
        Date.now()
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

    /* ----------------------------------------------------------
       ✅ FIX: handle transaction_type: 'transfer' by looking at
       metadata.direction to decide credit vs debit.
    ---------------------------------------------------------- */

    const rawType = String(
      transaction.transaction_type || ''
    ).toLowerCase();

    const direction = String(
      metadata.direction || ''
    ).toLowerCase();

    const isTransfer = rawType === 'transfer';

    const isCredit =
      rawType === 'credit' ||
      (isTransfer &&
        (direction === 'credit' ||
          direction === 'received'));

    const isDebit =
      rawType === 'debit' ||
      (isTransfer &&
        (direction === 'debit' ||
          direction === 'sent'));

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
      <div className="p-10 mt-10 w-[350px] mx-auto flex min-h-[420px] items-center justify-center rounded-3xl border border-gray-200 bg-white">
        <div className="text-center ">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>

          <p className="mt-4 text-base font-extrabold text-gray-900">
            Loading receipt
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Retrieving your transaction details…
          </p>
        </div>
      </div>
    );
  }

  /* ================================================================
     STANDALONE SEARCH
  ================================================================ */

  const hasActiveRef =
    Boolean(initialReference);

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
            <ReceiptText
              className="h-7 w-7"
              strokeWidth={1.6}
            />
          </div>

          <h3 className="mt-5 text-xl font-extrabold tracking-tight text-gray-900">
            Find your transaction receipt
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Enter your transaction reference
            above to securely retrieve the
            full receipt and transaction
            details.
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

          <h3 className="mt-5 text-xl font-extrabold tracking-tight text-gray-900">
            Receipt unavailable
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={handleClearSearch}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-extrabold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <Search className="h-4 w-4" />
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

  /* --------------------------------------------------------------
     PARTY — with all backward-compat fallbacks
  -------------------------------------------------------------- */

  const senderName =
    metadata.senderName ||
    metadata.sender_name ||
    null;

  const senderBank =
    metadata.senderBank ||
    metadata.sender_bank ||
    null;

  const senderAccountNo =
    metadata.senderAccountNo ||
    metadata.senderAccountNumber ||
    metadata.sender_account_no ||
    metadata.sender_account_number ||
    null;

  const receiverName =
    metadata.receiverName ||
    metadata.recipientName ||
    metadata.receiver_name ||
    metadata.recipient_name ||
    null;

  const receiverBank =
    metadata.receiverBank ||
    metadata.receiver_bank ||
    null;

  const receiverAccountNo =
    metadata.receiverAccountNo ||
    metadata.recipientAccountNumber ||
    metadata.receiver_account_no ||
    metadata.recipient_account_number ||
    null;

  const adminNote =
    metadata.admin_note ||
    metadata.adminNote ||
    null;

  return (
    <>
      {/* ============================================================
          NUNITO
      ============================================================ */}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');

        .transaction-receipt,
        .transaction-receipt *,
        .receipt-export,
        .receipt-export * {
          font-family:
            "Nunito",
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }
      `}</style>

      {/* ============================================================
          DEDICATED EXPORT RECEIPT

          UNCHANGED
      ============================================================ */}

      <div
        aria-hidden="true"
        className="receipt-export"
        style={{
          position: 'fixed',
          left: '-12000px',
          top: '0',
          width: '1080px',
          height: '1500px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div ref={imageReceiptRef}>
          <ImageReceipt
            transaction={transaction}
            receiptData={receiptData}
          />
        </div>
      </div>

      {/* ============================================================
          VISIBLE RECEIPT
          LAYOUT ONLY
      ============================================================ */}

      <div
        className={`
          transaction-receipt
          mx-auto w-full
          max-w-[720px]
          overflow-hidden
          text-gray-900
          ${
            standalone
              ? 'rounded-[28px] border border-gray-200 bg-white shadow-[0_20px_70px_-35px_rgba(15,23,42,0.3)]'
              : ''
          }
        `}
      >
        {/* ========================================================
            HEADER
        ======================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-4
            px-5
            pt-5
            sm:px-7
            sm:pt-7
          "
        >
          {/* LOGO */}

          <div
            className="
              flex
              min-w-0
              items-center
              justify-start
              overflow-visible
            "
          >
            <img
              src={PROCESSING_BANK_LOGO}
              alt={PROCESSING_BANK_NAME}
              width={150}
              className="
                block
                h-auto
                max-w-[150px]
                object-contain
              "
            />
          </div>

          {/* CLOSE BUTTON */}

          {!standalone && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-gray-200
                bg-white
                text-gray-400
                transition
                hover:border-gray-300
                hover:bg-gray-50
                hover:text-gray-700
              "
              aria-label="Close receipt"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ========================================================
            OPTIONAL SEARCH
        ======================================================== */}

        {standalone && showSearch && (
          <div className="px-5 pt-5 sm:px-7">
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

        <div
          className="
            px-5
            pb-8
            pt-8
            text-center
            sm:px-7
            sm:pb-10
            sm:pt-10
          "
        >
          <div className="mx-auto flex items-center justify-center">
            <StatusIcon
              className="h-9 w-9 text-emerald-600"
              strokeWidth={1.8}
            />
          </div>

          <p
            className={`
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-full
              px-4
              py-2
              text-xs
              font-extrabold
              ${statusData.soft}
              ${statusData.iconClass}
            `}
          >
            <span
              className={`
                h-2
                w-2
                rounded-full
                ${statusData.accent}
              `}
            />

            {statusData.label}
          </p>

          <h1
            className="
              mt-4
              text-xl
              font-bold
              tracking-tight
              text-gray-900
              sm:text-2xl
            "
          >
            {isCredit
              ? 'Money received'
              : isDebit
                ? 'Payment sent'
                : 'Transaction completed'}
          </h1>

          <div
            className={`
              mt-4
              text-[25px]
              font-bold
              tracking-[-0.04em]
              sm:text-[48px]
              ${
                isCredit
                  ? 'text-emerald-600'
                  : 'text-gray-950'
              }
            `}
          >
            {isCredit
              ? '+'
              : isDebit
                ? '−'
                : ''}
            {formattedAmount}
          </div>

          <p className="mt-3 text-sm font-semibold text-gray-400">
            {formattedDate} · {formattedTime}
          </p>
        </div>

        {/* ========================================================
            REFERENCE
        ======================================================== */}

        <div
          className="
            mx-5
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-gray-50/70
            sm:mx-7
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              px-5
              py-4
            "
          >
            <div className="min-w-0">
              <p
                className="
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.14em]
                  text-gray-400
                "
              >
                Reference ID
              </p>

              <p
                className="
                  mt-1.5
                  truncate
                  font-mono
                  text-sm
                  font-extrabold
                  tracking-tight
                  text-gray-800
                "
              >
                {transaction.reference_id}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyReference}
              className="
                flex
                h-10
                shrink-0
                items-center
                gap-2
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                text-xs
                font-extrabold
                text-gray-600
                shadow-sm
                transition
                hover:border-primary-200
                hover:text-primary-600
              "
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================
            DETAILS
        ======================================================== */}

        <div className="mt-6 space-y-5 px-5 sm:px-7">

          {/* OVERVIEW */}

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
                    : transaction.transaction_type ||
                      'Transaction'
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
              <div className="px-5 py-5 sm:px-6">
                <p className="text-sm font-semibold leading-6 text-gray-600">
                  {adminNote}
                </p>
              </div>
            </Section>
          )}

          {/* ======================================================
              SECURITY
          ====================================================== */}

          <div
            className="
              flex
              items-start
              gap-4
              rounded-2xl
              border
              border-primary-100
              bg-primary-50/50
              px-5
              py-5
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white
                text-primary-600
                ring-1
                ring-primary-100
              "
            >
              <ShieldCheck
                className="h-5 w-5"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-700">
                Keep your transaction details secure
              </p>

              <p className="mt-1.5 text-xs font-semibold leading-5 text-gray-500">
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

        <div
          className="
            px-5
            pb-5
            pt-7
            sm:px-7
            sm:pb-7
          "
        >
          <div
            className="
              border-t
              border-dashed
              border-gray-200
              pt-6
              text-center
            "
          >
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <ShieldCheck className="h-4 w-4" />

              <span
                className="
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.14em]
                "
              >
                Secure transaction record
              </span>
            </div>

            <p className="mt-2 text-[10px] font-semibold text-gray-400">
              Generated on{' '}
              {new Date().toLocaleString()}
            </p>

            {standalone && (
              <p className="mt-1 text-[10px] font-semibold text-gray-400">
                This is an official transaction
                receipt.
              </p>
            )}
          </div>
        </div>

        {/* ========================================================
            ACTIONS
        ======================================================== */}

        <div
          className="
            border-t
            border-gray-100
            bg-gray-50/50
            px-5
            py-5
            sm:px-7
          "
        >
          <div
            className="
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-3
            "
          >
            {/* SHARE */}

            <button
              type="button"
              onClick={handleShare}
              className="
                flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-gray-200
                bg-white
                text-sm
                font-extrabold
                text-gray-700
                shadow-sm
                transition
                hover:border-gray-300
                hover:bg-gray-50
                active:scale-[0.98]
              "
            >
              <Share2 className="h-5 w-5 text-gray-500" />

              {shareFeedback
                ? 'Link copied'
                : 'Share receipt'}
            </button>

            {/* PNG */}

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="
                flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-gray-200
                bg-white
                text-sm
                font-extrabold
                text-gray-700
                shadow-sm
                transition
                hover:border-primary-200
                hover:bg-primary-50
                hover:text-primary-700
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isDownloadingPng ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}

              {isDownloadingPng
                ? 'Creating…'
                : 'Download PNG'}
            </button>

            {/* PDF */}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="
                flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-primary-600
                text-sm
                font-extrabold
                text-white
                shadow-[0_8px_20px_-10px_rgba(79,70,229,0.7)]
                transition
                hover:bg-primary-700
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isDownloadingPdf ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}

              {isDownloadingPdf
                ? 'Creating PDF…'
                : 'Download PDF'}
            </button>
          </div>

          <p
            className="
              mt-4
              flex
              items-center
              justify-center
              gap-2
              text-[10px]
              font-bold
              text-gray-400
            "
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Your receipt is securely generated
          </p>
        </div>
      </div>
    </>
  );
};

export default Receipt;