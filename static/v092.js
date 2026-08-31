/* Member WP v0.9.2 — Bahasa Indonesia sehari-hari */
const V092_VERSION='0.9.2';

// Istilah dibuat mudah dipahami sehari-hari. Istilah teknis yang sudah umum
// seperti Database, Backup, Online, Offline, Browser, PIC dan Checklist dipertahankan.
const V092_EXACT=new Map([
  ['Dasbor Hari Ini','Hari Ini'],
  ['Pusat Kendali v0.9.1','Kontrol WP v0.9.2'],
  ['Pusat Kendali v0.9.2','Kontrol WP v0.9.2'],
  ['Basis Data Pribadi','Database Pribadi'],
  ['Basis Data','Database'],
  ['Cadangan','Backup'],
  ['Nama Pengguna','Username'],
  ['Kata Sandi','Password'],
  ['Sesi','Login'],
  ['Tenggat','Batas Waktu'],
  ['Pusat Tenggat','Batas Waktu'],
  ['Lewat Tenggat','Terlambat'],
  ['LEWAT TENGGAT','TERLAMBAT'],
  ['Pengingat Peramban','Pengingat Browser'],
  ['Peramban','Browser'],
  ['Daring','Online'],
  ['Luring','Offline'],
  ['Kredensial','Data Login'],
  ['Kredensial Pribadi','Data Login Pribadi'],
  ['Daftar Periksa','Checklist'],
  ['Tinjauan','Cek'],
  ['Menunggu Tinjauan','Menunggu Dicek'],
  ['Kepatuhan','Kewajiban'],
  ['Mesin Kepatuhan','Buat Tugas Kewajiban'],
  ['Pusat Perhatian','Perlu Dicek'],
  ['Perhatian','Perlu Dicek'],
  ['Administrator','Admin'],
  ['Atur Ulang','Reset'],
  ['Surel','Email'],
  ['Tidak Berlaku','Tidak Perlu'],
  ['Belum Dimulai','Belum Dikerjakan'],
  ['Dalam Proses','Sedang Dikerjakan'],
  ['Menunggu Klien','Menunggu Klien'],
  ['Menunggu Dokumen','Menunggu Dokumen'],
  ['Daftar Prioritas','Yang Harus Dikerjakan'],
  ['Aksi Cepat','Aksi Cepat'],
  ['Kesehatan Data','Cek Data'],
  ['Jejak Audit','Riwayat Perubahan'],
  ['Template Khusus','Template Sendiri'],
  ['Tambah Template Khusus','Tambah Template Sendiri'],
  ['Edit Template Khusus','Edit Template Sendiri']
]);

const V092_PHRASES=new Map([
  ['Prioritas kerja, tenggat, dan tindak lanjut','Yang perlu dikerjakan, batas waktu, dan follow-up'],
  ['Prioritas kerja, batas waktu, dan tindak lanjut','Yang perlu dikerjakan, batas waktu, dan follow-up'],
  ['Kontrol WP, tugas, kewajiban, dan catatan','Lihat dan atur data, tugas, kewajiban, dan catatan tiap WP'],
  ['Tugas otomatis dan manual dengan tenggat/prioritas','Atur tugas, batas waktu, prioritas, dan status'],
  ['Tugas otomatis dan manual dengan batas waktu/prioritas','Atur tugas, batas waktu, prioritas, dan status'],
  ['Lewat tenggat, kendala, dan item prioritas tinggi','Tugas terlambat, kendala, dan hal penting yang perlu dicek'],
  ['Jejak audit lokal perubahan administrator','Riwayat perubahan yang dilakukan di aplikasi'],
  ['Jejak audit lokal perubahan admin','Riwayat perubahan yang dilakukan di aplikasi'],
  ['IndexedDB, impor, cadangan, dan atur ulang','Data lokal, impor, backup, dan reset'],
  ['Tugas kepatuhan dan manual yang tersimpan di IndexedDB.','Semua tugas WP yang tersimpan di aplikasi.'],
  ['Prioritas yang sebaiknya ditangani lebih dahulu.','Hal yang paling perlu dikerjakan lebih dulu.'],
  ['Prioritas yang sebaiknya ditangani lebih dulu.','Hal yang paling perlu dikerjakan lebih dulu.'],
  ['Semua tenggat','Semua Batas Waktu'],
  ['Tanpa tenggat','Tanpa Batas Waktu'],
  ['Tenggat kosong','Batas Waktu Belum Diisi'],
  ['Tenggat tugas tidak berubah.','Batas waktu tugas tidak berubah.'],
  ['Tunda hanya menunda pengingat internal. Tenggat tugas tidak berubah.','Tunda hanya menunda pengingat. Batas waktu tugas tetap sama.'],
  ['Pengingat peramban hanya berjalan ketika Member WP sedang terbuka. Belum ada penjadwal latar belakang di server.','Pengingat Browser hanya muncul saat Member WP sedang dibuka.'],
  ['Pengingat peramban aktif saat Member WP sedang terbuka.','Pengingat Browser aktif saat Member WP sedang dibuka.'],
  ['Izin notifikasi tidak diberikan. Pengingat di dalam aplikasi tetap aktif.','Notifikasi Browser tidak diizinkan. Pengingat di aplikasi tetap bisa dipakai.'],
  ['Member WP — Pengingat Tenggat','Member WP — Pengingat Batas Waktu'],
  ['Urutan: lewat tenggat → hari ini → prioritas tinggi → 7 hari → kendala/menunggu.','Urutan: terlambat → hari ini → prioritas tinggi → 7 hari → kendala/menunggu.'],
  ['Status WP: Perhatian','Status WP: Perlu Dicek'],
  ['Kondisi WP.','Status WP saat ini.'],
  ['Tambah, edit, nonaktifkan, dan kontrol seluruh WP','Cari, tambah, edit, dan kontrol semua WP'],
  ['Template hanya mengisi daftar periksa untuk ditinjau. Administrator tetap harus menekan Simpan Profil.','Template hanya membantu mengisi checklist. Cek lagi lalu klik Simpan Profil.'],
  ['Template adalah pola awal operasional, bukan penetapan kewajiban pajak.','Template hanya contoh awal. Kewajiban tiap WP tetap harus dicek.'],
  ['Template hanya membantu administrator mengisi daftar periksa. Kewajiban aktual tetap harus diverifikasi per WP.','Template membantu mengisi checklist. Tetap cek kewajiban masing-masing WP.'],
  ['Basis Data Supabase','Database Supabase'],
  ['Basis data produksi dimuat setelah masuk. Impor berkas manual tidak diperlukan.','Database utama langsung dimuat setelah login. Tidak perlu impor file lagi.'],
  ['Basis data sudah memakai Supabase. Impor manual dinonaktifkan.','Database sudah terhubung ke Supabase. Impor manual tidak diperlukan.'],
  ['Basis data belum dapat dibuka. Periksa koneksi lalu coba lagi.','Database belum bisa dibuka. Cek internet lalu coba lagi.'],
  ['Muat Ulang Basis Data','Refresh Database'],
  ['Basis Data ✓','Database ✓'],
  ['Dimuat dari basis data pribadi setelah masuk.','Data diambil dari database pribadi setelah login.'],
  ['Data bersumber dari basis data pribadi Supabase.','Data diambil dari database pribadi Supabase.'],
  ['Kata sandi tidak disimpan di peramban atau sumber GitHub. Kredensial WP hanya diminta saat detail WP dibuka.','Password tidak disimpan di Browser atau GitHub. Data login WP hanya diambil saat detail WP dibuka.'],
  ['Sesi berakhir. Silakan masuk kembali.','Login sudah habis. Silakan login lagi.'],
  ['Sesi tidak valid. Silakan masuk kembali.','Login tidak valid. Silakan login lagi.'],
  ['Sesi disimpan sebagai cookie HttpOnly. Kata sandi tidak disimpan di peramban atau sumber aplikasi.','Login disimpan dengan aman di Browser. Password tidak disimpan di aplikasi.'],
  ['Memeriksa sesi...','Mengecek login...'],
  ['Data & Cadangan','Data & Backup'],
  ['Daftar periksa awal internal. Verifikasi kewajiban aktual sebelum disimpan.','Checklist awal. Cek kewajiban WP sebelum disimpan.'],
  ['Pola awal minimal untuk meninjau kewajiban tahunan orang pribadi.','Checklist sederhana untuk kewajiban tahunan OP.'],
  ['Pola awal tinjauan usaha OP. Sesuaikan jika rezim pajak atau kewajibannya berbeda.','Checklist awal untuk OP usaha. Sesuaikan dengan kondisi WP.'],
  ['Pola awal tinjauan untuk kondisi yang memang menggunakan PPh Final. Wajib diverifikasi administrator.','Checklist awal untuk OP yang memakai PPh Final. Tetap cek kondisi WP.'],
  ['Badan — Tinjauan Umum','Badan — Cek Umum'],
  ['Badan PKP — Tinjauan','Badan PKP — Cek'],
  ['OP Usaha — Tinjauan','OP Usaha — Cek'],
  ['OP Usaha Final — Tinjauan','OP Usaha Final — Cek']
]);

const V092_PLACEHOLDERS=new Map([
  ['Cari nama / NPWP / penanggung jawab / telepon','Cari nama / NPWP / PIC / telepon'],
  ['Cari nama, NPWP, penanggung jawab, telepon','Cari nama, NPWP, PIC, telepon'],
  ['Cari tugas / WP / penanggung jawab / tanggal','Cari tugas / WP / PIC / tanggal'],
  ['Cari tugas, WP, penanggung jawab','Cari tugas, WP, PIC']
]);

const v092PreviousTranslate=v091TranslateText;
v091TranslateText=function(text){
  const raw=String(text??''),trimmed=raw.trim();
  if(!trimmed)return raw;
  let translated=V092_EXACT.get(trimmed)||V092_PHRASES.get(trimmed);
  if(!translated){
    translated=v092PreviousTranslate(raw).trim();
    translated=V092_EXACT.get(translated)||V092_PHRASES.get(translated)||translated;
  }
  const replacements=[
    [/\bbasis data\b/gi,'database'],
    [/\btenggat\b/gi,'batas waktu'],
    [/\blewat batas waktu\b/gi,'terlambat'],
    [/\blewat tenggat\b/gi,'terlambat'],
    [/\bkredensial\b/gi,'data login'],
    [/\bperamban\b/gi,'Browser'],
    [/\bdaring\b/gi,'Online'],
    [/\bluring\b/gi,'Offline'],
    [/\btinjauan\b/gi,'cek'],
    [/\bdaftar periksa\b/gi,'checklist'],
    [/\badministrator\b/gi,'admin'],
    [/\bcadangan\b/gi,'backup'],
    [/\bpenanggung jawab\b/gi,'PIC']
  ];
  for(const [pattern,value] of replacements)translated=translated.replace(pattern,value);
  if(translated===trimmed)return raw;
  const lead=raw.match(/^\s*/)?.[0]||'',tail=raw.match(/\s*$/)?.[0]||'';
  return lead+translated+tail;
};

function v092Apply(){
  document.title='Member WP v0.9.2 — Login';
  if(typeof statusLabel==='object')Object.assign(statusLabel,{
    not_started:'Belum Dikerjakan',
    waiting_documents:'Menunggu Dokumen',
    in_progress:'Sedang Dikerjakan',
    waiting_review:'Menunggu Dicek',
    waiting_client:'Menunggu Klien',
    blocked:'Kendala',
    completed:'Selesai',
    not_applicable:'Tidak Perlu'
  });
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Kontrol WP v0.9.2';
  const loginBrand=document.querySelector('.v09-login-brand small');if(loginBrand)loginBrand.textContent='Database Pribadi';
  const loading=document.querySelector('#loading b');if(loading)loading.textContent='Member WP v0.9.2';
  document.querySelectorAll('[placeholder]').forEach(el=>{const p=el.getAttribute('placeholder');if(V092_PLACEHOLDERS.has(p))el.setAttribute('placeholder',V092_PLACEHOLDERS.get(p))});
  v091TranslateNode(document.body);
}

// Render ulang label dinamis dengan istilah sehari-hari tanpa menyentuh data pengguna.
const v092Render=renderAll;
renderAll=function(){v092Render();v092Apply()};

setTimeout(v092Apply,260);
Object.assign(window,{V092_VERSION});
