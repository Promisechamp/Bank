import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

const STORAGE_KEY = 'security_setup_banner_hidden';

const SecuritySetupBanner = () => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isHidden, setIsHidden] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // ----------------------------------------------------------
  // Fresh profile fetch
  // ----------------------------------------------------------

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      // Don't fetch if there's nothing to check
      if (loading || !isAuthenticated || !user) {
        if (!cancelled) setProfileLoading(false);
        return;
      }

      // Admins don't need the banner, so skip the network call
      if (isAdmin) {
        if (!cancelled) setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const response = await authAPI.getProfile();

        if (cancelled) return;

        // Accept either { user: {...} }, { profile: {...} }, or a bare object
        const fetched =
          response?.user ||
          response?.profile ||
          response?.data ||
          response;

        setProfile(fetched || null);
      } catch (err) {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated, isAdmin, user?.id]);

  // ----------------------------------------------------------
  // Visibility checks
  // ----------------------------------------------------------

  if (loading || !isAuthenticated || !user) {
    return null;
  }

  if (isAdmin || isHidden) {
    return null;
  }

  // While we wait for the fresh profile, don't render the
  // banner. Prevents a flash of "incomplete" for users who
  // actually have everything set.
  if (profileLoading) {
    return null;
  }

  // ----------------------------------------------------------
  // Security completion checks
  // ----------------------------------------------------------

  const isComplete = (value) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    // Arrays (e.g. security_questions stored as jsonb array)
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    // Objects (jsonb)
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  };

  // Prefer freshly-fetched profile, fall back to context user
  const source = profile || user;

  const hasTransferPin = isComplete(source?.transfer_pin);

  const hasSecurityQuestions = isComplete(
    source?.security_questions
  );

  const hasRecoveryPhrase = isComplete(
    source?.account_recovery_phrase
  );

  const completedSteps = [
    hasTransferPin,
    hasSecurityQuestions,
    hasRecoveryPhrase,
  ].filter(Boolean).length;

  const securitySetupComplete = completedSteps === 3;

  if (securitySetupComplete || pathname === '/security') {
    return null;
  }

  // ----------------------------------------------------------
  // Progress
  // ----------------------------------------------------------

  const progressPercentage = Math.round(
    (completedSteps / 3) * 100
  );

  // ----------------------------------------------------------
  // Actions
  // ----------------------------------------------------------

  const handleCompleteSecurity = () => {
    navigate('/security');
  };

  const handleHide = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore localStorage errors.
    }

    setIsHidden(true);
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="sticky top-0 z-[100] w-full border-b border-gray-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex min-h-[76px] items-center gap-4 py-3">

          {/* Security icon */}

          <div className="hidden shrink-0 sm:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 text-amber-600"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3.5 19 6v5.5c0 4.35-2.85 7.85-7 9-4.15-1.15-7-4.65-7-9V6l7-2.5Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9.25 12 1.75 1.75 3.75-4"
                />
              </svg>
            </div>
          </div>

          {/* Content */}

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-gray-900 sm:text-[15px]">
                Secure your account
              </h3>

              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {completedSteps}/3
              </span>
            </div>

            <p className="mt-0.5 max-w-2xl text-xs leading-5 text-gray-500 sm:text-sm">
              Complete your security setup to add extra protection to your account.
            </p>

            {/* Desktop progress */}

            <div className="mt-2 hidden items-center gap-2 sm:flex">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <span className="text-[11px] font-medium text-gray-400">
                {progressPercentage}% complete
              </span>
            </div>
          </div>

          {/* Actions */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

            {/* Hide */}

            <button
              type="button"
              onClick={handleHide}
              aria-label="Hide security setup banner"
              title="Hide"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-gray-100
                text-gray-500
                transition
                hover:bg-gray-200
                hover:text-gray-700
                focus:outline-none
                focus:ring-2
                focus:ring-gray-300
                focus:ring-offset-1
                active:scale-[0.97]
              "
            >
              <X className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </button>

            {/* Complete setup */}

            <button
              type="button"
              onClick={handleCompleteSecurity}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gray-900
                px-3.5
                text-xs
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-gray-800
                active:scale-[0.98]
                focus:outline-none
                focus:ring-2
                focus:ring-gray-900
                focus:ring-offset-2
                sm:h-11
                sm:px-4
                sm:text-sm
              "
            >
              <span>Complete setup</span>

              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M4 10h11M11 6l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

          </div>
        </div>

        {/* Mobile progress */}

        <div className="pb-3 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            <span className="text-[10px] font-medium text-gray-400">
              {progressPercentage}%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SecuritySetupBanner;