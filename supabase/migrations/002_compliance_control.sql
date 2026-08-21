-- Member WP v0.2 — Compliance Control Center
-- Adds admin-configured obligations, period controls, timeline notes and attention items.
-- IMPORTANT: no legal/tax obligation is inferred automatically from taxpayer type.

create type public.obligation_cadence as enum ('monthly','annual','other');
create type public.compliance_task_status as enum ('not_started','waiting_documents','in_progress','waiting_review','waiting_client','blocked','completed','not_applicable');
create type public.note_category as enum ('general','tax','document','payment','coretax','client','internal','important');
create type public.attention_priority as enum ('low','medium','high','critical');
create type public.attention_status as enum ('open','in_progress','waiting','resolved');

create table public.compliance_obligations (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  code text not null,
  label text not null,
  cadence public.obligation_cadence not null,
  active boolean not null default true,
  effective_from date,
  effective_to date,
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(taxpayer_id, code, cadence)
);
create index compliance_obligations_taxpayer_idx on public.compliance_obligations(taxpayer_id,active);

create table public.compliance_period_tasks (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  obligation_id uuid not null references public.compliance_obligations(id) on delete cascade,
  period_year smallint not null,
  period_month smallint check (period_month between 1 and 12),
  due_date date,
  status public.compliance_task_status not null default 'not_started',
  assigned_to uuid references public.app_users(id) on delete set null,
  reviewed_by uuid references public.app_users(id) on delete set null,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (obligation_id, period_year, period_month)
);
create index compliance_tasks_period_idx on public.compliance_period_tasks(period_year,period_month,status);
create index compliance_tasks_taxpayer_idx on public.compliance_period_tasks(taxpayer_id,status);
create index compliance_tasks_due_idx on public.compliance_period_tasks(due_date) where status <> 'completed';

create table public.taxpayer_notes (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  category public.note_category not null default 'general',
  note_text text not null check (length(trim(note_text)) > 0),
  pinned boolean not null default false,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index taxpayer_notes_taxpayer_idx on public.taxpayer_notes(taxpayer_id, pinned desc, created_at desc);

create table public.attention_items (
  id uuid primary key default gen_random_uuid(),
  taxpayer_id uuid references public.taxpayers(id) on delete cascade,
  source_type text not null default 'manual' check (source_type in ('manual','compliance','issue','document','system')),
  source_id uuid,
  title text not null,
  description text,
  priority public.attention_priority not null default 'medium',
  status public.attention_status not null default 'open',
  due_date date,
  assigned_to uuid references public.app_users(id) on delete set null,
  created_by uuid references public.app_users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index attention_open_idx on public.attention_items(status,priority,due_date);
create index attention_taxpayer_idx on public.attention_items(taxpayer_id,status);

create trigger compliance_obligations_updated before update on public.compliance_obligations for each row execute function public.set_updated_at();
create trigger compliance_period_tasks_updated before update on public.compliance_period_tasks for each row execute function public.set_updated_at();
create trigger taxpayer_notes_updated before update on public.taxpayer_notes for each row execute function public.set_updated_at();
create trigger attention_items_updated before update on public.attention_items for each row execute function public.set_updated_at();

alter table public.compliance_obligations enable row level security;
alter table public.compliance_period_tasks enable row level security;
alter table public.taxpayer_notes enable row level security;
alter table public.attention_items enable row level security;

create policy obligations_select on public.compliance_obligations for select to authenticated using (private.can_read());
create policy obligations_insert on public.compliance_obligations for insert to authenticated with check (private.can_write());
create policy obligations_update on public.compliance_obligations for update to authenticated using (private.can_write()) with check (private.can_write());
create policy obligations_delete on public.compliance_obligations for delete to authenticated using (private.is_admin());

create policy compliance_tasks_select on public.compliance_period_tasks for select to authenticated using (private.can_read());
create policy compliance_tasks_insert on public.compliance_period_tasks for insert to authenticated with check (private.can_write());
create policy compliance_tasks_update on public.compliance_period_tasks for update to authenticated using (private.can_write()) with check (private.can_write());
create policy compliance_tasks_delete on public.compliance_period_tasks for delete to authenticated using (private.is_admin());

create policy notes_select on public.taxpayer_notes for select to authenticated using (private.can_read());
create policy notes_insert on public.taxpayer_notes for insert to authenticated with check (private.can_write());
create policy notes_update on public.taxpayer_notes for update to authenticated using (private.can_write()) with check (private.can_write());
create policy notes_delete on public.taxpayer_notes for delete to authenticated using (private.can_write());

create policy attention_select on public.attention_items for select to authenticated using (private.can_read());
create policy attention_insert on public.attention_items for insert to authenticated with check (private.can_write());
create policy attention_update on public.attention_items for update to authenticated using (private.can_write()) with check (private.can_write());
create policy attention_delete on public.attention_items for delete to authenticated using (private.is_admin());

grant select,insert,update,delete on public.compliance_obligations, public.compliance_period_tasks, public.taxpayer_notes, public.attention_items to authenticated;

-- Optional starter catalog for the UI only. This is NOT a legal determination.
create table public.obligation_catalog (
  code text primary key,
  label text not null,
  default_cadence public.obligation_cadence not null,
  active boolean not null default true,
  sort_order integer not null default 100
);
alter table public.obligation_catalog enable row level security;
create policy obligation_catalog_select on public.obligation_catalog for select to authenticated using (private.can_read());
create policy obligation_catalog_admin on public.obligation_catalog for all to authenticated using (private.is_admin()) with check (private.is_admin());
grant select,insert,update,delete on public.obligation_catalog to authenticated;

insert into public.obligation_catalog(code,label,default_cadence,sort_order) values
('PPH21','PPh 21','monthly',10),
('PPH23','PPh 23','monthly',20),
('PPH25','PPh 25','monthly',30),
('PPN','PPN','monthly',40),
('PPH_FINAL','PPh Final','monthly',50),
('SPT_TAHUNAN_BADAN','SPT Tahunan Badan','annual',110),
('SPT_TAHUNAN_OP','SPT Tahunan OP','annual',120),
('LAPORAN_KEUANGAN','Laporan Keuangan Tahunan','annual',130)
on conflict (code) do nothing;

comment on table public.compliance_obligations is 'Admin-confirmed obligations per taxpayer. Do not infer automatically from taxpayer type.';
comment on table public.obligation_catalog is 'UI catalog only; presence here does not mean a taxpayer has the obligation.';
