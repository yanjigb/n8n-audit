# Project Base Rules (audit-n8n)

> Auto-detected conventions from codebase analysis. Edit as needed.

## Naming Conventions

- Files: kebab-case for all source files — `audit-store.ts`, `use-audit.ts`, `error-handling.ts`, `audit-summary.tsx`
- Variables: camelCase (`findingsByCategory`, `overallScore`)
- Functions: camelCase, verb-first (`runAudit`, `buildHelpers`, `extractAndParse`, `calculateCategoryScore`)
- React components: PascalCase, exported as named exports from kebab-case files (`AuditSummary` in `audit-summary.tsx`)
- Types/interfaces: PascalCase, no `I` prefix (`AuditResult`, `N8nWorkflow`, `AIProvider`)
- Constants: UPPER_SNAKE_CASE for module-level constants (`ALL_CATEGORIES`); module-level arrays of rules use camelCase named exports (`errorHandlingRules`)
- Custom hooks: `use-<noun>.ts` with `use<Noun>()` exports

## Module Structure

- `src/app/` — Next.js App Router: pages plus API route handlers (`app/api/<name>/route.ts`)
- `src/app/audit/<category>/page.tsx` — one sub-page per audit category
- `src/components/<domain>/` — domain-grouped components (`audit/`, `graph/`, `layout/`, `optimize/`, `upload/`, `export/`, `ui/`)
- `src/components/ui/` — shadcn/ui primitives (do not hand-roll; regenerate via `npx shadcn add <component>`)
- `src/lib/<domain>/` — core logic: `audit/` (engine + 8 rule files + scoring), `ai/` (providers + prompts), `n8n/` (schema + graph helpers), `export/`, `i18n/`
- `src/hooks/` — React hooks wrapping store actions and API calls
- `src/stores/` — single Zustand store (`audit-store.ts`) with `persist` middleware (localStorage key `audit-store`)
- `src/types/` — shared types (`audit.ts`, `n8n.ts`, `index.ts`)
- Path alias `@/*` → `src/*`; use `@/lib/...`, `@/types/...` across modules. Relative imports (`./rules/...`) are acceptable only within the same module directory.

## Error Handling

- API routes wrap handler bodies in `try/catch` and log with a route-prefixed tag: `console.error("[/api/audit] Error:", err)`, then return `NextResponse.json({ error }, { status: 500 })`
- AI responses are treated as untrusted: defensive multi-strategy JSON extraction (strip code fences → scan for outermost `{...}` → brace slicing), then field-level fallbacks (`?? default`) before merging
- Scores returned by the model are never trusted — API routes recalculate scores from the actual findings
- Validate anything persisted or applied with Zod schemas from `src/lib/n8n/schema.ts` before use
- Prefer guard clauses and early returns over nested conditionals (see `extractAndParse` in `src/lib/ai/providers.ts`)

## Control Flow

- Prefer flat, readable control flow over deeply nested conditionals. Use guard clauses, early `return`/`continue`, small named helper methods, or explicit classification logic when they make the code easier to follow. Handle edge cases and irrelevant branches early so the main path stays visible.

## Patch Safety

- When modifying workflow JSON via AI patches (`applyPatches` in `src/lib/ai/providers.ts`): never overwrite protected keys (`credentials`, `type`, `id`, `position`), merge parameters instead of replacing, track node renames into connections, validate output counts before adding connections, and Zod-validate the result before returning

## Styling

- Tailwind CSS v4 + shadcn/ui; compose classes with `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge), class variants via `class-variance-authority`
- Light/dark theming through `next-themes` — never hard-code colors outside `src/app/globals.css`

## Logging

- No logging library — `console.error` only, and only inside API route handlers, always prefixed with the route path
- Do not add `console.log` to shipped code paths; surface errors to the client through the response body / Zustand error state instead

## i18n

- User-facing strings live in `src/lib/i18n/en.ts` and `vi.ts`; the active locale is passed into AI calls as `locale` — new user-visible text must go through the i18n layer

## Testing

- No test suite exists; `npm run lint` (ESLint 9 + eslint-config-next) and `npx tsc --noEmit` are the current quality gates — both must pass with 0 errors before commit
