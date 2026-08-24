# Member WP v0.8 — Personal Direct Database

Member WP berjalan sebagai **Cloudflare Pages + Pages Functions** dengan project Supabase **`member wp`** sebagai database pusat. Tidak ada halaman login email/password di aplikasi.

## Arsitektur

```text
Browser pribadi
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

Browser juga menyimpan IndexedDB sebagai cache/offline.
```

## Database produksi

Workbook Member WP sudah dimasukkan ke Supabase:

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

v0.8 menghapus runtime Supabase Auth dari browser. Tidak ada:

- form email/password;
- tombol Sign Up;
- session Supabase Auth di UI;
- publishable key Supabase di browser.

Perangkat pribadi diaktifkan **satu kali** menggunakan activation token melalui URL fragment `#activate=...`. Fragment tidak dikirim ke server pada request halaman.

Setelah token tervalidasi, Cloudflare Pages Function membuat cookie:

- `HttpOnly`;
- `Secure`;
- `SameSite=Strict`;
- berlaku satu tahun pada endpoint Member WP.

Sesudah aktivasi pertama, buka Member WP seperti biasa dan database langsung dimuat.

## Security

- Plain device token tidak berada di GitHub.
- Source hanya menyimpan SHA-256 hash token.
- Token tidak dapat dibaca JavaScript setelah menjadi HttpOnly cookie.
- Browser tidak memiliki Supabase service key.
- Browser tidak terhubung langsung ke tabel Supabase.
- `anon` dan `authenticated` tidak memiliki grant pada tabel single-user.
- RLS tetap aktif pada tabel database.
- Pages Function hanya meneruskan request setelah cookie perangkat valid.
- Supabase Edge Function juga memverifikasi token yang sama sebelum memakai service role secara server-side.
- Credential hanya diminta ketika detail member dibuka dan tidak ikut dalam bootstrap daftar WP.

Schema database disimpan di `supabase/migrations/004_member_wp_single_user_database.sql`.

## Sinkronisasi

Saat aplikasi dibuka:

1. Pages Function memverifikasi perangkat.
2. Browser mengambil snapshot Supabase.
3. Snapshot mengganti cache IndexedDB lokal.
4. UI langsung menampilkan database produksi.

Perubahan normal pada:

- member/WP;
- profil kewajiban;
- task;
- note;
- activity log;
- metadata;

masuk ke IndexedDB lebih dulu lalu dikirim ke Supabase secara otomatis dalam batch kecil.

Jika koneksi terputus, cache lokal tetap dapat ditampilkan. Perubahan yang belum terkirim ditahan sampai koneksi kembali tersedia selama tab masih terbuka.

## Data sensitif

Credential tidak disimpan sebagai bagian daftar WP. Saat tombol data sensitif dibuka, aplikasi meminta record credential member tersebut melalui API private.

Data sensitif mencakup field workbook yang tersedia seperti Coretax, EFIN, Key DJP, email/password, NIK/KK, dan field terkait lainnya.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Folder `functions/` digunakan otomatis oleh Cloudflare Pages Functions. Tidak diperlukan Supabase service-role key di repository atau browser.

## UI

Navigasi utama tetap minimal:

**Today · WP · Task · Deadline · Catatan · Lainnya**

Header menampilkan status **Database ✓** ketika Supabase aktif. Detail teknis database berada di panel Database agar dashboard tetap informatif tetapi tidak ramai.

## Perangkat lain

Untuk komputer/browser lain, gunakan activation shortcut pribadi yang sama satu kali. Setelah cookie perangkat dibuat, database akan langsung terbuka pada kunjungan berikutnya.
