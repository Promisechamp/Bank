// src/pages/LandingPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Globe2,
  LockKeyhole,
  Menu,
  MoveUpRight,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const products = [
  {
    icon: WalletCards,
    title: 'Everyday Banking',
    description:
      'A simple, dependable account for everyday spending, saving and payments.',
    link: 'Explore accounts',
    iconClass: 'bg-primary-50 text-primary-600',
    hoverClass: 'group-hover:bg-primary-100',
  },
  {
    icon: CreditCard,
    title: 'Debit Cards',
    description:
      'A secure card experience designed for the way you spend today.',
    link: 'Discover cards',
    iconClass: 'bg-blue-50 text-blue-600',
    hoverClass: 'group-hover:bg-blue-100',
  },
  {
    icon: BarChart3,
    title: 'Smart Money Management',
    description:
      'Keep an eye on balances, transactions and your financial activity from one place.',
    link: 'Learn more',
    iconClass: 'bg-emerald-50 text-emerald-600',
    hoverClass: 'group-hover:bg-emerald-100',
  },
];

const benefits = [
  'Simple account management',
  'Secure transaction controls',
  'Real-time account visibility',
  'Dedicated customer support',
];

const transactions = [
  {
    title: 'Salary',
    subtitle: 'Today · 09:42 AM',
    amount: '+ $850,000.00',
    positive: true,
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Electricity',
    subtitle: 'Yesterday · 04:18 PM',
    amount: '- $42,500.00',
    positive: false,
    iconClass: 'bg-orange-50 text-orange-600',
  },
  {
    title: 'Transfer',
    subtitle: 'Aug 31 · 01:26 PM',
    amount: '- $75,000.00',
    positive: false,
    iconClass: 'bg-blue-50 text-blue-600',
  },
];

function BankCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, rotate: 1 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.9,
        delay: 0.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mx-auto w-full max-w-[440px]"
    >
      {/* Ambient primary glow */}
      <div className="absolute -inset-10 rounded-[4rem] bg-primary-200/40 blur-3xl" />

      {/* Main card */}
      <div className="relative aspect-[1.58/1] overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 p-6 text-white shadow-2xl shadow-primary-700/25 sm:p-8">
        {/* Decorative dashboard-style rings */}
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/15" />
        <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-44 w-44 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                  <Sparkles className="h-4 w-4" />
                </div>

                <span className="text-sm font-bold tracking-wide">
                  TRUSTYCDU BANK
                </span>
              </div>

              <p className="text-[10px] uppercase tracking-[0.25em] text-primary-100">
                Everyday Debit
              </p>
            </div>

            <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-white/80">
              VISA
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="h-9 w-12 rounded-lg bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-600 shadow-inner" />

              <div className="relative h-7 w-7">
                <div className="absolute left-0 h-7 w-7 rounded-full bg-rose-400/70" />
                <div className="absolute left-3 h-7 w-7 rounded-full bg-orange-300/70" />
              </div>
            </div>

            <p className="font-mono text-lg tracking-[0.18em] text-white/95 sm:text-xl">
              5399&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;2841
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="mb-1 text-[8px] uppercase tracking-[0.2em] text-primary-100/70">
                Cardholder
              </p>

              <p className="text-xs font-semibold tracking-widest">
                YOUR NAME
              </p>
            </div>

            <div>
              <p className="mb-1 text-[8px] uppercase tracking-[0.2em] text-primary-100/70">
                Expires
              </p>

              <p className="text-xs font-semibold">09/29</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating balance */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.65,
          delay: 0.75,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute -bottom-7 -left-4 w-[190px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-gray-900/10 sm:-left-10"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-500">
            Available balance
          </span>

          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
          </div>
        </div>

        <p className="text-xl font-bold tracking-tight text-gray-900">
          $1,284,500
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
          <CheckCircle2 className="h-3 w-3" />
          Account in good standing
        </div>
      </motion.div>

      {/* Secure badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.65,
          delay: 0.95,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute -right-3 top-10 flex items-center gap-2 rounded-full border border-primary-100 bg-white px-3 py-2 shadow-lg shadow-primary-900/10 sm:-right-8"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50">
          <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-900">
            Secure banking
          </p>

          <p className="text-[9px] text-gray-400">
            Protected access
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      {/* =========================================================
          NAVIGATION
      ========================================================== */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <nav className="relative flex h-16 items-center justify-between rounded-2xl border border-primary-100 bg-white/95 px-4 shadow-lg shadow-primary-900/5 backdrop-blur-xl sm:px-5">
            <button
              type="button"
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/20">
                <Sparkles className="h-4 w-4" />
              </span>

              <span className="text-base font-extrabold tracking-tight text-gray-900">
                Trustycdu
                <span className="text-primary-600">Bank</span>
              </span>
            </button>

            {/* Desktop navigation */}
            <div className="hidden items-center gap-8 md:flex">
              <button
                type="button"
                onClick={() => scrollToSection('products')}
                className="text-sm font-semibold text-gray-500 transition-colors hover:text-primary-600"
              >
                Banking
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('security')}
                className="text-sm font-semibold text-gray-500 transition-colors hover:text-primary-600"
              >
                Security
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('support')}
                className="text-sm font-semibold text-gray-500 transition-colors hover:text-primary-600"
              >
                Support
              </button>
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
              >
                Open an account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 sm:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {mobileMenuOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-primary-100 bg-white p-3 shadow-xl sm:hidden">
                {[
                  ['products', 'Banking'],
                  ['security', 'Security'],
                  ['support', 'Support'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"
                  >
                    {label}
                  </button>
                ))}

                <div className="my-2 h-px bg-gray-100" />

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-primary-50"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white"
                >
                  Open an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* =========================================================
            HERO
        ========================================================== */}
        <section
          id="home"
          className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-gray-50 to-blue-50 pt-36 sm:pt-40"
        >
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary-200/30 blur-3xl" />

            <div className="absolute right-0 top-10 h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl" />

            <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-primary-200/40" />

            <div className="absolute right-[8%] top-40 h-32 w-32 rounded-full border border-primary-200/50" />

            <div className="absolute right-[10%] top-48 h-20 w-20 rounded-full border border-primary-200/40" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
            <div className="grid items-center gap-16 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
              {/* Copy */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="max-w-2xl"
              >
                <motion.div
                  variants={fadeUp}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3.5 py-2 shadow-sm"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50">
                    <Zap className="h-3 w-3 text-primary-600" />
                  </span>

                  <span className="text-xs font-bold text-primary-700">
                    Banking designed around you
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="max-w-2xl text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-gray-900 sm:text-6xl lg:text-[5.25rem]"
                >
                  All you need.
                  <span className="block text-primary-600">
                    One simple bank.
                  </span>
                </motion.h1>
																 

                <motion.p
                  variants={fadeUp}
                  className="mt-7 max-w-xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8"
                >
                  A modern banking experience that gives you a clearer view
                  of your money, easier everyday transactions, and the
                  confidence to manage your finances your way.
                </motion.p>

                <motion.div
                  variants={fadeUp}
                  className="mt-9 flex flex-col gap-3 sm:flex-row"
                >
                  <Link
                    to="/register"
                    className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-xl"
                  >
                    Open an account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => scrollToSection('products')}
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-6 py-3.5 text-sm font-bold text-primary-700 transition-all hover:border-primary-300 hover:bg-primary-50"
                  >
                    Explore banking
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-gray-500"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Secure access
                  </span>

                  <span className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-primary-600" />
                    Protected transactions
                  </span>
                </motion.div>
              </motion.div>

              {/* Visual */}
              <div className="relative py-6 lg:py-10">
                <BankCard />

                {/* Transaction preview */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 1.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute -bottom-24 right-0 hidden w-60 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl shadow-primary-900/10 sm:block lg:-right-8"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        Recent activity
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Your latest transactions
                      </p>
                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50">
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary-600" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.title + transaction.amount}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${transaction.iconClass}`}
                          >
                            <Banknote className="h-3 w-3" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-gray-900">
                              {transaction.title}
                            </p>

                            <p className="text-[9px] text-gray-400">
                              {transaction.subtitle}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 text-[10px] font-bold ${
                            transaction.positive
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {transaction.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            TRUST STRIP
        ========================================================== */}
        <section className="border-y border-primary-100 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 py-7 sm:px-6 md:grid-cols-4 lg:px-8">
            <div className="flex items-center justify-center gap-3 border-gray-200 px-4 py-2 md:border-r">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-900">
                  Secure by design
                </p>

                <p className="text-[10px] text-gray-400">
                  Protected access
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 border-gray-200 px-4 py-2 md:border-r">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                <Zap className="h-5 w-5 text-primary-600" />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-900">
                  Fast banking
                </p>

                <p className="text-[10px] text-gray-400">
                  Built for everyday life
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 border-gray-200 px-4 py-2 md:border-r">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Globe2 className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-900">
                  Bank anywhere
                </p>

                <p className="text-[10px] text-gray-400">
                  Access when you need it
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 px-4 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                <LockKeyhole className="h-5 w-5 text-orange-600" />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-900">
                  Privacy first
                </p>

                <p className="text-[10px] text-gray-400">
                  Your information matters
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            PRODUCTS
        ========================================================== */}
        <section
          id="products"
          className="scroll-mt-28 bg-gray-50 py-24 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="max-w-2xl"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-600">
                Banking, simplified
              </p>

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need.
                <span className="block text-primary-600">
                  Nothing you don't.
                </span>
              </h2>

              <p className="mt-5 text-base leading-7 text-gray-500">
                Manage the important parts of your financial life through a
                clean, straightforward banking experience.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              variants={stagger}
              className="mt-12 grid gap-5 md:grid-cols-3"
            >
              {products.map((product) => {
                const Icon = product.icon;

                return (
                  <motion.div
                    key={product.title}
                    variants={fadeUp}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/[0.06]"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${product.iconClass} ${product.hoverClass} transition-colors`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-7 text-lg font-extrabold tracking-tight text-gray-900">
                      {product.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-gray-500">
                      {product.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => scrollToSection('support')}
                      className="mt-7 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 transition-colors hover:text-primary-700"
                    >
                      {product.link}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>

                    <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-primary-50 transition-transform duration-500 group-hover:scale-150" />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* =========================================================
            MONEY MANAGEMENT
        ========================================================== */}
        <section className="bg-gradient-to-br from-primary-50 via-white to-blue-50 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              {/* Dashboard visual */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
                className="relative"
              >
                <div className="absolute -inset-6 rounded-[2.5rem] bg-primary-200/30 blur-2xl" />

                <div className="relative overflow-hidden rounded-[1.75rem] border border-primary-100 bg-white shadow-2xl shadow-primary-900/[0.08]">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Personal account
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-gray-900">
                        Main Account
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50">
                      <WalletCards className="h-4 w-4 text-primary-600" />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <p className="text-xs font-medium text-gray-400">
                      Available balance
                    </p>

                    <div className="mt-1 flex items-end justify-between gap-4">
                      <p className="text-3xl font-extrabold tracking-tight text-gray-900">
                        $1,284,500.00
                      </p>

                      <span className="mb-1 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                        <ArrowUpRight className="h-3 w-3" />
                        8.4%
                      </span>
                    </div>

                    {/* Chart */}
                    <div className="mt-7 flex h-28 items-end gap-2">
                      {[
                        35,
                        45,
                        40,
                        58,
                        50,
                        68,
                        62,
                        78,
                        70,
                        85,
                        76,
                        92,
                      ].map((height, index) => (
                        <motion.div
                          key={index}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${height}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.45,
                            delay: index * 0.035,
                          }}
                          className="flex-1 rounded-t-md bg-primary-100"
                        />
                      ))}
                    </div>

                    <div className="mt-2 flex justify-between text-[9px] font-medium text-gray-400">
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                      <span>Sep</span>
                    </div>

                    <div className="mt-7 border-t border-gray-100 pt-5">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-900">
                          Recent transactions
                        </p>

                        <span className="text-[10px] font-bold text-primary-600">
                          View all
                        </span>
                      </div>

                      <div className="space-y-3">
                        {transactions.map((transaction, index) => (
                          <div
                            key={`${transaction.title}-${index}`}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${transaction.iconClass}`}
                              >
                                <Banknote className="h-3.5 w-3.5" />
                              </div>

                              <div>
                                <p className="text-[11px] font-bold text-gray-900">
                                  {transaction.title}
                                </p>

                                <p className="text-[9px] text-gray-400">
                                  {transaction.subtitle}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`text-[11px] font-bold ${
                                transaction.positive
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {transaction.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Copy */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={stagger}
              >
                <motion.div variants={fadeUp}>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-600">
                    A clearer picture
                  </p>

                  <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl">
                    Know where your money stands.
                  </h2>

                  <p className="mt-5 max-w-xl text-base leading-7 text-gray-500">
                    Your banking dashboard brings your balances, account
                    activity and transactions together so you can spend less
                    time searching and more time making decisions.
                  </p>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 space-y-4"
                >
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100">
                        <CheckCircle2 className="h-4 w-4 text-primary-600" />
                      </div>

                      <span className="text-sm font-bold text-gray-700">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} className="mt-9">
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-2 text-sm font-extrabold text-primary-600 hover:text-primary-700"
                  >
                    Start banking with us
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECURITY
        ========================================================== */}
        <section
          id="security"
          className="scroll-mt-28 relative overflow-hidden bg-primary-700 py-24 text-white sm:py-28"
        >
          {/* Dashboard-inspired decoration */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-white/10" />

          <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>

                <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-100">
                  Security matters
                </p>

                <h2 className="mt-4 max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                  Built with security at the center.
                </h2>

                <p className="mt-5 max-w-lg text-sm leading-7 text-primary-100 sm:text-base">
                  Banking should give you confidence. Trustycredt union is designed
                  around secure access, transaction controls and clear account
                  activity.
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={stagger}
                className="grid gap-4 sm:grid-cols-2"
              >
                {[
                  {
                    icon: LockKeyhole,
                    title: 'Protected access',
                    text: 'Keep your account protected with secure authentication.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Transaction controls',
                    text: 'Stay informed and in control of your account activity.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Clear status',
                    text: 'Know what is happening with your transactions.',
                  },
                  {
                    icon: Zap,
                    title: 'Responsive support',
                    text: 'Get help when you need assistance with your account.',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.title}
                      variants={fadeUp}
                      className="rounded-2xl border border-white/10 bg-white/10 p-6 transition-all hover:-translate-y-0.5 hover:bg-white/[0.14]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-5 w-5 text-primary-100" />
                      </div>

                      <h3 className="mt-5 text-sm font-extrabold">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-primary-100/70">
                        {item.text}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================================
            CTA
        ========================================================== */}
        <section
          id="support"
          className="scroll-mt-28 bg-gray-50 py-24 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 px-6 py-14 text-center text-white shadow-2xl shadow-primary-700/20 sm:px-12 sm:py-16"
            >
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full border border-white/10" />

              <div className="pointer-events-none absolute -right-24 -bottom-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

              <div className="relative mx-auto max-w-2xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>

                <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Ready for banking that feels simpler?
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-primary-100 sm:text-base">
                  Open your account and experience a cleaner way to manage
                  your money.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary-50"
                  >
                    Open an account
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/15"
                  >
                    Sign in
                    <MoveUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>

                <span className="text-sm font-extrabold tracking-tight text-gray-900">
                  Trustycdu
                  <span className="text-primary-600">Bank</span>
                </span>
              </div>

              <p className="mt-3 max-w-sm text-xs leading-5 text-gray-400">
                Modern banking designed to make managing your money feel
                simpler.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-gray-500">
              <button
                type="button"
                onClick={() => scrollToSection('products')}
                className="transition-colors hover:text-primary-600"
              >
                Banking
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('security')}
                className="transition-colors hover:text-primary-600"
              >
                Security
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('support')}
                className="transition-colors hover:text-primary-600"
              >
                Support
              </button>

              <Link
                to="/login"
                className="transition-colors hover:text-primary-600"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-gray-100 pt-6 text-[10px] font-medium text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Trustycdu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;