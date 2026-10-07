[← Previous Page](architecture.md) · [Back to README](../README.md) · [Next Page →](audit-categories.md)

# API Reference

Two stateless POST endpoints. Both accept JSON, return JSON, and take the AI key **per request** (never from server env).

Base URL (dev): `http://localhost:3002`

---

## POST /api/audit

Runs the AI audit pass and returns a merged, server-revalidated `AuditResult`.

### Request

```json
{
  "workflow": { "name": "My Workflow", "nodes": [...], "connections": {...} },
  "provider": "claude",
  "apiKey": "sk-ant-...",
  "locale": "en"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `workflow` | `N8nWorkflow` | ✅ | Full n8n workflow JSON |
| `provider` | `"claude" \| "gemini"` | ✅ | Anything else → 400 |
| `apiKey` | `string` | ✅ | Anthropic or Google key, per-request |
| `locale` | `string` | — | `"en"` or `"vi"` — prompt language |

**Models:** `claude-sonnet-4-20250514` (max 8192 tokens) · `gemini-2.5-flash`

### Response — `200 AuditResult`

```json
{
  "overallScore": 78,
  "categories": {
    "security": { "category": "security", "score": 64, "findings": [...],
                   "criticalCount": 1, "warningCount": 3, "infoCount": 2 },
    "...": "8 categories"
  },
  "totalFindings": 14,
  "criticalFindings": 1,
  "warningFindings": 6,
  "infoFindings": 7,
  "workflowMeta": { "name": "...", "nodeCount": 12, "connectionCount": 14,
                     "hasErrorWorkflow": false, "isActive": false, "complexityScore": 0 },
  "timestamp": "2026-10-07T..."
}
```

**Score distrust:** per-category scores are always recomputed server-side from actual findings via `calculateCategoryScore()` — the AI's proposed scores are discarded. `overallScore` is clamped to 0–100.

### Errors

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "error": "Missing required fields: workflow, provider, apiKey" }` | Missing input |
| 400 | `{ "error": "Invalid provider. Must be 'claude' or 'gemini'." }` | Bad provider |
| 500 | `{ "error": "<message>" }` | Provider call or JSON parse failure |

---

## POST /api/optimize

Requests AI-generated patches and applies them through the guarded `applyPatches()` pipeline.

### Request

```json
{
  "workflow": { "...": "full workflow" },
  "auditResult": { "...": "result from /api/audit" },
  "provider": "claude",
  "apiKey": "sk-ant-...",
  "locale": "en"
}
```

| Field | Type | Required |
|-------|------|----------|
| `workflow` | `N8nWorkflow` | ✅ |
| `auditResult` | `AuditResult` | ✅ |
| `provider` | `"claude" \| "gemini"` | ✅ |
| `apiKey` | `string` | ✅ |
| `locale` | `string` | — |

### Response — `200 OptimizationResult`

Returns suggestions plus the optimized workflow. The optimized workflow is produced by applying patch objects to a **deep clone** of the original — protected keys are never modified, `parameters` are deep-merged, and node renames propagate to connections. The result is schema-validated before returning. See [Security](security.md).

### Errors

Same shape as `/api/audit` (400 for missing/invalid fields, 500 for upstream failures).

---

## Notes

- Both routes log failures as `console.error("[/api/audit] ...")` — no logging library.
- Responses are plain JSON; there is no auth layer because keys travel per-request.
- The client never sends stored secrets: `use-api-keys` keeps keys in `sessionStorage` only.

## See Also

- [Audit Categories](audit-categories.md) — what the findings mean
- [Security](security.md) — how keys and patches are protected
- [Architecture](architecture.md) — why routes stay thin
