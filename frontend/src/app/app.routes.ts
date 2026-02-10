import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
{
  path: '',
  loadChildren: () => import('./features/landing/landing-module').then( m =>m.LandingModule),
},
{
  path: 'auth',
  loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
},
{
  path: 'dashboard',
  loadChildren: () => import('./features/dashboard/dashboard-module').then(m => m.DashboardModule),
  canActivate: [authGuard]
},
{
  path: 'editor/:id',
  loadChildren: () => import('./features/editor/editor-module').then(m => m.EditorModule),
  // canActivate: [authGuard]
},
{
  path: 'workspace',
  loadChildren: () => import('./features/workspace/workspace-module').then(m => m.WorkspaceModule),
  canActivate: [authGuard]
},
{
  path: 'analytics',
  loadChildren: () => import('./features/analytics/analytics-module').then(m => m.AnalyticsModule),
   canActivate: [authGuard]
},
{
  path: '**',
  redirectTo: ''
}
];
