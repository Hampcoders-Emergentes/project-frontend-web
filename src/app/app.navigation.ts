import { computed, inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import type { NavigationItem } from '@shared/presentation/components/side-bar/side-bar';

/** An entry of the store-scoped navigation, relative to `/stores/:storeId`. */
interface StoreEntry {
  readonly segment: string;
  readonly labelKey: string;
  readonly icon: NavigationItem['icon'];
}

const ENTRIES: readonly StoreEntry[] = [
  { segment: 'dashboard', labelKey: 'shared.navigation.dashboard', icon: 'wave-saw-tool' },
  { segment: 'alerts', labelKey: 'shared.navigation.alerts', icon: 'bell-ringing' },
  { segment: 'monitoring/connectivity', labelKey: 'shared.navigation.connectivity', icon: 'wifi' },
  { segment: 'analytics', labelKey: 'shared.navigation.analytics', icon: 'chart-bar' },
  { segment: 'compliance', labelKey: 'shared.navigation.compliance', icon: 'shield-check' },
  { segment: 'setup/areas', labelKey: 'shared.navigation.equipment', icon: 'cpu' },
  { segment: 'setup/layout', labelKey: 'shared.navigation.layout', icon: 'buildings' },
  { segment: 'setup/shifts', labelKey: 'shared.navigation.shifts', icon: 'user' },
  { segment: 'notifications', labelKey: 'shared.navigation.notifications', icon: 'send' },
  { segment: 'audit', labelKey: 'shared.navigation.audit', icon: 'clipboard-list' },
];

const STORE_URL = /^\/stores\/([^/?#]+)/;

/**
 * `PRIMARY_NAVIGATION` factory of the composition root: builds the store-scoped entries from the
 * store id of the current URL (never from storage), plus the store list.
 */
export function createPrimaryNavigation(): Signal<readonly NavigationItem[]> {
  const router = inject(Router);
  const url = toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => router.url),
      startWith(router.url),
    ),
    { initialValue: router.url },
  );
  return computed(() => {
    const match = STORE_URL.exec(url());
    const stores: NavigationItem = {
      path: '/stores',
      labelKey: 'shared.navigation.stores',
      icon: 'building-store',
      exact: true,
    };
    if (!match?.[1]) {
      return [stores];
    }
    const base = `/stores/${match[1]}`;
    return [...ENTRIES.map((entry) => ({ path: `${base}/${entry.segment}`, labelKey: entry.labelKey, icon: entry.icon })), stores];
  });
}
