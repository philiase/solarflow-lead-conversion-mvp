# n8n Control-Layer Archive

This folder keeps recent n8n control-layer backups and helper scripts out of the main project surface.

## Contents

- `backups/` - live n8n exports captured before and after the control-layer import.
- `patch-scripts/` - recent local scripts used to apply the control-layer workflow changes and generate the WARM nurture scheduler.

Older root-level `n8n-workflows-*` exports and obsolete `patch_n8n_*` scripts were removed after the current workflow and recent live backups were confirmed.

The active workflow exports live in:

- `workflows/solar-lead-conversion-mvp.cleaned.json`
- `workflows/solarflow-warm-nurture-scheduler.json`

The current Supabase migration lives in:

- `supabase/add_post_qualification_control_fields.sql`
