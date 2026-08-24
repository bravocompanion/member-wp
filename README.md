# Member WP v0.8.1 — Seamless Personal Access

Member WP menggunakan **Cloudflare Pages + Pages Functions** dengan project Supabase **`member wp`** sebagai database pusat. Tidak ada halaman login email/password di aplikasi.

## Pengalaman penggunaan

Setelah browser diaktifkan satu kali, kunjungan normal bekerja seperti website pribadi biasa:

```text
Buka Member WP
      ↓
Dashboard dari cache IndexedDB langsung tampil
      ↓
Supabase diverifikasi dan disinkronkan di background
```

Tidak ada overlay/loading security pada startup normal perangkat yang sudah aktif. Overlay hanya muncul jika:

- browser/perangkat belum pernah diaktifkan;
- cookie perangkat sudah tidak valid;
- perangkat dinonaktifkan secara manual;
- database belum pernah tersedia lokal dan backend tidak dapat dihubungi.

## Arsitektur

```text
Browser pribadi
      ├─ IndexedDB (cache cepat/offline)
      ↓
Cloudflare Pages
      ↓
Pages Function /api/member-wp
      ↓
Supabase Edge Function
      ↓
Private Supabase tables
      ├─ member_wp_single_records
      └─ member_wp_single_credentials
```

## Database produksi

Workbook Member WP sudah tersimpan di Supabase:

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

## Tanpa login page

Tidak ada:

- form email/password;
- tombol Sign Up;
- Supabase Auth runtime di browser;
- publishable/service key database di browser.

Browser baru diaktifkan **satu kali** memakai URL fragment `#activate=...`. Setelah tervalidasi, Pages Function membuat cookie perangkat `HttpOnly; Secure; SameSite=Strict`.

URL normal berikutnya langsung membuka dashboard.

## Security

- Plain device token tidak berada di GitHub.
- Repository hanya menyimpan SHA-256 hash token.
- Cookie perangkat tidak dapat dibaca JavaScript.
- Browser tidak mengakses tabel Supabase secara langsung.
- `anon` dan `authenticated` tidak memiliki grant pada tabel personal.
- RLS tetap aktif dan deny-by-default.
- Supabase service role hanya digunakan server-side di Edge Function.
- Credential tidak ikut bootstrap daftar WP dan baru diminta ketika detail member membutuhkannya.
- Mekanisme Auth/bootstrap v0.7 sudah dihapus dari database produksi.

## Cache-first + background sync

v0.8.1 mengutamakan respons UI:

1. IndexedDB dibuka.
2. Jika cache nyata tersedia, dashboard langsung dirender.
3. Verifikasi device cookie dan snapshot Supabase berjalan di background.
4. Snapshot terbaru memperbarui cache.
5. Perubahan yang dibuat saat sinkronisasi sedang berjalan dipertahankan dan dikirim setelah bootstrap selesai.

Jika internet sementara terputus tetapi cache sudah tersedia, aplikasi tidak memblokir layar. Status **Cache Lokal** ditampilkan dan retry dilakukan otomatis saat tab aktif atau koneksi kembali.

Perubahan offline lintas reload masih memiliki batasan: outbox perubahan belum dipersistenkan sebagai queue durable. Hindari menutup tab sebelum perubahan offline berhasil tersinkron.

## Data sensitif

Credential hanya diminta saat detail WP dibuka. Field dapat mencakup Coretax, EFIN, Key DJP, email/password, NIK/KK, dan field terkait dari workbook sumber.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Root `functions/` dideploy otomatis oleh Cloudflare Pages Functions.

## UI

Navigasi tetap minimal. Ketika database sehat dan tidak ada perubahan pending, banner sinkronisasi disembunyikan. Header **Database ✓** menjadi indikator utama status cloud.

Untuk perangkat/browser baru, gunakan shortcut aktivasi pribadi satu kali. Setelah itu buka URL Member WP normal tanpa login.
