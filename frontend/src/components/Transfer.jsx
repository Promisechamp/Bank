import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionsAPI, accountsAPI } from '../api';
import {
  formatCurrency,
  validateAmount,
} from '../utils/helpers';
import Modal from './Modal';
import Receipt from './Receipt';
import { toast } from 'sonner';

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  ChevronDown,
  Clock3,
  CreditCard,
  HelpCircle,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
  FileText,
  ExternalLink,
  KeyRound,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Custom Select                                                              */
/* -------------------------------------------------------------------------- */

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find(
    (option) => option.value === value
  );

  useEffect(() => {
    const close = () => setOpen(false);

    window.addEventListener('click', close);

    return () =>
      window.removeEventListener('click', close);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-left text-sm shadow-sm outline-none transition hover:border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          className={
            selected
              ? 'text-gray-900'
              : 'text-gray-400'
          }
        >
          {selected?.label || placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full rounded-lg px-3 py-3 text-left text-sm transition ${
                option.value === value
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{option.label}</span>

                {option.value === value && (
                  <Check className="h-4 w-4" />
                )}
              </div>

              {option.description && (
                <p className="mt-1 text-xs text-gray-400">
                  {option.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

const StatusPill = ({ status }) => {
  const normalized = String(
    status || 'active'
  ).toLowerCase();

  const restricted = [
    'frozen',
    'banned',
    'suspended',
  ].includes(normalized);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        restricted
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
          : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          restricted
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      />

      {normalized.charAt(0).toUpperCase() +
        normalized.slice(1)}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Info Banner                                                                */
/* -------------------------------------------------------------------------- */

const InfoBanner = ({
  icon: Icon,
  title,
  children,
  tone = 'gray',
}) => {
  const tones = {
    gray:
      'border-gray-200 bg-gray-50 text-gray-700',
    amber:
      'border-amber-200 bg-amber-50 text-amber-900',
    blue:
      'border-primary-100 bg-primary-50 text-primary-900',
    green:
      'border-emerald-200 bg-emerald-50 text-emerald-900',
  };

  return (
    <div
      className={`rounded-xl border p-4 ${tones[tone]}`}
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />

        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {title}
          </p>

          <div className="mt-1 text-xs leading-5 opacity-80">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Initialization                                                             */
/* -------------------------------------------------------------------------- */

const InitializationStep = ({
  active,
  completed,
  icon,
  label,
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        completed
          ? 'bg-emerald-100 text-emerald-600'
          : active
            ? 'bg-primary-100 text-primary-600'
            : 'bg-white text-gray-400 ring-1 ring-gray-200'
      }`}
    >
      {completed ? (
        <CheckCircle className="h-4 w-4" />
      ) : active ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
    </div>

    <p
      className={`text-sm ${
        active
          ? 'font-semibold text-primary-700'
          : completed
            ? 'text-emerald-700'
            : 'text-gray-500'
      }`}
    >
      {label}
    </p>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Processing Screen                                                          */
/* -------------------------------------------------------------------------- */

const ProcessingScreen = ({
  icon,
  title,
  message,
}) => (
  <div className="py-8 text-center">
    <div className="relative mx-auto h-16 w-16">
      <div className="absolute inset-0 rounded-full border-4 border-gray-100" />

      <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />

      <div className="absolute inset-0 flex items-center justify-center">
        {icon}
      </div>
    </div>

    <h3 className="mt-6 text-lg font-semibold text-gray-900">
      {title}
    </h3>

    <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-gray-500">
      {message}
    </p>

    <div className="mt-5 flex justify-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Transfer Type Card                                                         */
/* -------------------------------------------------------------------------- */

const TransferTypeCard = ({
  active,
  icon: Icon,
  title,
  description,
  badge,
  onClick,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`group relative w-full rounded-xl border px-5 py-4 text-left transition ${
      active
        ? 'border-primary-500 bg-primary-50'
        : disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-start gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          active
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-gray-900">
            {title}
          </p>

          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      {active && (
        <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary-600" />
      )}
    </div>
  </button>
);

/* -------------------------------------------------------------------------- */
/* Verification Method Card                                                  */
/* -------------------------------------------------------------------------- */

const VerificationMethodCard = ({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-xl border p-4 text-left transition ${
      active
        ? 'border-primary-500 bg-primary-50'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          active
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">
            {title}
          </p>

          {active && (
            <CheckCircle className="h-4 w-4 text-primary-600" />
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  </button>
);

/* -------------------------------------------------------------------------- */
/* Classic Debit Card                                                         */
/* -------------------------------------------------------------------------- */

const ClassicDebitCard = ({
  userName = 'CARDHOLDER NAME',
}) => (
  <div className="relative mx-auto w-full max-w-[430px]">
    <div className="relative aspect-[1.586/1] overflow-hidden rounded-[22px] bg-primary-600 p-6 text-white shadow-2xl shadow-primary-900/20 sm:p-7">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/10" />

        <div className="absolute bottom-[-100px] left-[-100px] h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute bottom-[-75px] left-[-75px] h-48 w-48 rounded-full border border-white/10" />

        <div className="absolute left-0 top-1/2 h-px w-full bg-white/10" />
        <div className="absolute left-[14%] top-0 h-full w-px bg-white/10" />
        <div className="absolute left-[28%] top-0 h-full w-px bg-white/10" />
        <div className="absolute bottom-0 right-[18%] h-full w-px bg-white/5" />
      </div>

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/55">
            Debit
          </p>

          <p className="mt-1 text-sm font-semibold tracking-wide">
            Everyday
          </p>
        </div>

        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.25em] text-white/50">
            Member
          </p>

          <p className="mt-1 text-xs font-semibold">
            ACTIVE
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-9">
        <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-white/30 bg-white/15">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/30" />
          <div className="absolute left-1/2 top-1/2 h-5 w-8 -translate-x-1/2 -translate-y-1/2 rounded border border-white/20" />
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <p className="font-mono text-[15px] tracking-[0.18em] text-white/90 sm:text-base">
          •••• &nbsp; •••• &nbsp; •••• &nbsp; 2841
        </p>
      </div>

      <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between sm:bottom-7 sm:left-7 sm:right-7">
        <div>
          <p className="text-[8px] uppercase tracking-[0.25em] text-white/45">
            Cardholder
          </p>

          <p className="mt-1 max-w-[210px] truncate text-[11px] font-semibold uppercase tracking-wider text-white/90">
            {userName}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[8px] uppercase tracking-[0.25em] text-white/45">
            Valid thru
          </p>

          <p className="mt-1 text-[11px] font-semibold tracking-wider">
            12/29
          </p>
        </div>
      </div>
    </div>

    <div className="mx-7 h-2 rounded-b-full bg-primary-900/10" />
  </div>
);

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

const Transfer = () => {
  const navigate = useNavigate();

  const [transferType, setTransferType] =
    useState('external');

  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [fetching, setFetching] = useState(true);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [
    recipientAccountNumber,
    setRecipientAccountNumber,
  ] = useState('');

  const [recipientName, setRecipientName] =
    useState('');

  const [accountCheckLoading, setAccountCheckLoading] =
    useState(false);

  const [accountCheckResult, setAccountCheckResult] =
    useState(null);

  const [accountCheckError, setAccountCheckError] =
    useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [reference, setReference] = useState('');
  const [resultStatus, setResultStatus] =
    useState('');

  const [initializationStep, setInitializationStep] =
    useState('idle');

  /* ---------------------------------------------------------------------- */
  /* Account restriction (banned / suspended / frozen)                       */
  /* ---------------------------------------------------------------------- */

  const [accountRestrictionOpen, setAccountRestrictionOpen] =
    useState(false);

  const [restrictionStatus, setRestrictionStatus] =
    useState('');

  /* ---------------------------------------------------------------------- */
  /* Verification                                                           */
  /* ---------------------------------------------------------------------- */

  const [
    verificationMethod,
    setVerificationMethod,
  ] = useState('pin');

  const [
    verificationChoiceOpen,
    setVerificationChoiceOpen,
  ] = useState(false);

  const [verificationError, setVerificationError] =
    useState('');

  /* OTP */
  const [otpModalOpen, setOtpModalOpen] =
    useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] =
    useState(false);

  const [otpError, setOtpError] = useState('');
  const [otpStep, setOtpStep] = useState('idle');
  const [otpReference, setOtpReference] =
    useState('');

  const [otpAttempts, setOtpAttempts] =
    useState(0);

  /* PIN */
  const [pinModalOpen, setPinModalOpen] =
    useState(false);

  const [transferPin, setTransferPin] =
    useState('');

  const [pinLoading, setPinLoading] =
    useState(false);

  const [pinError, setPinError] = useState('');
  const [pinStep, setPinStep] = useState('idle');

  /* Receipt */
  const [receiptModalOpen, setReceiptModalOpen] =
    useState(false);

  const [receiptTransaction, setReceiptTransaction] =
    useState(null);

  const [
    autoRedirectCountdown,
    setAutoRedirectCountdown,
  ] = useState(0);

  /* Slow-OTP warning */
  const [otpSlowWarning, setOtpSlowWarning] =
    useState(false);

  const requestTimerRef = useRef(null);

  /* ---------------------------------------------------------------------- */
  /* Fetch accounts                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    fetchAccounts();
  }, []);

  /* Cleanup timers on unmount */
  useEffect(() => {
    return () => {
      clearTimeout(requestTimerRef.current);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Account verification                                                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (
      recipientAccountNumber.trim().length < 5
    ) {
      setAccountCheckResult(null);
      setAccountCheckError('');
      setRecipientName('');
      return;
    }

    const timer = setTimeout(() => {
      checkRecipientAccount(
        recipientAccountNumber.trim()
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [recipientAccountNumber]);

  /* ---------------------------------------------------------------------- */
  /* Auto redirect                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let interval;

    if (autoRedirectCountdown > 0) {
      interval = setInterval(() => {
        setAutoRedirectCountdown(
          (prev) => prev - 1
        );
      }, 1000);
    } else if (
      autoRedirectCountdown === 0 &&
      success &&
      reference
    ) {
      navigate(`/receipt/${reference}`);
    }

    return () => clearInterval(interval);
  }, [
    autoRedirectCountdown,
    success,
    reference,
    navigate,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Accounts                                                               */
  /* ---------------------------------------------------------------------- */

  const fetchAccounts = async () => {
    try {
      setFetching(true);

      const data = await accountsAPI.getAll();

      const loadedAccounts =
        data.accounts || [];

      setAccounts(loadedAccounts);

      if (
        !fromAccount &&
        loadedAccounts.length
      ) {
        setFromAccount(
          loadedAccounts[0].id
        );
      }
    } catch (err) {
      setError(
        'Failed to load your accounts.'
      );
    } finally {
      setFetching(false);
    }
  };

  const checkRecipientAccount = async (
    accountNumber
  ) => {
    try {
      setAccountCheckLoading(true);
      setAccountCheckError('');
      setAccountCheckResult(null);

      const response =
        await accountsAPI.checkExists(
          accountNumber
        );

      if (
        response?.success &&
        response?.exists
      ) {
        setAccountCheckResult({
          exists: true,
          owner_name:
            response.account.owner_name,
          account_type:
            response.account.account_type,
          account_id: response.account.id,
        });

        setRecipientName(
          response.account.owner_name
        );
      } else {
        setAccountCheckResult({
          exists: false,
        });

        setRecipientName('');
        setAccountCheckError(
          'Account not found.'
        );
      }
    } catch (err) {
      setAccountCheckError(
        err?.error ||
          'Unable to verify account number.'
      );
    } finally {
      setAccountCheckLoading(false);
    }
  };

  const getAccount = (id) =>
    accounts.find(
      (account) => account.id === id
    );

  const selectedAccount = useMemo(
    () => getAccount(fromAccount),
    [fromAccount, accounts]
  );

  const availableBalance = useMemo(
    () =>
      selectedAccount
        ? Number(
            selectedAccount.balance || 0
          )
        : 0,
    [selectedAccount]
  );

  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: `${account.account_type} — ${formatCurrency(
          account.balance
        )}`,
        description: `${
          account.account_number ||
          'Account'
        } • ${
          account.status || 'active'
        }`,
      })),
    [accounts]
  );

  /* ---------------------------------------------------------------------- */
  /* Reset                                                                  */
  /* ---------------------------------------------------------------------- */

  const resetTransferForm = () => {
    setAmount('');
    setDescription('');
    setRecipientAccountNumber('');
    setRecipientName('');
    setAccountCheckResult(null);
    setAccountCheckError('');

    setError('');
    setSubmitError('');
    setSuccess('');
    setReference('');
    setResultStatus('');
    setInitializationStep('idle');

    setVerificationMethod('otp');
    setVerificationChoiceOpen(false);
    setVerificationError('');

    setOtpCode('');
    setOtpError('');
    setOtpStep('idle');
    setOtpReference('');
    setOtpAttempts(0);

    setTransferPin('');
    setPinError('');
    setPinStep('idle');

    setAutoRedirectCountdown(0);

    setOtpSlowWarning(false);
    clearTimeout(requestTimerRef.current);
  };

  /* ---------------------------------------------------------------------- */
  /* Receipt                                                                */
  /* ---------------------------------------------------------------------- */

  const handleViewReceipt = () => {
    if (!reference) return;

    const fetchTransaction = async () => {
      try {
        const response =
          await transactionsAPI.getByReference(
            reference
          );

        if (
          response?.success &&
          response?.transaction
        ) {
          setReceiptTransaction(
            response.transaction
          );

          setReceiptModalOpen(true);
        }
      } catch (err) {
        toast.error(
          'Could not load receipt details'
        );
      }
    };

    fetchTransaction();
  };

  /* ---------------------------------------------------------------------- */
  /* Validate transfer                                                      */
  /* ---------------------------------------------------------------------- */

  const validateTransfer = () => {
    if (!fromAccount) {
      setError(
        'Please select an account.'
      );
      return false;
    }

    if (!recipientAccountNumber) {
      setError(
        'Please enter the recipient account number.'
      );
      return false;
    }

    if (!accountCheckResult?.exists) {
      setError(
        'Please enter a valid recipient account number.'
      );
      return false;
    }

    const amountNum = Number(amount);

    if (
      !validateAmount(amountNum) ||
      amountNum <= 0
    ) {
      setError(
        'Please enter a valid amount greater than 0.'
      );
      return false;
    }

    if (amountNum > availableBalance) {
      setError(
        `Insufficient funds. Available balance: ${formatCurrency(
          availableBalance
        )}`
      );
      return false;
    }

    return true;
  };

  /* ---------------------------------------------------------------------- */
  /* Submit transfer                                                        */
  /* ---------------------------------------------------------------------- */

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSubmitError('');
    setSuccess('');
    setReference('');
    setResultStatus('');
    setVerificationError('');
    setOtpSlowWarning(false);

    if (!validateTransfer()) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * We do not create the transfer yet.
     *
     * The user first chooses whether to authenticate
     * this transfer with PIN or OTP.
     */
    setVerificationChoiceOpen(true);
  };

  /* ---------------------------------------------------------------------- */
  /* Pre-verification account restriction check                             */
  /* ---------------------------------------------------------------------- */

  const handleContinueToVerification = (e) => {
    e.preventDefault();

    const status = String(
      selectedAccount?.status || 'active'
    ).toLowerCase();

    if (
      ['banned', 'suspended', 'frozen'].includes(
        status
      )
    ) {
      setRestrictionStatus(status);
      setAccountRestrictionOpen(true);
      return;
    }

    // Not restricted — run the normal transfer flow
    handleTransferSubmit(e);
  };

  /* ---------------------------------------------------------------------- */
  /* Start selected verification method                                     */
  /* ---------------------------------------------------------------------- */

  const startVerification = async (method) => {
    setVerificationMethod(method);
    setVerificationChoiceOpen(false);
    setVerificationError('');
    setSubmitError('');
    setOtpSlowWarning(false);

    // Hard cap: if the request takes too long, unlock the UI so the
    // user can fall back to PIN without losing the transaction.
    clearTimeout(requestTimerRef.current);
    requestTimerRef.current = setTimeout(() => {
      setOtpSlowWarning(true);
    }, 12000);

    setLoading(true);
    setInitializationStep(
      method === 'otp'
        ? 'sending_otp'
        : 'creating_transfer'
    );

    try {
      const response =
        await transactionsAPI.initiateTransfer({
          fromAccountId: fromAccount,
          amount: Number(amount),
          description:
            description || 'Same bank transfer',
          recipientAccountNumber,
          recipientName,
          verificationMethod: method,
        });

      clearTimeout(requestTimerRef.current);
      setOtpSlowWarning(false);

      if (!response?.success) {
        throw new Error(
          response?.error ||
            'Unable to initiate transfer.'
        );
      }

      // -------- PIN FLOW --------
      // Also covers OTP-failed-on-backend: backend returns
      // { requiresPin: true, otpSendFailed: true, reference } and
      // keeps the pending transaction alive.
      if (method === 'pin' || response.requiresPin) {
        setOtpReference(response.reference || '');
        setPinStep('entry');
        setPinError('');
        setTransferPin('');

        setInitializationStep('idle');
        setLoading(false);

        setPinModalOpen(true);

        if (response.otpSendFailed) {
          toast.error('Switched to PIN verification', {
            description:
              response.message ||
              'We could not send the verification code. Please use your transfer PIN instead.',
          });
        }

        return;
      }

      // -------- OTP FLOW --------
      if (response.requiresOtp) {
        setOtpReference(response.reference || '');

        setOtpCode('');
        setOtpError('');
        setOtpAttempts(0);
        setOtpStep('sent');

        setInitializationStep('idle');
        setLoading(false);

        setOtpModalOpen(true);

        toast.success('Verification code sent');

        return;
      }

      // Some backends return completed directly.
      if (response.status === 'completed') {
        setReference(response.reference || '');
        setResultStatus('completed');
        setSuccess(
          response.message ||
            'Transfer completed successfully.'
        );

        setLoading(false);
        setInitializationStep('idle');
        setAutoRedirectCountdown(5);

        await fetchAccounts();

        return;
      }

      throw new Error(
        'The transfer returned an unexpected response.'
      );
    } catch (err) {
      clearTimeout(requestTimerRef.current);
      setOtpSlowWarning(false);
      setLoading(false);
      setInitializationStep('idle');

      // OTP flow: fall back to PIN using the SAME reference.
      if (method === 'otp') {
        setVerificationMethod('pin');
        setPinStep('entry');
        setPinError('');
        setTransferPin('');

        if (err?.reference) {
          setOtpReference(err.reference);
        }

        setPinModalOpen(true);

        toast.error('Switched to PIN verification', {
          description:
            err?.error ||
            err?.message ||
            'We could not send the verification code. Please use your transfer PIN instead.',
        });

        return;
      }

      setError(
        err?.error ||
          err?.message ||
          'Transfer initiation failed.'
      );
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Cancel slow OTP request and switch to PIN                              */
  /* ---------------------------------------------------------------------- */

  const cancelSlowRequestAndUsePin = () => {
    clearTimeout(requestTimerRef.current);
    setOtpSlowWarning(false);
    setLoading(false);
    setInitializationStep('idle');

    setSubmitError(
      'Verification email is taking too long to send.'
    );
    setVerificationMethod('pin');
  };

  /* ---------------------------------------------------------------------- */
  /* OTP submit                                                             */
  /* ---------------------------------------------------------------------- */

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    setOtpError('');

    if (
      !otpCode ||
      otpCode.length !== 6
    ) {
      setOtpError(
        'Enter the 6-digit OTP sent to your email.'
      );
      return;
    }

    setOtpLoading(true);
    setOtpStep('verifying');

    try {
      const response =
        await transactionsAPI.verifyTransferOtp({
          reference: otpReference,
          otp: otpCode,
        });

      if (!response?.success) {
        const nextAttempts =
          otpAttempts + 1;

        setOtpAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          setOtpError(
            'Too many failed attempts. You can verify this transfer with your PIN instead.'
          );

          setOtpStep('fallback_pin');

          return;
        }

        setOtpError(
          `Invalid OTP. ${
            3 - nextAttempts
          } attempt${
            3 - nextAttempts === 1
              ? ''
              : 's'
          } remaining.`
        );

        setOtpStep('sent');
        setOtpLoading(false);

        return;
      }

      setOtpStep('processing');

      await finishTransferResponse(
        response
      );
    } catch (err) {
      setOtpError(
        err?.error ||
          err?.message ||
          'Unable to verify this transaction.'
      );

      setOtpStep('sent');
      setOtpLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* OTP -> PIN fallback                                                    */
  /* ---------------------------------------------------------------------- */

  const switchOtpToPin = () => {
    setOtpModalOpen(false);

    setOtpStep('idle');
    setOtpCode('');
    setOtpError('');

    setOtpLoading(false);

    setVerificationMethod('pin');

    setTransferPin('');
    setPinError('');
    setPinStep('entry');

    setPinModalOpen(true);
  };

  /* ---------------------------------------------------------------------- */
  /* PIN submit                                                             */
  /* ---------------------------------------------------------------------- */

  const handlePinSubmit = async (e) => {
    e.preventDefault();

    setPinError('');

    if (
      !transferPin ||
      transferPin.length < 4
    ) {
      setPinError(
        'Enter your transfer PIN.'
      );
      return;
    }

    setPinLoading(true);
    setPinStep('verifying');

    try {
      const response =
        await transactionsAPI.verifyTransferPin({
          reference: otpReference,
          pin: transferPin,
        });

      if (!response?.success) {
        setPinError(
          response?.error ||
            'Incorrect transfer PIN.'
        );

        setPinStep('entry');
        setPinLoading(false);

        return;
      }

      setPinStep('processing');

      await finishTransferResponse(
        response
      );
    } catch (err) {
      setPinError(
        err?.error ||
          err?.message ||
          'Unable to verify the transfer PIN.'
      );

      setPinStep('entry');
      setPinLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Common successful transfer response                                    */
  /* ---------------------------------------------------------------------- */

  const finishTransferResponse = async (
    response
  ) => {
    if (
      response.status ===
      'pending_review'
    ) {
      setOtpStep('pending_review');

      setReference(
        response.reference ||
          otpReference
      );

      setResultStatus(
        'pending_review'
      );

      setSuccess(
        'Transfer submitted for review'
      );

      setLoading(false);
      setOtpLoading(false);
      setPinLoading(false);

      setAutoRedirectCountdown(5);

      await fetchAccounts();

      toast.success(
        'Transfer submitted for review'
      );

      return;
    }

    if (
      response.status ===
      'completed'
    ) {
      if (verificationMethod === 'pin') {
        setPinStep('completed');
      } else {
        setOtpStep('completed');
      }

      setReference(
        response.reference ||
          otpReference
      );

      setResultStatus('completed');

      setSuccess(
        response.message ||
          'Transfer completed successfully'
      );

      setLoading(false);
      setOtpLoading(false);
      setPinLoading(false);

      setAutoRedirectCountdown(5);

      await fetchAccounts();

      toast.success(
        'Transfer completed'
      );

      return;
    }

    setOtpError(
      'The transfer returned an unexpected status.'
    );

    setOtpStep('sent');

    setOtpLoading(false);
    setPinLoading(false);
  };

  /* ---------------------------------------------------------------------- */
  /* Close OTP                                                              */
  /* ---------------------------------------------------------------------- */

  const closeOtpModal = () => {
    if (
      otpStep === 'verifying' ||
      otpStep === 'processing'
    ) {
      return;
    }

    setOtpModalOpen(false);
    setOtpStep('idle');
    setOtpCode('');
    setOtpError('');
    setOtpReference('');
    setOtpLoading(false);
  };

  /* ---------------------------------------------------------------------- */
  /* Close PIN                                                              */
  /* ---------------------------------------------------------------------- */

  const closePinModal = () => {
    if (
      pinStep === 'verifying' ||
      pinStep === 'processing'
    ) {
      return;
    }

    setPinModalOpen(false);

    setPinStep('idle');
    setTransferPin('');
    setPinError('');
    setPinLoading(false);
  };

  /* ---------------------------------------------------------------------- */
  /* Done                                                                   */
  /* ---------------------------------------------------------------------- */

  const handleOtpDone = () => {
    closeOtpModal();
    resetTransferForm();
  };

  const handlePinDone = () => {
    closePinModal();
    resetTransferForm();
  };

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (fetching) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-100 bg-primary-50">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>

        <p className="mt-4 text-sm font-medium text-gray-600">
          Loading your transfer interface...
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Please wait a moment
        </p>
      </div>
    );
  }

  const userName =
    selectedAccount?.owner_name ||
    selectedAccount?.profile?.full_name ||
    'CARDHOLDER NAME';

  return (
    <div className="mx-auto w-full max-w-7xl pb-14">

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-gray-200 pb-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              <span className="h-px w-7 bg-primary-600" />
              Payments
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Transfer money
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Send money securely between eligible
              accounts and verify every transfer before
              it is completed.
            </p>
          </div>

          <a
            href="/withdraw#card"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            <CreditCard className="h-4 w-4 text-primary-600" />
            Order debit card
          </a>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Service Information                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-6 grid rounded-xl border border-gray-200 p-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 border-b border-gray-200 py-5 sm:border-b-0 sm:border-r sm:pr-6">
          <ShieldCheck className="h-5 w-5 text-primary-600" />

          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              Security
            </p>

            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              PIN or OTP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-gray-200 py-5 sm:border-b-0 sm:border-r sm:px-6">
          <ArrowUpRight className="h-5 w-5 text-primary-600" />

          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              Transfers
            </p>

            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              Same-bank enabled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-5 sm:pl-6">
          <CreditCard className="h-5 w-5 text-primary-600" />

          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400">
              Card
            </p>

            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              Debit card ordering
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Transfer Navigation                                                 */}
      {/* ------------------------------------------------------------------ */}

      <section className="mt-8">
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900">
            Transfer type
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Select where you want the funds to go.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <TransferTypeCard
            active={
              transferType === 'internal'
            }
            icon={Wallet}
            title="Internal"
            badge="SELF"
            description="Move funds between accounts owned by you."
            onClick={() => {
              setTransferType('internal');
              setError('');
              resetTransferForm();
            }}
          />

          <TransferTypeCard
            active={
              transferType === 'external'
            }
            icon={Send}
            title="External"
            badge="SAME BANK"
            description="Send funds to another customer account."
            onClick={() => {
              setTransferType('external');
              setError('');
              resetTransferForm();
            }}
          />

          <TransferTypeCard
            active={
              transferType === 'interbank'
            }
            icon={Landmark}
            title="Interbank"
            badge="SUSPENDED"
            description="Send funds to an account at another bank."
            onClick={() => {
              setTransferType('interbank');
              setError('');
              resetTransferForm();
            }}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Messages                                                            */}
      {/* ------------------------------------------------------------------ */}

      {success &&
        transferType === 'external' && (
          <div className="mt-6">
            <InfoBanner
              icon={CheckCircle}
              title={
                resultStatus ===
                'pending_review'
                  ? 'Transfer submitted'
                  : 'Transfer completed'
              }
              tone={
                resultStatus ===
                'pending_review'
                  ? 'amber'
                  : 'blue'
              }
            >
              {success}

              {reference && (
                <>
                  <span className="ml-1 font-mono">
                    Reference: {reference}
                  </span>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={
                        handleViewReceipt
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Receipt
                    </button>

                    <span className="text-gray-300">
                      |
                    </span>

                    <button
                      onClick={() =>
                        navigate(
                          `/receipt/${reference}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Full Page
                    </button>

                    {autoRedirectCountdown >
                      0 && (
                      <span className="text-xs text-gray-400">
                        Redirecting in{' '}
                        {
                          autoRedirectCountdown
                        }
                        s...
                      </span>
                    )}
                  </div>
                </>
              )}
            </InfoBanner>
          </div>
        )}

      {error &&
        transferType === 'external' && (
          <div className="mt-6">
            <InfoBanner
              icon={AlertCircleIcon}
              title="Transfer could not be started"
              tone="amber"
            >
              {error}
            </InfoBanner>
          </div>
        )}

      {/* ------------------------------------------------------------------ */}
      {/* INTERNAL                                                            */}
      {/* ------------------------------------------------------------------ */}

      {transferType === 'internal' && (
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-7 sm:p-9">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Wallet className="h-5 w-5" />
              </div>

              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-950">
                Open another self account first
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                Internal transfers are designed for
                moving funds between accounts owned by
                you.
              </p>
            </div>

            <div className="grid gap-px bg-gray-200 sm:grid-cols-2">
              <div className="bg-white p-6">
                <User className="h-5 w-5 text-primary-600" />

                <p className="mt-5 text-sm font-semibold text-gray-900">
                  Contact your account manager
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Your account manager can help you
                  request another self-owned account.
                </p>
              </div>

              <div className="bg-white p-6">
                <MapPin className="h-5 w-5 text-primary-600" />

                <p className="mt-5 text-sm font-semibold text-gray-900">
                  Visit a branch
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  A branch representative can assist
                  with opening an additional account.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    'Please contact your account manager or visit a branch to open another self account.'
                  )
                }
                className="btn-primary inline-flex items-center gap-2 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Request another account
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gray-950 p-8 text-white">
            <ShieldCheck className="relative h-6 w-6 text-white/70" />

            <p className="relative mt-12 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
              Internal transfer
            </p>

            <h3 className="relative mt-2 text-xl font-semibold">
              Keep your accounts organized
            </h3>

            <p className="relative mt-3 text-sm leading-6 text-white/55">
              Once another eligible self-owned account
              is available, it can be selected as an
              internal transfer destination.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* INTERBANK                                                           */}
      {/* ------------------------------------------------------------------ */}

      {transferType === 'interbank' && (
        <div className="mt-7 overflow-hidden rounded-2xl border border-amber-200 bg-white">
          <div className="grid lg:grid-cols-[1fr_350px]">
            <div className="p-8 sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldAlert className="h-6 w-6" />
              </div>

              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-600">
                Temporary restriction
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                Interbank transfers are suspended
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                Interbank transfers are temporarily
                suspended due to suspicious account
                activities.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      'Please contact your account manager or visit a branch to lift the interbank restriction.'
                    )
                  }
                  className="btn-primary inline-flex items-center gap-2 rounded-xl"
                >
                  <User className="h-4 w-4" />
                  Contact account manager
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toast.info(
                      'Please visit your nearest branch for assistance.'
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4" />
                  Branch assistance
                </button>
              </div>
            </div>

            <div className="border-t border-amber-100 bg-amber-50/60 p-8 lg:border-l lg:border-t-0">
              <Clock3 className="h-6 w-6 text-amber-600" />

              <p className="mt-6 text-sm font-semibold text-gray-900">
                Why no transfer form?
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-600">
                The restriction must be reviewed before
                interbank functionality becomes available
                again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* EXTERNAL TRANSFER                                                  */}
      {/* ------------------------------------------------------------------ */}

      {transferType === 'external' && (
        <form
          onSubmit={handleContinueToVerification}
          className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          <div className="grid lg:grid-cols-[1fr_430px]">

            {/* Form */}
            <div className="p-7 sm:p-9">
              <div className="border-b border-gray-100 pb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-600">
                  Same-bank transfer
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                  Send money securely
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enter the recipient and amount, then
                  choose how you want to verify the
                  transaction.
                </p>
              </div>

              <div className="mt-7 space-y-6">

                {/* From */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    From account
                  </label>

                  <CustomSelect
                    value={fromAccount}
                    onChange={setFromAccount}
                    options={accountOptions}
                    placeholder="Select an account"
                  />

                  {selectedAccount && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Available balance
                      </span>

                      <span className="font-semibold text-gray-700">
                        {formatCurrency(
                          availableBalance
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Recipient */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Recipient account number
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        recipientAccountNumber
                      }
                      onChange={(e) =>
                        setRecipientAccountNumber(
                          e.target.value.replace(
                            /\s/g,
                            ''
                          )
                        )
                      }
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-11 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                      placeholder="Enter account number"
                      required
                    />

                    {accountCheckLoading && (
                      <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary-600" />
                    )}

                    {accountCheckResult?.exists && (
                      <CheckCircle className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
                    )}
                  </div>

                  {accountCheckResult?.exists && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600">
                        <User className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-emerald-950">
                          {
                            accountCheckResult.owner_name
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-emerald-700">
                          {
                            accountCheckResult.account_type
                          }{' '}
                          • Account verified
                        </p>
                      </div>
                    </div>
                  )}

                  {accountCheckError && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {accountCheckError}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Amount
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                      $
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) =>
                        setAmount(
                          e.target.value
                        )
                      }
                      className="h-14 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-xl font-semibold outline-none transition placeholder:text-gray-300 hover:border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description{' '}
                    <span className="font-normal text-gray-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                    placeholder="e.g. Payment for services"
                  />
                </div>

                <InfoBanner
                  icon={ShieldCheck}
                  title="Choose your verification method"
                >
                  You can confirm this transfer using
                  your transfer PIN or a one-time code
                  sent to your registered email.
                </InfoBanner>

                {/* Progress */}
                {loading && (
                  <div className="rounded-xl border border-primary-100 bg-primary-50 p-5">
                    <div className="space-y-3">
                      <InitializationStep
                        active={
                          initializationStep ===
                          'preparing'
                        }
                        completed={[
                          'verifying_recipient',
                          'creating_transfer',
                          'sending_otp',
                        ].includes(
                          initializationStep
                        )}
                        icon={
                          <Wallet className="h-4 w-4" />
                        }
                        label="Preparing transfer"
                      />

                      <InitializationStep
                        active={
                          initializationStep ===
                          'verifying_recipient'
                        }
                        completed={[
                          'creating_transfer',
                          'sending_otp',
                        ].includes(
                          initializationStep
                        )}
                        icon={
                          <Search className="h-4 w-4" />
                        }
                        label="Verifying recipient"
                      />

                      <InitializationStep
                        active={
                          initializationStep ===
                          'creating_transfer'
                        }
                        completed={
                          initializationStep ===
                          'sending_otp'
                        }
                        icon={
                          <ArrowRight className="h-4 w-4" />
                        }
                        label="Creating transfer"
                      />

                      {verificationMethod ===
                        'otp' && (
                        <InitializationStep
                          active={
                            initializationStep ===
                            'sending_otp'
                          }
                          completed={false}
                          icon={
                            <Mail className="h-4 w-4" />
                          }
                          label="Sending verification code"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Slow OTP warning */}
                {otpSlowWarning &&
                  !submitError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex gap-3">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-amber-900">
                            This is taking longer than
                            usual
                          </p>

                          <p className="mt-1 text-xs leading-5 text-amber-800">
                            We're still waiting for
                            the verification email. You
                            can cancel and use your
                            transfer PIN instead.
                          </p>

                          <button
                            type="button"
                            onClick={
                              cancelSlowRequestAndUsePin
                            }
                            className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Use PIN instead
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Inline submit error — right above the button */}
                {submitError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-900">
                          Transfer could not be started
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          {submitError} You can use your
                          transfer PIN to verify this
                          transfer instead.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    accountCheckLoading
                  }
                  className="btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : submitError ? (
                    <KeyRound className="h-5 w-5" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}

                  {loading
                    ? 'Preparing transfer...'
                    : submitError
                      ? 'Continue with PIN'
                      : 'Continue to verification'}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-gray-200 bg-gray-50/70 p-7 sm:p-9 lg:border-l lg:border-t-0">
              <div className="sticky top-6">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                    Transfer summary
                  </p>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                    Same bank
                  </span>
                </div>

                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <Wallet className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        From
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                        {selectedAccount?.account_type ||
                          'Select account'}
                      </p>
                    </div>
                  </div>

                  <div className="ml-[39px] h-7 border-l border-dashed border-gray-300" />

                  <div className="flex items-center gap-4 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <User className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        To
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                        {recipientName ||
                          'Recipient will appear here'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">
                    Amount
                  </p>

                  <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                    {formatCurrency(
                      Number(amount) || 0
                    )}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-xs text-gray-400">
                      Verification
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                      {verificationMethod ===
                      'pin' ? (
                        <>
                          <KeyRound className="h-3.5 w-3.5" />
                          Transfer PIN
                        </>
                      ) : (
                        <>
                          <LockKeyhole className="h-3.5 w-3.5" />
                          Email OTP
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2 text-xs leading-5 text-gray-400">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>
                    Never share your transfer PIN or
                    verification code with another person.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Debit Card                                                          */}
      {/* ------------------------------------------------------------------ */}

      <section className="mt-10 border-t border-gray-200 pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_500px]">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              <CreditCard className="h-4 w-4" />
              Debit card
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-gray-950">
              A card designed for everyday spending.
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
              Order your debit card and manage your
              everyday spending from the same account you
              use for transfers.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" />
                Secure payments
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" />
                Everyday spending
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" />
                Track your card
              </div>
            </div>

            <a
              href="/withdraw#card"
              className="btn-primary mt-7 inline-flex items-center gap-2 rounded-xl"
            >
              Order debit card
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <ClassicDebitCard
            userName={userName}
          />
        </div>
      </section>

      {/* ================================================================== */}
      {/* VERIFICATION METHOD MODAL                                           */}
      {/* ================================================================== */}

      <Modal
        isOpen={verificationChoiceOpen}
        onClose={() =>
          !loading &&
          setVerificationChoiceOpen(false)
        }
        title="Confirm transfer"
        size="sm"
        position="center"
        showCloseButton={!loading}
        closeOnOutsideClick={false}
      >
        <div className="space-y-5">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50">
              <ShieldCheck className="h-7 w-7 text-primary-600" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-900">
              Choose verification method
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              How would you like to authorize this
              transfer?
            </p>
          </div>

          <div className="space-y-3">
            <VerificationMethodCard
              active={
                verificationMethod === 'pin'
              }
              icon={KeyRound}
              title="Transfer PIN"
              description="Use your existing transfer PIN to authorize the transaction."
              onClick={() =>
                setVerificationMethod('pin')
              }
            />

            <VerificationMethodCard
              active={
                verificationMethod === 'otp'
              }
              icon={Mail}
              title="Email OTP"
              description="Receive a 6-digit verification code at your registered email."
              onClick={() =>
                setVerificationMethod('otp')
              }
            />
          </div>

          {verificationError && (
            <p className="text-sm text-red-600">
              {verificationError}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              startVerification(
                verificationMethod
              )
            }
            disabled={loading}
            className="btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}

            {loading
              ? 'Preparing...'
              : `Continue with ${
                  verificationMethod ===
                  'pin'
                    ? 'PIN'
                    : 'OTP'
                }`}
          </button>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/* OTP MODAL                                                          */}
      {/* ================================================================== */}

      <Modal
        isOpen={otpModalOpen}
        onClose={closeOtpModal}
        title="Verify transfer"
        size="sm"
        position="center"
        showCloseButton={
          otpStep === 'sent' ||
          otpStep === 'completed' ||
          otpStep === 'pending_review' ||
          otpStep === 'fallback_pin'
        }
        closeOnOutsideClick={false}
      >
        {otpStep === 'sent' && (
          <form
            onSubmit={handleOtpSubmit}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50">
                <Mail className="h-7 w-7 text-primary-600" />
              </div>

              <h3 className="mt-5 font-semibold text-gray-900">
                Verify your transfer
              </h3>

              <p className="mt-2 text-sm leading-5 text-gray-500">
                A 6-digit verification code was sent
                to your registered email address.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Verification code
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(
                    e.target.value.replace(
                      /\D/g,
                      ''
                    )
                  )
                }
                className="h-14 w-full rounded-xl border border-gray-200 text-center font-mono text-2xl tracking-[0.35em] outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="••••••"
                autoFocus
              />

              {otpError && (
                <p className="mt-2 text-sm text-red-600">
                  {otpError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              className="btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl"
            >
              {otpLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LockKeyhole className="h-5 w-5" />
              )}

              {otpLoading
                ? 'Verifying...'
                : 'Verify transfer'}
            </button>

            <button
              type="button"
              onClick={switchOtpToPin}
              disabled={otpLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              Use transfer PIN instead
            </button>

            <p className="text-center text-[11px] text-gray-400">
              Reference: {otpReference}
            </p>
          </form>
        )}

        {otpStep === 'verifying' && (
          <ProcessingScreen
            icon={
              <LockKeyhole className="h-7 w-7 text-primary-600" />
            }
            title="Verifying OTP"
            message="We're securely validating your verification code."
          />
        )}

        {otpStep === 'processing' && (
          <ProcessingScreen
            icon={
              <ArrowRight className="h-7 w-7 text-primary-600" />
            }
            title="Processing transfer"
            message="Your transfer is being posted. Please don't close this window."
          />
        )}

        {otpStep === 'fallback_pin' && (
          <div className="py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <KeyRound className="h-8 w-8 text-amber-600" />
            </div>

            <h3 className="mt-5 text-center text-xl font-semibold text-gray-900">
              Use your transfer PIN
            </h3>

            <p className="mt-2 text-center text-sm leading-5 text-gray-500">
              The OTP could not be verified. You can
              authorize this transfer using your transfer
              PIN instead.
            </p>

            <button
              type="button"
              onClick={switchOtpToPin}
              className="btn-primary mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl"
            >
              <KeyRound className="h-5 w-5" />
              Verify with PIN
            </button>
          </div>
        )}

        {otpStep === 'completed' && (
          <div className="py-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-900">
              Transfer successful
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              Your OTP was verified and the transfer has
              been completed.
            </p>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Transaction reference
              </p>

              <p className="mt-1 font-mono text-sm font-medium text-gray-900">
                {reference}
              </p>
            </div>

            <button
              onClick={handleOtpDone}
              className="btn-primary mt-5 w-full rounded-xl"
            >
              Done
            </button>
          </div>
        )}

        {otpStep === 'pending_review' && (
          <div className="py-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock3 className="h-9 w-9 text-amber-600" />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-900">
              Transfer pending review
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              Your verification was successful. Because
              the account is currently restricted, the
              transfer requires administrator approval.
            </p>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Awaiting approval
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    No money has been moved from your
                    account. The transaction will only
                    complete if an administrator approves
                    it.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">
                Transaction reference
              </p>

              <p className="mt-1 font-mono text-sm font-medium text-gray-900">
                {reference}
              </p>
            </div>

            <button
              onClick={handleOtpDone}
              className="btn-primary mt-5 w-full rounded-xl"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* ================================================================== */}
      {/* PIN MODAL                                                          */}
      {/* ================================================================== */}

      <Modal
        isOpen={pinModalOpen}
        onClose={closePinModal}
        title="Transfer PIN"
        size="sm"
        position="center"
        showCloseButton={
          pinStep === 'entry' ||
          pinStep === 'completed'
        }
        closeOnOutsideClick={false}
      >
        {pinStep === 'entry' && (
          <form
            onSubmit={handlePinSubmit}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50">
                <KeyRound className="h-7 w-7 text-primary-600" />
              </div>

              <h3 className="mt-5 font-semibold text-gray-900">
                Enter your transfer PIN
              </h3>

              <p className="mt-2 text-sm leading-5 text-gray-500">
                Enter your transfer PIN to authorize
                this transaction.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Transfer PIN
              </label>

              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                value={transferPin}
                onChange={(e) =>
                  setTransferPin(
                    e.target.value.replace(
                      /\D/g,
                      ''
                    )
                  )
                }
                className="h-14 w-full rounded-xl border border-gray-200 bg-white text-center font-mono text-2xl tracking-[0.35em] outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="••••"
                autoFocus
              />

              {pinError && (
                <p className="mt-2 text-sm text-red-600">
                  {pinError}
                </p>
              )}
            </div>

            <InfoBanner
              icon={ShieldCheck}
              title="Keep your PIN private"
            >
              Never share your transfer PIN with anyone,
              including support staff or account managers.
            </InfoBanner>

            <button
              type="submit"
              disabled={pinLoading}
              className="btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl"
            >
              {pinLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LockKeyhole className="h-5 w-5" />
              )}

              {pinLoading
                ? 'Verifying...'
                : 'Authorize transfer'}
            </button>

            <button
              type="button"
              onClick={() => {
                closePinModal();

                setVerificationMethod(
                  'otp'
                );

                setVerificationChoiceOpen(
                  true
                );
              }}
              disabled={pinLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              Use email OTP instead
            </button>
          </form>
        )}

        {pinStep === 'verifying' && (
          <ProcessingScreen
            icon={
              <KeyRound className="h-7 w-7 text-primary-600" />
            }
            title="Verifying PIN"
            message="We're securely validating your transfer PIN."
          />
        )}

        {pinStep === 'processing' && (
          <ProcessingScreen
            icon={
              <ArrowRight className="h-7 w-7 text-primary-600" />
            }
            title="Processing transfer"
            message="Your transfer is being posted. Please don't close this window."
          />
        )}

        {pinStep === 'completed' && (
          <div className="py-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>

            <h3 className="mt-5 text-xl font-semibold text-gray-900">
              Transfer successful
            </h3>

            <p className="mt-2 text-sm leading-5 text-gray-500">
              Your transfer PIN was verified and the
              transfer has been completed.
            </p>

            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Transaction reference
              </p>

              <p className="mt-1 font-mono text-sm font-medium text-gray-900">
                {reference}
              </p>
            </div>

            <button
              onClick={handlePinDone}
              className="btn-primary mt-5 w-full rounded-xl"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* ================================================================== */}
      {/* ACCOUNT RESTRICTION MODAL                                          */}
      {/* ================================================================== */}

      <Modal
        isOpen={accountRestrictionOpen}
        onClose={() =>
          setAccountRestrictionOpen(false)
        }
        title="Transfer not allowed"
        size="sm"
        position="center"
        showCloseButton
        closeOnOutsideClick
      >
        <div className="py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>

          <h3 className="mt-5 text-xl font-semibold text-gray-900">
            You can't continue this transaction
          </h3>

          <p className="mt-2 text-sm leading-5 text-gray-500">
            Your account has been{' '}
            <span className="font-semibold text-amber-700">
              {restrictionStatus}
            </span>
            . For security reasons, you cannot continue
            with this transfer. Please contact your
            account manager to resolve this.
          </p>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Account restricted
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Your account manager can review the
                  restriction and restore your transfer
                  privileges.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                setAccountRestrictionOpen(false);
                navigate('/chat');
              }}
              className="btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl"
            >
              <User className="h-5 w-5" />
              Contact account manager
            </button>

            <button
              type="button"
              onClick={() =>
                setAccountRestrictionOpen(false)
              }
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ================================================================== */}
      {/* RECEIPT MODAL                                                      */}
      {/* ================================================================== */}

      <Modal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setReceiptTransaction(null);
        }}
        title="Transaction Receipt"
        size="lg"
        position="center"
        showCloseButton
        closeOnOutsideClick
      >
        {receiptTransaction && (
          <Receipt
            transaction={receiptTransaction}
            onClose={() => {
              setReceiptModalOpen(false);
              setReceiptTransaction(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Alert Icon                                                                 */
/* -------------------------------------------------------------------------- */

const AlertCircleIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line
      x1="12"
      y1="8"
      x2="12"
      y2="12"
    />
    <line
      x1="12"
      y1="16"
      x2="12.01"
      y2="16"
    />
  </svg>
);

export default Transfer;

