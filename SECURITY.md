# Security

This public repository contains application source code and synthetic demo data only.

Do not commit:
- `.env` or `.env.local`
- Supabase secret/service-role keys
- source workbooks (`*.xlsx`)
- taxpayer names, NPWP/NIK, contact data, credentials, EFIN, Coretax keys/passphrases
- generated import payloads

Use private infrastructure for production data and rotate any secret that is ever committed accidentally.
