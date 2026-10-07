---
name: n8n-audit-rules
description: Rules and safety contracts for the audit-n8n codebase — how the 8-category audit rule engine works, how to add or modify audit rules correctly, and the applyPatches() safety contract that protects n8n workflow JSON from unsafe AI-generated edits. Use when adding an audit rule, changing scoring, touching src/lib/audit/**, touching src/lib/ai/providers.ts, or reviewing AI workflow-patch logic.
---

# n8n Audit Rules & Patch Safety

Project-specific conventions for the audit-n8n repo. Violating these breaks audits
silently (rules that never fire) or corrupts exported workflows.

## 1. Architecture overview

- **Entry:** `src/lib/audit/engine.ts` exports `runAudit(workflow: N8nWorkflow): AuditResult`.
- It imports rule arrays from `src/lib/audit/rules/*.ts` (one file per category),
  concatenates them, runs `rule.check(workflow, helpers)` for each, groups findings
  by `rule.category`, then scores via `src/lib/audit/scoring.ts`.
- `buildHelpers(workflow)` from `src/lib/n8n/helpers.ts` provides traversal helpers —
  rules must use helpers instead of re-implementing node/graph walking.

## 2. The 8 categories (fixed list)

`error-handling`, `performance`, `security`, `best-practices`, `ai-security`,
`data-privacy`, `compliance`, `vendor-risk`.

- The canonical list lives in `ALL_CATEGORIES` in `engine.ts` **and** in
  `src/types/audit.ts` (`AuditCategory`) and `src/lib/audit/constants.ts`.
  Adding a category requires updating all three + a scoring weight, or findings
  never appear in results / scores are miscomputed.
- Each rules file exports an array of `AuditRule`: `{ id, category, severity,
  title, description, check(workflow, helpers) }`.
- `rule.category` must match the file's category or findings land in the wrong
  bucket (`findingsByCategory[rule.category]`).

## 3. Writing a rule — checklist

1. Unique, stable `id` (kebab-case, prefixed with category, e.g. `sec-credential-exposure`).
   IDs appear in reports and `finding-translations.ts` — never rename a shipped ID.
2. Return `[]` when nothing found — never `undefined`/throw; one bad rule kills the whole audit.
3. Only flag **literal** secrets, not n8n expressions: strings starting with `={{`
   or `{{` are references, not values (see `findSensitiveValues` in `rules/security.ts`).
4. Every new finding text needs an entry in `src/lib/audit/finding-translations.ts`
   for both `en` and `vi`, or the UI shows the raw key.
5. Findings must carry node names/positions when they relate to a node — the
   workflow canvas highlights based on them.
6. Run `npx tsc --noEmit && npm run lint` after changes (test coverage is a
   known gap; type-check is the safety net).

## 4. applyPatches() safety contract

`src/lib/ai/providers.ts` — the AI returns *patches*, never a full workflow JSON.
`applyPatches(original, parsed)` deep-clones the original and applies changes.
Invariants that must never be weakened:

- **Protected keys are read-only:** `credentials`, `type`, `typeVersion`,
  `position`, `id` (`PROTECTED_NODE_KEYS`) — skipped on every `set`.
- **Whitelist for other node keys:** only `PATCHABLE_NODE_KEYS`
  (`continueOnFail`, `onError`, `notes`, `notesInFlow`, `retryOnFail`,
  `maxTries`, `waitBetweenTries`, `executeOnce`, `alwaysOutputData`,
  `disabled`) may be assigned directly.
- **`onError` is validated** against `VALID_ON_ERROR`
  (`stopWorkflow` | `continueRegularOutput` | `continueErrorOutput`).
- **`parameters` are deep-merged**, never replaced — existing parameter keys
  not mentioned in the patch must survive (`deepMerge`).
- **Renames propagate to connections:** rename tracking updates all connection
  references so the graph stays valid; never apply a rename without it.
- The original workflow object must remain unmodified (clone first).

When changing this function, preserve all six invariants and add a regression
case; the output is exported to users as their workflow file.

## 5. Where things live

| Path | Purpose |
|---|---|
| `src/lib/audit/engine.ts` | Rule orchestration, category list |
| `src/lib/audit/rules/*.ts` | One rules file per category |
| `src/lib/audit/scoring.ts` | Category + overall score math |
| `src/lib/audit/finding-translations.ts` | en/vi finding copy |
| `src/lib/n8n/helpers.ts` | Traversal helpers for rules |
| `src/lib/n8n/parser.ts` | Workflow JSON parsing/validation |
| `src/lib/ai/providers.ts` | AI providers + `applyPatches()` |
| `src/lib/export/*` | PDF/JSON report export |
