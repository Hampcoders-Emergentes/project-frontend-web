import { effect, untracked } from '@angular/core';

/**
 * Runs `action` whenever the tracked `source` (typically route-param inputs such as `storeId`) changes.
 * Only `source` is tracked: signals read inside `action` (store state, form state) never re-trigger it.
 * Call it in an injection context.
 * @param source - Reads the tracked inputs.
 * @param action - The side effect (for example a store load).
 */
export function whenChanged<T>(source: () => T, action: (value: T) => void): void {
  effect(() => {
    const value = source();
    untracked(() => action(value));
  });
}
