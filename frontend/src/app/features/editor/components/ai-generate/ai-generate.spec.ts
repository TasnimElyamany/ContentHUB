import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiGenerate } from './ai-generate';

describe('AiGenerate', () => {
  let component: AiGenerate;
  let fixture: ComponentFixture<AiGenerate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiGenerate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiGenerate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
