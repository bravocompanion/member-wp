/* Member WP v0.11 — hapus jejak data lama dari cache browser */
let v011Sanitizing=false;
function v011NeedsLocalCleanup(){
  if(!state?.taxpayers)return false;
  const sensitiveKeys=['npwp','phone','email','pic','nik','kk'];
  return state.taxpayers.some(x=>sensitiveKeys.some(k=>Object.prototype.hasOwnProperty.call(x,k)))
    || (state.profiles?.length||0)>0
    || (state.notes?.length||0)>0
    || (state.activities?.length||0)>0
    || (state.meta?.length||0)>0
    || state.tasks.some(t=>t.kind!=='weekly_monitoring'||t.code!==V011_CODE);
}
async function v011SanitizeLocal(){
  if(v011Sanitizing||!db||!v011NeedsLocalCleanup())return;
  v011Sanitizing=true;
  try{
    const cleanTaxpayers=state.taxpayers.map(x=>({id:x.id,name:String(x.name||'Tanpa Nama'),type:x.type==='BADAN'?'BADAN':'OP',status:x.status==='inactive'?'inactive':'active',createdAt:x.createdAt||now(),updatedAt:now()}));
    const keepTasks=state.tasks.filter(t=>t.kind==='weekly_monitoring'&&t.code===V011_CODE);
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORES,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
      for(const name of ['profiles','notes','activities','meta'])tx.objectStore(name).clear();
      const ts=tx.objectStore('taxpayers');ts.clear();for(const x of cleanTaxpayers)ts.put(x);
      const tasks=tx.objectStore('tasks');tasks.clear();for(const t of keepTasks)tasks.put(t);
    });
    if(typeof v09CredentialIds!=='undefined')v09CredentialIds.clear();
    if(typeof v09CredentialCache!=='undefined')v09CredentialCache.clear();
    if(typeof v09RemoteCounts!=='undefined')v09RemoteCounts.credentials=0;
    await loadState();
    if(typeof v011EnsureWeek==='function')await v011EnsureWeek();
    renderAll();
  }finally{v011Sanitizing=false}
}
setInterval(()=>{if(db)v011SanitizeLocal()},1500);
