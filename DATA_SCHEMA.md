# Data Schema

## Supabase table: leads
- id uuid primary key
- channel_user_id text unique required
- name text
- location text
- property_type text
- ownership_status text
- monthly_electricity_spend numeric
- primary_goal text
- existing_equipment text
- critical_loads text
- timeline text
- payment_preference text
- intent text
- in_service_area boolean
- lead_score integer
- lead_temperature text
- qualification_complete boolean
- next_missing_field text
- lead_status text
- booking_status text
- appointment_date date
- appointment_time text
- consent_status text default UNKNOWN
- follow_up_status text default NOT_STARTED
- next_follow_up_at timestamptz
- follow_up_count integer default 0
- last_follow_up_at timestamptz
- human_takeover boolean default false
- assigned_to text
- takeover_at timestamptz
- takeover_reason text
- created_at timestamptz
- updated_at timestamptz

## Important distinction
intent = what customer wants, e.g. NEW_INSTALL.
lead_status = lifecycle state, e.g. QUALIFYING.

## Consent and automation control
consent_status values:
- UNKNOWN
- OPTED_IN
- OPTED_OUT

follow_up_status values:
- NOT_STARTED
- ACTIVE
- STOPPED
- COMPLETE

Automation must not send follow-up messages when consent_status is OPTED_OUT,
lead_status is BOOKED/CLOSED/HUMAN_TAKEOVER, or human_takeover is true.

## Workflow-only helper fields
- missing_fields
- next_question
- score_reasons
- customer_reply
- raw model output

## Merge semantics
Stored row is persistent source of truth.
LLM output represents only new/corrected information.
Non-null LLM values may overwrite matching stored fields.
Null/undefined/empty LLM values do not overwrite valid stored fields.
