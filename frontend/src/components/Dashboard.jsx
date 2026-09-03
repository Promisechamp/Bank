import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountsAPI, transactionsAPI } from '../api';
import {
  formatCurrency,
  formatDate,
  getAccountTypeColor,
} from '../utils/helpers';
import Modal from './Modal';

import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Send,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  CreditCard,
  TrendingUp,
  Phone,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Building2,
  Smartphone,
  PiggyBank,
  BarChart3,
  LockKeyhole,
  CircleDollarSign,
  Receipt,
  Sparkles,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  const [balanceVisible, setBalanceVisible] = useState(true);

  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const [restrictedAction, setRestrictedAction] = useState('');

  const [servicesModalOpen, setServicesModalOpen] = useState(false);

  const [activePromo, setActivePromo] = useState(0);

  /*
   * ------------------------------------------------------------
   * ACCOUNT / PERMISSIONS
   * ------------------------------------------------------------
   */

  const getUserAccountType = () => {
    if (accounts.length > 0) {
      return accounts[0].account_type;
    }

    return 'checking';
  };

  const getPermissions = (accountType) => {
    const isPremium =
      accountType === 'savings' || accountType === 'premium';

    return {
      canRequestLoan: isPremium,
      canInvest: isPremium,
      canPayBills: true,
      canViewStatements: true,
      canContactSupport: true,
      canDeposit: true,
      canWithdraw: true,
      canTransfer: true,
      canNewAccount: true,
    };
  };

  /*
   * ------------------------------------------------------------
   * DATA
   * ------------------------------------------------------------
   */

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    setLoading(true);

    const accountsData = await accountsAPI.getAll();
    const loadedAccounts = accountsData.accounts || [];

    setAccounts(loadedAccounts);

    // Sort by created_at (oldest first)
    const sorted = [...loadedAccounts].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    // The oldest account is the primary
    const primaryAccountId = sorted[0]?.id || null;

    // Calculate total balance
    const total = loadedAccounts.reduce(
      (sum, acc) => sum + (acc.balance || 0),
      0
    );
    setTotalBalance(total);

    // Fetch transactions for the primary account only
    if (primaryAccountId) {
      const txData = await transactionsAPI.getHistory(
        primaryAccountId,
        { limit: 5 }
      );
      setTransactions(txData.transactions || []);
    } else {
      setTransactions([]);
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    setLoading(false);
  }
};

  /*
   * ------------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------------
   */

  const handleAction = (action, path, permissionKey) => {
    const accountType = getUserAccountType();
    const permissions = getPermissions(accountType);

    if (!permissions[permissionKey]) {
      setRestrictedAction(action);
      setRestrictedModalOpen(true);
      return;
    }

    navigate(path);
  };

  const quickActions = [
    {
      label: 'Deposit',
      icon: ArrowDownCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      path: '/deposit',
      permissionKey: 'canDeposit',
    },
    {
      label: 'Transfer',
      icon: Send,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      path: '/transfer',
      permissionKey: 'canTransfer',
    },
    {
      label: 'Pay Bills',
      icon: CreditCard,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      path: '/pay-bills',
      permissionKey: 'canPayBills',
    },
    {
      label: 'Withdraw',
      icon: ArrowUpCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      path: '/withdraw',
      permissionKey: 'canWithdraw',
    },
  ];

  const moreServices = [
    {
      label: 'Request Loan',
      description: 'Explore available loan options',
      icon: CircleDollarSign,
      path: '/request-loan',
      permissionKey: 'canRequestLoan',
    },
    {
      label: 'Invest',
      description: 'Explore investment opportunities',
      icon: TrendingUp,
      path: '/invest',
      permissionKey: 'canInvest',
    },
    {
      label: 'Statements',
      description: 'View and download statements',
      icon: FileText,
      path: '/statements',
      permissionKey: 'canViewStatements',
    },
    {
      label: 'Support',
      description: 'Get help with your account',
      icon: Phone,
      path: '/support',
      permissionKey: 'canContactSupport',
    },
  ];

  /*
   * ------------------------------------------------------------
   * PROMOTIONS
   * ------------------------------------------------------------
   */

  const promotions = [
    {
      eyebrow: 'SMART SAVING',
      title: 'Build better saving habits',
      description:
        'Set money aside for the things that matter and keep your financial goals on track.',
      button: 'Explore savings',
      path: '/accounts',
      type: 'savings',
      icon: PiggyBank,
    },
    {
      eyebrow: 'FINANCIAL INSIGHTS',
      title: 'Understand your money',
      description:
        'See your spending patterns and get a clearer picture of your financial activity.',
      button: 'View insights',
      path: '/analytics',
      type: 'analytics',
      icon: BarChart3,
    },
    {
      eyebrow: 'MOBILE BANKING',
      title: 'Download our app',
      description:
        'Take your banking with you. Check balances, send money and manage your accounts wherever you are.',
      button: 'Get the app',
      path: '/download-app',
      type: 'mobile',
      icon: Smartphone,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo(
        (current) => (current + 1) % promotions.length
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  const nextPromo = () => {
    setActivePromo(
      (current) => (current + 1) % promotions.length
    );
  };

  const previousPromo = () => {
    setActivePromo(
      (current) =>
        (current - 1 + promotions.length) % promotions.length
    );
  };

  /*
   * ------------------------------------------------------------
   * FINANCIAL SNAPSHOT
   * ------------------------------------------------------------
   */

  const financialSnapshot = useMemo(() => {
    const income = transactions
      .filter((tx) => tx.transaction_type === 'credit')
      .reduce(
        (sum, tx) => sum + Math.abs(tx.amount || 0),
        0
      );

    const spending = transactions
      .filter(
        (tx) =>
          tx.transaction_type === 'debit' ||
          tx.transaction_type === 'transfer'
      )
      .reduce(
        (sum, tx) => sum + Math.abs(tx.amount || 0),
        0
      );

    const saved = Math.max(income - spending, 0);

    const spendingPercentage =
      income > 0
        ? Math.min(Math.round((spending / income) * 100), 100)
        : 0;

    return {
      income,
      spending,
      saved,
      spendingPercentage,
    };
  }, [transactions]);

  /*
   * ------------------------------------------------------------
   * DISPLAY HELPERS
   * ------------------------------------------------------------
   */

  const displayAmount = (amount) => {
    if (!balanceVisible) {
      return '••••••••';
    }

    return formatCurrency(amount || 0);
  };

  /*
   * ------------------------------------------------------------
   * TRANSACTION DISPLAY
   * ------------------------------------------------------------
   *
   * credit  = money coming INTO the account
   * debit   = money leaving the account
   * transfer = money leaving the account
   *
   * This classification controls:
   * - plus / minus sign
   * - amount color
   * - transaction icon
   */

  const getTransactionFlow = (type) => {
    switch (type) {
      case 'credit':
        return 'credit';

      case 'debit':
      case 'transfer':
        return 'debit';

      default:
        return 'neutral';
    }
  };

  /*
   * Transaction type icon
   *
   * This represents the direction of money.
   */

  const getTransactionIcon = (type) => {
    const flow = getTransactionFlow(type);

    if (flow === 'credit') {
      return ArrowDownCircle;
    }

    if (flow === 'debit') {
      return ArrowUpCircle;
    }

    return Send;
  };

  /*
   * Transaction icon background/color
   */

  const getTransactionIconStyle = (type) => {
    const flow = getTransactionFlow(type);

    if (flow === 'credit') {
      return 'bg-emerald-50 text-emerald-600';
    }

    if (flow === 'debit') {
      return 'bg-rose-50 text-rose-600';
    }

    return 'bg-blue-50 text-blue-600';
  };

  /*
   * Transaction amount color
   *
   * IMPORTANT:
   * This follows MONEY FLOW, not transaction status.
   */

  const getTransactionAmountStyle = (type) => {
    const flow = getTransactionFlow(type);

    if (flow === 'credit') {
      return 'text-emerald-600';
    }

    if (flow === 'debit') {
      return 'text-rose-600';
    }

    return 'text-gray-600';
  };

  /*
   * Transaction amount sign
   */

  const getTransactionAmountPrefix = (type) => {
    const flow = getTransactionFlow(type);

    if (flow === 'credit') {
      return '+';
    }

    if (flow === 'debit') {
      return '−';
    }

    return '';
  };

  /*
   * Transaction status badge
   *
   * Status is separate from money direction.
   */

  const getTransactionStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          className: 'bg-emerald-100 text-emerald-600',
          label: 'Completed',
          icon: ShieldCheck,
        };

      case 'pending_review':
        return {
          className: 'bg-amber-100 text-amber-600',
          label: 'Pending',
          icon: Loader2,
        };

      case 'failed':
        return {
          className: 'bg-rose-100 text-rose-600',
          label: 'Failed',
          icon: AlertCircle,
        };

      default:
        return {
          className: 'bg-gray-100 text-gray-600',
          label: status || 'Unknown',
          icon: AlertCircle,
        };
    }
  };

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>

        <p className="mt-4 text-sm font-medium text-gray-600">
          Loading your dashboard...
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Please wait a moment
        </p>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * DASHBOARD
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-6">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Good afternoon
            {user?.full_name
              ? `, ${user.full_name.split(' ')[0]}`
              : ''}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Here’s what’s happening with your money today.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Secure session
        </div>
      </div>

      {/* ========================================================
          BALANCE CARD
      ======================================================== */}

      <section className="relative overflow-hidden rounded-2xl bg-primary-600 text-white shadow-lg">

        <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full border-[45px] border-white/5" />

        <div className="pointer-events-none absolute -right-5 top-16 h-52 w-52 rounded-full border-[25px] border-white/5" />

        <div className="relative p-5 sm:p-7">

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">

                <p className="text-sm font-medium text-primary-100">
                  Total available balance
                </p>

                <button
                  onClick={() =>
                    setBalanceVisible((visible) => !visible)
                  }
                  className="rounded-md p-1 transition hover:bg-white/10"
                  aria-label={
                    balanceVisible
                      ? 'Hide balance'
                      : 'Show balance'
                  }
                >
                  {balanceVisible ? (
                    <Eye className="h-4 w-4 text-primary-100" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-primary-100" />
                  )}
                </button>

              </div>

              <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {displayAmount(totalBalance)}
              </p>

              <p className="mt-2 text-sm text-primary-100">
                Across {accounts.length} account
                {accounts.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-white/10 sm:flex">
              <Wallet className="h-6 w-6" />
            </div>
          </div>

          {accounts.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">

              {accounts.slice(0, 3).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3"
                >
                  <div>
                    <p className="text-xs capitalize text-primary-100/80">
                      {account.account_type}
                    </p>

                    <p className="mt-1 font-mono text-[11px] text-white/70">
                      •••• {String(account.account_number).slice(-4)}
                    </p>
                  </div>

                  <p className="text-sm font-semibold tabular-nums">
                    {displayAmount(account.balance)}
                  </p>
                </div>
              ))}

            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          QUICK ACTIONS
      ======================================================== */}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Quick actions
            </h2>

            <p className="text-xs text-gray-500">
              Common banking tasks
            </p>
          </div>

          <button
            onClick={() => setServicesModalOpen(true)}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            More services
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;

            return (
              <button
                key={action.label}
                onClick={() =>
                  handleAction(
                    action.label,
                    action.path,
                    action.permissionKey
                  )
                }
                className="group flex min-h-[105px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md active:translate-y-0"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.bg}`}
                >
                  <ActionIcon
                    className={`h-5 w-5 ${action.color}`}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {action.label}
                  </span>

                  <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:text-primary-500" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          ACCOUNTS + RECENT ACTIVITY
      ======================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* ======================================================
            ACCOUNTS
        ====================================================== */}

        <section className="lg:col-span-2">

          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Your accounts
              </h2>

              <p className="text-xs text-gray-500">
                Balances and account details
              </p>
            </div>

            <button
              onClick={() => navigate('/accounts')}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">

            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>

                <p className="mt-3 text-sm font-semibold text-gray-800">
                  No accounts yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Open an account to get started.
                </p>

                <button
                  onClick={() => navigate('/accounts')}
                  className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Open your first account
                </button>

              </div>
            ) : (
              accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => navigate('/accounts')}
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary-200 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">

                    {account.account_type === 'savings' ? (
                      <PiggyBank className="h-5 w-5" />
                    ) : (
                      <Wallet className="h-5 w-5" />
                    )}

                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                      <p className="truncate text-sm font-semibold capitalize text-gray-900">
                        {account.account_type} Account
                      </p>

                      {account.id === accounts[0]?.id && (
                        <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline-block">
                          Primary
                        </span>
                      )}

                    </div>

                    <p className="mt-0.5 font-mono text-xs text-gray-500">
                      •••• {String(account.account_number).slice(-4)}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm font-bold tabular-nums text-gray-900">
                      {displayAmount(account.balance)}
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${getAccountTypeColor(
                        account.account_type
                      )}`}
                    >
                      {account.account_type}
                    </span>

                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-primary-500" />
                </button>
              ))
            )}

          </div>

          {accounts.length > 0 && (
            <button
              onClick={() =>
                handleAction(
                  'New Account',
                  '/accounts',
                  'canNewAccount'
                )
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-3 text-sm font-medium text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
            >
              <Plus className="h-4 w-4" />
              Open a new account
            </button>
          )}

        </section>

        {/* ======================================================
            RECENT ACTIVITY
        ====================================================== */}

        <section className="lg:col-span-3">

          <div className="mb-3 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent activity
              </h2>

              <p className="text-xs text-gray-500">
                Your latest transactions
              </p>
            </div>

            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {transactions.length === 0 ? (

              <div className="px-5 py-14 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50">
                  <Receipt className="h-5 w-5 text-gray-400" />
                </div>

                <p className="mt-3 text-sm font-semibold text-gray-700">
                  No recent transactions
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Your account activity will appear here.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-gray-100">

                {transactions.map((tx) => {

                  const TransactionIcon =
                    getTransactionIcon(tx.transaction_type);

                  const status =
                    getTransactionStatusBadge(tx.status);

                  const StatusIcon = status.icon;

                  const amountStyle =
                    getTransactionAmountStyle(
                      tx.transaction_type
                    );

                  const amountPrefix =
                    getTransactionAmountPrefix(
                      tx.transaction_type
                    );

                  return (
                    <div
                      key={tx.id}
                      className="group flex items-center gap-3 px-4 py-4 transition hover:bg-gray-50 sm:px-5"
                    >

                      {/* -----------------------------------------
                          TRANSACTION TYPE ICON
                      ----------------------------------------- */}

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getTransactionIconStyle(
                          tx.transaction_type
                        )}`}
                      >
                        <TransactionIcon className="h-5 w-5" />
                      </div>

                      {/* -----------------------------------------
                          TRANSACTION DETAILS
                      ----------------------------------------- */}

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold text-gray-900">
                          {tx.description || 'Transaction'}
                        </p>

                        <div className="mt-1 flex items-center gap-2">

                          <p className="text-xs text-gray-500">
                            {formatDate(tx.created_at)}
                          </p>

                          <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />

                          {/* -------------------------------------
                              STATUS BADGE
                          ------------------------------------- */}

                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${status.className}`}
                          >

                            <StatusIcon
                              className={`h-3 w-3 ${
                                tx.status === 'pending_review'
                                  ? 'animate-spin'
                                  : ''
                              }`}
                            />

                            {status.label}

                          </span>

                        </div>
                      </div>

                      {/* -----------------------------------------
                          AMOUNT
                          -----------------------------------------
                          
                          credit:
                            +₦10,000 / green

                          debit:
                            −₦10,000 / red

                          transfer:
                            −₦10,000 / red
                      ----------------------------------------- */}

                      <p
                        className={`shrink-0 text-sm font-bold tabular-nums ${amountStyle}`}
                      >
                        {amountPrefix}
                        {formatCurrency(
                          Math.abs(tx.amount || 0)
                        )}
                      </p>

                    </div>
                  );
                })}

              </div>
            )}

          </div>

        </section>
      </div>

      {/* ========================================================
          PROMOTIONAL CAROUSEL
      ======================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="relative min-h-[230px] overflow-hidden">

          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50" />

          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-primary-600/5" />

          <div className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-primary-100/40 blur-3xl" />

          <div className="relative grid min-h-[230px] grid-cols-1 lg:grid-cols-2">

            {/* Text */}

            <div className="flex flex-col justify-center p-6 sm:p-8">

              <div className="flex items-center gap-2">

                <span className="rounded-full bg-primary-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-primary-700">
                  {promotions[activePromo].eyebrow}
                </span>

                <Sparkles className="h-3.5 w-3.5 text-primary-500" />

              </div>

              <h2 className="mt-3 max-w-md text-2xl font-bold tracking-tight text-gray-900">
                {promotions[activePromo].title}
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">
                {promotions[activePromo].description}
              </p>

              <button
                onClick={() =>
                  navigate(
                    promotions[activePromo].path
                  )
                }
                className="mt-5 flex w-fit items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                {promotions[activePromo].button}

                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

            {/* Artwork */}

            <div className="relative hidden items-center justify-center lg:flex">

              {promotions[activePromo].type === 'mobile' && (
                <div className="relative h-48 w-64">

                  <div className="absolute left-20 top-1 h-48 w-24 rotate-6 rounded-[20px] border-4 border-gray-900 bg-gray-950 p-1.5 shadow-2xl">

                    <div className="relative h-full overflow-hidden rounded-[14px] bg-white">

                      <div className="absolute left-1/2 top-1.5 h-1.5 w-8 -translate-x-1/2 rounded-full bg-gray-900" />

                      <div className="px-2.5 pt-7">

                        <div className="h-1.5 w-10 rounded-full bg-gray-200" />

                        <div className="mt-2 h-7 rounded-lg bg-primary-100" />

                        <div className="mt-3 grid grid-cols-2 gap-1.5">

                          <div className="h-10 rounded-md bg-emerald-50" />
                          <div className="h-10 rounded-md bg-blue-50" />
                          <div className="h-10 rounded-md bg-orange-50" />
                          <div className="h-10 rounded-md bg-purple-50" />

                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="absolute right-8 top-14 flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-primary-600 shadow-xl">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>

                </div>
              )}

              {promotions[activePromo].type === 'savings' && (
                <div className="relative h-48 w-64">

                  <div className="absolute left-8 top-8 h-32 w-48 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">

                    <PiggyBank className="h-7 w-7 text-emerald-600" />

                    <div className="mt-4 h-2 w-24 rounded-full bg-gray-200" />

                    <div className="mt-2 h-2 w-32 rounded-full bg-emerald-100" />

                    <div className="mt-2 h-2 w-20 rounded-full bg-gray-100" />

                  </div>

                  <div className="absolute right-2 top-2 flex h-20 w-20 rotate-6 items-center justify-center rounded-2xl bg-primary-600 shadow-xl">
                    <PiggyBank className="h-9 w-9 text-white" />
                  </div>

                  <div className="absolute bottom-4 right-16 h-8 w-8 rounded-full bg-amber-300 shadow-md" />

                  <div className="absolute bottom-1 right-7 h-6 w-6 rounded-full bg-amber-200 shadow-md" />

                </div>
              )}

              {promotions[activePromo].type === 'analytics' && (
                <div className="relative h-48 w-64">

                  <div className="absolute left-5 top-7 h-36 w-56 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">

                    <div className="flex items-center justify-between">

                      <BarChart3 className="h-6 w-6 text-primary-600" />

                      <div className="h-5 w-14 rounded-md bg-emerald-50" />

                    </div>

                    <div className="mt-6 flex h-20 items-end gap-2">

                      <div className="h-8 w-6 rounded-t bg-primary-100" />
                      <div className="h-12 w-6 rounded-t bg-primary-200" />
                      <div className="h-10 w-6 rounded-t bg-primary-300" />
                      <div className="h-16 w-6 rounded-t bg-primary-500" />
                      <div className="h-20 w-6 rounded-t bg-primary-600" />

                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Controls */}

          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 sm:right-6">

            {promotions.map((_, index) => (
              <button
                key={index}
                onClick={() => setActivePromo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activePromo
                    ? 'w-5 bg-primary-600'
                    : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Show promotion ${index + 1}`}
              />
            ))}

            <button
              onClick={previousPromo}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              aria-label="Previous promotion"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={nextPromo}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              aria-label="Next promotion"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

        </div>
      </section>

      {/* ========================================================
          FINANCIAL SNAPSHOT + SECURITY
      ======================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Financial snapshot */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Financial snapshot
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Based on your recent transactions
              </p>
            </div>

            <BarChart3 className="h-5 w-5 text-primary-600" />

          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-gray-100">

            <div className="pr-3">

              <p className="text-xs text-gray-500">
                Income
              </p>

              <p className="mt-1 text-sm font-bold tabular-nums text-emerald-600">
                {displayAmount(
                  financialSnapshot.income
                )}
              </p>

            </div>

            <div className="px-3">

              <p className="text-xs text-gray-500">
                Spending
              </p>

              <p className="mt-1 text-sm font-bold tabular-nums text-gray-900">
                {displayAmount(
                  financialSnapshot.spending
                )}
              </p>

            </div>

            <div className="pl-3">

              <p className="text-xs text-gray-500">
                Saved
              </p>

              <p className="mt-1 text-sm font-bold tabular-nums text-primary-600">
                {displayAmount(
                  financialSnapshot.saved
                )}
              </p>

            </div>

          </div>

          <div className="mt-6">

            <div className="mb-2 flex items-center justify-between">

              <p className="text-xs font-medium text-gray-600">
                Spending from recent income
              </p>

              <p className="text-xs font-semibold text-gray-900">
                {financialSnapshot.spendingPercentage}%
              </p>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">

              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-500"
                style={{
                  width: `${financialSnapshot.spendingPercentage}%`,
                }}
              />

            </div>

          </div>

          <button
            onClick={() => navigate('/analytics')}
            className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            View detailed analytics
            <ChevronRight className="h-4 w-4" />
          </button>

        </section>

        {/* Security */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="text-base font-semibold text-gray-900">
                Account security
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Keep your account protected
              </p>

            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>

          </div>

          <div className="mt-4 divide-y divide-gray-100">

            <div className="flex items-center gap-3 py-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                <LockKeyhole className="h-4 w-4 text-gray-600" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-sm font-medium text-gray-800">
                  Two-factor authentication
                </p>

                <p className="text-xs text-gray-500">
                  Add another layer of protection
                </p>

              </div>

              <button
                onClick={() => navigate('/profile')}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Manage
              </button>

            </div>

            <div className="flex items-center gap-3 py-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                <Phone className="h-4 w-4 text-gray-600" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-sm font-medium text-gray-800">
                  Contact information
                </p>

                <p className="text-xs text-gray-500">
                  Keep your account details up to date
                </p>

              </div>

              <button
                onClick={() => navigate('/profile')}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Review
              </button>

            </div>

          </div>

          <button
            onClick={() => navigate('/profile')}
            className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Security settings
            <ChevronRight className="h-4 w-4" />
          </button>

        </section>
      </div>

      {/* ========================================================
          DOWNLOAD OUR APP
      ======================================================== */}

      <section className="relative overflow-hidden rounded-xl bg-primary-700 text-white shadow-md">

        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[35px] border-white/5" />

        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Smartphone className="h-5 w-5" />
            </div>

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                Mobile banking
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Download our app
              </h2>

              <p className="mt-1 max-w-xl text-sm leading-5 text-primary-100">
                Bank wherever you are. Check your balance, transfer
                money and manage your accounts from your phone.
              </p>

            </div>
          </div>

          <button
            onClick={() => navigate('/download-app')}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-gray-50"
          >
            <Smartphone className="h-4 w-4" />
            Get the app
            <ChevronRight className="h-4 w-4" />
          </button>

        </div>
      </section>

      {/* ========================================================
          MORE SERVICES MODAL
      ======================================================== */}

      <Modal
        isOpen={servicesModalOpen}
        onClose={() => setServicesModalOpen(false)}
        title="More services"
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={true}
      >

        <div className="space-y-2">

          <p className="mb-4 text-sm text-gray-500">
            Explore more ways to manage your money.
          </p>

          {moreServices.map((service) => {

            const ServiceIcon = service.icon;

            return (
              <button
                key={service.label}
                onClick={() => {

                  setServicesModalOpen(false);

                  handleAction(
                    service.label,
                    service.path,
                    service.permissionKey
                  );

                }}
                className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-primary-200 hover:bg-primary-50/50"
              >

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600">
                  <ServiceIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-sm font-semibold text-gray-800">
                    {service.label}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {service.description}
                  </p>

                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500" />

              </button>
            );
          })}

        </div>
      </Modal>

      {/* ========================================================
          RESTRICTED ACTION MODAL
      ======================================================== */}

      <Modal
        isOpen={restrictedModalOpen}
        onClose={() => setRestrictedModalOpen(false)}
        title="Action not available"
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >

        <div className="flex flex-col items-center pt-1 text-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-50">
            <AlertCircle className="h-7 w-7 text-rose-500" />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {restrictedAction} isn’t available
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This feature isn’t included with your current account
            type. Contact your relationship manager if you’d like
            to upgrade.
          </p>

          <button
            onClick={() => setRestrictedModalOpen(false)}
            className="mt-5 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Got it
          </button>

        </div>
      </Modal>

    </div>
  );
};

export default Dashboard;