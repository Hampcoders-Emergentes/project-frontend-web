import type { Routes } from '@angular/router';

/** `/stores/:storeId/compliance/...` (US30-US34, US40). */
export const ComplianceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./views/compliance-shell').then((m) => m.ComplianceShellView),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'checklist' },
      { path: 'checklist', loadComponent: () => import('./views/checklist/checklist').then((m) => m.ComplianceChecklistView) },
      { path: 'certificates', loadComponent: () => import('./views/certificates/certificates').then((m) => m.CertificatesView) },
      { path: 'score', loadComponent: () => import('./views/score').then((m) => m.ComplianceScoreView) },
      { path: 'signature', loadComponent: () => import('./views/signature').then((m) => m.SignatureView) },
      { path: 'reports', loadComponent: () => import('./views/ohs-reports').then((m) => m.OhsReportsView) },
    ],
  },
];
