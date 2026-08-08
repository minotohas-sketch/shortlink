import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  return (
    <div style={{ padding: 30 }}>
      <h1>Profile Settings</h1>
      <p>Email: {user?.email}</p>
      <input value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', marginTop: 10 }} />
      <button style={{ marginTop: 10, padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Save</button>
    </div>
  );
}
