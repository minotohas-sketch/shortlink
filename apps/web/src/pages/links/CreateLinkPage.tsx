import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

export default function CreateLinkPage() {
  const [url, setUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createLink({ originalUrl: url, shortCode: shortCode || undefined });
      toast.success('Link created!');
      navigate('/links');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Create Link</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        <input type="url" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} required style={{ width: '100%', padding: 12, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        <input type="text" placeholder="Custom short code (optional)" value={shortCode} onChange={e => setShortCode(e.target.value)} style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        <button type="submit" disabled={loading} style={{ padding: '12px 30px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Creating...' : 'Create Link'}
        </button>
      </form>
    </div>
  );
}
