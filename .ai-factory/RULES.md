# Project Rules

> Short, actionable rules and conventions for this project. Loaded automatically by /aif-implement.

## Rules

- Never weaken the applyPatches() invariants: protected keys (credentials, type, typeVersion, position, id) stay read-only, patchable keys stay whitelisted, parameters are deep-merged (never replaced), and node renames must propagate to all connections.
- Never store, log, or persist API keys beyond sessionStorage; keys travel per-request only and must never be written to .env files or the persisted Zustand store.
- Keep audit rules pure and synchronous: no fetch, no AI SDK calls, no store access inside src/lib/audit/rules/** — workflow and helpers in, findings out.
- Never trust AI-generated output: always extract JSON defensively and recalculate category scores from actual findings before responding.
- Every shipped rule ID is stable and kebab-case; changing or adding a finding requires en + vi entries in src/lib/audit/finding-translations.ts.
- API routes stay thin: parse input, call one lib/ orchestration function, shape the response — no business logic in route handlers.
- Never import upward: src/lib must not import from app/, components/, hooks/, or stores/; src/types imports nothing.
- All new user-facing text goes through src/lib/i18n (en/vi), never hardcoded in components.
- Quality gates before considering any change done: npx tsc --noEmit (0 errors) and npm run lint (0 errors).
- Use the @/* path alias for imports (maps to src/*); never use relative paths that escape the current src subtree.
