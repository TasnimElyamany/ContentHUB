import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
{
  path: '',
  loadComponent: () => import('./features/landing/components/landing/landing').then( m =>m.Landing),
},
{
  path: 'auth',
  children: [
    {
      path: 'login',
      loadComponent: () => import('./features/auth/components/login/login').then(m => m.Login),
    },
    {
      path: 'register',
      loadComponent: () => import('./features/auth/components/register/register').then(m => m.Register)
    }
  ]
},
{
  path: 'dashboard',
  loadComponent: () => import('./features/dashboard/components/dashboard/dashboard').then(m => m.Dashboard),
  canActivate: [authGuard]
},
{
  path: 'editor',
  loadComponent: () => import('./features/editor/components/editor/editor').then(m => m.Editor),
  canActivate: [authGuard]
},
{
  path: '**',
  redirectTo: ''
}
];
