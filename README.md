# Member WP v0.5 — Today & Deadline Control

Member WP berjalan sebagai **Cloudflare Pages tanpa Supabase**. Production build tidak membutuhkan Next.js runtime, Worker, API server, database cloud, atau environment variable.

## Update v0.5

- **Today Dashboard** sebagai halaman kerja utama admin.
- Focus Queue mengurutkan task berdasarkan urgensi: overdue → hari ini → prioritas tinggi → 7 hari → kendala/waiting.
- Ringkasan deadline: overdue, hari ini, ≤7 hari, 8–14 hari, 15–30 hari, dan tanpa deadline.
- **Deadline Center** dengan filter waktu, prioritas, status, pencarian task/WP/PIC, dan quick actions.
- Quick action untuk mulai task dan tandai selesai tanpa membuka detail WP.
- **Reminder Snooze** 1 hari tanpa mengubah deadline task.
- Daftar khusus task tanpa deadline agar dapat dilengkapi admin.
- Browser Notification opsional ketika Member WP sedang terbuka.
- Reminder browser tidak berjalan sebagai background scheduler ketika tab/aplikasi ditutup.
- Activity Timeline mencatat task start/complete serta snooze/unsnooze reminder.

## Compliance v0.4 yang tetap tersedia

- Template Kewajiban bawaan dan custom.
- Template hanya starter checklist dan tetap wajib direview admin.
- Compliance Engine untuk periode berjalan dan bulan berikutnya.
- Task periodized dan dedup per WP + kewajiban + periode.
- Histori task periode lama tetap dipertahankan.
- Deadline tidak diasumsikan otomatis oleh aplikasi.

## Data & workflow v0.3 yang tetap tersedia

- IndexedDB sebagai penyimpanan utama.
- Tambah/edit/nonaktifkan/hapus member.
- PIC, telepon, email operasional, status member.
- Task manual, deadline, prioritas, dan status.
- Attention Center.
- Notes tambah/edit/hapus/Pin.
- Activity Timeline lokal.
- Backup/restore JSON.
- Restore menolak field credential sensitif.

## Prinsip Reminder

Snooze hanya menunda **pengingat internal**. Snooze tidak mengubah `dueDate` task.

Browser Notification adalah convenience reminder ketika Member WP sedang terbuka di browser. Karena versi ini tidak menggunakan server, service backend, atau scheduler, notifikasi tidak dijamin muncul ketika aplikasi ditutup.

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Tidak diperlukan environment variable Supabase.

## Penyimpanan

IndexedDB berada pada browser/perangkat yang sedang digunakan. Tidak ada sinkronisasi otomatis antar perangkat.

Gunakan **Data & Backup → Backup JSON** secara berkala. Backup mencakup member, profil kewajiban, task, reminder state, notes, activity log, template custom, dan metadata aplikasi.

## Keamanan

Static app bukan credential vault. Jangan menyimpan password email, EFIN, password DJP/Coretax, Coretax key/passphrase, Key DJP, atau secret lain.

Source production hanya berisi data demo sintetis. Untuk membatasi siapa yang dapat membuka Pages/custom domain, gunakan **Cloudflare Access**.

## Build

```bash
npm run build
```

Build menyalin seluruh folder `static/` ke `dist/` dan menambahkan security headers dasar.
