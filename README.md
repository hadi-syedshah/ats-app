# ATS CV Screening Platform

An applicant tracking system with automated CV parsing and AI-powered evaluation for recruitment workflows.

## Overview

This repository contains two integrated services:
- **Next.js web application** (`/`): Authentication, job management, CV upload/storage, dashboards, and evaluation controls
- **FastAPI parser service** (`parser-service/`): Securely downloads signed CV URLs, extracts text from PDF/DOCX files, structures CV data, and updates Supabase with parsed results

**Job-specific evaluation**: Admins create job postings (title, description, required skills) via the admin dashboard. When uploading a CV, candidates select which job they're applying to. Evaluation scores that CV specifically against the chosen job's requirements — not a generic baseline. Admins can create, edit, or deactivate job postings and filter CVs by job throughout the system.

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router), React 19, TypeScript
- **Database & Storage**: Supabase (PostgreSQL, Storage bucket for CVs)
- **Parser Service**: Python 3.11+, FastAPI, pdfplumber, python-docx, spaCy
- **AI Evaluation**: NVIDIA NIM (optional, enabled via `NVIDIA_NIM_API_KEY`)
- **Styling**: Tailwind CSS via shadcn/ui
- **Testing**: Vitest

## Architecture

The Next.js application handles user interactions, authentication, and orchestrates the CV workflow:
1. Browser requests use Supabase anonymous key + Row Level Security (RLS)
2. Privileged operations (signed upload URLs, parser coordination) run in server routes with service-role key
3. The parser service operates as a separate HTTP service called via internal API
4. Services communicate through Supabase for data persistence and HTTP for direct parser invocation

Security boundaries:
- Browser code never sees service-role keys or internal secrets
- Parser service validates internal service secret on all requests
- Supabase RLS protects candidate/admin data access

## Local Development

### Prerequisites
- Node.js 20+ and pnpm 10+
- Python 3.11+
- Git
- Configured Supabase project with ATS schema (`profiles`, `jobs`, `cvs`, `parsed_data`, `evaluations` tables + `cvs` storage bucket)

### Setup

1. **Clone repository and install Next.js app**
   ```bash
   git clone <repository-url>
   cd ats-app
   pnpm install
   ```

2. **Configure environment**
   Create `.env.local` in repository root:
   ```dotenv
   # Browser-safe Supabase settings
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Server-only — never expose these to browser
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   INTERNAL_SERVICE_SECRET=replace-with-a-long-random-secret

   # Parser service location
   PARSER_SERVICE_URL=http://127.0.0.1:8000

   # Optional: NVIDIA NIM for AI evaluation
   # NVIDIA_NIM_API_KEY=
   ```

3. **Start parser service**
   ```bash
   cd parser-service
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

4. **Start Next.js application**
   ```bash
   # In new terminal, from repository root
   pnpm dev
   ```

Visit `http://localhost:3000` to access the application.

## CV Pipeline

1. **Upload & Storage**
   - Candidate uploads PDF/DOCX (<3 MB) via `/candidate` or `/admin` interface
   - Server validates file type/signature, stores in Supabase `cvs` bucket
   - Creates CV record with `uploaded` status

2. **Parsing**
   - Server advances status to `parsing`, generates signed URL
   - Calls parser service via `POST http://127.0.0.1:8000/parse` with `X-Internal-Secret`
   - Parser downloads CV, extracts text/structured data, writes to `parsed_data` table
   - Updates CV status to `parsed` (or `failed` on error)

3. **Evaluation**
   - Once a CV reaches `parsed` status and is linked to a Job, evaluation runs automatically (if `NVIDIA_NIM_API_KEY` is configured)
   - Evaluation scores the CV against the specific job's title, description, and required skills
   - Admins can manually re-trigger evaluation on an already-evaluated CV via the admin dashboard
   - Results are stored in the `evaluations` table and CV status updates to `evaluated`

Dashboards poll CV status endpoints for real-time UI updates without full-page reloads.

### Troubleshooting Common Issues

- **Upload saved but parsing doesn't start**: Verify `PARSER_SERVICE_URL` points to running parser and both services share identical `INTERNAL_SERVICE_SECRET`
- **Parser returns 401**: Regenerate secret and ensure identical value in Next.js `.env.local` and parser service environment
- **Parser returns 422**: Check FastAPI terminal for extraction errors (encrypted/image-only PDFs may require OCR not included)

### Quality Checks

From repository root:
```bash
pnpm test     # Unit/vitest tests
pnpm build    # Production build verification
```

## Deployment

For production:
- Deploy `parser-service/` as a separate Dockerized Python web service
- Set `PARSER_SERVICE_URL` in Next.js to the parser's HTTPS base URL
- Use same `INTERNAL_SERVICE_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in both deployments
- Never use `localhost` in cloud deployments — it refers to individual container, not inter-service communication