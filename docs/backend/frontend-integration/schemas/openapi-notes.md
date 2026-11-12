# OpenAPI notes and SDK/type generation

## Where the machine-readable spec lives

| Resource | URL | Auth |
|---|---|---|
| OpenAPI 3 document (built-in, document name `v1`) | `GET {API_ORIGIN}/openapi/v1.json` | anonymous |
| Scalar API reference UI | `GET {API_ORIGIN}/scalar/v1` | anonymous (title "Electrolink API", `Bearer` scheme pre-selected; use *Authorize* with an access token to try calls) |

Both are registered in `Program.cs` (`AddOpenApi("v1")`, `MapOpenApi()`, `MapScalarApiReference()`) in **every** environment. Customisations:

- `BearerSecurityDocumentTransformer` adds the HTTP Bearer (JWT) security scheme.
- `SwaggerAnnotationsOperationTransformer` copies the project's `[ApiDocTag]`, `[ApiDocOperation(Summary, Description, OperationId)]` and `[ApiDocResponse]` attributes into the document. Only the controllers that use those attributes (IAM, Profiles, Assets, Analytics technician metrics, Processing) have summaries/operation ids; the others fall back to default operation ids.

## What the spec can and cannot tell you

| Topic | Reality |
|---|---|
| Schema names | The C# record names (`SignInResource`, `AlertResource`…). The Request/Response names in `requests.ts`/`responses.ts` of this folder are the *documented* names; they map 1:1 by dropping `Resource` and adding the suffix (`SignInResource` → `SignInRequest`, `AlertResource` → `AlertResponse`). Duplicated C# names are prefixed by context in the TS files (`AssetsAddressRequest`, `ProfilesAddressResponse`, `PlanningRequestEligibilityResponse`, `SubscriptionsRequestEligibilityResponse`, `MonitoringRecipeSnapshotResponse`, `PlanningRecipeSnapshotResponse`). |
| Missing response schemas | Many actions return `IActionResult` without `[ProducesResponseType]`, so the spec shows no body (e.g. Profiles, Assets devices, IAM, Subscriptions). Use the response types in this documentation. |
| Anonymous-object responses | `{ message }`, `{ requestId }`, stock page, etc. are not modelled in the spec (they are in `responses.ts` as `MessageResponse`, `RequestIdCreatedResponse`, `StockPageResponse`…). |
| Error bodies | Not described per operation. Every error is the RFC 7807 `ProblemDetailsResponse` (`application/problem+json`); see `errors/error-contract.md`. |
| Enums | Strings everywhere (global `JsonStringEnumConverter`); generators that read the schema emit string unions. Cross-check casing with `api/enums.md`. |
| Duplicate routes | None: the `/api/v1/authentication/*` compatibility alias is excluded from the document (`[ApiExplorerSettings(IgnoreApi = true)]`); only canonical `/api/v1/auth/*` appears. |
| SignalR / MQTT / webhooks | Not part of OpenAPI. |
| File endpoints | Download routes appear with `application/pdf` / `text/csv` / `image/png`. |

## Generating types / clients

TypeScript types only (fetch-agnostic):

```bash
npx openapi-typescript http://localhost:8080/openapi/v1.json -o src/api/generated.d.ts
```

Typed client (e.g. `@hey-api/openapi-ts`, `orval`, or `openapi-generator-cli -g typescript-fetch|typescript-angular`):

```bash
npx @hey-api/openapi-ts -i http://localhost:8080/openapi/v1.json -o src/api/client
# or, Angular:
npx @openapitools/openapi-generator-cli generate -i http://localhost:8080/openapi/v1.json -g typescript-angular -o src/api/client
```

Recommended workflow:

1. Generate from the running API for paths/verbs/params (CI: fail the build when the generated file changes unexpectedly).
2. Keep the hand-curated `schemas/requests.ts` / `responses.ts` as the *semantic* contract (they include nullability, enum value sets and anonymous responses the generator misses), or alias the generated schemas to those names.
3. Wrap the generated client with your own interceptor for: Bearer injection, single-flight refresh on 401, error normalisation (`toApiError`), and `X-Api-Key` **never**.

## Keeping the docs in sync

`api/endpoint-inventory.md` lists every route discovered in controller attributes. When a controller changes, regenerate the diff by comparing it with `GET /openapi/v1.json` paths: routes present in one but not the other indicate stale documentation.
