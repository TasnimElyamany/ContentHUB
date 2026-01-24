import { CanActivateFn , Router } from '@angular/router';
import { inject } from '@angular/core';
import { WorkspaceService } from '../../features/workspace/services/workspace';
import { Auth } from '../services/auth';
import { map , catchError, of} from 'rxjs';

export const workspaceGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const workspaceService = inject(WorkspaceService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    router.navigate(['/auth/login']);
    return false;
  }

  const workspaceId = route.paramMap.get('id') ||
                      route.paramMap.get('workspaceId') ||
                      route.paramMap.get('workspace_id');

  if(!workspaceId) {
    console.log('no workingspace id found , allowing access');
    return true;
  }

  console.log('Checking workspace access for the ID:', workspaceId);

  if (workspaceService.hasAccess(workspaceId)) {
    console.log('workspace access granted via cache');
    return true;
  }

  return workspaceService.getWorkspace(workspaceId).pipe(
    map(() => true),
    catchError((error) => {
      console.error('Workspace access denied:', error);
      router.navigate(['/dashboard']);
      return of(false);
    })
  );

};
