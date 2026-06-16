import { Routes } from '@angular/router';
import { authGuard } from './features/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/auth/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'requests',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/requests-list/requests-list.component').then(m => m.RequestsListComponent),
  },
  {
    path: 'requests/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/request-form/request-form.component').then(m => m.RequestFormComponent),
  },
  {
    path: 'requests/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/request-detail/request-detail.component').then(m => m.RequestDetailComponent),
  },
  {
    path: 'my-requests',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/my-requests/my-requests.component').then(m => m.MyRequestsComponent),
  },
  {
    path: 'volunteer',
    canActivate: [authGuard],
    loadComponent: () => import('./features/volunteer/volunteer-dashboard/volunteer-dashboard.component').then(m => m.VolunteerDashboardComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/volunteer/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/users-table/users-table.component').then(m => m.UsersTableComponent),
  },
  {
    path: 'admin/requests',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/requests-table/requests-table.component').then(m => m.RequestsTableComponent),
  },
  { path: '**', redirectTo: 'home' },
];
