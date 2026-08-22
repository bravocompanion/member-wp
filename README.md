# Member WP v0.6 — Private Excel Control Center

Member WP berjalan sebagai **Cloudflare Pages static tanpa Supabase**. Data operasional disimpan lokal di IndexedDB browser.

## Update v0.6

- Semua demo lama dihapus dari data aktif.
- Database kosong menampilkan workflow **Import Data Excel**.
- Import memakai paket private JSON yang dibuat dari workbook Member WP asli.
- Data master WP, kendala, kebutuhan dokumen, riwayat checklist 2018, dan referensi Sheet3 disimpan lokal.
- Credential sensitif (Coretax, EFIN, Key DJP, password email, NIK/KK, dll.) **tidak pernah dimasukkan ke GitHub atau Cloudflare**.
- Credential dienkripsi di browser menggunakan **PBKDF2 + AES-GCM** sebelum disimpan ke IndexedDB.
- Master passphrase dibuat saat import dan **tidak disimpan** oleh aplikasi.
- Vault hanya terbuka di memori tab selama passphrase valid; dapat dikunci kembali kapan saja.
- Detail WP menampilkan kendala, kebutuhan dokumen, riwayat 2018, referensi, serta tombol untuk membuka data sensitif.
- Attention Center juga membaca kendala yang berasal dari workbook.
- Reset database sekarang menghasilkan database kosong, bukan kembali ke data demo.
- Backup JSON normal tetap membawa vault dalam bentuk terenkripsi karena payload vault disimpan di metadata IndexedDB.

## Prinsip privasi

Repository ini publik dan source Cloudflare Pages bersifat static. Karena itu **data asli workbook tidak pernah di-commit**.

Workflow data produksi:

```text
Workbook private
  → Private import JSON
  → Browser Member WP
  → Data operasional: IndexedDB
  → Credential: AES-GCM encrypted IndexedDB
```

Simpan master passphrase di tempat aman. Jika passphrase hilang, credential terenkripsi tidak dapat dipulihkan dari aplikasi.

## Data yang dapat diimpor

Paket private dapat membawa:

- master WP Badan dan OP;
- NPWP dan kontak operasional;
- PIC/direktur yang tersedia;
- Coretax/EFIN/Key DJP dan credential email dalam vault terenkripsi;
- NIK/KK yang tersedia dalam vault terenkripsi;
- kendala;
- kebutuhan dokumen;
- checklist historis E-Filing 2018;
- referensi tambahan workbook;
- kontrol duplicate NPWP.

Tidak ada kewajiban pajak baru yang diasumsikan otomatis dari data Excel. Profil kewajiban tetap harus dikonfirmasi admin melalui Template/Compliance Engine.

## UI

Navigasi utama tetap minimal:

**Today · WP · Task · Deadline · Catatan · Lainnya**

Data Excel & Vault berada di **Lainnya**, sehingga tampilan kerja harian tidak menjadi padat.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Tidak diperlukan Supabase atau environment variable database.

## Security

Gunakan **Cloudflare Access** bila halaman hanya boleh dibuka admin/staff. Walaupun credential dienkripsi saat disimpan, akses perangkat/browser tetap harus dilindungi.
