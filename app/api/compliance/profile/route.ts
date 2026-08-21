import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request:Request){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json().catch(()=>null)
  const taxpayerId=body?.taxpayer_id as string|undefined
  const codes=Array.isArray(body?.codes)?[...new Set(body.codes.filter((x:any)=>typeof x==='string'))] as string[]:[]
  if(!taxpayerId) return NextResponse.json({error:'taxpayer_id required'},{status:400})
  const {error:deactivateError}=await supabase.from('compliance_obligations').update({active:false}).eq('taxpayer_id',taxpayerId)
  if(deactivateError) return NextResponse.json({error:deactivateError.message},{status:400})
  if(codes.length){
    const {data:catalog,error:catalogError}=await supabase.from('obligation_catalog').select('code,label,default_cadence').in('code',codes)
    if(catalogError) return NextResponse.json({error:catalogError.message},{status:400})
    const rows=(catalog||[]).map((x:any)=>({taxpayer_id:taxpayerId,code:x.code,label:x.label,cadence:x.default_cadence,active:true,created_by:user.id}))
    const {data:obligations,error:upsertError}=await supabase.from('compliance_obligations').upsert(rows,{onConflict:'taxpayer_id,code,cadence'}).select('id,cadence')
    if(upsertError) return NextResponse.json({error:upsertError.message},{status:400})
    const now=new Date(); const year=now.getUTCFullYear(); const month=now.getUTCMonth()+1
    const taskRows=(obligations||[]).map((o:any)=>({taxpayer_id:taxpayerId,obligation_id:o.id,period_year:year,period_month:o.cadence==='monthly'?month:null,status:'not_started'}))
    if(taskRows.length){const {error:taskError}=await supabase.from('compliance_period_tasks').upsert(taskRows,{onConflict:'obligation_id,period_year,period_month',ignoreDuplicates:true});if(taskError) return NextResponse.json({error:taskError.message},{status:400})}
  }
  await supabase.from('activity_logs').insert({actor_id:user.id,action:'compliance_profile_updated',entity_type:'taxpayer',entity_id:taxpayerId,metadata:{codes}})
  return NextResponse.json({ok:true})
}
