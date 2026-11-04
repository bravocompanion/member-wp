# Member WP — Cloudflare D1

Member WP v0.12 stores its production checklist data in Cloudflare D1.

## Binding

Create a D1 database in the same Cloudflare account as the Pages project and bind it as:

`DB`

Cloudflare Pages exposes the binding to `functions/api/member-wp.js` through `context.env.DB`.

## Data stored

Only two collections are accepted by the API:

- `taxpayers`: id, name, type, status, createdAt, updatedAt
- `tasks`: weekly Monitoring Coretax DJP checklist fields

The API sanitizes every upsert and discards fields outside this allowlist.

## Login secrets

Configure these in Cloudflare Pages settings:

- `MEMBER_WP_USERNAME`
- `MEMBER_WP_PASSWORD`
- `SESSION_SECRET`

Do not commit the real values.

## Schema

The API creates the table/index automatically when the database is first used. The same SQL is kept in `d1/schema.sql` for manual initialization or inspection.
