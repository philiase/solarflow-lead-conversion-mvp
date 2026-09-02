# SolarFlow SA — AI Lead Conversion System
## Complete Project Documentation / Source of Truth

**Project status:** Active MVP build  
**Market:** South Africa  
**Initial niche:** Residential solar installers  
**Simulated business:** SolarFlow SA  
**Primary region:** Gauteng — Johannesburg, Pretoria, Centurion, Midrand  
**Primary goal:** Build a low-cost AI-powered lead conversion system that turns inbound solar enquiries into structured, qualified, scored, routed, and eventually booked sales opportunities.

---

# 1. What This Project Is About

The project is an **AI Lead Conversion System for South African solar installers**.

The purpose is not to build a generic chatbot.

The system is designed to solve a specific business problem:

> Solar installers receive enquiries through channels such as WhatsApp, websites, ads, referrals, and social media. Staff often need to manually ask the same qualification questions, collect incomplete information, determine whether the customer is worth pursuing, arrange appointments, remember follow-ups, and transfer the lead to sales.

The system should automate the repetitive parts of that process while keeping important business decisions transparent and keeping humans responsible for technical solar design, quotations, finance approval, and final sales decisions.

The intended business journey is:

```text
Inbound customer enquiry
        ↓
Understand customer message
        ↓
Identify / create customer record
        ↓
Extract useful lead information
        ↓
Remember previous information
        ↓
Identify missing qualification data
        ↓
Ask only the next necessary question
        ↓
Repeat across separate customer messages
        ↓
Qualification complete
        ↓
Apply deterministic business rules
        ↓
Score and classify lead
        ↓
HOT / WARM / COLD / HUMAN_REVIEW
        ↓
Booking / nurture / manual review
        ↓
Salesperson receives structured lead summary
```

---

# 2. Core Business Model

## Client

A small-to-medium South African residential solar installer.

## End customer

A homeowner or prospective residential customer who may want:

- a new solar installation,
- battery backup,
- an upgrade to an existing system,
- reduced electricity costs,
- energy independence,
- or information before deciding.

## Business problem

The installer may lose leads because of:

- slow response times,
- after-hours enquiries,
- repetitive qualification questions,
- incomplete customer information,
- poor follow-up,
- salespeople spending time on low-quality leads,
- information being scattered across chats and spreadsheets,
- missed appointments,
- inconsistent qualification.

## Core offer

> An AI-powered solar lead conversion assistant that responds to inbound prospects, gathers the information a salesperson needs, remembers the conversation, identifies missing information, qualifies the lead, applies transparent scoring rules, routes the customer correctly, prepares the booking process, saves the lead, and hands a clean summary to a human salesperson.

---

# 3. Scope of Version 1

## Included

- Residential solar leads
- Gauteng test service area
- Inbound lead handling
- Natural-language lead extraction
- Persistent conversation memory
- Missing-field detection
- Qualification
- Lead scoring
- HOT / WARM / COLD / HUMAN_REVIEW routing
- Simulated booking
- Sales summaries
- Webhook-based external messaging
- Supabase lead storage
- AI extraction using OpenRouter-compatible LLM
- Future company knowledge / RAG path

## Not included yet

- Automatic solar system sizing
- Automatic final quotation
- Engineering calculations
- Finance approval
- Payments
- Voice agent
- Full CRM
- Full custom dashboard
- Multiple niches
- Production WhatsApp connection
- Real Google Calendar integration
- Predictive ML lead scoring
- Complex RAG implementation

---

# 4. Owen Course Alignment Rule

The project is being built with the course/video teachings in mind.

However, one rule is fixed:

> Do not claim Owen taught something unless it was actually captured from the video/course.

Where a concept comes from the course, it may be treated as course-aligned.

Where the project introduces its own architecture, tools, business rules, scoring, or implementation decisions, those should be described as **our design choices**, not attributed to Owen.

The overall build philosophy being followed is:

```text
Business problem
    ↓
Niche
    ↓
Offer
    ↓
Workflow
    ↓
Tools
    ↓
Implementation
```

Technology is not selected first and then forced onto a business problem.

---

# 5. Simulated Business

## Name

**SolarFlow SA**

## Market

Residential solar installations.

## Initial service area

- Johannesburg
- Pretoria
- Centurion
- Midrand

This is a simulated service area used for business logic testing.

## Main conversion event

A qualified prospect reaches a solar consultation / site assessment stage.

## Human responsibility

The AI does **not** make final decisions on:

- solar panel quantity,
- inverter size,
- battery capacity,
- engineering,
- final quotations,
- finance approval,
- warranties,
- installation commitments,
- safety-critical technical advice.

Those remain human or deterministic company-controlled processes.

---

# 6. Customer Qualification Data

The lead record currently works around these fields:

```text
channel_user_id
name
location
property_type
ownership_status
monthly_electricity_spend
primary_goal
existing_equipment
critical_loads
timeline
payment_preference
intent
in_service_area
lead_score
lead_temperature
qualification_complete
next_missing_field
lead_status
booking_status
appointment_date
appointment_time
consent_status
created_at
updated_at
```

## Qualification fields currently required

```text
name
location
property_type
ownership_status
monthly_electricity_spend
primary_goal
existing_equipment
timeline
payment_preference
```

`critical_loads` is useful but currently does not block qualification.

---

# 7. Intent Values

The LLM is instructed to normalize customer intent into:

```text
NEW_INSTALL
BACKUP_ONLY
UPGRADE
PRICE_ONLY
SERVICE_SUPPORT
OTHER
```

---

# 8. Normalized Values

## Timeline

```text
ASAP
0-30 days
1-3 months
3+ months
Researching
Unknown
```

## Payment preference

```text
Cash
Finance
Either
Unknown
```

`Unknown` is a valid answer when the customer explicitly says they are undecided. It must not automatically count as a missing field.

## Ownership

```text
Owner
Renter
```

## Property type

```text
House
Townhouse
Apartment
Other
Unknown
```

## Existing equipment

If the customer explicitly says they have none:

```text
existing_equipment = None
```

## Electricity spend

Must ideally be numeric:

```text
R2000  → 2000
R3,200 → 3200
```

JavaScript validation also protects against the model returning currency-formatted strings.

---

# 9. Tool Stack

## n8n Community Edition

**Role:** Main workflow orchestrator.

Responsibilities:

- receive webhook,
- call Supabase,
- call LLM,
- execute Code nodes,
- perform IF routing,
- manage business flow,
- produce webhook responses.

## Docker

**Role:** Runs the self-hosted n8n instance.

## OpenRouter / LLM

**Role:** Language intelligence.

Current responsibilities:

- understand natural-language messages,
- extract structured lead information,
- normalize values,
- distinguish stated information from missing information.

The model must not decide final business outcomes.

A previous token-limit issue was fixed by reducing model max output tokens from 65,536 to roughly 500 for extraction.

## Supabase

**Role:** Persistent memory / database.

Allows customer state to survive separate n8n executions.

## Webhook

**Role:** External entry point into n8n.

This replaces manual clicking and lets external channels send messages into the workflow.

## Google Calendar

**Role later:** Real booking availability and appointment creation.

Currently deferred.

## WhatsApp Business Platform

**Role later:** Primary customer communication channel.

Not connected yet.

## JavaScript / Code Nodes

**Role:** Deterministic logic.

Used for:

- normalization,
- validation,
- scoring,
- parsing AI output,
- merging AI updates with Supabase state,
- missing-field detection,
- next-question selection,
- business rules,
- handling predictable AI mistakes.

---

# 10. Why AI and Code Are Separate

Example:

Customer says:

> "I'm somewhere around three grand a month."

LLM:

```text
monthly_electricity_spend = 3000
```

JavaScript:

```text
3000 >= 2000
→ +15 scoring points
```

The LLM does not decide whether the customer is HOT.

---

# 11. Initial Lead Scoring Model

Current simulated scoring rules:

```text
Inside service area                       +20
Property owner                            +15
Monthly electricity spend >= R2,000      +15
Timeline ASAP / 0-30 days                 +20
Timeline 1-3 months                       +10
Clear solar requirement                   +10
Cash / Finance / Either identified        +10
```

Maximum current score:

```text
90
```

Current thresholds:

```text
HOT     >= 60
WARM    35-59
COLD    < 35
```

These are simulated SolarFlow rules, not industry facts.

---

# 12. Human Review Override

A lead can be commercially strong but still require human review.

Example:

```text
Location = Durban
```

If Durban is outside SolarFlow's simulated service area:

```text
in_service_area = false
```

and:

```text
lead_temperature = HUMAN_REVIEW
```

can override the raw score.

---

# 13. Current Lead Lifecycle

```text
NEW
    ↓
QUALIFYING
    ↓
QUALIFIED
    ↓
HOT / WARM / COLD / HUMAN_REVIEW
    ↓
BOOKED / NURTURE / HUMAN_TAKEOVER / CLOSED
```

## Intent vs lead status

Intent describes what the customer wants:

```text
NEW_INSTALL
BACKUP_ONLY
UPGRADE
...
```

Lead status describes where the customer is in the process:

```text
NEW
QUALIFYING
QUALIFIED
NURTURE
BOOKED
HUMAN_TAKEOVER
CLOSED
...
```

A previous mapping bug storing `NEW_INSTALL` as `lead_status` was fixed.

---

# 14. Original Local Prototype

```text
Manual Trigger
    ↓
Mock Solar Lead
    ↓
Lead Scoring Code
    ↓
IF HOT?
    ├ TRUE → booking
    └ FALSE → other routes
```

This proved the business logic before external integrations were added.

---

# 15. Booking Prototype

The HOT branch currently includes:

```text
Prepare Booking Request
    ↓
Simulate Booking
    ↓
Create Sales Summary
```

Simulated fields:

```text
booking_status = BOOKED
appointment_date = 2026-08-22
appointment_time = 10:00
appointment_type = Solar Consultation
booking_source = SIMULATED
```

Later this will be replaced by Google Calendar.

---

# 16. Sales Summary

Example:

```text
HOT SOLAR LEAD

Customer: Thabo
Area: Midrand
Property: House
Ownership: Owner

Electricity Spend: R3200
Goal: Bill reduction + backup
Existing Equipment: None

Timeline: 0-30 days
Payment Preference: Finance

Lead Score: 90/90
Lead Status: HOT

Appointment:
Date: 2026-08-22
Time: 10:00
Type: Solar Consultation
Status: BOOKED
```

n8n lesson learned:

> Use `Include Other Input Fields` when an Edit Fields node should add data rather than replace the existing item.

---

# 17. AI Intake Layer

Example natural message:

```text
Hi, my name is Thabo. I live in Midrand and I'm interested in solar for my house.
I spend around R3,200 a month on electricity.
I mainly want to reduce the bill but also want backup.
I don't have any solar equipment yet.
I'd like to install within the next month and I'd probably need finance.
```

The LLM converts it into structured data.

---

# 18. Current LLM Extraction Prompt

```text
You are an information extraction assistant for a South African residential solar installer.

Your job is to extract NEW or CORRECTED information from the latest customer message.

Do not invent missing information.
Do not erase valid existing information.
If the customer does not mention a field in the latest message, return null for that field.

Existing lead record:
{{$json}}

Latest customer message:
{{ $('Incoming Solar Message').item.json.body.customer_message }}

Return ONLY valid JSON with these fields:

name
location
property_type
ownership_status
monthly_electricity_spend
primary_goal
existing_equipment
critical_loads
timeline
payment_preference
intent

Allowed intent values:
NEW_INSTALL
BACKUP_ONLY
UPGRADE
PRICE_ONLY
SERVICE_SUPPORT
OTHER

Allowed timeline values:
ASAP
0-30 days
1-3 months
3+ months
Researching
Unknown

Allowed payment_preference values:
Cash
Finance
Either
Unknown

If a field is not mentioned in the latest customer message, return null.

Do not wrap the JSON in markdown or code fences.
```

Additional normalization rules were added for:

- property type,
- ownership,
- no existing equipment,
- numeric electricity spend.

---

# 19. AI JSON Parsing Fix

The model sometimes returned fenced JSON.

Example:

```text
```json
{ ... }
```
```

The parser strips fences before `JSON.parse()`.

---

# 20. Missing Qualification Fields

Current logic:

```javascript
const requiredFields = [
  "name",
  "location",
  "property_type",
  "ownership_status",
  "monthly_electricity_spend",
  "primary_goal",
  "existing_equipment",
  "timeline",
  "payment_preference"
];

const missingFields = requiredFields.filter((field) => {
  const value = lead[field];

  return (
    value === null ||
    value === undefined ||
    value === ""
  );
});
```

`Unknown` is no longer treated as missing.

Important principle:

> Qualification completeness asks: did we get an answer?  
> Lead scoring asks: how commercially strong is the answer?

---

# 21. Next Question Logic

Question map:

```javascript
const questions = {
  name: "What name should I use for your solar enquiry?",
  location: "Which suburb or area is the property in?",
  property_type: "Is this for a house, townhouse, apartment, or another type of property?",
  ownership_status: "Do you own the property, or are you currently renting?",
  monthly_electricity_spend: "Roughly how much do you spend on electricity in a typical month?",
  primary_goal: "What matters most to you: reducing your electricity bill, backup power during outages, or both?",
  existing_equipment: "Do you already have any solar panels, inverter, battery, or generator installed?",
  timeline: "When would you ideally like the system installed?",
  payment_preference: "Would you prefer cash, finance, either option, or are you still deciding?"
};
```

Because Supabase stores:

```text
next_missing_field
```

the question node uses:

```javascript
const nextField = lead.next_missing_field ?? null;
```

---

# 22. Why Supabase Was Added

The original simulated loop happened inside one n8n execution.

Real conversations happen across multiple requests.

Supabase now provides memory:

```text
Message 1
↓
save
↓
workflow ends

Message 2
↓
load old state
↓
merge new information
↓
save again
```

---

# 23. Supabase `leads` Table

Conceptual fields:

```sql
id uuid primary key
channel_user_id text unique
name text
location text
property_type text
ownership_status text
monthly_electricity_spend numeric
primary_goal text
existing_equipment text
critical_loads text
timeline text
payment_preference text
intent text
in_service_area boolean
lead_score integer
lead_temperature text
qualification_complete boolean
next_missing_field text
lead_status text
booking_status text
appointment_date date
appointment_time text
consent_status text
follow_up_status text
next_follow_up_at timestamptz
follow_up_count integer
last_follow_up_at timestamptz
human_takeover boolean
assigned_to text
takeover_at timestamptz
takeover_reason text
created_at timestamptz
updated_at timestamptz
```

`channel_user_id` is unique.

---

# 24. Existing Lead Lookup

Supabase:

```text
Operation: Get Many
Table: leads
Filter:
channel_user_id = incoming channel_user_id
Limit = 1
```

`Always Output Data` is enabled so the workflow continues even when no lead is found.

Lead existence check:

```javascript
{{ $json.id !== undefined && $json.id !== null }}
```

TRUE → use existing lead.  
FALSE → create new lead.

---

# 25. Create New Lead

Initial values:

```text
channel_user_id = incoming channel_user_id
lead_status = NEW
qualification_complete = false
```

A previous expression syntax mistake stored an expression as literal text; this was fixed.

A duplicate-key error also exposed a lookup problem; the webhook field references were corrected.

---

# 26. Merge Supabase Lead + AI Update

The LLM extracts only NEW or corrected information.

The merge preserves old valid information.

Rule:

> `null` from the LLM means “not mentioned in this message” and must not erase stored information.

Concept:

```javascript
const cleanedUpdate = {};

for (const [key, value] of Object.entries(update)) {
  if (
    value !== null &&
    value !== undefined &&
    value !== ''
  ) {
    cleanedUpdate[key] = value;
  }
}

const merged = {
  ...existing,
  ...cleanedUpdate
};
```

This has successfully proven persistent memory across separate executions.

---

# 27. Existing Equipment Edge Case

Customer:

```text
"I don't have existing equipment."
```

Initially the model returned:

```text
existing_equipment = null
```

Prompt normalization and deterministic fallback were added so it becomes:

```text
existing_equipment = None
```

Principle:

> Prompt for correctness; code for enforcement.

---

# 28. Apply Business Rules

The LLM extracts the location.

Code determines service eligibility.

Example service areas:

```javascript
const serviceAreas = [
  "midrand",
  "johannesburg",
  "pretoria",
  "centurion"
];
```

---

# 29. Routing Architecture

```text
Score Solar Lead
      ↓
Is HOT?
 ├ TRUE → HOT workflow
 └ FALSE
      ↓
   Is WARM?
    ├ TRUE → WARM workflow
    └ FALSE
         ↓
      Is HUMAN_REVIEW?
       ├ TRUE → HUMAN workflow
       └ FALSE → COLD workflow
```

A future cleanup may replace chained IFs with a Switch node.

---

# 30. HOT Branch

Current logical flow:

```text
HOT
↓
Prepare Booking Request
↓
Simulate Booking
↓
Create Sales Summary
↓
Respond to Webhook
```

Current response concept:

```json
{
  "status": "BOOKED",
  "lead_temperature": "HOT",
  "lead_score": 90,
  "message": "Thanks, your solar enquiry has been qualified and your consultation has been booked.",
  "appointment_date": "2026-08-22",
  "appointment_time": "10:00"
}
```

`Enable Response Output Branch` was enabled in n8n so the response branch is visible.

---

# 31. WARM Branch

Example WARM test:

```text
Kabelo
Midrand
Renter
R2,500 electricity spend
Bill reduction
No existing equipment
Researching
Payment = Unknown
```

Expected scoring:

```text
Inside service area       +20
Spend >= R2,000           +15
Clear solar requirement   +10
                          ----
                           45
```

Expected:

```text
lead_temperature = WARM
```

---

# 32. COLD Branch

Example:

```text
Sipho
Midrand
Renter
R800 electricity spend
Researching
No near-term installation
No solar equipment
Payment undecided
```

Expected low score and:

```text
lead_temperature = COLD
```

---

# 33. HUMAN_REVIEW Branch

Example:

```text
Lerato
Durban
Homeowner
R4,000 electricity spend
Solar + battery
Near-term installation
Cash
```

Commercially strong but outside service area.

Expected:

```text
in_service_area = false
lead_temperature = HUMAN_REVIEW
```

---

# 34. Webhook Architecture

Incoming payload:

```json
{
  "channel_user_id": "test_thabo_004",
  "customer_message": "It's for a house."
}
```

Webhook data typically arrives under:

```text
$json.body.channel_user_id
$json.body.customer_message
```

Both new and existing leads flow into the same LLM processing path.

---

# 35. Current End-to-End Architecture

```text
Incoming Solar Message
        ↓
Webhook
        ↓
Find Existing Lead in Supabase
        ↓
Lead Exists?
   ├ NO → Create Lead
   └ YES → use existing row
        ↓
LLM extracts NEW / corrected information
        ↓
Merge Supabase state + AI update
        ↓
Find Missing Qualification Fields
        ↓
Store updated state in Supabase
        ↓
Qualification Complete?
   ├ NO
   │ ↓
   │ Get next_missing_field
   │ ↓
   │ Generate next question
   │ ↓
   │ Respond to Webhook
   │ ↓
   │ END
   │
   └ YES
      ↓
   Mark Qualified
      ↓
   Apply Business Rules
      ↓
   Validate Lead
      ↓
   Score Solar Lead
      ↓
   HOT / WARM / COLD / HUMAN_REVIEW
      ↓
   Final branch response
```

---

# 36. Proven Persistent Conversation Example

Same `channel_user_id`:

```text
test_thabo_004
```

Messages were sent across separate webhook executions.

Examples:

```text
Hi, I'm Thabo from Midrand...
```

then:

```text
It's for a house.
```

then:

```text
Yes, I own the property.
```

then:

```text
I want bill reduction and backup.
```

then:

```text
I don't have existing equipment.
```

then:

```text
I'd like to install within the next month.
```

The system preserved earlier fields across runs, detected only the remaining missing fields, eventually set:

```text
qualification_complete = true
```

and entered the TRUE/scoring branch.

This proved real persistent conversation state.

---

# 37. RAG — Where It Will Be Added

RAG is not needed for simple qualification.

It becomes necessary for company-specific knowledge questions such as:

- What warranty do your batteries have?
- Which inverter brands do you install?
- Do you offer financing?
- How long does installation take?
- Can solar run a geyser?
- Which areas do you service?
- What happens during a site assessment?

Future architecture:

```text
Incoming message
        ↓
Message classification
   ├ Qualification answer
   │      ↓
   │ Existing qualification flow
   │
   ├ Knowledge question
   │      ↓
   │ RAG retrieval
   │      ↓
   │ LLM grounded answer
   │
   ├ Both
   │      ↓
   │ Extract lead data
   │ +
   │ Retrieve company knowledge
   │      ↓
   │ Update customer memory
   │      ↓
   │ Answer question
   │      ↓
   │ Continue qualification
   │
   └ Human support
          ↓
       Human handoff
```

Possible RAG knowledge base:

- FAQ
- service areas
- installation process
- warranty documents
- supported brands
- finance information
- approved technical guidance
- maintenance information
- terms and conditions

RAG should be added only when the flow actually needs company knowledge retrieval.

---

# 38. Future Message Classification

Potential values:

```text
QUALIFICATION
KNOWLEDGE_QUESTION
BOTH
HUMAN_SUPPORT
```

Examples:

```text
"I own the house."
→ QUALIFICATION
```

```text
"What warranty do your batteries have?"
→ KNOWLEDGE_QUESTION
```

```text
"I own the house, and what warranty do your batteries have?"
→ BOTH
```

---

# 39. Known Cleanup Items

These do not all need to block progress.

- Improve LLM normalization examples.
- Ensure lead statuses update consistently.
- Save final branch results back to Supabase.
- Rename generic n8n nodes.
- Remove or archive obsolete mock nodes.
- Possibly replace IF chain with Switch.
- Add robust error handling.
- Add retry logic.
- Add duplicate-message protection.
- Add authentication/security.
- Add POPIA/consent handling.
- Add logging/audit trail.

---

# 40. What Is Already Complete

- n8n running in Docker
- manual prototype
- deterministic lead scoring
- initial HOT path
- WARM / COLD / HUMAN routing design
- simulated booking
- salesperson summary
- natural-language LLM extraction
- OpenRouter model connection
- max-token issue fixed
- JSON parsing/code-fence cleanup
- missing-field detection
- next-question generation
- initial simulated conversation loop
- Supabase project and leads table
- persistent customer lookup
- new lead creation
- existing lead detection
- multi-execution memory
- AI update + Supabase merge
- protection against null overwriting memory
- persistent `next_missing_field`
- webhook trigger
- webhook request/response
- qualification across multiple webhook requests
- qualification TRUE transition
- HOT scoring after real webhook flow
- final booking response
- major normalization fixes
- qualification completeness separated from lead quality

---

# 41. Immediate Next Steps

## Step 1 — Finish route validation

Fully test through the real webhook/Supabase architecture:

```text
HOT
WARM
COLD
HUMAN_REVIEW
```

Confirm:

- expected score,
- correct branch,
- correct Supabase final status,
- correct webhook response.

## Step 2 — Persist terminal branch results

Ensure Supabase stores:

```text
lead_score
lead_temperature
lead_status
booking_status
appointment_date
appointment_time
```

where relevant.

## Step 3 — Clean the workflow

Without changing behavior:

- rename nodes,
- remove obsolete connections,
- organize branches,
- replace remaining mock references with webhook/Supabase references.

## Step 4 — Add message classification when needed

Before RAG:

```text
QUALIFICATION
KNOWLEDGE_QUESTION
BOTH
HUMAN_SUPPORT
```

## Step 5 — Add RAG when the flow first needs company knowledge

Start with a small SolarFlow knowledge base.

## Step 6 — Replace simulated booking

When Google setup is available:

```text
Simulate Booking
```

becomes:

```text
Google Calendar availability
→ offer slots
→ customer selects
→ create appointment
```

## Step 7 — Add real customer channel

Future:

```text
WhatsApp Business Platform
        ↓
Webhook / n8n
        ↓
existing qualification engine
```

## Step 8 — Add salesperson notifications

Possible channels:

- email,
- internal WhatsApp,
- CRM alert.

## Step 9 — Add follow-up automation

V1 adds a separate WARM nurture scheduler for leads in NURTURE. Until a real customer messaging channel is connected, the scheduler sends an internal Gmail follow-up task and updates the follow-up schedule after that task is sent.

## Step 10 — Production hardening

- validation,
- API failure handling,
- retries,
- deduplication,
- authentication,
- secrets management,
- logging,
- audit events,
- POPIA considerations,
- consent and opt-out handling.

---

# 42. Longer-Term Architecture

```text
WhatsApp / Website / Ads
          ↓
       Webhook
          ↓
    Customer identity
          ↓
       Supabase
          ↓
  Message classification
    /        |        \
Qualification RAG    Human
    |         |        |
    ↓         ↓        ↓
LLM extraction  Retrieve docs  Handoff
    ↓         ↓
Merge state   Grounded LLM answer
    ↓         ↓
Missing data  Customer response
    ↓
Save state
    ↓
Complete?
 ├ NO → ask question
 └ YES
      ↓
Business rules
      ↓
Lead score
      ↓
HOT / WARM / COLD / REVIEW
      ↓
Booking / nurture / salesperson
      ↓
CRM / Calendar / notifications
```

---

# 43. Project Design Principles

1. **Business first.** Do not add technology just because it is interesting.
2. **AI where language is fuzzy.** Use LLMs for natural-language understanding.
3. **Code where rules must be predictable.** Use deterministic logic for business rules.
4. **Database is truth.** Supabase stores persistent customer state.
5. **Do not let null destroy memory.**
6. **Ask only what is missing.**
7. **Qualification and scoring are separate.**
8. **Human override matters.**
9. **RAG is for knowledge, not everything.**
10. **Keep MVP focused.**

---

# 44. Current Project Position

```text
BUSINESS MODEL                  COMPLETE
INITIAL WORKFLOW DESIGN         COMPLETE
LOCAL n8n PROTOTYPE             COMPLETE
LLM EXTRACTION                  WORKING
LEAD SCORING                    WORKING
BRANCHING                       WORKING / FINAL VALIDATION
SUPABASE MEMORY                 WORKING
MULTI-MESSAGE STATE             WORKING
WEBHOOK                         WORKING
QUALIFICATION LOOP              WORKING ACROSS EXECUTIONS
SIMULATED BOOKING               WORKING
FINAL WEBHOOK RESPONSE          WORKING
RAG                             PLANNED, NOT YET REQUIRED
GOOGLE CALENDAR                 DEFERRED
WHATSAPP                        NOT YET CONNECTED
FOLLOW-UP AUTOMATION            NOT YET BUILT
PRODUCTION HARDENING            NOT YET BUILT
```

The immediate focus is:

```text
Finish routing tests
→ persist final states correctly
→ clean the workflow
→ add the next capability only when the flow genuinely needs it.
```

---

# 45. One-Sentence Summary

> SolarFlow SA is a stateful lead-conversion workflow built in n8n that receives customer messages through a webhook, uses an LLM to understand new information, stores conversation memory in Supabase, asks only missing qualification questions, applies deterministic business rules and lead scoring, routes customers into HOT/WARM/COLD/HUMAN_REVIEW outcomes, and controls follow-up through consent, nurture, and human-takeover states.

---

**Treat this file as the current source of truth for the project unless an explicit project decision changes it.**
