import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, balance: 0 });
  useEffect(() => {
    Promise.all([apiService.getLinks({ limit: 5 }), apiService.getBalance()])
      .then(([lRes, bRes]) => {
        setStats({
          totalLinks: lRes.data?.meta?.total || 0,
          totalClicks: 0,
          balance: bRes.data?.data?.availableBalance || 0,
        });
      }).catch(() => {});
  }, []);
  return (
    <div style={{ padding: 30 }}>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 15, marginTop: 20 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, flex: 1 }}><p>Links</p><h2>{stats.totalLinks}</h2></div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, flex: 1 }}><p>Clicks</p><h2>{stats.totalClicks}</h2></div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, flex: 1 }}><p>Balance</p><h2>${stats.balance.toFixed(2)}</h2></div>
      </div>
      <div style={{ marginTop: 20 }}>
        <Link to="/links/new" style={{ padding: '12px 24px', background: '#6366f1', color: 'white', borderRadius: 8, textDecoration: 'none' }}>+ Create Link</Link>
      </div>
    </div>
  );
}
