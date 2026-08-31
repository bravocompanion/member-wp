/* Member WP v0.10 — Arsip dokumen per WP */
const V010_VERSION='0.10.0';
const V010_API='/api/member-wp';
const V010_MAX_BYTES=20*1024*1024;
const V010_ACCEPT='.pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.xml,.zip,.doc,.docx,.xls,.xlsx';
let v010Uploading=false;

function v010Size(bytes){
  const n=Number(bytes)||0;
  if(n<1024)return `${n} B`;
  if(n<1024*1024)return `${(n/1024).toFixed(n<10*1024?1:0)} KB`;
  return `${(n/1024/1024).toFixed(1)} MB`;
}
function v010Date(value){
  const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function v010FileIcon(mime=''){
  if(mime==='application/pdf')return 'PDF';
  if(mime.startsWith('image/'))return 'IMG';
  if(mime.includes('spreadsheet')||mime.includes('excel')||mime==='text/csv')return 'XLS';
  if(mime.includes('word'))return 'DOC';
  if(mime.includes('zip'))return 'ZIP';
  return 'FILE';
}
function v010ArchiveCard(id){
  const card=document.createElement('div');card.className='card v010-archive-card';card.id='v010ArchiveCard';
  card.innerHTML=`<div class="splitHead"><div><h2>Arsip Dokumen</h2><p>Simpan file penting khusus untuk WP ini. File tersimpan private di Supabase.</p></div><span id="v010ArchiveCount" class="badge blue">Memuat...</span></div>
    <div class="v010-upload-box">
      <div class="v010-upload-top">
        <div class="field"><label>Pilih File</label><input id="v010ArchiveFiles" type="file" multiple accept="${V010_ACCEPT}"></div>
        <div class="field"><label>Kategori</label><select id="v010ArchiveCategory"><option>Pajak</option><option>SPT</option><option>Bukti Bayar</option><option>Laporan Keuangan</option><option>Legal</option><option>Surat</option><option selected>Lainnya</option></select></div>
      </div>
      <div class="v010-upload-bottom"><div class="field"><label>Catatan <small>(opsional)</small></label><input id="v010ArchiveNote" maxlength="500" placeholder="Contoh: SPT Tahunan 2025 sudah dilaporkan"></div><button id="v010UploadBtn" class="btn primary" onclick="v010UploadArchives('${esc(id)}')">Upload Arsip</button></div>
      <small class="v010-help">Maks. 20 MB per file · PDF, gambar, Word, Excel, CSV, XML, ZIP, dan TXT.</small>
      <div id="v010UploadStatus" class="v010-upload-status"></div>
    </div>
    <div id="v010ArchiveList"><div class="empty compact">Memuat arsip...</div></div>`;
  return card;
}
function v010InjectArchive(id){
  const body=document.getElementById('drawerBody');if(!body||!tp(id)||body.querySelector('#v010ArchiveCard'))return;
  const card=v010ArchiveCard(id);
  const activity=[...body.querySelectorAll('.card')].find(x=>x.querySelector('h2')?.textContent?.trim()==='Riwayat Aktivitas');
  if(activity)body.insertBefore(card,activity);else body.appendChild(card);
  v010LoadArchives(id);
}
function v010ArchiveRow(a,id){
  return `<div class="v010-archive-row" data-user-content>
    <div class="v010-file-type">${esc(v010FileIcon(a.mime_type||''))}</div>
    <div class="v010-file-main"><b>${esc(a.file_name||'File')}</b><small>${esc(a.category||'Lainnya')} · ${v010Size(a.size_bytes)} · ${v010Date(a.uploaded_at)}</small>${a.note?`<p>${esc(a.note)}</p>`:''}</div>
    <div class="v010-file-actions"><button class="btn small" onclick="v010DownloadArchive('${esc(a.id)}')">Download</button><button class="btn small danger" onclick="v010DeleteArchive('${esc(a.id)}','${esc(id)}')">Hapus</button></div>
  </div>`;
}
async function v010LoadArchives(id){
  const list=document.getElementById('v010ArchiveList'),count=document.getElementById('v010ArchiveCount');if(!list)return;
  try{
    const data=await v09Fetch(`${V010_API}?action=archives&taxpayerId=${encodeURIComponent(id)}`);
    if(currentTaxpayerId!==id||!document.getElementById('v010ArchiveList'))return;
    const rows=Array.isArray(data.archives)?data.archives:[];
    if(count)count.textContent=`${rows.length} file`;
    list.innerHTML=rows.length?rows.map(a=>v010ArchiveRow(a,id)).join(''):'<div class="empty compact">Belum ada arsip untuk WP ini.</div>';
  }catch(e){
    if(e.status===401){v09Ready=false;v09ShowLogin('Login sudah habis. Silakan login lagi.');return}
    list.innerHTML='<div class="empty compact">Arsip belum bisa dimuat. Coba buka lagi beberapa saat.</div>';if(count)count.textContent='Gagal';
  }
}
async function v010UploadArchives(id){
  if(v010Uploading)return;
  const input=document.getElementById('v010ArchiveFiles'),category=document.getElementById('v010ArchiveCategory')?.value||'Lainnya',note=document.getElementById('v010ArchiveNote')?.value?.trim()||'',status=document.getElementById('v010UploadStatus'),btn=document.getElementById('v010UploadBtn');
  const files=[...(input?.files||[])];if(!files.length)return alert('Pilih file yang mau disimpan dulu.');
  const tooLarge=files.find(f=>f.size>V010_MAX_BYTES);if(tooLarge)return alert(`${tooLarge.name} lebih dari 20 MB. Kecilkan file lalu coba lagi.`);
  v010Uploading=true;if(btn){btn.disabled=true;btn.textContent='Mengupload...'}
  let done=0;
  try{
    for(const file of files){
      if(status)status.textContent=`Upload ${done+1}/${files.length}: ${file.name}`;
      const qs=new URLSearchParams({action:'archive-upload',taxpayerId:id,name:file.name,category,note});
      try{
        await v09Fetch(`${V010_API}?${qs.toString()}`,{method:'POST',headers:{'content-type':file.type||'application/octet-stream'},body:file});
        done++;
      }catch(e){
        if(e.status===401){v09Ready=false;v09ShowLogin('Login sudah habis. Silakan login lagi.');return}
        if(e.status===413)throw new Error(`${file.name} terlalu besar.`);
        if(e.status===415)throw new Error(`${file.name} belum didukung. Gunakan PDF, gambar, Word, Excel, CSV, XML, ZIP, atau TXT.`);
        throw new Error(`Gagal upload ${file.name}.`);
      }
    }
    if(input)input.value='';const noteEl=document.getElementById('v010ArchiveNote');if(noteEl)noteEl.value='';
    if(status)status.textContent=`${done} file berhasil disimpan.`;
    await logActivity(id,'archive_upload',`${done} file ditambahkan ke Arsip Dokumen.`);
    await v010LoadArchives(id);
  }catch(e){if(status)status.textContent=e.message||'Upload gagal.';alert(e.message||'Upload arsip gagal.')}
  finally{v010Uploading=false;if(btn){btn.disabled=false;btn.textContent='Upload Arsip'}}
}
function v010DownloadArchive(id){
  const a=document.createElement('a');a.href=`${V010_API}?action=archive-download&id=${encodeURIComponent(id)}`;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
}
async function v010DeleteArchive(archiveId,taxpayerId){
  if(!confirm('Hapus file ini dari arsip? File yang sudah dihapus tidak bisa dikembalikan.'))return;
  try{
    const data=await v09Fetch(`${V010_API}?action=archive-delete`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:archiveId})});
    await logActivity(taxpayerId,'archive_delete',`Arsip dihapus: ${data.fileName||'file'}.`);await v010LoadArchives(taxpayerId);
  }catch(e){if(e.status===401){v09Ready=false;v09ShowLogin('Login sudah habis. Silakan login lagi.');return}alert('File belum bisa dihapus. Coba lagi.')}
}
function v010InstallMemberArchive(){
  const prevOpen=openTaxpayer;openTaxpayer=function(id,show=true){prevOpen(id,show);v010InjectArchive(id)};
  const prevDelete=deleteMember;deleteMember=async function(id){const before=tp(id);await prevDelete(id);if(before&&!tp(id)){try{await v09Fetch(`${V010_API}?action=archive-delete-all`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({taxpayerId:id})})}catch(e){console.warn('archive cleanup',e);alert('WP sudah dihapus, tapi arsip cloud belum berhasil dibersihkan. Coba cek database nanti.')}}};
}
function v010Start(){
  document.title='Member WP v0.10 — Arsip per WP';
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Kontrol WP v0.10';
  const loading=document.querySelector('#loading b');if(loading)loading.textContent='Member WP v0.10';
  v010InstallMemberArchive();
}
Object.assign(window,{v010LoadArchives,v010UploadArchives,v010DownloadArchive,v010DeleteArchive});
setTimeout(v010Start,260);
