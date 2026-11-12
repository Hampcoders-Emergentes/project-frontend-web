import type { Routes } from '@angular/router';
import { createPrimaryNavigation } from './app.navigation';
import { authenticatedGuard } from '@iam/presentation/guards/session-guards';
import { IamPublicRoutes } from '@iam/presentation/iam.routes';
import { createSignedInAccount, createSignOutAction } from '@iam/presentation/session-shell';
import { storeAccessGuard } from '@stores/presentation/guards/store-access.guard';
import { HEADER_ACTIONS_OUTLET } from '@shared/presentation/components/private-layout/header-actions-outlet';
import { PRIMARY_NAVIGATION } from '@shared/presentation/components/private-layout/primary-navigation';
import { SIGN_OUT_ACTION } from '@shared/presentation/components/private-layout/sign-out-action';
import { SIGNED_IN_ACCOUNT } from '@shared/presentation/components/private-layout/signed-in-account';

/**
 * Composition root of the routes. Public routes: sign-in, forgot-password, reset-password. Everything
 * else matches only for a restored, `Active` session. Store-scoped features live under
 * `/stores/:storeId/...`, guarded by store ownership (a `404` sends the user back to the store list).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'stores' },
  ...IamPublicRoutes,
  {
    path: '',
    canMatch: [authenticatedGuard],
    loadComponent: () =>
      import('@shared/presentation/components/private-layout/private-layout').then((m) => m.PrivateLayout),
    providers: [
      { provide: SIGN_OUT_ACTION, useFactory: createSignOutAction },
      { provide: SIGNED_IN_ACCOUNT, useFactory: createSignedInAccount },
      { provide: PRIMARY_NAVIGATION, useFactory: createPrimaryNavigation },
    ],
    children: [
      {
        path: '',
        outlet: HEADER_ACTIONS_OUTLET,
        loadComponent: () =>
          import('@stores/presentation/components/store-switcher/store-switcher').then((m) => m.StoreSwitcher),
      },
      {
        path: 'stores',
        pathMatch: 'full',
        loadChildren: () => import('@stores/presentation/stores.routes').then((m) => m.StoreDirectoryRoutes),
      },
      {
        path: 'stores/:storeId',
        canActivate: [storeAccessGuard],
        runGuardsAndResolvers: 'paramsChange',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadChildren: () =>
              import('@monitoring/presentation/monitoring.routes').then((m) => m.DashboardRoutes),
          },
          {
            path: 'monitoring',
            loadChildren: () =>
              import('@monitoring/presentation/monitoring.routes').then((m) => m.MonitoringRoutes),
          },
          {
            path: 'setup',
            loadChildren: () => import('@stores/presentation/stores.routes').then((m) => m.StoreSetupRoutes),
          },
          {
            path: 'alerts',
            loadChildren: () => import('@alerts/presentation/alerts.routes').then((m) => m.AlertsRoutes),
          },
          {
            path: 'analytics',
            loadChildren: () =>
              import('@analytics/presentation/analytics.routes').then((m) => m.AnalyticsRoutes),
          },
          {
            path: 'compliance',
            loadChildren: () =>
              import('@compliance/presentation/compliance.routes').then((m) => m.ComplianceRoutes),
          },
          {
            path: 'notifications',
            loadChildren: () =>
              import('@notifications/presentation/notifications.routes').then((m) => m.NotificationsRoutes),
          },
          {
            path: 'audit',
            loadChildren: () => import('@audit/presentation/audit.routes').then((m) => m.AuditRoutes),
          },
        ],
      },
      {
        path: 'settings',
        loadComponent: () => import('@shared/presentation/views/settings/settings').then((m) => m.Settings),
        loadChildren: () => import('@iam/presentation/iam.routes').then((m) => m.IamAccountRoutes),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('@shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound),
  },
];
