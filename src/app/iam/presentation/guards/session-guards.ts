import { inject } from '@angular/core';
import { type CanActivateFn, type CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { IamStore } from '@iam/application/iam-store';

/**
 * Matches the private area only after session restoration resolves and only for an authenticated,
 * `Active` account; otherwise redirects to sign-in (with the reason when access is denied). Private
 * chunks are not even loaded without a session, and no store data loads before this decision.
 */
export const authenticatedGuard: CanMatchFn = (_route, segments) => {
  const store = inject(IamStore);
  const router = inject(Router);
  const returnUrl = `/${segments.map((segment) => segment.path).join('/')}`;
  return store.whenSessionResolved().pipe(
    map((status) => {
      if (status === 'authenticated') {
        return true;
      }
      const queryParams: Record<string, string> = {};
      if (status === 'inactive') {
        queryParams['reason'] = 'inactive';
      } else if (status === 'unreachable') {
        queryParams['reason'] = 'unreachable';
      } else if (returnUrl !== '/' && returnUrl.startsWith('/stores')) {
        queryParams['returnUrl'] = returnUrl;
      }
      return router.createUrlTree(['/sign-in'], { queryParams });
    }),
  );
};

/** Keeps signed-in users away from sign-in and password recovery: they go to their stores. */
export const anonymousOnlyGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);
  return store
    .whenSessionResolved()
    .pipe(map((status) => (status === 'authenticated' ? router.parseUrl('/stores') : true)));
};
