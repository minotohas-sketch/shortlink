import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { apiService } from '../../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, balance: 0 });
  const [recentLinks, setRecentLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiService.getLinks({ limit: 5, sort: 'createdAt', order: 'desc' }),
      apiService.getAnalyticsOverview(),
      apiService.getBalance(),
    ]).then(([lRes, aRes, bRes]) => {
      const links = lRes.data?.data || [];
      const analytics = aRes.data?.data || {};
      const balance = bRes.data?.data || {};
      setStats({
        totalLinks: analytics.totalLinks || 0,
        totalClicks: analytics.totalClicks || 0,
        balance: balance.availableBalance || 0,
      });
      setRecentLinks(Array.isArray(links) ? links : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={{textAlign:'center',padding:60}}><p>Loading dashboard...</p></div></Layout>;

  return (
    <Layout>
      <div style={{padding:'0 0 30px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:30}}>
          <h1 style={{fontSize:28,fontWeight:'bold',color:'#1a1a2e',margin:0}}>Dashboard</h1>
          <Link to="/links/new" style={{padding:'12px 24px',background:'#6366f1',color:'white',borderRadius:8,textDecoration:'none',fontWeight:600}}>+ Create Link</Link>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:15,marginBottom:30}}>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{color:'#666',fontSize:13,margin:0}}>Total Links</p><p style={{fontSize:28,fontWeight:'bold',color:'#6366f1',margin:'5px 0 0 0'}}>{stats.totalLinks}</p></div>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{color:'#666',fontSize:13,margin:0}}>Total Clicks</p><p style={{fontSize:28,fontWeight:'bold',color:'#10b981',margin:'5px 0 0 0'}}>{stats.totalClicks}</p></div>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{color:'#666',fontSize:13,margin:0}}>Balance</p><p style={{fontSize:28,fontWeight:'bold',color:'#f59e0b',margin:'5px 0 0 0'}}>${stats.balance.toFixed(2)}</p></div>
        </div>
        <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <h2 style={{fontSize:18,fontWeight:600,color:'#1a1a2e',margin:'0 0 15px 0'}}>Recent Links</h2>
          {recentLinks.length===0?<p style={{color:'#999'}}>No links yet.</p>:recentLinks.map((l:any)=>(
            <div key={l.id} style={{padding:'10px 0',borderBottom:'1px solid #f0f0f0'}}>
              <a href={l.shortUrl} target="_blank" rel="noopener" style={{color:'#6366f1',fontWeight:600}}>{l.shortUrl}</a>
              <p style={{color:'#999',fontSize:12,margin:'3px 0'}}>{l.currentClicks} clicks</p>
            </div>
          ))}
          <Link to="/links" style={{display:'inline-block',marginTop:15,color:'#6366f1',fontWeight:600,textDecoration:'none'}}>View all →</Link>
        </div>
      </div>
    </Layout>
  );
}
