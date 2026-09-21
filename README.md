# 📖 دفتر (Daftar)

**An interactive digital graduation guestbook.** The graduate creates a personal notebook, personalizes its cover, and shares a link. Friends, family, and teachers open it, turn its pages, and leave messages that become part of the book forever.

> دفتر تخرجك الرقمي، صفحة وراء صفحة، مليان كلمات وذكريات من الأشخاص اللي شاركوك رحلتك.

Arabic is the platform's default language and primary design target (full RTL), with English available as a secondary locale.

## Demo

A fully working demo notebook is included in the seed data:

- **Public notebook:** `/d/sara-2026`
- **Graduate dashboard login:** `demo@daftar.app` / `Daftar2026!`
- **Admin panel login:** `admin@daftar.app` / `AdminDaftar2026!`

## Screenshots

| Landing page | Notebook — a message page |
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![A written message rendered as a note](docs/screenshots/notebook-message.png) |

| Graduate dashboard | Admin panel |
| --- | --- |
| ![Graduate dashboard](docs/screenshots/dashboard.png) | ![Admin panel](docs/screenshots/admin.png) |

## Features

- **A real notebook experience** — a closed cover that opens with an animation, realistic two-page spreads with a page-turn animation (single page on mobile), paper texture, and a book spine — not a form with a message list.
- **Cover personalization** — a gallery of pre-designed covers across categories (elegant, luxury, minimal, floral, academic, modern, dark, traditional, university, feminine, masculine, Arabic typography, youth) or a custom photo upload, with toggleable name/major/institution/year/quote overlays.
- **Messages that feel handwritten** — every message renders as a note on its own page, with the author's name, relationship to the graduate, an optional photo, and a reaction emoji.
- **Full moderation control** — auto-publish or manual review, per-message approve/hide/delete/feature, and a reports queue for abuse.
- **Privacy tiers** — public, private (access-code gated), or invite-only (viewable by anyone, writable only with a code).
- **Individual and class notebooks** — a class notebook holds multiple graduates, each with their own profile; visitors pick who they're writing to.
- **Memory gallery & timeline** — an optional photo gallery and a milestone timeline (first day, favorite memory, graduation day, …).
- **Shareable by design** — a unique slug URL, a generated QR code, Open Graph previews, and one-tap WhatsApp/Telegram/X/native sharing.
- **Provider-independent payments** — a `PaymentProvider` interface with a working mock provider (for local/demo use) and a real Stripe Checkout implementation, selected by env var. The backend always verifies payment server-side before activating a notebook — the frontend reporting "success" is never enough.
- **Storage abstraction** — a `StorageProvider` interface with a local-disk implementation and an S3-compatible one (works with AWS S3, Cloudflare R2, or Supabase Storage), selected by env var.
- **Admin panel** — users, notebooks, orders, reports, packages, themes, and platform settings.
- **i18n & RTL** — every UI string is translated (Arabic/English); the whole layout mirrors correctly under `dir="rtl"`.

## Architecture

```
apps/
  web/      React 18 + TypeScript + Vite + Tailwind CSS — the frontend
  api/      Node.js + TypeScript + Express — the backend
packages/
  shared/   Zod schemas, enums, and types shared by both apps
```

**Backend** is organized by domain module (`src/modules/<domain>/{service,routes}.ts`), each with a thin Express route layer over a testable service layer that owns the actual business logic and talks to the database through Drizzle ORM. Cross-cutting concerns (auth, storage, payments, rate limiting, CSRF, sanitization) are small, swappable modules under `src/{auth,storage,payments,middleware,lib}`.

**Frontend** follows **Page → Hook → Service → Data Provider → API**: pages only call hooks (`src/hooks`), hooks call a thin service layer (`src/services`) or the data-provider layer directly (`src/api/endpoints`), and only `src/api/client.ts` talks to `axios`/HTTP. Components never call the network directly.

**Database** is a normalized PostgreSQL schema (24 tables) covering users, notebooks, graduates, themes, cover templates, pages, messages + media, featured memories, gallery items, timeline items, packages, orders, payments, subscriptions, QR codes, analytics events, reports, moderation actions, notifications, audit logs, and platform settings — see `apps/api/src/db/schema/`.

## Tech stack

| | |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, react-hook-form + zod, Framer Motion, i18next |
| Backend | Node.js, TypeScript, Express, Drizzle ORM, PostgreSQL |
| Storage | Pluggable: local disk (dev) or S3-compatible (S3 / R2 / Supabase) |
| Payments | Pluggable: mock provider (dev/demo) or Stripe Checkout |
| Testing | Vitest + Supertest (backend unit/integration), Playwright (e2e) |

## Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL ≥ 14 (a `docker-compose.yml` is included if you'd rather run it in a container)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Database setup

Start Postgres (via Docker or a local install):

```bash
docker compose up -d postgres
```

Create the database/role if you're not using the compose file (matching the defaults in `.env.example`):

```sql
CREATE USER daftar WITH PASSWORD 'daftar_dev_password' CREATEDB;
CREATE DATABASE daftar_dev OWNER daftar;
```

### 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

The defaults work out of the box for local development (local file storage, mock payments). See [`.env.example`](.env.example) at the repo root for a fully annotated reference of every variable, or `apps/api/.env.example` / `apps/web/.env.example` for the per-app copies.

### 4. Run migrations and seed demo data

```bash
pnpm --filter @daftar/api run db:migrate
pnpm --filter @daftar/api run db:seed
```

The seed script creates the full theme/package/cover-template catalog plus a realistic demo notebook (see [Demo](#demo) above) — no lorem ipsum.

### 5. Run the app

```bash
pnpm dev
```

This starts both the API (`http://localhost:4000`) and the web app (`http://localhost:5173`) in parallel. Or run them individually:

```bash
pnpm dev:api
pnpm dev:web
```

Open `http://localhost:5173/d/sara-2026` to see the demo notebook, or `http://localhost:5173` for the landing page.

## Storage setup

`STORAGE_PROVIDER` in `apps/api/.env` selects the implementation:

- `local` (default): files are written to `STORAGE_LOCAL_DIR` and served from the API at `/uploads`. Nothing else to configure.
- `s3` / `r2` / `supabase`: all three are S3-compatible, so they share one implementation (`src/storage/s3-provider.ts`). Set `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, `STORAGE_S3_ENDPOINT` (for R2/Supabase), `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`, and `STORAGE_PUBLIC_BASE_URL` (your bucket's public/CDN URL).

## Payments setup

`PAYMENT_PROVIDER` in `apps/api/.env` selects the implementation:

- `mock` (default): simulates a successful checkout end-to-end without any external account, for local development and demos. The "payment" is still verified server-side (see `src/payments/mock-provider.ts` and `src/modules/commerce/service.ts`) — the frontend is never trusted to just report success.
- `stripe`: real Stripe Checkout. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, and point a Stripe webhook at `POST /api/payments/webhook/stripe`.

## Testing

```bash
# Backend unit + integration tests (Vitest + Supertest against a real Postgres test DB)
createdb daftar_test   # once, if it doesn't already exist
# Migrate the test database once (apps/api/.env.test points at daftar_test by default):
DATABASE_URL=postgres://daftar:daftar_dev_password@localhost:5432/daftar_test \
  pnpm --filter @daftar/api exec tsx src/db/migrate.ts
pnpm --filter @daftar/api test

# Shared package unit tests
pnpm --filter @daftar/shared test

# Frontend e2e (Playwright) — requires both dev servers running
pnpm --filter @daftar/web test:e2e
```

The backend integration tests spin up the real Express app (`createApp()`) against `apps/api/.env.test` and exercise it through `supertest` — covering notebook creation and slug uniqueness, ownership authorization, the full order → mock-payment → activation flow (including idempotency), message moderation and sanitization, duplicate-submission and rate-limit protection, private/invite-only access gating, and QR/image-upload validation.

## Production deployment

1. Build both apps: `pnpm build` (builds `@daftar/shared` first, then the API, then the web app).
2. Run `pnpm --filter @daftar/api run db:migrate` against your production database.
3. Serve `apps/api/dist` with `node dist/server.js` (or a process manager like PM2) behind your reverse proxy of choice.
4. Serve `apps/web/dist` as static files from any static host or CDN, with `VITE_API_URL` pointed at your deployed API's public URL at build time.
5. Set `NODE_ENV=production`, real JWT secrets, `COOKIE_SECURE=true`, a real `STORAGE_PROVIDER`, and (if used) real Stripe keys.

The API and web app are independently deployable — there's no server-side rendering coupling them together.

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability reporting process, and a summary of what's already implemented: password hashing (bcrypt), JWT access + rotating refresh tokens in httpOnly cookies, CSRF protection (double-submit cookie), rate limiting on auth and message endpoints, input validation with zod on every route, image re-encoding + magic-byte sniffing on every upload (not just trusting the client's declared MIME type), HTML/script stripping on all user-generated text, a basic profanity filter, honeypot + duplicate-submission detection on the public write endpoint, and owner-only authorization checks on every notebook-scoped route.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)

## Known limitations / scope notes

This is a complete, working product, but a few deliberate scope decisions are worth calling out for anyone extending it:

- **Music** ships as a working play/pause control wired to a per-notebook track URL, but the platform doesn't include a licensed music catalog — you'd plug in your own licensed tracks via `musicTrackId`.
- **Invite-only** access reuses the same access-code mechanism as private notebooks (checked at write-time instead of view-time), rather than a full per-person invite list — a reasonable "smallest complete version" per the product brief, and a natural place to extend.
- **OG/share images** use the notebook's actual cover image via standard Open Graph tags rather than a generated composite image; there's no server-side image-generation service.
- Backend integration tests share one Postgres test database sequentially (no per-test transaction rollback) — fine for this test suite's size, but worth revisiting with a per-test transaction wrapper if the suite grows significantly.
