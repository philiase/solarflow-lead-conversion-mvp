# Workflow

## Main Workflow

```text
Incoming Solar Message
Find Existing Lead in Supabase
Lead Exists?
  NO  -> Create New Lead
  YES -> Check Automation Stop Conditions
          Can Qualification Continue?
            YES -> continue with existing lead
            NO  -> persist stop state and respond AUTOMATION_STOPPED
Basic LLM Chain
Merge Supabase Lead + AI Update
Find Missing Qualification Fields
Update Lead Memory in Supabase
Qualification Complete?
  NO  -> ask the next missing question
  YES -> mark qualified, apply rules, score, and route
```

One incoming customer message creates one n8n execution. Supabase is the memory layer that connects separate messages from the same `channel_user_id`.

## Persistent Memory

The model returns only new or corrected information from the latest message. A `null`, empty, or missing model value means the customer did not mention that field in the latest message. It must not erase a valid value already stored in Supabase.

## Qualification Branch

If required fields are still missing, the workflow saves the updated lead, selects the next missing field, returns one question, and ends the execution.

If qualification is complete, the workflow marks the lead as `QUALIFIED`, applies service-area rules, validates the lead, calculates the score, and routes the lead.

## Input

Production webhook:

```text
http://localhost:5678/webhook/solar-lead-message
```

Test webhook:

```text
http://localhost:5678/webhook-test/solar-lead-message
```

The local website form runs at:

```text
http://localhost:8080
```

It forwards valid submissions to the production webhook as:

- `channel_user_id`
- `customer_message`

## Terminal Persistence

Every terminal branch persists its final state to Supabase before returning the webhook response.

- HOT leads move to `BOOKED`, store the simulated appointment details, and stop follow-up.
- WARM leads move to `NURTURE`, activate follow-up, and schedule the next follow-up for two days later.
- COLD leads move to `COLD` and stop follow-up.
- HUMAN_REVIEW leads move to `HUMAN_TAKEOVER`, stop follow-up, and store takeover metadata.

## Sales Notifications

HOT and HUMAN_REVIEW branches prepare a `sales_notification_payload`, send a Gmail notification, restore the lead context, persist the terminal state, and respond to the webhook.

Current notification nodes:

- `Prepare HOT Sales Notification`
- `Prepare HUMAN REVIEW Sales Notification`
- `Send HOT Gmail Notification`
- `Restore HOT Lead Context`
- `Send HUMAN REVIEW Gmail Notification`
- `Restore HUMAN REVIEW Lead Context`

The Gmail nodes use the n8n credential named `Gmail account`.

## WARM Nurture Scheduler

Workflow export:

```text
workflows/solarflow-warm-nurture-scheduler.json
```

Current V1 flow:

```text
Schedule Trigger
Find Active Nurture Leads
Can Automation Continue?
Prepare WARM Follow-up
Send WARM Follow-up Task
Restore WARM Nurture Context
Update Nurture Schedule
```

The scheduler checks consent, lead status, human takeover, due date, and follow-up count before continuing. Because the project does not yet have a real customer delivery channel for follow-ups, V1 sends an internal Gmail task and then updates the follow-up schedule.

## Automation Stop Gate

The main workflow checks existing leads before sending them back through the model. Automation stops when:

- `consent_status` is `OPTED_OUT`
- `lead_status` is `BOOKED`, `CLOSED`, or `HUMAN_TAKEOVER`
- `human_takeover` is `true`
- the latest customer message contains clear opt-out or human-contact language

When blocked, the workflow persists the stop state and returns `AUTOMATION_STOPPED`.

## Failure Handling

OpenRouter, Supabase, and Gmail nodes retry once. OpenRouter and Supabase remain hard failures because extraction and persistence are required. Gmail failures are recorded and allowed to continue so the lead can still be saved and the webhook can return a response.
