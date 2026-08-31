# Member WP v0.10 — Kontrol WP + Arsip Dokumen

Member WP adalah aplikasi pribadi untuk mengontrol setiap wajib pajak: data WP, tugas, batas waktu, catatan, riwayat aktivitas, data login, dan sekarang **arsip dokumen per WP**.

Aplikasi menggunakan **Cloudflare Pages + Pages Functions** dan project Supabase **`member wp`** sebagai database pusat.

## Arsip per WP

Setiap detail WP memiliki bagian **Arsip Dokumen**.

Fitur:

- upload beberapa file sekaligus;
- kategori: Pajak, SPT, Bukti Bayar, Laporan Keuangan, Legal, Surat, Lainnya;
- catatan opsional per upload;
- daftar file khusus untuk WP tersebut;
- tampil nama, kategori, ukuran, dan waktu upload;
- download file;
- hapus file;
- saat WP benar-benar dihapus, arsip cloud WP tersebut ikut dibersihkan.

File yang didukung:

- PDF;
- JPG/JPEG, PNG, WebP;
- Word DOC/DOCX;
- Excel XLS/XLSX;
- CSV;
- XML;
- ZIP;
- TXT.

Batas ukuran: **20 MB per file**.

File disimpan di bucket Supabase Storage private `member-wp-archives`. File tidak disimpan di GitHub dan tidak memiliki URL publik permanen. Browser hanya bisa mengaksesnya setelah login Member WP berhasil melalui API private.

Metadata file disimpan di tabel `public.member_wp_archives` dengan RLS aktif dan akses `anon` / `authenticated` dicabut.

## Login

Aplikasi memakai satu akun pribadi Member WP.

- Password tidak disimpan di GitHub, JavaScript, localStorage, atau cookie.
- Password diverifikasi server-side dengan PBKDF2-SHA256.
- Setelah login, Cloudflare menyimpan session sebagai cookie `HttpOnly; Secure; SameSite=Strict`.
- Session maksimum 30 hari atau sampai tombol Keluar ditekan.

## Arsitektur

```text
Browser
   ↓ login
Cloudflare Pages Function
   ↓
Supabase Edge Function
   ├─ Database WP / tugas / catatan
   ├─ Data login WP
   └─ Arsip Dokumen
          ↓
   Supabase Storage private
```

Browser tidak memegang Supabase service-role key dan tidak punya akses langsung ke tabel database atau Storage private.

## Database produksi

- 233 WP
  - 72 Badan
  - 161 OP
- 233 data login
- 36 kendala
- 40 kebutuhan dokumen
- 73 riwayat checklist
- 21 referensi
- 4 grup NPWP duplikat

## Sinkronisasi

Data operasional seperti WP, profil kewajiban, tugas, catatan, aktivitas, dan metadata tetap memakai Supabase sebagai sumber utama dengan IndexedDB sebagai cache browser.

File arsip **tidak disalin ke IndexedDB**. File tetap berada di Supabase Storage dan hanya diambil ketika pengguna menekan Download.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

## Skema

- `004_member_wp_single_user_database.sql` — database personal.
- `005_member_wp_remove_legacy_auth_bootstrap.sql` — cleanup flow lama.
- `006_member_wp_app_login.sql` — hash login aplikasi.
- `007_member_wp_archives.sql` — metadata arsip + bucket Storage private.
