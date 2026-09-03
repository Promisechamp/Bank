import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
		useLocation,
} from 'react-router-dom';

import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import { ChatProvider, useChat } from './components/chat/ChatContext';
import AdminChatPage from './components/chat/AdminChatPage';
import ClientChatPage from './components/chat/Chat';
import Support from './components/Support';

import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';

import Login from './components/Login';
import Home from './components/Home';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import Transfer from './components/Transfer';
import Profile from './components/Profile';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import UsersList from './components/admin/UsersList';
import UserDetail from './components/admin/UserDetail';
import TransactionsList from './components/admin/TransactionsList';
import TransactionDetail from './components/admin/TransactionDetail';
import AccountsList from './components/admin/AccountsList';
import AccountDetails from './components/admin/AccountDetails';
import PendingTransactions from './components/admin/PendingTransactions';

// API
import api, {
  authAPI,
  accountsAPI,
  transactionsAPI,
  adminAPI,
} from './api';


// ============================================================
// LOADING SCREEN
// ============================================================

const LoadingScreen = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />

        <p className="text-sm text-gray-500">
          Loading...
        </p>
      </div>
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};


// ============================================================
// ROLE-BASED REDIRECTION
// ============================================================

const RoleBasedRedirect = () => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  }, [
    isAuthenticated,
    isAdmin,
    loading,
    navigate,
  ]);

  return <LoadingScreen />;
};


// ============================================================
// PROTECTED USER ROUTE
// ============================================================

const UserRoute = ({ children }) => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (isAdmin) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  /*
   * IMPORTANT:
   *
   * No AnimatePresence.
   * No motion.div.
   * No page transform.
   * No opacity transition.
   *
   * The page changes immediately and
   * the Layout remains completely stable.
   */

  return children;
};


// ============================================================
// ADMIN ROUTE
// ============================================================

const AdminRoute = ({ children }) => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
};


// ============================================================
// PUBLIC ROUTE
// ============================================================

const PublicRoute = ({ children }) => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={isAdmin ? '/admin' : '/dashboard'}
        replace
      />
    );
  }

  return children;
};


// ============================================================
// 404 PAGE
// ============================================================

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">

      <div className="text-center">

        <p className="text-7xl font-bold tracking-tight text-gray-200">
          404
        </p>

        <h1 className="mt-3 text-xl font-semibold text-gray-900">
          Page not found
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          The page you're looking for doesn't exist.
        </p>

        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Return to dashboard
        </a>

      </div>

    </div>
  );
};


// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>

      {/* ======================================================
          ROOT
      ====================================================== */}

      <Route
        path="/"
        element={<Home />}
      />


      {/* ======================================================
          PUBLIC
      ====================================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />


      {/* ======================================================
          USER
      ====================================================== */}

      <Route
        path="/dashboard"
        element={
          <UserRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </UserRoute>
        }
      />

      <Route
        path="/accounts"
        element={
          <UserRoute>
            <Layout>
              <Accounts />
            </Layout>
          </UserRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <UserRoute>
            <Layout>
              <Transactions />
            </Layout>
          </UserRoute>
        }
      />

      <Route
        path="/deposit"
        element={
          <UserRoute>
            <Layout>
              <Deposit />
            </Layout>
          </UserRoute>
        }
      />

      <Route
        path="/withdraw"
        element={
          <UserRoute>
            <Layout>
              <Withdraw />
            </Layout>
          </UserRoute>
        }
      />

      <Route
        path="/transfer"
        element={
          <UserRoute>
            <Layout>
              <Transfer />
            </Layout>
          </UserRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <UserRoute>
            <Layout>
              <Profile />
            </Layout>
          </UserRoute>
        }
      />
						
								
						
						<Route
								path="/chat"
								element={
										<UserRoute>
												<Layout>
														<ClientChatPage />
												</Layout>
										</UserRoute>
								}
						/>
						
						<Route
								path="/support"
								element={
										<UserRoute>
												<Layout>
														<Support />
												</Layout>
										</UserRoute>
								}
						/>


      {/* ======================================================
          ADMIN
      ====================================================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/chat"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminChatPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
						
						<Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <UsersList />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users/:userId"
        element={
          <AdminRoute>
            <AdminLayout>
              <UserDetail />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/transactions"
        element={
          <AdminRoute>
            <AdminLayout>
              <TransactionsList />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/transactions/:txId"
        element={
          <AdminRoute>
            <AdminLayout>
              <TransactionDetail />
            </AdminLayout>
          </AdminRoute>
        }
      />
						
						<Route path="/admin/pending-transactions" element={
									<AdminRoute>
											<AdminLayout>
													<PendingTransactions />
											</AdminLayout>
									</AdminRoute>
							} />

      <Route
        path="/admin/accounts"
        element={
          <AdminRoute>
            <AdminLayout>
              <AccountsList />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/accounts/:accountId"
        element={
          <AdminRoute>
            <AdminLayout>
              <AccountDetails />
            </AdminLayout>
          </AdminRoute>
        }
      />
						
				

<Route
  path="/admin/support"
  element={
    <AdminRoute>
      <AdminLayout>
        <Support />
      </AdminLayout>
    </AdminRoute>
  }
/>


      {/* ======================================================
          404
      ====================================================== */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}


// ============================================================
// MAIN APP
// ============================================================

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton={false}
              toastOptions={{ duration: 4000 }}
            />
            <AppRoutes />
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;













