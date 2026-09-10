import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PanelProvider, usePanel } from '@/lib/PanelContext';
import PanelLayout from '@/components/panel/PanelLayout';
import { PermPage } from '@/components/panel/PermissionGate';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Pending from '@/pages/panel/Pending';
import { Forbidden, NotFound, ServerError } from '@/pages/panel/ErrorPages';
import Dashboard from '@/pages/panel/Dashboard';
import Shop from '@/pages/panel/Shop';
import Transactions from '@/pages/panel/Transactions';
import Customers from '@/pages/panel/Customers';
import Exchanges from '@/pages/panel/Exchanges';
import Legitchecks from '@/pages/panel/Legitchecks';
import Earnings from '@/pages/panel/Earnings';
import WalletPage from '@/pages/panel/Wallet';
import Settlements from '@/pages/panel/Settlements';
import Notifications from '@/pages/panel/Notifications';
import Announcements from '@/pages/panel/Announcements';
import Users from '@/pages/panel/Users';
import UserDetail from '@/pages/panel/UserDetail';
import Roles from '@/pages/panel/Roles';
import AuditLogs from '@/pages/panel/AuditLogs';
import Settings from '@/pages/panel/Settings';
import Profile from '@/pages/panel/Profile';
import Search from '@/pages/panel/Search';

function PanelGate() {
  const { loading, rejected, member } = usePanel();
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (rejected) return null;
  if (member && member.account_status !== "approved") return <Pending />;
  return <PanelLayout />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<PanelProvider><PanelGate /></PanelProvider>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shop" element={<PermPage perm="shop.view" Component={Shop} />} />
          <Route path="/transactions" element={<PermPage perm="transactions.view" Component={Transactions} />} />
          <Route path="/customers" element={<PermPage perm="customers.view" Component={Customers} />} />
          <Route path="/exchanges" element={<PermPage perm="exchange.view" Component={Exchanges} />} />
          <Route path="/legitchecks" element={<PermPage perm="legitcheck.view" Component={Legitchecks} />} />
          <Route path="/earnings" element={<PermPage perm="earnings.view" Component={Earnings} />} />
          <Route path="/wallet" element={<PermPage perm="wallet.view" Component={WalletPage} />} />
          <Route path="/settlements" element={<PermPage perm="settlements.view" Component={Settlements} />} />
          <Route path="/notifications" element={<PermPage perm="notifications.view" Component={Notifications} />} />
          <Route path="/announcements" element={<PermPage perm="announcements.view" Component={Announcements} />} />
          <Route path="/users" element={<PermPage perm="users.view" Component={Users} />} />
          <Route path="/users/:id" element={<PermPage perm="users.view" Component={UserDetail} />} />
          <Route path="/roles" element={<PermPage perm="roles.view" Component={Roles} />} />
          <Route path="/audit-logs" element={<PermPage perm="audit.view" Component={AuditLogs} />} />
          <Route path="/settings" element={<PermPage perm="settings.view" Component={Settings} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/403" element={<Forbidden />} />
        </Route>
      </Route>
      <Route path="/404" element={<NotFound />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
