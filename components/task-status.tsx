'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
const options=[['not_started','Belum'],['waiting_documents','Tunggu Dokumen'],['in_progress','Proses'],['waiting_review','Review'],['waiting_client','Tunggu Client'],['blocked','Kendala'],['completed','Selesai'],['not_applicable','N/A']]
export function TaskStatus({id,status,demo=false}:{id:string,status:string,demo?:boolean}){
 const [value,setValue]=useState(status);const router=useRouter()
 async function change(v:string){setValue(v);if(demo)return;const r=await fetch('/api/compliance/task',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:v})});if(r.ok)router.refresh()}
 return <select className="statusSelect" value={value} onChange={e=>change(e.target.value)}>{options.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
}
