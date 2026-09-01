import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const ALLOWED_FIELDS=new Set([
  'loginUsername','loginPassword','coretaxKey','coretaxPassphrase','efin','djpKey',
  'npwp16','emailPassword','registeredEmailOrNote','registeredEmailPassword',
  'primaryEmail','primaryEmailKey','secondaryEmail','secondaryEmailKey','phone',
  'registrationKey','nik','kk'
])

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
function b64Bytes(s:string){const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
function b64urlDecode(s:string){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return b64Bytes(s)}
async function sessionKey(){
  const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''
  const material=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('member-wp-session-v1|'+secret))
  return crypto.subtle.importKey('raw',material,{name:'HMAC',hash:'SHA-256'},false,['verify'])
}
async function verifySession(req:Request){
  const token=req.headers.get('x-member-wp-session')||'',parts=token.split('.')
  if(parts.length!==2)return null
  try{
    const [payload,sig]=parts,key=await sessionKey()
    const ok=await crypto.subtle.verify('HMAC',key,b64urlDecode(sig),new TextEncoder().encode(payload))
    if(!ok)return null
    const data=JSON.parse(new TextDecoder().decode(b64urlDecode(payload)))
    if(!data?.u||!data?.exp||Date.now()>Number(data.exp))return null
    return data
  }catch{return null}
}
function validId(value:unknown){return typeof value==='string'&&value.length>0&&value.length<=240}
function cleanPatch(raw:unknown){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null
  const out:Record<string,string>={}
  for(const [key,value] of Object.entries(raw as Record<string,unknown>)){
    if(!ALLOWED_FIELDS.has(key))continue
    if(typeof value!=='string')return null
    if(value.length>2000)return null
    out[key]=value
  }
  return out
}
function hasUsefulData(payload:Record<string,unknown>){
  return Object.entries(payload||{}).some(([key,value])=>!['sourceSheet','sourceRow'].includes(key)&&value!==null&&value!==undefined&&String(value).trim()!=='')
}

Deno.serve(async(req:Request)=>{
  const session=await verifySession(req)
  if(!session)return json({error:'unauthorized'},401)
  if(req.method!=='POST')return json({error:'method_not_allowed'},405)

  const url=new URL(req.url),action=url.searchParams.get('action')||''
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})

  try{
    let body:any={};try{body=await req.json()}catch{return json({error:'invalid_json'},400)}
    const taxpayerId=String(body?.taxpayerId||'')
    if(!validId(taxpayerId))return json({error:'invalid_taxpayer_id'},400)

    if(action==='credential-upsert'){
      const patch=cleanPatch(body?.patch)
      if(!patch||!Object.keys(patch).length)return json({error:'empty_patch'},400)
      const {data:member,error:memberError}=await supabase.from('member_wp_single_records').select('record_id').eq('collection','taxpayers').eq('record_id',taxpayerId).maybeSingle()
      if(memberError)throw memberError
      if(!member)return json({error:'taxpayer_not_found'},404)

      const {data:existing,error:existingError}=await supabase.from('member_wp_single_credentials').select('payload').eq('taxpayer_id',taxpayerId).maybeSingle()
      if(existingError)throw existingError
      const merged={...(existing?.payload||{}),...patch}
      if(!hasUsefulData(merged)){
        const {error:deleteError}=await supabase.from('member_wp_single_credentials').delete().eq('taxpayer_id',taxpayerId)
        if(deleteError)throw deleteError
        return json({ok:true,taxpayerId,hasCredential:false})
      }
      const {error:upsertError}=await supabase.from('member_wp_single_credentials').upsert({taxpayer_id:taxpayerId,payload:merged,updated_at:new Date().toISOString()},{onConflict:'taxpayer_id'})
      if(upsertError)throw upsertError
      return json({ok:true,taxpayerId,hasCredential:true,updatedFields:Object.keys(patch).length})
    }

    if(action==='credential-delete'){
      const {error}=await supabase.from('member_wp_single_credentials').delete().eq('taxpayer_id',taxpayerId)
      if(error)throw error
      return json({ok:true,taxpayerId,deleted:true})
    }

    return json({error:'not_found'},404)
  }catch(error){
    console.error('member-wp-credential-api',error)
    return json({error:'server_error'},500)
  }
})
