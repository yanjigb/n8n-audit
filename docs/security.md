[← Previous Page](audit-categories.md) · [Back to README](../README.md) · [Next Page →](self-hosting.md)

# Security

Three security guarantees define this app: **no server-side secrets**, **validated AI output**, and **guarded workflow patching**.

## No Server-Side Secrets

- API keys are entered by the user, stored in **`sessionStorage` only** (never `localStorage`, never env files, never the persisted Zustand store).
- Keys travel **per-request** in the POST body to `/api/audit` and `/api/optimize`.
- The server constructs SDK clients on the fly (`new Anthropic({ apiKey })`) and discards the key after the call.
- The core audit flow works with zero environment variables.

| Do | Don't |
|----|-------|
| Keep keys in `sessionStorage` | Persist keys in the Zustand `audit-store` |
| Send keys per-request | Write keys to `.env` or logs |
| Clear keys on tab close | Share keys between browser storage targets |

## Distrust of AI Output

Everything the model returns is untrusted input:

1. **JSON extraction** — markdown fences stripped, outermost `{…}` sliced (`extractJson`).
2. **Field fallbacks** — every finding field defaults safely (`id`, `severity`, `title`…).
3. **Score recalculation** — category scores are recomputed from actual findings; AI-proposed scores are discarded. `overallScore` clamped to 0–100.
4. **Patch shape control** — the AI returns *patch objects*, never a full workflow JSON.

## applyPatches() Safety Contract

`src/lib/ai/providers.ts` deep-clones the original workflow, then applies AI patches under six invariants:

| Invariant | Rule |
|-----------|------|
| **Protected keys** | `credentials`, `type`, `typeVersion`, `position`, `id` are **never** modified — skipped on every `set` |
| **Key whitelist** | Only `PATCHABLE_NODE_KEYS` may be assigned directly: `continueOnFail`, `onError`, `notes`, `notesInFlow`, `retryOnFail`, `maxTries`, `waitBetweenTries`, `executeOnce`, `alwaysOutputData`, `disabled` |
| **onError validation** | Value must be one of `stopWorkflow`, `continueRegularOutput`, `continueErrorOutput` — otherwise ignored |
| **Parameter deep-merge** | `parameters` are merged key-by-key; unmentioned existing parameters survive |
| **Rename propagation** | Node renames update every connection reference so the graph stays valid |
| **Immutability** | The original workflow object is never mutated (clone-first) |

The optimized workflow is schema-validated before it is returned to the user.

**These invariants must never be weakened** — the output is exported as the user's workflow file. Full contract: `.opencode/skills/n8n-audit-rules/SKILL.md`.

## Static Secret Detection

The `security` rules scan workflow JSON for literal secrets:

- **Pattern-based:** OpenAI (`sk-`), Google (`AIza`), GitHub (`ghp_`/`gho_`), GitLab (`glpat-`), Slack (`xox…`), AWS (`AKIA…`), generic `Bearer`/`Basic` headers.
- **Key-name-based:** `password`, `apiKey`, `token`, `secret`, `authorization`, `clientSecret`, etc.
- **Expression-safe:** values starting with `={{` or `{{` are n8n expressions, not literals, and are never flagged.

## Reporting

If you discover a vulnerability in this repository, please report it responsibly rather than opening a public issue.

## See Also

- [API Reference](api.md) — per-request key transport
- [Audit Categories](audit-categories.md) — secret-detection rules
- [Architecture](architecture.md) — layer boundaries that enforce these guarantees
- [Self-Hosting](self-hosting.md) — deployment with zero server-side secrets
- [Contributing](contributing.md) — guidelines for code, rules, and security changes
