create table if not exists public.member_wp_records (
  owner_id uuid not null default auth.uid(),
  collection text not null check (collection in ('taxpayers','profiles','tasks','notes','activities','meta')),
  record_id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner_id, collection, record_id)
);

create index if not exists member_wp_records_owner_collection_idx
  on public.member_wp_records (owner_id, collection);
create index if not exists member_wp_records_updated_idx
  on public.member_wp_records (owner_id, updated_at desc);

create table if not exists public.member_wp_sync_state (
  owner_id uuid primary key default auth.uid(),
  source_origin text,
  record_count integer not null default 0,
  client_version text,
  last_push_at timestamptz,
  last_pull_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.member_wp_records enable row level security;
alter table public.member_wp_sync_state enable row level security;

revoke all on public.member_wp_records from anon;
revoke all on public.member_wp_sync_state from anon;
grant select, insert, update, delete on public.member_wp_records to authenticated;
grant select, insert, update, delete on public.member_wp_sync_state to authenticated;

create policy "member_wp_records_owner_all"
on public.member_wp_records
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "member_wp_sync_state_owner_all"
on public.member_wp_sync_state
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
