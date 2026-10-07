## Description
Brief summary of changes and why they're needed.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactor / chore
- [ ] CI/CD change
- [ ] Audit rule addition/modification
- [ ] AI provider / prompt changes

## Checklist

### Quality Gates (Required)
- [ ] `npx tsc --noEmit` passes — **0 TypeScript errors**
- [ ] `npm run lint` passes — **0 ESLint errors** (pre-existing `_helpers` warnings OK)
- [ ] `make check` passes locally
- [ ] `make build` succeeds

### Architecture & Code Standards
- [ ] Follows [Layered Architecture](docs/architecture.md) — new code in canonical folders:
  - `Controllers/` — HTTP handlers only
  - `Services/` — business logic
  - `Models/` — types (innermost, imports nothing)
  - `Repositories/` — data access interfaces
  - `Infrastructure/` — external adapters (AI, export, i18n, graph)
  - `Presentation/` — UI components, hooks, stores, pages
- [ ] **No upward imports**: `lib/` ↛ `app/`/`components/`/`hooks/`/`stores/`; `types/` ↛ anything
- [ ] No circular imports between `Services/`, `Repositories/`, `Infrastructure/`
- [ ] No business logic in Controllers or Presentation layer

### If Adding Audit Rules
- [ ] Unique, stable `id` prefixed by category (`sec-`, `err-`, `ai-`, `dp-`, `comp-`, `vr-`, `perf-`, `bp-`)
- [ ] Returns `[]` when nothing found — never `undefined` or throw
- [ ] Added `en` + `vi` translations in `src/lib/audit/finding-translations.ts`
- [ ] Findings include `nodeName` and `nodePosition` for canvas highlighting
- [ ] Followed [Adding a Rule checklist](docs/audit-categories.md#adding-a-rule--checklist)
- [ ] Ran `npx tsc --noEmit && npm run lint`

### If Touching AI Patch Logic (`src/lib/ai/providers.ts`)
- [ ] `applyPatches()` invariants **not weakened**:
  - Protected keys never modified: `credentials`, `type`, `typeVersion`, `position`, `id`
  - Only `PATCHABLE_NODE_KEYS` assignable: `continueOnFail`, `onError`, `notes`, `notesInFlow`, `retryOnFail`, `maxTries`, `waitBetweenTries`, `executeOnce`, `alwaysOutputData`, `disabled`
  - `onError` value validated: `stopWorkflow` | `continueRegularOutput` | `continueErrorOutput`
  - `parameters` deep-merged (not replaced)
  - Node renames propagate to all connection references
  - Original workflow never mutated (clone-first)

### If Modifying AI Prompts (`src/lib/ai/prompts.ts`, `audit-prompts.ts`)
- [ ] Prompts deterministic — same input → consistent output structure
- [ ] Never trust AI output shape — JSON extraction, fallbacks, score recalculation handled server-side
- [ ] Server-side score recalculation preserved (`calculateCategoryScore` from actual findings)

### Security
- [ ] No API keys in code, logs, or error messages
- [ ] API keys passed per-request only (not stored server-side)
- [ ] No secrets committed (`.env` in `.gitignore`)
- [ ] If new env vars: documented in `.env.example` and `docs/configuration.md`

### Documentation
- [ ] README/docs updated if user-facing changes
- [ ] `docs/` pages have prev/next navigation + "See Also" section
- [ ] New audit rules have `en`/`vi` translations

### Testing (Manual Verification)
- [ ] Dev server starts: `npm run dev` → http://localhost:3002
- [ ] Upload workflow → graph renders
- [ ] Audit with API key → scores + findings displayed
- [ ] Optimize → patches applied → workflow validates
- [ ] PDF/JSON export works

## Related Issues
Fixes #<issue-number>

## Screenshots (if UI changes)
<!-- Add before/after screenshots for UI changes -->

## Additional Notes
<!-- Breaking changes, migration steps, performance impact, etc. -->

---

## For Reviewers

### Quick Architecture Check
- [ ] No `lib/` imports from `app/`, `components/`, `hooks/`, `stores/`
- [ ] No `types/` imports from anywhere
- [ ] Rules are pure functions (no I/O, no async, no store access)
- [ ] API routes are thin proxies (delegating to services)

### Security Spot-Check
- [ ] `applyPatches()` protected keys respected
- [ ] No `localStorage` for API keys (sessionStorage only)
- [ ] No server-side secret storage

### CI Gates
Required checks that must pass:
- `lint` (ESLint)
- `typecheck` (tsc --noEmit)
- `build` (Next.js production build)