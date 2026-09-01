# Current Status

## Completed
- n8n Community Edition running locally in Docker.
- Base qualification workflow built.
- Deterministic lead scoring built.
- HOT/WARM/COLD/HUMAN_REVIEW routing designed.
- Simulated booking built.
- Salesperson summary built.
- OpenRouter connected.
- Token-limit issue fixed by lowering max output tokens.
- AI extraction working.
- JSON parsing / code-fence cleanup implemented.
- Missing-field detection working.
- Next-question logic tested.
- In-memory conversation merge proven.
- Supabase account and leads table created.
- channel_user_id persistent identity implemented.
- Find Existing Lead uses Supabase Get Many.
- New lead creation works.
- Persistent memory works across separate executions.
- Merge preserves previous stored values.
- intent vs lead_status mapping issue fixed.
- Mark Lead Qualified step added.
- Webhook trigger is now the live MVP input path.
- HOT, WARM, COLD, and HUMAN_REVIEW routes validated through webhook + Supabase.
- Terminal route results are persisted back to Supabase before webhook response.
- Obsolete mock and experimental nodes removed from the cleaned workflow export.
- HOT and HUMAN_REVIEW branches prepare structured salesperson notification payloads.
- Gmail notifications are connected for HOT and HUMAN_REVIEW leads.
- HOT Gmail notification delivery validated.
- HUMAN_REVIEW Gmail notification delivery validated.
- Gmail sends now retry once, continue on failure, and record `sales_notification_status` / `sales_notification_error` before terminal persistence.
- OpenRouter and Supabase external nodes now retry once before surfacing a hard workflow failure in n8n.
- Production workflow is active in n8n for `/webhook/solar-lead-message`.
- Production webhook smoke test passed for HOT, WARM, COLD, and HUMAN_REVIEW.
- Local website-form inbound added at `http://localhost:8080`.
- Website-form proxy smoke test passed through production n8n with a COLD lead response.

## Current live architecture
Incoming Solar Message webhook or local website form
→ Find Existing Lead
→ Lead Exists?
→ Create New Lead or use existing row
→ Basic LLM Chain
→ Merge Supabase + AI
→ Find Missing Qualification Fields
→ Update Lead Memory
→ Qualification Complete?
   - FALSE → More Questions → END
   - TRUE → Mark Lead Qualified
            → Update Qualified Status
            → Apply Business Rules
            → Validate
            → Score
            → Route
            → Persist terminal result
            → Respond to webhook

## Current validated baseline
- Workflow export: `workflows/solar-lead-conversion-mvp.cleaned.json`
- Validated baseline export: `workflows/solar-lead-conversion-mvp.validated-baseline.json`
- Route fixtures: `tests/route-validation-fixtures.json`
- Route validation notes: `ROUTE_VALIDATION.md`

## Next milestone
Choose whether to polish the website form for public hosting or connect WhatsApp Business next.
