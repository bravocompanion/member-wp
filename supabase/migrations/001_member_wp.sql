-- Member WP v0.1
-- Designed for hosted Supabase/Postgres 17.
-- RLS is enabled on every public table and explicit Data API grants are included.

create extension if not exists pgcrypto;
create extension if not exists supabase_vault with schema vault;

create type public.app_role as enum ('admin','staff','viewer');
create type public.taxpayer_type as enum ('BADAN','OP');
create type public.taxpayer_status as enum ('active','inactive','needs_attention');
create type public.issue_status as enum ('open','in_progress','blocked','resolved');
create type public.filing_status as enum ('not_started','in_progress','filed','not_applicable','blocked');
create type public.document_status as enum ('missing','requested','received','verified','expired');

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taxpayers (
  id uuid primary key default gen_random_uuid(),
  source_sheet text,
  source_row integer,
  taxpayer_type public.taxpayer_type not null,
  name text not null,
  normalized_name text generated always as (upper(regexp_replace(trim(name), '\s+', ' ', 'g'))) stored,
  npwp text,
  npwp16 text,
  nik text,
  kk text,
  status public.taxpayer_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_sheet, source_row)
);
create index taxpayers_name_idx on public.taxpayers using gin (to_tsvector('simple', coalesce(name,'')));
create index taxpayers_npwp_idx on public.taxpayers(npwp);
create index taxpayers_npwp16_idx on public.taxpayers(npwp16);
create index taxpayers_normalized_name_idx on public.taxpayers(normalized_name);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  contact_type text not null check (contact_type in ('email_primary','email_alt','email_registered','phone','director_email','other')),
  value text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_taxpayer_idx on public.contacts(taxpayer_id);

create table public.credential_records (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  kind text not null,
  label text not null,
  vault_secret_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(taxpayer_id, kind, label)
);
create index credential_records_taxpayer_idx on public.credential_records(taxpayer_id);

create table public.filing_tasks (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  tax_type text not null default 'E-Filing',
  period_month smallint check (period_month between 1 and 12),
  period_year smallint not null,
  status public.filing_status not null default 'not_started',
  filed_at timestamptz,
  assigned_to uuid references public.app_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(taxpayer_id, tax_type, period_month, period_year)
);
create index filing_tasks_period_idx on public.filing_tasks(period_year,period_month,status);

create table public.taxpayer_issues (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid references public.taxpayers(id) on delete cascade,
  source_sheet text,
  source_row integer,
  title text not null,
  description text,
  required_documents text[] not null default '{}',
  status public.issue_status not null default 'open',
  assigned_to uuid references public.app_users(id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_sheet, source_row)
);
create index taxpayer_issues_taxpayer_idx on public.taxpayer_issues(taxpayer_id);
create index taxpayer_issues_status_idx on public.taxpayer_issues(status);

create table public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  document_name text not null,
  status public.document_status not null default 'missing',
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(taxpayer_id, document_name)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  requirement_id uuid references public.document_requirements(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.data_quality_flags (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid references public.taxpayers(id) on delete cascade,
  flag_type text not null,
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index data_quality_flags_open_idx on public.data_quality_flags(flag_type) where resolved_at is null;

create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs(created_at desc);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text,
  source_hash text,
  status text not null default 'started',
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Timestamp helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_users_updated before update on public.app_users for each row execute function public.set_updated_at();
create trigger taxpayers_updated before update on public.taxpayers for each row execute function public.set_updated_at();
create trigger contacts_updated before update on public.contacts for each row execute function public.set_updated_at();
create trigger credential_records_updated before update on public.credential_records for each row execute function public.set_updated_at();
create trigger filing_tasks_updated before update on public.filing_tasks for each row execute function public.set_updated_at();
create trigger taxpayer_issues_updated before update on public.taxpayer_issues for each row execute function public.set_updated_at();
create trigger document_requirements_updated before update on public.document_requirements for each row execute function public.set_updated_at();

-- Authorization helper is kept outside the exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select role from public.app_users where id = (select auth.uid()) limit 1;
$$;
revoke all on function private.current_app_role() from public;
grant execute on function private.current_app_role() to authenticated;

create or replace function private.can_read()
returns boolean language sql stable security invoker set search_path = pg_catalog, private
as $$ select coalesce(private.current_app_role() in ('admin','staff','viewer'), false); $$;
create or replace function private.can_write()
returns boolean language sql stable security invoker set search_path = pg_catalog, private
as $$ select coalesce(private.current_app_role() in ('admin','staff'), false); $$;
create or replace function private.is_admin()
returns boolean language sql stable security invoker set search_path = pg_catalog, private
as $$ select coalesce(private.current_app_role() = 'admin', false); $$;
revoke all on function private.can_read() from public;
revoke all on function private.can_write() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.can_read(), private.can_write(), private.is_admin() to authenticated;

-- Enable RLS on every table exposed through public.
alter table public.app_users enable row level security;
alter table public.taxpayers enable row level security;
alter table public.contacts enable row level security;
alter table public.credential_records enable row level security;
alter table public.filing_tasks enable row level security;
alter table public.taxpayer_issues enable row level security;
alter table public.document_requirements enable row level security;
alter table public.documents enable row level security;
alter table public.data_quality_flags enable row level security;
alter table public.activity_logs enable row level security;
alter table public.import_batches enable row level security;

create policy app_users_select on public.app_users for select to authenticated
using (id = (select auth.uid()) or private.is_admin());
create policy app_users_update_admin on public.app_users for update to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy taxpayers_select on public.taxpayers for select to authenticated using (private.can_read());
create policy taxpayers_insert on public.taxpayers for insert to authenticated with check (private.can_write());
create policy taxpayers_update on public.taxpayers for update to authenticated using (private.can_write()) with check (private.can_write());
create policy taxpayers_delete on public.taxpayers for delete to authenticated using (private.is_admin());

create policy contacts_select on public.contacts for select to authenticated using (private.can_read());
create policy contacts_insert on public.contacts for insert to authenticated with check (private.can_write());
create policy contacts_update on public.contacts for update to authenticated using (private.can_write()) with check (private.can_write());
create policy contacts_delete on public.contacts for delete to authenticated using (private.can_write());

-- Only admins can even see credential metadata. Secret values never live in this table.
create policy credential_records_select on public.credential_records for select to authenticated using (private.is_admin());
create policy credential_records_insert on public.credential_records for insert to authenticated with check (private.is_admin());
create policy credential_records_update on public.credential_records for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy credential_records_delete on public.credential_records for delete to authenticated using (private.is_admin());

create policy filings_select on public.filing_tasks for select to authenticated using (private.can_read());
create policy filings_insert on public.filing_tasks for insert to authenticated with check (private.can_write());
create policy filings_update on public.filing_tasks for update to authenticated using (private.can_write()) with check (private.can_write());
create policy filings_delete on public.filing_tasks for delete to authenticated using (private.is_admin());

create policy issues_select on public.taxpayer_issues for select to authenticated using (private.can_read());
create policy issues_insert on public.taxpayer_issues for insert to authenticated with check (private.can_write());
create policy issues_update on public.taxpayer_issues for update to authenticated using (private.can_write()) with check (private.can_write());
create policy issues_delete on public.taxpayer_issues for delete to authenticated using (private.is_admin());

create policy requirements_select on public.document_requirements for select to authenticated using (private.can_read());
create policy requirements_insert on public.document_requirements for insert to authenticated with check (private.can_write());
create policy requirements_update on public.document_requirements for update to authenticated using (private.can_write()) with check (private.can_write());
create policy requirements_delete on public.document_requirements for delete to authenticated using (private.is_admin());

create policy documents_select on public.documents for select to authenticated using (private.can_read());
create policy documents_insert on public.documents for insert to authenticated with check (private.can_write());
create policy documents_delete on public.documents for delete to authenticated using (private.can_write());

create policy dq_select on public.data_quality_flags for select to authenticated using (private.can_read());
create policy dq_write on public.data_quality_flags for all to authenticated using (private.can_write()) with check (private.can_write());

create policy activity_select on public.activity_logs for select to authenticated using (private.is_admin());
create policy activity_insert on public.activity_logs for insert to authenticated
with check (actor_id = (select auth.uid()));

create policy import_batches_select on public.import_batches for select to authenticated using (private.is_admin());

-- Explicit Data API grants (new Supabase projects may not expose new tables automatically).
grant usage on schema public to authenticated;
grant select on public.app_users to authenticated;
grant select,insert,update,delete on public.taxpayers, public.contacts, public.filing_tasks, public.taxpayer_issues, public.document_requirements, public.documents, public.data_quality_flags to authenticated;
grant select on public.credential_records, public.activity_logs, public.import_batches to authenticated;
grant insert on public.activity_logs to authenticated;
grant usage, select on sequence public.activity_logs_id_seq to authenticated;

-- Server-only Vault bridge. These functions are callable only using a server secret/service role.
-- The browser never receives access to vault.decrypted_secrets.
create or replace function public.store_taxpayer_credential(
  p_taxpayer_id uuid,
  p_kind text,
  p_label text,
  p_secret text
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, vault
as $$
declare
  v_record_id uuid;
  v_secret_id uuid;
  v_existing uuid;
begin
  if p_secret is null or length(p_secret)=0 then
    raise exception 'Secret cannot be empty';
  end if;

  select vault_secret_id into v_existing
  from public.credential_records
  where taxpayer_id=p_taxpayer_id and kind=p_kind and label=p_label;

  if v_existing is not null then
    perform vault.update_secret(v_existing, p_secret, null, null);
    update public.credential_records set updated_at=now()
    where taxpayer_id=p_taxpayer_id and kind=p_kind and label=p_label
    returning id into v_record_id;
    return v_record_id;
  end if;

  select vault.create_secret(
    p_secret,
    concat('member-wp:',p_taxpayer_id::text,':',p_kind,':',replace(lower(p_label),' ','-')),
    concat('Member WP credential: ',p_label)
  ) into v_secret_id;

  insert into public.credential_records(taxpayer_id,kind,label,vault_secret_id)
  values(p_taxpayer_id,p_kind,p_label,v_secret_id)
  returning id into v_record_id;
  return v_record_id;
end;
$$;
revoke all on function public.store_taxpayer_credential(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.store_taxpayer_credential(uuid,text,text,text) to service_role;

create or replace function public.read_taxpayer_credential(p_credential_id uuid)
returns text
language sql
security definer
set search_path = pg_catalog, public, vault
as $$
  select v.decrypted_secret
  from public.credential_records c
  join vault.decrypted_secrets v on v.id=c.vault_secret_id
  where c.id=p_credential_id;
$$;
revoke all on function public.read_taxpayer_credential(uuid) from public, anon, authenticated;
grant execute on function public.read_taxpayer_credential(uuid) to service_role;

-- Private Storage bucket for uploaded documents.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('member-wp-documents','member-wp-documents',false,15728640,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy member_wp_storage_select on storage.objects for select to authenticated
using (bucket_id='member-wp-documents' and private.can_read());
create policy member_wp_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='member-wp-documents' and private.can_write());
create policy member_wp_storage_update on storage.objects for update to authenticated
using (bucket_id='member-wp-documents' and private.can_write())
with check (bucket_id='member-wp-documents' and private.can_write());
create policy member_wp_storage_delete on storage.objects for delete to authenticated
using (bucket_id='member-wp-documents' and private.is_admin());
