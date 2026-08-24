# Member WP v0.7 — Supabase Cloud Control Center

Member WP tetap berjalan sebagai **Cloudflare Pages static**, tetapi data sekarang dapat disinkronkan ke project Supabase **`member wp`**. IndexedDB tetap dipakai sebagai cache/offline lokal.

## Arsitektur

```text
Cloudflare Pages
      ↓
Member WP browser
      ├─ IndexedDB (cache/offline)
      └─ Supabase Auth + Data API
             ↓
       member_wp_records
       member_wp_sync_state
```

## Security

- Frontend hanya memakai **Supabase publishable key**.
- Tidak ada `service_role` atau secret key di browser/source publik.
- `anon` tidak diberi akses ke tabel Member WP.
- Akses tabel hanya untuk role `authenticated`.
- RLS membatasi setiap record dengan `owner_id = auth.uid()`.
- Setiap akun hanya dapat membaca dan mengubah data miliknya sendiri.
- Credential Excel tetap dalam bentuk **AES-GCM ciphertext** saat disinkronkan ke Supabase.
- Master passphrase vault tetap hanya berada di memori browser dan tidak dikirim/disimpan di Supabase.

Schema cloud disimpan di `supabase/migrations/003_member_wp_cloud_sync.sql`.

## Login

Saat aplikasi dibuka, Member WP meminta login Supabase menggunakan email + password.

Pengguna dapat:

- Masuk dengan akun yang sudah ada.
- Membuat akun baru.
- Jika email confirmation aktif, konfirmasi email lalu kembali ke aplikasi untuk login.

## Sinkronisasi

Setelah login, tombol **Cloud** tersedia di header.

### Upload lokal → Supabase

Menggunakan IndexedDB browser saat ini sebagai sumber dan menyelaraskan record cloud akun tersebut.

Gunakan ini setelah import Excel pertama kali pada perangkat utama.

### Download Supabase → browser

Mengganti IndexedDB browser saat ini dengan snapshot cloud akun tersebut. Cocok untuk membuka Member WP pada komputer/browser lain.

### Auto-sync

Setelah akun terhubung, perubahan CRUD normal pada:

- WP;
- profil kewajiban;
- task;
- notes;
- activity log;
- metadata/vault ciphertext;

akan dimirror ke Supabase secara otomatis.

## Data Excel & Vault

Workflow private import v0.6 tetap tersedia. Data produksi tidak pernah di-commit ke GitHub.

```text
Workbook private
  → Private import JSON
  → Browser
  → IndexedDB
  → login Supabase
  → Upload lokal → Supabase
```

Credential sensitif dari workbook dienkripsi di browser sebelum disimpan. Supabase menerima ciphertext, bukan master passphrase.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Tidak diperlukan service key atau database password pada Cloudflare Pages.

## UI

Navigasi utama tetap minimal:

**Today · WP · Task · Deadline · Catatan · Lainnya**

Status cloud ditampilkan melalui tombol **Cloud** di header dan status ringkas pada sidebar.

## Current limitation

v0.7 memakai model kepemilikan **satu akun = satu dataset**. Ini aman untuk penggunaan pribadi dan sinkronisasi antar perangkat menggunakan akun Supabase yang sama. Shared workspace multi-staff dapat ditambahkan pada versi berikutnya tanpa membuka RLS secara global.
