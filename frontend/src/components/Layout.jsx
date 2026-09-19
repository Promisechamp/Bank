import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';
import {
  LayoutDashboard,
  Wallet,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Send,
  User,
  LogOut,
  Bell,
  CheckCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  LockKeyhole,
  HelpCircle,
  MoreHorizontal,
  Menu,
  MessagesSquare,
} from 'lucide-react';
import { formatDate } from '../utils/helpers';
import LogoImg from '../images/logo.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);

  // ------------------------------------------------------------
  // NAVIGATION
  // ------------------------------------------------------------
  const primaryNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/accounts', icon: Wallet, label: 'Accounts' },
    { to: '/transactions', icon: History, label: 'Transactions' },
  ];

  const transferNavItems = [
    { to: '/deposit', icon: ArrowDownCircle, label: 'Deposit' },
    { to: '/withdraw', icon: ArrowUpCircle, label: 'Withdraw' },
    { to: '/transfer', icon: Send, label: 'Transfer' },
  ];

  const secondaryNavItems = [
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/support', icon: MessagesSquare, label: 'Support' },
  ];

  // ------------------------------------------------------------
  // ACTIVE ROUTE
  // ------------------------------------------------------------
  const isActiveRoute = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  // ------------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------------
  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  // ------------------------------------------------------------
  // CLOSE PROFILE ON OUTSIDE CLICK
  // ------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ------------------------------------------------------------
  // LOCK BODY SCROLL ON MOBILE MENU
  // ------------------------------------------------------------
  useEffect(() => {
    if (isMobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ------------------------------------------------------------
  // NAV ITEMS
  // ------------------------------------------------------------
  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActiveRoute(item.to);
    return (
      <Link
        to={item.to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`
          group flex items-center gap-3 rounded-xl px-3 py-2.5
          text-sm font-medium transition-all duration-150
          ${
            active
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <Icon
          className={`
            h-[18px] w-[18px] shrink-0
            ${
              active
                ? 'text-primary-600'
                : 'text-gray-400 group-hover:text-gray-600'
            }
          `}
        />
        <span>{item.label}</span>
        {active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600" />
        )}
      </Link>
    );
  };

  const MobileNavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActiveRoute(item.to);
    return (
      <Link
        to={item.to}
        className={`
          relative flex min-w-0 flex-1 flex-col items-center
          justify-center gap-1 py-2
          ${active ? 'text-primary-600' : 'text-gray-400'}
        `}
      >
        <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
        <span className={`text-[10px] font-medium ${active ? 'text-primary-600' : 'text-gray-500'}`}>
          {item.label}
        </span>
        {active && (
          <span className="absolute -bottom-0.5 h-0.5 w-5 rounded-full bg-primary-600" />
        )}
      </Link>
    );
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
              aria-label="Open navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="-ms-5">
                <img src={LogoImg} alt="logo" className="h-[50px] w-[90px]"/>
              </div>
              <div className="hidden sm:block">
                <p className="text-[15px] font-bold leading-none tracking-tight text-gray-900">Bank</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Personal banking
                </p>
              </div>
            </Link>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Security badge */}
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 lg:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-gray-600">Secure</span>
            </div>

            {/* NOTIFICATIONS COMPONENT */}
            <Notifications />

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((open) => !open)}
                className={`
                  flex items-center gap-2 rounded-lg p-1.5 transition
                  ${isProfileOpen ? 'bg-gray-100' : 'hover:bg-gray-100'}
                `}
              >
                {/* ✅ Profile Image with fallback */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 overflow-hidden">
                  {user?.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={user.full_name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user?.full_name
                      ? user.full_name
                          .split(' ')
                          .map((name) => name[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U'
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[120px] truncate text-xs font-semibold text-gray-800">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-400">Personal account</p>
                </div>
                <ChevronRight
                  className={`
                    hidden h-3.5 w-3.5 text-gray-400 transition-transform sm:block
                    ${isProfileOpen ? 'rotate-90' : ''}
                  `}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-4">
                    <div className="flex items-center gap-3">
                      {/* ✅ Profile Image in dropdown */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 overflow-hidden">
                        {user?.profile_image ? (
                          <img 
                            src={user.profile_image} 
                            alt={user.full_name || 'User'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user?.full_name
                            ? user.full_name
                                .split(' ')
                                .map((name) => name[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()
                            : 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user?.full_name || 'User'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {user?.email || 'Personal banking'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/security');
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <LockKeyhole className="h-4 w-4 text-gray-400" />
                      Security config
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/support');
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      Help & support
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[230px] shrink-0 border-r border-gray-200 bg-white md:block">
          <div className="flex h-full flex-col">
            <nav className="flex-1 overflow-y-auto px-3 py-5">
              <div>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Overview</p>
                <div className="space-y-0.5">
                  {primaryNavItems.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </div>
              </div>
              <div className="mt-7">
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Move money</p>
                <div className="space-y-0.5">
                  {transferNavItems.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </div>
              </div>
              <div className="mt-7">
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Account</p>
                <div className="space-y-0.5">
                  {secondaryNavItems.map((item) => (
                    <NavItem key={item.to} item={item} />
                  ))}
                </div>
              </div>
            </nav>
            <div className="border-t border-gray-100 p-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-700">Account protected</p>
                    <p className="text-[10px] text-gray-400">Secure connection</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/security')}
                  className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary-600 hover:text-primary-700"
                >
                  Security config <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Side Menu */}
        <div
          className={`
            fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-[2px]
            transition-opacity duration-300 ease-out md:hidden
            ${isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}
          `}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[85%]
            max-w-[300px] flex-col overflow-y-auto border-r
            border-gray-200 bg-white shadow-2xl transition-transform
            duration-300 ease-out md:hidden
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4">
            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5">
              <div className="flex">
                <img src={LogoImg} alt="logo" className="h-[50px] w-[90px]"/>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              {/* ✅ Profile Image in mobile menu */}
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 overflow-hidden">
                  {user?.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={user.full_name || 'User'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user?.full_name
                      ? user.full_name
                          .split(' ')
                          .map((name) => name[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-400">Welcome back</p>
                  <p className="truncate text-sm font-bold text-gray-900">{user?.full_name || 'User'}</p>
                </div>
              </div>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Overview</p>
              <div className="space-y-0.5">
                {primaryNavItems.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
              <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Move money</p>
              <div className="space-y-0.5">
                {transferNavItems.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
              <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Account</p>
              <div className="space-y-0.5">
                {secondaryNavItems.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-primary-50 p-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary-600" />
                  <p className="text-xs font-semibold text-primary-800">Banking on the go</p>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-primary-700/70">
                  Download our mobile app for easier access to your account.
                </p>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/download-app');
                  }}
                  className="mt-3 text-xs font-semibold text-primary-600"
                >
                  Get the app →
                </button>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-100 pt-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 md:px-8 md:py-7 md:pb-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_15px_rgba(0,0,0,0.04)] backdrop-blur md:hidden">
        <div className="mx-auto flex h-[68px] max-w-lg items-center px-2">
          <MobileNavItem item={primaryNavItems[0]} />
          <MobileNavItem item={primaryNavItems[1]} />
          <div className="flex min-w-0 flex-1 justify-center">
            <Link
              to="/transfer"
              aria-label="Transfer"
              className="
                group relative -mt-14 flex h-14 w-14 items-center justify-center
                rounded-full bg-primary-600 text-white
                shadow-[0_6px_0_#3730a3,0_10px_18px_rgba(79,70,229,0.30)]
                transition-all duration-150 ease-out
                hover:-translate-y-1 hover:bg-primary-500
                hover:shadow-[0_8px_0_#3730a3,0_14px_24px_rgba(79,70,229,0.35)]
                active:translate-y-[4px]
                active:shadow-[0_2px_0_#3730a3,0_5px_10px_rgba(79,70,229,0.25)]
              "
            >
              <span className="pointer-events-none absolute inset-0 rounded-full border-t-2 border-l border-white/25 border-b-2 border-primary-800/40" />
              <span className="pointer-events-none absolute inset-[5px] rounded-full border border-white/10" />
              <Send
                className="
                  relative z-10 h-5 w-5
                  drop-shadow-[0_2px_1px_rgba(0,0,0,0.3)]
                  transition-transform duration-200
                  group-hover:rotate-[-8deg] group-hover:scale-110
                "
              />
              <span className="absolute -bottom-7 whitespace-nowrap text-[10px] font-semibold text-gray-500">
                Transfer
              </span>
            </Link>
          </div>
          <MobileNavItem item={primaryNavItems[2]} />
          <MobileNavItem item={secondaryNavItems[0]} />
        </div>
      </nav>
    </div>
  );
};

export default Layout;