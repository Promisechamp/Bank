import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI } from '../api';
import {
  formatCurrency,
  formatAccountNumber,
  getAccountTypeColor,
  getStatusColor,
} from '../utils/helpers';
import {
  Wallet,
  Plus,
  Eye,
  EyeOff,
  Copy,
  XCircle,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Building2,
  Phone,
  ChevronRight,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Modal from './Modal';
import { toast } from 'sonner';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');

  // Track which account numbers are currently revealed
  const [revealedAccounts, setRevealedAccounts] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await accountsAPI.getAll();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);

      setError(
        error?.error ||
          error?.message ||
          'Unable to load your accounts.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * Account number helpers
   * ------------------------------------------------------------
   */

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return '••••';

    const value = String(accountNumber);

    if (value.length <= 4) {
      return `•••• ${value}`;
    }

    return `•••• ${value.slice(-4)}`;
  };

  const toggleAccountNumber = (accountId) => {
    setRevealedAccounts((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const copyAccountNumber = async (accountNumber) => {
    if (!accountNumber) {
      toast.error('Account number is unavailable.');
      return;
    }

    const value = String(accountNumber);

    try {
      /*
       * Modern clipboard API
       */
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(value);

        toast.success('Account number copied.');
        return;
      }

      /*
       * Fallback for localhost / older browsers
       */
      const textArea =
        document.createElement('textarea');

      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      const successful =
        document.execCommand('copy');

      document.body.removeChild(textArea);

      if (!successful) {
        throw new Error('Copy command failed');
      }

      toast.success('Account number copied.');
    } catch (error) {
      console.error(
        'Failed to copy account number:',
        error
      );

      toast.error(
        'Unable to copy account number. Please try again.'
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * Account creation
   * ------------------------------------------------------------
   */

  const handleCreateAccountClick = () => {
    setShowCreateModal(true);
  };

  /*
   * ------------------------------------------------------------
   * Close account
   * ------------------------------------------------------------
   */

  const handleCloseAccountClick = (account) => {
    setSelectedAccount(account);
    setShowCloseModal(true);
  };

  const handleCloseAccount = async () => {
    if (!selectedAccount) return;

    const accountId = selectedAccount.id;

    try {
      setClosing(true);
      setError('');

      await accountsAPI.close(accountId);

      setShowCloseModal(false);
      setSelectedAccount(null);

      // Remove reveal state for the closed account
      setRevealedAccounts((prev) => {
        const next = { ...prev };
        delete next[accountId];
        return next;
      });

      toast.success('Account closed successfully.');

      await fetchAccounts();
    } catch (error) {
      console.error(
        'Error closing account:',
        error
      );

      setError(
        error?.error ||
          error?.message ||
          'Failed to close account.'
      );

      setShowCloseModal(false);
      setSelectedAccount(null);
    } finally {
      setClosing(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * Loading
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>

        <p className="text-sm text-slate-500">
          Loading your accounts…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="mb-1 text-sm font-medium text-primary-600">
            Banking
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Your accounts
          </h1>

          <p className="mt-1 text-slate-500">
            Manage your accounts and view your available balances.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateAccountClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-200 transition-all hover:bg-primary-700 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New account
        </button>

      </div>

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-900">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-rose-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto text-xs font-medium text-rose-600 hover:text-rose-800"
          >
            Dismiss
          </button>

        </div>
      )}

      {/* =====================================================
          ACCOUNT SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* Total */}

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total accounts
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {accounts.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Wallet className="h-5 w-5 text-primary-600" />
            </div>

          </div>
        </div>

        {/* Active */}

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Active accounts
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {
                  accounts.filter(
                    (account) =>
                      account.status === 'active'
                  ).length
                }
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

          </div>
        </div>

        {/* Combined balance */}

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Combined balance
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(
                  accounts.reduce(
                    (total, account) =>
                      total +
                      Number(account.balance || 0),
                    0
                  )
                )}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>

          </div>
        </div>

      </div>

      {/* =====================================================
          ACCOUNTS
      ====================================================== */}

      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Your accounts
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              View balances and account details.
            </p>
          </div>

          {accounts.length > 0 && (
            <span className="hidden items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
              {accounts.length} account
              {accounts.length !== 1 ? 's' : ''}
            </span>
          )}

        </div>

        {accounts.length === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================== */

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Wallet className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              No accounts yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              You currently don't have any active accounts.
              Contact your account manager or visit one of our
              branches for assistance.
            </p>

            <button
              type="button"
              onClick={handleCreateAccountClick}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Open an account
            </button>

          </div>

        ) : (

          /* =================================================
             ACCOUNT GRID
          ================================================== */

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {accounts.map((account) => {

              const isRevealed =
                Boolean(
                  revealedAccounts[account.id]
                );

              return (
                <div
                  key={account.id}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >

                  {/* Account Header */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                        <Wallet className="h-5 w-5 text-primary-600" />
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold capitalize text-slate-900">
                          {account.account_type} account
                        </p>

                        {/* Account number */}

                        <div className="mt-1 flex min-w-0 items-center gap-1">

                          <p
                            className={`min-w-0 truncate text-xs font-mono tracking-wide ${
                              isRevealed
                                ? 'text-slate-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {isRevealed
                              ? String(
                                  account.account_number || ''
                                )
                              : maskAccountNumber(
                                  account.account_number
                                )}
                          </p>

                          {/* Reveal / hide */}

                          <button
                            type="button"
                            onClick={() =>
                              toggleAccountNumber(
                                account.id
                              )
                            }
                            disabled={
                              !account.account_number
                            }
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={
                              isRevealed
                                ? 'Hide account number'
                                : 'Reveal account number'
                            }
                            title={
                              isRevealed
                                ? 'Hide account number'
                                : 'Reveal account number'
                            }
                          >
                            {isRevealed ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>

                          {/* Copy */}

                          <button
                            type="button"
                            onClick={() =>
                              copyAccountNumber(
                                account.account_number
                              )
                            }
                            disabled={
                              !account.account_number
                            }
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Copy account number"
                            title="Copy account number"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                        </div>

                      </div>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getAccountTypeColor(
                        account.account_type
                      )}`}
                    >
                      {account.account_type}
                    </span>

                  </div>

                  {/* Balance */}

                  <div className="mt-7">

                    <p className="text-xs font-medium text-slate-400">
                      Available balance
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                      {formatCurrency(
                        account.balance
                      )}
                    </p>

                  </div>

                  {/* Footer */}

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusColor(
                        account.status
                      )}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {account.status}
                    </span>

                    <div className="flex items-center gap-1">

                      {account.status === 'active' &&
                        Number(account.balance) === 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCloseAccountClick(
                                account
                              )
                            }
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Close account"
                            title="Close account"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          ACCOUNT HELP
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 sm:p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Info className="h-5 w-5 text-slate-500" />
          </div>

          <div className="flex-1">

            <h3 className="text-sm font-semibold text-slate-900">
              Need help with your account?
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              For account changes, additional account types, or
              other banking assistance, please contact your account
              manager or visit one of our branches.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Contact support
            <ChevronRight className="h-4 w-4" />
          </button>

        </div>

      </section>

      {/* =====================================================
          CREATE ACCOUNT RESTRICTION MODAL
      ====================================================== */}

      <Modal
        isOpen={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
        title="New account"
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >

        <div className="flex flex-col items-center text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>

          <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
            Account creation unavailable
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Account creation is currently disabled for your
            account type. Please visit any of our branches or
            contact your account manager for assistance.
          </p>

          <div className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Visit a branch
                </p>

                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  Our banking team can help you open an additional
                  account and explain the available account options.
                </p>
              </div>

            </div>

            <div className="mt-4 flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <Phone className="h-4 w-4 text-slate-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Contact your account manager
                </p>

                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  Your account manager can review your account and
                  assist with the next steps.
                </p>
              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowCreateModal(false)
            }
            className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            Understood
          </button>

        </div>

      </Modal>

      {/* =====================================================
          CLOSE ACCOUNT CONFIRMATION MODAL
      ====================================================== */}

      <Modal
        isOpen={showCloseModal}
        onClose={() => {
          if (!closing) {
            setShowCloseModal(false);
            setSelectedAccount(null);
          }
        }}
        title="Close account"
        size="sm"
        position="bottom"
        showCloseButton={!closing}
        closeOnOutsideClick={false}
      >

        <div className="flex flex-col items-center text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
            <XCircle className="h-8 w-8 text-rose-600" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            Close this account?
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            You're about to close your{' '}
            <span className="font-medium text-slate-700">
              {selectedAccount?.account_type}
            </span>{' '}
            account. This action should only be performed if
            you're sure you no longer need this account.
          </p>

          {selectedAccount && (
            <div className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <div className="text-left">

                  <p className="text-sm font-semibold capitalize text-slate-900">
                    {selectedAccount.account_type} account
                  </p>

                  <p className="mt-0.5 text-xs font-mono text-slate-500">
                    {formatAccountNumber(
                      selectedAccount.account_number
                    )}
                  </p>

                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(
                    selectedAccount.balance
                  )}
                </p>

              </div>

            </div>
          )}

          <div className="mt-6 flex w-full gap-3">

            <button
              type="button"
              disabled={closing}
              onClick={() => {
                setShowCloseModal(false);
                setSelectedAccount(null);
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={closing}
              onClick={handleCloseAccount}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
            >

              {closing && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {closing
                ? 'Closing…'
                : 'Close account'}

            </button>

          </div>

        </div>

      </Modal>

    </div>
  );
};

export default Accounts;