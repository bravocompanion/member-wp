'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage(){
  const router=useRouter();const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false)
  const demo=process.env.NEXT_PUBLIC_SUPABASE_URL===undefined
  async function submit(e:React.FormEvent){e.preventDefault();if(demo){router.push('/dashboard');return}setBusy(true);setError('');const supabase=createClient();const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error){setError(error.message);return}router.replace('/dashboard');router.refresh()}
  return <div className="loginPage"><section className="loginVisual"><div className="brand"><div className="brandMark">M</div><div><strong>Member WP</strong><span>Tax Workspace</span></div></div><div><h1>Kelola WP, pelaporan dan dokumen dalam satu tempat.</h1><p>Credential sensitif dipisahkan dari data operasional dan hanya dapat dibuka melalui jalur server yang tercatat.</p></div><small>Member WP · Private operations workspace</small></section><section className="loginPanel"><form className="loginBox" onSubmit={submit}><h2>Masuk ke Member WP</h2><p>Gunakan akun staff yang terdaftar di Supabase Auth.</p><div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required={!demo} placeholder="nama@kantor.com"/></div><div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required={!demo} placeholder="••••••••"/></div>{error&&<div className="error">{error}</div>}<button className="loginBtn" disabled={busy}>{busy?'Masuk...':'Masuk'}</button>{demo&&<div className="demoTag">Mode demo: tombol Masuk membuka data sintetis tanpa autentikasi.</div>}</form></section></div>
}
