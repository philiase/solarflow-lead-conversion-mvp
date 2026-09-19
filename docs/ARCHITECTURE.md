# Architecture

SolarFlow has two n8n workflows. The main workflow handles an incoming message and returns a response. The WARM scheduler runs independently and uses the lead state saved in Supabase to decide which follow-up tasks are due.

These diagrams describe the checked-in [main workflow](../workflows/solar-lead-conversion-mvp.cleaned.json) and [scheduler](../workflows/solarflow-warm-nurture-scheduler.json). Related nodes are grouped where noted; the exports remain the reference for node parameters and connections. The diagrams do not verify the current Docker or n8n runtime state.

![SolarFlow architecture overview](assets/solarflow-architecture.svg)

## Incoming Message and Qualification

The website form posts through its local Node.js server to the n8n webhook. Other clients can call that webhook directly with `channel_user_id` and `customer_message`.

Supabase identifies returning leads by `channel_user_id`. Existing leads pass through the stop gate before extraction. In the current export, new leads go directly from creation to extraction.

```mermaid
flowchart TD
    form[Website form] --> proxy[Node.js form server :8080]
    proxy --> incoming[Incoming Solar Message :5678]
    client[Other webhook client] --> incoming
    incoming --> lookup[Find Existing Lead]
    lookup --> exists{Lead Exists?}
    exists -->|No| create[Create New Lead]
    exists -->|Yes| stop[Check Automation Stop Conditions]
    stop --> gate{Can Qualification Continue?}
    gate -->|No| persistStop[Persist Automation Stop State]
    persistStop --> restoreStop[Restore Automation Stop Context]
    restoreStop --> stopped[Respond Automation Stopped]
    gate -->|Yes| extract[Basic LLM Chain]
    create --> extract
    model[OpenRouter Chat Model] -.->|Extraction only| extract
    extract --> merge[Merge Lead Memory and Extraction]
    merge --> missing[Find Missing Qualification Fields]
    missing --> save[Update Lead Memory]
    save --> complete{Qualification Complete?}
    complete -->|No| questions[More Questions]
    questions --> ask[Send Qualification Question]
    complete -->|Yes| qualified[Mark Lead Qualified]
    qualified --> persistQualified[Update Qualified Status]
    persistQualified --> rules[Apply Business Rules]
    rules --> validate[Validate Lead]
    validate --> score[Score Solar Lead]
    score --> routing[Route lead: see next diagram]

    classDef storage fill:#e7f4ed,stroke:#25754b,color:#183c2b;
    classDef decision fill:#fff4d7,stroke:#a37412,color:#503b10;
    classDef stopState fill:#fcecee,stroke:#ad4454,color:#702c36;
    classDef modelNode fill:#e9f2fc,stroke:#3974ad,color:#23496e;
    class lookup,create,persistStop,save,persistQualified storage;
    class exists,gate,complete decision;
    class stopped stopState;
    class model,extract modelNode;
```

One message produces one execution. Returning a qualification question ends that execution; the customer's next message starts another one. The merge step preserves stored values when extraction returns missing, empty, or null values.

The existing-lead gate checks opt-out state, `BOOKED`, `CLOSED`, `HUMAN_TAKEOVER`, the `human_takeover` flag, and stop or prior-human-contact language in the latest message. A blocked lead is saved before the workflow returns `AUTOMATION_STOPPED`.

## Scoring and Routing

JavaScript applies business rules and calculates the score. The model does not choose the route. The conditions below follow the exported branch order; notification preparation, Gmail sending, and context restoration are grouped into single diagram nodes.

```mermaid
flowchart TD
    score[Score Solar Lead] --> hot{Is Lead HOT?}
    hot -->|Yes| booking[Prepare Booking Request]
    booking --> simulate[Simulate Booking]
    simulate --> hotSummary[Create Sales Summary]
    hotSummary --> hotStatus[Set HOT Final Status]
    hotStatus --> hotEmail[Prepare HOT notification / send Gmail / restore lead context]
    hotEmail --> hotSave[Persist HOT Result]
    hotSave --> hotResponse[Respond BOOKED]

    hot -->|No| warm{Is Lead WARM?}
    warm -->|Yes| nurture[Prepare Nurture Record]
    nurture --> warmSummary[Create WARM Sales Summary]
    warmSummary --> warmStatus[Set WARM Final Status]
    warmStatus --> warmSave[Persist WARM Result]
    warmSave --> warmResponse[Respond NURTURE]

    warm -->|No| review{Is Human Review?}
    review -->|Yes| takeover[HUMAN REVIEW]
    takeover --> reviewSummary[HUMAN REVIEW SUMMARY]
    reviewSummary --> reviewEmail[Prepare review notification / send Gmail / restore lead context]
    reviewEmail --> reviewSave[Persist HUMAN REVIEW Result]
    reviewSave --> reviewResponse[Respond HUMAN REVIEW]

    review -->|No| cold[Prepare COLD Record]
    cold --> coldSummary[COLD Summary]
    coldSummary --> coldSave[Persist COLD Result]
    coldSave --> coldResponse[Respond COLD]

    classDef hotRoute fill:#fcecee,stroke:#ad4454,color:#702c36;
    classDef warmRoute fill:#fff4d7,stroke:#a37412,color:#503b10;
    classDef coldRoute fill:#e9f2fc,stroke:#3974ad,color:#23496e;
    classDef reviewRoute fill:#eeedf7,stroke:#746392,color:#4e4067;
    class hotResponse hotRoute;
    class warmResponse warmRoute;
    class coldResponse coldRoute;
    class reviewResponse reviewRoute;
```

| Route | Saved state | Action |
| --- | --- | --- |
| HOT | `BOOKED`; follow-up stopped | Simulate booking, notify sales, save, respond. |
| WARM | `NURTURE`; follow-up `ACTIVE` | Set the first due date two days ahead, save, respond. |
| COLD | `COLD`; follow-up stopped | Save the result and respond. |
| HUMAN_REVIEW | `HUMAN_TAKEOVER`; `human_takeover = true` | Prepare takeover metadata, notify sales, save, respond. |

`HUMAN_REVIEW` is the lead temperature and route name; `HUMAN_TAKEOVER` is its saved process state. HOT booking is simulated, with no calendar reservation.

## WARM Follow-Up Scheduler

The scheduler export is inactive. When enabled, it is configured to run every six hours. It queries up to 50 leads with `lead_status = NURTURE` and `follow_up_status = ACTIVE`, then filters those results in code.

```mermaid
flowchart TD
    trigger[Every 6 Hours] --> find[Find Active Nurture Leads in Supabase]
    find --> gate{Can Automation Continue?}
    gate -->|Blocked items filtered out| endRun[No task or schedule update for that item]
    gate -->|Due and eligible| prepare[Prepare WARM Follow-up]
    prepare --> gmail[Send WARM Follow-up Task]
    gmail --> restore[Restore WARM Nurture Context]
    restore --> update[Update Nurture Schedule in Supabase]

    classDef storage fill:#e7f4ed,stroke:#25754b,color:#183c2b;
    classDef decision fill:#fff4d7,stroke:#a37412,color:#503b10;
    classDef email fill:#e9f2fc,stroke:#3974ad,color:#23496e;
    class find,update storage;
    class gate decision;
    class gmail email;
```

The gate requires a valid due date at or before the current time and fewer than three attempts. It blocks opted-out leads, terminal stop states, and human takeover. `UNKNOWN` consent currently passes this gate; it is not treated as explicit opt-in.

The Gmail node sends an internal task with a suggested customer message. It does not deliver that message to the customer. The blocked branch in the diagram represents items removed by the code node, not a separate n8n output connection.

| Event | Schedule update |
| --- | --- |
| Lead enters WARM nurture | First task due in 2 days. |
| First task attempt | Count becomes 1; next due date is 5 days after that run. |
| Second task attempt | Count becomes 2; next due date is 7 days after that run. |
| Third task attempt | Count becomes 3; status becomes `COMPLETE`; next due date is cleared. |

These are relative delays, so actual execution time depends on the scheduler run. The count records internal task attempts, not confirmed customer contact. The scheduler Gmail node retries once; unlike the main workflow's notification nodes, it is not configured to continue on failure. A node failure after retries stops execution before the schedule update.

## Shared State and Implementation Limits

Supabase connects the workflows through stored data, not a direct workflow call. It holds qualification fields, scores, statuses, consent, follow-up timestamps and counts, and takeover metadata. See [Data Schema](../DATA_SCHEMA.md) for field definitions.

- The main stop gate is on the existing-lead branch. New leads bypass it in the current export.
- The scheduler checks a fetched snapshot before sending. The export does not implement an atomic claim or a second state read immediately before delivery.
- Gmail errors do not block terminal persistence in the main workflow. Extraction or Supabase failures can stop an execution.
- Direct customer nurture delivery, real calendar booking, and an operator release interface are not shown because they are not implemented in these exports.
- The `Qualification Complete?` false branch is shown as it exists today; its later review remains separate work.

When workflow connections or scheduling rules change, update this page and the [overview SVG](assets/solarflow-architecture.svg) alongside the exports.
