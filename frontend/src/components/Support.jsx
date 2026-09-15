// src/pages/SupportPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

const SUPPORT_INFO = {
  branch: {
    name: 'Head Office',
    address: '6716 Grade Lane Building 9, Suit 910 Louisville, KY4013',
    hours: 'Monday – Friday · 8:00 AM – 5:00 PM',
  },
  accountOfficer: {
    name: 'Your Account Officer',
    role: 'Relationship Manager',
    email: 'JamesAnderson@trustycreditunion.com',
    phone: '+1(323) 212-0135',
  },
  business: {
    email: 'support@trustycreditunion.com',
    phone: '+1(323) 212-0135',
    hours: 'Available 24/7',
  },
};

/* ================================================================
   CONTACT ITEM
================================================================ */

const ContactItem = ({ icon: Icon, label, value, href }) => {
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

      {children && <div className="mt-4">{children}</div>}
    </section>
  );
};

/* ================================================================
   CHAT SUPPORT CARD (now triggers navigation)
================================================================ */

const ChatSupportCard = ({ onStart }) => {
  return (
    <section
      className="
        flex w-full flex-col overflow-hidden
        rounded-2xl border border-primary-100
        bg-white
        shadow-[0_10px_35px_-20px_rgba(15,23,42,0.25)]
      "
    >
      {/* Accent header */}
      <div
        className="
          relative overflow-hidden
          bg-primary-600
          px-5 py-6
          sm:px-6
        "
      >
        <div
          className="
            absolute -right-8 -top-10
            h-28 w-28 rounded-full
            bg-white/10
          "
        />
        <div
          className="
            absolute -bottom-10 -right-2
            h-20 w-20 rounded-full
            bg-white/5
          "
        />

        <div className="relative">
          <div
            className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl bg-white/15
              text-white ring-1 ring-white/20
            "
          >
            <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              <span
                className="
                  text-[9px] font-bold uppercase
                  tracking-[0.14em] text-white/75
                "
              >
                Recommended
              </span>
            </div>

            <h2
              className="
                mt-2 text-xl font-bold
                leading-tight tracking-tight text-white
              "
            >
              Chat with a representative
            </h2>

            <p
              className="
                mt-2.5 text-xs leading-5
                text-white/70
              "
            >
              Get help directly from your banking
              support team without leaving your
              account.
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-5 py-5 sm:px-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-primary-600"
              strokeWidth={2}
            />
            <span className="text-[11px] font-medium text-gray-600">
              Secure support conversation
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-primary-600"
              strokeWidth={2}
            />
            <span className="text-[11px] font-medium text-gray-600">
              Discuss account and transaction issues
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-primary-600"
              strokeWidth={2}
            />
            <span className="text-[11px] font-medium text-gray-600">
              Get assistance with cards and transfers
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-gray-100 px-5 py-5 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold text-gray-500">
            Support is available
          </span>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="
            group flex w-full items-center
            justify-between rounded-xl
            bg-primary-600 px-4 py-3.5
            text-left text-white
            shadow-sm transition
            hover:bg-primary-700
            active:scale-[0.99]
          "
        >
          <div>
            <p className="text-xs font-bold">Start a conversation</p>
            <p className="mt-0.5 text-[10px] text-white/65">
              Connect with support
            </p>
          </div>
          <div
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg bg-white/10
            "
          >
            <ArrowRight
              className="
                h-4 w-4
                transition-transform
                group-hover:translate-x-0.5
              "
              strokeWidth={1.8}
            />
          </div>
        </button>
      </div>
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
          Keep your banking information secure
        </p>
        <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
          Never share your PIN, password, OTP or full card
          details with anyone, including someone claiming
          to be a support representative.
        </p>
      </div>
    </section>
  );
};

/* ================================================================
   SUPPORT PAGE
================================================================ */

const SupportPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex h-11 w-11 shrink-0
                  items-center justify-center
                  rounded-xl bg-primary-50
                  text-primary-600
                "
              >
                <Headphones className="h-5 w-5" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[9px] font-bold uppercase
                    tracking-[0.15em] text-primary-600
                  "
                >
                  Help & Support
                </p>
                <h1
                  className="
                    mt-0.5 text-xl font-bold
                    tracking-tight text-gray-950
                    sm:text-2xl
                  "
                >
                  Support centre
                </h1>
              </div>
            </div>

            <div
              className="
                flex w-fit items-center gap-2
                rounded-xl border border-gray-200
                bg-white px-3 py-2
              "
            >
              <ShieldCheck
                className="h-3.5 w-3.5 text-emerald-500"
                strokeWidth={1.8}
              />
              <span className="text-[10px] font-semibold text-gray-500">
                Secure banking support
              </span>
            </div>
          </div>

          <p
            className="
              mt-4 max-w-2xl
              text-xs leading-5 text-gray-500
              sm:text-[13px]
            "
          >
            Get assistance with your account, transactions,
            cards and other banking services. Choose the
            support option that works best for you.
          </p>
        </header>

        {/* ========================================================
            MAIN LAYOUT
        ======================================================== */}

        <main className="mx-auto max-w-[1080px]">
          <div
            className="
              grid items-start gap-6
              lg:grid-cols-[minmax(0,1fr)_330px]
            "
          >
            {/* ==================================================
                LEFT — SUPPORT OPTIONS
            ================================================== */}

            <div className="min-w-0">
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
                  description="Visit your branch for in-person assistance."
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

                {/* ACCOUNT OFFICER */}
                <SupportCard
                  icon={UserRound}
                  eyebrow="Personal support"
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

                {/* BUSINESS SUPPORT */}
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
              <div className="mt-4">
                <SecurityNote />
              </div>
            </div>

            {/* ==================================================
                RIGHT — CHAT CARD (navigates to /chat)
            ================================================== */}

            <div className="w-full lg:sticky lg:top-6">
              <ChatSupportCard onStart={() => navigate('/chat')} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SupportPage;