import type { Routes } from '@angular/router';

/** `/stores/:storeId/analytics/...` (US24-US29). */
export const AnalyticsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views/analytics-shell').then((m) => m.AnalyticsShellView),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'consumption' },
      { path: 'consumption', loadComponent: () => import('./views/consumption').then((m) => m.ConsumptionView) },
      { path: 'comparison', loadComponent: () => import('./views/comparison').then((m) => m.ComparisonView) },
      { path: 'off-hours', loadComponent: () => import('./views/off-hours').then((m) => m.OffHoursView) },
      { path: 'costs', loadComponent: () => import('./views/costs').then((m) => m.CostsView) },
      { path: 'maintenance', loadComponent: () => import('./views/maintenance').then((m) => m.MaintenanceView) },
      { path: 'reports', loadComponent: () => import('./views/energy-reports').then((m) => m.EnergyReportsView) },
      { path: 'opening-hours', loadComponent: () => import('./views/opening-hours').then((m) => m.OpeningHoursView) },
    ],
  },
];
