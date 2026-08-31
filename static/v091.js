/* Member WP v0.9.1 — Antarmuka penuh Bahasa Indonesia */
const V091_VERSION='0.9.1';

const V091_EXACT=new Map([
  ['Today','Hari Ini'],
  ['Today Dashboard','Dasbor Hari Ini'],
  ['Task','Tugas'],
  ['Tasks','Tugas'],
  ['Deadline','Tenggat'],
  ['Deadline Center','Pusat Tenggat'],
  ['Reminder','Pengingat'],
  ['Reminder browser','Pengingat peramban'],
  ['Aktifkan Reminder Browser','Aktifkan Pengingat Peramban'],
  ['Backup','Cadangan'],
  ['Private','Pribadi'],
  ['Private Database','Basis Data Pribadi'],
  ['Database','Basis Data'],
  ['Username','Nama Pengguna'],
  ['Password','Kata Sandi'],
  ['Session','Sesi'],
  ['Control Center v0.9','Pusat Kendali v0.9.1'],
  ['Control Center v0.9.1','Pusat Kendali v0.9.1'],
  ['Member','WP'],
  ['+ Member','+ WP'],
  ['Attention','Perhatian'],
  ['Attention Center','Pusat Perhatian'],
  ['Focus Queue','Daftar Prioritas'],
  ['Quick Actions','Aksi Cepat'],
  ['Review','Tinjauan'],
  ['Client','Klien'],
  ['Compliance','Kepatuhan'],
  ['Compliance Engine','Mesin Kepatuhan'],
  ['Custom','Khusus'],
  ['Template Custom','Template Khusus'],
  ['Checklist','Daftar Periksa'],
  ['Credential','Kredensial'],
  ['Credentials','Kredensial'],
  ['Online','Daring'],
  ['Offline','Luring'],
  ['Source','Sumber'],
  ['History','Riwayat'],
  ['Reference','Referensi'],
  ['Document','Dokumen'],
  ['Issue','Kendala'],
  ['Import','Impor'],
  ['Export','Ekspor'],
  ['Reset','Atur Ulang'],
  ['Storage','Penyimpanan'],
  ['Admin','Administrator'],
  ['System','Sistem'],
  ['Browser','Peramban'],
  ['Email','Surel'],
  ['Due Today','Jatuh Tempo Hari Ini'],
  ['DUE TODAY','JATUH TEMPO HARI INI'],
  ['OVERDUE','LEWAT TENGGAT'],
  ['Snooze','Tunda'],
  ['Unsnooze','Aktifkan Kembali'],
  ['Manual','Manual'],
  ['Profile','Profil'],
  ['Status','Status'],
  ['Data Health','Kesehatan Data'],
  ['Audit Trail','Jejak Audit'],
  ['Activity','Aktivitas'],
  ['Activities','Aktivitas'],
  ['Loading...','Memuat...'],
  ['Error','Kesalahan'],
  ['Warning','Peringatan'],
  ['Success','Berhasil']
]);

const V091_SENTENCES=new Map([
  ['Prioritas kerja, deadline, dan follow-up','Prioritas kerja, tenggat, dan tindak lanjut'],
  ['Kontrol member, task, kewajiban dan catatan','Kontrol WP, tugas, kewajiban, dan catatan'],
  ['Task otomatis dan manual dengan deadline/prioritas','Tugas otomatis dan manual dengan tenggat/prioritas'],
  ['Overdue, kendala dan item prioritas tinggi','Lewat tenggat, kendala, dan item prioritas tinggi'],
  ['Audit trail lokal perubahan admin','Jejak audit lokal perubahan administrator'],
  ['IndexedDB, import, backup dan reset','IndexedDB, impor, cadangan, dan atur ulang'],
  ['Task compliance dan manual yang tersimpan di IndexedDB.','Tugas kepatuhan dan manual yang tersimpan di IndexedDB.'],
  ['Task compliance dan manual dengan deadline/prioritas','Tugas kepatuhan dan manual dengan tenggat/prioritas'],
  ['Prioritas yang sebaiknya ditangani lebih dulu.','Prioritas yang sebaiknya ditangani lebih dahulu.'],
  ['Task manual untuk','Tugas manual untuk'],
  ['Tambah Task Manual','Tambah Tugas Manual'],
  ['Edit Task Manual','Edit Tugas Manual'],
  ['Judul Task','Judul Tugas'],
  ['Simpan Task','Simpan Tugas'],
  ['Task Aktif','Tugas Aktif'],
  ['Due Hari Ini','Jatuh Tempo Hari Ini'],
  ['Perhatian Teratas','Perhatian Utama'],
  ['Aktivitas Terbaru','Aktivitas Terkini'],
  ['Task compliance','Tugas kepatuhan'],
  ['Task manual','Tugas manual'],
  ['Semua deadline','Semua tenggat'],
  ['Tanpa deadline','Tanpa tenggat'],
  ['Deadline kosong','Tenggat kosong'],
  ['Deadline task tidak berubah.','Tenggat tugas tidak berubah.'],
  ['Snooze hanya menunda reminder internal. Deadline task tidak berubah.','Tunda hanya menunda pengingat internal. Tenggat tugas tidak berubah.'],
  ['Snooze hanya menunda pengingat internal. Deadline task tidak berubah.','Tunda hanya menunda pengingat internal. Tenggat tugas tidak berubah.'],
  ['Reminder browser hanya berjalan ketika Member WP sedang terbuka. Tidak ada server/background scheduler.','Pengingat peramban hanya berjalan ketika Member WP sedang terbuka. Belum ada penjadwal latar belakang di server.'],
  ['Reminder browser aktif saat Member WP sedang terbuka.','Pengingat peramban aktif saat Member WP sedang terbuka.'],
  ['Izin notifikasi tidak diberikan. Reminder in-app tetap aktif.','Izin notifikasi tidak diberikan. Pengingat di dalam aplikasi tetap aktif.'],
  ['Member WP — Deadline Reminder','Member WP — Pengingat Tenggat'],
  ['Focus Queue','Daftar Prioritas'],
  ['Urutan: overdue → hari ini → prioritas tinggi → 7 hari → kendala/waiting.','Urutan: lewat tenggat → hari ini → prioritas tinggi → 7 hari → kendala/menunggu.'],
  ['Status member: Attention','Status WP: Perhatian'],
  ['Data operasional lokal.','Data operasional.'],
  ['Kondisi member.','Kondisi WP.'],
  ['Tambah, edit, nonaktifkan dan kontrol seluruh member','Tambah, edit, nonaktifkan, dan kontrol seluruh WP'],
  ['Task','Tugas'],
  ['Profil kewajiban v0.4 disimpan','Profil kewajiban disimpan'],
  ['Template hanya mengisi checklist untuk direview. Admin tetap harus menekan Simpan Profil.','Template hanya mengisi daftar periksa untuk ditinjau. Administrator tetap harus menekan Simpan Profil.'],
  ['Template adalah starter operasional, bukan penetapan kewajiban pajak.','Template adalah pola awal operasional, bukan penetapan kewajiban pajak.'],
  ['Template hanya membantu admin mengisi checklist. Kewajiban aktual tetap harus diverifikasi per WP.','Template hanya membantu administrator mengisi daftar periksa. Kewajiban aktual tetap harus diverifikasi per WP.'],
  ['Compliance Engine','Mesin Kepatuhan'],
  ['Generate','Buat'],
  ['Kelola Template','Kelola Template'],
  ['Database Pribadi','Basis Data Pribadi'],
  ['Supabase Database','Basis Data Supabase'],
  ['Database produksi dimuat setelah login. Import file manual tidak diperlukan.','Basis data produksi dimuat setelah masuk. Impor berkas manual tidak diperlukan.'],
  ['Database sudah memakai Supabase. Import manual dinonaktifkan.','Basis data sudah memakai Supabase. Impor manual dinonaktifkan.'],
  ['Database belum dapat dibuka. Periksa koneksi lalu coba lagi.','Basis data belum dapat dibuka. Periksa koneksi lalu coba lagi.'],
  ['Refresh Database','Muat Ulang Basis Data'],
  ['Database ✓','Basis Data ✓'],
  ['Credential private','Kredensial pribadi'],
  ['Data Sensitif','Data Sensitif'],
  ['Dimuat dari database private setelah login.','Dimuat dari basis data pribadi setelah masuk.'],
  ['Data sumber dari database private Supabase.','Data bersumber dari basis data pribadi Supabase.'],
  ['Mengambil data sensitif...','Mengambil data sensitif...'],
  ['Password tidak disimpan di browser atau source GitHub. Credential WP hanya diminta saat detail member dibuka.','Kata sandi tidak disimpan di peramban atau sumber GitHub. Kredensial WP hanya diminta saat detail WP dibuka.'],
  ['Session berakhir. Silakan masuk kembali.','Sesi berakhir. Silakan masuk kembali.'],
  ['Session tidak valid. Silakan masuk kembali.','Sesi tidak valid. Silakan masuk kembali.'],
  ['Session disimpan sebagai cookie HttpOnly. Password tidak disimpan di browser atau source aplikasi.','Sesi disimpan sebagai cookie HttpOnly. Kata sandi tidak disimpan di peramban atau sumber aplikasi.'],
  ['Memeriksa session...','Memeriksa sesi...'],
  ['Data & Backup','Data & Cadangan'],
  ['Template Custom','Template Khusus'],
  ['Tambah Template Custom','Tambah Template Khusus'],
  ['Edit Template Custom','Edit Template Khusus'],
  ['Starter checklist internal. Verifikasi kewajiban aktual sebelum disimpan.','Daftar periksa awal internal. Verifikasi kewajiban aktual sebelum disimpan.'],
  ['Starter minimal untuk review kewajiban tahunan orang pribadi.','Pola awal minimal untuk meninjau kewajiban tahunan orang pribadi.'],
  ['Starter review usaha OP. Sesuaikan jika rezim pajak atau kewajibannya berbeda.','Pola awal tinjauan usaha OP. Sesuaikan jika rezim pajak atau kewajibannya berbeda.'],
  ['Starter review untuk kondisi yang memang menggunakan PPh Final. Wajib diverifikasi admin.','Pola awal tinjauan untuk kondisi yang memang menggunakan PPh Final. Wajib diverifikasi administrator.'],
  ['Badan — Review Umum','Badan — Tinjauan Umum'],
  ['Badan PKP — Review','Badan PKP — Tinjauan'],
  ['OP Usaha — Review','OP Usaha — Tinjauan'],
  ['OP Usaha Final — Review','OP Usaha Final — Tinjauan']
]);

const V091_PLACEHOLDERS=new Map([
  ['Cari nama / NPWP / PIC / telepon','Cari nama / NPWP / penanggung jawab / telepon'],
  ['Cari nama, NPWP, PIC, telepon','Cari nama, NPWP, penanggung jawab, telepon'],
  ['Cari task / WP / PIC / tanggal','Cari tugas / WP / penanggung jawab / tanggal'],
  ['Cari task, WP, PIC','Cari tugas, WP, penanggung jawab'],
  ['Tulis catatan operasional...','Tulis catatan operasional...'],
  ['Contoh: Badan Jasa — Internal','Contoh: Badan Jasa — Internal']
]);

function v091TranslateText(text){
  const raw=String(text??'');
  const trimmed=raw.trim();
  if(!trimmed)return raw;
  let translated=V091_EXACT.get(trimmed)||V091_SENTENCES.get(trimmed)||trimmed;
  const replacements=[
    [/\bdeadline\b/gi,'tenggat'],
    [/\bdeadlines\b/gi,'tenggat'],
    [/\btask\b/gi,'tugas'],
    [/\btasks\b/gi,'tugas'],
    [/\breminder\b/gi,'pengingat'],
    [/\bbackup\b/gi,'cadangan'],
    [/\bfollow-up\b/gi,'tindak lanjut'],
    [/\breview\b/gi,'tinjauan'],
    [/\bclient\b/gi,'klien'],
    [/\battention\b/gi,'perhatian'],
    [/\bcompliance\b/gi,'kepatuhan'],
    [/\bcustom\b/gi,'khusus'],
    [/\bchecklist\b/gi,'daftar periksa'],
    [/\bcredential(s)?\b/gi,'kredensial'],
    [/\bdatabase\b/gi,'basis data'],
    [/\bprivate\b/gi,'pribadi'],
    [/\busername\b/gi,'nama pengguna'],
    [/\bpassword\b/gi,'kata sandi'],
    [/\bsession\b/gi,'sesi'],
    [/\boverdue\b/gi,'lewat tenggat'],
    [/\bdue today\b/gi,'jatuh tempo hari ini'],
    [/\bsnooze\b/gi,'tunda'],
    [/\bbrowser\b/gi,'peramban'],
    [/\bonline\b/gi,'daring'],
    [/\boffline\b/gi,'luring'],
    [/\bsource\b/gi,'sumber'],
    [/\bmember\b/gi,'WP'],
    [/\badmin\b/gi,'administrator']
  ];
  for(const [pattern,value] of replacements)translated=translated.replace(pattern,value);
  if(translated===trimmed)return raw;
  const lead=raw.match(/^\s*/)?.[0]||'',tail=raw.match(/\s*$/)?.[0]||'';
  return lead+translated+tail;
}

function v091ShouldSkip(node){
  const el=node?.parentElement;if(!el)return true;
  if(el.closest('script,style,pre,code,textarea,[contenteditable="true"]'))return true;
  if(el.closest('.v06-sensitive-value,.v06-secret-value,.v06-vault-value,[data-user-content]'))return true;
  return false;
}

function v091TranslateNode(root=document.body){
  if(!root)return;
  if(root.nodeType===Node.TEXT_NODE){if(!v091ShouldSkip(root))root.nodeValue=v091TranslateText(root.nodeValue);return}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE){
    const el=root;
    if(el.hasAttribute?.('placeholder')){const p=el.getAttribute('placeholder');el.setAttribute('placeholder',V091_PLACEHOLDERS.get(p)||v091TranslateText(p))}
    if(el.hasAttribute?.('title'))el.setAttribute('title',v091TranslateText(el.getAttribute('title')));
    if(el.hasAttribute?.('aria-label'))el.setAttribute('aria-label',v091TranslateText(el.getAttribute('aria-label')));
  }
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes)if(!v091ShouldSkip(node))node.nodeValue=v091TranslateText(node.nodeValue);
  root.querySelectorAll?.('[placeholder]').forEach(el=>{const p=el.getAttribute('placeholder');el.setAttribute('placeholder',V091_PLACEHOLDERS.get(p)||v091TranslateText(p))});
}

function v091InstallCoreLabels(){
  document.documentElement.lang='id';
  document.title='Member WP v0.9.1 — Masuk';
  if(typeof statusLabel==='object'){
    Object.assign(statusLabel,{not_started:'Belum Dimulai',waiting_documents:'Menunggu Dokumen',in_progress:'Dalam Proses',waiting_review:'Menunggu Tinjauan',waiting_client:'Menunggu Klien',blocked:'Kendala',completed:'Selesai',not_applicable:'Tidak Berlaku'});
  }
  if(typeof priorityLabel==='object')Object.assign(priorityLabel,{high:'Tinggi',medium:'Sedang',low:'Rendah'});
  if(typeof noteCat==='function'){
    noteCat=function(value){const map={general:'Umum',tax:'Pajak',document:'Dokumen',payment:'Pembayaran',client:'Klien',internal:'Internal',important:'Penting'};return map[value]||value};
  }
}

function v091InstallV09Ui(){
  if(typeof v09UpdateUi==='function'){
    v09UpdateUi=function(){
      const brand=document.querySelector('.brand small');if(brand)brand.textContent='Pusat Kendali v0.9.1';
      const foot=document.querySelector('.sidefoot');if(foot)foot.innerHTML=`<b>${v09Online?'Supabase Aktif':'Luring'}</b><br><span>${state?.taxpayers?.length||0} WP</span>`;
      const notice=document.querySelector('.notice');if(notice){const pending=v09Pending.size;notice.hidden=v09Online&&!pending;notice.innerHTML=v09Online?`<b>Sinkronisasi</b> · ${pending} perubahan menunggu unggah`:`<b>Luring</b> · perubahan disimpan di cache lokal`}
      const top=document.querySelector('.topactions');if(top&&!document.getElementById('v09User')){const s=document.createElement('span');s.id='v09User';s.className='v09-user';top.prepend(s)}
      const user=document.getElementById('v09User');if(user)user.textContent=v09User||'';
      let dbb=document.getElementById('v09DbButton');if(top&&!dbb){dbb=document.createElement('button');dbb.id='v09DbButton';dbb.className='btn';dbb.onclick=v09OpenDatabase;top.prepend(dbb)}
      if(dbb){dbb.textContent=v09Online?'Basis Data ✓':'Basis Data';dbb.classList.toggle('v09-db-ok',v09Online)}
      let logout=document.getElementById('v09Logout');if(top&&!logout){logout=document.createElement('button');logout.id='v09Logout';logout.className='btn';logout.textContent='Keluar';logout.onclick=v09Logout;top.append(logout)}
      v091TranslateNode(document.body);
    };
  }
  if(typeof v09OpenDatabase==='function'){
    v09OpenDatabase=function(){
      const s=typeof v06ImportSummary==='function'?v06ImportSummary():{};
      modal('Basis Data Pribadi',`<div class="v09-db-grid"><div><span>Wajib Pajak</span><b>${state.taxpayers.length}</b></div><div><span>Badan</span><b>${s?.badan??state.taxpayers.filter(x=>x.type==='BADAN').length}</b></div><div><span>OP</span><b>${s?.op??state.taxpayers.filter(x=>x.type==='OP').length}</b></div><div><span>Kredensial</span><b>${v09RemoteCounts.credentials||v09CredentialIds.size}</b></div></div><div class="storageBox">Pengguna: <b>${esc(v09User||'—')}</b><br>Sumber: <b>Supabase member wp</b><br>Sesi: <b>cookie HttpOnly</b><br>Sinkronisasi terakhir: <b>${esc(v09LastSync)}</b><br>Status: <b>${v09Online?'Daring':'Luring'}</b></div><div class="v051-help">Kata sandi tidak disimpan di peramban atau sumber GitHub. Kredensial WP hanya diminta saat detail WP dibuka.</div>`,`<button class="btn" onclick="v09Bootstrap(true);closeModal()">Muat Ulang Basis Data</button><button class="btn" onclick="v09Logout()">Keluar</button>`);
    };
  }
}

function v091InstallImportUi(){
  if(typeof v06ImportView==='function'){
    v06ImportView=function(){
      const s=v06ImportSummary?.()||{};
      return `<div class="card"><div class="splitHead"><div><h2>Basis Data Supabase</h2><p>Basis data produksi dimuat setelah masuk. Impor berkas manual tidak diperlukan.</p></div>${badge(v09Online?'Daring':'Luring','ok')}</div><div class="v06-summary-kpis"><span><b>${state.taxpayers.length}</b><small>Total WP</small></span><span><b>${s.badan||72}</b><small>Badan</small></span><span><b>${s.op||161}</b><small>OP</small></span><span><b>${s.issues||36}</b><small>Kendala</small></span><span><b>${s.documentRequirements||40}</b><small>Dokumen</small></span><span><b>${s.historicalChecklistRows||73}</b><small>Riwayat</small></span></div><div class="storageBox">Kredensial pribadi: <b>${v09RemoteCounts.credentials||v09CredentialIds.size}</b><br>Referensi: <b>${s.referenceRows||21}</b><br>NPWP duplikat: <b>${s.duplicateNpwpGroups||4}</b></div></div>`;
    };
  }
}

function v091Observe(){
  let scheduled=false;
  const run=()=>{scheduled=false;v091TranslateNode(document.body)};
  const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(run)});
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  window.__v091Observer=observer;
}

function v091Start(){
  v091InstallCoreLabels();
  v091InstallV09Ui();
  v091InstallImportUi();
  v091TranslateNode(document.body);
  v091Observe();
  setTimeout(()=>{v091InstallCoreLabels();v091InstallV09Ui();v091InstallImportUi();v091TranslateNode(document.body);if(typeof renderAll==='function')renderAll();},260);
}

Object.assign(window,{v091TranslateNode});
setTimeout(v091Start,225);
