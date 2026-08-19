# ATS Specification Audit

## Verified implementation state

| Area | State | Evidence |
|---|---|---|
| Role-aware authentication | Complete | Supabase SSR authentication, profile role checks, and middleware route candidate users to `/candidate` and administrators to `/admin`. |
| Candidate workflow | Complete | Candidates can browse active roles, upload up to three validated PDF/DOCX CVs of no more than 3 MB, poll status, inspect evaluation output, and delete their own records. |
| Administrator workflow | Complete | Administrators can create, edit, activate/deactivate, and delete jobs; search/filter the screening queue; trigger evaluations; and delete CVs. |
| CV security and Storage | Complete | The server validates extension, MIME type, byte size, and file signature before storing CVs at a user-scoped path. Service-role credentials remain server-only. |
| Parser service | Complete for local operation | `parser-service/` contains a typed FastAPI service using `pdfplumber` and `python-docx`, with an internal-secret header boundary and Docker assets. |
| NIM evaluation | Complete when configured | A real `NVIDIA_NIM_API_KEY` gates evaluation. The service calls NIM, normalizes score/skill output, persists results, and transitions `evaluating` to `evaluated`. |
| Live pipeline verification | Passed | A disposable PDF-resume test was uploaded, parsed into seven skills, evaluated against Software Engineer, and persisted with score 80/100; test data was then removed. |
| Visual refinement | Complete | The Verity identity now carries through landing and login pages; the homepage presents the application-to-decision flow; candidate metrics, table states, designed empty states, dense admin tables, and reduced-motion-safe animation are implemented. |
| Automated checks | Passed | `pnpm vitest run` passed 19 tests across 11 files. A clean `pnpm build` completed successfully. |

## Configuration-dependent behavior

| Dependency | Behavior | Current project decision |
|---|---|---|
| `NVIDIA_NIM_API_KEY` | Evaluation remains unavailable and returns a configuration response until a real server-side key exists. | Configured and validated during live verification. |
| `PARSER_SERVICE_URL` | Upload creates a CV record but parsing can only run when the Next.js app can reach the parser service. | Local development uses `http://127.0.0.1:8000`. |
| HTTPS parser deployment | A cloud-hosted Next.js app requires a separately deployed HTTPS parser service, using the same `INTERNAL_SERVICE_SECRET`. | Explicitly deferred at the user's request; no public parser URL is claimed. |
| Environment template | The README provides a full, non-secret `.env.local` template and clearly separates browser-safe from server-only values. | Runtime secrets are managed through the project secret configuration rather than a committed local template file. |

## Remaining operational action

> Before publishing a cloud deployment, deploy `parser-service/` to a Python-capable HTTPS host, set its `INTERNAL_SERVICE_SECRET`, and set `PARSER_SERVICE_URL` in the Next.js environment to that HTTPS base URL. Do not use `localhost` across cloud services.
