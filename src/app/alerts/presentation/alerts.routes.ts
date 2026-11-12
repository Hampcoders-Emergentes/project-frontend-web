import type { Routes } from '@angular/router';

/** `/stores/:storeId/alerts`. */
export const AlertsRoutes: Routes = [
  { path: '', loadComponent: () => import('./views/alert-center/alert-center').then((m) => m.AlertCenterView) },
];
