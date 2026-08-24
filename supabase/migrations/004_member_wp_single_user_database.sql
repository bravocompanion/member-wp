create table if not exists public.member_wp_single_records (
  collection text not null check (collection in ('taxpayers','profiles','tasks','notes','activities','meta')),
  record_id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, record_id)
);

create index if not exists member_wp_single_records_collection_idx
  on public.member_wp_single_records (collection, updated_at desc);

create table if not exists public.member_wp_single_credentials (
  taxpayer_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.member_wp_single_records enable row level security;
alter table public.member_wp_single_credentials enable row level security;

-- Personal Direct mode intentionally exposes no browser database role.
-- Access is server-side only through the Member WP personal API.
revoke all on public.member_wp_single_records from anon, authenticated;
revoke all on public.member_wp_single_credentials from anon, authenticated;
