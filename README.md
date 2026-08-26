<div align="center">

# Renuevo

**A self-hosted subscription tracker that emails you before renewals and whenever a recurring price changes.**

<img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white"></img>
<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black"></img>
<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white"></img>
<img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white"></img>
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white"></img>
<img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white"></img>
<img src="https://img.shields.io/badge/npm-11-CB3837?logo=npm&logoColor=white"></img>
<img src="https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white"></img>
<img src="https://img.shields.io/badge/Zod-4-3E67B1?logo=zod&logoColor=white"></img>
<img src="https://img.shields.io/badge/Plaid-45-212121?logo=plaid&logoColor=white"></img>
<img src="https://img.shields.io/badge/Nodemailer-22B573"></img>
<img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white"></img>
<img src="https://img.shields.io/badge/License-MIT-green"></img>

</div>

## About

**Renuevo** is a modern full-stack web application for centralizing your recurring subscriptions - streaming, software, gym, cloud and more - in one place. It tracks price, currency, billing cycle and next renewal date for every subscription, alerts you **by email before an upcoming renewal** and after a **detected price change**, and keeps a full price-history timeline on disk.

The app is built on the **Next.js 16 App Router** with **Prisma 7 + PostgreSQL**, styled with **Tailwind CSS 4**, and shipped as a **standalone Docker image**. Bank-based ingestion is fully supported behind a **pluggable `BankProvider` interface**: a deterministic **mock provider** for development and tests, and **Plaid** for real bank connections.

---

## Features

### Subscriptions

- **Full CRUD** for subscriptions (name, price, currency, billing cycle, next renewal date, category)
- **Price history** - every price update archives the previous value before overwriting, giving you a full timeline per subscription
- **Auto-advancing renewal dates** per billing cycle (weekly / monthly / quarterly / yearly)
- **Dashboard** with next renewal dates and monthly + yearly total spend

### Notifications

- **Upcoming-renewal emails** for renewals within the next 3 days
- **Price-change emails** when a new price differs from the previous recorded one
- **Duplicate-safe** - every send is logged in `NotificationLog` via a unique `(subscription, type, cycle)` guard
- **`CRON_SECRET`-protected API route** callable from any scheduler (cron-job.org, GitHub Actions, ...) plus a local `node-cron` runner

### Bank integration

- **Pluggable providers** - `mock` (deterministic demo data, the default) and `plaid` (real bank accounts)
- **Recurring-charge detection** - groups transactions by merchant, matches repeating amounts and cadence, flags **price changes**
- **Suggested subscriptions** - detected charges are offered for one-click **accept** (feeding the regular `Subscription` model) or **dismiss**
- **Offline first** - tests always run against the mock provider, never touching Plaid

### UX

- Auth-gated with a single shared password (HMAC-signed httpOnly cookie)
- Responsive **dark UI** built with Tailwind CSS 4

---

## Tech Stack

| Layer          | Technology                                                              |
| -------------- | ----------------------------------------------------------------------- |
| Frontend       | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4           |
| Backend        | Next.js Route Handlers + Server Actions                                 |
| Persistence    | PostgreSQL (Docker), Prisma 7 (+ `@prisma/adapter-pg`)                  |
| Validation     | Zod                                                                     |
| Notifications  | Nodemailer (Mailhog in dev), node-cron                                  |
| Bank data      | Plaid SDK (real), Mock provider (dev / tests)                          |
| Tooling        | npm, Docker, Vitest (90%+ coverage threshold), ESLint                 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+ (Node 22 recommended, ships npm)
- [Docker](https://www.docker.com) + Docker Compose (for PostgreSQL and Mailhog)

### 1. Infrastructure (PostgreSQL + Mailhog)

```bash
cd renuevo
docker compose up -d db mailhog
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Mailhog** - fake SMTP on `:1025`, web UI at <http://localhost:8025>

> Adminer (DB explorer) is also available in `docker-compose.yml` on port `8080` if you want it.

### 2. Install, migrate and run

```bash
cd renuevo
npm install
npx prisma migrate deploy
npm run dev
```

Open <http://localhost:3000> and sign in with the `APP_PASSWORD` from your `.env`.

> Copy `.env.example` to `.env` and fill in the values before starting (see *Environment Variables*). `BANK_PROVIDER` stays `mock` for local dev unless you configure Plaid keys.

### 3. Notifications in development

```bash
npm run cron:start        # schedules the daily check loop (CRON_SCHEDULE)
# or run once:
RUN_ONCE=true npm run cron:start
```

In production use an external scheduler that calls the protected route (see *API Overview*).

---

## Docker

Renuevo ships as a self-contained **standalone Next.js image** that runs `prisma migrate deploy` on startup and then serves the app.

### 1. Build the image

```bash
cd renuevo
docker build -t renuevo .
```

### 2. Run the container

```bash
docker run -d --name renuevo \
  -p 3000:3000 \
  -e DATABASE_URL=postgres://renuevo:renuevo@localhost:5432/renuevo \
  -e APP_PASSWORD=your-password \
  -e AUTH_SECRET=your-secret \
  -e SMTP_HOST=127.0.0.1 \
  -e SMTP_PORT=1025 \
  -e CRON_SECRET=your-cron-secret \
  -e NOTIFY_EMAIL=you@example.com \
  renuevo
```

The app is then available at <http://localhost:3000>. First boot applies all pending database migrations automatically.

### 3. Or run the whole stack with Docker Compose

```bash
cd renuevo
docker compose up -d --build
```

This starts **PostgreSQL**, **Mailhog**, and the **app** image together (all env is wired from `.env`, with `DATABASE_URL`/`SMTP_HOST` pointing at the compose services).

**Volumes / persistence:** Postgres data lives in the compose-managed volume; Mailhog persists inboxes under `./mailhog_data`. To use Plaid, set `BANK_PROVIDER=plaid` plus your `PLAID_*` keys in `.env` before `docker compose up`.

---

## CI/CD

Renuevo ships with GitHub Actions pipelines in `.github/workflows/`.

| Workflow   | Trigger                                                        | What it does                                                                        |
| ---------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ci.yml`   | Pull requests (any branch)                                     | npm ci → `prisma generate` → `eslint` → `tsc --noEmit` → Vitest with enforced coverage → validates the Docker build |
| `publish.yml` | Push to `main` / tags `v*`                                   | Builds the image and pushes `ghcr.io/rubenzu03/renuevo` (tags: `latest`, `main`, `vX.Y[.Z]`, `sha-…`) |
| `cron.yml` | `schedule` (`0 6 * * *` UTC) + manual `workflow_dispatch`      | Pings `/api/cron/check-subscriptions` with `x-cron-secret` to run the notification job in production |

> `ci.yml` runs on every pull request; push the PR through the normal flow and `publish.yml` re-ships the exact commit that merged to `main`. Enable **branch protection** on `main` (require `CI` to pass) so CI always gates merges.

### Required GitHub configuration

- **Repository variables**: `PROD_BASE_URL` - the base URL of the deployed app; the scheduled cron job is skipped until this is set.
- **Repository secrets**: `CRON_SECRET` - must match the `CRON_SECRET` the production container uses.
- Registry auth uses the built-in `GITHUB_TOKEN` (`packages: write`) - no extra secrets.

### Running the published image in production

```bash
cd renuevo
docker compose -f docker-compose.prod.yml up -d --pull always
```

This pulls `ghcr.io/rubenzu03/renuevo:latest` and runs it next to its own PostgreSQL volume. `SMTP_*` should point at a real mail provider, and `DATABASE_URL` becomes `postgres://…@db:5432/…` automatically. The container applies `prisma migrate deploy` on boot.

---

## Environment Variables

| Variable             | Required | Default    | Description                                                   |
| -------------------- | -------- | ---------- | ------------------------------------------------------------- |
| `DATABASE_URL`       | ✔        | –          | PostgreSQL connection string                                  |
| `APP_PASSWORD`       | ✔        | –          | Shared password for the login gate                            |
| `AUTH_SECRET`        | ✔        | –          | HMAC secret used to sign the session cookie                   |
| `SMTP_HOST` / `SMTP_PORT` | ✔ | –        | SMTP server (use Mailhog `127.0.0.1:1025` in dev)             |
| `MAIL_FROM`          | –        | –          | From header for outgoing emails                               |
| `NOTIFY_EMAIL`       | –        | –          | Recipient for notification emails                             |
| `CRON_SECRET`        | ✔        | –          | `x-cron-secret` header required by the cron route             |
| `CRON_SCHEDULE`      | –        | `0 9 * * *`| Cron expression for the local runner (`npm run cron:start`)    |
| `BASE_URL`           | –        | `http://localhost:3000` | URL the cron runner pings |
| `BANK_PROVIDER`      | –        | `mock`     | `mock` or `plaid` (tests always run mocked)                   |
| `PLAID_CLIENT_ID`    | –        | –          | Plaid API client id (only for `BANK_PROVIDER=plaid`)          |
| `PLAID_SECRET`       | –        | –          | Plaid API secret                                              |
| `PLAID_ENV`          | –        | `sandbox`  | Plaid environment (`sandbox`, `development`, `production`)    |
| `PLAID_ACCESS_TOKEN` | –        | –          | Plaid item access token (issued after Link + exchange)        |

> `.env` is gitignored; a matching `.env.example` mirrors the keys above with empty placeholders for local setup.

---

## API Overview

Renuevo is server-action driven for the web UI, and exposes two public HTTP endpoint groups:
the automation entry point used by schedulers, and a small JSON API used by the mobile
companion app (Renuevo-Pocket).

### Architecture

Web actions and mobile routes share the same domain layer, so business rules never drift:

```
src/actions/subscriptions.ts          web adapter (auth + FormData + redirects)
src/app/api/mobile/**/route.ts        mobile adapter (auth + JSON + responses)
        └─ src/lib/subscriptions-service.ts   shared business logic (create / update /
              └─ src/lib/subscription-validation.ts   shared Zod schema + DB mapping
```

`subscriptions-service.ts` owns the rules that matter: defaulting new subscriptions to active,
archiving the previous price to `PriceHistory` before a price change, toggling `isActive`, and
deleting. The web action and every mobile route delegate to it, so a change made in one place
is honored everywhere.

### Automation endpoint

| Method   | Endpoint                                  | Description                                             |
| -------- | ----------------------------------------- | ------------------------------------------------------- |
| `GET`    | `/api/cron/check-subscriptions`           | Runs the notification job (requires `x-cron-secret` header) |

### Mobile API (`/api/mobile/*`)

Authenticated with `Authorization: Bearer <token>` (obtained via the login endpoint). All
routes return CORS-enabled JSON.

| Method   | Endpoint                                              | Description                                  |
| -------- | ----------------------------------------------------- | -------------------------------------------- |
| `POST`   | `/api/mobile/auth/login`                              | `{ password }` → `{ token }`                 |
| `GET`    | `/api/mobile/subscriptions`                           | List subscriptions                           |
| `POST`   | `/api/mobile/subscriptions`                           | Create a subscription                        |
| `GET`    | `/api/mobile/subscriptions/:id`                       | Subscription detail (+ price history)        |
| `PUT`    | `/api/mobile/subscriptions/:id`                       | Update a subscription                        |
| `DELETE` | `/api/mobile/subscriptions/:id`                       | Delete a subscription                        |
| `PATCH`  | `/api/mobile/subscriptions/:id/toggle`                | Toggle `isActive`                            |

The token is an HMAC-signed value (30-day expiry) derived from `AUTH_SECRET`; login verifies
the shared `APP_PASSWORD`. Subscription payloads are validated with the same Zod schema as the
web forms. Prices serialize as strings (Prisma `Decimal`).

Everything else lives behind the authenticated UI:

| Action                | Description                                        |
| --------------------- | -------------------------------------------------- |
| Login / Logout        | Password gate via `<form action={serverAction}>`   |
| Subscriptions CRUD    | Create, edit, delete, toggle active subscriptions  |
| Bank connect/refresh  | Connect/refresh a provider, sync transactions      |
| Accept / dismiss      | Confirm a detected charge as a subscription, or skip it |

## Roadmap

- **Phase 1 (done)** - Manual subscription CRUD, price history, renewal/price-change emails, cron job, single-password auth
- **Phase 2 (done)** - Pluggable `BankProvider` (mock + **Plaid**), recurring-charge detection, suggested subscriptions, tests running 100% on mock data
- **Phase 3 (future)** - Gmail-parsing as a detection source, receipt OCR, push notifications, spending insights dashboard