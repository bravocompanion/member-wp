create table if not exists public.member_wp_app_auth (
  username text primary key,
  salt_b64 text not null,
  hash_b64 text not null,
  iterations integer not null check (iterations >= 100000),
  updated_at timestamptz not null default now()
);

alter table public.member_wp_app_auth enable row level security;
revoke all on public.member_wp_app_auth from anon, authenticated;

-- Login credential values are provisioned out-of-band in Supabase production.
-- Never commit password, salt/hash seed data, or session material to this repository.
