import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { useAuth } from './hooks/useAuth';

// ─── Pages réellement implémentées (existaient déjà dans src/pages/
// mais n'étaient référencées par aucune route : App.tsx redéfinissait
// des versions maquettes à la place) ────────────────────────────────
import HomePage from './pages/HomePage';
import RedirectPage from './pages/RedirectPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DomainsPage from './pages/domains/DomainsPage';
import LinkDetailsPage from './pages/links/LinkDetailsPage';
import ApiKeysPage from './pages/settings/ApiKeysPage';
import SettingsPage from './pages/settings/SettingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

// ─── Pages sans fichier dédié pour l'instant : on garde un placeholder
// minimal (inchangé dans l'esprit), simplement passé sous Layout + garde ─
function DashboardPage() {
  return (
    <Layout>
      <h1>Dashboard</h1>
      <p>Welcome to Peage! Your links and earnings will appear here.</p>
    </Layout>
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

// ─── Auth: formulaires réellement fonctionnels ──────────────────────
// Les anciennes LoginPage/RegisterPage n'avaient ni state ni onSubmit :
// aucun input n'était contrôlé et le bouton ne faisait rien. Ici on les
// relie à useAuth() (login/register), qui appelle déjà l'API et stocke
// les tokens — il ne manquait que ce branchement.
function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 40, borderRadius: 12, width: 400 }}>
        <h1 style={{ textAlign: 'center', color: '#6366f1' }}>Peage</h1>
        <h2 style={{ textAlign: 'center' }}>Login</h2>
        {error && <p style={{ color: '#dc2626', textAlign: 'center' }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{ width: '100%', padding: 12, background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/forgot-password" style={{ color: '#6366f1' }}>Forgot password?</Link>
          {' · '}
          <Link to="/register" style={{ color: '#6366f1' }}>Create account</Link>
        </p>
      </form>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 40, borderRadius: 12, width: 400 }}>
        <h1 style={{ textAlign: 'center', color: '#6366f1' }}>Peage</h1>
        <h2 style={{ textAlign: 'center' }}>Create account</h2>
        {error && <p style={{ color: '#dc2626', textAlign: 'center' }}>{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
          style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required
          style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' }} />
        <button type="submit" disabled={submitting}
          style={{ width: '100%', padding: 12, background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {submitting ? 'Creating account…' : 'Sign Up'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/login" style={{ color: '#6366f1' }}>Already have an account? Sign in</Link>
        </p>
      </form>
    </div>
  );
}

// ─── Garde d'authentification ────────────────────────────────────────
// Aucune route protégée n'existait : /dashboard, /earnings, /settings...
// étaient accessibles sans être connecté. On s'appuie sur isAuthenticated
// (déjà exposé par useAuth) plutôt que d'introduire un nouveau mécanisme.
function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export default function App() {
  const { refreshAuth } = useAuth();

  // isLoading démarre à `true` dans le store (useAuth.ts) et n'était
  // jamais remis à `false` : rien n'appelait refreshAuth() au montage.
  // Sans cet appel, une session persistée (token en localStorage via
  // zustand/persist) ne se restaurait jamais et isLoading restait bloqué
  // à `true` indéfiniment.
  useEffect(() => {
    refreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/go/:code" element={<RedirectPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/links" element={<ProtectedRoute><LinksPage /></ProtectedRoute>} />
      <Route path="/links/:id" element={<ProtectedRoute><LinkDetailsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
      <Route path="/domains" element={<ProtectedRoute><DomainsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/settings/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
