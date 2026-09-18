import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, accountsAPI } from '../api';
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
  CreditCard,
  LockKeyhole,
  UserRound,
  BadgeCheck,
  Clock3,
  Sparkles,
  ArrowUpRight,
  Globe2,
  Headphones,
  Settings2,
  Fingerprint,
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

  // ---------------------------------------------------------
  // ACCOUNT OFFICER
  // ---------------------------------------------------------

  const getOfficer = (userId) => {
    const officers = [
      {
        name: 'James Anderson',
        email: 'jamesanderson@trustycreditunion.com',
        phone: '+1(323) 212-0135',
        image: '/acm.png',
        title: 'Senior Account Officer',
      },
    ];

    const safeId = String(userId || 'user');

    const hash = safeId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return officers[hash % officers.length];
  };

  // ---------------------------------------------------------
  // FETCH
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // FORM
  // ---------------------------------------------------------

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

  const handleEditClick = () => {
    setEditModalOpen(true);
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f8fbff] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_20px_60px_rgba(148,163,184,0.12)]">
            <div className="flex min-h-[480px] flex-col items-center justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                <div className="absolute inset-0 animate-ping rounded-2xl bg-blue-100 opacity-50" />
                <Loader2 className="relative h-7 w-7 animate-spin text-primary-600" />
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-600">
                Loading your profile
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Preparing your account overview…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // EMPTY
  // ---------------------------------------------------------

  if (!user || !profile) {
    return (
      <div className="min-h-[70vh] bg-[#f8fbff] px-4 py-10">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[28px] border border-blue-100 bg-white p-10 text-center shadow-[0_20px_60px_rgba(148,163,184,0.12)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <UserRound className="h-7 w-7 text-blue-400" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-600">
              Profile unavailable
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Please sign in again to view your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // DERIVED
  // ---------------------------------------------------------

  const isEmailVerified = Boolean(
    user.email_confirmed ?? true
  );

  const profileImage =
    profile?.profile_image ||
    user?.profile_image ||
    null;

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
    <div className="min-h-screen bg-[#f8fbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6 pb-10">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-primary-600">
                Personal account
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-600 sm:text-4xl">
              Your profile
            </h1>

            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-400">
              Keep your account information organized and securely
              manage your banking relationship.
            </p>
          </div>

          <button
            onClick={handleEditClick}
            className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-primary-600 shadow-[0_8px_25px_rgba(148,163,184,0.12)] transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_12px_30px_rgba(37,99,235,0.12)]"
          >
            <Edit2 className="h-4 w-4 transition-transform group-hover:rotate-6" />
            Edit profile
          </button>
        </header>

        {/* ===================================================
            ALERTS
        =================================================== */}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Profile updated
              </p>

              <p className="mt-0.5 text-sm text-emerald-600">
                {success}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>

            <div>
              <p className="text-sm font-semibold text-rose-700">
                Something went wrong
              </p>

              <p className="mt-0.5 text-sm text-rose-600">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            PREMIUM PROFILE HERO
        =================================================== */}

        <section className="relative overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_20px_60px_rgba(148,163,184,0.14)]">

          {/* Decorative light gradients */}
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="pointer-events-none absolute left-10 top-10 h-24 w-24 rounded-full bg-cyan-100/40 blur-2xl" />

          <div className="relative p-5 sm:p-7 lg:p-8">

            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

              {/* Identity */}
              <div className="flex min-w-0 items-center gap-4 sm:gap-6">

                <div className="relative shrink-0">

                  <div className="absolute -inset-1 rounded-[25px] bg-gradient-to-br from-blue-200 via-primary-100 to-cyan-100 blur-sm" />

                  <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[23px] border-4 border-white bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-bold text-primary-500 shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={profile.full_name || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-500">
                      Customer
                    </span>

                    {isEmailVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  <h2 className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-600 sm:text-3xl">
                    {profile.full_name || 'Customer'}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-blue-400" />
                      Member since {memberSince}
                    </span>

                  </div>
                </div>
              </div>

              {/* Security card */}
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Fingerprint className="h-5 w-5 text-emerald-500" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-emerald-600">
                    Security status
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-emerald-700">
                    Account protected
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ===================================================
            STATS
        =================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            icon={Wallet}
            label="Accounts"
            value={accounts.length}
            iconClass="bg-blue-50 text-blue-500"
            accent="from-blue-50 to-white"
          />

          <StatCard
            icon={CreditCard}
            label="Transactions"
            value={transactionCount}
            iconClass="bg-violet-50 text-violet-500"
            accent="from-violet-50 to-white"
          />

          <StatCard
            icon={ShieldCheck}
            label="Daily limit"
            value="$10,000"
            iconClass="bg-amber-50 text-amber-500"
            accent="from-amber-50 to-white"
          />

          <StatCard
            icon={CheckCircle2}
            label="Email status"
            value={isEmailVerified ? 'Verified' : 'Pending'}
            iconClass={
              isEmailVerified
                ? 'bg-emerald-50 text-emerald-500'
                : 'bg-amber-50 text-amber-500'
            }
            accent={
              isEmailVerified
                ? 'from-emerald-50 to-white'
                : 'from-amber-50 to-white'
            }
          />

        </section>

        {/* ===================================================
            MAIN GRID
        =================================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="lg:col-span-3">
            <div className="overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-[0_15px_45px_rgba(148,163,184,0.10)]">

              <div className="flex items-center justify-between border-b border-blue-50 px-5 py-5 sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-600">
                      Personal information
                    </h2>

                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary-500">
                      PRIVATE
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Information associated with your account.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <UserRound className="h-4.5 w-4.5 text-primary-500" />
                </div>
              </div>

              <div className="divide-y divide-blue-50 
														">

                <InfoRow
                  icon={User}
                  label="Full name"
                  value={profile.full_name || 'Not provided'}
                  iconClass="bg-blue-50 text-blue-500"
                />

                <InfoRow
                  icon={Mail}
                  label="Email address"
                  value={user.email}
                  iconClass="bg-violet-50 text-violet-500"
                  badge={
                    isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    ) : null
                  }
                />

                <InfoRow
                  icon={Phone}
                  label="Phone number"
                  value={profile.phone || 'Not provided'}
                  iconClass="bg-emerald-50 text-emerald-500"
                />

                <InfoRow
                  icon={MapPin}
                  label="Residential address"
                  value={profile.address || 'Not provided'}
                  iconClass="bg-orange-50 text-orange-500"
                />

                <InfoRow
                  icon={Globe2}
                  label="Country"
                  value={profile.country || 'Not provided'}
                  iconClass="bg-cyan-50 text-cyan-500"
                />

              </div>

              <div className="border-t border-blue-50 bg-blue-50/40 px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <LockKeyhole className="h-3.5 w-3.5 text-blue-400" />
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    For your security, changes to personal information
                    are handled through your account officer.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* =================================================
              ACCOUNT OFFICER
          ================================================= */}

          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-[26px] border border-blue-100 bg-white shadow-[0_15px_45px_rgba(148,163,184,0.10)]">

              <div className="border-b border-blue-50 px-5 py-5">
                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-500">
                      Concierge support
                    </p>

                    <h2 className="mt-1 text-base font-bold text-slate-600">
                      Your account officer
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Your dedicated banking contact.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <Headphones className="h-4.5 w-4.5 text-primary-500" />
                  </div>

                </div>
              </div>

              {officer ? (
                <div className="p-5">

                  <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">

                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/50 blur-2xl" />

                    <div className="relative flex items-center gap-3">

                      <div className="relative">
                        <img
                          src={officer.image}
                          alt={officer.name}
                          className="h-14 w-14 rounded-2xl object-cover ring-4 ring-white shadow-md"
                        />

                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-600">
                          {officer.name}
                        </p>

                        <p className="mt-0.5 text-xs font-medium text-primary-500">
                          {officer.title}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Available for assistance
                        </p>
                      </div>

                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-blue-50 bg-[#f9fbff] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Mail className="h-4 w-4 text-blue-400" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Email
                        </p>

                        <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                          {officer.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
																		 to="/chat"
                    type="button"
                    className="group mt-4 flex w-full items-center justify-between rounded-2xl bg-primary-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-200 transition-all hover:-translate-y-0.5 hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-200"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Contact account officer
                    </span>

                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                    <UserRound className="h-5 w-5 text-blue-300" />
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    Account officer information unavailable.
                  </p>
                </div>
              )}

            </div>
          </section>

        </div>

        {/* ===================================================
            SERVICES
        =================================================== */}

        <section>

          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-500">
                Banking tools
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-600">
                Account services
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Helpful tools for managing your banking relationship.
              </p>
            </div>

            <Settings2 className="hidden h-5 w-5 text-blue-200 sm:block" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <ServiceCard
              icon={FileText}
              iconClass="bg-blue-50 text-blue-500"
              title="Account statements"
              description="Request an official statement for your account activity."
              action={
                isEmailVerified
                  ? 'Request statement'
                  : 'Email verification required'
              }
              disabled={!isEmailVerified}
            />

            <ServiceCard
              icon={ShieldCheck}
              iconClass="bg-emerald-50 text-emerald-500"
              title="Account security"
              description="Review the protection status of your account and contact details."
              action="Security active"
              success
            />

            <ServiceCard
              icon={MessageSquare}
              iconClass="bg-violet-50 text-violet-500"
              title="Get support"
              description="Reach your dedicated account officer whenever you need assistance."
              action="Contact support"
            />

          </div>
        </section>

        {/* ===================================================
            SECURITY FOOTER
        =================================================== */}

        <div className="flex flex-col gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Your account is protected
              </p>

              <p className="mt-0.5 text-xs text-emerald-600/80">
                Never share your password or verification codes.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================
            EDIT PROFILE MODAL
        =================================================== */}

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

            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="absolute inset-0 rounded-2xl bg-amber-100/30 blur-xl" />
              <ShieldCheck className="relative h-8 w-8 text-amber-500" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-600">
              Profile changes require verification
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              To protect your account, changes to personal information
              must be handled through your account officer.
            </p>

            {officer && (
              <div className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-3 text-left">

                <img
                  src={officer.image}
                  alt={officer.name}
                  className="h-11 w-11 rounded-xl object-cover ring-2 ring-white shadow-sm"
                />

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-600">
                    {officer.name}
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-primary-500">
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
                className="flex-1 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-blue-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-100 transition-all hover:bg-primary-500"
              >
                Understood
              </button>

            </div>

          </div>
        </Modal>

      </div>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({
  icon: Icon,
  label,
  value,
  iconClass,
  accent,
}) => (
  <div
    className={`group relative overflow-hidden rounded-[22px] border border-blue-100 bg-gradient-to-br ${accent} p-4 shadow-[0_10px_30px_rgba(148,163,184,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(148,163,184,0.14)]`}
  >
    <div className="flex items-center justify-between">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      <ArrowUpRight className="h-4 w-4 text-blue-200 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </div>

    <p className="mt-4 truncate text-xl font-bold tracking-tight text-slate-600 sm:text-2xl">
      {value}
    </p>

    <p className="mt-0.5 text-xs font-medium text-slate-400">
      {label}
    </p>
  </div>
);

// ============================================================
// INFORMATION ROW
// ============================================================

const InfoRow = ({
  icon: Icon,
  label,
  value,
  iconClass,
  badge,
}) => (
  <div className="flex gap-4 px-5 py-4.5 sm:px-6">

    <div
      className={`my-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
    >
      <Icon className="h-4.5 w-4.5" />
    </div>

    <div className="min-w-0 flex-1 my-4">

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        {badge}
      </div>

      <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-500">
        {value}
      </p>

    </div>
  </div>
);

// ============================================================
// SERVICE CARD
// ============================================================

const ServiceCard = ({
  icon: Icon,
  iconClass,
  title,
  description,
  action,
  disabled = false,
  success = false,
}) => (
  <div className="group relative overflow-hidden rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_12px_35px_rgba(148,163,184,0.08)] transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(148,163,184,0.14)]">

    <div className="flex items-start justify-between">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 transition-colors group-hover:bg-blue-100">
        <ChevronRight className="h-4 w-4 text-blue-300 transition-transform group-hover:translate-x-0.5" />
      </div>

    </div>

    <h3 className="mt-4 text-sm font-bold text-slate-600">
      {title}
    </h3>

    <p className="mt-1 text-xs leading-5 text-slate-400">
      {description}
    </p>

    {success ? (
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {action}
      </div>
    ) : (
      <button
        type="button"
        disabled={disabled}
        className={`mt-4 text-xs font-bold transition-colors ${
          disabled
            ? 'cursor-not-allowed text-slate-300'
            : 'text-primary-500 hover:text-primary-600'
        }`}
      >
        {action}
      </button>
    )}

  </div>
);

export default Profile;