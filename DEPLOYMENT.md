# Cloudflare Pages Deployment — Member WP v0.8

Member WP production uses **Cloudflare Pages + Pages Functions**. Supabase project `member wp` is the private database backend.

Cloudflare Pages settings remain:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

No database secret, Supabase service-role key, or device token is committed to GitHub.

## Pages Functions

Cloudflare automatically deploys the root `functions/` directory together with the static output. The endpoint used by the browser is:

```text
/api/member-wp
```

The Pages Function:

1. validates the private device cookie;
2. forwards only validated requests to the Supabase Edge Function;
3. never exposes the Supabase service-role key to the browser.

No Cloudflare environment variable is required for v0.8 device authentication. The repository contains only the SHA-256 hash of the private device token.

## First device activation

The first browser is activated once using a private URL fragment:

```text
https://<member-wp-domain>/#activate=<private-device-token>
```

URL fragments are not sent with the initial HTTP request. JavaScript sends the token once to the same-origin Pages Function, which validates it and creates an `HttpOnly; Secure; SameSite=Strict` cookie.

After activation, use the normal URL without the fragment.

Keep the activation shortcut private. It grants access to the personal Member WP database on a new browser.

## Database

Supabase tables:

```text
member_wp_single_records
member_wp_single_credentials
```

Both tables have RLS enabled and no grants for `anon` or `authenticated`. Browser access is not permitted directly.

## Local cache

IndexedDB remains a cache/offline layer. Supabase is the production source of truth. Opening the app refreshes the local cache from Supabase when the private API is available.
