'use client'
import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function RevealCredential({id}:{id:string}){
  const [secret,setSecret]=useState<string|null>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState('')
  async function reveal(){
    if(secret){setSecret(null);return}
    setLoading(true);setError('')
    try{const r=await fetch('/api/vault/reveal',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id}),cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Gagal membuka credential');setSecret(j.secret)}catch(e:any){setError(e.message)}finally{setLoading(false)}
  }
  return <div><button className="btn secondary" onClick={reveal} disabled={loading}>{loading?<Loader2 size={14}/>:secret?<EyeOff size={14}/>:<Eye size={14}/>} {secret?'Sembunyikan':'Reveal'}</button>{secret&&<div className="mono" style={{marginTop:8,padding:10,background:'#f4f7f9',borderRadius:8,fontSize:12,wordBreak:'break-all'}}>{secret}</div>}{error&&<div className="error">{error}</div>}</div>
}
