import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, accountsAPI, transactionsAPI } from '../../api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import UpdateUserModal from './UpdateUserModal';

import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  History,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit2,
  Shield,
  Building,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  Key,
  Globe,
  UserCheck,
  Trash2,
  Eye,
  EyeOff,
  Home,
  Flag,
  Copy,
  Check,
  ChevronRight,
  Activity,
  CircleDollarSign,
  Sparkles,
} from 'lucide-react';

import {
  formatCurrency,
  formatDate,
  getStatusColor,
} from '../../utils/helpers';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const userResponse = await authAPI.getUserById(userId);
      setUser(userResponse.user);
      setShowPassword(false);

      const accountsResponse = await accountsAPI.adminGetAll();

      const userAccounts = (accountsResponse.accounts || []).filter(
        (account) => account.user_id === userId
      );

      setAccounts(userAccounts);

      let allTransactions = [];

      for (const account of userAccounts) {
        try {
          const txResponse = await transactionsAPI.getHistory(account.id, {
            limit: 10,
          });

          allTransactions = [
            ...allTransactions,
            ...(txResponse.transactions || []),
          ];
        } catch (e) {
          // Continue if an account has no transaction history.
        }
      }

      allTransactions.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );

      setTransactions(allTransactions.slice(0, 10));
    } catch (err) {
      console.error('Error fetching user details:', err);

      const message =
        err?.error || 'Failed to load user details';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyValue = async (value, type) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(type);
      toast.success('Copied to clipboard');

      setTimeout(() => {
        setCopied('');
      }, 1800);
    } catch (err) {
      toast.error('Unable to copy');
    }
  };

  const openEditModal = () => {
    setEditModalOpen(true);
  };

  const handleStatusToggle = () => {
    const newStatus =
      user.status === 'active' ? 'suspended' : 'active';

    setModalContent({
      title:
        newStatus === 'active'
          ? 'Activate user'
          : 'Suspend user',

      message:
        newStatus === 'active'
          ? `Restore ${user?.full_name}'s access to the platform?`
          : `Temporarily suspend ${user?.full_name}'s access to the platform?`,

      type:
        newStatus === 'suspended'
          ? 'danger'
          : 'warning',

      confirmLabel:
        newStatus === 'active'
          ? 'Activate user'
          : 'Suspend user',

      onConfirm: async () => {
        try {
          setModalLoading(true);

          await authAPI.updateUserStatus(
            userId,
            newStatus
          );

          setUser((current) => ({
            ...current,
            status: newStatus,
          }));

          const message = `User ${newStatus} successfully`;

          setSuccess(message);
          toast.success(message);
        } catch (err) {
          const message =
            err?.error ||
            `Failed to ${newStatus} user`;

          setError(message);
          toast.error(message);
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      },
    });

    setModalOpen(true);
  };

  const handleDeleteUser = () => {
    setModalContent({
      title: 'Delete user',
      message: `Delete ${user?.full_name}'s account permanently? This action cannot be undone.`,
      type: 'danger',
      confirmLabel: 'Delete permanently',

      onConfirm: async () => {
        try {
          setModalLoading(true);

          await authAPI.deleteUser(userId);

          toast.success('User deleted successfully');
          navigate('/admin/users');
        } catch (err) {
          const message =
            err?.error || 'Failed to delete user';

          setError(message);
          toast.error(message);
        } finally {
          setModalLoading(false);
          setModalOpen(false);
        }
      },
    });

    setModalOpen(true);
  };

  const handleModalClose = () => {
    if (!modalLoading) {
      setModalOpen(false);
    }
  };

  const handleConfirm = async () => {
    if (!modalContent?.onConfirm || modalLoading) return;

    try {
      await modalContent.onConfirm();
    } catch (err) {
      console.error(err);
    }
  };

  const totalBalance = useMemo(
    () =>
      accounts.reduce(
        (sum, account) =>
          sum + Number(account.balance || 0),
        0
      ),
    [accounts]
  );

  const totalCredits = useMemo(
    () =>
      transactions
        .filter(
          (tx) => tx.transaction_type === 'credit'
        )
        .reduce(
          (sum, tx) => sum + Math.abs(Number(tx.amount || 0)),
          0
        ),
    [transactions]
  );

  const totalDebits = useMemo(
    () =>
      transactions
        .filter(
          (tx) => tx.transaction_type === 'debit'
        )
        .reduce(
          (sum, tx) => sum + Math.abs(Number(tx.amount || 0)),
          0
        ),
    [transactions]
  );

  const initials = useMemo(() => {
    if (!user?.full_name) return 'U';

    return user?.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }, [user]);

  const statCards = [
    {
      label: 'Total balance',
      value: formatCurrency(totalBalance),
      icon: Wallet,
      description: 'Across all accounts',
      className: 'bg-blue-50 border-blue-100 text-blue-600',
    },
    {
      label: 'Accounts',
      value: accounts.length,
      icon: Building,
      description: 'Banking accounts',
      className: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    },
    {
      label: 'Transactions',
      value: transactions.length,
      icon: Activity,
      description: 'Recent activity',
      className: 'bg-violet-50 border-violet-100 text-violet-600',
    },
    {
  label: 'Member since',
  value: user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        //day: '2-digit', 
        year: 'numeric' 
      })
    : 'N/A',
  icon: Calendar,
  description: 'Account creation',
  className: 'bg-orange-50 border-orange-100 text-orange-600',
}
  ];

  const infoItems = [
    {
      label: 'Full name',
      value: user?.full_name,
      icon: User,
      copy: true,
      copyKey: 'name',
    },
    {
      label: 'Email address',
      value: user?.email,
      icon: Mail,
      copy: true,
      copyKey: 'email',
    },
    {
      label: 'Phone number',
      value: user?.phone,
      icon: Phone,
    },
    {
      label: 'Date of birth',
      value: user?.date_of_birth,
      icon: Calendar,
    },
    {
      label: 'Country',
      value: user?.country,
      icon: Flag,
    },
    {
      label: 'Address',
      value: user?.address,
      icon: Home,
    },
    {
      label: 'Role',
      value: user?.role
        ? user.role.charAt(0).toUpperCase() +
          user.role.slice(1)
        : 'User',
      icon: Shield,
    },
    {
      label: 'Created',
      value: user?.created_at
        ? formatDate(user.created_at)
        : null,
      icon: Calendar,
    },
    {
      label: 'Last updated',
      value: user?.updated_at
        ? formatDate(user.updated_at)
        : null,
      icon: Clock,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          </div>

          <h3 className="text-base font-semibold text-gray-900">
            Loading profile
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Preparing user information...
          </p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white border border-red-100 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            Unable to load user
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            {error}
          </p>

          <button
            onClick={() => navigate('/admin/users')}
            className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to users
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
            <User className="w-8 h-8 text-gray-400" />
          </div>

          <h3 className="text-xl font-bold text-gray-900">
            User not found
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            The user you're looking for doesn't exist.
          </p>

          <button
            onClick={() => navigate('/admin/users')}
            className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to users
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1500px] mx-auto space-y-7 pb-10 p-3"
    >
      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition w-fit"
        >
          <span className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition">
            <ArrowLeft className="w-4 h-4" />
          </span>

          <span>Back to users</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openEditModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            Edit profile
          </button>

          <button
            onClick={handleStatusToggle}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
              user.status === 'active'
                ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            {user.status === 'active'
              ? 'Suspend'
              : 'Activate'}
          </button>

          <button
            onClick={handleDeleteUser}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-100 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* =====================================================
          ALERTS
      ====================================================== */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-700">
              {success}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          PROFILE HERO
      ====================================================== */}
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100 shadow-sm">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-32 w-80 h-80 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-7">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] overflow-hidden bg-white border-4 border-white shadow-xl flex items-center justify-center">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt={user?.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-4xl font-black text-white">
                      {initials}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`absolute -right-2 -bottom-2 w-9 h-9 rounded-xl border-4 border-white flex items-center justify-center ${
                  user.status === 'active'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              >
                <span className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  {user.role || 'User'}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    getStatusColor(user.status)
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {user.status || 'active'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950">
                {user?.full_name || 'Unnamed User'}
              </h1>

              <p className="mt-2 text-gray-500 text-sm sm:text-base flex items-center gap-2 break-all">
                <Mail className="w-4 h-4 flex-shrink-0" />
                {user.email || 'No email address'}
              </p>

              <div className="flex flex-wrap gap-4 mt-5 text-xs sm:text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Joined{' '}
                  {user.created_at
                    ? formatDate(user.created_at)
                    : 'N/A'}
                </span>

                {user.country && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-500" />
                    {user.country}
                  </span>
                )}
              </div>
            </div>

            {/* Balance spotlight */}
            <div className="lg:min-w-[250px] bg-white/90 backdrop-blur-sm rounded-3xl border border-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Total balance
                </span>

                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CircleDollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              <p className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
                {formatCurrency(totalBalance)}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Across {accounts.length}{' '}
                {accounts.length === 1
                  ? 'account'
                  : 'accounts'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </p>

                  <p className="text-md sm:text-2xl font-black text-gray-950 mt-2 truncate">
                    {stat.value}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {stat.description}
                  </p>
                </div>

                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${stat.className}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6 ">
        {/* ===================================================
            PERSONAL INFORMATION
        ==================================================== */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Personal information
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Account and identity details
              </p>
            </div>

            <button
              onClick={openEditModal}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {infoItems.map((item) => {
                const Icon = item.icon;
                const value = item.value || 'Not provided';

                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 min-w-0"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        {item.label}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <p
                          className={`text-sm font-semibold break-words ${
                            item.value
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {value}
                        </p>

                        {item.copy && item.value && (
                          <button
                            onClick={() =>
                              copyValue(
                                item.value,
                                item.copyKey
                              )
                            }
                            className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition flex-shrink-0"
                            title="Copy"
                          >
                            {copied === item.copyKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================
            SECURITY / ACCESS
        ==================================================== */}
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Access & security
                </h2>

                <p className="text-sm text-gray-400">
                  Account access information
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Account status
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.status === 'active'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />

                    <span className="text-sm font-bold text-gray-900 capitalize">
                      {user.status || 'active'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleStatusToggle}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Password display */}
            <div className="p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Key className="w-4 h-4 text-orange-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                   Login Password
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                    {showPassword
                      ? user.password || 'Not available'
                      : '••••••••'}
                  </p>
                
                  <p className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Transfer Pin
                  </p>

                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                    {showPassword
                      ? user.transfer_pin || 'Not Set'
                      : '••••••••'}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
                  title={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                <div>
                  <p className="text-sm font-bold text-blue-900">
                    Administrator access
                  </p>

                  <p className="text-xs leading-5 text-blue-700 mt-1">
                    You are viewing this account from the
                    administrator dashboard. Changes made here
                    affect the user's live account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          ACCOUNTS
      ====================================================== */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>

              <h2 className="text-xl font-black text-gray-950">
                Banking accounts
              </h2>
            </div>

            <p className="text-sm text-gray-400 mt-1 ml-11">
              Accounts associated with this user
            </p>
          </div>

          <span className="text-sm font-semibold text-gray-400">
            {accounts.length}{' '}
            {accounts.length === 1
              ? 'account'
              : 'accounts'}
          </span>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building className="w-6 h-6 text-gray-400" />
            </div>

            <h3 className="text-base font-bold text-gray-900">
              No accounts yet
            </h3>

            <p className="text-sm text-gray-400 mt-1">
              This user doesn't have any banking accounts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account, index) => (
              <motion.button
                type="button"
                key={account.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() =>
                  navigate(
                    `/admin/accounts/${account.id}`
                  )
                }
                className="group text-left bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        account.account_type === 'checking'
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-emerald-50 border border-emerald-100'
                      }`}
                    >
                      <CreditCard
                        className={`w-5 h-5 ${
                          account.account_type === 'checking'
                            ? 'text-blue-600'
                            : 'text-emerald-600'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-black text-gray-950 capitalize">
                        {account.account_type ||
                          'Account'}
                      </p>

                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        Account #{account.account_number}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${getStatusColor(
                      account.status
                    )}`}
                  >
                    {account.status}
                  </span>
                </div>

                <div className="mt-7">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Available balance
                  </p>

                  <p className="text-3xl font-black text-gray-950 tracking-tight mt-1">
                    {formatCurrency(account.balance)}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">
                    View account details
                  </span>

                  <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          TRANSACTION OVERVIEW
      ====================================================== */}
      {transactions.length > 0 && (
        <section className="grid grid-cols-1 xl:grid-cols-[0.35fr_0.65fr] gap-6">
          {/* Activity summary */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-violet-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Activity overview
                </h2>

                <p className="text-xs text-gray-400">
                  Latest transaction activity
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>

                  <span className="text-sm font-semibold text-gray-700">
                    Credits
                  </span>
                </div>

                <span className="text-sm font-black text-emerald-600">
                  {formatCurrency(totalCredits)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>

                  <span className="text-sm font-semibold text-gray-700">
                    Debits
                  </span>
                </div>

                <span className="text-sm font-black text-red-600">
                  {formatCurrency(totalDebits)}
                </span>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Recent transactions
                </h2>

                <p className="text-xs text-gray-400 mt-0.5">
                  Latest 10 transactions across accounts
                </p>
              </div>

              <History className="w-5 h-5 text-gray-300" />
            </div>

            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const isCredit =
                  tx.transaction_type === 'credit';

                const isDebit =
                  tx.transaction_type === 'debit';

                return (
                  <div
                    key={tx.id}
                    className="group px-5 sm:px-6 py-4 hover:bg-gray-50/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCredit
                            ? 'bg-emerald-50'
                            : isDebit
                            ? 'bg-red-50'
                            : 'bg-blue-50'
                        }`}
                      >
                        {isCredit ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : isDebit ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {tx.description ||
                            'Transaction'}
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />

                          <p className="text-xs text-gray-400">
                            {tx.created_at
                              ? formatDate(tx.created_at)
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-black ${
                            isCredit
                              ? 'text-emerald-600'
                              : isDebit
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {isCredit
                            ? '+'
                            : isDebit
                            ? '-'
                            : ''}
                          {formatCurrency(
                            Math.abs(
                              Number(tx.amount || 0)
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          EDIT USER MODAL
      ====================================================== */}
      <UpdateUserModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={user}
        onSuccess={fetchUserDetails}
        isAdmin={true}
      />

      {/* =====================================================
          CONFIRMATION MODAL
      ====================================================== */}
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={modalContent?.title || 'Confirm action'}
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        {modalContent && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  modalContent.type === 'danger'
                    ? 'bg-red-50'
                    : modalContent.type === 'warning'
                    ? 'bg-amber-50'
                    : 'bg-blue-50'
                }`}
              >
                <AlertCircle
                  className={`w-6 h-6 ${
                    modalContent.type === 'danger'
                      ? 'text-red-600'
                      : modalContent.type === 'warning'
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  }`}
                />
              </div>

              <div>
                <h3 className="text-base font-black text-gray-950">
                  {modalContent.title}
                </h3>

                <p className="text-sm text-gray-500 leading-6 mt-1">
                  {modalContent.message}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={handleModalClose}
                disabled={modalLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                disabled={modalLoading}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                  modalContent.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : modalContent.type === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  modalContent.confirmLabel ||
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default UserDetail;