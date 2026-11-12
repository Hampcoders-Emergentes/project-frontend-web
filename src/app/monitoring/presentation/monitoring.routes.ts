import type { Routes } from '@angular/router';

/** `/stores/:storeId/dashboard`. */
export const DashboardRoutes: Routes = [
  { path: '', loadComponent: () => import('./views/store-dashboard/store-dashboard').then((m) => m.StoreDashboardView) },
];

/** `/stores/:storeId/monitoring/...`. */
export const MonitoringRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'connectivity' },
  {
    path: 'connectivity',
    loadComponent: () => import('./views/sensor-connectivity/sensor-connectivity').then((m) => m.SensorConnectivityView),
  },
  {
    path: 'areas/:areaId/equipment/:equipmentId',
    loadComponent: () => import('./views/equipment-monitoring/equipment-monitoring').then((m) => m.EquipmentMonitoringView),
  },
];
