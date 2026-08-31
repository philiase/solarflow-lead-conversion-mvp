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

Production mode will use:
http://localhost:5678/webhook/solar-lead-message

Later: WhatsApp Business Platform.

## Terminal persistence
Each terminal branch persists route results to Supabase before responding:
- HOT persists BOOKED status, score, temperature, booking status, appointment date, and appointment time.
- WARM persists NURTURE status, score, and temperature.
- COLD persists COLD status, score, and temperature.
- HUMAN_REVIEW persists HUMAN_REVIEW status, score, temperature, and service-area result.

## Salesperson notification payloads
HOT and HUMAN_REVIEW branches now prepare a structured `sales_notification_payload` before final persistence and webhook response.

Current payload-only nodes:
- Prepare HOT Sales Notification
- Prepare HUMAN REVIEW Sales Notification

The sender is intentionally not connected yet. The next implementation decision is the delivery channel: email, CRM/internal webhook, WhatsApp, or another sales inbox.
