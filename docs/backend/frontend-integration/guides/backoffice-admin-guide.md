# Back-office console — integration guide

Personas: IAM users with `AccessRole` `Admin`, `SuperAdmin`, `FieldManager` (and `Maker` as field staff). Role gates are enforced by attributes (403 with the standard error envelope otherwise, `detail`: `Your access role does not allow this action.`). Admin/SuperAdmin can read any account with `GET /users/{id}` and list demo leads with `GET /contact-requests`. Decode `access_role` from the JWT only to hide menu items.

## Capability map

| Screen | Roles | Calls |
|---|---|---|
| Create staff login | Admin, SuperAdmin | `POST /staff-users {email,password,passwordConfirmation,accessRole: Maker|Admin|FieldManager,firstName,lastName,phoneNumber?}` → `201 StaffUserResponse` |
| Staff profiles | Admin, SuperAdmin (list/create/zone/cert/deactivate), +FieldManager (read one) | `POST /staff-members {userId,firstName,lastName,phoneNumber?}`, `GET /staff-members`, `GET /staff-members/{id}`, `PUT …/{id}/zone {region,centerLatitude,centerLongitude,radiusKm}`, `PUT`/`DELETE …/{id}/iot-certification`, `PUT …/{id}/deactivate` (all return `{message}` except the GETs) |
| User directory | Admin, SuperAdmin | `GET /users?page&pageSize` (no per-user read of others: `GET /users/{id}` is self-only) |
| Matching queue | Admin, SuperAdmin, FieldManager | `GET /service-assignments/queue?page&pageSize` → priority queue + normal queue |
| Run matching manually | same | `POST /service-assignments/execute {requestId}` → `200`/`422 MatchingResultResponse` (normally automatic) |
| Matching audit | **Admin only** (`Authorize(Roles="Admin")`; SuperAdmin is *not* accepted) | `GET /service-assignments/{assignmentId}/matching-details` → score, method, reasoning |
| Manual dispatch | Admin, SuperAdmin, FieldManager | `POST /dispatch/assign-staff {requestId, staffMemberId}` |
| Create service execution | Admin, SuperAdmin, FieldManager | `POST /service-executions {assignmentId,requestId,technicianId,ownerId,propertyId,recipeSnapshot{…},scheduledDateTime,isPriority}` → `201` (409 duplicate) |

## Things a console must not assume

- Admin roles **do not** grant access to other users' stores, alerts, analytics or audit logs (ownership by creator) — store pages return 404.
- Roles are about *staff capabilities*; homeowner/technician/company data is reached through ownership checks, so even Admin cannot call technician-only routes unless they own a matching profile.
- `Maker` currently has no dedicated endpoint beyond staff-profile assignment. `AccessPolicies.AddAccessPolicies` (policies `AdminOnly`, `MakerForAssignedService`, …) is defined but never called, and the `PremiumOnly`/`EnterpriseOnly` policies registered in `Program.cs` are not referenced by any route in this version — authorization today is the IAM middleware plus `[RequireAccessRole]`/ownership checks.

## Operations endpoints

`GET /health` (includes MQTT), `GET /openapi/v1.json`, `GET /scalar/v1`.
