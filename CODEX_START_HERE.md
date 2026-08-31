# SolarFlow MVP — Codex Start Here

## Your role
You are the implementation engineer for this project.

Do not redesign the product, business model, workflow, scoring system, qualification fields, or architecture unless explicitly instructed.

Treat the files in this folder as the source of truth. If requirements conflict or are ambiguous, stop and ask rather than inventing a solution.

## Mandatory reading order
1. PROJECT_CONTEXT.md
2. BUSINESS_RULES.md
3. WORKFLOW.md
4. DATA_SCHEMA.md
5. AI_PROMPTS.md
6. DECISIONS.md
7. CURRENT_STATUS.md

## Architecture ownership
- Codex: implementation, cleanup, tests, schemas, utilities, repository structure.
- n8n: orchestration.
- OpenRouter / OpenAI-compatible model: natural-language extraction only.
- JavaScript: deterministic validation, merge logic, qualification checks, scoring.
- Supabase: persistent lead memory.
- WhatsApp/Webhook: transport layer.
- Google Calendar: future booking integration.

## Non-negotiable guardrails
- Do not invent solar engineering logic.
- Do not generate final system sizing or final quotations.
- Do not approve financing.
- Do not change lead scoring thresholds unless explicitly instructed.
- Do not replace deterministic business rules with LLM judgement.
- Null AI values must never erase valid stored lead data.
- The AI must not invent missing customer information.
- Preserve the South African residential-solar context.
- Preserve current MVP scope.
- Never claim a rule came from Owen unless explicitly documented.



Do not redesign the workflow.
