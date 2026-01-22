import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceSettings } from './workspace-settings';

describe('WorkspaceSettings', () => {
  let component: WorkspaceSettings;
  let fixture: ComponentFixture<WorkspaceSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
