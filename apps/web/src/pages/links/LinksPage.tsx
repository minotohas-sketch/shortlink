import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';

export default function LinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  useEffect(() => {
    apiService.getLinks({ limit: 50 }).then(r => setLinks(r.data?.data || [])).catch(() => {});
  }, []);
  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>My Links</h1>
        <Link to="/links/new" style={{ padding: '10px 20px', background: '#6366f1', color: 'white', borderRadius: 8, textDecoration: 'none' }}>+ New</Link>
      </div>
      {links.map((l: any) => (
        <div key={l.id} style={{ background: 'white', padding: 15, borderRadius: 8, marginTop: 10 }}>
          <a href={l.shortUrl} target="_blank" style={{ color: '#6366f1' }}>{l.shortUrl}</a>
          <p style={{ color: '#999', fontSize: 12 }}>{l.originalUrl}</p>
          <span>{l.currentClicks} clicks</span>
        </div>
      ))}
    </div>
  );
}
