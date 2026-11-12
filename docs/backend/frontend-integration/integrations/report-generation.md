# Report generation (CSV / PDF)

Reports are generated **in-process** by the monolith (there is no separate reporting microservice, contrary to the wording of TS04) using `SimplePdfDocument` (PDF) and `CsvConsumptionReportExporter` (CSV).

| Report | Create | List | Download |
|---|---|---|---|
| Energy consumption (CSV, on the fly) | — | — | `GET /api/v1/stores/{storeId}/analytics/consumption/report?from&to&granularity&format=csv` (streams the file) |
| Energy efficiency report (stored, expiring) | `POST /api/v1/stores/{storeId}/analytics/reports` `{ from, to, format: "csv"\|"pdf" }` → `EnergyReportResponse` with `downloadUrl`, `expiresAtUtc` | — | `GET …/analytics/reports/{reportId}/download` |
| OHS / safety compliance report (PDF) | `POST /api/v1/stores/{storeId}/compliance/reports/generate` `{ from?, to? }` → `OhsReportResponse` (`complianceScore`, `isSigned`, `downloadUrl`) | `GET …/compliance/reports` | `GET …/compliance/reports/{reportId}/download` (`application/pdf`) |
| Signature image | `POST …/compliance/signature` (PNG as base64) | `GET …/compliance/signature` (metadata, SHA-256) | `GET …/compliance/signature/image` (`image/png`) |

Downloading from the SPA: the endpoints require the Bearer header, so use `fetch` with the token and create a `Blob` URL — a plain `<a href>` answers 401.

```ts
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
if (!res.ok) throw await toApiError(res);
const blob = await res.blob();
const name = /filename="?([^";]+)"?/i.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'report';
```

Energy reports expire (`expiresAtUtc`); regenerate when `download` returns 404. `POST …/analytics/reports` accepts `format` `csv` or `pdf`; the streaming `…/consumption/report` export accepts only `csv`. Report downloads are audit-logged.
