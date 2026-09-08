import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI, adminAPI } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import CreditModal from './CreditModal';
import DebitModal from './DebitModal';

import {
  Wallet,
  Search,
  Eye,
  Lock,
  Unlock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  User,
  MoreHorizontal,
  Trash2,
  Ban,
  RotateCcw,
  Plus,
  ChevronDown,
  UserPlus,
  Landmark,
  PiggyBank,
  ShieldCheck,
  ArrowUpRight,
  CircleDollarSign,
  Activity,
  Layers3,
} from 'lucide-react';

import {
  formatCurrency,
  getStatusColor,
} from '../../utils/helpers';

// ============================================================
// SMALL UI HELPERS
// ============================================================

const AccountTypeIcon = ({ type, className = 'h-5 w-5' }) => {
  return type === 'savings'
    ? <PiggyBank className={className} />
    : <Landmark className={className} />;
};

const getInitials = (name = '') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return initials || 'U';
};

const getAccountTypeLabel = (type) => {
  if (!type) return 'Account';

  return type.charAt(0).toUpperCase() + type.slice(1);
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconClass,
  iconBackground,
  description,
}) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          {description && (
            <p className="mt-1.5 text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${iconBackground} ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-slate-50 opacity-60 transition-transform duration-300 group-hover:scale-125" />
    </motion.div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AccountsList = () => {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 9;

  // Confirmation modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Credit / debit
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [selectedAccountForTransaction, setSelectedAccountForTransaction] =
    useState(null);

  // Create account
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    account_type: 'checking',
    user_id: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // User dropdown
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const dropdownRef = useRef(null);

  // Account action menu
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // ============================================================
  // FETCH
  // ============================================================

  useEffect(() => {
    fetchAccounts();
    fetchUsers();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      const data = await accountsAPI.adminGetAll();

      setAccounts(data.accounts || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load accounts');
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // ============================================================
  // GROUP ACCOUNTS BY USER
  // ============================================================

  const groupedUsers = useMemo(() => {
    const groups = new Map();

    accounts.forEach((account) => {
      const userId = account.user_id || 'unknown';

      if (!groups.has(userId)) {
        groups.set(userId, {
          user_id: userId,
          user: account.profiles || {
            full_name: 'Unknown User',
          },
          accounts: [],
        });
      }

      groups.get(userId).accounts.push(account);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,

      totalBalance: group.accounts.reduce(
        (sum, account) => sum + Number(account.balance || 0),
        0
      ),

      activeCount: group.accounts.filter(
        (account) => account.status === 'active'
      ).length,

      frozenCount: group.accounts.filter(
        (account) => account.status === 'frozen'
      ).length,

      bannedCount: group.accounts.filter(
        (account) => account.status === 'banned'
      ).length,
    }));
  }, [accounts]);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredUserGroups = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return groupedUsers;

    return groupedUsers.filter((group) => {
      const user = group.user || {};

      const userMatches =
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        group.user_id?.toLowerCase().includes(term);

      const accountMatches = group.accounts.some((account) =>
        account.account_number?.toLowerCase().includes(term) ||
        account.account_type?.toLowerCase().includes(term) ||
        account.status?.toLowerCase().includes(term)
      );

      return userMatches || accountMatches;
    });
  }, [groupedUsers, search]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const indexOfLastUser = currentPage * accountsPerPage;
  const indexOfFirstUser = indexOfLastUser - accountsPerPage;

  const currentUserGroups = filteredUserGroups.slice(
    indexOfFirstUser,
    indexOfLastUser
  );

  const totalPages = Math.ceil(
    filteredUserGroups.length / accountsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ============================================================
  // STATS
  // ============================================================

  const totalAccounts = accounts.length;

  const totalUsersWithAccounts = groupedUsers.length;

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );

  const activeAccounts = accounts.filter(
    (account) => account.status === 'active'
  ).length;

  const frozenAccounts = accounts.filter(
    (account) => account.status === 'frozen'
  ).length;

  const bannedAccounts = accounts.filter(
    (account) => account.status === 'banned'
  ).length;

  // ============================================================
  // CREATE ACCOUNT
  // ============================================================

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    setCreateError('');

    if (!createFormData.user_id) {
      setCreateError('Please select a user');
      return;
    }

    setCreateLoading(true);

    try {
      await accountsAPI.create({
        account_type: createFormData.account_type,
        user_id: createFormData.user_id,
      });

      toast.success('Account created successfully!');

      setShowCreateModal(false);

      setCreateFormData({
        account_type: 'checking',
        user_id: '',
      });

      setUserSearch('');

      await fetchAccounts();
    } catch (err) {
      const message =
        err?.error ||
        err?.message ||
        'Failed to create account';

      setCreateError(message);
      toast.error(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const selectUser = (userId) => {
    setCreateFormData((prev) => ({
      ...prev,
      user_id: userId,
    }));

    const selected = users.find(
      (user) => user.id === userId
    );

    setUserSearch(selected?.full_name || '');
    setIsUserDropdownOpen(false);
  };

  const clearUserSelection = () => {
    setCreateFormData((prev) => ({
      ...prev,
      user_id: '',
    }));

    setUserSearch('');
  };

  const getSelectedUser = () => {
    return users.find(
      (user) => user.id === createFormData.user_id
    );
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ============================================================
  // OUTSIDE CLICK
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setActionMenuOpen(null);
    };

    document.addEventListener(
      'click',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'click',
        handleClickOutside
      );
    };
  }, []);

  // ============================================================
  // TRANSACTION MODALS
  // ============================================================

  const openCreditModal = (account) => {
    setSelectedAccountForTransaction(account);
    setCreditModalOpen(true);
    setActionMenuOpen(null);
  };

  const openDebitModal = (account) => {
    setSelectedAccountForTransaction(account);
    setDebitModalOpen(true);
    setActionMenuOpen(null);
  };

  // ============================================================
  // STATUS TOGGLE
  // ============================================================

  const handleToggleLock = (account) => {
    const newStatus =
      account.status === 'active'
        ? 'frozen'
        : 'active';

    setSelectedAccount(account);

    setModalContent({
      title:
        newStatus === 'frozen'
          ? 'Freeze Account'
          : 'Unfreeze Account',

      message:
        `Are you sure you want to ${
          newStatus === 'frozen'
            ? 'freeze'
            : 'unfreeze'
        } account ${account.account_number}?`,

      type:
        newStatus === 'frozen'
          ? 'warning'
          : 'info',

      confirmText:
        newStatus === 'frozen'
          ? 'Freeze'
          : 'Unfreeze',

      onConfirm: async () => {
        try {
          setModalLoading(true);

          await accountsAPI.adminUpdateStatus(
            account.id,
            newStatus
          );

          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === account.id
                ? {
                    ...acc,
                    status: newStatus,
                  }
                : acc
            )
          );

          toast.success(
            `Account ${newStatus} successfully!`
          );

          setSuccess(
            `Account ${newStatus} successfully!`
          );
        } catch (err) {
          console.error(err);

          toast.error(
            'Failed to update account status'
          );

          setError(
            'Failed to update account status'
          );
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      },
    });

    setModalOpen(true);
  };

  // ============================================================
  // BAN
  // ============================================================

  const handleBanAccount = (account) => {
    const newStatus =
      account.status === 'banned'
        ? 'active'
        : 'banned';

    setSelectedAccount(account);

    setModalContent({
      title:
        newStatus === 'banned'
          ? 'Ban Account'
          : 'Unban Account',

      message:
        `Are you sure you want to ${
          newStatus === 'banned'
            ? 'ban'
            : 'unban'
        } account ${account.account_number}? ${
          newStatus === 'banned'
            ? 'This will prevent transactions.'
            : 'This will restore full access.'
        }`,

      type:
        newStatus === 'banned'
          ? 'danger'
          : 'info',

      confirmText:
        newStatus === 'banned'
          ? 'Ban'
          : 'Unban',

      onConfirm: async () => {
        try {
          setModalLoading(true);

          await accountsAPI.adminUpdateStatus(
            account.id,
            newStatus
          );

          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === account.id
                ? {
                    ...acc,
                    status: newStatus,
                  }
                : acc
            )
          );

          toast.success(
            `Account ${
              newStatus === 'banned'
                ? 'banned'
                : 'unbanned'
            } successfully!`
          );
        } catch (err) {
          setError(
            'Failed to update account status'
          );

          toast.error(
            'Failed to update account status'
          );
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      },
    });

    setModalOpen(true);
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDeleteAccount = (account) => {
    setSelectedAccount(account);

    setModalContent({
      title: 'Delete Account',

      message:
        `Are you sure you want to delete account ${account.account_number}? This will permanently delete the account and all associated transactions. The user will not be affected.`,

      type: 'danger',

      confirmText: 'Delete',

      onConfirm: async () => {
        try {
          setModalLoading(true);

          await accountsAPI.adminDelete(
            account.id
          );

          setAccounts((prev) =>
            prev.filter(
              (acc) => acc.id !== account.id
            )
          );

          toast.success(
            'Account deleted successfully!'
          );
        } catch (err) {
          setError(
            'Failed to delete account'
          );

          toast.error(
            'Failed to delete account'
          );
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      },
    });

    setModalOpen(true);
  };

  // ============================================================
  // MODAL
  // ============================================================

  const handleModalClose = () => {
    if (!modalLoading) {
      setModalOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!modalContent) return;

    try {
      setModalLoading(true);
      await modalContent.onConfirm();
    } finally {
      setModalLoading(false);
    }
  };

  // ============================================================
  // COPY
  // ============================================================

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Account number copied!');
    } catch {
      toast.error('Failed to copy account number');
    }
  };

  // ============================================================
  // ACTION MENU
  // ============================================================

  const toggleActionMenu = (e, accountId) => {
    e.stopPropagation();

    setActionMenuOpen((current) =>
      current === accountId
        ? null
        : accountId
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center p-3">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            </div>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading accounts
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Preparing your account overview...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-8 p-3"
    >
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_8px_35px_rgba(15,23,42,0.045)] sm:px-7">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Layers3 className="h-4 w-4" />
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-600">
                Account management
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Accounts
              </h1>

              <span className="rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                {totalUsersWithAccounts} owners
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage customer accounts, balances, access status,
              and account-level transactions from one place.
            </p>
          </div>

          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary-700 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            Create account
          </button>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-50/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-44 w-44 rounded-full bg-blue-50/60 blur-3xl" />
      </div>

      {/* ======================================================
          ALERTS
      ====================================================== */}

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

              <span className="flex-1 text-sm font-medium">
                {error}
              </span>

              <button
                onClick={() => setError('')}
                className="rounded-lg p-1 text-red-400 transition-colors hover:bg-white hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-emerald-700">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

              <span className="flex-1 text-sm font-medium">
                {success}
              </span>

              <button
                onClick={() => setSuccess('')}
                className="rounded-lg p-1 text-emerald-400 transition-colors hover:bg-white hover:text-emerald-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Accounts"
          value={totalAccounts}
          description={`${totalUsersWithAccounts} account owners`}
          icon={Building}
          iconClass="text-blue-600"
          iconBackground="bg-blue-50"
        />

        <StatCard
          label="Total balance"
          value={formatCurrency(totalBalance)}
          description="Across all accounts"
          icon={CircleDollarSign}
          iconClass="text-primary-600"
          iconBackground="bg-primary-50"
        />

        <StatCard
          label="Active"
          value={activeAccounts}
          description={
            totalAccounts
              ? `${Math.round((activeAccounts / totalAccounts) * 100)}% of accounts`
              : 'No accounts'
          }
          icon={Activity}
          iconClass="text-emerald-600"
          iconBackground="bg-emerald-50"
        />

        <StatCard
          label="Restricted"
          value={frozenAccounts + bannedAccounts}
          description={`${frozenAccounts} frozen · ${bannedAccounts} banned`}
          icon={ShieldCheck}
          iconClass="text-amber-600"
          iconBackground="bg-amber-50"
        />
      </div>

      {/* ======================================================
          SEARCH / TOOLBAR
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search accounts, customers, email or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
            />

            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {activeAccounts} active
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <span className="text-xs font-semibold text-slate-400">
              {filteredUserGroups.length} owner
              {filteredUserGroups.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {currentUserGroups.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-[0_4px_20px_rgba(15,23,42,0.025)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <Wallet className="h-7 w-7 text-slate-300" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-slate-900">
            No accounts found
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            We couldn't find any account owners matching your
            search. Try a different name, email, account number,
            or status.
          </p>

          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              <X className="h-4 w-4" />
              Clear search
            </button>
          )}
        </div>
      ) : (
        /* ======================================================
           USER GROUPS
        ====================================================== */

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {currentUserGroups.map((group, index) => {
            const user = group.user || {};
            const initials = getInitials(user.full_name);

            return (
              <motion.div
                key={group.user_id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.045,
                  duration: 0.3,
                }}
                className="group overflow-visible rounded-[24px] border border-slate-200/80 bg-white shadow-[0_6px_25px_rgba(15,23,42,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_35px_rgba(15,23,42,0.07)]"
              >
                {/* USER HEADER */}

                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-sm font-extrabold text-primary-700 ring-4 ring-primary-50/60">
                        {initials}

                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate text-[15px] font-bold text-slate-950">
                            {user.full_name || 'Unknown User'}
                          </h2>

                          <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                        </div>

                        {user.email && (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        navigate(
                          `/admin/users/${group.user_id}`
                        )
                      }
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                      title="View customer"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* USER METRICS */}

                  <div className="mt-6 grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60">
                    <div className="px-3 py-3.5 text-center sm:px-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Accounts
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {group.accounts.length}
                      </p>
                    </div>

                    <div className="min-w-0 px-3 py-3.5 text-center sm:px-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Balance
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-950">
                        {formatCurrency(group.totalBalance)}
                      </p>
                    </div>

                    <div className="px-3 py-3.5 text-center sm:px-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Active
                      </p>

                      <p className="mt-1 text-lg font-bold text-emerald-600">
                        {group.activeCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACCOUNT SECTION */}

                <div className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-5">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                        <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                      </div>

                      <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500">
                        Accounts
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400">
                      {group.accounts.length} total
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {group.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="relative rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-[0_5px_18px_rgba(15,23,42,0.045)]"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                                  account.account_type === 'checking'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                <AccountTypeIcon
                                  type={account.account_type}
                                  className="h-[18px] w-[18px]"
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    {getAccountTypeLabel(
                                      account.account_type
                                    )}
                                  </span>

                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getStatusColor(
                                      account.status
                                    )}`}
                                  >
                                    {account.status}
                                  </span>
                                </div>

                                <div className="mt-1 flex items-center gap-1">
                                  <span className="font-mono text-[11px] tracking-wider text-slate-400">
                                    {account.account_number}
                                  </span>

                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        account.account_number
                                      )
                                    }
                                    className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                    title="Copy account number"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* MENU */}

                            <div className="relative flex-shrink-0">
                              <button
                                onClick={(e) =>
                                  toggleActionMenu(
                                    e,
                                    account.id
                                  )
                                }
                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                  actionMenuOpen === account.id
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                                aria-label="Account actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              <AnimatePresence>
                                {actionMenuOpen === account.id && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      scale: 0.96,
                                      y: -4,
                                    }}
                                    animate={{
                                      opacity: 1,
                                      scale: 1,
                                      y: 0,
                                    }}
                                    exit={{
                                      opacity: 0,
                                      scale: 0.96,
                                      y: -4,
                                    }}
                                    transition={{
                                      duration: 0.12,
                                    }}
                                    onClick={(e) =>
                                      e.stopPropagation()
                                    }
                                    className="absolute right-0 top-10 z-[70] w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
                                  >
                                    <button
                                      onClick={() => {
                                        setActionMenuOpen(null);
                                        navigate(
                                          `/admin/accounts/${account.id}`
                                        );
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                      <Eye className="h-4 w-4 text-slate-400" />
                                      View details
                                    </button>

                                    <button
                                      onClick={() =>
                                        openCreditModal(account)
                                      }
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-emerald-50"
                                    >
                                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                                      Credit account
                                    </button>

                                    <button
                                      onClick={() =>
                                        openDebitModal(account)
                                      }
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-red-50"
                                    >
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                      Debit account
                                    </button>

                                    <div className="my-1 border-t border-slate-100" />

                                    <button
                                      onClick={() => {
                                        setActionMenuOpen(null);
                                        handleToggleLock(account);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50"
                                    >
                                      {account.status === 'active' ? (
                                        <>
                                          <Lock className="h-4 w-4 text-amber-500" />
                                          Freeze account
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="h-4 w-4 text-emerald-500" />
                                          Unfreeze account
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActionMenuOpen(null);
                                        handleBanAccount(account);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-red-50"
                                    >
                                      {account.status === 'banned' ? (
                                        <>
                                          <RotateCcw className="h-4 w-4 text-emerald-500" />
                                          Unban account
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="h-4 w-4 text-red-500" />
                                          Ban account
                                        </>
                                      )}
                                    </button>

                                    <div className="my-1 border-t border-slate-100" />

                                    <button
                                      onClick={() => {
                                        setActionMenuOpen(null);
                                        handleDeleteAccount(account);
                                      }}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete account
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* BALANCE */}

                          <div className="mt-5 flex items-end justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Available balance
                              </p>

                              <p className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950">
                                {formatCurrency(account.balance)}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/accounts/${account.id}`
                                )
                              }
                              className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50"
                            >
                              Manage
                              <span className="ml-1">→</span>
                            </button>
                          </div>
                        </div>

                        {/* QUICK ACTIONS */}

                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Quick actions
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                openCreditModal(account)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50"
                              title="Credit"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() =>
                                openDebitModal(account)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                              title="Debit"
                            >
                              <TrendingDown className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleToggleLock(account)
                              }
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                account.status === 'active'
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={
                                account.status === 'active'
                                  ? 'Freeze'
                                  : 'Unfreeze'
                              }
                            >
                              {account.status === 'active' ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* USER FOOTER */}

                <div className="flex items-center justify-between gap-3 rounded-b-[24px] border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
                  <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />

                    <span className="truncate">
                      {group.accounts.length} account
                      {group.accounts.length !== 1 ? 's' : ''}{' '}
                      belonging to this customer
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/admin/users/${group.user_id}`
                      )
                    }
                    className="flex-shrink-0 text-xs font-bold text-primary-600 transition-colors hover:text-primary-700"
                  >
                    View customer
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {filteredUserGroups.length > accountsPerPage && (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-slate-500">
            Showing{' '}
            <span className="font-bold text-slate-700">
              {indexOfFirstUser + 1}
            </span>{' '}
           –{' '}
            <span className="font-bold text-slate-700">
              {Math.min(
                indexOfLastUser,
                filteredUserGroups.length
              )}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-700">
              {filteredUserGroups.length}
            </span>{' '}
            owners
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(1, prev - 1)
                )
              }
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((number) => (
              <button
                key={number}
                onClick={() =>
                  setCurrentPage(number)
                }
                className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs font-bold transition-all ${
                  currentPage === number
                    ? 'bg-primary-600 text-white shadow-[0_5px_14px_rgba(79,70,229,0.18)]'
                    : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1)
                )
              }
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          CREATE ACCOUNT MODAL
      ====================================================== */}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          if (!createLoading) {
            setShowCreateModal(false);
            setIsUserDropdownOpen(false);
            setUserSearch('');
          }
        }}
        title="Create account"
        subtitle="Assign a new banking account to a customer"
        size="md"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        <form
          onSubmit={handleCreateAccount}
          className="space-y-5"
        >
          {createError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

              <span className="text-sm font-medium">
                {createError}
              </span>
            </div>
          )}

          {/* ACCOUNT TYPE */}

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">
                Account type
              </label>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Required
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    account_type: 'checking',
                  }))
                }
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                  createFormData.account_type === 'checking'
                    ? 'border-primary-500 bg-primary-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                    createFormData.account_type === 'checking'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Landmark className="h-5 w-5" />
                </div>

                <p className="text-sm font-bold text-slate-900">
                  Checking
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Everyday spending and payments
                </p>

                {createFormData.account_type === 'checking' && (
                  <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-primary-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    account_type: 'savings',
                  }))
                }
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                  createFormData.account_type === 'savings'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                    createFormData.account_type === 'savings'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <PiggyBank className="h-5 w-5" />
                </div>

                <p className="text-sm font-bold text-slate-900">
                  Savings
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Designed for saving and growth
                </p>

                {createFormData.account_type === 'savings' && (
                  <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-emerald-600" />
                )}
              </button>
            </div>
          </div>

          {/* USER */}

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">
                Customer
              </label>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Required
              </span>
            </div>

            {users.length === 0 ? (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                  <User className="h-5 w-5" />
                </div>

                <p className="mt-2 text-sm font-bold text-amber-800">
                  No customers available
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    navigate('/admin/users');
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Create a customer first
                </button>
              </div>
            ) : (
              <div
                className="relative"
                ref={dropdownRef}
              >
                <button
                  type="button"
                  onClick={() =>
                    setIsUserDropdownOpen(
                      (prev) => !prev
                    )
                  }
                  className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-3.5 text-left transition-all ${
                    isUserDropdownOpen
                      ? 'border-primary-400 ring-4 ring-primary-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>

                    {createFormData.user_id &&
                    getSelectedUser() ? (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {getSelectedUser().full_name}
                        </p>

                        <p className="truncate text-[11px] text-slate-400">
                          {getSelectedUser().email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Select a customer...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {createFormData.user_id && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          clearUserSelection();
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </span>
                    )}

                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isUserDropdownOpen
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -4,
                        scale: 0.98,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: -4,
                        scale: 0.98,
                      }}
                      className="absolute left-0 right-0 top-14 z-[80] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
                    >
                      <div className="border-b border-slate-100 p-2.5">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                          <input
                            autoFocus
                            type="text"
                            placeholder="Search customers..."
                            value={userSearch}
                            onChange={(e) =>
                              setUserSearch(
                                e.target.value
                              )
                            }
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto p-1.5">
                        {filteredUsers.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <User className="mx-auto h-7 w-7 text-slate-300" />

                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              No customers found
                            </p>
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() =>
                                selectUser(user.id)
                              }
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                createFormData.user_id ===
                                user.id
                                  ? 'bg-primary-50'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                                {getInitials(
                                  user.full_name
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-slate-800">
                                  {user.full_name}
                                </p>

                                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                                  {user.email}
                                </p>
                              </div>

                              {createFormData.user_id ===
                                user.id && (
                                <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary-600" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* SELECTED CUSTOMER */}

          <AnimatePresence>
            {createFormData.user_id &&
              getSelectedUser() && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    height: 'auto',
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    y: -5,
                  }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/60 p-3.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700">
                      {getInitials(
                        getSelectedUser().full_name
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {getSelectedUser().full_name}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {getSelectedUser().email}
                      </p>
                    </div>

                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary-600" />
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setUserSearch('');
                setIsUserDropdownOpen(false);

                setCreateFormData({
                  account_type: 'checking',
                  user_id: '',
                });
              }}
              disabled={createLoading}
              className="h-11 rounded-xl px-5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createLoading ||
                users.length === 0 ||
                !createFormData.user_id
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create account
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================
          CREDIT MODAL
      ====================================================== */}

      <CreditModal
        isOpen={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        user={{
          id: selectedAccountForTransaction?.user_id,
          full_name:
            selectedAccountForTransaction?.profiles?.full_name ||
            'User',
        }}
        accounts={
          groupedUsers.find(
            (group) =>
              group.user_id ===
              selectedAccountForTransaction?.user_id
          )?.accounts ||
          (selectedAccountForTransaction
            ? [selectedAccountForTransaction]
            : [])
        }
        selectedAccountId={
          selectedAccountForTransaction?.id
        }
        onSuccess={fetchAccounts}
        title="Credit Account"
        subtitle={`Add funds to ${
          selectedAccountForTransaction?.profiles?.full_name ||
          'user'
        }'s account`}
      />

      {/* ======================================================
          DEBIT MODAL
      ====================================================== */}

      <DebitModal
        isOpen={debitModalOpen}
        onClose={() => setDebitModalOpen(false)}
        user={{
          id: selectedAccountForTransaction?.user_id,
          full_name:
            selectedAccountForTransaction?.profiles?.full_name ||
            'User',
        }}
        accounts={
          groupedUsers.find(
            (group) =>
              group.user_id ===
              selectedAccountForTransaction?.user_id
          )?.accounts ||
          (selectedAccountForTransaction
            ? [selectedAccountForTransaction]
            : [])
        }
        selectedAccountId={
          selectedAccountForTransaction?.id
        }
        onSuccess={fetchAccounts}
        title="Debit Account"
        subtitle={`Withdraw funds from ${
          selectedAccountForTransaction?.profiles?.full_name ||
          'user'
        }'s account`}
      />

      {/* ======================================================
          CONFIRMATION MODAL
      ====================================================== */}

      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={modalContent?.title || 'Confirm'}
        size="sm"
        position="bottom"
        showCloseButton
        closeOnOutsideClick={false}
      >
        {modalContent && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
                  modalContent.type === 'danger'
                    ? 'bg-red-50 text-red-600'
                    : modalContent.type === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-950">
                  {modalContent.title}
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {modalContent.message}
                </p>
              </div>
            </div>

            {selectedAccount && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                  Account
                </p>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                      <AccountTypeIcon
                        type={
                          selectedAccount.account_type
                        }
                        className="h-5 w-5"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold capitalize text-slate-900">
                        {selectedAccount.account_type}
                      </p>

                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                        {selectedAccount.account_number}
                      </p>

                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        {selectedAccount.profiles?.full_name ||
                          'Unknown User'}
                      </p>
                    </div>
                  </div>

                  <p className="flex-shrink-0 text-sm font-bold text-slate-950">
                    {formatCurrency(
                      selectedAccount.balance
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                onClick={handleModalClose}
                disabled={modalLoading}
                className="h-11 rounded-xl px-5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                disabled={modalLoading}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                  modalContent.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : modalContent.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {modalLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {modalLoading
                  ? 'Processing...'
                  : modalContent.confirmText ||
                    'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default AccountsList;