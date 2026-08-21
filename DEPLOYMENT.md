# Deployment

Production deployments should track the `main` branch.

A fresh production deployment was intentionally triggered after the Supabase SSR cookie-handling fix in `proxy.ts` so the hosting provider builds the current `main` HEAD rather than retrying an older failed deployment.
