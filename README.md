# audit-n8n

<img width="1276" height="824" alt="file-df28a53f82f69f2b43973a75f0fc29b8" src="https://github.com/user-attachments/assets/c82f240c-355b-46a2-b636-48c4c5386147" />


> AI-powered audit tool for n8n workflow JSON files — scored findings across 8 security & quality categories, with a guarded AI optimization pass.

Upload any n8n workflow, choose your AI provider (Anthropic Claude or Google Gemini with your own API key), and get a detailed security and quality analysis in seconds. Optionally apply AI-generated patches to improve the workflow — safely.

## Quick Start

```bash
git clone https://github.com/yanjigb/n8n-audit.git
cd audit-n8n
npm ci
npm run dev   # → http://localhost:3002
```

No database, no server-side secrets, no env vars required. Drop a workflow JSON (export one from n8n), enter your API key, and click **Audit**.

## Key Features

- **Instant workflow audit** — drag-and-drop a workflow JSON and get scored findings in seconds
- **Dual AI provider support** — Claude (`claude-sonnet-4`) or Gemini (`gemini-2.5-flash`); bring your own key
- **8 audit categories** — 60+ rules covering security, compliance, performance, and more
- **AI optimization pass** — AI-generated patches applied through a guarded pipeline
- **Safe patch application** — protected keys (credentials, type, id, position) are never overwritten; all patches are schema-validated
- **PDF export** — download the full audit report
- **Workflow graph visualization** — interactive node graph via React Flow
- **Light/dark theme** — powered by `next-themes` · **EN/VI localization**

## Example

```
1. Drop  workflow.json        → graph renders, Zod-validated
2. Enter  sk-ant-… (sessionStorage, per-request only)
3. Audit  →  overall score 78/100, 8 category scores, 14 findings
4. Optimize → AI patches → applyPatches() → schema-validated workflow
5. Export → PDF report
```

## Tech Stack

Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Tailwind CSS v4 + shadcn/ui · Zustand 5 · Zod v4 · `@xyflow/react` · Node.js 20 (multi-stage Docker build)

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Installation, setup, first steps |
| [Architecture](docs/architecture.md) | Layered structure, dependency rules, data flow |
| [API Reference](docs/api.md) | `/api/audit` and `/api/optimize` contracts |
| [Audit Categories](docs/audit-categories.md) | The 8 categories, 60+ rules, scoring model |
| [Security](docs/security.md) | No server-side secrets, BYO keys, patch safety |
| [Self-Hosting](docs/self-hosting.md) | Docker, Kubernetes, reverse proxy deployment |
| [Contributing](docs/contributing.md) | Code, rules, docs, and quality gate guidelines |

For dev commands and quality gates, see [Getting Started](docs/getting-started.md). Run `make help` for the full build-automation target list.

## Community

[Discord](https://discord.com/invite/rVkMfNB3J)
