'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export function TaskDueDate({id,value,demo=false}:{id:string,value?:string|null,demo?:boolean}){
  const [date,setDate]=useState(value||''); const router=useRouter()
  async function change(v:string){setDate(v);if(demo)return;const r=await fetch('/api/compliance/task',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,due_date:v||null})});if(r.ok)router.refresh()}
  return <input className="dateInput" type="date" value={date} onChange={e=>change(e.target.value)}/>
}
