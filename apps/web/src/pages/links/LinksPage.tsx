import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { apiService } from '../../services/api';

export default function LinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    apiService.getLinks({limit:50,sort:'createdAt',order:'desc'})
      .then(r => setLinks(r.data?.data||[]))
      .catch(console.error).finally(()=>setLoading(false));
  }, []);

  const handleDelete = async (id:string) => {
    if(!confirm('Delete?'))return;
    try{await apiService.deleteLink(id);setLinks(p=>p.filter(l=>l.id!==id));}catch{};
  };

  const copy = (url:string,id:string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(()=>setCopiedId(''),2000);
  };

  if(loading)return<Layout><div style={{textAlign:'center',padding:60}}><p>Loading...</p></div></Layout>;

  return (
    <Layout>
      <div style={{padding:'0 0 30px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:30}}>
          <h1 style={{fontSize:28,fontWeight:'bold',color:'#1a1a2e',margin:0}}>My Links</h1>
          <Link to="/links/new" style={{padding:'12px 24px',background:'#6366f1',color:'white',borderRadius:8,textDecoration:'none',fontWeight:600}}>+ New Link</Link>
        </div>
        {links.length===0?<p style={{color:'#999',textAlign:'center',padding:40}}>No links yet.</p>:links.map(l=>(
          <div key={l.id} style={{background:'white',borderRadius:12,padding:20,marginBottom:10,boxShadow:'0 1px 3px rgba(0,0,0,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
            <div style={{flex:1,minWidth:200}}>
              <a href={l.shortUrl} target="_blank" style={{color:'#6366f1',fontWeight:600,textDecoration:'none'}}>{l.shortUrl}</a>
              <p style={{color:'#999',fontSize:12,margin:'3px 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:300}}>{l.originalUrl}</p>
              <p style={{fontSize:12,color:'#666'}}>{l.currentClicks} clicks</p>
            </div>
            <div style={{display:'flex',gap:8}}>
              <span style={{fontSize:11,padding:'4px 10px',borderRadius:20,background:l.status==='active'?'#ecfdf5':'#fef3c7',color:l.status==='active'?'#10b981':'#f59e0b'}}>{l.status}</span>
              <button onClick={()=>copy(l.shortUrl,l.id)} style={{padding:'6px 12px',border:'1px solid #ddd',borderRadius:6,background:'white',cursor:'pointer',fontSize:12}}>{copiedId===l.id?'Copied':'Copy'}</button>
              <button onClick={()=>handleDelete(l.id)} style={{padding:'6px 12px',border:'1px solid #fecaca',borderRadius:6,background:'white',cursor:'pointer',fontSize:12,color:'#ef4444'}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
