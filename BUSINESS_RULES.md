# Business Rules

## Required qualification fields
- name
- location
- property_type
- ownership_status
- monthly_electricity_spend
- primary_goal
- existing_equipment
- timeline
- payment_preference

critical_loads is useful but does not currently block qualification.

## Allowed intent values
NEW_INSTALL, BACKUP_ONLY, UPGRADE, PRICE_ONLY, SERVICE_SUPPORT, OTHER

## Allowed timeline values
ASAP, 0-30 days, 1-3 months, 3+ months, Researching, Unknown

## Allowed payment values
Cash, Finance, Either, Unknown

## Lead lifecycle
NEW → QUALIFYING → QUALIFIED → HOT/WARM/COLD/HUMAN_REVIEW → BOOKED/NURTURE/CLOSED

intent and lead_status are different concepts.

## Service-area rule
V1 areas:
- Midrand
- Johannesburg
- Pretoria
- Centurion

LLM extracts location. JavaScript decides whether the location is in service area.

## Lead scoring
- Inside service area: +20
- Property owner: +15
- Monthly electricity spend >= R2,000: +15
- Timeline ASAP or 0-30 days: +20
- Timeline 1-3 months: +10
- Clear solar requirement: +10
- Payment path identified: +10

Maximum: 90

## Thresholds
- HOT: 60+
- WARM: 35-59
- COLD: below 35
- HUMAN_REVIEW can override score

## AI boundaries
AI may interpret, extract, clarify, and summarise.
AI may not invent facts, size systems, quote, approve finance, promise installation dates, or replace deterministic scoring.
