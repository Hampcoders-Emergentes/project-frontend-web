# Profiles — endpoints

Business profile of the signed-in user (technician, homeowner or company), staff members, AI-assisted device onboarding.

> **Conventions for every endpoint on this page**
> - Base path `/api/v1`. Route segments are lower-case kebab-case; JSON property names are camelCase.
> - Unless the *Auth* line says *Public* or *Edge API key*, send `Authorization: Bearer <accessToken>`. A missing, invalid or expired token yields **401** and a suspended or unverified account yields **403**, both with the standard error envelope.
> - Every error (4xx/5xx) uses one RFC 7807 envelope, `application/problem+json`: `{ type, title, status, detail, instance, traceId, errors? }` (`errors` only on validation failures). See [`../../errors/error-contract.md`](../../errors/error-contract.md).
> - Enums are JSON strings (member names). Paginated lists take `?page=1&pageSize=20` (max 100) and return `PagedResponse<T>` = `{ items, page, pageSize, totalCount, totalPages, hasMore }`.
> - Payload type names (`*Request` / `*Response`) are defined in [`../../schemas/requests.ts`](../../schemas/requests.ts) and [`../../schemas/responses.ts`](../../schemas/responses.ts). JSON samples below are illustrative values with the exact property names and shapes the server uses.
> - "Owner-scoped" routes (`technicianId`, `ownerId`, `homeownerId`, `storeId`...) are checked against the caller's identity server-side; a mismatch returns **404** (`detail`: `Resource not found.`) (or **403** when the caller has no eligible profile).

## Index

| Method | URI | Summary | Auth |
|---|---|---|---|
| `POST` | `/api/v1/profiles/me/device-onboarding/analyze` | Analyze device and suggest thresholds | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/device-onboarding/adjust` | Adjust thresholds based on user feedback | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/profiles/me` | Get my profile | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/complete/technician` | Complete profile as technician | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/complete/homeowner` | Complete profile as homeowner | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/complete/company` | Complete profile as company | Bearer JWT (global request authorization) |
| `GET` | `/api/v1/profiles/me/status` | Get profile status | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/profiles/me/personal-data` | Update personal data | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/picture` | Upload profile picture | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/profiles/me/technician` | Update technician data | Bearer JWT (global request authorization) |
| `PATCH` | `/api/v1/profiles/me/homeowner` | Update homeowner preferences | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/deactivate` | Deactivate profile | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/reactivate` | Reactivate profile | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/profiles/me/photo/upload-url` | Get signed upload URL for profile photo | Bearer JWT (global request authorization) |
| `PUT` | `/api/v1/profiles/me/photo` | Update profile photo after direct upload | Bearer JWT (global request authorization) |
| `PUT` | `/api/v1/profiles/{profileId}/thresholds` | Set consumption thresholds | Bearer JWT (global request authorization) |
| `DELETE` | `/api/v1/profiles/me/photo` | Remove profile photo | Bearer JWT (global request authorization) |
| `POST` | `/api/v1/staff-members` | Create a staff member profile | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `GET` | `/api/v1/staff-members/{id}` | Get staff member by id (staff members) | Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager` |
| `GET` | `/api/v1/staff-members` | Get all staff members (staff members) | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `PUT` | `/api/v1/staff-members/{id}/zone` | Assign zone (staff members zone) | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `PUT` | `/api/v1/staff-members/{id}/iot-certification` | Grant IoT certification (staff members iot certification) | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `DELETE` | `/api/v1/staff-members/{id}/iot-certification` | Revoke IoT certification (staff members iot certification) | Bearer JWT · access role `Admin`, `SuperAdmin` |
| `PUT` | `/api/v1/staff-members/{id}/deactivate` | Deactivate staff member (staff members deactivate) | Bearer JWT · access role `Admin`, `SuperAdmin` |

## `POST /api/v1/profiles/me/device-onboarding/analyze`

**Analyze device and suggest thresholds**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `DeviceOnboardingController.Analyze`

**Request body** — `AnalyzeDeviceOnboardingRequest` (`application/json`)

```json
{
  "deviceType": "Refrigerator",
  "nominalVoltage": 220.4,
  "dailyUsageHours": 1.5,
  "occupants": 15,
  "locationType": "Kitchen",
  "primaryUse": "Food cold storage"
}
```

**Success response** — `200` · `DeviceOnboardingAnalysisResponse`

```json
{
  "reasoning": "string",
  "narrative": "string",
  "suggestedThresholds": {
    "nominalVoltage": 220.4,
    "maxConsumptionWatts": 1.5,
    "maxCurrentAmps": 6.8,
    "minPowerFactor": 0.93,
    "nominalFrequency": 60.0,
    "disconnectionThresholdMin": 15,
    "normalLimitAmps": 6.8,
    "alertLimitAmps": 6.8
  },
  "analysisId": "analysis-0001"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `503` Dependency unavailable or not configured

## `POST /api/v1/profiles/me/device-onboarding/adjust`

**Adjust thresholds based on user feedback**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `DeviceOnboardingController.Adjust`

**Request body** — `AdjustThresholdsRequest` (`application/json`)

```json
{
  "analysisId": "analysis-0001",
  "userMessage": "The fridge is used 24h and has a compressor"
}
```

**Success response** — `200` · `DeviceOnboardingAnalysisResponse`

```json
{
  "reasoning": "string",
  "narrative": "string",
  "suggestedThresholds": {
    "nominalVoltage": 220.4,
    "maxConsumptionWatts": 1.5,
    "maxCurrentAmps": 6.8,
    "minPowerFactor": 0.93,
    "nominalFrequency": 60.0,
    "disconnectionThresholdMin": 15,
    "normalLimitAmps": 6.8,
    "alertLimitAmps": 6.8
  },
  "analysisId": "analysis-0001"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/profiles/me`

**Get my profile**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.GetMyProfile`

**Success response** — `200` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/profiles/me/complete/technician`

**Complete profile as technician**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.CompleteAsTechnician`

**Request body** — `CompleteProfileAsTechnicianRequest` (`application/json`)

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "number": "1234",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "specialties": [],
  "experienceYears": 15,
  "aboutMe": "string",
  "centerLatitude": -12.1211,
  "centerLongitude": -77.0297,
  "radiusKm": 1.5
}
```

**Success response** — `201` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `POST /api/v1/profiles/me/complete/homeowner`

**Complete profile as homeowner**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.CompleteAsHomeowner`

**Request body** — `CompleteProfileAsHomeownerRequest` (`application/json`)

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "number": "1234",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "preferredContactTime": "Morning",
  "smsNotifications": true,
  "emailNotifications": true,
  "pushNotifications": true,
  "emergencyContact": {
    "name": "Main kitchen",
    "relationship": "string",
    "phoneNumber": "+51987654321"
  }
}
```

**Success response** — `201` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `POST /api/v1/profiles/me/complete/company`

**Complete profile as company**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.CompleteAsCompany`

**Request body** — `CompleteProfileAsCompanyRequest` (`application/json`)

```json
{
  "companyName": "Acme Foods SAC",
  "taxId": "20123456789",
  "billingStreet": "string",
  "billingNumber": "string",
  "billingDistrict": "string",
  "billingCity": "string",
  "billingCountry": "string",
  "billingPostalCode": "string",
  "industry": "string",
  "companySize": "Medium",
  "website": "string",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "number": "1234",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074"
}
```

**Success response** — `201` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `201` Created
- `401` Missing, invalid or expired credentials

## `GET /api/v1/profiles/me/status`

**Get profile status**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.GetProfileStatus`

**Success response** — `200` · `ProfileStatusResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "completionPercentage": 82
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/profiles/me/personal-data`

**Update personal data**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.UpdatePersonalData`

**Request body** — `UpdatePersonalDataRequest` (`application/json`)

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "street": "Av. Arequipa",
  "number": "1234",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074"
}
```

**Success response** — `200` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/profiles/me/picture`

**Upload profile picture**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.UploadProfilePicture`

**Request body** — `multipart/form-data` with a single file field named `file`.

**Success response** — `200` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/profiles/me/technician`

**Update technician data**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.UpdateTechnicianData`

**Request body** — `UpdateTechnicianDataRequest` (`application/json`)

```json
{
  "specialties": [],
  "experienceYears": 15,
  "aboutMe": "string"
}
```

**Success response** — `200` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PATCH /api/v1/profiles/me/homeowner`

**Update homeowner preferences**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.UpdateHomeownerPreferences`

**Request body** — `UpdateHomeownerPreferencesRequest` (`application/json`)

```json
{
  "smsNotifications": true,
  "emailNotifications": true,
  "pushNotifications": true,
  "preferredContactTime": "Morning",
  "emergencyContact": {
    "name": "Main kitchen",
    "relationship": "string",
    "phoneNumber": "+51987654321"
  }
}
```

**Success response** — `200` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/profiles/me/deactivate`

**Deactivate profile**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.DeactivateProfile`

**Request body** — `DeactivateProfileRequest` (`application/json`)

```json
{
  "reason": "Customer request",
  "notes": "Free text notes"
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/profiles/me/reactivate`

**Reactivate profile**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.ReactivateProfile`

**Success response** — `200` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/profiles/me/photo/upload-url`

**Get signed upload URL for profile photo**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.GetProfilePhotoUploadUrl`

**Success response** — `200` · `SignedUploadUrlResponse`

```json
{
  "url": "https://api.cloudinary.com/v1_1/demo/image/upload",
  "signature": "a1b2c3...",
  "timestamp": 15
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PUT /api/v1/profiles/me/photo`

**Update profile photo after direct upload**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.UpdateProfilePhoto`

**Request body** — `UpdateProfilePhotoRequest` (`application/json`)

```json
{
  "providerId": "electrolink/sample",
  "publicUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
  "format": "csv",
  "sizeBytes": 15
}
```

**Success response** — `200` · `MyProfileResponse`

```json
{
  "profileId": "prof-1a2b3c4d",
  "userId": "us-7f3c9e12",
  "status": "Active",
  "businessRole": "string",
  "profilePictureUrl": "https://example.com/profilePictureUrl",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "dni": "45678912",
  "dateOfBirth": "1990-05-17",
  "street": "Av. Arequipa",
  "district": "Miraflores",
  "city": "Lima",
  "country": "PE",
  "postalCode": "15074",
  "technician": {
    "technicianId": "tech-8a9b0c1d",
    "specialties": [
      "string"
    ],
    "experienceYears": 15,
    "aboutMe": "string",
    "centerLatitude": -12.1211,
    "centerLongitude": -77.0297,
    "radiusKm": 1.5
  },
  "homeowner": {
    "homeownerId": "home-2b3c4d5e",
    "preferredContactTime": "string",
    "smsNotifications": true,
    "emailNotifications": true,
    "pushNotifications": true,
    "emergencyContactName": "string",
    "emergencyContactRelationship": "string",
    "emergencyContactPhone": "string"
  },
  "company": {
    "companyId": "company-0001",
    "companyName": "Acme Foods SAC",
    "taxId": "20123456789",
    "industry": "string",
    "companySize": "string",
    "website": "string",
    "billingStreet": "string",
    "billingNumber": "string",
    "billingDistrict": "string",
    "billingCity": "string",
    "billingCountry": "string",
    "billingPostalCode": "string"
  }
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `PUT /api/v1/profiles/{profileId}/thresholds`

**Set consumption thresholds**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.SetThresholds`

**Path parameters**

| Name | Type |
|---|---|
| `profileId` | `string` |

**Request body** — `SetThresholdsRequest` (`application/json`)

```json
{
  "thresholds": {
    "maxConsumption": 1200
  }
}
```

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `DELETE /api/v1/profiles/me/photo`

**Remove profile photo**

- **Auth:** Bearer JWT (global request authorization)
- **Source:** `ProfilesController.RemoveProfilePhoto`

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `POST /api/v1/staff-members`

**Create a staff member profile**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `StaffMembersController.CreateStaffMember`
- **Idempotency:** optional `Idempotency-Key` header.
- **Location:** `/api/v1/staff-members/{id}`

**Request body** — `CreateStaffMemberRequest` (`application/json`)

```json
{
  "userId": "us-7f3c9e12",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321"
}
```

**Success response** — `201` · `StaffMemberResponse`

```json
{
  "id": "staff-3a4b5c6d",
  "userId": "us-7f3c9e12",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "isIoTCertified": false,
  "assignedZone": "Lima",
  "isActive": true,
  "hireDate": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `201` Created
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `403` Access role is not Admin/SuperAdmin
- `409` A staff profile already exists for this user

## `GET /api/v1/staff-members/{id}`

**Get staff member by id (staff members)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`, `FieldManager`
- **Source:** `StaffMembersController.GetStaffMemberById`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Success response** — `200` · `StaffMemberResponse`

```json
{
  "id": "id-3a4b5c6d",
  "userId": "us-7f3c9e12",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "isIoTCertified": true,
  "assignedZone": "string",
  "isActive": true,
  "hireDate": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials
- `404` Resource not found (also returned when the resource belongs to another owner)

## `GET /api/v1/staff-members`

**Get all staff members (staff members)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `StaffMembersController.GetAllStaffMembers`

**Query parameters**

| Name | Type | Default |
|---|---|---|
| `page` | `int` | `1` |
| `pageSize` | `int` | `20` (1-100) |

**Success response** — `200` · `PagedResponse<StaffMemberResponse>`

```json
{
  "items": [
    {
      "id": "id-3a4b5c6d",
      "userId": "us-7f3c9e12",
      "firstName": "Jane",
      "lastName": "Doe",
      "phoneNumber": "+51987654321",
      "isIoTCertified": true,
      "assignedZone": "string",
      "isActive": true,
      "hireDate": "2026-03-14T15:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1,
  "hasMore": false
}
```

**Status codes**

- `200` OK
- `401` Missing, invalid or expired credentials

## `PUT /api/v1/staff-members/{id}/zone`

**Assign zone (staff members zone)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `StaffMembersController.AssignZone`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Request body** — `AssignStaffZoneRequest` (`application/json`)

```json
{
  "region": "Lima",
  "centerLatitude": -12.1211,
  "centerLongitude": -77.0297,
  "radiusKm": 1.5
}
```

**Success response** — `200` · `StaffMemberResponse` (the updated staff member)

```json
{
  "id": "staff-3a4b5c6d",
  "userId": "us-7f3c9e12",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "isIoTCertified": false,
  "assignedZone": "Lima",
  "isActive": true,
  "hireDate": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Staff member not found

## `PUT /api/v1/staff-members/{id}/iot-certification`

**Grant IoT certification (staff members iot certification)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `StaffMembersController.GrantIoTCertification`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Success response** — `200` · `StaffMemberResponse` (the updated staff member)

```json
{
  "id": "staff-3a4b5c6d",
  "userId": "us-7f3c9e12",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "isIoTCertified": false,
  "assignedZone": "Lima",
  "isActive": true,
  "hireDate": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Staff member not found

## `DELETE /api/v1/staff-members/{id}/iot-certification`

**Revoke IoT certification (staff members iot certification)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `StaffMembersController.RevokeIoTCertification`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Success response** — `204` No content (empty body)

**Status codes**

- `204` No content
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials

## `PUT /api/v1/staff-members/{id}/deactivate`

**Deactivate staff member (staff members deactivate)**

- **Auth:** Bearer JWT · access role `Admin`, `SuperAdmin`
- **Source:** `StaffMembersController.DeactivateStaffMember`

**Path parameters**

| Name | Type |
|---|---|
| `id` | `string` |

**Success response** — `200` · `StaffMemberResponse` (the updated staff member)

```json
{
  "id": "staff-3a4b5c6d",
  "userId": "us-7f3c9e12",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+51987654321",
  "isIoTCertified": false,
  "assignedZone": "Lima",
  "isActive": true,
  "hireDate": "2026-03-14T15:30:00Z"
}
```

**Status codes**

- `200` OK
- `400` Bad request: validation/model-binding or domain rule violated
- `401` Missing, invalid or expired credentials
- `404` Staff member not found
