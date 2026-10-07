# audit-n8n — Project Description

## Overview

AI-powered audit tool for n8n workflow JSON files. Users upload a workflow (drag-and-drop), choose an AI provider (Anthropic Claude or Google Gemini, bring-your-own API key), and receive scored findings across 8 security/quality categories, with an optional AI optimization pass that applies safe patches back to the workflow.

Client-side app: no database, no server-side secrets. API keys are passed per-request from the browser and stored in sessionStorage only.

## Core Features

- Workflow upload with Zod-validated n8n schema parsing and graph visualization (React Flow)
- Static rule engine: 60+ rules across 8 categories (`error-handling`, `performance`, `security`, `best-practices`, `ai-security`, `data-privacy`, `compliance`, `vendor-risk`)
- AI audit pass (Claude `claude-sonnet-4-20250514` / Gemini `gemini-2.5-flash`) merged with static rule results
- Weighted scoring (per-category + overall), recalculated server-side from actual findings (AI-proposed scores are distrusted)
- AI optimization pass producing patch objects, applied through `applyPatches()` with protected-key rules and schema validation
- PDF export (jsPDF) and JSON report export
- Interactive workflow graph view, light/dark theme, EN/VI localization

## Tech Stack

- **Programming language:** TypeScript 5 (strict), ES2017 target
- **Framework:** Next.js 16 (App Router) + React 19, `output: "standalone"`
- **Styling:** Tailwind CSS v4 + shadcn/ui + Radix UI + CVA + tailwind-merge
- **State management:** Zustand 5 with `persist` middleware (localStorage key `audit-store`)
- **Validation:** Zod v4 (`src/lib/n8n/schema.ts`)
- **AI SDKs:** `@anthropic-ai/sdk`, `@google/generative-ai`
- **Graph:** `@xyflow/react`
- **Export:** `jspdf`, `react-markdown`
- **Database:** none (no ORM, no server-side storage)
- **Runtime/deploy:** Node.js 20 Alpine via multi-stage Dockerfile; docker-compose uses the published image `yanji2510/audit-n8n:latest`

## Architecture Notes

- Two API route handlers only: `POST /api/audit` and `POST /api/optimize`. They are stateless proxies that build prompts, call the provider SDK, defensively extract JSON, and validate/recalculate results.
- Data flow: upload → Zod validation → Zustand store → audit (static engine + AI) → category sub-pages read from store → optional optimize → `applyPatches()` → re-validated workflow.
- Rule engine is pure and synchronous: each rule file exports an array of `{ category, check(workflow, helpers) }`; `runAudit()` composes them and scoring is separate (`scoring.ts`).
- Graph utilities (`src/lib/n8n/helpers.ts`): adjacency maps, BFS depth, orphan detection, parameter extraction — passed to rules as a `helpers` object.
- AI outputs are never trusted: multi-strategy JSON extraction, field fallbacks, Zod validation, server-side score recalculation.

## Architecture

Detailed architecture guidelines: `.ai-factory/ARCHITECTURE.md`

**Pattern**: Layered Architecture (Strict)

## Non-Functional Requirements

- **Logging:** `console.error` with route prefix only; no logging library
- **Error handling:** try/catch in API routes returning structured `{ error }` JSON; client errors surfaced via store error state
- **Security:** no server-side secrets; API keys live in sessionStorage and travel per-request; protected workflow keys (`credentials`, `type`, `id`, `position`) must never be overwritten by patches
- **Quality gates:** `npm run lint` and `npx tsc --noEmit` must pass with 0 errors (no test suite exists)
- **i18n:** user-facing text through `src/lib/i18n` (en/vi); locale passed to AI calls
