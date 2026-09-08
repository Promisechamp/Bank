import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { transactionsAPI } from '../../api';
import {
  AlertCircle,
  ArrowDownLeft,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  User,
  Wallet,
  X
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import Modal from '../Modal';

const getInitialForm = (selectedAccountId = '') => ({
  account_id: selectedAccountId || '',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  sendAlert: true,
  senderName: '',
  senderBank: '',
  senderAccountNo: ''
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

const CreditModal = ({
  isOpen,
  onClose,
  user,
  accounts = [],
  selectedAccountId,
  onSuccess,
  title = 'Credit Account',
  subtitle = 'Add funds to account'
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
  const hasAmount = Number.isFinite(amountNumber) && amountNumber > 0;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (error) setError('');
  };

  const validate = () => {
    if (!formData.account_id) {
      return 'Please select an account.';
    }

    if (!hasAmount) {
      return 'Please enter a valid positive amount.';
    }

    if (!formData.description.trim()) {
      return 'Please enter a description.';
    }

    if (!formData.senderName.trim()) {
      return 'Please enter the sender name.';
    }

    if (!formData.senderBank.trim()) {
      return 'Please enter the sender bank.';
    }

    if (!formData.senderAccountNo.trim()) {
      return 'Please enter the sender account number.';
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
      await transactionsAPI.adminCredit({
        userId: user.id,
        accountId: formData.account_id,
        amount: amountNumber,
        description: formData.description.trim(),
        date: formData.date,
        sendAlert: formData.sendAlert,
        senderName: formData.senderName.trim(),
        senderBank: formData.senderBank.trim(),
        senderAccountNo: formData.senderAccountNo.trim()
      });

      toast.success(
        `Credited ${formatCurrency(amountNumber)} to ${user.full_name}`
      );

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
      setFormData(getInitialForm(selectedAccountId));
    } catch (err) {
      setError(
        err?.error ||
          err?.message ||
          'Failed to credit account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setError('');
    setFormData(getInitialForm(selectedAccountId));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={
        subtitle || `Add funds to ${user?.full_name || 'user'}'s account`
      }
      size="md"
      position="bottom"
      showCloseButton={!loading}
      closeOnOutsideClick={!loading}
    >
      <form onSubmit={handleSubmit} className="min-w-0">
        {/* User summary */}
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
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
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

          <div className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex min-w-0 items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">
                Unable to complete credit
              </p>
              <p className="mt-0.5 break-words text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Account */}
          <section>
            <FieldLabel required>Destination Account</FieldLabel>

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
                <option value="">Choose an account...</option>

                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_type} — {account.account_number} — Balance:{' '}
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
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
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
                    Current balance
                  </span>
                </div>

                <span className="shrink-0 text-sm font-bold text-gray-900">
                  {formatCurrency(selectedAccount.balance)}
                </span>
              </div>
            )}
          </section>

          {/* Amount */}
          <section>
            <FieldLabel required>Credit Amount</FieldLabel>

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
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-8 pr-4 text-xl font-bold text-gray-900 placeholder:text-gray-300 outline-none transition-all focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
              />
            </div>

            {hasAmount && (
              <p className="mt-2 text-xs text-emerald-600">
                Account will receive{' '}
                <span className="font-semibold">
                  {formatCurrency(amountNumber)}
                </span>
              </p>
            )}
          </section>

          {/* Description */}
          <section>
            <FieldLabel required>Description</FieldLabel>

            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Salary payment"
              required
              disabled={loading}
              className={inputClass}
            />
          </section>

          {/* Sender */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <User className="h-4 w-4 text-blue-600" />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">
                  Sender Information
                </h3>
                <p className="text-[11px] text-gray-500">
                  Details shown with the incoming transaction
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <FieldLabel required>Sender Name</FieldLabel>
                <input
                  type="text"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>Sender Bank</FieldLabel>
                <input
                  type="text"
                  name="senderBank"
                  value={formData.senderBank}
                  onChange={handleChange}
                  placeholder="Bank of America"
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <div>
                <FieldLabel required>Sender Account Number</FieldLabel>
                <input
                  type="text"
                  name="senderAccountNo"
                  value={formData.senderAccountNo}
                  onChange={handleChange}
                  placeholder="1234567890"
                  required
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Date */}
          <section>
            <FieldLabel>Transaction Date</FieldLabel>

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

          {/* Notification */}
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
                Send a notification about this credit
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
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
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.75 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            <span>{loading ? 'Processing...' : 'Credit Account'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreditModal;