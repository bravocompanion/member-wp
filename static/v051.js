/* Member WP v0.5.1 — Audit, Safety & Minimal UI */
const V051_VERSION='0.5.1';
const V051_SECONDARY_VIEWS=new Set(['templates','attention','activity','data']);

function v051NormalizeNpwp(value){return String(value||'').replace(/\D/g,'')}
function v051IsRealNpwp(value){const digits=v051NormalizeNpwp(value);return digits.length>=10&&!/^0+$/.test(digits)}
function v051ValidDate(value){if(!value)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number),x=new Date(y,m-1,d);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d}

function v051AuditData(){
  const issues=[],taxIds=new Set(state.taxpayers.map(x=>x.id));
  const push=(level,code,message)=>issues.push({level,code,message});
  state.taxpayers.forEach(x=>{
    if(!x.id||!String(x.name||'').trim())push('error','member_required',`Member tanpa ID/nama: ${x.id||'ID kosong'}`);
    if(!['BADAN','OP'].includes(x.type))push('error','member_type',`${x.name||x.id}: jenis WP tidak valid.`);
  });
  const npwpMap=new Map();
  state.taxpayers.forEach(x=>{if(v051IsRealNpwp(x.npwp)){const k=v051NormalizeNpwp(x.npwp);const rows=npwpMap.get(k)||[];rows.push(x.name||x.id);npwpMap.set(k,rows)}});
  npwpMap.forEach((names,npwp)=>{if(names.length>1)push('warning','duplicate_npwp',`NPWP ${npwp} digunakan ${names.length} member: ${names.slice(0,3).join(', ')}${names.length>3?'…':''}`)});
  state.profiles.forEach(p=>{if(!taxIds.has(p.taxpayerId))push('error','orphan_profile',`Profil tanpa member: ${p.taxpayerId}`);(p.codes||[]).forEach(code=>{if(!catalog.some(c=>c[0]===code))push('warning','unknown_obligation',`${p.taxpayerId}: kode kewajiban tidak dikenal (${code}).`)})});
  state.tasks.forEach(t=>{
    if(!taxIds.has(t.taxpayerId))push('error','orphan_task',`Task tanpa member: ${t.title||t.id}`);
    if(!String(t.title||'').trim())push('error','task_title',`Task ${t.id||'(tanpa ID)'} tidak memiliki judul.`);
    if(t.dueDate&&!v051ValidDate(t.dueDate))push('error','task_date',`${t.title||t.id}: deadline tidak valid (${t.dueDate}).`);
  });
  state.notes.forEach(n=>{if(!taxIds.has(n.taxpayerId))push('error','orphan_note',`Catatan tanpa member: ${n.id}`)});
  const complianceKeys=new Map();
  state.tasks.filter(t=>t.kind==='compliance'&&t.code&&t.periodKey).forEach(t=>{const key=`${t.taxpayerId}|${t.code}|${t.periodKey}`,rows=complianceKeys.get(key)||[];rows.push(t);complianceKeys.set(key,rows)});
  complianceKeys.forEach(rows=>{if(rows.length>1)push('error','duplicate_task',`Task compliance duplikat: ${tp(rows[0].taxpayerId)?.name||rows[0].taxpayerId} · ${rows[0].title} · ${rows[0].periodKey}.`)});
  const errors=issues.filter(x=>x.level==='error').length,warnings=issues.filter(x=>x.level==='warning').length;
  return {issues,errors,warnings,status:errors?'Masalah data':warnings?'Perlu review':'Baik'};
}

function v051LastBackupInfo(){
  const raw=state.meta.find(x=>x.key==='lastBackup')?.value;
  if(!raw)return {label:'Belum pernah',age:null,state:'warning'};
  const parsed=new Date(raw);
  if(Number.isNaN(parsed.getTime()))return {label:String(raw),age:null,state:'warning'};
  const base=new Date();base.setHours(0,0,0,0);const d=new Date(parsed);d.setHours(0,0,0,0);const age=Math.max(0,Math.round((base-d)/86400000));
  return {label:age===0?'Hari ini':age===1?'Kemarin':`${age} hari lalu`,age,state:age>7?'warning':'ok',full:parsed.toLocaleString('id-ID')};
}
function v051CompactStatus(){
  const backup=v051LastBackupInfo(),audit=v051AuditData();
  return {backup,audit,configured:state.profiles.filter(p=>p.codes?.length).length,waiting:state.tasks.filter(t=>isOpen(t)&&['blocked','waiting_documents','waiting_client','waiting_review'].includes(t.status)).length};
}

/* Fix core UTC/local-date mismatch around midnight. */
isOverdue=function(t){return Boolean(t.dueDate&&v05DayDiff(t.dueDate)<0&&isOpen(t))};
isDueToday=function(t){return Boolean(t.dueDate&&v05DayDiff(t.dueDate)===0&&isOpen(t))};

function v051FocusRow(t){
  const x=tp(t.taxpayerId),action=t.status==='in_progress'?`<button class="btn small primary" onclick="v05CompleteTask('${t.id}')">Selesai</button>`:`<button class="btn small" onclick="v05StartTask('${t.id}')">Mulai</button>`;
  return `<div class="v051-focus-row"><div class="v051-focus-copy"><b>${esc(t.title)}</b><small>${esc(x?.name||'WP')}${x?.pic?` · PIC ${esc(x.pic)}`:''}${t.kind==='compliance'&&typeof v04TaskPeriodLabel==='function'?` · ${esc(v04TaskPeriodLabel(t))}`:''}</small></div><div class="v051-focus-state">${v05DueLabel(t)}${t.priority==='high'?badge('Tinggi','danger'):''}</div><div class="v051-focus-actions"><button class="btn small" onclick="openTaxpayer('${t.taxpayerId}')">Buka</button>${action}</div></div>`;
}
function v051OperationalAttention(){
  const rows=[];
  state.tasks.filter(t=>isOpen(t)&&['blocked','waiting_documents','waiting_client','waiting_review'].includes(t.status)).forEach(t=>rows.push({name:tp(t.taxpayerId)?.name||'WP',text:`${t.title} · ${statusLabel[t.status]||t.status}`,kind:t.status==='blocked'?'danger':'warn'}));
  state.taxpayers.filter(x=>x.status==='attention').forEach(x=>rows.push({name:x.name,text:'Status member: Attention',kind:'warn'}));
  return rows.slice(0,4);
}
function v051Dashboard(){
  const s=v05DeadlineStats(),focus=v05FocusTasks().slice(0,8),meta=v051CompactStatus(),attention=v051OperationalAttention(),pinned=state.notes.filter(n=>n.pinned).slice(0,3);
  return `<div class="v051-kpis"><button onclick="v05OpenDeadlineFilter('overdue')"><span>Overdue</span><b>${s.overdue}</b><small>lewat deadline</small></button><button onclick="v05OpenDeadlineFilter('today')"><span>Hari ini</span><b>${s.today}</b><small>jatuh tempo</small></button><button onclick="v05OpenDeadlineFilter('7')"><span>7 hari</span><b>${s.d7}</b><small>mendatang</small></button><button onclick="v05OpenDeadlineFilter('nodate')"><span>Tanpa deadline</span><b>${s.noDate}</b><small>perlu dilengkapi</small></button></div><div class="v051-meta"><span>8–14 hari <b>${s.d14}</b></span><span>15–30 hari <b>${s.d30}</b></span><span>Profil aktif <b>${meta.configured}</b></span><span>Backup <b class="${meta.backup.state==='warning'?'dangerText':''}">${esc(meta.backup.label)}</b></span><span>Data <b>${esc(meta.audit.status)}</b></span></div><div class="card v051-focus"><div class="splitHead"><div><h2>Prioritas Hari Ini</h2><p>Urutan otomatis berdasarkan deadline, prioritas, dan status.</p></div><button class="btn" onclick="go('deadlines')">Semua deadline</button></div>${focus.map(v051FocusRow).join('')||'<div class="empty">Tidak ada task aktif yang perlu ditangani.</div>'}</div><div class="grid equal v051-dashboard-bottom"><div class="card"><div class="splitHead"><div><h2>Menunggu / Kendala</h2><p>Item non-deadline yang tetap memerlukan follow-up.</p></div>${badge(meta.waiting,meta.waiting?'warn':'ok')}</div>${attention.map(a=>`<div class="row"><div><b>${esc(a.name)}</b><small>${esc(a.text)}</small></div>${badge(a.kind==='danger'?'Kendala':'Follow-up',a.kind)}</div>`).join('')||'<div class="empty compact">Tidak ada kendala aktif.</div>'}</div><div class="card"><div class="splitHead"><div><h2>Catatan Pin</h2><p>Catatan penting yang sengaja dipertahankan di depan.</p></div><button class="btn small" onclick="go('notes')">Catatan</button></div>${pinned.map(n=>`<div class="row"><div><b>${esc(tp(n.taxpayerId)?.name||'WP')}</b><small>${esc(n.text)}</small></div>${badge('PIN','warn')}</div>`).join('')||'<div class="empty compact">Belum ada catatan yang di-pin.</div>'}</div></div>`;
}
dashboard=v051Dashboard;

function v051MemberList(){return `<div class="tablebox v051-memberbox"><div class="toolbar"><input id="q" placeholder="Cari nama, NPWP, PIC, telepon" oninput="renderTaxTable()"><select id="type" onchange="renderTaxTable()"><option value="ALL">Semua jenis</option><option value="BADAN">BADAN</option><option value="OP">OP</option></select><select id="memberStatus" onchange="renderTaxTable()"><option value="ALL">Semua status</option><option value="active">Aktif</option><option value="attention">Attention</option><option value="inactive">Nonaktif</option></select><button class="btn primary" onclick="openMemberForm()">+ Member</button></div><div id="taxTable"></div></div>`}
taxpayers=v051MemberList;
renderTaxTable=function(){
  const el=document.getElementById('taxTable');if(!el)return;const q=(document.getElementById('q')?.value||'').toLowerCase(),type=document.getElementById('type')?.value||'ALL',st=document.getElementById('memberStatus')?.value||'ALL';
  const rows=state.taxpayers.filter(x=>(type==='ALL'||x.type===type)&&(st==='ALL'||x.status===st)&&(!q||`${x.name} ${x.npwp} ${x.pic||''} ${x.phone||''}`.toLowerCase().includes(q)));
  el.innerHTML=`<div class="result">${rows.length} dari ${state.taxpayers.length} WP</div><div class="v051-member-list">${rows.map(x=>{const open=state.tasks.filter(t=>t.taxpayerId===x.id&&isOpen(t)).length;return `<button class="v051-member-row" onclick="openTaxpayer('${x.id}')"><span class="v051-member-name"><b>${esc(x.name)}</b><small>${esc(x.npwp||'NPWP belum diisi')}</small></span><span>${badge(x.type,'blue')}</span><span><b>${esc(x.pic||'—')}</b><small>PIC</small></span><span><b>${open}</b><small>task aktif</small></span><span>${x.status==='active'?badge('Aktif','ok'):x.status==='attention'?badge('Attention','warn'):badge('Nonaktif')}</span><span class="v051-chevron">›</span></button>`}).join('')||'<div class="empty">Tidak ada member sesuai filter.</div>'}</div>`;
};

function v051DeadlineFilterChip(key,label,count){return `<button class="v051-chip ${v05DeadlineFilter===key?'active':''}" onclick="v05SetDeadlineFilter('${key}')"><span>${label}</span><b>${count}</b></button>`}
v05DeadlinesView=function(){
  const s=v05DeadlineStats();
  return `<div class="v051-deadline-head"><div class="v051-chipbar">${v051DeadlineFilterChip('all','Semua',s.open)}${v051DeadlineFilterChip('overdue','Overdue',s.overdue)}${v051DeadlineFilterChip('today','Hari ini',s.today)}${v051DeadlineFilterChip('7','≤ 7 hari',s.d7)}${v051DeadlineFilterChip('14','8–14',s.d14)}${v051DeadlineFilterChip('30','15–30',s.d30)}${v051DeadlineFilterChip('nodate','Tanpa tanggal',s.noDate)}${v051DeadlineFilterChip('snoozed','Snoozed',s.snoozed)}</div></div><div class="tablebox"><div class="toolbar"><input id="v05Search" placeholder="Cari task, WP, PIC" oninput="v05RenderDeadlineTable()"><select id="v05Priority" onchange="v05RenderDeadlineTable()"><option value="ALL">Semua prioritas</option><option value="high">Tinggi</option><option value="medium">Sedang</option><option value="low">Rendah</option></select><select id="v05Status" onchange="v05RenderDeadlineTable()"><option value="ALL">Semua status</option>${Object.entries(statusLabel).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><button class="btn" onclick="v05EnableBrowserReminder()">Reminder browser</button></div><div id="v05DeadlineTable"></div></div><div class="v051-help">Snooze hanya menunda pengingat internal. Deadline task tidak berubah.</div>`;
};
v05RenderDeadlineTable=function(){
  const el=document.getElementById('v05DeadlineTable');if(!el)return;const rows=v05DeadlineRows();
  el.innerHTML=`<div class="result">${rows.length} task sesuai filter</div><div class="v051-deadline-list">${rows.map(t=>{const member=tp(t.taxpayerId),snoozed=v05IsSnoozed(t);return `<div class="v051-deadline-row ${v05DayDiff(t.dueDate)<0?'is-overdue':''}"><div class="v051-deadline-copy"><b>${esc(t.title)}</b><small>${esc(member?.name||'WP')}${member?.pic?` · PIC ${esc(member.pic)}`:''}${t.kind==='compliance'&&typeof v04TaskPeriodLabel==='function'?` · ${esc(v04TaskPeriodLabel(t))}`:''}</small></div><div class="v051-deadline-due"><b>${esc(t.dueDate||'—')}</b>${v05DueLabel(t)}</div><div class="v051-deadline-state">${badge(statusLabel[t.status]||t.status,t.status==='blocked'?'danger':t.status==='in_progress'?'blue':['waiting_documents','waiting_client','waiting_review'].includes(t.status)?'warn':'')}${t.priority==='high'?badge('Tinggi','danger'):''}${snoozed?badge('Snooze','blue'):''}</div><div class="v051-deadline-actions"><button class="linkbtn" onclick="openTaxpayer('${t.taxpayerId}')">Buka</button>${t.status!=='in_progress'?`<button class="linkbtn" onclick="v05StartTask('${t.id}')">Mulai</button>`:`<button class="linkbtn" onclick="v05CompleteTask('${t.id}')">Selesai</button>`}<button class="linkbtn" onclick="${snoozed?`v05ClearSnooze('${t.id}')`:`v05SnoozeTask('${t.id}',1)`}">${snoozed?'Aktifkan':'+1d'}</button></div></div>`}).join('')||'<div class="empty">Tidak ada task sesuai filter.</div>'}</div>`;
};

function v051MoreView(){
  const audit=v051AuditData(),templates=typeof v04AllTemplates==='function'?v04AllTemplates().length:0,att=v051OperationalAttention().length;
  return `<div class="v051-more-grid"><button onclick="go('templates')"><span><b>Template Kewajiban</b><small>${templates} template tersedia</small></span><i>›</i></button><button onclick="go('attention')"><span><b>Attention</b><small>${att} follow-up / kendala aktif</small></span><i>›</i></button><button onclick="go('activity')"><span><b>Aktivitas</b><small>${state.activities.length} catatan audit lokal</small></span><i>›</i></button><button onclick="go('data')"><span><b>Data & Backup</b><small>${audit.errors+audit.warnings} temuan audit · ${esc(v051LastBackupInfo().label)}</small></span><i>›</i></button></div>`;
}
function v051AuditCard(){const a=v051AuditData();return `<div class="card"><div class="splitHead"><div><h2>Data Health</h2><p>Pemeriksaan struktur data lokal, relasi, duplikasi, dan tanggal.</p></div>${badge(a.status,a.errors?'danger':a.warnings?'warn':'ok')}</div><div class="v051-health"><span><b>${a.errors}</b><small>Error</small></span><span><b>${a.warnings}</b><small>Review</small></span><span><b>${state.taxpayers.length}</b><small>Member</small></span><span><b>${state.tasks.length}</b><small>Task</small></span></div><button class="btn" onclick="v051OpenDataAudit()">Lihat hasil audit</button></div>`}
function v051DataView(){
  const backup=v051LastBackupInfo(),migrated=state.meta.find(x=>x.key==='migratedFrom')?.value||'Tidak';
  return `<div class="grid equal">${v051AuditCard()}<div class="card"><div class="splitHead"><div><h2>Backup & Restore</h2><p>Backup lengkap database lokal ke satu file JSON.</p></div>${badge(backup.label,backup.state==='warning'?'warn':'ok')}</div><div class="storageBox"><span id="storageEstimate">Menghitung kapasitas...</span><br>Migrasi lama: <b>${esc(migrated)}</b></div><div class="actions" style="margin-top:12px"><button class="btn primary" onclick="exportBackup()">Backup JSON</button><button class="btn" onclick="openImport()">Restore JSON</button></div></div></div><div class="card v051-local-card"><div><h2>Penyimpanan Lokal</h2><p>IndexedDB pada browser ini. Tidak ada sinkronisasi cloud otomatis.</p></div><div class="v051-local-points"><span>Jangan simpan password / EFIN / passphrase / key</span><span>Gunakan Cloudflare Access untuk membatasi akses halaman</span></div></div><details class="v051-danger-zone"><summary>Reset database lokal</summary><div><p>Menghapus seluruh data di browser ini dan kembali ke 233 WP demo.</p><button class="btn danger" onclick="resetDatabase()">Reset Database</button></div></details>`;
}
dataView=v051DataView;
function v051OpenDataAudit(){
  const a=v051AuditData();const rows=a.issues.slice(0,100);
  modal('Data Health Audit',`<p>${a.errors} error · ${a.warnings} perlu review. Audit ini tidak mengubah data.</p><div class="v051-audit-list">${rows.map(x=>`<div class="v051-audit-item"><span>${badge(x.level==='error'?'Error':'Review',x.level==='error'?'danger':'warn')}</span><div><b>${esc(x.code)}</b><small>${esc(x.message)}</small></div></div>`).join('')||'<div class="empty">Tidak ditemukan masalah struktur data.</div>'}${a.issues.length>100?`<div class="result">Menampilkan 100 dari ${a.issues.length} temuan.</div>`:''}</div>`);
}

function v051ValidateBackup(x){
  const errors=[];if(!x||typeof x!=='object')errors.push('File bukan object JSON.');if(!Array.isArray(x?.taxpayers))errors.push('taxpayers wajib berupa array.');
  const names=['taxpayers','profiles','tasks','notes','activities','meta'];names.forEach(k=>{if(x?.[k]!==undefined&&!Array.isArray(x[k]))errors.push(`${k} harus berupa array.`)});
  if(containsSecrets(x))errors.push('Backup mengandung field credential sensitif.');
  const unique=(arr,key,label)=>{const seen=new Set();for(const row of arr||[]){const id=row?.[key];if(!id){errors.push(`${label} memiliki record tanpa ${key}.`);continue}if(seen.has(id))errors.push(`${label} memiliki ${key} duplikat: ${id}.`);seen.add(id)}};
  unique(x?.taxpayers,'id','taxpayers');unique(x?.profiles,'taxpayerId','profiles');unique(x?.tasks,'id','tasks');unique(x?.notes,'id','notes');unique(x?.activities,'id','activities');unique(x?.meta,'key','meta');
  const ids=new Set((x?.taxpayers||[]).map(t=>t.id));(x?.profiles||[]).forEach(p=>{if(!ids.has(p.taxpayerId))errors.push(`Profil orphan: ${p.taxpayerId}.`)});(x?.tasks||[]).forEach(t=>{if(!ids.has(t.taxpayerId))errors.push(`Task orphan: ${t.title||t.id}.`);if(t.dueDate&&!v051ValidDate(t.dueDate))errors.push(`Deadline task tidak valid: ${t.title||t.id}.`)});(x?.notes||[]).forEach(n=>{if(!ids.has(n.taxpayerId))errors.push(`Note orphan: ${n.id}.`)});
  return [...new Set(errors)].slice(0,50);
}
exportBackup=async function(){
  const at=now();await logActivity(null,'backup',`Backup JSON v${V051_VERSION} dibuat.`,'System');await put('meta',{key:'lastBackup',value:at,at});await put('meta',{key:'appVersion',value:V051_VERSION,at});await loadState();
  const backup={schema:'member-wp-local',version:V051_VERSION,exportedAt:at,taxpayers:state.taxpayers,profiles:state.profiles,tasks:state.tasks,notes:state.notes,activities:state.activities,meta:state.meta};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`member-wp-backup-${v05LocalDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);renderAll();
};
restoreBackup=async function(){
  try{
    const x=JSON.parse(document.getElementById('importText').value),errors=v051ValidateBackup(x);if(errors.length)throw new Error(errors.join('\n'));
    if(!confirm(`Restore ${x.taxpayers.length} member? Database lokal saat ini akan diganti secara atomik.`))return;
    const incoming={taxpayers:x.taxpayers||[],profiles:x.profiles||[],tasks:x.tasks||[],notes:x.notes||[],activities:x.activities||[],meta:x.meta||[]};
    await new Promise((resolve,reject)=>{const tx=db.transaction(STORES,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Transaksi restore dibatalkan.'));for(const name of STORES){const store=tx.objectStore(name);store.clear();for(const row of incoming[name]||[])store.put(row)}});
    await put('meta',{key:'lastRestore',value:now(),at:now()});await put('meta',{key:'appVersion',value:V051_VERSION,at:now()});await logActivity(null,'restore',`Restore atomik: ${x.taxpayers.length} member dari backup ${x.version||'legacy'}.`,'System');closeModal();await refresh();alert('Restore berhasil. Database diperbarui secara atomik.');
  }catch(e){alert(`Restore ditolak:\n${e.message}`)}
};

const v051PreviousGo=go;
go=function(id){
  if(id==='more'){
    document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='more'));document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='more'));document.getElementById('title').textContent='Lainnya';document.getElementById('subtitle').textContent='Pengaturan dan kontrol sekunder';renderAll();return;
  }
  v051PreviousGo(id);if(V051_SECONDARY_VIEWS.has(id)){document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='more'))}
};
const v051PreviousRenderAll=renderAll;
renderAll=function(){v051PreviousRenderAll();const more=document.getElementById('more');if(more)more.innerHTML=v051MoreView();v051UpdateSideStatus()};

function v051UpdateSideStatus(){const el=document.querySelector('.sidefoot');if(!el)return;const b=v051LastBackupInfo();el.innerHTML=`<b>Local</b> · IndexedDB<br><span>Backup: ${esc(b.label)}</span>`}
function v051SetupUi(){
  document.title='Member WP v0.5.1 — Admin Control Center';const brand=document.querySelector('.brand small');if(brand)brand.textContent='Control Center v0.5.1';const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.5.1';
  const notice=document.querySelector('.notice');if(notice){notice.classList.add('v051-notice');notice.innerHTML='<b>Local-only</b> · Data tersimpan di browser ini. Backup rutin dan jangan simpan credential sensitif.'}
  const top=document.querySelector('.topactions');if(top)top.innerHTML='<button class="btn" onclick="exportBackup()">Backup</button><button class="btn primary" onclick="openMemberForm()">+ Member</button>';
  const nav=document.getElementById('nav');if(nav){
    const labels={dashboard:'Today',taxpayers:'WP',compliance:'Task',deadlines:'Deadline',notes:'Catatan'};Object.entries(labels).forEach(([k,v])=>{const b=nav.querySelector(`[data-view="${k}"] span`);if(b)b.textContent=v});
    ['templates','attention','activity','data'].forEach(k=>nav.querySelector(`[data-view="${k}"]`)?.classList.add('v051-secondary-nav'));
    let more=nav.querySelector('[data-view="more"]');if(!more){more=document.createElement('button');more.dataset.view='more';more.innerHTML='<span>Lainnya</span>';nav.appendChild(more)}
    ['dashboard','taxpayers','compliance','deadlines','notes','more'].forEach(k=>{const b=nav.querySelector(`[data-view="${k}"]`);if(b)nav.appendChild(b)});
    ['templates','attention','activity','data'].forEach(k=>{const b=nav.querySelector(`[data-view="${k}"]`);if(b)nav.appendChild(b)});
  }
  const content=document.querySelector('.content');if(content&&!document.getElementById('more')){const section=document.createElement('section');section.id='more';section.className='view';content.appendChild(section)}
}

Object.assign(window,{go,renderAll,renderTaxTable,exportBackup,restoreBackup,v05RenderDeadlineTable,v051OpenDataAudit});
v051SetupUi();
setTimeout(()=>{v051SetupUi();try{renderAll()}catch(e){console.warn('v0.5.1 render refresh skipped',e)}},0);
