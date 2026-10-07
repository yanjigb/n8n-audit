[← Previous Page](self-hosting.md) · [Back to README](../README.md)

# Contributing

Guidelines for contributing to audit-n8n — code changes, audit rules, documentation, and quality gates.

## Quick Reference

| Task | Command |
|------|---------|
| Run dev server | `npm run dev` (port 3002) |
| Type-check | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Full quality check | `make check` |
| Build | `npm run build` |
| Docker build | `make docker-build` |

---

## Code Contributions

### Before You Start

1. **Read the architecture** — [Architecture](architecture.md) documents the Layered Architecture (Strict) and dependency rules.
2. **Understand the safety contracts** — [Security](security.md) covers `applyPatches()` invariants, no server-side secrets, and AI output distrust.
3. **Run quality gates locally** — `make check` must pass (0 TypeScript errors, 0 ESLint errors).

### Pull Request Checklist

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors (pre-existing warnings in `_helpers` are OK)
- [ ] Changes follow the [Layered Architecture](architecture.md) — new code in canonical folders (`Controllers/`, `Services/`, `Models/`, `Repositories/`, `Infrastructure/`)
- [ ] No upward imports (`lib/` → `app/`/`components/`/`hooks/`/`stores/`, `types/` → anything)
- [ ] No circular imports between `Services/`, `Repositories/`, `Infrastructure/`
- [ ] If adding audit rules: follow the [Audit Categories](audit-categories.md#adding-a-rule--checklist) checklist
- [ ] If touching AI patch logic: do not weaken `applyPatches()` invariants (protected keys, whitelist, deep-merge, rename propagation)

### Branch & Commit Conventions

- Branch name: `feature/<short-description>` or `fix/<short-description>`
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
- Run `make ci` locally before pushing — it runs install → lint → typecheck → build

---

## Adding Audit Rules

The static rule engine lives in `src/lib/audit/rules/` — one file per category (8 files, 60+ rules).

### Rule Structure

```typescript
// src/lib/audit/rules/security.ts
export const securityRules: AuditRule[] = [
  {
    id: "sec-credential-exposure",        // stable kebab-case, category prefix
    category: "security",
    severity: "critical",
    title: "Exposed Credential",
    description: "Workflow contains a literal credential value in node parameters.",
    check: (workflow, helpers) => {
      // pure function — no I/O, no async, no store access
      // return AuditFinding[] with nodeName/nodePosition for canvas highlighting
    }
  }
];
```

### Adding a Rule — Required Steps

1. **Unique, stable ID** — prefixed by category (e.g., `sec-`, `err-`, `ai-`, `dp-`, `comp-`, `vr-`, `perf-`, `bp-`). Never rename a shipped ID.
2. **Return `[]` when nothing found** — never `undefined` or throw (one bad rule kills the whole audit).
3. **Add translations** — both `en` and `vi` entries in `src/lib/audit/finding-translations.ts`.
4. **Include node context** — findings must include `nodeName` and `nodePosition` so the canvas can highlight them.
5. **Run quality gates** — `npx tsc --noEmit && npm run lint`.

Full convention: `.opencode/skills/n8n-audit-rules/SKILL.md`.

---

## AI Provider Changes

AI integrations live in `src/lib/ai/`:
- `providers.ts` — `AnthropicProvider`, `GeminiProvider`, `applyPatches()`
- `prompts/` — audit and optimization prompt templates

### Modifying Prompts

- Keep prompts deterministic — same input should produce consistent output structure.
- Never trust AI output shape: `/api/audit` and `/api/optimize` use multi-strategy JSON extraction and Zod-style fallbacks.
- Server-side score recalculation happens after AI response — AI-proposed scores are advisory only.

### Adding a New Provider

1. Implement the provider interface in `providers.ts` (match `AnthropicProvider`/`GeminiProvider` shape).
2. Add to `ProviderFactory` or the route handler's provider selection logic.
3. Update the UI provider selector (`src/components/audit/`).
4. Ensure JSON extraction handles the new provider's response format.

---

## Documentation Contributions

Documentation lives in `docs/` (this directory) with `README.md` as the landing page.

### Documentation Standards

- **README is a landing page** (~80–120 lines): tagline, quick start, example, documentation table, license.
- **Details in `docs/`**: each file is self-contained, one topic per page.
- **No duplication** — README links to `docs/`, doesn't repeat content.
- **Navigation** — every `docs/` page has a prev/next header link (following the README table order) and a "See Also" footer with 2–3 related pages.
- **Scannable** — use tables, bullet lists, code blocks; avoid long paragraphs.

### Adding a Documentation Page

1. Create `docs/<topic>.md` with:
   - Prev/next header: `[← Previous](prev.md) · [Back to README](../README.md) · [Next Topic →](next.md)`
   - Content organized by subtopic
   - `## See Also` footer with 2–3 related links
2. Add row to README's Documentation table (maintains the prev/next order).
3. Update prev/next links in adjacent pages.

---

## Testing & Quality

There is **no test suite**. The verification gates are:

```bash
npx tsc --noEmit   # TypeScript — must be 0 errors
npm run lint       # ESLint — must be 0 errors
```

Run both via `make check`. The CI pipeline (`make ci`) runs install → lint → typecheck → build.

### Pre-existing Warnings

Some ESLint warnings exist in `_helpers` files — these are acceptable. New code must not introduce new warnings.

---

## Security Reporting

If you discover a security vulnerability in this repository, please report it responsibly rather than opening a public issue. See [Security](security.md) for the project's security model.

---

## See Also

- [Getting Started](getting-started.md) — installation, dev server, quality checks
- [Architecture](architecture.md) — layered structure, dependency rules, data flow
- [Audit Categories](audit-categories.md) — rule engine internals, adding rules
- [Security](security.md) — patch safety, key handling, AI output distrust
- [Self-Hosting](self-hosting.md) — Docker, Kubernetes, reverse proxy deployment