import { InjectionToken, type Signal } from '@angular/core';
import type { NavigationGroup } from '@shared/presentation/components/side-bar/side-bar';

/**
 * The grouped entries of the primary navigation of the private shell. Store-scoped routes live under
 * `/stores/:storeId/...`, which the shell cannot know, so the composition root provides the groups
 * (built from the store id of the current URL). An empty list means no workspace is open: the shell
 * then renders its launcher mode, a top bar without the sidebar.
 */
export const PRIMARY_NAVIGATION = new InjectionToken<Signal<readonly NavigationGroup[]>>(
  'PRIMARY_NAVIGATION',
);
