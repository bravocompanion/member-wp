# Member WP v0.5.1 — Audit & Minimal UI

Member WP adalah **Cloudflare Pages static tanpa Supabase**. Data operasional disimpan di IndexedDB browser dan tidak membutuhkan Next.js runtime, Worker, API server, database cloud, atau environment variable.

## Audit v0.5.1

Update ini berfokus pada stabilitas, keamanan data lokal, dan penyederhanaan UI sebelum masuk ke fitur v0.6.

- Dashboard diringkas agar tidak menduplikasi informasi Today/Deadline.
- Navigasi utama dipangkas menjadi **Today, WP, Task, Deadline, Catatan, Lainnya**.
- Template, Attention, Activity, dan Data/Backup dipindahkan ke menu **Lainnya**.
- Daftar WP dan Deadline diubah menjadi list responsif yang lebih ringkas daripada tabel lebar.
- Visual dirapikan: shadow dikurangi, radius lebih kecil, warning banner dipadatkan, spacing lebih konsisten.
- **Data Health Audit** memeriksa orphan records, duplicate NPWP, duplicate compliance task, kode kewajiban tidak dikenal, judul task kosong, serta deadline tidak valid.
- Logika overdue/due-today memakai tanggal lokal browser, bukan UTC, untuk mencegah salah klasifikasi sekitar tengah malam WITA.
- Backup sekarang menulis versi aplikasi **0.5.1** dan timestamp ISO yang dapat dihitung umur backup-nya.
- Restore diperketat dengan validasi struktur dan relasi sebelum database disentuh.
- Restore menggunakan satu transaksi IndexedDB lintas store sehingga bersifat **atomik**: gagal berarti database lama tidak diganti setengah jalan.
- Restore tetap menolak field credential sensitif.
- GitHub Actions QA sekarang mengecek `app.js`, `v04.js`, `v05.js`, `v051.js`, urutan integrasi script, output build, dan marker audit.

## Workflow utama

```text
Today
  → Prioritas Hari Ini
  → Deadline / Follow-up
  → Buka WP / Mulai / Selesai
```

Menu utama sengaja dibuat pendek. Kontrol sekunder tersedia di **Lainnya**.

## Fitur yang tetap tersedia

- IndexedDB local database.
- Tambah/edit/nonaktifkan/hapus WP.
- PIC, telepon, email operasional, status member.
- Profil dan Template Kewajiban.
- Compliance Engine per periode dan dedup task.
- Task manual, deadline, prioritas, status, snooze reminder.
- Notes tambah/edit/hapus/Pin.
- Attention Center dan Activity Timeline.
- Backup/restore JSON.
- Browser reminder ketika Member WP sedang terbuka.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Tidak diperlukan environment variable Supabase.

## Penyimpanan & keamanan

IndexedDB berada di browser/perangkat yang digunakan dan tidak sinkron otomatis ke perangkat lain. Lakukan backup JSON secara berkala.

Static app **bukan credential vault**. Jangan simpan password email, EFIN, password DJP/Coretax, Coretax key/passphrase, Key DJP, atau secret lain. Gunakan Cloudflare Access bila halaman hanya boleh dibuka admin/staff.

## Build

```bash
npm run build
```

Build menyalin folder `static/` ke `dist/` dan menambahkan security headers dasar.
