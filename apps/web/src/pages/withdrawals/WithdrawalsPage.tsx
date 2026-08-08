import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { apiService } from '../../services/api';

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({amount:'',method:'paypal',paymentEmail:''});

  useEffect(() => {
    Promise.all([apiService.getWithdrawals({limit:50}),apiService.getBalance()])
      .then(([wRes,bRes])=>{
        setWithdrawals(wRes.data?.data||[]);
        setBalance(bRes.data?.data?.availableBalance||0);
      }).catch(console.error);
  }, []);

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    try{
      await apiService.requestWithdrawal({amount:parseFloat(form.amount),method:form.method,paymentEmail:form.paymentEmail||undefined});
      alert('Requested!');
      setShowForm(false);
      window.location.reload();
    }catch(err:any){alert(err.message||'Failed');}
  };

  return (
    <Layout>
      <div style={{padding:'0 0 30px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:30}}>
          <h1 style={{fontSize:28,fontWeight:'bold',color:'#1a1a2e',margin:0}}>Withdrawals</h1>
          <button onClick={()=>setShowForm(true)} style={{padding:'12px 24px',background:'#6366f1',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>+ Request</button>
        </div>
        <div style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',borderRadius:16,padding:24,color:'white',marginBottom:30}}>
          <p style={{fontSize:14,margin:0,opacity:.9}}>Available</p>
          <p style={{fontSize:36,fontWeight:'bold',margin:'8px 0 0 0'}}>${balance.toFixed(2)}</p>
        </div>
        {showForm&&(
          <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',marginBottom:20}}>
            <h3 style={{margin:'0 0 15px 0'}}>Request Withdrawal</h3>
            <form onSubmit={handleSubmit}>
              <input type="number" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} min={10} max={balance} step="0.01" required style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'1px solid #ddd'}} />
              <select value={form.method} onChange={e=>setForm({...form,method:e.target.value})} style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'1px solid #ddd'}}>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
              <input type="email" placeholder="PayPal Email" value={form.paymentEmail} onChange={e=>setForm({...form,paymentEmail:e.target.value})} style={{width:'100%',padding:12,marginBottom:12,borderRadius:8,border:'1px solid #ddd'}} />
              <div style={{display:'flex',gap:10}}>
                <button type="submit" style={{padding:'12px 24px',background:'#6366f1',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>Submit</button>
                <button type="button" onClick={()=>setShowForm(false)} style={{padding:'12px 24px',background:'#f5f5f5',border:'none',borderRadius:8,cursor:'pointer'}}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        <div style={{background:'white',borderRadius:12,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <h2 style={{fontSize:18,fontWeight:600,margin:'0 0 15px 0'}}>History</h2>
          {withdrawals.length===0?<p style={{color:'#999'}}>No withdrawals.</p>:withdrawals.map((w:any)=>(
            <div key={w.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid #f5f5f5',fontSize:14}}>
              <div><p style={{margin:0,fontWeight:600}}>${w.netAmount?.toFixed(2)} via {w.method}</p><p style={{margin:'2px 0 0 0',color:'#999',fontSize:12}}>{new Date(w.createdAt).toLocaleDateString()}</p></div>
              <span style={{padding:'4px 10px',borderRadius:20,background:w.status==='completed'?'#ecfdf5':'#fef3c7',color:w.status==='completed'?'#10b981':'#f59e0b',fontSize:11}}>{w.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
