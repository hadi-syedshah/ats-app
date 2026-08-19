# ATS Parser Service

This service exposes `POST /parse` for the ATS web application. It only accepts calls that include an `X-Internal-Secret` header equal to `INTERNAL_SERVICE_SECRET`.

## Required environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used to write `parsed_data` and CV statuses. |
| `INTERNAL_SERVICE_SECRET` | Shared secret required from the web application's parser request. |

## Local development

Create a virtual environment, install dependencies, configure the three variables above, and run:

```bash
uvicorn app.main:app --reload --port 8000
```

Set `PARSER_SERVICE_URL=http://localhost:8000` in the web application environment. In production, deploy this folder as a standalone Python service and set `PARSER_SERVICE_URL` to its HTTPS URL. Do not expose its service-role key or internal secret in browser code.
