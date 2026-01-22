import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentsSidebar } from './comments-sidebar';

describe('CommentsSidebar', () => {
  let component: CommentsSidebar;
  let fixture: ComponentFixture<CommentsSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentsSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentsSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
