# AGENTS.md

AI agent guidance for the **audit-n8n** repository.

## Project Overview

AI-powered audit tool for n8n workflow JSON files. Users upload a workflow, choose an AI provider (Anthropic Claude or Google Gemini, bring-your-own key), and receive scored findings across 8 security/quality categories, with an optional AI optimization pass that applies safe patches back to the workflow. Reports export to PDF.

- No server-side secrets: API keys are passed per-request from the browser and stored in sessionStorage only.
- API routes distrust AI-generated scores and recalculate them from actual findings.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4 + shadcn/ui + Radix UI
- Zustand 5 (persist middleware, localStorage key `audit-store`)
- `@anthropic-ai/sdk` (claude-sonnet-4-20250514) · `@google/generative-ai` (gemini-2.5-flash)
- Zod v4 (validation) · `@xyflow/react` (graph viz) · `next-themes`
- Node.js 20 (Alpine) multi-stage Docker build
- Path alias: `@/*` → `src/*`

## Commands

This project uses a `Makefile` for build automation. Run `make help` for all targets.

| Command | Description |
|---------|-------------|
| `make dev` | Dev server on port 3002 |
| `make check` | Quality gates: `npm run lint` + `npx tsc --noEmit` |
| `make build` | Production build |
| `make ci` | Full pipeline: install → lint → typecheck → build |
| `make docker-build` / `make docker-dev` | Docker image build / compose up |
| `make clean` | Remove build artifacts (`.next/`, caches) |

Equivalent raw commands:

```bash
npm run dev      # Dev server on port 3002
npm run build    # Production build
npm run lint     # ESLint check
npx tsc --noEmit # Type check (no test suite exists)
```

## Directory Structure

```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx         # Upload/landing page (dropzone)
│   ├── audit/           # 8 category result sub-pages
│   └── api/             # POST /api/audit, POST /api/optimize
├── components/          # audit/ export/ graph/ layout/ optimize/ ui/ upload/
├── hooks/               # use-audit, use-workflow, use-api-keys, use-ai-optimization
├── lib/
│   ├── audit/           # engine.ts, scoring.ts, constants.ts, finding-translations.ts
│   │   └── rules/       # 8 rule files (60+ rules), one per category
│   ├── n8n/             # parser.ts (Zod schema), helpers.ts (graph utils), schema.ts
│   ├── ai/              # providers.ts (Claude/Gemini + applyPatches), prompts, types
│   ├── export/          # pdf-report.ts, json-report.ts
│   ├── i18n/            # en.ts, vi.ts
│   └── utils.ts
├── stores/              # audit-store.ts (single Zustand store)
└── types/               # n8n.ts, audit.ts
```

## Key Entry Points

1. **Upload** — `src/app/page.tsx` → `useWorkflow` → Zod validation (`src/lib/n8n/schema.ts`) → Zustand store
2. **Audit** — `POST /api/audit` → AI prompt (`src/lib/ai/audit-prompts.ts`) → merge with static rule results from `runAudit()` (`src/lib/audit/engine.ts`) → `AuditResult`
3. **Results** — `src/app/audit/` reads from store; scores recalculated on hydration
4. **Optimize** — `POST /api/optimize` → AI patch objects → `applyPatches()` (`src/lib/ai/providers.ts`) → schema-validated workflow

## Critical Safety Contract: `applyPatches()`

The AI returns *patches*, never a full workflow. Invariants — do not weaken:

- Protected keys are never modified: `credentials`, `type`, `typeVersion`, `position`, `id`
- Other node keys are whitelisted (`PATCHABLE_NODE_KEYS`); `onError` is value-validated
- `parameters` are deep-merged, not replaced
- Node renames propagate to all connection references
- The original workflow object is never mutated (clone first)

Full rules: `.opencode/skills/n8n-audit-rules/SKILL.md`.

## AI Context Files

| File | Purpose |
|---|---|
| `.ai-factory/DESCRIPTION.md` | Project spec / tech stack |
| `.ai-factory/config.yaml` | AI Factory settings (language, git) |
| `.ai-factory/rules/base.md` | Project coding conventions |
| `.ai-factory/ARCHITECTURE.md` | Architecture guidelines — Layered (Strict) |
| `.opencode/skills/n8n-audit-rules/` | Project skill: rule engine + patch safety |
| `.agents/skills/vercel-react-best-practices/` | React/Next.js perf rules (external, security-approved) |
| `CLAUDE.md` | Original Claude Code guidance |

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | `README.md` | Project landing page |
| Getting Started | `docs/getting-started.md` | Installation, setup, first steps |
| Architecture | `docs/architecture.md` | Project structure and patterns |
| API Reference | `docs/api.md` | Endpoint request/response contracts |
| Audit Categories | `docs/audit-categories.md` | 8 categories, rules, scoring model |
| Security | `docs/security.md` | Key handling and patch safety |
| Self-Hosting | `docs/self-hosting.md` | Docker, Kubernetes, reverse proxy deployment |
| Contributing | `docs/contributing.md` | Code, rules, docs, and quality gate guidelines |

## Shell-Command Decomposition

When a task requires multiple shell steps, decompose them into separate, individually verifiable commands rather than chaining long one-liners. Run independent commands in parallel; keep dependent steps sequential with an explicit check between them.

## Conventions

- UI and artifact language: English (i18n also ships `vi`).
- No test suite: type-check (`npx tsc --noEmit`) + `npm run lint` are the verification gates.
- Finding IDs are stable; new/changed findings need entries in `src/lib/audit/finding-translations.ts` (en + vi).
