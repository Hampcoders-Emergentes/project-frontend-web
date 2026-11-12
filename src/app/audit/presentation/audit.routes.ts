import type { Routes } from '@angular/router';

/** `/stores/:storeId/audit` (US41). */
export const AuditRoutes: Routes = [
  { path: '', loadComponent: () => import('./views/audit-log/audit-log').then((m) => m.AuditLogView) },
];
