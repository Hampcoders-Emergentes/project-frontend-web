import type { StatusAppearance } from '@shared/presentation/components/status-tag/status-tag';
import type { GridStatus, OperationalState, RiskLevel, TelemetryState } from '@monitoring/domain/model/monitoring';

/** Risk colors are always paired with an icon and a text label. */
export const RISK_APPEARANCE: Readonly<Record<RiskLevel, StatusAppearance>> = {
  SAFE: { tone: 'success', icon: 'circle-check' },
  WARNING: { tone: 'warning', icon: 'alert-triangle' },
  CRITICAL_RISK: { tone: 'critical', icon: 'alert-octagon' },
  DISCONNECTED: { tone: 'neutral', icon: 'wifi-off' },
  UNKNOWN: { tone: 'neutral', icon: 'info-circle' },
};

export const GRID_APPEARANCE: Readonly<Record<GridStatus, StatusAppearance>> = {
  NORMAL: { tone: 'success', icon: 'circle-check' },
  WARNING: { tone: 'warning', icon: 'alert-triangle' },
  CRITICAL: { tone: 'critical', icon: 'alert-octagon' },
  NO_DATA: { tone: 'neutral', icon: 'wifi-off' },
};

export const STATE_APPEARANCE: Readonly<Record<OperationalState | TelemetryState, StatusAppearance>> = {
  NORMAL: { tone: 'success', icon: 'circle-check' },
  ANOMALY: { tone: 'critical', icon: 'alert-octagon' },
  STALE: { tone: 'warning', icon: 'clock' },
  UNKNOWN: { tone: 'neutral', icon: 'info-circle' },
  UNMONITORED: { tone: 'neutral', icon: 'wifi-off' },
  DEVICE_UNVERIFIED: { tone: 'warning', icon: 'lock' },
};
