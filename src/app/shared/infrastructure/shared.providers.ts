import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { FileSaverPort } from '@shared/application/file-saver.port';
import { IdempotencyKeyPort } from '@shared/application/idempotency-key.port';
import { PageVisibilityPort } from '@shared/application/polling';
import { RealtimeConnectionPort } from '@shared/application/realtime-connection.port';
import {
  BrowserFileSaver,
  CryptoIdempotencyKey,
  DocumentPageVisibility,
} from '@shared/infrastructure/browser/browser-adapters';
import { SignalRRealtimeConnection } from '@shared/infrastructure/realtime/signalr-realtime-connection';

/** Binds the context-agnostic application ports to their browser/infrastructure adapters. */
export function provideSharedInfrastructure(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: PageVisibilityPort, useExisting: DocumentPageVisibility },
    { provide: IdempotencyKeyPort, useExisting: CryptoIdempotencyKey },
    { provide: FileSaverPort, useExisting: BrowserFileSaver },
    { provide: RealtimeConnectionPort, useExisting: SignalRRealtimeConnection },
  ]);
}
