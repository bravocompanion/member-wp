/* Member WP v0.8 — Personal Direct Database */
const V08_VERSION='0.8.0';
const V08_API='/api/member-wp';
const V08_ID_FIELD={taxpayers:'id',profiles:'taxpayerId',tasks:'id',notes:'id',activities:'id',meta:'key'};
let v08Ready=false;
let v08Syncing=false;
let v08Online=false;
let v08RemoteCounts={records:0,credentials:0,taxpayers:0};
let v08CredentialIds=new Set();
let v08CredentialCache=new Map();
let v08Pending=new Map();
let v08FlushTimer=null;
let v08LastSync='—';
let v08WrappersInstalled=false;

function v08Esc(s){return typeof esc==='function'?esc(s):String(s??'')}
function v08Id(store,row){return String(row?.[V08_ID_FIELD[store]]??'')}
function v08LocalCount(){return typeof STORES==='undefined'?0:STORES.reduce((n,k)=>n+(state?.[k]?.length||0),0)}
function v08TokenFromHash(){
  if(!location.hash.startsWith('#activate='))return '';
  try{return decodeURIComponent(location.hash.slice('#activate='.length)).trim()}catch{return ''}
}
function v08ClearActivationHash(){history.replaceState(null,'',location.pathname+location.search)}
async function v08JsonFetch(url,options={}){
  const r=await fetch(url,{cache:'no-store',credentials:'same-origin',...options});
  let body=null;try{body=await r.json()}catch{}
  if(!r.ok){const e=new Error(body?.error||`HTTP ${r.status}`);e.status=r.status;e.payload=body;throw e}
  return body;
}
async function v08ActivateIfPresent(){
  const token=v08TokenFromHash();if(!token)return false;
  try{
    v08ShowGate('Mengaktifkan perangkat pribadi...','Token hanya dipakai sekali untuk membuat cookie HttpOnly di browser ini.');
    await v08JsonFetch(`${V08_API}?action=activate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});
    v08ClearActivationHash();return true;
  }catch(e){v08ClearActivationHash();throw new Error('Aktivasi perangkat gagal. Gunakan kembali shortcut aktivasi pribadi.')}
}
function v08EnsureGate(){
  let gate=document.getElementById('v08Gate');if(gate)return gate;
  gate=document.createElement('div');gate.id='v08Gate';gate.className='v08-gate';gate.innerHTML='<div class="v08-gate-card"><div class="v08-gate-brand"><div class="mark">M</div><div><b>Member WP</b><small>Personal Database</small></div></div><h1 id="v08GateTitle">Membuka database...</h1><p id="v08GateText">Menghubungkan Supabase pribadi.</p><div id="v08GateActions"></div></div>';document.body.appendChild(gate);return gate;
}
function v08ShowGate(title,text,actions=''){
  const gate=v08EnsureGate();gate.classList.add('show');
  const t=document.getElementById('v08GateTitle'),p=document.getElementById('v08GateText'),a=document.getElementById('v08GateActions');if(t)t.textContent=title;if(p)p.textContent=text;if(a)a.innerHTML=actions;
}
function v08HideGate(){document.getElementById('v08Gate')?.classList.remove('show')}
function v08ActivationRequired(){
  v08Online=false;v08UpdateUi();
  v08ShowGate('Perangkat belum diaktifkan','Member WP tidak memakai halaman login. Buka shortcut aktivasi pribadi satu kali pada browser ini, lalu database akan langsung tampil.','<div class="v08-gate-note">Tidak ada email/password di aplikasi. Device token tidak disimpan di source GitHub.</div>');
}
function v08ConnectionError(message){
  v08Online=false;v08UpdateUi();
  v08ShowGate('Database belum dapat dibuka',message||'Periksa deployment Cloudflare Pages Functions dan coba lagi.','<button class="btn primary" onclick="v08Bootstrap(true)">Coba Lagi</button>');
}
async function v08ReplaceLocal(rows){
  const grouped=Object.fromEntries(STORES.map(k=>[k,[]]));
  for(const r of rows||[]){if(grouped[r.collection]&&r.payload&&typeof r.payload==='object')grouped[r.collection].push(r.payload)}
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORES,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Database lokal gagal diperbarui.'));
    for(const store of STORES){const os=tx.objectStore(store);os.clear();for(const row of grouped[store])os.put(row)}
  });
  await loadState();
}
async function v08Bootstrap(manual=false){
  if(v08Syncing)return;
  if(typeof db==='undefined'||!db){setTimeout(()=>v08Bootstrap(manual),80);return}
  v08Syncing=true;v08ShowGate(manual?'Memuat ulang database...':'Membuka database pribadi...','Mengambil data Supabase dan menyiapkan cache IndexedDB.');
  try{
    await v08ActivateIfPresent();
    const data=await v08JsonFetch(`${V08_API}?action=bootstrap`);
    if(!data?.ok||!Array.isArray(data.rows))throw new Error('Respons database tidak valid.');
    await v08ReplaceLocal(data.rows);
    v08CredentialIds=new Set(data.credentialIds||[]);v08CredentialCache.clear();v08RemoteCounts=data.counts||{};v08Ready=true;v08Online=true;v08LastSync=new Date().toISOString();
    renderAll();v08UpdateUi();v08HideGate();
    if(currentTaxpayerId&&tp(currentTaxpayerId))openTaxpayer(currentTaxpayerId,false);
  }catch(e){
    if(e.status===401){v08ActivationRequired();return}
    console.warn('v0.8 bootstrap',e);v08ConnectionError(e.message==='server_error'?'Server database sedang bermasalah. Coba beberapa saat lagi.':e.message);
  }finally{v08Syncing=false}
}
function v08Queue(store,row,deleted=false,keyOverride=''){
  if(!v08Ready||v08Syncing||!STORES.includes(store))return;
  const id=keyOverride||v08Id(store,row);if(!id)return;
  v08Pending.set(`${store}|${id}`,{op:deleted?'delete':'upsert',collection:store,record_id:id,payload:deleted?undefined:row});
  clearTimeout(v08FlushTimer);v08FlushTimer=setTimeout(v08Flush,650);v08UpdateUi();
}
async function v08Flush(){
  if(v08Syncing||!v08Ready||!v08Pending.size)return;
  const changes=[...v08Pending.values()];v08Pending.clear();
  try{
    await v08JsonFetch(V08_API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'mutate',changes})});
    v08Online=true;v08LastSync=new Date().toISOString();
  }catch(e){
    for(const c of changes)v08Pending.set(`${c.collection}|${c.record_id}`,c);v08Online=false;console.warn('v0.8 sync',e);
    if(e.status===401)v08ActivationRequired();
  }finally{v08UpdateUi()}
}
function v08InstallWrappers(){
  if(v08WrappersInstalled)return;v08WrappersInstalled=true;
  const originalPut=put,originalDel=del,originalBulkPut=bulkPut;
  put=async function(store,value){const r=await originalPut(store,value);v08Queue(store,value,false);return r};
  del=async function(store,key){const row=state?.[store]?.find(x=>v08Id(store,x)===String(key))||{[V08_ID_FIELD[store]]:key};const r=await originalDel(store,key);v08Queue(store,row,true,String(key));return r};
  bulkPut=async function(store,items){const r=await originalBulkPut(store,items);for(const item of items||[])v08Queue(store,item,false);return r};
}
function v08UpdateUi(){
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Control Center v0.8';
  const foot=document.querySelector('.sidefoot');if(foot)foot.innerHTML=`<b>${v08Online?'Personal DB':'Cache Lokal'}</b> · Supabase<br><span>${state?.taxpayers?.length||0} WP</span>`;
  const notice=document.querySelector('.notice');if(notice){const pending=v08Pending.size;notice.innerHTML=v08Online?`<b>Database aktif</b> · ${state.taxpayers.length} WP · ${v08RemoteCounts.credentials||v08CredentialIds.size} credential private${pending?` · ${pending} perubahan menunggu sync`:''}`:`<b>Offline</b> · memakai cache lokal${pending?` · ${pending} perubahan belum tersinkron`:''}`}
  let b=document.getElementById('v08DbBtn');const top=document.querySelector('.topactions');if(top&&!b){b=document.createElement('button');b.id='v08DbBtn';b.className='btn';b.onclick=v08OpenDatabasePanel;top.prepend(b)}if(b){b.textContent=v08Online?'Database ✓':'Database';b.classList.toggle('v08-db-ok',v08Online)}
}
function v08OpenDatabasePanel(){
  const s=typeof v06ImportSummary==='function'?v06ImportSummary():null;
  modal('Database Pribadi',`<div class="v08-db-grid"><div><span>Wajib Pajak</span><b>${state.taxpayers.length}</b></div><div><span>Badan</span><b>${s?.badan??state.taxpayers.filter(x=>x.type==='BADAN').length}</b></div><div><span>OP</span><b>${s?.op??state.taxpayers.filter(x=>x.type==='OP').length}</b></div><div><span>Credential</span><b>${v08RemoteCounts.credentials||v08CredentialIds.size}</b></div></div><div class="storageBox">Mode: <b>Personal Direct</b><br>Sumber: <b>Supabase member wp</b><br>Cache: <b>IndexedDB browser</b><br>Sync terakhir: <b>${v08Esc(v08LastSync)}</b><br>Status: <b>${v08Online?'Online':'Offline / cache'}</b></div><div class="v051-help">Tidak ada login email/password. Browser ini memakai cookie perangkat HttpOnly. Data credential hanya diminta saat detail member dibuka.</div>`,`<button class="btn" onclick="v08Bootstrap(true);closeModal()">Refresh Supabase</button><button class="btn danger" onclick="v08DeactivateDevice()">Nonaktifkan Perangkat</button>`);
}
async function v08DeactivateDevice(){
  if(!confirm('Nonaktifkan akses database pada browser ini? Data cache lokal tetap ada, tetapi database tidak dapat dibuka lagi sampai shortcut aktivasi digunakan.'))return;
  try{await v08JsonFetch(`${V08_API}?action=deactivate`,{method:'POST'});}catch{}v08Ready=false;v08Online=false;v08CredentialCache.clear();closeModal();v08ActivationRequired();
}
async function v08Credential(id){
  if(v08CredentialCache.has(id))return v08CredentialCache.get(id);
  const data=await v08JsonFetch(`${V08_API}?action=credential&taxpayerId=${encodeURIComponent(id)}`);const payload=data?.payload||null;if(payload)v08CredentialCache.set(id,payload);return payload;
}
function v08InstallCredentialMode(){
  if(typeof v06CredentialRecord==='function')v06CredentialRecord=function(id){return v08CredentialIds.has(id)?{taxpayerId:id}:null};
  if(typeof v06UnlockVault==='function')v06UnlockVault=async function(id){
    const box=document.getElementById('v06VaultBox');if(box)box.innerHTML='<div class="empty compact">Mengambil data sensitif dari database private...</div>';
    try{const data=await v08Credential(id);if(!data)throw new Error('Credential tidak ditemukan.');const clean={...data};delete clean.taxpayerId;const target=document.getElementById('v06VaultBox');if(target)target.innerHTML=`<div class="splitHead"><div><h3>Data Sensitif</h3><small>Dimuat dari Supabase hanya saat dibutuhkan.</small></div><button class="btn small" onclick="v06LockVault()">Tutup</button></div>${v06SensitiveHtml(clean)}`;}catch(e){if(e.status===401)v08ActivationRequired();else alert('Data sensitif tidak dapat dibuka.')}
  };
  if(typeof v06LockVault==='function')v06LockVault=function(){v08CredentialCache.clear();if(currentTaxpayerId&&typeof v06InjectMemberData==='function')v06InjectMemberData(currentTaxpayerId,true)};
  if(typeof v06ImportView==='function')v06ImportView=function(){
    const s=v06ImportSummary?.()||{};return `<div class="card v08-db-summary"><div class="splitHead"><div><h2>Supabase Database</h2><p>Database produksi Member WP dimuat otomatis. Import file manual tidak diperlukan lagi.</p></div>${badge(v08Online?'Online':'Cache','ok')}</div><div class="v06-summary-kpis"><span><b>${state.taxpayers.length}</b><small>Total WP</small></span><span><b>${s.badan||72}</b><small>Badan</small></span><span><b>${s.op||161}</b><small>OP</small></span><span><b>${s.issues||36}</b><small>Kendala</small></span><span><b>${s.documentRequirements||40}</b><small>Dokumen</small></span><span><b>${s.historicalChecklistRows||73}</b><small>Riwayat</small></span></div><div class="storageBox">Credential private: <b>${v08RemoteCounts.credentials||v08CredentialIds.size}</b><br>Referensi: <b>${s.referenceRows||21}</b><br>NPWP duplikat: <b>${s.duplicateNpwpGroups||4}</b><br>Sinkronisasi: <b>${v08Online?'Supabase aktif':'Cache lokal'}</b></div><div class="actions" style="margin-top:12px"><button class="btn" onclick="v08Bootstrap(true)">Refresh Database</button></div></div>`;
  };
  if(typeof v06OpenPrivateImport==='function')v06OpenPrivateImport=function(){alert('v0.8 memakai database Supabase langsung. Import file manual sudah dinonaktifkan.')};
  if(typeof resetDatabase!=='undefined')resetDatabase=async function(){if(!confirm('Muat ulang cache lokal dari Supabase? Data di Supabase tidak akan dihapus.'))return;await v08Bootstrap(true)};
  if(typeof v06InjectMemberData==='function'){
    const prev=v06InjectMemberData;v06InjectMemberData=async function(id,rebuild=false){await prev(id,rebuild);const card=document.getElementById('v06ExcelCard');if(card){const p=card.querySelector('p');if(p)p.textContent='Data sumber dari database private Supabase.';const h=card.querySelector('.badge');if(h)h.textContent='Supabase'}};
  }
}
function v08WrapRender(){
  const prev=renderAll;renderAll=function(){prev();v08UpdateUi()};
}
async function v08Start(){
  document.title='Member WP v0.8 — Personal Direct Database';
  const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.8';
  v08EnsureGate();v08InstallWrappers();v08InstallCredentialMode();v08WrapRender();v08UpdateUi();await v08Bootstrap(false);
}
Object.assign(window,{v08Bootstrap,v08Flush,v08OpenDatabasePanel,v08DeactivateDevice});
setTimeout(v08Start,170);
