# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# PARALLEL ORCHESTRATION (Always-On MCP)

## Workflow for complex tasks (>= 3 files or >= 2 independent parts):
1. orchestrate_init → ask user for agent count
2. orchestrate_create_agent × N
3. Spawn N Agent tools IN PARALLEL
4. orchestrate_report × N
5. orchestrate_collect → SUMMARY.md

## Pre-flight Checks

Before starting complex tasks (multi-file generation, parallel agents, site cloning):
1. Verify file write permissions in the working directory before spawning parallel agents or batch operations.
2. Check that all required env files exist and have required vars.
3. Confirm key tools (node, npm, npx) are available.
4. Write and read a test file in the target directory to validate the environment is functional. Abort early if basics fail.

## Next.js / TypeScript

- When debugging redirects or routing issues, always check `middleware.ts` and NextAuth configuration FIRST before modifying page.tsx files — they often intercept requests before page components run.
- Avoid brute-force iteration on routing/auth issues; understand the component interaction (middleware → NextAuth → page) before attempting fixes.

## Commands

```bash
npm run dev      # Dev server on port 3002
npm run build    # Production build
npm run lint     # ESLint check
```

No test suite exists currently.

## Architecture

**Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Zustand + Anthropic SDK + Google Generative AI

**Purpose**: AI-powered audit tool for n8n workflow JSON files. Users upload a workflow, choose Claude or Gemini, and get findings across 8 security/quality categories with an optional AI optimization pass.

### Data Flow

1. **Upload** (`src/app/page.tsx`): Dropzone → `useWorkflow` hook → Zod schema validation (`src/lib/n8n/schema.ts`) → Zustand store
2. **Audit** (`POST /api/audit`): Workflow + provider/key → AI prompt → JSON extraction → merge with static rule results → `AuditResult` stored
3. **Results** (`src/app/audit/`): 8 category sub-pages reading from store; scores recalculated on hydration
4. **Optimize** (`POST /api/optimize`): Workflow + audit results → AI patch objects → `applyPatches()` → validated optimized workflow

### Key Directories

- `src/lib/audit/rules/` — 8 rule files (60+ individual rules): `error-handling`, `performance`, `security`, `best-practices`, `ai-security`, `data-privacy`, `compliance`, `vendor-risk`
- `src/lib/audit/engine.ts` — `runAudit()` orchestrates all rule categories and scoring
- `src/lib/audit/scoring.ts` — Weighted score calculation across categories
- `src/lib/n8n/helpers.ts` — Graph utilities: adjacency maps, BFS depth, orphan detection, parameter extraction
- `src/lib/ai/providers.ts` — Claude (`claude-sonnet-4-20250514`, 8192 tokens) and Gemini (`gemini-2.5-flash`) calls; also contains `applyPatches()` for safe node modifications
- `src/lib/ai/audit-prompts.ts` — System/user prompts for the audit phase
- `src/stores/audit-store.ts` — Single Zustand store with `persist` middleware (localStorage key: `audit-store`)
- `src/hooks/` — `use-audit.ts`, `use-workflow.ts`, `use-api-keys.ts` (sessionStorage), `use-ai-optimization.ts`

### API Routes

- `POST /api/audit` — Body: `{ workflow, provider, apiKey, locale }` → `AuditResult`
- `POST /api/optimize` — Body: `{ workflow, auditResult, provider, apiKey, locale }` → `OptimizationResult`

The API routes distrust the AI-generated score; they recalculate scores from the actual findings after response parsing.

### Patch Safety (`applyPatches`)

Protected keys (credentials, type, id, position) are never overwritten. Parameters are merged (not replaced). Node renames are tracked and reflected in connections. Output counts are validated before adding connections. Results are schema-validated before returning.

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json`).

### Environment

Copy `.env` and fill in your own values. The app requires no server-side env vars for core audit functionality — API keys are passed from the client per-request and stored in sessionStorage.
