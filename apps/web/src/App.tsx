import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoadingScreen } from './components/ui/LoadingScreen';

function HomePage() {
  return (
    <div style={{ textAlign: 'center', padding: 50 }}>
      <h1 style={{ fontSize: 48, color: '#6366f1' }}>Peage</h1>
      <p style={{ fontSize: 20, color: '#666' }}>URL Shortener with Monetization</p>
      <div style={{ marginTop: 40 }}>
        <a href="/dashboard" style={{ padding: '12px 30px', background: '#6366f1', color: 'white', borderRadius: 8, textDecoration: 'none', marginRight: 10 }}>Dashboard</a>
        <a href="/login" style={{ padding: '12px 30px', border: '2px solid #6366f1', color: '#6366f1', borderRadius: 8, textDecoration: 'none' }}>Login</a>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <Layout>
      <h1>Dashboard</h1>
      <p>Welcome to Peage! Your links and earnings will appear here.</p>
    </Layout>
  );
}

function LoginPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 12, width: 400 }}>
        <h1 style={{ textAlign: 'center', color: '#6366f1' }}>Peage</h1>
        <h2 style={{ textAlign: 'center' }}>Login</h2>
        <input type="email" placeholder="Email" style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="password" placeholder="Password" style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        <button style={{ width: '100%', padding: 12, background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Sign In</button>
      </div>
    </div>
  );
}

function LinksPage() {
  return <Layout><h1>My Links</h1><p>Your shortened links will appear here.</p></Layout>;
}

function AnalyticsPage() {
  return <Layout><h1>Analytics</h1><p>Click statistics and charts.</p></Layout>;
}

function EarningsPage() {
  return <Layout><h1>Earnings</h1><p>Your earnings and balance.</p></Layout>;
}

function SettingsPage() {
  return <Layout><h1>Settings</h1><p>Account settings.</p></Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/links" element={<LinksPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/earnings" element={<EarningsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
