# Current Verification Evidence

This report distinguishes **what was directly observed during the current verification session** from implementation claims. It records command output without substituting an intended status for a measured result.

## 1. Preview runtime state

The first direct probe during this session found no process listening on port 3000:

```text
=== PROCESS ===
=== HTTP ROOT ===
curl: (7) Failed to connect to 127.0.0.1 port 3000 after 0 ms: Couldn't connect to server
HTTP 000 | http://127.0.0.1:3000/
```

The log then showed that the prior preview process had exited cleanly after a race over `.next` artifacts:

```text
[2026-08-19T07:55:24.114Z] [Error: ENOENT: no such file or directory, open '/home/ubuntu/ats-app/.next/server/app-paths-manifest.json']
[2026-08-19T07:55:24.702Z] ⨯ Error: ENOENT: no such file or directory, open '/home/ubuntu/ats-app/.next/routes-manifest.json'
[2026-08-19T07:55:25.320Z] GET / 500 in 11793ms
[2026-08-19T07:55:29.099Z] Dev server exited with code 0
```

The development server had been running while `pnpm build` removed or regenerated `.next`; that concurrent artifact access produced the failure. I subsequently performed a clean build while the preview process was stopped, then restarted the preview. Direct service checks after that restart returned:

```text
APP 200
PARSER 200
```

The currently observed process snapshot after the restart was:

```text
  64935       44:23 S<l  78384 /usr/bin/python /usr/local/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
 133309       01:44 S<    1084 sh -c next dev
 133310       01:44 S<l  81224 node /home/ubuntu/ats-app/node_modules/.bin/../next/dist/bin/next dev
```

The browser loaded the current landing page at the managed preview URL and exposed the `Sign in` and `Open the workspace` links, both targeting `/login`. A prior browser interaction in this session successfully changed the login screen from sign-in to create-account mode. A later automated click attempt on the landing-page `Sign in` link did **not** show a navigation event in the browser tool output, so this report does not claim that particular click was re-proven in the final restarted session. The `/login` route itself loaded directly and rendered its controls.

## 2. Fresh `pnpm test` output

> Command: `pnpm test`  
> Result: **failed** — 9 test files passed and 2 external-credential tests failed; 17 of 19 tests passed.

```text
✓ server/api-auth.test.ts (3)
✓ server/ats-validation.test.ts (4)
✓ server/cv-limit.test.ts (1)
✓ server/evaluation-configuration.test.ts (2)
✓ server/nvidia-nim-chat.test.ts (1) 5429ms
❯ server/nvidia-nim.test.ts (1) 1499ms
  ❯ NVIDIA NIM credential (1) 1499ms
    × authorizes a lightweight models request 1498ms
✓ server/parser-orchestration.test.ts (2)
✓ server/parser-service.test.ts (1)
❯ server/render-api.test.ts (1) 10593ms
  ❯ Render deployment credential (1) 10592ms
    × can list the account owners through Render's read-only API 10591ms
✓ server/supabase-credentials.test.ts (1) 895ms
✓ lib/ats/evaluation.test.ts (2)

FAIL  server/nvidia-nim.test.ts > NVIDIA NIM credential > authorizes a lightweight models request
AssertionError: expected 451 to be 200 // Object.is equality
- Expected
+ Received
- 200
+ 451
❯ server/nvidia-nim.test.ts:13:52
    11|     });
    12|
    13|     expect(response.status, await response.text()).toBe(200);
      |                                                    ^
    14|   }, 40_000);
    15| });

FAIL  server/render-api.test.ts > Render deployment credential > can list the account owners through Render's read-only API
TypeError: fetch failed
❯ server/render-api.test.ts:8:22
     6| describe("Render deployment credential", () => {
     7|   credentialCheck("can list the account owners through Render's read-o…
     8|     const response = await fetch("https://api.render.com/v1/owners", {
      |                      ^
     9|       headers: { Authorization: `Bearer ${renderApiKey}` }
    10|     });
Caused by: ConnectTimeoutError: Connect Timeout Error (attempted addresses: 216.24.57.250:443, timeout: 10000ms)

Serialized Error: { code: 'UND_ERR_CONNECT_TIMEOUT' }

Test Files  2 failed | 9 passed (11)
     Tests  2 failed | 17 passed (19)
  Start at  07:54:48
  Duration  11.47s (transform 313ms, setup 0ms, collect 1.03s, tests 18.63s, environment 2ms, prepare 996ms)
ELIFECYCLE Test failed. See above for more details.
```

The passing tests cover API role guards (3), upload validation (4), three-CV limit (1), evaluation configuration (2), NIM chat completion (1), parser orchestration (2), parser health (1), Supabase service-role credentials (1), and evaluation JSON handling (2). The current test suite is therefore **not green**.

## 3. Fresh build output

The first build attempted while the development server was also manipulating `.next` failed during page-data collection. I did not treat that failure as a passing build. After stopping that preview process and deleting stale build artifacts, the following isolated command ran successfully.

> Command: `rm -rf .next && pnpm build`  
> Result: **passed**.

```text
> ats-app@1.0.0 build /home/ubuntu/ats-app
> NODE_ENV=production next build
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry
   ▲ Next.js 15.5.23
   - Experiments (use with caution):
     · serverActions
   Creating an optimized production build ...
<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (107kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (258kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
 ✓ Compiled successfully in 11.7s
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (12/12)
 ✓ Collecting build traces
 ✓ Finalizing page optimization
Route (app)                                 Size  First Load JS
┌ ƒ /                                      162 B         107 kB
├ ○ /_not-found                            998 B         104 kB
├ ƒ /admin                                  3 kB         177 kB
├ ƒ /api/cvs                               142 B         103 kB
├ ƒ /api/cvs/[id]                          142 B         103 kB
├ ƒ /api/cvs/[id]/evaluate                 142 B         103 kB
├ ƒ /api/jobs                              142 B         103 kB
├ ƒ /api/jobs/[id]                         142 B         103 kB
├ ƒ /api/status                            142 B         103 kB
├ ƒ /auth/callback                         142 B         103 kB
├ ƒ /candidate                           15.6 kB         190 kB
├ ○ /dashboard                             142 B         103 kB
└ ○ /login                               1.67 kB         176 kB
+ First Load JS shared by all             103 kB
  ├ chunks/865-21706d8b09985f0a.js       46.8 kB
  ├ chunks/d285c4ad-6ffb5094be4b2a17.js  54.2 kB
  └ other shared chunks (total)          1.92 kB
ƒ Middleware                             93.2 kB
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## 4. Fresh live end-to-end run

I personally ran the repository’s disposable live E2E script against the currently restarted application and local parser. The script creates synthetic candidate and administrator accounts, uploads a generated PDF CV, waits for parser completion, requests evaluation, and deletes its test records in `finally`.

> Command: `node scripts/live-e2e.mjs`  
> Result: **partial success, then evaluation failure**.

```text
{"phase":"upload CV","cv_id":"3bda5bd9-ce53-48c1-b363-935668562d2a","upload_status":"created"}
{"phase":"wait for parsing","cv_id":"3bda5bd9-ce53-48c1-b363-935668562d2a","status":"parsed"}
{"phase":"verify parsed data","cv_id":"3bda5bd9-ce53-48c1-b363-935668562d2a","parsed":{"name":"Casey Example (cid:20) Software Engineer","email":"casey.example@example.test","skill_count":7}}
{
  "phase": "request evaluation",
  "cv_id": "3bda5bd9-ce53-48c1-b363-935668562d2a",
  "error": "Evaluation failed (502): {\"error\":\"NVIDIA NIM request failed (451): \"}",
  "cleanup": "will run in finally"
}
Error: Evaluation failed (502): {"error":"NVIDIA NIM request failed (451): "}
```

This current evidence proves the path reached **CV creation → parsed**, extracted seven skills, and then failed at **evaluation request**. It does **not** prove current successful evaluation or persistence of an evaluated result. The runner’s `finally` block was reached after the error; the script is designed to clean up test users, CV, and storage object, but I did not independently query the database afterward in this session to prove each deletion.

## 5. GitHub and checkpoint state

```text
=== LOCAL HEAD ===
6bad245377695f8bb8f00bd56263c8cd26103935
Checkpoint: Recovered managed preview responsiveness by restarting the service and adding a dashboard compatibility redirect for the preview health probe; verified login control interactivity and clear browser console.
2026-08-19 07:49:18 +0000

=== WORKTREE ===
 M scripts/live-e2e.mjs
 M todo.md

=== GITHUB MAIN ===
6bad245377695f8bb8f00bd56263c8cd26103935 refs/heads/main
```

The checked-out local `HEAD` and `user_github/main` matched when checked. The managed preview was restarted from that checkpoint before the later uncommitted diagnostic changes to `scripts/live-e2e.mjs` and `todo.md`; therefore, **the preview matches commit `6bad245…`, while the current workspace does not exactly match that commit**.

## 6. Features not directly proven by running the app in this session

| Feature area | Direct proof this session | Current classification |
|---|---|---|
| Public landing and login rendering | Browser loaded both routes. | Directly observed. |
| Create-account UI toggle | Browser interaction switched the login form in the earlier recovery session. | Directly observed. |
| Landing-page Sign in navigation after latest restart | Link target was rendered; the final automated click attempt did not report navigation. | Not re-proven. |
| Candidate upload and parsing | Fresh synthetic E2E run reached `parsed` and returned seven skills. | Directly observed. |
| Current NIM evaluation and evaluated-result persistence | Fresh run failed at NIM upstream status 451. | Not proven; currently failing. |
| Candidate dashboard after authenticated user interaction | Not manually walked through in the browser during this session. | Code/test only. |
| Admin job CRUD, filtering, and CV deletion through browser UI | Not manually walked through in the browser during this session. | Code/test only. |
| Candidate delete through browser UI | Not manually walked through in the browser during this session. | Code/test only. |
| Upload validation UI paths | Unit-tested; no browser interaction this session. | Test only. |
| RLS behavior with a real non-admin session in each UI route | Authentication guards are test-covered; no manual RLS browser test this session. | Test/code only. |
| Parser HTTPS cloud deployment | Explicitly deferred; local parser only was tested. | Not deployed. |

## 7. Follow-up NIM and navigation evidence

After the earlier failed run, the same disposable end-to-end script was re-run while both services returned HTTP 200. It reached `evaluated` and produced a score of 80 with model `meta/llama-3.1-8b-instruct`. This proves that the configured `NVIDIA_NIM_API_KEY` was present and accepted by the **chat-completions** endpoint during that later run. The `GET /v1/models` credential test remains independently unreliable in this environment because it returned HTTP 451 in the preceding test run.

The failed CV `3bda5bd9-ce53-48c1-b363-935668562d2a` and the successful follow-up CV `840fb30b-a793-4bd3-ae03-903bf9a31cd2` were queried directly after their disposable-run cleanup. The database returned `[]`; neither record is currently stuck in `evaluating` or `failed`.

After a new preview restart, the landing page again rendered the visible `Sign in` link targeting `/login`. Browser DOM inspection measured it as an anchor at `left: 1167.15625`, `top: 18`, `width: 65.34375`, `height: 34`; `document.elementFromPoint(1200, 35)` returned that same `A` element with text `Sign in`. I then tried the exact link by its browser element index and by the measured screen coordinates. In all attempts, the browser remained at `/`; no navigation event was reported. **The direct navigation test is a failure in the current managed browser/preview session.** The `/login` route has been shown to render when opened directly, but the landing-page Sign in interaction must not be reported as proven working.

## 8. Controlled persisted failure-state reproduction

To capture the status before disposal, I built the app and started a separate local production process on port 3001 with only that process configured with `NVIDIA_NIM_API_KEY=invalid`. The managed project configuration was not changed. The disposable script was directed to that process and produced the following exact output:

```text
{"phase":"upload CV","cv_id":"f804a900-6bb4-4712-9dbd-fff4b8c15caa","upload_status":"created"}
{"phase":"wait for parsing","cv_id":"f804a900-6bb4-4712-9dbd-fff4b8c15caa","status":"parsed"}
{"phase":"verify parsed data","cv_id":"f804a900-6bb4-4712-9dbd-fff4b8c15caa","parsed":{"name":"Casey Example (cid:20) Software Engineer","email":"casey.example@example.test","skill_count":7}}
{
  "phase": "request evaluation",
  "cv_id": "f804a900-6bb4-4712-9dbd-fff4b8c15caa",
  "status_after_failure": "failed",
  "error": "Evaluation failed (502): {\"error\":\"NVIDIA NIM request failed (451): \"}",
  "cleanup": "will run in finally"
}
file:///home/ubuntu/ats-app/scripts/live-e2e.mjs:123
  if (!evaluateResponse.ok || typeof evaluateBody.evaluation?.score !== "number") throw new Error(`Evaluation failed (${evaluateResponse.status}): ${JSON.stringify(evaluateBody)}`);
                                                                                        ^
Error: Evaluation failed (502): {"error":"NVIDIA NIM request failed (451): "}
    at file:///home/ubuntu/ats-app/scripts/live-e2e.mjs:123:89
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
Node.js v22.13.0
```

The script read `cvs.status` immediately after receiving the 502 and before its `finally` cleanup; the observed persisted status was therefore **`failed`**, not `evaluating`. A subsequent direct SQL query returned `[]` for that CV ID, confirming the disposable cleanup removed the retained record after the status observation.
