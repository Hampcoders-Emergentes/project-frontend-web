# Known limitations (verified against the code)

Severity: 🔴 blocks a documented feature · 🟠 surprising/risky behaviour · 🟡 caveat.

## Real-time and integrations

| # | | Limitation | Evidence | Frontend workaround |
|---|---|---|---|
| 1 | 🟠 | **Email is log-only without SMTP.** `LoggingEmailSender` is registered when `Email:Smtp:Host` is empty: password-reset and alert emails are not delivered but the API answers 200. | `EmailServiceCollectionExtensions` | Confirm SMTP is configured per environment. |
| 2 | 🟠 | **SMS is log-only without a gateway.** `LoggingSmsAlertChannel` writes to the log (masked) unless `Notifications:Sms:GatewayUrl` is set. | `StoreManagement/Infrastructure/Configuration/WebApplicationBuilderExtensions.cs`, `ExternalAlertChannels.cs` | Do not advertise SMS alerts unless configured. |
| 3 | 🟠 | **`disabled` providers fabricate data.** `ExternalProviders:Payment=disabled` returns fake customers/portal URLs (`?portal=null`); `FileStorage=disabled` returns `https://null-storage.local/...`; `AIMatching=disabled` yields no candidates (deterministic matching only). Docker Compose ships all three disabled. | `Shared/Infrastructure/ExternalProviders/Null*.cs`, `docker-compose.yml` | Treat Compose as non-functional for payments/uploads. |
| 4 | 🔴 | **Direct Cloudinary upload for property and work photos cannot be reproduced client-side.** The API signs `folder`, `allowed_formats`, `max_bytes` and `timestamp` but returns only `url`, `signature`, `timestamp`, `apiKey`; the property/work folders embed a server-side `yyyyMMddHHmmss` the client cannot know. Profile photos are deterministic and work. | `FileStorageService.cs`, `CloudinaryFileStorageProvider.GetSignedUploadUrlAsync` | Request backend change (return signed params) before building those screens. |
| 5 | 🟠 | **Device onboarding AI has no fallback** (Groq URL hard-coded; failure → 503). | `DeviceOnboardingService.cs` | Show retry/manual threshold entry (`PUT /profiles/{profileId}/thresholds`). |
| 6 | 🟡 | **MQTT broker in Docker is anonymous/no TLS**; if the broker is down relay commands are silently not delivered (REST still returns 204). | `docker/mosquitto/mosquitto.conf`, `MqttDeviceSubscriberService.PublishCommandAsync` | Poll relay history; show `Pending/Timeout`. |
| 7 | 🟡 | **TS04 asks for a dedicated microservice; reports are generated in the monolith**, synchronously. | `ComplianceAssessmentService`, `EnergyReportCommandService` | Allow several seconds for large ranges; no progress API. |

## Security / operations

| # | | Limitation |
|---|---|
| 8 | 🟠 **Edge API key is a single shared secret** for all gateways. In **Development** `appsettings.Development.json` now sets `EdgeApi:ApiKey=dev-edge-key` and allow-lists `dev-001`, `dev-002`, `dev-003`, `prop-demo` for `EquipmentReadings` and `RelayHistory`. Outside Development the lists default to empty ⇒ **403 for every edge request** (startup warning); Docker Compose defaults the key to `dev-edge-key`. |
| 9 | 🟠 `ForwardedHeaders` trusts any proxy (known proxies/networks cleared) and `AllowedHosts` is `*`; the contact-form limiter keys on the (spoofable) forwarded IP. |
| 10 | 🟡 HTTPS redirection runs only in Development; TLS must be terminated upstream. |
| 11 | 🟡 Only the contact form is rate-limited; no global throttling. |
| 12 | 🟡 Audit logging uses a bounded in-memory queue (10 000) that **drops** entries when full; reads are not logged unless `Audit:IncludeReads`. |
| 13 | 🟡 Schema: `AppDbContext.EnsureCreated()` only acts on an *empty* database and never evolves it; only the StoreManagement context has real migrations. Production schema changes need a separate deployment step (`Database:MigrateOnStartup=false`). |
| 14 | 🟡 Frontend dev URLs now point to Angular at `http://localhost:4200` (CORS, `PasswordReset:FrontendUrl`, Stripe base/success/cancel URLs in `appsettings.json` and `appsettings.Development.json`). The committed `appsettings.json` still holds non-secret Stripe price ids; override per environment and keep secrets in environment variables. |
| 15 | 🟡 Wear predictions need enough samples; equipment with insufficient data is reported separately — an empty prediction list is not "healthy". |
| 16 | 🟡 Alerts: one alert per reading (no incident grouping, hysteresis or re-open); `Open` alerts can pile up during sustained anomalies. |
| 17 | 🟡 `SubscriptionEligibilityResource` and several `*Internal*`/`Create*` subscription resources exist in the code but are **not exposed** by any controller (documented schemas intentionally omit them). |
