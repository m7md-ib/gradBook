# Contributing to دفتر (Daftar)

Thanks for considering a contribution! This document covers everything you need to get set up and send a good pull request.

## Getting set up

Follow the [Getting started](README.md#getting-started) section of the README to install dependencies, set up the database, and run the app locally.

## Project structure

```
apps/web      React frontend (Vite + TypeScript + Tailwind)
apps/api      Express backend (TypeScript + Drizzle ORM + PostgreSQL)
packages/shared   Zod schemas, enums, and types shared by both apps
```

Read the [Architecture](README.md#architecture) section before making structural changes — in particular:

- Backend business logic lives in `src/modules/<domain>/service.ts` and should be independently testable (no `req`/`res` in service functions). Route handlers in `routes.ts` stay thin: validate, call the service, shape the response.
- Frontend components never call `axios`/`fetch` directly. Follow **Page → Hook → Service/Data Provider → API**: a page calls a hook (`src/hooks`), a hook calls the data-provider layer (`src/api/endpoints`) directly or through a service (`src/services`) when there's real orchestration logic.
- Every new user-facing string goes through i18next (`apps/web/src/i18n/locales/{ar,en}.json`) — never hardcode UI text. Arabic is the primary locale; add both languages in the same PR.
- Database schema changes go in `apps/api/src/db/schema/*.ts`, then run `pnpm --filter @daftar/api run db:generate` to produce a migration — don't hand-write migration SQL.

## Development workflow

1. Fork the repo and create a branch off `main`.
2. Make your change. Keep commits focused — one logical change per commit.
3. Run the checks below before opening a PR.
4. Open a pull request describing **what** changed and **why**. Link any related issue.

## Checks to run before submitting

```bash
pnpm typecheck        # TypeScript across all workspaces
pnpm lint             # ESLint
pnpm --filter @daftar/api test      # backend unit + integration tests
pnpm --filter @daftar/shared test   # shared package unit tests
pnpm --filter @daftar/web test:e2e  # Playwright e2e (needs both dev servers running)
pnpm build            # production build of every workspace
```

If you changed the database schema, also confirm `pnpm --filter @daftar/api run db:migrate` runs cleanly against a fresh database.

## Code style

- TypeScript, strict mode. Avoid `any`; prefer precise types from `@daftar/shared` or the Drizzle-inferred row types.
- Prettier formats the codebase (`pnpm format`); please don't hand-format around it.
- Comments explain *why*, not *what* — the code should already say what it does.
- Don't add abstractions, config flags, or generalized helpers for a single call site. Solve the problem in front of you.

## Reporting bugs / requesting features

Open a GitHub issue with:

- What you expected to happen vs. what happened.
- Steps to reproduce (for bugs), including whether it's specific to a locale (ar/en) or direction (RTL/LTR).
- Relevant logs or screenshots.

## Security issues

Please do **not** open a public issue for security vulnerabilities — see [SECURITY.md](SECURITY.md) instead.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.
