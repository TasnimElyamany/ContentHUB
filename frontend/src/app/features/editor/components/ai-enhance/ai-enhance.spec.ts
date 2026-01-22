import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiEnhance } from './ai-enhance';

describe('AiEnhance', () => {
  let component: AiEnhance;
  let fixture: ComponentFixture<AiEnhance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiEnhance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiEnhance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
