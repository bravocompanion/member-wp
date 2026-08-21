'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export function NoteForm({taxpayerId,demo=false}:{taxpayerId:string,demo?:boolean}){
  const [text,setText]=useState(''); const [category,setCategory]=useState('general'); const [pinned,setPinned]=useState(false); const [msg,setMsg]=useState(''); const [saving,setSaving]=useState(false); const router=useRouter()
  async function submit(e:FormEvent){e.preventDefault();if(!text.trim())return
    if(demo){setMsg('Mode demo: perubahan tidak disimpan. Hubungkan Supabase untuk write persistence.');return}
    setSaving(true);setMsg('')
    try{const r=await fetch('/api/notes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taxpayer_id:taxpayerId,note_text:text,category,pinned})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Gagal menyimpan');setText('');setPinned(false);setMsg('Catatan tersimpan.');router.refresh()}catch(e:any){setMsg(e.message)}finally{setSaving(false)}
  }
  return <form className="noteForm" onSubmit={submit}><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Tulis catatan operasional..."/><div className="noteFormRow"><select value={category} onChange={e=>setCategory(e.target.value)}><option value="general">Umum</option><option value="tax">Pajak</option><option value="document">Dokumen</option><option value="payment">Pembayaran</option><option value="coretax">Coretax</option><option value="client">Client</option><option value="internal">Internal</option><option value="important">Penting</option></select><label className="pinCheck"><input type="checkbox" checked={pinned} onChange={e=>setPinned(e.target.checked)}/> Pin</label><button className="primaryBtn" disabled={saving}>{saving?'Menyimpan...':'Tambah Catatan'}</button></div>{msg&&<small className="formMsg">{msg}</small>}</form>
}
