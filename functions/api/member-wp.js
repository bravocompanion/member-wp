const UPSTREAM='https://apnbksfkenonbsvqbuok.supabase.co/functions/v1/member-wp-personal-api';
const COOKIE='member_wp_session';

function response(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff',...extra}})}
function cookieValue(request,name){const raw=request.headers.get('cookie')||'';for(const part of raw.split(';')){const [k,...rest]=part.trim().split('=');if(k===name){try{return decodeURIComponent(rest.join('='))}catch{return ''}}}return ''}
function setCookie(token,maxAge=2592000){return `${COOKIE}=${encodeURIComponent(token)}; Path=/api/member-wp; Max-Age=${Math.max(60,Number(maxAge)||2592000)}; HttpOnly; Secure; SameSite=Strict`}
function clearCookie(){return `${COOKIE}=; Path=/api/member-wp; Max-Age=0; HttpOnly; Secure; SameSite=Strict`}
async function proxy(upstream,request,session=''){
  const headers=new Headers({'accept':'application/json'});if(session)headers.set('x-member-wp-session',session);const type=request.headers.get('content-type');if(type)headers.set('content-type',type);
  const init={method:request.method,headers};if(request.method!=='GET')init.body=await request.arrayBuffer();
  try{const r=await fetch(upstream.toString(),init);return r}catch{return null}
}

export async function onRequest({request}){
  const url=new URL(request.url),action=url.searchParams.get('action')||'';
  if(!['GET','POST'].includes(request.method))return response({error:'method_not_allowed'},405);

  if(action==='logout')return response({ok:true},200,{'set-cookie':clearCookie()});

  const upstream=new URL(UPSTREAM);upstream.search=url.search;
  if(action==='login'){
    if(request.method!=='POST')return response({error:'method_not_allowed'},405);
    const r=await proxy(upstream,request);if(!r)return response({error:'upstream_unavailable'},502);
    let body=null;try{body=await r.json()}catch{}
    if(!r.ok||!body?.session)return response({error:body?.error||'invalid_login'},r.status||401);
    const {session,expiresIn,...safe}=body;return response(safe,200,{'set-cookie':setCookie(session,expiresIn)});
  }

  const session=cookieValue(request,COOKIE);if(!session)return response({error:'unauthorized'},401);
  const r=await proxy(upstream,request,session);if(!r)return response({error:'upstream_unavailable'},502);
  const outHeaders={'content-type':r.headers.get('content-type')||'application/json','cache-control':'no-store','x-content-type-options':'nosniff'};
  const disposition=r.headers.get('content-disposition');if(disposition)outHeaders['content-disposition']=disposition;
  const length=r.headers.get('content-length');if(length)outHeaders['content-length']=length;
  if(r.status===401)outHeaders['set-cookie']=clearCookie();
  return new Response(r.body,{status:r.status,headers:outHeaders});
}
