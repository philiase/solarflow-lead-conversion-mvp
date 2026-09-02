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
- Supabase control fields added for consent, WARM nurture, and human takeover.
- Main workflow now writes post-qualification control state at terminal branches.
- Existing-lead qualification now checks automation stop conditions before calling the LLM.
- Separate WARM nurture scheduler workflow imported locally and left inactive for controlled testing.

## Current live architecture
Incoming Solar Message webhook or local website form
→ Find Existing Lead
→ Lead Exists?
   - NO → Create New Lead
   - YES → Check Automation Stop Conditions
          → Can Qualification Continue?
             - TRUE → use existing row
             - FALSE → Persist Automation Stop State → Respond Automation Stopped
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

## Current workflow files
- Main workflow export: `workflows/solar-lead-conversion-mvp.cleaned.json`
- WARM nurture scheduler export: `workflows/solarflow-warm-nurture-scheduler.json`
- Supabase control-field migration: `supabase/add_post_qualification_control_fields.sql`
- Route fixtures: `tests/route-validation-fixtures.json`
- Route validation notes: `ROUTE_VALIDATION.md`

Recent control-layer backups and helper scripts are stored under `archive/n8n-control-layer/`.

## Next milestone
Run controlled validation for the post-qualification control layer, then decide whether to connect a real customer messaging channel or continue polishing the demo package.
