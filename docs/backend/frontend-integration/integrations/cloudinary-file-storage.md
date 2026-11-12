# File storage (Cloudinary) — photos and signatures

`IFileStorageProvider` is selected by `ExternalProviders:FileStorage` = `cloudinary` | `disabled`. `disabled` uses `NullFileStorageProvider`, which fabricates URLs (`https://null-storage.local/<providerId>?w=…`) and signatures — uploads will not actually work.

Configuration: `Cloudinary:CloudName`, `Cloudinary:ApiKey`, `Cloudinary:ApiSecret`.

## Preferred pattern: signed direct upload (browser → Cloudinary)

1. Ask the API for upload parameters:
   - Property photos: `GET /api/v1/{homeowners|companies}/{ownerId}/properties/{propertyId}/photos/upload-url` → `PropertyPhotoUploadUrlResponse { url, signature, timestamp, apiKey }`
   - Service work photos: `POST /api/v1/service-executions/{executionId}/actions/photos/upload-url?type=Before|During|After` → `WorkPhotoUploadUrlResponse { url, signature, timestamp, apiKey }`
   - Profile photo: `POST /api/v1/profiles/me/photo/upload-url` → `SignedUploadUrlResponse { url, signature, timestamp }`
2. `POST` a multipart form to `url` (`https://api.cloudinary.com/v1_1/<cloud>/auto/upload`) with `file`, `api_key`, `timestamp`, `signature` **plus every other parameter the server signed, with identical values**. The server signs exactly: `timestamp`, `folder`, `allowed_formats` (`jpg,jpeg,png,webp`) and `max_bytes`. Cloudinary replies with `public_id` and `secure_url`.

   | Upload | `folder` signed by the server | `max_bytes` |
   |---|---|---|
   | Profile photo | `electrolink/profiles/{userId}/avatar` | 5 242 880 (5 MB) |
   | Property photo | `electrolink/assets/properties/{propertyId}/{yyyyMMddHHmmss}` (server UTC time at signing) | 10 485 760 (10 MB) |
   | Work photo | `electrolink/operation/{executionId}/{photoType}/{yyyyMMddHHmmss}` (server UTC time at signing) | 10 485 760 (10 MB) |

   > **Limitation:** the API response (`url`, `signature`, `timestamp`, `apiKey`) does **not** echo `folder`, `allowed_formats` or `max_bytes`. For profile photos they are deterministic, so a direct upload works. For property and work photos the folder contains a server-generated timestamp the client cannot know, so a browser cannot rebuild a matching signed request until the backend returns the signed parameters (see `diagnostics/KNOWN_LIMITATIONS.md`). Until then, coordinate with the backend team before building those two upload screens.
3. Register the uploaded asset with the API:
   - `POST …/properties/{propertyId}/photos` `{ providerId: <public_id>, publicUrl: <secure_url> }`, then optionally `POST …/main-photo` `{ providerId }`
   - `POST …/actions/photos` `RegisterWorkPhotoRequest { providerId, publicUrl, thumbnailUrl?, photoType, format, sizeBytes, takenAt, notes? }`
   - `PUT /api/v1/profiles/me/photo` `{ providerId, publicUrl, format, sizeBytes }`

Server-side guard: a provider id can only be registered/deleted inside the **owner's folder** (`electrolink/profiles/{userId}/avatar` for profile photos; equivalent per-resource folders for the others). Ids containing `..` or `\` are rejected.

## Alternative: through the API

`POST /api/v1/profiles/me/picture` (`multipart/form-data`, field `file`) uploads via the backend and returns `MyProfileResponse`.

## Housekeeping

Replaced/removed images are queued in an orphan table and deleted by `CleanupOrphanedFilesJob`; clients never call a delete endpoint (`DELETE /profiles/me/photo` removes the reference). Service executions enforce a maximum number of work photos (total and per type); exceeding it is a 400.
