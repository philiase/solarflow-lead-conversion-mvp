# SolarFlow SA Lead Conversion MVP

SolarFlow SA is a local lead-conversion MVP for South African residential solar installers. It receives inbound enquiries, extracts structured lead details, stores lead memory in Supabase, applies deterministic qualification and scoring rules, routes leads into sales outcomes, and sends salesperson notifications for high-priority cases.

## What It Does

- Receives inbound lead messages through an n8n production webhook.
- Preserves lead memory across multiple messages using Supabase.
- Extracts customer details from natural-language messages.
- Checks missing qualification fields.
- Applies service-area and scoring rules in deterministic JavaScript.
- Routes leads as HOT, WARM, COLD, or HUMAN_REVIEW.
- Simulates consultation booking for HOT leads.
- Sends Gmail notifications for HOT and HUMAN_REVIEW leads.
- Provides a local website form that forwards submissions into the workflow.

## Current Status

The production workflow is active locally and has passed smoke tests for:

- HOT -> BOOKED, score 90
- WARM -> NURTURE, score 45
- COLD -> COLD, score 30
- HUMAN_REVIEW -> HUMAN_REVIEW, score 70, outside service area

The local website-form inbound has also passed an end-to-end smoke test through the production n8n webhook.

## Project Layout

- `workflows/solar-lead-conversion-mvp.cleaned.json` - current n8n workflow export.
- `workflows/solar-lead-conversion-mvp.validated-baseline.json` - earlier passing baseline export.
- `website-form/` - local browser form and proxy server for inbound lead capture.
- `tests/route-validation-fixtures.json` - route test payloads and expected outcomes.
- `scripts/maintenance/` - repeatable workflow patch scripts.
- `docs/SolarFlow_SA_Project_Source_of_Truth.md` - detailed project reference.
- `BUSINESS_RULES.md`, `DATA_SCHEMA.md`, `WORKFLOW.md`, `AI_PROMPTS.md`, `DECISIONS.md`, `CURRENT_STATUS.md`, and `ROUTE_VALIDATION.md` - project rules, workflow notes, and validation history.

## Local Services

n8n runs locally at:

```text
http://localhost:5678
```

Production webhook:

```text
http://localhost:5678/webhook/solar-lead-message
```

Test webhook:

```text
http://localhost:5678/webhook-test/solar-lead-message
```

In test mode, click **Execute workflow** in n8n before sending a request.

## Website Form

Start the local website form:

```powershell
$env:SOLARFLOW_FORM_ACCESS_CODE = "change-this-before-sharing"
node .\website-form\server.js
```

Open:

```text
http://localhost:8080
```

The form forwards valid submissions to the production webhook and uses `website_<contact>` as the lead `channel_user_id`.

Website-form logs are written to:

```text
website-form/logs/events.jsonl
```

The log captures malformed JSON, rejected access codes, browser errors, n8n webhook responses, and upstream webhook failures. Access codes are redacted before logging.

## Temporary Public Link

To expose the local website form temporarily:

```powershell
npx localtunnel --port 8080
```

The command prints a public URL. The link only works while the local form server, n8n, and the tunnel process are running.

## Notes

- Gmail notifications use the n8n credential named `Gmail account`.
- Gmail sends retry once and continue to final lead persistence even if notification delivery fails.
- OpenRouter and Supabase nodes retry once before surfacing a workflow failure.
- The current booking step is simulated. Google Calendar integration is a later milestone.
