import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const COLLECTIONS=new Set(['taxpayers','tasks'])
const SESSION_DAYS=30

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})}
function b64Bytes(s:string){const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
function b64url(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fromB64url(s:string){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return b64Bytes(s)}
function timingEqual(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a[i]^b[i];return x===0}
async function sessionKey(){const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';const material=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('member-wp-session-v1|'+secret));return crypto.subtle.importKey('raw',material,{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
async function makeSession(username:string){const payload=b64url(new TextEncoder().encode(JSON.stringify({u:username,exp:Date.now()+SESSION_DAYS*86400000,v:1})));const key=await sessionKey();const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload)));return `${payload}.${b64url(sig)}`}
async function verifySession(req:Request){const token=req.headers.get('x-member-wp-session')||'';const [payload,sig]=token.split('.');if(!payload||!sig)return null;try{const key=await sessionKey();const ok=await crypto.subtle.verify('HMAC',key,fromB64url(sig),new TextEncoder().encode(payload));if(!ok)return null;const data=JSON.parse(new TextDecoder().decode(fromB64url(payload)));if(!data?.u||!data?.exp||Date.now()>Number(data.exp))return null;return data}catch{return null}}
async function verifyPassword(password:string,saltB64:string,hashB64:string,iterations:number){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:b64Bytes(saltB64),iterations,hash:'SHA-256'},base,256);return timingEqual(new Uint8Array(bits),b64Bytes(hashB64))}
function validId(value:unknown){return typeof value==='string'&&value.length>0&&value.length<=240}

Deno.serve(async(req:Request)=>{
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})
  const url=new URL(req.url),action=url.searchParams.get('action')||''
  try{
    if(req.method==='POST'&&action==='login'){
      let body:any={};try{body=await req.json()}catch{return json({error:'invalid_login'},400)}
      const username=String(body?.username||'').trim().toLowerCase(),password=String(body?.password||'')
      if(!username||!password||username.length>120||password.length>300)return json({error:'invalid_login'},401)
      const {data,error}=await supabase.from('member_wp_app_auth').select('username,salt_b64,hash_b64,iterations').eq('username',username).maybeSingle();if(error)throw error
      const ok=Boolean(data)&&await verifyPassword(password,data.salt_b64,data.hash_b64,Number(data.iterations))
      if(!ok){await new Promise(r=>setTimeout(r,500));return json({error:'invalid_login'},401)}
      return json({ok:true,username:data.username,session:await makeSession(data.username),expiresIn:SESSION_DAYS*86400})
    }
    const session=await verifySession(req);if(!session)return json({error:'unauthorized'},401)
    if(req.method==='GET'&&action==='session')return json({ok:true,username:session.u,expiresAt:session.exp})
    if(req.method==='GET'&&action==='bootstrap'){
      const rows:any[]=[]
      for(let from=0;;from+=1000){
        const {data,error}=await supabase.from('member_wp_single_records').select('collection,record_id,payload,updated_at').in('collection',['taxpayers','tasks']).order('collection').order('record_id').range(from,from+999)
        if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)break
      }
      return json({ok:true,version:'0.11.0',username:session.u,rows,credentialIds:[],counts:{records:rows.length,credentials:0,taxpayers:rows.filter(x=>x.collection==='taxpayers').length,tasks:rows.filter(x=>x.collection==='tasks').length}})
    }
    if(req.method==='GET'&&action==='health'){
      const {count:taxpayers,error:e1}=await supabase.from('member_wp_single_records').select('*',{count:'exact',head:true}).eq('collection','taxpayers');if(e1)throw e1
      const {count:tasks,error:e2}=await supabase.from('member_wp_single_records').select('*',{count:'exact',head:true}).eq('collection','tasks');if(e2)throw e2
      return json({ok:true,taxpayers,tasks,version:'0.11.0'})
    }
    if(req.method==='POST'){
      const body=await req.json();if(body?.action!=='mutate'||!Array.isArray(body.changes)||body.changes.length>250)return json({error:'invalid_mutation'},400)
      const upserts:any[]=[],deletes:any[]=[],at=new Date().toISOString()
      for(const change of body.changes){
        if(!COLLECTIONS.has(change?.collection)||!validId(change?.record_id)||!['upsert','delete'].includes(change?.op))return json({error:'invalid_change'},400)
        if(change.op==='upsert'){if(!change.payload||typeof change.payload!=='object')return json({error:'invalid_payload'},400);upserts.push({collection:change.collection,record_id:change.record_id,payload:change.payload,updated_at:at})}
        else deletes.push(change)
      }
      for(let i=0;i<upserts.length;i+=100){const {error}=await supabase.from('member_wp_single_records').upsert(upserts.slice(i,i+100),{onConflict:'collection,record_id'});if(error)throw error}
      for(const change of deletes){const {error}=await supabase.from('member_wp_single_records').delete().eq('collection',change.collection).eq('record_id',change.record_id);if(error)throw error}
      return json({ok:true,upserted:upserts.length,deleted:deletes.length})
    }
    return json({error:'not_found'},404)
  }catch(error){console.error('member-wp-personal-api',error instanceof Error?error.message:'error');return json({error:'server_error'},500)}
})