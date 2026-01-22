import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiPanel } from './ai-panel';

describe('AiPanel', () => {
  let component: AiPanel;
  let fixture: ComponentFixture<AiPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
