# Edge API (gateway/panel ingestion) — machine endpoints

For edge firmware/panels. Browsers must not call these (they require the secret `X-Api-Key`). Included so frontend engineers understand the data they display.

| Route | Purpose |
|---|---|
| `POST /api/v1/iot/edge/readings` | One sensor reading. `204` stored (idempotent: identical re-send → 204), `409` same `(binding, readingId)` with different values or reading rejected, `403` device not allow-listed/unauthorised, `404` unknown device. |
| `POST /api/v1/iot/edge/sync-batch` | Readings buffered during a connection loss, 1–1000 items + optional `panelId`; answers `OfflineSyncResponse`. Use `source: "EdgeBufferReplay"` for replayed readings. |
| `POST /api/v1/iot/edge/anomalies` | Edge-detected anomaly (`deviceId`, `anomalyType`, `triggerReadingId`, `edgeAlertPayloadJson`). |
| `POST /api/v1/iot/edge/relay/acknowledge` | Relay execution result (`commandId`, `deviceId`, `executedSuccessfully`, `executedAt`). |
| `GET /api/v1/iot/edge/devices/{deviceId}/thresholds` | Thresholds the device should apply (JSON names `normalLimit`, `alertLimit`, `nominalVoltage`, `maxConsumptionWatts`, `maxCurrentAmps`, `minPowerFactor`, `nominalFrequency`, `disconnectionThresholdMin`). |
| `POST /api/v1/alerts/dispatch` | Ask the backend to publish/queue an existing alert. |
| `GET /api/v1/iot/devices/{deviceId}/relay/history` | Also readable with the Edge key (device allow-listed in `EdgeApi:RelayHistory:AllowedDeviceIds`). |

Rules: header `X-Api-Key` must equal `EdgeApi:ApiKey` (server `500` if the key is not configured); readings for equipment-bound devices require the device in `EdgeApi:EquipmentReadings:AllowedDeviceIds`; timestamps are UTC (`timestampBasis` in measurements tells whether device time or server receive time was used); a panel that loses connectivity should buffer readings and replay them with `sync-batch`. `StoreResponse.lastEdgeSyncAtUtc` and `GET …/sensors/connectivity` expose the last sync to the UI.

Frontend consequence: measurements and alerts are eventually consistent with device connectivity. Show `capturedAtUtc` (device time) and treat `STALE`/`DISCONNECTED` states as "no fresh data" instead of "zero".
