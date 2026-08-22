/* Member WP v0.5 — Today Dashboard + Deadline Center + Reminder */
let v05DeadlineFilter='all';

function v05LocalDate(date=new Date()){
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function v05DayDiff(dateString){
  if(!dateString)return null;
  const [y,m,d]=dateString.split('-').map(Number),target=new Date(y,m-1,d),base=new Date();
  base.setHours(0,0,0,0);target.setHours(0,0,0,0);
  return Math.round((target-base)/86400000);
}
function v05OpenTasks(){return state.tasks.filter(isOpen)}
function v05IsSnoozed(t){return Boolean(t.reminderSnoozedUntil&&t.reminderSnoozedUntil>v05LocalDate())}
function v05TaskUrgency(t){
  const diff=v05DayDiff(t.dueDate);
  if(diff!==null&&diff<0)return 0;
  if(diff===0)return 1;
  if(t.priority==='high')return 2;
  if(diff!==null&&diff<=7)return 3;
  if(['blocked','waiting_documents','waiting_client'].includes(t.status))return 4;
  if(diff!==null&&diff<=14)return 5;
  if(diff!==null&&diff<=30)return 6;
  if(!t.dueDate)return 8;
  return 7;
}
function v05FocusTasks(){
  return v05OpenTasks().filter(t=>!v05IsSnoozed(t)).slice().sort((a,b)=>{
    const u=v05TaskUrgency(a)-v05TaskUrgency(b);if(u)return u;
    return String(a.dueDate||'9999-99-99').localeCompare(String(b.dueDate||'9999-99-99'));
  });
}
function v05DeadlineStats(){
  const open=v05OpenTasks(),diff=t=>v05DayDiff(t.dueDate);
  return {
    overdue:open.filter(t=>diff(t)!==null&&diff(t)<0).length,
    today:open.filter(t=>diff(t)===0).length,
    d7:open.filter(t=>diff(t)!==null&&diff(t)>0&&diff(t)<=7).length,
    d14:open.filter(t=>diff(t)!==null&&diff(t)>7&&diff(t)<=14).length,
    d30:open.filter(t=>diff(t)!==null&&diff(t)>14&&diff(t)<=30).length,
    noDate:open.filter(t=>!t.dueDate).length,
    snoozed:open.filter(v05IsSnoozed).length,
    open:open.length
  };
}
function v05DueLabel(t){
  if(!t.dueDate)return badge('Tanpa deadline');
  const diff=v05DayDiff(t.dueDate);
  if(diff<0)return badge(`${Math.abs(diff)} hari overdue`,'danger');
  if(diff===0)return badge('Hari ini','warn');
  if(diff===1)return badge('Besok','warn');
  if(diff<=7)return badge(`${diff} hari`,'blue');
  return badge(t.dueDate);
}
function v05TaskContext(t){
  const member=tp(t.taxpayerId)?.name||'WP';
  const period=t.kind==='compliance'&&typeof v04TaskPeriodLabel==='function'?v04TaskPeriodLabel(t):'';
  return `${member}${period?` · ${period}`:''}`;
}
function v05FocusRow(t){
  return `<div class="v05-focus-row urgency-${v05TaskUrgency(t)}"><div class="v05-focus-main"><div><b>${esc(t.title)}</b><small>${esc(v05TaskContext(t))}</small></div><div class="v05-badges">${v05DueLabel(t)} ${badge(priorityLabel[t.priority]||'Sedang',t.priority==='high'?'danger':t.priority==='medium'?'warn':'')}</div></div><div class="v05-focus-actions"><button class="btn small" onclick="openTaxpayer('${t.taxpayerId}')">Buka WP</button>${t.status!=='in_progress'?`<button class="btn small" onclick="v05StartTask('${t.id}')">Mulai</button>`:''}<button class="btn small primary" onclick="v05CompleteTask('${t.id}')">Selesai</button><button class="btn small" onclick="v05SnoozeTask('${t.id}',1)">Snooze 1 hari</button></div></div>`;
}
function v05TodayPanel(){
  const s=v05DeadlineStats(),focus=v05FocusTasks().slice(0,12);
  const reminderCount=s.overdue+s.today+s.d7;
  return `<div class="v05-today"><div class="v05-today-head"><div><h2>Today Dashboard</h2><p>${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · fokus pada pekerjaan yang paling mendesak.</p></div><button class="btn primary" onclick="go('deadlines')">Buka Deadline Center</button></div><div class="v05-kpis"><button onclick="v05OpenDeadlineFilter('overdue')"><span>Overdue</span><b>${s.overdue}</b></button><button onclick="v05OpenDeadlineFilter('today')"><span>Hari Ini</span><b>${s.today}</b></button><button onclick="v05OpenDeadlineFilter('7')"><span>≤ 7 Hari</span><b>${s.d7}</b></button><button onclick="v05OpenDeadlineFilter('14')"><span>8–14 Hari</span><b>${s.d14}</b></button><button onclick="v05OpenDeadlineFilter('30')"><span>15–30 Hari</span><b>${s.d30}</b></button><button onclick="v05OpenDeadlineFilter('nodate')"><span>Tanpa Deadline</span><b>${s.noDate}</b></button></div>${reminderCount?`<div class="v05-reminder-strip"><b>${reminderCount} item perlu dipantau dalam 7 hari.</b><span>Snooze hanya menunda reminder internal dan tidak mengubah deadline task.</span></div>`:'<div class="v05-reminder-strip ok"><b>Tidak ada deadline mendesak dalam 7 hari.</b><span>Tetap periksa task tanpa deadline dan Attention Center.</span></div>'}<div class="card v05-focus-card"><div class="splitHead"><div><h2>Focus Queue</h2><p>Urutan: overdue → hari ini → prioritas tinggi → 7 hari → kendala/waiting.</p></div>${badge(`${focus.length} ditampilkan`,'blue')}</div>${focus.map(v05FocusRow).join('')||'<div class="empty">Belum ada task aktif untuk dikerjakan.</div>'}</div></div>`;
}

const v05OriginalDashboard=dashboard;
dashboard=function(){return v05TodayPanel()+`<div class="v05-overview-label">Ringkasan Operasional</div>`+v05OriginalDashboard()};

function v05TaskMatchesFilter(t,filter){
  if(!isOpen(t))return false;
  const diff=v05DayDiff(t.dueDate);
  if(filter==='overdue')return diff!==null&&diff<0;
  if(filter==='today')return diff===0;
  if(filter==='7')return diff!==null&&diff>0&&diff<=7;
  if(filter==='14')return diff!==null&&diff>7&&diff<=14;
  if(filter==='30')return diff!==null&&diff>14&&diff<=30;
  if(filter==='nodate')return !t.dueDate;
  if(filter==='snoozed')return v05IsSnoozed(t);
  return true;
}
function v05DeadlineRows(){
  const q=(document.getElementById('v05Search')?.value||'').toLowerCase(),priority=document.getElementById('v05Priority')?.value||'ALL',status=document.getElementById('v05Status')?.value||'ALL';
  return state.tasks.filter(t=>v05TaskMatchesFilter(t,v05DeadlineFilter)).filter(t=>priority==='ALL'||t.priority===priority).filter(t=>status==='ALL'||t.status===status).filter(t=>{
    const x=tp(t.taxpayerId);return !q||`${t.title} ${x?.name||''} ${x?.pic||''} ${t.dueDate||''}`.toLowerCase().includes(q);
  }).sort((a,b)=>v05TaskUrgency(a)-v05TaskUrgency(b)||String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999')));
}
function v05FilterButton(key,label,count){return `<button class="v05-filter ${v05DeadlineFilter===key?'active':''}" onclick="v05SetDeadlineFilter('${key}')"><span>${label}</span><b>${count}</b></button>`}
function v05DeadlinesView(){
  const s=v05DeadlineStats();
  return `<div class="v05-deadline-summary">${v05FilterButton('all','Semua Aktif',s.open)}${v05FilterButton('overdue','Overdue',s.overdue)}${v05FilterButton('today','Hari Ini',s.today)}${v05FilterButton('7','≤ 7 Hari',s.d7)}${v05FilterButton('14','8–14 Hari',s.d14)}${v05FilterButton('30','15–30 Hari',s.d30)}${v05FilterButton('nodate','Tanpa Deadline',s.noDate)}${v05FilterButton('snoozed','Snoozed',s.snoozed)}</div><div class="tablebox"><div class="toolbar"><input id="v05Search" placeholder="Cari task / WP / PIC / tanggal" oninput="v05RenderDeadlineTable()"><select id="v05Priority" onchange="v05RenderDeadlineTable()"><option value="ALL">Semua prioritas</option><option value="high">Tinggi</option><option value="medium">Sedang</option><option value="low">Rendah</option></select><select id="v05Status" onchange="v05RenderDeadlineTable()"><option value="ALL">Semua status</option>${Object.entries(statusLabel).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><button class="btn" onclick="v05EnableBrowserReminder()">Aktifkan Reminder Browser</button></div><div id="v05DeadlineTable"></div></div><div class="grid equal v05-bottom-grid"><div class="card"><h2>Aturan Reminder</h2><p>Reminder browser hanya berjalan ketika Member WP sedang terbuka. Tidak ada server/background scheduler.</p><div class="row"><div><b>Snooze</b><small>Menunda reminder internal saja. Deadline task tidak berubah.</small></div>${badge('Aman','ok')}</div><div class="row"><div><b>Deadline kosong</b><small>Masuk daftar khusus agar admin dapat melengkapinya.</small></div>${badge(`${s.noDate} task`,'warn')}</div></div><div class="card"><h2>Quick Actions</h2><p>Gunakan tombol pada tabel untuk mulai, selesai, atau snooze tanpa membuka detail WP.</p><div class="notice compact">Untuk perubahan tanggal jatuh tempo, edit field deadline pada detail WP. v0.5 tidak menggeser deadline otomatis.</div></div></div>`;
}
function v05RenderDeadlineTable(){
  const el=document.getElementById('v05DeadlineTable');if(!el)return;const rows=v05DeadlineRows();
  el.innerHTML=`<div class="result">${rows.length} task sesuai filter</div><div class="v05-table-scroll"><table><thead><tr><th>WP</th><th>Task</th><th>Deadline</th><th>Prioritas</th><th>Status</th><th>Reminder</th><th>Aksi</th></tr></thead><tbody>${rows.map(t=>`<tr class="${v05DayDiff(t.dueDate)<0?'v05-overdue-row':''}"><td class="name">${esc(tp(t.taxpayerId)?.name||'WP')}<small class="v05-cell-sub">${esc(tp(t.taxpayerId)?.pic||'PIC —')}</small></td><td>${esc(t.title)}<small class="v05-cell-sub">${esc(t.kind==='compliance'?(typeof v04TaskPeriodLabel==='function'?v04TaskPeriodLabel(t):'Compliance'):'Manual')}</small></td><td>${esc(t.dueDate||'—')}<div>${v05DueLabel(t)}</div></td><td>${badge(priorityLabel[t.priority]||'Sedang',t.priority==='high'?'danger':t.priority==='medium'?'warn':'')}</td><td>${badge(statusLabel[t.status]||t.status,t.status==='blocked'?'danger':t.status==='in_progress'?'blue':['waiting_documents','waiting_client','waiting_review'].includes(t.status)?'warn':'')}</td><td>${v05IsSnoozed(t)?badge(`Sampai ${t.reminderSnoozedUntil}`,'blue'):badge('Aktif','ok')}</td><td><div class="v05-row-actions"><button class="linkbtn" onclick="openTaxpayer('${t.taxpayerId}')">Buka</button>${t.status!=='in_progress'?`<button class="linkbtn" onclick="v05StartTask('${t.id}')">Mulai</button>`:''}<button class="linkbtn" onclick="v05CompleteTask('${t.id}')">Selesai</button><button class="linkbtn" onclick="v05SnoozeTask('${t.id}',1)">+1d</button>${v05IsSnoozed(t)?`<button class="linkbtn" onclick="v05ClearSnooze('${t.id}')">Unsnooze</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
}
function v05SetDeadlineFilter(filter){v05DeadlineFilter=filter;const view=document.getElementById('deadlines');if(view)view.innerHTML=v05DeadlinesView();v05RenderDeadlineTable()}
function v05OpenDeadlineFilter(filter){v05DeadlineFilter=filter;go('deadlines')}

async function v05StartTask(id){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;t.status='in_progress';t.reminderSnoozedUntil='';t.updatedAt=now();await put('tasks',t);await logActivity(t.taxpayerId,'task_start',`Task dimulai: ${t.title}.`);await refresh();if(document.getElementById('deadlines')?.classList.contains('active'))v05RenderDeadlineTable();
}
async function v05CompleteTask(id){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;t.status='completed';t.reminderSnoozedUntil='';t.completedAt=now();t.updatedAt=now();await put('tasks',t);await logActivity(t.taxpayerId,'task_complete',`Task selesai: ${t.title}.`);await refresh();if(document.getElementById('deadlines')?.classList.contains('active'))v05RenderDeadlineTable();
}
async function v05SnoozeTask(id,days){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;const d=new Date();d.setDate(d.getDate()+days);t.reminderSnoozedUntil=v05LocalDate(d);t.updatedAt=now();await put('tasks',t);await logActivity(t.taxpayerId,'reminder_snooze',`Reminder “${t.title}” ditunda ${days} hari tanpa mengubah deadline ${t.dueDate||'kosong'}.`);await refresh();if(document.getElementById('deadlines')?.classList.contains('active'))v05RenderDeadlineTable();
}
async function v05ClearSnooze(id){
  const t=state.tasks.find(x=>x.id===id);if(!t)return;t.reminderSnoozedUntil='';t.updatedAt=now();await put('tasks',t);await logActivity(t.taxpayerId,'reminder_unsnooze',`Reminder diaktifkan kembali: ${t.title}.`);await refresh();if(document.getElementById('deadlines')?.classList.contains('active'))v05RenderDeadlineTable();
}

function v05ReminderPrefs(){return v04MetaValue('v05ReminderPrefs',{enabled:false,lastNotified:''})}
async function v05EnableBrowserReminder(){
  if(!('Notification' in window))return alert('Browser ini tidak mendukung Notification API.');
  const permission=await Notification.requestPermission();
  const prefs={...v05ReminderPrefs(),enabled:permission==='granted'};await put('meta',{key:'v05ReminderPrefs',value:prefs,updatedAt:now()});await loadState();
  if(permission==='granted'){alert('Reminder browser aktif saat Member WP sedang terbuka.');v05MaybeNotify(true)}else alert('Izin notifikasi tidak diberikan. Reminder in-app tetap aktif.');
}
async function v05MaybeNotify(force=false){
  try{
    const prefs=v05ReminderPrefs();if(!prefs.enabled||Notification.permission!=='granted')return;
    const date=v05LocalDate();if(!force&&prefs.lastNotified===date)return;
    const s=v05DeadlineStats(),count=s.overdue+s.today+s.d7;if(!count)return;
    new Notification('Member WP — Deadline Reminder',{body:`${s.overdue} overdue · ${s.today} due hari ini · ${s.d7} jatuh tempo ≤7 hari.`});
    await put('meta',{key:'v05ReminderPrefs',value:{...prefs,lastNotified:date},updatedAt:now()});
  }catch(e){console.warn('Reminder browser gagal',e)}
}

const v05OriginalRenderAll=renderAll;
renderAll=function(){
  v05OriginalRenderAll();
  const view=document.getElementById('deadlines');if(view){view.innerHTML=v05DeadlinesView();if(view.classList.contains('active'))v05RenderDeadlineTable()}
};
const v05OriginalGo=go;
go=function(id){
  if(id==='deadlines'){
    document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='deadlines'));
    document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='deadlines'));
    document.getElementById('title').textContent='Deadline Center';document.getElementById('subtitle').textContent='Overdue, hari ini, 7/14/30 hari dan reminder operasional';renderAll();v05RenderDeadlineTable();return;
  }
  v05OriginalGo(id);
  if(id==='dashboard'){document.getElementById('title').textContent='Today Dashboard';document.getElementById('subtitle').textContent='Apa yang perlu dikerjakan hari ini dan apa yang segera jatuh tempo';}
};

function v05SetupUi(){
  const nav=document.getElementById('nav');
  if(nav&&!nav.querySelector('[data-view="deadlines"]')){
    const btn=document.createElement('button');btn.dataset.view='deadlines';btn.innerHTML='<span>Deadline Center</span>';
    nav.querySelector('[data-view="dashboard"]')?.after(btn);
  }
  const content=document.querySelector('.content');
  if(content&&!document.getElementById('deadlines')){
    const section=document.createElement('section');section.id='deadlines';section.className='view';
    document.getElementById('dashboard')?.after(section);
  }
  const dash=nav?.querySelector('[data-view="dashboard"] span');if(dash)dash.textContent='Today';
  document.title='Member WP v0.5 — Today & Deadline Control';
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Admin Control Center v0.5';
  const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.5';
}

Object.assign(window,{v05SetDeadlineFilter,v05OpenDeadlineFilter,v05RenderDeadlineTable,v05StartTask,v05CompleteTask,v05SnoozeTask,v05ClearSnooze,v05EnableBrowserReminder});
v05SetupUi();
setTimeout(()=>{v05SetupUi();try{renderAll();v05MaybeNotify()}catch(e){console.warn('v0.5 setup',e)}},0);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')v05MaybeNotify()});
