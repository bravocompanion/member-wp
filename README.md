# Member WP v0.12 — Monitoring Coretax DJP

Member WP adalah aplikasi checklist pribadi untuk monitoring seluruh WP.

Fokus aplikasi saat ini:

- daftar WP;
- jenis WP (BADAN / OP);
- status aktif / nonaktif;
- checklist **Monitoring Coretax DJP** mingguan;
- riwayat checklist mingguan.

Member WP **tidak lagi memakai Supabase sebagai backend produksi**. Data checklist disimpan di **Cloudflare D1** melalui Cloudflare Pages Functions.

## Arsitektur

```text
Browser
   ↓
Cloudflare Pages
   ↓
Pages Function /api/member-wp
   ├─ Login + session HttpOnly
   └─ Cloudflare D1
       ├─ taxpayers
       └─ weekly monitoring tasks
```

## Data yang diizinkan

Backend hanya menerima dua collection:

### taxpayers

- id
- name
- type
- status
- createdAt
- updatedAt

### tasks

Hanya task mingguan Monitoring Coretax DJP dengan field checklist yang diperlukan.

Field sensitif seperti NPWP, NIK, email, nomor telepon, password, EFIN, Coretax key/passphrase, DJP key, dan arsip dokumen tidak termasuk dalam skema produksi v0.12.

## Login

Login diverifikasi di Cloudflare Pages Function menggunakan secret environment:

- `MEMBER_WP_USERNAME`
- `MEMBER_WP_PASSWORD`
- `SESSION_SECRET`

Nilai asli tidak disimpan di GitHub.

Setelah login berhasil, session disimpan sebagai cookie:

- HttpOnly
- Secure
- SameSite=Strict
- maksimum 30 hari

## Cloudflare D1

Buat database D1 dan bind ke project Pages dengan nama:

```text
DB
```

Pages Function akan membuat tabel `member_wp_records` dan index yang diperlukan secara otomatis. SQL referensi juga tersedia di:

```text
d1/schema.sql
```

## Cloudflare Pages

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

## Cache browser

IndexedDB hanya dipakai sebagai cache/offline layer setelah login. Saat logout, cache lokal dibersihkan.

## Source lama

Source dan migration Supabase sudah dikeluarkan dari tree aktif v0.12. Riwayat commit lama tetap menjadi bagian dari Git history, tetapi runtime dan source aktif sekarang menggunakan Cloudflare D1.
