import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MonitoringPort } from '@monitoring/application/ports/monitoring.port';
import { MonitoringApi } from '@monitoring/infrastructure/monitoring-api';

/** Binds the monitoring ports to their adapters. */
export function provideMonitoring(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: MonitoringPort, useExisting: MonitoringApi }]);
}
