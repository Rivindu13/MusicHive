import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Content from './pages/admin/Content';
import Roles from './pages/admin/Roles';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerPaymentsSummary from './pages/manager/PaymentsSummary';
import ManagerReports from './pages/manager/Reports';
import ManagerNotifications from './pages/manager/Notifications';

// Accountant pages
import AccountantDashboard from './pages/accountant/Dashboard';
import AccountantPayments from './pages/accountant/Payments';
import AccountantRefundRequests from './pages/accountant/RefundRequests';
import AccountantTransactionHistory from './pages/accountant/TransactionHistory';

// Common
import Login from './pages/common/Login';

const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Admin Routes */}
        {user.role === 'admin' && (
          <>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="content" element={<Content />} />
            <Route path="roles" element={<Roles />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            {/* Redirect any other path to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Manager Routes */}
        {user.role === 'manager' && (
          <>
            <Route index element={<ManagerDashboard />} />
            <Route path="payments-summary" element={<ManagerPaymentsSummary />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route path="notifications" element={<ManagerNotifications />} />
            {/* Redirect old manager paths */}
            <Route path="users" element={<Navigate to="/" replace />} />
            <Route path="content" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Accountant Routes */}
        {user.role === 'accountant' && (
          <>
            <Route index element={<AccountantDashboard />} />
            <Route path="payments" element={<AccountantPayments />} />
            <Route path="refund-requests" element={<AccountantRefundRequests />} />
            <Route path="transaction-history" element={<AccountantTransactionHistory />} />
            {/* Redirect any other path to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;