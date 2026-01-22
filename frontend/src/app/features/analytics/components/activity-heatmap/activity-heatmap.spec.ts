import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityHeatmap } from './activity-heatmap';

describe('ActivityHeatmap', () => {
  let component: ActivityHeatmap;
  let fixture: ComponentFixture<ActivityHeatmap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityHeatmap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityHeatmap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
