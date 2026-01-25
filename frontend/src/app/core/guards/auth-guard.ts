import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import {  Router , CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated) {
    return true;
  }
  router.navigate(['/auth/login'], {
  queryParams: { returnUrl: state.url }
  });
  return false;
};
