# Current Status

## Completed

- n8n Community Edition is running locally in Docker.
- The main qualification workflow is built around the production webhook.
- Supabase stores lead memory across separate customer messages.
- The workflow can create new leads, find existing leads, merge new information, and preserve existing values when the model returns `null`.
- Missing-field detection and next-question generation are working.
- Lead scoring, service-area checks, and terminal routing are handled in JavaScript.
- HOT, WARM, COLD, and HUMAN_REVIEW routes have been tested through the webhook and Supabase.
- HOT and HUMAN_REVIEW branches send structured Gmail notifications.
- Gmail failures are recorded without blocking final lead persistence.
- OpenRouter and Supabase nodes retry once before failing the workflow.
- The local website form forwards submissions into the production webhook.
- Supabase control fields have been added for consent, nurture follow-up, and human takeover.
- Existing leads pass through an automation-stop gate before further qualification.
- A separate WARM nurture scheduler workflow has been imported locally and left inactive for controlled testing.

## Current Architecture

```text
Incoming Solar Message
Find Existing Lead
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
  NO  -> ask next question and end
  YES -> mark qualified, score, route, persist terminal state, respond
```

## Current Files

- `workflows/solar-lead-conversion-mvp.cleaned.json` - main workflow export.
- `workflows/solarflow-warm-nurture-scheduler.json` - WARM nurture scheduler export.
- `supabase/add_post_qualification_control_fields.sql` - database migration for the control-layer fields.
- `tests/route-validation-fixtures.json` - route test fixtures.
- `ROUTE_VALIDATION.md` - validation notes and test history.
- `archive/n8n-control-layer/` - recent workflow backups and helper scripts.

## Local-Only Work

The website-form logging changes and temporary scheduler test helpers are local development artifacts unless they are explicitly prepared for release.

## Next Work

The next controlled validation step is the WARM nurture scheduler. It should be tested against one known safe due lead before being activated broadly.
