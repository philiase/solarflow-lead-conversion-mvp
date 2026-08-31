# SolarFlow SA Lead Conversion MVP

SolarFlow SA is a local n8n MVP for qualifying inbound residential solar leads. It receives customer messages through a webhook, extracts structured lead information, stores persistent lead memory in Supabase, asks for missing qualification details, applies deterministic scoring, and routes each lead into HOT, WARM, COLD, or HUMAN_REVIEW outcomes.

## Current validated workflow

The n8n workflow `Solar Lead Conversion MVP` has been validated through the local webhook and Supabase path for:

- HOT
- WARM
- COLD
- HUMAN_REVIEW

Use `ROUTE_VALIDATION.md` and `route-validation-fixtures.json` for the passing route tests.

## Repository Layout

- `workflows/solar-lead-conversion-mvp.cleaned.json` is the current cleaned n8n workflow export.
- `workflows/solar-lead-conversion-mvp.validated-baseline.json` keeps the passing pre-cleanup baseline.
- `tests/route-validation-fixtures.json` contains the validated webhook payloads and expected route outcomes.
- `docs/SolarFlow_SA_Project_Source_of_Truth.md` contains the full project source of truth.
- `scripts/maintenance/` contains repeatable workflow patch scripts used during cleanup.

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
