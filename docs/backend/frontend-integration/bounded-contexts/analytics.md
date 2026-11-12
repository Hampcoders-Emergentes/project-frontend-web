# Analytics

**Endpoints:** [`../api/analytics/endpoints.md`](../api/analytics/endpoints.md)

## Responsibilities

Turns store telemetry into **energy insight**: consumption per store/equipment (hourly/daily), cost with a tariff (peak/off-peak, time zone), end-of-month cost projection, period comparison, off-hours (standby) consumption, monthly energy budgets, wear-based maintenance predictions, downloadable reports — plus **technician performance metrics** for the marketplace.

## Model

| Element | Kind | Notes |
|---|---|---|
| `EnergyPlanning` | Aggregate | Per-store opening hours (7 days, `HH:mm`) and monthly budgets (`targetKWh`, `alertThresholdPercentage`). |
| `EnergyReport` | Aggregate | Generated report metadata + stored file (expiring). |
| `TechnicianMetrics` | Aggregate | Period metrics: completed services, IoT services, average rating, revenue, average response time, client retention. |
| Value objects | — | `DateRange`, `Money`, `PowerSample`, `UtilityRateSchedule`, `SavingsMetrics`, `StoreEnergyMetric`. |
| Domain services | — | `EnergyIntegrator` (kW samples → kWh), `EnergyCostCalculator`, `CostForecaster` (linear and moving-average projections), `MaintenancePredictor` (power-factor trend, fluctuation index), `EnergyPlanningPolicies`. |

## Rules and invariants

- Tariff comes from configuration (`Analytics:UtilityRate`: currency `PEN`, base rate per kWh `0.80`, time zone `America/Lima`, peak 18–23h, peak/off-peak factors) — not from the client.
- All time ranges: ISO 8601 with explicit offset, `[from,to)`, max **31 days**; granularity `hourly`|`daily`.
- Percent changes are `(period2 − period1) / period1` and are `null` when period 1 is zero.
- Budget `year` 2000–2100, `month` 1–12, `alertThresholdPercentage` 1–100 (default 80); `budget-status` defaults to the current month.
- Maintenance predictions need enough running samples; equipment without enough data is listed in `insufficientDataEquipmentIds`.
- Only the store owner can read store analytics (404 otherwise). Technician-metrics routes are plain JWT routes (no ownership check in the controller).

## Events

Consumed: `ServiceCompletedEvent`, `TechnicianEvaluationSubmitted` (update technician metrics). Published: `TechnicianMetricsUpdated`, `MonthlyMetricsSnapshotCreated`.

## Cross-context dependencies

Reads store power/electrical samples through `IStoreMeasurementFacade` (StoreManagement). No direct DB sharing.
