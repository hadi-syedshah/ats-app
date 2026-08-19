# Project TODO

- [x] Document the ATS architecture, existing Supabase schema contract, and deployment boundaries.
- [ ] Configure server-only Supabase integration helpers and role-aware access guards without changing the existing schema.
- [ ] Implement candidate/admin auth routing and role-aware dashboard navigation.
- [ ] Implement server-side CV validation, three-CV enforcement, Storage upload, secure signed URL generation, and CV deletion.
- [ ] Implement modular backend contracts for jobs, CVs, parsed data, and evaluations using the existing Supabase schema.
- [ ] Create the separate typed FastAPI parser service with PDF/DOCX extraction, structured parsing, internal-secret protection, and Docker assets.
- [ ] Implement parser orchestration from the application server and status progression through uploaded, parsing, parsed, evaluating, evaluated, and failed.
- [ ] Implement NVIDIA NIM evaluation boundary that remains disabled unless a real NVIDIA_NIM_API_KEY is supplied.
- [ ] Build candidate job browsing, CV submission, live status polling, deletion, and evaluation-results views.
- [ ] Build admin job creation/editing/deactivation, job-filtered CV review, search, deletion, and manual evaluation controls.
- [ ] Add sample job seed guidance that does not fabricate reviews or candidate data.
- [ ] Create .env.example, local/deployment README, and parser-service README.
- [ ] Write and run Vitest coverage for validation, role access, CV-limit, parser request, and evaluation configuration logic.
- [ ] Verify responsive UI in the preview and resolve runtime or console errors.
- [ ] Commit the completed source code to the connected GitHub repository.
- [ ] Save a final project checkpoint after all completed TODO items are marked done.
- [ ] Deploy the separate FastAPI parser service to a Python-capable HTTPS host and configure the shared internal secret.
- [ ] Add the verified parser HTTPS URL to the ATS server configuration and validate the health endpoint.
