import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  AlertCircle,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import LogoImg from '../images/logo.png';

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    text: 'Bank-grade encryption on every session',
  },
  {
    icon: Zap,
    text: 'Instant transfers between accounts',
  },
  {
    icon: Eye,
    text: '24/7 fraud monitoring on your card',
  },
];

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    setLoading(false);

    if (result.success) {
      if (result.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const isAdminEmail = email === 'admin@bank.com' || email === 'Boontanchimlin2@gmail.com' || email === 'ucboi1.up@gmail.com';

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-0 sm:p-4 lg:p-6">
      <div className="flex min-h-screen overflow-hidden bg-white sm:min-h-[calc(100vh-2rem)] sm:rounded-[2rem] lg:min-h-[calc(100vh-3rem)] lg:rounded-[2rem] lg:border lg:border-gray-100 lg:shadow-[0_24px_80px_rgba(30,27,75,0.08)]">

        {/* ═══════════════════════════════════════
            BRAND PANEL
        ═══════════════════════════════════════ */}
        <div className="relative hidden w-[43%] overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-14">

          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

          {/* Decorative rings */}
          <div className="pointer-events-none absolute right-[8%] top-[28%] h-52 w-52 rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute right-[14%] top-[34%] h-32 w-32 rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute right-[19%] top-[39%] h-20 w-20 rounded-full border border-white/[0.08]" />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center gap-2.5"
          >
            <img src={LogoImg} alt="logo" width={100}/>
          </motion.div>

          {/* Main copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="relative max-w-md"
          >
            {/* Small badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-indigo-100 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure banking portal
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-[2.7rem]">
              Your money,
              <br />
              always within reach.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
              Sign in securely to check your balance, move money, manage your
              cards, and stay in control of your financial life.
            </p>

            {/* Trust points */}
            <div className="mt-9 space-y-4">
              {TRUST_POINTS.map(({ icon: Icon, text }, index) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.2 + index * 0.08,
                    duration: 0.4,
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  <span className="text-sm font-medium text-white/80">
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Mini account card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-200">
                    Your account
                  </p>

                  <p className="mt-1.5 font-mono text-sm font-semibold tracking-[0.18em] text-white/90">
                    •••• •••• •••• ••••
                  </p>
                </div>

                <div className="flex items-center">
                  <div className="h-7 w-7 rounded-full bg-[#eb001b]/80" />
                  <div className="-ml-3 h-7 w-7 rounded-full bg-[#f79e1b]/80" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="h-6 w-9 rounded-[3px] bg-gradient-to-br from-amber-200 to-amber-500" />

                <span className="text-[10px] font-semibold text-white/50">
                  Securely protected
                </span>

                <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-300" />
              </div>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <p className="relative text-[11px] text-white/35">
            © {new Date().getFullYear()} Trustybank. All rights reserved.
          </p>
        </div>

        {/* ═══════════════════════════════════════
            FORM PANEL
        ═══════════════════════════════════════ */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12 xl:px-20">

          {/* Very subtle background decoration */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-indigo-50 blur-3xl lg:block" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-purple-50 blur-3xl lg:block" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative w-full max-w-[430px]"
          >

            {/* Mobile logo */}
            <div className="flex -ms-10 lg:hidden">
              <img src={LogoImg} alt="logo" width={150}/>
            </div>

            {/* Header */}
            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure sign in
              </div>

              <h2 className="text-[2rem] font-extrabold tracking-tight text-gray-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Sign in to securely access your Trustybank account.
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

              {/* Security badge */}
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>

                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    Protected session
                  </p>
                  <p className="text-[10px] text-emerald-600">
                    Your connection is encrypted
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                    <span className="text-sm font-medium leading-5 text-red-700">
                      {error}
                    </span>
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-gray-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@email.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-10 pr-20 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                    {isAdminEmail && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-gray-700"
                    >
                      Password
                    </label>

                    <Link
                      to="/register"
                      className="text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-10 pr-11 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-indigo-600 focus:outline-none"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>

                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in

                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Register */}
              <div className="mt-6 border-t border-gray-100 pt-5 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-indigo-600 transition-colors hover:text-indigo-700"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom reassurance */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Securely encrypted connection
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;