# Member WP Architecture

## Data model

```text
auth.users
   │
   └─ app_users (role)

                 taxpayers
             ┌──────┼─────────────┬─────────────┬───────────────┐
             ▼      ▼             ▼             ▼               ▼
         contacts  filings      issues      document_req   credential_records
                                                  │               │
                                                  ▼               ▼
                                              documents       Vault secret UUID
                                                                   │
                                                                   ▼
                                                           vault.secrets
```

## Important boundaries

- Browser uses publishable key + RLS.
- Secret/service key only exists in server runtime.
- `vault.decrypted_secrets` is never granted to browser roles.
- Public Vault RPC functions are explicitly revoked from `public`, `anon`, and `authenticated`; only `service_role` executes them.
- Reveal route verifies an authenticated admin before invoking the server-only RPC.
- Data API grants are explicit because newer Supabase projects may not expose new public tables automatically.

## Workbook mapping

| Workbook | Destination |
|---|---|
| BADAN | taxpayers + contacts + credential_records/Vault |
| OP | taxpayers + contacts + credential_records/Vault |
| Sheet1 | filing_tasks |
| BADAN 2 | taxpayer_issues + document_requirements |
| OP 2 | taxpayer_issues + document_requirements |
| Sheet3 | retained as audit/reference; not used as a new taxpayer source |

## PWA

The project includes `manifest.webmanifest`, an app icon and a minimal service worker. This makes the web app installable as a standalone experience after production deployment.
