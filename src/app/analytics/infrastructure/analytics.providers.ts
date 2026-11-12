import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AnalyticsPort } from '@analytics/application/ports/analytics.port';
import { AnalyticsApi } from '@analytics/infrastructure/analytics-api';

/** Binds the analytics ports (the equipment port is bound by the stores context). */
export function provideAnalytics(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: AnalyticsPort, useExisting: AnalyticsApi }]);
}
