# Member WP v0.2

**Compliance Control Center untuk administrasi seluruh Wajib Pajak.**

v0.2 dibangun di atas v0.1.1: 233 WP tetap menjadi master, Credential Vault tetap terisolasi, dan sekarang aplikasi menambahkan kontrol kewajiban bulanan/tahunan, notes timeline, deadline/status task, dan Attention Center.

## Yang baru di v0.2

- **Profil Kewajiban per WP** — admin memilih kewajiban yang benar-benar berlaku untuk WP tersebut.
- **Kontrol Bulanan** — task masa berjalan, status pekerjaan, deadline, dan progress.
- **Kontrol Tahunan** — SPT/Laporan tahunan berdasarkan profil yang dikonfirmasi.
- **Notes Timeline** — kategori catatan, histori, dan Pin untuk catatan penting.
- **Attention Center** — menggabungkan task bermasalah/terlambat dan kendala aktif.
- **Dashboard Admin** — configured WP, completion bulanan, attention, pinned notes.
- **Audit log** — perubahan profil, status/deadline task, dan notes tercatat.

## Prinsip kewajiban

Aplikasi **tidak pernah menganggap** semua WP Badan/OP memiliki kewajiban pajak yang sama. `obligation_catalog` adalah katalog UI, bukan penetapan hukum. Admin harus mengonfirmasi `compliance_obligations` pada setiap WP.

Saat profil disimpan, aplikasi membuat task periode berjalan dengan deadline kosong. Deadline diisi admin sesuai kondisi dan aturan yang berlaku.

## Preview offline

Buka:

```text
preview/index.html
```

Preview v0.2:

- berisi 233 record demo sintetis;
- nama dan NPWP demo bersifat sintetis/dimasking;
- tidak memuat email/EFIN/password/Coretax key/passphrase asli;
- menyimpan perubahan demo ke localStorage browser;
- mendukung edit profil, status, deadline, dan catatan;
- bisa dikembalikan dengan **Reset Demo**.

Data profil kewajiban awal di preview adalah **simulasi workflow**, bukan kewajiban pajak aktual.

## Database

Jalankan migration berurutan:

```text
supabase/migrations/001_member_wp.sql
supabase/migrations/002_compliance_control.sql
```

Migration v0.2 menambahkan:

```text
obligation_catalog
compliance_obligations
compliance_period_tasks
taxpayer_notes
attention_items
```

Semua tabel public baru menggunakan RLS dan policy role yang sama dengan v0.1.1 (`admin`, `staff`, `viewer`).

## API v0.2

```text
POST  /api/compliance/profile
PATCH /api/compliance/task
POST  /api/notes
```

Writes menggunakan Supabase session + RLS, bukan service-role dari browser. Setiap write penting juga menulis `activity_logs`.

## Stack

- Next.js 16
- React 19
- Supabase PostgreSQL/Auth/RLS/Storage/Vault
- PWA foundation

Versi dependency dipin di `package.json`.

## Menjalankan secara lokal

Salin environment:

```bash
cp .env.example .env.local
```

Install dan jalankan:

```bash
npm install
npm run dev
```

Untuk demo Next.js tanpa Supabase:

```text
DEMO_MODE=true
```

Catatan: form write pada Next.js demo mode sengaja tidak menulis data. Untuk simulasi write, gunakan `preview/index.html` yang memakai localStorage.

## Import workbook

Importer v0.1.1 tetap tersedia di:

```text
scripts/import_member_wp.py
```

Workflow yang disarankan:

1. Audit/dry run workbook.
2. Import master WP, contacts, historical filing, issues, document requirements dan credential ke tempatnya masing-masing.
3. Review data-quality flags / NPWP duplicate.
4. Setelah master valid, admin mengonfigurasi profil kewajiban v0.2.
5. Jadikan database sebagai single source of truth.

## Security

- Secret key/service-role tidak boleh berada di frontend.
- Credential secret tetap melalui Vault/server route.
- `credential_records` hanya metadata.
- Semua tabel public menggunakan RLS.
- `activity_logs` menjadi audit trail.
- Preview tidak memuat credential asli.

Lihat `docs/v0.2-compliance-control.md` untuk model kontrol v0.2.

## Public repository safety

Repository ini sengaja tidak memuat workbook asli, nama WP asli, NPWP asli/masked turunan data produksi, email, EFIN, password, Coretax key, passphrase, atau secret Supabase. Data nyata hanya dipindahkan melalui importer ke environment privat.
