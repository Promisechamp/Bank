import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Notifications from '../Notifications';

import {
  LayoutDashboard,
  Users,
  Wallet,
  History,
  LogOut,
  Shield,
  Clock3,
  User,
  Home,
  Menu,
  X,
  MessagesSquare,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LifeBuoy,
  KeyRound,
  PanelLeft,
} from 'lucide-react';

import { adminAPI } from '../../api';


// ============================================================
// HELPERS
// ============================================================

const getInitials = (name) => {
  if (!name) return 'AD';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};


const getPageName = (pathname) => {
  if (pathname.startsWith('/admin/accounts/')) {
    return 'Account Details';
  }

  if (pathname === '/admin/accounts') {
    return 'Accounts';
  }

  if (pathname.startsWith('/admin/users/')) {
    return 'User Details';
  }

  if (pathname === '/admin/users') {
    return 'Users';
  }

  if (pathname.startsWith('/admin/transactions/')) {
    return 'Transaction Details';
  }

  if (pathname === '/admin/transactions') {
    return 'Transactions';
  }

  if (pathname === '/admin/pending-transactions') {
    return 'Pending Approvals';
  }

  if (pathname.startsWith('/admin/chat')) {
    return 'Chats';
  }

  if (
    pathname === '/admin/card' ||
    pathname.startsWith('/admin/card-tracking/')
  ) {
    return 'Cards';
  }

  if (pathname.startsWith('/admin/tokens')) {
    return 'Register Tokens';
  }

  return 'Accounts';
};


// ============================================================
// ADMIN LAYOUT
// ============================================================

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [stats, setStats] = useState({
    unreadChats: 0,
    cardOrders: 0,
    pendingTransactions: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);


  // ==========================================================
  // FETCH ADMIN STATS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);

        const response = await adminAPI.getLayoutStats();

        if (!mounted) return;

        if (response?.success && response?.stats) {
          setStats({
            unreadChats: Number(response.stats.unreadChats || 0),
            cardOrders: Number(response.stats.cardOrders || 0),
            pendingTransactions: Number(
              response.stats.pendingTransactions || 0
            ),
          });
        }
      } catch (error) {
        console.error(
          'Failed to fetch admin layout stats:',
          error
        );
      } finally {
        if (mounted) {
          setStatsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);


  // ==========================================================
  // RESPONSIVE SIDEBAR
  // ==========================================================

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);


  // ==========================================================
  // ACTIONS
  // ==========================================================

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navItems = useMemo(
    () => [
      {
        to: '/admin/accounts',
        icon: Wallet,
        label: 'Accounts',
      },

      {
        to: '/admin/users',
        icon: Users,
        label: 'Users',
      },

      {
        to: '/admin/transactions',
        icon: History,
        label: 'Transactions',
      },

      {
        to: '/admin/pending-transactions',
        icon: Clock3,
        label: 'Pending Approvals',
        badge: stats.pendingTransactions,
        badgeType: 'warning',
      },

      {
        to: '/admin/chat',
        icon: MessagesSquare,
        label: 'Chats',
        badge: stats.unreadChats,
        badgeType: 'primary',
      },

      {
        to: '/admin/card',
        icon: CreditCard,
        label: 'Cards Order',
        badge: stats.cardOrders,
        badgeType: 'primary',
      },

      {
        to: '/admin/tokens',
        icon: KeyRound,
        label: 'Register Tokens',
      },
    ],
    [stats]
  );


  const secondaryItems = [
    {
      to: '/profile',
      icon: User,
      label: 'My Profile',
    },
  ];


  // ==========================================================
  // ACTIVE ROUTE
  // ==========================================================

  const isActive = (path) => {
    if (path === '/admin/accounts') {
      return (
        location.pathname === '/admin/accounts' ||
        location.pathname.startsWith('/admin/accounts/')
      );
    }

    if (path === '/admin/users') {
      return (
        location.pathname === '/admin/users' ||
        location.pathname.startsWith('/admin/users/')
      );
    }

    if (path === '/admin/transactions') {
      return (
        location.pathname === '/admin/transactions' ||
        location.pathname.startsWith('/admin/transactions/')
      );
    }

    if (path === '/admin/card') {
      return (
        location.pathname === '/admin/card' ||
        location.pathname.startsWith('/admin/card-tracking/')
      );
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };


  // ==========================================================
  // PAGE INFORMATION
  // ==========================================================

  const pageName = getPageName(location.pathname);


  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900">


      {/* ======================================================
          TOP BAR
          ====================================================== */}

      <header
        className="
          fixed inset-x-0 top-0 z-50
          h-16
          border-b border-gray-200/80
          bg-white/95
          backdrop-blur-xl
        "
      >
        <div className="flex h-full items-center justify-between px-3 sm:px-4 md:px-6">


          {/* ==================================================
              BRAND
              ================================================== */}

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">

            {/* Mobile menu */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-900
                md:hidden
              "
              aria-label={
                sidebarOpen
                  ? 'Close navigation'
                  : 'Open navigation'
              }
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>


            {/* Brand links to real admin entry point */}
            <Link
              to="/admin/accounts"
              onClick={closeSidebar}
              className="
                group
                flex
                min-w-0
                items-center
                gap-2.5
                sm:gap-3
              "
            >

              <div
                className="
                  relative
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-primary-600
                  text-white
                  shadow-sm
                  shadow-primary-600/20
                  transition
                  group-hover:scale-[1.03]
                "
              >
                <Shield className="h-[18px] w-[18px]" />

                <span
                  className="
                    absolute
                    -right-0.5
                    -top-0.5
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-400
                    ring-2
                    ring-white
                  "
                />
              </div>


              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-bold tracking-tight text-gray-950">
                  Admin Console
                </p>

                <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Banking Operations
                </p>
              </div>

            </Link>

          </div>


          {/* ==================================================
              RIGHT SIDE
              ================================================== */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">

            <Notifications />


            <div className="hidden h-7 w-px bg-gray-200 sm:block" />


            {/* User information */}
            <div className="hidden items-center gap-3 sm:flex">

              <div className="text-right">
                <p className="max-w-[160px] truncate text-sm font-semibold text-gray-900">
                  {user?.full_name || 'Admin'}
                </p>

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  Administrator
                </p>
              </div>


              <div
                className="
                  flex h-9 w-9
                  shrink-0
                  items-center justify-center
                  rounded-full
                  bg-primary-50
                  text-xs
                  font-bold
                  text-primary-700
                  ring-1
                  ring-primary-100
                "
              >
                {getInitials(user?.full_name)}
              </div>

            </div>


            {/* User view */}
            <Link
              to="/dashboard"
              className="
                hidden
                h-10
                items-center
                gap-2
                rounded-xl
                border
                border-gray-200
                bg-white
                px-3
                text-xs
                font-semibold
                text-gray-700
                shadow-sm
                transition
                hover:border-gray-300
                hover:bg-gray-50
                md:flex
              "
            >
              <Home className="h-4 w-4" />
              <span>User View</span>
            </Link>


            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="
                flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-gray-200
                bg-white
                px-3
                text-xs
                font-semibold
                text-gray-700
                shadow-sm
                transition
                hover:border-red-200
                hover:bg-red-50
                hover:text-red-600
              "
            >
              <LogOut className="h-4 w-4" />

              <span className="hidden lg:inline">
                Logout
              </span>
            </button>

          </div>

        </div>
      </header>


      {/* ======================================================
          MOBILE OVERLAY
          ====================================================== */}

      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="
            fixed
            inset-0
            z-40
            bg-gray-900/20
            backdrop-blur-[2px]
            md:hidden
          "
        />
      )}


      {/* ======================================================
          BODY
          ====================================================== */}

      <div className="flex pt-16">


        {/* ====================================================
            SIDEBAR
            ==================================================== */}

        <aside
          className={`
            fixed
            left-0
            top-16
            z-40
            h-[calc(100vh-4rem)]
            border-r
            border-gray-200
            bg-white
            transition-all
            duration-300
            ease-out

            ${
              isMobile
                ? sidebarOpen
                  ? 'w-[280px] translate-x-0 shadow-2xl'
                  : 'w-[280px] -translate-x-full'
                : sidebarOpen
                  ? 'w-64 translate-x-0'
                  : 'w-[76px] translate-x-0'
            }
          `}
        >

          <div className="flex h-full flex-col p-3">


            {/* =================================================
                WORKSPACE HEADER
                ================================================= */}

            <div
              className={`
                mb-3
                px-2
                ${
                  !sidebarOpen && !isMobile
                    ? 'text-center'
                    : ''
                }
              `}
            >

              {sidebarOpen || isMobile ? (
                <>
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        Workspace
                      </p>

                      <p className="mt-1 text-xs font-medium text-gray-500">
                        Administration
                      </p>
                    </div>

                    <span
                      className="
                        flex h-6 w-6
                        items-center justify-center
                        rounded-lg
                        bg-gray-50
                        text-gray-400
                      "
                    >
                      <PanelLeft className="h-3.5 w-3.5" />
                    </span>

                  </div>
                </>
              ) : (
                <div
                  className="
                    mx-auto
                    flex h-6 w-6
                    items-center justify-center
                    rounded-lg
                    bg-primary-50
                  "
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                </div>
              )}

            </div>


            {/* =================================================
                MAIN NAVIGATION
                ================================================= */}

            <nav className="space-y-1">

              {navItems.map((item) => {

                const active = isActive(item.to);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeSidebar}
                    title={
                      !sidebarOpen && !isMobile
                        ? item.label
                        : undefined
                    }
                    className={`
                      group
                      relative
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      transition-all
                      duration-200

                      ${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }

                      ${
                        !sidebarOpen && !isMobile
                          ? 'justify-center'
                          : ''
                      }
                    `}
                  >

                    {/* Active indicator */}
                    {active && (
                      <span
                        className="
                          absolute
                          bottom-2
                          left-0
                          top-2
                          w-0.5
                          rounded-r-full
                          bg-primary-600
                        "
                      />
                    )}


                    {/* Icon */}
                    <Icon
                      className={`
                        h-[18px]
                        w-[18px]
                        shrink-0

                        ${
                          active
                            ? 'text-primary-600'
                            : 'text-gray-400 group-hover:text-gray-700'
                        }
                      `}
                    />


                    {(sidebarOpen || isMobile) && (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {item.label}
                        </span>


                        {item.badge > 0 && (
                          <span
                            className={`
                              min-w-[22px]
                              rounded-full
                              px-1.5
                              py-0.5
                              text-center
                              text-[10px]
                              font-bold

                              ${
                                active
                                  ? 'bg-primary-600 text-white'
                                  : item.badgeType === 'warning'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-primary-50 text-primary-700'
                              }
                            `}
                          >
                            {item.badge > 99
                              ? '99+'
                              : item.badge}
                          </span>
                        )}

                      </>
                    )}

                  </Link>
                );
              })}

            </nav>


            {/* =================================================
                DIVIDER
                ================================================= */}

            <div className="my-4 h-px bg-gray-100" />


            {/* =================================================
                ACCOUNT
                ================================================= */}

            <div className="space-y-1">

              {(sidebarOpen || isMobile) && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  Account
                </p>
              )}


              {secondaryItems.map((item) => {

                const active = isActive(item.to);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeSidebar}
                    title={
                      !sidebarOpen && !isMobile
                        ? item.label
                        : undefined
                    }
                    className={`
                      group
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      text-gray-600
                      transition

                      ${
                        active
                          ? 'bg-gray-100 text-gray-900'
                          : 'hover:bg-gray-50 hover:text-gray-900'
                      }

                      ${
                        !sidebarOpen && !isMobile
                          ? 'justify-center'
                          : ''
                      }
                    `}
                  >

                    <Icon
                      className={`
                        h-[18px]
                        w-[18px]
                        shrink-0

                        ${
                          active
                            ? 'text-gray-700'
                            : 'text-gray-400 group-hover:text-gray-700'
                        }
                      `}
                    />

                    {(sidebarOpen || isMobile) && (
                      <span className="text-sm font-semibold">
                        {item.label}
                      </span>
                    )}

                  </Link>
                );
              })}

            </div>


            {/* =================================================
                BOTTOM SECTION
                ================================================= */}

            <div className="mt-auto">


              {/* Admin status card */}
              {(sidebarOpen || isMobile) && (
                <div
                  className="
                    mb-3
                    rounded-2xl
                    border
                    border-gray-100
                    bg-gray-50
                    p-3
                  "
                >

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        relative
                        flex h-9 w-9
                        shrink-0
                        items-center justify-center
                        rounded-xl
                        bg-white
                        text-primary-600
                        shadow-sm
                        ring-1
                        ring-gray-200
                      "
                    >
                      <Shield className="h-4 w-4" />

                      <span
                        className="
                          absolute
                          -right-0.5
                          -top-0.5
                          h-2
                          w-2
                          rounded-full
                          bg-emerald-400
                          ring-2
                          ring-white
                        "
                      />
                    </div>


                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900">
                        Admin Access
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-gray-400">
                        Full permissions
                      </p>
                    </div>

                  </div>

                </div>
              )}


              {/* Desktop collapse button */}
              {!isMobile && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className={`
                    flex
                    w-full
                    items-center
                    rounded-xl
                    px-3
                    py-2.5
                    text-gray-400
                    transition
                    hover:bg-gray-50
                    hover:text-gray-700

                    ${
                      !sidebarOpen
                        ? 'justify-center'
                        : 'gap-3'
                    }
                  `}
                  title={
                    sidebarOpen
                      ? 'Collapse sidebar'
                      : 'Expand sidebar'
                  }
                >

                  {sidebarOpen ? (
                    <>
                      <ChevronLeft className="h-4 w-4" />

                      <span className="text-xs font-semibold">
                        Collapse sidebar
                      </span>
                    </>
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}

                </button>
              )}

            </div>

          </div>

        </aside>


        {/* ====================================================
            MAIN CONTENT
            ==================================================== */}

        <main
          className={`
            min-w-0
            flex-1
            transition-[margin]
            duration-300
            ease-out

            ${
              isMobile
                ? 'ml-0'
                : sidebarOpen
                  ? 'ml-64'
                  : 'ml-[76px]'
            }
          `}
        >

          <div
            className="
              mx-auto
              w-full
              max-w-[1440px]
              px-4
              py-5
              sm:px-6
              md:px-8
              md:py-7
            "
          >

            {/* =================================================
                PAGE LOCATION
                ================================================= */}

            <div className="mb-5 hidden items-center justify-between md:flex">

              <div className="flex items-center gap-2 text-[11px] font-medium">

                <Link
                  to="/admin/accounts"
                  className="text-gray-400 transition hover:text-primary-600"
                >
                  Admin
                </Link>

                <ChevronRight className="h-3 w-3 text-gray-300" />

                <span className="font-semibold text-gray-700">
                  {pageName}
                </span>

              </div>


              {/* Current section indicator */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-gray-200
                  bg-white
                  px-3
                  py-1.5
                  shadow-sm
                "
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="
                      absolute
                      inline-flex
                      h-full
                      w-full
                      animate-ping
                      rounded-full
                      bg-emerald-400
                      opacity-60
                    "
                  />

                  <span
                    className="
                      relative
                      inline-flex
                      h-2
                      w-2
                      rounded-full
                      bg-emerald-500
                    "
                  />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                  Operations Online
                </span>
              </div>

            </div>


            {/* =================================================
                PAGE CONTENT
                ================================================= */}

            {children}

          </div>

        </main>

      </div>

    </div>
  );
};

export default AdminLayout;