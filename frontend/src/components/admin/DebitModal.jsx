import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { transactionsAPI } from '../../api';
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  User,
  Wallet,
  CreditCard,
  Radio,
  X
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import Modal from '../Modal';

const getInitialForm = (selectedAccountId = '') => ({
  account_id: selectedAccountId || '',
  amount: '',
  description: '',
  note: '',
  date: new Date().toISOString().split('T')[0],
  sendAlert: true,

  // Receiver
  receiverName: '',
  receiverBank: '',
  receiverAccountNo: '',

  // Transaction metadata
  paymentMethod: '',
  channel: ''
});

const FieldLabel = ({ children, required = false }) => (
  <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500">
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.75 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10';

const iconInputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 py-2.75 pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10';

const DebitModal = ({
  isOpen,
  onClose,
  user,
  accounts = [],
  selectedAccountId,
  onSuccess,
  title = 'Debit Account',
  subtitle = 'Withdraw funds from account'
}) => {
  const [formData, setFormData] = useState(
    getInitialForm(selectedAccountId)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        account_id: selectedAccountId || prev.account_id || ''
      }));

      setError('');
    }
  }, [isOpen, selectedAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === formData.account_id),
    [accounts, formData.account_id]
  );

  const amountNumber = Number.parseFloat(formData.amount);
  const hasAmount =
    Number.isFinite(amountNumber) && amountNumber > 0;

  const availableBalance =
    Number(selectedAccount?.balance) || 0;

  const exceedsBalance =
    hasAmount && amountNumber > availableBalance;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) {
      setError('');
    }
  };

  const validate = () => {
    if (!formData.account_id) {
      return 'Please select an account.';
    }

    if (!hasAmount) {
      return 'Please enter a valid positive amount.';
    }

    if (exceedsBalance) {
      return 'The debit amount exceeds the available balance.';
    }

    if (!formData.description.trim()) {
      return 'Please enter a description.';
    }

    if (!formData.receiverName.trim()) {
      return 'Please enter the receiver name.';
    }

    if (!formData.receiverBank.trim()) {
      return 'Please enter the receiver bank.';
    }

    if (!formData.receiverAccountNo.trim()) {
      return 'Please enter the receiver account number.';
    }

    if (!formData.paymentMethod) {
      return 'Please select a payment method.';
    }

    if (!formData.channel) {
      return 'Please select a transaction channel.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.id) {
      setError('Unable to identify the selected user.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await transactionsAPI.adminDebit({
  userId: user.id,
  accountId: formData.account_id,
  amount: amountNumber,

  description: formData.description.trim(),
  note: formData.note.trim(),

  date: formData.date,
  sendAlert: formData.sendAlert,

  receiverName: formData.receiverName.trim(),
  receiverBank: formData.receiverBank.trim(),
  receiverAccountNo: formData.receiverAccountNo.trim(),

  metadata: {
    receiverName: formData.receiverName.trim(),
    receiverBank: formData.receiverBank.trim(),
    receiverAccountNo: formData.receiverAccountNo.trim(),
    paymentMethod: formData.paymentMethod,
    channel: formData.channel,
    description: formData.description.trim(),
    admin_note: formData.note.trim()
  }
});



      toast.success(
        `Debited ${formatCurrency(amountNumber)} from ${user.full_name}`
      );

      if (onSuccess) {
  try {
    await onSuccess();
  } catch (refreshError) {
    console.error(
      'Transaction succeeded, but refresh failed:',
      refreshError
    );
  }
}

onClose();

setFormData(getInitialForm(selectedAccountId));

      onClose();

      setFormData(
        getInitialForm(selectedAccountId)
      );
    } catch (err) {
      setError(
        err?.error ||
          err?.message ||
          'Failed to debit account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setError('');

    setFormData(
      getInitialForm(selectedAccountId)
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={
        subtitle ||
        `Withdraw funds from ${
          user?.full_name || 'user'
        }'s account`
      }
      size="md"
      position="bottom"
      showCloseButton={!loading}
      closeOnOutsideClick={!loading}
    >
      <form onSubmit={handleSubmit} className="min-w-0">

        {/* =====================================================
            USER SUMMARY
        ====================================================== */}

        <div className="mb-5 flex min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.full_name || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary-600">
                {user?.full_name
                  ?.charAt(0)
                  ?.toUpperCase() || 'U'}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user?.full_name || 'Selected user'}
            </p>

            <p className="truncate text-xs text-gray-500">
              {user?.email || 'No email available'}
            </p>
          </div>

          <div className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50">
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-5 flex min-w-0 items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">
                Unable to complete debit
              </p>

              <p className="mt-0.5 break-words text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">

          {/* =====================================================
              ACCOUNT
          ====================================================== */}

          <section>
            <FieldLabel required>
              Source Account
            </FieldLabel>

            <div className="relative">
              <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <select
                name="account_id"
                value={formData.account_id}
                onChange={handleChange}
                disabled={loading}
                className={`${iconInputClass} appearance-none pr-10`}
                required
              >
                <option value="">
                  Choose an account...
                </option>

                {accounts.map((account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.account_type} —{' '}
                    {account.account_number} — Balance:{' '}
                    {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08-1.06l4.25-4.51a.75.75 0 011.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {selectedAccount && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-gray-400" />

                  <span className="truncate text-xs text-gray-500">
                    Available balance
                  </span>
                </div>

                <span
                  className={`shrink-0 text-sm font-bold ${
                    exceedsBalance
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}
                >
                  {formatCurrency(availableBalance)}
                </span>
              </div>
            )}
          </section>

          {/* =====================================================
              AMOUNT
          ====================================================== */}

          <section>
            <FieldLabel required>
              Debit Amount
            </FieldLabel>

            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                $
              </span>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
                disabled={loading}
                className={`w-full rounded-xl border bg-gray-50 py-3.5 pl-8 pr-4 text-xl font-bold text-gray-900 placeholder:text-gray-300 outline-none transition-all focus:bg-white focus:ring-4 ${
                  exceedsBalance
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500/10'
                }`}
              />
            </div>

            {exceedsBalance ? (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                Amount exceeds the available balance.
              </div>
            ) : hasAmount ? (
              <p className="mt-2 text-xs text-red-600">
                Account will be debited{' '}
                <span className="font-semibold">
                  {formatCurrency(amountNumber)}
                </span>
              </p>
            ) : null}
          </section>

          {/* =====================================================
              DESCRIPTION
          ====================================================== */}

          <section>
            <FieldLabel required>
              Description
            </FieldLabel>

            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Bank transfer"
              required
              disabled={loading}
              className={inputClass}
            />
          </section>

          {/* =====================================================
              RECEIVER
          ====================================================== */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                <User className="h-4 w-4 text-red-600" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">
                  Receiver Information
                </h3>

                <p className="text-[11px] text-gray-500">
                  Details shown with the outgoing transaction
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4">

              <div>
                <FieldLabel required>
                  Receiver Name
                </FieldLabel>

                <input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>
                  Receiver Bank
                </FieldLabel>

                <input
                  type="text"
                  name="receiverBank"
                  value={formData.receiverBank}
                  onChange={handleChange}
                  placeholder="Wells Fargo"
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>
                  Receiver Account Number
                </FieldLabel>

                <input
                  type="text"
                  name="receiverAccountNo"
                  value={formData.receiverAccountNo}
                  onChange={handleChange}
                  placeholder="0987654321"
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* =====================================================
              PAYMENT METHOD + CHANNEL
          ====================================================== */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">

            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                <CreditCard className="h-4 w-4 text-indigo-600" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">
                  Payment Details
                </h3>

                <p className="text-[11px] text-gray-500">
                  Information recorded in the transaction metadata
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">

              {/* Payment Method */}
              <div>
                <FieldLabel required>
                  Payment Method
                </FieldLabel>

                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className={`${iconInputClass} appearance-none pr-10`}
                  >
                    <option value="">
                      Select method...
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="Card">
                      Card
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Direct Debit">
                      Direct Debit
                    </option>

                    <option value="Mobile Money">
                      Mobile Money
                    </option>

                    <option value="Internal Transfer">
                      Internal Transfer
                    </option>
                  </select>

                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08.02l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Channel */}
              <div>
                <FieldLabel required>
                  Channel
                </FieldLabel>

                <div className="relative">
                  <Radio className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    name="channel"
                    value={formData.channel}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className={`${iconInputClass} appearance-none pr-10`}
                  >
                    <option value="">
                      Select channel...
                    </option>

                    <option value="Online Banking">
                      Online Banking
                    </option>

                    <option value="Mobile App">
                      Mobile App
                    </option>

                    <option value="Branch">
                      Branch
                    </option>

                    <option value="ATM">
                      ATM
                    </option>

                    <option value="POS">
                      POS
                    </option>

                    <option value="USSD">
                      USSD
                    </option>

                    <option value="API">
                      API
                    </option>

                    <option value="Admin">
                      Admin
                    </option>
                  </select>

                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25-4.51a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* =====================================================
              NOTE
          ====================================================== */}

          <section>
            <FieldLabel>
              Internal / Transaction Note
            </FieldLabel>

            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
              placeholder="Optional reference, invoice number, or additional context..."
              disabled={loading}
              className={`${inputClass} resize-none`}
            />
          </section>

          {/* =====================================================
              DATE
          ====================================================== */}

          <section>
            <FieldLabel>
              Transaction Date
            </FieldLabel>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={loading}
                className={iconInputClass}
              />
            </div>
          </section>

          {/* =====================================================
              NOTIFICATION
          ====================================================== */}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 transition-colors hover:bg-gray-50">
            <input
              type="checkbox"
              name="sendAlert"
              checked={formData.sendAlert}
              onChange={handleChange}
              disabled={loading}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-gray-200">
              <Bell className="h-4 w-4 text-gray-500" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">
                Notify the user
              </p>

              <p className="text-[11px] text-gray-500">
                Send a notification about this debit
              </p>
            </div>
          </label>
        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.75 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || exceedsBalance}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.75 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            <span>
              {loading
                ? 'Processing...'
                : 'Debit Account'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DebitModal;