# ATS CV Screening Platform

This repository contains two services that run together during local development:

| Service | Directory | Local address | Responsibility |
|---|---|---|---|
| Next.js ATS application | Repository root | `http://localhost:3000` | Authentication, job and CV workflows, storage coordination, dashboards, and evaluation controls. |
| FastAPI parser | `parser-service/` | `http://127.0.0.1:8000` | Securely downloads a signed CV URL, extracts PDF/DOCX text, structures the CV, and records parsed data in Supabase. |

> **Security boundary:** Keep the Supabase service-role key and `INTERNAL_SERVICE_SECRET` on the server only. Never put either value in a `NEXT_PUBLIC_*` variable, browser source file, or Git commit.

## Prerequisites

Install Node.js 20 or newer, pnpm 10 or newer, Python 3.11 or newer, and Git. You also need the configured Supabase project that contains the ATS migrations, including `profiles`, `jobs`, `cvs`, `parsed_data`, and `evaluations`, along with the `cvs` Storage bucket.

## 1. Clone and install the Next.js application

```bash
git clone https://github.com/hadi-syedshah/ats-app.git
cd ats-app
pnpm install
```

Create a root `.env.local` file. Substitute the credentials from the **same Supabase project** where the ATS SQL migrations were applied.

```dotenv
# Browser-safe Supabase settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only settings — do not expose these to the browser
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INTERNAL_SERVICE_SECRET=replace-with-a-long-random-secret

# The local FastAPI parser service
PARSER_SERVICE_URL=http://127.0.0.1:8000

# Leave absent or blank to keep LLM evaluation disabled.
# NVIDIA_NIM_API_KEY=
```

The application intentionally leaves NVIDIA NIM evaluation dormant while `NVIDIA_NIM_API_KEY` is absent. Uploading and parsing can still be tested; evaluation actions report that configuration is required instead of sending a request to NVIDIA.

## 2. Install and configure the Python parser

Open a second terminal from the same repository.

```bash
cd ats-app/parser-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Export the parser's server-only configuration in that terminal. The values for `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `INTERNAL_SERVICE_SECRET` must match the root `.env.local` file. The parser code currently reads the project URL through the `NEXT_PUBLIC_SUPABASE_URL` name for compatibility with the application configuration; it is used server-side by FastAPI.

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export INTERNAL_SERVICE_SECRET="replace-with-the-same-long-random-secret"
```

Start the parser:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Confirm it is running before starting an upload:

```bash
curl http://127.0.0.1:8000/health
# Expected: {"status":"ok"}
```

## 3. Start the Next.js ATS application

Open a third terminal in the repository root and run:

```bash
cd ats-app
pnpm dev
```

Open `http://localhost:3000`. Sign up or sign in with Supabase email/password authentication. The database profile role determines access: candidates are routed to `/candidate` and administrators to `/admin`.

## 4. Test the end-to-end CV pipeline

Create or activate a job posting, then use a candidate account to upload a PDF or DOCX smaller than 3 MB. The server validates the extension and MIME type, stores the object in the `cvs` bucket, creates a CV record, creates a short-lived signed URL, and calls:

```text
POST http://127.0.0.1:8000/parse
X-Internal-Secret: <INTERNAL_SERVICE_SECRET>
```

The parser writes `parsed_data` and updates the CV status from `uploaded` through `parsing` to `parsed`. Candidate and admin dashboards poll the status endpoint so the UI can update without a full-page reload.

| Expected status | Meaning | Suggested check if it stops there |
|---|---|---|
| `uploaded` | Storage and CV database record completed. | Confirm `PARSER_SERVICE_URL` is set and the parser process is running. |
| `parsing` | The application sent a parse request. | Inspect the FastAPI terminal for request or dependency errors. |
| `parsed` | Text and structured fields were written successfully. | Check `parsed_data` in Supabase. |
| `evaluating` | An admin requested evaluation with NIM configured. | Confirm a valid `NVIDIA_NIM_API_KEY` exists only on the app server. |
| `evaluated` | Evaluation record is available. | View the candidate or admin results panel. |
| `failed` | The parser or evaluation step returned an error. | Check the app and FastAPI terminal logs; never expose secrets in logs. |

## Common local-development issues

| Symptom | Resolution |
|---|---|
| Browser shows a Supabase configuration notice | Verify both public Supabase variables in `.env.local`, then restart `pnpm dev`. |
| Upload is saved but parsing does not begin | Confirm `PARSER_SERVICE_URL=http://127.0.0.1:8000`, the FastAPI process is running, and both services use exactly the same `INTERNAL_SERVICE_SECRET`. |
| Parser returns `401 Invalid internal service secret` | Regenerate or copy the secret carefully to both service environments and restart both processes. |
| Parser returns `422 CV parsing failed` | Confirm the document is a readable PDF or DOCX and inspect the FastAPI terminal. Encrypted or image-only CVs may require OCR, which is not included in this parser. |
| Evaluation is unavailable | This is expected until you explicitly add a valid `NVIDIA_NIM_API_KEY` to the Next.js server environment. |

## Quality checks

From the repository root, run:

```bash
pnpm test
pnpm build
```

The credential test makes a read-only request to the configured `jobs` table. It needs a valid project URL and service-role key, but it does not insert, update, or delete application data.

## Deployment note

For production, deploy `parser-service/` as a separate Dockerized Python web service and set `PARSER_SERVICE_URL` in the Next.js application to its **HTTPS base URL**. Use the same server-only `INTERNAL_SERVICE_SECRET` in both deployments. Do not use `localhost` in a cloud deployment; it refers to the individual container rather than the other service.
