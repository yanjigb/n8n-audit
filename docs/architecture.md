[← Previous Page](getting-started.md) · [Back to README](../README.md) · [Next Page →](api.md)

# Architecture

audit-n8n follows a **Layered Architecture** adapted to Next.js App Router conventions. Full guidelines live in [`.ai-factory/ARCHITECTURE.md`](../.ai-factory/ARCHITECTURE.md); this page is the orientation tour.

## Layers

```
app/ (routes)  →  hooks/ stores/  →  lib/  →  types/
components/    →  hooks/ stores/  →  lib/  →  types/
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Controllers / views | `src/app/` | Route handlers, pages — thin, no business logic |
| Presentation | `src/components/` | UI only (audit, export, graph, upload, ui) |
| Orchestration | `src/hooks/`, `src/stores/` | API calls, Zustand state (persisted to localStorage) |
| Services | `src/lib/` | Rule engine, scoring, AI providers, export, i18n |
| Models | `src/types/` | Shared types — innermost layer, imports nothing |

## Directory Map

```
src/
├── app/
│   ├── page.tsx              # Upload / landing page
│   ├── audit/                # 8 category result sub-pages
│   └── api/
│       ├── audit/route.ts    # POST /api/audit
│       └── optimize/route.ts # POST /api/optimize
├── components/               # audit/ export/ graph/ layout/ optimize/ ui/ upload/
├── hooks/                    # use-workflow, use-audit, use-api-keys, use-ai-optimization
├── stores/                   # audit-store.ts (Zustand + persist, key "audit-store")
├── lib/
│   ├── audit/
│   │   ├── engine.ts         # runAudit() — composes all rules
│   │   ├── scoring.ts        # Category + overall score math
│   │   ├── constants.ts      # Weights, severity deductions, labels
│   │   └── rules/            # 8 files, 60+ rules — pure functions
│   ├── n8n/                  # parser.ts, schema.ts (Zod), helpers.ts (graph utils)
│   ├── ai/                   # providers.ts (Claude/Gemini + applyPatches), prompts
│   ├── export/               # pdf-report.ts, json-report.ts
│   └── i18n/                 # en.ts, vi.ts
└── types/                    # n8n.ts, audit.ts
```

## Data Flow

1. **Upload** — dropzone → `useWorkflow` → Zod validation (`src/lib/n8n/schema.ts`) → Zustand store
2. **Audit** — `POST /api/audit` → static `runAudit()` merged with AI findings → scores recalculated → store
3. **Results** — `src/app/audit/` sub-pages read from the store; scores recalculated on hydration
4. **Optimize** (optional) — `POST /api/optimize` → AI patch objects → `applyPatches()` → re-validated workflow

## Key Patterns

- **Rules are pure.** Each file in `lib/audit/rules/` exports an array of `{ id, category, severity, check(workflow, helpers) }`. No I/O, no async, no store access. The engine passes a `helpers` object (adjacency maps, BFS depth, orphan detection) into every check.
- **AI output is never trusted.** Multi-strategy JSON extraction, field fallbacks, Zod-style defaulting, and server-side score recalculation happen before any response returns.
- **State flows one way:** components → hooks → API/store → components. The persisted Zustand store is the single source of truth.
- **Path alias:** `@/*` maps to `src/*`.

## Dependency Rules

- ✅ `lib/` may import `types/`; API routes may import `lib/`
- ❌ `lib/` must not import `app/`, `components/`, `hooks/`, or `stores/`
- ❌ `types/` must not import anything
- ❌ Rules must not call AI SDKs, `fetch`, or the store

## See Also

- [API Reference](api.md) — the two route handlers in detail
- [Audit Categories](audit-categories.md) — rule engine internals
- [Security](security.md) — patch safety and key handling
