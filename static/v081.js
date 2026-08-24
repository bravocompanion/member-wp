/* Member WP v0.8.1 — Seamless Personal Access */
const V081_VERSION='0.8.1';
const V081_DEVICE_HINT='member-wp-device-ok';
let v081RetryTimer=null;
let v081BootSeq=0;

function v081HasRealCache(){
  return Array.isArray(state?.taxpayers)&&state.taxpayers.some(x=>!/^PT\. DEMO BADAN \d{3}$/i.test(x?.name||'')&&!/^WP OP DEMO \d{3}$/i.test(x?.name||''));
}
function v081MarkDevice(ok){
  try{if(ok)localStorage.setItem(V081_DEVICE_HINT,'1');else localStorage.removeItem(V081_DEVICE_HINT)}catch{}
}
function v081ScheduleRetry(delay=20000){
  clearTimeout(v081RetryTimer);
  if(document.hidden)return;
  v081RetryTimer=setTimeout(()=>{if(!v08Online&&!v08Syncing)v08Bootstrap(false)},delay);
}
async function v081ReapplyPending(){
  const pending=[...v08Pending.values()];if(!pending.length)return;
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORES,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Gagal mempertahankan perubahan lokal.'));
    for(const c of pending){
      if(!STORES.includes(c.collection))continue;
      const os=tx.objectStore(c.collection);
      if(c.op==='delete')os.delete(c.record_id);else if(c.payload)os.put(c.payload);
    }
  });
  await loadState();
}
function v081ShowCachedApp(){
  if(!v081HasRealCache())return false;
  v08Ready=true;v08Online=false;v08HideGate();renderAll();v08UpdateUi();return true;
}

const v081BaseActivate=v08ActivateIfPresent;
v08ActivateIfPresent=async function(){
  const activated=await v081BaseActivate();if(activated)v081MarkDevice(true);return activated;
};

const v081BaseActivationRequired=v08ActivationRequired;
v08ActivationRequired=function(){
  v081MarkDevice(false);v081BaseActivationRequired();
};

const v081BaseConnectionError=v08ConnectionError;
v08ConnectionError=function(message){
  v08Online=false;v08UpdateUi();
  if(v081HasRealCache()){
    v08Ready=true;v08HideGate();v081ScheduleRetry();return;
  }
  v081BaseConnectionError(message);
};

v08Queue=function(store,row,deleted=false,keyOverride=''){
  if(!v08Ready||!STORES.includes(store))return;
  const id=keyOverride||v08Id(store,row);if(!id)return;
  v08Pending.set(`${store}|${id}`,{op:deleted?'delete':'upsert',collection:store,record_id:id,payload:deleted?undefined:row});
  clearTimeout(v08FlushTimer);v08FlushTimer=setTimeout(v08Flush,650);v08UpdateUi();
};

const v081BaseFlush=v08Flush;
v08Flush=async function(){
  await v081BaseFlush();
  if(!v08Online&&v08Pending.size)v081ScheduleRetry(12000);
};

v08Bootstrap=async function(manual=false){
  if(v08Syncing)return;
  if(typeof db==='undefined'||!db){setTimeout(()=>v08Bootstrap(manual),60);return}
  const seq=++v081BootSeq,hadCache=v081HasRealCache();
  if(hadCache){v081ShowCachedApp();}
  else if(!v08TokenFromHash())v08HideGate();
  v08Syncing=true;v08UpdateUi();
  try{
    await v08ActivateIfPresent();
    const data=await v08JsonFetch(`${V08_API}?action=bootstrap`);
    if(seq!==v081BootSeq)return;
    if(!data?.ok||!Array.isArray(data.rows))throw new Error('Respons database tidak valid.');
    await v08ReplaceLocal(data.rows);
    await v081ReapplyPending();
    v08CredentialIds=new Set(data.credentialIds||[]);v08CredentialCache.clear();v08RemoteCounts=data.counts||{};
    v08Ready=true;v08Online=true;v08LastSync=new Date().toISOString();v081MarkDevice(true);
    clearTimeout(v081RetryTimer);renderAll();v08UpdateUi();v08HideGate();
    if(currentTaxpayerId&&tp(currentTaxpayerId))openTaxpayer(currentTaxpayerId,false);
  }catch(e){
    if(e?.status===401){v08ActivationRequired();return}
    console.warn('v0.8.1 background bootstrap',e);
    if(hadCache||v081HasRealCache()){
      v08Ready=true;v08Online=false;v08HideGate();renderAll();v08UpdateUi();v081ScheduleRetry();
    }else{
      v08ConnectionError(e?.message==='server_error'?'Server database sedang bermasalah. Coba beberapa saat lagi.':e?.message);
    }
  }finally{
    v08Syncing=false;v08UpdateUi();
    if(v08Pending.size)setTimeout(v08Flush,0);
  }
};

const v081BaseUpdateUi=v08UpdateUi;
v08UpdateUi=function(){
  v081BaseUpdateUi();
  document.title='Member WP v0.8.1 — Personal Direct Database';
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Control Center v0.8.1';
  const foot=document.querySelector('.sidefoot');if(foot)foot.innerHTML=`<b>${v08Online?'Personal DB':'Cache Lokal'}</b> · Supabase<br><span>${state?.taxpayers?.length||0} WP</span>`;
  const notice=document.querySelector('.notice');if(notice){
    const pending=v08Pending.size;
    notice.hidden=Boolean(v08Online&&!pending&&!v08Syncing);
    if(v08Syncing)notice.innerHTML='<b>Sinkronisasi</b> · memperbarui database di background...';
    else if(!v08Online)notice.innerHTML=`<b>Cache lokal</b> · database tetap bisa dibaca${pending?` · ${pending} perubahan menunggu sync`:''}`;
    else if(pending)notice.innerHTML=`<b>Menyimpan</b> · ${pending} perubahan sedang disinkronkan`;
  }
  const dbBtn=document.getElementById('v08DbBtn');if(dbBtn)dbBtn.textContent=v08Online?'Database ✓':(v08Syncing?'Database…':'Database');
};

const v081BaseOpenPanel=v08OpenDatabasePanel;
v08OpenDatabasePanel=function(){
  v081BaseOpenPanel();
  const box=document.querySelector('#modalBody .v051-help');if(box)box.textContent='Tidak ada login harian. Setelah aktivasi pertama, dashboard tampil langsung dari cache lalu Supabase menyinkron diam-diam di background.';
};

document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!v08Online&&!v08Syncing)v081ScheduleRetry(500)});
window.addEventListener('online',()=>v081ScheduleRetry(300));

setTimeout(()=>{
  document.title='Member WP v0.8.1 — Personal Direct Database';
  const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.8.1';
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Control Center v0.8.1';
  if(v081HasRealCache())v081ShowCachedApp();
},25);

Object.assign(window,{v08Bootstrap,v08Flush,v08OpenDatabasePanel});
