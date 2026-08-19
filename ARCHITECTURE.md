# ATS Architecture

The application is organised as a **Next.js App Router** frontend and API layer backed by the existing Supabase project. Browser requests use the Supabase anonymous key and existing RLS policies. Privileged actions—signed upload URLs, parser orchestration, and evaluation writes—run only in server routes that use the service-role key.

The application keeps the existing schema unchanged: `profiles`, `jobs`, `cvs`, `parsed_data`, and `evaluations`. Candidate ownership is derived from the authenticated Supabase user ID; admin access is determined by `profiles.role`.

## Processing flow

1. A candidate selects an active job and uploads a PDF or DOCX file. The server validates its type, signature, and 3 MB limit, enforces the three-CV limit, and stores the file under `{user_id}/{timestamp}-{filename}` in the `cvs` bucket.
2. The server creates a `cvs` record with an `uploaded` status, advances it to `parsing`, generates a short-lived signed URL, and calls the parser service with `X-Internal-Secret`.
3. The FastAPI service validates the internal secret, extracts text and structured CV data, stores `parsed_data`, and updates the CV status to `parsed`. Failures set the CV status to `failed` without exposing internal details to the candidate.
4. An administrator can initiate evaluation for a parsed CV linked to a job. The evaluator remains disabled until a real NVIDIA NIM key is configured; it then compares parsed data with the job description and skill requirements and stores the result in `evaluations`.

## Deployment boundary

The managed web application runs one Node.js server process. The Python FastAPI parser therefore remains a **separate service** with its own `parser-service/Dockerfile`; the web app reaches it only through `PARSER_SERVICE_URL`. The repository includes local-development instructions for running both services together. The parser must be deployed to a separate Python-capable service rather than being started as a child process of the web application.

## Security boundaries

Client code never receives `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_SERVICE_SECRET`, or `NVIDIA_NIM_API_KEY`. Supabase RLS remains the client-facing access layer. The parser accepts only internal calls that include its shared secret, and the Node server is the sole caller that can create signed storage URLs.
