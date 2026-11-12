# Monitoring (service execution)

**Endpoints:** [`../api/monitoring/endpoints.md`](../api/monitoring/endpoints.md)

## Responsibilities

Everything that happens **after** a technician is assigned: scheduled visit, arrival/start, evidence (before/during/after photos), technical report, components actually used, completion, cancellation/reassignment, no-show detection, reviews in both directions, and remote circuit (relay) toggling during the service.

## Model

| Element | Kind | Notes |
|---|---|---|
| `ServiceExecution` | Aggregate root | `ExecutionId` (`exec-…`), assignment/request ids, technician, owner, property, `EExecutionStatus`, schedule/start/complete timestamps, **recipe snapshot** (category, price, components, duration, warranty), priority flag, work log. |
| `WorkPhoto` | Entity | Type (`Before`/`During`/`After`), provider id/URL, thumbnail, size, format, taken at. |
| `ComponentUsageRecord` | Entity | Components reserved vs actually used (`delta`). |
| `ServiceEvaluation` | Entity | Client → technician and technician → client reviews with rating + categories. |
| `RelayActionRecord` | Entity | Circuit toggles performed during the service. |
| `ServiceCancellationRequest` | Aggregate | Cancel/reassignment request. |

## State machine

`Notified → EnRoute → Arrived → InProgress → PendingReview → Completed`, or `Cancelled` from non-terminal states. `actions/start` moves to `InProgress`; `actions/complete` requires the evidence/report preconditions (otherwise **422**) and opens a review window (`EvaluationWindowOpened/Expired`).

## Rules and invariants

- Creating an execution is a back-office action (`Admin`, `SuperAdmin`, `FieldManager`); duplicates for the same assignment → 409.
- Technician actions resolve the technician from the JWT claim `roleSubjectId`, so the token must be refreshed after profile completion; other callers get 401/403.
- Work photos are limited in total and per type (400 `MaxWorkPhotos…Exceeded`).
- Review ratings use fixed category sets (client review: `EEvaluationCategory`; technician review: `ETechnicianEvaluationCategory`). Reviews return `204`.
- `extend-wait` lets the homeowner extend the technician wait window by N minutes (no-show tracking: `TechnicianNoShowDetected`, `NoShowAlertResponse` with options for the client).
- Remote relay toggling inside a service uses the service's property and the IoT device in Processing (`iot/toggle-relay`); the physical command still follows the MQTT lifecycle.

## Events

Published: `ServiceExecutionCreated/Started/StatusChanged/Cancelled`, `ServiceCompleted` (→ `ServiceCompletedExternalEvent`), `WorkPhotoUploaded`, `TechnicalReportUpdated`, `ComponentsActuallyUsedRecorded`, `ClientReviewSubmitted`/`TechnicianReviewSubmitted`/`HomeownerReviewSubmitted`, `TechnicianNoShowDetected`, `ReassignmentRequested`, `CircuitToggleRequested/Recorded/ToggledRemotely`, `ServiceWaitTimeExtended`.
Consumed: `CircuitToggleRequestedEvent`, `RelayCommandExecutedEvent` (Processing), `ActiveServiceAnomalyAlertedEvent` (log-only).
