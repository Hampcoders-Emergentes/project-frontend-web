import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { toAppError } from '@shared/application/app-error';
import { StoreDirectoryStore } from '@stores/application/store-directory.store';

/**
 * Verifies ownership of the `:storeId` route parameter before any store-scoped view loads data. A `404`
 * (missing or not owned) or `403` returns to the store list without revealing which; the verified store
 * becomes the active store (realtime membership moves with it).
 */
export const storeAccessGuard: CanActivateFn = (route) => {
  const directory = inject(StoreDirectoryStore);
  const router = inject(Router);
  const storeId = route.paramMap.get('storeId');
  if (storeId === null || storeId === '') {
    return router.parseUrl('/stores');
  }
  if (directory.activeStore()?.id === storeId) {
    return true;
  }
  return directory.verifyAccess(storeId).pipe(
    map((store) => {
      directory.activate(store);
      return true;
    }),
    catchError((error: unknown) => {
      const status = toAppError(error).status;
      const notice = status === 404 || status === 403 ? 'unavailable' : 'unreachable';
      return of(router.createUrlTree(['/stores'], { queryParams: { notice } }));
    }),
  );
};
