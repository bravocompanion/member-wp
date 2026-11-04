# Cloudflare Pages Deployment — Member WP v0.12

Member WP production menggunakan **Cloudflare Pages + Pages Functions + Cloudflare D1**.

Tidak ada dependency runtime ke Supabase.

## Pages settings

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

## 1. Create D1 database

Di Cloudflare Dashboard:

1. Workers & Pages → D1.
2. Create database.
3. Gunakan nama misalnya `member-wp-db`.

## 2. Bind D1 ke Pages

Buka project Pages Member WP:

1. Settings → Bindings.
2. Add binding → D1 database.
3. Variable name: `DB`.
4. Pilih database D1 Member WP.
5. Redeploy setelah binding disimpan.

Pages Functions membaca database melalui `context.env.DB`.

## 3. Configure login secrets

Tambahkan secret/variable berikut di Cloudflare Pages:

```text
MEMBER_WP_USERNAME
MEMBER_WP_PASSWORD
SESSION_SECRET
```

Gunakan username/password Member WP yang Anda inginkan. `SESSION_SECRET` harus string acak panjang.

Jangan commit nilai asli ke GitHub.

## API

Browser memakai endpoint:

```text
/api/member-wp
```

Endpoint menangani:

- login;
- logout;
- bootstrap database;
- upsert/delete WP;
- upsert/delete checklist mingguan;
- health check.

## Security/data minimization

API hanya menerima:

- collection `taxpayers`;
- collection `tasks`.

Payload disanitasi server-side. Field yang tidak termasuk allowlist dibuang sebelum data masuk D1.

Database tidak dirancang untuk menyimpan credential WP, NPWP, EFIN, password, Coretax key/passphrase, file arsip, atau data sensitif lain.

## Schema

Pages Function menjalankan `CREATE TABLE IF NOT EXISTS` saat database pertama kali digunakan.

SQL referensi:

```text
d1/schema.sql
```

## Local cache

IndexedDB tetap dipakai untuk cache browser setelah login. Logout membersihkan cache tersebut.
