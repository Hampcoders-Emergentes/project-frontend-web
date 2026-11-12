import type { Routes } from '@angular/router';

/** `/stores/:storeId/notifications` (US36). */
export const NotificationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/notification-preferences/notification-preferences').then((m) => m.NotificationPreferencesView),
  },
];
