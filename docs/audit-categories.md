[← Previous Page](api.md) · [Back to README](../README.md) · [Next Page →](security.md)

# Audit Categories & Scoring

60+ rules across 8 categories, split between a **static rule engine** (client-side, pure TypeScript) and an **AI audit pass** (merged server-side).

## The 8 Categories

| Category | Weight | What It Checks |
|----------|--------|----------------|
| **security** | 0.18 | Exposed credentials, insecure HTTP calls, injection risks, secret patterns (`sk-`, `AKIA`, `ghp_`, Bearer tokens…) |
| **error-handling** | 0.15 | Missing error paths, unhandled failures, retry logic, error workflows |
| **ai-security** | 0.15 | Prompt injection risks in AI nodes, unsafe model configurations |
| **data-privacy** | 0.13 | PII exposure, logging of sensitive fields, data retention risks |
| **compliance** | 0.10 | GDPR/regulatory flags, audit-trail gaps, data residency |
| **vendor-risk** | 0.10 | Single-vendor over-reliance, deprecated node versions, third-party exposure |
| **performance** | 0.10 | Inefficient node patterns, large payloads, unnecessary polling |
| **best-practices** | 0.09 | Node naming, documentation, workflow structure hygiene |

Weights are defined in `CATEGORY_WEIGHTS` (`src/lib/audit/constants.ts`) and sum to 1.0.

## Severity Model

| Severity | Score deduction per finding |
|----------|----------------------------|
| `critical` | −25 |
| `warning` | −10 |
| `info` | −3 |

## Scoring Formula

**Category score** — exponential decay over total deduction, so the score approaches but never reaches 0 while findings exist:

```typescript
score = findings.length === 0
  ? 100
  : Math.max(1, Math.round(100 * Math.exp(-totalDeduction / 100)));
```

**Overall score** — weighted sum of the 8 category scores:

```typescript
overall = Σ (categoryScore × CATEGORY_WEIGHTS[category])
```

**Server-side recalculation:** after the AI responds, `/api/audit` recomputes every category score from the actual returned findings via `calculateCategoryScore()` — AI-proposed scores are never trusted.

## How Rules Work

Each rules file (`src/lib/audit/rules/*.ts`) exports an array of `AuditRule`:

```typescript
interface AuditRule {
  id: string;              // stable kebab-case ID (appears in reports + translations)
  category: AuditCategory; // must match the file's category
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  check: (workflow: N8nWorkflow, helpers: Helpers) => AuditFinding[];
}
```

- `runAudit()` (`src/lib/audit/engine.ts`) concatenates all 8 arrays, runs each `check()`, groups findings by category, and scores.
- `helpers` (from `buildHelpers(workflow)`) provides adjacency maps, BFS depth, orphan detection, and parameter extraction — rules never re-implement traversal.
- Secret detection flags **literal values only** — n8n expressions (`={{...}}`, `{{...}}`) are references, not secrets, and are skipped.

## Finding Translations

Every finding text has an entry in `src/lib/audit/finding-translations.ts` for **both `en` and `vi`**. New or renamed rule IDs must be added there or the UI shows the raw key.

## Adding a Rule — Checklist

1. Unique, stable `id` prefixed by category (e.g. `sec-credential-exposure`) — never rename a shipped ID.
2. Return `[]` when nothing is found; never `undefined` or throw (one bad rule kills the whole audit).
3. Add `en` + `vi` translations.
4. Include node names/positions in findings so the canvas can highlight them.
5. Run `npx tsc --noEmit && npm run lint`.

Full convention: `.opencode/skills/n8n-audit-rules/SKILL.md`.

## See Also

- [API Reference](api.md) — where findings are produced and recalculated
- [Security](security.md) — secret detection and patch safety
- [Architecture](architecture.md) — why rules are pure functions
- [Contributing](contributing.md) — guidelines for adding audit rules
