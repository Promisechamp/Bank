// Withdraw.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountsAPI, transactionsAPI, authAPI } from '../api';
import { formatCurrency, validateAmount } from '../utils/helpers';
import {
  ArrowUpCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wallet,
  Plus,
  ArrowRight,
} from 'lucide-react';
import OrderCard from './OrderCard';

const Withdraw = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newBalance, setNewBalance] = useState(null);

  // Internal transfer state
  const [sourceAccount, setSourceAccount] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');

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
        (acc) => acc.status === 'active'
      );
      setAccounts(activeAccounts);
      if (activeAccounts.length > 0) {
        setSourceAccount(activeAccounts[0].id);
        if (activeAccounts.length > 1) {
          setDestinationAccount(activeAccounts[1].id);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load account information');
    } finally {
      setFetching(false);
    }
  };

  const getAccountBalance = (id) => {
    const account = accounts.find((acc) => acc.id === id);
    return account ? Number(account.balance) : 0;
  };

  const getSourceBalance = () => {
    return getAccountBalance(sourceAccount);
  };

  /* =========================================================
     INTERNAL WITHDRAW
  ========================================================= */
  const handleWithdrawSubmit = async (e) => {
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
      setError(`Insufficient funds. Available balance: ${formatCurrency(balance)}`);
      return;
    }

    setLoading(true);
    try {
      const data = await transactionsAPI.transfer({
        fromAccountId: sourceAccount,
        toAccountId: destinationAccount,
        amount: amountNum,
        description: withdrawDescription || 'Internal account transfer',
      });
      setSuccess(`Transfer of ${formatCurrency(amountNum)} completed successfully.`);
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
     LOADING
  ========================================================= */
  if (fetching) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
          <p className="text-sm text-gray-500 mt-3">Loading your banking information...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="card text-center py-12 px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
            <Wallet className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-5">No Active Accounts</h3>
          <p className="text-sm text-gray-500 mt-2">
            You need an active account before you can use withdrawal services.
          </p>
          <button
            onClick={() => navigate('/accounts')}
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Account
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Withdraw Funds</h1>
          <p className="text-gray-500 mt-1">
            Move funds between your accounts or order your debit card.
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
            <p className="font-semibold text-green-900">Transaction completed</p>
            <p className="text-sm text-green-700 mt-0.5">{success}</p>
            {newBalance !== null && (
              <p className="text-xs text-green-600 mt-1">New balance: {formatCurrency(newBalance)}</p>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Transfer Between Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Move available funds from one of your accounts to another.
            </p>
          </div>
        </div>

        {accounts.length < 2 ? (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-yellow-900">A second account is required</p>
              <p className="text-sm text-yellow-700 mt-1">
                Create another account to enable internal transfers.
              </p>
            </div>
            <button
              onClick={() => navigate('/accounts')}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Create Account
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdrawSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From account</label>
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="input-field"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type} — {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Available: {formatCurrency(getSourceBalance())}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To account</label>
                <select
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  className="input-field"
                  required
                >
                  {accounts
                    .filter((acc) => acc.id !== sourceAccount)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_type} — {formatCurrency(acc.balance)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input-field pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="font-normal text-gray-400 ml-1">Optional</span>
              </label>
              <input
                type="text"
                value={withdrawDescription}
                onChange={(e) => setWithdrawDescription(e.target.value)}
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {loading ? 'Processing...' : 'Transfer Funds'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* =====================================================
          ORDER CARD (now pulled out)
      ===================================================== */}
      <OrderCard />
    </div>
  );
};

export default Withdraw;