/* Member WP v0.10.1 — Data Login saat tambah/edit WP */
const V0101_VERSION='0.10.1';
const V0101_API='/api/member-wp';
const V0101_FIELDS=['loginUsername','loginPassword','coretaxKey','coretaxPassphrase','efin','djpKey'];
const v0101LoadedCredential=new Map();
let v0101Saving=false;

function v0101SecretValue(data,key){return String(data?.[key]??'')}
function v0101KnownFields(data){return V0101_FIELDS.some(key=>Object.prototype.hasOwnProperty.call(data||{},key))}
function v0101ToggleSecrets(show){
  ['mLoginPassword','mCoretaxPassphrase'].forEach(id=>{const el=document.getElementById(id);if(el)el.type=show?'text':'password'});
}
function v0101LoginForm(data={}){
  const hasKnown=v0101KnownFields(data);
  const otherCount=Object.keys(data||{}).filter(k=>!V0101_FIELDS.includes(k)&&!['sourceSheet','sourceRow','taxpayerId'].includes(k)).length;
  return `<div class="v0101-login-block">
    <div class="splitHead"><div><h3>Data Login</h3><p>Opsional. Isi sekarang kalau data login WP sudah ada.</p></div>${hasKnown?badge('Tersimpan','ok'):badge('Opsional')}</div>
    <div class="formgrid">
      <div class="field"><label>Username / Email Login</label><input id="mLoginUsername" value="${esc(v0101SecretValue(data,'loginUsername'))}" autocomplete="off" placeholder="Username atau email"></div>
      <div class="field"><label>Password Login</label><input id="mLoginPassword" type="password" value="${esc(v0101SecretValue(data,'loginPassword'))}" autocomplete="new-password" placeholder="Password"></div>
      <div class="field"><label>Coretax Key</label><input id="mCoretaxKey" value="${esc(v0101SecretValue(data,'coretaxKey'))}" autocomplete="off" placeholder="Kosongkan kalau belum ada"></div>
      <div class="field"><label>Coretax Passphrase</label><input id="mCoretaxPassphrase" type="password" value="${esc(v0101SecretValue(data,'coretaxPassphrase'))}" autocomplete="new-password" placeholder="Kosongkan kalau belum ada"></div>
      <div class="field"><label>EFIN</label><input id="mEfin" value="${esc(v0101SecretValue(data,'efin'))}" autocomplete="off" placeholder="Kosongkan kalau belum ada"></div>
      <div class="field"><label>Key DJP</label><input id="mDjpKey" value="${esc(v0101SecretValue(data,'djpKey'))}" autocomplete="off" placeholder="Kosongkan kalau belum ada"></div>
    </div>
    <label class="v0101-show-secret"><input type="checkbox" onchange="v0101ToggleSecrets(this.checked)"> Tampilkan password saat mengisi</label>
    <input id="mHadLoginFields" type="hidden" value="${hasKnown?'1':'0'}">
    <div class="v051-help">Data Login disimpan di database private Supabase dan tidak dimasukkan ke activity log. ${otherCount?`${otherCount} data login lain yang sudah tersimpan tetap dipertahankan.`:''}</div>
    <div id="v0101SaveStatus" class="v0101-save-status"></div>
  </div>`;
}
async function v0101LoadCredentialForForm(id){
  if(!id||!v09CredentialIds?.has(id))return {};
  try{
    const data=await v09Credential(id)||{};
    v0101LoadedCredential.set(id,{...data});
    return data;
  }catch(e){
    if(e.status===401){v09Ready=false;v09ShowLogin('Login sudah habis. Silakan login lagi.');throw e}
    return {};
  }
}
async function v0101OpenMemberForm(id=''){
  const memberId=id||uid('wp'),isNew=!id;
  const x=id?tp(id):{name:'',type:'BADAN',npwp:'',phone:'',email:'',pic:'',status:'active'};
  if(!x)return;
  let credential={};
  if(id&&v09CredentialIds?.has(id)){
    modal('Edit WP','<div class="empty compact">Memuat Data Login...</div>');
    try{credential=await v0101LoadCredentialForForm(id)}catch{return}
  }
  modal(isNew?'Tambah WP':'Edit WP',`<p>${isNew?'Tambah WP baru dan isi Data Login kalau sudah tersedia.':'Ubah data WP dan Data Login.'}</p>
    <div class="formgrid">
      <div class="field"><label>Nama</label><input id="mName" value="${esc(x.name||'')}"></div>
      <div class="field"><label>Jenis WP</label><select id="mType"><option value="BADAN" ${x.type==='BADAN'?'selected':''}>BADAN</option><option value="OP" ${x.type==='OP'?'selected':''}>OP</option></select></div>
      <div class="field"><label>NPWP</label><input id="mNpwp" value="${esc(x.npwp||'')}" placeholder="NPWP"></div>
      <div class="field"><label>PIC</label><input id="mPic" value="${esc(x.pic||'')}" placeholder="Nama PIC"></div>
      <div class="field"><label>Telepon</label><input id="mPhone" value="${esc(x.phone||'')}" placeholder="Nomor telepon"></div>
      <div class="field"><label>Email</label><input id="mEmail" value="${esc(x.email||'')}" placeholder="Email operasional"></div>
      <div class="field"><label>Status</label><select id="mStatus"><option value="active" ${x.status==='active'?'selected':''}>Aktif</option><option value="attention" ${x.status==='attention'?'selected':''}>Perlu Dicek</option><option value="inactive" ${x.status==='inactive'?'selected':''}>Nonaktif</option></select></div>
    </div>
    ${v0101LoginForm(credential)}`,
    `<button id="v0101SaveBtn" class="btn primary" onclick="v0101SaveMember('${memberId}',${isNew?'true':'false'})">Simpan WP</button>`);
}
function v0101PatchFromForm(){
  return {
    loginUsername:document.getElementById('mLoginUsername')?.value||'',
    loginPassword:document.getElementById('mLoginPassword')?.value||'',
    coretaxKey:document.getElementById('mCoretaxKey')?.value||'',
    coretaxPassphrase:document.getElementById('mCoretaxPassphrase')?.value||'',
    efin:document.getElementById('mEfin')?.value||'',
    djpKey:document.getElementById('mDjpKey')?.value||''
  };
}
async function v0101SaveCredential(taxpayerId,patch){
  const hadKnown=document.getElementById('mHadLoginFields')?.value==='1';
  const hasNow=Object.values(patch).some(v=>String(v).trim()!=='');
  if(!hasNow&&!hadKnown)return {saved:false,hasCredential:v09CredentialIds.has(taxpayerId)};
  const knownBefore=v09CredentialIds.has(taxpayerId);
  const data=await v09Fetch(`${V0101_API}?action=credential-upsert`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taxpayerId,patch})});
  if(data.hasCredential){
    v09CredentialIds.add(taxpayerId);
    const previous=v0101LoadedCredential.get(taxpayerId)||v09CredentialCache.get(taxpayerId)||{};
    const merged={...previous,...patch};v0101LoadedCredential.set(taxpayerId,merged);v09CredentialCache.set(taxpayerId,merged);
    if(!knownBefore)v09RemoteCounts.credentials=(Number(v09RemoteCounts.credentials)||0)+1;
  }else{
    v09CredentialIds.delete(taxpayerId);v09CredentialCache.delete(taxpayerId);v0101LoadedCredential.delete(taxpayerId);
    if(knownBefore)v09RemoteCounts.credentials=Math.max(0,(Number(v09RemoteCounts.credentials)||1)-1);
  }
  return {saved:true,hasCredential:Boolean(data.hasCredential)};
}
async function v0101SaveMember(memberId,isNew){
  if(v0101Saving)return;
  const name=document.getElementById('mName')?.value.trim()||'';if(!name)return alert('Nama WP wajib diisi.');
  const old=tp(memberId)||null,patch=v0101PatchFromForm();
  const x={id:memberId,name,type:document.getElementById('mType').value,npwp:document.getElementById('mNpwp').value.trim(),pic:document.getElementById('mPic').value.trim(),phone:document.getElementById('mPhone').value.trim(),email:document.getElementById('mEmail').value.trim(),status:document.getElementById('mStatus').value,createdAt:old?.createdAt||now(),updatedAt:now()};
  const btn=document.getElementById('v0101SaveBtn'),status=document.getElementById('v0101SaveStatus');v0101Saving=true;if(btn){btn.disabled=true;btn.textContent='Menyimpan...'}if(status)status.textContent='';
  try{
    await put('taxpayers',x);
    await logActivity(x.id,old?'member_edit':'member_create',old?'Data WP diperbarui.':'WP baru dibuat.',x.name);
    if(typeof v09Flush==='function'&&v09Ready){await v09Flush();if(!v09Online)throw new Error('sync_member_failed')}
    const credentialResult=await v0101SaveCredential(x.id,patch);
    if(credentialResult.saved)await logActivity(x.id,'data_login_update','Data Login diperbarui.',x.name);
    closeModal();await refresh();openTaxpayer(x.id);
  }catch(e){
    await loadState();
    if(e.status===401){v09Ready=false;v09ShowLogin('Login sudah habis. Silakan login lagi.');return}
    if(status)status.textContent='Data WP sudah disimpan, tapi Data Login belum berhasil disimpan. Klik Simpan WP lagi untuk mencoba ulang.';
    else alert('Data WP tersimpan, tetapi Data Login belum berhasil disimpan. Coba lagi.');
  }finally{v0101Saving=false;if(btn){btn.disabled=false;btn.textContent='Simpan WP'}}
}
async function v0101ViewLogin(id){
  try{
    const data=await v09Credential(id);if(!data)return alert('Belum ada Data Login untuk WP ini.');
    modal(`Data Login — ${esc(tp(id)?.name||'WP')}`,`<div data-user-content>${v06SensitiveHtml(data)}</div>`);
  }catch(e){
    if(e.status===401){v09Ready=false;v09ShowLogin('Login sudah habis. Silakan login lagi.');return}
    alert('Data Login belum bisa dibuka. Coba lagi.');
  }
}
function v0101InstallLabels(){
  if(typeof v06FieldLabel==='function'){
    const previous=v06FieldLabel;
    v06FieldLabel=function(key){return ({loginUsername:'Username / Email Login',loginPassword:'Password Login'})[key]||previous(key)};
  }
}
function v0101EnhanceMemberDetail(id){
  const body=document.getElementById('drawerBody');if(!body||currentTaxpayerId!==id)return;
  let card=document.getElementById('v0101LoginManage');if(card)card.remove();
  card=document.createElement('div');card.id='v0101LoginManage';card.className='card v0101-login-manage';
  const has=v09CredentialIds.has(id);
  card.innerHTML=`<div class="splitHead"><div><h2>Data Login</h2><p>Username, password, Coretax, EFIN, dan Key DJP untuk WP ini.</p></div>${has?badge('Tersimpan','ok'):badge('Belum ada')}</div><div class="actions"><button class="btn primary" onclick="openMemberForm('${esc(id)}')">${has?'Edit Data Login':'Tambah Data Login'}</button>${has?`<button class="btn" onclick="v0101ViewLogin('${esc(id)}')">Lihat Data Login</button>`:''}</div>`;
  const archive=document.getElementById('v010ArchiveCard'),excel=document.getElementById('v06ExcelCard');
  if(archive)body.insertBefore(card,archive);else if(excel)body.insertBefore(card,excel);else body.appendChild(card);
}
function v0101Install(){
  openMemberForm=v0101OpenMemberForm;
  v0101InstallLabels();
  const prevOpen=openTaxpayer;openTaxpayer=function(id,show=true){prevOpen(id,show);setTimeout(()=>v0101EnhanceMemberDetail(id),20)};
  const prevDelete=deleteMember;deleteMember=async function(id){
    const existed=tp(id),hadCredential=v09CredentialIds.has(id);await prevDelete(id);
    if(existed&&!tp(id)&&hadCredential){
      try{
        await v09Fetch(`${V0101_API}?action=credential-delete`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taxpayerId:id})});
        v09CredentialIds.delete(id);v09CredentialCache.delete(id);v0101LoadedCredential.delete(id);v09RemoteCounts.credentials=Math.max(0,(Number(v09RemoteCounts.credentials)||1)-1);
      }catch(e){
        if(e.status===401){v09Ready=false;v09ShowLogin('Login sudah habis. Silakan login lagi.');return}
        alert('WP sudah dihapus, tetapi Data Login cloud belum berhasil dibersihkan.');
      }
    }
  };
  document.title='Member WP v0.10.1 — Data Login WP';
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Kontrol WP v0.10.1';
  const loading=document.querySelector('#loading b');if(loading)loading.textContent='Member WP v0.10.1';
}
Object.assign(window,{v0101OpenMemberForm,v0101SaveMember,v0101ToggleSecrets,v0101ViewLogin});
setTimeout(v0101Install,330);
