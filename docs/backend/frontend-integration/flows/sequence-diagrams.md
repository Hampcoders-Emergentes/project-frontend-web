# Operational flows (sequence diagrams)

Diagrams are Mermaid `sequenceDiagram`s; all REST paths are relative to `/api/v1`.

## 1. Sign-up, profile completion and token refresh

```mermaid
sequenceDiagram
    autonumber
    participant UI as Web/Mobile app
    participant API as Electrolink API
    participant IAM as IAM
    participant PRO as Profiles
    participant AST as Assets
    participant SUB as Subscriptions

    UI->>API: POST /auth/sign-up {email,password,passwordConfirmation,role:"User"}
    API->>IAM: create User (role User) + refresh token
    IAM-->>PRO: UserRegisteredEvent -> Incomplete profile
    API-->>UI: 201 {userId,email,token,refreshToken}
    UI->>API: POST /profiles/me/complete/homeowner (Bearer token)
    API->>PRO: validate + activate profile (ProfileCompletedEvent)
    API-->>UI: 201 MyProfileResponse + X-Refreshed-Token header
    PRO-->>AST: ProfileCompletedEvent -> create portfolio / inventory
    PRO-->>SUB: ProfileCompletedEvent -> BASIC subscription
    Note over UI,API: UI replaces its access token with X-Refreshed-Token (profileId, businessRole, roleSubjectId, subscriptionTier). Older tokens still work: claims are re-read server-side.
    Note over UI,API: Access token lives 20 min; refresh ~60 s before exp
    UI->>API: POST /auth/refresh {refreshToken}
    API->>IAM: validate hash, mark used, issue new pair
    API-->>UI: 200 {token, refreshToken}  (old refresh token is now invalid)
    UI->>API: POST /auth/refresh {old refreshToken}
    API-->>UI: 401 (reuse detected) -> clear session, go to sign-in
```

## 2. Password recovery

```mermaid
sequenceDiagram
    autonumber
    participant UI as Web app
    participant API as Electrolink API
    participant SMTP as SMTP / log
    actor U as User mailbox

    UI->>API: POST /auth/forgot-password {email}
    API-->>UI: 200 {message} (always, no enumeration)
    API->>SMTP: email with {PasswordReset:FrontendUrl}/reset-password?token=...
    SMTP-->>U: message (only if SMTP is configured; otherwise logged on the server)
    U->>UI: opens link (token valid 15 min, single use)
    UI->>API: POST /auth/reset-password {resetToken,newPassword,newPasswordConfirmation}
    API-->>UI: 200 {message:"Password reset successfully."} (all sessions revoked)
    UI->>API: POST /auth/sign-in
```

## 3. Critical alert on kitchen equipment (telemetry → alert → notification → response)

```mermaid
sequenceDiagram
    autonumber
    participant DEV as Sensor / Edge gateway
    participant API as Electrolink API
    participant SM as StoreManagement
    participant AL as AlertManagement
    participant HUB as SignalR /hubs/alerts
    participant DSP as Dispatch worker
    participant PNL as Kitchen panel / Web app
    participant EXT as Email / SMS / Webhook

    DEV->>API: POST /iot/edge/readings (X-Api-Key) {deviceId,readingId,voltage,current,...,leakageCurrentAmps}
    API->>SM: verify binding + allow-list, store measurement, detect anomaly
    SM->>AL: materialize alert (same transaction)
    API-->>DEV: 204
    AL->>HUB: ReceiveAlert (group store:{storeId})
    AL->>DSP: queue external dispatches per notification preferences
    DSP->>EXT: email / SMS / signed webhook (retry on failure)
    PNL->>API: GET /stores/{id}/alerts/active  (polling fallback)
    API-->>PNL: {hasCriticalLeakage:true, openCritical:1, items:[...]}
    PNL->>PNL: play siren while hasCriticalLeakage
    PNL->>API: POST /stores/{id}/areas/{a}/equipment/{e}/alerts/{alertId}/acknowledgement
    API-->>PNL: 200 AlertResponse (status ACKNOWLEDGED)
    PNL->>API: POST /alerts/{alertId}/assign {technicianId,technicianName}
    PNL->>API: POST /alerts/{alertId}/resolve {notes}
    API-->>PNL: 200 AlertResponse (status RESOLVED)
```

## 4. Offline edge buffer and batch synchronisation

```mermaid
sequenceDiagram
    autonumber
    participant EDGE as Edge panel
    participant API as Electrolink API
    participant SM as StoreManagement
    participant UI as Web dashboard

    Note over EDGE: connection lost - readings buffered locally (readingId, device timestamp)
    UI->>API: GET /stores/{id}/sensors/connectivity
    API-->>UI: sensor DISCONNECTED after disconnectionThresholdMin
    Note over EDGE: connection restored
    EDGE->>API: GET /iot/edge/devices/{deviceId}/thresholds (X-Api-Key)
    API-->>EDGE: thresholds
    EDGE->>API: POST /iot/edge/sync-batch {panelId, readings[1..1000] source:"EdgeBufferReplay"}
    API->>SM: ingest each reading idempotently (same id+values = no-op, different values = conflict)
    API-->>EDGE: 200 OfflineSyncResponse (received, accepted, duplicates, conflicts, rejected + per-reading results)
    UI->>API: GET /stores/{id}/areas/{a}/equipment/{e}/measurements?from=...&to=...
    API-->>UI: history ordered by capturedAtUtc (timestampBasis shows device vs server time)
```

## 5. Service request → matching → execution → completion

```mermaid
sequenceDiagram
    autonumber
    participant H as Homeowner app
    participant API as Electrolink API
    participant PL as Planning
    participant SUB as Subscriptions
    participant BO as Back-office (FieldManager)
    participant T as Technician app
    participant MON as Monitoring

    H->>API: GET /service-requests/eligibility
    API-->>H: {canCreate, remainingRequests, canMarkAsPriority}
    H->>API: POST /service-requests
    API-->>H: 201 {requestId}
    H->>API: POST /service-requests/{id}/property {propertyId}
    H->>API: GET /service-requests/{id}/available-services
    H->>API: POST /service-requests/{id}/recipe {serviceCategory}
    H->>API: POST /service-requests/{id}/details {problemDescription,...}
    H->>API: POST /service-requests/{id}/confirm
    API-->>H: 202 ServiceRequestSummaryResponse (PendingAssignment)
    PL-->>SUB: ServiceRequestCreated -> increment monthly counter
    PL->>PL: hybrid matching (AI + deterministic) -> ServiceAssignment
    H->>API: GET /service-requests/{id} (poll until status Assigned)
    BO->>API: POST /service-executions {assignmentId,requestId,technicianId,...,recipeSnapshot}
    T->>API: GET /service-executions/technicians/me/assigned
    T->>API: POST /service-executions/{id}/actions/start
    T->>API: POST .../actions/photos/upload-url -> direct upload -> POST .../actions/photos
    T->>API: POST .../actions/components + PUT .../actions/report
    T->>API: POST .../actions/complete
    API-->>T: 200 ServiceExecutionResponse (PendingReview/Completed) or 422 if preconditions fail
    H->>API: POST .../actions/reviews/client {rating,comment,categories}
    T->>API: POST .../actions/reviews/technician {rating,comment,categories}
```

## 6. Subscription checkout (Stripe) and webhook

```mermaid
sequenceDiagram
    autonumber
    participant UI as Web app
    participant API as Electrolink API
    participant ST as Stripe
    participant SUB as Subscriptions

    UI->>API: POST /subscriptions/checkout {planType,billingCycle,successUrl,cancelUrl}
    API->>ST: create Checkout Session
    API-->>UI: 200 {checkoutUrl,sessionId}
    UI->>ST: redirect to checkoutUrl (hosted page)
    ST-->>UI: redirect to successUrl (NOT proof of payment)
    ST->>API: POST /webhooks/stripe  invoice.payment_succeeded  (Stripe-Signature)
    API->>SUB: verify signature, idempotent inbox, activate PREMIUM
    API-->>ST: 200
    loop every 2 s up to 30 s
        UI->>API: GET /subscriptions/me
        API-->>UI: {planType,status}
    end
    Note over UI,API: No refresh-claims needed: the server re-reads subscriptionTier (cache up to 30 s)
    Note over ST,SUB: invoice.payment_failed -> GRACE_PERIOD (7 days); UI shows GET /subscriptions/me/status-alert
```
