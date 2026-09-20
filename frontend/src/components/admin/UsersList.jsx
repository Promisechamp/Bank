import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, accountsAPI } from '../../api';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '../Modal';
import UpdateUserModal from './UpdateUserModal';
import CreditModal from './CreditModal';
import DebitModal from './DebitModal';

import {
  Users,
  Search,
  Eye,
  Edit2,
  Loader2,
  UserPlus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Mail,
  Lock,
  User,
  Phone,
  TrendingUp,
  TrendingDown,
  Wallet,
  LockKeyhole,
  UnlockKeyhole,
  Building2,
  UserCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  UserRound,
  Plus,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react';

import {
  formatDate,
  getStatusColor,
  formatCurrency,
} from '../../utils/helpers.js';

/* ============================================================
   SHARED VISUAL CONSTANTS
============================================================ */

const pageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

const cardClass =
  'bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_10px_rgba(15,23,42,0.03)]';

const iconBox =
  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0';

/* ============================================================
   AVATAR
============================================================ */

const UserAvatar = ({ user, size = 'md' }) => {
  const sizes = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div
      className={`${sizes[size]} rounded-xl overflow-hidden bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0`}
    >
      {user?.profile_image ? (
        <img
          src={user.profile_image}
          alt={user.full_name || 'User'}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-bold text-primary-600">
          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </span>
      )}
    </div>
  );
};

/* ============================================================
   STATUS PILL
============================================================ */

const StatusPill = ({ status, icon: Icon, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
      getStatusColor(status) ||
      'bg-slate-100 text-slate-600'
    }`}
  >
    {Icon && <Icon className="w-3 h-3" />}
    {label || status || 'Active'}
  </span>
);

/* ============================================================
   ACTION MENU
============================================================ */

const ActionMenu = ({ actions }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
        aria-label="Open actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden z-50 p-1.5"
          >
            {actions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setOpen(false);
                  action.onClick?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                  action.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {action.icon && (
                  <action.icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================================================
   STAT ITEM
============================================================ */

const SummaryStat = ({ icon: Icon, label, value, helper, tone }) => {
  const tones = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {helper && (
            <p className="mt-1 text-xs text-slate-500">
              {helper}
            </p>
          )}
        </div>

        <div className={`${iconBox} ${tones[tone] || tones.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ADD USER
============================================================ */

const AddUserContent = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    createAccount: false,
    account_type: 'checking',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  setError('');

  if (
    !formData.full_name?.trim() ||
    !formData.email?.trim() ||
    !formData.password
  ) {
    setError('Please complete all required fields.');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match.');
    return;
  }

  if (formData.password.length < 6) {
    setError('Password must be at least 6 characters.');
    return;
  }

  setLoading(true);

  try {
    const payload = {
      email: formData.email.trim(),
      password: formData.password,
      full_name: formData.full_name.trim(),
      phone: formData.phone?.trim() || '',
      create_account: formData.createAccount,
      account_type: formData.createAccount
        ? formData.account_type
        : undefined,
    };

    const response = await authAPI.register(payload);

    if (!response?.success) {
      throw new Error(
        response?.error ||
        response?.message ||
        'Failed to create user'
      );
    }

    // ---------------------------------------------
    // USER CREATION SUCCEEDED
    // ---------------------------------------------

    toast.success(
      formData.createAccount
        ? `${formData.full_name} was created with a ${formData.account_type} account.`
        : `${formData.full_name} was created successfully.`
    );

    // Close immediately after successful creation.
    onClose();

    // Reset the form if needed.
    setFormData(getInitialForm());

    // ---------------------------------------------
    // REFRESH PARENT DATA
    // Do NOT allow refresh failure to make the
    // successful creation look like a failure.
    // ---------------------------------------------

    if (onSuccess) {
      try {
        await onSuccess();
      } catch (refreshError) {
        console.error(
          'User created successfully, but list refresh failed:',
          refreshError
        );
      }
    }

  } catch (error) {
    console.error(
      'Create User Error:',
      error
    );

    setError(
      error?.error ||
      error?.message ||
      'Failed to create user'
    );
  } finally {
    setLoading(false);
  }
};
		
		
		
		
		

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-5">{error}</p>
        </div>
      )}

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <UserRound className="w-5 h-5 text-primary-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Customer information
            </p>
            <p className="text-xs text-slate-500">
              Create the customer's basic banking profile.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Full name"
          required
          icon={User}
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="John Doe"
        />

        <Field
          label="Email address"
          required
          icon={Mail}
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="john@example.com"
        />

        <Field
          label="Phone number"
          icon={Phone}
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+234..."
        />

        <Field
          label="Password"
          required
          icon={Lock}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
        />

        <Field
          label="Confirm password"
          required
          icon={Lock}
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
        />
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4">
          <p className="text-sm font-semibold text-slate-900">
            Initial account
          </p>

          <p className="text-xs text-slate-500 mt-1">
            You can create the customer's first bank account now or do it later.
          </p>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  createAccount: true,
                }))
              }
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.createAccount
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    formData.createAccount
                      ? 'border-primary-600'
                      : 'border-slate-300'
                  }`}
                >
                  {formData.createAccount && (
                    <div className="w-2 h-2 rounded-full bg-primary-600" />
                  )}
                </div>

                <span className="text-sm font-medium text-slate-800">
                  Create now
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  createAccount: false,
                }))
              }
              className={`p-3 rounded-xl border text-left transition-all ${
                !formData.createAccount
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    !formData.createAccount
                      ? 'border-primary-600'
                      : 'border-slate-300'
                  }`}
                >
                  {!formData.createAccount && (
                    <div className="w-2 h-2 rounded-full bg-primary-600" />
                  )}
                </div>

                <span className="text-sm font-medium text-slate-800">
                  Later
                </span>
              </div>
            </button>
          </div>

          {formData.createAccount && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Account type
              </label>

              <select
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="h-11 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}

          {loading ? 'Creating...' : 'Create customer'}
        </button>
      </div>
    </form>
  );
};

/* ============================================================
   FIELD
============================================================ */

const Field = ({
  label,
  required,
  icon: Icon,
  ...props
}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-2">
      {label}
      {required && (
        <span className="text-primary-600 ml-1">*</span>
      )}
    </label>

    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      )}

      <input
        {...props}
        className="w-full h-11 pl-10 pr-3 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all"
      />
    </div>
  </div>
);

/* ============================================================
   MAIN
============================================================ */

const UsersList = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] =
    useState(null);

  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [debitModalOpen, setDebitModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [usersRes, accountsRes] = await Promise.all([
        authAPI.getAllUsers(),
        accountsAPI.adminGetAll(),
      ]);

      setUsers(usersRes?.users || []);
      setAllAccounts(accountsRes?.accounts || []);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load customers.');
    } finally {
      setLoading(false);
    }
  };

  const getUserAccounts = (userId) =>
    allAccounts.filter(
      (account) => account.user_id === userId
    );

  const getAccountStatus = (userId) => {
    const accounts = getUserAccounts(userId);

    if (!accounts.length) {
      return {
        label: 'No accounts',
        className: 'bg-slate-100 text-slate-500',
        icon: Building2,
      };
    }

    if (
      accounts.some(
        (account) => account.status === 'banned'
      )
    ) {
      return {
        label: 'Banned',
        className: 'bg-red-50 text-red-600',
        icon: XCircle,
      };
    }

    if (
      accounts.some(
        (account) => account.status === 'frozen'
      )
    ) {
      return {
        label: 'Frozen',
        className: 'bg-blue-50 text-blue-600',
        icon: LockKeyhole,
      };
    }

    if (
      accounts.every(
        (account) => account.status === 'active'
      )
    ) {
      return {
        label: 'Active',
        className: 'bg-emerald-50 text-emerald-600',
        icon: CheckCircle2,
      };
    }

    return {
      label: 'Mixed',
      className: 'bg-amber-50 text-amber-600',
      icon: AlertCircle,
    };
  };

  const getFreezeAction = (userId) => {
    const accounts = getUserAccounts(userId);

    const frozen = accounts.some(
      (account) =>
        account.status === 'frozen' ||
        account.status === 'banned'
    );

    return frozen
      ? {
          label: 'Unfreeze all accounts',
          icon: UnlockKeyhole,
          status: 'active',
        }
      : {
          label: 'Freeze all accounts',
          icon: LockKeyhole,
          status: 'frozen',
        };
  };

  const fetchUserAccounts = async (userId) => {
    try {
      const response = await accountsAPI.adminGetAll();

      const accounts = (response?.accounts || []).filter(
        (account) => account.user_id === userId
      );

      setUserAccounts(accounts);
    } catch {
      setUserAccounts([]);
      toast.error('Unable to load user accounts.');
    }
  };

  const handleFreeze = (user) => {
    const accounts = getUserAccounts(user.id);
    const action = getFreezeAction(user.id);

    if (!accounts.length) {
      toast.info('This user has no accounts to update.');
      return;
    }

    const frozen = action.status === 'active';

    setModalType('confirm');

    setModalContent({
      title: action.label,
      message: `This will ${frozen ? 'unfreeze' : 'freeze'} all ${accounts.length} account${accounts.length > 1 ? 's' : ''} belonging to ${user.full_name}.`,
      type: frozen ? 'info' : 'warning',
      onConfirm: async () => {
        try {
          await Promise.all(
            accounts.map((account) =>
              accountsAPI.adminUpdateStatus(
                account.id,
                action.status
              )
            )
          );

          toast.success(
            frozen
              ? 'All accounts have been unfrozen.'
              : 'All accounts have been frozen.'
          );

          await fetchData();
          setModalOpen(false);
        } catch (error) {
          toast.error(
            error?.error ||
              'Unable to update the accounts.'
          );
        }
      },
    });

    setModalOpen(true);
  };

  const handleDelete = (user) => {
    setModalType('confirm');

    setModalContent({
      title: 'Delete customer',
      message: `Delete ${user.full_name}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await authAPI.deleteUser(user.id);

          toast.success('Customer deleted successfully.');

          setUsers((prev) =>
            prev.filter((item) => item.id !== user.id)
          );

          setModalOpen(false);

          await fetchData();
        } catch (error) {
          toast.error(
            error?.error ||
              'Unable to delete customer.'
          );
        }
      },
    });

    setModalOpen(true);
  };

  const showEdit = (user) => {
    setSelectedUserForEdit(user);
    setEditModalOpen(true);
  };

  const showCredit = async (user) => {
    setSelectedUser(user);
    await fetchUserAccounts(user.id);
    setCreditModalOpen(true);
  };

  const showDebit = async (user) => {
    setSelectedUser(user);
    await fetchUserAccounts(user.id);
    setDebitModalOpen(true);
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      return (
        user.full_name
          ?.toLowerCase()
          .includes(term) ||
        user.email
          ?.toLowerCase()
          .includes(term) ||
        user.phone
          ?.toLowerCase()
          .includes(term)
      );
    });
  }, [users, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage)
  );

  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const activeUsers = users.filter(
    (user) => user.status === 'active'
  ).length;

  const suspendedUsers = users.filter(
    (user) => user.status === 'suspended'
  ).length;

  const usersWithAccounts = users.filter(
    (user) => getUserAccounts(user.id).length > 0
  ).length;

  const openAddUser = () => {
    setModalType('add');
    setModalContent(null);
    setModalOpen(true);
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
          </div>

          <p className="text-sm font-medium text-slate-700">
            Loading customers
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Preparing your customer directory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        {...pageMotion}
        className="space-y-6 pb-8"
      >
        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 mb-2">
              <Users className="w-4 h-4" />
              CUSTOMER MANAGEMENT
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Customers
            </h1>

            <p className="text-sm text-slate-500 mt-1.5">
              Manage customer profiles, accounts and banking activity.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddUser}
            className="h-11 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            Add customer
          </button>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <SummaryStat
            icon={Users}
            label="Total customers"
            value={users.length}
            helper="Registered customers"
            tone="blue"
          />

          <SummaryStat
            icon={UserCheck}
            label="Active"
            value={activeUsers}
            helper="Currently active"
            tone="green"
          />

          <SummaryStat
            icon={Wallet}
            label="With accounts"
            value={usersWithAccounts}
            helper="At least one account"
            tone="blue"
          />

          <SummaryStat
            icon={AlertCircle}
            label="Suspended"
            value={suspendedUsers}
            helper="Require attention"
            tone="amber"
          />
        </div>

        {/* SEARCH */}

        <div className={`${cardClass} p-3 sm:p-4`}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, email or phone..."
                className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300 transition-all"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          {search && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                {filteredUsers.length} result
                {filteredUsers.length !== 1 ? 's' : ''}
              </span>

              <button
                type="button"
                onClick={() => setSearch('')}
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* MOBILE LIST */}

        <div className="md:hidden space-y-3">
          {currentUsers.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            currentUsers.map((user, index) => {
              const accountStatus = getAccountStatus(user.id);
              const freezeAction = getFreezeAction(user.id);

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.04,
                  }}
                  className={`${cardClass} p-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={user} />

                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {user.full_name}
                        </p>

                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <ActionMenu
                      actions={[
                        {
                          label: 'View customer',
                          icon: Eye,
                          onClick: () =>
                            navigate(
                              `/admin/users/${user.id}`
                            ),
                        },
                        {
                          label: 'Edit customer',
                          icon: Edit2,
                          onClick: () =>
                            showEdit(user),
                        },
                        {
                          label: 'Credit account',
                          icon: TrendingUp,
                          onClick: () =>
                            showCredit(user),
                        },
                        {
                          label: 'Debit account',
                          icon: TrendingDown,
                          onClick: () =>
                            showDebit(user),
                        },
                        {
                          label: freezeAction.label,
                          icon: freezeAction.icon,
                          onClick: () =>
                            handleFreeze(user),
                        },
                        {
                          label: 'Delete customer',
                          icon: Trash2,
                          danger: true,
                          onClick: () =>
                            handleDelete(user),
                        },
                      ]}
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <StatusPill
                      status={
                        accountStatus.label === 'Active'
                          ? 'active'
                          : accountStatus.label === 'Frozen'
                          ? 'frozen'
                          : accountStatus.label === 'Banned'
                          ? 'banned'
                          : 'pending'
                      }
                      icon={accountStatus.icon}
                      label={accountStatus.label}
                    />

                    <span className="text-[11px] text-slate-400">
                      Joined {formatDate(user.created_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE */}

        <div className={`hidden md:block ${cardClass} overflow-visible`}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Customer directory
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                {filteredUsers.length} customer
                {filteredUsers.length !== 1 ? 's' : ''}
              </p>
            </div>

            {search && (
              <span className="text-xs text-slate-500">
                Searching for{' '}
                <span className="font-semibold text-slate-700">
                  “{search}”
                </span>
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Customer
                  </th>

                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Contact
                  </th>

                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Accounts
                  </th>

                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </th>

                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Joined
                  </th>

                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentUsers.map((user, index) => {
                  const accounts = getUserAccounts(user.id);
                  const accountStatus = getAccountStatus(
                    user.id
                  );
                  const freezeAction = getFreezeAction(
                    user.id
                  );

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: index * 0.025,
                      }}
                      className="group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/users/${user.id}`
                            )
                          }
                          className="flex items-center gap-3 text-left"
                        >
                          <UserAvatar
                            user={user}
                            size="sm"
                          />

                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                              {user.full_name}
                            </p>

                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Customer
                            </p>
                          </div>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {user.email}
                        </p>

                        {user.phone && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {user.phone}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {accounts.length}
                            </p>

                            <p className="text-[10px] text-slate-400">
                              account
                              {accounts.length !== 1
                                ? 's'
                                : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill
                          status={
                            accountStatus.label === 'Active'
                              ? 'active'
                              : accountStatus.label === 'Frozen'
                              ? 'frozen'
                              : accountStatus.label ===
                                'Banned'
                              ? 'banned'
                              : 'pending'
                          }
                          icon={accountStatus.icon}
                          label={accountStatus.label}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600">
                          {formatDate(user.created_at)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <ActionMenu
                            actions={[
                              {
                                label: 'View customer',
                                icon: Eye,
                                onClick: () =>
                                  navigate(
                                    `/admin/users/${user.id}`
                                  ),
                              },
                              {
                                label: 'Edit customer',
                                icon: Edit2,
                                onClick: () =>
                                  showEdit(user),
                              },
                              {
                                label: 'Credit account',
                                icon: TrendingUp,
                                onClick: () =>
                                  showCredit(user),
                              },
                              {
                                label: 'Debit account',
                                icon: TrendingDown,
                                onClick: () =>
                                  showDebit(user),
                              },
                              {
                                label: freezeAction.label,
                                icon: freezeAction.icon,
                                onClick: () =>
                                  handleFreeze(user),
                              },
                              {
                                label: 'Delete customer',
                                icon: Trash2,
                                danger: true,
                                onClick: () =>
                                  handleDelete(user),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {currentUsers.length === 0 && (
              <EmptyState search={search} />
            )}
          </div>
        </div>

        {/* PAGINATION */}

        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {(currentPage - 1) * usersPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(
                  currentPage * usersPerPage,
                  filteredUsers.length
                )}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">
                {filteredUsers.length}
              </span>{' '}
              customers
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(page)
                      }
                      className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ADD */}

      <Modal
        isOpen={
          modalOpen && modalType === 'add'
        }
        onClose={() => setModalOpen(false)}
        title="Add customer"
        subtitle="Create a new banking customer"
        size="md"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        <AddUserContent
          onClose={() => setModalOpen(false)}
          onSuccess={fetchData}
        />
      </Modal>

      {/* EDIT */}

      <UpdateUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        user={selectedUserForEdit}
        onSuccess={fetchData}
        isAdmin
      />

      {/* CREDIT */}

      <CreditModal
        isOpen={creditModalOpen}
        onClose={() => {
          setCreditModalOpen(false);
          setSelectedUser(null);
          setUserAccounts([]);
        }}
        user={selectedUser}
        accounts={userAccounts}
        selectedAccountId={
          userAccounts.length === 1
            ? userAccounts[0]?.id
            : ''
        }
        onSuccess={fetchData}
        title="Credit account"
        subtitle={`Add funds to ${
          selectedUser?.full_name || 'customer'
        }'s account`}
      />

      {/* DEBIT */}

      <DebitModal
        isOpen={debitModalOpen}
        onClose={() => {
          setDebitModalOpen(false);
          setSelectedUser(null);
          setUserAccounts([]);
        }}
        user={selectedUser}
        accounts={userAccounts}
        selectedAccountId={
          userAccounts.length === 1
            ? userAccounts[0]?.id
            : ''
        }
        onSuccess={fetchData}
        title="Debit account"
        subtitle={`Withdraw funds from ${
          selectedUser?.full_name || 'customer'
        }'s account`}
      />

      {/* CONFIRM */}

      <Modal
        isOpen={
          modalOpen && modalType === 'confirm'
        }
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
          }
        }}
        title={modalContent?.title || 'Confirm action'}
        size="sm"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        {modalContent && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  modalContent.type === 'danger'
                    ? 'bg-red-50 text-red-600'
                    : modalContent.type === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-primary-50 text-primary-600'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalContent.title}
                </h3>

                <p className="text-sm text-slate-500 mt-1 leading-6">
                  {modalContent.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                disabled={modalLoading}
                className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!modalContent?.onConfirm) return;

                  try {
                    setModalLoading(true);
                    await modalContent.onConfirm();
                  } finally {
                    setModalLoading(false);
                  }
                }}
                disabled={modalLoading}
                className={`h-10 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 ${
                  modalContent.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : modalContent.type === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {modalLoading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {modalLoading
                  ? 'Processing...'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

/* ============================================================
   EMPTY
============================================================ */

const EmptyState = ({ search }) => (
  <div className={`${cardClass} py-16 px-6 text-center`}>
    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
      {search ? (
        <Search className="w-6 h-6 text-slate-400" />
      ) : (
        <Users className="w-6 h-6 text-slate-400" />
      )}
    </div>

    <h3 className="text-sm font-bold text-slate-900">
      {search
        ? 'No customers found'
        : 'No customers yet'}
    </h3>

    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
      {search
        ? 'Try a different name, email address or phone number.'
        : 'Customers will appear here once they are created.'}
    </p>
  </div>
);

export default UsersList;