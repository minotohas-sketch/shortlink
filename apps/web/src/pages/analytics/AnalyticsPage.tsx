import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { apiService } from '../../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('last7days');

  useEffect(() => {
    apiService.getAnalyticsOverview({period}).then(r=>setData(r.data?.data||null)).catch(console.error);
  }, [period]);

  return (
    <Layout>
      <div style={{padding:'0 0 30px 0'}}>
        <h1 style={{fontSize:28,fontWeight:'bold',color:'#1a1a2e',margin:'0 0 20px 0'}}>Analytics</h1>
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {['today','last7days','last30days','last90days'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:'8px 16px',borderRadius:20,border:period===p?'2px solid #6366f1':'1px solid #ddd',background:period===p?'#eef2ff':'white',color:period===p?'#6366f1':'#666',cursor:'pointer',fontSize:13}}>{p==='last7days'?'7 Days':p==='last30days'?'30 Days':p==='last90days'?'90 Days':'Today'}</button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:15,marginBottom:20}}>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{color:'#666',fontSize:13}}>Total Clicks</p><p style={{fontSize:28,fontWeight:'bold',color:'#6366f1'}}>{data?.totalClicks||0}</p></div>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{color:'#666',fontSize:13}}>Unique Clicks</p><p style={{fontSize:28,fontWeight:'bold',color:'#10b981'}}>{data?.uniqueClicks||0}</p></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:20}}>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <h3 style={{fontSize:16,fontWeight:600,margin:'0 0 10px 0'}}>Top Countries</h3>
            {data?.clicksByCountry&&Object.entries(data.clicksByCountry).slice(0,10).map(([c,n]:any)=>(
              <div key={c} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:14}}><span>{c}</span><span style={{fontWeight:600}}>{n}</span></div>
            ))}
          </div>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <h3 style={{fontSize:16,fontWeight:600,margin:'0 0 10px 0'}}>Top Links</h3>
            {data?.topLinks?.slice(0,10).map((l:any)=>(
              <div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:14}}><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>{l.title||l.shortCode}</span><span style={{fontWeight:600}}>{l.clicks}</span></div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
