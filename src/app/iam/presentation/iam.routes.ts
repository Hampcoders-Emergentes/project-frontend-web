import type { Routes } from '@angular/router';
import { anonymousOnlyGuard } from '@iam/presentation/guards/session-guards';

/** Public IAM routes, mounted at the application root. */
export const IamPublicRoutes: Routes = [
  {
    path: 'sign-in',
    title: 'ElectroLink',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () => import('./views/sign-in/sign-in').then((m) => m.SignInView),
  },
  {
    path: 'sign-up',
    title: 'ElectroLink',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () => import('./views/sign-up/sign-up').then((m) => m.SignUpView),
  },
  {
    path: 'forgot-password',
    title: 'ElectroLink',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./views/forgot-password/forgot-password').then((m) => m.ForgotPasswordView),
  },
  {
    // Allowed with or without a session: a successful reset ends every session anyway.
    path: 'reset-password',
    title: 'ElectroLink',
    loadComponent: () =>
      import('./views/reset-password/reset-password').then((m) => m.ResetPasswordView),
  },
];

/** Signed-in account routes (rendered inside the settings view). */
export const IamAccountRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/change-password/change-password').then((m) => m.ChangePasswordView),
  },
];
