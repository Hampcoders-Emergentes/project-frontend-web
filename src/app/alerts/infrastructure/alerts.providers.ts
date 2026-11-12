import { type EnvironmentProviders, inject, Injectable, makeEnvironmentProviders } from '@angular/core';
import { filter, map, type Observable } from 'rxjs';
import { RealtimeConnectionPort } from '@shared/application/realtime-connection.port';
import type { Alert } from '@alerts/domain/model/alert';
import { AlertsPort, AlertStreamPort } from '@alerts/application/ports/alerts.port';
import { AlertsApi } from '@alerts/infrastructure/alerts-api';
import { isAlertResponse, toAlert } from '@alerts/infrastructure/alert-assembler';

/** Maps the `ReceiveAlert` hub event (owned by the alerts context) to application alerts. */
@Injectable({ providedIn: 'root' })
export class ReceiveAlertAdapter implements AlertStreamPort {
  private readonly connection = inject(RealtimeConnectionPort);
  readonly received$: Observable<Alert> = this.connection.on('ReceiveAlert').pipe(filter(isAlertResponse), map(toAlert));
  readonly reconnected$: Observable<void> = this.connection.reconnected$;
  readonly live$: Observable<boolean> = this.connection.status$.pipe(map((status) => status === 'connected'));
}

/** Binds the alerts ports to their adapters. */
export function provideAlerts(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AlertsPort, useExisting: AlertsApi },
    { provide: AlertStreamPort, useExisting: ReceiveAlertAdapter },
  ]);
}
