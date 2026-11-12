import { effect, inject, type Signal } from '@angular/core';
import { Router } from '@angular/router';
import type { AppError } from '@shared/application/app-error';

/**
 * On a store-scoped route, a `404` means the resource does not exist or is not owned by the caller.
 * This sends the user back to the store list without saying which, as soon as any of the given error
 * signals holds a `404`. Call it in a view's injection context.
 * @param errors - Error signals of the view's data sections.
 */
export function redirectOnStoreNotFound(...errors: readonly Signal<AppError | null>[]): void {
  const router = inject(Router);
  effect(() => {
    if (errors.some((error) => error()?.status === 404)) {
      void router.navigate(['/stores'], { queryParams: { notice: 'unavailable' } });
    }
  });
}
