import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingContent } from './loading-content';

describe('LoadingContent', () => {
  let component: LoadingContent;
  let fixture: ComponentFixture<LoadingContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
