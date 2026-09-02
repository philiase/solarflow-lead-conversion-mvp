# Decision Log

## Frozen decisions
- Niche: South African residential solar installers.
- Simulated company: SolarFlow SA.
- Geography: Gauteng; Midrand, Johannesburg, Pretoria, Centurion.
- Product: AI Lead Conversion Agent.
- n8n = orchestration.
- OpenRouter/OpenAI-compatible model = extraction.
- JavaScript = deterministic logic.
- Supabase = persistent memory.
- Webhook/WhatsApp = transport.
- Google Calendar = later booking integration.

- First run prioritises free/low-cost tools.
- Google Calendar postponed.
- Booking currently simulated.
- Same-execution fake conversation loop is retired from live architecture.
- AI does not score, size systems, quote, or approve finance.
- Post-qualification control state is stored in Supabase.
- WARM nurture runs as a separate scheduled workflow, not inside the main qualification workflow.
- Until a real customer messaging channel is added, WARM nurture sends an internal Gmail follow-up task instead of claiming a customer message was delivered.
- HUMAN_REVIEW transitions to HUMAN_TAKEOVER so automation stops after the salesperson handoff.
- Owen-course alignment: never invent or attribute teachings not explicitly captured.

## Change-control rule
If a frozen decision must change:
1. state the conflict,
2. explain why,
3. get explicit approval,
4. update this log.
Do not silently drift.
