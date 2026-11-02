/* Member WP v0.11 — Checklist Monitoring Coretax DJP */
const V011_VERSION='0.11.0';
const V011_CODE='CORETAX_DJP_WEEKLY';
let v011Seeding=false;

function v011WeekInfo(date=new Date()){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day=(d.getDay()+6)%7;
  const start=new Date(d);start.setDate(d.getDate()-day);
  const end=new Date(start);end.setDate(start.getDate()+6);
  const iso=x=>`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  return {start:iso(start),end:iso(end),label:`${start.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})} – ${end.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}`};
}
function v011TaskId(taxpayerId,start){return `coretax-weekly-${start}-${taxpayerId}`}
function v011WeeklyTasks(start=v011WeekInfo().start){return state.tasks.filter(t=>t.kind==='weekly_monitoring'&&t.code===V011_CODE&&t.weekStart===start)}
function v011TaskFor(taxpayerId,start=v011WeekInfo().start){return state.tasks.find(t=>t.taxpayerId===taxpayerId&&t.kind==='weekly_monitoring'&&t.code===V011_CODE&&t.weekStart===start)}
function v011Done(t){return t?.status==='completed'}
function v011Percent(done,total){return total?Math.round(done/total*100):0}
function v011DateTime(value){if(!value)return'—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}

async function v011EnsureWeek(){
  if(v011Seeding||!db||!state.taxpayers.length)return;
  v011Seeding=true;
  try{
    const w=v011WeekInfo(),existing=new Set(v011WeeklyTasks(w.start).map(t=>t.taxpayerId)),at=now();
    let made=0;
    for(const x of state.taxpayers){
      if(existing.has(x.id))continue;
      await put('tasks',{id:v011TaskId(x.id,w.start),taxpayerId:x.id,title:'Monitoring Coretax DJP',code:V011_CODE,kind:'weekly_monitoring',cadence:'weekly',status:'not_started',priority:'medium',dueDate:w.end,weekStart:w.start,weekEnd:w.end,completedAt:null,createdAt:at,updatedAt:at});
      made++;
    }
    if(made){await loadState();if(v09Ready&&typeof v09Flush==='function')await v09Flush();renderAll()}
  }finally{v011Seeding=false}
}

async function v011SetDone(taskId,checked){
  const t=state.tasks.find(x=>x.id===taskId);if(!t)return;
  t.status=checked?'completed':'not_started';t.completedAt=checked?now():null;t.updatedAt=now();
  await put('tasks',t);await loadState();renderAll();
}
async function v011ToggleWp(id,checked){
  let t=v011TaskFor(id);
  if(!t){await v011EnsureWeek();t=v011TaskFor(id)}
  if(t)await v011SetDone(t.id,checked);
}

function v011MonitoringTable(){
  const w=v011WeekInfo(),tasks=v011WeeklyTasks(w.start),map=new Map(tasks.map(t=>[t.taxpayerId,t]));
  const q=(document.getElementById('v011Q')?.value||'').trim().toLowerCase();
  const filter=document.getElementById('v011Filter')?.value||'ALL';
  const rows=state.taxpayers.filter(x=>{
    const t=map.get(x.id),done=v011Done(t);
    return (!q||String(x.name||'').toLowerCase().includes(q))&&(filter==='ALL'||(filter==='DONE'&&done)||(filter==='OPEN'&&!done));
  });
  return `<div class="v011-table-wrap"><div class="v011-result">${rows.length} WP</div><table class="v011-table"><thead><tr><th>Cek</th><th>Nama WP</th><th>Jenis</th><th>Status Minggu Ini</th><th>Selesai</th><th></th></tr></thead><tbody>${rows.map(x=>{const t=map.get(x.id),done=v011Done(t);return `<tr class="${done?'is-done':''}"><td><input class="v011-check" type="checkbox" ${done?'checked':''} onchange="v011ToggleWp('${esc(x.id)}',this.checked)"></td><td class="name">${esc(x.name)}</td><td>${esc(x.type||'—')}</td><td>${done?badge('Sudah Dicek','ok'):badge('Belum Dicek','warn')}</td><td>${done?esc(v011DateTime(t.completedAt||t.updatedAt)):'—'}</td><td><button class="linkbtn" onclick="openTaxpayer('${esc(x.id)}')">Buka</button></td></tr>`}).join('')}</tbody></table></div>`;
}
function v011Monitoring(){
  const w=v011WeekInfo(),tasks=v011WeeklyTasks(w.start),done=tasks.filter(v011Done).length,total=state.taxpayers.length,pct=v011Percent(done,total);
  return `<div class="v011-week-head"><div><span class="badge blue">Mingguan</span><h2>Monitoring Coretax DJP</h2><p>${w.label} · batas cek ${new Date(w.end+'T12:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long'})}</p></div><div class="v011-progress-ring"><b>${pct}%</b><span>${done}/${total}</span></div></div>
  <div class="stats v011-stats"><div class="stat"><label>Total WP</label><b>${total}</b><small>semua WP</small></div><div class="stat"><label>Sudah Dicek</label><b>${done}</b><small>minggu ini</small></div><div class="stat"><label>Belum Dicek</label><b>${Math.max(0,total-done)}</b><small>perlu dicek</small></div></div>
  <div class="tablebox"><div class="toolbar"><input id="v011Q" placeholder="Cari nama WP" oninput="document.getElementById('dashboard').innerHTML=v011Monitoring()"><select id="v011Filter" onchange="document.getElementById('dashboard').innerHTML=v011Monitoring()"><option value="ALL">Semua</option><option value="OPEN">Belum Dicek</option><option value="DONE">Sudah Dicek</option></select></div>${v011MonitoringTable()}</div>`;
}
function v011WpList(){
  return `<div class="card"><div class="splitHead"><div><h2>Semua WP</h2><p>Hanya nama, jenis WP, status, dan checklist mingguan.</p></div><button class="btn primary" onclick="openMemberForm()">+ WP</button></div><div class="tablebox"><div class="toolbar"><input id="v011WpQ" placeholder="Cari nama WP" oninput="v011RenderWpRows()"></div><div id="v011WpRows"></div></div></div>`;
}
function v011RenderWpRows(){
  const el=document.getElementById('v011WpRows');if(!el)return;
  const q=(document.getElementById('v011WpQ')?.value||'').toLowerCase(),w=v011WeekInfo();
  const rows=state.taxpayers.filter(x=>!q||String(x.name||'').toLowerCase().includes(q));
  el.innerHTML=`<table><thead><tr><th>Nama WP</th><th>Jenis</th><th>Status</th><th>Monitoring Minggu Ini</th><th></th></tr></thead><tbody>${rows.map(x=>{const t=v011TaskFor(x.id,w.start);return `<tr><td class="name">${esc(x.name)}</td><td>${esc(x.type||'—')}</td><td>${x.status==='inactive'?badge('Nonaktif'):badge('Aktif','ok')}</td><td>${v011Done(t)?badge('Sudah Dicek','ok'):badge('Belum Dicek','warn')}</td><td><button class="linkbtn" onclick="openTaxpayer('${esc(x.id)}')">Buka</button></td></tr>`}).join('')}</tbody></table>`;
}
function v011History(){
  const groups={};
  for(const t of state.tasks.filter(t=>t.kind==='weekly_monitoring'&&t.code===V011_CODE)){const k=t.weekStart||'Tanpa minggu';(groups[k]??=[]).push(t)}
  const weeks=Object.keys(groups).sort().reverse();
  return `<div class="card"><h2>Riwayat Monitoring Mingguan</h2><p>Ringkasan checklist Coretax DJP tiap minggu.</p>${weeks.length?weeks.map(k=>{const rows=groups[k],done=rows.filter(v011Done).length;return `<div class="v011-history-row"><div><b>${esc(k)}</b><small>${done} dari ${rows.length} WP selesai</small></div><div class="progress"><span style="width:${v011Percent(done,rows.length)}%"></span></div><b>${v011Percent(done,rows.length)}%</b></div>`}).join(''):'<div class="empty">Belum ada riwayat monitoring.</div>'}</div>`;
}

function v011RenderAll(){
  const d=document.getElementById('dashboard'),w=document.getElementById('taxpayers'),h=document.getElementById('compliance');
  if(d)d.innerHTML=v011Monitoring();if(w){w.innerHTML=v011WpList();v011RenderWpRows()}if(h)h.innerHTML=v011History();
  ['attention','notes','activity','data'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=''});
  v011CleanShell();
}
function v011Go(id){
  const allowed=['dashboard','taxpayers','compliance'],target=allowed.includes(id)?id:'dashboard';
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===target));
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===target));
  const titles={dashboard:['Monitoring Coretax DJP','Checklist mingguan semua WP'],taxpayers:['Semua WP','Daftar WP tanpa data sensitif'],compliance:['Riwayat Mingguan','Progress Monitoring Coretax DJP per minggu']};
  document.getElementById('title').textContent=titles[target][0];document.getElementById('subtitle').textContent=titles[target][1];v011RenderAll();
}
function v011CleanShell(){
  const active=document.querySelector('.view.active')?.id||'dashboard';
  const nav=document.getElementById('nav');if(nav)nav.innerHTML='<button data-view="dashboard" class="'+(active==='dashboard'?'active':'')+'"><span>Monitoring</span></button><button data-view="taxpayers" class="'+(active==='taxpayers'?'active':'')+'"><span>Semua WP</span></button><button data-view="compliance" class="'+(active==='compliance'?'active':'')+'"><span>Riwayat</span></button>';
  document.querySelector('.topactions button[onclick="exportBackup()"]')?.remove();
  document.getElementById('v09DbButton')?.remove();
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Checklist WP v0.11';
  const foot=document.querySelector('.sidefoot');if(foot)foot.innerHTML='<b>Checklist Pribadi</b><br><span>Monitoring Coretax DJP</span>';
}
function v011OpenMemberForm(id=''){
  const x=id?tp(id):{name:'',type:'BADAN',status:'active'};if(!x)return;
  modal(id?'Edit WP':'Tambah WP',`<p>Aplikasi ini hanya menyimpan data minimum untuk checklist.</p><div class="formgrid"><div class="field"><label>Nama WP</label><input id="mName" value="${esc(x.name||'')}"></div><div class="field"><label>Jenis WP</label><select id="mType"><option value="BADAN" ${x.type==='BADAN'?'selected':''}>BADAN</option><option value="OP" ${x.type==='OP'?'selected':''}>OP</option></select></div><div class="field"><label>Status</label><select id="mStatus"><option value="active" ${x.status!=='inactive'?'selected':''}>Aktif</option><option value="inactive" ${x.status==='inactive'?'selected':''}>Nonaktif</option></select></div></div>`,`<button class="btn primary" onclick="v011SaveMember('${esc(id)}')">Simpan</button>`);
}
async function v011SaveMember(id=''){
  const name=document.getElementById('mName')?.value.trim();if(!name)return alert('Nama WP wajib diisi.');
  const old=id?tp(id):null,x={id:id||uid('wp'),name,type:document.getElementById('mType').value,status:document.getElementById('mStatus').value,createdAt:old?.createdAt||now(),updatedAt:now()};
  await put('taxpayers',x);closeModal();await loadState();await v011EnsureWeek();renderAll();openTaxpayer(x.id);
}
async function v011DeleteMember(id){
  const x=tp(id);if(!x||!confirm(`Hapus ${x.name} dari checklist Member WP?`))return;
  await del('taxpayers',id);for(const t of state.tasks.filter(t=>t.taxpayerId===id))await del('tasks',t.id);closeDrawer();await loadState();renderAll();
}
function v011OpenTaxpayer(id,show=true){
  const x=tp(id);if(!x)return;currentTaxpayerId=id;const w=v011WeekInfo(),t=v011TaskFor(id,w.start),history=state.tasks.filter(a=>a.taxpayerId===id&&a.kind==='weekly_monitoring').sort((a,b)=>String(b.weekStart).localeCompare(String(a.weekStart))).slice(0,12);
  document.getElementById('drawerBody').innerHTML=`<div class="hero"><h2>${esc(x.name)}</h2><small>${esc(x.type||'WP')} · ${x.status==='inactive'?'Nonaktif':'Aktif'}</small><div class="heroActions"><button class="btn small" onclick="openMemberForm('${esc(id)}')">Edit</button><button class="btn small danger" onclick="v011DeleteMember('${esc(id)}')">Hapus</button></div></div>
  <div class="card v011-member-check"><div class="splitHead"><div><h2>Monitoring Coretax DJP</h2><p>${w.label}</p></div>${v011Done(t)?badge('Sudah Dicek','ok'):badge('Belum Dicek','warn')}</div><label class="v011-big-check"><input type="checkbox" ${v011Done(t)?'checked':''} onchange="v011ToggleWp('${esc(id)}',this.checked)"><span>Sudah saya cek minggu ini</span></label><small>Batas minggu ini: ${esc(w.end)}</small></div>
  <div class="card"><h2>Riwayat Checklist</h2><div class="timeline">${history.map(a=>`<div class="timelineItem"><div>${v011Done(a)?badge('Selesai','ok'):badge('Belum','warn')}</div><p><b>${esc(a.weekStart||'—')}</b> — Monitoring Coretax DJP</p><small>${v011Done(a)?'Dicek '+esc(v011DateTime(a.completedAt||a.updatedAt)):'Belum selesai'}</small></div>`).join('')||'<div class="empty">Belum ada riwayat.</div>'}</div></div>`;
  if(show)document.getElementById('drawer').classList.add('open');
}

function v011Install(){
  document.title='Member WP v0.11 — Monitoring Coretax DJP';
  go=v011Go;renderAll=v011RenderAll;openMemberForm=v011OpenMemberForm;openTaxpayer=v011OpenTaxpayer;deleteMember=v011DeleteMember;
  const prevUpdate=v09UpdateUi;v09UpdateUi=function(){prevUpdate();v011CleanShell()};
  const loginBrand=document.querySelector('.v09-login-brand small');if(loginBrand)loginBrand.textContent='Checklist Pribadi';
  const intro=document.querySelector('.v09-login .intro');if(intro)intro.textContent='Login untuk buka checklist Monitoring Coretax DJP.';
  v011CleanShell();v011RenderAll();
  setInterval(()=>{if(v09Ready)v011EnsureWeek()},1200);
}
Object.assign(window,{v011ToggleWp,v011SetDone,v011Monitoring,v011RenderWpRows,v011SaveMember,v011DeleteMember});
setTimeout(v011Install,250);
