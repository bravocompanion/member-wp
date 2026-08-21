# Cloudflare Pages Deployment — No Supabase

Member WP production is a static Pages application. It does not require Supabase, Workers, SSR, API routes, or server environment variables.

Cloudflare Pages settings:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

The build script copies the local-only application from `static/index.html` into `dist/index.html` and adds basic security headers.

## Data model

Operational state is stored in the browser with `localStorage`. Use **Data & Backup → Download Backup JSON** regularly. Backups can be restored from the same screen.

Do not embed or import passwords, EFIN, Coretax keys/passphrases, or other secrets into a public static deployment. If the site must be private, protect the Pages URL/custom domain with Cloudflare Access.
