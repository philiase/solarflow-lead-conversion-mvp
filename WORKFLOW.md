# Workflow

## Current target architecture

Incoming Message
→ Find Existing Lead in Supabase
→ Lead Exists?
   - NO → Create New Lead
   - YES → use existing lead
→ Basic LLM Chain
→ Merge Supabase Lead + AI Update
→ Find Missing Qualification Fields
→ Update Lead Memory in Supabase
→ Qualification Complete?
   - FALSE → More Questions → END
   - TRUE → Mark Lead Qualified
            → Update Qualified Status in Supabase
            → Apply Business Rules
            → Validate Lead
            → Score Solar Lead
            → Route HOT/WARM/COLD/HUMAN_REVIEW

## Execution model
One incoming customer message = one n8n execution.
Supabase is the persistent memory across executions.

## Supabase lookup
Get Many from leads where:
channel_user_id = incoming channel_user_id
Limit 1.

## Persistent memory rule
AI null means “not mentioned in latest message.”
AI null must not erase a valid stored value.

## FALSE qualification branch
Choose next missing field → generate next question → save state → end execution.

## TRUE branch
Set lead_status = QUALIFIED → persist → apply business rules → validate → score → route.

## Booking
Current MVP uses simulated booking.

## Input transport
Current input is the webhook:
http://localhost:5678/webhook-test/solar-lead-message in test mode.

Production mode uses:
http://localhost:5678/webhook/solar-lead-message

The local website-form inbound is:
http://localhost:8080

It forwards submissions to the production webhook as:
- `channel_user_id`
- `customer_message`

Later: WhatsApp Business Platform.

## Terminal persistence
Each terminal branch persists route results to Supabase before responding:
- HOT persists BOOKED status, score, temperature, booking status, appointment date, and appointment time.
- WARM persists NURTURE status, score, and temperature.
- COLD persists COLD status, score, and temperature.
- HUMAN_REVIEW persists HUMAN_REVIEW status, score, temperature, and service-area result.

## Salesperson notifications
HOT and HUMAN_REVIEW branches prepare a structured `sales_notification_payload`, send a Gmail notification, restore the lead context, then persist final state and respond to the webhook.

Gmail sends are non-blocking: if Gmail fails after retry, the restore node sets `sales_notification_status` to `FAILED`, records `sales_notification_error`, and continues to terminal persistence and the webhook response. If Gmail succeeds, the restore node sets `sales_notification_status` to `SENT`.

Current notification nodes:
- Prepare HOT Sales Notification
- Prepare HUMAN REVIEW Sales Notification
- Send HOT Gmail Notification
- Restore HOT Lead Context
- Send HUMAN REVIEW Gmail Notification
- Restore HUMAN REVIEW Lead Context

Current recipient:
lebusotsilo6@gmail.com

The Gmail nodes use the n8n credential named `Gmail account`. Attribution is disabled in the Gmail node options.

## Lightweight failure handling

External nodes use one retry before failing:
- OpenRouter chat model
- Supabase lookup/create/update nodes
- Gmail send nodes

OpenRouter and Supabase remain hard failures after retry because they are required for extraction and persistent memory. Their failures are captured in the n8n execution log. Gmail is allowed to continue after failure because notification delivery should not block final lead persistence or the customer response.
