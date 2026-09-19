# Business Rules

## Required Qualification Fields

- `name`
- `location`
- `property_type`
- `ownership_status`
- `monthly_electricity_spend`
- `primary_goal`
- `existing_equipment`
- `timeline`
- `payment_preference`

`critical_loads` is useful context but does not currently block qualification.

## Normalized Values

Intent:

```text
NEW_INSTALL, BACKUP_ONLY, UPGRADE, PRICE_ONLY, SERVICE_SUPPORT, OTHER
```

Timeline:

```text
ASAP, 0-30 days, 1-3 months, 3+ months, Researching, Unknown
```

Payment preference:

```text
Cash, Finance, Either, Unknown
```

## Lead Lifecycle

```text
NEW -> QUALIFYING -> QUALIFIED -> HOT/WARM/COLD/HUMAN_REVIEW -> BOOKED/NURTURE/HUMAN_TAKEOVER/CLOSED
```

`intent` describes what the customer wants. `lead_status` describes where the lead is in the process.

## Consent and Follow-Up

Consent values:

```text
UNKNOWN, OPTED_IN, OPTED_OUT
```

Follow-up values:

```text
NOT_STARTED, ACTIVE, STOPPED, COMPLETE
```

## Service Area

V1 service areas:

- Midrand
- Johannesburg
- Pretoria
- Centurion

The model extracts the location. JavaScript decides whether the lead is in the current service area.

## Scoring

- Inside service area: +20
- Property owner: +15
- Monthly electricity spend of at least R2,000: +15
- Timeline ASAP or 0-30 days: +20
- Timeline 1-3 months: +10
- Clear solar requirement: +10
- Payment path identified: +10

Maximum score: 90.

Thresholds:

- HOT: 60+
- WARM: 35-59
- COLD: below 35
- HUMAN_REVIEW can override the score when manual review is required.

## Post-Qualification Actions

- HOT leads move to `BOOKED` and follow-up automation stops.
- WARM leads move to `NURTURE` and receive a first follow-up due date two days later.
- COLD leads move to `COLD` and follow-up automation stops.
- HUMAN_REVIEW leads move to `HUMAN_TAKEOVER`, notify sales, and stop automation.

## Automation Stop Conditions

Automated qualification or nurture stops when:

- `consent_status` is `OPTED_OUT`
- `lead_status` is `BOOKED`, `CLOSED`, or `HUMAN_TAKEOVER`
- `human_takeover` is `true`
- the latest customer message clearly asks to stop, says they are no longer interested, or says a team member has already taken over

## Model Boundaries

The model may interpret messages, extract fields, and summarize information. It must not invent facts, size solar systems, produce quotations, approve finance, promise installation dates, or replace deterministic scoring.
