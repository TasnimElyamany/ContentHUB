import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { workspaceGuard } from './workspace-guard';

describe('workspaceGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => workspaceGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
