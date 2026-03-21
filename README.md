# Feedback Hub 🎯

> Modern feedback management platform for product teams - Built with Next.js 16

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.2-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Overview

**Feedback Hub** is an internal command center designed to collect, triage, and manage product feedback from multiple sources into one unified workflow. Built for product teams who need to centralize feedback from WhatsApp conversations, documents, manual notes, and more.

### Why Feedback Hub?

- 🎯 **Single Source of Truth** - Consolidate feedback from WhatsApp, documents, and manual entries
- 🤖 **AI-Powered Processing** - Automatic clustering, duplicate detection, and priority assignment
- 📊 **Project-Centric** - Organize feedback by projects with epics, labels, and custom workflows
- 🔄 **Integration Ready** - Built-in Jira push integration and webhook support
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS v4
- ⚡ **Next.js 16** - Leveraging the latest App Router, Turbopack, and React 19

---

## ✨ Features

### Core Functionality
- ✅ **Multi-Source Ingestion**
  - WhatsApp export uploads (`.txt`)
  - Document uploads (`.txt`, `.md`, `.csv`, `.log`, `.docx`, `.pdf`)
  - Manual text entry
- 📁 **Project Management**
  - Create and manage multiple projects
  - Project-level metrics and dashboards
  - Team member assignments with role-based access
- 🏷️ **Labels & Categorization**
  - Custom labels with color coding
  - Issue categories (bug, feature, complaint, question)
  - Module tagging
- 📊 **Epics Management**
  - Group related issues under epics
  - Track epic status and progress
  - Color-coded organization
- 🔍 **Advanced Search & Filtering**
  - Search across all feedback items
  - Filter by status, priority, assignee, labels, epics
  - Project-specific search
- 🤖 **AI Processing**
  - Automatic feedback clustering
  - Duplicate detection
  - Confidence scoring
  - Smart priority assignment

### Workflow & Collaboration
- 📈 **Dashboard with Metrics**
  - Real-time project statistics
  - Activity feed
  - My Issues view
  - Health monitoring
- 💬 **Feedback Notes & Comments**
  - Add notes to any feedback item
  - Role-based commenting
  - Activity tracking
- 🔐 **Authentication & Authorization**
  - User login system
  - Role-based access (Admin, PM, Viewer)
  - Project-level permissions
- 📝 **Audit Logs**
  - Track all changes to feedback items
  - User action history
  - Field-level change tracking

### Integration & Deployment
- 🔄 **Jira Integration**
  - Push high-priority items to Jira
  - Track integration status
  - External ID mapping
- 📱 **Responsive Design**
  - Works on desktop, tablet, and mobile
  - Modern navigation system
  - Optimized layouts
- ⌨️ **Developer-Friendly**
  - 19+ API endpoints
  - Type-safe with TypeScript
  - Prisma ORM for database operations

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.6** - App Router with Turbopack for fast development
- **React 19.2.3** - Latest React with Server Components
- **TypeScript 5.x** - Full type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Modern icon library
- **@dnd-kit** - Drag and drop functionality
- **CMDK** - Command palette for keyboard shortcuts

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **SQLite** (development) / **PostgreSQL** (production)
- **Zod** - Runtime type validation
- **Jose** - JWT authentication
- **bcryptjs** - Password hashing

### Document Processing
- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX file processing

---

## 📁 Project Structure

```
feedback-hub/
├── src/
│   ├── app/
│   │   ├── api/              # 19+ API endpoints
│   │   │   ├── ai/           # AI processing endpoints
│   │   │   ├── auth/         # Authentication
│   │   │   ├── dashboard/    # Dashboard data
│   │   │   ├── epics/        # Epic management
│   │   │   ├── ingest/       # File upload & ingestion
│   │   │   ├── integrations/ # Jira & external services
│   │   │   ├── issues/       # Issue CRUD operations
│   │   │   ├── labels/       # Label management
│   │   │   ├── projects/     # Project operations
│   │   │   ├── reports/      # Report generation
│   │   │   └── workflow/     # Workflow & notes
│   │   ├── dashboard/        # Dashboard page
│   │   ├── epics/            # Epics management UI
│   │   ├── issues/           # Issues list & detail
│   │   ├── labels/           # Labels management
│   │   ├── login/            # Login page
│   │   ├── projects/         # Projects pages
│   │   ├── settings/         # User settings
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── dashboard/        # Dashboard components
│   │   ├── epics/            # Epic components
│   │   ├── issues/           # Issue components
│   │   ├── labels/           # Label components
│   │   ├── layout/           # Layout components (Header, Sidebar, etc.)
│   │   ├── projects/         # Project components
│   │   └── ui/               # Reusable UI components
│   ├── lib/
│   │   ├── types/            # TypeScript type definitions
│   │   ├── validators/       # Zod schemas
│   │   └── utils.ts          # Utility functions
│   └── providers/            # React Context providers
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.mjs              # Database seeding
├── public/                   # Static assets
├── scripts/                  # Utility scripts
└── package.json              # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (recommended: v24.13.0)
- npm or yarn
- PostgreSQL (for production) or SQLite (for development)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/mohamedatef90/feedback-hub.git
cd feedback-hub
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:

```env
# SQLite (Development)
DATABASE_URL="file:./dev.db"

# PostgreSQL (Production)
# DATABASE_URL="postgresql://user:password@localhost:5432/feedback_hub"
```

4. **Initialize the database:**

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with starter data
npm run db:seed
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Open in browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

The application uses a comprehensive Prisma schema with the following core models:

### Core Models

- **Project** - Top-level container for feedback items
  - Tracks project metadata, owner, and statistics
  - Links to feedback items, labels, epics, and team members

- **FeedbackItem** - Individual feedback entries
  - Source tracking (WhatsApp, document, manual)
  - Categories: bug, feature, complaint, question
  - Status: new, triaged, in_progress, blocked, done
  - Priority levels: critical, high, medium, low, none
  - Links to labels, epics, assignees

- **User** - User accounts and authentication
  - Roles: admin, pm, viewer
  - Project memberships
  - Assigned issues

- **Label** - Custom categorization tags
  - Project-scoped
  - Color-coded
  - Many-to-many with issues

- **Epic** - Grouping for related issues
  - Status: open, closed
  - Color-coded
  - Project-scoped

### Supporting Models

- **IngestionBatch** - Tracks file uploads and imports
- **IngestionEntry** - Individual lines/items from imports
- **FeedbackCluster** - AI-generated duplicate groups
- **FeedbackNote** - Comments and notes on feedback
- **IntegrationEvent** - External integration tracking (Jira, etc.)
- **AIProcessingRun** - AI processing job history
- **AuditLog** - Change tracking and history

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with sample data

# Code Quality
npm run lint         # Run ESLint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string | ✅ |
| `JWT_SECRET` | Secret key for JWT authentication | ⚠️ Recommended |

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/summary` - Dashboard metrics
- `GET /api/dashboard/activity` - Recent activity
- `GET /api/dashboard/my-issues` - Assigned issues

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:projectId` - Get project details
- `GET /api/projects/:projectId/search` - Search within project
- `GET /api/projects/:projectId/clusters` - Get feedback clusters

### Issues
- `GET /api/projects/:projectId/issues` - List project issues
- `POST /api/projects/:projectId/issues` - Create new issue
- `GET /api/projects/:projectId/issues/:issueId` - Get issue details
- `PATCH /api/projects/:projectId/issues/:issueId` - Update issue
- `DELETE /api/projects/:projectId/issues/:issueId` - Delete issue
- `GET /api/projects/:projectId/issues/:issueId/activity` - Issue activity log
- `POST /api/issues/bulk` - Bulk issue operations

### Labels
- `GET /api/projects/:projectId/labels` - List project labels
- `POST /api/projects/:projectId/labels` - Create label
- `PATCH /api/labels/:labelId` - Update label
- `DELETE /api/labels/:labelId` - Delete label
- `POST /api/projects/:projectId/issues/:issueId/labels` - Add label to issue
- `DELETE /api/projects/:projectId/issues/:issueId/labels/:labelId` - Remove label

### Epics
- `GET /api/projects/:projectId/epics` - List project epics
- `POST /api/projects/:projectId/epics` - Create epic
- `PATCH /api/projects/:projectId/epics/:epicId` - Update epic
- `DELETE /api/epics/:epicId` - Delete epic

### Ingestion
- `POST /api/ingest/whatsapp-upload` - Upload WhatsApp export
- `POST /api/ingest/document-upload` - Upload documents
- `POST /api/ingest/manual-text` - Add manual feedback

### AI & Processing
- `POST /api/ai/projects/:projectId/process` - Run AI processing
- `GET /api/reports/projects/:projectId` - Generate project report

### Integrations
- `POST /api/integrations/jira/push` - Push to Jira

### Workflow
- `PATCH /api/workflow/feedback/:feedbackId` - Update feedback status
- `POST /api/workflow/feedback/:feedbackId/notes` - Add note

### Health & Monitoring
- `GET /api/health` - Health check
- `GET /api/alerts/health` - System alerts

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Deploy:**

```bash
vercel deploy --prod
```

3. **Configure Environment Variables in Vercel Dashboard:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Random secret for JWT signing

### Docker (Alternative)

```bash
# Build image
docker build -t feedback-hub .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  feedback-hub
```

### PostgreSQL Setup for Production

**Option 1: Vercel Postgres**
```bash
vercel postgres create
```

**Option 2: Self-hosted**
```sql
CREATE DATABASE feedback_hub;
CREATE USER feedback_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE feedback_hub TO feedback_user;
```

Then update `DATABASE_URL`:
```env
DATABASE_URL="postgresql://feedback_user:your_password@localhost:5432/feedback_hub"
```

---

## 🗺️ Roadmap

### ✅ MVP Complete (Current State)
- [x] Project management
- [x] Multi-source ingestion (WhatsApp, documents, manual)
- [x] AI processing & clustering
- [x] Labels and epics
- [x] Dashboard with metrics
- [x] Search and filtering
- [x] Authentication & authorization
- [x] Audit logging
- [x] Jira integration (basic)

### 🚧 Next Sprint
- [ ] Replace role-based auth with OAuth provider
- [ ] Real Jira REST API integration (replace simulated push)
- [ ] OCR support for scanned PDFs and images
- [ ] E2E tests for ingestion and workflow APIs
- [ ] Background job queue for long-running AI tasks
- [ ] Kanban board view with drag-and-drop
- [ ] Filter panel for advanced queries
- [ ] Issue detail modal/panel
- [ ] Email notifications

### 🔮 Future Enhancements
- [ ] Slack integration
- [ ] Discord webhook support
- [ ] Custom workflow automation
- [ ] Team collaboration features (mentions, assignments)
- [ ] Sentiment analysis on feedback
- [ ] Export to CSV/JSON
- [ ] Custom reporting builder
- [ ] Mobile app (React Native)
- [ ] Public API with rate limiting
- [ ] Webhooks for external integrations

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Write clean, type-safe TypeScript
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with modern tools and frameworks:
- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vercel](https://vercel.com/) - Deployment platform
- [Lucide](https://lucide.dev/) - Beautiful icons

---

## 📞 Support

For questions, issues, or feature requests:
- Open an [issue](https://github.com/mohamedatef90/feedback-hub/issues)
- Start a [discussion](https://github.com/mohamedatef90/feedback-hub/discussions)

---

**Built with ❤️ by [Mohamed Atef](https://github.com/mohamedatef90)**
