alter table public.leads
  add column if not exists consent_status text default 'UNKNOWN',
  add column if not exists follow_up_status text default 'NOT_STARTED',
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists follow_up_count integer not null default 0,
  add column if not exists last_follow_up_at timestamptz,
  add column if not exists human_takeover boolean not null default false,
  add column if not exists assigned_to text,
  add column if not exists takeover_at timestamptz,
  add column if not exists takeover_reason text;

alter table public.leads
  alter column consent_status set default 'UNKNOWN';

update public.leads
set consent_status = case
  when upper(trim(consent_status)) in ('OPTED_IN', 'OPTED_OUT', 'UNKNOWN')
    then upper(trim(consent_status))
  else 'UNKNOWN'
end
where consent_status is null
  or consent_status != upper(trim(consent_status))
  or upper(trim(consent_status)) not in ('OPTED_IN', 'OPTED_OUT', 'UNKNOWN');

create index if not exists leads_due_nurture_idx
  on public.leads (next_follow_up_at)
  where lead_status = 'NURTURE'
    and human_takeover = false
    and next_follow_up_at is not null;
