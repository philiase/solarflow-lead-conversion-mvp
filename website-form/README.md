# SolarFlow Website Form

This folder contains the local browser form used to test inbound website leads.

The form runs at:

```text
http://localhost:8080
```

The server forwards submissions to the active n8n production webhook:

```text
http://localhost:5678/webhook/solar-lead-message
```

## Run Locally

```powershell
node .\website-form\server.js
```

Optional environment variables:

```powershell
$env:PORT = "8080"
$env:SOLARFLOW_WEBHOOK_URL = "http://localhost:5678/webhook/solar-lead-message"
$env:SOLARFLOW_FORM_ACCESS_CODE = "change-this-before-sharing"
node .\website-form\server.js
```

The form builds the `customer_message` expected by the n8n workflow and uses `website_<contact>` as the `channel_user_id`.

Set `SOLARFLOW_FORM_ACCESS_CODE` before sharing the form publicly. If it is not set, access-code protection is disabled.

## Logs

Website-form events and errors are written locally to:

```text
website-form/logs/events.jsonl
```

The log captures malformed JSON, rejected access codes, browser errors, n8n webhook responses, and upstream webhook failures. Access codes are redacted before logging.
