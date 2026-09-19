# n8n Control-Layer Archive

This folder keeps recent workflow backups and helper scripts from the post-qualification control-layer work.

## Contents

- `backups/` - n8n exports captured before and after the control-layer import.
- `patch-scripts/` - local scripts used to apply workflow changes and generate the WARM nurture scheduler export.

The active workflow exports live in:

- `workflows/solar-lead-conversion-mvp.cleaned.json`
- `workflows/solarflow-warm-nurture-scheduler.json`

The current Supabase migration lives in:

- `supabase/add_post_qualification_control_fields.sql`

Older root-level workflow exports and obsolete patch scripts were removed after the current workflow and recent live backups were confirmed.
