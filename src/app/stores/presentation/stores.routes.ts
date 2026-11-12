import type { Routes } from '@angular/router';

/** `/stores`: store directory, switcher and onboarding. */
export const StoreDirectoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/store-directory/store-directory').then((m) => m.StoreDirectoryView),
  },
];

/** `/stores/:storeId/setup/...`: store configuration owned by the stores context. */
export const StoreSetupRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'areas' },
  {
    path: 'areas',
    loadComponent: () => import('./views/store-hierarchy/store-hierarchy').then((m) => m.StoreHierarchyView),
  },
  {
    path: 'areas/:areaId/equipment/:equipmentId',
    loadComponent: () => import('./views/equipment-setup/equipment-setup').then((m) => m.EquipmentSetupView),
  },
  {
    path: 'layout',
    loadComponent: () => import('./views/floor-plan/floor-plan').then((m) => m.FloorPlanView),
  },
  {
    path: 'shifts',
    loadComponent: () => import('./views/shift-roster/shift-roster').then((m) => m.ShiftRosterView),
  },
];
