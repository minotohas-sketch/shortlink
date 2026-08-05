import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Pages publiques
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import RedirectPage from './pages/RedirectPage';

// Pages protégées
import DashboardPage from './pages/dashboard/DashboardPage';
import LinksPage from './pages/links/LinksPage';
import CreateLinkPage from './pages/links/CreateLinkPage';
import LinkDetailsPage from './pages/links/LinkDetailsPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import EarningsPage from './pages/earnings/EarningsPage';
import WithdrawalsPage from './pages/withdrawals/WithdrawalsPage';
import ReferralsPage from './pages/referrals/ReferralsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import ApiKeysPage from './pages/settings/ApiKeysPage';
import DomainsPage from './pages/domains/DomainsPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/go/:code" element={<RedirectPage />} />
      
      {/* Routes protégées */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><DashboardPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/links" element={
        <ProtectedRoute>
          <Layout><LinksPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/links/new" element={
        <ProtectedRoute>
          <Layout><CreateLinkPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/links/:id" element={
        <ProtectedRoute>
          <Layout><LinkDetailsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Layout><AnalyticsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/earnings" element={
        <ProtectedRoute>
          <Layout><EarningsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/withdrawals" element={
        <ProtectedRoute>
          <Layout><WithdrawalsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/referrals" element={
        <ProtectedRoute>
          <Layout><ReferralsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout><SettingsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings/profile" element={
        <ProtectedRoute>
          <Layout><ProfilePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings/api-keys" element={
        <ProtectedRoute>
          <Layout><ApiKeysPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/domains" element={
        <ProtectedRoute>
          <Layout><DomainsPage /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Routes admin */}
      <Route path="/admin" element={
        <AdminRoute>
          <Layout><AdminDashboard /></Layout>
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <Layout><AdminUsers /></Layout>
        </AdminRoute>
      } />
      
      {/* 404 */}
      <Route path="*" element={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-300">404</h1>
            <p className="text-xl text-gray-500 mt-4">Page not found</p>
            <a href="/" className="text-indigo-500 hover:underline mt-4 inline-block">
              Go back home
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}
