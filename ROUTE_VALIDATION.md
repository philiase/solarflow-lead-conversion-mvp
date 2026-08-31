# Route Validation

Validated on 2026-08-31 against the local n8n Docker workflow `Solar Lead Conversion MVP`.

## Result

All four terminal routes passed through the real webhook and Supabase architecture:

- HOT -> BOOKED, score 90
- WARM -> NURTURE, score 45
- COLD -> COLD, score 30
- HUMAN_REVIEW -> HUMAN_REVIEW, score 70, outside service area

## Test Mode

The current test URL is:

```powershell
http://localhost:5678/webhook-test/solar-lead-message
```

In n8n test mode, click **Execute workflow** before each request. The listener usually accepts one request and then turns off again.

## Fixtures

Use `tests/route-validation-fixtures.json` for the payloads and expected high-level responses. Use a fresh `channel_user_id` when rerunning a case to avoid existing Supabase memory affecting the result.

## Validated Fixes

- Qualified leads are marked `QUALIFIED` and persisted before scoring.
- Terminal branches persist score, temperature, status, and booking details where relevant.
- HUMAN_REVIEW routing now sends true matches to the human-review branch.
- Terminal Set nodes preserve incoming fields before responding.
- Primary-goal extraction has prompt examples and deterministic fallbacks for backup, bill reduction, and price-research language.
- Currency-formatted electricity spend has a deterministic numeric fallback before Supabase update.
- HOT and HUMAN_REVIEW branches prepare salesperson notification payloads before final persistence.
- HOT and HUMAN_REVIEW branches now send Gmail notifications before final persistence and webhook response.
- HOT Gmail delivery was confirmed from the inbox after the `test_hot_gmail_003` run.
- HUMAN_REVIEW Gmail delivery was confirmed after the `test_human_gmail_001` run.
- Gmail send nodes now retry once, continue on failure, and restore the original lead context with `sales_notification_status` set to `SENT` or `FAILED`.
- Supabase and OpenRouter external nodes now retry once before surfacing an n8n execution failure.

## Notification Status

- HOT Gmail delivery validated.
- HUMAN_REVIEW Gmail delivery validated.

## Production Smoke Test

Validated on 2026-08-31 against:

```powershell
http://localhost:5678/webhook/solar-lead-message
```

All four production webhook cases passed after the notification payload type was corrected in the active workflow:

- HOT -> BOOKED, score 90 (`prod2_hot_20260831195409`)
- WARM -> NURTURE, score 45 (`prod2_warm_20260831195409`)
- COLD -> COLD, score 30 (`prod2_cold_20260831195409`)
- HUMAN_REVIEW -> HUMAN_REVIEW, score 70, outside service area (`prod2_human_20260831195409`)
