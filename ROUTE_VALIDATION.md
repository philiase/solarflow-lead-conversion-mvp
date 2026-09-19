# Route Validation

This file records the route tests used to verify the local n8n workflow and Supabase state changes.

## Test Environment

Local n8n workflow:

```text
Solar Lead Conversion MVP
```

Production webhook:

```text
http://localhost:5678/webhook/solar-lead-message
```

Test webhook:

```text
http://localhost:5678/webhook-test/solar-lead-message
```

In n8n test mode, click `Execute workflow` before each request. The test listener normally accepts one request and then turns off again.

## Fixtures

Use:

```text
tests/route-validation-fixtures.json
```

Use a fresh `channel_user_id` when rerunning a case so old Supabase memory does not affect the result.

## Historical Route Results

Before the post-qualification control layer was added, all four terminal routes passed through the real webhook and Supabase architecture:

- HOT -> `BOOKED`, score 90
- WARM -> `NURTURE`, score 45
- COLD -> `COLD`, score 30
- HUMAN_REVIEW -> `HUMAN_REVIEW`, score 70, outside service area

## Production Smoke Test

Validated on 2026-08-31 against the production webhook after the notification payload type was corrected:

- HOT -> `BOOKED`, score 90 (`prod2_hot_20260831195409`)
- WARM -> `NURTURE`, score 45 (`prod2_warm_20260831195409`)
- COLD -> `COLD`, score 30 (`prod2_cold_20260831195409`)
- HUMAN_REVIEW -> `HUMAN_REVIEW`, score 70, outside service area (`prod2_human_20260831195409`)

These results were captured before HUMAN_REVIEW was changed to transition into `HUMAN_TAKEOVER`.

## Validated Fixes

- Qualified leads are marked `QUALIFIED` and persisted before scoring.
- Terminal branches persist score, temperature, status, and booking details where relevant.
- HUMAN_REVIEW routing sends true matches to the human-review branch.
- Terminal Set nodes preserve incoming fields before responding.
- Primary-goal extraction handles backup, bill reduction, and price-research language.
- Currency-formatted electricity spend is normalized before Supabase update.
- HOT and HUMAN_REVIEW branches prepare salesperson notification payloads before final persistence.
- HOT and HUMAN_REVIEW Gmail notifications were delivered and confirmed.
- Gmail send nodes retry once, continue on failure, and restore the original lead context with `sales_notification_status` set to `SENT` or `FAILED`.
- Supabase and OpenRouter nodes retry once before surfacing an n8n execution failure.

## Control-Layer Validation

Validated on 2026-09-03:

- HOT fresh lead returned `BOOKED`, `HOT`, score 90 (`test_control_hot_20260903014208`).
- WARM fresh lead returned `NURTURE`, `WARM`, score 50 (`test_control_warm_low_20260903014244`).
- HUMAN_REVIEW fresh lead returned `HUMAN_TAKEOVER`, `HUMAN_REVIEW`, score 70, with `human_takeover=true` (`test_control_human_20260903014208`).
- Existing WARM lead with stop language returned `AUTOMATION_STOPPED` with `customer_stop_intent` and `consent_opted_out`.
- Existing BOOKED lead returned `AUTOMATION_STOPPED` with `lead_status_booked`.
- The WARM nurture scheduler JSON validated successfully.
- Scheduler gate and update code passed isolated local simulation for due, opt-out, future, and max-attempt leads.

The scheduler remains inactive until manual live execution is approved against a known safe due lead.
