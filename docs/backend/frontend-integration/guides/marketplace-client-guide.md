# Homeowner / company client app — integration guide

Persona: a **homeowner** (`businessRole: HomeOwner`) or **company** (`Company`) requesting electrical services, registering IoT devices on their properties and managing a subscription. (The backlog does not cover this line; this guide derives from the controllers.)

## 1. Onboarding

1. `POST /auth/sign-up` → tokens.
2. `GET /profiles/me/status` → `completionPercentage`; `GET /profiles/me` (404 while no profile record is visible).
3. Complete the profile once: `POST /profiles/me/complete/homeowner` (name, phone, DNI, birth date ≥ 18 y, address, `preferredContactTime` `Morning|Afternoon|Evening`, at least one of `smsNotifications|emailNotifications|pushNotifications`, optional `emergencyContact`) **or** `…/company` (`companyName`, `taxId`, billing address, `companySize` `Small|Medium|Large`, …).
4. Store the access token returned in the `X-Refreshed-Token` header of the completion response (`POST /auth/refresh-claims` is no longer required).
5. Optional: profile picture (`/profiles/me/photo/upload-url` → upload → `PUT /profiles/me/photo`), preferences `PATCH /profiles/me/homeowner`, personal data `PATCH /profiles/me/personal-data`, deactivate/reactivate.

The client id used in owner routes is `roleSubjectId` (`ho-…`/`comp-…`) from the JWT; use `homeowners/{ownerId}` for homeowners and `companies/{ownerId}` for companies.

## 2. Properties and portfolio

| Screen | Call |
|---|---|
| Property list | `GET /homeowners|companies/{ownerId}/properties?city&district&region&street&page&pageSize` (bare array) |
| Create property | `POST …/properties` `{ address{street,number,district,city,country,postalCode}, geolocation{latitude,longitude,accuracy?,source}, propertyType: Residential|Commercial|Building }` → 201 |
| Edit location | `PATCH …/properties/{propertyId}/location`; activate/deactivate `PATCH …/activate|deactivate`; archive `DELETE …/properties/{propertyId}?reason=` |
| Photos | `GET …/photos/upload-url` → direct upload (see `integrations/cloudinary-file-storage.md`, limitation) → `POST …/photos {providerId,publicUrl}` → `POST …/main-photo {providerId}` |
| Portfolio | `GET …/property-portfolios`; `POST …/property-portfolios/properties {propertyId,nickname,isPrimary,occupancyStatus}`; `DELETE …/properties/{propertyId}?reason=` |

## 3. Request a service (wizard)

1. `GET /service-requests/eligibility` → if `canCreate=false` show `reason` and the upgrade path.
2. `POST /service-requests` → `{ requestId }`.
3. `POST /service-requests/{id}/property {propertyId}`.
4. `GET /service-requests/{id}/available-services` → categories with min/max price, duration, technicians available.
5. `POST /service-requests/{id}/recipe {serviceCategory}`.
6. `POST /service-requests/{id}/details {problemDescription, consumptionKwh, amountPaid, amountCurrency, billingPeriod, receiptNumber, isPriority, preferredDates[], timePreference}`.
7. `POST /service-requests/{id}/confirm` → `202` + summary (`PendingAssignment`). Then poll `GET /service-requests/{id}` until `Assigned`.
8. Cancel: `DELETE /service-requests/{id} {reason, notes?}` (409 once assigned).

Proactive suggestions after sensor anomalies: `GET /suggestions` → `PATCH …/viewed`, `POST …/accept` (returns `{requestId}` and continues at step 3) or `POST …/dismiss`.

## 4. Follow the service

`GET /service-executions/homeowners/{homeownerId}/active` (404 when none) and `…/history`; details `GET /service-executions/{id}` and `…/work-log` (photos, report, components); extend technician wait `POST …/actions/extend-wait {extendMinutes}`; cancel `POST …/actions/cancel {cancelledBy:"Homeowner", reason, notes?, requestReassignment}`; review `POST …/actions/reviews/client {rating, comment?, categories{Professionalism..ValueForMoney}}`.

## 5. IoT devices and live data

`GET /iot-devices/by-property/{propertyId}`, `GET /iot/devices/{deviceId}/status`, `…/readings/recent?windowMinutes=60`, `GET /iot/devices/properties/{propertyId}/anomalies`, acknowledge `POST /iot/devices/anomalies/{id}/acknowledge`. Remember `status`/`connectionStatus` are **numbers** in device payloads.

## 6. Subscription

`GET /subscriptions/me`, `/me/eligibility`, `/me/payment-history`, `/me/status-alert` (204 = nothing), checkout/portal/cancel as in `integrations/stripe.md`. Enterprise plans (`ENTERPRISE_*`) stay `PENDING_INSTALLATION` until devices are installed.
