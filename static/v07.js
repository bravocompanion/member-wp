/* Member WP v0.7 — Supabase Auth + Local-first Cloud Sync */
const V07_VERSION='0.7.0';
const V07_SUPABASE_URL='https://apnbksfkenonbsvqbuok.supabase.co';
const V07_SUPABASE_PUBLISHABLE_KEY='sb_publishable_4lJ6y3RGALfUqPxt22-tzQ_Rd1w3p5Q';
const V07_ID_FIELD={taxpayers:'id',profiles:'taxpayerId',tasks:'id',notes:'id',activities:'id',meta:'key'};
let v07Client=null;
let v07User=null;
let v07Syncing=false;
let v07Pending=new Map();
let v07FlushTimer=null;
let v07RemoteCount=0;

function v07Esc(s){return typeof esc==='function'?esc(s):String(s??'')}
function v07Id(store,row){return String(row?.[V07_ID_FIELD[store]]??'')}
function v07StatusText(){return v07User?`Cloud · ${v07RemoteCount} record`:'Cloud · belum login'}
function v07LocalCount(){return STORES.reduce((n,k)=>n+(state[k]?.length||0),0)}
function v07Connected(){return Boolean(v07Client&&v07User)}

function v07EnsureShell(){
  if(!document.getElementById('v07Auth')){
    const el=document.createElement('div');el.id='v07Auth';el.className='v07-auth';document.body.appendChild(el);
  }
  const top=document.querySelector('.topactions');
  if(top&&!document.getElementById('v07CloudBtn')){
    const b=document.createElement('button');b.id='v07CloudBtn';b.className='btn';b.onclick=()=>v07OpenCloudPanel();top.prepend(b);
  }
}
function v07RenderAuth(){
  v07EnsureShell();
  const el=document.getElementById('v07Auth');if(!el)return;
  if(v07User){el.classList.remove('show');el.innerHTML='';return}
  el.classList.add('show');
  el.innerHTML=`<div class="v07-auth-card"><div class="v07-auth-brand"><div class="mark">M</div><div><b>Member WP</b><small>Supabase Cloud</small></div></div><h1>Masuk ke Member WP</h1><p>Data cloud hanya dapat dibaca oleh akun yang login. IndexedDB tetap digunakan sebagai cache lokal.</p><div class="field"><label>Email</label><input id="v07Email" type="email" autocomplete="email" placeholder="email@contoh.com"></div><div class="field"><label>Password</label><input id="v07Password" type="password" autocomplete="current-password" placeholder="Minimal 6 karakter"></div><div id="v07AuthMessage" class="v07-auth-message"></div><div class="v07-auth-actions"><button class="btn primary" onclick="v07SignIn()">Masuk</button><button class="btn" onclick="v07SignUp()">Buat Akun</button></div><small class="v07-auth-note">Jika membuat akun baru dan konfirmasi email aktif, cek email lalu kembali ke halaman ini untuk masuk.</small></div>`;
}
function v07SetAuthMessage(text,kind=''){const e=document.getElementById('v07AuthMessage');if(e){e.textContent=text;e.className=`v07-auth-message ${kind}`}}
function v07UpdateCloudBadge(){
  const b=document.getElementById('v07CloudBtn');if(b){b.textContent=v07Connected()?`Cloud ✓ ${v07RemoteCount}`:'Cloud';b.classList.toggle('v07-cloud-ok',v07Connected())}
  const foot=document.querySelector('.sidefoot');if(foot&&v07User){foot.innerHTML=`<b>Cloud + Local</b><br><span>${v07Esc(v07User.email||'authenticated')}</span>`}
  const notice=document.querySelector('.notice');if(notice&&v07User){notice.innerHTML=`<b>Supabase aktif</b> · ${v07RemoteCount} record cloud · cache lokal ${v07LocalCount()} record · ${v07Esc(location.host)}`}
}

async function v07SignIn(){
  try{
    const email=document.getElementById('v07Email')?.value.trim(),password=document.getElementById('v07Password')?.value||'';
    if(!email||!password)throw new Error('Email dan password wajib diisi.');v07SetAuthMessage('Masuk...');
    const {data,error}=await v07Client.auth.signInWithPassword({email,password});if(error)throw error;
    await v07AcceptSession(data.session);
  }catch(e){v07SetAuthMessage(e.message||'Login gagal.','error')}
}
async function v07SignUp(){
  try{
    const email=document.getElementById('v07Email')?.value.trim(),password=document.getElementById('v07Password')?.value||'';
    if(!email||password.length<6)throw new Error('Isi email dan password minimal 6 karakter.');v07SetAuthMessage('Membuat akun...');
    const {data,error}=await v07Client.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});if(error)throw error;
    if(data.session)await v07AcceptSession(data.session);else v07SetAuthMessage('Akun dibuat. Cek email konfirmasi, lalu kembali dan tekan Masuk.','ok');
  }catch(e){v07SetAuthMessage(e.message||'Pendaftaran gagal.','error')}
}
async function v07SignOut(){if(!v07Client)return;await v07FlushPending();await v07Client.auth.signOut();v07User=null;v07RemoteCount=0;v07RenderAuth();v07UpdateCloudBadge();closeModal?.()}

async function v07AcceptSession(session){
  if(!session){v07User=null;v07RenderAuth();return}
  const {data,error}=await v07Client.auth.getUser();if(error||!data?.user){v07User=null;v07RenderAuth();return}
  v07User=data.user;v07RenderAuth();await v07RefreshRemoteCount();v07UpdateCloudBadge();await v07InitialReconcile();
}
async function v07RefreshRemoteCount(){
  if(!v07Connected())return 0;
  const {count,error}=await v07Client.from('member_wp_records').select('*',{count:'exact',head:true});if(error)throw error;
  v07RemoteCount=count||0;v07UpdateCloudBadge();return v07RemoteCount;
}
async function v07FetchRemoteRows(){
  const rows=[];let from=0;const page=1000;
  while(true){const {data,error}=await v07Client.from('member_wp_records').select('collection,record_id,payload,updated_at').range(from,from+page-1);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<page)break;from+=page}
  return rows;
}
async function v07RemoteState(){
  if(!v07Connected())return null;
  const {data,error}=await v07Client.from('member_wp_sync_state').select('*').maybeSingle();if(error)throw error;return data||null;
}
async function v07InitialReconcile(){
  try{
    const local=v07LocalCount(),remote=await v07RefreshRemoteCount();
    if(remote>0&&local===0){await v07PullAll(false);return}
    if(remote===0&&local>0){setTimeout(()=>v07OpenCloudPanel(true),250);return}
  }catch(e){console.warn('v0.7 initial reconcile',e)}
}

async function v07CollectLocalRows(){
  const out=[];
  for(const store of STORES){const rows=await all(store);for(const row of rows){const id=v07Id(store,row);if(id)out.push({owner_id:v07User.id,collection:store,record_id:id,payload:row,updated_at:new Date().toISOString()})}}
  return out;
}
async function v07PushAll(confirmFirst=true){
  if(!v07Connected())return v07RenderAuth();
  try{
    const localRows=await v07CollectLocalRows();
    if(confirmFirst&&!confirm(`Upload ${localRows.length} record lokal ke Supabase? Data cloud akun ini akan diselaraskan dengan browser ini.`))return;
    v07Syncing=true;v07SetCloudWorking('Mengunggah ke Supabase...');
    const existing=await v07FetchRemoteRows(),localKeys=new Set(localRows.map(r=>`${r.collection}|${r.record_id}`));
    for(let i=0;i<localRows.length;i+=400){const chunk=localRows.slice(i,i+400);const {error}=await v07Client.from('member_wp_records').upsert(chunk,{onConflict:'owner_id,collection,record_id'});if(error)throw error}
    const staleByStore={};for(const r of existing){if(!localKeys.has(`${r.collection}|${r.record_id}`)){(staleByStore[r.collection]??=[]).push(r.record_id)}}
    for(const [collection,ids] of Object.entries(staleByStore)){for(let i=0;i<ids.length;i+=300){const {error}=await v07Client.from('member_wp_records').delete().eq('collection',collection).in('record_id',ids.slice(i,i+300));if(error)throw error}}
    const at=new Date().toISOString();const {error:stateError}=await v07Client.from('member_wp_sync_state').upsert({owner_id:v07User.id,source_origin:location.origin,record_count:localRows.length,client_version:V07_VERSION,last_push_at:at,updated_at:at},{onConflict:'owner_id'});if(stateError)throw stateError;
    v07RemoteCount=localRows.length;v07Pending.clear();await v07OriginalPut('meta',{key:'v07LastCloudPush',value:at,at});await loadState();renderAll();v07UpdateCloudBadge();v07SetCloudWorking('Upload selesai.');
  }catch(e){alert(`Upload Supabase gagal:\n${e.message}`)}finally{v07Syncing=false;v07UpdateCloudBadge()}
}
async function v07PullAll(confirmFirst=true){
  if(!v07Connected())return v07RenderAuth();
  try{
    const rows=await v07FetchRemoteRows();if(!rows.length){if(confirmFirst)alert('Cloud belum memiliki data.');return}
    if(confirmFirst&&!confirm(`Download ${rows.length} record dari Supabase dan ganti database lokal browser ini?`))return;
    v07Syncing=true;v07SetCloudWorking('Mengunduh dari Supabase...');
    const grouped=Object.fromEntries(STORES.map(k=>[k,[]]));for(const r of rows){if(grouped[r.collection])grouped[r.collection].push(r.payload)}
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORES,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Pull dibatalkan'));for(const store of STORES){const os=tx.objectStore(store);os.clear();for(const row of grouped[store])os.put(row)}});
    if(typeof v06VaultKey!=='undefined')v06VaultKey=null;
    const at=new Date().toISOString();await v07OriginalPut('meta',{key:'v07LastCloudPull',value:at,at});
    const {error}=await v07Client.from('member_wp_sync_state').upsert({owner_id:v07User.id,source_origin:location.origin,record_count:rows.length,client_version:V07_VERSION,last_pull_at:at,updated_at:at},{onConflict:'owner_id'});if(error)throw error;
    sessionStorage.setItem('member-wp-cloud-pull','1');location.reload();
  }catch(e){alert(`Download Supabase gagal:\n${e.message}`)}finally{v07Syncing=false}
}

function v07QueueChange(store,row,deleted=false){
  if(v07Syncing||!v07Connected()||!STORES.includes(store))return;
  const id=v07Id(store,row);if(!id)return;v07Pending.set(`${store}|${id}`,{store,id,row,deleted});
  clearTimeout(v07FlushTimer);v07FlushTimer=setTimeout(()=>v07FlushPending(),900);
}
async function v07FlushPending(){
  if(v07Syncing||!v07Connected()||!v07Pending.size)return;
  const items=[...v07Pending.values()];v07Pending.clear();
  try{
    const up=items.filter(x=>!x.deleted).map(x=>({owner_id:v07User.id,collection:x.store,record_id:x.id,payload:x.row,updated_at:new Date().toISOString()}));
    if(up.length){const {error}=await v07Client.from('member_wp_records').upsert(up,{onConflict:'owner_id,collection,record_id'});if(error)throw error}
    const dels=items.filter(x=>x.deleted);for(const d of dels){const {error}=await v07Client.from('member_wp_records').delete().eq('collection',d.store).eq('record_id',d.id);if(error)throw error}
    const at=new Date().toISOString();await v07Client.from('member_wp_sync_state').upsert({owner_id:v07User.id,source_origin:location.origin,client_version:V07_VERSION,last_push_at:at,updated_at:at},{onConflict:'owner_id'});await v07RefreshRemoteCount();
  }catch(e){console.warn('Auto-sync pending',e);for(const x of items)v07Pending.set(`${x.store}|${x.id}`,x);v07UpdateCloudBadge()}
}

function v07SetCloudWorking(text){const e=document.getElementById('v07CloudWorking');if(e)e.textContent=text}
async function v07OpenCloudPanel(initial=false){
  if(!v07User){v07RenderAuth();return}
  let remote=0,remoteState=null;try{remote=await v07RefreshRemoteCount();remoteState=await v07RemoteState()}catch(e){console.warn(e)}
  const local=v07LocalCount(),lastPush=state.meta.find(x=>x.key==='v07LastCloudPush')?.value||'—',lastPull=state.meta.find(x=>x.key==='v07LastCloudPull')?.value||'—';
  modal('Supabase Cloud',`<div class="v07-cloud-status"><div><span>Akun</span><b>${v07Esc(v07User.email||v07User.id)}</b></div><div><span>Project</span><b>member wp</b></div><div><span>Local</span><b>${local} record</b></div><div><span>Cloud</span><b>${remote} record</b></div></div>${initial&&remote===0&&local>0?'<div class="notice compact"><b>Cloud masih kosong.</b> Upload database lokal ini untuk menjadikan Supabase sebagai sumber sinkronisasi antar perangkat.</div>':''}<div class="v07-sync-grid"><button class="v07-sync-choice" onclick="v07PushAll(true)"><b>Upload lokal → Supabase</b><small>Gunakan browser ini sebagai sumber data dan sinkronkan ke cloud.</small></button><button class="v07-sync-choice" onclick="v07PullAll(true)"><b>Download Supabase → browser</b><small>Ganti IndexedDB browser ini dengan data dari cloud.</small></button></div><div class="storageBox">Origin cloud terakhir: <b>${v07Esc(remoteState?.source_origin||'—')}</b><br>Versi client cloud: <b>${v07Esc(remoteState?.client_version||'—')}</b><br>Push lokal terakhir: <b>${v07Esc(lastPush)}</b><br>Pull lokal terakhir: <b>${v07Esc(lastPull)}</b><br><span id="v07CloudWorking">Auto-sync aktif untuk perubahan member, task, note, profil, aktivitas, dan metadata.</span></div>`,`<button class="btn danger" onclick="v07SignOut()">Keluar</button>`);
}

/* Wrap IndexedDB writes so normal CRUD is mirrored to Supabase. */
const v07OriginalPut=put;
const v07OriginalDel=del;
const v07OriginalBulkPut=bulkPut;
put=async function(store,value){const r=await v07OriginalPut(store,value);v07QueueChange(store,value,false);return r};
del=async function(store,key){let row=null;try{row=state[store]?.find(x=>v07Id(store,x)===String(key))||{[V07_ID_FIELD[store]]:key}}catch{}const r=await v07OriginalDel(store,key);v07QueueChange(store,row,true);return r};
bulkPut=async function(store,items){const r=await v07OriginalBulkPut(store,items);for(const item of items||[])v07QueueChange(store,item,false);return r};

function v07SetupUi(){
  document.title='Member WP v0.7 — Supabase Cloud Control Center';const brand=document.querySelector('.brand small');if(brand)brand.textContent='Control Center v0.7';const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.7';v07EnsureShell();v07UpdateCloudBadge();
}
async function v07Boot(){
  try{
    if(!window.supabase?.createClient||!db||document.getElementById('appRoot')?.hidden){setTimeout(v07Boot,120);return}
    v07SetupUi();v07Client=window.supabase.createClient(V07_SUPABASE_URL,V07_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data}=await v07Client.auth.getSession();await v07AcceptSession(data.session);
    v07Client.auth.onAuthStateChange((_event,session)=>setTimeout(()=>v07AcceptSession(session),0));
  }catch(e){console.error('Supabase boot failed',e);v07EnsureShell();v07SetAuthMessage('Koneksi Supabase gagal: '+(e.message||e),'error')}
}
Object.assign(window,{v07SignIn,v07SignUp,v07SignOut,v07PushAll,v07PullAll,v07OpenCloudPanel});
v07SetupUi();setTimeout(v07Boot,180);
