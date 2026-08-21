# Member WP v0.2.2 — Static Admin Control Center

Member WP sekarang ditargetkan ke **Cloudflare Pages tanpa Supabase**.

Production build tidak memakai Next.js runtime, Workers, SSR, API server, database, atau authentication backend. Aplikasi production berada di `static/index.html`; `npm run build` menyalinnya ke folder `dist/` untuk Cloudflare Pages.

## Fitur static

- Dashboard Admin
- 233 WP demo sintetis
- Master Wajib Pajak + pencarian/filter
- Profil kewajiban per WP
- Task bulanan/tahunan
- Status pekerjaan
- Attention Center
- Notes timeline + Pin
- Import/restore backup JSON lokal
- Export backup JSON
- Reset ke data demo
- Penyimpanan dengan browser `localStorage`

## Cloudflare Pages

Gunakan setting:

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Tidak diperlukan environment variable Supabase.

## Penyimpanan data

Static Pages tidak memiliki database. Semua perubahan tersimpan di browser/perangkat yang sedang digunakan.

Gunakan menu **Data & Backup** untuk membuat backup JSON secara berkala. Backup dapat di-import kembali pada perangkat/browser yang sama atau perangkat lain.

## Keamanan

Repository dan Pages dapat diakses publik bila tidak dilindungi. Karena itu source production tidak berisi data WP asli atau credential.

Jangan simpan di static app:

- password email;
- EFIN;
- Coretax key/passphrase;
- password DJP/Coretax;
- credential rahasia lain.

Jika aplikasi hanya boleh dibuka admin/staff, lindungi Pages/custom domain menggunakan **Cloudflare Access**.

## Data WP asli

Data operasional dapat dimasukkan melalui mekanisme import lokal tanpa mengunggah data tersebut ke GitHub. Untuk data yang perlu sinkron antar perangkat/multi-user, dibutuhkan backend/database terpisah; versi static ini sengaja tidak menyediakan sinkronisasi server.

## Legacy source

Folder Next.js/Supabase lama masih dipertahankan di repository sebagai referensi pengembangan, tetapi tidak ikut dalam production build static v0.2.2.
