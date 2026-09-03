import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ShieldCheck, Zap, Eye } from 'lucide-react';

const TRUST_POINTS = [
  { icon: ShieldCheck, text: 'Bank-grade encryption on every session' },
  { icon: Zap, text: 'Instant transfers between accounts' },
  { icon: Eye, text: '24/7 fraud monitoring on your card' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // Check if admin using the returned value
      if (result.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  // Check if admin credentials are entered (for debugging)
  const isAdminEmail = email === 'admin@bank.com';

  return (
    <div className="flex min-h-screen bg-white p-6">
      {/* ------------------------------------------------------------------ */}
      {/* Brand panel — hidden below lg                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 px-12 py-14 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold tracking-tight">
          YB
        </div>

        <div className="relative max-w-sm">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Your money, always within reach.
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Sign in to check balances, move money and manage your cards from
            one place.
          </p>

          <ul className="mt-9 space-y-4">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <Icon className="h-4 w-4 shrink-0 text-white/70" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Your Bank. Member FDIC.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Form panel                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-9 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold text-white">
              YB
            </div>
            <span className="text-sm font-semibold text-gray-900">Your Bank</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-950">
            Sign in
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Enter your details to access your account.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border-l-2 border-red-500 bg-red-50 px-4 py-3 text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="john.doe@email.com"
                  />
                  {isAdminEmail && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
                Create one
              </Link>
            </p>


          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;