# Feedback Hub (MVP)

Feedback Hub is an internal command center to collect product feedback from WhatsApp messages, docs, and manual notes into one triage workflow.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- PostgreSQL + Prisma

## Run locally

1. Install deps:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Set your PostgreSQL connection in `.env` (`DATABASE_URL`).

4. Generate Prisma client + sync schema:

```bash
npm run db:generate
npm run db:push
```

5. Seed starter data:

```bash
npm run db:seed
```

6. Start app:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Current MVP scope

- Project portfolio page: `/projects`
- Project drill-down page: `/projects/:projectId`
- Create project form (persisted in DB)
- Add feedback/comment form per project (persisted in DB)
- Upload ingestion in project page:
  - WhatsApp export `.txt`
  - Document upload (`.txt`, `.md`, `.csv`, `.log`, `.docx`, `.pdf`)
- Recent import batches tracking (source, file, uploader, imported count)
- Dashboard powered by DB data
- Phase operations panel:
  - Run AI processing and duplicate clustering
  - Simulated Jira push for high-priority items
  - Quick project report fetch
- API endpoints:
  - `GET /api/dashboard/summary`
  - `POST /api/ingest/whatsapp-upload`
  - `POST /api/ingest/document-upload`
  - `POST /api/ingest/manual-text`
  - `GET, POST /api/projects`
  - `GET, POST /api/projects/:projectId`
  - `GET /api/projects/:projectId/clusters`
  - `POST /api/ai/projects/:projectId/process`
  - `PATCH /api/workflow/feedback/:feedbackId`
  - `POST /api/workflow/feedback/:feedbackId/notes`
  - `POST /api/integrations/jira/push`
  - `GET /api/reports/projects/:projectId`
  - `GET /api/alerts/health`
  - `GET /api/health`

## Next suggested sprint

1. Replace role header fallback with real auth provider and session middleware.
2. Replace simulated Jira push with real Jira REST integration and webhook sync.
3. Add OCR fallback for scanned PDFs and image-based documents.
4. Add E2E tests for ingestion and workflow APIs.
5. Add queue/worker for long-running AI processing jobs.
