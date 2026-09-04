import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  CreditCard,
  MoreHorizontal,
  Settings,
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notificationRef = useRef(null);

  // --------------------------------------------------------------------------
  // Demo notifications
  // Replace this with your notifications API later.
  // --------------------------------------------------------------------------

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'transaction',
      title: 'Pending transaction',
      message: 'A transfer is waiting for administrator approval.',
      time: 'Just now',
      unread: true,
      icon: ArrowRightLeft,
    },
    {
      id: 2,
      type: 'user',
      title: 'New user registered',
      message: 'A new customer account requires attention.',
      time: '12 min ago',
      unread: true,
      icon: Users,
    },
    {
      id: 3,
      type: 'card',
      title: 'Debit card request',
      message: 'A new debit card order has been submitted.',
      time: '1 hr ago',
      unread: false,
      icon: CreditCard,
    },
  ]);

  // --------------------------------------------------------------------------
  // Responsive sidebar
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Close notification dropdown when clicking outside
  // --------------------------------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // --------------------------------------------------------------------------
  // Logout
  // --------------------------------------------------------------------------

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --------------------------------------------------------------------------
  // Sidebar
  // --------------------------------------------------------------------------

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // --------------------------------------------------------------------------
  // Navigation
  // --------------------------------------------------------------------------

  const navItems = [
    {
      to: '/admin',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      to: '/admin/users',
      icon: Users,
      label: 'Users',
    },
    {
      to: '/admin/accounts',
      icon: Wallet,
      label: 'Accounts',
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
      badge: 0,
    },
				{
      to: '/admin/chat',
      icon: MessagesSquare,
      label: 'Chats',
      badge: 0,
    },
				{
      to: '/admin/card',
      icon: CreditCard,
      label: 'Cards Order',
      badge: 0,
    },
  ];

  const secondaryItems = [
    {
      to: '/profile',
      icon: User,
      label: 'My Profile',
    },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }

    return location.pathname.startsWith(path);
  };

  // --------------------------------------------------------------------------
  // Notifications
  // --------------------------------------------------------------------------

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const markNotificationAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification
      )
    );
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-gray-900">

      {/* ======================================================================
          TOP BAR
          ====================================================================== */}

      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">

        <div className="flex h-full items-center justify-between px-4 md:px-6">

          {/* --------------------------------------------------------------
              BRAND
          -------------------------------------------------------------- */}

          <div className="flex items-center gap-3">

            {/* Mobile menu */}

            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 md:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Brand */}

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
                <Shield className="h-4.5 w-4.5" />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-bold tracking-tight text-gray-950">
                  Admin Console
                </p>

                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Banking Operations
                </p>
              </div>

            </div>

          </div>


          {/* --------------------------------------------------------------
              RIGHT SIDE
          -------------------------------------------------------------- */}

          <div className="flex items-center gap-2 sm:gap-3">

            {/* Notifications */}

            <div
              ref={notificationRef}
              className="relative"
            >

              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen((current) => !current)
                }
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  notificationsOpen
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label="Notifications"
              >

                <Bell className="h-5 w-5" />

                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}

              </button>


              {/* Notification dropdown */}

              {notificationsOpen && (
                <div className="fixed left-1/2 top-[270px] w-[calc(100vw-2rem)] max-w-[380px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl z-50">

                  {/* Header */}

                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">

                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Notifications
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                          : 'You re all caught up'}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Mark all read
                      </button>
                    )}

                  </div>


                  {/* Notifications */}

                  <div className="max-h-[380px] overflow-y-auto">

                    {notifications.length === 0 ? (

                      <div className="px-6 py-10 text-center">

                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <Bell className="h-5 w-5 text-gray-400" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-gray-900">
                          No notifications
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          New activity will appear here.
                        </p>

                      </div>

                    ) : (

                      notifications.map((notification) => {

                        const Icon = notification.icon;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              markNotificationAsRead(
                                notification.id
                              );

                              if (
                                notification.type ===
                                'transaction'
                              ) {
                                navigate(
                                  '/admin/pending-transactions'
                                );

                                setNotificationsOpen(
                                  false
                                );
                              }
                            }}
                            className={`flex w-full gap-3 border-b border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50 ${
                              notification.unread
                                ? 'bg-primary-50/40'
                                : 'bg-white'
                            }`}
                          >

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                notification.type ===
                                'transaction'
                                  ? 'bg-amber-50 text-amber-600'
                                  : notification.type ===
                                      'card'
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-2">

                                <p className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </p>

                                {notification.unread && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                                )}

                              </div>

                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {notification.message}
                              </p>

                              <p className="mt-1.5 text-[10px] font-medium text-gray-400">
                                {notification.time}
                              </p>

                            </div>

                          </button>
                        );

                      })

                    )}

                  </div>


                  {/* Footer */}

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      toastInfo();
                    }}
                    className="flex w-full items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                  >
                    View notification center
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                </div>
              )}

            </div>


            {/* Divider */}

            <div className="hidden h-7 w-px bg-gray-200 sm:block" />


            {/* User */}

            <div className="hidden items-center gap-3 sm:flex">

              <div className="text-right">

                <p className="text-sm font-semibold text-gray-900">
                  {user?.full_name || 'Admin'}
                </p>

                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  Administrator
                </p>

              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {getInitials(user?.full_name)}
              </div>

            </div>


            {/* User view */}

            <Link
              to="/dashboard"
              className="hidden h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:flex"
            >
              <Home className="h-4 w-4" />
              User View
            </Link>


            {/* Logout */}

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 text-xs font-semibold text-white transition hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">
                Logout
              </span>
            </button>

          </div>

        </div>

      </header>


      {/* ======================================================================
          MOBILE OVERLAY
          ====================================================================== */}

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-[2px] md:hidden"
          onClick={closeSidebar}
        />
      )}


      {/* ======================================================================
          BODY
          ====================================================================== */}

      <div className="flex pt-16">


        {/* ====================================================================
            SIDEBAR
            ==================================================================== */}

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
            ease-in-out
            ${
              isMobile
                ? sidebarOpen
                  ? 'w-[270px] translate-x-0'
                  : 'w-[270px] -translate-x-full'
                : sidebarOpen
                  ? 'w-64 translate-x-0'
                  : 'w-[76px] translate-x-0'
            }
          `}
        >

          <div className="flex h-full flex-col p-3">


            {/* --------------------------------------------------------------
                Workspace label
            -------------------------------------------------------------- */}

            <div
              className={`mb-3 px-2 ${
                !sidebarOpen && !isMobile
                  ? 'text-center'
                  : ''
              }`}
            >

              {sidebarOpen || isMobile ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    Workspace
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Administration
                  </p>
                </>
              ) : (
                <div className="mx-auto h-1.5 w-1.5 rounded-full bg-primary-600" />
              )}

            </div>


            {/* --------------------------------------------------------------
                Main navigation
            -------------------------------------------------------------- */}

            <nav className="space-y-1">

              {navItems.map((item) => {

                const active = isActive(item.to);

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
                      py-3
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
                      <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-primary-600" />
                    )}

                    <item.icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        active
                          ? 'text-primary-600'
                          : 'text-gray-400 group-hover:text-gray-700'
                      }`}
                    />

                    {(sidebarOpen || isMobile) && (
                      <>
                        <span className="flex-1 text-sm font-semibold">
                          {item.label}
                        </span>

                        {item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              active
                                ? 'bg-primary-600 text-white'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}

                  </Link>
                );

              })}

            </nav>


            {/* --------------------------------------------------------------
                Divider
            -------------------------------------------------------------- */}

            <div className="my-4 h-px bg-gray-100" />


            {/* --------------------------------------------------------------
                Secondary
            -------------------------------------------------------------- */}

            <div className="space-y-1">

              {(sidebarOpen || isMobile) && (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  Account
                </p>
              )}

              {secondaryItems.map((item) => {

                const active = isActive(item.to);

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
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-gray-600
                      transition
                      hover:bg-gray-50
                      hover:text-gray-900
                      ${
                        active
                          ? 'bg-gray-100 text-gray-900'
                          : ''
                      }
                      ${
                        !sidebarOpen && !isMobile
                          ? 'justify-center'
                          : ''
                      }
                    `}
                  >

                    <item.icon className="h-[18px] w-[18px] shrink-0" />

                    {(sidebarOpen || isMobile) && (
                      <span className="text-sm font-semibold">
                        {item.label}
                      </span>
                    )}

                  </Link>
                );

              })}

            </div>


            {/* --------------------------------------------------------------
                Bottom admin profile card
            -------------------------------------------------------------- */}

            <div className="mt-auto">


              {(sidebarOpen || isMobile) && (
                <div className="mb-3 rounded-2xl bg-gray-50 p-3">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200">
                      <Shield className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-xs font-bold text-gray-900">
                        Admin Access
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Full permissions
                      </p>

                    </div>

                  </div>

                </div>
              )}


              {/* Collapse */}

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


        {/* ====================================================================
            MAIN CONTENT
            ==================================================================== */}

        <main
          className={`
            min-w-0
            flex-1
            transition-all
            duration-300
            ${
              isMobile
                ? 'ml-0'
                : sidebarOpen
                  ? 'ml-64'
                  : 'ml-[76px]'
            }
          `}
        >

          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 md:px-8 md:py-8">

            {/* Small page location indicator */}

            <div className="mb-5 hidden items-center gap-2 text-[11px] font-medium text-gray-400 md:flex">

              <span>Admin</span>

              <ChevronRight className="h-3 w-3" />

              <span className="text-gray-600">
                {getPageName(location.pathname)}
              </span>

            </div>

            {children}

          </div>

        </main>

      </div>

    </div>
  );
};


/* ============================================================================
   HELPERS
   ============================================================================ */

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
  if (pathname === '/admin') return 'Dashboard';

  if (pathname.startsWith('/admin/users')) {
    return 'Users';
  }

  if (pathname.startsWith('/admin/accounts')) {
    return 'Accounts';
  }

  if (pathname.startsWith('/admin/transactions')) {
    return 'Transactions';
  }

  if (
    pathname.startsWith(
      '/admin/pending-transactions'
    )
  ) {
    return 'Pending Approvals';
  }

  if (pathname.startsWith('/profile')) {
    return 'My Profile';
  }

  return 'Administration';
};


// Temporary UI feedback until a notification center exists.
const toastInfo = () => {
  console.info(
    'Notification center can be connected to your notifications API here.'
  );
};


export default AdminLayout;

