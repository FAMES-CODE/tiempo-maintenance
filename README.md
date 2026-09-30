# Tiempo Maintenance

> An internal call management platform designed to streamline communication between phone operators and field technicians. The application allows operators to record incoming calls, manage customer information, track call sheets, and monitor technician activity through dashboards and statistics. It also integrates with the company's existing Firebird-based software to automatically create customer records and work orders.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)

## Overview

Tiempo Maintenance is a full-stack Next.js application that gives teams a modern interface on top of a legacy **Firebird** database. Customer data is automatically synchronized into a local **SQLite** database, so the app stays fast and independent from the legacy system while remaining up to date.

## Features

- **Authentication**: credentials-based login with NextAuth and bcrypt-hashed passwords, plus a default admin account seeded from environment variables
- **Firebird → SQLite sync**: scheduled background job (every 2 minutes by default, configurable via cron expression) with optional sync on startup
- **Data tables and dashboards**: sortable, filterable tables (TanStack Table) and charts (Recharts)
- **Internationalization**: multi-language interface with i18next
- **Light / dark theme**
- **Rate limiting**: per-category limits (auth, stats, heavy reads/writes, uploads, admin, Firebird access)
- **Validated forms**: React Hook Form + Zod schemas

## Tech Stack

| Layer              | Technologies                                               |
| ------------------ | ---------------------------------------------------------- |
| Framework          | Next.js 16 (App Router), React 19, TypeScript              |
| UI                 | Tailwind CSS 4, shadcn/ui, Radix UI, Base UI, Lucide icons |
| Data fetching      | SWR                                                        |
| Forms & validation | React Hook Form, Zod                                       |
| Auth               | NextAuth v4, bcrypt                                        |
| Database           | Prisma 7 with SQLite (better-sqlite3 adapter)              |
| Legacy integration | node-firebird                                              |
| Background jobs    | node-cron (custom `server.ts`)                             |
| i18n               | i18next, react-i18next                                     |
| Production         | PM2, Nginx, GitHub Actions (self-hosted runner)            |

## Architecture

```
┌──────────────┐   cron (every 2 min)   ┌────────────────┐
│   Firebird   │ ─────────────────────▶ │  SQLite (app)  │
│ (legacy DB)  │                        │  via Prisma    │
└──────────────┘                        └───────┬────────┘
                                                │
                              ┌─────────────────▼─────────────────┐
                              │ Next.js custom server (server.ts) │
                              │  • App Router + API routes        │
                              │  • NextAuth sessions              │
                              │  • Rate limiting                  │
                              │  • node-cron scheduler            │
                              └─────────────────┬─────────────────┘
                                                │
                                          Browser (UI)
```

## Project Structure

```
app/          # Next.js App Router (pages, layouts, API routes)
components/   # Reusable UI components
hooks/        # Custom React hooks
lib/          # Utilities, DB clients, sync logic
prisma/       # Schema and migrations
types/        # Shared TypeScript types
public/       # Static assets
server.ts     # Custom server (Next.js + cron jobs)
ecosystem.config.js  # PM2 configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Access to a Firebird database (only needed for the sync feature)

### Installation

```bash
git clone https://github.com/FAMES-CODE/tiempo-maintenance.git
cd tiempo-maintenance
npm install
cp .env.example .env
```

Edit `.env` (see [Configuration](#configuration)), then apply the migrations and start the dev server:

```bash
npm run db:migrate:dev
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

### Configuration

| Variable                                                    | Description                                        |
| ----------------------------------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                                              | SQLite file path (default `file:./prisma/data.db`) |
| `NEXTAUTH_URL`                                              | Public URL of the app                              |
| `NEXTAUTH_SECRET`                                           | Secret used to sign sessions                       |
| `DEFAULT_ADMIN_PASSWORD`                                    | Password for the initial admin account             |
| `FIREBIRD_HOST` / `PORT` / `DATABASE` / `USER` / `PASSWORD` | Firebird connection                                |
| `CRON_ENABLED`                                              | Enable or disable background jobs                  |
| `CRON_CUSTOMERS_SYNC_ENABLED`                               | Enable the customer sync                           |
| `CRON_CUSTOMERS_SYNC_SCHEDULE`                              | Cron expression (default `*/2 * * * *`)            |
| `CRON_CUSTOMERS_SYNC_ON_START`                              | Run a sync at startup                              |
| `RATE_LIMIT_ENABLED`                                        | Enable API rate limiting                           |

## Scripts

| Command                  | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `npm run dev`            | Start the dev server (`server.ts` with cron)            |
| `npm run build`          | Generate Prisma client, apply migrations, build Next.js |
| `npm start`              | Start in production mode                                |
| `npm run db:migrate:dev` | Create and apply a migration (development)              |
| `npm run db:migrate`     | Apply pending migrations (production)                   |
| `npm run lint`           | Run ESLint                                              |

## Deployment

The app is designed for self-hosting, and runs in production on a Windows 11 server:

- **PM2** runs the custom `server.ts` entry point in fork mode (cluster mode would duplicate the cron jobs)
- **Nginx** acts as reverse proxy
- **GitHub Actions self-hosted runner** handles CI/CD
- Prisma migrations are applied automatically during `npm run build`

Manual update procedure:

```bash
git pull && npm install && npm run build && pm2 restart all
```

> Keep the SQLite file outside of any process that wipes the app folder on update.

## Author

**Amine Ferkani**
[LinkedIn](https://linkedin.com/in/amineferkani) · [GitHub](https://github.com/FAMES-CODE)
