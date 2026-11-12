# AI providers (matching and device onboarding)

| Feature | Provider | Switch | Fallback |
|---|---|---|---|
| Technician matching (`HybridMatchingService`) | Gemini (`Gemini:*`, default model `gemini-2.0-flash`) or OpenAI-compatible (`OpenAI:*`) | `ExternalProviders:AIMatching` = `gemini` \| `openai` \| `disabled` (code default `disabled`; the committed `appsettings.json` sets `gemini`; Docker Compose sets `disabled`) | Deterministic scoring (distance weight 0.30, max 100 km, …) when AI is disabled, times out (`*:TimeoutSeconds`, default 30 s) or fails. `GET /service-assignments/{id}/matching-details` returns `method` and `reasoning` so admins can see which path was used. |
| Device onboarding assistant (`POST /profiles/me/device-onboarding/analyze` and `/adjust`) | **Groq** chat-completions API (`https://api.groq.com/openai/v1/chat/completions`, model `ProfilesAI:ModelId`, default `llama-3.3-70b-versatile`, key `ProfilesAI:ApiKey`) | none (no selector) | None — failure ⇒ `503` on `analyze`. |

Frontend notes:

- Matching runs automatically after a service request is confirmed; the REST `POST /service-assignments/execute` is only a manual admin trigger (`422` with `MatchingResultResponse.assigned=false` when nothing could be assigned).
- `analyze` is an LLM call: expect seconds of latency; show progress and handle `503`. Keep `analysisId` from the response and send it to `adjust` with the user's free-text feedback to refine thresholds. Persist accepted thresholds with `PUT /profiles/{profileId}/thresholds`.
- Do not send secrets or personal data in `userMessage`; the text is forwarded to a third party.
