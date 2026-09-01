# SolarFlow SA Lead Conversion MVP

SolarFlow SA is a local n8n MVP for qualifying inbound residential solar leads. It receives customer messages through a webhook, extracts structured lead information, stores persistent lead memory in Supabase, asks for missing qualification details, applies deterministic scoring, and routes each lead into HOT, WARM, COLD, or HUMAN_REVIEW outcomes.

## Current validated workflow

The n8n workflow `Solar Lead Conversion MVP` has been validated through the local webhook and Supabase path for:

- HOT
- WARM
- COLD
- HUMAN_REVIEW

Use `ROUTE_VALIDATION.md` and `route-validation-fixtures.json` for the passing route tests.

The production webhook has also passed a smoke test for all four terminal routes.

## Repository Layout

- `workflows/solar-lead-conversion-mvp.cleaned.json` is the current cleaned n8n workflow export.
- `workflows/solar-lead-conversion-mvp.validated-baseline.json` keeps the passing pre-cleanup baseline.
- `tests/route-validation-fixtures.json` contains the validated webhook payloads and expected route outcomes.
- `website-form/` contains the local website-form inbound that forwards submissions to the production n8n webhook.
- `docs/SolarFlow_SA_Project_Source_of_Truth.md` contains the full project source of truth.
- `scripts/maintenance/` contains repeatable workflow patch scripts used during cleanup.

The current workflow sends Gmail salesperson notifications for HOT and HUMAN_REVIEW leads using the n8n credential named `Gmail account`. HOT and HUMAN_REVIEW email delivery have both been validated. Gmail sends retry once and continue to final lead persistence even if notification delivery fails.

## Local n8n

The local Docker setup exposes n8n at:

```text
http://localhost:5678
```

The workflow test webhook is:

```text
http://localhost:5678/webhook-test/solar-lead-message
```

In test mode, click **Execute workflow** in n8n before sending a request.

When the workflow is active, the production webhook is:

```text
http://localhost:5678/webhook/solar-lead-message
```

## Website Form Inbound

Run the local website form with:

```powershell
node .\website-form\server.js
```

Then open:

```text
http://localhost:8080
```

The form forwards submissions to the production webhook and uses `website_<contact>` as the lead `channel_user_id`.

Set `SOLARFLOW_FORM_ACCESS_CODE` before temporarily sharing the local form through a tunnel.
