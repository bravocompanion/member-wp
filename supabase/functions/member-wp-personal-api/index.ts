import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const COLLECTIONS=new Set(['taxpayers','profiles','tasks','notes','activities','meta'])
const SESSION_DAYS=30
const ARCHIVE_BUCKET='member-wp-archives'
const ARCHIVE_MAX_BYTES=20*1024*1024
const ARCHIVE_CATEGORIES=new Set(['Pajak','SPT','Bukti Bayar','Laporan Keuangan','Legal','Surat','Lainnya'])
const ARCHIVE_MIME=new Set([
  'application/pdf','image/jpeg','image/png','image/webp','text/plain','text/csv','text/xml','application/xml','application/zip',
  'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
])
const MIME_BY_EXT:Record<string,string>={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',txt:'text/plain',csv:'text/csv',xml:'application/xml',zip:'application/zip',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}

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
function cleanText(value:unknown,max:number){return String(value??'').replace(/[\r\n\0]/g,' ').trim().slice(0,max)}
function extension(name:string){const m=name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);return m?m[1]:''}
function mimeFor(name:string,header:string){const h=header.split(';')[0].trim().toLowerCase();if(ARCHIVE_MIME.has(h))return h;const guessed=MIME_BY_EXT[extension(name)]||'';return ARCHIVE_MIME.has(guessed)?guessed:''}
function safePathPart(value:string){return value.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)||'wp'}
async function memberExists(supabase:any,id:string){const {data,error}=await supabase.from('member_wp_single_records').select('record_id').eq('collection','taxpayers').eq('record_id',id).maybeSingle();if(error)throw error;return Boolean(data)}

Deno.serve(async(req:Request)=>{
  const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})
  const url=new URL(req.url),action=url.searchParams.get('action')||''
  try{
    if(req.method==='POST'&&action==='login'){
      let body:any={};try{body=await req.json()}catch{return json({error:'invalid_login'},400)}
      const username=String(body?.username||'').trim().toLowerCase();const password=String(body?.password||'')
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
      for(let from=0;;from+=1000){const {data,error}=await supabase.from('member_wp_single_records').select('collection,record_id,payload,updated_at').order('collection').order('record_id').range(from,from+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)break}
      const {data:credentials,error}=await supabase.from('member_wp_single_credentials').select('taxpayer_id');if(error)throw error
      const {count:archives,error:archiveError}=await supabase.from('member_wp_archives').select('*',{count:'exact',head:true});if(archiveError)throw archiveError
      return json({ok:true,version:'0.10.0',username:session.u,rows,credentialIds:(credentials||[]).map((x:any)=>x.taxpayer_id),counts:{records:rows.length,credentials:credentials?.length||0,taxpayers:rows.filter(x=>x.collection==='taxpayers').length,archives:archives||0}})
    }

    if(req.method==='GET'&&action==='credential'){
      const id=url.searchParams.get('taxpayerId')||'';if(!validId(id))return json({error:'invalid_taxpayer_id'},400)
      const {data,error}=await supabase.from('member_wp_single_credentials').select('payload').eq('taxpayer_id',id).maybeSingle();if(error)throw error
      return data?json({ok:true,taxpayerId:id,payload:data.payload}):json({error:'not_found'},404)
    }

    if(req.method==='GET'&&action==='archives'){
      const id=url.searchParams.get('taxpayerId')||'';if(!validId(id))return json({error:'invalid_taxpayer_id'},400)
      if(!(await memberExists(supabase,id)))return json({error:'taxpayer_not_found'},404)
      const {data,error}=await supabase.from('member_wp_archives').select('id,taxpayer_id,file_name,mime_type,size_bytes,category,note,uploaded_at').eq('taxpayer_id',id).order('uploaded_at',{ascending:false});if(error)throw error
      return json({ok:true,taxpayerId:id,archives:data||[]})
    }

    if(req.method==='POST'&&action==='archive-upload'){
      const taxpayerId=url.searchParams.get('taxpayerId')||'';if(!validId(taxpayerId))return json({error:'invalid_taxpayer_id'},400)
      if(!(await memberExists(supabase,taxpayerId)))return json({error:'taxpayer_not_found'},404)
      const fileName=cleanText(url.searchParams.get('name')||'',180);if(!fileName)return json({error:'invalid_file_name'},400)
      const categoryRaw=cleanText(url.searchParams.get('category')||'Lainnya',40);const category=ARCHIVE_CATEGORIES.has(categoryRaw)?categoryRaw:'Lainnya'
      const note=cleanText(url.searchParams.get('note')||'',500)
      const mime=mimeFor(fileName,req.headers.get('content-type')||'');if(!mime)return json({error:'unsupported_file_type'},415)
      const bytes=new Uint8Array(await req.arrayBuffer());if(!bytes.length)return json({error:'empty_file'},400);if(bytes.byteLength>ARCHIVE_MAX_BYTES)return json({error:'file_too_large'},413)
      const archiveId=crypto.randomUUID(),ext=extension(fileName),path=`${safePathPart(taxpayerId)}/${new Date().getUTCFullYear()}/${archiveId}${ext?'.'+ext:''}`
      const {error:uploadError}=await supabase.storage.from(ARCHIVE_BUCKET).upload(path,bytes,{contentType:mime,cacheControl:'0',upsert:false});if(uploadError)throw uploadError
      const row={id:archiveId,taxpayer_id:taxpayerId,file_name:fileName,storage_path:path,mime_type:mime,size_bytes:bytes.byteLength,category,note,uploaded_at:new Date().toISOString()}
      const {error:insertError}=await supabase.from('member_wp_archives').insert(row);if(insertError){await supabase.storage.from(ARCHIVE_BUCKET).remove([path]);throw insertError}
      const {storage_path,...safe}=row;return json({ok:true,archive:safe},201)
    }

    if(req.method==='GET'&&action==='archive-download'){
      const id=url.searchParams.get('id')||'';if(!validId(id))return json({error:'invalid_archive_id'},400)
      const {data:row,error}=await supabase.from('member_wp_archives').select('file_name,storage_path,mime_type,size_bytes').eq('id',id).maybeSingle();if(error)throw error;if(!row)return json({error:'not_found'},404)
      const {data:file,error:downloadError}=await supabase.storage.from(ARCHIVE_BUCKET).download(row.storage_path);if(downloadError)throw downloadError
      const safeName=String(row.file_name).replace(/[\r\n"]/g,'_');return new Response(file.stream(),{status:200,headers:{'content-type':row.mime_type||'application/octet-stream','content-length':String(row.size_bytes||file.size),'content-disposition':`attachment; filename="${safeName.replace(/[^\x20-\x7E]/g,'_')}"; filename*=UTF-8''${encodeURIComponent(row.file_name)}`,'cache-control':'private, no-store','x-content-type-options':'nosniff'}})
    }

    if(req.method==='POST'&&action==='archive-delete'){
      let body:any={};try{body=await req.json()}catch{return json({error:'invalid_json'},400)}
      const id=String(body?.id||'');if(!validId(id))return json({error:'invalid_archive_id'},400)
      const {data:row,error}=await supabase.from('member_wp_archives').select('storage_path,file_name,taxpayer_id').eq('id',id).maybeSingle();if(error)throw error;if(!row)return json({error:'not_found'},404)
      const {error:removeError}=await supabase.storage.from(ARCHIVE_BUCKET).remove([row.storage_path]);if(removeError)throw removeError
      const {error:deleteError}=await supabase.from('member_wp_archives').delete().eq('id',id);if(deleteError)throw deleteError
      return json({ok:true,id,fileName:row.file_name,taxpayerId:row.taxpayer_id})
    }

    if(req.method==='POST'&&action==='archive-delete-all'){
      let body:any={};try{body=await req.json()}catch{return json({error:'invalid_json'},400)}
      const taxpayerId=String(body?.taxpayerId||'');if(!validId(taxpayerId))return json({error:'invalid_taxpayer_id'},400)
      const {data:rows,error}=await supabase.from('member_wp_archives').select('storage_path').eq('taxpayer_id',taxpayerId);if(error)throw error
      const paths=(rows||[]).map((x:any)=>x.storage_path).filter(Boolean);for(let i=0;i<paths.length;i+=100){const {error:removeError}=await supabase.storage.from(ARCHIVE_BUCKET).remove(paths.slice(i,i+100));if(removeError)throw removeError}
      const {error:deleteError}=await supabase.from('member_wp_archives').delete().eq('taxpayer_id',taxpayerId);if(deleteError)throw deleteError
      return json({ok:true,taxpayerId,deleted:paths.length})
    }

    if(req.method==='GET'&&action==='health'){
      const {count:records,error:e1}=await supabase.from('member_wp_single_records').select('*',{count:'exact',head:true});if(e1)throw e1
      const {count:credentials,error:e2}=await supabase.from('member_wp_single_credentials').select('*',{count:'exact',head:true});if(e2)throw e2
      const {count:taxpayers,error:e3}=await supabase.from('member_wp_single_records').select('*',{count:'exact',head:true}).eq('collection','taxpayers');if(e3)throw e3
      const {count:archives,error:e4}=await supabase.from('member_wp_archives').select('*',{count:'exact',head:true});if(e4)throw e4
      return json({ok:true,records,credentials,taxpayers,archives,version:'0.10.0'})
    }

    if(req.method==='POST'){
      const body=await req.json();if(body?.action!=='mutate'||!Array.isArray(body.changes)||body.changes.length>250)return json({error:'invalid_mutation'},400)
      const upserts:any[]=[],deletes:any[]=[],at=new Date().toISOString()
      for(const change of body.changes){if(!COLLECTIONS.has(change?.collection)||!validId(change?.record_id)||!['upsert','delete'].includes(change?.op))return json({error:'invalid_change'},400);if(change.op==='upsert'){if(!change.payload||typeof change.payload!=='object')return json({error:'invalid_payload'},400);upserts.push({collection:change.collection,record_id:change.record_id,payload:change.payload,updated_at:at})}else deletes.push(change)}
      for(let i=0;i<upserts.length;i+=100){const {error}=await supabase.from('member_wp_single_records').upsert(upserts.slice(i,i+100),{onConflict:'collection,record_id'});if(error)throw error}
      for(const change of deletes){const {error}=await supabase.from('member_wp_single_records').delete().eq('collection',change.collection).eq('record_id',change.record_id);if(error)throw error}
      return json({ok:true,upserted:upserts.length,deleted:deletes.length})
    }
    return json({error:'not_found'},404)
  }catch(error){console.error(error);return json({error:'server_error'},500)}
})
