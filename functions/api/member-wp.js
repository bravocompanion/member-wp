const COOKIE='member_wp_session';
const SESSION_DAYS=30;
const ALLOWED_COLLECTIONS=new Set(['taxpayers','tasks']);
let schemaReady=false;

function json(data,status=200,extra={}){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    ...extra,
  }});
}
function cookieValue(request,name){
  const raw=request.headers.get('cookie')||'';
  for(const part of raw.split(';')){
    const [k,...rest]=part.trim().split('=');
    if(k===name){try{return decodeURIComponent(rest.join('='))}catch{return ''}}
  }
  return '';
}
function setCookie(token,maxAge=SESSION_DAYS*86400){
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/api/member-wp; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}
function clearCookie(){return `${COOKIE}=; Path=/api/member-wp; Max-Age=0; HttpOnly; Secure; SameSite=Strict`}
function bytesToBase64Url(bytes){
  let s='';for(const b of bytes)s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlToBytes(value){
  const s=value.replace(/-/g,'+').replace(/_/g,'/');
  const padded=s+'='.repeat((4-s.length%4)%4),raw=atob(padded),out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;
}
async function hmacKey(secret){
  return crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function signSession(username,secret){
  const payload={u:username,exp:Date.now()+SESSION_DAYS*86400*1000};
  const body=bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key=await hmacKey(secret),sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)));
  return `${body}.${bytesToBase64Url(sig)}`;
}
async function verifySession(token,secret){
  try{
    const [body,sig]=String(token||'').split('.');if(!body||!sig)return null;
    const key=await hmacKey(secret);
    const ok=await crypto.subtle.verify('HMAC',key,base64UrlToBytes(sig),new TextEncoder().encode(body));
    if(!ok)return null;
    const payload=JSON.parse(new TextDecoder().decode(base64UrlToBytes(body)));
    if(!payload?.u||!payload?.exp||Date.now()>payload.exp)return null;
    return payload;
  }catch{return null}
}
async function secureTextEqual(a,b){
  const enc=new TextEncoder();
  const [ha,hb]=await Promise.all([
    crypto.subtle.digest('SHA-256',enc.encode(String(a))),
    crypto.subtle.digest('SHA-256',enc.encode(String(b))),
  ]);
  const aa=new Uint8Array(ha),bb=new Uint8Array(hb);let diff=0;
  for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];return diff===0;
}
async function ensureSchema(db){
  if(schemaReady)return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS member_wp_records (
      collection TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (collection, record_id)
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_member_wp_records_collection ON member_wp_records(collection)'),
  ]);
  schemaReady=true;
}
function sanitizeTaxpayer(p){
  return {
    id:String(p?.id||''),
    name:String(p?.name||'').trim(),
    type:p?.type==='OP'?'OP':'BADAN',
    status:p?.status==='inactive'?'inactive':'active',
    createdAt:p?.createdAt||new Date().toISOString(),
    updatedAt:p?.updatedAt||new Date().toISOString(),
  };
}
function sanitizeTask(p){
  const status=p?.status==='completed'?'completed':'not_started';
  return {
    id:String(p?.id||''),
    taxpayerId:String(p?.taxpayerId||''),
    title:'Monitoring Coretax DJP',
    code:'CORETAX_DJP_WEEKLY',
    kind:'weekly_monitoring',
    cadence:'weekly',
    status,
    priority:'medium',
    dueDate:p?.dueDate||null,
    weekStart:p?.weekStart||null,
    weekEnd:p?.weekEnd||null,
    completedAt:status==='completed'?(p?.completedAt||new Date().toISOString()):null,
    createdAt:p?.createdAt||new Date().toISOString(),
    updatedAt:p?.updatedAt||new Date().toISOString(),
  };
}
function sanitizePayload(collection,payload){
  if(collection==='taxpayers')return sanitizeTaxpayer(payload);
  if(collection==='tasks')return sanitizeTask(payload);
  return null;
}
function validRecord(collection,recordId,payload){
  if(!ALLOWED_COLLECTIONS.has(collection)||!recordId)return false;
  if(collection==='taxpayers')return payload?.id===recordId&&payload.name.length>0;
  return payload?.id===recordId&&payload.taxpayerId&&payload.weekStart;
}

export async function onRequest(context){
  const {request,env}=context;
  if(!env?.DB)return json({error:'database_not_bound'},503);
  if(!env?.SESSION_SECRET)return json({error:'session_secret_missing'},503);
  await ensureSchema(env.DB);

  const url=new URL(request.url);
  let body=null;
  if(request.method==='POST'){
    try{body=await request.json()}catch{body={}}
  }
  const action=url.searchParams.get('action')||body?.action||'';
  if(!['GET','POST'].includes(request.method))return json({error:'method_not_allowed'},405);

  if(action==='logout')return json({ok:true},200,{'set-cookie':clearCookie()});

  if(action==='login'){
    if(request.method!=='POST')return json({error:'method_not_allowed'},405);
    const expectedUser=String(env.MEMBER_WP_USERNAME||'memberwp');
    const expectedPassword=String(env.MEMBER_WP_PASSWORD||'');
    if(!expectedPassword)return json({error:'login_not_configured'},503);
    const userOk=await secureTextEqual(body?.username||'',expectedUser);
    const passOk=await secureTextEqual(body?.password||'',expectedPassword);
    if(!userOk||!passOk)return json({error:'invalid_login'},401);
    const token=await signSession(expectedUser,env.SESSION_SECRET);
    return json({ok:true,username:expectedUser,expiresIn:SESSION_DAYS*86400},200,{'set-cookie':setCookie(token)});
  }

  const session=await verifySession(cookieValue(request,COOKIE),env.SESSION_SECRET);
  if(!session)return json({error:'unauthorized'},401,{'set-cookie':clearCookie()});

  if(action==='bootstrap'){
    const result=await env.DB.prepare("SELECT collection, record_id, payload, updated_at FROM member_wp_records WHERE collection IN ('taxpayers','tasks') ORDER BY collection, record_id").all();
    const rows=[];
    for(const row of result.results||[]){
      try{rows.push({collection:row.collection,record_id:row.record_id,payload:JSON.parse(row.payload),updated_at:row.updated_at})}catch{}
    }
    const taxpayers=rows.filter(r=>r.collection==='taxpayers').length;
    return json({ok:true,username:session.u,rows,credentialIds:[],counts:{records:rows.length,credentials:0,taxpayers}});
  }

  if(action==='mutate'){
    if(request.method!=='POST')return json({error:'method_not_allowed'},405);
    const changes=Array.isArray(body?.changes)?body.changes:[];
    if(changes.length>500)return json({error:'too_many_changes'},400);
    const statements=[];
    let applied=0;
    for(const change of changes){
      const collection=String(change?.collection||''),recordId=String(change?.record_id||'');
      if(!ALLOWED_COLLECTIONS.has(collection)||!recordId)continue;
      if(change?.op==='delete'){
        statements.push(env.DB.prepare('DELETE FROM member_wp_records WHERE collection=? AND record_id=?').bind(collection,recordId));
        applied++;continue;
      }
      if(change?.op!=='upsert')continue;
      const payload=sanitizePayload(collection,change?.payload);
      if(!validRecord(collection,recordId,payload))continue;
      statements.push(env.DB.prepare(`INSERT INTO member_wp_records(collection,record_id,payload,updated_at)
        VALUES(?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(collection,record_id) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP`)
        .bind(collection,recordId,JSON.stringify(payload)));
      applied++;
    }
    if(statements.length)await env.DB.batch(statements);
    return json({ok:true,applied});
  }

  if(action==='health'){
    const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM member_wp_records').first();
    return json({ok:true,database:'cloudflare-d1',records:Number(count?.n||0)});
  }

  return json({error:'unknown_action'},404);
}
