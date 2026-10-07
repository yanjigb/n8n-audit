[Back to README](../README.md) · [Next Page →](architecture.md)

# Getting Started

Install, run, and verify the audit-n8n development environment.

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |

No database, no server-side env vars, no Docker required for development.

## Installation

```bash
git clone https://github.com/yanjigb/n8n-audit.git
cd audit-n8n
npm ci
```

> Use `npm ci` (not `npm install`) — it installs strictly from `package-lock.json`.

## Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) — note the port is **3002**, not the Next.js default 3000.

## Verify It Works

1. Drop any n8n workflow JSON file on the upload zone (export one from n8n: *Workflow → Export → JSON File*).
2. The workflow parses via Zod validation and the graph visualization renders.
3. Enter an AI API key (Anthropic or Google Gemini), choose a provider, and click **Audit**.
4. You receive an overall score, 8 category scores, and a findings list within seconds.

Without an AI key you can still inspect the workflow — the static rule engine runs client-side.

## Quality Checks

There is no test suite. The verification gates are:

```bash
npx tsc --noEmit   # TypeScript — must be 0 errors
npm run lint       # ESLint — must be 0 errors (pre-existing warnings in _helpers are OK)
```

Or run both via the Makefile: `make check`. Run `make help` for all available targets (`make dev`, `make build`, `make ci`, `make docker-build`, …).

## Environment Files

Copy `.env` if present and fill in your own values. Core audit functionality requires **no** server-side environment variables — API keys are supplied per-request from the browser and stored in `sessionStorage` only.

## Next Steps

- [Architecture](architecture.md) — how the layers fit together
- [API Reference](api.md) — the two endpoint contracts
- [Audit Categories](audit-categories.md) — the 8 categories and scoring model

## See Also

- [Architecture](architecture.md) — project structure and dependency rules
- [API Reference](api.md) — endpoint request/response formats
- [Security](security.md) — how API keys and workflow patches are protected
