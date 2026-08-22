# Member WP v0.3 — Static Admin Control Center

Member WP berjalan sebagai **Cloudflare Pages tanpa Supabase**. Production build tidak membutuhkan Next.js runtime, Worker, API server, database cloud, atau environment variable.

## Update v0.3

- Penyimpanan utama pindah dari `localStorage` ke **IndexedDB**.
- Migrasi otomatis data v0.2 dari key `memberwp-static-v022` jika tersedia.
- **Tambah Member** baru.
- Edit data member: nama, jenis WP, NPWP, PIC, telepon, email operasional, status.
- Nonaktifkan/aktifkan dan hapus member.
- Profil kewajiban per WP tetap tersedia.
- **Task manual** per WP.
- Deadline, prioritas, dan status task dapat diedit langsung.
- Attention Center membaca overdue, blocked, waiting client/documents, dan prioritas tinggi.
- Notes mendukung tambah, edit, hapus, Pin/Unpin.
- **Activity Timeline** lokal sebagai audit trail perubahan admin.
- Backup/restore JSON untuk seluruh database lokal.
- Restore menolak field credential sensitif seperti password, EFIN, passphrase, Coretax key, dan Key DJP.

## Cloudflare Pages

Gunakan setting:

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Tidak diperlukan environment variable Supabase.

## Penyimpanan

IndexedDB berada pada browser/perangkat yang sedang digunakan. Tidak ada sinkronisasi otomatis antar perangkat.

Gunakan **Data & Backup → Backup JSON** secara berkala. Backup mencakup member, profil kewajiban, task, notes, activity log, dan metadata aplikasi.

## Keamanan

Static app bukan credential vault. Jangan menyimpan:

- password email;
- EFIN;
- password DJP/Coretax;
- Coretax key/passphrase;
- Key DJP atau secret lain.

Source production hanya berisi data demo sintetis. Untuk membatasi siapa yang dapat membuka Pages/custom domain, gunakan **Cloudflare Access**.

## Build

```bash
npm run build
```

Build menyalin seluruh folder `static/` ke `dist/` dan menambahkan security headers dasar.

## Legacy source

Folder Next.js/Supabase lama masih ada sebagai referensi pengembangan, tetapi tidak ikut runtime production v0.3.
