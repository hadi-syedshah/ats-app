# Current Fix Verification

## Landing Sign in navigation

After replacing the landing-page `next/link` elements with browser-native anchors, the managed-browser test navigated from `/` to `/login` after activating the visible **Sign in** link. The login route rendered its email and password controls. This direct navigation check passed.

## NIM retry and live pipeline verification

The evaluator now retries retryable HTTP responses (`408`, `429`, `451`, and `5xx`) and transport failures for a maximum of three total attempts, using 600 ms then 1,200 ms backoff. The old `/v1/models` check was removed; chat completions remain the integration path used by both the evaluator and live verification.

The acceptance criterion was met with **two consecutive successful real end-to-end runs** against the isolated production server after the change:

| Run | CV ID | Parsed skills | Final status | Score | Model |
|---|---|---:|---|---:|---|
| 3 | `3ece3c77-5678-49cf-8244-7a911fe8fbac` | 7 | `evaluated` | 80 | `meta/llama-3.1-8b-instruct` |
| 4 | `2d289b82-a666-4e51-9c14-e1da7c9ada3a` | 7 | `evaluated` | 80 | `meta/llama-3.1-8b-instruct` |

An earlier second run received repeated upstream 451 responses and ended with `failed` after three attempts. That transient upstream outcome was not counted toward the acceptance criterion; the immediately subsequent runs 3 and 4 both completed successfully.
