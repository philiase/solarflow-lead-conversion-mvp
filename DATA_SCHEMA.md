# Data Schema

## Supabase Table: `leads`

Core fields:

- `id` uuid primary key
- `channel_user_id` text unique required
- `name` text
- `location` text
- `property_type` text
- `ownership_status` text
- `monthly_electricity_spend` numeric
- `primary_goal` text
- `existing_equipment` text
- `critical_loads` text
- `timeline` text
- `payment_preference` text
- `intent` text
- `in_service_area` boolean
- `lead_score` integer
- `lead_temperature` text
- `qualification_complete` boolean
- `next_missing_field` text
- `lead_status` text
- `booking_status` text
- `appointment_date` date
- `appointment_time` text
- `created_at` timestamptz
- `updated_at` timestamptz

Post-qualification control fields:

- `consent_status` text default `UNKNOWN`
- `follow_up_status` text default `NOT_STARTED`
- `next_follow_up_at` timestamptz
- `follow_up_count` integer default `0`
- `last_follow_up_at` timestamptz
- `human_takeover` boolean default `false`
- `assigned_to` text
- `takeover_at` timestamptz
- `takeover_reason` text

## Important Distinction

`intent` describes what the customer wants, such as `NEW_INSTALL` or `BACKUP_ONLY`.

`lead_status` describes the process state, such as `QUALIFYING`, `NURTURE`, or `BOOKED`.

## Consent and Automation Control

Allowed consent values:

```text
UNKNOWN, OPTED_IN, OPTED_OUT
```

Allowed follow-up values:

```text
NOT_STARTED, ACTIVE, STOPPED, COMPLETE
```

Automation must not send qualification or follow-up messages when:

- `consent_status` is `OPTED_OUT`
- `lead_status` is `BOOKED`, `CLOSED`, or `HUMAN_TAKEOVER`
- `human_takeover` is `true`

## Workflow-Only Helper Fields

These fields are used inside workflow execution and should not be treated as core database columns unless they are explicitly added later:

- `missing_fields`
- `next_question`
- `score_reasons`
- `customer_reply`
- raw model output

## Merge Rules

Supabase is the persistent source of truth.

The model output represents only new or corrected information from the latest customer message. Non-null model values may update matching stored fields. Null, undefined, and empty values must not overwrite valid stored values.
