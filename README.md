# Feedback Hub

A product-feedback hub prototype for collecting, organizing, and acting on user feedback. Feedback from WhatsApp exports, uploaded documents, and manual notes is ingested into projects, grouped into duplicate clusters, prioritized, and tracked through a status workflow.

## Features

- **Ingestion:** WhatsApp chat export upload (`.txt`), document upload (`.txt`, `.md`, `.csv`, `.log`, `.docx`, `.pdf`), and manual text entry (`src/lib/ingestion.ts`, `src/lib/document-parser.ts`).
- **Projects and dashboard:** a projects overview, a project page with duplicate clusters, recent imports, and feedback items, plus a dashboard with an intake pipeline and source mix.
- **Rule-based "AI processing":** a processing run groups feedback into clusters by a normalized title-and-summary key, infers priority from keywords (for example "urgent", "critical", "outage"), and computes a confidence score; items below 0.6 are flagged for review. It uses heuristics in `src/lib/phase-services.ts`; there is no language-model call.
- **Workflow:** feedback status (`new`, `triaged`, `in_progress`, `blocked`, `done`), categories (`bug`, `feature`, `complaint`, `question`), notes on feedback items, and priority.
- **Reports and alerts:** a per-project report (counts by status, high priority, needs review) and a health alert snapshot.
- **Jira push (simulated):** pushing feedback items assigns a `FBH-<n>` key and records an integration event with the message "Simulated push to Jira". No request is sent to Jira.
- **Authentication and roles:** email and password login with a signed session cookie (`jose`, `bcryptjs`), roles `admin`, `pm`, and `viewer`, and per-project membership. A middleware redirects unauthenticated users to `/login`.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Prisma 6 with PostgreSQL
- `jose` and `bcryptjs` for sessions, `pdf-parse` and `mammoth` for document text extraction

## Getting started

Prerequisites: Node.js, npm, and a PostgreSQL database.

```bash
npm install
```

Set these environment variables (there is no `.env.example` in the repository):

- `DATABASE_URL`: PostgreSQL connection string (used by `prisma/schema.prisma`).
- `AUTH_SECRET`: secret for signing session tokens. Required in production; in development the code falls back to a built-in default (`src/lib/auth.ts`).

```bash
npm run db:generate   # prisma generate
npm run db:push       # push the schema to the database
npm run db:seed       # seed starter users, a project, and feedback (prisma/seed.mjs)
npm run dev           # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## API routes

| Route | Method | Minimum role |
| --- | --- | --- |
| `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | POST, POST, GET | public |
| `/api/health` | GET | public |
| `/api/dashboard/summary` | GET | viewer |
| `/api/projects` | GET, POST | viewer, pm |
| `/api/projects/:projectId` | GET, POST | viewer, pm (project role) |
| `/api/projects/:projectId/clusters` | GET | viewer (project role) |
| `/api/ingest/whatsapp-upload`, `/api/ingest/document-upload`, `/api/ingest/manual-text` | POST | pm (project role) |
| `/api/ai/projects/:projectId/process` | POST | pm (project role) |
| `/api/workflow/feedback/:feedbackId` | PATCH | pm |
| `/api/workflow/feedback/:feedbackId/notes` | POST | pm |
| `/api/integrations/jira/push` | POST | pm |
| `/api/reports/projects/:projectId` | GET | viewer |
| `/api/alerts/health` | GET | pm |

## Data model

Defined in `prisma/schema.prisma`: `Project`, `User`, `ProjectMember`, `FeedbackItem`, `IngestionBatch`, `IngestionEntry`, `FeedbackCluster`, `FeedbackClusterItem`, `FeedbackNote`, `AIProcessingRun`, and `IntegrationEvent`.

## Project structure

```
src/app/            Pages (dashboard, login, projects) and API route handlers
src/components/     Project forms, upload forms, and phase actions
src/lib/            Auth, ingestion, document parsing, phase services, Prisma client
prisma/             Schema and seed script
middleware.ts       Session check for all non-public routes
```
