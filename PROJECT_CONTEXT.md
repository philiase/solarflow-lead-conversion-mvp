# Project Context

## Overview

SolarFlow SA is a lead-conversion MVP for South African residential solar installers. It is designed to receive inbound enquiries, qualify prospects, store lead memory, and route each lead to the next practical action.

The project is not a general chatbot or a cold-outreach tool. It focuses on inbound qualification for residential solar enquiries.

## Market

- Country: South Africa
- Niche: residential solar installers
- Initial service area: Gauteng
- Current test areas: Midrand, Johannesburg, Pretoria, and Centurion

## Core Journey

```text
Inbound enquiry
Extract structured information
Store or update lead memory
Ask for missing qualification details
Apply business rules
Score the lead
Route to booking, nurture, cold, or human takeover
```

## Current MVP Scope

- Inbound customer message handling.
- Model-based information extraction.
- Persistent lead memory in Supabase.
- Missing-field detection.
- Next-question generation.
- Deterministic service-area logic.
- Deterministic lead scoring.
- HOT, WARM, COLD, and HUMAN_REVIEW routing.
- Simulated booking.
- Structured salesperson summaries.
- Gmail notifications for HOT and HUMAN_REVIEW cases.
- Consent and automation-stop state.
- WARM nurture scheduling workflow.
- Local website form with access-code protection and diagnostic logs.

## Not Included Yet

- Production WhatsApp integration.
- Google Calendar booking.
- Direct customer follow-up delivery.
- Quotation engine.
- Solar system sizing.
- Finance approval.
- Payments.
- Custom dashboard.
- Voice agent.
- Multi-niche support.
- Predictive scoring.
- RAG-based knowledge answers.
