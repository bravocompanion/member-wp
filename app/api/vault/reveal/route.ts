import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isDemoMode } from '@/lib/data'

export const dynamic='force-dynamic'
export async function POST(req:Request){
  if(isDemoMode()) return NextResponse.json({error:'Reveal dinonaktifkan pada mode demo.'},{status:403,headers:{'cache-control':'private, no-store'}})
  const supabase=await createClient(); const {data:claims,error:authError}=await supabase.auth.getClaims(); const uid=claims?.claims?.sub as string|undefined
  if(authError||!uid) return NextResponse.json({error:'Unauthorized'},{status:401})
  const {data:profile}=await supabase.from('app_users').select('role').eq('id',uid).single(); if(profile?.role!=='admin') return NextResponse.json({error:'Credential hanya dapat dibuka oleh Admin.'},{status:403})
  const body=await req.json().catch(()=>null); const id=body?.id; if(!id) return NextResponse.json({error:'Credential ID wajib diisi.'},{status:400})
  const admin=createAdminClient(); const {data,error}=await admin.rpc('read_taxpayer_credential',{p_credential_id:id}); if(error) return NextResponse.json({error:error.message},{status:500})
  await admin.from('activity_logs').insert({actor_id:uid,action:'credential.reveal',entity_type:'credential_record',entity_id:id,metadata:{source:'member-wp-web'}})
  return NextResponse.json({secret:data},{headers:{'cache-control':'private, no-store, max-age=0','pragma':'no-cache'}})
}
