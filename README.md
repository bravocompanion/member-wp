# Member WP v0.4 — Static Compliance Control Center

Member WP berjalan sebagai **Cloudflare Pages tanpa Supabase**. Production build tidak membutuhkan Next.js runtime, Worker, API server, database cloud, atau environment variable.

## Update v0.4

- **Template Kewajiban bawaan** sebagai starter review operasional.
- **Template Custom** yang dapat dibuat, diedit, dan dihapus admin.
- Template dapat dimasukkan ke checklist WP lalu **wajib direview sebelum disimpan**.
- Profil menyimpan sumber template dan menandai jika checklist sudah disesuaikan.
- **Compliance Engine** membuat task berdasarkan profil kewajiban yang sudah dikonfirmasi.
- Task compliance sekarang mempunyai periode (`YYYY-MM` untuk bulanan, tahun untuk tahunan).
- Generator periode berjalan dan bulan berikutnya.
- **Dedup task** per WP + kewajiban + periode.
- Task v0.3 lama tanpa periode dapat diperiodekan otomatis saat engine dijalankan.
- Perubahan profil tidak lagi menghapus histori task periode lama.
- Deadline tetap kosong sampai diisi admin; aplikasi tidak mengasumsikan tanggal hukum.

## Fitur v0.3 yang tetap tersedia

- IndexedDB sebagai penyimpanan utama.
- Tambah/edit/nonaktifkan/hapus member.
- PIC, telepon, email operasional, status member.
- Task manual, deadline, prioritas, dan status.
- Due today, overdue, Attention Center.
- Notes tambah/edit/hapus/Pin.
- Activity Timeline lokal.
- Backup/restore JSON.
- Restore menolak field credential sensitif seperti password, EFIN, passphrase, Coretax key, dan Key DJP.

## Prinsip Template Kewajiban

Template **bukan penetapan kewajiban pajak**. Template hanya membantu admin mengisi checklist awal. Admin harus memeriksa kondisi setiap WP dan menyesuaikan checklist sebelum menekan **Simpan Profil**.

Template bawaan mencakup beberapa starter review untuk Badan/OP, sedangkan kebutuhan kantor yang lebih spesifik dapat dibuat melalui **Template Custom**.

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

Gunakan **Data & Backup → Backup JSON** secara berkala. Backup mencakup member, profil kewajiban, task, notes, activity log, template custom, dan metadata aplikasi.

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

Folder Next.js/Supabase lama masih ada sebagai referensi pengembangan, tetapi tidak ikut runtime production v0.4.
