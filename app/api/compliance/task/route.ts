import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowed=new Set(['not_started','waiting_documents','in_progress','waiting_review','waiting_client','blocked','completed','not_applicable'])
export async function PATCH(request:Request){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json().catch(()=>null); if(!body?.id) return NextResponse.json({error:'Task id required'},{status:400})
  const changes:any={}
  if(body.status!==undefined){if(!allowed.has(body.status)) return NextResponse.json({error:'Invalid status'},{status:400});changes.status=body.status;changes.completed_at=body.status==='completed'?new Date().toISOString():null}
  if(body.due_date!==undefined){if(body.due_date!==null && body.due_date!=='' && !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) return NextResponse.json({error:'Invalid due_date'},{status:400});changes.due_date=body.due_date||null}
  if(!Object.keys(changes).length) return NextResponse.json({error:'No changes'},{status:400})
  const {error}=await supabase.from('compliance_period_tasks').update(changes).eq('id',body.id); if(error) return NextResponse.json({error:error.message},{status:400})
  await supabase.from('activity_logs').insert({actor_id:user.id,action:'compliance_task_updated',entity_type:'compliance_task',entity_id:body.id,metadata:changes})
  return NextResponse.json({ok:true})
}
