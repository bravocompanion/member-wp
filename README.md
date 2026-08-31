# Member WP v0.9.1 — Antarmuka Bahasa Indonesia

Member WP menggunakan **Cloudflare Pages + Pages Functions** dengan project Supabase **`member wp`** sebagai basis data pusat. Aplikasi hanya menampilkan data setelah pengguna berhasil masuk.

## Bahasa antarmuka

Mulai v0.9.1, seluruh antarmuka operasional menggunakan Bahasa Indonesia, termasuk:

- halaman masuk;
- dasbor hari ini;
- daftar wajib pajak;
- tugas dan tenggat;
- pengingat;
- catatan;
- aktivitas dan jejak audit;
- pusat perhatian;
- template kewajiban;
- kesehatan data;
- basis data dan cadangan;
- pesan status, kesalahan, dan konfirmasi.

Istilah teknis atau nama produk seperti **Supabase, Cloudflare, IndexedDB, Coretax, PBKDF2, HttpOnly, NPWP, PPh, PPN**, dan **EFIN** tetap dipertahankan agar tidak menimbulkan salah arti.

Lapisan penerjemah hanya mengubah teks antarmuka. Nama WP, judul tugas yang dibuat pengguna, catatan, dan nilai kredensial tidak diterjemahkan atau diubah.

## Masuk

Aplikasi memakai satu akun pribadi Member WP.

- Nama pengguna aplikasi disediakan secara tetap untuk penggunaan pribadi.
- Kata sandi **tidak disimpan di GitHub, JavaScript, localStorage, atau cookie**.
- Kata sandi diverifikasi di sisi server terhadap hash **PBKDF2-SHA256** yang tersimpan di tabel pribadi Supabase.
- Setelah masuk berhasil, server membuat sesi bertanda tangan dan Cloudflare menyimpannya sebagai cookie `HttpOnly; Secure; SameSite=Strict`.
- Sesi berlaku maksimum 30 hari, atau sampai pengguna menekan **Keluar**.

Nilai kredensial masuk produksi diprovision langsung di Supabase dan tidak ditulis ke migration repository.

## Arsitektur

```text
Masuk Member WP
      ↓
Cloudflare Pages Function
      ↓
Supabase Edge Function
      ├─ verifikasi kata sandi PBKDF2
      ├─ sesi bertanda tangan
      ↓
Basis data pribadi
      ├─ member_wp_single_records
      ├─ member_wp_single_credentials
      └─ member_wp_app_auth
```

Peramban tidak memegang Supabase service-role key dan tidak memiliki akses langsung ke tabel basis data.

## Basis data produksi

Basis data workbook saat ini berisi:

- 233 WP
  - 72 Badan
  - 161 OP
- 233 kredensial
- 36 kendala
- 40 kebutuhan dokumen
- 73 riwayat daftar periksa
- 21 referensi
- 4 grup NPWP duplikat

Data Excel asli tidak disimpan di repository GitHub.

## Keamanan

- Tabel Member WP menggunakan RLS.
- `anon` dan `authenticated` tidak memiliki hak akses langsung pada tabel pribadi.
- Tabel `member_wp_app_auth` juga menolak akses peramban secara bawaan.
- Kata sandi polos hanya ada saat pengguna mengirim formulir masuk dan tidak dicatat ke basis data.
- Cookie sesi tidak dapat dibaca JavaScript.
- Kredensial WP tidak ikut dimuat bersama daftar WP; kredensial hanya diminta setelah masuk ketika detail WP dibuka.
- Pesan gagal masuk dibuat umum dan server menambahkan jeda kecil untuk memperlambat percobaan kata sandi berulang.
- Keluar dari aplikasi membersihkan cookie sesi dan cache IndexedDB lokal.

## Sinkronisasi

Setelah masuk berhasil:

1. Peramban mengambil snapshot basis data Supabase.
2. Snapshot disimpan sebagai cache IndexedDB.
3. Antarmuka Member WP dibuka.
4. Perubahan WP, profil, tugas, catatan, aktivitas, dan metadata dikirim kembali ke Supabase secara otomatis.

Jika sesi habis ketika aplikasi sedang digunakan, halaman masuk kembali muncul dan basis data ditutup sampai pengguna berhasil masuk lagi.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Folder `functions/` di root dideploy otomatis sebagai Cloudflare Pages Functions.

## Skema

- `004_member_wp_single_user_database.sql` — tabel basis data pribadi.
- `005_member_wp_remove_legacy_auth_bootstrap.sql` — membersihkan alur autentikasi lama.
- `006_member_wp_app_login.sql` — tabel hash untuk masuk aplikasi.

Nilai kata sandi/hash produksi tidak disimpan di GitHub.
