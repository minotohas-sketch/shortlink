import { Link, useLocation } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 250, background: '#1a1a2e', color: 'white', padding: 20 }}>
        <h2 style={{ color: '#6366f1' }}>Peage</h2>
        <nav style={{ marginTop: 20 }}>
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Links', href: '/links' },
            { label: 'Analytics', href: '/analytics' },
            { label: 'Earnings', href: '/earnings' },
            { label: 'Settings', href: '/settings' },
          ].map(item => (
            <Link
              key={item.href}
              to={item.href}
              style={{
                display: 'block',
                padding: '10px 15px',
                color: location.pathname.startsWith(item.href) ? '#6366f1' : '#ccc',
                textDecoration: 'none',
                borderRadius: 8,
                marginBottom: 5,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 30, background: '#f5f5f5' }}>
        {children}
      </main>
    </div>
  );
}
