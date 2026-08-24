# Member WP v0.9 — Private Login

Member WP menggunakan **Cloudflare Pages + Pages Functions** dengan project Supabase **`member wp`** sebagai database pusat. Mulai v0.9, database hanya tampil setelah login aplikasi berhasil.

## Login

Aplikasi memakai satu akun pribadi Member WP.

- Username aplikasi disediakan secara tetap untuk penggunaan pribadi.
- Password **tidak disimpan di GitHub, JavaScript, localStorage, atau cookie**.
- Password diverifikasi server-side terhadap **PBKDF2-SHA256** hash yang tersimpan di tabel private Supabase.
- Setelah login berhasil, server membuat session bertanda tangan dan Cloudflare menyimpannya sebagai cookie `HttpOnly; Secure; SameSite=Strict`.
- Session berlaku maksimum 30 hari, atau sampai pengguna menekan **Keluar**.

Credential login production diprovision langsung di Supabase dan tidak ditulis ke migration repository.

## Arsitektur

```text
Login Member WP
      ↓
Cloudflare Pages Function
      ↓
Supabase Edge Function
      ├─ verifikasi password PBKDF2
      ├─ signed session
      ↓
Private database
      ├─ member_wp_single_records
      ├─ member_wp_single_credentials
      └─ member_wp_app_auth
```

Browser tidak memegang Supabase service-role key dan tidak memiliki akses langsung ke tabel database.

## Database produksi

Database workbook saat ini berisi:

- 233 WP
  - 72 Badan
  - 161 OP
- 233 credential
- 36 kendala
- 40 kebutuhan dokumen
- 73 riwayat checklist
- 21 referensi
- 4 grup NPWP duplikat

Data Excel asli tidak disimpan di repository GitHub.

## Security

- Tabel Member WP menggunakan RLS.
- `anon` dan `authenticated` tidak memiliki grant langsung pada tabel personal.
- Tabel `member_wp_app_auth` juga deny-by-default untuk browser roles.
- Password plaintext hanya ada saat user mengirim form login dan tidak dicatat ke database.
- Session cookie tidak dapat dibaca JavaScript.
- Credential WP tidak ikut bootstrap daftar WP; credential hanya diminta setelah login ketika detail member dibuka.
- Login gagal menggunakan pesan generik dan server menambahkan delay kecil untuk memperlambat tebakan password.
- Logout membersihkan session cookie dan cache IndexedDB lokal.

## Sinkronisasi

Setelah login berhasil:

1. Browser mengambil snapshot database Supabase.
2. Snapshot disimpan sebagai cache IndexedDB.
3. UI Member WP dibuka.
4. Perubahan Member, profil, task, note, activity, dan metadata dikirim kembali ke Supabase secara otomatis.

Jika session habis ketika aplikasi sedang digunakan, layar login kembali muncul dan database ditutup sampai login berhasil lagi.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Root `functions/` dideploy otomatis sebagai Cloudflare Pages Functions.

## Schema

- `004_member_wp_single_user_database.sql` — tabel database personal.
- `005_member_wp_remove_legacy_auth_bootstrap.sql` — membersihkan flow Auth lama.
- `006_member_wp_app_login.sql` — tabel hash login aplikasi.

Nilai password/hash production tidak disimpan di GitHub.
