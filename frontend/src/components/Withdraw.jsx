import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountsAPI, transactionsAPI, authAPI } from '../api';
import { formatCurrency, validateAmount } from '../utils/helpers';
import Modal from './Modal';
import {
  ArrowUpCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wallet,
  CreditCard,
  MapPin,
  User,
  Mail,
  Building2,
  Plus,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Truck,
  PackageCheck,
  Clock3,
  Sparkles,
  ChevronRight,
  Lock,
  Info,
  X,
  RefreshCw
} from 'lucide-react';

/* =========================================================
   CRYPTO CURRENCIES
   Real logo images are loaded from CoinCap's public assets.
   This is only visual/demo data — no real crypto processing.
========================================================= */

const CURRENCIES = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: 'https://assets.coincap.io/assets/icons/btc@2x.png'
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://assets.coincap.io/assets/icons/eth@2x.png'
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    logo: 'https://assets.coincap.io/assets/icons/usdt@2x.png'
  },
  {
    id: 'ltc',
    name: 'Litecoin',
    symbol: 'LTC',
    logo: 'https://assets.coincap.io/assets/icons/ltc@2x.png'
  },
  {
    id: 'bch',
    name: 'Bitcoin Cash',
    symbol: 'BCH',
    logo: 'https://assets.coincap.io/assets/icons/bch@2x.png'
  },
  {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRP',
    logo: 'https://assets.coincap.io/assets/icons/xrp@2x.png'
  }
];

/* =========================================================
   DEMO HELPERS
========================================================= */

const generateDepositAddress = (userId, currencyId) => {
  const seed = `${userId}-${currencyId}-demo`;
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const random = Math.abs(hash);
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let address = '';
  const length = 34 + (random % 9);

  for (let i = 0; i < length; i++) {
    address += chars.charAt((random + i * 17) % chars.length);
  }

  return address;
};

const generateCardNumber = (userId = '') => {
  const seed = `${userId}-${Date.now()}-${Math.random()}`;

  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const random = Math.abs(hash);

  const part1 = String(4000 + (random % 5000)).padStart(4, '0');
  const part2 = String(1000 + ((random >> 3) % 9000)).padStart(4, '0');
  const part3 = String(1000 + ((random >> 7) % 9000)).padStart(4, '0');
  const part4 = String(1000 + ((random >> 11) % 9000)).padStart(4, '0');

  return `${part1} ${part2} ${part3} ${part4}`;
};

const generateCardSecurity = (userId = '') => {
  const seed = `${userId}-${Math.random()}`;

  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  const random = Math.abs(hash);

  const month = String((random % 12) + 1).padStart(2, '0');
  const year = String(27 + (random % 5));

  const cvv = String(100 + (random % 900));

  return {
    expiry: `${month}/${year}`,
    cvv
  };
};

/* =========================================================
   CARD VISUAL
========================================================= */

const DemoDebitCard = ({ user, cardNumber, expiry, cvv }) => {
  const holderName = (
    user?.full_name ||
    user?.name ||
    'CARD HOLDER'
  ).toUpperCase();

  return (
    <div className="relative w-full max-w-[440px] mx-auto aspect-[1.586/1] rounded-[28px] overflow-hidden shadow-2xl">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-800 to-primary-900" />

      {/* Decorative glow */}
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(45deg, transparent 48%, white 49%, white 51%, transparent 52%)',
            backgroundSize: '22px 22px'
          }}
        />
      </div>

      <div className="relative z-10 h-full p-6 sm:p-7 text-white flex flex-col justify-between">
        {/* Top */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
              Banking Demo
            </p>

            <p className="text-xl font-semibold tracking-tight mt-1">
              Banking
            </p>
          </div>

          {/* Contactless */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-6">
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-r-full border-r-2 border-t-2 border-b-2 border-white/70 rotate-0" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-r-full border-r-2 border-t-2 border-b-2 border-white/50" />
            </div>

            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-700 shadow-inner">
              <div className="w-full h-full grid grid-cols-2 opacity-40">
                <div className="border-r border-black/30" />
                <div />
              </div>
            </div>
          </div>
        </div>

        {/* Chip + number */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-700 shadow-lg">
              <div className="grid grid-cols-2 h-full opacity-50">
                <div className="border-r border-black/30" />
                <div />
              </div>
            </div>

            <span className="text-[10px] uppercase tracking-widest text-white/40">
              Debit
            </span>
          </div>

          <p className="font-mono text-lg sm:text-xl tracking-[0.16em] text-white drop-shadow-md">
            {cardNumber || '•••• •••• •••• ••••'}
          </p>
        </div>

        {/* Bottom */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40">
              Card Holder
            </p>
            <p className="text-xs sm:text-sm font-semibold tracking-wider mt-1 truncate max-w-[190px]">
              {holderName}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40">
              Valid Thru
            </p>

            <p className="text-xs font-semibold mt-1">
              {expiry || '••/••'}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40">
              CVV
            </p>

            <p className="text-xs font-semibold mt-1">
              {cvv || '•••'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const Withdraw = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newBalance, setNewBalance] = useState(null);
  const [profile, setProfile] = useState(null);

  /* Internal transfer */
  const [sourceAccount, setSourceAccount] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');

  /* Card flow */
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardOrderStep, setCardOrderStep] = useState('address');

  const [cardAddress, setCardAddress] = useState('');
  const [cardCity, setCardCity] = useState('');
  const [cardState, setCardState] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [cardCountry, setCardCountry] = useState('US');

  const [cardFee] = useState(10);

  /* card */
  const [demoCard, setDemoCard] = useState(null);

  /* Payment */
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [depositAddress, setDepositAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStep, setPaymentStep] = useState('idle');

  /* =========================================================
     FETCH DATA
  ========================================================= */

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);

      const accountsData = await accountsAPI.getAll();

      const activeAccounts = (accountsData.accounts || []).filter(
        acc => acc.status === 'active'
      );

      setAccounts(activeAccounts);

      if (activeAccounts.length > 0) {
        setSourceAccount(activeAccounts[0].id);

        if (activeAccounts.length > 1) {
          setDestinationAccount(activeAccounts[1].id);
        }
      }

      const profileData = await authAPI.getProfile();

      if (profileData.success && profileData.profile) {
        const currentProfile = profileData.profile;

        setProfile(currentProfile);

        setCardAddress(currentProfile.address || '');
        setCardCountry(currentProfile.country || 'US');
        setCardCity(currentProfile.city || '');
        setCardState(currentProfile.state || '');
        setCardZip(currentProfile.zip || '');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load account information');
    } finally {
      setFetching(false);
    }
  };

  /* =========================================================
     ACCOUNT HELPERS
  ========================================================= */

  const getAccountBalance = id => {
    const account = accounts.find(acc => acc.id === id);
    return account ? Number(account.balance) : 0;
  };

  const getSourceBalance = () => {
    return getAccountBalance(sourceAccount);
  };

  /* =========================================================
     INTERNAL WITHDRAW
  ========================================================= */

  const handleWithdrawSubmit = async e => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setNewBalance(null);

    if (!sourceAccount || !destinationAccount) {
      setError('Please select both accounts.');
      return;
    }

    if (sourceAccount === destinationAccount) {
      setError('You cannot transfer funds to the same account.');
      return;
    }

    const amountNum = parseFloat(withdrawAmount);

    if (!validateAmount(amountNum)) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const balance = getSourceBalance();

    if (amountNum > balance) {
      setError(
        `Insufficient funds. Available balance: ${formatCurrency(balance)}`
      );
      return;
    }

    setLoading(true);

    try {
      const data = await transactionsAPI.transfer({
        fromAccountId: sourceAccount,
        toAccountId: destinationAccount,
        amount: amountNum,
        description:
          withdrawDescription || 'Internal account transfer'
      });

      setSuccess(
        `Transfer of ${formatCurrency(amountNum)} completed successfully.`
      );

      setNewBalance(balance - amountNum);
      setWithdrawAmount('');
      setWithdrawDescription('');

      await fetchData();
    } catch (err) {
      setError(err.error || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CARD ORDER
  ========================================================= */

  const handleOrderCard = async () => {
    setError('');

    if (!profile) {
      try {
        const profileData = await authAPI.getProfile();

        if (profileData.success && profileData.profile) {
          const currentProfile = profileData.profile;

          setProfile(currentProfile);

          setCardAddress(currentProfile.address || '');
          setCardCountry(currentProfile.country || 'US');
          setCardCity(currentProfile.city || '');
          setCardState(currentProfile.state || '');
          setCardZip(currentProfile.zip || '');
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    }

    setCardOrderStep('address');
    setShowCardModal(true);
  };

  const handleAddressSubmit = e => {
    e.preventDefault();

    setError('');

    if (
      !cardAddress ||
      !cardCity ||
      !cardState ||
      !cardZip ||
      !cardCountry
    ) {
      setError('Please complete your shipping address.');
      return;
    }

    setCardOrderStep('review');
  };

  const handleProceedToPayment = () => {
    setShowCardModal(false);

    setPaymentModalOpen(true);
    setPaymentStep('idle');

    setSelectedCurrency(CURRENCIES[0]);

    if (user) {
      setDepositAddress(
        generateDepositAddress(user.id, CURRENCIES[0].id)
      );
    }
  };

  /* =========================================================
     DEMO PAYMENT
  ========================================================= */

  const handlePaymentMade = () => {
    setPaymentStep('checking');

    /*
      Assignment/demo behavior.

      Nothing is actually sent to a blockchain.
      We simply simulate a processing state.
    */

    setTimeout(() => {
      const security = generateCardSecurity(user?.id);

      setDemoCard({
        number: generateCardNumber(user?.id),
        expiry: security.expiry,
        cvv: security.cvv,
        orderId: `CARD-${Math.floor(
          100000 + Math.random() * 900000
        )}`
      });

      setPaymentStep('done');
    }, 3000);
  };

  /* =========================================================
     CURRENCY
  ========================================================= */

  const handleCurrencySelect = currency => {
    setSelectedCurrency(currency);

    if (user) {
      setDepositAddress(
        generateDepositAddress(user.id, currency.id)
      );
    }

    setCopied(false);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      setError('Unable to copy address.');
    }
  };

  /* =========================================================
     RESET
  ========================================================= */

  const resetCardFlow = () => {
    setShowCardModal(false);
    setPaymentModalOpen(false);

    setPaymentStep('idle');
    setCardOrderStep('address');

    setCopied(false);
    setError('');
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Loading your banking information...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     NO ACCOUNTS
  ========================================================= */

  if (accounts.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="card text-center py-12 px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
            <Wallet className="h-8 w-8 text-gray-400" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-5">
            No Active Accounts
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            You need an active account before you can use withdrawal
            services.
          </p>

          <button
            onClick={() => navigate('/accounts')}
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Account
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary-600 mb-2">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            Account Services
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Withdraw Funds
          </h1>

          <p className="text-gray-500 mt-1">
            Move funds between your accounts or order your demo debit card.
          </p>
        </div>
      </div>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>

          <div>
            <p className="font-semibold text-green-900">
              Transaction completed
            </p>

            <p className="text-sm text-green-700 mt-0.5">
              {success}
            </p>

            {newBalance !== null && (
              <p className="text-xs text-green-600 mt-1">
                New balance: {formatCurrency(newBalance)}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />

          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          INTERNAL TRANSFER
      ===================================================== */}

      <section className="card overflow-hidden">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ArrowUpCircle className="h-5 w-5 text-gray-700" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Transfer Between Accounts
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Move available funds from one of your accounts to another.
            </p>
          </div>
        </div>

        {accounts.length < 2 ? (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-yellow-900">
                A second account is required
              </p>

              <p className="text-sm text-yellow-700 mt-1">
                Create another account to enable internal transfers.
              </p>
            </div>

            <button
              onClick={() => navigate('/accounts')}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Account
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleWithdrawSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From account
                </label>

                <select
                  value={sourceAccount}
                  onChange={e => setSourceAccount(e.target.value)}
                  className="input-field"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type} — {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-gray-500 mt-2">
                  Available: {formatCurrency(getSourceBalance())}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To account
                </label>

                <select
                  value={destinationAccount}
                  onChange={e => setDestinationAccount(e.target.value)}
                  className="input-field"
                  required
                >
                  {accounts
                    .filter(acc => acc.id !== sourceAccount)
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_type} — {formatCurrency(acc.balance)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="input-field pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
                <span className="font-normal text-gray-400 ml-1">
                  Optional
                </span>
              </label>

              <input
                type="text"
                value={withdrawDescription}
                onChange={e => setWithdrawDescription(e.target.value)}
                className="input-field"
                placeholder="e.g. Transfer to savings"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}

                {loading ? 'Processing...' : 'Transfer Funds'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* =====================================================
          DEBIT CARD SECTION
      ===================================================== */}

      <section className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">

        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative p-6 sm:p-8">

          <div className="flex flex-col lg:flex-row gap-8 items-center">

            {/* CARD */}
            <div className="w-full lg:w-[52%]">
              <DemoDebitCard
                user={user}
                cardNumber={
                  demoCard?.number || '4821 7391 2048 6157'
                }
                expiry={demoCard?.expiry || '12/29'}
                cvv={demoCard?.cvv || '•••'}
              />

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Sample card • No financial data untill activated</span>
              </div>
            </div>

            {/* CONTENT */}
            <div className="w-full lg:w-[48%]">

              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 text-primary-700 px-3 py-1.5 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Premium Card
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-4">
                Your banking card,
                <br />
                beautifully designed for convinience.
              </h2>

              <p className="text-sm text-gray-500 mt-3 leading-6">
                Order a personalized demo debit card using your account
                information. The card shown here is for this assignment
                and does not represent a real financial product.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <CreditCard className="h-5 w-5 text-gray-700" />

                  <p className="text-xs text-gray-400 mt-3">
                    Card type
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    Debit
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <Truck className="h-5 w-5 text-gray-700" />

                  <p className="text-xs text-gray-400 mt-3">
                    Delivery
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    5–7 business days
                  </p>
                </div>

              </div>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">

                <div>
                  <p className="text-xs text-gray-400">
                    Demoard fee
                  </p>

                  <p className="text-xl font-bold text-gray-900">
                    ${cardFee.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={handleOrderCard}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  Order Card
                  <ChevronRight className="h-4 w-4" />
                </button>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CARD ADDRESS + REVIEW MODAL
      ===================================================== */}

      <Modal
        isOpen={showCardModal}
        onClose={resetCardFlow}
        title={
          cardOrderStep === 'address'
            ? 'Shipping Details'
            : 'Review Card Order'
        }
        size="md"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >

        {cardOrderStep === 'address' && (
          <form
            onSubmit={handleAddressSubmit}
            className="space-y-5"
          >

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex gap-3">
              <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Where should we send your card?
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Your profile information has been used to pre-fill
                  the form where available.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street address
              </label>

              <input
                type="text"
                value={cardAddress}
                onChange={e => setCardAddress(e.target.value)}
                className="input-field"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>

                <input
                  type="text"
                  value={cardCity}
                  onChange={e => setCardCity(e.target.value)}
                  className="input-field"
                  placeholder="City"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>

                <input
                  type="text"
                  value={cardState}
                  onChange={e => setCardState(e.target.value)}
                  className="input-field"
                  placeholder="State"
                  required
                />
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP / Postal code
                </label>

                <input
                  type="text"
                  value={cardZip}
                  onChange={e => setCardZip(e.target.value)}
                  className="input-field"
                  placeholder="10001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>

                <select
                  value={cardCountry}
                  onChange={e => setCardCountry(e.target.value)}
                  className="input-field"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="AU">Australia</option>
                  <option value="NG">Nigeria</option>
                </select>
              </div>

            </div>

            <div className="rounded-2xl border border-gray-200 p-4 flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-700">
                  Card fee
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  One-time assignment fee
                </p>
              </div>

              <p className="text-lg font-bold text-gray-900">
                ${cardFee.toFixed(2)}
              </p>

            </div>

            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={resetCardFlow}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>

            </div>

          </form>
        )}

        {cardOrderStep === 'review' && (
          <div className="space-y-5">

            <DemoDebitCard
              user={user}
              cardNumber="4821 7391 2048 6157"
              expiry="12/29"
              cvv="•••"
            />

            <div className="rounded-2xl border border-gray-200 divide-y divide-gray-100">

              <div className="p-4 flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">
                    Card holder
                  </p>

                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {user?.full_name || 'Card Holder'}
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-400">
                    Delivery address
                  </p>

                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {cardAddress}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {cardCity}, {cardState} {cardZip}
                  </p>

                  <p className="text-xs text-gray-500">
                    {cardCountry}
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Card fee
                </span>

                <span className="font-bold text-gray-900">
                  ${cardFee.toFixed(2)}
                </span>
              </div>

            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />

              <p className="text-xs text-blue-700 leading-5">
                This is a simulated card order for the banking
                demonstration. No real card or financial transaction
                will be created.
              </p>
            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() => setCardOrderStep('address')}
                className="btn-secondary flex-1"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                Proceed
                <ArrowRight className="h-4 w-4" />
              </button>

            </div>

          </div>
        )}

      </Modal>

      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}

      <Modal
        isOpen={paymentModalOpen}
        onClose={resetCardFlow}
        title={
          paymentStep === 'idle'
            ? 'Complete Card Order'
            : paymentStep === 'checking'
              ? 'Processing Order'
              : 'Order Confirmed'
        }
        size="lg"
        position="bottom"
        showCloseButton={paymentStep === 'done'}
        closeOnOutsideClick={false}
      >

        {/* ===================================================
            PAYMENT SELECT
        =================================================== */}

        {paymentStep === 'idle' && (
          <div className="space-y-6">

            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs text-gray-400">
                    Amount due
                  </p>

                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${cardFee.toFixed(2)}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                </div>

              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <Lock className="h-3.5 w-3.5" />
                Demo payment environment
              </div>

            </div>

            <div>
              <div className="flex items-center justify-between mb-3">

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Select currency
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Choose how you would like to make payment.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                {CURRENCIES.map(currency => (
                  <button
                    key={currency.id}
                    type="button"
                    onClick={() => handleCurrencySelect(currency)}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      selectedCurrency.id === currency.id
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >

                    {selectedCurrency.id === currency.id && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-4 w-4 text-primary-600" />
                      </div>
                    )}

                    <img
                      src={currency.logo}
                      alt={currency.name}
                      className="w-9 h-9 object-contain"
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />

                    <p className="text-sm font-semibold text-gray-900 mt-3">
                      {currency.symbol}
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      {currency.name}
                    </p>

                  </button>
                ))}

              </div>
            </div>

            {/* ADDRESS */}

            <div>

              <div className="flex items-center justify-between mb-2">

                <label className="text-sm font-semibold text-gray-700">
                  Demo payment address
                </label>

                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                  {selectedCurrency.symbol}
                </span>

              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">

                <p className="font-mono text-xs sm:text-sm text-gray-700 break-all flex-1">
                  {depositAddress}
                </p>

                <button
                  type="button"
                  onClick={copyAddress}
                  className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-primary-300 transition-colors flex-shrink-0"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>

              </div>

              <p className="text-xs text-gray-400 mt-2">
                This address is generated for demonstration purposes only.
                No blockchain transaction is being monitored.
              </p>

            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 flex gap-3">

              <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Assignment demo
                </p>

                <p className="text-xs text-amber-700 mt-1 leading-5">
                  Clicking the button below only simulates the payment
                  process. No funds are transferred.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={handlePaymentMade}
              className="btn-primary w-full py-3.5 inline-flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              I've completed the demo payment
            </button>

          </div>
        )}

        {/* ===================================================
            PROCESSING
        =================================================== */}

        {paymentStep === 'checking' && (
          <div className="text-center py-10">

            <div className="relative w-20 h-20 mx-auto">

              <div className="absolute inset-0 rounded-full border-4 border-primary-100" />

              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />

              <div className="absolute inset-0 flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-primary-600" />
              </div>

            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-6">
              Preparing your card order
            </h3>

            <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-6">
              We're simulating the payment confirmation and preparing
              your card order details.
            </p>

            <div className="max-w-sm mx-auto mt-8 space-y-3 text-left">

              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">
                  Order details verified
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">
                  Shipping address confirmed
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                <span className="text-sm text-gray-600">
                  Preparing card order
                </span>
              </div>

            </div>

          </div>
        )}

        {/* ===================================================
            DONE
        =================================================== */}

        {paymentStep === 'done' && (
          <div className="py-4">

            <div className="text-center">

              <div className="relative w-20 h-20 mx-auto">

                <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />

                <div className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <PackageCheck className="h-9 w-9 text-green-600" />
                </div>

              </div>

              <h3 className="text-2xl font-bold text-gray-900 mt-6">
                Your card is on its way
              </h3>

              <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-6">
                Your card order has been successfully created.
                Your card will be with you within
                <span className="font-semibold text-gray-700">
                  {' '}5–7 business days.
                </span>
              </p>

            </div>

            {/* ORDER NUMBER */}

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 mt-7">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs text-gray-400">
                    Order reference
                  </p>

                  <p className="font-mono font-semibold text-gray-900 mt-1">
                    {demoCard?.orderId}
                  </p>
                </div>

                <CheckCircle className="h-5 w-5 text-green-600" />

              </div>

              <div className="mt-5 pt-5 border-t border-gray-200">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-primary-600" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Estimated delivery
                    </p>

                    <p className="text-xs text-gray-500 mt-0.5">
                      5–7 business days
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* CARD */}

            {demoCard && (
              <div className="mt-7">

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 text-center">
                  Your card
                </p>

                <DemoDebitCard
                  user={user}
                  cardNumber={demoCard.number}
                  expiry={demoCard.expiry}
                  cvv={demoCard.cvv}
                />

              </div>
            )}

            {/* ACTIONS */}

            <div className="flex flex-col sm:flex-row gap-3 mt-7">

              <button
                type="button"
                onClick={() => {
                  resetCardFlow();
                  navigate('/card-tracking');
                }}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Track Card Movement
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={resetCardFlow}
                className="btn-secondary flex-1"
              >
                Close
              </button>

            </div>

            

          </div>
        )}

      </Modal>

    </div>
  );
};

export default Withdraw;