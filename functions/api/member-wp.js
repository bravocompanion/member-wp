const TOKEN_HASH='4babd07fb19ab0db40cd65f534f1f73dd7e7dbc55344ef3d71ce4cb396f2d092';
const UPSTREAM='https://apnbksfkenonbsvqbuok.supabase.co/functions/v1/member-wp-personal-api';
const COOKIE='member_wp_device';

function response(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff',...extra}})}
async function sha256(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function validToken(token){return Boolean(token&&token.length<=256&&(await sha256(token))===TOKEN_HASH)}
function cookieValue(request,name){const raw=request.headers.get('cookie')||'';for(const part of raw.split(';')){const [k,...rest]=part.trim().split('=');if(k===name){try{return decodeURIComponent(rest.join('='))}catch{return ''}}}return ''}
function setCookie(token){return `${COOKIE}=${encodeURIComponent(token)}; Path=/api/member-wp; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`}
function clearCookie(){return `${COOKIE}=; Path=/api/member-wp; Max-Age=0; HttpOnly; Secure; SameSite=Strict`}

export async function onRequest({request}){
  const url=new URL(request.url),action=url.searchParams.get('action')||'';
  if(action==='activate'){
    if(request.method!=='POST')return response({error:'method_not_allowed'},405);
    let body={};try{body=await request.json()}catch{return response({error:'invalid_json'},400)}
    const token=String(body?.token||'');if(!(await validToken(token)))return response({error:'invalid_activation'},403);
    return response({ok:true,activated:true},200,{'set-cookie':setCookie(token)});
  }
  if(action==='deactivate'){
    return response({ok:true,deactivated:true},200,{'set-cookie':clearCookie()});
  }
  const token=cookieValue(request,COOKIE);if(!(await validToken(token)))return response({error:'device_not_activated'},401);
  if(!['GET','POST'].includes(request.method))return response({error:'method_not_allowed'},405);
  const upstream=new URL(UPSTREAM);upstream.search=url.search;
  const headers=new Headers({'x-member-wp-server-key':token,'accept':'application/json'});const type=request.headers.get('content-type');if(type)headers.set('content-type',type);
  const init={method:request.method,headers};if(request.method!=='GET')init.body=await request.arrayBuffer();
  try{
    const r=await fetch(upstream.toString(),init);const outHeaders={'content-type':r.headers.get('content-type')||'application/json','cache-control':'no-store','x-content-type-options':'nosniff'};return new Response(r.body,{status:r.status,headers:outHeaders});
  }catch{return response({error:'upstream_unavailable'},502)}
}
