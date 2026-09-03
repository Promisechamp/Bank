import React, { useEffect, useMemo, useState } from 'react';
import { transactionsAPI, accountsAPI } from '../api';
import { formatCurrency, validateAmount } from '../utils/helpers';
import Modal from './Modal';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  Clock3,
  CreditCard,
  ExternalLink,
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
  X,
  Zap,
} from 'lucide-react';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="input-field w-full flex items-center justify-between text-left disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                option.value === value
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{option.label}</span>
                {option.value === value && <Check className="h-4 w-4" />}
              </div>
              {option.description && (
                <p className="mt-0.5 text-xs text-gray-400">{option.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Small UI primitives                                                        */
/* -------------------------------------------------------------------------- */

const StatusPill = ({ status }) => {
  const normalized = String(status || 'active').toLowerCase();
  const restricted = ['frozen', 'banned', 'suspended'].includes(normalized);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        restricted
          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
          : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${restricted ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
    </span>
  );
};

const InfoBanner = ({ icon: Icon, title, children, tone = 'gray', action }) => {
  const tones = {
    gray: 'border-gray-200 bg-gray-50 text-gray-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-primary-100 bg-primary-50 text-primary-900',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <div className="mt-1 text-xs leading-5 opacity-80">{children}</div>
          {action}
        </div>
      </div>
    </div>
  );
};

const InitializationStep = ({ active, completed, icon, label }) => (
  <div className="flex items-center gap-3">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
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
        active ? 'font-semibold text-primary-700' : completed ? 'text-emerald-700' : 'text-gray-500'
      }`}
    >
      {label}
    </p>
  </div>
);

const ProcessingScreen = ({ icon, title, message }) => (
  <div className="py-8 text-center">
    <div className="relative mx-auto h-16 w-16">
      <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
    </div>
    <h3 className="mt-6 text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-gray-500">{message}</p>
    <div className="mt-5 flex justify-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Transfer type cards                                                        */
/* -------------------------------------------------------------------------- */

const TransferTypeCard = ({ active, icon: Icon, title, description, badge, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`group relative w-full rounded-2xl border p-4 text-left transition-all ${
      active
        ? 'border-primary-300 bg-primary-50/70 shadow-sm'
        : disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-70'
          : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md'
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          {badge && (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>

      {active && <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary-600" />}
    </div>
  </button>
);


/* -------------------------------------------------------------------------- */
/* Main Transfer Component                                                    */
/* -------------------------------------------------------------------------- */

const Transfer = () => {
  const [transferType, setTransferType] = useState('external');

  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [fetching, setFetching] = useState(true);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [accountCheckLoading, setAccountCheckLoading] = useState(false);
  const [accountCheckResult, setAccountCheckResult] = useState(null);
  const [accountCheckError, setAccountCheckError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reference, setReference] = useState('');
  const [resultStatus, setResultStatus] = useState('');
  const [initializationStep, setInitializationStep] = useState('idle');

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpStep, setOtpStep] = useState('idle');
  const [otpReference, setOtpReference] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (recipientAccountNumber.trim().length < 5) {
      setAccountCheckResult(null);
      setAccountCheckError('');
      setRecipientName('');
      return;
    }

    const timer = setTimeout(() => {
      checkRecipientAccount(recipientAccountNumber.trim());
    }, 600);

    return () => clearTimeout(timer);
  }, [recipientAccountNumber]);

  const fetchAccounts = async () => {
    try {
      setFetching(true);

      // Delay execution for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      const data = await accountsAPI.getAll();
      const loadedAccounts = data.accounts || [];
      setAccounts(loadedAccounts);

      if (!fromAccount && loadedAccounts.length) {
        setFromAccount(loadedAccounts[0].id);
      }
    } catch (err) {
      setError('Failed to load your accounts.');
    } finally {
      setFetching(false);
    }
  };

  const checkRecipientAccount = async (accountNumber) => {
    try {
      setAccountCheckLoading(true);
      setAccountCheckError('');
      setAccountCheckResult(null);

      const response = await accountsAPI.checkExists(accountNumber);

      if (response?.success && response?.exists) {
        setAccountCheckResult({
          exists: true,
          owner_name: response.account.owner_name,
          account_type: response.account.account_type,
          account_id: response.account.id,
        });
        setRecipientName(response.account.owner_name);
      } else {
        setAccountCheckResult({ exists: false });
        setRecipientName('');
        setAccountCheckError('Account not found.');
      }
    } catch (err) {
      setAccountCheckError(err?.error || 'Unable to verify account number.');
    } finally {
      setAccountCheckLoading(false);
    }
  };

  const getAccount = (id) => accounts.find((account) => account.id === id);

  const selectedAccount = useMemo(() => getAccount(fromAccount), [fromAccount, accounts]);

  const availableBalance = useMemo(
    () => (selectedAccount ? Number(selectedAccount.balance || 0) : 0),
    [selectedAccount]
  );

  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: `${account.account_type} — ${formatCurrency(account.balance)}`,
        description: `${account.account_number || 'Account'} • ${account.status || 'active'}`,
      })),
    [accounts]
  );

  const resetTransferForm = () => {
    setAmount('');
    setDescription('');
    setRecipientAccountNumber('');
    setRecipientName('');
    setAccountCheckResult(null);
    setAccountCheckError('');
    setError('');
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setReference('');
    setResultStatus('');

    if (!fromAccount) return setError('Please select an account.');
    if (!recipientAccountNumber) return setError('Please enter the recipient account number.');
    if (!accountCheckResult?.exists) return setError('Please enter a valid recipient account number.');

    const amountNum = Number(amount);
    if (!validateAmount(amountNum) || amountNum <= 0) {
      return setError('Please enter a valid amount greater than 0.');
    }

    if (amountNum > availableBalance) {
      return setError(`Insufficient funds. Available balance: ${formatCurrency(availableBalance)}`);
    }

    setLoading(true);
    setInitializationStep('preparing');

    try {
      await sleep(500);
      setInitializationStep('verifying_recipient');
      await sleep(700);
      setInitializationStep('creating_transfer');

      const response = await transactionsAPI.initiateTransfer({
        fromAccountId: fromAccount,
        amount: amountNum,
        description: description || 'Same bank transfer',
        recipientAccountNumber,
        recipientName,
      });

      if (!response?.success) throw new Error(response?.error || 'Unable to initiate transfer.');

      setInitializationStep('sending_otp');
      await sleep(900);

      if (response.requiresOtp) {
        setOtpReference(response.reference);
        setOtpCode('');
        setOtpError('');
        setOtpAttempts(0);
        setOtpStep('sent');
        setOtpModalOpen(true);
        setInitializationStep('idle');
        toast.success('Verification code sent');
      } else {
        setReference(response.reference || '');
        setResultStatus(response.status || 'completed');
        setSuccess(response.message || 'Transfer completed successfully.');
        resetTransferForm();
        await fetchAccounts();
      }
    } catch (err) {
      setError(err?.error || err?.message || 'Transfer initiation failed.');
      setInitializationStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Enter the 6-digit OTP sent to your email.');
      return;
    }

    setOtpLoading(true);
    setOtpStep('verifying');

    try {
      await sleep(1000);

      const response = await transactionsAPI.verifyTransfer({
        reference: otpReference,
        otp: otpCode,
      });

      if (!response?.success) {
        const nextAttempts = otpAttempts + 1;
        setOtpAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          setOtpError('Too many failed attempts. Please try again later.');
          setOtpStep('idle');
          await sleep(500);
          setOtpModalOpen(false);
        } else {
          setOtpError(`Invalid OTP. ${3 - nextAttempts} attempt${3 - nextAttempts === 1 ? '' : 's'} remaining.`);
          setOtpStep('sent');
        }
        return;
      }

      setOtpStep('processing');
      await sleep(1800);

      if (response.status === 'pending_review') {
        setOtpStep('pending_review');
        setReference(response.reference || otpReference);
        setResultStatus('pending_review');
        toast.success('Transfer submitted for review');
        return;
      }

      if (response.status === 'completed') {
        setOtpStep('completed');
        setReference(response.reference || otpReference);
        setResultStatus('completed');
        toast.success('Transfer completed');
        await fetchAccounts();
        return;
      }

      setOtpError('The transfer returned an unexpected status.');
      setOtpStep('sent');
    } catch (err) {
      setOtpError(err?.error || err?.message || 'Unable to verify this transaction.');
      setOtpStep('sent');
    } finally {
      setOtpLoading(false);
    }
  };

  const closeOtpModal = () => {
    if (otpStep === 'verifying' || otpStep === 'processing') return;
    setOtpModalOpen(false);
    setOtpStep('idle');
    setOtpCode('');
    setOtpError('');
    setOtpReference('');
  };

  if (fetching) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
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
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
            <Zap className="h-3.5 w-3.5" />
            Banking services
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Move money & manage cards</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Send money securely, manage transfer restrictions, and request your debit card from one place.
          </p>
        </div>

        <a href='/withdraw#card'
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
        >
          <CreditCard className="h-4 w-4 text-primary-600" />
          Order debit card
        </a>
      </div>

      {/* Service strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Security</p>
              <p className="text-sm font-semibold text-gray-900">OTP protected</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Transfers</p>
              <p className="text-sm font-semibold text-gray-900">Same-bank enabled</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Cards</p>
              <p className="text-sm font-semibold text-gray-900">Debit card ordering</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer type navigation */}
      <div>
        <div className="mb-3">
          <p className="text-sm font-bold text-gray-900">Transfer type</p>
          <p className="mt-1 text-xs text-gray-500">Choose the service that matches where your money is going.</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <TransferTypeCard
            active={transferType === 'internal'}
            icon={Wallet}
            title="Internal"
            badge="Self"
            description="Move money between accounts owned by you."
            onClick={() => {
              setTransferType('internal');
              setError('');
            }}
          />
          <TransferTypeCard
            active={transferType === 'external'}
            icon={Send}
            title="External"
            badge="Same bank"
            description="Send money to another customer account within the bank."
            onClick={() => {
              setTransferType('external');
              setError('');
            }}
          />
          <TransferTypeCard
            active={transferType === 'interbank'}
            icon={Landmark}
            badge="Suspended"
            title="Interbank"
            description="Send money to an account held at another bank."
            onClick={() => {
              setTransferType('interbank');
              setError('');
            }}
          />
        </div>
      </div>

      {success && transferType === 'external' && (
        <InfoBanner icon={CheckCircle} title="Transfer completed" tone="blue">
          {success}
          {reference && <span className="ml-1 font-mono">Reference: {reference}</span>}
        </InfoBanner>
      )}

      {error && transferType === 'external' && (
        <InfoBanner icon={AlertCircleIcon} title="Transfer could not be started">
          {error}
        </InfoBanner>
      )}

      {/* Internal */}
      {transferType === 'internal' && (
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6 sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <Wallet className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-gray-950">Open another self account first</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                Internal transfers are designed for moving funds between accounts owned by you. You need another eligible self-owned account before money can be moved internally.
              </p>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary-600" />
                  <p className="text-sm font-semibold text-gray-900">Contact your account manager</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Your account manager can help you request another self-owned account.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  <p className="text-sm font-semibold text-gray-900">Visit a branch</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  A branch representative can assist with opening an additional account.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 p-6 sm:p-8">
              <button
                type="button"
                onClick={() => toast.info('Please contact your account manager or visit a branch to open another self account.')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Request another account
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-950 p-6 text-white shadow-sm">
            <ShieldCheck className="h-7 w-7 text-white/80" />
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Internal transfer</p>
            <h3 className="mt-2 text-xl font-bold">Your accounts stay separated</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Once another self-owned account is available, it can be used as a destination for internal movement.
            </p>
          </div>
        </div>
      )}

      {/* Interbank */}
      {transferType === 'interbank' && (
        <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-7 sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Temporary restriction</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">Interbank transfers are suspended</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                Interbank transfers are temporarily suspended due to suspicious account activities. To lift the restriction, please visit a branch or contact your account manager.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => toast.info('Please contact your account manager or visit a branch to lift the interbank restriction.')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Contact account manager
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Please visit your nearest branch for assistance.')}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4" />
                  Branch assistance
                </button>
              </div>
            </div>

            <div className="border-t border-amber-100 bg-amber-50/50 p-7 lg:border-l lg:border-t-0">
              <Clock3 className="h-6 w-6 text-amber-600" />
              <p className="mt-5 text-sm font-bold text-gray-900">Why no transfer form?</p>
              <p className="mt-2 text-xs leading-5 text-gray-600">
                The restriction must be reviewed before interbank functionality becomes available again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* External */}
      {transferType === 'external' && (
        <form onSubmit={handleTransferSubmit} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr_.95fr]">
            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Same-bank transfer</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">Send money securely</h2>
                <p className="mt-1 text-sm text-gray-500">Enter the recipient and amount, then verify the transaction with OTP.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">From account</label>
                <CustomSelect
                  value={fromAccount}
                  onChange={setFromAccount}
                  options={accountOptions}
                  placeholder="Select an account"
                />
                {selectedAccount && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Available balance</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(availableBalance)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Recipient account number</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={recipientAccountNumber}
                    onChange={(e) => setRecipientAccountNumber(e.target.value.replace(/\s/g, ''))}
                    className="input-field pr-11"
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
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-emerald-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-950">{accountCheckResult.owner_name}</p>
                      <p className="mt-0.5 text-xs text-emerald-700">{accountCheckResult.account_type} • Account verified</p>
                    </div>
                  </div>
                )}

                {accountCheckError && <p className="mt-2 text-xs font-medium text-red-600">{accountCheckError}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field pl-8 text-lg font-semibold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Payment for services"
                />
              </div>

              <InfoBanner icon={ShieldCheck} title="Protected transfer">
                Your transaction is verified with a one-time code before funds are moved. Restricted accounts may require additional administrator review.
              </InfoBanner>

              {loading && (
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                  <div className="space-y-3">
                    <InitializationStep
                      active={initializationStep === 'preparing'}
                      completed={['verifying_recipient', 'creating_transfer', 'sending_otp'].includes(initializationStep)}
                      icon={<Wallet className="h-4 w-4" />}
                      label="Preparing transfer"
                    />
                    <InitializationStep
                      active={initializationStep === 'verifying_recipient'}
                      completed={['creating_transfer', 'sending_otp'].includes(initializationStep)}
                      icon={<Search className="h-4 w-4" />}
                      label="Verifying recipient"
                    />
                    <InitializationStep
                      active={initializationStep === 'creating_transfer'}
                      completed={initializationStep === 'sending_otp'}
                      icon={<ArrowRight className="h-4 w-4" />}
                      label="Creating transfer"
                    />
                    <InitializationStep
                      active={initializationStep === 'sending_otp'}
                      completed={false}
                      icon={<Mail className="h-4 w-4" />}
                      label="Sending verification code"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || accountCheckLoading}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {loading ? 'Preparing transfer...' : 'Continue to verification'}
              </button>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="sticky top-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Transfer summary</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-500 ring-1 ring-gray-200">
                    SAME BANK
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400">From</p>
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {selectedAccount?.account_type || 'Select account'}
                      </p>
                    </div>
                  </div>

                  <div className="my-4 ml-5 h-7 border-l border-dashed border-gray-300" />

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400">To</p>
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {recipientName || 'Recipient will appear here'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5">
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
                    {formatCurrency(Number(amount) || 0)}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
                    <span className="text-gray-400">Security</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <LockKeyhole className="h-3.5 w-3.5" />
                      OTP verified
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 text-xs leading-5 text-gray-400">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Never share your OTP with another person.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Debit card CTA */}
      <div className="overflow-hidden rounded-3xl bg-gray-950 p-6 text-white shadow-sm sm:p-8">
        <div className="grid items-center gap-7 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Debit card</p>
            <h2 className="mt-2 text-2xl font-bold">Need a card for everyday spending?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
              Order your debit card, choose your delivery preference, and receive a card reference you can use to track the simulated order.
            </p>
            <a href='withdraw#card'
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
            >
              Order debit card
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>


        </div>
      </div>

      {/* OTP Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={closeOtpModal}
        title="Verify transfer"
        size="sm"
        position="center"
        showCloseButton={otpStep === 'sent' || otpStep === 'completed' || otpStep === 'pending_review'}
        closeOnOutsideClick={false}
      >
        {otpStep === 'sent' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
                <Mail className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Verify your transfer</h3>
              <p className="mt-2 text-sm leading-5 text-gray-500">
                A 6-digit verification code was sent to your registered email address.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="input-field text-center font-mono text-2xl tracking-[0.35em]"
                placeholder="••••••"
                autoFocus
              />
              {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}
            </div>

            <button type="submit" disabled={otpLoading} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {otpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
              {otpLoading ? 'Verifying...' : 'Verify transfer'}
            </button>

            <p className="text-center text-[11px] text-gray-400">Reference: {otpReference}</p>
          </form>
        )}

        {otpStep === 'verifying' && (
          <ProcessingScreen
            icon={<LockKeyhole className="h-7 w-7 text-primary-600" />}
            title="Verifying OTP"
            message="We're securely validating your verification code."
          />
        )}

        {otpStep === 'processing' && (
          <ProcessingScreen
            icon={<ArrowRight className="h-7 w-7 text-primary-600" />}
            title="Processing transfer"
            message="Your transfer is being posted. Please don't close this window."
          />
        )}

        {otpStep === 'completed' && (
          <div className="py-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-9 w-9 text-emerald-600" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-gray-900">Transfer successful</h3>
            <p className="mt-2 text-sm leading-5 text-gray-500">
              Your OTP was verified and the transfer has been completed.
            </p>
            <div className="mt-5 rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Transaction reference</p>
              <p className="mt-1 font-mono text-sm font-medium text-gray-900">{reference}</p>
            </div>
            <button
              onClick={() => {
                closeOtpModal();
                resetTransferForm();
              }}
              className="btn-primary mt-5 w-full"
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
            <h3 className="mt-5 text-xl font-semibold text-gray-900">Transfer pending review</h3>
            <p className="mt-2 text-sm leading-5 text-gray-500">
              Your OTP was verified successfully. Because the account is currently restricted, the transfer requires administrator approval before funds can move.
            </p>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Awaiting approval</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    No money has been moved from your account. The transaction will only complete if an administrator approves it.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Transaction reference</p>
              <p className="mt-1 font-mono text-sm font-medium text-gray-900">{reference}</p>
            </div>

            <button
              onClick={() => {
                closeOtpModal();
                resetTransferForm();
              }}
              className="btn-primary mt-5 w-full"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      
    </div>
  );
};

const AlertCircleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default Transfer;