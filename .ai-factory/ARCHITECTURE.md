# Architecture: Layered Architecture (Strict)

## Overview

This project follows a **Layered Architecture** with strict horizontal separation: Controllers handle HTTP, Services contain business logic, Models define data structures, and Repositories manage data access. Dependencies flow strictly downward — Controllers → Services → Repositories → Database. This document defines the *target* architecture; the existing Next.js codebase uses framework-idiomatic folders (`app/`, `lib/`, `types/`) which map to these layers but do not yet match the canonical structure. New code must follow the strict layout; legacy code will be migrated incrementally.

## Decision Rationale

- **Project type:** Client-side Next.js audit tool — no DB, no server-side storage, per-request BYO AI keys
- **Tech stack:** Next.js 16 (App Router) + TypeScript 5 (strict) + Zustand 5 + Zod v4
- **Key factor:** Even without a database, the layered pattern enforces the primary invariant — business logic stays out of route handlers and UI components. The canonical structure makes this explicit and prepares for future extraction of the rule engine as a standalone library.

## Folder Structure

```
src/
├── Controllers/                    # ── PRESENTATION (HTTP handling only) ──
│   ├── AuditController.ts          # POST /api/audit, POST /api/optimize
│   └── index.ts                    # Route registration / exports
│
├── Services/                       # ── APPLICATION LOGIC (orchestration) ──
│   ├── AuditService.ts             # runAudit(), mergeFindings(), recalculateScores()
│   ├── OptimizationService.ts      # callProvider(), applyPatches(), validateResult()
│   └── index.ts
│
├── Models/                         # ── DOMAIN / DATA STRUCTURES ──
│   ├── Workflow.ts                 # N8nWorkflow, N8nNode, N8nConnection
│   ├── AuditResult.ts              # AuditResult, CategoryScore, AuditFinding
│   ├── AuditRule.ts                # AuditRule, AuditCategory, Severity
│   └── index.ts
│
├── Repositories/                   # ── DATA ACCESS (abstraction over storage) ──
│   ├── WorkflowRepository.ts       # parse(), validate(), serialize() — Zod schema
│   ├── RuleRepository.ts           # loadRules(), getRulesByCategory()
│   └── index.ts
│
├── Infrastructure/                 # ── CROSS-CUTTING (external adapters, utils) ──
│   ├── AI/
│   │   ├── AnthropicAdapter.ts     # Claude SDK wrapper
│   │   ├── GeminiAdapter.ts        # Gemini SDK wrapper
│   │   └── ProviderFactory.ts
│   ├── Export/
│   │   ├── PDFExporter.ts
│   │   └── JSONExporter.ts
│   ├── I18n/
│   │   ├── en.ts
│   │   └── vi.ts
│   ├── Graph/
│   │   └── Helpers.ts              # adjacency maps, BFS, orphan detection
│   └── Utils.ts
│
└── Presentation/                   # ── UI / CLIENT STATE (Next.js specific) ──
    ├── Components/                 # React components (audit, graph, upload, ui)
    ├── Hooks/                      # useWorkflow, useAudit, useApiKeys, useAIOptimization
    ├── Stores/                     # Zustand store (audit-store)
    └── Pages/                      # Next.js App Router pages (page.tsx, audit/)
```

## Dependency Rules

Strict downward flow — each layer depends **only** on the layer(s) directly below it:

```
Controllers → Services → Models
              ↓
           Repositories → (none — innermost with Models)
              ↓
        Infrastructure (adapters implement Repository interfaces)
              ↓
        Presentation (UI) → calls Controllers via fetch; reads/writes Stores
```

- ✅ `Controllers` import `Services` and `Models`
- ✅ `Services` import `Models` and `Repository` interfaces (from `Repositories/`)
- ✅ `Repositories` import `Models` only
- ✅ `Infrastructure` implements `Repository` interfaces; imports `Models`
- ✅ `Presentation` calls `Controllers` via HTTP; uses `Stores` for state
- ❌ **Never** import upward: `Services` → `Controllers`, `Models` → anything, `Repositories` → `Services`
- ❌ **Never** skip layers: `Controllers` → `Repositories` (must go through `Services`)
- ❌ **Never** circular: `Infrastructure` must not import `Services` or `Controllers`
- ❌ `Presentation` must not import `Services`, `Repositories`, or `Infrastructure` directly

## Layer / Module Communication

- **Controller → Service:** Controllers receive HTTP requests, parse/validate input (Zod), call **one** Service method, and shape the JSON response. No business logic in Controllers.
- **Service → Repository:** Services depend on Repository **interfaces** (defined in `Repositories/`). Concrete implementations live in `Infrastructure/`. This enables testing Services with fake repositories.
- **Service → Service:** Plain function calls with explicit parameters. `AuditService` composes rules from `RuleRepository`; `OptimizationService` uses `AI` adapters from `Infrastructure`.
- **Rules:** Pure functions in `Services/` (or a `Domain/` sublayer) — workflow + helpers in, findings out. No I/O, no async, no store access.
- **Validation at boundaries:** Zod schemas in `Repositories/WorkflowRepository` parse uploads; `Infrastructure/AI` adapters validate AI JSON output before returning.

## Key Principles

1. **Controllers are thin, distrustful proxies.** They never trust AI output: multi-strategy JSON extraction, Zod validation, and server-side score recalculation happen before responding. AI-proposed scores are advisory only.
2. **The rule engine is pure and synchronous.** `AuditService.runAudit()` takes a workflow, returns findings — no I/O, no async, no store access. Any rule violating this is a bug (see `.opencode/skills/n8n-audit-rules/SKILL.md`).
3. **Safety contracts are invariants, not preferences.** `OptimizationService.applyPatches()` protected keys (`credentials`, `type`, `typeVersion`, `position`, `id`), the patchable-key whitelist, parameter deep-merge, and rename-propagation must never be weakened.
4. **No server-side secrets, ever.** API keys live in sessionStorage, travel per-request, and must never be written to env files, logs, or the Zustand persisted store.
5. **Repository interfaces define the data contract.** Swapping storage (file → DB → remote) requires only a new `Infrastructure` implementation, not Service changes.
6. **State flows one way:** `Presentation` → `Controllers` (HTTP) / `Stores` (client) → `Services` → `Repositories` → `Models`.

## Legacy vs New Code Policy

- **New Features:** All new code MUST strictly follow the architecture defined in this document. New files go into the canonical folders (`Controllers/`, `Services/`, `Models/`, `Repositories/`, `Infrastructure/`).
- **Legacy Code Modification:** Do NOT automatically refactor unrelated legacy code to fit this architecture. Touch legacy code only when necessary for bug fixes, when tasked with explicit refactoring, or when adapting it to be consumed by new features.
- **Interoperability:** When new code must call legacy code (e.g., a new Service using the existing `lib/n8n/helpers.ts`), isolate the interaction using adapters, interfaces, or facades so that legacy patterns do not pollute the new architecture. Legacy `lib/` utilities are treated as `Infrastructure` until migrated.

## Code Examples

### Thin Controller delegating to Service

```typescript
// src/Controllers/AuditController.ts
import { AuditService } from "@/Services/AuditService";
import { OptimizationService } from "@/Services/OptimizationService";
import { WorkflowRepository } from "@/Repositories/WorkflowRepository";
import { AnthropicAdapter, GeminiAdapter } from "@/Infrastructure/AI";
import type { AuditRequest, OptimizeRequest } from "@/Models";

export class AuditController {
  private auditService = new AuditService(new WorkflowRepository());
  private optimizeService = new OptimizationService(
    new AnthropicAdapter(),
    new GeminiAdapter()
  );

  async audit(req: Request): Promise<Response> {
    const body = await req.json() as AuditRequest;
    const workflow = WorkflowRepository.parse(body.workflow); // Zod gate

    const result = await this.auditService.execute(workflow, body.provider, body.apiKey, body.locale);
    return Response.json(result);
  }

  async optimize(req: Request): Promise<Response> {
    const body = await req.json() as OptimizeRequest;
    const workflow = WorkflowRepository.parse(body.workflow);

    const result = await this.optimizeService.execute(
      workflow,
      body.auditResult,
      body.provider,
      body.apiKey,
      body.locale
    );
    return Response.json(result);
  }
}
```

### Pure Service orchestrating Repositories

```typescript
// src/Services/AuditService.ts
import type { WorkflowRepository } from "@/Repositories/WorkflowRepository";
import type { RuleRepository } from "@/Repositories/RuleRepository";
import type { N8nWorkflow, AuditResult, AuditCategory } from "@/Models";
import { calculateCategoryScore, calculateOverallScore } from "./scoring";

export class AuditService {
  constructor(
    private workflowRepo: WorkflowRepository,
    private ruleRepo: RuleRepository
  ) {}

  async execute(
    workflow: N8nWorkflow,
    provider: "claude" | "gemini",
    apiKey: string,
    locale?: string
  ): Promise<AuditResult> {
    // Static rules — pure, sync, no I/O
    const helpers = GraphHelpers.build(workflow);
    const staticFindings = this.ruleRepo.getAllRules().flatMap(rule =>
      rule.check(workflow, helpers)
    );

    // AI findings — untrusted, validated after
    const aiFindings = await this.callAI(provider, apiKey, workflow, locale);
    const merged = this.mergeAndRecalculate(staticFindings, aiFindings);

    return {
      overallScore: calculateOverallScore(merged),
      categories: merged,
      totalFindings: Object.values(merged).flatMap(c => c.findings).length,
      criticalFindings: Object.values(merged).flatMap(c => c.findings).filter(f => f.severity === "critical").length,
      warningFindings: Object.values(merged).flatMap(c => c.findings).filter(f => f.severity === "warning").length,
      infoFindings: Object.values(merged).flatMap(c => c.findings).filter(f => f.severity === "info").length,
      timestamp: new Date().toISOString(),
    };
  }

  private mergeAndRecalculate(...) { /* recalc scores from actual findings */ }
}
```

### Repository Interface + Infrastructure Implementation

```typescript
// src/Repositories/WorkflowRepository.ts (interface)
import type { N8nWorkflow } from "@/Models";

export interface WorkflowRepository {
  parse(json: unknown): N8nWorkflow;     // throws on invalid
  validate(workflow: N8nWorkflow): boolean;
  serialize(workflow: N8nWorkflow): string;
}

// src/Infrastructure/WorkflowRepositoryImpl.ts (Zod implementation)
import { WorkflowRepository } from "@/Repositories/WorkflowRepository";
import { z } from "zod";
import type { N8nWorkflow } from "@/Models";

const WorkflowSchema = z.object({ /* ... */ });

export class WorkflowRepositoryImpl implements WorkflowRepository {
  parse(json: unknown): N8nWorkflow {
    return WorkflowSchema.parse(json); // throws if invalid
  }
  validate(workflow: N8nWorkflow): boolean {
    return WorkflowSchema.safeParse(workflow).success;
  }
  serialize(workflow: N8nWorkflow): string {
    return JSON.stringify(workflow, null, 2);
  }
}
```

## Anti-Patterns

- ❌ Business logic in Controllers or Presentation (if/else on domain state, scoring math, patch rules) — it belongs in `Services/`
- ❌ Services importing Controllers, Infrastructure, or Presentation
- ❌ Models importing anything — they are the innermost layer
- ❌ Repositories calling Services (upward dependency)
- ❌ Trusting AI-generated scores, finding counts, or full-workflow JSON without validation and recalculation
- ❌ Writing API keys to `localStorage`, env files, or the persisted Zustand store
- ❌ Weakening `applyPatches()` invariants (protected keys, whitelist, deep-merge, rename propagation)
- ❌ Circular imports between `Services/`, `Repositories/`, `Infrastructure/`
- ❌ Presentation (components/hooks) calling Services or Repositories directly — must go through Controllers (HTTP) or Stores