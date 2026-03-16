# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AA 记账 (AA Accounting Tool) — a full-stack bill-splitting app for tracking shared expenses, managing members, and computing optimal settlements. Supports both a web app and a WeChat Mini Program.

## Commands

```bash
# Development
npm run dev              # Start frontend (port 8080) + backend (port 3000) together
npm run dev:server       # NestJS only, watch mode
npm run dev:client       # Rspack dev server only

# Build
npm run build            # Full production build (parallel server+client, dependency pruning)
npm run build:server     # NestJS compile only
npm run build:client     # Rspack bundle only

# Quality
npm run lint             # ESLint + TypeScript + Stylelint
npm run type:check       # TypeScript type checking
npm run eslint           # ESLint only
npm run stylelint        # CSS linting only
npm run format           # Prettier

# Testing
npm test                 # Jest
npm run test:watch       # Jest watch mode
npm run test:e2e         # End-to-end tests

# Database
npm run gen:db-schema    # Regenerate Drizzle ORM schema from DB
```

## Architecture

**Monorepo** with three platforms sharing one codebase:

- **`client/`** — React 19 frontend built with Rspack. Pages in `client/src/pages/`, API calls in `client/src/api/`, reusable components in `client/src/components/` (shadcn/ui + Radix UI).
- **`server/`** — NestJS 10 backend. Business logic in `server/modules/bill/` (bill CRUD, expenses, members, statistics, settlement). Database access via Drizzle ORM with schema in `server/database/schema.ts`. Built on `@lark-apaas/fullstack-nestjs-core` for Lark/飞书 platform integration.
- **`miniprogram/`** — Native WeChat Mini Program (WXML/WXSS/JS). Standalone implementation that calls the same backend API.
- **`shared/`** — `api.interface.ts` defines TypeScript interfaces shared between client and server (Bill, Expense, Member, StatisticsData, SettlementData types).

### Key API routes (all prefixed `/api`)

`/bills` (list/create), `/bills/:id` (detail), `/bills/:id/expenses`, `/bills/:id/members`, `/bills/:id/statistics`, `/bills/:id/settlement`, `/bills/join/:billId`

### Data flow

Client → Axios (`client/src/api/`) → NestJS controllers (`server/modules/bill/bill.controller.ts`) → Services → Drizzle ORM → PostgreSQL

## Tech Stack

- **Frontend**: React 19, TypeScript, Rspack, Tailwind CSS 4, shadcn/ui, Redux Toolkit + Zustand, ECharts + Recharts
- **Backend**: NestJS 10, TypeScript, Drizzle ORM, PostgreSQL
- **Mini Program**: Native WeChat (appid: `wxfe00a1209e35b92f`)
- **Node.js >= 22.0.0, npm >= 10.0.0**

## UI Design Guidelines

The app follows an iOS-inspired "Digital Glass & Soft Depth" aesthetic (detailed in `AGENTS.md`):
- Large rounded corners (`rounded-3xl`), glassmorphism (`backdrop-blur-xl` + semi-transparent backgrounds)
- Primary color: mint/teal (`hsl(165 70% 45%)`) — not high-saturation neon
- System font stack (San Francisco / system-ui), monospace for monetary amounts (`tabular-nums`)
- Mobile-first with 44x44pt minimum touch targets
- Semantic colors for financial states: red=expense, green=income, orange=pending, blue=settled

## Configuration

- `.env` — server port, database URL (`SUDA_DATABASE_URL`), client dev port
- `rspack.config.js` — frontend bundler config
- `nest-cli.json` — NestJS CLI config
- `tailwind.config.ts` — Tailwind theme customization
- `project.config.json` — WeChat Mini Program config
