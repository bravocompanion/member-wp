'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const catalog=[
  ['PPH21','PPh 21','Bulanan'],['PPH23','PPh 23','Bulanan'],['PPH25','PPh 25','Bulanan'],['PPN','PPN','Bulanan'],['PPH_FINAL','PPh Final','Bulanan'],
  ['SPT_TAHUNAN_BADAN','SPT Tahunan Badan','Tahunan'],['SPT_TAHUNAN_OP','SPT Tahunan OP','Tahunan'],['LAPORAN_KEUANGAN','Laporan Keuangan Tahunan','Tahunan'],
] as const

export function ObligationManager({taxpayerId,existing,demo=false}:{taxpayerId:string,existing:any[],demo?:boolean}){
  const initial=useMemo(()=>new Set((existing||[]).filter(x=>x.active!==false).map(x=>x.code)),[existing])
  const [selected,setSelected]=useState(initial)
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const router=useRouter()
  function toggle(code:string){setSelected(prev=>{const n=new Set(prev);n.has(code)?n.delete(code):n.add(code);return n})}
  async function save(){
    if(demo){setMsg('Mode demo: perubahan tidak disimpan. Hubungkan Supabase untuk write persistence.');return}
    setSaving(true);setMsg('')
    try{
      const r=await fetch('/api/compliance/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taxpayer_id:taxpayerId,codes:[...selected]})})
      const j=await r.json(); if(!r.ok) throw new Error(j.error||'Gagal menyimpan')
      setMsg('Profil kewajiban tersimpan. Task periode berjalan dibuat tanpa deadline otomatis.');router.refresh()
    }catch(e:any){setMsg(e.message)}finally{setSaving(false)}
  }
  return <div className="obligationManager">
    <div className="obligationChoices">{catalog.map(([code,label,cadence])=><label className={selected.has(code)?'obligationChoice selected':'obligationChoice'} key={code}><input type="checkbox" checked={selected.has(code)} onChange={()=>toggle(code)}/><span><b>{label}</b><small>{cadence}</small></span></label>)}</div>
    <div className="managerFoot"><button className="primaryBtn" onClick={save} disabled={saving}>{saving?'Menyimpan...':'Simpan Profil Kewajiban'}</button><span>{msg}</span></div>
  </div>
}
