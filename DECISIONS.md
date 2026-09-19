# Decision Log

These decisions define the current MVP. If one changes, update this file and the related docs.

## Current Decisions

- The niche is South African residential solar installers.
- The simulated company is SolarFlow SA.
- The first service area is Gauteng, focused on Midrand, Johannesburg, Pretoria, and Centurion.
- n8n handles orchestration.
- Supabase stores persistent lead memory.
- The language model handles information extraction from customer messages.
- JavaScript handles validation, scoring, routing, and business rules.
- Webhooks are the current inbound transport.
- WhatsApp is a future production channel.
- Google Calendar is deferred; booking is currently simulated.
- The old same-execution demo loop is not part of the live architecture.
- The model does not score leads, size solar systems, produce quotes, approve finance, or make sales commitments.
- Post-qualification control state is stored in Supabase.
- WARM nurture runs in a separate scheduled workflow.
- Until a real customer messaging channel is connected, WARM nurture creates an internal Gmail follow-up task.
- HUMAN_REVIEW transitions to HUMAN_TAKEOVER so automation stops after the salesperson handoff.
- Course-alignment notes must not attribute a technique or decision to a course unless it was actually captured from that course material.

## Change Control

If a decision needs to change:

1. State the conflict.
2. Explain the reason for the change.
3. Get explicit approval.
4. Update this log and any affected documentation.
