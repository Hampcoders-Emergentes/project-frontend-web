import { computed, DOCUMENT, effect, inject } from '@angular/core';
import { IamStore } from '@iam/application/iam-store';
import type { SignedInAccount } from '@shared/presentation/components/private-layout/signed-in-account';

/** `SIGN_OUT_ACTION` of the shell: ends the session and reloads to sign-in, clearing all memory. */
export function createSignOutAction(): () => void {
  const store = inject(IamStore);
  const document = inject(DOCUMENT);
  return () => {
    store.signOut();
    // A full navigation discards every in-memory store and cache of the previous session.
    document.location.assign('/sign-in?reason=signedOut');
  };
}

/** `SIGNED_IN_ACCOUNT` of the shell. */
export function createSignedInAccount() {
  const store = inject(IamStore);
  return computed<SignedInAccount | null>(() => {
    const user = store.currentUser();
    return user === null ? null : { id: user.id, username: user.email };
  });
}

/**
 * Sends the user to sign-in when the session ends while the app is open (refresh rejected, account
 * deactivated). Uses a full navigation so no data of the ended session remains in memory. Call it once
 * from the root component.
 */
export function watchSessionEnd(): void {
  const store = inject(IamStore);
  const document = inject(DOCUMENT);
  let wasAuthenticated = false;
  effect(() => {
    const status = store.status();
    if (status === 'authenticated') {
      wasAuthenticated = true;
      return;
    }
    if (wasAuthenticated && (status === 'anonymous' || status === 'inactive') && store.endReason() !== 'signedOut') {
      wasAuthenticated = false;
      const reason = status === 'inactive' ? 'inactive' : 'expired';
      document.location.assign(`/sign-in?reason=${reason}`);
    }
  });
}
