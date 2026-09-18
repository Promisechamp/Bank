// src/pages/SupportPageRegister.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

const SUPPORT_INFO = {
  branch: {
    name: 'Head Office',
    address: '12 Admiralty Way, New Orlens USA',
    hours: 'Monday – Friday · 8:00 AM – 5:00 PM',
  },

  accountOfficer: {
    name: 'Registration Support Team',
    role: 'Account Setup Specialists',
    //email: 'joinUs@trustycreditunion.com',
    email: 'Trustycrediunionbank.net@gmail.com',
    phone: '+1(323) 212-0135',
  },

  business: {
    email: 'support@trustybank.com',
    phone: '+1(323) 212-0135',
    hours: 'Available 24/7',
  },
};

/* ================================================================
   CONTACT ITEM
================================================================ */

const ContactItem = ({
  icon: Icon,
  label,
  value,
  href,
}) => {
  const content = (
    <>
      <div
        className="
          flex h-9 w-9 shrink-0 items-center justify-center
          rounded-xl bg-primary-50 text-primary-600
        "
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="
            text-[9px] font-semibold uppercase
            tracking-[0.1em] text-gray-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-0.5 truncate text-xs
            font-medium text-gray-800
          "
        >
          {value}
        </p>
      </div>

      {href && (
        <ArrowRight
          className="
            h-3.5 w-3.5 shrink-0
            text-gray-300 transition
            group-hover:translate-x-0.5
            group-hover:text-primary-500
          "
          strokeWidth={1.8}
        />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="
          group flex items-center gap-3
          rounded-xl p-2
          transition hover:bg-gray-50
        "
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      {content}
    </div>
  );
};

/* ================================================================
   SUPPORT CARD
================================================================ */

const SupportCard = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}) => {
  return (
    <section
      className="
        flex w-full min-w-0 flex-col
        rounded-2xl border border-gray-200
        bg-white p-5
        shadow-[0_1px_2px_rgba(15,23,42,0.03)]
        transition duration-200
        hover:-translate-y-0.5
        hover:border-gray-300
        hover:shadow-[0_12px_30px_-18px_rgba(15,23,42,0.18)]
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl bg-primary-50
            text-primary-600
          "
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
              text-[9px] font-bold uppercase
              tracking-[0.12em] text-primary-600
            "
          >
            {eyebrow}
          </p>

          <h2
            className="
              mt-1 text-sm font-bold
              tracking-tight text-gray-900
            "
          >
            {title}
          </h2>

          {description && (
            <p
              className="
                mt-1 text-[11px]
                leading-5 text-gray-500
              "
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </section>
  );
};

/* ================================================================
   SECURITY NOTE
================================================================ */

const SecurityNote = () => {
  return (
    <section
      className="
        flex w-full items-start gap-3
        rounded-2xl border border-gray-200
        bg-white px-4 py-4
      "
    >
      <div
        className="
          flex h-8 w-8 shrink-0
          items-center justify-center
          rounded-lg bg-primary-50
          text-primary-600
        "
      >
        <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-700">
          Keep your personal details secure
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
          Never share your password, OTP or personal information
          with anyone, including people claiming to be from
          the bank.
        </p>
      </div>
    </section>
  );
};

/* ================================================================
   SUPPORT PAGE – REGISTRATION
================================================================ */

const SupportPageRegister = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div
        className="
          mx-auto w-full
          max-w-[1180px]
          px-0 py-6
          sm:px-4 sm:py-8
          lg:px-8 lg:py-10
        "
      >
        {/* ========================================================
            HEADER
        ======================================================== */}

        <header className="mx-auto mb-8 max-w-[1080px]">
          <div
            className="
              flex flex-col gap-4
              sm:flex-row sm:items-center
              sm:justify-between
            "
          >
            {/* LEFT — TITLE */}

            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex h-11 w-11 shrink-0
                  items-center justify-center
                  rounded-xl bg-primary-50
                  text-primary-600
                "
              >
                <Headphones
                  className="h-5 w-5"
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[9px] font-bold uppercase
                    tracking-[0.15em] text-primary-600
                  "
                >
                  Registration Help
                </p>

                <h1
                  className="
                    mt-0.5 text-xl font-bold
                    tracking-tight text-gray-950
                    sm:text-2xl
                  "
                >
                  Support for new customers
                </h1>
              </div>
            </div>

            {/* RIGHT — ACTIONS */}

            <div className="flex flex-wrap items-center gap-2">
              {/* BACK TO LOGIN */}

              <Link
                to="/login"
                className="
                  group inline-flex items-center gap-2
                  rounded-xl border border-gray-200
                  bg-white px-3.5 py-2
                  text-[11px] font-semibold text-gray-700
                  shadow-[0_1px_2px_rgba(15,23,42,0.03)]
                  transition duration-200
                  hover:-translate-y-0.5
                  hover:border-gray-300
                  hover:bg-gray-50
                  hover:text-gray-900
                  focus:outline-none
                  focus:ring-2 focus:ring-primary-500/20
                "
              >
                <ArrowLeft
                  className="
                    h-3.5 w-3.5
                    text-gray-400
                    transition
                    group-hover:-translate-x-0.5
                    group-hover:text-primary-600
                  "
                  strokeWidth={1.8}
                />

                <span>Back to Login</span>
              </Link>

              {/* SECURITY STATUS */}

              <div
                className="
                  flex items-center gap-2
                  rounded-xl border border-gray-200
                  bg-white px-3 py-2
                "
              >
                <ShieldCheck
                  className="h-3.5 w-3.5 text-emerald-500"
                  strokeWidth={1.8}
                />

                <span className="text-[10px] font-semibold text-gray-500">
                  Secure banking
                </span>
              </div>
            </div>
          </div>

          <p
            className="
              mt-4 max-w-2xl
              text-xs leading-5 text-gray-500
              sm:text-[13px]
            "
          >
            Need help with account creation, verification or
            getting started? Choose a support option below and
            we’ll get you on your way.
          </p>
        </header>

        {/* ========================================================
            SUPPORT OPTIONS – FULL WIDTH
        ======================================================== */}

        <main className="mx-auto max-w-[1080px]">
          <div className="grid grid-cols-1 gap-6">
            <div
              className="
                grid grid-cols-1 gap-4
                sm:grid-cols-2
              "
            >
              {/* BRANCH */}

              <SupportCard
                icon={Building2}
                eyebrow="Your branch"
                title={SUPPORT_INFO.branch.name}
                description="Visit your branch for in-person assistance with registration."
              >
                <div className="space-y-1">
                  <ContactItem
                    icon={MapPin}
                    label="Address"
                    value={SUPPORT_INFO.branch.address}
                  />

                  <ContactItem
                    icon={Clock3}
                    label="Opening hours"
                    value={SUPPORT_INFO.branch.hours}
                  />
                </div>
              </SupportCard>

              {/* REGISTRATION SUPPORT */}

              <SupportCard
                icon={UserRound}
                eyebrow="Dedicated team"
                title={SUPPORT_INFO.accountOfficer.name}
                description={SUPPORT_INFO.accountOfficer.role}
              >
                <div className="space-y-1">
                  <ContactItem
                    icon={Mail}
                    label="Email"
                    value={SUPPORT_INFO.accountOfficer.email}
                    href={`mailto:${SUPPORT_INFO.accountOfficer.email}`}
                  />

                  <ContactItem
                    icon={Phone}
                    label="Phone"
                    value={SUPPORT_INFO.accountOfficer.phone}
                    href={`tel:${SUPPORT_INFO.accountOfficer.phone}`}
                  />
                </div>
              </SupportCard>

              {/* GENERAL SUPPORT */}

              <SupportCard
                icon={Phone}
                eyebrow="General enquiries"
                title="Business support"
                description="For general questions and banking assistance."
              >
                <div className="space-y-1">
                  <ContactItem
                    icon={Mail}
                    label="Business email"
                    value={SUPPORT_INFO.business.email}
                    href={`mailto:${SUPPORT_INFO.business.email}`}
                  />

                  <ContactItem
                    icon={Phone}
                    label="Support line"
                    value={SUPPORT_INFO.business.phone}
                    href={`tel:${SUPPORT_INFO.business.phone}`}
                  />
                </div>
              </SupportCard>

              {/* AVAILABILITY */}

              <SupportCard
                icon={CheckCircle2}
                eyebrow="Support availability"
                title="We're here when you need us"
                description="General support is available around the clock."
              >
                <div
                  className="
                    flex items-center justify-between
                    rounded-xl bg-gray-50
                    px-3 py-3
                  "
                >
                  <div className="flex items-center gap-2">
                    <Clock3
                      className="h-4 w-4 text-gray-400"
                      strokeWidth={1.8}
                    />

                    <span className="text-[10px] font-semibold text-gray-500">
                      General support
                    </span>
                  </div>

                  <span
                    className="
                      flex items-center gap-1.5
                      text-[10px] font-semibold
                      text-emerald-600
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    24/7
                  </span>
                </div>
              </SupportCard>
            </div>

            {/* SECURITY NOTE */}

            <div className="mt-2">
              <SecurityNote />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SupportPageRegister;