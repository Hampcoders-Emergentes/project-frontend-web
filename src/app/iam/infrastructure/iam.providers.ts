import {
  type EnvironmentProviders,
  inject,
  Injectable,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import type { Observable } from 'rxjs';
import {
  SESSION_TOKEN_BRIDGE,
  type SessionTokenBridge,
} from '@shared/infrastructure/http/session-token-bridge';
import { IamStore } from '@iam/application/iam-store';
import {
  AuthenticationPort,
  RefreshLockPort,
  SessionStoragePort,
  TokenExpirationPort,
} from '@iam/application/ports/iam-ports';
import { IamApi } from '@iam/infrastructure/api/iam-api';
import {
  BrowserSessionStorage,
  JwtTokenExpiration,
  WebLocksRefreshLock,
} from '@iam/infrastructure/browser/iam-browser-adapters';

/** Exposes only the token plumbing the shared HTTP layer needs. */
@Injectable({ providedIn: 'root' })
class IamSessionTokenBridge implements SessionTokenBridge {
  private readonly store = inject(IamStore);

  accessToken(): string | null {
    return this.store.accessToken();
  }

  renewAfterRejection(rejectedToken: string | null): Observable<string> {
    return this.store.renewAfterRejection(rejectedToken);
  }

  acceptRefreshedToken(token: string): void {
    this.store.acceptRefreshedToken(token);
  }
}

/**
 * Binds the IAM ports and starts the silent session restoration at startup (non-blocking: guards wait
 * for it, and no store data loads before it resolves).
 */
export function provideIam(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AuthenticationPort, useExisting: IamApi },
    { provide: SessionStoragePort, useExisting: BrowserSessionStorage },
    { provide: TokenExpirationPort, useExisting: JwtTokenExpiration },
    { provide: RefreshLockPort, useExisting: WebLocksRefreshLock },
    { provide: SESSION_TOKEN_BRIDGE, useExisting: IamSessionTokenBridge },
    provideAppInitializer(() => inject(IamStore).restoreSession()),
  ]);
}
