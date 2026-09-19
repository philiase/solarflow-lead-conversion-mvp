# SolarFlow SA Project Source of Truth

This document is the working reference for the SolarFlow SA MVP. It describes the current business scope, workflow, data model, routing rules, and known limits.

## Project Overview

SolarFlow SA is a local lead-conversion system for South African residential solar installers. It receives inbound customer messages, extracts useful lead information, saves the lead state in Supabase, asks for missing qualification details, and routes the lead once enough information has been collected.

The system is designed for inbound enquiries. It is not a cold-outreach scraper, quotation engine, solar sizing tool, or full CRM.

## Market and Scope

- Country: South Africa
- Niche: residential solar installers
- Simulated company: SolarFlow SA
- Initial service area: Midrand, Johannesburg, Pretoria, and Centurion
- Main conversion event: qualified customer moves toward a consultation or site assessment

Version 1 focuses on qualification, routing, memory, notifications, and controlled follow-up state.

## What Version 1 Includes

- n8n webhook for inbound messages.
- Supabase lead storage keyed by `channel_user_id`.
- Model-based extraction from customer messages.
- Deterministic merge logic that preserves existing values.
- Missing-field detection.
- Next-question generation.
- Service-area validation.
- Lead scoring and route selection.
- HOT, WARM, COLD, and HUMAN_REVIEW outcomes.
- Simulated booking for HOT leads.
- Gmail notifications for HOT and HUMAN_REVIEW leads.
- Consent, follow-up, and human-takeover control fields.
- Separate WARM nurture scheduler workflow.
- Local website form that submits to the production webhook.

## Not Included Yet

- Production WhatsApp integration.
- Google Calendar booking.
- Direct customer follow-up delivery.
- Solar system sizing.
- Final quotations.
- Finance approval.
- Payments.
- Full CRM dashboard.
- Voice agent.
- Predictive lead scoring.
- RAG-based company knowledge answers.

## Tool Stack

- n8n Community Edition: workflow orchestration.
- Docker: local n8n runtime.
- Supabase: persistent lead memory.
- OpenRouter-compatible model: extraction from customer language.
- JavaScript code nodes: validation, merge logic, scoring, and routing.
- Gmail node: internal salesperson notifications.
- Local website form: browser-based inbound test surface.

## Workflow Summary

```text
Incoming Solar Message
Find Existing Lead in Supabase
Lead Exists?
  NO  -> Create New Lead
  YES -> Check Automation Stop Conditions
          Can Qualification Continue?
            YES -> continue with existing lead
            NO  -> persist stop state and respond AUTOMATION_STOPPED
Basic LLM Chain
Merge Supabase Lead + AI Update
Find Missing Qualification Fields
Update Lead Memory
Qualification Complete?
  NO  -> ask the next missing question
  YES -> mark qualified, apply rules, score, route, persist final state
```

One customer message equals one n8n execution. Supabase keeps the conversation state between executions.

## Input Contract

Webhook payload:

```json
{
  "channel_user_id": "test_customer_001",
  "customer_message": "Hi, I own a house in Midrand and spend around R3,200 a month on electricity."
}
```

Production webhook:

```text
http://localhost:5678/webhook/solar-lead-message
```

Test webhook:

```text
http://localhost:5678/webhook-test/solar-lead-message
```

The website form submits the same two fields to the production webhook.

## Lead Fields

Core qualification fields:

```text
name
location
property_type
ownership_status
monthly_electricity_spend
primary_goal
existing_equipment
timeline
payment_preference
```

Useful optional field:

```text
critical_loads
```

State and route fields:

```text
intent
in_service_area
lead_score
lead_temperature
qualification_complete
next_missing_field
lead_status
booking_status
appointment_date
appointment_time
```

Post-qualification control fields:

```text
consent_status
follow_up_status
next_follow_up_at
follow_up_count
last_follow_up_at
human_takeover
assigned_to
takeover_at
takeover_reason
```

## Normalized Values

Intent:

```text
NEW_INSTALL
BACKUP_ONLY
UPGRADE
PRICE_ONLY
SERVICE_SUPPORT
OTHER
```

Timeline:

```text
ASAP
0-30 days
1-3 months
3+ months
Researching
Unknown
```

Payment preference:

```text
Cash
Finance
Either
Unknown
```

Property type:

```text
House
Townhouse
Apartment
Other
Unknown
```

Ownership:

```text
Owner
Renter
Other
Unknown
```

Consent:

```text
UNKNOWN
OPTED_IN
OPTED_OUT
```

Follow-up:

```text
NOT_STARTED
ACTIVE
STOPPED
COMPLETE
```

## Merge Rule

The model extracts only new or corrected information from the latest message.

If a model field is `null`, empty, or missing, the workflow treats that as "not mentioned in this message." It must not erase a valid value that is already stored in Supabase.

## Qualification Rule

Qualification is complete when all required fields have usable values. `Unknown` can be a valid answer when the customer is explicitly unsure. It should not automatically count as missing.

`critical_loads` is helpful context but is not required in V1.

## Scoring

Current simulated scoring rules:

```text
Inside service area                      +20
Property owner                           +15
Monthly electricity spend >= R2,000      +15
Timeline ASAP or 0-30 days               +20
Timeline 1-3 months                      +10
Clear solar requirement                  +10
Payment path identified                  +10
```

Maximum current score: 90.

Thresholds:

```text
HOT     60+
WARM    35-59
COLD    below 35
```

HUMAN_REVIEW can override the score when the lead should not continue through the automated sales path.

## Route Outcomes

HOT:

- Sets `lead_status` to `BOOKED`.
- Sets `lead_temperature` to `HOT`.
- Stores simulated booking details.
- Stops follow-up automation.
- Sends a salesperson Gmail notification.

WARM:

- Sets `lead_status` to `NURTURE`.
- Sets `lead_temperature` to `WARM`.
- Sets `follow_up_status` to `ACTIVE`.
- Schedules `next_follow_up_at` for two days later.

COLD:

- Sets `lead_status` to `COLD`.
- Sets `lead_temperature` to `COLD`.
- Stops follow-up automation.

HUMAN_REVIEW:

- Sets `lead_status` to `HUMAN_TAKEOVER`.
- Sets `lead_temperature` to `HUMAN_REVIEW`.
- Sets `human_takeover` to `true`.
- Stores takeover metadata.
- Stops follow-up automation.
- Sends a salesperson Gmail notification.

## Automation Stop Gate

Existing leads are checked before the workflow sends them back through the model.

Automation stops when:

- `consent_status` is `OPTED_OUT`
- `lead_status` is `BOOKED`, `CLOSED`, or `HUMAN_TAKEOVER`
- `human_takeover` is `true`
- the latest customer message clearly asks to stop
- the latest customer message says the customer is no longer interested
- the latest customer message says someone from the team already called or took over

When blocked, the workflow persists the stop state and returns `AUTOMATION_STOPPED`.

## WARM Nurture Scheduler

The WARM scheduler is a separate n8n workflow:

```text
workflows/solarflow-warm-nurture-scheduler.json
```

Current V1 flow:

```text
Schedule Trigger
Find Active Nurture Leads
Can Automation Continue?
Prepare WARM Follow-up
Send WARM Follow-up Task
Restore WARM Nurture Context
Update Nurture Schedule
```

The scheduler looks for leads where:

- `lead_status` is `NURTURE`
- `follow_up_status` is `ACTIVE`
- `next_follow_up_at` is due
- `consent_status` is not `OPTED_OUT`
- `human_takeover` is `false`
- follow-up count is still within the allowed attempt limit

Because the project does not yet have a real customer messaging channel for nurture, the scheduler creates an internal Gmail follow-up task instead of claiming a customer message was sent.

## Booking

HOT leads currently use simulated booking details:

```text
booking_status = BOOKED
appointment_date = 2026-08-22
appointment_time = 10:00
appointment_type = Solar Consultation
booking_source = SIMULATED
```

Google Calendar integration is planned for a later milestone.

## Notifications

HOT and HUMAN_REVIEW branches prepare structured salesperson notification payloads and send them through Gmail.

Gmail failures are recorded but do not block final lead persistence or the webhook response.

## Website Form

The local website form runs at:

```text
http://localhost:8080
```

It forwards submissions to:

```text
http://localhost:5678/webhook/solar-lead-message
```

Logs are written to:

```text
website-form/logs/events.jsonl
```

The log captures malformed JSON, rejected access codes, browser errors, n8n webhook responses, and upstream webhook failures.

## Current Validation Position

The main workflow has been validated for HOT, WARM, COLD, and HUMAN_REVIEW routes. The control layer has also been tested for normal terminal routes and automation-stop cases.

The WARM scheduler workflow is imported but inactive. It should only be run live against a known safe due lead after the send target is confirmed.

## Design Principles

- Keep the business rules deterministic.
- Use the model for language extraction, not final decisions.
- Keep Supabase as the source of truth for lead state.
- Do not let `null` model output erase stored information.
- Ask only for missing qualification details.
- Separate qualification from lead quality.
- Stop automation when consent, booking, closure, or human takeover requires it.
- Keep the MVP focused until the next integration is justified.
