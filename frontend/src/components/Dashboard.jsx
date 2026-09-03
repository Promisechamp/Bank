// src/pages/LandingPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Menu,
  PiggyBank,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Wallet,
    title: 'One clear view',
    description:
      'See your accounts, balances, activity, and spending in one simple dashboard.',
    iconClass: 'bg-primary-50 text-primary-600',
  },
  {
    icon: Send,
    title: 'Move money easily',
    description:
      'Transfer money between accounts or send funds with a straightforward experience.',
    iconClass: 'bg-blue-50 text-blue-600',
  },
  {
    icon: PiggyBank,
    title: 'Build better habits',
    description:
      'Keep an eye on your savings and understand where your money is going.',
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Security first',
    description:
      'Your banking experience is designed around account protection and secure access.',
    iconClass: 'bg-amber-50 text-amber-600',
  },
];

const services = [
  {
    icon: Wallet,
    title: 'Everyday banking',
    description: 'Manage your everyday account and stay on top of your balance.',
    color: 'primary',
    className: 'bg-primary-50 text-primary-600',
  },
  {
    icon: PiggyBank,
    title: 'Savings',
    description: 'Put money aside and keep your savings goals visible.',
    color: 'emerald',
    className: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Handle bills and payments without unnecessary complexity.',
    color: 'orange',
    className: 'bg-orange-50 text-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Financial insights',
    description: 'Understand your income, spending, and financial activity.',
    color: 'blue',
    className: 'bg-blue-50 text-blue-600',
  },
];

const transactions = [
  {
    title: 'Salary',
    date: 'Today',
    amount: '+ ₦450,000',
    icon: ArrowUpRight,
    iconClass: 'bg-emerald-50 text-emerald-600',
    amountClass: 'text-emerald-600',
  },
  {
    title: 'Electricity Bill',
    date: 'Yesterday',
    amount: '- ₦28,500',
    icon: Zap,
    iconClass: 'bg-orange-50 text-orange-600',
    amountClass: 'text-gray-900',
  },
  {
    title: 'Transfer',
    date: 'Aug 30',
    amount: '- ₦75,000',
    icon: Send,
    iconClass: 'bg-blue-50 text-blue-600',
    amountClass: 'text-gray-900',
  },
];

const faqs = [
  {
    question: 'Is this a real bank?',
    answer:
      'This is a demonstration banking platform designed to showcase a modern digital banking experience.',
  },
  {
    question: 'Can I create an account?',
    answer:
      'Yes. You can use the registration flow to create a demo account and explore the banking dashboard.',
  },
  {
    question: 'Can I transfer money?',
    answer:
      'The platform supports simulated banking transactions so you can explore the complete experience safely.',
  },
  {
    question: 'How is my account protected?',
    answer:
      'The interface includes secure authentication, protected account access, transaction verification, and security-focused workflows.',
  },
];

function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`mx-auto max-w-2xl text-center ${
        light ? 'text-white' : ''
      }`}
    >
      <p
        className={`mb-3 text-sm font-bold uppercase tracking-[0.16em] ${
          light ? 'text-primary-100' : 'text-primary-600'
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
          light ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h2>

      <p
        className={`mt-4 text-base leading-7 sm:text-lg ${
          light ? 'text-primary-100' : 'text-gray-500'
        }`}
      >
        {description}
      </p>
    </motion.div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      {/* Decorative glow */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-300/20 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm"
      >
        <div className="overflow-hidden rounded-xl bg-gray-50 shadow-xl">
          {/* Fake browser/header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="hidden h-7 w-36 rounded-lg bg-gray-100 sm:block" />

            <div className="h-8 w-8 rounded-full bg-primary-50" />
          </div>

          <div className="p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                Overview
              </p>
              <div className="mt-1 h-5 w-36 rounded bg-gray-200" />
            </div>

            {/* Balance */}
            <div className="relative overflow-hidden rounded-2xl bg-primary-600 p-5 text-white shadow-lg">
              <div className="absolute -right-8 -top-12 h-28 w-28 rounded-full border border-white/10" />
              <div className="absolute -right-3 -top-7 h-20 w-20 rounded-full border border-white/10" />

              <p className="text-xs text-primary-100">Total balance</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">
                ₦1,284,500.00
              </p>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-primary-100">Primary account</p>
                  <p className="mt-1 text-xs font-semibold">•••• 4821</p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                ['Deposit', 'bg-emerald-50 text-emerald-600', ArrowUpRight],
                ['Transfer', 'bg-blue-50 text-blue-600', Send],
                ['Bills', 'bg-orange-50 text-orange-600', Zap],
                ['Withdraw', 'bg-rose-50 text-rose-600', ArrowUpRight],
              ].map(([label, classes, Icon]) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-200 bg-white p-2 text-center"
                >
                  <div
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg ${classes}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-1.5 truncate text-[9px] font-semibold text-gray-600">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-900">Recent activity</p>
                <p className="text-[10px] font-semibold text-primary-600">
                  View all
                </p>
              </div>

              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const Icon = transaction.icon;

                  return (
                    <div
                      key={transaction.title}
                      className="flex items-center gap-2.5"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${transaction.iconClass}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold text-gray-800">
                          {transaction.title}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          {transaction.date}
                        </p>
                      </div>

                      <p
                        className={`text-[10px] font-bold ${transaction.amountClass}`}
                      >
                        {transaction.amount}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating security card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75 }}
        className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-xl sm:flex"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-bold text-gray-900">Secure session</p>
          <p className="mt-0.5 text-[10px] text-gray-500">
            Your account is protected
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-primary-700/95 text-white shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <button
            onClick={() => scrollTo('home')}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>

            <span className="text-lg font-extrabold tracking-tight">
              YourBank
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            <button
              onClick={() => scrollTo('features')}
              className="text-sm font-semibold text-primary-100 transition hover:text-white"
            >
              Features
            </button>

            <button
              onClick={() => scrollTo('services')}
              className="text-sm font-semibold text-primary-100 transition hover:text-white"
            >
              Banking
            </button>

            <button
              onClick={() => scrollTo('security')}
              className="text-sm font-semibold text-primary-100 transition hover:text-white"
            >
              Security
            </button>

            <button
              onClick={() => scrollTo('faq')}
              className="text-sm font-semibold text-primary-100 transition hover:text-white"
            >
              FAQ
            </button>
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary-700 shadow-sm transition hover:bg-primary-50"
            >
              Get started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-primary-700 px-4 pb-4 md:hidden"
          >
            <div className="space-y-1 pt-3">
              {[
                ['Features', 'features'],
                ['Banking', 'services'],
                ['Security', 'security'],
                ['FAQ', 'faq'],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="block w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-primary-100 hover:bg-white/10 hover:text-white"
                >
                  {label}
                </button>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link
                  to="/login"
                  className="rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-bold"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-primary-700"
                >
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <main id="home">
        <section className="relative overflow-hidden bg-primary-600 pt-28 text-white">
          {/* Decorative dashboard-inspired rings */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full border border-white/5" />

          <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
            <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              {/* Hero copy */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="max-w-xl"
              >
                <motion.div
                  variants={fadeUp}
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-primary-100 backdrop-blur-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Banking made clearer
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
                >
                  Your money.
                  <br />
                  <span className="text-primary-100">Your way.</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="mt-6 max-w-lg text-base leading-7 text-primary-100 sm:text-lg sm:leading-8"
                >
                  A modern banking experience designed to make managing,
                  moving, and understanding your money feel simple.
                </motion.p>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex flex-col gap-3 sm:flex-row"
                >
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-extrabold text-primary-700 shadow-lg transition hover:bg-primary-50"
                  >
                    Get started
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>

                  <button
                    onClick={() => scrollTo('features')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
                  >
                    Explore features
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-primary-100"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                    Simple account management
                  </div>

                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                    Secure access
                  </div>
                </motion.div>
              </motion.div>

              {/* Preview */}
              <DashboardPreview />
            </div>
          </div>

          {/* Hero bottom wave */}
          <div className="h-8 bg-gray-50 [clip-path:ellipse(60%_100%_at_50%_100%)] sm:h-12" />
        </section>

        {/* =========================================================
            TRUST / VALUE STRIP
        ========================================================= */}
        <section className="border-b border-gray-200 bg-gray-50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-200 px-4 py-6 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              ['01', 'Simple', 'Clean banking experience'],
              ['02', 'Secure', 'Protection built in'],
              ['03', 'Flexible', 'Accounts that fit your needs'],
              ['04', 'Connected', 'Everything in one place'],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="px-4 py-2 first:pl-0 last:pr-0 sm:px-6"
              >
                <p className="text-[10px] font-bold tracking-widest text-primary-600">
                  {number}
                </p>
                <p className="mt-1 text-sm font-extrabold text-gray-900">
                  {title}
                </p>
                <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            FEATURES
        ========================================================= */}
        <section id="features" className="scroll-mt-20 bg-gray-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="A better banking experience"
              title="Everything you need, without the clutter."
              description="Your dashboard should help you understand your money at a glance. Every part of the experience is designed around that idea."
            />

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-md"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 text-base font-extrabold text-gray-900">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {feature.description}
                    </p>

                    <div className="mt-5 flex items-center gap-1 text-xs font-bold text-primary-600 opacity-0 transition group-hover:opacity-100">
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* =========================================================
            PRODUCT / SERVICES
        ========================================================= */}
        <section
          id="services"
          className="scroll-mt-20 border-y border-gray-200 bg-white py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <SectionHeading
                eyebrow="Banking that works for you"
                title="More than just a balance."
                description="Manage everyday finances, save for what matters, make payments, and understand your financial activity from one place."
              />

              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                {services.map((service) => {
                  const Icon = service.icon;

                  return (
                    <motion.div
                      key={service.title}
                      variants={fadeUp}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition hover:border-primary-200 hover:bg-white hover:shadow-sm"
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${service.className}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <h3 className="mt-4 text-sm font-extrabold text-gray-900">
                        {service.title}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {service.description}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FINANCIAL SNAPSHOT
        ========================================================= */}
        <section className="bg-gray-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-gradient-to-br from-primary-50 via-white to-blue-50 p-7 sm:p-10">
                  <p className="text-sm font-bold uppercase tracking-wider text-primary-600">
                    Financial snapshot
                  </p>

                  <h2 className="mt-3 max-w-md text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                    Know where your money is going.
                  </h2>

                  <p className="mt-4 max-w-md text-sm leading-6 text-gray-500">
                    Clear summaries help turn financial activity into
                    information you can actually use.
                  </p>

                  <Link
                    to="/register"
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
                  >
                    Explore your dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                      <p className="mt-4 text-xs font-semibold text-gray-500">
                        Income
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-gray-900">
                        ₦450k
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <p className="mt-4 text-xs font-semibold text-gray-500">
                        Spending
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-gray-900">
                        ₦132k
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <PiggyBank className="h-4 w-4" />
                      </div>
                      <p className="mt-4 text-xs font-semibold text-gray-500">
                        Saved
                      </p>
                      <p className="mt-1 text-lg font-extrabold text-gray-900">
                        ₦318k
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          Monthly savings goal
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          ₦318,000 of ₦400,000
                        </p>
                      </div>

                      <p className="text-xs font-extrabold text-primary-600">
                        79.5%
                      </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-primary-600"
                        style={{ width: '79.5%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECURITY
        ========================================================= */}
        <section
          id="security"
          className="scroll-mt-20 bg-primary-700 py-20 text-white sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="h-7 w-7 text-emerald-300" />
                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-primary-100">
                  Security matters
                </p>

                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Banking should feel secure, not complicated.
                </h2>

                <p className="mt-5 max-w-lg text-sm leading-7 text-primary-100 sm:text-base">
                  From account access to transaction verification, security is
                  part of the experience rather than something hidden away.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: Lock,
                    title: 'Protected access',
                    description: 'Secure authentication for your account.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Transaction checks',
                    description: 'Important actions can require verification.',
                  },
                  {
                    icon: Bell,
                    title: 'Activity awareness',
                    description: 'Stay informed about important account activity.',
                  },
                  {
                    icon: Eye,
                    title: 'Clear visibility',
                    description: 'Know what is happening with your money.',
                  },
                ].map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 text-primary-100" />
                    </div>

                    <h3 className="mt-4 text-sm font-extrabold">{title}</h3>

                    <p className="mt-2 text-xs leading-5 text-primary-100">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            MOBILE / ACCESS
        ========================================================= */}
        <section className="bg-gray-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl bg-primary-600 shadow-lg">
              <div className="relative grid items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-14">
                <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full border border-white/5" />

                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                    <Smartphone className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 max-w-xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Your banking experience, wherever you are.
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-primary-100">
                    Access your account, check activity, and stay in control
                    without making banking feel like work.
                  </p>
                </div>

                <Link
                  to="/register"
                  className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-extrabold text-primary-700 shadow-md transition hover:bg-primary-50"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            FAQ
        ========================================================= */}
        <section
          id="faq"
          className="scroll-mt-20 border-t border-gray-200 bg-white py-20 sm:py-24"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Questions"
              title="Frequently asked questions."
              description="A few quick answers before you get started."
            />

            <div className="mt-10 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={faq.question}
                    className={`overflow-hidden rounded-xl border bg-white transition ${
                      isOpen
                        ? 'border-primary-200 shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-bold text-gray-900">
                        {faq.question}
                      </span>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                          isOpen ? 'rotate-180 text-primary-600' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5">
                        <p className="text-sm leading-6 text-gray-500">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
        ========================================================= */}
        <section className="bg-gray-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-primary-600 px-6 py-12 text-center shadow-lg sm:px-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Wallet className="h-6 w-6 text-white" />
            </div>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to take control of your money?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-primary-100 sm:text-base">
              Create your account and experience a cleaner, simpler approach
              to digital banking.
            </p>

            <Link
              to="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-extrabold text-primary-700 shadow-md transition hover:bg-primary-50"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                  <Wallet className="h-5 w-5" />
                </div>

                <span className="text-base font-extrabold text-gray-900">
                  YourBank
                </span>
              </div>

              <p className="mt-3 max-w-sm text-xs leading-5 text-gray-500">
                A modern banking experience built around clarity, simplicity,
                and control.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-gray-500">
              <button
                onClick={() => scrollTo('features')}
                className="transition hover:text-primary-600"
              >
                Features
              </button>

              <button
                onClick={() => scrollTo('services')}
                className="transition hover:text-primary-600"
              >
                Banking
              </button>

              <button
                onClick={() => scrollTo('security')}
                className="transition hover:text-primary-600"
              >
                Security
              </button>

              <button
                onClick={() => scrollTo('faq')}
                className="transition hover:text-primary-600"
              >
                FAQ
              </button>

              <Link
                to="/login"
                className="transition hover:text-primary-600"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-[11px] text-gray-400">
              © {new Date().getFullYear()} YourBank. Demo banking platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;