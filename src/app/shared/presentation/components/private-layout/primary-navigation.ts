import { InjectionToken, type Signal } from '@angular/core';
import type { NavigationItem } from '@shared/presentation/components/side-bar/side-bar';

/**
 * The entries of the primary navigation of the private shell. Store-scoped routes live under
 * `/stores/:storeId/...`, which the shell cannot know, so the composition root provides the entries
 * (typically built from the active store id). An empty list renders no entries, for example while no
 * store is selected.
 */
export const PRIMARY_NAVIGATION = new InjectionToken<Signal<readonly NavigationItem[]>>(
  'PRIMARY_NAVIGATION',
);
