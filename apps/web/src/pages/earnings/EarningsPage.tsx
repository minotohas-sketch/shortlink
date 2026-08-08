import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { apiService } from '../../services/api';

export default function EarningsPage() {
  const [balance, setBalance] = useState(0);
  const [earnings, setEarnings] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([apiService.getBalance(),apiService.getEarnings({limit:50})])
      .then(([bRes,eRes])=>{
        setBalance(bRes.data?.data?.availableBalance||0);
        const list=eRes.data?.data||eRes.data?.earnings||[];
        setEarnings(Array.isArray(list)?list:[]);
      }).catch(console.error);
  }, []);

  return (
    <Layout>
      <div style={{padding:'0 0 30px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:30}}>
          <h1 style={{fontSize:28,fontWeight:'bold',color:'#1a1a2e',margin:0}}>Earnings</h1>
          <Link to="/withdrawals" style={{padding:'12px 24px',background:'#10b981',color:'white',borderRadius:8,textDecoration:'none',fontWeight:600}}>Withdraw</Link>
        </div>
        <div style={{background:'linear-gradient(135deg,#10b981,#059669)',borderRadius:16,padding:30,color:'white',marginBottom:30}}>
          <p style={{fontSize:14,margin:0,opacity:.9}}>Available Balance</p>
          <p style={{fontSize:48,fontWeight:'bold',margin:'10px 0 0 0'}}>${balance.toFixed(2)}</p>
        </div>
        <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <h2 style={{fontSize:18,fontWeight:600,margin:'0 0 15px 0'}}>Earnings History</h2>
          {earnings.length===0?<p style={{color:'#999'}}>No earnings yet.</p>:earnings.map((e:any)=>(
            <div key={e.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #f5f5f5',fontSize:14}}>
              <div><p style={{margin:0,fontWeight:600}}>+${e.amount.toFixed(4)}</p><p style={{margin:'2px 0 0 0',color:'#999',fontSize:12}}>{e.source} · {new Date(e.createdAt).toLocaleDateString()}</p></div>
              <span style={{padding:'4px 10px',borderRadius:20,background:e.status==='approved'?'#ecfdf5':'#fef3c7',color:e.status==='approved'?'#10b981':'#f59e0b',fontSize:11}}>{e.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
