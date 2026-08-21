import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const categories=new Set(['general','tax','document','payment','coretax','client','internal','important'])
export async function POST(request:Request){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json().catch(()=>null); const taxpayerId=body?.taxpayer_id; const note=typeof body?.note_text==='string'?body.note_text.trim():''; const category=categories.has(body?.category)?body.category:'general'
  if(!taxpayerId||!note) return NextResponse.json({error:'Taxpayer and note are required'},{status:400})
  const {data,error}=await supabase.from('taxpayer_notes').insert({taxpayer_id:taxpayerId,note_text:note,category,pinned:Boolean(body?.pinned),created_by:user.id}).select('id').single(); if(error) return NextResponse.json({error:error.message},{status:400})
  await supabase.from('activity_logs').insert({actor_id:user.id,action:'taxpayer_note_created',entity_type:'taxpayer',entity_id:taxpayerId,metadata:{note_id:data.id,category,pinned:Boolean(body?.pinned)}})
  return NextResponse.json({ok:true,id:data.id})
}
