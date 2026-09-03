import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, accountsAPI, transactionsAPI } from '../api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  CalendarDays,
  MessageSquare,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  CreditCard,
  LockKeyhole,
  UserRound,
  BadgeCheck,
  Clock3,
} from 'lucide-react';
import Modal from './Modal';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [officer, setOfficer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  /*
   * Demo account officer.
   *
   * Deliberately avoids using a real institution name.
   * The email addresses are also neutral demo addresses.
   */
  const getOfficer = (userId) => {
    const officers = [
      {
        name: 'James Anderson',
        email: 'james.anderson@example.test',
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
        title: 'Senior Account Officer',
      },
      {
        name: 'Robert Mitchell',
        email: 'robert.mitchell@example.test',
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
        title: 'Account Manager',
      },
      {
        name: 'William Davis',
        email: 'william.davis@example.test',
        image: 'https://randomuser.me/api/portraits/men/3.jpg',
        title: 'Client Relationship Manager',
      },
      {
        name: 'David Thompson',
        email: 'david.thompson@example.test',
        image: 'https://randomuser.me/api/portraits/men/4.jpg',
        title: 'Senior Banking Advisor',
      },
      {
        name: 'Michael Johnson',
        email: 'michael.johnson@example.test',
        image: 'https://randomuser.me/api/portraits/men/5.jpg',
        title: 'Account Executive',
      },
    ];

    const safeId = String(userId || 'demo-user');

    const hash = safeId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return officers[hash % officers.length];
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');

      const profileData = await authAPI.getProfile();

      const loadedProfile = profileData?.profile || null;

      setProfile(loadedProfile);

      setFormData({
        full_name: loadedProfile?.full_name || '',
        phone: loadedProfile?.phone || '',
        address: loadedProfile?.address || '',
      });

      const accountsData = await accountsAPI.getAll();

      const loadedAccounts = accountsData?.accounts || [];

      setAccounts(loadedAccounts);

      /*
       * Keep the existing demo behavior.
       *
       * Replace this with a real count endpoint when your API
       * exposes one.
       */
      setTransactionCount(
        loadedAccounts.length > 0
          ? loadedAccounts.length * 5 + 3
          : 0
      );

      if (user?.id) {
        setOfficer(getOfficer(user.id));
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Unable to load your profile information.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const data = await authAPI.updateProfile(formData);

      updateUser(formData);

      setSuccess(
        data?.message || 'Profile updated successfully.'
      );

      await fetchProfileData();
    } catch (err) {
      setError(
        err?.error || 'Unable to update your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Profile editing is intentionally restricted.
   * The actual edit form remains available in the component
   * structure for future use, but the normal UI asks the
   * customer to contact their account officer.
   */
  const handleEditClick = () => {
    setEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Loading your profile
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Please wait a moment…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <UserRound className="h-7 w-7 text-slate-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Profile unavailable
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please sign in again to view your profile.
          </p>
        </div>
      </div>
    );
  }

  const isEmailVerified = Boolean(
    user.email_confirmed ?? true
  );

  const initials =
    profile.full_name
      ?.trim()
      ?.split(/\s+/)
      ?.slice(0, 2)
      ?.map((name) => name.charAt(0))
      ?.join('')
      ?.toUpperCase() || 'U';

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(
        undefined,
        {
          month: 'long',
          year: 'numeric',
        }
      )
    : 'Recently';

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-10">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <UserRound className="h-4 w-4" />
            <span>Account profile</span>
          </div>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Your profile
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Manage your personal information and account details.
          </p>
        </div>

        <button
          onClick={handleEditClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <Edit2 className="h-4 w-4" />
          Edit profile
        </button>
      </div>

      {/* =====================================================
          SUCCESS / ERROR
      ===================================================== */}
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>
            <p className="text-sm font-medium text-emerald-900">
              Profile updated
            </p>

            <p className="mt-0.5 text-sm text-emerald-700">
              {success}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

          <div>
            <p className="text-sm font-medium text-rose-900">
              Something went wrong
            </p>

            <p className="mt-0.5 text-sm text-rose-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          PROFILE HERO
      ===================================================== */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 text-white shadow-lg shadow-primary-200/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold text-white ring-1 ring-white/20 backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-primary-100">
                  Customer profile
                </p>

                <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  {profile.full_name || 'Customer'}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-primary-100">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    Member since {memberSince}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Secure account
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/10 backdrop-blur-sm sm:self-center">
              {isEmailVerified ? (
                <>
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  <span className="text-primary-50">
                    Verified customer
                  </span>
                </>
              ) : (
                <>
                  <Clock3 className="h-4 w-4 text-amber-300" />
                  <span className="text-primary-50">
                    Verification pending
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          OVERVIEW STATS
      ===================================================== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
              <Wallet className="h-4.5 w-4.5 text-primary-600" />
            </div>

            <ArrowUpRight className="h-4 w-4 text-slate-300" />
          </div>

          <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            {accounts.length}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Accounts
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <CreditCard className="h-4.5 w-4.5 text-blue-600" />
            </div>

            <ArrowUpRight className="h-4 w-4 text-slate-300" />
          </div>

          <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            {transactionCount}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Transactions
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <ShieldCheck className="h-4.5 w-4.5 text-amber-600" />
            </div>

            <ArrowUpRight className="h-4 w-4 text-slate-300" />
          </div>

          <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            $10,000
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Daily limit
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              {isEmailVerified ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
              ) : (
                <Clock3 className="h-4.5 w-4.5 text-amber-600" />
              )}
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-900">
            {isEmailVerified ? 'Verified' : 'Pending'}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Email status
          </p>
        </div>

      </section>

      {/* =====================================================
          MAIN INFORMATION
      ===================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* ===================================================
            PERSONAL INFORMATION
        =================================================== */}
        <section className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Personal information
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Information associated with your account.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                <UserRound className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="divide-y divide-slate-100">

              {/* Name */}
              <div className="flex gap-4 px-5 py-5 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <User className="h-5 w-5 text-primary-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Full name
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {profile.full_name || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4 px-5 py-5 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Email address
                    </p>

                    {isEmailVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4 px-5 py-5 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Phone className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Phone number
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {profile.phone || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-4 px-5 py-5 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Residential address
                  </p>

                  <p className="mt-1 text-sm font-medium leading-6 text-slate-900">
                    {profile.address || 'Not provided'}
                  </p>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                <p className="text-xs leading-5 text-slate-500">
                  For your security, changes to personal information
                  are handled through your account officer.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ===================================================
            ACCOUNT OFFICER
        =================================================== */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Account support
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Your dedicated account contact.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                <MessageSquare className="h-4 w-4 text-primary-600" />
              </div>
            </div>

            {officer ? (
              <div className="p-5">

                <div className="flex items-center gap-4">
                  <img
                    src={officer.image}
                    alt={officer.name}
                    className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200"
                  />

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {officer.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {officer.title}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm font-medium text-slate-700">
                        {officer.email}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-700"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contact account officer
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

              </div>
            ) : (
              <div className="p-8 text-center">
                <UserRound className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm text-slate-500">
                  Account officer information unavailable.
                </p>
              </div>
            )}

          </div>
        </section>

      </div>

      {/* =====================================================
          ACCOUNT SERVICES
      ===================================================== */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Account services
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage documents and account-related requests.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* Statements */}
          <div className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>

              <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Account statements
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Request an official statement for your account activity.
            </p>

            <button
              type="button"
              disabled={!isEmailVerified}
              className={`mt-4 text-sm font-medium ${
                isEmailVerified
                  ? 'text-primary-600 hover:text-primary-700'
                  : 'cursor-not-allowed text-slate-400'
              }`}
            >
              {isEmailVerified
                ? 'Request statement'
                : 'Email verification required'}
            </button>
          </div>

          {/* Security */}
          <div className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>

              <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Account security
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your account is protected by secure authentication and
              verified contact information.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Security status active
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================
          EDIT PROFILE RESTRICTION MODAL
      ===================================================== */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit profile"
        size="sm"
        position="bottom"
        showCloseButton={true}
        closeOnOutsideClick={false}
      >
        <div className="flex flex-col items-center text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <ShieldCheck className="h-8 w-8 text-amber-600" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            Profile changes require verification
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            To protect your account, changes to personal information
            must be handled through your account officer.
          </p>

          {officer && (
            <div className="mt-5 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">

              <img
                src={officer.image}
                alt={officer.name}
                className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
              />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {officer.name}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {officer.title}
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {officer.email}
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 flex w-full gap-3">

            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              Understood
            </button>

          </div>

        </div>
      </Modal>

    </div>
  );
};

export default Profile;