import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const KEY_HASH='4babd07fb19ab0db40cd65f534f1f73dd7e7dbc55344ef3d71ce4cb396f2d092'
const COLLECTIONS=new Set(['taxpayers','profiles','tasks','notes','activities','meta'])

function json(data:unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})
}
async function sha256(value:string){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')
}
async function authorized(req:Request){
  const key=req.headers.get('x-member-wp-server-key')||''
  return Boolean(key&&key.length<=256&&(await sha256(key))===KEY_HASH)
}
function validId(value:unknown){return typeof value==='string'&&value.length>0&&value.length<=240}

Deno.serve(async(req:Request)=>{
  if(!(await authorized(req)))return json({error:'forbidden'},403)
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})
  try{
    const url=new URL(req.url),action=url.searchParams.get('action')||''
    if(req.method==='GET'&&action==='bootstrap'){
      const rows:any[]=[]
      for(let from=0;;from+=1000){
        const {data,error}=await supabase.from('member_wp_single_records').select('collection,record_id,payload,updated_at').order('collection').order('record_id').range(from,from+999)
        if(error)throw error
        rows.push(...(data||[]))
        if(!data||data.length<1000)break
      }
      const {data:credentials,error}=await supabase.from('member_wp_single_credentials').select('taxpayer_id')
      if(error)throw error
      return json({ok:true,version:'0.8.0',rows,credentialIds:(credentials||[]).map((x:any)=>x.taxpayer_id),counts:{records:rows.length,credentials:credentials?.length||0,taxpayers:rows.filter(x=>x.collection==='taxpayers').length}})
    }
    if(req.method==='GET'&&action==='credential'){
      const id=url.searchParams.get('taxpayerId')||''
      if(!validId(id))return json({error:'invalid_taxpayer_id'},400)
      const {data,error}=await supabase.from('member_wp_single_credentials').select('payload').eq('taxpayer_id',id).maybeSingle()
      if(error)throw error
      return data?json({ok:true,taxpayerId:id,payload:data.payload}):json({error:'not_found'},404)
    }
    if(req.method==='GET'&&action==='health'){
      const {count:records,error:e1}=await supabase.from('member_wp_single_records').select('*',{count:'exact',head:true});if(e1)throw e1
      const {count:credentials,error:e2}=await supabase.from('member_wp_single_credentials').select('*',{count:'exact',head:true});if(e2)throw e2
      const {count:taxpayers,error:e3}=await supabase.from('member_wp_single_records').select('*',{count:'exact',head:true}).eq('collection','taxpayers');if(e3)throw e3
      return json({ok:true,records,credentials,taxpayers,version:'0.8.0'})
    }
    if(req.method==='POST'){
      const body=await req.json()
      if(body?.action!=='mutate'||!Array.isArray(body.changes)||body.changes.length>250)return json({error:'invalid_mutation'},400)
      const upserts:any[]=[],deletes:any[]=[],at=new Date().toISOString()
      for(const change of body.changes){
        if(!COLLECTIONS.has(change?.collection)||!validId(change?.record_id)||!['upsert','delete'].includes(change?.op))return json({error:'invalid_change'},400)
        if(change.op==='upsert'){
          if(!change.payload||typeof change.payload!=='object')return json({error:'invalid_payload'},400)
          upserts.push({collection:change.collection,record_id:change.record_id,payload:change.payload,updated_at:at})
        }else deletes.push(change)
      }
      for(let i=0;i<upserts.length;i+=100){const {error}=await supabase.from('member_wp_single_records').upsert(upserts.slice(i,i+100),{onConflict:'collection,record_id'});if(error)throw error}
      for(const change of deletes){const {error}=await supabase.from('member_wp_single_records').delete().eq('collection',change.collection).eq('record_id',change.record_id);if(error)throw error}
      return json({ok:true,upserted:upserts.length,deleted:deletes.length})
    }
    return json({error:'not_found'},404)
  }catch(error){
    console.error(error)
    return json({error:'server_error'},500)
  }
})
