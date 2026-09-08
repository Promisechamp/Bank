// App.jsx
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

import { ChatProvider } from './components/chat/ChatContext';
import AdminChatPage from './components/chat/AdminChatPage';
import ClientChatPage from './components/chat/Chat';
import Support from './components/Support';

import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';

import Test from './components/TestTools';

import Login from './components/Login';
import Home from './components/Home';
import GenerateRegisterToken from './components/GenerateRegisterToken';
import Register from './components/Register';
import SelfRegisterPage from './components/SelfRegister';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import Transfer from './components/Transfer';
import Receipt from './components/Receipt';
import Profile from './components/Profile';
import CardTracking from './components/CardTracking';

// Admin Components
import UsersList from './components/admin/UsersList';
import UserDetail from './components/admin/UserDetail';
import TransactionsList from './components/admin/TransactionsList';
import TransactionDetail from './components/admin/TransactionDetail';
import AccountsList from './components/admin/AccountsList';
import AccountDetails from './components/admin/AccountDetails';
import PendingTransactions from './components/admin/PendingTransactions';
import AdminCardTracking from './components/admin/AdminCardTracking';


// ============================================================
// LOADING SCREEN
// ============================================================

const LoadingScreen = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
        <p className="text-sm font-medium text-gray-500">Loading...</p>
      </div>
    </div>
  );
};


// ============================================================
// SCROLL TO TOP
// ============================================================

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};


// ============================================================
// TRULY PUBLIC ROUTE - NO AUTH CHECKS
// ============================================================

const TrulyPublicRoute = ({ children }) => {
  return children;
};


// ============================================================
// AUTHENTICATED ROOT REDIRECT - Only for authenticated users
// ============================================================

const AuthenticatedRedirect = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/accounts" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};


// ============================================================
// ADMIN ROOT
// ============================================================

const AdminRootRedirect = () => {
  return <Navigate to="/admin/accounts" replace />;
};


// ============================================================
// PROTECTED USER ROUTE
// ============================================================

const UserRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/accounts" replace />;
  }

  return children;
};


// ============================================================
// ADMIN ROUTE
// ============================================================

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


// ============================================================
// PUBLIC ROUTE - Redirects authenticated users away
// ============================================================

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/accounts' : '/dashboard'} replace />;
  }

  return children;
};


// ============================================================
// 404 PAGE
// ============================================================

const NotFound = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  let destination = '/';

  if (isAuthenticated) {
    destination = isAdmin ? '/admin/accounts' : '/dashboard';
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-bold tracking-tight text-gray-200">404</p>
        <h1 className="mt-3 text-xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <a
          href={destination}
          className="mt-6 inline-flex items-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
        >
          {isAuthenticated ? (isAdmin ? 'Return to Accounts' : 'Return to Dashboard') : 'Return Home'}
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
          PUBLIC HOME PAGE - No authentication required
          ====================================================== */}

      <Route
        path="/"
        element={
          <TrulyPublicRoute>
            <Home />
          </TrulyPublicRoute>
        }
      />

      {/* ======================================================
          PUBLIC ROUTES - No authentication required
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

      <Route
        path="/secure-register-page"
        element={
          <PublicRoute>
            <SelfRegisterPage />
          </PublicRoute>
        }
      />

      {/* ======================================================
          RECEIPT ROUTES - TRULY PUBLIC (NO AUTH)
          ====================================================== */}

      <Route
        path="/receipt"
        element={
          <TrulyPublicRoute>
            <Receipt standalone={true} showSearch={true} />
          </TrulyPublicRoute>
        }
      />

      <Route
        path="/receipt/:reference"
        element={
          <TrulyPublicRoute>
            <Receipt standalone={true} showSearch={true} />
          </TrulyPublicRoute>
        }
      />

      {/* ======================================================
          USER APPLICATION (AUTHENTICATED)
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

      <Route
        path="/card-tracking"
        element={
          <UserRoute>
            <Layout>
              <CardTracking />
            </Layout>
          </UserRoute>
        }
      />

      <Route
        path="/card-tracking/:id"
        element={
          <UserRoute>
            <Layout>
              <CardTracking />
            </Layout>
          </UserRoute>
        }
      />

      {/* ======================================================
          ADMIN APPLICATION (AUTHENTICATED)
          ====================================================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminRootRedirect />
          </AdminRoute>
        }
      />

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

      <Route
        path="/admin/pending-transactions"
        element={
          <AdminRoute>
            <AdminLayout>
              <PendingTransactions />
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
        path="/admin/support"
        element={
          <AdminRoute>
            <AdminLayout>
              <Support />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/card"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminCardTracking />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/card-tracking/:id"
        element={
          <AdminRoute>
            <AdminLayout>
              <CardTracking />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/tokens"
        element={
          <AdminRoute>
            <AdminLayout>
              <GenerateRegisterToken />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* ======================================================
          TEST TOOLS
          ====================================================== */}

      <Route path="/test" element={<Test />} />

      {/* ======================================================
          404
          ====================================================== */}

      <Route path="*" element={<NotFound />} />
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
              toastOptions={{
                duration: 4000,
              }}
            />
            <AppRoutes />
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;