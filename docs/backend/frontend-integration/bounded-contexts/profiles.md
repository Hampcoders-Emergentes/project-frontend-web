# Profiles

**Endpoints:** [`../api/profiles/endpoints.md`](../api/profiles/endpoints.md)

## Responsibilities

The *business identity* behind an IAM user: whether they are a **technician**, **homeowner** or **company**, their personal data, preferences, photo, technician specialties/service area, plus back-office **staff members** (Makers) and the AI-assisted **device onboarding** (threshold suggestions).

## Model

| Element | Kind | Notes |
|---|---|---|
| `Profile` | Aggregate root | `ProfileId` (`prof-…`), `UserId`, `EProfileStatus` (`Incomplete` → `Active` → `Deactivated`/`Suspended`/`Rejected`), `EBusinessRole`, personal data (name, phone, DNI, birth date, address), photo. |
| `Technician` | Entity | `TechnicianId` (`tech-…`), `Specialty` list (≥ 1), experience years, about-me, **service area** (centre lat/lon + radius km, 0 < r ≤ 100), IoT certification, rating counters. |
| `HomeOwner` | Entity | `HomeownerId` (`ho-…`), preferred contact time, notification channels (≥ 1 required), optional emergency contact. |
| `Company` | Entity | `CompanyId` (`comp-…`), legal name, tax id, size, billing address, website. |
| `StaffMember` | Aggregate root | Maker/field staff: zone (region + centre + radius), IoT certification flag, active flag, hire date. |

## Rules and invariants

- A profile is created `Incomplete` when the user registers; it becomes `Active` only through exactly one of `complete/technician|homeowner|company`; a second completion → 409 (`ProfileAlreadyExists`/`InvalidProfileStatus`).
- Validation: DNI and tax-id format (and uniqueness → 409), phone format, date of birth (underage rejected → 400), at least one specialty, at least one notification channel.
- `Deactivated` profiles can be reactivated (`POST /profiles/me/reactivate`); suspension is a back-office state.
- `PUT /profiles/{profileId}/thresholds` stores per-device consumption thresholds (`Dictionary<string, decimal>`) and raises `ConsumptionThresholdsUpdatedEvent` consumed by Processing.
- `profileId` in routes is the `prof-…` id; the **JWT `roleSubjectId`** is the technician/homeowner/company id.

## Events

Published: `ProfileCreatedAsIncompleteEvent`, `ProfileCompletedEvent`, `ProfilePersonalDataUpdatedEvent`, `TechnicianDataUpdatedEvent`, `HomeownerDataUpdatedEvent`, `CompanyDataUpdatedEvent`, `ProfilePhotoUpdatedEvent`/`ProfilePhotoRemovedEvent`, `ProfileDeactivatedEvent`/`ProfileReactivatedEvent`/`ProfileSuspendedEvent`, `ProfileSubscriptionTierChangedEvent`, staff and IoT-certification events.
Consumed: `UserRegisteredEvent` (IAM), `SubscriptionInitializedForProfile`/`SubscriptionActivatedForProfile`/`EnterpriseSubscriptionFullyActive…`/`PaymentFailed` (Subscriptions → updates `subscriptionTier`), `ServiceCompletedEvent`, `ClientReviewSubmitted`, `TechnicianEvaluationSubmitted` (Monitoring).

## Error mapping

`DomainExceptionFilter` maps domain exceptions to `{ message }` with 400/403/404/409 (see `errors/error-contract.md`).
