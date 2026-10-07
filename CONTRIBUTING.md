# Contributing to audit-n8n

Thank you for your interest in contributing! This document provides a quick overview. For detailed guidelines, see **[docs/contributing.md](docs/contributing.md)**.

## Quick Start

```bash
git clone https://github.com/yanjigb/n8n-audit.git
cd audit-n8n
npm ci
npm run dev   # http://localhost:3002
```

## Quality Gates (Required)

All contributions must pass these checks locally before pushing:

```bash
npx tsc --noEmit   # TypeScript — must be 0 errors
npm run lint       # ESLint — must be 0 errors
```

Or run both via `make check`.

## Pull Request Checklist

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] Follows [Layered Architecture](docs/architecture.md) — new code in canonical folders
- [ ] No upward imports (`lib/` → `app/`/`components/`/`hooks/`/`stores/`, `types/` → anything)
- [ ] If adding audit rules: follows [Adding a Rule checklist](docs/audit-categories.md#adding-a-rule--checklist)
- [ ] If touching AI patch logic: does not weaken `applyPatches()` invariants

## Key Areas

| Area | Guide |
|------|-------|
| **Code structure & architecture** | [docs/architecture.md](docs/architecture.md) |
| **Adding audit rules** | [docs/audit-categories.md](docs/audit-categories.md) |
| **Security model & patch safety** | [docs/security.md](docs/security.md) |
| **API endpoints** | [docs/api.md](docs/api.md) |
| **Self-hosting / deployment** | [docs/self-hosting.md](docs/self-hosting.md) |
| **Full contributing guide** | [docs/contributing.md](docs/contributing.md) |

## Branch & Commit Conventions

- Branch: `feature/<short-desc>` or `fix/<short-desc>`
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
- Run `make ci` locally before pushing (install → lint → typecheck → build)

## Security

If you discover a vulnerability, please report it responsibly rather than opening a public issue. See [docs/security.md](docs/security.md#reporting).

---

**Full contributing guide:** [docs/contributing.md](docs/contributing.md)