create table if not exists public.member_wp_archives (
  id uuid primary key,
  taxpayer_id text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  category text not null default 'Lainnya',
  note text not null default '',
  uploaded_at timestamptz not null default now()
);

create index if not exists member_wp_archives_taxpayer_idx
  on public.member_wp_archives (taxpayer_id, uploaded_at desc);

alter table public.member_wp_archives enable row level security;
revoke all on public.member_wp_archives from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-wp-archives',
  'member-wp-archives',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'text/xml',
    'application/xml',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
