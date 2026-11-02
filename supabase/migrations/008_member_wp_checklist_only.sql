-- Member WP v0.11 — checklist only
-- Hapus data sensitif/operasional lama dan sisakan data minimum untuk checklist.

update public.member_wp_single_records
set payload = jsonb_strip_nulls(jsonb_build_object(
  'id', coalesce(payload->'id', to_jsonb(record_id)),
  'name', coalesce(payload->'name', to_jsonb('Tanpa Nama'::text)),
  'type', case when payload->>'type'='BADAN' then to_jsonb('BADAN'::text) else to_jsonb('OP'::text) end,
  'status', case when payload->>'status'='inactive' then to_jsonb('inactive'::text) else to_jsonb('active'::text) end,
  'createdAt', payload->'createdAt',
  'updatedAt', to_jsonb(now()::text)
))
where collection='taxpayers';

delete from public.member_wp_single_records
where collection in ('profiles','notes','activities','meta','tasks');

delete from public.member_wp_single_credentials;
delete from public.member_wp_archives;

with d as (
  select date_trunc('week', timezone('Asia/Makassar', now()))::date as week_start
),
src as (
  select r.record_id, d.week_start, (d.week_start + 6)::date as week_end
  from public.member_wp_single_records r
  cross join d
  where r.collection='taxpayers'
)
insert into public.member_wp_single_records(collection,record_id,payload,updated_at)
select
  'tasks',
  'coretax-weekly-'||week_start::text||'-'||record_id,
  jsonb_build_object(
    'id','coretax-weekly-'||week_start::text||'-'||record_id,
    'taxpayerId',record_id,
    'title','Monitoring Coretax DJP',
    'code','CORETAX_DJP_WEEKLY',
    'kind','weekly_monitoring',
    'cadence','weekly',
    'status','not_started',
    'priority','medium',
    'dueDate',week_end::text,
    'weekStart',week_start::text,
    'weekEnd',week_end::text,
    'completedAt',null,
    'createdAt',now()::text,
    'updatedAt',now()::text
  ),
  now()
from src
on conflict (collection,record_id) do update
set payload=excluded.payload,updated_at=excluded.updated_at;

-- Bucket arsip hanya dihapus di sini bila sudah kosong.
delete from storage.buckets b
where b.id='member-wp-archives'
  and not exists (select 1 from storage.objects o where o.bucket_id=b.id);
