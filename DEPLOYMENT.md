# Cloudflare Pages Deployment — Member WP v0.9

Member WP production uses **Cloudflare Pages + Pages Functions** with Supabase project `member wp` as the private database backend.

Cloudflare Pages settings:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

No database password, Supabase service-role key, or Member WP login password is committed to GitHub.

## Pages Function

Browser requests use:

```text
/api/member-wp
```

The Pages Function handles:

- login forwarding to the protected Supabase Edge Function;
- setting the signed session as `HttpOnly; Secure; SameSite=Strict` cookie;
- logout/session cookie removal;
- forwarding authenticated bootstrap, CRUD sync, and credential requests.

The browser never receives the Supabase service-role key.

## Login verification

The Supabase Edge Function verifies the application password against the private table:

```text
member_wp_app_auth
```

The table stores only PBKDF2 salt/hash/iteration metadata. Production login values are provisioned directly in Supabase and are not included in repository migrations.

After successful verification, the Edge Function creates a 30-day HMAC-signed session. The Pages Function stores that token in the HttpOnly cookie.

## Database tables

```text
member_wp_single_records
member_wp_single_credentials
member_wp_app_auth
```

RLS remains enabled. Browser roles do not receive direct grants to these tables.

## Local cache

IndexedDB is used only after login as a browser cache/offline layer. Logout clears the local cache.
