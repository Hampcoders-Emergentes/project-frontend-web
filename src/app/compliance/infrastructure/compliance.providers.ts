import { type EnvironmentProviders, inject, Injectable, makeEnvironmentProviders } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { RealtimeConnectionPort } from '@shared/application/realtime-connection.port';
import { ComplianceNoticePort, CompliancePort } from '@compliance/application/ports/compliance.port';
import { ComplianceApi } from '@compliance/infrastructure/compliance-api';

/** Maps the `ComplianceNotice` hub event (owned by compliance); consumers reload expirations. */
@Injectable({ providedIn: 'root' })
export class ComplianceNoticeAdapter implements ComplianceNoticePort {
  readonly notices$: Observable<void> = inject(RealtimeConnectionPort).on('ComplianceNotice').pipe(map(() => undefined));
}

/** Binds the compliance ports (the equipment port is bound by the stores context). */
export function provideCompliance(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CompliancePort, useExisting: ComplianceApi },
    { provide: ComplianceNoticePort, useExisting: ComplianceNoticeAdapter },
  ]);
}
