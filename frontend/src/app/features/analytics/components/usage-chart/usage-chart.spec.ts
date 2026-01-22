import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageChart } from './usage-chart';

describe('UsageChart', () => {
  let component: UsageChart;
  let fixture: ComponentFixture<UsageChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsageChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
