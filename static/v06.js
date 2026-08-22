/* Member WP v0.6 — Private Excel Import + Encrypted Local Vault */
const V06_VERSION='0.6.0';
let v06PendingPackage=null;
let v06VaultKey=null;

function v06Meta(key,fallback=null){const row=state.meta.find(x=>x.key===key);return row?.value??fallback}
function v06B64(bytes){let s='';bytes.forEach(b=>s+=String.fromCharCode(b));return btoa(s)}
function v06Bytes(value){const s=atob(value),out=new Uint8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out}
async function v06DeriveKey(passphrase,salt){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function v06EncryptObject(value,key){const iv=crypto.getRandomValues(new Uint8Array(12));const plain=new TextEncoder().encode(JSON.stringify(value));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain);return{iv:v06B64(iv),ciphertext:v06B64(new Uint8Array(cipher))}}
async function v06DecryptObject(record,key){const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:v06Bytes(record.iv)},key,v06Bytes(record.ciphertext));return JSON.parse(new TextDecoder().decode(plain))}

function v06ValidatePrivateImport(x){
  const errors=[];
  if(!x||x.format!=='member-wp-private-import')errors.push('Format file bukan Member WP Private Import.');
  ['taxpayers','credentials','issues','documents','history','references'].forEach(k=>{if(!Array.isArray(x?.[k]))errors.push(`${k} harus berupa array.`)});
  const ids=new Set((x?.taxpayers||[]).map(t=>t.id));
  if(ids.size!==(x?.taxpayers||[]).length)errors.push('ID member duplikat di file import.');
  (x?.credentials||[]).forEach(c=>{if(!ids.has(c.taxpayerId))errors.push(`Credential orphan: ${c.taxpayerId}`)});
  return [...new Set(errors)].slice(0,30);
}
function v06ImportSummary(){return v06Meta('v06ImportSummary',null)}
function v06ImportedIssues(){return v06Meta('v06ImportedIssues',[])}
function v06ImportedDocuments(){return v06Meta('v06ImportedDocuments',[])}
function v06ImportedHistory(){return v06Meta('v06ImportedHistory',[])}
function v06ImportedReferences(){return v06Meta('v06ImportedReferences',[])}
function v06EncryptedCredentials(){return v06Meta('v06EncryptedCredentials',[])}

function v06ImportView(){
  const s=v06ImportSummary();
  if(!s)return `<div class="card v06-import-empty"><div><h2>Import Data Excel</h2><p>Database demo sudah dinonaktifkan. Masukkan paket private hasil workbook Member WP ke browser ini.</p></div><button class="btn primary" onclick="v06OpenPrivateImport()">Import Data</button><div class="v051-help">Data asli tidak disimpan di GitHub/Cloudflare. Credential akan dienkripsi di IndexedDB dengan master passphrase yang Anda buat sendiri.</div></div>`;
  const dup=v06Meta('v06DuplicateNpwp',[]).length,unmatchedDocs=v06ImportedDocuments().filter(x=>!x.taxpayerId).length,unmatchedHist=v06ImportedHistory().filter(x=>!x.taxpayerId).length;
  return `<div class="v06-summary"><div class="v06-summary-kpis"><span><b>${s.taxpayers||state.taxpayers.length}</b><small>Total WP</small></span><span><b>${s.badan||0}</b><small>Badan</small></span><span><b>${s.op||0}</b><small>OP</small></span><span><b>${s.issues||0}</b><small>Kendala</small></span><span><b>${s.documentRequirements||0}</b><small>Dokumen</small></span><span><b>${s.historicalChecklistRows||0}</b><small>Riwayat 2018</small></span></div><div class="grid equal"><div class="card"><h2>Workbook Aktif</h2><p>${esc(v06Meta('v06SourceWorkbook','Excel import lokal'))}</p><div class="storageBox">Credential terenkripsi: <b>${v06EncryptedCredentials().length}</b><br>Referensi Sheet3: <b>${s.referenceRows||0}</b><br>NPWP duplikat: <b>${dup}</b></div><div class="actions" style="margin-top:12px"><button class="btn" onclick="v06OpenPrivateImport()">Import Ulang</button><button class="btn" onclick="v06LockVault()">Kunci Vault</button></div></div><div class="card"><h2>Data Tidak Terhubung</h2><p>Data historis/dokumen yang tidak memiliki pasangan pasti di master WP tetap dipertahankan.</p><div class="storageBox">Dokumen tanpa member: <b>${unmatchedDocs}</b><br>Riwayat tanpa member: <b>${unmatchedHist}</b></div></div></div></div>`;
}

function v06OpenPrivateImport(){
  v06PendingPackage=null;
  modal('Import Data Excel Private',`<p>Pilih file <b>member-wp-private-import-*.json</b>. Import akan mengganti member/task/note lokal saat ini. Credential sensitif dienkripsi sebelum disimpan.</p><input id="v06File" type="file" accept="application/json,.json" class="file" onchange="v06ReadPrivateImport(this)"><button class="btn" onclick="document.getElementById('v06File').click()">Pilih File Import</button><div id="v06FileInfo" class="v06-file-info">Belum ada file dipilih.</div><div class="formgrid"><div class="field"><label>Master Passphrase Baru</label><input id="v06Pass" type="password" autocomplete="new-password" placeholder="Minimal 10 karakter"></div><div class="field"><label>Ulangi Passphrase</label><input id="v06Pass2" type="password" autocomplete="new-password" placeholder="Ulangi passphrase"></div></div><div class="v051-help">Master passphrase tidak disimpan. Jika lupa, data credential terenkripsi tidak dapat dibuka.</div>`,`<button class="btn primary" onclick="v06ImportPrivatePackage()">Import Semua Data</button>`);
}
async function v06ReadPrivateImport(input){
  try{const f=input.files?.[0];if(!f)return;const x=JSON.parse(await f.text()),errors=v06ValidatePrivateImport(x);if(errors.length)throw new Error(errors.join('\n'));v06PendingPackage=x;const s=x.summary||{};document.getElementById('v06FileInfo').innerHTML=`<b>${esc(f.name)}</b><br>${s.taxpayers||x.taxpayers.length} WP · ${s.credentialRecords||x.credentials.length} credential · ${s.issues||x.issues.length} kendala · ${s.documentRequirements||x.documents.length} kebutuhan dokumen`;}
  catch(e){v06PendingPackage=null;document.getElementById('v06FileInfo').textContent=`File ditolak: ${e.message}`}
}
async function v06ImportPrivatePackage(){
  try{
    const x=v06PendingPackage;if(!x)throw new Error('Pilih file import terlebih dahulu.');
    const pass=document.getElementById('v06Pass').value,pass2=document.getElementById('v06Pass2').value;if(pass.length<10)throw new Error('Master passphrase minimal 10 karakter.');if(pass!==pass2)throw new Error('Konfirmasi passphrase tidak sama.');
    if(!crypto?.subtle)throw new Error('Web Crypto tidak tersedia pada browser ini.');
    const salt=crypto.getRandomValues(new Uint8Array(16)),key=await v06DeriveKey(pass,salt),encrypted=[];
    for(const record of x.credentials){const payload={...record};delete payload.taxpayerId;const enc=await v06EncryptObject(payload,key);encrypted.push({taxpayerId:record.taxpayerId,...enc})}
    if(!confirm(`Import ${x.taxpayers.length} WP dan mengganti data operasional lokal saat ini?`))return;
    const at=now(),taxpayers=x.taxpayers.map(t=>({...t,createdAt:t.createdAt||at,updatedAt:at}));
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORES,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Import dibatalkan.'));for(const name of ['taxpayers','profiles','tasks','notes','activities','meta'])tx.objectStore(name).clear();const ts=tx.objectStore('taxpayers');taxpayers.forEach(t=>ts.put(t));const ms=tx.objectStore('meta');const metaRows=[{key:'appVersion',value:V06_VERSION,at},{key:'storageVersion',value:'IndexedDB v0.6',at},{key:'v06SourceWorkbook',value:x.sourceWorkbook||'Excel private import',at},{key:'v06ImportSummary',value:x.summary||{},at},{key:'v06DuplicateNpwp',value:x.duplicateNpwp||[],at},{key:'v06ImportedIssues',value:x.issues||[],at},{key:'v06ImportedDocuments',value:x.documents||[],at},{key:'v06ImportedHistory',value:x.history||[],at},{key:'v06ImportedReferences',value:x.references||[],at},{key:'v06VaultSalt',value:v06B64(salt),at},{key:'v06EncryptedCredentials',value:encrypted,at},{key:'v06ImportedAt',value:at,at}];metaRows.forEach(r=>ms.put(r));});
    v06VaultKey=key;await loadState();await logActivity(null,'excel_import',`Import private Excel: ${taxpayers.length} WP, ${encrypted.length} credential terenkripsi.`,'System');closeModal();await refresh();go('taxpayers');alert(`Import selesai: ${taxpayers.length} WP masuk. Credential sudah dienkripsi.`);
  }catch(e){alert(`Import gagal:\n${e.message}`)}
}

async function v06PurgeDemo(){
  const demos=state.taxpayers.filter(x=>/^PT\. DEMO BADAN \d{3}$/i.test(x.name||'')||/^WP OP DEMO \d{3}$/i.test(x.name||''));if(!demos.length)return false;
  const ids=new Set(demos.map(x=>x.id));
  await new Promise((resolve,reject)=>{const tx=db.transaction(['taxpayers','profiles','tasks','notes','activities'],'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);for(const x of demos)tx.objectStore('taxpayers').delete(x.id);for(const p of state.profiles)if(ids.has(p.taxpayerId))tx.objectStore('profiles').delete(p.taxpayerId);for(const t of state.tasks)if(ids.has(t.taxpayerId))tx.objectStore('tasks').delete(t.id);for(const n of state.notes)if(ids.has(n.taxpayerId)||n.id==='note-demo')tx.objectStore('notes').delete(n.id);for(const a of state.activities)if(ids.has(a.taxpayerId))tx.objectStore('activities').delete(a.id)});
  await loadState();await put('meta',{key:'demoPurged',value:now(),at:now()});return true;
}
resetDatabase=async function(){
  if(!confirm('Hapus seluruh data lokal Member WP, termasuk vault terenkripsi? Database akan menjadi kosong.'))return;
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORES,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);for(const name of STORES)tx.objectStore(name).clear()});v06VaultKey=null;await loadState();renderAll();
};

function v06CredentialRecord(id){return v06EncryptedCredentials().find(x=>x.taxpayerId===id)}
function v06IssueRows(id){return v06ImportedIssues().filter(x=>x.taxpayerId===id)}
function v06DocumentRows(id){return v06ImportedDocuments().filter(x=>x.taxpayerId===id)}
function v06HistoryRows(id){return v06ImportedHistory().filter(x=>x.taxpayerId===id)}
function v06ReferenceRows(id){return v06ImportedReferences().filter(x=>x.taxpayerId===id)}
function v06FieldLabel(k){return({npwp16:'NPWP 16',coretaxKey:'Coretax Key',coretaxPassphrase:'Coretax Passphrase',efin:'EFIN',emailPassword:'Password Email',djpKey:'Key DJP',registeredEmailOrNote:'Email Reg / Catatan',registeredEmailPassword:'Password Email Reg',primaryEmail:'Email Utama',primaryEmailKey:'Key Email Utama',secondaryEmail:'Email Opsi',secondaryEmailKey:'Key Email Opsi',phone:'Phone',registrationKey:'Key Registrasi',nik:'NIK',kk:'KK'})[k]||k}
function v06Copy(value){navigator.clipboard?.writeText(String(value||''));}
function v06SensitiveHtml(data){const rows=Object.entries(data).filter(([k,v])=>!['sourceSheet','sourceRow'].includes(k)&&v!==null&&v!==undefined&&String(v).trim()!=='');return `<div class="v06-secret-list">${rows.map(([k,v])=>`<div><span>${esc(v06FieldLabel(k))}</span><code>${esc(v)}</code><button class="linkbtn" onclick="v06Copy(${JSON.stringify(String(v))})">Copy</button></div>`).join('')||'<div class="empty compact">Tidak ada field sensitif tersimpan.</div>'}</div>`}
async function v06UnlockVault(id){
  if(v06VaultKey)return v06RenderUnlockedVault(id);
  modal('Buka Vault Lokal',`<p>Masukkan master passphrase yang dibuat saat import Excel. Passphrase hanya berada di memori selama halaman terbuka.</p><div class="field"><label>Master Passphrase</label><input id="v06UnlockPass" type="password" autocomplete="current-password"></div>`,`<button class="btn primary" onclick="v06DoUnlock('${id}')">Buka Vault</button>`);
}
async function v06DoUnlock(id){
  try{const salt=v06Meta('v06VaultSalt');if(!salt)throw new Error('Vault belum tersedia.');const key=await v06DeriveKey(document.getElementById('v06UnlockPass').value,v06Bytes(salt)),record=v06CredentialRecord(id);if(record)await v06DecryptObject(record,key);v06VaultKey=key;closeModal();await v06InjectMemberData(id,true)}catch(e){alert('Passphrase tidak cocok atau vault tidak dapat dibuka.')}
}
function v06LockVault(){v06VaultKey=null;if(currentTaxpayerId)v06InjectMemberData(currentTaxpayerId,true)}
async function v06RenderUnlockedVault(id){const record=v06CredentialRecord(id);if(!record)return;if(!v06VaultKey)return;try{const data=await v06DecryptObject(record,v06VaultKey),box=document.getElementById('v06VaultBox');if(box)box.innerHTML=`<div class="splitHead"><div><h3>Data Sensitif</h3><small>Decrypted hanya di memori halaman ini.</small></div><button class="btn small" onclick="v06LockVault()">Kunci</button></div>${v06SensitiveHtml(data)}`;}catch{v06VaultKey=null;alert('Vault terkunci. Masukkan passphrase kembali.')}}
async function v06InjectMemberData(id,rebuild=false){
  const body=document.getElementById('drawerBody');if(!body||currentTaxpayerId!==id)return;body.querySelector('#v06ExcelCard')?.remove();const issues=v06IssueRows(id),docs=v06DocumentRows(id),hist=v06HistoryRows(id),refs=v06ReferenceRows(id),hasVault=Boolean(v06CredentialRecord(id));
  const card=document.createElement('div');card.id='v06ExcelCard';card.className='card v06-excel-card';card.innerHTML=`<div class="splitHead"><div><h2>Data Excel</h2><p>Data sumber yang diimpor secara lokal.</p></div>${badge('Private','blue')}</div><div class="v06-mini-kpis"><span><b>${issues.length}</b><small>Kendala</small></span><span><b>${docs.length}</b><small>Dokumen</small></span><span><b>${hist.length}</b><small>Riwayat</small></span><span><b>${refs.length}</b><small>Referensi</small></span></div>${issues.map(x=>`<div class="v06-source-row"><b>${esc(x.title)}</b><small>${esc(x.detail||'Kendala sumber Excel')}</small></div>`).join('')}${docs.map(x=>`<div class="v06-source-row"><b>Dokumen diperlukan</b><small>${esc(x.requirementText)}</small></div>`).join('')}${hist.map(x=>`<div class="v06-source-row"><b>${esc(x.title)}</b><small>Sheet1 · baris ${x.sourceRow} · ${esc(x.npwp||'tanpa NPWP')}</small></div>`).join('')}<div id="v06VaultBox" class="v06-vault-box">${hasVault?`<button class="btn" onclick="v06UnlockVault('${id}')">${v06VaultKey?'Tampilkan Data Sensitif':'Buka Data Sensitif'}</button>`:'<span class="v051-help">Tidak ada credential import untuk member ini.</span>'}</div>`;body.appendChild(card);if(hasVault&&v06VaultKey)await v06RenderUnlockedVault(id)
}
const v06PreviousOpenTaxpayer=openTaxpayer;
openTaxpayer=function(id,show=true){v06PreviousOpenTaxpayer(id,show);setTimeout(()=>v06InjectMemberData(id),0)};

const v06PreviousAttention=attention;
attention=function(){const imported=v06ImportedIssues().filter(x=>x.taxpayerId);if(!imported.length)return v06PreviousAttention();return `<div class="card"><div class="splitHead"><div><h2>Kendala dari Excel</h2><p>${imported.length} catatan sumber yang perlu ditinjau.</p></div>${badge(imported.length,'warn')}</div><div class="attention">${imported.map(x=>`<button class="att ${/SALAH|AKSES/i.test(x.title||'')?'critical':''}" onclick="openTaxpayer('${x.taxpayerId}')"><b>${esc(tp(x.taxpayerId)?.name||x.entityName||'WP')}</b><p>${esc(x.title)}</p><small>${esc(x.detail||`Source ${x.sourceSheet}`)}</small></button>`).join('')}</div></div>`+v06PreviousAttention()};

const v06PreviousDashboard=dashboard;
dashboard=function(){if(!state.taxpayers.length)return `<div class="v06-empty-dashboard"><div><span class="badge blue">Database kosong</span><h2>Import data Member WP</h2><p>Demo sudah dihapus. Masukkan paket private dari workbook untuk mulai menggunakan aplikasi.</p><button class="btn primary" onclick="v06OpenPrivateImport()">Import Data Excel</button></div></div>`;return v06PreviousDashboard()};
const v06PreviousMoreView=v051MoreView;
v051MoreView=function(){const s=v06ImportSummary();return `<div class="v06-more-import"><button onclick="go('excelimport')"><span><b>Data Excel & Vault</b><small>${s?`${s.taxpayers||state.taxpayers.length} WP · ${v06EncryptedCredentials().length} credential terenkripsi`:'Belum ada data Excel'}</small></span><i>›</i></button></div>`+v06PreviousMoreView()};
const v06PreviousDataView=dataView;
dataView=function(){return v06ImportView()+v06PreviousDataView().replace('Menghapus seluruh data di browser ini dan kembali ke 233 WP demo.','Menghapus seluruh data lokal dan vault. Database menjadi kosong.')};

const v06PreviousGo=go;
go=function(id){if(id==='excelimport'){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='excelimport'));document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='more'));document.getElementById('title').textContent='Data Excel & Vault';document.getElementById('subtitle').textContent='Import lokal dan credential terenkripsi';renderAll();return}v06PreviousGo(id)};
const v06PreviousRenderAll=renderAll;
renderAll=function(){v06PreviousRenderAll();const view=document.getElementById('excelimport');if(view)view.innerHTML=v06ImportView()};

function v06SetupUi(){
  document.title='Member WP v0.6 — Private Excel Control Center';const brand=document.querySelector('.brand small');if(brand)brand.textContent='Control Center v0.6';const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.6';const notice=document.querySelector('.notice');if(notice)notice.innerHTML='<b>Local-only</b> · Data Excel tersimpan di browser. Credential sensitif disimpan terenkripsi dan master passphrase tidak disimpan.';
  const content=document.querySelector('.content');if(content&&!document.getElementById('excelimport')){const section=document.createElement('section');section.id='excelimport';section.className='view';content.appendChild(section)}
}
async function v06Boot(){
  try{if(!db||document.getElementById('appRoot')?.hidden){setTimeout(v06Boot,80);return}v06SetupUi();const purged=await v06PurgeDemo();if(purged)await refresh();await put('meta',{key:'appVersion',value:V06_VERSION,at:now()});await loadState();renderAll()}catch(e){console.warn('v0.6 boot',e)}
}
Object.assign(window,{go,renderAll,resetDatabase,openTaxpayer,v06OpenPrivateImport,v06ReadPrivateImport,v06ImportPrivatePackage,v06UnlockVault,v06DoUnlock,v06LockVault,v06Copy});
v06SetupUi();setTimeout(v06Boot,100);
