import { CanActivateFn } from '@angular/router';

export const workspaceGuard: CanActivateFn = (route, state) => {
  return true;
};
