/* Member WP v0.4 — Compliance Engine + Obligation Templates */
const V04_BUILTIN_TEMPLATES = [
  {id:'builtin-badan-review',name:'Badan — Review Umum',type:'BADAN',codes:['PPh21','PPh23','PPh25','SPTAnnual','Financial'],description:'Starter checklist internal. Verifikasi kewajiban aktual sebelum disimpan.',builtin:true},
  {id:'builtin-badan-pkp-review',name:'Badan PKP — Review',type:'BADAN',codes:['PPN','PPh21','PPh23','PPh25','SPTAnnual','Financial'],description:'Starter checklist untuk WP Badan yang perlu review aspek PKP. Bukan penetapan kewajiban otomatis.',builtin:true},
  {id:'builtin-op-annual',name:'OP — Tahunan',type:'OP',codes:['SPTAnnual'],description:'Starter minimal untuk review kewajiban tahunan orang pribadi.',builtin:true},
  {id:'builtin-op-business',name:'OP Usaha — Review',type:'OP',codes:['PPh25','SPTAnnual'],description:'Starter review usaha OP. Sesuaikan jika rezim pajak atau kewajibannya berbeda.',builtin:true},
  {id:'builtin-op-final',name:'OP Usaha Final — Review',type:'OP',codes:['PPhFinal','SPTAnnual'],description:'Starter review untuk kondisi yang memang menggunakan PPh Final. Wajib diverifikasi admin.',builtin:true}
];

let v04PendingTemplate = null;

function v04MetaValue(key,fallback){
  const row=state.meta.find(x=>x.key===key);
  return row?.value ?? fallback;
}
function v04CustomTemplates(){
  const rows=v04MetaValue('complianceTemplates',[]);
  return Array.isArray(rows)?rows:[];
}
function v04AllTemplates(){return [...V04_BUILTIN_TEMPLATES,...v04CustomTemplates()]}
function v04TemplateById(id){return v04AllTemplates().find(x=>x.id===id)}
function v04TemplatesForTaxpayer(x){return v04AllTemplates().filter(t=>t.type==='ALL'||t.type===x.type)}
function v04CodesEqual(a,b){return [...a].sort().join('|')===[...b].sort().join('|')}
function v04PeriodInfo(cadence,date=new Date()){
  const y=date.getFullYear(),m=date.getMonth()+1;
  if(cadence==='annual')return{key:String(y),year:y,month:null,label:String(y)};
  return{key:`${y}-${String(m).padStart(2,'0')}`,year:y,month:m,label:date.toLocaleString('id-ID',{month:'long',year:'numeric'})};
}
function v04OffsetMonth(offset){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+offset);return d}
function v04TaskPeriodLabel(t){
  if(t.periodLabel)return t.periodLabel;
  if(t.periodKey)return t.periodKey;
  return t.cadence==='annual'?String(new Date().getFullYear()):'Belum diperiodekan';
}

async function v04EnsureComplianceTask(taxpayerId,code,date=new Date()){
  const c=cat(code),period=v04PeriodInfo(c.cadence,date);
  const exact=state.tasks.find(t=>t.taxpayerId===taxpayerId&&t.kind==='compliance'&&t.code===code&&t.periodKey===period.key);
  if(exact)return'unchanged';
  const legacy=state.tasks.find(t=>t.taxpayerId===taxpayerId&&t.kind==='compliance'&&t.code===code&&!t.periodKey);
  if(legacy){
    Object.assign(legacy,{periodKey:period.key,periodYear:period.year,periodMonth:period.month,periodLabel:period.label,updatedAt:now()});
    await put('tasks',legacy);
    return'upgraded';
  }
  await put('tasks',{
    id:uid('task'),taxpayerId,title:c.label,code,kind:'compliance',cadence:c.cadence,
    status:'not_started',priority:'medium',dueDate:'',periodKey:period.key,periodYear:period.year,
    periodMonth:period.month,periodLabel:period.label,createdAt:now(),updatedAt:now()
  });
  return'created';
}

async function v04SaveProfileCodes(id,codes,source){
  const old=profile(id),template=source?.template||null;
  const adjusted=template&&!v04CodesEqual(codes,template.codes);
  await put('profiles',{
    taxpayerId:id,codes,updatedAt:now(),profileVersion:4,
    templateId:template?.id||null,
    templateName:template?(adjusted?`${template.name} (disesuaikan)`:template.name):'Manual',
    templateAdjusted:Boolean(adjusted)
  });
  let created=0,upgraded=0;
  for(const code of codes){
    const result=await v04EnsureComplianceTask(id,code,new Date());
    if(result==='created')created++;
    if(result==='upgraded')upgraded++;
  }
  await logActivity(id,'profile_update',`Profil kewajiban v0.4 disimpan: ${codes.length} aktif; ${created} task baru; ${upgraded} task lama diperiodekan. Histori task lama tidak dihapus.`);
  v04PendingTemplate=null;
  await refresh();
}

saveProfile=async function(id){
  const codes=[...document.querySelectorAll('.obl:checked')].map(x=>x.value);
  const source=v04PendingTemplate?.taxpayerId===id?{template:v04PendingTemplate.template}:null;
  await v04SaveProfileCodes(id,codes,source);
};

function v04TemplateOptions(x){
  return v04TemplatesForTaxpayer(x).map(t=>`<option value="${esc(t.id)}">${esc(t.name)}${t.builtin?' · bawaan':' · custom'}</option>`).join('');
}
function v04InjectTemplateCard(id){
  const x=tp(id);if(!x)return;
  const body=document.getElementById('drawerBody'),hero=body?.querySelector('.hero');if(!body||!hero)return;
  const p=profile(id),source=p.templateName||'Manual / belum ditetapkan';
  hero.insertAdjacentHTML('afterend',`<div class="card v04-template-card"><div class="splitHead"><div><h2>Template Kewajiban</h2><p>Template hanya mengisi checklist untuk direview. Admin tetap harus menekan Simpan Profil.</p></div>${badge('v0.4','blue')}</div><div class="v04-template-actions"><select id="v04TemplateSelect">${v04TemplateOptions(x)}</select><button class="btn" onclick="v04LoadTemplateIntoChecklist('${id}')">Masukkan ke Checklist</button><button class="btn" onclick="openTemplateManager()">Kelola Template</button></div><small class="v04-source">Sumber profil saat ini: <b>${esc(source)}</b></small></div>`);
}
const v04OriginalOpenTaxpayer=openTaxpayer;
openTaxpayer=function(id,show=true){v04OriginalOpenTaxpayer(id,show);v04InjectTemplateCard(id)};

function v04LoadTemplateIntoChecklist(id){
  const select=document.getElementById('v04TemplateSelect'),template=v04TemplateById(select?.value);
  if(!template)return;
  const chosen=new Set(template.codes);
  document.querySelectorAll('.obl').forEach(input=>{
    input.checked=chosen.has(input.value);
    input.closest('.choice')?.classList.toggle('on',input.checked);
  });
  v04PendingTemplate={taxpayerId:id,template};
  alert(`Template “${template.name}” dimasukkan ke checklist. Tinjau dan sesuaikan bila perlu, lalu klik Simpan Profil.`);
}

function v04TemplateCard(t){
  const labels=t.codes.map(code=>cat(code).label).join(', ')||'Tanpa kewajiban';
  return `<div class="templateCard"><div class="splitHead"><div><h3>${esc(t.name)}</h3><small>${esc(t.type==='ALL'?'Semua jenis WP':t.type)}</small></div>${badge(t.builtin?'Bawaan':'Custom',t.builtin?'blue':'ok')}</div><p>${esc(t.description||'Template operasional.')}</p><div class="templateCodes">${esc(labels)}</div>${t.builtin?'':`<div class="actions"><button class="btn small" onclick="openTemplateForm('${t.id}')">Edit</button><button class="btn small danger" onclick="deleteCustomTemplate('${t.id}')">Hapus</button></div>`}</div>`;
}
function v04TemplatesView(){
  const all=v04AllTemplates(),custom=v04CustomTemplates(),configured=state.profiles.filter(p=>p.codes?.length).length,templated=state.profiles.filter(p=>p.templateId).length;
  return `<div class="stats v04-stats"><div class="stat"><label>Template Tersedia</label><b>${all.length}</b><small>${custom.length} custom</small></div><div class="stat"><label>Profil Dikonfigurasi</label><b>${configured}</b><small>dari ${state.taxpayers.length} WP</small></div><div class="stat"><label>Menggunakan Template</label><b>${templated}</b><small>profil dengan sumber template</small></div></div><div class="card"><div class="splitHead"><div><h2>Template Kewajiban</h2><p>Template adalah starter operasional, bukan penetapan kewajiban pajak.</p></div><button class="btn primary" onclick="openTemplateForm()">+ Template Custom</button></div><div class="templateGrid">${all.map(v04TemplateCard).join('')}</div></div>`;
}

function openTemplateManager(){closeDrawer();go('templates')}
function openTemplateForm(id=''){
  const existing=v04CustomTemplates().find(x=>x.id===id)||{id:'',name:'',type:'ALL',codes:[],description:''};
  modal(id?'Edit Template Custom':'Tambah Template Custom',`<div class="field"><label>Nama Template</label><input id="tplName" value="${esc(existing.name)}" placeholder="Contoh: Badan Jasa — Internal"></div><div class="formgrid"><div class="field"><label>Jenis WP</label><select id="tplType"><option value="ALL" ${existing.type==='ALL'?'selected':''}>Semua</option><option value="BADAN" ${existing.type==='BADAN'?'selected':''}>BADAN</option><option value="OP" ${existing.type==='OP'?'selected':''}>OP</option></select></div><div class="field"><label>Keterangan</label><input id="tplDesc" value="${esc(existing.description||'')}" placeholder="Tujuan template internal"></div></div><div class="field"><label>Kewajiban yang ditawarkan</label><div class="choices">${catalog.map(c=>`<label class="choice ${existing.codes.includes(c[0])?'on':''}"><input class="tplObl" type="checkbox" value="${c[0]}" ${existing.codes.includes(c[0])?'checked':''}><span><b>${esc(c[1])}</b><small>${c[2]==='monthly'?'Bulanan':'Tahunan'}</small></span></label>`).join('')}</div></div><div class="notice compact">Template hanya membantu admin mengisi checklist. Kewajiban aktual tetap harus diverifikasi per WP.</div>`,`<button class="btn primary" onclick="saveCustomTemplate('${id}')">Simpan Template</button>`);
}
async function saveCustomTemplate(id=''){
  const name=document.getElementById('tplName').value.trim();if(!name)return alert('Nama template wajib diisi.');
  const codes=[...document.querySelectorAll('.tplObl:checked')].map(x=>x.value),rows=v04CustomTemplates().slice();
  const item={id:id||uid('tpl'),name,type:document.getElementById('tplType').value,codes,description:document.getElementById('tplDesc').value.trim(),builtin:false,updatedAt:now()};
  const idx=rows.findIndex(x=>x.id===id);if(idx>=0)rows[idx]=item;else rows.push(item);
  await put('meta',{key:'complianceTemplates',value:rows,updatedAt:now()});
  await logActivity(null,id?'template_edit':'template_create',`${id?'Template diperbarui':'Template dibuat'}: ${name}.`,'System');
  closeModal();await refresh();go('templates');
}
async function deleteCustomTemplate(id){
  const rows=v04CustomTemplates(),item=rows.find(x=>x.id===id);if(!item||!confirm(`Hapus template ${item.name}? Profil WP yang pernah memakai template ini tidak akan dihapus.`))return;
  await put('meta',{key:'complianceTemplates',value:rows.filter(x=>x.id!==id),updatedAt:now()});
  await logActivity(null,'template_delete',`Template dihapus: ${item.name}.`,'System');await refresh();go('templates');
}

async function v04GenerateAll(offsetMonths=0){
  const date=v04OffsetMonth(offsetMonths),label=date.toLocaleString('id-ID',{month:'long',year:'numeric'});
  let created=0,upgraded=0,skipped=0,profiles=0;
  for(const x of state.taxpayers.filter(t=>t.status!=='inactive')){
    const p=profile(x.id);if(!p.codes?.length)continue;profiles++;
    for(const code of p.codes){const result=await v04EnsureComplianceTask(x.id,code,date);if(result==='created')created++;else if(result==='upgraded')upgraded++;else skipped++;}
  }
  await logActivity(null,'compliance_generate',`Engine ${label}: ${profiles} profil diproses; ${created} task dibuat; ${upgraded} task lama diperiodekan; ${skipped} sudah ada.`,'System');
  await refresh();
  alert(`Compliance Engine ${label}\n${created} task baru\n${upgraded} task lama diperiodekan\n${skipped} dilewati karena sudah ada.`);
}
function v04EngineCard(){
  const profiles=state.profiles.filter(p=>p.codes?.length).length,current=v04PeriodInfo('monthly',new Date()),next=v04PeriodInfo('monthly',v04OffsetMonth(1));
  return `<div class="card engineCard"><div class="splitHead"><div><h2>Compliance Engine</h2><p>Membuat task per periode dari profil kewajiban yang sudah dikonfirmasi, tanpa duplikasi.</p></div>${badge(`${profiles} profil`,'blue')}</div><div class="engineActions"><button class="btn primary" onclick="v04GenerateAll(0)">Generate ${esc(current.label)}</button><button class="btn" onclick="v04GenerateAll(1)">Siapkan ${esc(next.label)}</button><button class="btn" onclick="go('templates')">Kelola Template</button></div><div class="notice compact">Deadline tidak diisi otomatis agar aplikasi tidak mengasumsikan tanggal hukum. Deadline internal tetap ditentukan admin pada task.</div></div>`;
}

const v04OriginalCompliance=compliance;
compliance=function(){return v04EngineCard()+v04OriginalCompliance()};

const v04OriginalTaskRow=taskRow;
taskRow=function(t){
  const html=v04OriginalTaskRow(t);
  if(t.kind!=='compliance')return html;
  return html.replace('<div class="taskMeta">',`<div class="taskMeta">${badge(v04TaskPeriodLabel(t),'blue')}`);
};

const v04OriginalRenderAll=renderAll;
renderAll=function(){
  v04OriginalRenderAll();
  const view=document.getElementById('templates');if(view)view.innerHTML=v04TemplatesView();
};
const v04OriginalGo=go;
go=function(id){
  if(id!=='templates')return v04OriginalGo(id);
  document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='templates'));
  document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='templates'));
  document.getElementById('title').textContent='Template Kewajiban';
  document.getElementById('subtitle').textContent='Starter profil kewajiban yang tetap harus direview admin';
  renderAll();
};

function v04SetupUi(){
  const nav=document.getElementById('nav');
  if(nav&&!nav.querySelector('[data-view="templates"]')){
    const btn=document.createElement('button');btn.dataset.view='templates';btn.innerHTML='<span>Template</span>';
    const complianceBtn=nav.querySelector('[data-view="compliance"]');complianceBtn?.after(btn);
  }
  const content=document.querySelector('.content');
  if(content&&!document.getElementById('templates')){
    const section=document.createElement('section');section.id='templates';section.className='view';
    const complianceView=document.getElementById('compliance');complianceView?.after(section);
  }
  document.title='Member WP v0.4 — Compliance Control Center';
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Admin Control Center v0.4';
  const load=document.querySelector('#loading b');if(load)load.textContent='Member WP v0.4';
}

v04SetupUi();
setTimeout(()=>{v04SetupUi();try{renderAll()}catch{}},0);
