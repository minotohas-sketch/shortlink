import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { apiService } from '../../services/api';

export default function ReferralsPage() {
  const [stats, setStats] = useState<any>({});
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const referralLink = stats?.referralCode ? `https://shortlink-7qt.pages.dev/register?ref=${stats.referralCode}` : '';

  useEffect(() => {
    Promise.all([apiService.getReferralStats(),apiService.getReferrals({limit:50})])
      .then(([sRes,lRes])=>{
        setStats(sRes.data?.data||{});
        setReferrals(lRes.data?.data||[]);
      }).catch(console.error);
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  };

  return (
    <Layout>
      <div style={{padding:'0 0 30px 0'}}>
        <h1 style={{fontSize:28,fontWeight:'bold',color:'#1a1a2e',margin:'0 0 20px 0'}}>Referral Program</h1>
        <div style={{background:'linear-gradient(135deg,#ec4899,#be185d)',borderRadius:16,padding:30,color:'white',marginBottom:30}}>
          <p style={{fontSize:14,margin:0,opacity:.9}}>Your Referral Link</p>
          <div style={{display:'flex',gap:10,marginTop:12}}>
            <input value={referralLink} readOnly style={{flex:1,padding:12,borderRadius:8,border:'none',fontSize:14}} />
            <button onClick={copy} style={{padding:'12px 20px',background:'white',color:'#be185d',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>{copied?'Copied!':'Copy'}</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:15,marginBottom:20}}>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{color:'#666',fontSize:13}}>Total Referrals</p><p style={{fontSize:24,fontWeight:'bold'}}>{stats.totalReferrals||0}</p></div>
          <div style={{background:'white',borderRadius:12,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}><p style={{color:'#666',fontSize:13}}>Total Commission</p><p style={{fontSize:24,fontWeight:'bold'}}>${(stats.totalCommission||0).toFixed(2)}</p></div>
        </div>
        <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <h2 style={{fontSize:18,fontWeight:600,margin:'0 0 15px 0'}}>Your Referrals</h2>
          {referrals.length===0?<p style={{color:'#999'}}>No referrals yet.</p>:referrals.map((r:any)=>(
            <div key={r.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #f5f5f5',fontSize:14}}>
              <div><p style={{margin:0,fontWeight:600}}>{r.referredUsername||'User'}</p><p style={{margin:'2px 0 0 0',color:'#999',fontSize:12}}>{new Date(r.createdAt).toLocaleDateString()}</p></div>
              <div style={{textAlign:'right'}}><p style={{margin:0,color:'#10b981',fontWeight:600}}>${r.totalCommission?.toFixed(2)}</p><span style={{fontSize:11}}>{r.status}</span></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
