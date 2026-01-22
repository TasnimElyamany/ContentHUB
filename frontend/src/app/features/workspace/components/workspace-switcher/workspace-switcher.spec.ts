import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceSwitcher } from './workspace-switcher';

describe('WorkspaceSwitcher', () => {
  let component: WorkspaceSwitcher;
  let fixture: ComponentFixture<WorkspaceSwitcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceSwitcher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceSwitcher);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
