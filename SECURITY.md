# Security

This public repository contains application source code and synthetic/demo data only.

Do not commit:
- `.env` or `.env.local`
- Cloudflare API tokens or account keys
- `MEMBER_WP_PASSWORD` or `SESSION_SECRET`
- source workbooks (`*.xlsx`)
- taxpayer NPWP/NIK, contact data, credentials, EFIN, Coretax keys/passphrases
- generated import payloads containing private client data

Production Member WP v0.12 stores only the minimum checklist data in Cloudflare D1:
- WP name
- WP type
- active/inactive status
- weekly Monitoring Coretax DJP checklist state

Rotate any secret that is ever committed accidentally.
