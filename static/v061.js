/* Member WP v0.6.1 — Import Reconciliation */
const V061_VERSION='0.6.1';
function v061IsDemo(x){return /^PT\. DEMO BADAN \d{3}$/i.test(x?.name||'')||/^WP OP DEMO \d{3}$/i.test(x?.name||'')}
function v061DemoRows(){return state.taxpayers.filter(v061IsDemo)}
async function v061RemoveDemoRows(){
  const demos=v061DemoRows();if(!demos.length)return 0;
  const ids=new Set(demos.map(x=>x.id));
  state.taxpayers=state.taxpayers.filter(x=>!ids.has(x.id));state.profiles=state.profiles.filter(x=>!ids.has(x.taxpayerId));state.tasks=state.tasks.filter(x=>!ids.has(x.taxpayerId));state.notes=state.notes.filter(x=>!ids.has(x.taxpayerId)&&x.id!=='note-demo');state.activities=state.activities.filter(x=>!ids.has(x.taxpayerId));
  await new Promise((resolve,reject)=>{const tx=db.transaction(['taxpayers','profiles','tasks','notes','activities'],'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Demo cleanup aborted'));for(const x of demos)tx.objectStore('taxpayers').delete(x.id);for(const p of state.profiles)if(ids.has(p.taxpayerId))tx.objectStore('profiles').delete(p.taxpayerId);for(const t of state.tasks)if(ids.has(t.taxpayerId))tx.objectStore('tasks').delete(t.id);for(const n of state.notes)if(ids.has(n.taxpayerId)||n.id==='note-demo')tx.objectStore('notes').delete(n.id);for(const a of state.activities)if(ids.has(a.taxpayerId))tx.objectStore('activities').delete(a.id)});
  await put('meta',{key:'demoPurgedV061',value:now(),at:now()});await loadState();return demos.length;
}
function v061ImportStatus(){const s=v06ImportSummary();return s?`${s.taxpayers||state.taxpayers.length} WP Excel`:'Belum import di alamat ini'}
function v061UpdateOriginStatus(){
  const notice=document.querySelector('.notice');if(notice){const s=v06ImportSummary();notice.innerHTML=`<b>${s?'Excel aktif':'Local-only'}</b> · ${esc(v061ImportStatus())} · <span class="v061-origin">${esc(location.host)}</span>`}
  const foot=document.querySelector('.sidefoot');if(foot){const s=v06ImportSummary();foot.innerHTML=`<b>${s?'Excel':'Local'}</b> · ${esc(location.host)}<br><span>${s?`${s.taxpayers||state.taxpayers.length} WP`:'Belum import'}</span>`}
}
async function v061Reconcile(){
  try{
    if(!db||document.getElementById('appRoot')?.hidden){setTimeout(v061Reconcile,100);return}
    const removed=await v061RemoveDemoRows();
    await put('meta',{key:'appVersion',value:V061_VERSION,at:now()});
    const s=v06ImportSummary();
    if(s){await put('meta',{key:'v06ImportOrigin',value:location.origin,at:now()});const real=state.taxpayers.filter(x=>!v061IsDemo(x)).length;if(real===0)console.warn('Import metadata exists but taxpayer store is empty. Re-import may be required.');}
    if(removed)await refresh();else renderAll();v061UpdateOriginStatus();
  }catch(e){console.warn('v0.6.1 reconcile',e)}
}
const v061PreviousImport=v06ImportPrivatePackage;
v06ImportPrivatePackage=async function(){
  const before=v06Meta('v06ImportedAt');await v061PreviousImport();await loadState();const after=v06Meta('v06ImportedAt');
  if(after&&after!==before){await v061RemoveDemoRows();await put('meta',{key:'v06ImportOrigin',value:location.origin,at:now()});await put('meta',{key:'appVersion',value:V061_VERSION,at:now()});sessionStorage.setItem('member-wp-import-success','1');location.reload()}
};
const v061PreviousRenderAll=renderAll;
renderAll=function(){v061PreviousRenderAll();v061UpdateOriginStatus()};
const v061PreviousImportView=v06ImportView;
v06ImportView=function(){
  const s=v06ImportSummary(),demos=v061DemoRows().length,origin=v06Meta('v06ImportOrigin','');
  const diagnostic=`<div class="card v061-diagnostic"><div class="splitHead"><div><h2>Status Database</h2><p>IndexedDB terikat pada alamat situs yang sedang dibuka.</p></div>${badge(s?'Excel aktif':'Belum import',s?'ok':'warn')}</div><div class="storageBox">Alamat saat ini: <b>${esc(location.origin)}</b><br>Import tersimpan: <b>${s?`${s.taxpayers||state.taxpayers.length} WP`:'Tidak ada pada origin ini'}</b>${origin?`<br>Origin import: <b>${esc(origin)}</b>`:''}<br>Demo terdeteksi: <b>${demos}</b></div>${!s?'<div class="v051-help">Jika sebelumnya sudah import di alamat lain (misalnya pages.dev vs custom domain), import ulang pada alamat yang sedang digunakan sekarang.</div>':''}</div>`;
  return diagnostic+v061PreviousImportView();
};
function v061Setup(){document.title='Member WP v0.6.1 — Private Excel Control Center';const brand=document.querySelector('.brand small');if(brand)brand.textContent='Control Center v0.6.1';const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.6.1'}
Object.assign(window,{renderAll,v06ImportPrivatePackage,v06ImportView,v061Reconcile});v061Setup();setTimeout(v061Reconcile,140);
